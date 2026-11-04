import React from "react";
import {useCurrentFrame} from "remotion";
import {rnd} from "../random";

/**
 * Trees and bushes for land scenes. Each draws around its ground point (x, y)
 * and returns a `<g>`: put several in one `<svg>` with a grade filter.
 */

/** A live oak with hanging moss: trunk base at (x, y), about 520 * s tall. Vary `seed` per tree. */
export const Oak: React.FC<{x: number; y: number; s?: number; frame?: number; seed?: number}> = ({x, y, s = 1, frame: frameProp, seed = 0}) => {
  const now = useCurrentFrame();
  const frame = frameProp ?? now;
  return (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -34 0 Q -26 -150 -40 -260 Q -90 -300 -190 -320 L -186 -334 Q -80 -320 -22 -290 Q -6 -360 30 -400 L 44 -390 Q 20 -340 22 -290 Q 90 -330 200 -330 L 202 -316 Q 100 -300 30 -250 Q 26 -140 40 0 Z" fill="#4A3A2A" />
    {Array.from({length: 14}, (_, i) => {
      const a = (i / 14) * Math.PI;
      const cx = Math.cos(a) * -250 + (rnd(i + seed) - 0.5) * 60;
      const cy = -330 - Math.sin(a) * 150 + (rnd(i + seed + 9) - 0.5) * 40;
      const r = 90 + rnd(i + seed + 3) * 60;
      return <ellipse key={i} cx={cx} cy={cy} rx={r} ry={r * 0.62} fill={i % 3 ? "#3C5A2C" : "#30491F"} />;
    })}
    {Array.from({length: 9}, (_, i) => {
      const cx = -220 + i * 55 + (rnd(i + seed + 40) - 0.5) * 30;
      const cy = -390 + rnd(i + seed + 41) * 80;
      return <ellipse key={`h${i}`} cx={cx} cy={cy} rx={60} ry={34} fill="#56763A" opacity={0.7} />;
    })}
    {/* Spanish moss hanging from the branches */}
    {Array.from({length: 16}, (_, i) => {
      const mx = -240 + rnd(i + seed + 60) * 480;
      const my = -290 + rnd(i + seed + 61) * 50;
      const len = 50 + rnd(i + seed + 62) * 70;
      const sw = Math.sin(frame / 30 + i) * 6;
      return <path key={`m${i}`} d={`M ${mx} ${my} q ${sw} ${len / 2} ${sw * 0.6} ${len}`} stroke="#9AA58A" strokeWidth={5} fill="none" opacity={0.75} strokeLinecap="round" />;
    })}
  </g>
  );
};

/** Soft shade under a tree canopy, centred on (x, y). */
export const Shade: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => <ellipse cx={x} cy={y + 6} rx={300 * s} ry={34 * s} fill="#000" opacity={0.25} />;

export const Bush: React.FC<{x: number; y: number; s?: number; tone?: string}> = ({x, y, s = 1, tone = "#3B5228"}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[[-60, -30, 60], [0, -50, 72], [60, -28, 58], [-20, -70, 50], [34, -74, 46]].map(([cx, cy, r], i) => (
      <ellipse key={i} cx={cx} cy={cy} rx={r} ry={r * 0.75} fill={i % 2 ? tone : "#2C4020"} />
    ))}
  </g>
);

