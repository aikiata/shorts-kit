/**
 * `bun run new <id> --flow <letter> [--visual a,b]`
 *
 * Scaffolds src/videos/<id>/ from src/videos/_template/. narration.json keeps
 * the template's channel defaults (language, voice, pause, outroHold) and gets
 * this video's id, flow and the flow's beats as scenes. voice.json is an
 * estimate (0.33 s per word) so Studio works before TTS; lint rejects it.
 *
 * --flow is required on purpose: no default flow, so no flow by habit (§2).
 */
import {cpSync, existsSync, readdirSync, readFileSync} from "node:fs";
import {join} from "node:path";
import {estimateVoice, type Narration} from "./lib/narration";
import {die, flag, ID_RE, p, videoDir} from "./lib/paths";
import {writeVoice} from "./lib/narration";

/** Video.tsx for a filmed video: the footage is the background, its audio the voice. */
const FOOTAGE_VIDEO = `import React from "react";
import {FootageStage, type ClipStart, type FaceBands, type FootageJoin} from "../../shared/frame/FootageStage";
import {ShortsTemplate} from "../../shared/frame/ShortsTemplate";
import {DEFAULT_PALETTE} from "../../shared/theme";
import footage from "./footage.json";
import narration from "./narration.json";
import {scenes} from "./scenes";
import {FPS, OUTRO_HOLD, VOICE} from "./timing";

/**
 * A talking-head video (§5j): the filmed take (written by "bun run cut") under
 * this video's effect scenes. Effects stay off the face band in narration.json "face".
 */
export const Video: React.FC<{safe: boolean}> = ({safe}) => (
  <ShortsTemplate
    voice={VOICE}
    fps={FPS}
    outroHold={OUTRO_HOLD}
    scenes={scenes}
    palette={DEFAULT_PALETTE}
    safe={safe}
    background={<FootageStage src={footage.video} duration={footage.duration} joins={footage.joins as FootageJoin[]} face={(narration as {face?: FaceBands}).face} clips={(footage as {clips?: ClipStart[]}).clips} />}
  />
);
`;

