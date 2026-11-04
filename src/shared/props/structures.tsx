import React from "react";
import {useCurrentFrame} from "remotion";
import {rnd} from "../random";
import {Smoke} from "./camp";

/** Buildings and crossings: an adobe house and a wooden bridge that can burn. */

/** A flat-roofed adobe house. */
export const Adobe: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-80} y={-90} width={160} height={90} fill="#C9A77C" />
    <rect x={-86} y={-98} width={172} height={12} fill="#A98A62" />
    <rect x={-20} y={-56} width={34} height={56} fill="#5B4632" />
    <rect x={34} y={-66} width={26} height={22} fill="#5B4632" />
  </g>
);

/** A wooden bridge over a creek. `burn` 0–1: flames, then the middle span drops. */
export const Bridge: React.FC<{x: number; y: number; burn: number; frame?: number}> = ({x, y, burn, frame: frameProp}) => {
  const now = useCurrentFrame();
  const frame = frameProp ?? now;
  return (
  <g transform={`translate(${x} ${y})`}>
    {/* the creek */}
    <path d="M -420 40 Q -200 10 0 36 T 420 30 L 420 130 Q 200 150 0 128 T -420 132 Z" fill="#2F4D5A" />
    {Array.from({length: 10}, (_, i) => (
      <rect key={i} x={-380 + i * 80 + ((frame * 1.2) % 80)} y={60 + (i % 3) * 22} width={40} height={3} rx={2} fill="#9CC1DE" opacity={0.25} />
    ))}
    {/* deck: two side spans, the middle one falls as it burns */}
    <rect x={-260} y={-14} width={200} height={20} fill="#6B4A30" />
    <rect x={60} y={-14} width={200} height={20} fill="#6B4A30" />
    <g transform={`translate(0 ${burn * 60}) rotate(${burn * 18})`}>
      <rect x={-60} y={-14} width={120} height={20} fill={burn > 0.4 ? "#2A1E16" : "#6B4A30"} />
    </g>
    {[-240, -80, 80, 240].map((px) => (
      <rect key={px} x={px - 8} y={-10} width={16} height={110} fill="#4E3420" />
    ))}
    {burn > 0 ? (
      <g opacity={Math.min(1, burn * 2)}>
        {Array.from({length: 9}, (_, i) => {
          const fx = -120 + i * 30;
          const f = Math.sin(frame / 3 + i * 1.7) * 10;
          const h = 60 + rnd(i + 5) * 70;
          return <path key={i} d={`M ${fx - 16} -10 Q ${fx + f} ${-h} ${fx + 4} ${-h - 20} Q ${fx + 14} ${-h / 2} ${fx + 18} -10 Z`} fill={i % 2 ? "#FFB347" : "#FF6A2A"} />;
        })}
        <Smoke x={-20} y={-80} frame={frame} n={7} scale={1.6} tone="#4A4440" />
      </g>
    ) : null}
  </g>
);
};
