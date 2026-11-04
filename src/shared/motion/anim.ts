import {Easing, interpolate} from "remotion";

/** Pass to `interpolate` so values never overshoot their range. */
export const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

export const ease = Easing.inOut(Easing.cubic);
export const easeOut = Easing.out(Easing.cubic);

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** 0 → 1 over `frames`, starting at `from`, eased. */
export const ramp = (frame: number, from: number, frames: number, easing = ease) =>
  interpolate(frame, [from, from + Math.max(1, frames)], [0, 1], {...clamp, easing});

/**
 * Glide a value from `a` to `b` between two frames. Use for camera and layout
 * moves: motion should keep going while the voice speaks (§12), so prefer a
 * long glide over a short jump.
 */
export const glide = (frame: number, [f0, f1]: [number, number], [a, b]: [number, number], easing = ease) =>
  interpolate(frame, [f0, f1], [a, b], {...clamp, easing});

/** Fade in over `frames` from `from`, and optionally fade out before `until`. */
export const fade = (frame: number, from: number, frames = 10, until?: number) => {
  const inK = ramp(frame, from, frames, easeOut);
  if (until === undefined) return inK;
  return Math.min(inK, 1 - ramp(frame, until - frames, frames, easeOut));
};
