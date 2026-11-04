/**
 * The Vietnam preset: `<VietnamMap>`, framings (`VIETNAM_VIEWS`) and places
 * (`place`, `at`), built on the bundled, simplified Natural Earth data in
 * `data/vietnam-data.ts` (regenerate with `bun run geo --vietnam`).
 *
 * Place and country names are Vietnamese with an English form; pick per video
 * with `lang`.
 *
 * ```tsx
 * <VietnamMap box={VIETNAM_VIEWS.country}>
 *   <Route points={[at("Hà Nội"), at("Huế"), at("TP. Hồ Chí Minh")]} progress={k} head />
 * </VietnamMap>
 * ```
 */
import React from "react";
import {DEFAULT_PALETTE, FONT, type Palette} from "../theme";
import {LABEL_SAFE} from "./annotations";
import {Archipelagos, type LabelLang} from "./archipelagos";
import {MEKONG_DELTA_BRANCHES, NEIGHBOURS, PLACES, type Place, RIVERS, VIETNAM} from "./data/vietnam-data";
import {type Box, boxAround, type LonLat, toWorld, worldToScreen} from "./mercator";
import {type Mosaic, SatelliteMap, useMapView} from "./SatelliteMap";
import {VectorLayer} from "./VectorLayer";

export {MEKONG_DELTA_BRANCHES, NEIGHBOURS, PLACES, RIVERS, VIETNAM} from "./data/vietnam-data";
export type {CountryPath, Place, RiverPath} from "./data/vietnam-data";

/**
 * Framings at the 9:16 aspect. `country` holds the whole mainland and both
 * archipelagos with their labels; the rest are regional close-ups.
 */
export const VIETNAM_VIEWS = {
  /** Mainland + Hoàng Sa + Trường Sa, labels clear of the safe bands. */
  country: boxAround(108, 13.8, 19),
  /** A notch wider than `country`, as a start point for a push-in. */
  wide: boxAround(108.2, 14, 23),
  /** Mainland only (archipelagos partly or not in frame). */
  mainland: boxAround(106.2, 16, 13),
  north: boxAround(105.6, 21, 6),
  centre: boxAround(107.6, 15.6, 6),
  south: boxAround(106, 10.4, 5),
} satisfies Record<string, Box>;

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFC")
    .replace(/^(tp\.?|thành phố)\s+/, "thành phố ");

/**
 * Look up a bundled place by its Vietnamese or English name (`"Huế"`, `"Hue"`,
 * `"Hà Nội"`, `"Hanoi"`). Throws on an unknown name, so a typo fails the render
 * instead of dropping a pin in the sea.
 */
export const place = (name: string): Place => {
  const n = norm(name);
  const hit = PLACES.find((p) => norm(p.vi) === n || norm(p.en) === n);
  if (!hit) throw new Error(`no bundled place "${name}". Known: ${PLACES.map((p) => p.en).join(", ")}`);
  return hit;
};

/** `[lon, lat]` of a bundled place. */
export const at = (name: string): LonLat => {
  const p = place(name);
  return [p.lon, p.lat];
};

/** A country name at its label point, hidden when that point is outside the safe area. */
const CountryLabel: React.FC<{at: LonLat; text: string; size: number; color: string; opacity: number}> = ({at: ll, text, size, color, opacity}) => {
  const {box, px} = useMapView();
  const [sx, sy] = worldToScreen(box, toWorld(ll));
  const half = text.length * size * 0.36;
  if (sx - half < LABEL_SAFE.left || sx + half > LABEL_SAFE.right || sy - size < LABEL_SAFE.top || sy > LABEL_SAFE.bottom) return null;
  if (sy > LABEL_SAFE.railFromY && sx + half > LABEL_SAFE.railX) return null;
  const [x, y] = toWorld(ll);
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontFamily={FONT.sans}
      fontWeight={800}
      fontSize={px(size)}
      letterSpacing={px(size * 0.12)}
      fill={color}
      opacity={opacity}
      stroke="#000"
      strokeOpacity={0.55}
      strokeWidth={px(size * 0.16)}
      strokeLinejoin="round"
      paintOrder="stroke"
    >
      {text}
    </text>
  );
};

