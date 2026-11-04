import React from "react";
import {useCurrentFrame} from "remotion";
import {rnd} from "../random";
import {HORIZON} from "./skies";

/**
 * Twinkling light path on the water under the sun or moon. An SVG group: put it
 * inside an `<svg>` (Sea does this for you when `glitter` is on).
 */
export const Glitter: React.FC<{
  /** x of the light source the path points to. */
  x: number;
  glint?: string;
  /** Peak opacity. */
  a?: number;
  horizon?: number;
  /** How far the path reaches down the water, px. */
  depth?: number;
  count?: number;
  frame?: number;
}> = ({x: lx, glint = "#FFF6D6", a = 0.6, horizon = HORIZON, depth = 330, count = 56, frame}) => {
  const now = useCurrentFrame();
  const f = frame ?? now;
  return (
    <g>
      {Array.from({length: count}, (_, i) => {
        const k = Math.pow(i / count, 1.6);
        const y = horizon + 4 + k * depth;
        const spread = 40 + (y - horizon) * 0.9;
        // Each flake twinkles on its own cycle and jumps to a new spot when dark.
        const cycle = 18 + rnd(i + 40) * 20;
        const ph = (f + rnd(i + 41) * cycle) / cycle;
        const gen = Math.floor(ph);
        const tw = Math.sin((ph - gen) * Math.PI);
        const x = lx + (rnd(i * 13 + gen) - 0.5) * spread;
        const w = 8 + (y - horizon) * 0.2 * (0.6 + rnd(i + gen * 3));
        return <rect key={i} x={x - w / 2} y={y} width={w} height={2 + k * 4} rx={2} fill={glint} opacity={a * tw * (1 - k * 0.85)} />;
      })}
    </g>
  );
};
