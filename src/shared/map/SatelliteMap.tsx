/**
 * A map scene: one SVG whose viewBox is the camera box, in world units.
 *
 * Imagery (satellite mosaics from `bun run satellite <id>`), vector layers,
 * routes and annotations are all children of the same SVG, so they share one
 * coordinate system and never slide against each other during a move.
 *
 * Several mosaics of the same place at different zooms are cross-faded by how
 * much the camera magnifies each one: the coarse mosaic carries the wide shot,
 * the sharp one fades in (feathered at its edges) as the camera reaches it, so
 * a fly from a country down to a street stays sharp the whole way.
 *
 * With no mosaics it is a vector map on the palette background.
 */
import React, {createContext, useContext, useEffect, useId, useState} from "react";
import {AbsoluteFill, cancelRender, continueRender, delayRender, staticFile} from "remotion";
import {DEFAULT_PALETTE, H, type Palette} from "../theme";
import {type Box, intersects, pxOf, viewTransform, WORLD} from "./mercator";
import {smoothstep} from "./camera";

/** One stitched mosaic and where it sits in the world (what `satellite.json` holds). */
export type Mosaic = {
  id: string;
  /** Path under public/, e.g. `img/sat/<id>/<shot>.jpg` (passed to staticFile), or a full URL. */
  href: string;
  /** Tile zoom it was built at: decides the order (coarse → sharp) and the cross-fade. */
  zoom: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

/** The file `bun run satellite <id>` writes next to the video. */
export type SatelliteManifest = {attribution: string; mosaics: Mosaic[]};

export type MapView = {
  box: Box;
  /** World units for `n` canvas pixels: `px(4)` is a 4 px line at any zoom. */
  px: (n: number) => number;
  palette: Palette;
};

const MapCtx = createContext<MapView | null>(null);

/** The camera box, `px` helper and palette of the enclosing `SatelliteMap`. */
export const useMapView = (): MapView => {
  const v = useContext(MapCtx);
  if (!v) throw new Error("map layers (VectorLayer, Route, Pin, …) must be children of <SatelliteMap>");
  return v;
};

/** Canvas px per mosaic pixel at this box: above 1 the mosaic is being magnified (soft). */
export const magnification = (m: Mosaic, box: Box) => {
  const mosaicPx = WORLD / 2 ** m.zoom / 256; // world units per mosaic pixel
  return viewTransform(box).scale * mosaicPx;
};

/** Fraction of the box's area that the mosaic covers, 0–1. */
export const coverage = (m: Mosaic, box: Box) => {
  const w = Math.max(0, Math.min(m.x + m.w, box[0] + box[2]) - Math.max(m.x, box[0]));
  const h = Math.max(0, Math.min(m.y + m.h, box[1] + box[3]) - Math.max(m.y, box[1]));
  return (w * h) / (box[2] * box[3]);
};

/**
 * Opacity of every mosaic for this box, coarse first. The coarsest mosaic in
 * view is opaque. Each sharper one fades in when it is needed (the next
 * coarser one is magnified from `soft[0]` to `soft[1]` canvas px per mosaic
 * pixel) and only once it fills the frame (coverage 0.8 → 1), so its edge
 * never shows as a sharp rectangle inside a soft one.
 *
 * Plan mosaics as a ladder along a fly: each sharper one should cover the
 * camera box by the time the coarser one is magnified about 2×.
 */
export const mosaicLayers = (mosaics: readonly Mosaic[], box: Box, soft: readonly [number, number] = [0.7, 1.3]) => {
  const inView = [...mosaics].filter((m) => intersects([m.x, m.y, m.w, m.h], box)).sort((a, b) => a.zoom - b.zoom || b.w - a.w);
  return inView.map((m, i) => ({
    mosaic: m,
    opacity: i === 0 ? 1 : smoothstep(soft[0], soft[1], magnification(inView[i - 1], box)) * smoothstep(0.8, 1, coverage(m, box)),
  }));
};

const src = (href: string) => (/^(https?:|data:|blob:)/.test(href) ? href : staticFile(href));

/** Hold the render until every mosaic is decoded, so no frame shows a missing image. */
const useDecoded = (hrefs: string[]) => {
  const key = hrefs.join("|");
  const [handle] = useState(() => (hrefs.length ? delayRender(`loading map mosaics: ${key}`, {timeoutInMilliseconds: 60_000}) : null));
  useEffect(() => {
    if (handle === null) return;
    let live = true;
    Promise.all(
      hrefs.map((h) => {
        const img = new Image();
        img.src = src(h);
        return img.decode().catch(() => {
          throw new Error(`map mosaic did not load: ${h} (run \`bun run satellite <id>\`?)`);
        });
      }),
    )
      .then(() => live && continueRender(handle))
      .catch((e) => cancelRender(e));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, handle]);
};

export const SatelliteMap: React.FC<{
  /** The camera, `[x, y, w, h]` world units (see `camera.ts` `move`/`fly`). */
  box: Box;
  /** Mosaics to draw; usually `satellite.json`'s `mosaics`. Omit for a vector-only map. */
  mosaics?: readonly Mosaic[];
  palette?: Palette;
  /** Fill behind everything (sea in a vector-only map). Default `palette.deep`. */
  background?: string;
  /** 0–1 black over the imagery (under the children), for scenes heavy with text. */
  dim?: number;
  /** 0–1 desaturates the imagery so overlays carry the colour. */
  mute?: number;
  /** Width of the feathered edge of the sharper mosaics, as a fraction of their size. */
  feather?: number;
  /** Canvas px per mosaic pixel over which a sharper mosaic fades in. */
  soft?: readonly [number, number];
  style?: React.CSSProperties;
  /** SVG content in world units: VectorLayer, Route, Pin, Region, … */
  children?: React.ReactNode;
}> = ({box, mosaics = [], palette = DEFAULT_PALETTE, background, dim = 0, mute = 0, feather = 0.04, soft = [0.7, 1.3], style, children}) => {
  useDecoded(mosaics.map((m) => m.href));
  const id = `sat${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [vx, vy, vw, vh] = box;
  const view: MapView = {box, px: pxOf(box), palette};
  const layers = mosaicLayers(mosaics, box, soft);
  // Draw a little past the box so a slice crop at another aspect never shows the edge.
  const pad = Math.max(vw, vh);

  return (
    <AbsoluteFill style={{background: background ?? palette.deep, ...style}}>
      <svg
        width="100%"
        height="100%"
        viewBox={`${vx} ${vy} ${vw} ${vh}`}
        preserveAspectRatio="xMidYMid slice"
        style={{position: "absolute", inset: 0, overflow: "hidden"}}
      >
        <defs>
          {mute > 0 ? (
            <filter id={`${id}-mute`} colorInterpolationFilters="sRGB">
              <feColorMatrix type="saturate" values={String(1 - mute)} />
            </filter>
          ) : null}
          {layers.slice(1).map(({mosaic: m}) => {
            const f = feather * Math.min(m.w, m.h);
            return (
              <mask key={m.id} id={`${id}-${m.id}`} maskUnits="userSpaceOnUse" x={m.x} y={m.y} width={m.w} height={m.h}>
                <rect x={m.x} y={m.y} width={m.w} height={m.h} fill="#000" />
                <rect x={m.x + f} y={m.y + f} width={m.w - 2 * f} height={m.h - 2 * f} fill="#fff" filter={`url(#${id}-${m.id}-blur)`} />
                <filter id={`${id}-${m.id}-blur`} filterUnits="userSpaceOnUse" x={m.x - f} y={m.y - f} width={m.w + 2 * f} height={m.h + 2 * f}>
                  <feGaussianBlur stdDeviation={f / 2.2} />
                </filter>
              </mask>
            );
          })}
        </defs>
        <rect x={vx - pad} y={vy - pad} width={vw + 2 * pad} height={vh + 2 * pad} fill={background ?? palette.deep} />
        <g filter={mute > 0 ? `url(#${id}-mute)` : undefined}>
          {layers.map(({mosaic: m, opacity}, i) =>
            opacity <= 0.001 ? null : (
              <image
                key={m.id}
                href={src(m.href)}
                x={m.x}
                y={m.y}
                width={m.w}
                height={m.h}
                preserveAspectRatio="none"
                opacity={opacity}
                mask={i > 0 ? `url(#${id}-${m.id})` : undefined}
                imageRendering="optimizeQuality"
              />
            ),
          )}
        </g>
        {dim > 0.001 ? <rect x={vx - pad} y={vy - pad} width={vw + 2 * pad} height={vh + 2 * pad} fill="#000" opacity={dim} /> : null}
        <MapCtx.Provider value={view}>{children}</MapCtx.Provider>
      </svg>
    </AbsoluteFill>
  );
};

/** Canvas height in world units for this box; handy for sizing text in a custom layer. */
export const canvasWorldHeight = (box: Box) => H / viewTransform(box).scale;
