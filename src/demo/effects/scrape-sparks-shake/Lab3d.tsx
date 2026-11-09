import React from "react";
import {AbsoluteFill, Sequence, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import * as THREE from "three";
import {loadChannelFont} from "../../shared/font";
import {Callout3D} from "../../shared/frame/Callout";
import {ChapterHud} from "../../shared/frame/ChapterHud";
import {RecreationTag, type RecreationLang} from "../../shared/frame/RecreationTag";
import {SafeZones} from "../../shared/frame/SafeZones";
import {FuelLedger, type LedgerRow} from "../../shared/ledger/FuelLedger";
import {Airliner, type GearState} from "../../shared/three/Airliner";
import {Pines, Runway} from "../../shared/three/Airfield";
import {type CameraRig, type Vec3} from "../../shared/three/cameraPath";
import {NoseScrape} from "../../shared/three/NoseScrape";
import {chaseRig, onPlane, type Pose, poseEuler, shake} from "../../shared/three/rig";
import {Effects} from "../../shared/three/Effects";
import {Lighting} from "../../shared/three/Lighting";
import {LOWPOLY as P} from "../../shared/three/palette";
import {PathCamera} from "../../shared/three/PathCamera";
import {Vehicle} from "../../shared/three/Vehicle";
import {CHAPTERS, DURATION, SHOT, SHOT_CHAPTER} from "./timing";

const W = 1080;
const H = 1920;
const N = SHOT - 1;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const euler = poseEuler;

// ---------------------------------------------------------------------------
// Shot A: engines out, gliding high over the prairie, nose slightly down.
// ---------------------------------------------------------------------------
const poseA = (f: number): Pose => {
  const t = f / N;
  return {pos: [lerp(-30, -10, t), lerp(330, 305, t), lerp(-980, -760, t)], pitch: 0.05, yaw: 0, roll: Math.sin(f / 28) * 0.025};
};
const rigA = chaseRig({pose: poseA, offsets: [[-190, 40, -110], [-175, 18, 30], [-120, -2, 170]], fov: [34, 30], lastFrame: N});

// ---------------------------------------------------------------------------
// Shot B: forward slip. Bank left, nose yawed right: fuselage crabbed against the track.
// ---------------------------------------------------------------------------
const poseB = (f: number): Pose => {
  const t = f / N;
  const k = Math.sin(clamp01(t / 0.35) * Math.PI / 2);
  return {pos: [lerp(8, 0, t), lerp(78, 38, t), lerp(-230, 10, t)], pitch: 0.03, yaw: -0.27 * k, roll: -0.34 * k};
};
const rigB = chaseRig({pose: poseB, offsets: [[60, 50, -150], [100, 38, -105], [140, 28, -55]], look: [0, -4, 4], fov: [38, 36], lastFrame: N});

// ---------------------------------------------------------------------------
// Shot C: touchdown, nose gear folds, nose rests low and scrapes.
// ---------------------------------------------------------------------------
const TOUCH = 26;
const poseC = (f: number): Pose => {
  const t = f / N;
  const z = 40 + 260 * (1 - (1 - t) * (1 - t));
  if (f < TOUCH) {
    const u = f / TOUCH;
    return {pos: [0, lerp(15, 3.4, u * u), z], pitch: lerp(-0.04, 0.085, u * u * u), yaw: 0, roll: 0};
  }
  return {pos: [0, 3.48, z], pitch: 0.07, yaw: 0, roll: 0};
};
const rigC = shake(chaseRig({pose: poseC, offsets: [[-55, 5, 76], [-50, 4, 68], [-68, 7, 48]], look: [0, 1.5, 6], fov: [40, 40], lastFrame: N}), TOUCH, 1.1);

const scrapeAt = (f: number): Vec3 => [0, 0.1, poseC(f).pos[2] + 15];

type World = {shadow?: boolean; pose: (f: number) => Pose; rig: CameraRig; gear: GearState; extras?: (f: number) => React.ReactNode; anchor?: Vec3};
const DebugCtx = React.createContext(false);
const LangCtx = React.createContext<RecreationLang>("vi");
const useLang = () => React.useContext(LangCtx);

const WorldShot: React.FC<{w: World}> = ({w}) => {
  const frame = useCurrentFrame();
  const p = w.pose(frame);
  const debug = React.useContext(DebugCtx);
  return (
    <>
    <ThreeCanvas width={W} height={H} shadows camera={{fov: 36, near: 1, far: 6200, position: [0, 20, -200]}}>
      <Lighting focus={p.pos} shadow={w.shadow} />
      <PathCamera rig={w.rig} />
      <Runway />
      <Pines />
      <Pines count={60} seed={11} xMin={110} xMax={900} zMin={700} zMax={1900} />
      <Vehicle kind="truck" position={[72, 0, 330 + frame * 0.5]} rotationY={0} length={16} />
      <Vehicle kind="pickup" position={[-62, 0, 230]} rotationY={Math.PI / 2} length={9} />
      <Vehicle kind="car" position={[58, 0, 420 - frame * 0.7]} rotationY={Math.PI} length={8} />
      <group position={p.pos} rotation={euler(p)}>
        <Airliner accent={P.orange} gear={w.gear} />
        {debug && w.anchor ? (
          <mesh position={w.anchor}>
            <sphereGeometry args={[0.7, 8, 8]} />
            <meshBasicMaterial color="#ff00ff" depthTest={false} />
          </mesh>
        ) : null}
      </group>
      {w.extras?.(frame)}
    </ThreeCanvas>
    <Effects />
    </>
  );
};

const ShotA: React.FC = () => (
  <>
    <WorldShot w={{pose: poseA, rig: rigA, gear: "up"}} />
    <RecreationTag kind="recreated" lang={useLang()} />
    <Callout3D rig={rigA} point={(f) => onPlane(poseA(f), [-8.1, -2.9, 3])} label="Động cơ tắt" color={P.orange} from={14} to={80} offset={{x: 130, y: -190}} align="left" />
  </>
);
const ShotB: React.FC = () => (
  <>
    <WorldShot w={{pose: poseB, rig: rigB, gear: "down", shadow: true, anchor: [0, 0.3, 17.5]}} />
    <RecreationTag kind="recreated" lang={useLang()} />
    <Callout3D rig={rigB} point={(f) => onPlane(poseB(f), [0, 0.3, 17.5])} label="Trượt bên" color={P.blue} from={24} to={84} offset={{x: -140, y: -170}} align="right" />
  </>
);
const ShotC: React.FC = () => (
  <>
    <WorldShot w={{pose: poseC, rig: rigC, gear: "nose-folded", shadow: true, anchor: [0, -2, 15], extras: (f) => <NoseScrape frame={f} touchFrame={TOUCH} point={scrapeAt} />}} />
    <RecreationTag kind="recreated" lang={useLang()} />
    <Callout3D rig={rigC} point={(f) => onPlane(poseC(f), [0, -2.3, 15])} label="Mũi chạm đất" color={P.orange} from={34} to={86} offset={{x: 110, y: 150}} align="left" />
  </>
);

// ---------------------------------------------------------------------------
// Shot D: the fuel ledger (numbers from src/videos/gimli-glider/facts.json: g.dipstick, g.factor, g.miscalc, g.correct).
// ---------------------------------------------------------------------------
const ROWS: LedgerRow[] = [
  {label: "Que đo ra lít", wrong: {expr: "62 + 64 cm, tra bảng", value: "7.682", unit: "lít"}, right: {expr: "62 + 64 cm, tra bảng", value: "7.682", unit: "lít"}},
  {label: "Nhân hệ số", flag: true, wrong: {expr: "hệ số đưa cho phi công", value: "1,77", unit: "lb/lít"}, right: {expr: "1,77 ÷ 2,2", value: "≈ 0,8", unit: "kg/lít"}},
  {label: "Ra khối lượng", wrong: {expr: "7.682 × 1,77", value: "13.597", unit: "tưởng là kg"}, right: {expr: "7.682 × 1,77 ÷ 2,2", value: "6.180", unit: "kg"}},
  {label: "So với lượng cần 22.300 kg", flag: true, wrong: {expr: "22.300 − 13.597", value: "8.703", unit: "kg cần thêm"}, right: {expr: "22.300 − 6.180", value: "16.120", unit: "kg cần thêm"}},
];
const ShotD: React.FC = () => (
  <AbsoluteFill style={{background: `linear-gradient(180deg, ${P.sky} 0%, #0F161E 100%)`}}>
    <RecreationTag kind="simplified" lang={useLang()} />
    <FuelLedger wrongTitle="Tính sai" rightTitle="Tính đúng" rows={ROWS} from={4} stagger={20} bad="#FF5A4D" good="#5BD68A" />
  </AbsoluteFill>
);

/** HUD diagram: a glide slope with a dot; the dot's place follows the chapter. */
const GlideDiagram = (chapter: number) => {
  const stage = Math.max(0, Math.min(2, chapter - 3));
  const dots: [number, number][] = [[40, 14], [190, 36], [330, 58]];
  const [cx, cy] = dots[stage];
  return (
    <svg width={380} height={72} viewBox="0 0 380 72">
      <line x1={10} y1={66} x2={370} y2={66} stroke="rgba(255,255,255,0.35)" strokeWidth={2} />
      <line x1={30} y1={8} x2={340} y2={62} stroke="rgba(255,255,255,0.35)" strokeWidth={2} strokeDasharray="6 6" />
      <circle cx={cx} cy={cy} r={9} fill={P.orange} />
      <circle cx={cx} cy={cy} r={15} fill="none" stroke={P.orange} strokeWidth={2} opacity={0.6} />
      <rect x={338} y={60} width={26} height={6} fill={P.blue} />
    </svg>
  );
};

export const Lab3d: React.FC<{safe?: boolean; debug?: boolean; lang?: RecreationLang; compactHud?: boolean}> = ({safe, debug = false, lang = "vi", compactHud = false}) => {
  loadChannelFont();
  const frame = useCurrentFrame();
  const shot = Math.min(SHOT_CHAPTER.length - 1, Math.floor(frame / SHOT));
  const start = shot * SHOT;
  const changed = shot === 0 ? -100 : SHOT_CHAPTER[shot] !== SHOT_CHAPTER[shot - 1] ? start : -100;
  // Progress inside the chapter: continues across shots that share a chapter.
  const first = SHOT_CHAPTER.indexOf(SHOT_CHAPTER[shot]);
  const same = SHOT_CHAPTER.filter((c) => c === SHOT_CHAPTER[shot]).length;
  const prog = ((shot - first) * SHOT + (frame - start)) / (same * SHOT);
  return (
    <DebugCtx.Provider value={debug}>
    <LangCtx.Provider value={lang}>
    <AbsoluteFill style={{background: P.sky}}>
      <Sequence durationInFrames={SHOT}><ShotA /></Sequence>
      <Sequence from={SHOT} durationInFrames={SHOT}><ShotB /></Sequence>
      <Sequence from={SHOT * 2} durationInFrames={SHOT}><ShotC /></Sequence>
      <Sequence from={SHOT * 3} durationInFrames={DURATION - SHOT * 3}><ShotD /></Sequence>
      <ChapterHud channel="Ngoài sách giáo khoa" chapters={CHAPTERS} chapter={SHOT_CHAPTER[shot]} chapterProgress={prog} changedAt={changed} accent={P.orange} diagram={GlideDiagram} compact={compactHud} />
      {safe ? <SafeZones platform="tiktok" /> : null}
    </AbsoluteFill>
    </LangCtx.Provider>
    </DebugCtx.Provider>
  );
};
