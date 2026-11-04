/**
 * Vector paths in world units (coasts, borders, rivers, region fills) drawn
 * inside a `<SatelliteMap>`. Widths and dashes are in canvas pixels and stay
 * that size at any zoom, so a 2 px border is 2 px in the wide shot and in the
 * close-up.
 *
 * Path data comes from `bun run geo <id>` (`geo.json`), the bundled Vietnam
 * data (`data/vietnam-data.ts`), or `pathOf([[lon, lat], …])`.
 */
import React from "react";
import {useMapView} from "./SatelliteMap";

export const VectorLayer: React.FC<{
  /** SVG path data in world units; an array is drawn as one layer. */
  d: string | readonly string[];
  /** Stroke colour; `null` for a fill only. Default `palette.text`. */
  stroke?: string | null;
  /** Stroke width, canvas px. */
  width?: number;
  /** Dash pattern, canvas px: `[on, off]`. */
  dash?: readonly [number, number];
  /** Fill colour (regions, land). Default none. */
  fill?: string;
  fillOpacity?: number;
  strokeOpacity?: number;
  opacity?: number;
  /** Darker line under the stroke so it reads over bright imagery: colour, and extra width in px (default 3). */
  halo?: string | {color: string; width?: number};
  /** Soft glow under the stroke, canvas px blur radius. */
  glow?: number;
  /** 0–1 draw-on along each path (uses pathLength; fine for coasts and rivers). */
  progress?: number;
  lineCap?: "round" | "butt" | "square";
}> = ({d, stroke, width = 2, dash, fill, fillOpacity = 1, strokeOpacity = 1, opacity = 1, halo, glow, progress, lineCap = "round"}) => {
  const {px, palette} = useMapView();
  if (opacity <= 0.001) return null;
  const paths = typeof d === "string" ? [d] : d;
  const color = stroke === undefined ? palette.text : stroke;
  const drawOn = progress !== undefined && progress < 1;
  const p = Math.max(0, Math.min(1, progress ?? 1));
  if (drawOn && p <= 0 && !fill) return null;
  const h = typeof halo === "string" ? {color: halo, width: 3} : halo;
  // Draw-on runs on a normalised length of 1000, so it ignores world-unit scale.
  const dashProps = drawOn
    ? {pathLength: 1000, strokeDasharray: `${p * 1000} 1000`}
    : dash
      ? {strokeDasharray: `${px(dash[0])} ${px(dash[1])}`}
      : {};
  return (
    <g opacity={opacity}>
      {fill
        ? paths.map((s, i) => <path key={`f${i}`} d={s} fill={fill} fillOpacity={fillOpacity} fillRule="evenodd" stroke="none" />)
        : null}
      {color && h
        ? paths.map((s, i) => (
            <path
              key={`h${i}`}
              d={s}
              fill="none"
              stroke={h.color}
              strokeOpacity={strokeOpacity * 0.85}
              strokeWidth={px(width + 2 * (h.width ?? 3))}
              strokeLinejoin="round"
              strokeLinecap={lineCap}
              {...dashProps}
            />
          ))
        : null}
      {color
        ? paths.map((s, i) => (
            <path
              key={`s${i}`}
              d={s}
              fill="none"
              stroke={color}
              strokeOpacity={strokeOpacity}
              strokeWidth={px(width)}
              strokeLinejoin="round"
              strokeLinecap={lineCap}
              style={glow ? {filter: `drop-shadow(0 0 ${px(glow)}px ${color})`} : undefined}
              {...dashProps}
            />
          ))
        : null}
    </g>
  );
};
