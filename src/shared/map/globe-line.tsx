/**
 * Lines and moving dots ON the sphere: routes, flights, borders.
 *
 * Two things are handled here so a scene does not have to:
 *  - **The far side.** Points behind the limb are dropped and the line is cut
 *    into runs; joining across them would slice straight through the disc.
 *  - **Draw-on by ground distance.** Progress is measured along the line on the
 *    sphere, not in screen pixels, so the draw speed does not change as the
 *    globe turns, and `GlobeTravel` with the same `t` sits exactly on the head.
 */
import React, {useId} from "react";
import {svgId} from "../random";
import {DEFAULT_PALETTE, H, W, type Palette} from "../theme";
import {project, toLonLat, toVec, type GlobeView, type GlobeLonLat} from "./globe";

export type {GlobeLonLat};

const R2D = 180 / Math.PI;

/** Angle between two points, radians. */
const arc = (a: GlobeLonLat, b: GlobeLonLat) => {
  const va = toVec(a[0], a[1]);
  const vb = toVec(b[0], b[1]);
  return Math.acos(Math.max(-1, Math.min(1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2])));
};

/** Point k (0..1) along the great circle from a to b; longitude kept continuous with a. */
export const slerp = (a: GlobeLonLat, b: GlobeLonLat, k: number): [number, number] => {
  const p = toVec(a[0], a[1]);
  const q = toVec(b[0], b[1]);
  const w = arc(a, b);
  const s1 = w < 1e-9 ? 1 - k : Math.sin((1 - k) * w) / Math.sin(w);
  const s2 = w < 1e-9 ? k : Math.sin(k * w) / Math.sin(w);
  let [lon, lat] = toLonLat([s1 * p[0] + s2 * q[0], s1 * p[1] + s2 * q[1], s1 * p[2] + s2 * q[2]]);
  while (lon - a[0] > 180) lon -= 360;
  while (lon - a[0] < -180) lon += 360;
  return [lon, lat];
};

/** `steps + 1` points on the great circle from a to b (the shortest path on the ground). */
export const globeArc = (a: GlobeLonLat, b: GlobeLonLat, steps = 64): [number, number][] =>
  Array.from({length: steps + 1}, (_, i) => slerp(a, b, i / steps));

/**
 * Densify a polyline so every segment is at most `maxDeg` degrees long.
 * `geodesic` follows great circles between vertices; otherwise lon/lat is
 * interpolated linearly (a straight line on a flat map).
 */
export const densify = (points: readonly GlobeLonLat[], {geodesic = true, maxDeg = 1.5}: {geodesic?: boolean; maxDeg?: number} = {}): [number, number][] => {
  if (points.length < 2) return points.map((p) => [p[0], p[1]]);
  const out: [number, number][] = [[points[0][0], points[0][1]]];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const n = Math.max(1, Math.ceil((arc(a, b) * R2D) / maxDeg));
    for (let k = 1; k <= n; k++) {
      out.push(geodesic ? slerp(a, b, k / n) : [a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
    }
  }
  return out;
};

/** Cumulative ground distance (radians) at each vertex of a polyline. */
const cumulative = (points: readonly GlobeLonLat[]) => {
  const acc = [0];
  for (let i = 1; i < points.length; i++) acc.push(acc[i - 1] + arc(points[i - 1], points[i]));
  return acc;
};

/** The polyline cut at fraction `t` (0..1) of its ground length, ending exactly at the cut. */
export const cutLine = (points: readonly GlobeLonLat[], t: number): [number, number][] => {
  if (points.length < 2) return points.map((p) => [p[0], p[1]]);
  const acc = cumulative(points);
  const want = Math.max(0, Math.min(1, t)) * acc[acc.length - 1];
  const out: [number, number][] = [[points[0][0], points[0][1]]];
  for (let i = 1; i < points.length; i++) {
    if (acc[i] <= want) {
      out.push([points[i][0], points[i][1]]);
      continue;
    }
    const seg = acc[i] - acc[i - 1];
    out.push(slerp(points[i - 1], points[i], seg > 0 ? (want - acc[i - 1]) / seg : 0));
    break;
  }
  return out;
};

/** The point at fraction `t` (0..1) of a polyline's ground length. */
export const pointAlong = (points: readonly GlobeLonLat[], t: number): [number, number] => {
  const cut = cutLine(points, t);
  return cut[cut.length - 1];
};

/** Project a lon/lat polyline into screen-space runs, split where it goes behind the limb. */
const runsOf = (lines: readonly (readonly GlobeLonLat[])[], view: GlobeView, width: number, height: number) => {
  const runs: string[][] = [];
  for (const line of lines) {
    let run: string[] = [];
    for (const [lon, lat] of line) {
      const q = project(lon, lat, view, width, height);
      if (q.front <= 0) {
        if (run.length > 1) runs.push(run);
        run = [];
        continue;
      }
      run.push(`${q.x.toFixed(1)},${q.y.toFixed(1)}`);
    }
    if (run.length > 1) runs.push(run);
  }
  return runs;
};

/**
 * A line on the globe with draw-on. `points` is a polyline of [lon, lat]; two
 * points give a great-circle arc. Each segment follows a great circle
 * (`geodesic`, default) or a straight lon/lat line, densified so long
 * segments curve with the sphere.
 */
export const GlobeLine: React.FC<{
  points: readonly GlobeLonLat[];
  view: GlobeView;
  width?: number;
  height?: number;
  /** 0..1: how much is drawn, by ground distance. */
  progress?: number;
  /** Great circles between vertices (default) or straight lon/lat lines. */
  geodesic?: boolean;
  tone?: string;
  strokeWidth?: number;
  opacity?: number;
  glow?: boolean;
  /** SVG dash pattern, e.g. "14 10". */
  dash?: string;
  palette?: Palette;
}> = ({points, view, width = W, height = H, progress = 1, geodesic = true, tone, strokeWidth = 6, opacity = 1, glow = true, dash, palette = DEFAULT_PALETTE}) => {
  const id = svgId(useId(), "globe-line");
  const p = Math.max(0, Math.min(1, progress));
  if (opacity <= 0.004 || p <= 0.001 || points.length < 2) return null;
  const shown = cutLine(densify(points, {geodesic}), p);
  const runs = runsOf([shown], view, width, height);
  if (!runs.length) return null;
  const color = tone ?? palette.accent;
  return (
    <svg width={width} height={height} style={{position: "absolute", inset: 0, opacity, pointerEvents: "none"}}>
      <defs>
        <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={strokeWidth * 1.5} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={runs.map((r) => `M${r.join("L")}`).join("")}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dash}
        filter={glow ? `url(#${id})` : undefined}
      />
    </svg>
  );
};

