import React from "react";
import {useCurrentFrame} from "remotion";
import {hexRgb} from "../color";
import {rnd} from "../random";
import {H, W} from "../theme";
import {GROUNDS, type GroundPreset} from "./grounds";
import {SKIES, type SkyKind} from "./skies";

/**
 * Tall swaying foreground grass from `top` to the bottom of the frame. Draw it
 * after the figures to hide them: around 600 blades from y ≈ 1000 is thick
 * enough for crouching figures to read as hidden; 120 blades is only texture.
 */
export const TallGrass: React.FC<{
  sky: SkyKind;
  ground?: GroundPreset;
  /** Highest y where blades are rooted (they grow 90–250 px up from there). */
  top: number;
  count?: number;
  seed?: number;
  /** Darken toward black, 0–1. */
  dark?: number;
  frame?: number;
}> = ({sky, ground, top, count = 220, seed = 0, dark = 0.2, frame}) => {
  const now = useCurrentFrame();
  const f = frame ?? now;
  const g = ground ?? GROUNDS[sky];
  const low = SKIES[sky].low;
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0}}>
      {Array.from({length: count}, (_, i) => {
        const x = rnd(i + seed + 1000) * (W + 60) - 30;
        const base = top + 40 + rnd(i + seed + 1001) * (H - top);
        const h = 90 + rnd(i + seed + 1002) * 160;
        const sway = Math.sin(f / 18 + i * 0.7) * 10 + Math.sin(f / 7 + i) * 3;
        // near colour toward the sky, then toward black: one blend, one rgb() string
        const k = rnd(i + seed + 1003) * 0.25 + 0.05;
        const [a, b] = [hexRgb(g.near), hexRgb(low)];
        const tone = `rgb(${a.map((v, j) => Math.round((v + (b[j] - v) * k) * (1 - dark))).join(",")})`;
        return (
          <path
            key={i}
            d={`M ${x - 4} ${base} Q ${x + sway * 0.4} ${base - h * 0.6} ${x + sway} ${base - h} Q ${x + sway * 0.3 + 2} ${base - h * 0.55} ${x + 5} ${base} Z`}
            fill={tone}
          />
        );
      })}
    </svg>
  );
};
