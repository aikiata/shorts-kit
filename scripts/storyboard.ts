/**
 * `bun run storyboard <id> [--init] [--force] [--sync]`: the shot list, between the voice and the scenes.
 *
 *   --init    write src/videos/<id>/storyboard.json with one planned shot per narration line,
 *             to be filled in (camera, onScreen, text, transition, sfx). Refuses to overwrite
 *             an existing storyboard unless --force.
 *   --sync    re-pin shots to their lines after the script, the voice or the cut changed:
 *             a moved line carries its shot, a changed line sends its shot back to
 *             "planned", a new line gets a TODO shot. Run it after every tts / cut.
 *   (none)    print every shot with its time from voice.json and the problems to fix.
 *
 * Plan it after `bun run tts` (shots follow the real voice), get it approved
 * (status "approved"), then build the scenes and mark shots "built".
 * Schema and rules: docs/storyboard.md.
 */
import {readdirSync, readFileSync, existsSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {flatLines, loadNarration} from "./lib/narration";
import {die, isVoiceless, p, videoArg, videoDir} from "./lib/paths";
import {checkPromoStoryboard, checkStoryboard, formatStoryboard, loadStoryboard, shotCardIds, storyboardPath, syncStoryboard, timePromoShots, timeShots, type Shot, type Storyboard, type VoiceLike} from "./lib/storyboard";
import type {Promo} from "../src/shared/promo";

const id = videoArg("bun run storyboard <id> [--init] [--force] [--sync]");
const args = process.argv.slice(2);
const visualIdsAll = () => readdirSync(p("docs/visuals")).filter((f) => f.endsWith(".md") && f !== "README.md").map((f) => f.replace(/\.md$/, ""));
const cardIds = shotCardIds();
const printShot = (t: Shot & {start: number | null; end: number | null}, where: string) => {
  const s = (x: number | null) => (x === null ? "  ?  " : x.toFixed(1).padStart(5));
  console.log(`${t.id}  ${s(t.start)}–${s(t.end)} s  [${t.status}]  ${t.transition ?? ""}${t.card ? `  card: ${t.card}` : ""}`);
  console.log(`      ${where}`);
  console.log(`      camera ${t.size ? `[${t.size}${t.angle ? ` ${t.angle}` : ""}] ` : ""}${t.camera}`);
  console.log(`      screen ${t.onScreen}${t.text ? `  | text: ${t.text}` : ""}${t.sfx ? `  | sfx: ${t.sfx}` : ""}`);
};

// A promo with no voice: shots are pinned to a promo.json scene and a beat (or seconds) inside it (docs/storyboard.md).
if (isVoiceless(id)) {
  const promo = JSON.parse(readFileSync(join(videoDir(id), "promo.json"), "utf8")) as Promo;
  const sceneIds = promo.scenes.map((s) => s.id);
  const todoShot = (sid: string, scene: string): Shot => ({id: sid, line: -1, scene, beat: promo.bpm ? 0 : undefined, seconds: promo.bpm ? undefined : 0, size: "TODO", card: undefined, camera: "TODO", onScreen: "TODO", text: null, transition: "cut", sfx: null, status: "planned"});
  const clean = (s: Shot): Shot => {
    const {line: _line, ...rest} = s;
    return Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)) as Shot;
  };
  if (args.includes("--init")) {
    if (existsSync(storyboardPath(id)) && !args.includes("--force")) die(`src/videos/${id}/storyboard.json exists (use --force to replace it)`);
    const sb: Storyboard = {shots: sceneIds.map((sc, i) => clean(todoShot(`s${String(i + 1).padStart(2, "0")}`, sc)))};
    writeFileSync(storyboardPath(id), formatStoryboard(sb));
    console.log(`+ src/videos/${id}/storyboard.json  ${sb.shots.length} planned shots, one per scene. Split a scene into more shots with "beat" (or "seconds"); fill in size, camera and onScreen; name a card from docs/shots/ where one fits.`);
    process.exit(0);
  }
  const {value, error} = loadStoryboard(id);
  if (error) die(`storyboard.json is not valid JSON: ${error}`);
  if (!value) die(`no storyboard yet: bun run storyboard ${id} --init`);
  let sb = value!;
  if (args.includes("--sync")) {
    // scenes renamed or removed in promo.json leave shots without a scene; new scenes get a TODO shot
    const lost = sb.shots.filter((s) => !s.scene || !sceneIds.includes(s.scene));
    const taken = new Set(sb.shots.map((s) => s.id));
    let n = 1;
    const nextId = () => { while (taken.has(`s${String(n).padStart(2, "0")}`)) n++; const x = `s${String(n).padStart(2, "0")}`; taken.add(x); return x; };
    const added = sceneIds.filter((sc) => !sb.shots.some((s) => s.scene === sc)).map((sc) => clean(todoShot(nextId(), sc)));
    const keep = sb.shots.filter((s) => !lost.includes(s));
    const order = (s: Shot) => sceneIds.indexOf(s.scene!) * 1e6 + (s.beat ?? s.seconds ?? 0);
    sb = {...sb, shots: [...keep, ...added].sort((a, b) => order(a) - order(b)), ...(lost.length ? {removed: [...(sb.removed ?? []), ...lost]} : {})};
    if (!lost.length && !added.length) console.log("= every shot sits in a scene of promo.json");
    else {
      writeFileSync(storyboardPath(id), formatStoryboard(sb));
      for (const s of lost) console.log(`! ${s.id} gone: scene "${s.scene}" is not in promo.json any more (kept under "removed")`);
      for (const s of added) console.log(`+ ${s.id} added: new scene "${s.scene}"`);
    }
    console.log("");
  }
  for (const t of timePromoShots(sb, promo)) printShot(t, `scene  ${t.scene}${t.beat !== undefined ? ` + ${t.beat} beats` : t.seconds ? ` + ${t.seconds} s` : ""}`);
  const issues = checkPromoStoryboard(sb, promo, visualIdsAll(), cardIds);
  const byStatus = Object.fromEntries(["planned", "approved", "built"].map((k) => [k, sb.shots.filter((x) => x.status === k).length]));
  console.log(`\n${sb.shots.length} shots: ${byStatus.planned} planned, ${byStatus.approved} approved, ${byStatus.built} built`);
  for (const i of issues) console.log(`${i.level === "error" ? "✖" : "!"} ${i.message}`);
  process.exit(issues.some((i) => i.level === "error") ? 1 : 0);
}
const narration = loadNarration(id);
const lines = flatLines(narration);
const voicePath = join(videoDir(id), "voice.json");
const voice: VoiceLike | null = existsSync(voicePath) ? JSON.parse(readFileSync(voicePath, "utf8")) : null;
const visualIds = visualIdsAll();
const defaultVisual = (narration as {visual?: string[]}).visual?.[0];

