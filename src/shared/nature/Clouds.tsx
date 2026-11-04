import React, {useId} from "react";
import {useCurrentFrame} from "remotion";
import {rnd, svgId} from "../random";
import {W} from "../theme";
import {CLOUDS, HORIZON, type CloudPreset, type SkyKind} from "./skies";

/**
 * Soft layered clouds drifting slowly above the horizon; far clouds are smaller
 * and slower (parallax). Colours follow the sky preset, or pass your own.
 */
export const Clouds: React.FC<{
  sky: SkyKind | CloudPreset;
  horizon?: number;
  /** Override the preset's cloud count. */
  count?: number;
  /** Multiply drift speed. */
  speed?: number;
  seed?: number;
  frame?: number;
}> = ({sky, horizon = HORIZON, count, speed = 1, seed = 0, frame}) => {
  const now = useCurrentFrame();
  const f = frame ?? now;
  const c = typeof sky === "string" ? CLOUDS[sky] : sky;
  const id = svgId(useId(), "cloud");
  const blur = sky === "storm" ? 14 : 10;
  return (
    <svg width={W} height={horizon} style={{position: "absolute", left: 0, top: 0}}>
      <defs>
        <filter id={`${id}-blur`} x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation={blur} />
        </filter>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.body} />
          <stop offset="1" stopColor={c.belly} />
        </linearGradient>
      </defs>
      {Array.from({length: count ?? c.n}, (_, n) => {
        const i = n + seed * 100;
        const depth = rnd(i + 700);
        const y = 180 + depth * (horizon - 300);
        const s = 0.55 + depth * 0.9;
        const span = W + 700;
        const x = ((rnd(i + 710) * span + f * speed * (0.15 + depth * 0.35)) % span) - 350;
        return (
          <g key={n} transform={`translate(${x} ${y}) scale(${s} ${s * 0.8})`} filter={`url(#${id}-blur)`} opacity={c.a * (0.65 + depth * 0.35)}>
            {Array.from({length: 5}, (_, k) => (
              <ellipse
                key={k}
                cx={(k - 2) * 70 + rnd(i * 9 + k) * 30}
                cy={-Math.sin(((k + 0.5) / 5) * Math.PI) * 40 - rnd(i * 7 + k) * 20}
                rx={70 + rnd(i * 5 + k) * 50}
                ry={34 + rnd(i * 3 + k) * 22}
                fill={`url(#${id}-g)`}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
};
