import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {clamp, easeOut} from "../motion/anim";
import {FONT, type Palette} from "../theme";
import {PANEL_LEFT, PANEL_MAX_W, STAGE_TOP} from "../frame/SafeZones";
import {normalizeWord} from "../timings";

/**
 * A big kinetic headline: words appear one by one and settle. For on-frame
 * text that carries a fact the ear cannot hold (a number, a name), never a
 * copy of the sentence being read (§7c), and at most `headlineMaxWords` words.
 *
 * Time it from the voice: pass `cues` (one frame per word, e.g. from
 * `wordFrame`) so each word lands when it is spoken, or `from` + `stagger`.
 */
export const TypeStage: React.FC<{
  text: string;
  palette: Palette;
  from?: number;
  stagger?: number;
  cues?: number[];
  /** Words drawn in the accent colour. */
  accent?: string[];
  size?: number;
  top?: number;
  align?: "left" | "center";
  color?: string;
  /** Optional small label above the headline (≤ kickerMaxChars). */
  kicker?: string;
}> = ({text, palette, from = 0, stagger = 4, cues, accent = [], size = 112, top = STAGE_TOP, align = "center", color, kicker}) => {
  const frame = useCurrentFrame();
  const words = text.split(/\s+/).filter(Boolean);
  const hot = new Set(accent.map(normalizeWord));
  const kIn = interpolate(frame, [from - 6, from + 6], [0, 1], {...clamp, easing: easeOut});
  return (
    <div
      style={{
        position: "absolute",
        left: PANEL_LEFT,
        width: PANEL_MAX_W,
        top,
        textAlign: align,
        fontFamily: FONT.sans,
        pointerEvents: "none",
      }}
    >
      {kicker ? (
        <div
          style={{
            opacity: kIn,
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: palette.accentSoft,
            marginBottom: 18,
          }}
        >
          {kicker}
        </div>
      ) : null}
      <div style={{fontSize: size, fontWeight: 900, lineHeight: 1.02, letterSpacing: -2, color: color ?? palette.text}}>
        {words.map((w, i) => {
          const at = cues?.[i] ?? from + i * stagger;
          const k = interpolate(frame, [at, at + 8], [0, 1], {...clamp, easing: easeOut});
          return (
            <span
              key={`${w}-${i}`}
              style={{
                display: "inline-block",
                opacity: k,
                transform: `translateY(${(1 - k) * 40}px) scale(${0.9 + 0.1 * k})`,
                color: hot.has(normalizeWord(w)) ? palette.accent : undefined,
                marginRight: i < words.length - 1 ? size * 0.25 : 0,
                textShadow: "0 8px 30px rgba(0,0,0,0.45)",
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};