/**
 * Many lon/lat polylines (country borders, coasts, graticule) in ONE path,
 * without glow: thousands of segments would otherwise mean thousands of
 * blur filters per frame. Still cut at the limb.
 */
export const GlobeBorders: React.FC<{
  lines: readonly (readonly GlobeLonLat[])[];
  view: GlobeView;
  width?: number;
  height?: number;
  tone?: string;
  strokeWidth?: number;
  opacity?: number;
  dash?: string;
  palette?: Palette;
}> = ({lines, view, width = W, height = H, tone, strokeWidth = 2, opacity = 1, dash, palette = DEFAULT_PALETTE}) => {
  if (opacity <= 0.004) return null;
  const runs = runsOf(lines, view, width, height);
  if (!runs.length) return null;
  return (
    <svg width={width} height={height} style={{position: "absolute", inset: 0, opacity, pointerEvents: "none"}}>
      <path
        d={runs.map((r) => `M${r.join("L")}`).join("")}
        fill="none"
        stroke={tone ?? palette.muted}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dash}
      />
    </svg>
  );
};

/** Meridians and parallels every `step` degrees, as lines for `GlobeBorders`. */
export const graticule = (step = 30): [number, number][][] => {
  const lines: [number, number][][] = [];
  for (let lon = -180; lon < 180; lon += step) lines.push(Array.from({length: 61}, (_, i) => [lon, -90 + i * 3]));
  for (let lat = -90 + step; lat < 90; lat += step) lines.push(Array.from({length: 121}, (_, i) => [-180 + i * 3, lat]));
  return lines;
};

/**
 * A glowing dot travelling along a polyline on the sphere. Feed it the same
 * `points`, `geodesic` and `t` as a GlobeLine's `progress` and it rides the
 * line's head.
 */
export const GlobeTravel: React.FC<{
  points: readonly GlobeLonLat[];
  view: GlobeView;
  width?: number;
  height?: number;
  /** 0..1 position along the line, by ground distance. */
  t: number;
  geodesic?: boolean;
  tone?: string;
  /** Dot radius, px. */
  size?: number;
  opacity?: number;
  palette?: Palette;
}> = ({points, view, width = W, height = H, t, geodesic = true, tone, size = 11, opacity = 1, palette = DEFAULT_PALETTE}) => {
  if (points.length < 2 || opacity <= 0.004) return null;
  const [lon, lat] = pointAlong(densify(points, {geodesic}), t);
  const q = project(lon, lat, view, width, height);
  if (q.front <= 0) return null;
  const color = tone ?? palette.warn;
  return (
    <div
      style={{
        position: "absolute",
        left: q.x - size,
        top: q.y - size,
        width: size * 2,
        height: size * 2,
        borderRadius: size,
        background: color,
        opacity: opacity * q.front,
        boxShadow: `0 0 ${size * 2.4}px ${color}, 0 0 ${size * 5}px ${color}88`,
        pointerEvents: "none",
      }}
    />
  );
};
