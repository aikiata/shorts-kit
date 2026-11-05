/**
 * The recorded voice (§5j): a filmed take or a voice recording is the voice,
 * instead of TTS. With visual `talking-head` the video is the background too. `bun run ingest` transcribes it, `bun run cut` proposes and applies
 * the edit. Nothing here rewrites what was said: the only ways to change the
 * spoken words are to cut them (cuts.json) or to fix how Whisper SPELLED them
 * (`spelling` in narration.json).
 *
 * Files, per video:
 *   .cache/footage/<id>/source.mp4     normalised copy of the filmed file (1080×1920, 30 fps, 48 kHz),
 *                                      or source.m4a for a voice-only video
 *   src/videos/<id>/transcript.json    Whisper words with times (written by ingest, never by hand)
 *   src/videos/<id>/cuts.json          the edit: removed word ranges, with a reason each (reviewed)
 *   src/videos/<id>/footage.json       what `cut` built: video, audio, joins, hashes, join loudness
 *   public/footage/<id>/cut.mp4        the edited video (muted in the render; talking-head only)
 *   public/audio/<id>/voice.mp3        the voice track, where TTS puts it (the template plays it)
 */
import {createHash} from "node:crypto";
import {existsSync, readFileSync} from "node:fs";
import {join} from "node:path";
import {p, videoDir} from "./paths";

/**
 * voice.engine for a RECORDED voice: a filmed take (visual `talking-head`, the
 * video is the background) or a voice-only recording (any other visual; only
 * the audio is used, the video, if any, is dropped).
 */
export const FOOTAGE_ENGINE = "recorded";

export type TWord = {
  /** Index in transcript.words; cuts and line ranges refer to it. */
  i: number;
  /** As Whisper wrote it, punctuation attached ("thế,"). */
  text: string;
  start: number;
  end: number;
  /** Whisper's confidence, 0..1. */
  p: number;
  /** Spans a long voiced stretch: Whisper likely dropped words here. Never trimmed. */
  suspect?: boolean;
  /** Index into transcript.source.clips: which filmed clip the word was said in. */
  clip?: number;
  /** A different voice starts here (subtitles' ">>"): always a line break. */
  turn?: boolean;
};

/** One input file, in the order it plays. Times are in the joined source. */
export type Clip = {file: string; start: number; end: number; width: number; height: number; created?: string};

export type Transcript = {
  /** Hash of the normalised source file: a new take is a new transcript. */
  hash: string;
  model: string;
  language: string;
  prompt?: string;
  /** width/height are 0 for a voice-only source. `clips`: the input files, joined in this order. */
  source: {file: string; duration: number; width: number; height: number; clips?: Clip[]};
  words: TWord[];
};

export const CUT_REASONS = ["filler", "retake", "false-start", "off-topic", "head", "tail", "manual"] as const;
export type CutReason = (typeof CUT_REASONS)[number];

/** Remove words `from`..`to` (inclusive transcript indices). */
export type Cut = {from: number; to: number; reason: CutReason; note?: string};

/**
 * A stretch of audio removed by TIME, allowed only inside a `suspect` word:
 * speech Whisper did not transcribe and the speaker has not supplied. Word
 * cuts cannot express it (the stretch is inside one "word"); a time cut
 * anywhere else could delete transcribed words silently, so it is refused.
 */
export type Stretch = {start: number; end: number; note: string};

export type Cuts = {
  /** transcript.hash this edit was made against. */
  transcript: string;
  /** Silences between kept words are shortened to this many seconds. */
  maxGap: number;
  /** Air kept before the first and after the last syllable of each kept run, seconds. */
  pad: number;
  cuts: Cut[];
  /** Untranscribed stretches removed by time (inside suspect words only). */
  stretches?: Stretch[];
};

export type Join = {
  /** Output time of the join, seconds. */
  at: number;
  /** Loudness at the source cut points, dBFS (quiet = clean cut). */
  db: number;
  /** "cut" removes words; "gap" only shortens a silence; "clip" is the change to the next filmed clip. */
  kind: "cut" | "gap" | "clip";
};

export type Footage = {
  transcript: string;
  cuts: string;
  /** "" for a voice-only video. */
  video: string;
  audio: string;
  duration: number;
  joins: Join[];
  /** Output time each clip starts playing (a clip cut entirely is absent). */
  clips?: {at: number; clip: number}[];
};

export const transcriptPath = (id: string) => join(videoDir(id), "transcript.json");
export const cutsPath = (id: string) => join(videoDir(id), "cuts.json");
export const footagePath = (id: string) => join(videoDir(id), "footage.json");
export const footageCache = (id: string) => p(".cache/footage", id);
export const footagePublic = (id: string) => p("public/footage", id);

const readJson = <T>(file: string): T | null => (existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as T) : null);
export const loadTranscript = (id: string) => readJson<Transcript>(transcriptPath(id));
export const loadCuts = (id: string) => readJson<Cuts>(cutsPath(id));
export const loadFootage = (id: string) => readJson<Footage>(footagePath(id));

