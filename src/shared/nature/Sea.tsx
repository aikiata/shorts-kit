import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {mixHex, rgba} from "../color";
import {rnd} from "../random";
import {H, W} from "../theme";
import {Glitter} from "./Glitter";
import {skyPreset} from "./Sky";
import {HORIZON, lightFor, type SkyKind, type SkyPreset} from "./skies";

const waveY = (x: number, y0: number, amp: number, len: number, phase: number) =>
  y0 + amp * Math.sin((x / len) * Math.PI * 2 + phase) + amp * 0.35 * Math.sin((x / len) * Math.PI * 5.3 + phase * 1.7);

/** Closed wave shape from the wave line down to the frame bottom. */
const wavePath = (y0: number, amp: number, len: number, phase: number) => {
  let d = `M 0 ${H} L 0 ${y0}`;
  for (let x = 0; x <= W; x += 18) d += ` L ${x} ${waveY(x, y0, amp, len, phase).toFixed(1)}`;
  return `${d} L ${W} ${H} Z`;
};

/** Only the wave line, for the light on the crest. */
const crestPath = (y0: number, amp: number, len: number, phase: number) => {
  let d = "";
  for (let x = -18; x <= W + 18; x += 18) d += `${d ? " L" : "M"} ${x} ${waveY(x, y0, amp, len, phase).toFixed(1)}`;
  return d;
};

/** Layers from far (near the horizon: small, slow) to near (big, faster). Alternate directions read as swell. */
const LAYERS = [
  {dy: 6, amp: 3, len: 260, sp: 0.02, a: 0.35},
  {dy: 60, amp: 6, len: 340, sp: -0.03, a: 0.45},
  {dy: 170, amp: 10, len: 420, sp: 0.035, a: 0.55},
  {dy: 330, amp: 16, len: 520, sp: -0.04, a: 0.7},
];

/**
 * Moving sea below the horizon: horizon haze, layered waves with lit crests,
 * drifting light streaks and (optionally) a glitter path under the light.
 * Draw over `Sky` (and `Clouds`); the waves rise and fall with the preset's `wave`.
 */
export const Sea: React.FC<{
  sky: SkyKind | SkyPreset;
  horizon?: number;
  /** Glitter path under the sky's light (`true`), at a given x, or off. Off for skies without a light. */
  glitter?: boolean | {x: number};
  /** Multiply the preset's wave strength. */
  waveScale?: number;
  frame?: number;
}> = ({sky, horizon = HORIZON, glitter = true, waveScale = 1, frame}) => {
  const now = useCurrentFrame();
  const f = frame ?? now;
  const s = skyPreset(sky);
  const wave = s.wave * waveScale;
  const crest = mixHex(s.sea, s.low, 0.55);
  const light = typeof sky === "string" ? lightFor(sky, horizon) : null;
  const gx = typeof glitter === "object" ? glitter.x : light?.x;
  return (
    <AbsoluteFill>
      {/* haze along the horizon so sky and sea meet softly */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: horizon - 170,
          height: 240,
          background: `linear-gradient(to bottom, ${rgba(s.low, 0)} 0%, ${rgba(s.low, 0.55)} 70%, ${rgba(s.low, 0.25)} 82%, ${rgba(s.low, 0)} 100%)`,
        }}
      />
      <svg width={W} height={H} style={{position: "absolute"}}>
        {LAYERS.map((l, i) => {
          const phase = f * l.sp * (1 + wave * 0.4) + i;
          return (
            <g key={i}>
              <path d={wavePath(horizon + l.dy, l.amp * wave, l.len, phase)} fill={s.deep} opacity={l.a * 0.5} />
              <path d={crestPath(horizon + l.dy, l.amp * wave, l.len, phase)} stroke={crest} strokeWidth={2 + i} fill="none" opacity={0.18 * s.light} />
            </g>
          );
        })}
        {glitter && gx !== undefined ? <Glitter x={gx} glint={light?.glint} a={light?.a} horizon={horizon} frame={f} /> : null}
        {/* light streaks drifting on the surface */}
        {Array.from({length: 26}, (_, i) => {
          const y = horizon + 20 + rnd(i) * (H - horizon - 140);
          const x = ((rnd(i + 50) * W + f * (0.6 + rnd(i + 9))) % (W + 200)) - 100;
          return <rect key={`s${i}`} x={x} y={y} width={40 + rnd(i + 3) * 90} height={3} rx={2} fill="#fff" opacity={0.08 * s.light} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};
