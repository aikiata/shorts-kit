/**
 * Types of `src/videos/<id>/voice.json` (written by `bun run tts`, never by
 * hand) and the helpers that turn it into frames. Scene length comes from the
 * voice (§4): nothing here takes a duration typed by a person.
 */

/** A display word (caption spelling, no punctuation), in seconds. */
export type VoiceWord = {
  text: string;
  start: number;
  end: number;
  /** Global line index into `Voice.lines`. */
  line: number;
  /** Punctuation that followed the word in the script, kept off the token itself. */
  brk?: "clause" | "sentence";
};

export type VoiceLine = {
  scene: string;
  /** Index of the line inside its scene. */
  index: number;
  /** Display text (script with `spelling` applied). */
  text: string;
  start: number;
  end: number;
  /** Optional second-language caption, merged in from narration.json by `withCaptions`. */
  caption?: string;
};

export type VoiceScene = {id: string; start: number; end: number};

export type Voice = {
  hash: string;
  /** True when written by `bun run new` (0.33 s per word, no audio). Lint fails on it. */
  estimated?: boolean;
  engine: string;
  duration: number;
  /** Path under public/, e.g. "audio/example/voice.mp3"; null before TTS. */
  audio: string | null;
  words: VoiceWord[];
  lines: VoiceLine[];
  scenes: VoiceScene[];
};

/** A scene's slot on the timeline, in frames. Contiguous: each lasts until the next starts. */
export type SceneTiming = {id: string; from: number; duration: number};

/** A word relative to its scene's first frame, in frames. */
export type SceneWord = {text: string; from: number; to: number; brk?: VoiceWord["brk"]};

/** The picture cuts this long before a scene's first word, so the shot is there when the word lands. */
const LEAD_SECONDS = 0.2;

export const totalFrames = (voice: Voice, fps: number, outroHold: number): number =>
  Math.max(1, Math.ceil((voice.duration + outroHold) * fps));

/** Scene slots in frames; the last scene also holds `outroHold` seconds of silence (§2). */
export const sceneTimings = (voice: Voice, fps: number, outroHold: number): SceneTiming[] => {
  const total = totalFrames(voice, fps, outroHold);
  const starts: number[] = [];
  voice.scenes.forEach((s, i) => {
    const want = i === 0 ? 0 : Math.round((s.start - LEAD_SECONDS) * fps);
    starts.push(i === 0 ? 0 : Math.min(total - 1, Math.max(want, starts[i - 1] + 1)));
  });
  return voice.scenes.map((s, i) => ({
    id: s.id,
    from: starts[i],
    duration: (i + 1 < starts.length ? starts[i + 1] : total) - starts[i],
  }));
};

/** Alias kept for the name used in the skills: scene slots in frames. */
export const sceneFrames = (voice: Voice, fps: number, outroHold = 0) => sceneTimings(voice, fps, outroHold);

/** The word being spoken at `t` seconds, or the last one that started before it. */
export const wordAt = (voice: Voice, t: number): VoiceWord | undefined => {
  let found: VoiceWord | undefined;
  for (const w of voice.words) {
    if (w.start > t) break;
    found = w;
  }
  return found;
};

const sceneOfLine = (voice: Voice, line: number) => voice.lines[line]?.scene;

/** Words of one scene, in frames relative to the scene's first frame. */
export const wordsInScene = (voice: Voice, fps: number, timing: SceneTiming): SceneWord[] =>
  voice.words
    .filter((w) => sceneOfLine(voice, w.line) === timing.id)
    .map((w) => ({
      text: w.text,
      from: Math.round(w.start * fps) - timing.from,
      to: Math.round(w.end * fps) - timing.from,
      brk: w.brk,
    }));

export const normalizeWord = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}%]+/gu, "");

/**
 * First frame (absolute) of the `nth` occurrence (1-based) of `word` in a
 * scene, for anchoring a shot or a sound to the word that names it (§12a).
 * Tries the exact display text first, then a case-insensitive match that
 * ignores punctuation. Throws when the scene or the word is not there: a cue
 * that silently falls back to frame 0 lands on the wrong sentence and nobody
 * notices.
 */
export const frameAtWord = (voice: Voice, fps: number, sceneId: string, word: string, nth = 1): number => {
  if (!voice.scenes.some((s) => s.id === sceneId)) {
    throw new Error(`frameAtWord: no scene "${sceneId}" in voice.json (scenes: ${voice.scenes.map((s) => s.id).join(", ")}).`);
  }
  const inScene = voice.words.filter((w) => sceneOfLine(voice, w.line) === sceneId);
  const exact = inScene.filter((w) => w.text === word);
  const key = normalizeWord(word);
  const hits = exact.length >= nth ? exact : inScene.filter((w) => normalizeWord(w.text) === key);
  const hit = hits[nth - 1];
  if (!hit) {
    throw new Error(`frameAtWord: "${word}" #${nth} is not spoken in scene "${sceneId}" (${hits.length} found). Check the script and the spelling map.`);
  }
  return Math.round(hit.start * fps);
};

/** Scene-relative version of `frameAtWord` (nth is 1-based), for use inside a scene component. */
export const wordFrame = (words: SceneWord[], word: string, nth = 1): number => {
  const exact = words.filter((w) => w.text === word);
  const key = normalizeWord(word);
  const hits = exact.length >= nth ? exact : words.filter((w) => normalizeWord(w.text) === key);
  const hit = hits[nth - 1];
  if (!hit) throw new Error(`wordFrame: "${word}" #${nth} is not in this scene (${hits.length} found).`);
  return hit.from;
};

type NarrationLike = {scenes: {id: string; lines: {text: string; caption?: string}[]}[]};

/** Copy second-language captions (`lines[].caption`) from narration.json onto the voice lines. */
export const withCaptions = (voice: Voice, narration: NarrationLike): Voice => ({
  ...voice,
  lines: voice.lines.map((l) => {
    const caption = narration.scenes.find((s) => s.id === l.scene)?.lines[l.index]?.caption;
    return caption ? {...l, caption} : l;
  }),
});
