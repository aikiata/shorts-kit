import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {clamp, easeOut} from "../motion/anim";
import {FONT, type Palette} from "../theme";
import {PANEL_LEFT, PANEL_MAX_W, STAGE_TOP} from "../frame/SafeZones";

/**
 * A slot-machine reel that spins through candidates and lands on the answer
 * (the LAST entry of `words`). For "which one was it?": a year, a name, a
 * country. Land it on the word that names the answer.
 */
export const SlotWord: React.FC<{
  words: string[];
  palette: Palette;
  at?: number;
  /** Frames the reel spins before it lands. */
  frames?: number;
  /** How many times the decoys pass before the answer. */
  loops?: number;
  size?: number;
  top?: number;
  color?: string;
  /** Static text before the reel, on the same line ("Built in"). */
  lead?: string;
}> = ({words, palette, at = 0, frames = 36, loops = 2, size = 140, top = STAGE_TOP, color, lead}) => {
  const frame = useCurrentFrame();
  const decoys = words.slice(0, -1);
  const answer = words[words.length - 1] ?? "";
  const reel = [...Array.from({length: loops}, () => decoys).flat(), answer];
  const t = interpolate(frame, [at, at + frames], [0, 1], {...clamp, easing: easeOut});
  const lineH = size * 1.15;
  const pos = t * (reel.length - 1);
  const show = interpolate(frame, [at - 8, at], [0, 1], {...clamp, easing: easeOut});
  const landed = interpolate(frame, [at + frames - 2, at + frames + 8], [0, 1], clamp);
  const longest = Math.max(...reel.map((w) => w.length), 1);
  return (
    <div
      style={{
        position: "absolute",
        left: PANEL_LEFT,
        width: PANEL_MAX_W,
        top,
        textAlign: "center",
        fontFamily: FONT.sans,
        fontSize: size,
        fontWeight: 900,
        letterSpacing: -2,
        opacity: show,
      }}
    >
      {lead ? <div style={{fontSize: size * 0.42, fontWeight: 700, color: palette.text, marginBottom: 12, letterSpacing: 0}}>{lead}</div> : null}
      <div
        style={{
          position: "relative",
          display: "inline-block",
          height: lineH,
          minWidth: `${longest * 0.62}em`,
          overflow: "hidden",
          borderRadius: 24,
          background: `${palette.deep}CC`,
          border: `4px solid ${landed > 0 ? palette.accent : palette.surface}`,
          boxShadow: `0 0 ${60 * landed}px ${palette.accent}55`,
          padding: "0 32px",
          WebkitMaskImage: "linear-gradient(transparent, #000 22%, #000 78%, transparent)",
        }}
      >
        <div style={{transform: `translateY(${-pos * lineH}px)`}}>
          {reel.map((w, i) => (
            <div
              key={i}
              style={{
                height: lineH,
                lineHeight: `${lineH}px`,
                whiteSpace: "nowrap",
                color: i === reel.length - 1 ? (color ?? palette.accent) : palette.muted,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {w}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
