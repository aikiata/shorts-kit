/**
 * A person drawn from SVG shapes, with a skeleton set by pose. Origin: between the two
 * feet, on the ground (y = 0), facing right. `flip` faces left.
 *
 * Version 2 (channel owner, 05/11/2026: "the people animation is still a bit basic"):
 * - limbs have two segments of different thickness (thigh thicker than shin), boots, neck, ears,
 *   eyes, nose, moustache; uniforms have a collar, buttons, coat tails, cuffs;
 * - every shape has a thin dark outline drawn underneath, a shadow under the feet, the back half of the torso darker;
 * - walk and run: the knee bends on the leg being lifted, the hip bobs twice per stride, the arms
 *   swing against the legs; running bends the elbows and leans the body forward;
 * - standing still still breathes, lying asleep the chest rises and falls; the rhythm is offset by position so a crowd
 *   does not move as one.
 *
 * Shared build method from @doc/patterns/canh-ve-svg-giua-bien; `rim` draws an extra
 * light-outline copy offset toward the light source for dark scenes.
 */
import React from "react";
import {useCurrentFrame} from "remotion";
import {mixHex} from "./kit";

type Pt = readonly [number, number];
export type Pose = "stand" | "walk" | "run" | "crouch" | "lie" | "sit" | "slump" | "kneel" | "ground";

const add = (p: Pt, dx: number, dy: number): Pt => [p[0] + dx, p[1] + dy];
const poly = (pts: readonly Pt[]) => pts.map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
/** Tapered block from a (width wa) to b (width wb). */
const taper = (a: Pt, b: Pt, wa: number, wb: number) => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = -(b[1] - a[1]) / L;
  const ny = (b[0] - a[0]) / L;
  return poly([add(a, (nx * wa) / 2, (ny * wa) / 2), add(b, (nx * wb) / 2, (ny * wb) / 2), add(b, (-nx * wb) / 2, (-ny * wb) / 2), add(a, (-nx * wa) / 2, (-ny * wa) / 2)]) + " Z";
};
/** Two segments from `from`: angles measured from straight down, positive is forward (+x). */
const chain = (from: Pt, a1: number, a2: number, l1: number, l2: number): [Pt, Pt, Pt] => {
  const k: Pt = [from[0] + Math.sin(a1) * l1, from[1] + Math.cos(a1) * l1];
  return [from, k, [k[0] + Math.sin(a2) * l2, k[1] + Math.cos(a2) * l2]];
};

/**
 * Two-segment inverse kinematics: hip `h`, ankle `f`, the knee always bends forward (+x).
 * If the ankle is out of reach it is pulled back to reach, the leg straight.
 */
const ik = (h: Pt, f: Pt, l1: number, l2: number): [Pt, Pt, Pt] => {
  const dx = f[0] - h[0];
  const dy = f[1] - h[1];
  const d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01);
  const base = Math.atan2(dx, dy);
  const a = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  const th = base + a;
  const knee: Pt = [h[0] + Math.sin(th) * l1, h[1] + Math.cos(th) * l1];
  const sh = Math.atan2(f[0] - knee[0], f[1] - knee[1]);
  return [h, knee, [knee[0] + Math.sin(sh) * l2, knee[1] + Math.cos(sh) * l2]];
};

const smooth = (k: number) => k * k * (3 - 2 * k);
/** The ankle sits above the ground by the height of the boot sole. */
const ANKLE = 7;

/** Gait per pose: phase speed (rad/frame), share of time in stance, foot lift, default stride. */
export const GAIT = {
  walk: {w: 0.2, stance: 0.6, lift: 12, stride: 20},
  slump: {w: 0.12, stance: 0.64, lift: 6, stride: 13},
  run: {w: 0.34, stance: 0.4, lift: 30, stride: 34},
  crouch: {w: 0.16, stance: 0.62, lift: 9, stride: 13},
} as const;
type Gaited = keyof typeof GAIT;

/**
 * One leg in the step cycle. Stance phase: the ankle stays still on the ground (moving backward relative to
 * the hip as the body goes forward), the heel lifts at the end of the phase. Swing phase: lift, swing forward.
 * Returns the ankle position (relative to the hip in x) and the foot tilt.
 */
const footAt = (u: number, g: (typeof GAIT)[Gaited], S: number): {x: number; y: number; tilt: number; plant: boolean} => {
  if (u < g.stance) {
    const k = u / g.stance;
    const heel = k > 0.72 ? ((k - 0.72) / 0.28) * 0.55 : 0;
    return {x: S * (1 - 2 * k), y: -ANKLE - heel * 6, tilt: heel, plant: true};
  }
  const k = (u - g.stance) / (1 - g.stance);
  return {x: -S + 2 * S * smooth(k), y: -ANKLE - g.lift * Math.sin(Math.PI * k), tilt: 0.45 * (1 - k) - 0.12 * Math.sin(Math.PI * k), plant: false};
};