if (args.includes("--init")) {
  if (existsSync(storyboardPath(id)) && !args.includes("--force")) die(`src/videos/${id}/storyboard.json exists (use --force to replace it)`);
  if (!voice || voice.estimated) console.warn("! voice.json is an estimate: plan against the real voice after `bun run tts`.");
  const sb: Storyboard = {
    shots: lines.map((l, i) => ({
      id: `s${String(i + 1).padStart(2, "0")}`,
      line: l.global,
      lineText: l.display,
      anchor: null,
      size: "TODO",
      camera: "TODO",
      onScreen: "TODO",
      text: null,
      ...(defaultVisual ? {visual: defaultVisual} : {}),
      transition: i === 0 ? "cut" : "continuous",
      sfx: null,
      status: "planned",
    })),
  };
  writeFileSync(storyboardPath(id), formatStoryboard(sb));
  console.log(`+ src/videos/${id}/storyboard.json  ${sb.shots.length} planned shots, one per line. Fill in camera and onScreen, then review it in \`bun run preview\`.`);
  process.exit(0);
}

const {value: loaded, error} = loadStoryboard(id);
if (error) die(`storyboard.json is not valid JSON: ${error}`);
if (!loaded) die(`no storyboard yet: bun run storyboard ${id} --init`);
let sb = loaded;
const shown = lines.map((l) => l.display);

if (args.includes("--sync")) {
  const r = syncStoryboard(sb!, shown);
  if (!r.changes.length) console.log("= every shot still matches its line");
  else {
    writeFileSync(storyboardPath(id), formatStoryboard(r.sb));
    for (const c of r.changes) console.log(`${c.kind === "changed" || c.kind === "gone" ? "!" : "+"} ${c.shot} ${c.kind}: ${c.detail}`);
    console.log(`+ src/videos/${id}/storyboard.json  ${r.changes.length} change${r.changes.length > 1 ? "s" : ""}`);
    if (r.changes.some((c) => c.kind === "changed" || c.kind === "added")) console.log("  Shots back at \"planned\" need a look and a new approval before their scenes change.");
    if (r.changes.some((c) => c.kind === "gone")) console.log("  A \"gone\" shot's line was removed: it is kept under \"removed\" in storyboard.json; delete its scene code if it has any.");
  }
  sb = r.sb;
  console.log("");
}

const timed = timeShots(sb!, voice, (narration as {outroHold?: number}).outroHold ?? 0);
for (const t of timed) printShot(t, `voice  ${lines[t.line]?.display ?? "(no such line)"}${t.anchor ? `  (from "${t.anchor}")` : ""}`);
const issues = checkStoryboard(sb!, shown, voice, visualIds, cardIds);
const byStatus = Object.fromEntries(["planned", "approved", "built"].map((k) => [k, sb!.shots.filter((x) => x.status === k).length]));
console.log(`\n${sb!.shots.length} shots: ${byStatus.planned} planned, ${byStatus.approved} approved, ${byStatus.built} built`);
for (const i of issues) console.log(`${i.level === "error" ? "✖" : "!"} ${i.message}`);
process.exit(issues.some((i) => i.level === "error") ? 1 : 0);
