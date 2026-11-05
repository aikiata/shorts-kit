/**
 * The storyboard: one row per camera shot, planned after the voice exists and
 * approved before any scene code is written. Read by `bun run storyboard`,
 * `bun run lint` and the preview. Schema and rules: docs/storyboard.md.
 *
 * Timing is never stored here. A shot starts at its line (or at the anchor word
 * inside it) as timed in voice.json, and ends where the next shot starts, so a
 * re-run of TTS moves every shot with the voice.
 *
 * What IS stored is the line each shot was planned against (`lineText`, the
 * on-screen text). `line` is only a position: insert a sentence and every later
 * shot would silently point at the wrong one, still "approved". `--sync` re-pins
 * shots by their text, and a shot whose line changed goes back to "planned".
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
  /** The on-screen text of that line when the shot was planned (written by --init / --sync). */
  lineText?: string;
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

export type Storyboard = {
  shots: Shot[];
  /** Shots whose line was removed, kept by --sync for the record (their scene code may need deleting). */
  removed?: Shot[];
};

type VWord = {text: string; start: number; end: number; line?: number};
type VLine = {start: number; end: number};
export type VoiceLike = {duration?: number; estimated?: boolean; words?: VWord[]; lines?: VLine[]};

export type TimedShot = Shot & {start: number | null; end: number | null; anchorFound: boolean};

export const storyboardPath = (id: string) => join(videoDir(id), "storyboard.json");

/** Field order on disk: `lineText` right after `line`, so a shot reads as "where, what it was planned on, how". */
const ORDER = ["id", "line", "lineText", "anchor", "camera", "onScreen", "text", "visual", "transition", "sfx", "notes", "status"];
const ordered = (s: Shot) => {
  const o: Record<string, unknown> = {};
  for (const k of ORDER) if (k in s) o[k] = (s as Record<string, unknown>)[k];
  for (const k of Object.keys(s)) if (!(k in o)) o[k] = (s as Record<string, unknown>)[k];
  return o;
};
/** storyboard.json with one shot per line, so a diff shows which shots changed. */
export const formatStoryboard = (sb: Storyboard) => {
  const block = (name: string, list: Shot[]) => `  "${name}": [\n${list.map((s) => `    {${Object.entries(ordered(s)).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(", ")}}`).join(",\n")}\n  ]`;
  const parts = [block("shots", sb.shots)];
  if (sb.removed?.length) parts.push(block("removed", sb.removed));
  return `{\n${parts.join(",\n")}\n}\n`;
};

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
export const sameLine = (a: string, b: string) => norm(a) === norm(b);

export type SyncChange = {shot: string; kind: "pinned" | "moved" | "changed" | "gone" | "added"; detail: string};

/**
 * Re-pin every shot to its line by text (`lines` = on-screen text per global line):
 * - no lineText yet: pin it to the current line (first sync of an old storyboard);
 * - text still at its index: nothing to do;
 * - text found at another index: move the shot there, keep its status;
 * - text gone, index still valid: the line was rewritten or re-cut. Keep the index,
 *   set status back to "planned", note the old line;
 * - text gone and its index now holds another shot's line (or is past the end): the
 *   line was removed; the shot moves to `removed` for a human to clear its scene.
 * Lines no shot covers get a new planned shot. Shots stay in narration order.
 */
