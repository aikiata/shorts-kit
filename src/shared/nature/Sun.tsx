import React from "react";
import {W} from "../theme";
import {HORIZON} from "./skies";

/**
 * Sun with a wide soft glow, clipped at the horizon so a setting sun sinks
 * behind the sea. Animate `y` toward the horizon for a sunset.
 */
export const Sun: React.FC<{
  x?: number;
  y?: number;
  size?: number;
  /** Opacity 0–1. */
  on?: number;
  tone?: string;
  glow?: string;
  horizon?: number;
}> = ({x = 900, y = 700, size = 110, on = 1, tone = "#FFF6D6", glow = "rgba(255,236,170,0.55)", horizon = HORIZON}) => (
  <div style={{position: "absolute", left: 0, top: 0, width: W, height: horizon, overflow: "hidden", opacity: on}}>
    <div
      style={{
        position: "absolute",
        left: x - size * 3,
        top: y - size * 3,
        width: size * 6,
        height: size * 6,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${glow} 0%, rgba(0,0,0,0) 60%)`,
      }}
    />
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        background: tone,
        boxShadow: `0 0 ${size}px ${size / 3}px ${glow}`,
      }}
    />
  </div>
);

/** Sun look per sky, for `<Sun {...SUNS.dusk} />`. Dusk is low and orange, harsh is big and white. */
export const SUNS = {
  day: {size: 110, on: 0.6},
  harsh: {size: 220, on: 1},
  dawn: {size: 110, on: 0.95, tone: "#FFE2B0", glow: "rgba(255,178,110,0.6)"},
  dusk: {size: 150, on: 1, x: 250, tone: "#FFC27A", glow: "rgba(255,140,80,0.65)"},
} as const;
