import React from "react";
import {useCurrentFrame} from "remotion";
import {easeOut, ramp} from "../motion/anim";
import {DrawPath, MarkLayer, smoothPath, wobbleLine} from "./rough";

/**
 * A marker stroke under a word or a line, drawn left to right as the voice
 * says it. `double` adds a second, shorter stroke for the one word that matters most.
 */
export const Underline: React.FC<{
  x: number;
  /** Baseline of the stroke, in frame pixels. */
  y: number;
  w: number;
  color: string;
  at?: number;
  frames?: number;
  width?: number;
  double?: boolean;
  seed?: number;
}> = ({x, y, w, color, at = 0, frames = 10, width = 10, double = false, seed = 9}) => {
  const frame = useCurrentFrame();
  const k1 = ramp(frame, at, frames, easeOut);
  const k2 = ramp(frame, at + frames, Math.round(frames * 0.7), easeOut);
  return (
    <MarkLayer>
      <DrawPath d={smoothPath(wobbleLine([x, y + 2], [x + w, y - 4], seed, 4, 5))} k={k1} color={color} width={width} />
      {double ? <DrawPath d={smoothPath(wobbleLine([x + w * 0.08, y + width * 2], [x + w * 0.9, y + width * 1.6], seed + 4, 3, 5))} k={k2} color={color} width={width * 0.8} /> : null}
    </MarkLayer>
  );
};
