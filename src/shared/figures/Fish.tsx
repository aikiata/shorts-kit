import React from "react";
import {useCurrentFrame} from "remotion";

/**
 * Side-view fish, head toward `dir`, tail wagging. An SVG group: place it in an
 * `<svg>` under water or in a hand.
 */
export const Fish: React.FC<{
  x: number;
  y: number;
  scale?: number;
  dir?: 1 | -1;
  fill?: string;
  /** Tail offset in px; defaults to a wag driven by the frame. */
  wag?: number;
  opacity?: number;
  frame?: number;
}> = ({x, y, scale = 1, dir = 1, fill = "#9FB7C2", wag, opacity = 1, frame}) => {
  const now = useCurrentFrame();
  const w = wag ?? Math.sin((frame ?? now) / 3 + x * 0.01) * 4;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * dir} ${scale})`} opacity={opacity}>
      <path d={`M -26 0 L -40 ${-12 + w} L -40 ${12 + w} Z`} fill={fill} />
      <ellipse cx={0} cy={0} rx={28} ry={10} fill={fill} />
      <path d="M -4 -9 Q 4 -18 12 -9 Z" fill={fill} />
      <circle cx={16} cy={-2} r={2} fill="#06141C" opacity={0.7} />
    </g>
  );
};
