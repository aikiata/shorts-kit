import React from "react";
import {useCurrentFrame} from "remotion";
import {rnd} from "../random";
import {W} from "../theme";
import {HORIZON} from "./skies";

/** Twinkling star field above the horizon. Fade with `on` as dusk turns to night. */
export const Stars: React.FC<{on?: number; count?: number; horizon?: number; seed?: number; frame?: number}> = ({
  on = 1,
  count = 90,
  horizon = HORIZON,
  seed = 0,
  frame,
}) => {
  const now = useCurrentFrame();
  const f = frame ?? now;
  return (
    <svg width={W} height={horizon} style={{position: "absolute", left: 0, top: 0, opacity: on}}>
      {Array.from({length: count}, (_, i) => {
        const j = i + seed * 1000;
        return (
          <circle
            key={i}
            cx={rnd(j) * W}
            cy={rnd(j + 200) * (horizon - 60)}
            r={0.8 + rnd(j + 400) * 1.8}
            fill="#fff"
            opacity={(0.3 + rnd(j + 600) * 0.6) * (0.75 + 0.25 * Math.sin(f / (6 + rnd(j + 800) * 10) + i))}
          />
        );
      })}
    </svg>
  );
};
