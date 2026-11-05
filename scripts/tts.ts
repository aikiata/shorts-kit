/**
 * `bun run tts <id> [--force]`
 *
 * Reads src/videos/<id>/narration.json, synthesises the script with the engine
 * it names, enforces the declared pauses, and writes
 * public/audio/<id>/voice.mp3 (48 kHz) and src/videos/<id>/voice.json.
 *
 * Same script and settings as the last run → no engine call (`--force` re-reads).
 * Pause or spelling changes reuse the cached reading in .cache/tts/<id>/.
 */
import {existsSync, readdirSync, readFileSync, rmSync} from "node:fs";
import {join} from "node:path";
import type {Voice, VoiceLine, VoiceWord} from "../src/shared/timings";
import {ENGINES} from "./lib/engines";
import type {Segment} from "./lib/engines/types";
import {
  engineKey,
  flatLines,
  gapAfter,
  lineWords,
  loadNarration,
  scenesFromLines,
  voiceHash,
  writeVoice,
} from "./lib/narration";
import {audioDir, cacheDir, die, ensureDir, flag, p, videoArg, videoDir} from "./lib/paths";
import {decodePcm, must} from "./lib/proc";
import {loadThresholds} from "./lib/thresholds";

const RATE = 48000;
/** A cut point louder than this is inside a word: skip the cut, keep the natural gap (§4). */
const QUIET_DB = -35;
const WIDEN = 0.15;

const id = videoArg("bun run tts <id> [--force]");
const force = flag("force") !== undefined;
const n = loadNarration(id);
if (n.voice.engine === "recorded") die(`"${id}" uses a recorded voice: it comes from \`bun run ingest ${id} <file>\` and \`bun run cut ${id}\`, not TTS (§5j).`);
const engine = ENGINES[n.voice.engine] ?? die(`unknown voice.engine "${n.voice.engine}"; use one of: ${Object.keys(ENGINES).join(", ")}`);
const voiceName = n.voice.voice ?? engine.defaultVoice;
const tempo = n.voice.tempo ?? 1;
if (tempo < 0.5 || tempo > 2) die(`voice.tempo ${tempo} is outside 0.5–2`);

const hash = voiceHash(n);
const voicePath = join(videoDir(id), "voice.json");
const audioRel = `audio/${id}/voice.mp3`;
const audioOut = p("public", audioRel);
const prev = existsSync(voicePath) ? (JSON.parse(readFileSync(voicePath, "utf8")) as Voice) : null;

console.log(`tts ${id}: engine ${engine.name}, voice ${voiceName || "(none)"}, tempo ${tempo}`);
// §4 default engine per language: a hint only, the engine in narration.json wins
const DEFAULT_ENGINE: Record<string, string> = {en: "edge", vi: "vieneu"};
const lang = (n.language ?? "").toLowerCase().split("-")[0];
const suggested = DEFAULT_ENGINE[lang];
if (suggested && engine.name !== suggested && engine.name !== "elevenlabs") {
  console.log(`  hint: the default engine for "${n.language}" is "${suggested}" (§4); keeping "${engine.name}" as set in narration.json`);
}
if (!force && prev && prev.hash === hash && !prev.estimated && existsSync(audioOut)) {
  console.log(`= script and voice settings unchanged (hash ${hash}); no engine call. --force re-reads.`);
  process.exit(0);
}

const lines = flatLines(n);
if (!lines.length) die("narration.json has no lines");
const empty = lines.find((l) => !l.spoken.trim());
if (empty) die(`scene "${empty.scene}" line ${empty.index + 1} is empty`);

// ---------------------------------------------------------------- 1. engine
const key = engineKey(n);
const root = ensureDir(cacheDir(id));
for (const d of readdirSync(root)) if (d !== key) rmSync(join(root, d), {recursive: true, force: true});
const work = ensureDir(join(root, key));
const manifest = join(work, "segments.json");
let segments: Segment[];
if (!force && existsSync(manifest)) {
  segments = JSON.parse(readFileSync(manifest, "utf8"), (_k, v) => (v === null ? null : v === "Infinity" ? Infinity : v));
  console.log("= reusing the cached reading (pauses or spelling changed only)");
} else {
  console.log(`  synthesising ${lines.length} lines`);
  try {
    segments = await engine.synth(
      lines.map((l) => ({scene: l.scene, index: l.index, spoken: l.spoken})),
      {...n.voice, voice: voiceName},
      work,
    );
  } catch (e) {
    die(`${engine.name}: ${(e as Error).message}`);
  }
  await Bun.write(manifest, JSON.stringify(segments!, (_k, v) => (v === Infinity ? "Infinity" : v)));
}
const covered = segments!.reduce((s, g) => s + g.lines.length, 0);
if (covered !== lines.length) die(`engine returned ${covered} lines for ${lines.length} in the script`);

// ---------------------------------------------------------------- 2. audio analysis helpers
const WIN = Math.round(0.01 * RATE);
const db = (pcm: Float32Array, a: number, b: number) => {
  let s = 0;
  const i0 = Math.max(0, a);
  const i1 = Math.min(pcm.length, b);
  for (let i = i0; i < i1; i++) s += pcm[i] * pcm[i];
  return 10 * Math.log10(s / Math.max(1, i1 - i0) + 1e-12);
};

