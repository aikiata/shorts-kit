import React from "react";
import {useCurrentFrame} from "remotion";
import {rnd} from "../random";
import {W} from "../theme";
import {HORIZON} from "./skies";

/** Flapping birds crossing the sky in a band above the horizon (land is near, or life returns). */
export const Birds: React.FC<{
  count?: number;
  on?: number;
  /** Vertical band the birds fly in, [top, bottom] px. Defaults to the 400 px above the horizon. */
  band?: [number, number];
  /** Horizontal speed multiplier; negative flies right to left. */
  speed?: number;
  color?: string;
  horizon?: number;
  frame?: number;
}> = ({count = 7, on = 1, band, speed = 1, color = "#141C22", horizon = HORIZON, frame}) => {
  const now = useCurrentFrame();
  const f = frame ?? now;
  const [y0, y1] = band ?? [horizon - 460, horizon - 80];
  const span = W + 80;
  return (
    <svg width={W} height={horizon} style={{position: "absolute", left: 0, top: 0, opacity: on}}>
      {Array.from({length: count}, (_, i) => {
        const travel = rnd(i) * span + f * speed * (1.5 + rnd(i + 2) * 2);
        const x = (((travel % span) + span) % span) - 40;
        const y = y0 + rnd(i + 11) * (y1 - y0) + Math.sin(f / 9 + i) * 8;
        const flap = 8 + Math.sin(f / 4 + i * 2) * 6;
        return (
          <path
            key={i}
            d={`M ${x - 18} ${y - flap} Q ${x - 8} ${y - 2} ${x} ${y} Q ${x + 8} ${y - 2} ${x + 18} ${y - flap}`}
            stroke={color}
            strokeWidth={3.5}
            fill="none"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};
