import React from "react";
import {AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame} from "remotion";
import {Captions} from "../../shared/caption/Captions";
import {loadChannelFont} from "../../shared/font";
import {PANEL_MAX_W, SAFE_TOP, SafeZones} from "../../shared/frame/SafeZones";
import {Watermark} from "../../shared/frame/Watermark";
import {Globe, GlobePin, type GlobeView} from "../../shared/map/globe";
import {GlobeLine} from "../../shared/map/globe-line";
import {FONT, H, MAP as C, W} from "../../shared/theme";
import {COSTA_AZUL, DRIFT, EBON, TRACERS} from "./drift";
import {SHOT_CFG, type ShotCfg, type Sky} from "./shots";
import {AUDIO, EN, SHOTS, shotAt, type Shot, WORDS} from "./timing";

const XFADE = 12;
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const ease = Easing.inOut(Easing.cubic);

const cfgOf = (shot: Shot): ShotCfg => SHOT_CFG[shot.n];
const prevOf = (shot: Shot): Shot | undefined => SHOTS[SHOTS.indexOf(shot) - 1];

/** The horizon and where the boat sits on the vertical frame. */
const HY = 880;
const BOAT_X = 540;
const BOAT_Y = 1075;
const BOAT_Y_DEFAULT = BOAT_Y;

/** The boat's bob and tilt; shared by the side view and the underwater cut. */
const boatMotion = (frame: number, sky: Sky) => {
  const wave = SKY[sky].wave;
  return {bob: Math.sin(frame / 17) * 6 * wave, tilt: Math.sin(frame / 23) * 2.2 * wave};
};
/** The waterline along the hull, in boat coordinates (dx from the boat's centre). */
const waterlineAt = (dx: number, frame: number, sky: Sky) =>
  36 + Math.sin(dx / 34 + frame / 9) * 3 * SKY[sky].wave + Math.sin(dx / 13 - frame / 6) * 1.5;

/** Seeded pseudo-random number, so every frame draws exactly the same. */
const rnd = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------------------
// Sky and sea by the shot's weather.
// ---------------------------------------------------------------------------
const SKY: Record<Sky, {top: string; low: string; sea: string; deep: string; wave: number; light: number}> = {
  day: {top: "#2F7DB5", low: "#BFE3F2", sea: "#1D6E93", deep: "#082D44", wave: 1, light: 1},
  harsh: {top: "#5FA9D6", low: "#F6F0D2", sea: "#2A86A8", deep: "#0B3A52", wave: 0.6, light: 1.1},
  storm: {top: "#1E262C", low: "#55626A", sea: "#22353F", deep: "#071319", wave: 3.2, light: 0.55},
  grey: {top: "#45545D", low: "#8F9CA3", sea: "#2D4B5A", deep: "#0B1E27", wave: 1.8, light: 0.75},
  dusk: {top: "#251F4A", low: "#E07A4F", sea: "#2A3556", deep: "#0A1022", wave: 0.8, light: 0.7},
  night: {top: "#03070F", low: "#0E1F3A", sea: "#0A1A2C", deep: "#010509", wave: 0.7, light: 0.4},
  dawn: {top: "#1F315A", low: "#F3A86A", sea: "#2B5373", deep: "#0A1D2E", wave: 0.8, light: 0.85},
};

const hexRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgba = (hex: string, a: number) => `rgba(${hexRgb(hex).join(",")},${a})`;
const mixHex = (a: string, b: string, k: number) => {
  const [x, y] = [hexRgb(a), hexRgb(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(",")})`;
};

const waveY = (x: number, y0: number, amp: number, len: number, phase: number) =>
  y0 + amp * Math.sin((x / len) * Math.PI * 2 + phase) + amp * 0.35 * Math.sin((x / len) * Math.PI * 5.3 + phase * 1.7);

const wavePath = (y0: number, amp: number, len: number, phase: number) => {
  let d = `M 0 ${H} L 0 ${y0}`;
  for (let x = 0; x <= W; x += 18) d += ` L ${x} ${waveY(x, y0, amp, len, phase).toFixed(1)}`;
  return `${d} L ${W} ${H} Z`;
};

/** Only the wave edge, to draw the highlight on the crest. */
const crestPath = (y0: number, amp: number, len: number, phase: number) => {
  let d = "";
  for (let x = -18; x <= W + 18; x += 18) d += `${d ? " L" : "M"} ${x} ${waveY(x, y0, amp, len, phase).toFixed(1)}`;
  return d;
};

/** Light source per sky: position, colour of its reflection on the water. */
const LIGHT: Partial<Record<Sky, {x: number; y: number; glint: string; a: number}>> = {
  day: {x: 900, y: 700, glint: "#FFF6D6", a: 0.55},
  harsh: {x: 900, y: 700, glint: "#FFFBEA", a: 0.85},
  dawn: {x: 900, y: 700, glint: "#FFD19A", a: 0.8},
  dusk: {x: 250, y: HY + 18, glint: "#FFB070", a: 0.9},
  night: {x: 878, y: 688, glint: "#DDE8FF", a: 0.6},
};

export const Sea: React.FC<{sky: Sky; frame: number; lightX?: number}> = ({sky, frame, lightX}) => {
  const s = SKY[sky];
  const layers = [
    {y: HY + 6, amp: 3, len: 260, sp: 0.02, a: 0.35},
    {y: HY + 60, amp: 6, len: 340, sp: -0.03, a: 0.45},
    {y: HY + 170, amp: 10, len: 420, sp: 0.035, a: 0.55},
    {y: HY + 330, amp: 16, len: 520, sp: -0.04, a: 0.7},
  ];
  const crest = mixHex(s.sea, s.low, 0.55);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `linear-gradient(to bottom, ${s.top} 0%, ${s.low} ${(HY / H) * 100}%, ${s.sea} ${(HY / H) * 100}%, ${s.deep} 100%)`}} />
      <Clouds sky={sky} frame={frame} />
      {/* haze along the horizon, so sky and sea join */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: HY - 170,
          height: 240,
          background: `linear-gradient(to bottom, ${rgba(s.low, 0)} 0%, ${rgba(s.low, 0.55)} 70%, ${rgba(s.low, 0.25)} 82%, ${rgba(s.low, 0)} 100%)`,
        }}
      />
      <svg width={W} height={H} style={{position: "absolute"}}>
        {layers.map((l, i) => {
          const phase = frame * l.sp * (1 + s.wave * 0.4) + i;
          return (
            <g key={i}>
              <path d={wavePath(l.y, l.amp * s.wave, l.len, phase)} fill={s.deep} opacity={l.a * 0.5} />
              <path d={crestPath(l.y, l.amp * s.wave, l.len, phase)} stroke={crest} strokeWidth={2 + i} fill="none" opacity={0.18 * s.light} />
            </g>
          );
        })}
        <Glitter sky={sky} frame={frame} x={lightX} />
        {/* light streaks on the water surface */}
        {Array.from({length: 26}, (_, i) => {
          const y = HY + 20 + rnd(i) * 520;
          const x = ((rnd(i + 50) * W + frame * (0.6 + rnd(i + 9))) % (W + 200)) - 100;
          return <rect key={`g${i}`} x={x} y={y} width={40 + rnd(i + 3) * 90} height={3} rx={2} fill="#fff" opacity={0.08 * s.light} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

export const Stars: React.FC<{on: number; frame?: number; height?: number; count?: number}> = ({on, frame = 0, height = HY, count = 90}) => (
  <svg width={W} height={height} style={{position: "absolute", opacity: on}}>
    {Array.from({length: count}, (_, i) => (
      <circle
        key={i}
        cx={rnd(i) * W}
        cy={rnd(i + 200) * (height - 60)}
        r={0.8 + rnd(i + 400) * 1.8}
        fill="#fff"
        opacity={(0.3 + rnd(i + 600) * 0.6) * (0.75 + 0.25 * Math.sin(frame / (6 + rnd(i + 800) * 10) + i))}
      />
    ))}
  </svg>
);

export const SkyMoon: React.FC<{on: number}> = ({on}) => (
  <div
    style={{
      position: "absolute",
      left: 830,
      top: 640,
      width: 96,
      height: 96,
      borderRadius: 48,
      background: "#F4F1E4",
      boxShadow: "0 0 60px 18px rgba(244,241,228,0.35)",
      opacity: on,
    }}
  />
);

/** The sun, clipped at the horizon so a sunset can sink half of it. */
const Sun: React.FC<{size: number; on: number; x?: number; y?: number; tone?: string; glow?: string}> = ({
  size,
  on,
  x = 900,
  y = 700,
  tone = "#FFF6D6",
  glow = "rgba(255,236,170,0.55)",
}) => (
  <div style={{position: "absolute", left: 0, top: 0, width: W, height: HY, overflow: "hidden", opacity: on}}>
    {/* wide, soft halo */}
    <div style={{position: "absolute", left: x - size * 3, top: y - size * 3, width: size * 6, height: size * 6, borderRadius: "50%", background: `radial-gradient(circle, ${glow} 0%, rgba(0,0,0,0) 60%)`}} />
    <div style={{position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: size / 2, background: tone, boxShadow: `0 0 ${size}px ${size / 3}px ${glow}`}} />
  </div>
);

/** Soft layered clouds, drifting slowly. Colour by sky; cloud bellies catch the light at dusk and dawn. */
const CLOUD: Record<Sky, {n: number; body: string; belly: string; a: number}> = {
  day: {n: 6, body: "#FFFFFF", belly: "#D6E6EE", a: 0.75},
  harsh: {n: 2, body: "#FFFFFF", belly: "#F1EEDC", a: 0.5},
  storm: {n: 9, body: "#2A333A", belly: "#11181D", a: 0.95},
  grey: {n: 8, body: "#7D8A91", belly: "#55626A", a: 0.85},
  dusk: {n: 6, body: "#4B3A66", belly: "#F08A5D", a: 0.85},
  night: {n: 4, body: "#16253D", belly: "#0B1526", a: 0.7},
  dawn: {n: 6, body: "#5A5878", belly: "#FFB27F", a: 0.85},
};

const Clouds: React.FC<{sky: Sky; frame: number}> = ({sky, frame}) => {
  const c = CLOUD[sky];
  const id = `cloud-${sky}`;
  return (
    <svg width={W} height={HY} style={{position: "absolute"}}>
      <defs>
        <filter id={`${id}-blur`} x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation={sky === "storm" ? 14 : 10} />
        </filter>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.body} />
          <stop offset="1" stopColor={c.belly} />
        </linearGradient>
      </defs>
      {Array.from({length: c.n}, (_, i) => {
        // Far clouds (near the horizon) are smaller and drift slower.
        const depth = rnd(i + 700);
        const y = 180 + depth * (HY - 300);
        const s = 0.55 + depth * 0.9;
        const span = W + 700;
        const x = ((rnd(i + 710) * span + frame * (0.15 + depth * 0.35)) % span) - 350;
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${s} ${s * 0.8})`} filter={`url(#${id}-blur)`} opacity={c.a * (0.65 + depth * 0.35)}>
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

