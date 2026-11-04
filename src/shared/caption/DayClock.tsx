import React from "react";
import {FONT, type Palette} from "../theme";
import {SAFE_TOP} from "../frame/SafeZones";

/** "12:30" from decimal hours (12.5). */
export const hhmm = (hour: number) => {
  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60);
  return `${h}:${String(m).padStart(2, "0")}`;
};

/** Default part-of-day label; pass your own `partOfDay` for another language. */
export const partOfDayEn = (hour: number) =>
  hour < 5 ? "NIGHT" : hour < 11 ? "MORNING" : hour < 13.5 ? "NOON" : hour < 18 ? "AFTERNOON" : hour < 19.5 ? "DUSK" : "NIGHT";

/**
 * Time of day as a small clock pill under the watermark: the "counter" of a
 * story told over one day (illustrated-scene rule 4, the way moons count a
 * long drift). Drive `hour` from the shot config, e.g. lerp 12.25 → 12.45
 * across the shot; keep the clock on screen across consecutive timed shots so
 * it does not blink at every cut.
 */
export const DayClock: React.FC<{
  /** Decimal hours, 0–24. */
  hour: number;
  palette: Palette;
  /** Second line: a date or a place. */
  date?: string;
  opacity?: number;
  top?: number;
  partOfDay?: (hour: number) => string;
}> = ({hour, palette, date, opacity = 1, top = SAFE_TOP + 96, partOfDay = partOfDayEn}) => {
  const R = 46;
  const minute = (hour % 1) * 360;
  const hourHand = ((hour % 12) / 12) * 360;
  const hand = (deg: number, len: number, w: number) => (
    <line
      x1={R}
      y1={R}
      x2={R + Math.sin((deg * Math.PI) / 180) * len}
      y2={R - Math.cos((deg * Math.PI) / 180) * len}
      stroke={palette.text}
      strokeWidth={w}
      strokeLinecap="round"
    />
  );
  return (
    <div style={{position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center", opacity, fontFamily: FONT.sans}}>
      <div style={{display: "flex", alignItems: "center", gap: 22, padding: "12px 26px 12px 14px", borderRadius: 60, background: `${palette.deep}B3`}}>
        <svg width={R * 2} height={R * 2}>
          <circle cx={R} cy={R} r={R - 3} fill={`${palette.deep}99`} stroke={palette.text} strokeWidth={3} />
          {Array.from({length: 12}, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <circle key={i} cx={R + Math.sin(a) * (R - 11)} cy={R - Math.cos(a) * (R - 11)} r={2.2} fill={palette.text} opacity={0.7} />;
          })}
          {hand(hourHand, R * 0.5, 5)}
          {hand(minute, R * 0.75, 3)}
          <circle cx={R} cy={R} r={4} fill={palette.warn} />
        </svg>
        <div>
          <div style={{fontSize: 46, fontWeight: 900, color: palette.text, fontVariantNumeric: "tabular-nums", lineHeight: 1}}>
            {hhmm(hour)} <span style={{fontSize: 28, fontWeight: 800, letterSpacing: 3, color: palette.warn}}>{partOfDay(hour)}</span>
          </div>
          {date ? <div style={{fontSize: 24, fontWeight: 700, letterSpacing: 2, color: palette.muted, marginTop: 4}}>{date}</div> : null}
        </div>
      </div>
    </div>
  );
};
