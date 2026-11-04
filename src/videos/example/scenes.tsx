import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Chip} from "../../shared/caption/Chip";
import {TypeStage} from "../../shared/caption/TypeStage";
import {PANEL_LEFT} from "../../shared/frame/SafeZones";
import type {SceneComponent} from "../../shared/frame/ShortsTemplate";
import {fade, ramp} from "../../shared/motion/anim";
import {W} from "../../shared/theme";
import {wordFrame} from "../../shared/timings";
import {SUN} from "./World";

/**
 * Overlays drawn on top of the one sky (World.tsx, passed as `background`).
 * Every appearance is anchored to the word that names it (`wordFrame`, scene-relative).
 * On-frame text: layer1 (wave labels), hardest (headline), payoff (chip): 3 of 7 scenes.
 */

/** hook and share: the sky alone carries the question and the share line. */
const SkyOnly: SceneComponent = () => <AbsoluteFill />;

/** problem: the white beam from the sun opens into the colours of the rainbow on "colours". */
const SPECTRUM = ["#FF3B30", "#FF9500", "#FFD60A", "#34C759", "#30B0FF", "#3A5BFF", "#8E4BFF"];
const PRISM = {x: 470, y: 930};
const Spectrum: SceneComponent = ({words}) => {
  const frame = useCurrentFrame();
  const beam = ramp(frame, 0, 18);
  const open = ramp(frame, wordFrame(words, "colours") - 4, 20);
  const dx = PRISM.x - SUN.x;
  const dy = PRISM.y - SUN.y;
  const ang = Math.atan2(dy, dx);
  const fanLen = 420 * open;
  const spread = (30 * Math.PI) / 180;
  const shimmer = 0.9 + 0.1 * Math.sin(frame / 5);
  return (
    <AbsoluteFill>
      <svg width={W} height={1920} style={{position: "absolute"}}>
        <line
          x1={SUN.x}
          y1={SUN.y}
          x2={SUN.x + dx * beam}
          y2={SUN.y + dy * beam}
          stroke="#FFFFFF"
          strokeWidth={26}
          strokeLinecap="round"
          opacity={0.92}
          style={{filter: "drop-shadow(0 0 18px rgba(255,255,255,0.9))"}}
        />
        {open > 0
          ? SPECTRUM.map((c, i) => {
              const a0 = ang - spread / 2 + (spread * i) / SPECTRUM.length;
              const a1 = a0 + spread / SPECTRUM.length;
              const p = (a: number) => `${PRISM.x + Math.cos(a) * fanLen},${PRISM.y + Math.sin(a) * fanLen}`;
              return <polygon key={c} points={`${PRISM.x},${PRISM.y} ${p(a0)} ${p(a1)}`} fill={c} opacity={0.82 * shimmer} />;
            })
          : null}
        <circle cx={PRISM.x} cy={PRISM.y} r={16 * beam} fill="#FFFFFF" opacity={0.95} />
      </svg>
    </AbsoluteFill>
  );
};

/** layer1: a long red wave and a short blue wave, labelled when each colour is named. */
const wavePath = (y0: number, amp: number, len: number, phase: number, x1: number) => {
  let d = "";
  for (let x = 70; x <= Math.min(x1, WAVE_RIGHT); x += 6) d += `${d ? " L" : "M"} ${x} ${(y0 + amp * Math.sin(((x - phase) / len) * Math.PI * 2)).toFixed(1)}`;
  return d;
};
/** Waves stop short of the right rail (x 927 from y 803), where the like column sits. */
const WAVE_RIGHT = 900;
const RED_Y = 760;
const BLUE_Y = 1080;
const Waves: SceneComponent = ({words, palette}) => {
  const frame = useCurrentFrame();
  const fWave = wordFrame(words, "wave");
  const fShort = wordFrame(words, "shorter");
  const fRed = wordFrame(words, "red");
  const redX = 70 + 940 * ramp(frame, fWave - 6, 22);
  const blueX = 70 + 940 * ramp(frame, wordFrame(words, "blue") - 6, 22);
  const phase = frame * 6;
  return (
    <AbsoluteFill>
      <svg width={W} height={1920} style={{position: "absolute"}}>
        <path d={wavePath(RED_Y, 70, 380, phase, redX)} fill="none" stroke="#FF5A4E" strokeWidth={12} strokeLinecap="round" />
        <path d={wavePath(BLUE_Y, 70, 120, phase, blueX)} fill="none" stroke="#2FA8FF" strokeWidth={12} strokeLinecap="round" />
      </svg>
      <Chip label="Red · long waves" palette={palette} at={fRed} color="#FF8A80" style={{left: PANEL_LEFT, top: RED_Y - 190}} />
      <Chip label="Blue · short waves" palette={palette} at={fShort} color="#7FD0FF" style={{left: PANEL_LEFT, top: BLUE_Y + 110}} />
    </AbsoluteFill>
  );
};

/** layer2: the molecules and the rays are on the world itself; nothing to add on top. */
const Molecules: SceneComponent = () => <AbsoluteFill />;

/** hardest: the mechanism in three words, landing on "scatter" while the world scatters blue. */
const Scatter: SceneComponent = ({words, palette}) => {
  const fScatter = wordFrame(words, "scatter");
  return <TypeStage text="Blue scatters most" palette={palette} from={fScatter} stagger={6} accent={["blue"]} size={100} top={980} />;
};

/** payoff: the camera sinks to the horizon (World); the chip names why it is paler. */
const Horizon: SceneComponent = ({words, palette}) => {
  const frame = useCurrentFrame();
  const fCrossed = wordFrame(words, "crossed");
  return (
    <AbsoluteFill style={{opacity: fade(frame, fCrossed - 4, 10)}}>
      <Chip label="More air near the horizon" palette={palette} at={fCrossed} color={palette.accentSoft} style={{left: PANEL_LEFT, top: 1120}} />
    </AbsoluteFill>
  );
};

/** Scene id (from narration.json) → component. Every id needs one. */
export const scenes: Record<string, SceneComponent> = {
  hook: SkyOnly,
  problem: Spectrum,
  layer1: Waves,
  layer2: Molecules,
  hardest: Scatter,
  payoff: Horizon,
  share: SkyOnly,
};