const THIGH = 42;
const SHIN = 40;
const UPPER = 29;
const FORE = 27;

type Rig = {hip: Pt; sh: Pt; head: Pt; legs: [Pt, Pt, Pt][]; arms: [Pt, Pt, Pt][]; footTilt: number[]; eyesShut?: boolean};

/**
 * Skeleton by pose. `p` is the step phase (radians), `b` is the breath -1..1.
 * The first leg and arm are on the far side (drawn first), the second on the near side.
 */
const rig = (pose: Pose, p: number, b: number, S: number, seatH = 40): Rig => {
  if (pose === "lie") {
    // Lying on the back, head to the left, both hands on the belly, chest rising with the breath.
    const chest = b * 1.6;
    const hip: Pt = [14, -15];
    const sh: Pt = [-46, -17 - chest];
    return {
      hip,
      sh,
      head: [-68, -19 - chest * 0.5],
      legs: [
        [hip, [46, -14], [78, -11]],
        [[14, -12], [44, -22], [74, -12]],
      ],
      arms: [
        [sh, [-26, -27 - chest], [-4, -25 - chest]],
        [sh, [-24, -12], [2, -22 - chest]],
      ],
      footTilt: [-1.4, -1.4],
      eyesShut: true,
    };
  }
  if (pose === "sit") {
    // Sitting on a seat of height seatH: thighs near level, shins straight down, both hands on the knees.
    const hip: Pt = [0, -(seatH + 6)];
    const sh: Pt = [5, hip[1] - 60 + b * 0.8];
    const legs = [ik(hip, [34, -ANKLE], THIGH, SHIN), ik(add(hip, -2, 0), [44, -ANKLE], THIGH, SHIN)];
    const kn = legs[1][1];
    return {
      hip,
      sh,
      head: [8, sh[1] - 25],
      legs,
      arms: [chain(sh, 0.5, 1.2, UPPER, FORE), chain(sh, 0.62, 1.35, UPPER, FORE)].map((a, i) => (i ? [a[0], a[1], add(kn, -6, -8)] : a)) as [Pt, Pt, Pt][],
      footTilt: [0, 0],
    };
  }
  if (pose === "ground") {
    // Sitting on the ground, knees up, both arms around the knees, back leaning a little.
    const hip: Pt = [0, -12];
    const sh: Pt = [-7, -71 + b * 0.8];
    const legs = [ik(hip, [32, -ANKLE], THIGH, SHIN), ik(add(hip, 2, 0), [40, -ANKLE], THIGH, SHIN)];
    const kn = legs[1][1];
    const arm = (o: number): [Pt, Pt, Pt] => {
      const hand = add(kn, -2 + o, 6);
      const elbow: Pt = [(sh[0] + hand[0]) / 2 + 2, (sh[1] + hand[1]) / 2 + 10];
      return [sh, elbow, hand];
    };
    return {hip, sh, head: [-3, sh[1] - 25], legs, arms: [arm(-4), arm(2)], footTilt: [0, 0]};
  }
  if (pose === "kneel") {
    // Kneeling on one knee: the back knee on the ground, the front foot flat.
    const hip: Pt = [0, -50];
    const sh: Pt = [6, -111 + b * 0.8];
    const far: [Pt, Pt, Pt] = [hip, [-2, -9], [-41, -7]];
    return {
      hip,
      sh,
      head: [9, -136 + b * 0.8],
      legs: [far, ik(hip, [36, -ANKLE], THIGH, SHIN)],
      arms: [chain(sh, 0.25, 0.9, UPPER, FORE), chain(sh, 0.35, 1.0, UPPER, FORE)],
      footTilt: [-1.45, 0],
    };
  }
  const g = pose === "walk" || pose === "run" || pose === "slump" || pose === "crouch" ? GAIT[pose] : null;
  const L = THIGH + SHIN;
  const lean = pose === "run" ? 0.3 : pose === "slump" ? 0.24 : pose === "crouch" ? 0.62 : 0;
  const u0 = (((p / (2 * Math.PI)) % 1) + 1) % 1;
  const feet = [0, 1].map((i) => {
    if (!g) return {x: i ? 8 : -6, y: -ANKLE, tilt: 0, plant: true};
    const u = (u0 + i * 0.5) % 1;
    return footAt(u, g, S);
  });
  // The hip is highest when the stance leg is straight under the body, lowest when both legs are spread
  // apart: take the greatest height at which every planted foot still reaches the ground (compass gait).
  // Running bends the stance knee a little (0.93); in flight (no foot planted) the hip bounces up.
  const keep = pose === "run" ? 0.93 : pose === "slump" ? 0.95 : 0.985;
  let hipH: number;
  if (pose === "crouch") hipH = 52;
  else if (g) {
    const planted = feet.filter((f) => f.plant);
    hipH = planted.length
      ? Math.min(...planted.map((f) => Math.sqrt(Math.max(0, (L * keep) ** 2 - f.x * f.x)) + (-ANKLE - f.y)))
      : L * keep + 3;
  } else hipH = L * 0.985 + b * 0.4;
  const hip: Pt = [0, -(hipH + ANKLE)];
  const legs = feet.map((f) => ik(hip, [f.x, f.y], THIGH, SHIN));
  const breath = g ? 0 : b * 1.2;
  const torso = pose === "crouch" ? 52 : 58;
  const sh: Pt = [hip[0] + Math.sin(lean) * torso, hip[1] - Math.cos(lean) * torso - breath];
  const nod = pose === "slump" ? 7 : pose === "crouch" ? 4 : 0;
  const headLean = pose === "crouch" ? 0.25 : lean;
  const head: Pt = [sh[0] + Math.sin(headLean) * 24 + 2, sh[1] - Math.cos(headLean) * 24 + nod];
  const arms = [0, 1].map((i) => {
    if (pose === "crouch") return chain(sh, 0.6 + i * 0.2, 1.6 + i * 0.15, UPPER, FORE);
    if (!g) return chain(sh, (i ? 0.1 : -0.06) + b * 0.02, i ? 0.22 : 0.08, UPPER, FORE);
    // The arm swings against the leg on the same side: leg in front means arm behind.
    const u = (u0 + i * 0.5) % 1;
    const amp = pose === "run" ? 0.95 : pose === "slump" ? 0.18 : 0.42;
    const a = -Math.cos(2 * Math.PI * u) * amp;
    const elbow = pose === "run" ? 1.55 : pose === "slump" ? 0.12 : 0.3 + Math.max(0, a) * 0.5;
    return chain(sh, a + lean * 0.5, a + elbow, UPPER, FORE);
  });
  return {hip, sh, head, legs, arms, footTilt: feet.map((f) => f.tilt)};
};

