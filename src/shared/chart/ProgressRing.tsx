import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {clamp, ease, easeOut} from "../motion/anim";
import {FONT, W, type Palette} from "../theme";
import {STAGE_TOP} from "../frame/SafeZones";

/**
 * A share of a whole as a ring that fills to `value` percent, the number
 * counting up in the middle. One ring, one share: two shares that add to 100
 * are one ring, not two.
 */
export const ProgressRing: React.FC<{
  /** 0..100. */
  value: number;
  palette: Palette;
  at?: number;
  frames?: number;
  decimals?: number;
  label?: string;
  size?: number;
  /** Centre x; default the frame centre. */
  x?: number;
  top?: number;
  color?: string;
  stroke?: number;
}> = ({value, palette, at = 0, frames = 36, decimals = 0, label, size = 460, x = W / 2, top = STAGE_TOP, color, stroke = 44}) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [at, at + frames], [0, 1], {...clamp, easing: ease});
  const show = interpolate(frame, [at - 8, at + 2], [0, 1], {...clamp, easing: easeOut});
  const v = Math.max(0, Math.min(100, value)) * k;
  const r = (size - stroke) / 2;
  const tone = color ?? palette.accent;
  return (
    <div style={{position: "absolute", left: x - size / 2, top, width: size, opacity: show, fontFamily: FONT.sans, textAlign: "center"}}>
      <div style={{position: "relative", width: size, height: size}}>
        <svg width={size} height={size} style={{position: "absolute", inset: 0, transform: "rotate(-90deg)"}}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${palette.surface}CC`} strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={tone}
            strokeWidth={stroke}
            strokeLinecap={v > 0 ? "round" : "butt"}
            pathLength={100}
            strokeDasharray={`${v} 100`}
            style={{filter: `drop-shadow(0 0 18px ${tone}66)`}}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: size * 0.26,
            fontWeight: 900,
            letterSpacing: -4,
            color: palette.text,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {v.toFixed(decimals)}
          <span style={{fontSize: size * 0.13, marginLeft: 4, color: tone}}>%</span>
        </div>
      </div>
      {label ? <div style={{marginTop: 26, fontSize: 40, fontWeight: 700, color: palette.text, textShadow: "0 2px 10px rgba(0,0,0,0.7)"}}>{label}</div> : null}
    </div>
  );
};
