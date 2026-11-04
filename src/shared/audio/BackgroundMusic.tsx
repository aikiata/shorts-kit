import React, {useMemo} from "react";
import {Html5Audio, interpolate, staticFile, useVideoConfig} from "remotion";
import {clamp} from "../motion/anim";
import {SOUL} from "../soul";
import type {Voice} from "../timings";

/**
 * A music bed under the voice (§8): ducked while a line is spoken, faded
 * evenly to zero over `musicFadeOutSeconds` so it is silent by the time the
 * outro hold starts. Licence first: read public/music/README.md.
 *
 * `volume` is a mix level, not a measurement. What counts is the spread
 * measured on the encoded file (`bun run encode` prints it, §8).
 */
export const BackgroundMusic: React.FC<{
  src: string;
  voice: Voice;
  volume?: number;
  /** Multiplier while the voice speaks. */
  duck?: number;
  /** Set when the file is a designed loop; a play-once bed must be longer than the video. */
  loop?: boolean;
}> = ({src, voice, volume = 0.12, duck = 0.55, loop = false}) => {
  const {fps} = useVideoConfig();
  const speech = useMemo(() => voice.lines.map((l) => [l.start, l.end] as const), [voice.lines]);
  const end = voice.duration;
  const fadeFrom = Math.max(0, end - SOUL.musicFadeOutSeconds);
  const ramp = 0.25;

  const level = (f: number) => {
    const t = f / fps;
    const fadeIn = interpolate(t, [0, 0.6], [0, 1], clamp);
    const fadeOut = interpolate(t, [fadeFrom, end], [1, 0], clamp);
    // distance to the nearest spoken line → smooth duck
    let near = 0;
    for (const [a, b] of speech) {
      const k = t < a ? interpolate(t, [a - ramp, a], [0, 1], clamp) : t > b ? interpolate(t, [b, b + ramp], [1, 0], clamp) : 1;
      near = Math.max(near, k);
    }
    const ducked = 1 - (1 - duck) * near;
    return volume * fadeIn * fadeOut * ducked;
  };

  return <Html5Audio src={staticFile(src)} volume={level} loop={loop} />;
};
