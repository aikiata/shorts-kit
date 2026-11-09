/**
 * Props on the grassland. Each one is drawn around its root (x, y), the point that touches the ground, and returns
 * a `<g>` to place together in one svg that carries the sky colour filter.
 */
import React from "react";
import {rnd} from "./kit";

/** Live oak with hanging moss: root at (x, y), about 520 * s tall. */
export const Oak: React.FC<{x: number; y: number; s?: number; frame: number; seed?: number}> = ({x, y, s = 1, frame, seed = 0}) => (
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
    {/* Spanish moss hanging down */}
    {Array.from({length: 16}, (_, i) => {
      const mx = -240 + rnd(i + seed + 60) * 480;
      const my = -290 + rnd(i + seed + 61) * 50;
      const len = 50 + rnd(i + seed + 62) * 70;
      const sw = Math.sin(frame / 30 + i) * 6;
      return <path key={`m${i}`} d={`M ${mx} ${my} q ${sw} ${len / 2} ${sw * 0.6} ${len}`} stroke="#9AA58A" strokeWidth={5} fill="none" opacity={0.75} strokeLinecap="round" />;
    })}
  </g>
);

/** Shade under the tree canopy. */
export const Shade: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => <ellipse cx={x} cy={y + 6} rx={300 * s} ry={34 * s} fill="#000" opacity={0.25} />;

export const Tent: React.FC<{x: number; y: number; s?: number; shade?: string}> = ({x, y, s = 1, shade = "#B9B2A0"}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -90 0 L 0 -110 L 90 0 Z" fill="#E9E4D6" />
    <path d="M 0 -110 L 90 0 L 30 0 Z" fill={shade} />
    <path d="M -12 0 L 0 -60 L 12 0 Z" fill="#5B5446" />
    <line x1={0} y1={-110} x2={0} y2={-126} stroke="#5B4630" strokeWidth={4} />
  </g>
);

/** Breastwork piled from crates, saddles, baggage sacks. */
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

export const Campfire: React.FC<{x: number; y: number; frame: number; s?: number}> = ({x, y, frame, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -30 0 L 30 -10 M -30 -10 L 30 0" stroke="#4A3422" strokeWidth={9} strokeLinecap="round" />
    {[0, 1, 2].map((k) => {
      const f = Math.sin(frame / 3 + k * 2) * 6;
      return <path key={k} d={`M ${-18 + k * 12} -6 Q ${-14 + k * 12 + f} -40 ${-6 + k * 12} -${46 + k * 6} Q ${4 + k * 12} -28 ${6 + k * 12} -6 Z`} fill={k === 1 ? "#FFD36B" : "#FF8A3D"} opacity={0.9} />;
    })}
    <Smoke x={0} y={-50} frame={frame} n={5} />
  </g>
);

/** Smoke rising, curling to the right with the wind. */
export const Smoke: React.FC<{x: number; y: number; frame: number; n?: number; scale?: number; tone?: string; speed?: number}> = ({x, y, frame, n = 6, scale = 1, tone = "#D8D4CC", speed = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {Array.from({length: n}, (_, i) => {
      const p = ((frame * 0.012 * speed + i / n) % 1 + 1) % 1;
      return <circle key={i} cx={p * 90 + Math.sin(i + frame / 20) * 10} cy={-p * 220} r={14 + p * 46} fill={tone} opacity={(1 - p) * 0.45} />;
    })}
  </g>
);

/** Mexican flag of 1836 (three vertical bands) or the rebels' flag. `lower` lowers the flag 0..1. */
export const Flag: React.FC<{x: number; y: number; frame: number; kind: "mx" | "texas"; lower?: number; s?: number}> = ({x, y, frame, kind, lower = 0, s = 1}) => {
  const top = -300 + lower * 230;
  const wave = (k: number) => Math.sin(frame / 8 + k) * 6;
  const band = (i: number, fill: string) => (
    <path
      key={i}
      d={`M ${i * 46} ${top + wave(i)} Q ${i * 46 + 23} ${top - 6 + wave(i + 0.5)} ${(i + 1) * 46} ${top + wave(i + 1)} L ${(i + 1) * 46} ${top + 92 + wave(i + 1)} Q ${i * 46 + 23} ${top + 86 + wave(i + 0.5)} ${i * 46} ${top + 92 + wave(i)} Z`}
      fill={fill}
    />
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <line x1={0} y1={0} x2={0} y2={-310} stroke="#5B4630" strokeWidth={7} />
      {kind === "mx" ? (
        <>
          {band(0, "#1F7A45")}
          {band(1, "#F4F1E8")}
          {band(2, "#C8363A")}
          <circle cx={69} cy={top + 46 + wave(1.5)} r={13} fill="#8A6A2E" />
        </>
      ) : (
        <>
          {band(0, "#1E4FA0")}
          {band(1, "#F4F1E8")}
          {band(2, "#F4F1E8")}
          <path d={`M 23 ${top + 30} l 6 14 l 15 0 l -12 9 l 5 15 l -14 -9 l -14 9 l 5 -15 l -12 -9 l 15 0 Z`} fill="#F4F1E8" />
        </>
      )}
    </g>
  );
};

/** Settlers' covered wagon. */
export const Wagon: React.FC<{x: number; y: number; s?: number; frame: number}> = ({x, y, s = 1, frame}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -120 -60 Q -110 -170 0 -175 Q 110 -170 120 -60 Z" fill="#EDE6D2" stroke="#B9AE90" strokeWidth={4} />
    {[-60, 0, 60].map((rx) => (
      <path key={rx} d={`M ${rx} -60 Q ${rx} -150 ${rx * 0.9} -172`} stroke="#C9BFA3" strokeWidth={3} fill="none" />
    ))}
    <rect x={-130} y={-70} width={260} height={34} fill="#7A5A3A" />
    {[-85, 85].map((wx) => (
      <g key={wx} transform={`translate(${wx} -26) rotate(${(frame * 4) % 360})`}>
        <circle r={30} fill="none" stroke="#4A3422" strokeWidth={6} />
        {[0, 45, 90, 135].map((a) => (
          <line key={a} x1={-28 * Math.cos((a * Math.PI) / 180)} y1={-28 * Math.sin((a * Math.PI) / 180)} x2={28 * Math.cos((a * Math.PI) / 180)} y2={28 * Math.sin((a * Math.PI) / 180)} stroke="#4A3422" strokeWidth={3} />
        ))}
      </g>
    ))}
    {/* the horse pulling in front */}
    <g transform="translate(200 0)">
      <path d="M -50 -64 Q 0 -86 50 -66 L 70 -100 Q 84 -104 92 -92 L 74 -56 Q 60 -44 44 -46 L -46 -44 Z" fill="#6B4A30" />
      {[-40, -20, 30, 46].map((lx, i) => (
        <line key={lx} x1={lx} y1={-46} x2={lx + Math.sin(frame / 4 + i * 1.6) * 10} y2={0} stroke="#4E3420" strokeWidth={8} strokeLinecap="round" />
      ))}
    </g>
  </g>
);

/** Flat-roofed mud-brick (adobe) house. */
export const Adobe: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-80} y={-90} width={160} height={90} fill="#C9A77C" />
    <rect x={-86} y={-98} width={172} height={12} fill="#A98A62" />
    <rect x={-20} y={-56} width={34} height={56} fill="#5B4632" />
    <rect x={34} y={-66} width={26} height={22} fill="#5B4632" />
  </g>
);

