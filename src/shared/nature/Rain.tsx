import React from "react";
import {useCurrentFrame} from "remotion";
import {rnd} from "../random";
import {H, W} from "../theme";

/** Slanted rain over the whole frame. Use `heavy` for a storm; fade with `on`. */
export const Rain: React.FC<{on?: number; heavy?: boolean; color?: string; frame?: number}> = ({on = 1, heavy = false, color = "#D8E8F0", frame}) => {
  const now = useCurrentFrame();
  const f = frame ?? now;
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, opacity: on}}>
      {Array.from({length: heavy ? 140 : 80}, (_, i) => {
        const x = rnd(i) * (W + 300) - 150;
        const y = ((rnd(i + 70) * H + f * (38 + rnd(i + 3) * 18)) % (H + 100)) - 100;
        return <line key={i} x1={x} y1={y} x2={x - 14} y2={y + 46} stroke={color} strokeWidth={2} opacity={0.45} />;
      })}
    </svg>
  );
};
