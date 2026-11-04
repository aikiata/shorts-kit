import React from "react";
import {tintHex} from "../color";
import type {Grade} from "../nature/skies";

type Pt = readonly [number, number];
export type Pose = "stand" | "sit" | "lie" | "lean";
export type Arms = "down" | "wave" | "reach";

export type Look = {
  shirt: string;
  pants: string;
  skin: string;
  /** Hat colour; ignored when `hat` is "none". */
  hatColor: string;
  hat?: "brim" | "cap" | "none";
};

/** Ready-made looks; copy and edit for your own characters. */
export const LOOKS = {
  sailor: {shirt: "#D9A441", pants: "#2E3A44", skin: "#8A5A3C", hatColor: "#D8C38F", hat: "brim"},
  mate: {shirt: "#5E86A0", pants: "#3A3540", skin: "#9A6847", hatColor: "#2B3440", hat: "cap"},
  walker: {shirt: "#B5533C", pants: "#2F3A2E", skin: "#C58C66", hatColor: "#000000", hat: "none"},
} satisfies Record<string, Look>;

const add = (p: Pt, dx: number, dy: number): Pt => [p[0] + dx, p[1] + dy];
const poly = (pts: readonly Pt[]) => pts.map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");

/** Torso as a trapezoid from the hip (width wa) to the shoulders (width wb). */
const taper = (a: Pt, b: Pt, wa: number, wb: number) => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = -(b[1] - a[1]) / L;
  const ny = (b[0] - a[0]) / L;
  return (
    poly([add(a, (nx * wa) / 2, (ny * wa) / 2), add(b, (nx * wb) / 2, (ny * wb) / 2), add(b, (-nx * wb) / 2, (-ny * wb) / 2), add(a, (-nx * wa) / 2, (-ny * wa) / 2)]) +
    " Z"
  );
};

type Rig = {hip: Pt; sh: Pt; head: Pt; legs: Pt[][]; arms: Pt[][]};

/** Skeleton per pose. Origin: the ground point under the figure (y = 0 is the floor), facing right. */
const rig = (pose: Pose, arms: Arms): Rig => {
  if (pose === "lean") {
    // Kneeling at an edge (y = 0), body over the drop, shoulders below the floor, both arms down into the water.
    const hip: Pt = [16, -30];
    const sh: Pt = [66, 10];
    return {
      hip,
      sh,
      head: [86, 26],
      legs: [
        [[12, -26], [-8, -4], [-42, -2]],
        [hip, [-2, -6], [-34, -4]],
      ],
      arms: [
        [sh, add(sh, -2, 60), add(sh, -6, 116)],
        [sh, add(sh, 6, 60), add(sh, 10, 120)],
      ],
    };
  }
  if (pose === "lie") {
    const hip: Pt = [4, -14];
    const sh: Pt = [-46, -16];
    return {
      hip,
      sh,
      head: [-68, -20],
      legs: [
        [hip, [30, -12], [58, -8]],
        [[4, -10], [30, -5], [56, -3]],
      ],
      arms: [
        [sh, [-24, -8], [-2, -6]],
        [sh, [-22, -12], [0, -10]],
      ],
    };
  }
  const stand = pose === "stand";
  const hip: Pt = stand ? [0, -68] : [0, -18];
  const sh: Pt = stand ? [1, -128] : [7, -78];
  const legs: Pt[][] = stand
    ? [
        [[-4, -68], [-8, -34], [-13, 0]],
        [[4, -68], [10, -34], [15, 0]],
      ]
    : [
        [[2, -14], [30, -22], [35, 0]],
        [[0, -18], [38, -28], [44, 0]],
      ];
  const front: Pt[] =
    arms === "reach" ? [sh, add(sh, 38, 18), add(sh, 80, 26)] : arms === "wave" ? [sh, add(sh, 30, -26), add(sh, 40, -64)] : [sh, add(sh, 12, 30), add(sh, 26, 52)];
  const back: Pt[] =
    arms === "reach" ? [sh, add(sh, 32, 26), add(sh, 72, 36)] : arms === "wave" ? [sh, add(sh, -30, -26), add(sh, -40, -64)] : [sh, add(sh, -6, 30), add(sh, 2, 54)];
  return {hip, sh, head: add(sh, 3, -23), legs, arms: [back, front]};
};

