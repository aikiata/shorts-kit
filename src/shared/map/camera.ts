/**
 * The map camera. A shot is nothing but a `Box` (a viewBox in world units), so
 * moving the camera means interpolating boxes, and every layer drawn in world
 * units (imagery, vectors, routes, labels) moves with it for free.
 *
 * ```ts
 * const box = move(frame, {from: WIDE, to: CITY, frames: [0, 120]});
 * <SatelliteMap box={box} mosaics={SAT.mosaics}>…</SatelliteMap>
 * ```
 */
import {FPS} from "../theme";
import type {Box} from "./mercator";

export type {Box} from "./mercator";

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

/**
 * Interpolate two boxes in log-zoom, so a long zoom reads at a constant rate
 * instead of racing at the wide end. The pan is measured in zoom, not in time,
 * which keeps the subject centred through the whole move. The aspect of `a` is kept.
 */
export const fly = (a: Box, b: Box, t: number): Box => {
  const k = clamp01(t);
  const la = Math.log(a[2]);
  const lb = Math.log(b[2]);
  const w = Math.exp(la + (lb - la) * k);
  // Pure pan (same width): fall back to time.
  const f = Math.abs(la - lb) < 1e-9 ? k : (la - Math.log(w)) / (la - lb);
  const cx = a[0] + a[2] / 2 + (b[0] + b[2] / 2 - (a[0] + a[2] / 2)) * f;
  const cy = a[1] + a[3] / 2 + (b[1] + b[3] / 2 - (a[1] + a[3] / 2)) * f;
  const h = w * (a[3] / a[2]);
  return [cx - w / 2, cy - h / 2, w, h];
};

export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp01((x - edge0) / (edge1 - edge0 || 1));
  return t * t * (3 - 2 * t);
};

/**
 * Exit speed of a move as a fraction of its average speed. Pure smoothstep is
 * 0, and 0 is what makes a shot look parked the instant it lands (§12).
 */
export const MOTION_FLOOR = 0.34;

/**
 * Easing with a live tail: smoothstep blended with linear, so the move leaves
 * rest softly and still arrives moving. `tail` is the exit speed as a fraction
 * of the average speed (0 = smoothstep, 1 = linear).
 */
export const glide = (t: number, tail = MOTION_FLOOR) => {
  const k = clamp01(t);
  return (1 - tail) * (k * k * (3 - 2 * k)) + tail * k;
};

/** Nudge a box by a fraction of its own size, so no shot is ever completely still. */
export const drift = (box: Box, dx: number, dy: number): Box => [box[0] + box[2] * dx, box[1] + box[3] * dy, box[2], box[3]];

export type CoastRate = {
  /** Fraction of the width lost per second (positive keeps pushing in, negative pulls out). */
  zoom?: number;
  /** Fraction of the width travelled east per second. */
  dx?: number;
  /** Fraction of the height travelled south per second. */
  dy?: number;
};

/**
 * The continuation after a move lands: the frame keeps travelling instead of
 * freezing under the rest of the sentence. Rates are per second and relative
 * to the box, so a coast reads the same at country and at street scale.
 */
export const coast = (box: Box, seconds: number, {zoom = 0.01, dx = 0, dy = 0}: CoastRate = {}): Box => {
  const k = Math.exp(-zoom * seconds);
  const w = box[2] * k;
  const h = box[3] * k;
  return [box[0] + box[2] / 2 - w / 2 + box[2] * dx * seconds, box[1] + box[3] / 2 - h / 2 + box[3] * dy * seconds, w, h];
};

/** Seconds over which an auto coast's pan eases off. */
export const PAN_TAU = 1.5;

export type Move = {
  from: Box;
  to: Box;
  /** Frames the move starts and lands on. */
  frames: readonly [number, number];
  /** Exit speed fraction, see `glide`. Default MOTION_FLOOR. */
  tail?: number;
  /**
   * After landing: `"auto"` (default) keeps going at the exit speed of the
   * move, `false` parks, or give explicit rates.
   */
  coast?: "auto" | false | CoastRate;
  fps?: number;
};

/**
 * One camera move as a function of the frame: holds `from` before, flies with
 * `glide` during, then coasts on at the speed it landed with, so there is no
 * visible stop at the seam.
 */
export const move = (frame: number, {from, to, frames: [f0, f1], tail = MOTION_FLOOR, coast: c = "auto", fps = FPS}: Move): Box => {
  const dur = Math.max(1, f1 - f0);
  if (frame <= f1) return fly(from, to, glide((frame - f0) / dur, tail));
  if (c === false) return to;
  const seconds = (frame - f1) / fps;
  if (c !== "auto") return coast(to, seconds, c);
  // Match the exit velocity of the fly: `tail` × the average rate of the move.
  const secs = dur / fps;
  const zoom = (tail * Math.log(from[2] / to[2])) / secs;
  // The pan keeps its exit velocity at the seam, then eases off (time constant
  // PAN_TAU s) so a long pan does not carry the subject out of frame; the zoom
  // keeps its exit rate, which reads as a slow push.
  const vx = (tail * (to[0] + to[2] / 2 - from[0] - from[2] / 2)) / secs;
  const vy = (tail * (to[1] + to[3] / 2 - from[1] - from[3] / 2)) / secs;
  const travelled = PAN_TAU * (1 - Math.exp(-seconds / PAN_TAU));
  const b = coast(to, seconds, {zoom});
  return [b[0] + vx * travelled, b[1] + vy * travelled, b[2], b[3]];
};

/**
 * A chain of moves through several boxes. `keys` are `[frame, box]` pairs in
 * frame order; each leg is a `move`, and the last one coasts.
 */
export const path = (frame: number, keys: readonly (readonly [number, Box])[], tail = MOTION_FLOOR): Box => {
  if (keys.length === 1) return keys[0][1];
  let i = 0;
  while (i < keys.length - 2 && frame > keys[i + 1][0]) i++;
  const [f0, a] = keys[i];
  const [f1, b] = keys[i + 1];
  const last = i === keys.length - 2;
  return move(frame, {from: a, to: b, frames: [f0, f1], tail, coast: last ? "auto" : false});
};
