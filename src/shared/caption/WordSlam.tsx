import React from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";
import {clamp, easeOut} from "../motion/anim";
import {rnd} from "../random";
import {FONT, type Palette} from "../theme";
import {PANEL_LEFT, PANEL_MAX_W, STAGE_TOP} from "../frame/SafeZones";

/**
 * One word hits the frame: drops from large, lands with a shake and a shock
 * ring. Reserve it for the punch (the turn, the number nobody expected); a
 * slam on every scene is a metronome. Pairs with the `boom` effect (docs/shots/sfx/boom.md).
 */
export const WordSlam: React.FC<{
  word: string;
  palette: Palette;
  /** Frame the word lands. */
  at?: number;
  size?: number;
  top?: number;
  color?: string;
  /** Shake strength in px; 0 for none. */
  shake?: number;
}> = ({word, palette, at = 0, size = 190, top = STAGE_TOP, color, shake = 14}) => {
  const frame = useCurrentFrame();
  const drop = interpolate(frame, [at - 6, at], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
  const scale = interpolate(drop, [0, 1], [2.8, 1]) * interpolate(frame, [at, at + 150], [1, 1.05], clamp);
  const decay = interpolate(frame, [at, at + 12], [1, 0], clamp);
  const dx = (rnd(frame * 1.7) - 0.5) * 2 * shake * decay;
  const dy = (rnd(frame * 2.3 + 9) - 0.5) * 2 * shake * decay;
  const ring = interpolate(frame, [at, at + 16], [0, 1], {...clamp, easing: easeOut});
  const tone = color ?? palette.warn;
  return (
    <div
      style={{
        position: "absolute",
        left: PANEL_LEFT,
        width: PANEL_MAX_W,
        top,
        height: size * 1.2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT.sans,
        transform: `translate(${dx}px, ${dy}px)`,
      }}
    >
      {frame >= at ? (
        <div
          style={{
            position: "absolute",
            width: size * 2.2,
            height: size * 2.2,
            borderRadius: "50%",
            border: `${10 * (1 - ring) + 2}px solid ${tone}`,
            opacity: 1 - ring,
            transform: `scale(${0.4 + ring})`,
          }}
        />
      ) : null}
      <div
        style={{
          fontSize: size,
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: -4,
          whiteSpace: "nowrap",
          color: tone,
          opacity: drop,
          transform: `scale(${scale})`,
          textShadow: "0 12px 48px rgba(0,0,0,0.55)",
        }}
      >
        {word}
      </div>
    </div>
  );
};
