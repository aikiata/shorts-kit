import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {clamp, easeOut, ramp} from "../motion/anim";
import {FONT} from "../theme";
import {DrawPath, MarkLayer, smoothPath, wobbleLine, type Pt} from "./rough";

/**
 * A hand-drawn arrow from a label to the spot it names. `to` is the point
 * (the thing being said); `from` is where the label sits. `bend` curves the
 * shaft: positive bows to the left of the direction of travel.
 */
export const ArrowMark: React.FC<{
  from: Pt;
  to: Pt;
  color: string;
  label?: string;
  at?: number;
  frames?: number;
  bend?: number;
  width?: number;
  labelSize?: number;
  seed?: number;
}> = ({from, to, color, label, at = 0, frames = 14, bend = 0.2, width = 9, labelSize = 44, seed = 3}) => {
  const frame = useCurrentFrame();
  const k = ramp(frame, at, frames, easeOut);
  const head = ramp(frame, at + frames - 2, 5, easeOut);
  const lab = interpolate(frame, [at - 6, at + 4], [0, 1], {...clamp, easing: easeOut});
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  // Start the shaft just outside the label so the line never crosses the text.
  const gap = label ? labelSize * 0.9 : 0;
  const a: Pt = [from[0] + ux * gap, from[1] + uy * gap];
  const mid: Pt = [(a[0] + to[0]) / 2 + uy * len * bend, (a[1] + to[1]) / 2 - ux * len * bend];
  const shaft: Pt[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    shaft.push([
      (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * mid[0] + t * t * to[0],
      (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * mid[1] + t * t * to[1],
    ]);
  }
  // The head follows the shaft's last tangent, not the straight line.
  const end = shaft[shaft.length - 1];
  const prev = shaft[shaft.length - 2];
  const ang = Math.atan2(end[1] - prev[1], end[0] - prev[0]);
  const hl = Math.max(28, width * 4.2);
  const wing = (s: number): Pt => [end[0] - Math.cos(ang + s * 0.5) * hl, end[1] - Math.sin(ang + s * 0.5) * hl];
  return (
    <>
      <MarkLayer>
        <DrawPath d={smoothPath(shaft)} k={k} color={color} width={width} />
        <DrawPath d={smoothPath(wobbleLine(wing(1), end, seed, 2, 2))} k={head} color={color} width={width} />
        <DrawPath d={smoothPath(wobbleLine(wing(-1), end, seed + 7, 2, 2))} k={head} color={color} width={width} />
      </MarkLayer>
      {label ? (
        <div
          style={{
            position: "absolute",
            left: from[0],
            top: from[1],
            transform: `translate(-50%, -50%) scale(${0.85 + 0.15 * lab})`,
            opacity: lab,
            fontFamily: FONT.sans,
            fontSize: labelSize,
            fontWeight: 800,
            color,
            whiteSpace: "nowrap",
            textShadow: "0 3px 12px rgba(0,0,0,0.75)",
          }}
        >
          {label}
        </div>
      ) : null}
    </>
  );
};