const limb = {fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const};

/** The figure in one flat colour (`solid`) for the rim pass, or in its own colours. */
const Body: React.FC<{r: Rig; pose: Pose; look: Look; k?: Grade["k"]; solid?: string}> = ({r, pose, look, k, solid}) => {
  const c = (hex: string) => solid ?? (k ? tintHex(hex, k) : hex);
  // The far leg and arm sit in shadow: 30 % darker.
  const dark = (hex: string) => solid ?? tintHex(hex, (k ?? [1, 1, 1]).map((v) => v * 0.7) as Grade["k"]);
  const [h0, h1] = r.head;
  const hat = pose === "lie" ? "none" : look.hat ?? "brim";
  const hand = r.arms[1][2];
  return (
    <g>
      <path d={poly(r.legs[0])} stroke={dark(look.pants)} strokeWidth={16} {...limb} />
      <path d={poly(r.arms[0])} stroke={dark(look.shirt)} strokeWidth={12} {...limb} />
      <path d={taper(r.hip, r.sh, 28, 38)} fill={c(look.shirt)} stroke={c(look.shirt)} strokeWidth={8} strokeLinejoin="round" />
      <path d={poly(r.legs[1])} stroke={c(look.pants)} strokeWidth={17} {...limb} />
      <circle cx={h0} cy={h1} r={15} fill={c(look.skin)} />
      {hat === "cap" ? (
        <path d={`M ${h0 - 15} ${h1 - 3} A 15 15 0 0 1 ${h0 + 15} ${h1 - 3} L ${h0 + 30} ${h1 - 1} L ${h0 + 14} ${h1 + 2} Z`} fill={c(look.hatColor)} />
      ) : hat === "brim" ? (
        <>
          <ellipse cx={h0} cy={h1 - 9} rx={27} ry={5} fill={c(look.hatColor)} />
          <ellipse cx={h0} cy={h1 - 15} rx={14} ry={9} fill={c(look.hatColor)} />
        </>
      ) : null}
      <path d={poly(r.arms[1])} stroke={c(look.shirt)} strokeWidth={12} {...limb} />
      <circle cx={hand[0]} cy={hand[1]} r={6} fill={c(look.skin)} />
    </g>
  );
};

/**
 * Rigged side-view figure (about 165 px tall standing at scale 1) as an SVG
 * group: place it inside any `<svg>`. `x, y` is the ground point under it.
 * Pass `grade={GRADES[sky]}` to tint it to the sky and get a rim light at dusk
 * and night, or it sinks into dark backgrounds. `lean` kneels at an edge with
 * the arms down into the water below `y`.
 */
export const Person: React.FC<{
  x: number;
  y: number;
  scale?: number;
  pose?: Pose;
  arms?: Arms;
  look?: Look;
  /** Face left instead of right. */
  flip?: boolean;
  /** Colour grade from the sky (`GRADES[sky]`, or `silhouette(rim)`). */
  grade?: Grade;
  /** Rim light colour; overrides the grade's rim. */
  rim?: string;
  /** Rim offset toward the light source, px. Default up-right. */
  rimDir?: [number, number];
  opacity?: number;
}> = ({x, y, scale = 1, pose = "stand", arms = "down", look = LOOKS.sailor, flip = false, grade, rim, rimDir = [3, -3], opacity = 1}) => {
  const r = rig(pose, arms);
  const rimColor = rim ?? grade?.rim;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`} opacity={opacity}>
      {rimColor ? (
        <g transform={`translate(${flip ? -rimDir[0] : rimDir[0]} ${rimDir[1]})`}>
          <Body r={r} pose={pose} look={look} solid={rimColor} />
        </g>
      ) : null}
      <Body r={r} pose={pose} look={look} k={grade?.k} />
    </g>
  );
};
