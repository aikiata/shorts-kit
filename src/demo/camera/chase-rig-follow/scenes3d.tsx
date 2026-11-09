/**
 * The 3D shots of storyboard v2. Each component is rendered inside a <Sequence>
 * that starts at the shot (or group of shots) start, so `useCurrentFrame()` is
 * local. Timing inside a shot comes from `at(id, line, word)`, i.e. from voice.json.
 */
import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import * as THREE from "three";
import {Callout3D} from "../../shared/frame/Callout";
import {HUD_H, HUD_TOP} from "../../shared/frame/ChapterHud";
import {FONT} from "../../shared/theme";
import {LOWPOLY as P} from "../../shared/three/palette";
import type {CameraRig, Vec3} from "../../shared/three/cameraPath";
import {REFUEL_POINT} from "../../shared/three/Airliner";
import {CampSite} from "../../shared/three/CampSite";
import {Dipstick as DipstickProp} from "../../shared/three/Dipstick";
import {FuelHose} from "../../shared/three/FuelHose";
import {FuelTruck, truckPort} from "../../shared/three/FuelTruck";
import {GlidePath, pathPoint} from "../../shared/three/GlidePath";
import {NoseScrape} from "../../shared/three/NoseScrape";
import {chaseRig, clamp01, flyRig, lerp, onPlane, type Pose, WorldShot} from "./world";
import {at, shot} from "./shots";
import {GaugesInset, TankGaugeBox} from "./placeholders";
import {TankGauge} from "../../shared/gauge/TankGauge";

const ORANGE = P.orange;
const BLUE = P.blue;
const RED = "#FF5A4D";
const TOP = HUD_TOP + HUD_H + 70;
/** Race strip beside the far end of the runway; callouts point at STRIP and CAMP. */
const STRIP_X = 40;
const STRIP_Z = 1960;
/** Plane height on the ground with gear down and pitch 0 (wheels on y=0). */
const PY = 5.4;
const WINNIPEG: Vec3 = [-900, 0, -400];
const GIMLI: Vec3 = [0, 0, 100];

const Camp: React.FC = () => (
  <group position={[STRIP_X, 0, STRIP_Z]}>
    <CampSite stripLength={420} tentSide={-60} lit fires={3} />
  </group>
);

/** A map pin: a post with a glowing head, tall enough to read from 1-2 km. */
const Pin: React.FC<{position: Vec3; color: string; dim?: boolean; cross?: boolean}> = ({position, color, dim, cross}) => (
  <group position={position}>
    <mesh position={[0, 60, 0]}>
      <cylinderGeometry args={[7, 7, 120, 8]} />
      <meshStandardMaterial color={dim ? "#59636E" : color} emissive={dim ? "#000" : color} emissiveIntensity={dim ? 0 : 0.7} flatShading />
    </mesh>
    <mesh position={[0, 135, 0]}>
      <icosahedronGeometry args={[40, 0]} />
      <meshStandardMaterial color={dim ? "#59636E" : color} emissive={dim ? "#000" : color} emissiveIntensity={dim ? 0 : 2} flatShading />
    </mesh>
    {cross
      ? [0.785, -0.785].map((r) => (
          <mesh key={r} position={[0, 135, 0]} rotation={[0, 0, r]}>
            <boxGeometry args={[150, 16, 16]} />
            <meshStandardMaterial color={RED} emissive={RED} emissiveIntensity={1.2} flatShading />
          </mesh>
        ))
      : null}
  </group>
);

/** Pose of a plane flying along a path at parameter t (nose along the tangent). */
const alongPath = (pts: readonly Vec3[], t: number): Pose => {
  const a = pathPoint(pts, clamp01(t));
  const b = pathPoint(pts, clamp01(t + 0.01));
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dz = b[2] - a[2];
  return {pos: a, yaw: Math.atan2(dx, dz), pitch: Math.atan2(-dy, Math.hypot(dx, dz)) * 0.6, roll: 0};
};

