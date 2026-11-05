import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {clamp, easeOut} from "../motion/anim";
import {FONT, type Palette} from "../theme";
import {PANEL_LEFT, PANEL_MAX_W, STAGE_TOP} from "../frame/SafeZones";

/**
 * "1 in 8" as a picture: `total` units, `count` of them lit. Ratios read
 * better as counted things than as a percentage. Keep `total` small enough to
 * count (≤ 100); a ratio like 1 in 10,000 needs another picture.
 */
export const UnitGrid: React.FC<{
  total: number;
  count: number;
  palette: Palette;
  at?: number;
  /** Frame the lit units change colour (default after all units are in). */
  light?: number;
  cols?: number;
  shape?: "person" | "dot";
  label?: string;
  top?: number;
  color?: string;
}> = ({total, count, palette, at = 0, light, cols, shape = "person", label, top = STAGE_TOP, color}) => {
  const frame = useCurrentFrame();
  const n = Math.max(1, Math.min(200, Math.round(total)));
  const c = cols ?? Math.min(10, Math.ceil(Math.sqrt(n * 1.6)));
  const cell = PANEL_MAX_W / c;
  const lightAt = light ?? at + Math.min(30, n) + 8;
  const tone = color ?? palette.warn;
  const lab = interpolate(frame, [lightAt, lightAt + 12], [0, 1], {...clamp, easing: easeOut});
  return (
    <div style={{position: "absolute", left: PANEL_LEFT, width: PANEL_MAX_W, top, fontFamily: FONT.sans}}>
      <div style={{display: "flex", flexWrap: "wrap"}}>
        {Array.from({length: n}, (_, i) => {
          // Units arrive in a wave, at most one second end to end.
          const from = at + (i / n) * Math.min(30, n);
          const k = interpolate(frame, [from, from + 8], [0, 1], {...clamp, easing: easeOut});
          const on = i < count ? interpolate(frame, [lightAt + i * 2, lightAt + i * 2 + 6], [0, 1], clamp) : 0;
          const fill = on > 0.5 ? tone : `${palette.muted}66`;
          return (
            <div key={i} style={{width: cell, height: cell * (shape === "person" ? 1.25 : 1), display: "flex", alignItems: "center", justifyContent: "center"}}>
              <svg
                width={cell * 0.78}
                height={cell * (shape === "person" ? 1.1 : 0.78)}
                viewBox={shape === "person" ? "0 0 40 56" : "0 0 40 40"}
                style={{opacity: k, transform: `scale(${(0.6 + 0.4 * k) * (1 + 0.15 * Math.sin(on * Math.PI))})`}}
              >
                {shape === "person" ? (
                  <>
                    <circle cx={20} cy={10} r={9} fill={fill} />
                    <path d="M4 54 V34 Q4 22 20 22 Q36 22 36 34 V54 Z" fill={fill} />
                  </>
                ) : (
                  <circle cx={20} cy={20} r={18} fill={fill} />
                )}
              </svg>
            </div>
          );
        })}
      </div>
      {label ? (
        <div style={{marginTop: 26, textAlign: "center", fontSize: 44, fontWeight: 800, color: palette.text, opacity: lab, textShadow: "0 2px 10px rgba(0,0,0,0.7)"}}>
          {label}
        </div>
      ) : null}
    </div>
  );
};
