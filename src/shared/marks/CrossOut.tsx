import React from "react";
import {useCurrentFrame} from "remotion";
import {easeOut, ramp} from "../motion/anim";
import {DrawPath, MarkLayer, smoothPath, wobbleLine} from "./rough";

/**
 * A red X drawn at the exact spot that is wrong: the myth on a poster, the
 * error on a map. Two strokes, the second a beat after the first. Pairs with
 * `glitch` or `drop` (docs/sfx.md), never with a real tragedy.
 */
export const CrossOut: React.FC<{
  /** Box to cross out, in frame pixels. */
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  at?: number;
  frames?: number;
  width?: number;
  seed?: number;
}> = ({x, y, w, h, color, at = 0, frames = 8, width = 16, seed = 5}) => {
  const frame = useCurrentFrame();
  const k1 = ramp(frame, at, frames, easeOut);
  const k2 = ramp(frame, at + frames + 2, frames, easeOut);
  const pad = Math.min(w, h) * 0.06;
  const wob = Math.min(w, h) * 0.03;
  return (
    <MarkLayer>
      <DrawPath d={smoothPath(wobbleLine([x + pad, y + pad], [x + w - pad, y + h - pad], seed, wob))} k={k1} color={color} width={width} />
      <DrawPath d={smoothPath(wobbleLine([x + w - pad, y + pad * 1.4], [x + pad * 1.2, y + h - pad], seed + 11, wob))} k={k2} color={color} width={width} />
    </MarkLayer>
  );
};
