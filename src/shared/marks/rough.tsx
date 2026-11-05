import React from "react";
import {H, W} from "../theme";
import {rnd} from "../random";

/**
 * Hand-drawn strokes for marks drawn ONTO the subject (§5: "graphics are
 * drawn onto the subject, not floated as cards"). Coordinates are frame
 * pixels (1080×1920). Every jitter is seeded, so each render draws the same.
 */
export type Pt = [number, number];

/** A smooth SVG path through points (Catmull-Rom → cubic Bézier). */
export const smoothPath = (pts: Pt[]) => {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
};

/** A straight-ish stroke from a to b with a slight hand wobble. */
export const wobbleLine = (a: Pt, b: Pt, seed: number, wobble = 6, steps = 6): Pt[] => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  return Array.from({length: steps + 1}, (_, i) => {
    const t = i / steps;
    const off = i === 0 || i === steps ? 0 : (rnd(seed + i * 3.1) - 0.5) * 2 * wobble;
    return [a[0] + dx * t + nx * off, a[1] + dy * t + ny * off] as Pt;
  });
};

/** A full-frame SVG layer for marks. */
export const MarkLayer: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: "absolute", left: 0, top: 0, pointerEvents: "none", overflow: "visible", ...style}}>
    {children}
  </svg>
);

/**
 * A stroke that draws itself on: `k` 0 → 1. Uses `pathLength` so the dash
 * maths does not depend on the path's real length.
 */
export const DrawPath: React.FC<{d: string; k: number; color: string; width: number; opacity?: number}> = ({d, k, color, width, opacity = 1}) => (
  <path
    d={d}
    pathLength={1}
    fill="none"
    stroke={color}
    strokeWidth={width}
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeDasharray="1 1"
    strokeDashoffset={1 - k}
    opacity={k > 0 ? opacity : 0}
    style={{filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.45))"}}
  />
);
