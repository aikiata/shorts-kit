/**
 * `bun run from <file|dir>... [--id <id>] [--lang auto|vi|en] [--flow N] [--visual <type>] [--prompt "names"] [--subs captions.srt] [--crop-x 0.5]`
 *
 * "Here is my video, edit it." One command from dropped files to a first cut (§5j):
 *
 * 1. picks the mode: every input has a picture → `talking-head` (the take is on
 *    screen); audio only → voice only (`--visual`, default text-as-image);
 * 2. scaffolds src/videos/<id>/ (id from the first file name unless --id);
 * 3. ingests every file as one clip each, in play order (Whisper, proposed cuts);
 * 4. applies the proposed cut and writes the storyboard stub;
 * 5. prints what only the person can answer, and what the agent does next.
 *
 * It stops there on purpose. What was said where Whisper was unsure, and the
 * approval of the result, belong to the person who spoke (docs/visuals/talking-head.md).
 */
import {existsSync} from "node:fs";
import {basename, extname, join, resolve} from "node:path";
import {expandInputs, footageCache, loadCuts, loadTranscript, removedSet} from "./lib/footage";
import {die, flag, ID_RE, p, videoDir} from "./lib/paths";
import {ffprobeJson} from "./lib/proc";
import {loadThresholds} from "./lib/thresholds";

const VALUE_FLAGS = new Set(["--id", "--lang", "--flow", "--visual", "--prompt", "--crop-x", "--subs"]);
const paths = process.argv.slice(2).filter((a, i, all) => !a.startsWith("-") && !VALUE_FLAGS.has(all[i - 1] ?? ""));
if (!paths.length) die('usage: bun run from <file|dir>... [--id <id>] [--lang auto|vi|en] [--flow N] [--visual <type>] [--prompt "names"]');
for (const x of paths) if (!existsSync(resolve(x))) die(`no file or folder ${resolve(x)}`);

const inputs = await expandInputs(paths, (f) => ffprobeJson(f) as Promise<{format: {tags?: Record<string, string>}}>);
if (!inputs.length) die("no media files found");

// ---------------------------------------------------------------- mode
const pictures = await Promise.all(
  inputs.map(async (x) => (await ffprobeJson(x.file)).streams.some((st) => st.codec_type === "video" && !st.disposition?.attached_pic)),
);
if (pictures.some(Boolean) && !pictures.every(Boolean)) {
  die(`mixed inputs: ${inputs.filter((_, i) => !pictures[i]).map((x) => basename(x.file)).join(", ")} have no picture. Give only filmed clips (talking-head) or only recordings (voice only).`);
}
const filmed = pictures[0];
const visualArg = flag("visual");
const visual = typeof visualArg === "string" ? visualArg : filmed ? "talking-head" : "text-as-image";
if (filmed && !visual.split(",").includes("talking-head")) console.log(`  the inputs are filmed but --visual has no talking-head: only their audio will be used`);

// ---------------------------------------------------------------- id
const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "video";
const idArg = flag("id");
let id = typeof idArg === "string" ? idArg : slug(basename(inputs[0].file, extname(inputs[0].file)));
if (!ID_RE.test(id)) die(`id "${id}" must be lowercase kebab-case`);
if (typeof idArg !== "string") {
  const base = id;
  for (let k = 2; existsSync(videoDir(id)); k++) id = `${base}-${k}`;
} else if (existsSync(videoDir(id))) die(`src/videos/${id}/ already exists: pick another --id, or run \`bun run ingest ${id} <file>\` to re-ingest it`);

// ---------------------------------------------------------------- run the steps
const step = async (title: string, args: string[]) => {
  console.log(`\n── ${title}`);
  const proc = Bun.spawn(["bun", ...args], {cwd: p(""), stdout: "inherit", stderr: "inherit", stdin: "ignore"});
  if ((await proc.exited) !== 0) die(`${title} failed: bun ${args.join(" ")}`);
};
const flowArg = flag("flow");
const pass = (name: string) => {
  const v = flag(name);
  return typeof v === "string" ? [`--${name}`, v] : [];
};

console.log(`from: ${inputs.length} file${inputs.length > 1 ? "s" : ""} → src/videos/${id}/ (${filmed && visual.includes("talking-head") ? "talking-head: the take on screen" : "voice only"})`);
await step("scaffold", ["scripts/new.ts", id, "--flow", typeof flowArg === "string" ? flowArg : "N", "--visual", visual, "--voice", "recorded"]);
await step("ingest", ["scripts/ingest.ts", id, ...inputs.map((x) => x.file), "--lang", String(flag("lang") ?? "auto"), ...pass("prompt"), ...pass("crop-x"), ...pass("subs")]);
await step("cut", ["scripts/cut.ts", id]);
await step("storyboard", ["scripts/storyboard.ts", id, "--init"]);

// ---------------------------------------------------------------- what only the speaker can answer
const T = loadThresholds();
const t = loadTranscript(id)!;
const cuts = loadCuts(id)!;
const removed = removedSet(cuts);
const kept = t.words.filter((w) => !removed.has(w.i));
const doubts = kept.filter((w) => w.suspect || w.p < T.footageLowConfidence || /\d/.test(w.text));
// context from the words that stay in the video, so the speaker hears the sentence as it will play
const ctx = (i: number) => {
  const k = kept.findIndex((w) => w.i === i);
  return kept
    .slice(Math.max(0, k - 4), k + 5)
    .map((w) => (w.i === i ? `[${w.text}]` : w.text))
    .join(" ");
};

console.log(`\n── ready for review: src/videos/${id}/`);
if (doubts.length) {
  console.log(`\nAsk the speaker what was actually said (${doubts.length} place${doubts.length > 1 ? "s" : ""}); fix with "spelling", or cut as a stretch:`);
  for (const w of doubts) {
    const why = w.suspect ? `⟪words missing?⟫ ${w.start.toFixed(1)}–${w.end.toFixed(1)} s` : /\d/.test(w.text) ? "a number" : `${Math.round(w.p * 100)}% sure`;
    console.log(`  ${String(w.i).padStart(4)}  ${ctx(w.i)}   (${why})`);
  }
} else console.log("\nWhisper was sure of every kept word; still read the transcript back to the speaker.");
if (filmed && visual.includes("talking-head")) {
  const sheets = (t.source.clips?.length ?? 1) > 1 ? t.source.clips!.map((_, k) => join(footageCache(id), `clip-${String(k + 1).padStart(2, "0")}-sheet.jpg`)) : [join(footageCache(id), "clip-01-sheet.jpg")];
  console.log(`\nMeasure the face band on ${sheets.length > 1 ? "each contact sheet" : "the contact sheet"} (ruler every 100 px, red every 500) → narration.json "face"${sheets.length > 1 ? " (one per clip, in order)" : ""}:`);
  for (const s of sheets) console.log(`  ${s.replace(`${p("")}/`, "")}`);
}
console.log(`
Then (sk-pipeline, recorded voice):
  1. spelling fixes / stretches → bun run cut ${id}
  2. regroup lines into the flow's beats; a fact or "claim": false per line; voice.source in sources.json
  3. bun run storyboard ${id} --sync, fill the shots, effects from what was said
  4. scenes → stills → bun run render ${id} → cover → normalize → encode → hand-off
  bun run lint ${id} lists what is still open.`);