/** Glitter on the water, under the sun or the moon. */
const Glitter: React.FC<{sky: Sky; frame: number; x?: number}> = ({sky, frame, x: lx}) => {
  const base = LIGHT[sky];
  const l = base && lx !== undefined ? {...base, x: lx} : base;
  if (!l) return null;
  return (
    <g>
      {Array.from({length: 56}, (_, i) => {
        const k = Math.pow(i / 56, 1.6);
        const y = HY + 4 + k * 330;
        const spread = 40 + (y - HY) * 0.9;
        // Each glint twinkles on its own cycle and moves while it is off.
        const cycle = 18 + rnd(i + 40) * 20;
        const ph = (frame + rnd(i + 41) * cycle) / cycle;
        const gen = Math.floor(ph);
        const tw = Math.sin((ph - gen) * Math.PI);
        const x = l.x + (rnd(i * 13 + gen) - 0.5) * spread;
        const w = 8 + (y - HY) * 0.2 * (0.6 + rnd(i + gen * 3));
        return <rect key={i} x={x - w / 2} y={y} width={w} height={2 + k * 4} rx={2} fill={l.glint} opacity={l.a * tw * (1 - k * 0.85)} />;
      })}
    </g>
  );
};

/** Fine film grain, new pattern every two frames, to soften the flat vector look. */
const Grain: React.FC<{frame: number}> = ({frame}) => (
  <svg width={W} height={H} style={{position: "absolute", pointerEvents: "none", mixBlendMode: "overlay", opacity: 0.22}}>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={Math.floor(frame / 2) % 97} stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width={W} height={H} filter="url(#grain)" />
  </svg>
);

const Rain: React.FC<{frame: number; on: number; heavy?: boolean}> = ({frame, on, heavy}) => (
  <svg width={W} height={H} style={{position: "absolute", opacity: on}}>
    {Array.from({length: heavy ? 140 : 80}, (_, i) => {
      const x = rnd(i) * (W + 300) - 150;
      const y = ((rnd(i + 70) * H + frame * (38 + rnd(i + 3) * 18)) % (H + 100)) - 100;
      return <line key={i} x1={x} y1={y} x2={x - 14} y2={y + 46} stroke="#D8E8F0" strokeWidth={2} opacity={0.45} />;
    })}
  </svg>
);

// ---------------------------------------------------------------------------
// The boat side-on: hull, ice chest, dead engine, buoy line, two people.
// ---------------------------------------------------------------------------
type Pt = readonly [number, number];
type Pose = "stand" | "sit" | "lie" | "lean";
type Arms = "down" | "water" | "wave";
const add = (p: Pt, dx: number, dy: number): Pt => [p[0] + dx, p[1] + dy];
const poly = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
/** A trapezoid torso from hip (width wa) to shoulder (width wb). */
const taper = (a: Pt, b: Pt, wa: number, wb: number) => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = -(b[1] - a[1]) / L;
  const ny = (b[0] - a[0]) / L;
  return poly([add(a, (nx * wa) / 2, (ny * wa) / 2), add(b, (nx * wb) / 2, (ny * wb) / 2), add(b, (-nx * wb) / 2, (-ny * wb) / 2), add(a, (-nx * wa) / 2, (-ny * wa) / 2)]) + " Z";
};

/** Shoulder of the "lean" pose, boat coordinates: just above the waterline, reaching out past the bow. */
const LEAN_SH: Pt = [222, 16];

/** Skeleton per pose. Origin: boat centre, deck at y = -12. */
const rig = (x: number, pose: Pose, arms: Arms) => {
  if (pose === "lean") {
    // Kneeling at the bow, leaning over the side, shoulders near the water, both arms fully under.
    const hip: Pt = [x + 28, -44];
    const sh: Pt = [LEAN_SH[0], LEAN_SH[1]];
    return {
      hip,
      sh,
      head: [x + 134, 0] as Pt,
      legs: [[[x + 24, -40], [x - 2, -16], [x - 40, -14]], [hip, [x + 6, -18], [x - 30, -16]]] as Pt[][],
      arms: [[sh, add(sh, -4, 60), add(sh, -10, 120)], [sh, add(sh, 4, 60), add(sh, 8, 124)]] as Pt[][],
    };
  }
  if (pose === "lie") {
    const hip: Pt = [x + 4, -26];
    const sh: Pt = [x - 46, -28];
    return {
      hip,
      sh,
      head: [x - 68, -32] as Pt,
      legs: [[hip, [x + 30, -24], [x + 58, -20]], [[x + 4, -22], [x + 30, -17], [x + 56, -15]]] as Pt[][],
      arms: [[sh, [x - 24, -20], [x - 2, -18]], [sh, [x - 22, -24], [x, -22]]] as Pt[][],
    };
  }
  const stand = pose === "stand";
  const hip: Pt = stand ? [x, -80] : [x, -30];
  const sh: Pt = stand ? [x + 1, -140] : [x + 7, -90];
  const legs: Pt[][] = stand
    ? [[[x - 4, -80], [x - 8, -46], [x - 13, -12]], [[x + 4, -80], [x + 10, -46], [x + 15, -12]]]
    : [[[x + 2, -26], [x + 30, -34], [x + 35, -12]], [[x, -30], [x + 38, -40], [x + 44, -12]]];
  const front: Pt[] =
    arms === "water" ? [sh, add(sh, 38, 38), [x + 80, 130]] : arms === "wave" ? [sh, add(sh, 30, -26), add(sh, 40, -64)] : [sh, add(sh, 12, 30), add(sh, 26, 52)];
  const back: Pt[] =
    arms === "water" ? [sh, add(sh, 30, 44), [x + 74, 124]] : arms === "wave" ? [sh, add(sh, -30, -26), add(sh, -40, -64)] : [sh, add(sh, -6, 30), add(sh, 2, 54)];
  return {hip, sh, head: add(sh, 3, -23), legs, arms: [back, front]};
};

type Look = {shirt: string; pants: string; skin: string; hat: string; cap?: boolean};
const LOOK: Record<"alv" | "ez", Look> = {
  alv: {shirt: "#D9A441", pants: "#2E3A44", skin: "#8A5A3C", hat: "#D8C38F"},
  ez: {shirt: "#5E86A0", pants: "#3A3540", skin: "#9A6847", hat: "#2B3440", cap: true},
};

/**
 * A figure with volume: legs, torso, arms, head, hat. `rim` adds a bright rim offset towards
 * the light source (moon, evening sun) so the figure does not sink into a dark background.
 */
