import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {clamp, ease, easeOut} from "../motion/anim";
import {FONT, type Palette} from "../theme";
import {PANEL_LEFT, PANEL_MAX_W, STAGE_TOP} from "../frame/SafeZones";
import {Chip} from "../caption/Chip";

export type Bar = {label: string; value: number; color?: string};

/**
 * Horizontal bars, TRUE TO SCALE: every bar is measured from zero against the
 * largest value (§5 "scale is an ethical question"). There is no axis-cropping
 * option. If a gap is too big to read (1 vs 10,000), say so with
 * `notToScale`, which puts the label on frame, or pick another picture.
 * Every value comes from a verified fact record (§9).
 */
export const CompareBars: React.FC<{
  bars: Bar[];
  palette: Palette;
  at?: number;
  /** Frames between one bar and the next. */
  stagger?: number;
  frames?: number;
  format?: (n: number) => string;
  unit?: string;
  top?: number;
  barH?: number;
  /** Shows a "not to scale" chip; required when bars are not proportional. */
  notToScale?: boolean;
  /** Which bar is the point (accent colour); others are muted. */
  focus?: number;
}> = ({bars, palette, at = 0, stagger = 8, frames = 24, format, unit = "", top = STAGE_TOP, barH = 64, notToScale = false, focus}) => {
  const frame = useCurrentFrame();
  const max = Math.max(...bars.map((b) => b.value), 0) || 1;
  const fmt = format ?? ((n: number) => Math.round(n).toLocaleString("en-US"));
  const valueW = 220;
  const trackW = PANEL_MAX_W - valueW;
  return (
    <div style={{position: "absolute", left: PANEL_LEFT, width: PANEL_MAX_W, top, fontFamily: FONT.sans}}>
      {bars.map((b, i) => {
        const from = at + i * stagger;
        const show = interpolate(frame, [from - 6, from + 4], [0, 1], {...clamp, easing: easeOut});
        const k = interpolate(frame, [from, from + frames], [0, 1], {...clamp, easing: ease});
        const w = (b.value / max) * trackW * k;
        const tone = b.color ?? (focus === undefined || focus === i ? palette.accent : palette.muted);
        return (
          <div key={b.label} style={{marginBottom: 34, opacity: show}}>
            <div style={{fontSize: 38, fontWeight: 700, color: palette.text, marginBottom: 10, textShadow: "0 2px 10px rgba(0,0,0,0.6)"}}>{b.label}</div>
            <div style={{display: "flex", alignItems: "center"}}>
              <div style={{width: trackW, height: barH, position: "relative"}}>
                <div style={{position: "absolute", inset: 0, borderRadius: 12, background: `${palette.surface}AA`}} />
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: barH,
                    // A value too small to see still gets a hairline, never a fake width.
                    width: b.value > 0 ? Math.max(4, w) : 0,
                    borderRadius: 12,
                    background: tone,
                    boxShadow: `0 0 30px ${tone}44`,
                  }}
                />
              </div>
              <div
                style={{
                  width: valueW,
                  paddingLeft: 22,
                  boxSizing: "border-box",
                  fontSize: 48,
                  fontWeight: 900,
                  color: tone,
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                }}
              >
                {fmt(b.value * k)}
                {unit}
              </div>
            </div>
          </div>
        );
      })}
      {notToScale ? <Chip label="not to scale" palette={palette} at={at} color={palette.muted} style={{position: "relative", marginTop: 6}} /> : null}
    </div>
  );
};