export const hashText = (s: string) => createHash("sha1").update(s).digest("hex").slice(0, 16);
/** Hash of the edit decisions only (not formatting). */
export const cutsHash = (c: Cuts) =>
  hashText(JSON.stringify({t: c.transcript, g: c.maxGap, p: c.pad, c: [...c.cuts].sort((a, b) => a.from - b.from).map((x) => [x.from, x.to]), s: (c.stretches ?? []).map((x) => [x.start, x.end])}));

/**
 * Seconds of a suspect word still in the video after its stretches are cut.
 * More than `SUSPECT_KEEP_MAX` means untranscribed speech is still on air.
 */
export const SUSPECT_KEEP_MAX = 1.0;
export const suspectKept = (w: TWord, stretches: Stretch[] = []) => {
  let covered = 0;
  for (const s of stretches) covered += Math.max(0, Math.min(s.end, w.end) - Math.max(s.start, w.start));
  return Math.max(0, w.end - w.start - covered);
};

/** The clips of a transcript; a single-file transcript is one clip. */
export const clipsOf = (t: Transcript): Clip[] =>
  t.source.clips?.length ? t.source.clips : [{file: t.source.file, start: 0, end: t.source.duration, width: t.source.width, height: t.source.height}];

/** Which clip a source time falls in. */
export const clipAt = (clips: Clip[], at: number) => {
  for (let i = clips.length - 1; i >= 0; i--) if (at >= clips[i].start - 1e-6) return i;
  return 0;
};

const MEDIA_RE = /\.(mov|mp4|m4v|mkv|webm|avi|mp3|wav|m4a|aac|flac|ogg|opus)$/i;

/**
 * Input paths → files in play order. A directory expands to its media files
 * sorted by when they were filmed (creation_time), then by name; files given
 * one by one keep the order given (the person chose it).
 */
export const expandInputs = async (paths: string[], probe: (f: string) => Promise<{format: {tags?: Record<string, string>}}>): Promise<{file: string; created?: string}[]> => {
  const {readdirSync, statSync} = await import("node:fs");
  const {join, resolve} = await import("node:path");
  const out: {file: string; created?: string}[] = [];
  for (const raw of paths) {
    const pth = resolve(raw);
    if (statSync(pth).isDirectory()) {
      const files = readdirSync(pth).filter((f) => MEDIA_RE.test(f) && !f.startsWith(".")).map((f) => join(pth, f));
      const dated = await Promise.all(files.map(async (f) => ({file: f, created: (await probe(f)).format.tags?.creation_time})));
      dated.sort((a, b) => (a.created && b.created ? a.created.localeCompare(b.created) : 0) || a.file.localeCompare(b.file));
      out.push(...dated);
    } else out.push({file: pth, created: (await probe(pth)).format.tags?.creation_time});
  }
  return out;
};

/** Set of removed word indices. */
export const removedSet = (c: Cuts) => {
  const out = new Set<number>();
  for (const x of c.cuts) for (let i = x.from; i <= x.to; i++) out.add(i);
  return out;
};

/** Text of words a..b (inclusive) that survive the cut, as one line. */
export const keptText = (t: Transcript, removed: Set<number>, a: number, b: number) =>
  t.words
    .slice(a, b + 1)
    .filter((w) => !removed.has(w.i))
    .map((w) => w.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

/** Does a Whisper word end a sentence? */
export const endsSentence = (w: string) => /[.!?…]["'”’)]*$/u.test(w);

/** Strip punctuation for comparing words ("Thế," → "thế"). */
export const bare = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

/** transcript.json with one word per line, so a diff shows which words changed. */
export const writeTranscript = (file: string, t: Transcript) => {
  const {words, ...head} = t;
  const body = JSON.stringify(head, null, 2).replace(/\n}$/, "");
  const ws = words.map((w) => `    ${JSON.stringify(w)}`).join(",\n");
  return Bun.write(file, `${body},\n  "words": [\n${ws}\n  ]\n}\n`);
};

/**
 * Whisper's word segments are contiguous: a word before a pause "lasts" until
 * the next word, swallowing the silence. Trim each word to its FIRST voiced
 * chunk (a chunk ends at a silence of `minSilence` seconds), so silences exist
 * in the transcript and `cut` can shorten them.
 *
 * A word that spans a long stretch of mostly voiced audio is not one word:
 * Whisper dropped the words around it. Such a word is flagged `suspect` and
 * left untrimmed, because trimming it would turn the dropped speech into a
 * "silence" that `cut` deletes.
 *
 * `pcm` is mono at `rate`. Voiced = louder than both the room tone (10th
 * percentile + 6 dB) and the speech level (95th percentile) − 30 dB.
 */
export const refineWords = (words: TWord[], pcm: Float32Array, rate: number, minSilence = 0.15): TWord[] => {
  const hop = Math.round(0.01 * rate);
  const frames = Math.floor(pcm.length / hop);
  const dbs = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    let s = 0;
    for (let i = f * hop; i < (f + 1) * hop; i++) s += pcm[i] * pcm[i];
    dbs[f] = 10 * Math.log10(s / hop + 1e-12);
  }
  const sorted = Array.from(dbs).sort((a, b) => a - b);
  const speech = sorted[Math.floor(sorted.length * 0.95)] ?? -20;
  const room = sorted[Math.floor(sorted.length * 0.1)] ?? -60;
  const thr = Math.max(room + 6, speech - 30);
  const quietRun = Math.round(minSilence * 100);
  return words.map((w) => {
    const f0 = Math.max(0, Math.floor(w.start * 100));
    const f1 = Math.min(frames - 1, Math.ceil(w.end * 100));
    const voiced = (f: number) => dbs[f] > thr;
    let count = 0;
    for (let f = f0; f <= f1; f++) if (voiced(f)) count++;
    // A numeral is many spoken syllables ("8849" is eight of them): allow ~0.45 s per digit.
    const digits = (w.text.match(/\d/g) ?? []).length;
    const allowed = Math.max(1.2, 0.6 + 0.45 * digits);
    if (w.end - w.start > allowed && count / Math.max(1, f1 - f0 + 1) > 0.5) return {...w, suspect: true};
    let first = -1;
    for (let f = f0; f <= f1; f++) if (voiced(f)) {
      first = f;
      break;
    }
    if (first < 0) return w; // no voiced frame: keep Whisper's times
    let last = first;
    let quiet = 0;
    for (let f = first; f <= f1; f++) {
      if (voiced(f)) {
        last = f;
        quiet = 0;
      } else if (++quiet >= quietRun) break;
    }
    const start = Math.max(w.start, first / 100 - 0.02);
    const end = Math.min(w.end, (last + 1) / 100 + 0.03);
    return {...w, start: Math.round(start * 1000) / 1000, end: Math.round(Math.max(end, start + 0.05) * 1000) / 1000};
  });
};

