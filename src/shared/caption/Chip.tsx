import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {clamp, easeOut} from "../motion/anim";
import {FONT, type Palette} from "../theme";

/**
 * A small label tag: a kicker, a source line, a date, "not to scale". Keep it
 * under `kickerMaxChars`. Position it yourself, inside the safe area.
 */
export const Chip: React.FC<{
  label: string;
  palette: Palette;
  at?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({label, palette, at = 0, color, style}) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [at, at + 10], [0, 1], {...clamp, easing: easeOut});
  return (
    <div
      style={{
        position: "absolute",
        display: "inline-block",
        padding: "12px 24px",
        borderRadius: 999,
        background: `${palette.deep}E6`,
        border: `2px solid ${color ?? palette.accent}`,
        color: color ?? palette.accent,
        fontFamily: FONT.sans,
        fontWeight: 800,
        fontSize: 30,
        letterSpacing: 2,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        opacity: k,
        transform: `translateY(${(1 - k) * 16}px)`,
        ...style,
      }}
    >
      {label}
    </div>
  );
};
