import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {mixHex, rgba} from "../color";
import {rnd} from "../random";
import {H, W} from "../theme";
import {GROUNDS, type GroundPreset} from "./grounds";
import {HORIZON, SKIES, type SkyKind} from "./skies";

/**
 * Sky down to the horizon and flat open land below it: the land version of
 * `Sky` + `Sea`. Draw first; add `Sun`, `Clouds`, `Stars` on top, figures and
 * props after, `TallGrass` last.
 *
 * - `treeLine`: a dark ragged band of far trees on the horizon.
 * - `marsh`: a strip of still water with reeds just below the horizon.
 * - Far grass strokes get longer and sway more toward the viewer (depth).
 */
export const Land: React.FC<{
  sky: SkyKind;
  /** Override the land colours of the preset. */
  ground?: GroundPreset;
  horizon?: number;
  treeLine?: boolean;
  marsh?: boolean;
  /** Number of far grass strokes. */
  grass?: number;
  frame?: number;
}> = ({sky, ground, horizon = HORIZON, treeLine = true, marsh = false, grass = 140, frame}) => {
  const now = useCurrentFrame();
  const f = frame ?? now;
  const s = SKIES[sky];
  const g = ground ?? GROUNDS[sky];
  const k = (horizon / H) * 100;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `linear-gradient(to bottom, ${s.top} 0%, ${s.low} ${k}%, ${g.far} ${k}%, ${g.ground} 62%, ${g.near} 100%)`}} />
      {/* haze along the horizon so sky and land meet softly */}
      <div style={{position: "absolute", left: 0, right: 0, top: horizon - 160, height: 200, background: `linear-gradient(to bottom, ${rgba(s.low, 0)} 0%, ${rgba(s.low, 0.5)} 80%, ${rgba(s.low, 0)} 100%)`}} />
      <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0}}>
        {treeLine ? (
          <path
            d={`M 0 ${horizon} ${Array.from({length: 28}, (_, i) => {
              const x = (i / 27) * W;
              return `L ${x.toFixed(0)} ${(horizon - 18 - rnd(i + 90) * 34 - Math.sin(i * 0.9) * 8).toFixed(0)}`;
            }).join(" ")} L ${W} ${horizon} Z`}
            fill={mixHex(g.far, "#1E2A18", 0.55)}
            opacity={0.85}
          />
        ) : null}
        {marsh ? (
          <g>
            <path
              d={`M 0 ${horizon + 40} Q 300 ${horizon + 20} 560 ${horizon + 46} T ${W} ${horizon + 36} L ${W} ${horizon + 110} Q 600 ${horizon + 130} 0 ${horizon + 100} Z`}
              fill={mixHex(s.low, "#2A4A55", 0.55)}
              opacity={0.75}
            />
            {Array.from({length: 40}, (_, i) => {
              const x = rnd(i + 300) * W;
              const y = horizon + 40 + rnd(i + 301) * 70;
              return <path key={i} d={`M ${x} ${y} q ${Math.sin(f / 30 + i) * 3} -18 ${2 + rnd(i) * 4} -${22 + rnd(i + 7) * 18}`} stroke={mixHex(g.far, "#000000", 0.3)} strokeWidth={2.5} fill="none" />;
            })}
          </g>
        ) : null}
        {Array.from({length: grass}, (_, i) => {
          const d = Math.pow(rnd(i + 20), 1.7);
          const y = horizon + 20 + d * (H - horizon - 40);
          const x = rnd(i + 21) * W;
          const h = 6 + d * 36;
          const sway = Math.sin(f / 25 + i) * (2 + d * 5);
          return <path key={i} d={`M ${x} ${y} q ${sway} ${-h / 2} ${sway * 1.6} ${-h}`} stroke={mixHex(g.ground, s.low, 0.25 + rnd(i + 22) * 0.25)} strokeWidth={1.5 + d * 2.5} fill="none" opacity={0.35 + d * 0.3} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};
