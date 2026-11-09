/**
 * The canvas of one video. Every short is 9:16 (1080×1920); a promo may also be
 * 16:9 (1920×1080). A video says which in `src/videos/<id>/video.json`; the
 * entry reads it, and components ask the running composition (`useFormat`)
 * instead of importing a fixed width and height.
 *
 * `W` and `H` in theme.ts stay as the portrait defaults, so a component that
 * has not been made format-aware yet still works in a 9:16 video (and only
 * there).
 */
import {useVideoConfig} from "remotion";
import {SOUL} from "./soul";

export type Orientation = "portrait" | "landscape";
/** `short`: voice-led, SOUL rules. `promo`: picture- and music-led, docs/promo rules. */
export type Mode = "short" | "promo";
export type VideoMeta = {format: Orientation; mode: Mode};

export const FORMATS: Record<Orientation, {w: number; h: number}> = {
  portrait: {w: 1080, h: 1920},
  landscape: {w: 1920, h: 1080},
};

export const DEFAULT_META: VideoMeta = {format: "portrait", mode: "short"};

export const orientationOf = (w: number, h: number): Orientation => (w >= h ? "landscape" : "portrait");

/** Safe geometry of a frame, px. `rail` is the platform button column (portrait only). */
export type Safe = {
  top: number;
  bottom: number;
  left: number;
  right: number;
  rail?: {x: number; fromY: number};
  /** Widest centred panel that stays clear of the rail / margins. */
  panelMaxW: number;
  panelLeft: number;
  /** Top of the text column in a scene. */
  stageTop: number;
  /** Caption block bottom edge, distance from the frame bottom, px. */
  captionBottom: number;
  captionMaxW: number;
};

export const safeFor = (o: Orientation): Safe => {
  const {w, h} = FORMATS[o];
  if (o === "portrait") {
    return {
      top: SOUL.safeTopPx,
      bottom: SOUL.safeBottomPx,
      left: 0,
      right: w,
      rail: SOUL.safeRightPx,
      panelMaxW: SOUL.panelMaxWidthPx,
      panelLeft: Math.round((w - SOUL.panelMaxWidthPx) / 2),
      stageTop: SOUL.safeTopPx + 88,
      captionBottom: Math.round(h * SOUL.captionBottomShare),
      captionMaxW: SOUL.panelMaxWidthPx,
    };
  }
  // Landscape has no platform button column: title-safe margins on every side.
  const mx = Math.round(w * SOUL.safeLandscapeMarginPct);
  const my = Math.round(h * SOUL.safeLandscapeMarginPct);
  const panelMaxW = w - 2 * mx;
  return {
    top: my,
    bottom: h - my,
    left: mx,
    right: w - mx,
    panelMaxW,
    panelLeft: mx,
    stageTop: my + 80,
    captionBottom: Math.round(h * SOUL.captionBottomShareLandscape),
    captionMaxW: Math.min(panelMaxW, SOUL.captionMaxWidthLandscapePx),
  };
};

/** The running composition's canvas and safe geometry. */
export const useFormat = () => {
  const {width, height} = useVideoConfig();
  const orientation = orientationOf(width, height);
  return {w: width, h: height, orientation, safe: safeFor(orientation)};
};