const Person: React.FC<{x: number; pose: Pose; opacity?: number; arms?: Arms; look: Look; rim?: string}> = ({x, pose, opacity = 1, arms = "down", look, rim}) => {
  const r = rig(x, pose, arms);
  const limb = {fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const};
  const body = (tint?: string) => {
    const c = (k: keyof Look) => tint ?? (look[k] as string);
    const [h0, h1] = r.head;
    return (
      <g>
        <path d={poly(r.legs[0])} stroke={tint ?? mixHex(look.pants, "#000000", 0.3)} strokeWidth={16} {...limb} />
        <path d={poly(r.arms[0])} stroke={tint ?? mixHex(look.shirt, "#000000", 0.3)} strokeWidth={12} {...limb} />
        <path d={taper(r.hip, r.sh, 28, 38)} fill={c("shirt")} stroke={c("shirt")} strokeWidth={8} strokeLinejoin="round" />
        <path d={poly(r.legs[1])} stroke={c("pants")} strokeWidth={17} {...limb} />
        <circle cx={h0} cy={h1} r={15} fill={c("skin")} />
        {pose === "lie" ? null : look.cap ? (
          <path d={`M ${h0 - 15} ${h1 - 3} A 15 15 0 0 1 ${h0 + 15} ${h1 - 3} L ${h0 + 30} ${h1 - 1} L ${h0 + 14} ${h1 + 2} Z`} fill={c("hat")} />
        ) : (
          <>
            <ellipse cx={h0} cy={h1 - 9} rx={27} ry={5} fill={c("hat")} />
            <ellipse cx={h0} cy={h1 - 15} rx={14} ry={9} fill={c("hat")} />
          </>
        )}
        <path d={poly(r.arms[1])} stroke={c("shirt")} strokeWidth={12} {...limb} />
        <circle cx={r.arms[1][2][0]} cy={r.arms[1][2][1]} r={6} fill={c("skin")} />
      </g>
    );
  };
  return (
    <g opacity={opacity}>
      {rim ? <g transform="translate(3 -3)">{body(rim)}</g> : null}
      {body()}
    </g>
  );
};

/** Grade the whole boat by the sky light (multiply colour channels), and the rim colour if any. */
const GRADE: Record<Sky, {k: [number, number, number]; rim?: string}> = {
  day: {k: [1, 1, 1]},
  harsh: {k: [1.04, 1, 0.9]},
  storm: {k: [0.5, 0.57, 0.62]},
  grey: {k: [0.72, 0.78, 0.82]},
  dusk: {k: [0.8, 0.56, 0.55], rim: "#FFB27A"},
  night: {k: [0.32, 0.42, 0.6], rim: "#BFD6F2"},
  dawn: {k: [0.96, 0.8, 0.72], rim: "#FFD2A0"},
};

