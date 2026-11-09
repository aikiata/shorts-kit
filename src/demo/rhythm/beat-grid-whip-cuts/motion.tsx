import type { CSSProperties, ReactNode } from "react";
import { useId } from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame } from "remotion";

export const FPS = 30;
export const f = (s: number) => Math.round(s * FPS);
export const OUT = Easing.bezier(0.22, 1, 0.36, 1); // --kn-ease-out
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const prog = (frame: number, a: number, b: number) => interpolate(frame, [f(a), f(b)], [0, 1], { ...clamp, easing: OUT });
export const OV = 9; // frames two shots overlap during a whip transition

/** A word of kinetic type: rises, unblurs and settles on its cue (seconds, scene-local). */
export function Word({ children, at, style }: { children: ReactNode; at: number; style?: CSSProperties }) {
  const frame = useCurrentFrame();
  const sp = spring({ frame: frame - f(at), fps: FPS, config: { damping: 15, stiffness: 150, mass: 0.8 } });
  const k = Math.max(0, Math.min(1, sp));
  return <span style={{ display: "inline-block", opacity: Math.min(1, k * 1.8), transform: `translateY(${(1 - sp) * 24}px) scale(${0.94 + 0.06 * sp})`, filter: k < 0.995 ? `blur(${(1 - k) * 8}px)` : undefined, ...style }}>{children}</span>;
}

/** One shot of the cut, with whip-pan transitions: the first and last OV frames slide it sideways with horizontal motion blur. */
export function Shot({ dur, inW = true, outW = true, children }: { dur: number; inW?: boolean; outW?: boolean; children: ReactNode }) {
  const frame = useCurrentFrame();
  const fid = `mb${useId().replace(/[^a-z0-9]/gi, "")}`; // one filter per shot (two shots overlap during a whip)
  const i = inW ? 1 - interpolate(frame, [0, OV], [0, 1], { ...clamp, easing: OUT }) : 0;
  const o = outW ? interpolate(frame, [dur - OV, dur], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) }) : 0;
  const x = i * 1500 - o * 1500;
  const blur = (i + o) * 46;
  return (
    <AbsoluteFill style={{ transform: x ? `translateX(${x}px)` : undefined, filter: blur > 0.5 ? `url(#${fid})` : undefined }}>
      {blur > 0.5 && (
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <filter id={fid} x="-20%" y="0" width="140%" height="100%"><feGaussianBlur stdDeviation={`${blur} 0`} /></filter>
        </svg>
      )}
      {children}
    </AbsoluteFill>
  );
}