export type Look = {
  coat: string;
  pants: string;
  skin: string;
  hat: string;
  /** shako: Mexican soldier's hat; brim: wide-brimmed hat; bicorne: general's hat; none; cap. */
  hatKind: "shako" | "brim" | "bicorne" | "none" | "cap";
  belts?: boolean;
  gold?: boolean;
  /** Collar and cuffs in another colour (uniform). */
  trim?: string;
  /** Coat with tails below the hip (uniform coat). */
  tails?: boolean;
  boots?: string;
  hair?: string;
  mustache?: boolean;
  beard?: boolean;
};

export const LOOK = {
  mx: {coat: "#2E4C8C", pants: "#E6E1D2", skin: "#A9734E", hat: "#1C1D22", hatKind: "shako", belts: true, trim: "#C8363A", tails: true, boots: "#1E1A18", hair: "#1E1712", mustache: true},
  mxTired: {coat: "#3A5285", pants: "#CFC8B6", skin: "#A9734E", hat: "#1C1D22", hatKind: "shako", belts: true, trim: "#A8403E", tails: true, boots: "#2A241F", hair: "#1E1712"},
  santa: {coat: "#1B2540", pants: "#E6E1D2", skin: "#B98260", hat: "#14151A", hatKind: "bicorne", gold: true, trim: "#C9A23A", tails: true, boots: "#111012", hair: "#2A2018"},
  santaPlain: {coat: "#4B5A6E", pants: "#BDB49E", skin: "#B98260", hat: "#14151A", hatKind: "none", boots: "#2A241F", hair: "#2A2018"},
  tx1: {coat: "#8A6B44", pants: "#3A3A34", skin: "#C9946A", hat: "#4A3B2A", hatKind: "brim", boots: "#3B2A1C", hair: "#5A3E26", beard: true},
  tx2: {coat: "#5C6E7E", pants: "#2F302C", skin: "#D2A27A", hat: "#2E2620", hatKind: "brim", boots: "#2A1E16", hair: "#3A2A1C"},
  tx3: {coat: "#A0563A", pants: "#463C30", skin: "#C08A62", hat: "#6A5638", hatKind: "brim", boots: "#3B2A1C", hair: "#6B4A2E", mustache: true},
  settler: {coat: "#B8A27A", pants: "#4A4438", skin: "#D7A982", hat: "#D8C38F", hatKind: "brim", boots: "#4A3422", hair: "#7A5A3A"},
  settler2: {coat: "#7F8F6A", pants: "#3E3A30", skin: "#CF9E78", hat: "#8A6E48", hatKind: "brim", boots: "#3B2A1C", hair: "#4A3422", beard: true},
  // Paraguayans today (Ueno Bank video): plain shirts, no hat, no belts.
  civ1: {coat: "#C2534A", pants: "#2E3A4E", skin: "#B98260", hat: "#1C1D22", hatKind: "none", boots: "#2A2A2E", hair: "#1E1712"},
  civ2: {coat: "#3F7D74", pants: "#3A3A40", skin: "#A9734E", hat: "#1C1D22", hatKind: "none", boots: "#232326", hair: "#2A2018", mustache: true},
  civ3: {coat: "#D9B44A", pants: "#46413A", skin: "#C9946A", hat: "#1C1D22", hatKind: "none", boots: "#3A2E26", hair: "#3A2A1C"},
  civ4: {coat: "#6A6FB0", pants: "#2F302C", skin: "#9A6646", hat: "#C8363A", hatKind: "cap", boots: "#1E1E22", hair: "#1E1712"},
  civ5: {coat: "#E7E2D6", pants: "#34465E", skin: "#C08A62", hat: "#1C1D22", hatKind: "none", boots: "#5A4030", hair: "#5A3E26", beard: true},
  police: {coat: "#22324A", pants: "#1C2534", skin: "#A9734E", hat: "#121822", hatKind: "cap", trim: "#C9A23A", boots: "#111012", hair: "#1E1712"},
  elder1: {coat: "#8B7A66", pants: "#55504A", skin: "#B98260", hat: "#1C1D22", hatKind: "none", boots: "#2A241F", hair: "#D8D4CC", mustache: true},
  elder2: {coat: "#7A5A6A", pants: "#4A4438", skin: "#C9946A", hat: "#1C1D22", hatKind: "none", boots: "#2A241F", hair: "#E6E1D2"},
  elder3: {coat: "#4E6A80", pants: "#3E3A30", skin: "#A9734E", hat: "#D8C38F", hatKind: "brim", boots: "#3B2A1C", hair: "#CFCAC0"},
  suit: {coat: "#2A2D34", pants: "#2A2D34", skin: "#B98260", hat: "#1C1D22", hatKind: "none", trim: "#E6E1D2", boots: "#111012", hair: "#1E1712"},
} satisfies Record<string, Look>;

