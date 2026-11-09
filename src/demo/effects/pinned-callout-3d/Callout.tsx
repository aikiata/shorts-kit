import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT, H, W} from '../theme';
import {projectToScreen, type CameraRig, type Vec3} from '../three/cameraPath';
import {SAFE_BOTTOM, SAFE_RAIL_LEFT, SAFE_RAIL_TOP, SAFE_TOP} from './SafeZones';

/**
 * Callout: an UPPERCASE label in a dark tag with a thin leader line ending in a
 * ring on the thing it names. Two flavours:
 *
 *  - `Callout`   2D: you give pixel coordinates (frame 1080x1920).
 *  - `Callout3D` the target is a 3D world point; it is projected through the SAME
 *                camera rig that drives the canvas, so the leader stays glued to
 *                the object while the camera moves. The tag keeps a fixed pixel
 *                offset from the point (clamped into the safe area).
 *
 * Both draw on over `DRAW` frames starting at `from`, and fade out at `to`.
 * `color` is the entity colour (keep one colour per thing across the video).
 */
const DRAW = 10;
const TAG_H = 52;

type Common = {
  label: string;
  color: string;
  from: number;
  to?: number;
  /** Tag anchor side: line leaves from this edge midpoint. */
  align?: 'left' | 'right';
};

const useReveal = (from: number, to?: number) => {
  const frame = useCurrentFrame();
  const inP = interpolate(frame, [from, from + DRAW], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const out = to === undefined ? 1 : interpolate(frame, [to - 6, to], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return {p: inP, alpha: out};
};

/** Estimated tag width: uppercase at 28px with 2px tracking. */
const tagWidth = (label: string) => Math.round(label.length * 19 + 40);

const Drawing: React.FC<
  Common & {
    target: {x: number; y: number};
    tag: {x: number; y: number};
    p: number;
    alpha: number;
  }
> = ({label, color, align = 'left', target, tag, p, alpha}) => {
  const w = tagWidth(label);
  // The tag's left (or right) edge sits at tag.x; the line leaves its midpoint.
  const left = align === 'left' ? tag.x : tag.x - w;
  const ax = align === 'left' ? left : left + w;
  const ay = tag.y;
  const len = Math.hypot(target.x - ax, target.y - ay);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: alpha, pointerEvents: 'none'}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <line
          x1={ax}
          y1={ay}
          x2={target.x}
          y2={target.y}
          stroke={color}
          strokeWidth={3}
          strokeDasharray={len}
          strokeDashoffset={len * (1 - p)}
          strokeLinecap="round"
        />
        <circle
          cx={target.x}
          cy={target.y}
          r={interpolate(p, [0.6, 1], [0, 11], {extrapolateLeft: 'clamp'})}
          fill="none"
          stroke={color}
          strokeWidth={3}
        />
        <circle cx={target.x} cy={target.y} r={interpolate(p, [0.6, 1], [0, 4], {extrapolateLeft: 'clamp'})} fill={color} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left,
          top: ay - TAG_H / 2,
          height: TAG_H,
          width: w,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(8,13,19,0.86)',
          borderLeft: `5px solid ${color}`,
          borderRadius: 6,
          color: '#fff',
          fontFamily: FONT.sans,
          fontWeight: 800,
          fontSize: 28,
          letterSpacing: 2,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          opacity: interpolate(p, [0, 0.4], [0, 1], {extrapolateRight: 'clamp'}),
        }}
      >
        {label}
      </div>
    </div>
  );
};

export const Callout: React.FC<
  Common & {target: {x: number; y: number}; tag: {x: number; y: number}}
> = ({from, to, ...rest}) => {
  const {p, alpha} = useReveal(from, to);
  return <Drawing {...rest} from={from} to={to} p={p} alpha={alpha} />;
};

export const Callout3D: React.FC<
  Common & {
    rig: CameraRig;
    point: Vec3 | ((frame: number) => Vec3);
    /** Pixel offset of the tag anchor from the projected point. */
    offset: {x: number; y: number};
  }
> = ({rig, point, offset, from, to, ...rest}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const {p, alpha} = useReveal(from, to);
  const pt = typeof point === 'function' ? point(frame) : point;
  const s = projectToScreen(rig(frame), pt, width, height);
  if (!s.visible) return null;
  // Keep the tag inside the safe band; the leader still reaches the true point.
  const clampY = (y: number) => Math.max(SAFE_TOP + 150, Math.min(SAFE_BOTTOM - 120, y));
  const tag = {x: s.x + offset.x, y: clampY(s.y + offset.y)};
  const w = tagWidth(rest.label);
  const a = rest.align ?? 'left';
  // Below SAFE_RAIL_TOP the tag must also stay left of the platform button rail.
  const maxRight = tag.y + TAG_H / 2 >= SAFE_RAIL_TOP ? SAFE_RAIL_LEFT - 16 : W - 40;
  tag.x = a === 'left' ? Math.max(40, Math.min(maxRight - w, tag.x)) : Math.max(40 + w, Math.min(maxRight, tag.x));
  // Fade when the point leaves the frame so the line never dangles.
  const edge = s.onScreen ? 1 : 0;
  return <Drawing {...rest} from={from} to={to} target={s} tag={tag} p={p} alpha={alpha * edge} />;
};
