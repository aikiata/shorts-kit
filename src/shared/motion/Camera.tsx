import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {H, W} from "../theme";
import {ease, lerp} from "./anim";

export type CameraMove = {
  /** Zoom at t = 0 and t = 1. Always clamped to ≥ 1 so the world's edge never shows. */
  z: [number, number];
  /** Point the zoom is centred on at t = 0, px. Default: frame centre. */
  at?: [number, number];
  /** Point at t = 1 (a pan). Default: same as `at`. */
  to?: [number, number];
  /** Hand-held shake amplitude, px (storms: 4–10). */
  shake?: number;
};

/**
 * Speed-floored easing (§12): smoothstep blended with linear so the move never
 * lands at zero speed; past t = 1 it keeps coasting in the same direction.
 */
export const camEase = (t: number, tail = 0.34) =>
  t <= 1 ? lerp(ease(Math.max(0, t)), Math.max(0, t), tail) : 1 + (t - 1) * tail;

/**
 * Camera inside an illustrated world: zoom around a point, pan between two
 * points, optional shake. Wrap the world (not the captions) and drive `t` 0→1
 * over the shot; share one move across shots on the same image.
 */
export const Camera: React.FC<{
  move?: CameraMove;
  /** Progress through the move, 0–1 (values past 1 coast). */
  t: number;
  /** Exit speed as a fraction of the average speed; 0 = plain smoothstep. */
  tail?: number;
  frame?: number;
  children: React.ReactNode;
}> = ({move, t, tail = 0.34, frame, children}) => {
  const now = useCurrentFrame();
  if (!move) return <AbsoluteFill>{children}</AbsoluteFill>;
  const f = frame ?? now;
  const k = camEase(t, tail);
  const sh = move.shake ?? 0;
  // Zoom ≥ 1, plus just enough extra that the shake never uncovers an edge.
  const z = Math.max(1 + (2.2 * sh) / W, lerp(move.z[0], move.z[1], k));
  const at = move.at ?? [W / 2, H / 2];
  const to = move.to ?? at;
  const ox = lerp(at[0], to[0], k);
  const oy = lerp(at[1], to[1], k);
  const jx = sh * (Math.sin(f * 0.83) * 0.6 + Math.sin(f * 2.1 + 1) * 0.4);
  const jy = sh * 0.7 * (Math.sin(f * 1.07 + 2) * 0.6 + Math.sin(f * 2.7) * 0.4);
  // Shake is applied before the scale, so scale the jitter down to keep it the same on screen.
  return (
    <AbsoluteFill style={{overflow: "hidden"}}>
      <AbsoluteFill style={{transform: `scale(${z}) translate(${jx / z}px, ${jy / z}px)`, transformOrigin: `${ox}px ${oy}px`}}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
