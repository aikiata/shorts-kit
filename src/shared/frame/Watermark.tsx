import React from "react";
import {interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {clamp} from "../motion/anim";
import {FONT, type Palette} from "../theme";
import {SAFE_TOP} from "./SafeZones";

/**
 * A small channel mark, top-left, inside the safe area. Optional: pass your own
 * text (a handle or a name). It must render AFTER the scene sequences or the
 * scenes paint over it (§7f); ShortsTemplate does that for you.
 */
export const Watermark: React.FC<{text: string; palette: Palette; top?: number; left?: number; opacity?: number}> = ({
  text,
  palette,
  top = SAFE_TOP + 16,
  left = 60,
  opacity = 0.85,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const on = interpolate(frame, [0, Math.round(0.5 * fps)], [0, opacity], clamp);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        opacity: on,
        fontFamily: FONT.sans,
        fontWeight: 800,
        fontSize: 32,
        letterSpacing: 0.3,
        color: palette.text,
        textShadow: "0 0 3px #000, 0 2px 10px rgba(0,0,0,0.9)",
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      {text}
    </div>
  );
};
