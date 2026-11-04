/**
 * A route along `[lon, lat]` points, drawn on inside a `<SatelliteMap>`.
 *
 * The visible part is cut at the exact length `progress` asks for (not faked
 * with a dash offset), so a dashed route stays dashed while it draws and the
 * head dot sits on the tip. `greatCircle` bends long legs along the shortest
 * path on the sphere, which is how flights and sea lanes look on a Mercator map.
 */
import React from "react";
import {greatCirclePath, type LonLat, toWorld, type XY} from "./mercator";
import {useMapView} from "./SatelliteMap";

/** World-unit polyline and its cumulative lengths. */
export const routeGeometry = (points: readonly LonLat[], greatCircle = false, degPerStep = 0.5) => {
  const ll = greatCircle ? greatCirclePath(points, degPerStep) : [...points];
  const xy = ll.map(toWorld);
  const cum = [0];
  for (let i = 1; i < xy.length; i++) cum.push(cum[i - 1] + Math.hypot(xy[i][0] - xy[i - 1][0], xy[i][1] - xy[i - 1][1]));
  return {xy, cum, length: cum[cum.length - 1] ?? 0};
};

/** The part of a polyline from its start to fraction `p` of its length, and the tip point and heading (degrees). */
export const cutAt = ({xy, cum, length}: ReturnType<typeof routeGeometry>, p: number) => {
  const k = Math.max(0, Math.min(1, p));
  const target = k * length;
  if (xy.length < 2) return {pts: xy, tip: xy[0] ?? ([0, 0] as XY), heading: 0};
  let i = 1;
  while (i < xy.length - 1 && cum[i] < target) i++;
  const seg = cum[i] - cum[i - 1] || 1;
  const t = Math.max(0, Math.min(1, (target - cum[i - 1]) / seg));
  const a = xy[i - 1];
  const b = xy[i];
  const tip: XY = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const heading = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  return {pts: [...xy.slice(0, i), tip], tip, heading};
};

const d = (pts: readonly XY[]) => (pts.length ? "M" + pts.map((p) => `${p[0].toFixed(3)},${p[1].toFixed(3)}`).join("L") : "");

export const Route: React.FC<{
  /** The route, `[lon, lat]` in order. */
  points: readonly LonLat[];
  /** 0–1 how much of the route is drawn. Default 1. */
  progress?: number;
  /** Line colour. Default `palette.accent`. */
  color?: string;
  /** Line width, canvas px. */
  width?: number;
  /** `true` for a default dash, or `[on, off]` in canvas px. */
  dashed?: boolean | readonly [number, number];
  /** Bend each leg along the great circle (long distances). */
  greatCircle?: boolean;
  /** Dot at the tip while drawing: `true`, or its radius px and colour. */
  head?: boolean | {r?: number; color?: string};
  /** Arrowhead at the tip instead of (or with) the dot. */
  arrow?: boolean;
  /** Faint full route under the drawn part, 0–1 opacity. */
  ghost?: number;
  /** Dark under-stroke for legibility over imagery; `false` to turn off. */
  halo?: string | false;
  /** Glow radius px under the line. */
  glow?: number;
  /** Small dots on the start and end points. */
  ends?: boolean;
  opacity?: number;
}> = ({
  points,
  progress = 1,
  color,
  width = 6,
  dashed = false,
  greatCircle = false,
  head = false,
  arrow = false,
  ghost = 0,
  halo = "rgba(0,0,0,0.55)",
  glow = 0,
  ends = false,
  opacity = 1,
}) => {
  const {px, palette} = useMapView();
  if (opacity <= 0.001 || points.length < 2) return null;
  const c = color ?? palette.accent;
  const geo = routeGeometry(points, greatCircle);
  const {pts, tip, heading} = cutAt(geo, progress);
  const dash = dashed === true ? ([width * 2.6, width * 1.8] as const) : dashed || undefined;
  const dashAttr = dash ? `${px(dash[0])} ${px(dash[1])}` : undefined;
  const drawn = d(pts);
  const p = Math.max(0, Math.min(1, progress));
  const h = head === true ? {} : head || null;
  const r = px(h?.r ?? width * 1.5);
  const ah = px(width * 3.2);
  return (
    <g opacity={opacity} strokeLinecap="round" strokeLinejoin="round" fill="none">
      {ghost > 0 ? <path d={d(geo.xy)} stroke={c} strokeOpacity={ghost} strokeWidth={px(width * 0.6)} strokeDasharray={dashAttr} /> : null}
      {p > 0 && halo ? <path d={drawn} stroke={halo} strokeWidth={px(width + 5)} strokeDasharray={dashAttr} /> : null}
      {p > 0 ? (
        <path
          d={drawn}
          stroke={c}
          strokeWidth={px(width)}
          strokeDasharray={dashAttr}
          style={glow ? {filter: `drop-shadow(0 0 ${px(glow)}px ${c})`} : undefined}
        />
      ) : null}
      {ends ? (
        <>
          <circle cx={geo.xy[0][0]} cy={geo.xy[0][1]} r={px(width * 1.1)} fill={c} stroke="#000" strokeOpacity={0.6} strokeWidth={px(2)} />
          {p >= 0.999 ? (
            <circle cx={tip[0]} cy={tip[1]} r={px(width * 1.1)} fill={c} stroke="#000" strokeOpacity={0.6} strokeWidth={px(2)} />
          ) : null}
        </>
      ) : null}
      {arrow && p > 0.02 ? (
        <polygon
          points={`${ah * 0.6},0 ${-ah * 0.5},${ah * 0.55} ${-ah * 0.5},${-ah * 0.55}`}
          fill={c}
          stroke={halo || "none"}
          strokeWidth={px(2)}
          transform={`translate(${tip[0]} ${tip[1]}) rotate(${heading})`}
        />
      ) : null}
      {h && p > 0 && !arrow ? <circle cx={tip[0]} cy={tip[1]} r={r} fill={h.color ?? palette.text} stroke={c} strokeWidth={px(width * 0.6)} /> : null}
    </g>
  );
};
