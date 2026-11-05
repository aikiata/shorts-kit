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
import {die, p, videoArg, videoDir} from "./lib/paths";
import {checkStoryboard, formatStoryboard, loadStoryboard, storyboardPath, syncStoryboard, timeShots, type Storyboard, type VoiceLike} from "./lib/storyboard";

const id = videoArg("bun run storyboard <id> [--init] [--force] [--sync]");
const args = process.argv.slice(2);
const narration = loadNarration(id);
const lines = flatLines(narration);
const voicePath = join(videoDir(id), "voice.json");
const voice: VoiceLike | null = existsSync(voicePath) ? JSON.parse(readFileSync(voicePath, "utf8")) : null;
const visualIds = readdirSync(p("docs/visuals")).filter((f) => f.endsWith(".md") && f !== "README.md").map((f) => f.replace(/\.md$/, ""));
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
const s = (x: number | null) => (x === null ? "  ?  " : x.toFixed(1).padStart(5));
for (const t of timed) {
  const line = lines[t.line]?.display ?? "(no such line)";
  console.log(`${t.id}  ${s(t.start)}–${s(t.end)} s  [${t.status}]  ${t.transition ?? ""}`);
  console.log(`      voice  ${line}${t.anchor ? `  (from "${t.anchor}")` : ""}`);
  console.log(`      camera ${t.camera}`);
  console.log(`      screen ${t.onScreen}${t.text ? `  | text: ${t.text}` : ""}${t.sfx ? `  | sfx: ${t.sfx}` : ""}`);
}
const issues = checkStoryboard(sb!, shown, voice, visualIds);
const byStatus = Object.fromEntries(["planned", "approved", "built"].map((k) => [k, sb!.shots.filter((x) => x.status === k).length]));
console.log(`\n${sb!.shots.length} shots: ${byStatus.planned} planned, ${byStatus.approved} approved, ${byStatus.built} built`);
for (const i of issues) console.log(`${i.level === "error" ? "✖" : "!"} ${i.message}`);
process.exit(issues.some((i) => i.level === "error") ? 1 : 0);