const flows = () =>
  readdirSync(p("docs/flows"))
    .map((f) => f.match(/^([A-Z])-(.+)\.md$/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => ({letter: m[1], file: `docs/flows/${m[0]}`, slug: m[2]}));
const visuals = () =>
  readdirSync(p("docs/visuals"))
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .map((f) => f.replace(/\.md$/, ""));

const id = process.argv.slice(2).find((a, i, all) => !a.startsWith("-") && !/^--(flow|visual|voice|format|mode)$/.test(all[i - 1] ?? ""));
const flowArg = flag("flow");
const list = flows();
const usage = `usage: bun run new <id> --flow <${list.map((f) => f.letter).join("|")}> [--visual ${visuals().join(",")}] [--format portrait|landscape] [--mode short|promo] | <id> --voice none [--format ..] [--scenes a,b,c]`;

if (!id) die(usage);
if (!ID_RE.test(id!)) die(`id "${id}" must be lowercase kebab-case (e.g. why-sky-blue): it becomes the folder and every file prefix (§13)`);
if (id!.startsWith("_")) die("ids starting with _ are reserved");
const voiceless = flag("voice") === "none";
if (voiceless) {
  // A promo with no voice: promo.json is the clock (docs/promo/). No flow, narration or voice.json.
  const fmt = flag("format") ?? "landscape";
  if (fmt !== "portrait" && fmt !== "landscape") die(`--format must be portrait or landscape, got "${fmt}"`);
  if ((flag("mode") ?? "promo") !== "promo") die("--voice none is for --mode promo: a short is voice-led");
  const target = videoDir(id!);
  if (existsSync(target)) die(`src/videos/${id}/ already exists`);
  cpSync(p("src/videos/_template-promo"), target, {recursive: true});
  await Bun.write(join(target, "video.json"), `${JSON.stringify({format: fmt, mode: "promo"}, null, 2)}\n`);
  const sceneList = flag("scenes");
  if (typeof sceneList === "string") {
    const ids = sceneList.split(",").map((x) => x.trim()).filter(Boolean);
    const bad = ids.filter((x) => !/^[a-z][a-z0-9-]*$/.test(x));
    if (!ids.length || bad.length) die(`--scenes must be comma-separated kebab-case ids, got "${sceneList}"`);
    const promo = JSON.parse(readFileSync(join(target, "promo.json"), "utf8"));
    promo.scenes = ids.map((x) => ({id: x, beats: 8}));
    await Bun.write(join(target, "promo.json"), `${JSON.stringify(promo, null, 2)}\n`);
  }
  console.log(`+ src/videos/${id}/  ${fmt} promo, no voice: the clock is promo.json (scenes in seconds or beats, bpm, music).`);
  console.log(`  Next: edit promo.json, put the music under public/music/ (licence first), then \`bun run lint ${id}\`, \`bun run dev ${id}\`.`);
  process.exit(0);
}
if (typeof flowArg !== "string") die(`--flow is required (§2: choose the shape before writing). ${list.map((f) => `${f.letter} ${f.slug}`).join(", ")}`);
const flow = list.find((f) => f.letter === (flowArg as string).toUpperCase()) ?? die(`no flow "${flowArg}" in docs/flows/. ${usage}`);
const formatArg = flag("format") ?? "portrait";
const modeArg = flag("mode") ?? "short";
if (formatArg !== "portrait" && formatArg !== "landscape") die(`--format must be portrait or landscape, got "${formatArg}"`);
if (modeArg !== "short" && modeArg !== "promo") die(`--mode must be short or promo, got "${modeArg}"`);
const dir = videoDir(id!);
if (existsSync(dir)) die(`src/videos/${id}/ already exists`);

// The Beats line is "**Beats** (scene ids `bun run new` scaffolds): `hook, …, share` · …": the scene list is
// the first backtick span after the colon, not the first one on the line.
const beats = readFileSync(p(flow.file), "utf8").match(/^\*\*Beats\*\*[^\n]*?\):\s*`([^`]+)`/m)?.[1];
if (!beats) die(`${flow.file} has no **Beats** line to scaffold from`);
const sceneIds = beats!.split(",").map((s) => s.trim()).filter(Boolean);

const visualArg = flag("visual");
const visual = typeof visualArg === "string" ? visualArg.split(",").map((s) => s.trim()).filter(Boolean) : [];
const unknown = visual.filter((v) => !visuals().includes(v));
if (unknown.length) die(`unknown visual type(s): ${unknown.join(", ")}. Have: ${visuals().join(", ")}`);

const tpl = p("src/videos/_template");
const defaults = JSON.parse(readFileSync(join(tpl, "narration.json"), "utf8")) as Narration;
cpSync(tpl, dir, {recursive: true});

const filmed = visual.includes("talking-head");
// --voice recorded: a voice-only recording drives an ordinary video (no footage on screen)
const recorded = filmed || flag("voice") === "recorded";
const narration: Narration = {
  ...defaults,
  id: id!,
  flow: flow.letter,
  visual,
  // A filmed video's voice is the footage; lines come from `bun run cut` (§5j).
  ...(recorded ? {voice: {engine: "recorded", source: ""}} : {}),
  ...(filmed ? {face: {top: 0, bottom: 0}} : {}),
  scenes: sceneIds.map((s) => ({id: s, lines: [{text: `TODO write the ${s} line.`, fact: ""}]})),
};
await Bun.write(join(dir, "video.json"), `${JSON.stringify({format: formatArg, mode: modeArg}, null, 2)}\n`);
await Bun.write(join(dir, "narration.json"), `${JSON.stringify(narration, null, 2)}\n`);
if (filmed) {
  await Bun.write(join(dir, "footage.json"), `${JSON.stringify({transcript: "", cuts: "", video: "", audio: "", duration: 0, joins: []}, null, 2)}\n`);
  await Bun.write(join(dir, "Video.tsx"), FOOTAGE_VIDEO);
}
await writeVoice(join(dir, "voice.json"), estimateVoice(narration));

console.log(`+ src/videos/${id}/  ${formatArg} ${modeArg}, flow ${flow.letter} (${flow.slug}), scenes: ${sceneIds.join(", ")}`);
if (!visual.length) console.log('  ! "visual" is empty: decide the visual types at the brief (docs/visuals/) and fill it in');
if (recorded) console.log(`  recorded voice${filmed ? ", footage on screen" : ", voice only"} (§5j). Next: \`bun run ingest ${id} <file>\`, review cuts.json, \`bun run cut ${id}\`, then facts and \`bun run lint ${id}\`.`);
else console.log(`  voice.json is an ESTIMATE (0.33 s/word). Next: facts, narration, \`bun run lint ${id}\`, then \`bun run tts ${id}\`.`);
console.log(`  Studio: bun run dev ${id}`);
