import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {clamp, ease, easeOut} from "../motion/anim";
import {FONT, W, type Palette} from "../theme";
import {STAGE_TOP} from "../frame/SafeZones";

/**
 * Digits that roll like an odometer from `from` to `to`: a year jumping
 * forward ("1912 → 1985"), a counter turning over. Each digit rolls with the
 * ones below it, so the motion shows HOW FAR the number travels. For a count
 * that starts at zero, `BigCount` is simpler.
 */
export const Odometer: React.FC<{
  from: number;
  to: number;
  palette: Palette;
  at?: number;
  frames?: number;
  /** Number of digit tiles (default: enough for both numbers). */
  digits?: number;
  size?: number;
  label?: string;
  top?: number;
  x?: number;
  color?: string;
}> = ({from, to, palette, at = 0, frames = 45, digits, size = 170, label, top = STAGE_TOP, x = W / 2, color}) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [at, at + frames], [0, 1], {...clamp, easing: ease});
  const show = interpolate(frame, [at - 8, at], [0, 1], {...clamp, easing: easeOut});
  const lab = interpolate(frame, [at + frames, at + frames + 12], [0, 1], {...clamp, easing: easeOut});
  const v = Math.max(0, from + (to - from) * k);
  const d = digits ?? String(Math.max(Math.round(from), Math.round(to), 1)).length;
  const tileW = size * 0.72;
  const tileH = size * 1.2;
  const tone = color ?? palette.text;
  return (
    <div style={{position: "absolute", left: x, top, transform: "translateX(-50%)", opacity: show, fontFamily: FONT.sans, textAlign: "center"}}>
      <div style={{display: "flex", gap: size * 0.08, justifyContent: "center"}}>
        {Array.from({length: d}, (_, i) => {
          const place = 10 ** (d - 1 - i);
          // Continuous digit position: whole part is the digit, the fraction rolls it on
          // only while every lower digit is passing 9 → 0.
          const lower = v % place;
          const whole = Math.floor(v / place) % 10;
          const carry = place === 1 ? v % 1 : Math.max(0, lower - (place - 1));
          const pos = whole + Math.min(1, carry);
          return (
            <div
              key={i}
              style={{
                position: "relative",
                width: tileW,
                height: tileH,
                overflow: "hidden",
                borderRadius: size * 0.12,
                background: `linear-gradient(${palette.surface}, ${palette.deep})`,
                boxShadow: "0 12px 30px rgba(0,0,0,0.45), inset 0 0 0 2px rgba(255,255,255,0.06)",
              }}
            >
              <div style={{transform: `translateY(${-pos * tileH}px)`}}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n, j) => (
                  <div key={j} style={{height: tileH, lineHeight: `${tileH}px`, fontSize: size, fontWeight: 900, color: tone, fontVariantNumeric: "tabular-nums"}}>
                    {n}
                  </div>
                ))}
              </div>
              <div style={{position: "absolute", left: 0, right: 0, top: tileH / 2 - 1, height: 2, background: "rgba(0,0,0,0.35)"}} />
            </div>
          );
        })}
      </div>
      {label ? <div style={{marginTop: 26, fontSize: 40, fontWeight: 700, color: palette.text, opacity: lab, textShadow: "0 2px 10px rgba(0,0,0,0.7)"}}>{label}</div> : null}
    </div>
  );
};
