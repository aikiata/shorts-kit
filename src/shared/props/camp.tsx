import React from "react";
import {useCurrentFrame} from "remotion";
import {rnd} from "../random";

/**
 * Camp props: tents, a barricade, a fire with smoke, a flag, a sleeper's z's
 * and a letter. Each draws around (x, y) and returns a `<g>` for an `<svg>`.
 * Animated ones read the frame themselves; pass `frame` to freeze a still.
 */

export const Tent: React.FC<{x: number; y: number; s?: number; shade?: string}> = ({x, y, s = 1, shade = "#B9B2A0"}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -90 0 L 0 -110 L 90 0 Z" fill="#E9E4D6" />
    <path d="M 0 -110 L 90 0 L 30 0 Z" fill={shade} />
    <path d="M -12 0 L 0 -60 L 12 0 Z" fill="#5B5446" />
    <line x1={0} y1={-110} x2={0} y2={-126} stroke="#5B4630" strokeWidth={4} />
  </g>
);

/** A field barricade of crates, saddles and baggage, centred on (x, y), `w` wide. */
export const Breastwork: React.FC<{x: number; y: number; w?: number}> = ({x, y, w = 600}) => (
  <g transform={`translate(${x} ${y})`}>
    {Array.from({length: Math.round(w / 46)}, (_, i) => {
      const bx = -w / 2 + i * 46 + rnd(i + 80) * 10;
      const h = 30 + rnd(i + 81) * 30;
      const kind = Math.floor(rnd(i + 82) * 3);
      return kind === 0 ? (
        <rect key={i} x={bx} y={-h} width={50} height={h} fill="#7A5A3A" stroke="#4A3422" strokeWidth={3} />
      ) : kind === 1 ? (
        <path key={i} d={`M ${bx} 0 Q ${bx + 25} ${-h - 14} ${bx + 52} 0 Z`} fill="#8F6E46" />
      ) : (
        <ellipse key={i} cx={bx + 26} cy={-h / 2} rx={28} ry={h / 2} fill="#C6B892" />
      );
    })}
  </g>
);

export const Campfire: React.FC<{x: number; y: number; frame?: number; s?: number}> = ({x, y, frame: frameProp, s = 1}) => {
  const now = useCurrentFrame();
  const frame = frameProp ?? now;
  return (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -30 0 L 30 -10 M -30 -10 L 30 0" stroke="#4A3422" strokeWidth={9} strokeLinecap="round" />
    {[0, 1, 2].map((k) => {
      const f = Math.sin(frame / 3 + k * 2) * 6;
      return <path key={k} d={`M ${-18 + k * 12} -6 Q ${-14 + k * 12 + f} -40 ${-6 + k * 12} -${46 + k * 6} Q ${4 + k * 12} -28 ${6 + k * 12} -6 Z`} fill={k === 1 ? "#FFD36B" : "#FF8A3D"} opacity={0.9} />;
    })}
    <Smoke x={0} y={-50} frame={frame} n={5} />
  </g>
);
};

/** Smoke rising and drifting right with the wind. Looping, seed-free. */
export const Smoke: React.FC<{x: number; y: number; frame?: number; n?: number; scale?: number; tone?: string; speed?: number}> = ({x, y, frame: frameProp, n = 6, scale = 1, tone = "#D8D4CC", speed = 1}) => {
  const now = useCurrentFrame();
  const frame = frameProp ?? now;
  return (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {Array.from({length: n}, (_, i) => {
      const p = ((frame * 0.012 * speed + i / n) % 1 + 1) % 1;
      return <circle key={i} cx={p * 90 + Math.sin(i + frame / 20) * 10} cy={-p * 220} r={14 + p * 46} fill={tone} opacity={(1 - p) * 0.45} />;
    })}
  </g>
);
};

/**
 * A flag on a pole, three vertical bands and an optional round emblem on the
 * middle band; it ripples with the frame. `lower` 0–1 lowers it down the pole.
 */
export const Flag: React.FC<{
  x: number;
  y: number;
  bands: readonly [string, string, string];
  emblem?: string;
  lower?: number;
  s?: number;
  frame?: number;
}> = ({x, y, bands, emblem, lower = 0, s = 1, frame: frameProp}) => {
  const now = useCurrentFrame();
  const frame = frameProp ?? now;
  const top = -300 + lower * 230;
  const wave = (k: number) => Math.sin(frame / 8 + k) * 6;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <line x1={0} y1={0} x2={0} y2={-310} stroke="#5B4630" strokeWidth={7} />
      {bands.map((fill, i) => (
        <path
          key={i}
          d={`M ${i * 46} ${top + wave(i)} Q ${i * 46 + 23} ${top - 6 + wave(i + 0.5)} ${(i + 1) * 46} ${top + wave(i + 1)} L ${(i + 1) * 46} ${top + 92 + wave(i + 1)} Q ${i * 46 + 23} ${top + 86 + wave(i + 0.5)} ${i * 46} ${top + 92 + wave(i)} Z`}
          fill={fill}
        />
      ))}
      {emblem ? <circle cx={69} cy={top + 46 + wave(1.5)} r={13} fill={emblem} /> : null}
    </g>
  );
};

/** Three z's floating up over a sleeper. */
export const Zzz: React.FC<{x: number; y: number; frame?: number; on?: number}> = ({x, y, frame: frameProp, on = 1}) => {
  const now = useCurrentFrame();
  const frame = frameProp ?? now;
  return (
  <g opacity={on}>
    {[0, 1, 2].map((k) => {
      const p = ((frame / 60 + k / 3) % 1 + 1) % 1;
      return (
        <text key={k} x={x + p * 60} y={y - p * 110} fontSize={30 + p * 26} fontWeight={900} fill="#F4F1E4" opacity={Math.sin(p * Math.PI)} fontFamily="sans-serif" style={{paintOrder: "stroke"}} stroke="#04121A" strokeWidth={6}>
          z
        </text>
      );
    })}
  </g>
);
};

/** A sealed letter; animate x, y, r to send it flying. */
export const Letter: React.FC<{x: number; y: number; r?: number; s?: number}> = ({x, y, r = 0, s = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    <rect x={-60} y={-40} width={120} height={80} fill="#F3EAD2" stroke="#A8996F" strokeWidth={3} />
    {[-20, -4, 12].map((ly) => (
      <line key={ly} x1={-44} y1={ly} x2={40} y2={ly} stroke="#6A5D44" strokeWidth={3} />
    ))}
    <circle cx={38} cy={26} r={9} fill="#B23A2E" />
  </g>
);
