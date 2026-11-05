import React, {useId} from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";
import {clamp} from "../motion/anim";
import {svgId} from "../random";
import {FONT} from "../theme";

/**
 * A rubber stamp slammed onto the subject: FALSE, MYTH, CONFIRMED, 1945.
 * Uneven ink comes from a fixed noise mask. A stamp is a verdict, so it is
 * only for a verdict a verified record supports (§9).
 */
export const Stamp: React.FC<{
  text: string;
  /** Centre, in frame pixels. */
  x: number;
  y: number;
  color: string;
  at?: number;
  rotate?: number;
  size?: number;
  seed?: number;
}> = ({text, x, y, color, at = 0, rotate = -12, size = 96, seed = 4}) => {
  const frame = useCurrentFrame();
  const id = svgId(useId(), "stamp");
  const hit = interpolate(frame, [at - 5, at], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
  const scale = interpolate(hit, [0, 1], [1.9, 1]) * interpolate(frame, [at, at + 4, at + 8], [1, 1.05, 1], clamp);
  return (
    <>
      <svg width={0} height={0} style={{position: "absolute"}}>
        <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency={0.75} numOctaves={2} seed={seed} result="n" />
          {/* alpha = 1.75 − 2.6·R: mostly solid ink, with worn specks. */}
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.6 0 0 0 1.75" result="m" />
          <feComposite in="SourceGraphic" in2="m" operator="in" />
        </filter>
      </svg>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`,
          opacity: hit,
          filter: `url(#${id})`,
        }}
      >
        <div
          style={{
            padding: `${size * 0.14}px ${size * 0.32}px`,
            border: `${Math.max(6, size * 0.08)}px solid ${color}`,
            borderRadius: size * 0.16,
            fontFamily: FONT.sans,
            fontSize: size,
            fontWeight: 900,
            letterSpacing: size * 0.06,
            textTransform: "uppercase",
            lineHeight: 1,
            color,
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </div>
      </div>
    </>
  );
};