/** A pill of on-screen text (a fact the ear cannot catch). Appears at `from`, fades at `to`. */
const Chip: React.FC<{text: string; from: number; to?: number; top: number; color?: string; pulse?: boolean; left?: number}> = ({text, from, to, top, color = "#fff", pulse, left = 153}) => {
  const frame = useCurrentFrame();
  const a = interpolate(frame, [from, from + 8], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const b = to === undefined ? 1 : interpolate(frame, [to - 6, to], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const glow = pulse ? 0.7 + 0.3 * Math.sin(frame / 4) : 1;
  if (a * b <= 0) return null;
  return (
    <div style={{position: "absolute", left, top, height: 56, padding: "0 20px", display: "flex", alignItems: "center", borderRadius: 10, background: "rgba(9,14,20,0.86)", border: `2px solid ${color}`, fontFamily: FONT.mono, fontSize: 30, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color, opacity: a * b * glow, transform: `translateY(${(1 - a) * 10}px)`}}>
      {text}
    </div>
  );
};

/** Wrap a rig so its target slides down by `dy` metres from frame `from` (pushes the subject up in the frame). */
const lowerTarget = (rig: CameraRig, from: number, dy: number): CameraRig => (f) => {
  const p = rig(f);
  const k = clamp01((f - from) / 24);
  p.target.y -= dy * (k * k * (3 - 2 * k));
  return p;
};

/** s01 + s02: the plane climbs out of Montreal; at "Trong" it rises in the frame and the tank pair appears under it. */
export const Climb: React.FC<{n: number}> = ({n}) => {
  const pose = (f: number): Pose => {
    const t = f / n;
    return {pos: [lerp(0, 40, t), lerp(36, 200, t), lerp(180, 860, t)], pitch: -0.14, yaw: 0.04 * t, roll: Math.sin(f / 26) * 0.03};
  };
  const tankAt = shot("s02").start - shot("s01").start;
  const rig = lowerTarget(chaseRig(pose, [[-110, 26, -150], [-135, 42, 10], [-95, 30, 170]], [0, 0, 0], [40, 34], n), tankAt - 6, 30);
  return (
    <>
      <WorldShot w={{pose, rig, gear: (f) => (f < 14 ? "down" : "up"), engineLit: 1}} />
      <Callout3D rig={rig} point={(f) => onPlane(pose(f), [0, 1.5, 8])} label="Boeing 767" color={ORANGE} from={14} to={tankAt - 6} offset={{x: -60, y: -210}} align="right" />
      <TankGaugeBox from={tankAt + 6} mode="two" top={850} />
    </>
  );
};

/** s03: dolly in to the cockpit windscreen (the plane is in the air; the camera follows it). */
export const CockpitApproach: React.FC<{n: number}> = ({n}) => {
  const pose = (f: number): Pose => ({pos: [0, 220, f * 0.8], pitch: 0, yaw: 0, roll: 0});
  const rig = chaseRig(pose, [[44, 9, 74], [26, 5, 48], [11, 2.6, 34]], [0, 1.2, 15], [42, 32], n);
  return (
    <>
      <WorldShot w={{pose, rig, gear: "up", cockpitLit: true, engineLit: 1, runway: false}} />
      <Callout3D rig={rig} point={(f) => onPlane(pose(f), [0, 1.4, 17.5])} label="Buồng lái" color={ORANGE} from={20} to={n - 4} offset={{x: -130, y: -190}} align="right" />
    </>
  );
};

/** s04: parked at the threshold; the dark gauges inset, then the stop bar. */
export const Threshold: React.FC<{n: number}> = ({n}) => {
  const s = shot("s04");
  const pose = (): Pose => ({pos: [0, PY, 14], pitch: 0, yaw: 0, roll: 0});
  const rig = flyRig([[-40, 4.6, 110], [-33, 4.2, 92], [-26, 3.8, 78]], [[0, 3.6, 26], [0, 3.5, 30], [0, 3.4, 34]], [40, 36], n);
  return (
    <>
      <WorldShot
        w={{
          pose,
          rig,
          gear: "down",
          extras: () => (
            <mesh position={[0, 0.2, 46]}>
              <boxGeometry args={[46, 0.3, 2.4]} />
              <meshStandardMaterial color="#FF4A3D" emissive="#FF4A3D" emissiveIntensity={0.9} flatShading />
            </mesh>
          ),
        }}
      />
      <GaugesInset from={s.wordAt("trống") - 6} to={s.wordAt("Theo") + 28} />
      <Callout3D rig={rig} point={[0, 0.6, 46]} label="Cấm cất cánh" color={RED} from={s.wordAt("cất") - 4} to={n - 4} offset={{x: -110, y: -190}} align="right" />
    </>
  );
};

/** s05: camera creeps from the nose toward the wing port where the dipstick goes in. */
export const WingCreep: React.FC<{n: number}> = ({n}) => {
  const pose = (): Pose => ({pos: [0, PY, 220], pitch: 0, yaw: 0, roll: 0});
  const rig = flyRig([[34, 7, 266], [27, 4.6, 248], [20, 2.8, 233]], [[2, 3.5, 232], [5, 2, 224], [6, 1.5, 220]], [44, 36], n);
  return (
    <>
      <WorldShot w={{pose, rig, gear: "down", planeChildren: () => <DipstickProp pull={0} length={1.4} ticks={7} />}} />
      <Callout3D rig={rig} point={onPlane(pose(), [6, -1.55, -1.7])} label="Que đo" color={BLUE} from={at("s05", 3, "que") - 2} to={n - 4} offset={{x: -120, y: -230}} align="right" />
    </>
  );
};

/** s06: under the wing, the dipstick comes out (length 1.4 m so it stays above the grass). */
export const Dipstick: React.FC<{n: number}> = ({n}) => {
  const pose = (): Pose => ({pos: [0, PY, 220], pitch: 0, yaw: 0, roll: 0});
  const rig = flyRig([[19, 1.5, 205], [16, 1.6, 208], [13, 1.7, 210]], [[6, 1.8, 218.5], [6, 1.6, 218.5], [6, 1.5, 218.5]], [48, 38], n);
  const out = at("s06", 4, "Que");
  const pull = (f: number) => clamp01((f - out) / 16);
  const tip = (f: number): Vec3 => onPlane(pose(), [6, -1.55 - 1.4 * pull(f), -1.7]);
  return (
    <>
      <WorldShot w={{pose, rig, gear: "down", planeChildren: (f) => <DipstickProp pull={pull(f)} length={1.4} ticks={7} />}} />
      <Callout3D rig={rig} point={tip} label="62 cm · 64 cm" color={BLUE} from={at("s06", 4, "chỉ")} to={n - 4} offset={{x: -120, y: -230}} align="right" />
      <Callout3D rig={rig} point={() => onPlane(pose(), [6, -3.2, -1.7])} label="7.682 lít" color={BLUE} from={at("s06", 4, "lít")} to={n - 4} offset={{x: -60, y: 150}} align="right" />
    </>
  );
};

/** s08 + s10: the fuel truck beside the left wing; the hose connects (s08), the nozzle close-up (s10). */
export const Refuel: React.FC<{n: number; close?: boolean}> = ({n, close}) => {
  const id = close ? "s10" : "s08";
  const plane: Vec3 = [0, PY, 260];
  const truck: Vec3 = [13, 0, 264];
  const port = truckPort(truck, 0);
  const noz: Vec3 = [plane[0] + REFUEL_POINT[0], plane[1] + REFUEL_POINT[1], plane[2] + REFUEL_POINT[2]];
  const pose = (): Pose => ({pos: plane, pitch: 0, yaw: 0, roll: 0});
  const rig = close
    ? flyRig([[30, 6.5, 240], [26, 5.6, 244], [23, 5.2, 247]], [[8, 3.6, 261], [7, 3.6, 261], [6.5, 3.6, 261]], [40, 34], n)
    : flyRig([[58, 13.5, 208], [52, 11.5, 214], [47, 10, 220]], [[10, 2.8, 262], [9, 2.8, 262], [9, 2.8, 262]], [40, 36], n);
  const frame = useCurrentFrame();
  const connect = close ? 1 : interpolate(frame, [6, 38], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <>
      <WorldShot
        w={{
          pose,
          rig,
          gear: "down",
          extras: () => (
            <>
              <FuelTruck position={truck} />
              <FuelHose from={port} to={noz} connect={connect} />
            </>
          ),
        }}
      />
      {close ? (
        <>
          <Callout3D rig={rig} point={noz} label="Nạp 1/4 lượng cần" color={RED} from={at(id, 13, "phần") - 6} to={n - 4} offset={{x: -40, y: 230}} align="right" />
          <TankGauge label="Bình sau khi nạp" value="" level0={0.4} level1={0.48} from={at(id, 13, "nạp")} fillFrames={50} color={ORANGE} left={153} top={TOP + 20} width={244} tankHeight={300} />
        </>
      ) : (
        <>
          <Callout3D rig={rig} point={[13, 3.4, 264]} label="Xe bồn" color={ORANGE} from={4} to={at(id, 8, "hệ") - 6} offset={{x: 110, y: -210}} align="left" />
          <Callout3D rig={rig} point={noz} label="Hệ số 1,77" color={BLUE} from={at(id, 8, "hệ") - 2} to={n - 4} offset={{x: 60, y: 200}} align="left" />
        </>
      )}
    </>
  );
};

/** s11: Ottawa, the same numbers again; the camera orbits the nose. */
export const Ottawa: React.FC<{n: number}> = ({n}) => {
  const pose = (): Pose => ({pos: [0, PY, 300], pitch: 0, yaw: 0, roll: 0});
  const c = [0, 3.5, 318] as const;
  const arc = [72, 58, 44, 30].map((a): Vec3 => [c[0] + 64 * Math.sin((a * Math.PI) / 180), 7.5, c[2] + 64 * Math.cos((a * Math.PI) / 180) - 20]);
  const rig = flyRig(arc, [[0, 4, 302], [0, 4, 302], [0, 4, 302], [0, 4, 302]], [38, 34], n);
  return (
    <>
      <WorldShot w={{pose, rig, gear: "down"}} />
      <Callout3D rig={rig} point={(f) => onPlane(pose(), [0, 2, 24])} label="Ottawa" color={ORANGE} from={at("s11", 14, "Ottawa") - 2} to={n - 4} offset={{x: 110, y: -260}} align="left" />
      <Callout3D rig={rig} point={(f) => onPlane(pose(), [4, -1, 8])} label="11.430 lít × 1,78" color={BLUE} from={at("s11", 14, "đo")} to={n - 4} offset={{x: -90, y: 190}} align="right" />
      <Callout3D rig={rig} point={(f) => onPlane(pose(), [-6, -1, -6])} label="Không nạp thêm" color={RED} from={at("s11", 14, "không")} to={n - 4} offset={{x: 90, y: 330}} align="left" />
    </>
  );
};

/** s12: cruise; the question, then 20:00 and the pump warning. */
export const CruiseTank: React.FC<{n: number}> = ({n}) => {
  const pose = (f: number): Pose => ({pos: [0, 320, lerp(-200, 0, f / n)], pitch: 0, yaw: 0, roll: Math.sin(f / 30) * 0.02});
  const rig = chaseRig(pose, [[-100, 38, -100], [-108, 30, 10], [-96, 24, 100]], [0, 9, 0], [36, 33], n);
  return (
    <>
      <WorldShot w={{pose, rig, gear: "up", engineLit: 1, runway: false}} />
      <TankGaugeBox from={at("s12", 15, "cạn") - 4} mode="drain" top={TOP + 20} />
      <Chip text="20:00 · 41.000 ft" from={at("s12", 16, "tám") - 2} to={n - 4} top={TOP + 20} color={BLUE} />
      <Chip text="Áp suất bơm thấp" from={at("s12", 16, "cảnh") - 2} to={n - 4} top={TOP + 96} color={RED} pulse />
    </>
  );
};

/** s13: the route bends toward Winnipeg (a pin on the map; the plane is drawn 6x so it reads from 1.7 km). */
export const ToWinnipeg: React.FC<{n: number}> = ({n}) => {
  const route: Vec3[] = [[-300, 420, -1450], [-380, 380, -1250], [-560, 240, -800], [WINNIPEG[0] + 40, 30, WINNIPEG[2] - 40]];
  const progress = (f: number) => clamp01((f - at("s13", 17, "đổi")) / 70);
  const pose = (f: number): Pose => {
    const p = alongPath(route, 0.02 + 0.2 * clamp01(f / n));
    return {...p, roll: -0.15 * clamp01((f - at("s13", 17, "đổi")) / 40)};
  };
  const rig = flyRig([[-470, 1000, -2050], [-470, 960, -2000]], [[-520, 80, -750], [-520, 80, -750]], [50, 48], n);
  return (
    <>
      <WorldShot w={{pose, rig, gear: "up", engineLit: 1, planeScale: 8, fog: [2600, 9000], extras: (f) => (
        <>
          <GlidePath points={route} progress={progress(f)} color={ORANGE} width={16} dash={90} gap={60} />
          <Pin position={WINNIPEG} color={BLUE} />
        </>
      )}} />
      <Callout3D rig={rig} point={[WINNIPEG[0], 150, WINNIPEG[2]]} label="Winnipeg" color={BLUE} from={at("s13", 17, "Winnipeg") - 2} to={n - 4} offset={{x: 130, y: -200}} align="left" />
      <Callout3D rig={rig} point={[-480, 240, -900]} label="120 dặm" color={ORANGE} from={at("s13", 17, "trăm")} to={n - 4} offset={{x: 80, y: 190}} align="left" />
    </>
  );
};

/** s14: both engines go out (close on the engines, SFX engine-out cued at "lần" (Vietnamese: "time")). */
export const EnginesOut: React.FC<{n: number}> = ({n}) => {
  const pose = (f: number): Pose => ({pos: [0, 330, lerp(-60, 60, f / n)], pitch: 0.02 * clamp01((f - 40) / 30), yaw: 0, roll: 0});
  const rig = chaseRig(pose, [[-56, 8, 34], [-40, 6, 20], [-32, 5, 10]], [-8, -2, 2], [36, 30], n);
  const out0 = at("s14", 18, "lần");
  const out1 = at("s14", 18, "tắt") + 6;
  return (
    <>
      <WorldShot w={{pose, rig, gear: "up", runway: false, engineLit: (f) => lerp(1, 0, clamp01((f - out0) / Math.max(1, out1 - out0)))}} />
      <Callout3D rig={rig} point={(f) => onPlane(pose(f), [-8.1, -2.9, 3])} label="Động cơ tắt" color={ORANGE} from={at("s14", 18, "tắt")} to={n - 4} offset={{x: 140, y: -230}} align="left" />
    </>
  );
};

/** s16: Winnipeg is too far (crossed out); the route turns to Gimli, the closed base. */
export const ToGimli: React.FC<{n: number}> = ({n}) => {
  const from: Vec3 = [-420, 330, -950];
  const route: Vec3[] = [from, [-320, 260, -640], [-130, 120, -260], [0, 8, 60]];
  const progress = (f: number) => clamp01((f - at("s16", 20, "Pearson")) / 60);
  const pose = (f: number): Pose => ({...alongPath(route, 0.02 + 0.1 * clamp01(f / n)), roll: 0.1 * clamp01((f - at("s16", 20, "Pearson")) / 40)});
  const rig = flyRig([[-450, 1000, -2050], [-450, 960, -2000]], [[-450, 60, -420], [-450, 60, -420]], [50, 48], n);
  const farAt = at("s16", 20, "quá");
  return (
    <>
      <WorldShot w={{pose, rig, gear: "up", planeScale: 8, fog: [2600, 9000], extras: (f) => (
        <>
          <Pin position={WINNIPEG} color={BLUE} dim={f >= farAt} cross={f >= farAt} />
          <Pin position={GIMLI} color={ORANGE} />
          <GlidePath points={route} progress={progress(f)} color={ORANGE} width={16} dash={90} gap={60} />
        </>
      )}} />
      <Callout3D rig={rig} point={[WINNIPEG[0], 150, WINNIPEG[2]]} label="Winnipeg: quá xa" color={RED} from={farAt - 2} to={n - 4} offset={{x: 150, y: -190}} align="left" />
      <Callout3D rig={rig} point={[GIMLI[0], 160, GIMLI[2]]} label="Gimli" color={ORANGE} from={at("s16", 20, "Gimli") - 2} to={n - 4} offset={{x: -130, y: -200}} align="right" />
      <Callout3D rig={rig} point={[GIMLI[0], 40, GIMLI[2]]} label="Đã đóng cửa" color={RED} from={at("s16", 20, "đóng") - 2} to={n - 4} offset={{x: -120, y: 220}} align="right" />
    </>
  );
};

/** s17: engines dark, the plane sinks over the prairie (close, the camera drifts). */
export const Sinking: React.FC<{n: number}> = ({n}) => {
  const pose = (f: number): Pose => {
    const t = f / n;
    return {pos: [lerp(-40, -20, t), lerp(120, 78, t), lerp(-1250, -950, t)], pitch: 0.07, yaw: 0, roll: Math.sin(f / 24) * 0.02};
  };
  const rig = chaseRig(pose, [[-62, 22, -86], [-72, 16, -64], [-84, 11, -48]], [0, 0, 6], [38, 36], n);
  return <WorldShot w={{pose, rig, gear: "up"}} />;
};

/** s18: close along the trailing edge of the wing: no flaps. */
export const WingTrail: React.FC<{n: number}> = ({n}) => {
  const pose = (f: number): Pose => ({pos: [0, 170, lerp(-760, -700, f / n)], pitch: 0.06, yaw: 0, roll: -0.02});
  const rig = chaseRig(pose, [[-44, 9, -46], [-34, 8, -42], [-22, 7, -36]], [-16, -1.2, -6], [44, 38], n);
  return (
    <>
      <WorldShot w={{pose, rig, gear: "up", flaps: 0}} />
      <Callout3D rig={rig} point={(f) => onPlane(pose(f), [-14, -1.4, -7.5])} label="Cánh tà" color={ORANGE} from={at("s18", 22, "cánh") - 2} to={n - 4} offset={{x: 140, y: -190}} align="left" />
      <Chip text="1 lần hạ cánh" from={at("s18", 22, "một") - 2} to={n - 4} top={TOP + 20} color={RED} />
    </>
  );
};

/** s19: the side-slip over the threshold (gear down, nose yawed against the track). */
export const SideSlip: React.FC<{n: number}> = ({n}) => {
  const pose = (f: number): Pose => {
    const t = f / n;
    const k = Math.sin(clamp01(t / 0.35) * Math.PI / 2);
    return {pos: [lerp(8, 0, t), lerp(90, 42, t), lerp(-250, 6, t)], pitch: 0.03, yaw: -0.27 * k, roll: -0.34 * k};
  };
  const rig = chaseRig(pose, [[70, 56, -150], [120, 46, -110], [175, 38, -70], [160, 24, -20]], [0, -4, 4], [38, 36], n);
  return (
    <>
      <WorldShot w={{pose, rig, gear: "down"}} />
      <Callout3D rig={rig} point={(f) => onPlane(pose(f), [0, 0, 20])} label="Trượt cánh" color={BLUE} from={at("s19", 23, "trượt") - 2} to={at("s19", 24, "Báo") - 4} offset={{x: -140, y: -170}} align="right" />
      <Callout3D rig={rig} point={(f) => onPlane(pose(f), [-6, 1, 4])} label="Báo cáo điều tra" color={ORANGE} from={at("s19", 24, "Báo") - 2} to={n - 4} offset={{x: -120, y: 220}} align="right" />
    </>
  );
};

/** s20: swing along the runway to its far end, where the lit camp is. */
export const FarEnd: React.FC<{n: number}> = ({n}) => {
  const pose = (): Pose => ({pos: [0, PY, -9000], pitch: 0, yaw: 0, roll: 0});
  const rig = flyRig([[-40, 90, -120], [-34, 50, 900], [-26, 26, 1760]], [[0, 0, 900], [0, 0, 1500], [0, 0, 2300]], [44, 40], n);
  return <WorldShot w={{pose, rig, gear: "down", noPlane: true, extras: () => <Camp />}} />;
};

/** s21: touchdown within the first 800 ft; the nose gear folds, the nose scrapes. SFX scrape is cued at "cọ" (Vietnamese: "scrape"). */
export const Touchdown: React.FC<{n: number}> = ({n}) => {
  const TOUCH = at("s21", 26, "chạm");
  const foldAt = at("s21", 27, "gập");
  const scrapeAt = at("s21", 27, "cọ");
  const z = (f: number) => (f < TOUCH ? lerp(-90, 205, f / TOUCH) : 205 + 520 * (1 - Math.pow(1 - clamp01((f - TOUCH) / (n - TOUCH)), 2)));
  const pose = (f: number): Pose => {
    if (f < TOUCH) {
      const u = f / TOUCH;
      return {pos: [0, lerp(24, PY, u * u), z(f)], pitch: lerp(-0.04, 0.0, u * u), yaw: 0, roll: 0};
    }
    const w = clamp01((f - foldAt) / 6);
    return {pos: [0, lerp(PY + 0.05, PY - 0.4, w), z(f)], pitch: lerp(0, 0.07, w), yaw: 0, roll: 0};
  };
  const rig0 = chaseRig(pose, [[-70, 6, 64], [-62, 6, 84], [-70, 7, 96]], [0, 1.5, 6], [40, 40], n);
  const rig: CameraRig = (f) => {
    const p = rig0(f);
    if (f < foldAt) return p;
    const a = 1.0 * Math.exp(-(f - foldAt) / 7);
    const dx = Math.sin(f * 12.9898) * a;
    const dy = Math.sin(f * 78.233 + 1.7) * a * 0.7;
    p.position.add(new THREE.Vector3(dx, dy, 0));
    p.target.add(new THREE.Vector3(dx * 0.4, dy * 0.4, 0));
    return p;
  };
  const rulerEnd = 243.8; // 800 ft in metres
  return (
    <>
      <WorldShot
        w={{
          pose,
          rig,
          gear: (f) => (f < foldAt ? "down" : "nose-folded"),
          extras: (f) => (
            <>
              <Ruler end={rulerEnd} />
              <NoseScrape frame={f} touchFrame={scrapeAt} point={(g) => [0, 0.1, z(g) + 15]} />
            </>
          ),
        }}
      />
      <Callout3D rig={rig} point={[-24, 0.5, rulerEnd]} label="800 ft" color={BLUE} from={at("s21", 26, "tám") - 2} to={foldAt - 4} offset={{x: 60, y: -200}} align="left" />
      <Callout3D rig={rig} point={(f) => onPlane(pose(f), [0, -2.3, 15])} label="Mũi chạm đất" color={ORANGE} from={scrapeAt} to={n - 4} offset={{x: 110, y: 150}} align="left" />
    </>
  );
};

/** Plain ruler along the runway edge: a thin strip, ticks every 61 m (200 ft) and a marker at the end. */
const Ruler: React.FC<{end: number}> = ({end}) => (
  <group position={[-24, 0.1, 0]}>
    <mesh position={[0, 0, end / 2]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1, end]} />
      <meshBasicMaterial color={BLUE} />
    </mesh>
    {[0, 61, 122, 183].map((zz) => (
      <mesh key={zz} position={[0, 0.05, zz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5, 1.2]} />
        <meshBasicMaterial color={BLUE} />
      </mesh>
    ))}
    <mesh position={[0, 3, end]}>
      <boxGeometry args={[1.2, 6, 1.2]} />
      <meshStandardMaterial color={BLUE} emissive={BLUE} emissiveIntensity={1.2} flatShading />
    </mesh>
  </group>
);

/** s22: the lit camp at the far end (telephoto), then the stopped plane comes into the frame. */
export const Stopped: React.FC<{n: number}> = ({n}) => {
  const pose = (): Pose => ({pos: [0, PY - 0.4, 1500], pitch: 0.07, yaw: 0, roll: 0});
  const rig = flyRig([[14, 24, 960], [14, 24, 980], [14, 25, 1000]], [[8, 2, 1900], [8, 2, 1940], [8, 2, 1960]], [11, 10.5], n);
  return (
    <>
      <WorldShot w={{pose, rig, gear: "nose-folded", extras: () => <Camp />}} />
      <Callout3D rig={rig} point={[STRIP_X, 1, STRIP_Z + 80]} label="Đường đua" color={ORANGE} from={at("s22", 28, "đua") - 2} to={n - 4} offset={{x: -90, y: -170}} align="right" />
      <Callout3D rig={rig} point={[STRIP_X - 60, 1.5, STRIP_Z + 120]} label="Cắm trại" color={BLUE} from={at("s22", 28, "cắm") - 2} to={n - 4} offset={{x: 100, y: 170}} align="left" />
      <Callout3D rig={rig} point={() => onPlane(pose(), [0, -2.3, 17])} label="Dừng tại đây" color={ORANGE} from={at("s22", 29, "dừng") - 2} to={n - 4} offset={{x: 100, y: -200}} align="left" />
    </>
  );
};