/** Field cannon. `fire` > 0 means firing (muzzle flash + smoke). */
export const Cannon: React.FC<{x: number; y: number; s?: number; fire: number; frame: number}> = ({x, y, s = 1, fire, frame}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -70 -40 L 80 -60 L 82 -44 L -66 -24 Z" fill="#2E2F33" />
    <circle cx={-10} cy={-30} r={34} fill="none" stroke="#5B4630" strokeWidth={8} />
    {[0, 60, 120].map((a) => (
      <line key={a} x1={-10 - 30 * Math.cos((a * Math.PI) / 180)} y1={-30 - 30 * Math.sin((a * Math.PI) / 180)} x2={-10 + 30 * Math.cos((a * Math.PI) / 180)} y2={-30 + 30 * Math.sin((a * Math.PI) / 180)} stroke="#5B4630" strokeWidth={4} />
    ))}
    <path d="M -40 -20 L -120 0" stroke="#5B4630" strokeWidth={10} strokeLinecap="round" />
    {fire > 0 ? (
      <g opacity={fire}>
        <path d="M 82 -52 L 150 -90 L 136 -60 L 176 -56 L 136 -44 L 150 -16 Z" fill="#FFD36B" />
        <circle cx={120} cy={-52} r={60 + (1 - fire) * 80} fill="#EDE9E2" opacity={0.55} />
      </g>
    ) : null}
  </g>
);

/** Wooden bridge over a creek. `burn` 0..1: fire and the bridge breaking. */
export const Bridge: React.FC<{x: number; y: number; burn: number; frame: number}> = ({x, y, burn, frame}) => (
  <g transform={`translate(${x} ${y})`}>
    {/* the creek */}
    <path d="M -420 40 Q -200 10 0 36 T 420 30 L 420 130 Q 200 150 0 128 T -420 132 Z" fill="#2F4D5A" />
    {Array.from({length: 10}, (_, i) => (
      <rect key={i} x={-380 + i * 80 + ((frame * 1.2) % 80)} y={60 + (i % 3) * 22} width={40} height={3} rx={2} fill="#9CC1DE" opacity={0.25} />
    ))}
    {/* bridge deck: two spans, the middle span collapses when it burns */}
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

export const Bush: React.FC<{x: number; y: number; s?: number; tone?: string}> = ({x, y, s = 1, tone = "#3B5228"}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[[-60, -30, 60], [0, -50, 72], [60, -28, 58], [-20, -70, 50], [34, -74, 46]].map(([cx, cy, r], i) => (
      <ellipse key={i} cx={cx} cy={cy} rx={r} ry={r * 0.75} fill={i % 2 ? tone : "#2C4020"} />
    ))}
  </g>
);

/** Three z letters rising above a sleeping person. */
export const Zzz: React.FC<{x: number; y: number; frame: number; on?: number}> = ({x, y, frame, on = 1}) => (
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

/** A letter flying across the frame. */
export const Letter: React.FC<{x: number; y: number; r?: number; s?: number}> = ({x, y, r = 0, s = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    <rect x={-60} y={-40} width={120} height={80} fill="#F3EAD2" stroke="#A8996F" strokeWidth={3} />
    {[-20, -4, 12].map((ly) => (
      <line key={ly} x1={-44} y1={ly} x2={40} y2={ly} stroke="#6A5D44" strokeWidth={3} />
    ))}
    <circle cx={38} cy={26} r={9} fill="#B23A2E" />
  </g>
);
