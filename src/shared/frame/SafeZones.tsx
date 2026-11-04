import React from "react";
import {AbsoluteFill} from "remotion";
import {SOUL} from "../soul";
import {H, W} from "../theme";

/**
 * Platform safe zones on a 1080×1920 frame (§7a), from thresholds.json: the
 * strictest edge of TikTok, Reels and Shorts on each side, because one file is
 * posted to all of them.
 *
 * - top band: y < SAFE_TOP is under the platform's top controls;
 * - bottom band: y > SAFE_BOTTOM is under the platform's own caption;
 * - right rail: x > SAFE_RIGHT_X from y = SAFE_RIGHT_FROM_Y is the like/comment column.
 */
export const SAFE_TOP = SOUL.safeTopPx; // 212
export const SAFE_BOTTOM = SOUL.safeBottomPx; // 1726
export const SAFE_RIGHT_X = SOUL.safeRightPx.x; // 927
export const SAFE_RIGHT_FROM_Y = SOUL.safeRightPx.fromY; // 803
/** Widest centred panel that stays clear of the right rail: 1080 − 2 × (1080 − 927). */
export const PANEL_MAX_W = SOUL.panelMaxWidthPx; // 774
/** Left edge of a centred panel of PANEL_MAX_W. */
export const PANEL_LEFT = Math.round((W - PANEL_MAX_W) / 2); // 153
/**
 * Top of the text column in a scene: below SAFE_TOP and below the watermark,
 * so a headline never collides with the channel mark.
 */
export const STAGE_TOP = SAFE_TOP + 88; // 300

/** Shift left that keeps a centred panel of width `w` clear of the right rail. */
export const shiftFor = (w: number) => Math.max(0, (W + w) / 2 - SAFE_RIGHT_X);

/**
 * Profile grids crop the cover to ~1:1.29, centred (§10): text outside this band
 * is cut off on the channel page.
 */
const COVER_VISIBLE_H = Math.round(W * SOUL.coverCropRatio);
export const COVER_BAND = {top: Math.round((H - COVER_VISIBLE_H) / 2), bottom: Math.round((H + COVER_VISIBLE_H) / 2)}; // 263..1657

/**
 * Overlay that paints the unsafe areas red and the panel box dashed. Only for
 * stills (`bun run still <id> --safe`); never on in a render.
 */
export const SafeZones: React.FC<{opacity?: number; cover?: boolean}> = ({opacity = 0.4, cover = false}) => {
  const band = (style: React.CSSProperties) => (
    <div style={{position: "absolute", background: "#FF2D55", opacity, ...style}} />
  );
  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      {band({left: 0, top: 0, width: W, height: SAFE_TOP})}
      {band({left: 0, top: SAFE_BOTTOM, width: W, height: H - SAFE_BOTTOM})}
      {band({left: SAFE_RIGHT_X, top: SAFE_RIGHT_FROM_Y, width: W - SAFE_RIGHT_X, height: SAFE_BOTTOM - SAFE_RIGHT_FROM_Y})}
      <div
        style={{
          position: "absolute",
          left: PANEL_LEFT,
          top: SAFE_TOP,
          width: PANEL_MAX_W,
          height: SAFE_BOTTOM - SAFE_TOP,
          border: "3px dashed #C8FF3D",
          boxSizing: "border-box",
        }}
      />
      {cover ? (
        <>
          {band({left: 0, top: 0, width: W, height: COVER_BAND.top, background: "#FFB800"})}
          {band({left: 0, top: COVER_BAND.bottom, width: W, height: H - COVER_BAND.bottom, background: "#FFB800"})}
        </>
      ) : null}
    </AbsoluteFill>
  );
};
