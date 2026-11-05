/**
 * `bun run cut <id> [--propose] [--force]`
 *
 * Applies src/videos/<id>/cuts.json to the normalised footage (§5j):
 *
 * - every kept run of words becomes one piece, cut at the quietest point near
 *   Whisper's word edge; silences longer than `maxGap` shrink to it;
 * - writes the voice to public/audio/<id>/voice.mp3 (where TTS puts it, so every
 *   later step treats it the same) and, for a talking-head video,
 *   public/footage/<id>/cut.mp4 (video, no audio); and
 *   src/videos/<id>/footage.json (joins and their loudness, for lint);
 * - writes voice.json (engine "recorded") and updates narration.json's lines
 *   from the transcript. A line is a RANGE of transcript words (`words: [a, b]`);
 *   its text is those words minus the cut ones, exactly as said. Move lines
 *   between scenes, split or merge ranges, add `fact`; never retype the text.
 *
 * `--propose` rebuilds cuts.json from the transcript (overwrites your edits:
 * needs --force when cuts.json exists).
 */
import {existsSync, readFileSync} from "node:fs";
import {join} from "node:path";
import type {Voice, VoiceLine, VoiceWord} from "../src/shared/timings";
import {mergeCuts, proposeCuts, reviewText} from "./lib/cutplan";
import {
  CUT_REASONS,
  cutsHash,
  cutsPath,
  endsSentence,
  FOOTAGE_ENGINE,
  footageCache,
  footagePath,
  footagePublic,
  keptText,
  loadCuts,
  loadTranscript,
  removedSet,
  type Cuts,
  type Footage,
  type Join,
  type Transcript,
} from "./lib/footage";
import {flatLines, lineWords, loadNarration, scenesFromLines, voiceHash, writeVoice, type Narration, type NarrationLine, type NarrationScene} from "./lib/narration";
import {audioDir, die, ensureDir, flag, p, videoArg, videoDir} from "./lib/paths";
import {decodePcm, must} from "./lib/proc";
import {loadThresholds} from "./lib/thresholds";

const id = videoArg("bun run cut <id> [--propose] [--force]");
const T = loadThresholds();
const force = flag("force") !== undefined;
const t = loadTranscript(id) ?? die(`no transcript.json: run \`bun run ingest ${id} <file>\` first`);
const source = p(t.source.file);
if (!existsSync(source)) die(`normalised source ${t.source.file} is missing: run \`bun run ingest ${id} <file>\` again`);
const lowConf = T.footageLowConfidence as number;

// ---------------------------------------------------------------- --propose
if (flag("propose") !== undefined) {
  if (existsSync(cutsPath(id)) && !force) die("cuts.json exists; --propose would overwrite your edits. Add --force to replace it.");
  const lang = t.language;
  const cuts = proposeCuts(t, {
    fillers: (T.footageFillers as Record<string, string[]>)[lang] ?? [],
    maxGap: T.footageMaxGapSeconds,
    pad: T.footagePadSeconds,
    retakeWindow: T.footageRetakeWindowWords,
    lowConfidence: lowConf,
  });
  await Bun.write(cutsPath(id), `${JSON.stringify(cuts, null, 2)}\n`);
  console.log(`+ src/videos/${id}/cuts.json  ${cuts.cuts.length} proposed cuts\n\n${reviewText(t, cuts, lowConf)}`);
  process.exit(0);
}

