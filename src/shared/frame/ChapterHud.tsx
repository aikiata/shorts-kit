import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {useFormat} from "../format";
import {FONT} from "../theme";

/**
 * Fixed HUD strip across the top of a chaptered explainer: channel name, the
 * current chapter (number + title), a segmented progress bar, and a slot for a
 * small diagram that changes with the chapter. Its job is to keep a viewer who
 * scrolled in late from getting lost: each chapter answers the question the
 * previous one raised.
 *
 * Top edge is `safe.top + 8`, clear of the platform top controls; the box is the
 * panel width (inside the button rail), so it never meets it. 132 px tall.
 * Progress is a pure function of `chapter` + `chapterProgress`; `changedAt` (the
 * frame the new chapter starts) runs a short label swap.
 */
export type Chapter = {num: string; label: string};

export const HUD_H = 132;
const SWAP = 8;

/** Y of the HUD's top and bottom edge in the running format. */
export const useHudBox = () => {
  const {safe, w} = useFormat();
  return {top: safe.top + 8, bottom: safe.top + 8 + HUD_H, left: safe.panelLeft, width: safe.panelMaxW, w};
};

export const ChapterHud: React.FC<{
  channel: string;
  chapters: readonly Chapter[];
  /** Index of the current chapter. */
  chapter: number;
  /** 0..1 progress inside the current chapter. */
  chapterProgress: number;
  /** Frame at which the current chapter began (drives the label swap). */
  changedAt?: number;
  accent: string;
  /** Small diagram; gets the chapter index. Rendered in a 380x72 slot (scaled 0.85). */
  diagram?: (chapter: number) => React.ReactNode;
}> = ({channel, chapters, chapter, chapterProgress, changedAt = -100, accent, diagram}) => {
  const frame = useCurrentFrame();
  const box = useHudBox();
  const c = chapters[chapter];
  const swap = interpolate(frame - changedAt, [0, SWAP], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <div style={{position: "absolute", left: box.left, top: box.top, width: box.width, height: HUD_H, boxSizing: "border-box", borderRadius: 14, background: "rgba(9,14,20,0.84)", border: "1px solid rgba(255,255,255,0.12)", fontFamily: FONT.sans, color: "#fff", overflow: "hidden"}}>
      <div style={{position: "absolute", left: 24, top: 14, fontFamily: FONT.mono, fontSize: 20, letterSpacing: 1.5, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", whiteSpace: "nowrap"}}>{channel}</div>
      <div style={{position: "absolute", left: 24, top: 46, display: "flex", alignItems: "baseline", gap: 14, whiteSpace: "nowrap", opacity: swap, transform: `translateY(${(1 - swap) * 10}px)`}}>
        <span style={{fontFamily: FONT.mono, fontSize: 28, fontWeight: 700, color: accent}}>{c.num}</span>
        <span style={{fontSize: 34, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase"}}>{c.label}</span>
      </div>
      {diagram ? <div style={{position: "absolute", right: 20, top: 18, width: 380, height: 72, transform: "scale(0.85)", transformOrigin: "right top"}}>{diagram(chapter)}</div> : null}
      <div style={{position: "absolute", left: 24, right: 24, bottom: 14, display: "flex", gap: 6}}>
        {chapters.map((_, i) => {
          const fill = i < chapter ? 1 : i === chapter ? Math.max(0, Math.min(1, chapterProgress)) : 0;
          return (
            <div key={i} style={{flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.16)", overflow: "hidden"}}>
              <div style={{width: `${fill * 100}%`, height: "100%", background: accent}} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
