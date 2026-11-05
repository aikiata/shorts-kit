import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {clamp, easeOut} from "../motion/anim";
import {FONT, FPS, type Palette} from "../theme";
import {PANEL_LEFT, PANEL_MAX_W, STAGE_TOP} from "../frame/SafeZones";

/**
 * Text typed out letter by letter, with a cursor. For words that exist
 * somewhere: a quote, a law, a telegram, a line from a document. `source` is
 * required on purpose: typed text reads as a record, so it must name one
 * (§5 "no fake documents"). Untyped letters keep their space, so lines never
 * reflow while typing.
 */
export const Typewriter: React.FC<{
  text: string;
  /** Who said or wrote it, and when. Shown when typing ends. */
  source: string;
  palette: Palette;
  at?: number;
  /** Characters per second. Match it to the voice when the voice reads the text. */
  cps?: number;
  size?: number;
  top?: number;
  mono?: boolean;
}> = ({text, source, palette, at = 0, cps = 20, size = 64, top = STAGE_TOP, mono = true}) => {
  const frame = useCurrentFrame();
  const chars = Array.from(text);
  const n = Math.max(0, Math.floor(((frame - at) * cps) / FPS));
  const done = n >= chars.length;
  const doneAt = at + Math.ceil((chars.length * FPS) / cps);
  const cursorOn = !done || Math.floor((frame - doneAt) / 15) % 2 === 0;
  const show = interpolate(frame, [at - 8, at], [0, 1], {...clamp, easing: easeOut});
  const src = interpolate(frame, [doneAt + 4, doneAt + 16], [0, 1], {...clamp, easing: easeOut});
  return (
    <div
      style={{
        position: "absolute",
        left: PANEL_LEFT,
        width: PANEL_MAX_W,
        top,
        opacity: show,
        padding: "40px 44px",
        boxSizing: "border-box",
        borderRadius: 20,
        background: `${palette.deep}E6`,
        borderLeft: `8px solid ${palette.accent}`,
      }}
    >
      <div
        style={{
          fontFamily: mono ? FONT.mono : FONT.sans,
          fontSize: size,
          fontWeight: 600,
          lineHeight: 1.3,
          color: palette.text,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {chars.map((c, i) => (
          <React.Fragment key={i}>
            {i === n ? <Cursor on={cursorOn} color={palette.accent} /> : null}
            <span style={{opacity: i < n ? 1 : 0}}>{c}</span>
          </React.Fragment>
        ))}
        {done ? <Cursor on={cursorOn} color={palette.accent} /> : null}
      </div>
      <div style={{marginTop: 28, fontFamily: FONT.sans, fontSize: 32, fontWeight: 700, color: palette.muted, opacity: src}}>— {source}</div>
    </div>
  );
};

const Cursor: React.FC<{on: boolean; color: string}> = ({on, color}) => (
  // Zero net width (the negative margin), so the cursor never pushes a line break.
  <span style={{display: "inline-block", width: "0.08em", height: "1em", marginRight: "-0.08em", verticalAlign: "-0.14em", background: color, opacity: on ? 1 : 0}} />
);
