/**
 * The pull-out: a flat scene (a satellite map, an illustrated sea, anything
 * full-frame) shrinks into its point on the globe while the globe appears
 * around it; and the reverse push-in, from the globe down into a flat scene.
 *
 * The flat scene shrinks at the same rate as the ground under it on the
 * globe (both are driven by one `p`), so it reads as one camera pulling back,
 * not two layers cross-fading. Give `spanKm` (how wide the flat scene is on
 * the ground) and the globe starts at the matching zoom.
 *
 *   <GlobeReveal at={[-91.0, 13.9]} spanKm={600} start={20} frames={75}>
 *     <MySeaScene />
 *   </GlobeReveal>
 *
 * Deterministic: everything is a function of the frame.
 */
import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {ease, lerp} from "../motion/anim";
import {DEFAULT_PALETTE, H, W, type Palette} from "../theme";
import {FIT, Globe, MAX_SCALE, mixView, placeAt, project, scaleForSpanKm, spaceBackground, zoomOf, type GlobeView, type GlobeLonLat} from "./globe";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => ease(clamp01(v));

/**
 * Speed-floored progress: smoothstep blended with linear, so the move starts
 * and lands with some speed, then coasts on past 1 and settles (it slows
 * exponentially toward 1 + tail / 2 instead of stopping dead or running away).
 */
export const coastEase = (t: number, tail = 0.34) => {
  if (t <= 0) return 0;
  if (t <= 1) return lerp(ease(t), t, tail);
  return 1 + (tail * (1 - Math.exp(-(t - 1) * 2))) / 2;
};

export type RevealOptions = {
  /** Where the flat scene sits on the globe. */
  at: GlobeLonLat;
  /** "out": flat → globe (pull-out). "in": globe → flat (push-in). */
  direction?: "out" | "in";
  /** First frame of the move. */
  start?: number;
  /** Length of the move, frames. */
  frames?: number;
  /** Ground width of the flat scene, km; sets the close view's zoom. */
  spanKm?: number;
  /** Close view (flat scene end). Default: centred on `at` at the zoom from `spanKm`. */
  near?: GlobeView;
  /** Wide view (globe end). Default: the whole planet, `at` a little above centre. */
  far?: GlobeView;
  /** The point in the flat scene that is `at`, px. Default: frame centre. */
  anchor?: readonly [number, number];
  /** Exit speed of the move as a fraction of its average speed (see `coastEase`). */
  tail?: number;
  /** Flat-scene scale range over which it fades out: fully visible at [1], gone at [0]. */
  fadeScale?: readonly [number, number];
  width?: number;
  height?: number;
};

export type RevealState = {
  /** 0 = flat scene full frame, 1 = wide globe (may run a little past either end while coasting). */
  p: number;
  /** The globe view this frame: pass it to every GlobePin / GlobeLine in the overlay. */
  view: GlobeView;
  /** Where `at` is on screen, px (where the flat scene's anchor is). */
  point: [number, number];
  /** Flat scene: scale about `anchor` and opacity. */
  flatScale: number;
  flatOpacity: number;
  /** Flat scene's soft mask, 0 = none (full frame) to 1 = a small feathered oval round the anchor. */
  mask: number;
};