/**
 * Vietnam ready for a route or a region on top: the country outlined (and
 * filled when there is no imagery), neighbours faint, Hoàng Sa and Trường Sa
 * drawn, optional rivers and country names. Children are drawn above it, in
 * the same world coordinates (Route, Pin, Region, …).
 */
export const VietnamMap: React.FC<{
  /** Camera box. Default `VIETNAM_VIEWS.country`. */
  box?: Box;
  /** Satellite mosaics under the vectors; without them land is filled from the palette. */
  mosaics?: readonly Mosaic[];
  palette?: Palette;
  /** Language of the country and archipelago labels. */
  lang?: LabelLang;
  /** Opacity of the archipelago outlines and labels (0 hides them). */
  archipelagos?: number;
  /** Opacity of the neighbouring countries. */
  neighbours?: number;
  /** Opacity of the Mekong, Red and Black rivers. */
  rivers?: number;
  /** Country names: `true` for all in the safe area, or a list of ISO codes ("VNM", "LAO", …). */
  countryLabels?: boolean | readonly string[];
  /** Vietnam outline width, px. */
  outline?: number;
  /** Fill of Vietnam's land (vector-only map). Default a lifted palette surface. */
  land?: string;
  /** 0–1 black over satellite imagery. */
  dim?: number;
  children?: React.ReactNode;
}> = ({
  box = VIETNAM_VIEWS.country,
  mosaics,
  palette = DEFAULT_PALETTE,
  lang = "vi",
  archipelagos = 1,
  neighbours = 1,
  rivers = 0,
  countryLabels = false,
  outline = 3,
  land,
  dim = 0,
  children,
}) => {
  const imagery = !!mosaics?.length;
  const name = (c: {vi: string; en: string}) => (lang === "en" ? c.en : c.vi);
  const labelled = (iso: string) => countryLabels === true || (Array.isArray(countryLabels) && countryLabels.includes(iso));
  return (
    <SatelliteMap box={box} mosaics={mosaics} palette={palette} dim={dim}>
      <VectorLayer
        d={NEIGHBOURS.map((n) => n.d)}
        fill={imagery ? undefined : palette.surface}
        fillOpacity={0.75}
        stroke={palette.muted}
        strokeOpacity={imagery ? 0.55 : 0.4}
        width={1.4}
        opacity={neighbours}
      />
      <VectorLayer d={VIETNAM.d} fill={imagery ? undefined : (land ?? "#2A3B4C")} stroke={null} />
      {rivers > 0 ? (
        <>
          <VectorLayer d={RIVERS.map((r) => r.d)} stroke={palette.accent} strokeOpacity={0.8} width={2} opacity={rivers} />
          <VectorLayer d={MEKONG_DELTA_BRANCHES} stroke={palette.accent} strokeOpacity={0.6} width={1.4} opacity={rivers} />
        </>
      ) : null}
      <VectorLayer d={VIETNAM.d} stroke={palette.text} width={outline} halo={imagery ? "rgba(0,0,0,0.6)" : undefined} />
      {archipelagos > 0 ? <Archipelagos opacity={archipelagos} lang={lang} /> : null}
      {countryLabels
        ? [...NEIGHBOURS, VIETNAM]
            .filter((c) => c.label && labelled(c.iso))
            .map((c) => (
              <CountryLabel
                key={c.iso}
                at={c.label!}
                text={name(c).toUpperCase()}
                size={c.iso === "VNM" ? 34 : 26}
                color={c.iso === "VNM" ? palette.text : palette.muted}
                opacity={c.iso === "VNM" ? 1 : neighbours}
              />
            ))
        : null}
      {children}
    </SatelliteMap>
  );
};
