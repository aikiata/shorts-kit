import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {clamp, easeOut} from "../motion/anim";
import {FONT, type Palette} from "../theme";
import {PANEL_LEFT, PANEL_MAX_W, STAGE_TOP} from "../frame/SafeZones";

/**
 * The turn in one shot: what the viewer believed is struck through, and the
 * fact replaces it (§1). Put the strike on the word that negates, the swap on
 * the word that names the truth. Both words must come from verified records
 * (§9): a myth is a claim too, and needs its source.
 */
export const StrikeReplace: React.FC<{
  /** What the viewer believed. */
  from: string;
  /** What is true. */
  to: string;
  palette: Palette;
  /** Frame the strike line starts drawing. */
  at?: number;
  /** Frame the true word arrives (default 18 frames after the strike). */
  swap?: number;
  size?: number;
  top?: number;
  kicker?: string;
}> = ({from, to, palette, at = 0, swap, size = 132, top = STAGE_TOP, kicker}) => {
  const frame = useCurrentFrame();
  const swapAt = swap ?? at + 18;
  const show = interpolate(frame, [at - 8, at], [0, 1], {...clamp, easing: easeOut});
  const strike = interpolate(frame, [at, at + 8], [0, 1], {...clamp, easing: easeOut});
  const k = interpolate(frame, [swapAt, swapAt + 12], [0, 1], {...clamp, easing: easeOut});
  // Keep moving after the swap (§12): a slow push on the true word.
  const coast = interpolate(frame, [swapAt + 12, swapAt + 120], [1, 1.04], clamp);
  const line = size * 1.05;
  return (
    <div
      style={{
        position: "absolute",
        left: PANEL_LEFT,
        width: PANEL_MAX_W,
        top,
        textAlign: "center",
        fontFamily: FONT.sans,
        opacity: show,
        // Before the swap the struck word sits where the pair will be centred.
        transform: `translateY(${(1 - k) * line * 0.5}px)`,
      }}
    >
      {kicker ? (
        <div style={{fontSize: 34, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase", color: palette.accentSoft, marginBottom: 18}}>
          {kicker}
        </div>
      ) : null}
      <div
        style={{
          position: "relative",
          display: "inline-block",
          fontSize: size,
          fontWeight: 900,
          lineHeight: 1.05,
          letterSpacing: -2,
          color: strike > 0.5 ? palette.muted : palette.text,
          transform: `scale(${1 - 0.38 * k})`,
          transformOrigin: "50% 100%",
          opacity: 1 - 0.4 * k,
        }}
      >
        {from}
        <div
          style={{
            position: "absolute",
            left: -size * 0.08,
            right: -size * 0.08,
            top: "52%",
            height: Math.max(8, size * 0.09),
            borderRadius: 999,
            background: palette.bad,
            transform: `scaleX(${strike}) rotate(-3deg)`,
            transformOrigin: "0 50%",
          }}
        />
      </div>
      <div
        style={{
          fontSize: size,
          fontWeight: 900,
          lineHeight: 1.05,
          letterSpacing: -2,
          color: palette.accent,
          opacity: k,
          transform: `translateY(${(1 - k) * 50}px) scale(${coast})`,
          textShadow: "0 10px 40px rgba(0,0,0,0.5)",
        }}
      >
        {to}
      </div>
    </div>
  );
};