// ---------------------------------------------------------------- validate cuts.json
const cuts: Cuts = loadCuts(id) ?? die(`no cuts.json: run \`bun run cut ${id} --propose\``);
if (cuts.transcript !== t.hash) die(`cuts.json was made for transcript ${cuts.transcript}, the current one is ${t.hash} (a new take?). Re-propose: bun run cut ${id} --propose --force`);
if (!(cuts.maxGap >= 0.1 && cuts.maxGap <= 2)) die(`cuts.maxGap ${cuts.maxGap} must be 0.1–2 s`);
if (!(cuts.pad >= 0 && cuts.pad <= 0.3)) die(`cuts.pad ${cuts.pad} must be 0–0.3 s`);
const N = t.words.length;
for (const c of cuts.cuts) {
  const at = `cut ${c.from}–${c.to}`;
  if (!Number.isInteger(c.from) || !Number.isInteger(c.to) || c.from < 0 || c.to >= N || c.to < c.from) die(`${at}: from/to must be word indices 0–${N - 1}, from ≤ to`);
  if (!CUT_REASONS.includes(c.reason)) die(`${at}: reason "${c.reason}" is not one of ${CUT_REASONS.join(", ")}`);
  if (c.reason === "manual" && !c.note) die(`${at}: a manual cut needs a note saying why`);
}
const merged = mergeCuts(cuts.cuts);
const removed = removedSet(cuts);
const stretches = [...(cuts.stretches ?? [])].sort((a, b) => a.start - b.start);
for (const s of stretches) {
  const at = `stretch ${s.start}–${s.end} s`;
  if (!(s.end > s.start)) die(`${at}: end must be after start`);
  if (!s.note) die(`${at}: needs a note saying what is removed and why`);
  const host = t.words.find((w) => w.suspect && !removed.has(w.i) && s.start >= w.start - 0.05 && s.end <= w.end + 0.05);
  if (!host) die(`${at}: a time cut is allowed only inside a word flagged ⟪words missing?⟫ (it would otherwise delete transcribed words). Cut words with "cuts" instead.`);
}
const kept = t.words.filter((w) => !removed.has(w.i));
if (!kept.length) die("cuts.json removes every word");

// ---------------------------------------------------------------- pieces in source time
const RATE = 48000;
const pcm = await decodePcm(source, RATE);
const srcDur = pcm.length / RATE;
const WIN = Math.round(0.02 * RATE);
const db = (a: number) => {
  const i0 = Math.max(0, Math.round(a * RATE) - WIN / 2);
  const i1 = Math.min(pcm.length, i0 + WIN);
  let s = 0;
  for (let i = i0; i < i1; i++) s += pcm[i] * pcm[i];
  return 10 * Math.log10(s / Math.max(1, i1 - i0) + 1e-12);
};
/** Quietest point in [a, b] (seconds), 5 ms steps. */
const quietest = (a: number, b: number) => {
  let best = {t: (a + b) / 2, db: Infinity};
  if (b <= a) return {t: a, db: db(a)};
  for (let x = a; x <= b; x += 0.005) {
    const d = db(x);
    if (d < best.db) best = {t: x, db: d};
  }
  return best;
};

/** Stretches in [a, b] quieter than a clean join (footageJoinMaxDb − 5 dB), at least `min` s long, in order. */
const QUIET_DB = (T.footageJoinMaxDb as number) - 5;
const quietRuns = (a: number, b: number, min: number): [number, number][] => {
  const out: [number, number][] = [];
  let s = -1;
  for (let x = Math.max(0, a); x <= Math.min(srcDur, b); x += 0.01) {
    if (db(x) < QUIET_DB) {
      if (s < 0) s = x;
    } else if (s >= 0) {
      if (x - s >= min) out.push([s, x]);
      s = -1;
    }
  }
  if (s >= 0 && Math.min(srcDur, b) - s >= min) out.push([s, Math.min(srcDur, b)]);
  return out;
};

