/**
 * Annotations drawn inside a `<SatelliteMap>`, in world coordinates, so they
 * belong to the terrain and move with the camera instead of floating over it.
 * Points are `[lon, lat]`; sizes are canvas px and stay that size at any zoom.
 *
 * - `Measure`   double-headed dimension arrow with a label (default: the real distance)
 * - `Cross`     an X: "not here", "no bridge"
 * - `Ping`      pulsing dot for a place the narration just named
 * - `GhostSpan` a dashed span that never completes
 * - `Region`    a filled, outlined area
 * - `Pin`       dot + label; the label is kept inside the platform safe area
 */
import React from "react";
import {FONT, H, W} from "../theme";
import {SAFE_BOTTOM, SAFE_RIGHT_FROM_Y, SAFE_RIGHT_X, SAFE_TOP} from "../frame/SafeZones";
import {distanceKm, type LonLat, pathOf, screenToWorld, toWorld, worldToScreen, type XY} from "./mercator";
import {useMapView} from "./SatelliteMap";

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** `1234.5` → `"1,235 km"`; under 10 km keeps one decimal. */
export const formatKm = (km: number) => (km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km).toLocaleString("en-US")} km`);

/** Double-headed dimension arrow with a label. The label defaults to the great-circle distance. */
export const Measure: React.FC<{
  from: LonLat;
  to: LonLat;
  /** Default: `formatKm(distanceKm(from, to))`. */
  label?: string;
  /** 0–1 draws the arrow out from `from`. */
  progress?: number;
  color?: string;
  /** Label size, canvas px. */
  size?: number;
  /** Label offset from the line along its normal, canvas px (negative = other side). */
  offset?: number;
}> = ({from, to, label, progress = 1, color, size = 46, offset = 70}) => {
  const {px, palette} = useMapView();
  const p = clamp01(progress);
  if (p <= 0.02) return null;
  const tone = color ?? palette.text;
  const a = toWorld(from);
  const b = toWorld(to);
  const x2 = a[0] + (b[0] - a[0]) * p;
  const y2 = a[1] + (b[1] - a[1]) * p;
  const angle = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  const head = px(20);
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  // Push the label off the line along its normal, so a vertical measure does not print over itself.
  const nx = -((b[1] - a[1]) / len);
  const ny = (b[0] - a[0]) / len;
  const mx = (a[0] + b[0]) / 2 + nx * px(offset);
  const my = (a[1] + b[1]) / 2 + ny * px(offset) + px(size * 0.35);
  const arrow = (x: number, y: number, dir: number) => (
    <polygon points={`0,0 ${-head},${head * 0.42} ${-head},${-head * 0.42}`} fill={tone} transform={`translate(${x} ${y}) rotate(${dir})`} />
  );
  return (
    <g>
      <line x1={a[0]} y1={a[1]} x2={x2} y2={y2} stroke="#000" strokeOpacity={0.6} strokeWidth={px(10)} strokeLinecap="round" />
      <line x1={a[0]} y1={a[1]} x2={x2} y2={y2} stroke={tone} strokeWidth={px(5)} strokeLinecap="round" />
      {arrow(a[0], a[1], angle + 180)}
      {p > 0.98 ? arrow(b[0], b[1], angle) : null}
      <text
        x={mx}
        y={my}
        textAnchor="middle"
        fill={tone}
        fontFamily={FONT.sans}
        fontSize={px(size)}
        fontWeight={900}
        stroke="#000"
        strokeWidth={px(size * 0.16)}
        strokeLinejoin="round"
        paintOrder="stroke"
        opacity={clamp01((p - 0.55) / 0.3)}
      >
        {label ?? formatKm(distanceKm(from, to))}
      </text>
    </g>
  );
};

/** A red X. `scale` 0–1 grows it in (and fades it). */
export const Cross: React.FC<{at: LonLat; size?: number; scale?: number; color?: string}> = ({at, size = 46, scale = 1, color}) => {
  const {px, palette} = useMapView();
  if (scale <= 0.001) return null;
  const [x, y] = toWorld(at);
  const tone = color ?? palette.bad;
  const r = px(size) * scale;
  return (
    <g opacity={clamp01(scale)} strokeLinecap="round">
      {[1, -1].map((s) => (
        <g key={s}>
          <line x1={x - r} y1={y - r * s} x2={x + r} y2={y + r * s} stroke="#000" strokeOpacity={0.55} strokeWidth={px(17)} />
          <line x1={x - r} y1={y - r * s} x2={x + r} y2={y + r * s} stroke={tone} strokeWidth={px(11)} />
        </g>
      ))}
    </g>
  );
};

/**
 * Pulsing dot. `phase` 0–1 is the ring's progress: drive it from the frame,
 * e.g. `(frame % 45) / 45`, so the pulse is deterministic.
 */
export const Ping: React.FC<{at: LonLat; phase: number; color?: string; size?: number; opacity?: number}> = ({
  at,
  phase,
  color,
  size = 13,
  opacity = 1,
}) => {
  const {px, palette} = useMapView();
  if (opacity <= 0.001) return null;
  const [x, y] = toWorld(at);
  const tone = color ?? palette.text;
  const k = ((phase % 1) + 1) % 1;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={px(size) + px(34) * k} fill="none" stroke={tone} strokeWidth={px(3.5)} opacity={1 - k} />
      <circle cx={x} cy={y} r={px(size)} fill={tone} stroke="#000" strokeOpacity={0.7} strokeWidth={px(2.5)} />
    </g>
  );
};

/** A dashed span where something would have to go, drawn to `progress`; the far post appears only when it completes. */
export const GhostSpan: React.FC<{from: LonLat; to: LonLat; progress: number; color?: string; width?: number}> = ({
  from,
  to,
  progress,
  color,
  width = 15,
}) => {
  const {px, palette} = useMapView();
  const p = clamp01(progress);
  const tone = color ?? palette.warn;
  const a = toWorld(from);
  const b = toWorld(to);
  const angle = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  return (
    <g>
      {p > 0 ? (
        <line
          x1={a[0]}
          y1={a[1]}
          x2={a[0] + (b[0] - a[0]) * p}
          y2={a[1] + (b[1] - a[1]) * p}
          stroke={tone}
          strokeWidth={px(width)}
          strokeDasharray={`${px(width * 2.3)} ${px(width * 1.7)}`}
          strokeLinecap="round"
        />
      ) : null}
      {[a, b].map((e, i) => (
        <rect
          key={i}
          x={-px(11)}
          y={-px(22)}
          width={px(22)}
          height={px(44)}
          fill={tone}
          opacity={i === 0 || p > 0.96 ? 0.9 : 0}
          transform={`translate(${e[0]} ${e[1]}) rotate(${angle + 90})`}
        />
      ))}
    </g>
  );
};

/** A filled, outlined region. Give world-unit path data `d` (from geo.json or the bundled data) or a lon/lat `ring`. */
export const Region: React.FC<{
  d?: string | readonly string[];
  ring?: readonly LonLat[];
  opacity: number;
  color?: string;
  /** Fill opacity at full `opacity`. */
  fill?: number;
  /** Outline width, canvas px; 0 for none. */
  outline?: number;
  /** Dashed outline, for a region that is a location, not a legal boundary. */
  dashed?: boolean;
}> = ({d, ring, opacity, color, fill = 0.24, outline = 4, dashed = false}) => {
  const {px, palette} = useMapView();
  if (opacity <= 0.001) return null;
  const tone = color ?? palette.good;
  const paths = d === undefined ? (ring ? [pathOf(ring, true)] : []) : typeof d === "string" ? [d] : d;
  return (
    <g opacity={opacity}>
      {paths.map((s, i) => (
        <path key={`f${i}`} d={s} fill={tone} fillOpacity={fill} fillRule="evenodd" />
      ))}
      {outline > 0
        ? paths.map((s, i) => (
            <path
              key={`s${i}`}
              d={s}
              fill="none"
              stroke={tone}
              strokeWidth={px(outline)}
              strokeOpacity={0.95}
              strokeLinejoin="round"
              strokeDasharray={dashed ? `${px(outline * 3.5)} ${px(outline * 2.2)}` : undefined}
            />
          ))
        : null}
    </g>
  );
};

/** Canvas rectangle a label may occupy: inside the platform safe zones, with a small margin. */
export const LABEL_SAFE = {left: 40, top: SAFE_TOP + 16, right: W - 40, bottom: SAFE_BOTTOM - 16, railX: SAFE_RIGHT_X - 14, railFromY: SAFE_RIGHT_FROM_Y};

/** Rough rendered width of a label in a heavy sans face, px. Errs wide so clamping errs safe. */
export const labelWidth = (text: string, size: number) => {
  let em = 0;
  for (const ch of text) em += ch === " " ? 0.3 : ch === ch.toUpperCase() && ch !== ch.toLowerCase() ? 0.72 : /[0-9]/.test(ch) ? 0.62 : 0.58;
  return em * size;
};

/**
 * Move a canvas rect `[x, y, w, h]` the least distance that puts it inside the
 * safe area (clear of the top and bottom bands and the right rail).
 */
export const clampToSafe = ([x, y, w, h]: readonly [number, number, number, number]): [number, number, number, number] => {
  const s = LABEL_SAFE;
  let ny = Math.min(Math.max(y, s.top), s.bottom - h);
  const right = ny + h > s.railFromY ? s.railX : s.right;
  let nx = Math.min(Math.max(x, s.left), right - w);
  if (nx < s.left) nx = s.left; // wider than the space: pin to the left edge
  if (ny < s.top) ny = s.top;
  return [nx, ny, w, h];
};

export type PinSide = "auto" | "right" | "left" | "top" | "bottom";

/**
 * A place: anchor dot, label, and a leader line when the label had to move.
 * The label is laid out in canvas px and clamped into the safe area, so it
 * never slides under the platform UI however the camera moves.
 */
export const Pin: React.FC<{
  at: LonLat;
  label: string;
  /** Second, smaller line (an English name, a date). */
  sub?: string;
  side?: PinSide;
  /** Label size, canvas px. */
  size?: number;
  color?: string;
  /** Dot colour. Default `palette.accent`. */
  dotColor?: string;
  /** Dot radius px; 0 for a label-only (area) pin. */
  dot?: number;
  /** Gap between dot and label, px. */
  gap?: number;
  opacity?: number;
  /** Uppercase the label. */
  caps?: boolean;
}> = ({at, label, sub, side = "auto", size = 40, color, dotColor, dot = 11, gap = 18, opacity = 1, caps = false}) => {
  const {box, px, palette} = useMapView();
  if (opacity <= 0.001) return null;
  const text = caps ? label.toUpperCase() : label;
  const subSize = Math.round(size * 0.62);
  const w = Math.max(labelWidth(text, size), sub ? labelWidth(sub, subSize) : 0);
  const h = size * 1.05 + (sub ? subSize * 1.2 : 0);
  const wp = toWorld(at);
  const [sx, sy] = worldToScreen(box, wp);
  const s: Exclude<PinSide, "auto"> = side === "auto" ? (sx > W * 0.58 ? "left" : "right") : side;
  const want: [number, number, number, number] =
    s === "right"
      ? [sx + dot + gap, sy - h / 2, w, h]
      : s === "left"
        ? [sx - dot - gap - w, sy - h / 2, w, h]
        : s === "top"
          ? [sx - w / 2, sy - dot - gap - h, w, h]
          : [sx - w / 2, sy + dot + gap, w, h];
  const [lx, ly] = clampToSafe(want);
  const moved = Math.hypot(lx - want[0], ly - want[1]) > 6;
  const anchor = s === "left" ? "end" : s === "right" ? "start" : "middle";
  const tx = anchor === "end" ? lx + w : anchor === "start" ? lx : lx + w / 2;
  const toW = (p: XY) => screenToWorld(box, p);
  const [txw, tyw] = toW([tx, ly + size * 0.82]);
  const [, syw] = toW([0, ly + size * 1.05 + subSize * 0.95]);
  // Leader: from the dot to the nearest point of the label box.
  const near: XY = [Math.min(Math.max(sx, lx), lx + w), Math.min(Math.max(sy, ly), ly + h)];
  const nearW = toW(near);
  const tone = color ?? palette.text;
  const textProps = {
    textAnchor: anchor,
    fontFamily: FONT.sans,
    fill: tone,
    stroke: "#000",
    strokeLinejoin: "round",
    paintOrder: "stroke",
  } as const;
  const offscreen = sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50;
  return (
    <g opacity={opacity}>
      {moved && !offscreen ? (
        <line x1={wp[0]} y1={wp[1]} x2={nearW[0]} y2={nearW[1]} stroke={tone} strokeOpacity={0.85} strokeWidth={px(2.5)} style={{paintOrder: "stroke"}} />
      ) : null}
      {dot > 0 ? <circle cx={wp[0]} cy={wp[1]} r={px(dot)} fill={dotColor ?? palette.accent} stroke="#000" strokeOpacity={0.75} strokeWidth={px(3)} /> : null}
      <text x={txw} y={tyw} fontSize={px(size)} fontWeight={800} strokeWidth={px(size * 0.2)} {...textProps}>
        {text}
      </text>
      {sub ? (
        <text x={txw} y={syw} fontSize={px(subSize)} fontWeight={600} strokeWidth={px(subSize * 0.22)} {...textProps} fill={palette.muted}>
          {sub}
        </text>
      ) : null}
    </g>
  );
};
