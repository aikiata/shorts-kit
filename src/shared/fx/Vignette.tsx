import React from "react";
import {AbsoluteFill} from "remotion";

/** Darkened frame edges that pull the eye to the centre. Draw above the scene, below text. */
export const Vignette: React.FC<{strength?: number; color?: string}> = ({strength = 0.5, color = "0,0,0"}) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `radial-gradient(ellipse 80% 62% at 50% 50%, rgba(${color},0) 55%, rgba(${color},${strength}) 100%)`,
    }}
  />
);