export const Boat: React.FC<{
  frame: number;
  sky: Sky;
  moons: number;
  ezequiel?: ShotCfg["ezequiel"];
  ezOpacity: number;
  alvarenga: {pose: "stand" | "sit" | "lean"; arms?: "down" | "water" | "wave"; dx?: number; dy?: number; opacity?: number};
  buoys: number;
  scale?: number;
  names?: number;
  /** Vertical position of the boat (default BOAT_Y). */
  y?: number;
  /** Silhouette on a bright background (big moon): fill near black, rim in this colour. */
  silhouette?: string;
  /** Depth of the water tint over the hull: 0 = sea colour at the horizon, 1 = the deep colour. */
  waterMix?: number;
}> = ({frame, sky, moons, ezequiel, ezOpacity, alvarenga, buoys, scale = 1, names = 0, y: BOAT_Y = BOAT_Y_DEFAULT, silhouette, waterMix = 0.3}) => {
  const {bob, tilt} = boatMotion(frame, sky);
  // Shells grow with the number of moons passed.
  const shells = Math.round(moons * 7);
  const g = silhouette ? {k: [0.06, 0.08, 0.11] as [number, number, number], rim: silhouette} : GRADE[sky];
  const s = SKY[sky];
  const id = `boat-${sky}${silhouette ? "-sil" : ""}`;
  // Water colour at the hull, matched to the sea gradient behind.
  const water = mixHex(s.sea, s.deep, waterMix);
  const waterline = (dx: number) => waterlineAt(dx, frame, sky);
  let surf = `M -440 ${waterline(-440).toFixed(1)}`;
  for (let dx = -420; dx <= 360; dx += 20) surf += ` L ${dx} ${waterline(dx).toFixed(1)}`;
  return (
    <svg width={W} height={H} style={{position: "absolute"}}>
      <defs>
        <filter id={`${id}-grade`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={`${g.k[0]} 0 0 0 0  0 ${g.k[1]} 0 0 0  0 0 ${g.k[2]} 0 0  0 0 0 1 0`} />
        </filter>
        <linearGradient id={`${id}-hull`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4F7F7" />
          <stop offset="1" stopColor="#B9C5CA" />
        </linearGradient>
        <linearGradient id={`${id}-fadeX`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.18" stopColor="#fff" stopOpacity={1} />
          <stop offset="0.85" stopColor="#fff" stopOpacity={1} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}-water`} gradientUnits="userSpaceOnUse" x1="0" y1="30" x2="0" y2="160">
          <stop offset="0" stopColor={water} stopOpacity={0.96} />
          <stop offset="0.18" stopColor={water} stopOpacity={0.9} />
          <stop offset="0.5" stopColor={water} stopOpacity={0.25} />
          <stop offset="1" stopColor={water} stopOpacity={0} />
        </linearGradient>
        <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x={-460} y={0} width={840} height={160}>
          <rect x={-460} y={0} width={840} height={160} fill={`url(#${id}-fadeX)`} />
        </mask>
      </defs>
      {/* the boat's shadow in the water */}
      <g transform={`translate(${BOAT_X} ${BOAT_Y + bob * 0.4}) scale(${scale})`}>
        <ellipse cx={10} cy={70} rx={250} ry={22} fill={s.deep} opacity={0.45} />
      </g>
      <g transform={`translate(${BOAT_X} ${BOAT_Y + bob}) scale(${scale}) rotate(${tilt})`} filter={`url(#${id}-grade)`}>
        {/* buoy line trailing from the stern as a sea anchor */}
        {Array.from({length: buoys}, (_, i) => (
          <circle key={`b${i}`} cx={-250 - i * 34} cy={34 + Math.sin(frame / 11 + i) * 4} r={9} fill="#FF7A2F" stroke="#5A2200" strokeWidth={2} />
        ))}
        {buoys > 0 ? <line x1={-205} y1={20} x2={-250 - (buoys - 1) * 34} y2={34} stroke="#E8E2D0" strokeWidth={2} /> : null}
        {/* outboard engine, dead */}
        <rect x={-232} y={-46} width={34} height={62} rx={6} fill="#4A545A" />
        <rect x={-222} y={16} width={12} height={40} fill="#353C40" />
        {/* fridge-sized ice chest */}
        <rect x={-48} y={-74} width={96} height={64} rx={6} fill="#F2F4F3" stroke="#9AA6AC" strokeWidth={3} />
        <rect x={-40} y={-66} width={80} height={6} rx={3} fill="#C9D3D6" />
        {/* hull */}
        <path d="M -210 -12 L 214 -12 L 176 46 L -190 46 Z" fill={`url(#${id}-hull)`} stroke="#7E8C93" strokeWidth={3} />
        {[-110, 0, 110].map((px) => (
          <line key={px} x1={px} y1={-10} x2={px - 4} y2={24} stroke="#AEBBC0" strokeWidth={2} />
        ))}
        <path d="M -196 26 L 190 26 L 176 46 L -190 46 Z" fill="#8C2F2F" opacity={0.9} />
        <line x1={-210} y1={-12} x2={214} y2={-12} stroke="#2FD8FF" strokeWidth={6} />
        {Array.from({length: shells}, (_, i) => (
          <ellipse
            key={`s${i}`}
            cx={-185 + rnd(i + 900) * 360}
            cy={10 + rnd(i + 950) * 34}
            rx={4 + rnd(i + 990) * 5}
            ry={3 + rnd(i + 970) * 3}
            fill={rnd(i + 30) > 0.5 ? "#D8CFB8" : "#A79E86"}
            stroke="#5D5644"
            strokeWidth={1}
          />
        ))}
        {ezequiel ? <Person x={-120} pose={ezequiel === "sit" ? "sit" : "lie"} opacity={ezOpacity} look={LOOK.ez} rim={g.rim} /> : null}
        <g transform={`translate(${alvarenga.dx ?? 0} ${alvarenga.dy ?? 0})`}>
          <Person x={110} pose={alvarenga.pose} arms={alvarenga.arms} opacity={alvarenga.opacity ?? 1} look={LOOK.alv} rim={g.rim} />
        </g>
      </g>
      {/* water covering the submerged hull, white foam along the edge */}
      <g transform={`translate(${BOAT_X} ${BOAT_Y + bob * 0.4}) scale(${scale})`} mask={`url(#${id}-mask)`}>
        <path d={`${surf} L 360 160 L -440 160 Z`} fill={`url(#${id}-water)`} />
        <path d={surf} stroke={mixHex(s.sea, s.low, 0.5)} strokeWidth={3} fill="none" opacity={0.6} />
        {Array.from({length: 16}, (_, i) => {
          const dx = -200 + i * 27 + Math.sin(frame / 7 + i) * 5;
          const on = 0.5 + 0.5 * Math.sin(frame / 5 + i * 1.9);
          return <ellipse key={i} cx={dx} cy={waterline(dx) + 1} rx={10 + rnd(i + 60) * 14} ry={2.5} fill="#F2F7F8" opacity={(0.25 + 0.5 * on) * s.light} />;
        })}
      </g>
      <g transform={`translate(${BOAT_X} ${BOAT_Y + bob}) scale(${scale}) rotate(${tilt})`}>
        {names > 0 ? (
          <g opacity={names} fontFamily={FONT.sans} fontWeight={800} fontSize={30} fill="#fff" textAnchor="middle" style={{paintOrder: "stroke"}} stroke="#04121A" strokeWidth={8}>
            {ezequiel ? <text x={-120} y={-170}>Ezequiel</text> : null}
            <text x={110} y={-200}>Alvarenga</text>
          </g>
        ) : null}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Per-shot props.
// ---------------------------------------------------------------------------
const Coast: React.FC<{on: number; t: number}> = ({on, t}) => (
  <svg width={W} height={H} style={{position: "absolute", opacity: on}}>
    <path
      d={`M -40 ${HY} L 40 ${HY - 70 * on} L 120 ${HY - 40 * on} L 210 ${HY - 110 * on} L 300 ${HY - 50 * on} L ${380 - t * 60} ${HY} Z`}
      fill="#3D5A66"
      opacity={0.85}
    />
  </svg>
);

const FishDump: React.FC<{t: number}> = ({t}) => (
  <svg width={W} height={H} style={{position: "absolute"}}>
    {Array.from({length: 14}, (_, i) => {
      const k = interpolate(t, [0.1 + i * 0.045, 0.32 + i * 0.045], [0, 1], clamp);
      if (k <= 0 || k >= 1) return null;
      const dir = i % 2 ? 1 : -1;
      const x = BOAT_X + dir * (40 + k * (180 + rnd(i) * 120));
      const y = BOAT_Y - 80 - Math.sin(k * Math.PI) * (110 + rnd(i + 5) * 60) + k * 140;
      return <ellipse key={i} cx={x} cy={y} rx={26} ry={9} fill="#C9D4DA" transform={`rotate(${dir * k * 160} ${x} ${y})`} />;
    })}
  </svg>
);

const Radio: React.FC<{t: number}> = ({t}) => {
  const charge = interpolate(t, [0.15, 0.8], [4, 0], clamp);
  const dead = charge <= 0.01;
  const on = interpolate(t, [0, 0.08], [0, 1], clamp);
  const items = ["Máy hỏng", "Không định vị", "Không neo"];
  return (
    <div style={{position: "absolute", top: 430, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: on, fontFamily: FONT.sans}}>
      <div style={{display: "flex", alignItems: "center", gap: 34, padding: "26px 34px", borderRadius: 24, background: "rgba(4,18,26,0.82)", border: `2px solid ${dead ? C.bad : C.warn}`}}>
        <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
          <div style={{width: 76, height: 128, borderRadius: 10, border: "5px solid #fff", padding: 7, display: "flex", flexDirection: "column-reverse", gap: 6}}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{flex: 1, borderRadius: 4, background: dead ? "transparent" : C.good, opacity: Math.max(0, Math.min(1, charge - i))}} />
            ))}
          </div>
          <div style={{marginTop: 10, fontSize: 28, fontWeight: 900, color: dead ? C.bad : "#fff"}}>{dead ? "HẾT PIN" : "BỘ ĐÀM"}</div>
        </div>
        <div>
          {items.map((s, i) => (
            <div key={s} style={{fontSize: 42, fontWeight: 800, color: "#fff", lineHeight: 1.35, opacity: interpolate(t, [0.05 + i * 0.12, 0.12 + i * 0.12], [0, 1], clamp)}}>
              <span style={{color: C.bad}}>✕</span> {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Plane: React.FC<{t: number}> = ({t}) => {
  const x = interpolate(t, [0.02, 0.75], [W + 120, -160], clamp);
  return (
    <svg width={W} height={H} style={{position: "absolute"}}>
      <g transform={`translate(${x} 660)`} fill="#1A242A">
        <ellipse cx={0} cy={0} rx={46} ry={8} />
        <path d="M -6 -2 L 14 -34 L 24 -34 L 14 -2 Z" />
        <path d="M -6 2 L 14 30 L 24 30 L 14 2 Z" />
        <path d="M 34 -2 L 46 -18 L 52 -18 L 46 0 Z" />
      </g>
    </svg>
  );
};

const HandFish: React.FC<{frame: number; t: number}> = ({frame, t}) => (
  <svg width={W} height={H} style={{position: "absolute"}}>
    {Array.from({length: 6}, (_, i) => {
      const y = BOAT_Y + 120 + i * 34;
      const x = ((rnd(i) * W + frame * (2 + rnd(i + 4) * 2) * (i % 2 ? 1 : -1)) % (W + 120) + W + 120) % (W + 120) - 60;
      return <ellipse key={i} cx={x} cy={y} rx={28} ry={10} fill="#9FC3CF" opacity={0.55} />;
    })}
    {/* the caught fish, flipping up at the end of the shot */}
    {t > 0.7 ? (
      <ellipse cx={BOAT_X + 190} cy={BOAT_Y - 30 - interpolate(t, [0.7, 0.85], [0, 90], clamp)} rx={30} ry={11} fill="#D7E4EA" stroke="#5E7680" strokeWidth={2} />
    ) : null}
  </svg>
);

const Birds: React.FC<{frame: number; count: number; on: number}> = ({frame, count, on}) => (
  <svg width={W} height={HY} style={{position: "absolute", opacity: on}}>
    {Array.from({length: count}, (_, i) => {
      const x = ((rnd(i) * W + frame * (1.5 + rnd(i + 2) * 2)) % (W + 80)) - 40;
      const y = 420 + rnd(i + 11) * 380 + Math.sin(frame / 9 + i) * 8;
      const flap = 8 + Math.sin(frame / 4 + i * 2) * 6;
      return <path key={i} d={`M ${x - 18} ${y - flap} Q ${x - 8} ${y - 2} ${x} ${y} Q ${x + 8} ${y - 2} ${x + 18} ${y - flap}`} stroke="#141C22" strokeWidth={3.5} fill="none" />;
    })}
  </svg>
);

const BigCount: React.FC<{label: string; value: string; on: number; top?: number; tone?: string}> = ({label, value, on, top = 420, tone = "#fff"}) => (
  <div style={{position: "absolute", top, left: 0, right: 0, textAlign: "center", opacity: on, fontFamily: FONT.sans}}>
    <div style={{fontSize: 34, fontWeight: 800, letterSpacing: 5, color: "#fff", textShadow: "0 2px 14px rgba(0,0,0,0.8)"}}>{label}</div>
    <div style={{fontSize: 150, lineHeight: 1, fontWeight: 900, color: tone, fontVariantNumeric: "tabular-nums", textShadow: "0 6px 30px rgba(0,0,0,0.8)"}}>{value}</div>
  </div>
);

const Trash: React.FC<{frame: number; t: number}> = ({frame, t}) => {
  const x = interpolate(t, [0, 0.7], [W + 60, BOAT_X + 290], clamp);
  const y = HY + 150 + Math.sin(frame / 13) * 6;
  return (
    <svg width={W} height={H} style={{position: "absolute"}}>
      <path d={`M ${x - 50} ${y} Q ${x - 56} ${y - 60} ${x - 6} ${y - 70} Q ${x + 52} ${y - 62} ${x + 48} ${y} Z`} fill="#2E5B34" stroke="#173019" strokeWidth={3} />
      <path d={`M ${x - 8} ${y - 70} L ${x - 18} ${y - 92} M ${x - 2} ${y - 70} L ${x + 10} ${y - 94}`} stroke="#173019" strokeWidth={5} strokeLinecap="round" />
    </svg>
  );
};

const Ships: React.FC<{t: number}> = ({t}) => (
  <svg width={W} height={H} style={{position: "absolute"}}>
    {Array.from({length: 5}, (_, i) => {
      const k = interpolate(t, [i * 0.17, i * 0.17 + 0.32], [0, 1], clamp);
      if (k <= 0 || k >= 1) return null;
      const dir = i % 2 ? -1 : 1;
      const x = dir > 0 ? -160 + k * (W + 320) : W + 160 - k * (W + 320);
      const s = 0.7 + rnd(i) * 0.5;
      return (
        <g key={i} transform={`translate(${x} ${HY - 2}) scale(${s})`} fill="#26323A" opacity={0.85}>
          <path d="M -120 0 L 120 0 L 104 -16 L -110 -16 Z" />
          <rect x={-96} y={-34} width={150} height={18} />
          <rect x={70} y={-46} width={26} height={30} />
        </g>
      );
    })}
  </svg>
);

const Island: React.FC<{size: number}> = ({size}) => {
  if (size <= 0.001) return null;
  const s = 0.25 + size * 1.1;
  const x = 820 - size * 140;
  return (
    <svg width={W} height={H} style={{position: "absolute"}}>
      <g transform={`translate(${x} ${HY + 4}) scale(${s})`}>
        <ellipse cx={0} cy={0} rx={220} ry={26} fill="#E9D9A6" />
        <path d="M -170 -4 Q -90 -90 0 -96 Q 90 -88 170 -4 Z" fill="#2F6B3A" />
        {[-80, 10, 90].map((px, i) => (
          <g key={i} transform={`translate(${px} ${-80 - i * 6})`}>
            <path d={`M 0 0 Q 6 -60 ${i % 2 ? 14 : -10} -120`} stroke="#5B4630" strokeWidth={9} fill="none" />
            <path d={`M ${i % 2 ? 14 : -10} -120 q -50 0 -80 30 M ${i % 2 ? 14 : -10} -120 q 50 0 80 30 M ${i % 2 ? 14 : -10} -120 q -20 -30 -60 -40 M ${i % 2 ? 14 : -10} -120 q 30 -30 70 -30`} stroke="#2B5E30" strokeWidth={12} fill="none" strokeLinecap="round" />
          </g>
        ))}
      </g>
    </svg>
  );
};

const Chip: React.FC<{text: string; sub?: string; t: number; top?: number}> = ({text, sub, t, top = 470}) => {
  const on = interpolate(t, [0, 10], [0, 1], clamp);
  return (
    <div style={{position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: on, transform: `translateY(${(1 - on) * 16}px)`}}>
      <div
        style={{
          maxWidth: PANEL_MAX_W,
          padding: "16px 30px",
          borderRadius: 18,
          background: "rgba(4,18,26,0.8)",
          border: `2px solid ${C.warn}`,
          textAlign: "center",
          fontFamily: FONT.sans,
          boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{fontSize: 48, fontWeight: 800, color: C.warn, lineHeight: 1.2}}>{text}</div>
        {sub ? <div style={{fontSize: 32, fontWeight: 600, color: C.text, marginTop: 6, lineHeight: 1.3}}>{sub}</div> : null}
      </div>
    </div>
  );
};

/** 15 moons at the top of the frame: each lights up as a month passes. */
const Moons: React.FC<{count: number; opacity: number}> = ({count, opacity}) => {
  const n = Math.min(15, Math.floor(count + 0.001));
  return (
    <div style={{position: "absolute", top: SAFE_TOP + 112, left: 0, right: 0, textAlign: "center", opacity, fontFamily: FONT.sans}}>
      <div style={{display: "flex", justifyContent: "center", gap: 12}}>
        {Array.from({length: 15}, (_, i) => {
          const lit = Math.max(0, Math.min(1, count - i));
          return (
            <div
              key={i}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                border: "2px solid rgba(244,241,228,0.55)",
                background: `rgba(244,241,228,${0.08 + 0.92 * lit})`,
                boxShadow: lit > 0.9 ? "0 0 14px rgba(244,241,228,0.6)" : "none",
              }}
            />
          );
        })}
      </div>
      <div style={{marginTop: 12, fontSize: 30, fontWeight: 800, letterSpacing: 4, color: "#F4F1E4", textShadow: "0 2px 12px rgba(0,0,0,0.9)"}}>
        {n === 0 ? "TUẦN TRĂNG" : `TRĂNG THỨ ${n}`}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// One shot's sea scene (drawable for the previous shot too during the crossfade).
// ---------------------------------------------------------------------------
const moonsAt = (shot: Shot, frame: number) => {
  const [a, b] = cfgOf(shot).moons;
  return a + (b - a) * ease(interpolate(frame - shot.start, [0, shot.duration * 0.9], [0, 1], clamp));
};

type View = NonNullable<ShotCfg["view"]>;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Alvarenga's pose per shot. */
const alvarengaOf = (cfg: ShotCfg, t: number) => {
  if (cfg.jump) {
    const j = interpolate(t, [0.3, 0.6], [0, 1], clamp);
    return {pose: "stand" as const, dx: j * 260, dy: -Math.sin(j * Math.PI) * 120 + j * 140, opacity: interpolate(j, [0.85, 1], [1, 0], clamp)};
  }
  if (cfg.handFish) return {pose: "lean" as const};
  if (cfg.ships) return {pose: "stand" as const, arms: "wave" as const};
  return {pose: cfg.sky === "storm" ? ("stand" as const) : ("sit" as const)};
};

/** A shot's sky lights: stars, moon, sun. `bigMoon` swaps the small moon for a big one behind the boat. */
const SkyLights: React.FC<{cfg: ShotCfg; frame: number; t: number; bigMoon?: boolean}> = ({cfg, frame, t, bigMoon}) => {
  const sky = cfg.sky;
  const night = sky === "night" ? 1 : sky === "dusk" ? 0.4 : 0;
  return (
    <>
      {night > 0 ? <Stars on={night} frame={frame} /> : null}
      {sky === "night" ? bigMoon ? <BigMoon /> : <SkyMoon on={cfg.moons[1] > cfg.moons[0] ? 1 : 0.85} /> : null}
      {sky === "harsh" ? (
        <Sun size={220} on={1} />
      ) : sky === "day" ? (
        <Sun size={110} on={0.6} />
      ) : sky === "dawn" ? (
        <Sun size={110} on={0.95} tone="#FFE2B0" glow="rgba(255,178,110,0.6)" />
      ) : sky === "dusk" ? (
        <Sun size={150} on={1} x={LIGHT.dusk!.x} y={HY + 18 - interpolate(t, [0, 1], [30, 0], clamp)} tone="#FFC27A" glow="rgba(255,140,80,0.65)" />
      ) : null}
    </>
  );
};

/** A big moon, lower half sunk behind the horizon, so boat and people print as silhouettes on it. */
const MOON_C: Pt = [540, 700];
const MOON_R = 280;
export const BigMoon: React.FC = () => (
  <div style={{position: "absolute", left: 0, top: 0, width: W, height: HY, overflow: "hidden"}}>
    <div
      style={{
        position: "absolute",
        left: MOON_C[0] - MOON_R * 2.6,
        top: MOON_C[1] - MOON_R * 2.6,
        width: MOON_R * 5.2,
        height: MOON_R * 5.2,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(220,232,255,0.32) 0%, rgba(0,0,0,0) 58%)",
      }}
    />
    <svg width={W} height={HY} style={{position: "absolute"}}>
      <defs>
        <radialGradient id="bigmoon" cx="0.42" cy="0.38" r="0.7">
          <stop offset="0" stopColor="#FBF8EC" />
          <stop offset="1" stopColor="#D9D6C6" />
        </radialGradient>
      </defs>
      <circle cx={MOON_C[0]} cy={MOON_C[1]} r={MOON_R} fill="url(#bigmoon)" />
      {/* lunar maria: a few faint dark patches */}
      {[
        [-90, -80, 70],
        [40, -120, 46],
        [80, 10, 82],
        [-40, 40, 40],
        [-150, 20, 34],
      ].map(([dx, dy, r], i) => (
        <circle key={i} cx={MOON_C[0] + dx} cy={MOON_C[1] + dy} r={r} fill="#A9A595" opacity={0.09} />
      ))}
    </svg>
  </div>
);

// ---------------------------------------------------------------------------
// The side view (default), with a camera.
// ---------------------------------------------------------------------------
const SideWorld: React.FC<{shot: Shot; frame: number}> = ({shot, frame}) => {
  const cfg = cfgOf(shot);
  const t = (frame - shot.start) / Math.max(1, shot.duration);
  const local = frame - shot.start;
  const sky = cfg.sky;
  return (
    <AbsoluteFill>
      <Sea sky={sky} frame={frame} />
      <SkyLights cfg={cfg} frame={frame} t={t} />
      {cfg.coast ? <Coast on={interpolate(t, [0, 1], cfg.coast, clamp)} t={t} /> : null}
      {cfg.ships ? <Ships t={t} /> : null}
      {cfg.island ? <Island size={interpolate(t, [0, 0.9], cfg.island, clamp)} /> : null}
      {cfg.plane ? <Plane t={t} /> : null}
      {cfg.birds ? <Birds frame={frame} count={cfg.birds === "many" ? 34 : 7} on={cfg.birds === "many" ? interpolate(t, [0, 0.4], [0, 1], clamp) : 1} /> : null}
      {cfg.trash ? <Trash frame={frame} t={t} /> : null}
      <Boat
        frame={frame}
        sky={sky}
        moons={moonsAt(shot, frame)}
        ezequiel={cfg.ezequiel}
        ezOpacity={cfg.ezequiel === "fade" ? interpolate(t, [0.55, 0.85], [1, 0], clamp) : 1}
        alvarenga={alvarengaOf(cfg, t)}
        buoys={cfg.jump && t > 0.25 ? 0 : 5}
        names={cfg.names ? interpolate(local, [6, 18], [0, 1], clamp) : 0}
      />
      {cfg.handFish ? <HandFish frame={frame} t={t} /> : null}
      {cfg.fishDump ? <FishDump t={t} /> : null}
      {sky === "storm" ? <Rain frame={frame} on={1} heavy /> : null}
      {cfg.dryDays ? <Rain frame={frame} on={interpolate(t, [0.82, 0.92], [0, 1], clamp)} /> : null}
    </AbsoluteFill>
  );
};

/** Camera: zoom about a look point, pan the look point, handheld shake. Zoom stays >= 1 so no edge shows. */
const Camera: React.FC<{cam?: ShotCfg["cam"]; t: number; frame: number; children: React.ReactNode}> = ({cam, t, frame, children}) => {
  if (!cam) return <AbsoluteFill>{children}</AbsoluteFill>;
  const k = ease(Math.max(0, Math.min(1, t)));
  const z = Math.max(1, lerp(cam.z[0], cam.z[1], k));
  const at = cam.at ?? [BOAT_X, BOAT_Y - 60];
  const to = cam.to ?? at;
  const ox = lerp(at[0], to[0], k);
  const oy = lerp(at[1], to[1], k);
  const sh = cam.shake ?? 0;
  const jx = sh * (Math.sin(frame * 0.83) * 0.6 + Math.sin(frame * 2.1 + 1) * 0.4);
  const jy = sh * 0.7 * (Math.sin(frame * 1.07 + 2) * 0.6 + Math.sin(frame * 2.7) * 0.4);
  return <AbsoluteFill style={{transform: `translate(${jx}px, ${jy}px) scale(${z})`, transformOrigin: `${ox}px ${oy}px`}}>{children}</AbsoluteFill>;
};

// ---------------------------------------------------------------------------
// Silhouette against the moon: lines 13-14.
// ---------------------------------------------------------------------------
const MOON_BOAT_SCALE = 1.1;
const MoonWorld: React.FC<{shot: Shot; frame: number}> = ({shot, frame}) => {
  const cfg = cfgOf(shot);
  const t = (frame - shot.start) / Math.max(1, shot.duration);
  // The waterline at the hull sits just below the horizon.
  const y = HY + 14 - 36 * MOON_BOAT_SCALE;
  return (
    <AbsoluteFill>
      <Sea sky="night" frame={frame} lightX={MOON_C[0]} />
      <SkyLights cfg={cfg} frame={frame} t={t} bigMoon />
      <Boat
        frame={frame}
        sky="night"
        moons={moonsAt(shot, frame)}
        ezequiel={cfg.ezequiel}
        ezOpacity={cfg.ezequiel === "fade" ? interpolate(t, [0.55, 0.85], [1, 0], clamp) : 1}
        alvarenga={{pose: "sit"}}
        buoys={5}
        y={y}
        scale={MOON_BOAT_SCALE}
        silhouette="#E8EEF8"
        waterMix={0.02}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Top-down view: line 15. The camera rises, the boat shrinks to a dot.
// ---------------------------------------------------------------------------
const TOP_C: Pt = [540, 1000];
const TopWorld: React.FC<{shot: Shot; frame: number}> = ({shot, frame}) => {
  const t = (frame - shot.start) / Math.max(1, shot.duration);
  // Rise on a log scale so the speed looks even.
  const zs = Math.exp(lerp(Math.log(1.5), Math.log(0.14), ease(Math.min(1, t * 1.05))));
  const yaw = -18 + Math.sin(frame / 60) * 3;
  const g = GRADE.night.k;
  return (
    <AbsoluteFill style={{background: "radial-gradient(ellipse 80% 60% at 60% 40%, #123A58 0%, #071A2B 55%, #020910 100%)"}}>
      <svg width={W} height={H} style={{position: "absolute"}}>
        <defs>
          <filter id="top-grade" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={`${g[0] * 1.4} 0 0 0 0  0 ${g[1] * 1.4} 0 0 0  0 0 ${g[2] * 1.4} 0 0  0 0 0 1 0`} />
          </filter>
        </defs>
        <g transform={`translate(${TOP_C[0]} ${TOP_C[1]}) scale(${zs})`}>
          {/* ripples: sized in sea units, so they get finer as the camera rises */}
          {Array.from({length: 520}, (_, i) => {
            const x = (rnd(i + 3000) - 0.5) * 7600;
            const y = (rnd(i + 3100) - 0.5) * 13600;
            const w = 18 + rnd(i + 3200) * 50;
            const drift = Math.sin(frame / 40 + i) * 6;
            const a = 0.1 + 0.25 * (0.5 + 0.5 * Math.sin(frame / (10 + rnd(i) * 14) + i * 2.3));
            return (
              <path
                key={i}
                d={`M ${x - w + drift} ${y} Q ${x + drift} ${y - w * 0.18} ${x + w + drift} ${y}`}
                stroke="#9CC1DE"
                strokeWidth={Math.max(2, 2.2 / zs)}
                fill="none"
                opacity={a}
              />
            );
          })}
          {/* rings of water spreading around the hull */}
          {[0, 1, 2].map((k) => {
            const p = ((frame / 70 + k / 3) % 1 + 1) % 1;
            return <ellipse key={k} cx={0} cy={0} rx={240 + p * 240} ry={70 + p * 120} fill="none" stroke="#BFD6F2" strokeWidth={3 / Math.max(0.4, zs)} opacity={(1 - p) * 0.35} transform={`rotate(${yaw})`} />;
          })}
          <g transform={`rotate(${yaw})`} filter="url(#top-grade)">
            {/* buoy line trailing from the stern */}
            <path d={`M -195 0 Q -290 ${Math.sin(frame / 20) * 14} -400 ${Math.sin(frame / 16) * 18}`} stroke="#E8E2D0" strokeWidth={3} fill="none" />
            {Array.from({length: 5}, (_, i) => (
              <circle key={i} cx={-230 - i * 40} cy={Math.sin(frame / 18 + i) * 10} r={10} fill="#FF7A2F" />
            ))}
            {/* hull from above: flat stern, pointed bow */}
            <path d="M -190 -46 L 110 -46 Q 196 -30 222 0 Q 196 30 110 46 L -190 46 Z" fill="#EEF2F2" stroke="#2FD8FF" strokeWidth={6} />
            <path d="M -176 -32 L 104 -32 Q 168 -20 190 0 Q 168 20 104 32 L -176 32 Z" fill="#B9C5CA" />
            {Array.from({length: 40}, (_, i) => (
              <ellipse key={i} cx={-160 + rnd(i + 5000) * 300} cy={(rnd(i + 5100) - 0.5) * 52} rx={5} ry={3.5} fill="#A79E86" />
            ))}
            <rect x={-205} y={-14} width={26} height={28} rx={5} fill="#4A545A" />
            <rect x={-40} y={-26} width={86} height={52} rx={6} fill="#F2F4F3" stroke="#9AA6AC" strokeWidth={3} />
            {/* Alvarenga sitting: yellow shirt shoulders, straw hat */}
            <ellipse cx={92} cy={2} rx={20} ry={30} fill={LOOK.alv.shirt} />
            <circle cx={96} cy={2} r={22} fill={LOOK.alv.hat} />
            <circle cx={96} cy={2} r={11} fill={mixHex(LOOK.alv.hat, "#000000", 0.15)} />
          </g>
        </g>
      </svg>
      {/* moonlight spreading on the water */}
      <AbsoluteFill style={{background: "radial-gradient(ellipse 50% 32% at 72% 30%, rgba(200,220,255,0.16) 0%, rgba(0,0,0,0) 100%)"}} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Cut across the water surface: lines 7, 8, 19.
// ---------------------------------------------------------------------------
type UnderKind = "deep" | "hands" | "shells";
const UNDER_SHIFT: Record<UnderKind, number> = {deep: 470, hands: 300, shells: 300};

/** A fish side-on, head towards `dir`. */
const Fish: React.FC<{x: number; y: number; s: number; dir: 1 | -1; fill: string; wag: number; opacity?: number}> = ({x, y, s, dir, fill, wag, opacity = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s * dir} ${s})`} opacity={opacity}>
    <path d={`M -26 0 L -40 ${-12 + wag} L -40 ${12 + wag} Z`} fill={fill} />
    <ellipse cx={0} cy={0} rx={28} ry={10} fill={fill} />
    <path d="M -4 -9 Q 4 -18 12 -9 Z" fill={fill} />
    <circle cx={16} cy={-2} r={2} fill="#06141C" opacity={0.7} />
  </g>
);

const UnderWorld: React.FC<{shot: Shot; frame: number; kind: UnderKind}> = ({shot, frame, kind}) => {
  const cfg = cfgOf(shot);
  const t = (frame - shot.start) / Math.max(1, shot.duration);
  const sky = cfg.sky;
  const s = SKY[sky];
  const shift = UNDER_SHIFT[kind];
  const by = BOAT_Y - shift;
  const {bob, tilt} = boatMotion(frame, sky);
  const moons = moonsAt(shot, frame);
  // Water surface: matches the waterline at the hull and continues to both frame edges.
  const surfY = (x: number) => by + bob * 0.4 + waterlineAt(x - BOAT_X, frame, sky);
  let surf = "";
  for (let x = -20; x <= W + 20; x += 20) surf += `${surf ? " L" : "M"} ${x} ${surfY(x).toFixed(1)}`;
  const panel = `${surf} L ${W + 20} ${H + 40} L -20 ${H + 40} Z`;
  const near = mixHex(s.sea, s.low, 0.3);
  const water = mixHex(s.sea, s.deep, 0.35);
  const boatT = `translate(${BOAT_X} ${by + bob}) rotate(${tilt})`;
  const shellCount = kind === "shells" ? 150 : Math.round(moons * 10);
  // Hands grabbing a fish: they close at about 0.68-0.74 of the shot.
  const clap = kind === "hands" ? interpolate(t, [0.62, 0.7], [0, 1], clamp) : 0;
  const spread = 46 * (1 - clap);
  // Both arms under to the shoulder, spread in a V underwater, closing on the grab.
  const sh = LEAN_SH;
  // After the grab the arms pull the fish up.
  const lift = kind === "hands" ? ease(interpolate(t, [0.74, 0.95], [0, 1], clamp)) * 60 : 0;
  const arms: Pt[][] = [
    [sh, add(sh, 22 + spread * 0.4 + lift * 0.3, 62 - lift * 0.5), [sh[0] + 12 + spread, 140 - lift + Math.sin(frame / 8) * 3]],
    [add(sh, -6, 2), add(sh, -24 - spread * 0.4 - lift * 0.3, 60 - lift * 0.5), [sh[0] - 14 - spread, 134 - lift + Math.sin(frame / 9 + 1) * 3]],
  ];
  const skin = mixHex(LOOK.alv.skin, water, 0.3);
  const sleeve = mixHex(LOOK.alv.shirt, water, 0.35);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `translateY(${-shift}px)`}}>
        <Sea sky={sky} frame={frame} />
        <SkyLights cfg={cfg} frame={frame} t={t} />
        <Boat
          frame={frame}
          sky={sky}
          moons={moons}
          ezequiel={cfg.ezequiel}
          ezOpacity={1}
          alvarenga={alvarengaOf(cfg, t)}
          buoys={5}
        />
      </AbsoluteFill>
      <svg width={W} height={H} style={{position: "absolute"}}>
        <defs>
          <linearGradient id={`under-${kind}`} gradientUnits="userSpaceOnUse" x1="0" y1={by} x2="0" y2={H}>
            <stop offset="0" stopColor={near} />
            <stop offset="0.25" stopColor={s.sea} />
            <stop offset={kind === "deep" ? "0.6" : "0.75"} stopColor={s.deep} />
            <stop offset="1" stopColor="#01060B" />
          </linearGradient>
          <clipPath id={`under-clip-${kind}`}>
            <path d={panel} />
          </clipPath>
          <filter id="ray-blur" x="-50%" y="-10%" width="200%" height="120%">
            <feGaussianBlur stdDeviation={14} />
          </filter>
        </defs>
        <path d={panel} fill={`url(#under-${kind})`} />
        <g clipPath={`url(#under-clip-${kind})`}>
          {/* sun rays reaching down into the water */}
          {Array.from({length: 7}, (_, i) => {
            const x0 = 80 + i * 150 + Math.sin(frame / 50 + i) * 30;
            const len = kind === "deep" ? 1300 : 900;
            const a = 0.07 * (0.6 + 0.4 * Math.sin(frame / 23 + i * 1.7));
            return <path key={i} d={`M ${x0 - 22} ${by} L ${x0 + 22} ${by} L ${x0 + 120} ${by + len} L ${x0 - 40} ${by + len} Z`} fill="#E8F6FF" opacity={a} filter="url(#ray-blur)" />;
          })}
          {/* floating particles */}
          {Array.from({length: 70}, (_, i) => {
            const x = rnd(i + 7000) * W + Math.sin(frame / 30 + i) * 8;
            const span = H - by;
            const y = by + 30 + (((rnd(i + 7100) * span - frame * (0.3 + rnd(i) * 0.5)) % span) + span) % span;
            return <circle key={i} cx={x} cy={y} r={1 + rnd(i + 7200) * 2} fill="#DDF0FA" opacity={0.25 * (1 - (y - by) / span)} />;
          })}
          {kind === "deep" ? (
            <>
              {/* the shadow of a big fish gliding past far below */}
              <Fish x={interpolate(t, [0, 1], [W + 300, -300], clamp)} y={1330} s={7} dir={-1} fill="#020B12" wag={Math.sin(frame / 10) * 6} opacity={0.75} />
              {Array.from({length: 6}, (_, i) => (
                <Fish key={i} x={((rnd(i + 80) * W + frame * 1.2) % (W + 200)) - 100} y={by + 260 + rnd(i + 81) * 260} s={0.6} dir={1} fill={mixHex("#9FC3CF", water, 0.4)} wag={Math.sin(frame / 4 + i) * 4} opacity={0.7} />
              ))}
            </>
          ) : null}
          {/* the submerged part of the hull */}
          <g transform={boatT}>
            <path d="M -204 10 L 212 10 L 180 46 Q 168 64 140 66 L -160 66 Q -186 62 -192 46 Z" fill={mixHex("#8C2F2F", water, 0.45)} />
            <path d="M -160 66 L 140 66" stroke={mixHex("#000000", water, 0.5)} strokeWidth={4} />
            {Array.from({length: shellCount}, (_, i) => {
              const u = rnd(i + 9000);
              const cx = -180 + u * 370;
              const cy = 40 + rnd(i + 9100) * 26;
              const r = kind === "shells" ? 4 + rnd(i + 9200) * 7 : 3 + rnd(i + 9200) * 4;
              return (
                <g key={i}>
                  <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.7} fill={rnd(i + 9300) > 0.5 ? mixHex("#D8CFB8", water, 0.25) : mixHex("#A79E86", water, 0.25)} stroke={mixHex("#5D5644", water, 0.3)} strokeWidth={1} />
                  {kind === "shells" && rnd(i + 9400) > 0.6 ? <path d={`M ${cx} ${cy + r * 0.6} l 0 ${4 + rnd(i) * 10}`} stroke={mixHex("#4E7A52", water, 0.3)} strokeWidth={2} /> : null}
                </g>
              );
            })}
            {kind === "hands" ? (
              <>
                {arms.map((a, i) => (
                  <g key={i}>
                    {/* short sleeve just below the shoulder, then the bare forearm */}
                    <path d={poly(a)} stroke={skin} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    <path d={poly([a[0], [lerp(a[0][0], a[1][0], 0.45), lerp(a[0][1], a[1][1], 0.45)]])} stroke={sleeve} strokeWidth={15} strokeLinecap="round" fill="none" />
                  </g>
                ))}
                {arms.map((a) => a[2]).map((h, i) => (
                  <g key={`h${i}`} transform={`translate(${h[0]} ${h[1]}) rotate(${i ? 30 : -30})`}>
                    <ellipse cx={0} cy={4} rx={9} ry={11} fill={skin} />
                    <path d="M -6 12 l -2 8 M 0 14 l 0 9 M 6 12 l 2 8" stroke={skin} strokeWidth={4} strokeLinecap="round" />
                  </g>
                ))}
              </>
            ) : null}
          </g>
          {kind === "hands"
            ? Array.from({length: 9}, (_, i) => {
                // Fish number 0 swims straight between the two hands and is caught.
                const caught = i === 0;
                const hx = BOAT_X + LEAN_SH[0];
                const hy = by + 137;
                const x = caught
                  ? t < 0.66
                    ? interpolate(t, [0, 0.66], [W + 80, hx], clamp)
                    : hx
                  : ((rnd(i + 60) * (W + 200) - frame * (1.4 + rnd(i + 61))) % (W + 200) + W + 200) % (W + 200) - 100;
                const y = caught ? (t < 0.7 ? hy + Math.sin(frame / 7) * 6 : hy - lift) : by + 180 + rnd(i + 62) * 280;
                const wag = Math.sin(frame / (caught && t > 0.7 ? 1.5 : 4) + i) * (caught && t > 0.7 ? 7 : 4);
                return <Fish key={i} x={x} y={y} s={caught ? 1 : 0.7 + rnd(i + 63) * 0.5} dir={-1} fill={mixHex("#B7D3DD", water, caught ? 0.1 : 0.35)} wag={wag} />;
              })
            : null}
          {kind === "shells"
            ? Array.from({length: 7}, (_, i) => (
                <Fish
                  key={i}
                  x={BOAT_X - 150 + i * 50 + Math.sin(frame / 20 + i * 2) * 20}
                  y={by + 130 + rnd(i + 70) * 60 + Math.sin(frame / 14 + i) * 6}
                  s={0.45 + rnd(i + 71) * 0.2}
                  dir={i % 2 ? 1 : -1}
                  fill={mixHex("#E2C35A", water, 0.3)}
                  wag={Math.sin(frame / 3 + i) * 3}
                />
              ))
            : null}
          {/* rippling light just below the surface */}
          <path d={surf} transform="translate(0 6)" stroke="#E8F6FF" strokeWidth={6} fill="none" opacity={0.18} />
        </g>
        <path d={surf} stroke={mixHex(s.sea, s.low, 0.6)} strokeWidth={3} fill="none" opacity={0.8} />
      </svg>
    </AbsoluteFill>
  );
};

const UNDER_CAM: Record<UnderKind, ShotCfg["cam"]> = {
  deep: {z: [1.12, 1], at: [540, 700]},
  hands: {z: [1.05, 1.2], at: [700, 900]},
  shells: {z: [1.5, 1.65], at: [540, 600]},
};

// ---------------------------------------------------------------------------
// One sea shot: the world (by frame type, with a camera), then the text layer on top.
// ---------------------------------------------------------------------------
const SeaShot: React.FC<{shot: Shot; frame: number}> = ({shot, frame}) => {
  const cfg = cfgOf(shot);
  const t = (frame - shot.start) / Math.max(1, shot.duration);
  const local = frame - shot.start;
  const view: View = cfg.view ?? "side";
  const under = view.startsWith("under-") ? (view.slice(6) as UnderKind) : null;
  const cam = under ? UNDER_CAM[under] : view === "moon" ? {z: [1, 1.07] as [number, number], at: [540, 820] as [number, number]} : view === "side" ? cfg.cam : undefined;
  return (
    <AbsoluteFill>
      <Camera cam={cam} t={t} frame={frame}>
        {under ? <UnderWorld shot={shot} frame={frame} kind={under} /> : view === "moon" ? <MoonWorld shot={shot} frame={frame} /> : view === "top" ? <TopWorld shot={shot} frame={frame} /> : <SideWorld shot={shot} frame={frame} />}
      </Camera>
      {cfg.radio ? <Radio t={t} /> : null}
      {cfg.dryDays ? (
        <BigCount
          label={t < 0.86 ? "NGÀY KHÔNG MƯA" : "MƯA LẦN ĐẦU"}
          value={String(Math.max(1, Math.min(14, Math.floor(interpolate(t, [0.05, 0.8], [1, 14.99], clamp)))))}
          on={interpolate(local, [0, 10], [0, 1], clamp)}
          top={480}
          tone={t < 0.86 ? C.warn : C.accent}
        />
      ) : null}
      {cfg.ships ? <BigCount label="TÀU ĐI NGANG" value={`${Math.round(interpolate(t, [0.05, 0.9], [0, 20], clamp))}`} on={interpolate(local, [0, 10], [0, 1], clamp)} top={470} /> : null}
      {cfg.chip ? <Chip text={cfg.chip} sub={cfg.sub} t={local} top={under === "deep" ? 1130 : 470} /> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// From line 20: pull the camera out to the globe.
// ---------------------------------------------------------------------------
const WIDE: GlobeView = {lon: -141, lat: 11, scale: 0.6};
const CLOSE_EBON: GlobeView = {lon: EBON[0], lat: EBON[1], scale: 5};

const SG_LONDON = 10200;
const DRIFT_KM = 10700;

const Compare: React.FC<{t: number}> = ({t}) => {
  const rows = [
    {label: "Mexico → quần đảo Marshall", km: DRIFT_KM, tone: C.accent, at: 0},
    {label: "Sài Gòn → London", km: SG_LONDON, tone: C.warn, at: 16},
  ];
  return (
    <div style={{position: "absolute", top: 1080, left: 90, right: 90, padding: "26px 34px 4px", borderRadius: 22, background: "rgba(4,18,26,0.82)", fontFamily: FONT.sans}}>
      {rows.map((r) => {
        const fill = ease(interpolate(t, [r.at, r.at + 22], [0, 1], clamp));
        return (
          <div key={r.label} style={{marginBottom: 22, opacity: interpolate(t, [r.at, r.at + 8], [0, 1], clamp)}}>
            <div style={{display: "flex", justifyContent: "space-between", fontSize: 32, fontWeight: 800, color: "#fff"}}>
              <span>{r.label}</span>
              <span style={{color: r.tone}}>{r.km.toLocaleString("vi-VN")} km</span>
            </div>
            <div style={{marginTop: 8, height: 22, borderRadius: 11, background: "rgba(255,255,255,0.14)", overflow: "hidden"}}>
              <div style={{width: `${(r.km / DRIFT_KM) * fill * 100}%`, height: "100%", borderRadius: 11, background: r.tone}} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const GlobeShot: React.FC<{shot: Shot; frame: number}> = ({shot, frame}) => {
  const cfg = cfgOf(shot);
  const local = frame - shot.start;
  const reveal = cfg.globe === "reveal";
  const pull = reveal ? ease(interpolate(local, [6, 70], [0, 1], clamp)) : 1;
  // Pull out on the log of scale so the zoom speed looks even.
  const scale = Math.exp(Math.log(CLOSE_EBON.scale) + (Math.log(WIDE.scale) - Math.log(CLOSE_EBON.scale)) * pull);
  const drift = 1 + 0.025 * Math.min(1, (frame - SHOTS[19].start) / 900);
  const view: GlobeView = {
    lon: CLOSE_EBON.lon + (WIDE.lon - CLOSE_EBON.lon) * pull,
    lat: CLOSE_EBON.lat + (WIDE.lat - CLOSE_EBON.lat) * pull,
    scale: scale * drift,
  };
  const draw = reveal ? ease(interpolate(local, [50, shot.duration * 0.8], [0, 1], clamp)) : 1;
  const tracers = cfg.globe === "tracers" ? interpolate(local, [6, shot.duration * 0.75], [0, 1], clamp) : cfg.globe === "hold" ? 1 : 0;
  const kmOn = reveal ? interpolate(local, [shot.duration * 0.78, shot.duration * 0.9], [0, 1], clamp) : cfg.globe === "compare" ? 1 : 0;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 60% at 50% 45%, #0C2236 0%, ${C.bg} 70%)`}}>
      <Stars on={0.8} frame={frame} height={H} count={160} />
      <Globe width={W} height={H} view={view} />
      <AbsoluteFill>
        {tracers > 0
          ? TRACERS.map((pts, k) => (
              <GlobeLine key={k} points={pts} view={view} width={W} height={H} tone={C.warn} strokeWidth={2.5} glow={false} opacity={cfg.globe === "hold" ? 0.35 : 0.6} progress={tracers} />
            ))
          : null}
        <GlobeLine points={DRIFT} view={view} width={W} height={H} tone={C.accent} strokeWidth={7} progress={draw} />
        <GlobePin at={COSTA_AZUL} view={view} width={W} height={H} label="Costa Azul, Mexico" on={reveal ? interpolate(local, [44, 56], [0, 1], clamp) : 1} exact size={13} />
        <GlobePin at={EBON} view={view} width={W} height={H} label="Ebon, quần đảo Marshall" tone={C.warn} on={reveal ? interpolate(local, [0, 10], [0, 1], clamp) : 1} exact size={13} />
      </AbsoluteFill>
      {kmOn > 0 ? <Chip text="≈ 10.700 km" sub="đường thẳng, đo giữa hai điểm" t={kmOn * 10} top={430} /> : null}
      {cfg.globe === "compare" ? <Compare t={local} /> : null}
      {cfg.globe === "tracers" ? <Chip text="Mô hình gió và hải lưu" sub="16 điểm thả ngoài khơi Mexico" t={local} top={430} /> : null}
      {cfg.globe === "hold" ? <Chip text="Chuyến câu 30 tiếng" sub="kết thúc sau 15 vầng trăng" t={local} top={430} /> : null}
      {cfg.globe === "compare" ? null : (
      <div style={{position: "absolute", left: 40, top: 1250, fontFamily: FONT.sans, fontSize: 18, color: "rgba(255,255,255,0.5)", textShadow: "0 1px 6px #000"}}>
        Nền: NASA Blue Marble. Đường trôi phỏng theo mô hình Đại học Hawaii.
      </div>
      )}
    </AbsoluteFill>
  );
};

const Vignette = () => (
  <AbsoluteFill style={{pointerEvents: "none", background: "radial-gradient(ellipse 80% 62% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)"}} />
);

const Scene: React.FC<{shot: Shot; frame: number}> = ({shot, frame}) => (cfgOf(shot).globe ? <GlobeShot shot={shot} frame={frame} /> : <SeaShot shot={shot} frame={frame} />);

export const Alvarenga: React.FC<{safe?: boolean}> = ({safe = false}) => {
  const frame = useCurrentFrame();
  loadChannelFont();
  const shot = shotAt(frame);
  const cfg = cfgOf(shot);
  const prev = prevOf(shot);
  const local = frame - shot.start;
  // Line 20 is the pull-out: the sea scene shrinks into the Ebon point while the globe appears.
  const reveal = cfg.globe === "reveal";
  const xfade = reveal ? 40 : XFADE;
  // No crossfade between two globe shots: same view, no need to draw two globes.
  const crossing = !!prev && local < xfade && !(cfg.globe && cfgOf(prev).globe);
  const mix = crossing ? local / xfade : 1;
  const moons = cfg.globe ? 15 : moonsAt(shot, frame);

  return (
    <AbsoluteFill style={{background: C.bg}}>
      {AUDIO ? <Audio src={staticFile(AUDIO)} /> : null}
      {/* No background music: the channel owner adds their own music when posting (@memory/s24aix). */}
      <Scene shot={shot} frame={frame} />
      {crossing ? (
        <AbsoluteFill
          style={{
            opacity: 1 - mix,
            transform: reveal ? `scale(${1 - 0.9 * ease(mix)})` : undefined,
            transformOrigin: `${BOAT_X}px ${BOAT_Y - 100}px`,
          }}
        >
          <Scene shot={prev!} frame={frame} />
        </AbsoluteFill>
      ) : null}
      <Grain frame={frame} />
      <Vignette />
      <Moons count={moons} opacity={interpolate(frame, [0, 15], [0, 1], clamp)} />
      <Captions words={WORDS} palette={C} variant="map" maxWidth={PANEL_MAX_W} en={EN} />
      <Watermark top={SAFE_TOP + 8} />
      {safe ? <SafeZones /> : null}
    </AbsoluteFill>
  );
};
