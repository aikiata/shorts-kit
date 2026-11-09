/**
 * The clock of a promo with no voice: `src/videos/<id>/promo.json`, written by a
 * person (unlike voice.json, which is generated). A scene lasts `seconds` or
 * `beats` (needs `bpm`). Beats are converted through cumulative time, so a
 * 4-beat scene at 120 BPM that follows ten others never drifts by rounding.
 *
 * The voice-led equivalent is timings.ts. Everything here is the picture-led
 * side: scene length is chosen for what the shot has to do (docs/promo/).
 */
import type {SceneTiming} from "./timings";

export type PromoScene = {
  id: string;
  /** Length in seconds. Use this or `beats`. */
  seconds?: number;
  /** Length in beats at the promo's `bpm`. */
  beats?: number;
  /** Frames this scene fades in over, overlapping the previous scene. 0 = hard cut. */
  fade?: number;
};

export type PromoMusic = {
  /** Path under public/. Licence first: public/music/README.md. */
  src: string;
  volume?: number;
  /** Seconds into the file where the film starts. */
  start?: number;
  /** Seconds the music fades to zero over, ending at the last frame. */
  fadeOut?: number;
  /** Seconds the music fades in over. */
  fadeIn?: number;
  /**
   * Restart the file every this many seconds, for a film longer than the track. Use a whole number of
   * bars of the track's measured grid (14 bars = 56 beats), so the beats of the two copies line up.
   */
  repeatEvery?: number;
  /** Seconds the old copy fades out and the new one fades in over (default 1.9). */
  crossfade?: number;
};

/** One spoken line of a promo, placed on the timeline. The audio is made by `bun run voice <id>`. */
export type PromoVoiceLine = {
  id: string;
  text: string;
  /** Scene the line is placed in. */
  scene: string;
  /** Seconds after the scene starts. Use this or `beat`. */
  seconds?: number;
  /** Beats after the scene starts (needs `bpm`). */
  beat?: number;
  /**
   * Composition ids this line plays in, when it is not the master's: a cutdown that names its parts in its own
   * words (["Cut16"]). Absent: the master ("Video"). A cut that reuses a master line picks it by id as usual.
   */
  only?: string[];
};

/** The composition the master film is registered as (scripts/remotion.ts renders it). */
export const MASTER = "Video";
/** Does voice line `l` play in composition `comp`? */
export const linePlaysIn = (l: PromoVoiceLine, comp: string) => (l.only ? l.only.includes(comp) : comp === MASTER);

export type PromoVoice = {
  /** ElevenLabs voice id. */
  voice: string;
  model?: string;
  volume?: number;
  lines: PromoVoiceLine[];
};

export type Promo = {
  fps?: number;
  /** Beats per minute of the music, measured (never the tracker's guess). */
  bpm?: number;
  /** Seconds from the film's first frame to beat 0. Default 0. */
  offset?: number;
  /** Silent hold after the last scene, seconds. Default 0. */
  tail?: number;
  /** Default `fade` for scenes that do not set one. Default 0 (hard cut). */
  fade?: number;
  music?: PromoMusic;
  /** A few spoken lines placed on the timeline (a promo is not narrated end to end). */
  voice?: PromoVoice;
  scenes: PromoScene[];
};

/** Problems with a promo.json, as sentences. Empty means usable. */
export const promoProblems = (promo: Promo): string[] => {
  const out: string[] = [];
  if (!promo.scenes?.length) return ["promo.json has no scenes"];
  const seen = new Set<string>();
  for (const s of promo.scenes) {
    if (!s.id) out.push("a scene has no id");
    else if (seen.has(s.id)) out.push(`scene id "${s.id}" appears twice`);
    seen.add(s.id);
    const hasSec = s.seconds !== undefined;
    const hasBeats = s.beats !== undefined;
    if (hasSec === hasBeats) out.push(`scene "${s.id}": set exactly one of seconds or beats`);
    else if (hasSec && !(s.seconds! > 0)) out.push(`scene "${s.id}": seconds must be > 0`);
    else if (hasBeats && !(s.beats! > 0)) out.push(`scene "${s.id}": beats must be > 0`);
    if (hasBeats && !(promo.bpm! > 0)) out.push(`scene "${s.id}" is in beats but promo.json has no bpm`);
  }
  if (promo.bpm !== undefined && !(promo.bpm > 0)) out.push("bpm must be > 0");
  for (const l of promo.voice?.lines ?? []) {
    if (!seen.has(l.scene)) out.push(`voice line "${l.id}" is placed in scene "${l.scene}", which does not exist`);
    if ((l.seconds === undefined) === (l.beat === undefined)) out.push(`voice line "${l.id}": set exactly one of seconds or beat`);
    if (l.beat !== undefined && !(promo.bpm! > 0)) out.push(`voice line "${l.id}" is placed in beats but promo.json has no bpm`);
  }
  if ((promo.tail ?? 0) < 0) out.push("tail must be >= 0");
  return out;
};