/** Quietest 20 ms point in [a, b] seconds. */
const quietest = (pcm: Float32Array, a: number, b: number) => {
  let best = {t: (a + b) / 2, db: Infinity};
  const step = Math.round(0.005 * RATE);
  for (let i = Math.round(a * RATE); i + 2 * WIN <= Math.round(b * RATE); i += step) {
    const d = db(pcm, i, i + 2 * WIN);
    if (d < best.db) best = {t: (i + WIN) / RATE, db: d};
  }
  return best;
};

/** First and last moment of sound in [a, b] seconds, with a little air around them. */
const speechBounds = (pcm: Float32Array, a: number, b: number): [number, number] => {
  const i0 = Math.round(a * RATE);
  const i1 = Math.min(pcm.length, Math.round(b * RATE));
  let peak = -120;
  for (let i = i0; i < i1; i += WIN) peak = Math.max(peak, db(pcm, i, i + WIN));
  const thr = Math.max(-55, peak - 40);
  let first = -1;
  let last = -1;
  for (let i = i0; i < i1; i += WIN) {
    if (db(pcm, i, i + WIN) > thr) {
      if (first < 0) first = i;
      last = i + WIN;
    }
  }
  if (first < 0) return [a, b];
  return [Math.max(a, first / RATE - 0.04), Math.min(b, last / RATE + 0.08)];
};

// ---------------------------------------------------------------- 3. cut, tempo, concatenate
const parts: Float32Array[] = [];
const vlines: VoiceLine[] = [];
const vwords: VoiceWord[] = [];
let t = 0;
let g = 0; // global line index
let skipped = 0;

for (const seg of segments!) {
  const pcm = await decodePcm(seg.file, RATE);
  const dur = pcm.length / RATE;
  const segLines = seg.lines.map((l) => ({...l, start: Math.max(0, l.start), end: Math.min(dur, l.end)}));
  // groups of lines separated by a clean (quiet) cut
  const groups: {from: number; to: number; idx: number[]}[] = [{from: 0, to: dur, idx: [0]}];
  for (let i = 1; i < segLines.length; i++) {
    const q = quietest(pcm, Math.max(0, segLines[i - 1].end - WIDEN), Math.min(dur, segLines[i].start + WIDEN));
    const cur = groups[groups.length - 1];
    if (q.db > QUIET_DB) {
      cur.idx.push(i);
      skipped++;
    } else {
      cur.to = q.t;
      groups.push({from: q.t, to: dur, idx: [i]});
    }
  }
  for (const grp of groups) {
    const [s, e] = speechBounds(pcm, grp.from, grp.to);
    const filter = `atrim=start=${s.toFixed(4)}:end=${e.toFixed(4)},asetpts=PTS-STARTPTS${tempo !== 1 ? `,atempo=${tempo}` : ""}`;
    const piece = await decodePcm(seg.file, RATE, filter);
    const pieceDur = piece.length / RATE;
    const map = (x: number) => t + Math.min(pieceDur, Math.max(0, (x - s) / tempo));
    for (const li of grp.idx) {
      const l = segLines[li];
      const fl = lines[g];
      const start = grp.idx.length === 1 ? t : map(l.start);
      const end = grp.idx.length === 1 ? t + pieceDur : map(l.end);
      const spoken = l.words?.map((w) => ({start: map(w.start), end: map(w.end)})) ?? null;
      vlines.push({scene: fl.scene, index: fl.index, text: fl.display, start, end});
      vwords.push(...lineWords(fl.display, g, start, end, spoken));
      g++;
    }
    parts.push(piece);
    t += pieceDur;
    const gap = gapAfter(n, lines, g - 1);
    if (gap > 0) {
      parts.push(new Float32Array(Math.round(gap * RATE)));
      t += Math.round(gap * RATE) / RATE;
    }
  }
}

const total = parts.reduce((s, x) => s + x.length, 0);
const all = new Float32Array(total);
let off = 0;
for (const x of parts) {
  all.set(x, off);
  off += x.length;
}
const raw = join(work, "voice.f32");
await Bun.write(raw, new Uint8Array(all.buffer));
ensureDir(audioDir(id));
await must(
  "ffmpeg",
  ["-v", "error", "-y", "-f", "f32le", "-ar", String(RATE), "-ac", "1", "-i", raw, "-c:a", "libmp3lame", "-b:a", "192k", "-ar", String(RATE), audioOut],
  {timeoutMs: 120_000},
);
rmSync(raw, {force: true});

const voice: Voice = {
  hash,
  engine: `${engine.name}${voiceName ? `:${voiceName}` : ""}`,
  duration: total / RATE,
  audio: audioRel,
  words: vwords,
  lines: vlines,
  scenes: scenesFromLines(vlines),
};
await writeVoice(voicePath, voice);

console.log(`+ public/${audioRel}  ${voice.duration.toFixed(2)} s, ${vlines.length} lines, ${vwords.length} words, ${voice.scenes.length} scenes`);
console.log(`+ src/videos/${id}/voice.json (hash ${hash})`);
if (skipped) console.log(`  ! ${skipped} line cut(s) skipped: no quiet point between the lines, natural gap kept (§4)`);
console.log("  Now listen to the whole file, end to end, and check it for loops and clipped syllables (§4).");

const T = loadThresholds();
const seconds = voice.duration + n.outroHold;
console.log("");
if (seconds > T.maxDurationSeconds) {
  console.log(`✖ LENGTH ${seconds.toFixed(1)} s with the outro hold is over the ${T.maxDurationSeconds} s platform ceiling: it will not be a Short (§8).`);
} else {
  console.log(`  length ${seconds.toFixed(1)} s with the ${n.outroHold} s outro hold (ceiling ${T.maxDurationSeconds} s)`);
}