export const TX_LOOKS = [LOOK.tx1, LOOK.tx2, LOOK.tx3];

const INK = "#17110C";

export type Seat = "crate" | "log" | "stool";
const SEAT_H: Record<Seat, number> = {crate: 40, log: 30, stool: 42};

/** Crate, log or stool under a seated person; the seat top is at y = -SEAT_H. */
const SeatShape: React.FC<{kind: Seat}> = ({kind}) => {
  if (kind === "log")
    return (
      <g>
        <rect x={-46} y={-30} width={86} height={30} rx={15} fill="#6B4A30" stroke={INK} strokeWidth={2} strokeOpacity={0.55} />
        <path d="M -36 -20 L 30 -20 M -30 -10 L 24 -10" stroke="#4E3420" strokeWidth={2} />
        <ellipse cx={40} cy={-15} rx={8} ry={15} fill="#B08A5E" stroke={INK} strokeWidth={2} strokeOpacity={0.55} />
        <ellipse cx={40} cy={-15} rx={4} ry={8} fill="none" stroke="#7A5A3A" strokeWidth={1.5} />
      </g>
    );
  if (kind === "stool")
    return (
      <g stroke={INK} strokeOpacity={0.55} strokeWidth={2}>
        <path d="M -16 -38 L -24 0 M 14 -38 L 22 0 M -2 -38 L -2 0" stroke="#5B4630" strokeWidth={5} strokeOpacity={1} />
        <rect x={-26} y={-44} width={50} height={8} rx={3} fill="#7A5A3A" />
      </g>
    );
  return (
    <g>
      <rect x={-30} y={-40} width={56} height={40} fill="#8A6640" stroke={INK} strokeWidth={2} strokeOpacity={0.55} />
      <path d="M -30 -27 L 26 -27 M -30 -13 L 26 -13" stroke="#5E4228" strokeWidth={2} />
      <path d="M -30 -40 L 26 0 M 26 -40 L -30 0" stroke="#5E4228" strokeWidth={1.5} opacity={0.6} />
    </g>
  );
};