type Piece = {start: number; end: number; startDb: number; endDb: number; kind: Join["kind"]};
const pieces: Piece[] = [];
const head = quietest(Math.max(0, kept[0].start - cuts.pad - 0.15), Math.max(0, kept[0].start - cuts.pad * 0.5));
let cur: Piece = {start: head.t, end: 0, startDb: -120, endDb: -120, kind: "cut"};
for (let k = 0; k < kept.length; k++) {
  const w = kept[k];
  const next = kept[k + 1];
  if (!next) break;
  const consecutive = next.i === w.i + 1;
  if (consecutive && next.start - w.end <= cuts.maxGap) continue;
  // Whisper's word edges are often 100–300 ms off, so cut points come from the
  // AUDIO: the quiet runs between the two words, never a word edge itself.
  let endAt: {t: number; db: number};
  let startAt: {t: number; db: number};
  if (consecutive) {
    // Only a silence to shorten: find the real one; if it is short enough, leave it.
    const run = quietRuns(w.end - 0.1, next.start + 0.1, 0.04).sort((a, b) => b[1] - b[0] - (a[1] - a[0]))[0];
    if (!run || run[1] - run[0] <= cuts.maxGap) continue;
    endAt = {t: run[0] + cuts.maxGap / 2, db: db(run[0] + cuts.maxGap / 2)};
    startAt = {t: run[1] - cuts.maxGap / 2, db: db(run[1] - cuts.maxGap / 2)};
  } else {
    // Words removed between w and next: end after w at the first quiet run, start
    // before next at the last quiet run, keeping `pad` of air inside each run.
    const firstGone = t.words[w.i + 1];
    const lastGone = t.words[next.i - 1];
    const after = quietRuns(w.end - 0.05, Math.max(w.end + 0.05, firstGone.end), 0.04)[0];
    const before = quietRuns(Math.min(next.start - 0.05, lastGone.start), next.start + 0.1, 0.04).pop();
    endAt = after ? {t: after[0] + Math.min(cuts.pad, (after[1] - after[0]) / 2), db: 0} : quietest(w.end, firstGone.start + 0.1);
    startAt = before ? {t: before[1] - Math.min(cuts.pad, (before[1] - before[0]) / 2), db: 0} : quietest(lastGone.end - 0.1, next.start);
    endAt.db = db(endAt.t);
    startAt.db = db(startAt.t);
  }
  if (startAt.t <= endAt.t) continue; // no clean place to cut: keep it whole
  cur.end = endAt.t;
  cur.endDb = endAt.db;
  pieces.push(cur);
  cur = {start: startAt.t, end: 0, startDb: startAt.db, endDb: -120, kind: consecutive ? "gap" : "cut"};
}
const tail = quietest(Math.min(srcDur, kept[kept.length - 1].end + cuts.pad * 0.5), Math.min(srcDur, kept[kept.length - 1].end + cuts.pad + 0.2));
cur.end = tail.t;
pieces.push(cur);

// untranscribed stretches: split the pieces around each, at the quietest point near its edges
for (const s of stretches) {
  const a = quietest(Math.max(0, s.start - 0.08), s.start + 0.08);
  const b = quietest(s.end - 0.08, Math.min(srcDur, s.end + 0.08));
  const k = pieces.findIndex((pc) => pc.start < a.t && pc.end > b.t);
  if (k < 0) die(`stretch ${s.start}–${s.end} s does not lie inside one kept piece; widen or narrow it`);
  const pc = pieces[k];
  pieces.splice(k, 1, {...pc, end: a.t, endDb: a.db}, {start: b.t, end: pc.end, startDb: b.db, endDb: pc.endDb, kind: "cut"});
}

// output time of each piece
let out = 0;
const placed = pieces.map((pc) => {
  const o = {...pc, out};
  out += pc.end - pc.start;
  return o;
});
const toOut = (x: number) => {
  for (const pc of placed) if (x >= pc.start - 1e-6 && x <= pc.end + 1e-6) return pc.out + (x - pc.start);
  // a word edge that fell into a removed silence: clamp to the nearest piece edge
  let best = placed[0].out;
  let dist = Infinity;
  for (const pc of placed) {
    for (const [s, o] of [
      [pc.start, pc.out],
      [pc.end, pc.out + pc.end - pc.start],
    ]) {
      if (Math.abs(x - s) < dist) {
        dist = Math.abs(x - s);
        best = o;
      }
    }
  }
  return best;
};
const joins: Join[] = placed.slice(1).map((pc, i) => ({at: Math.round(pc.out * 1000) / 1000, db: Math.round(Math.max(pc.startDb, placed[i].endDb) * 10) / 10, kind: pc.kind}));

