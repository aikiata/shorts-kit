import React from "react";
import {useCurrentFrame} from "remotion";
import {easeOut, ramp} from "../motion/anim";
import {rnd} from "../random";
import {DrawPath, MarkLayer, smoothPath, type Pt} from "./rough";

/**
 * A hand-drawn loop around the exact thing being said: a word in a document,
 * a town on a map, a face in a crowd. It overshoots its start like a real pen.
 */
export const CircleMark: React.FC<{
  /** Centre, in frame pixels. */
  x: number;
  y: number;
  rx: number;
  ry?: number;
  color: string;
  at?: number;
  frames?: number;
  width?: number;
  seed?: number;
}> = ({x, y, rx, ry, color, at = 0, frames = 14, width = 10, seed = 1}) => {
  const frame = useCurrentFrame();
  const k = ramp(frame, at, frames, easeOut);
  const r2 = ry ?? rx * 0.8;
  const tilt = (rnd(seed) - 0.5) * 0.3;
  const start = -Math.PI * 0.6 + (rnd(seed + 1) - 0.5) * 0.6;
  const turns = 1.12;
  const n = 28;
  const pts: Pt[] = Array.from({length: n + 1}, (_, i) => {
    const t = i / n;
    const a = start + t * Math.PI * 2 * turns;
    // The loop spirals in slightly, so the overshoot does not sit on the start.
    const grow = 1 + 0.06 * (1 - t) + (rnd(seed + i * 1.3) - 0.5) * 0.04;
    const px = Math.cos(a) * rx * grow;
    const py = Math.sin(a) * r2 * grow;
    return [x + px * Math.cos(tilt) - py * Math.sin(tilt), y + px * Math.sin(tilt) + py * Math.cos(tilt)];
  });
  return (
    <MarkLayer>
      <DrawPath d={smoothPath(pts)} k={k} color={color} width={width} />
    </MarkLayer>
  );
};
