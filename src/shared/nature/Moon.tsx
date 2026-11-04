import React, {useId} from "react";
import {svgId} from "../random";
import {W} from "../theme";
import {HORIZON} from "./skies";

/** Small glowing moon high in a night sky. Pair with `Stars`. */
export const Moon: React.FC<{x?: number; y?: number; size?: number; on?: number; tone?: string}> = ({
  x = 878,
  y = 688,
  size = 96,
  on = 1,
  tone = "#F4F1E4",
}) => (
  <div
    style={{
      position: "absolute",
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      borderRadius: size / 2,
      background: tone,
      boxShadow: `0 0 ${size * 0.6}px ${size * 0.19}px rgba(244,241,228,0.35)`,
      opacity: on,
    }}
  />
);

const MARIA: [number, number, number][] = [
  [-0.32, -0.29, 0.25],
  [0.14, -0.43, 0.16],
  [0.29, 0.04, 0.29],
  [-0.14, 0.14, 0.14],
  [-0.54, 0.07, 0.12],
];

/**
 * Huge moon half sunk behind the horizon, for a silhouette shot: put a figure
 * or boat in front of it and grade it with `silhouette(rim)`.
 */
export const BigMoon: React.FC<{cx?: number; cy?: number; r?: number; on?: number; horizon?: number}> = ({
  cx = W / 2,
  cy = 700,
  r = 280,
  on = 1,
  horizon = HORIZON,
}) => {
  const id = svgId(useId(), "bigmoon");
  return (
    <div style={{position: "absolute", left: 0, top: 0, width: W, height: horizon, overflow: "hidden", opacity: on}}>
      <div
        style={{
          position: "absolute",
          left: cx - r * 2.6,
          top: cy - r * 2.6,
          width: r * 5.2,
          height: r * 5.2,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(220,232,255,0.32) 0%, rgba(0,0,0,0) 58%)",
        }}
      />
      <svg width={W} height={horizon} style={{position: "absolute"}}>
        <defs>
          <radialGradient id={id} cx="0.42" cy="0.38" r="0.7">
            <stop offset="0" stopColor="#FBF8EC" />
            <stop offset="1" stopColor="#D9D6C6" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} />
        {/* faint dark "seas" on the face */}
        {MARIA.map(([dx, dy, mr], i) => (
          <circle key={i} cx={cx + dx * r} cy={cy + dy * r} r={mr * r} fill="#A9A595" opacity={0.09} />
        ))}
      </svg>
    </div>
  );
};