// ---------------------------------------------------------------- render cut.mp4 + voice.mp3
const pub = ensureDir(footagePublic(id));
const videoOut = join(pub, "cut.mp4");
const audioOut = join(ensureDir(audioDir(id)), "voice.mp3");
const FADE = 0.008; // 8 ms de-click on every audio join
// A voice-only source (transcript width 0) has no picture: audio only.
const withVideo = t.source.width > 0;
const graph: string[] = [];
placed.forEach((pc, i) => {
  const d = pc.end - pc.start;
  if (withVideo) graph.push(`[0:v]trim=start=${pc.start.toFixed(4)}:end=${pc.end.toFixed(4)},setpts=PTS-STARTPTS[v${i}]`);
  graph.push(
    `[0:a]atrim=start=${pc.start.toFixed(4)}:end=${pc.end.toFixed(4)},asetpts=PTS-STARTPTS,afade=t=in:d=${FADE},afade=t=out:st=${Math.max(0, d - FADE).toFixed(4)}:d=${FADE}[a${i}]`,
  );
});
graph.push(
  withVideo
    ? `${placed.map((_, i) => `[v${i}][a${i}]`).join("")}concat=n=${placed.length}:v=1:a=1[v][a]`
    : `${placed.map((_, i) => `[a${i}]`).join("")}concat=n=${placed.length}:v=0:a=1[a]`,
);
const graphFile = join(ensureDir(footageCache(id)), "cut.ffgraph");
await Bun.write(graphFile, graph.join(";\n"));
console.log(`cut ${id}: ${placed.length} pieces, ${merged.length} cuts${stretches.length ? ` + ${stretches.length} stretch${stretches.length > 1 ? "es" : ""}` : ""}, ${srcDur.toFixed(1)} s → ${out.toFixed(1)} s`);
await must(
  "ffmpeg",
  [
    "-v", "error", "-y", "-i", source, "-filter_complex_script", graphFile,
    ...(withVideo ? ["-map", "[v]", "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-r", "30", "-movflags", "+faststart", videoOut] : []),
    "-map", "[a]", "-vn", "-c:a", "libmp3lame", "-b:a", "192k", "-ar", String(RATE), audioOut,
  ],
  {timeoutMs: 1_800_000},
);

// ---------------------------------------------------------------- narration lines from the transcript
const narrationFile = join(videoDir(id), "narration.json");
const raw = JSON.parse(readFileSync(narrationFile, "utf8")) as Narration;
const n = loadNarration(id);
type RLine = NarrationLine & {words?: [number, number]};
const hasRanges = n.scenes.some((s) => s.lines.some((l) => Array.isArray((l as RLine).words)));
const notes: string[] = [];

/** Sentence ranges over transcript indices [a, b], optionally limited to a span. */
const sentenceRanges = (from: number, to: number): [number, number][] => {
  const out: [number, number][] = [];
  let a = from;
  for (let i = from; i <= to; i++) {
    if (endsSentence(t.words[i].text) || i === to) {
      out.push([a, i]);
      a = i + 1;
    }
  }
  return out.filter(([x, y]) => keptText(t, removed, x, y));
};

let scenes: NarrationScene[];
if (!hasRanges) {
  // First cut: one sentence per line; the first is the hook, the rest get numbered
  // scenes for the agent to regroup into the flow's beats.
  const ranges = sentenceRanges(0, N - 1);
  scenes = ranges.map(([a, b], k) => ({id: k === 0 ? "hook" : `s${String(k + 1).padStart(2, "0")}`, lines: [{text: "", words: [a, b], fact: ""} as RLine]}));
  notes.push(`${ranges.length} lines made from the transcript, one per sentence. Regroup them into the flow's beats (move whole line objects), add each line's fact.`);
} else {
  scenes = n.scenes.map((s) => ({...s, lines: s.lines.map((l) => ({...l}))}));
  const all = scenes.flatMap((s) => s.lines as RLine[]);
  for (const l of all) {
    if (!Array.isArray(l.words) || l.words.length !== 2) die(`a line without "words": [a, b] in a footage video: "${l.text.slice(0, 40)}". Every line is a range of transcript words.`);
    const [a, b] = l.words as [number, number];
    if (!(a >= 0 && b < N && a <= b)) die(`line range [${a}, ${b}] is outside the transcript (0–${N - 1})`);
  }
  const sorted = [...all].sort((x, y) => x.words![0] - y.words![0]);
  for (let i = 1; i < sorted.length; i++) if (sorted[i].words![0] <= sorted[i - 1].words![1]) die(`line ranges overlap: [${sorted[i - 1].words}] and [${sorted[i].words}]`);
  // kept words no line covers (a cut was undone): new lines after the line before them
  const covered = new Set<number>();
  for (const l of all) for (let i = l.words![0]; i <= l.words![1]; i++) covered.add(i);
  let i = 0;
  while (i < N) {
    if (covered.has(i)) {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < N && !covered.has(j + 1)) j++;
    for (const [a, b] of sentenceRanges(i, j)) {
      const before = sorted.filter((l) => l.words![1] < a).pop();
      const scene = before ? scenes.find((s) => s.lines.includes(before as NarrationLine))! : scenes[0];
      const at = before ? scene.lines.indexOf(before as NarrationLine) + 1 : 0;
      const nl = {text: "", words: [a, b], fact: ""} as RLine;
      scene.lines.splice(at, 0, nl);
      sorted.push(nl);
      sorted.sort((x, y) => x.words![0] - y.words![0]);
      notes.push(`new line [${a}, ${b}] in scene "${scene.id}": words no line covered`);
    }
    i = j + 1;
  }
}
// texts from the transcript; drop lines and scenes left empty by the cut
for (const s of scenes) {
  s.lines = s.lines.filter((l) => {
    const [a, b] = (l as RLine).words as [number, number];
    l.text = keptText(t, removed, a, b);
    if (!l.text) notes.push(`line [${a}, ${b}] in scene "${s.id}" is fully cut: removed`);
    return !!l.text;
  });
}
scenes = scenes.filter((s) => {
  if (!s.lines.length) notes.push(`scene "${s.id}" has no words left: removed`);
  return s.lines.length > 0;
});
// TTS settings (voice name, tempo) mean nothing for a filmed voice; keep only the footage's source record.
const voiceSettings = {engine: FOOTAGE_ENGINE, source: raw.voice?.source ?? ""};
// The language is what was spoken: the transcript's, keeping a region tag that agrees ("vi-VN").
const language = raw.language?.toLowerCase().startsWith(t.language) ? raw.language : t.language;
if (language !== raw.language) notes.push(`language set to "${language}" (was "${raw.language}"): the take is in ${t.language}`);
const nextNarration: Narration = {...raw, voice: voiceSettings as Narration["voice"], language, scenes};
await Bun.write(narrationFile, `${JSON.stringify(nextNarration, null, 2)}\n`);

