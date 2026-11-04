/**
 * The Hoàng Sa (Paracel) and Trường Sa (Spratly) archipelagos: the main
 * islands of each, an outline around them, and a label, drawn inside a
 * `<SatelliteMap>`.
 *
 * The outline is the convex hull of a circle around every island (so it is a
 * rounded hull that follows how the islands are really spread, not a box or an
 * oval), dashed. Natural Earth's small-island features are not used for this:
 * its "Spratly Is." feature leaves out some of the larger islands.
 */
import React from "react";
import {FONT, W} from "../theme";
import {type Box, contains, type LonLat, PER_DEGREE, toWorld, worldToScreen, screenToWorld, type XY} from "./mercator";
import {useMapView} from "./SatelliteMap";
import {ARCHIPELAGO, type ArchId} from "./data/archipelago-data";

export {ARCHIPELAGO, type ArchId} from "./data/archipelago-data";
export type LabelLang = "vi" | "en" | "both";

const hullOf = (pts: XY[]): XY[] => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: XY, a: XY, b: XY) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: XY[] = [];
  const upper: XY[] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  for (const q of [...p].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
};

/** Margin around each island, degrees of longitude (0.35° ≈ 38 km). */
export const ARCH_MARGIN_DEG = 0.35;
const SEG = 28;

/** Outline path, island points and bounds of each archipelago, world units. */
export const ARCH_SHAPES = (Object.keys(ARCHIPELAGO) as ArchId[]).map((id) => {
  const islands = ARCHIPELAGO[id].islands.map(toWorld);
  const m = ARCH_MARGIN_DEG * PER_DEGREE;
  const ring = hullOf(
    islands.flatMap(([x, y]) => Array.from({length: SEG}, (_, k): XY => [x + m * Math.cos((2 * Math.PI * k) / SEG), y + m * Math.sin((2 * Math.PI * k) / SEG)])),
  );
  const xs = ring.map((q) => q[0]);
  const ys = ring.map((q) => q[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  return {
    id,
    islands,
    d: "M" + ring.map((q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`).join("L") + "Z",
    box: [x0, y0, Math.max(...xs) - x0, Math.max(...ys) - y0] as Box,
  };
});

/** True when the camera box holds both outlines entirely (labels aside). */
export const archipelagosInView = (box: Box) => ARCH_SHAPES.every((a) => contains(box, a.box));

export const archLabel = (id: ArchId, lang: LabelLang) =>
  lang === "en" ? [ARCHIPELAGO[id].en] : lang === "vi" ? [ARCHIPELAGO[id].vi] : [ARCHIPELAGO[id].vi, ARCHIPELAGO[id].en];

/**
 * Both archipelagos, for a map whose viewBox is world units. Labels sit above
 * each outline, centred, and are kept off the canvas edges.
 */
export const Archipelagos: React.FC<{
  opacity?: number;
  /** Label language: Vietnamese (default), English, or both (Vietnamese on top). */
  lang?: LabelLang;
  /** Hide the labels. */
  labels?: boolean;
  /** Outline colour. Default `palette.good`. */
  color?: string;
  /** Label size, canvas px. */
  size?: number;
  caps?: boolean;
  /** Draw only one of them. */
  only?: ArchId;
}> = ({opacity = 1, lang = "vi", labels = true, color, size = 26, caps = true, only}) => {
  const {box, px, palette} = useMapView();
  if (opacity <= 0.001) return null;
  const tone = color ?? palette.good;
  return (
    <>
      {ARCH_SHAPES.filter((a) => !only || a.id === only).map((a) => {
        const lines = archLabel(a.id, lang).map((s) => (caps ? s.toUpperCase() : s));
        // Label: centred over the outline, at least 150 px from the canvas sides.
        const [cx, top] = worldToScreen(box, [a.box[0] + a.box[2] / 2, a.box[1]]);
        const half = Math.max(...lines.map((l) => l.length)) * size * 0.36;
        const lx = Math.min(Math.max(cx, 40 + half), W - 40 - half);
        const sub = size * 0.78;
        return (
          <g key={a.id} opacity={opacity}>
            <path
              d={a.d}
              fill={tone}
              fillOpacity={0.07}
              stroke={tone}
              strokeWidth={px(3.5)}
              strokeDasharray={`${px(14)} ${px(9)}`}
              strokeLinejoin="round"
            />
            {a.islands.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={px(3.4)} fill={tone} stroke="#000" strokeOpacity={0.6} strokeWidth={px(1.2)} />
            ))}
            {labels
              ? lines.map((l, i) => {
                  const fromBottom = lines.length - 1 - i;
                  const [x, y] = screenToWorld(box, [lx, top - 14 - fromBottom * sub * 1.25]);
                  return (
                    <text
                      key={i}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      fontFamily={FONT.sans}
                      fontWeight={i === 0 ? 900 : 700}
                      fontSize={px(i === 0 ? size : sub)}
                      fill={i === 0 ? palette.text : palette.muted}
                      stroke="#000"
                      strokeWidth={px(7)}
                      strokeLinejoin="round"
                      paintOrder="stroke"
                    >
                      {l}
                    </text>
                  );
                })
              : null}
          </g>
        );
      })}
    </>
  );
};