export const syncStoryboard = (sb: Storyboard, lines: string[]): {sb: Storyboard; changes: SyncChange[]} => {
  const changes: SyncChange[] = [];
  const used = new Map<number, number>();
  const shots = sb.shots.map((s) => {
    const cur = lines[s.line];
    if (s.lineText === undefined) {
      if (cur === undefined) {
        changes.push({shot: s.id, kind: "gone", detail: `line ${s.line} no longer exists`});
        return s;
      }
      changes.push({shot: s.id, kind: "pinned", detail: `pinned to line ${s.line}`});
      return {...s, lineText: cur};
    }
    if (cur !== undefined && sameLine(cur, s.lineText)) return s;
    // Same text elsewhere (a sentence was inserted or removed before it): follow it.
    // When the text appears more than once, take the occurrence nearest the old index.
    const hits = lines.map((l, i) => (sameLine(l, s.lineText!) ? i : -1)).filter((i) => i >= 0);
    if (hits.length) {
      const to = hits.sort((a, b) => Math.abs(a - s.line) - Math.abs(b - s.line))[0];
      changes.push({shot: s.id, kind: "moved", detail: `line ${s.line} → ${to}`});
      return {...s, line: to};
    }
    // The line now at this index belongs to another shot (its own text): this shot's
    // line was removed, not rewritten. Do not hand it someone else's sentence.
    const owned = cur !== undefined && sb.shots.some((o) => o !== s && o.lineText !== undefined && sameLine(o.lineText, cur));
    if (cur === undefined || owned) {
      changes.push({shot: s.id, kind: "gone", detail: `its line "${s.lineText}" was removed`});
      return {...s, line: -1};
    }
    changes.push({shot: s.id, kind: "changed", detail: `line ${s.line} was "${s.lineText}", now "${cur}"${s.status !== "planned" ? `; ${s.status} → planned` : ""}`});
    const note = `[line changed, was: "${s.lineText}"]`;
    return {...s, lineText: cur, status: "planned" as ShotStatus, notes: s.notes ? `${note} ${s.notes}` : note};
  });
  // gone shots are reported and dropped from the timeline; their scene code is a human's call
  const gone = shots.filter((s) => s.line < 0);
  const live = shots.filter((s) => s.line >= 0);
  shots.splice(0, shots.length, ...live);
  for (const s of shots) used.set(s.line, (used.get(s.line) ?? 0) + 1);
  // lines without a shot (a sentence was added): a planned TODO shot each
  const taken = new Set(shots.map((s) => s.id));
  let n = 1;
  const nextId = () => {
    while (taken.has(`s${String(n).padStart(2, "0")}`)) n++;
    const id = `s${String(n).padStart(2, "0")}`;
    taken.add(id);
    return id;
  };
  lines.forEach((text, i) => {
    if (used.has(i)) return;
    const id = nextId();
    shots.push({id, line: i, lineText: text, anchor: null, camera: "TODO", onScreen: "TODO", text: null, transition: "cut", sfx: null, status: "planned"});
    changes.push({shot: id, kind: "added", detail: `new shot for line ${i} "${text}"`});
  });
  shots.sort((a, b) => a.line - b.line);
  return {sb: {...sb, shots, ...(gone.length ? {removed: [...((sb as {removed?: Shot[]}).removed ?? []), ...gone.map((g) => ({...g, line: -1}))]} : {})}, changes};
};

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

/** Shots whose pinned line no longer matches (or that are not pinned): for tts / cut to report. */
export const staleShots = (id: string, lines: string[]): {stale: number; unpinned: number} => {
  const {value} = loadStoryboard(id);
  if (!value?.shots) return {stale: 0, unpinned: 0};
  let stale = 0;
  let unpinned = 0;
  for (const s of value.shots) {
    const cur = lines[s.line];
    if (s.lineText === undefined) unpinned++;
    else if (cur === undefined || !sameLine(cur, s.lineText)) stale++;
  }
  return {stale, unpinned};
};

/** One line for the end of `tts` / `cut`, or "" when the storyboard is in step. */
export const storyboardHint = (id: string, lines: string[]) => {
  const {stale, unpinned} = staleShots(id, lines);
  if (stale) return `  ! storyboard: ${stale} shot${stale > 1 ? "s" : ""} planned against a line that changed. Run \`bun run storyboard ${id} --sync\` (changed shots go back to "planned").`;
  if (unpinned) return `  ! storyboard: ${unpinned} shot${unpinned > 1 ? "s are" : " is"} not pinned to its line yet. Run \`bun run storyboard ${id} --sync\` once.`;
  return "";
};

export type Issue = {level: "error" | "warn"; message: string};

/** Problems a reviewer should see before approving the storyboard. */
export const checkStoryboard = (sb: Storyboard, lines: string[], voice: VoiceLike | null, visualIds: string[]): Issue[] => {
  const lineCount = lines.length;
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
    const cur = lines[s.line];
    if (cur !== undefined && s.lineText === undefined) issues.push({level: "warn", message: `${tag}: not pinned to its line text; run \`bun run storyboard <id> --sync\` so a script change cannot move it silently`});
    else if (cur !== undefined && s.lineText !== undefined && !sameLine(cur, s.lineText)) {
      issues.push({
        level: s.status === "planned" ? "warn" : "error",
        message: `${tag}: planned against "${s.lineText}", line ${s.line} is now "${cur}"${s.status !== "planned" ? ` but it is still ${s.status}` : ""}. Run \`bun run storyboard <id> --sync\` and re-check the shot`,
      });
    }
    if (s.visual && visualIds.length && !visualIds.includes(s.visual)) issues.push({level: "warn", message: `${tag}: visual "${s.visual}" is not in docs/visuals/`});
  }
  if (!voice || voice.estimated) issues.push({level: "warn", message: "timings are estimates: plan against the real voice (bun run tts)"});
  else for (const t of timeShots(sb, voice)) if (!t.anchorFound) issues.push({level: "error", message: `${t.id}: anchor "${t.anchor}" is not in line ${t.line} any more`});
  return issues;
};