export const Figure: React.FC<{
  x: number;
  y: number;
  s?: number;
  pose: Pose;
  phase?: number;
  look: Look;
  flip?: boolean;
  rifle?: boolean;
  rim?: string;
  opacity?: number;
  /** Hat fallen off to the side (person asleep). */
  hatOff?: boolean;
  /** No shadow under the feet (when the person stands in water, in a bush). */
  noShadow?: boolean;
  /**
   * Speed of travel in the facing direction, parent-frame px per frame. When set, the step
   * cycle runs on the frame by itself (`phase` becomes a phase offset) and the stride is computed so the
   * planted foot stays still on the ground, without sliding.
   */
  speed?: number;
  /** Seat drawn under the person when `pose = "sit"` (default crate). */
  seat?: Seat;
}> = ({x, y, s = 1, pose, phase = 0, look, flip, rifle, rim, opacity = 1, hatOff, noShadow, speed, seat = "crate"}) => {
  const frame = useCurrentFrame();
  const g = pose === "walk" || pose === "run" || pose === "slump" || pose === "crouch" ? GAIT[pose] : null;
  // Stance takes `stance` of the 2π/w frame cycle; in that time the body travels speed/s px (figure coordinates) = 2S.
  const S = g ? (speed !== undefined ? Math.max(6, Math.min(46, (Math.abs(speed) * g.stance * ((2 * Math.PI) / g.w)) / (2 * s))) : g.stride) : 0;
  const p = g && speed !== undefined ? frame * g.w * (speed === 0 ? 0 : 1) + phase : phase;
  // A breath rhythm for each person, offset by position.
  const b = Math.sin(frame / (pose === "lie" ? 26 : 20) + x * 0.037 + y * 0.011);
  const r = rig(pose, p, b, S, SEAT_H[seat]);
  const L = {fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const};
  const boots = look.boots ?? "#2A1E16";
  const coatDark = mixHex(look.coat, "#000000", 0.28);
  const pantsDark = mixHex(look.pants, "#000000", 0.25);

  /** A two-segment limb: dark outline, thick upper segment, thin lower segment. */
  const limb = (pts: [Pt, Pt, Pt], w1: number, w2: number, tone: string, tint?: string) => (
    <g>
      {tint ? null : (
        <>
          <path d={poly([pts[0], pts[1]])} stroke={INK} strokeWidth={w1 + 3.5} {...L} opacity={0.55} />
          <path d={poly([pts[1], pts[2]])} stroke={INK} strokeWidth={w2 + 3.5} {...L} opacity={0.55} />
        </>
      )}
      <path d={poly([pts[0], pts[1]])} stroke={tint ?? tone} strokeWidth={w1} {...L} />
      <path d={poly([pts[1], pts[2]])} stroke={tint ?? tone} strokeWidth={w2} {...L} />
    </g>
  );
  /** Leg: thigh and shin taper, round knee joint, dark outline. */
  const leg = (pts: [Pt, Pt, Pt], tone: string, near: boolean, tint?: string) => {
    const [hp, kn, an] = pts;
    const wt = near ? 17 : 15.5;
    const wk = near ? 13.5 : 12.5;
    const wa = near ? 10 : 9.5;
    const thigh = taper(hp, kn, wt, wk);
    const shin = taper(kn, an, wk, wa);
    return (
      <g>
        {tint ? null : (
          <g stroke={INK} strokeWidth={3.2} strokeLinejoin="round" strokeOpacity={0.55} fill="none">
            <path d={thigh} />
            <path d={shin} />
            <circle cx={kn[0]} cy={kn[1]} r={wk / 2} />
          </g>
        )}
        <path d={thigh} fill={tint ?? tone} />
        <path d={shin} fill={tint ?? tone} />
        <circle cx={kn[0]} cy={kn[1]} r={wk / 2} fill={tint ?? tone} />
        {tint ? null : <path d={taper(add(hp, -3, 2), add(kn, -2, 0), wt * 0.35, wk * 0.3)} fill="#000" opacity={0.12} />}
      </g>
    );
  };
  const boot = (ankle: Pt, tilt: number, tint?: string) => (
    <g transform={`translate(${ankle[0]} ${ankle[1]}) rotate(${(tilt * 180) / Math.PI})`}>
      <path d="M -6 -5 L 5 -5 Q 9 -1 15 1 Q 20 2.5 20 5.5 L 20 7 L -8 7 L -8 2 Z" fill={tint ?? boots} stroke={tint ? undefined : INK} strokeWidth={1.5} strokeOpacity={0.6} strokeLinejoin="round" />
      {tint ? null : <rect x={-8} y={5} width={28} height={2.2} fill="#000" opacity={0.35} />}
    </g>
  );
  const hand = (pt: Pt, tint?: string) => <circle cx={pt[0]} cy={pt[1]} r={5.6} fill={tint ?? look.skin} stroke={tint ? undefined : INK} strokeWidth={1.4} strokeOpacity={0.5} />;

  const body = (tint?: string) => {
    const c = (v: string) => tint ?? v;
    const [h0, h1] = r.head;
    const showHat = !hatOff && pose !== "lie";
    const [farLeg, nearLeg] = r.legs;
    // Torso direction: axis u from hip up to shoulder, normal n points toward the chest (forward
    // when standing, upward when lying on the back). Every clothing detail is placed by (t, o):
    // t = 0 at the hip, 1 at the top of the shoulder; o = offset to the front (+) or to the back (-).
    const ux = r.sh[0] - r.hip[0];
    const uy = r.sh[1] - r.hip[1];
    const ul = Math.hypot(ux, uy) || 1;
    const lean = (Math.atan2(ux, -uy) * 180) / Math.PI;
    const nx = -uy / ul;
    const ny = ux / ul;
    const chest = 1 + b * 0.025;
    const P = (t: number, o: number): Pt => [r.hip[0] + ux * t + nx * o, r.hip[1] + uy * t + ny * o];
    const f = (pt: Pt) => `${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`;
    // Torso in profile: back gently curved (hollow waist, raised shoulder blade), chest fuller than belly, round shoulders.
    const torso = [
      `M ${f(P(-0.12, -15))}`,
      `Q ${f(P(0.12, -15.5))} ${f(P(0.36, -12.5))}`,
      `Q ${f(P(0.58, -15.5))} ${f(P(0.82, -17.5))}`,
      `Q ${f(P(1.02, -18))} ${f(P(1.03, -8))}`,
      `L ${f(P(1.07, 5))}`,
      `Q ${f(P(1.04, 13))} ${f(P(0.9, 14 * chest))}`,
      `Q ${f(P(0.72, 18 * chest))} ${f(P(0.55, 16.5 * chest))}`,
      `Q ${f(P(0.3, 13))} ${f(P(0.1, 14))}`,
      `Q ${f(P(-0.05, 15.5))} ${f(P(-0.12, 15))}`,
      "Z",
    ].join(" ");
    const backShade = [`M ${f(P(-0.1, -15))}`, `Q ${f(P(0.12, -15.5))} ${f(P(0.36, -12.5))}`, `Q ${f(P(0.58, -15.5))} ${f(P(0.82, -17.5))}`, `Q ${f(P(1.0, -17))} ${f(P(1.0, -9))}`, `L ${f(P(0.9, -4))}`, `Q ${f(P(0.5, -6))} ${f(P(-0.1, -6))}`, "Z"].join(" ");
    // Shoulder: the arm grows from the shoulder joint (below the top of the torso), the far arm offset a little toward the back.
    const root = P(0.86, 0);
    const moveArm = (arm: [Pt, Pt, Pt], dx: number, dy: number) => arm.map((q) => add(q, root[0] - r.sh[0] + dx, root[1] - r.sh[1] + dy)) as [Pt, Pt, Pt];
    const farArm = moveArm(r.arms[0], -nx * 4, -ny * 4);
    const nearArm = moveArm(r.arms[1], nx * 2, ny * 2);
    const collar = P(1.03, 1);
    return (
      <g>
        {/* far side: legs and arms darker */}
        {leg(farLeg, pantsDark, false, tint)}
        {boot(farLeg[2], r.footTilt[0], tint ? tint : mixHex(boots, "#000000", 0.25))}
        {limb(farArm, 11, 9.5, coatDark, tint)}
        {hand(farArm[2], tint ? tint : mixHex(look.skin, "#000000", 0.18))}
        {/* rifle in the far hand, behind the torso */}
        {rifle ? (
          <line x1={farArm[2][0] - 40} y1={farArm[2][1] + 18} x2={farArm[2][0] + 52} y2={farArm[2][1] - 24} stroke={c("#3B2A1C")} strokeWidth={6} strokeLinecap="round" />
        ) : null}
        {rifle && !tint ? <line x1={farArm[2][0] + 30} y1={farArm[2][1] - 14} x2={farArm[2][0] + 60} y2={farArm[2][1] - 28} stroke="#7C858C" strokeWidth={3.5} strokeLinecap="round" /> : null}
        {/* near leg */}
        {leg(nearLeg, look.pants, true, tint)}
        {boot(nearLeg[2], r.footTilt[1], tint)}
        {/* coat tails */}
        {look.tails ? (
          <g transform={`translate(${r.hip[0]} ${r.hip[1]}) rotate(${lean})`}>
            <path d="M -15 -6 L 15 -6 L 17 20 L 2 16 L -18 22 Z" fill={c(look.coat)} stroke={tint ? undefined : INK} strokeWidth={2} strokeOpacity={0.5} />
          </g>
        ) : null}
        {/* torso: curved shape, dark outline, darker back, cloth fold */}
        <path d={torso} fill={c(look.coat)} stroke={tint ? undefined : INK} strokeWidth={2.6} strokeOpacity={0.55} strokeLinejoin="round" />
        {tint ? null : <path d={backShade} fill={coatDark} opacity={0.5} />}
        {tint ? null : <path d={`M ${f(P(0.62, 9))} Q ${f(P(0.5, 6))} ${f(P(0.38, 9))}`} stroke={coatDark} strokeWidth={1.6} fill="none" opacity={0.7} />}
        {look.belts && !tint ? (
          // cross belts: one strap across the chest, one around the back
          <g stroke="#F2EFE6" strokeWidth={4} fill="none" strokeLinecap="round">
            <path d={`M ${f(P(0.98, -6))} Q ${f(P(0.6, 4))} ${f(P(0.08, 13))}`} />
            <path d={`M ${f(P(0.98, 6))} Q ${f(P(0.55, -4))} ${f(P(0.08, -13))}`} opacity={0.75} />
          </g>
        ) : null}
        {!tint && !look.belts && !look.tails ? (
          // leather belt of a plain shirt
          <path d={`M ${f(P(0.06, -15))} L ${f(P(0.06, 14.5))} L ${f(P(0.15, 14))} L ${f(P(0.15, -15.3))} Z`} fill="#3B2A1C" />
        ) : null}
        {look.trim && !tint && look.belts === undefined ? (
          // buttons down the front edge
          <g fill={look.trim}>
            {[0.3, 0.5, 0.7].map((k) => {
              const q = P(k, 12.5);
              return <circle key={k} cx={q[0]} cy={q[1]} r={2.2} />;
            })}
          </g>
        ) : null}
        {look.gold && !tint ? (
          <>
            <path d={`M ${f(P(0.04, -15.5))} L ${f(P(0.04, 15))} L ${f(P(0.17, 14))} L ${f(P(0.17, -15))} Z`} fill="#B8322E" />
            <path d={`M ${f(P(0.95, -12))} Q ${f(P(1.06, -2))} ${f(P(0.95, 9))} L ${f(P(0.88, 8))} Q ${f(P(0.97, -2))} ${f(P(0.88, -11))} Z`} fill="#E3B341" />
          </>
        ) : null}
        {/* collar + neck */}
        <path d={poly([collar, r.head])} stroke={c(look.skin)} strokeWidth={10} {...L} />
        {look.trim && !tint ? <path d={`M ${f(P(0.97, -9))} L ${f(P(1.1, -8))} L ${f(P(1.12, 6))} L ${f(P(0.98, 8))} Z`} fill={look.trim} /> : null}
        {/* head: outline, hair at the back, face, ear */}
        {tint ? null : <circle cx={h0} cy={h1} r={15.5} fill={INK} opacity={0.5} />}
        <circle cx={h0} cy={h1} r={13.5} fill={c(look.skin)} />
        {!tint && look.hair ? <path d={`M ${h0 - 13} ${h1 + 2} A 13.5 13.5 0 0 1 ${h0 + 4} ${h1 - 13} L ${h0 - 2} ${h1 - 4} Z`} fill={look.hair} /> : null}
        {!tint ? (
          <>
            <ellipse cx={h0 - 2} cy={h1 + 1} rx={3} ry={4} fill={mixHex(look.skin, "#000000", 0.15)} />
            {r.eyesShut ? (
              <path d={`M ${h0 + 4} ${h1 - 2} q 3 2 6 0`} stroke={INK} strokeWidth={1.8} fill="none" />
            ) : (
              <circle cx={h0 + 7} cy={h1 - 2} r={1.9} fill={INK} />
            )}
            <path d={`M ${h0 + 12} ${h1 - 1} L ${h0 + 16} ${h1 + 4} L ${h0 + 12} ${h1 + 5}`} fill={mixHex(look.skin, "#000000", 0.1)} />
            {look.mustache ? <path d={`M ${h0 + 6} ${h1 + 6} q 5 -3 10 0 q -5 3 -10 0 Z`} fill={look.hair ?? INK} /> : null}
            {look.beard ? <path d={`M ${h0 - 4} ${h1 + 4} Q ${h0 + 4} ${h1 + 17} ${h0 + 13} ${h1 + 7} L ${h0 + 12} ${h1 + 4} Q ${h0 + 4} ${h1 + 10} ${h0 - 1} ${h1 + 2} Z`} fill={look.hair ?? INK} /> : null}
          </>
        ) : null}
        {/* hat */}
        {showHat && look.hatKind === "shako" ? (
          <g>
            <path d={`M ${h0 - 12} ${h1 - 8} L ${h0 - 10} ${h1 - 35} L ${h0 + 11} ${h1 - 35} L ${h0 + 13} ${h1 - 8} Z`} fill={c(look.hat)} />
            <path d={`M ${h0 - 4} ${h1 - 8} L ${h0 + 22} ${h1 - 5} L ${h0 + 12} ${h1 - 10} Z`} fill={c(look.hat)} />
            {!tint ? <rect x={h0 - 11} y={h1 - 30} width={22} height={4} fill={look.trim ?? "#C8363A"} /> : null}
            {!tint ? <circle cx={h0} cy={h1 - 38} r={4} fill="#E6E1D2" /> : null}
          </g>
        ) : null}
        {showHat && look.hatKind === "brim" ? (
          <>
            <ellipse cx={h0} cy={h1 - 9} rx={27} ry={5.5} fill={c(look.hat)} />
            <path d={`M ${h0 - 13} ${h1 - 9} Q ${h0 - 13} ${h1 - 27} ${h0} ${h1 - 26} Q ${h0 + 13} ${h1 - 27} ${h0 + 13} ${h1 - 9} Z`} fill={c(look.hat)} />
            {!tint ? <rect x={h0 - 13} y={h1 - 14} width={26} height={3.5} fill={mixHex(look.hat, "#000000", 0.35)} /> : null}
          </>
        ) : null}
        {showHat && look.hatKind === "bicorne" ? (
          <g>
            <path d={`M ${h0 - 32} ${h1 - 8} Q ${h0} ${h1 - 44} ${h0 + 32} ${h1 - 8} Q ${h0} ${h1 - 17} ${h0 - 32} ${h1 - 8} Z`} fill={c(look.hat)} />
            {!tint ? <path d={`M ${h0 - 28} ${h1 - 10} Q ${h0} ${h1 - 40} ${h0 + 28} ${h1 - 10}`} stroke="#C9A23A" strokeWidth={2.5} fill="none" /> : null}
            {!tint ? <circle cx={h0 + 2} cy={h1 - 22} r={4.5} fill="#1F7A45" stroke="#F4F1E8" strokeWidth={1.5} /> : null}
          </g>
        ) : null}
        {showHat && look.hatKind === "cap" ? <path d={`M ${h0 - 14} ${h1 - 4} A 14 14 0 0 1 ${h0 + 14} ${h1 - 4} L ${h0 + 26} ${h1 - 2} L ${h0 + 12} ${h1 + 1} Z`} fill={c(look.hat)} /> : null}
        {/* near arm, over the torso; round shoulder at the joint */}
        {tint ? null : <circle cx={nearArm[0][0]} cy={nearArm[0][1]} r={9.5} fill={INK} opacity={0.4} />}
        <circle cx={nearArm[0][0]} cy={nearArm[0][1]} r={8.2} fill={c(look.coat)} />
        {limb(nearArm, 12, 10.5, look.coat, tint)}
        {look.trim && !tint ? <circle cx={nearArm[2][0] - (nearArm[2][0] - nearArm[1][0]) * 0.18} cy={nearArm[2][1] - (nearArm[2][1] - nearArm[1][1]) * 0.18} r={5.4} fill={look.trim} /> : null}
        {hand(nearArm[2], tint)}
      </g>
    );
  };
  const footY = pose === "lie" ? -2 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} opacity={opacity}>
      {noShadow ? null : <ellipse cx={pose === "lie" ? 4 : 4} cy={footY + 2} rx={pose === "lie" ? 90 : pose === "sit" || pose === "ground" ? 48 : 30} ry={pose === "lie" ? 9 : 7} fill="#000" opacity={0.22} />}
      {pose === "sit" ? <SeatShape kind={seat} /> : null}
      {rim ? <g transform="translate(3 -3)">{body(rim)}</g> : null}
      {body()}
      {hatOff && look.hatKind === "bicorne" ? (
        <g>
          <path d="M 84 -2 Q 112 -28 140 -2 Q 112 -9 84 -2 Z" fill={look.hat} />
          <path d="M 88 -4 Q 112 -25 136 -4" stroke="#C9A23A" strokeWidth={2} fill="none" />
        </g>
      ) : null}
      {hatOff && look.hatKind === "shako" ? <path d="M 84 0 L 86 -24 L 106 -24 L 108 0 Z" fill={look.hat} /> : null}
    </g>
  );
};
