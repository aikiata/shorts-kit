import {interpolate, spring} from 'remotion';

/**
 * The channel's default fps. The `fps` argument of `enter` falls back to this, so the 29 videos
 * built before 08/09/2026 do not change by a single frame.
 *
 * ⚠️ Springs are computed in SECONDS, so if the real fps is not passed, in a 60 fps video
 * every entrance finishes in half the time — twice as fast, and it reads as text that
 * "pops" rather than text that "arrives".
 */
const FPS_DEFAULT = 30;

/** Springy entrance offset + opacity, staggered by index. */
export const enter = (frame: number, delay = 0, damping = 200, fps = FPS_DEFAULT) => {
  const s = spring({
    frame: frame - delay,
    fps,
    config: {damping, mass: 0.7, stiffness: 110},
  });
  return {
    opacity: s,
    translateY: interpolate(s, [0, 1], [26, 0]),
    scale: interpolate(s, [0, 1], [0.965, 1]),
  };
};

/** Fade in then out, so a scene never hard-cuts on its own content. */
export const fadeInOut = (
  frame: number,
  duration: number,
  inFrames = 12,
  outFrames = 12,
) =>
  interpolate(
    frame,
    [0, inFrames, duration - outFrames, duration],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

/** Reveals `text` one character at a time, like a terminal typing out. */
export const typed = (
  text: string,
  frame: number,
  start: number,
  cps = 34,
  fps = FPS_DEFAULT,
) => {
  const n = Math.floor(((frame - start) / fps) * cps);
  return text.slice(0, Math.max(0, Math.min(text.length, n)));
};
