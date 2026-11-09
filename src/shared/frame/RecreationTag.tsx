import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {FONT} from "../theme";
import {HUD_H, useHudBox} from "./ChapterHud";

/**
 * Small uppercase honesty label for a shot that is NOT footage: the viewer is
 * told the picture is a reconstruction, an illustration or a simplification.
 * Every 3D shot of a real event carries one (see docs/visuals/3d-explainer.md).
 *
 * Sits just under the ChapterHud, at the panel's left or right edge: inside the
 * safe zone, far above the caption band. One tag per shot.
 */
export type RecreationKind = "recreated" | "illustrative" | "simplified";
export type RecreationLang = "vi" | "en";

export const RECREATION_TEXT: Record<RecreationLang, Record<RecreationKind, string>> = {
  vi: {recreated: "Dựng lại", illustrative: "Minh hoạ", simplified: "Đơn giản hoá"},
  en: {recreated: "Recreated", illustrative: "Illustrative", simplified: "Simplified"},
};

export const RecreationTag: React.FC<{
  kind: RecreationKind;
  lang?: RecreationLang;
  align?: "left" | "right";
  color?: string;
  /** Fade in at `from` (frames); fade out at `to` if given. */
  from?: number;
  to?: number;
}> = ({kind, lang = "en", align = "left", color = "#FFB020", from = 0, to}) => {
  const frame = useCurrentFrame();
  const box = useHudBox();
  const a = interpolate(frame, [from, from + 8], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const b = to === undefined ? 1 : interpolate(frame, [to - 8, to], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const side = align === "left" ? {left: box.left} : {left: box.left + box.width, transform: "translateX(-100%)"};
  return (
    <div style={{position: "absolute", top: box.top + HUD_H + 12, ...side, height: 36, padding: "0 14px", display: "flex", alignItems: "center", gap: 10, borderRadius: 8, background: "rgba(9,14,20,0.8)", border: "1px solid rgba(255,255,255,0.14)", fontFamily: FONT.mono, fontSize: 22, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.9)", opacity: a * b}}>
      <span style={{width: 10, height: 10, borderRadius: 5, background: color}} />
      {RECREATION_TEXT[lang][kind]}
    </div>
  );
};