export const assertPromo = (promo: Promo): Promo => {
  const problems = promoProblems(promo);
  if (problems.length) throw new Error(`promo.json: ${problems.join("; ")}`);
  return promo;
};

const sceneSeconds = (promo: Promo, s: PromoScene) => (s.seconds !== undefined ? s.seconds : (s.beats! * 60) / promo.bpm!);

/** Seconds of the scenes plus the tail. */
export const promoSeconds = (promo: Promo): number => promo.scenes.reduce((a, s) => a + sceneSeconds(promo, s), 0) + (promo.tail ?? 0);

export const promoFrames = (promo: Promo, fps: number): number => Math.max(1, Math.round(promoSeconds(promo) * fps));

/** Scene slots in frames, contiguous; the last scene also holds `tail`. Boundaries are rounded from cumulative time. */
export const promoTimings = (promo: Promo, fps: number): SceneTiming[] => {
  const total = promoFrames(promo, fps);
  let t = 0;
  const starts = promo.scenes.map((s) => {
    const at = Math.round(t * fps);
    t += sceneSeconds(promo, s);
    return at;
  });
  // a scene is at least one frame, and never starts past the end
  for (let i = 1; i < starts.length; i++) starts[i] = Math.min(total - 1, Math.max(starts[i], starts[i - 1] + 1));
  return promo.scenes.map((s, i) => ({id: s.id, from: starts[i], duration: (i + 1 < starts.length ? starts[i + 1] : total) - starts[i]}));
};

/** Absolute frame of beat `n` (0-based, fractions allowed) on the music's grid. */
export const frameAtBeat = (promo: Promo, fps: number, n: number): number => {
  if (!(promo.bpm! > 0)) throw new Error("frameAtBeat: promo.json has no bpm");
  return Math.round(((promo.offset ?? 0) + (n * 60) / promo.bpm!) * fps);
};

/** Absolute frame `beat` beats after a scene starts: drift-free for a cue inside a scene. */
export const frameAtSceneBeat = (promo: Promo, fps: number, sceneId: string, beat: number): number => {
  if (!(promo.bpm! > 0)) throw new Error("frameAtSceneBeat: promo.json has no bpm");
  const t = promoTimings(promo, fps).find((x) => x.id === sceneId);
  if (!t) throw new Error(`frameAtSceneBeat: no scene "${sceneId}" in promo.json (scenes: ${promo.scenes.map((s) => s.id).join(", ")})`);
  return t.from + Math.round(((beat * 60) / promo.bpm!) * fps);
};

/** Absolute frame `seconds` after a scene starts. */
export const frameAtScene = (promo: Promo, fps: number, sceneId: string, seconds = 0): number => {
  const t = promoTimings(promo, fps).find((x) => x.id === sceneId);
  if (!t) throw new Error(`frameAtScene: no scene "${sceneId}" in promo.json (scenes: ${promo.scenes.map((s) => s.id).join(", ")})`);
  return t.from + Math.round(seconds * fps);
};

/** Absolute first frame of a voice line. */
export const voiceLineFrame = (promo: Promo, fps: number, line: PromoVoiceLine): number =>
  line.beat !== undefined ? frameAtSceneBeat(promo, fps, line.scene, line.beat) : frameAtScene(promo, fps, line.scene, line.seconds ?? 0);

/** What `bun run voice` writes per line (voice-lines.json). */
export type VoiceRecord = {id: string; text: string; file: string; seconds: number; words: {text: string; start: number; end: number}[]};

const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}%]+/gu, "");

/**
 * The placed clips of a promo's voice lines, ready for PromoTemplate. `comp` (default the master) drops lines
 * marked `only` for other compositions; pass null to keep every line (a cut that picked its own lines).
 */
export const voiceClipsOf = (promo: Promo, fps: number, records: readonly VoiceRecord[], comp: string | null = MASTER) =>
  (promo.voice?.lines ?? []).filter((l) => comp === null || linePlaysIn(l, comp)).map((l) => {
    const r = records.find((x) => x.id === l.id);
    if (!r) throw new Error(`voice line "${l.id}" has no audio: run \`bun run voice <id>\``);
    return {src: r.file, at: voiceLineFrame(promo, fps, l), frames: Math.ceil(r.seconds * fps), volume: promo.voice?.volume};
  });

/** Absolute frame of the `nth` (1-based) spoken `word` in voice line `lineId`. Throws when it is not there. */
export const voiceWordFrame = (promo: Promo, fps: number, records: readonly VoiceRecord[], lineId: string, word: string, nth = 1): number => {
  const l = promo.voice?.lines.find((x) => x.id === lineId);
  const r = records.find((x) => x.id === lineId);
  if (!l || !r) throw new Error(`voiceWordFrame: no voice line "${lineId}"`);
  const hit = r.words.filter((w) => norm(w.text) === norm(word))[nth - 1];
  if (!hit) throw new Error(`voiceWordFrame: "${word}" #${nth} is not in line "${lineId}" (${r.words.map((w) => w.text).join(" ")})`);
  return voiceLineFrame(promo, fps, l) + Math.round(hit.start * fps);
};
