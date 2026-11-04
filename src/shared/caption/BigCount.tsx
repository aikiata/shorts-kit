import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {clamp, ease, easeOut} from "../motion/anim";
import {FONT, type Palette} from "../theme";
import {PANEL_LEFT, PANEL_MAX_W, STAGE_TOP} from "../frame/SafeZones";

/**
 * One big number that counts up to its value, with a short label under it.
 * The number must come from a verified fact record (§9); the label names what
 * it counts in the viewer's words (§7d).
 */
export const BigCount: React.FC<{
  value: number;
  palette: Palette;
  from?: number;
  frames?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  size?: number;
  top?: number;
  color?: string;
}> = ({value, palette, from = 0, frames = 30, decimals = 0, prefix = "", suffix = "", label, size = 240, top = STAGE_TOP, color}) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [from, from + frames], [0, 1], {...clamp, easing: ease});
  const show = interpolate(frame, [from - 4, from + 6], [0, 1], {...clamp, easing: easeOut});
  const n = (value * k).toFixed(decimals);
  return (
    <div
      style={{position: "absolute", left: PANEL_LEFT, width: PANEL_MAX_W, top, textAlign: "center", fontFamily: FONT.sans, opacity: show}}
    >
      <div
        style={{
          fontSize: size,
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: -6,
          color: color ?? palette.warn,
          fontVariantNumeric: "tabular-nums",
          textShadow: "0 10px 40px rgba(0,0,0,0.5)",
        }}
      >
        {prefix}
        {n}
        {suffix}
      </div>
      {label ? (
        <div style={{marginTop: 18, fontSize: 40, fontWeight: 700, color: palette.text, textShadow: "0 2px 10px rgba(0,0,0,0.7)"}}>
          {label}
        </div>
      ) : null}
    </div>
  );
};