/** The state of a reveal at `frame`, for driving your own layers in step with `GlobeReveal`. */
export const revealState = (frame: number, o: RevealOptions): RevealState => {
  const width = o.width ?? W;
  const height = o.height ?? H;
  const start = o.start ?? 0;
  const frames = Math.max(1, o.frames ?? 75);
  const tail = o.tail ?? 0.34;
  const [fadeLo, fadeHi] = o.fadeScale ?? [0.14, 0.6];
  const at = o.at;
  const anchor = o.anchor ?? [width / 2, height / 2];
  // The close view puts `at` exactly under the flat scene's anchor.
  const near = o.near ?? placeAt(at, anchor, scaleForSpanKm(o.spanKm ?? 1200, width, height), width, height);
  const far = o.far ?? {lon: at[0], lat: at[1] * 0.55, scale: FIT};

  const e = coastEase((frame - start) / frames, tail);
  const p = (o.direction ?? "out") === "out" ? e : 1 - e;

  // Past the close view (a push-in coasting on) only the zoom keeps going.
  const mixed = mixView(near, far, p);
  const view = p >= 0 ? mixed : {...near, scale: mixed.scale};
  // Flat scale = how much the ground at `at` has shrunk since the close view.
  // mixView zooms evenly in log of the apparent zoom, so this is exponential in p.
  const flatScale = Math.pow(zoomOf(Math.min(MAX_SCALE, far.scale)) / zoomOf(Math.min(MAX_SCALE, near.scale)), p);

  const q = project(at[0], at[1], view, width, height);
  let point: [number, number] = [anchor[0], anchor[1]];
  if (p > 0) {
    // fade out any residual between `at` and the anchor on the close view
    const p0 = project(at[0], at[1], near, width, height);
    const keep = 1 - clamp01(p);
    point = [q.x + (anchor[0] - p0.x) * keep, q.y + (anchor[1] - p0.y) * keep];
  }
  const fadeK = smooth((flatScale - fadeLo) / Math.max(1e-6, fadeHi - fadeLo));
  return {
    p,
    view,
    point,
    flatScale,
    flatOpacity: fadeK * (p > 0 && q.front <= 0 ? 0 : 1),
    mask: smooth((1 - flatScale) / 0.45),
  };
};

/**
 * Flat scene ⇄ globe transition. Children are the flat scene (full frame);
 * the globe, backdrop and overlay are drawn behind / above it.
 */
export const GlobeReveal: React.FC<
  RevealOptions & {
    children: React.ReactNode;
    /** Drawn behind the globe, e.g. `<Stars horizon={H} />`. */
    backdrop?: React.ReactNode;
    /** Drawn above everything, given this frame's state (pins, lines, labels on the globe). */
    overlay?: (s: RevealState) => React.ReactNode;
    texture?: string;
    palette?: Palette;
    /** Override the frame (default: the sequence's current frame). */
    frame?: number;
  }
> = ({children, backdrop, overlay, texture, palette = DEFAULT_PALETTE, frame, ...o}) => {
  const now = useCurrentFrame();
  const width = o.width ?? W;
  const height = o.height ?? H;
  const s = revealState(frame ?? now, o);
  const [ax, ay] = o.anchor ?? [width / 2, height / 2];
  // A soft oval round the anchor, intersected with feathered frame edges, so
  // the shrinking scene never shows a hard rectangle.
  // `soft` comes on fast so the frame edges feather as soon as they leave the frame.
  const soft = Math.sqrt(clamp01((1 - s.flatScale) / 0.35));
  const r = lerp(0.8, 0.5, s.mask);
  const edge = `${(soft * 18).toFixed(2)}%`;
  const masks =
    soft > 0.001
      ? [
          `radial-gradient(ellipse ${r * width}px ${r * height}px at ${ax}px ${ay}px, #000 ${lerp(100, 40, soft)}%, transparent 100%)`,
          `linear-gradient(to right, transparent, #000 ${edge}, #000 calc(100% - ${edge}), transparent)`,
          `linear-gradient(to bottom, transparent, #000 ${edge}, #000 calc(100% - ${edge}), transparent)`,
        ].join(", ")
      : undefined;
  const showGlobe = s.flatOpacity < 0.999 || s.flatScale < 0.999;
  return (
    <AbsoluteFill style={{background: spaceBackground(palette), overflow: "hidden"}}>
      {backdrop}
      <AbsoluteFill style={{opacity: showGlobe ? 1 : 0}}>
        <Globe view={s.view} width={width} height={height} texture={texture} palette={palette} />
      </AbsoluteFill>
      {s.flatOpacity > 0.002 ? (
        <AbsoluteFill
          style={{
            opacity: s.flatOpacity,
            transformOrigin: `${ax}px ${ay}px`,
            transform: `translate(${s.point[0] - ax}px, ${s.point[1] - ay}px) scale(${s.flatScale})`,
            WebkitMaskImage: masks,
            maskImage: masks,
            WebkitMaskComposite: masks ? "source-in" : undefined,
            maskComposite: masks ? "intersect" : undefined,
          }}
        >
          {children}
        </AbsoluteFill>
      ) : null}
      {overlay ? <AbsoluteFill style={{pointerEvents: "none"}}>{overlay(s)}</AbsoluteFill> : null}
    </AbsoluteFill>
  );
};
