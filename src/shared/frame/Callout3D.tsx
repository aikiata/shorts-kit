import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {useFormat} from "../format";
import {FONT} from "../theme";
import {projectToScreen, type CameraRig, type Vec3} from "../three/cameraPath";

/**
 * Callout: an UPPERCASE label in a dark tag with a thin leader line ending in a
 * ring on the thing it names.
 *
 *  - `Callout`   2D: you give pixel coordinates.
 *  - `Callout3D` the target is a 3D world point; it is projected through the SAME
 *                camera rig that drives the canvas, so the leader stays glued to
 *                the object while the camera moves. The tag keeps a fixed pixel
 *                offset from the point and is clamped into the safe area.
 *
 * Both draw on over `DRAW` frames from `from` and fade out at `to`. `color` is the
 * entity colour: keep one colour per thing across the whole video.
 */
const DRAW = 10;
const TAG_H = 52;

type Common = {
  label: string;
  color: string;
  from: number;
  to?: number;
  /** Which tag edge the line leaves from. */
  align?: "left" | "right";
};

const useReveal = (from: number, to?: number) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [from, from + DRAW], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const alpha = to === undefined ? 1 : interpolate(frame, [to - 6, to], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return {p, alpha};
};

/** Estimated tag width: uppercase at 28px with 2px tracking. */
const tagWidth = (label: string) => Math.round(label.length * 19 + 40);

const Drawing: React.FC<Common & {target: {x: number; y: number}; tag: {x: number; y: number}; p: number; alpha: number}> = ({label, color, align = "left", target, tag, p, alpha}) => {
  const {w: W, h: H} = useFormat();
  const w = tagWidth(label);
  const left = align === "left" ? tag.x : tag.x - w;
  const ax = align === "left" ? left : left + w;
  const ay = tag.y;
  const len = Math.hypot(target.x - ax, target.y - ay);
  return (
    <div style={{position: "absolute", inset: 0, opacity: alpha, pointerEvents: "none"}}>
      <svg width={W} height={H} style={{position: "absolute", inset: 0}}>
        <line x1={ax} y1={ay} x2={target.x} y2={target.y} stroke={color} strokeWidth={3} strokeDasharray={len} strokeDashoffset={len * (1 - p)} strokeLinecap="round" />
        <circle cx={target.x} cy={target.y} r={interpolate(p, [0.6, 1], [0, 11], {extrapolateLeft: "clamp"})} fill="none" stroke={color} strokeWidth={3} />
        <circle cx={target.x} cy={target.y} r={interpolate(p, [0.6, 1], [0, 4], {extrapolateLeft: "clamp"})} fill={color} />
      </svg>
      <div
        style={{
          position: "absolute",
          left,
          top: ay - TAG_H / 2,
          height: TAG_H,
          width: w,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(8,13,19,0.86)",
          border: `2px solid ${color}`,
          borderRadius: 6,
          color: "#fff",
          fontFamily: FONT.sans,
          fontWeight: 800,
          fontSize: 28,
          letterSpacing: 2,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          opacity: interpolate(p, [0, 0.4], [0, 1], {extrapolateRight: "clamp"}),
        }}
      >
        {label}
      </div>
    </div>
  );
};

export const Callout: React.FC<Common & {target: {x: number; y: number}; tag: {x: number; y: number}}> = ({from, to, ...rest}) => {
  const {p, alpha} = useReveal(from, to);
  return <Drawing {...rest} from={from} to={to} p={p} alpha={alpha} />;
};

export const Callout3D: React.FC<Common & {rig: CameraRig; point: Vec3 | ((frame: number) => Vec3); offset: {x: number; y: number}}> = ({rig, point, offset, from, to, ...rest}) => {
  const frame = useCurrentFrame();
  const {w, h, safe} = useFormat();
  const {p, alpha} = useReveal(from, to);
  const pt = typeof point === "function" ? point(frame) : point;
  const s = projectToScreen(rig(frame), pt, w, h);
  if (!s.visible) return null;
  // Keep the tag inside the safe band; the leader still reaches the true point.
  const tag = {x: s.x + offset.x, y: Math.max(safe.top + 150, Math.min(safe.bottom - 120, s.y + offset.y))};
  const tw = tagWidth(rest.label);
  const a = rest.align ?? "left";
  // Below the platform rail's top the tag must also stay left of the button rail.
  const maxRight = safe.rail && tag.y + TAG_H / 2 >= safe.rail.fromY ? safe.rail.x - 16 : Math.min(w - 40, safe.right);
  tag.x = a === "left" ? Math.max(40, Math.min(maxRight - tw, tag.x)) : Math.max(40 + tw, Math.min(maxRight, tag.x));
  // Fade when the point leaves the frame so the line never dangles.
  return <Drawing {...rest} from={from} to={to} target={s} tag={tag} p={p} alpha={alpha * (s.onScreen ? 1 : 0)} />;
};
