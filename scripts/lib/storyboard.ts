/**
 * The storyboard: one row per camera shot, planned after the voice exists and
 * approved before any scene code is written. Read by `bun run storyboard`,
 * `bun run lint` and the preview. Schema and rules: docs/storyboard.md.
 *
 * Timing is never stored here. A shot starts at its line (or at the anchor word
 * inside it) as timed in voice.json, and ends where the next shot starts, so a
 * re-run of TTS moves every shot with the voice.
 */
import {existsSync, readFileSync} from "node:fs";
import {join} from "node:path";
import {videoDir} from "./paths";

export type ShotStatus = "planned" | "approved" | "built";
export const SHOT_STATUSES: ShotStatus[] = ["planned", "approved", "built"];

export type Shot = {
  id: string;
  /** Global line index in narration order (0 = first line of the video). */
  line: number;
  /** Optional word inside the line where the shot starts; default the line start. */
  anchor?: string | null;
  /** What the camera does, in plain words: "push in 1.0 to 1.1 on the boat", "fly from delta to Saigon". */
  camera: string;
  /** What is on screen: the world, the figure, what appears or changes during the shot. */
  onScreen: string;
  /** On-frame text, data only (a number, a name), or null. */
  text?: string | null;
  /** A visual type id from docs/visuals/. */
  visual?: string;
  /** How the shot begins: "cut", "crossfade", "continuous" (same camera move carries on), "reveal". */
  transition?: string;
  /** A bundled SFX id or a file under public/sfx/, cued at the shot start or the anchor word. */
  sfx?: string | null;
  notes?: string;
  status: ShotStatus;
};

export type Storyboard = {shots: Shot[]};

type VWord = {text: string; start: number; end: number; line?: number};
type VLine = {start: number; end: number};
export type VoiceLike = {duration?: number; estimated?: boolean; words?: VWord[]; lines?: VLine[]};

export type TimedShot = Shot & {start: number | null; end: number | null; anchorFound: boolean};

export const storyboardPath = (id: string) => join(videoDir(id), "storyboard.json");

export const loadStoryboard = (id: string): {value: Storyboard | null; error: string | null} => {
  const path = storyboardPath(id);
  if (!existsSync(path)) return {value: null, error: null};
  try {
    return {value: JSON.parse(readFileSync(path, "utf8")) as Storyboard, error: null};
  } catch (e) {
    return {value: null, error: (e as Error).message};
  }
};

const norm = (s: string) => s.toLowerCase().normalize("NFC").replace(/[^\p{L}\p{N}%]+/gu, "");

/** Seconds where each shot starts and ends, from the voice. */
export const timeShots = (sb: Storyboard, voice: VoiceLike | null, outroHold = 0): TimedShot[] => {
  const lines = voice?.lines ?? [];
  const words = voice?.words ?? [];
  const starts = sb.shots.map((s) => {
    const line = lines[s.line];
    if (!line) return {start: null as number | null, anchorFound: !s.anchor};
    if (!s.anchor) return {start: line.start, anchorFound: true};
    const want = s.anchor.split(/\s+/).map(norm).filter(Boolean);
    const lw = words.filter((w) => w.line === s.line);
    for (let i = 0; i + want.length <= lw.length; i++) {
      if (want.every((t, k) => norm(lw[i + k].text) === t)) return {start: lw[i].start, anchorFound: true};
    }
    return {start: line.start, anchorFound: false};
  });
  const total = (voice?.duration ?? 0) + outroHold;
  return sb.shots.map((s, i) => {
    const next = starts.slice(i + 1).find((x) => x.start !== null)?.start ?? null;
    const start = starts[i].start;
    return {...s, start, end: start === null ? null : (next ?? (total || null)), anchorFound: starts[i].anchorFound};
  });
};

export type Issue = {level: "error" | "warn"; message: string};

/** Problems a reviewer should see before approving the storyboard. */
export const checkStoryboard = (sb: Storyboard, lineCount: number, voice: VoiceLike | null, visualIds: string[]): Issue[] => {
  const issues: Issue[] = [];
  if (!Array.isArray(sb.shots) || !sb.shots.length) return [{level: "error", message: "storyboard.json has no shots"}];
  const ids = new Set<string>();
  const covered = new Set<number>();
  let last = -1;
  for (const s of sb.shots) {
    const tag = s.id || "(no id)";
    if (!s.id) issues.push({level: "error", message: "a shot has no id"});
    else if (ids.has(s.id)) issues.push({level: "error", message: `duplicate shot id ${s.id}`});
    ids.add(s.id);
    if (!Number.isInteger(s.line) || s.line < 0 || s.line >= lineCount) issues.push({level: "error", message: `${tag}: line ${s.line} is not a narration line (0 to ${lineCount - 1})`});
    else covered.add(s.line);
    if (s.line < last) issues.push({level: "error", message: `${tag}: shots must follow the narration order`});
    last = Math.max(last, s.line);
    if (!s.camera?.trim()) issues.push({level: "warn", message: `${tag}: no camera move (§12: no shot stands still while the voice speaks)`});
    if (!s.onScreen?.trim()) issues.push({level: "warn", message: `${tag}: nothing described on screen`});
    if (!SHOT_STATUSES.includes(s.status)) issues.push({level: "error", message: `${tag}: status must be one of ${SHOT_STATUSES.join(", ")}`});
    if (s.visual && visualIds.length && !visualIds.includes(s.visual)) issues.push({level: "warn", message: `${tag}: visual "${s.visual}" is not in docs/visuals/`});
  }
  if (!voice || voice.estimated) issues.push({level: "warn", message: "timings are estimates: plan against the real voice (bun run tts)"});
  else for (const t of timeShots(sb, voice)) if (!t.anchorFound) issues.push({level: "error", message: `${t.id}: anchor "${t.anchor}" is not in line ${t.line} any more`});
  return issues;
};