/**
 * Words from a subtitle file the person already has, instead of Whisper: YouTube's
 * captions (.json3 with per-word times, or .vtt), an .srt exported from an editor,
 * or a script they read. Times are rough (whole cues for .srt/.vtt); `refineWords`
 * trims them to the voiced audio afterwards. `>>` (a speaker change) marks `turn`.
 * Machine captions are still machine-heard: numbers and names still go to the speaker.
 */
export const parseSubs = (file: string, raw: string): TWord[] => {
  type W = {text: string; start: number; end?: number; turn?: boolean};
  const ws: W[] = [];
  const push = (text: string, start: number, end?: number) => {
    let turn = false;
    let t = text.trim();
    if (t.startsWith(">>")) {
      turn = true;
      t = t.replace(/^>>\s*/, "");
    }
    for (const [k, part] of t.split(/\s+/).filter(Boolean).entries()) ws.push({text: part, start, end, ...(turn && k === 0 ? {turn: true} : {})});
  };
  if (/\.json3$/i.test(file)) {
    const d = JSON.parse(raw) as {events?: {tStartMs?: number; dDurationMs?: number; segs?: {utf8?: string; tOffsetMs?: number}[]}[]};
    for (const ev of d.events ?? []) {
      for (const sg of ev.segs ?? []) {
        if (!sg.utf8?.trim()) continue;
        push(sg.utf8, ((ev.tStartMs ?? 0) + (sg.tOffsetMs ?? 0)) / 1000, ((ev.tStartMs ?? 0) + (ev.dDurationMs ?? 0)) / 1000);
      }
    }
  } else {
    // .srt / .vtt: cue blocks "00:00:01,000 --> 00:00:03,500" then text lines
    const time = (s: string) => {
      const m = s.trim().match(/(?:(\d+):)?(\d+):(\d+)[.,](\d+)/);
      return m ? Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(`0.${m[4]}`) : NaN;
    };
    for (const block of raw.replace(/\r/g, "").split(/\n\s*\n/)) {
      const lines = block.split("\n");
      const at = lines.findIndex((l) => l.includes("-->"));
      if (at < 0) continue;
      const [a, b] = lines[at].split("-->").map((x) => time(x));
      const text = lines.slice(at + 1).join(" ").replace(/<[^>]+>/g, "").trim();
      if (!text || !(b > a)) continue;
      // spread the cue's words over it by length; refineWords fixes the edges later
      const parts = text.split(/\s+/);
      const total = parts.reduce((s, x) => s + x.length + 1, 0);
      let t = a;
      for (const x of parts) {
        const d = ((b - a) * (x.length + 1)) / total;
        push(x, t, t + d);
        t += d;
      }
    }
  }
  // vtt rolling captions repeat words: keep one per (text, start)
  const seen = new Set<string>();
  const uniq = ws.filter((w) => {
    const k = `${w.text}@${w.start.toFixed(2)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  uniq.sort((x, y) => x.start - y.start);
  return uniq.map((w, i) => {
    const next = uniq[i + 1]?.start;
    const end = Math.min(w.end ?? Infinity, next ?? Infinity, w.start + 1.5);
    return {i, text: w.text, start: w.start, end: Number.isFinite(end) && end > w.start ? end : w.start + 0.3, p: 1, ...(w.turn ? {turn: true} : {})};
  });
};