// ---------------------------------------------------------------- voice.json
const n2 = loadNarration(id);
const flat = flatLines(n2);
const vlines: VoiceLine[] = [];
const vwords: VoiceWord[] = [];
let lineIdx = 0;
for (const s of n2.scenes) {
  for (const l of s.lines as RLine[]) {
    const fl = flat[lineIdx];
    const ws = t.words.slice(l.words![0], l.words![1] + 1).filter((w) => !removed.has(w.i));
    const spoken = ws.map((w) => ({start: toOut(w.start), end: Math.max(toOut(w.start) + 0.04, toOut(w.end))}));
    const start = spoken[0].start;
    const end = spoken[spoken.length - 1].end;
    vlines.push({scene: fl.scene, index: fl.index, text: fl.display, start, end});
    vwords.push(...lineWords(fl.display, lineIdx, start, end, spoken));
    lineIdx++;
  }
}
const voice: Voice = {
  hash: voiceHash(n2),
  engine: FOOTAGE_ENGINE,
  duration: out,
  audio: `audio/${id}/voice.mp3`,
  words: vwords,
  lines: vlines,
  scenes: scenesFromLines(vlines),
};
await writeVoice(join(videoDir(id), "voice.json"), voice);

const footage: Footage = {transcript: t.hash, cuts: cutsHash(cuts), video: withVideo ? `footage/${id}/cut.mp4` : "", audio: voice.audio!, duration: Math.round(out * 1000) / 1000, joins};
await Bun.write(footagePath(id), `${JSON.stringify(footage, null, 2)}\n`);

console.log(`+ public/audio/${id}/voice.mp3${withVideo ? `, public/footage/${id}/cut.mp4` : ""}  ${out.toFixed(2)} s`);
console.log(`+ src/videos/${id}/voice.json, footage.json, narration.json  ${vlines.length} lines, ${voice.scenes.length} scenes`);
for (const x of notes) console.log(`  ${x}`);
const loud = joins.filter((j) => j.db > T.footageJoinMaxDb);
if (loud.length) console.log(`  ! ${loud.length} join(s) louder than ${T.footageJoinMaxDb} dB (a cut through a syllable?) at ${loud.map((j) => `${j.at.toFixed(2)} s`).join(", ")}: listen there, widen or move the cut`);
console.log(`  Now ${withVideo ? "watch cut.mp4" : "listen to voice.mp3"} end to end: every join, every first and last syllable (§5j).`);
