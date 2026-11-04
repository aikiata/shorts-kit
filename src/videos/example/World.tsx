import React from "react";
import {useCurrentFrame} from "remotion";
import {hexRgb} from "../../shared/color";
import {Camera} from "../../shared/motion/Camera";
import {fade, lerp, ramp} from "../../shared/motion/anim";
import {Clouds, Sea, Sky, Sun, type SkyPreset} from "../../shared/nature";
import {rnd} from "../../shared/random";
import {W} from "../../shared/theme";
import {frameAtWord} from "../../shared/timings";
import {DURATION, FPS, TIMINGS, VOICE} from "./timing";

/**
 * The one image of this video (illustrated-scene rule 1): an empty sky over a
 * calm sea, held from the first frame to the last. Information is added onto
 * it, never by cutting to another world:
 *
 * - layer2: gas molecules fade in where "molecules" is spoken and stay;
 * - hardest: the molecules throw blue light in every direction and the sky deepens;
 * - payoff: the camera sinks toward the horizon, which turns paler.
 *
 * Every change is anchored to a word with `frameAtWord`, so a new TTS run re-times it.
 */
export const HORIZON_Y = 1640;
export const SUN = {x: 800, y: 470};

const at = (scene: string, word: string, nth?: number) => frameAtWord(VOICE, FPS, scene, word, nth);
const start = (scene: string) => TIMINGS.find((t) => t.id === scene)!.from;

/** Hex mix (Sea and Sky read hex presets). */
const mix = (a: string, b: string, k: number) => {
  const [x, y] = [hexRgb(a), hexRgb(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, "0")).join("")}`;
};

const SEA: SkyPreset = {top: "#3C88C0", low: "#C9E6F2", sea: "#2B7FA6", deep: "#0B3A55", wave: 0.5, light: 1};

const MOLECULES = Array.from({length: 44}, (_, i) => ({
  x: 70 + rnd(i + 11) * 940,
  y: 330 + rnd(i + 37) * (HORIZON_Y - 430),
  r: 6 + rnd(i + 59) * 6,
  // which molecules also throw a faint warm (non-blue) ring: fewer, and weaker
  warm: rnd(i + 83) < 0.22,
}));

/** Sunbeams fanning from the sun toward the lower left (angles in radians, screen y down). */
const RAYS = Array.from({length: 9}, (_, i) => ({ang: ((100 + i * 14) * Math.PI) / 180, speed: 14 + rnd(i + 5) * 6, phase: rnd(i + 9)}));

export const World: React.FC = () => {
  const f = useCurrentFrame();

  // word anchors (absolute frames)
  const fMolecules = at("layer2", "molecules");
  const fPass = at("layer2", "pass");
  const fScatter = at("hardest", "scatter");
  const fHorizon = at("payoff", "horizon");
  const fPaler = at("payoff", "paler");
  const fPayoff = start("payoff");

  // the light changes: deeper blue once scattering is explained, paler horizon at the payoff
  const deep = ramp(f, fScatter, 2 * FPS);
  const pale = ramp(f, fHorizon, 1.6 * FPS);
  const sky: SkyPreset = {
    ...SEA,
    top: mix(mix("#4D93C4", "#1C66AE", deep), "#2A74B6", pale * 0.4),
    low: mix(mix("#C6E3F0", "#9FD0EC", deep), "#F3F8F6", pale),
  };

  // camera: a slow push over the whole video, then a sink toward the horizon in the payoff
  const sink = ramp(f, fPayoff, Math.max(1, DURATION - fPayoff - FPS));
  const z = lerp(1.0, 1.05, f / DURATION) + 0.16 * sink;
  const oy = lerp(820, 1560, sink);

  const molOn = fade(f, fMolecules - 8, 18) * (1 - ramp(f, fPayoff, 1.2 * FPS));
  const raysOn = fade(f, fPass - 4, 14) * (1 - ramp(f, fPayoff, 1.2 * FPS));
  const scatterOn = fade(f, fScatter, 10) * (1 - ramp(f, fPayoff, 1.2 * FPS));

  return (
    <Camera move={{z: [z, z], at: [W / 2, oy]}} t={0}>
      <Sky sky={sky} horizon={HORIZON_Y} />
      {/* paler band along the horizon; strong after "horizon" is spoken */}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: HORIZON_Y - 620,
          height: 620,
          background: `linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(250,252,250,${0.12 + 0.5 * pale}) 100%)`,
        }}
      />
      <Sun x={SUN.x} y={SUN.y} size={118} on={0.92} horizon={HORIZON_Y} />
      <Clouds sky="day" count={3} speed={1.2} seed={3} horizon={HORIZON_Y} />
      <svg width={W} height={HORIZON_Y} style={{position: "absolute", left: 0, top: 0}}>
        {raysOn > 0
          ? RAYS.map((r, i) => {
              // a soft sunbeam leaving the sun, with a brighter pulse travelling outward along it
              const x2 = SUN.x + Math.cos(r.ang) * 2400;
              const y2 = SUN.y + Math.sin(r.ang) * 2400;
              const x1 = SUN.x + Math.cos(r.ang) * 90;
              const y1 = SUN.y + Math.sin(r.ang) * 90;
              return (
                <g key={i} opacity={raysOn}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFF8DC" strokeWidth={34} opacity={0.12} />
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#FFFDF2"
                    strokeWidth={7}
                    strokeLinecap="round"
                    strokeDasharray="190 760"
                    strokeDashoffset={-(f * r.speed + r.phase * 950)}
                    opacity={0.7}
                  />
                </g>
              );
            })
          : null}
        {molOn > 0
          ? MOLECULES.map((m, i) => {
              const appear = fade(f, fMolecules - 8 + i * 0.9, 10);
              const x = m.x + Math.sin(f / 11 + i * 1.7) * 7;
              const y = m.y + Math.cos(f / 13 + i * 2.3) * 7;
              // scattering: rings leave each molecule in every direction, blue far more than warm colours
              const period = 46;
              const age = ((f - fScatter + Math.floor(rnd(i + 101) * period)) % period) / period;
              const ring = f >= fScatter ? age : -1;
              return (
                <g key={i} opacity={molOn * appear}>
                  {ring >= 0 ? (
                    <circle cx={x} cy={y} r={m.r + ring * 78} fill="none" stroke="#3FB6FF" strokeWidth={5 * (1 - ring) + 1} opacity={0.85 * (1 - ring) * scatterOn} />
                  ) : null}
                  {ring >= 0 && m.warm ? (
                    <circle cx={x} cy={y} r={m.r + ((ring + 0.5) % 1) * 34} fill="none" stroke="#FF8A5C" strokeWidth={2} opacity={0.35 * (1 - ((ring + 0.5) % 1)) * scatterOn} />
                  ) : null}
                  <circle cx={x} cy={y} r={m.r} fill="rgba(255,255,255,0.9)" stroke="#2D6A96" strokeWidth={2} />
                </g>
              );
            })
          : null}
      </svg>
      <Sea sky={SEA} horizon={HORIZON_Y} glitter={false} />
      {/* the payoff's "paler" lands as a soft flash of white along the horizon */}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: HORIZON_Y - 160,
          height: 200,
          background: "radial-gradient(60% 100% at 50% 100%, rgba(255,255,255,0.55), rgba(255,255,255,0) 70%)",
          opacity: fade(f, fPaler - 6, 16),
        }}
      />
    </Camera>
  );
};
