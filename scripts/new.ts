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

const flows = () =>
  readdirSync(p("docs/flows"))
    .map((f) => f.match(/^([A-Z])-(.+)\.md$/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => ({letter: m[1], file: `docs/flows/${m[0]}`, slug: m[2]}));
const visuals = () =>
  readdirSync(p("docs/visuals"))
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .map((f) => f.replace(/\.md$/, ""));

const id = process.argv.slice(2).find((a, i, all) => !a.startsWith("-") && !/^--(flow|visual)$/.test(all[i - 1] ?? ""));
const flowArg = flag("flow");
const list = flows();
const usage = `usage: bun run new <id> --flow <${list.map((f) => f.letter).join("|")}> [--visual ${visuals().join(",")}]`;

if (!id) die(usage);
if (!ID_RE.test(id!)) die(`id "${id}" must be lowercase kebab-case (e.g. why-sky-blue): it becomes the folder and every file prefix (§13)`);
if (id!.startsWith("_")) die("ids starting with _ are reserved");
if (typeof flowArg !== "string") die(`--flow is required (§2: choose the shape before writing). ${list.map((f) => `${f.letter} ${f.slug}`).join(", ")}`);
const flow = list.find((f) => f.letter === (flowArg as string).toUpperCase()) ?? die(`no flow "${flowArg}" in docs/flows/. ${usage}`);
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

const narration: Narration = {
  ...defaults,
  id: id!,
  flow: flow.letter,
  visual,
  scenes: sceneIds.map((s) => ({id: s, lines: [{text: `TODO write the ${s} line.`, fact: ""}]})),
};
await Bun.write(join(dir, "narration.json"), `${JSON.stringify(narration, null, 2)}\n`);
await writeVoice(join(dir, "voice.json"), estimateVoice(narration));

console.log(`+ src/videos/${id}/  flow ${flow.letter} (${flow.slug}), scenes: ${sceneIds.join(", ")}`);
if (!visual.length) console.log('  ! "visual" is empty: decide the visual types at the brief (docs/visuals/) and fill it in');
console.log(`  voice.json is an ESTIMATE (0.33 s/word). Next: facts, narration, \`bun run lint ${id}\`, then \`bun run tts ${id}\`.`);
console.log(`  Studio: bun run dev ${id}`);
