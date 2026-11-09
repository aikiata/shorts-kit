/**
 * 3D helpers for gimli-glider. Patterns (chase rig, plane-fixed anchors, impact
 * sparks) follow the lab-3d prototype by MV-Worker-1, rewritten here because a
 * video never imports another video. Candidates to move to src/shared/three.
 * Every function is a pure function of the frame so renders are reproducible.
 */
import React from "react";
import {useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import * as THREE from "three";
import {Airliner, type GearState} from "../../shared/three/Airliner";
import {Pines, Runway} from "../../shared/three/Airfield";
import {easeInOut, spline, type CameraRig, type Vec3} from "../../shared/three/cameraPath";
import {Effects} from "../../shared/three/Effects";
import {Lighting} from "../../shared/three/Lighting";
import {LOWPOLY as P} from "../../shared/three/palette";
import {PathCamera} from "../../shared/three/PathCamera";

export const W = 1080;
export const H = 1920;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Plane pose: pitch + = nose DOWN, yaw + = nose toward +x, roll + = +x wing up. */
export type Pose = {pos: Vec3; pitch: number; yaw: number; roll: number};
export const euler = (p: Pose) => new THREE.Euler(p.pitch, p.yaw, p.roll, "YXZ");
/** A point fixed on the plane (local metres) in world space. */
export const onPlane = (p: Pose, local: Vec3): Vec3 => {
  const v = new THREE.Vector3(...local).applyEuler(euler(p));
  return [p.pos[0] + v.x, p.pos[1] + v.y, p.pos[2] + v.z];
};

/** Camera = plane position + a spline of offsets, looking at a plane-relative point. `n` = frames in the shot. */
export const chaseRig = (pose: (f: number) => Pose, offsets: readonly Vec3[], look: Vec3, fov: [number, number], n: number): CameraRig => {
  const o = spline(offsets);
  return (f) => {
    const t = easeInOut(clamp01(f / Math.max(1, n - 1)));
    const {pos} = pose(f);
    const off = o(t);
    return {
      position: new THREE.Vector3(pos[0] + off.x, pos[1] + off.y, pos[2] + off.z),
      target: new THREE.Vector3(pos[0] + look[0], pos[1] + look[1], pos[2] + look[2]),
      fov: lerp(fov[0], fov[1], t),
    };
  };
};

/** World-fixed camera path from position/look-at splines over the whole shot. */
export const flyRig = (position: readonly Vec3[], lookAt: readonly Vec3[], fov: [number, number], n: number): CameraRig => {
  const p = spline(position);
  const l = spline(lookAt);
  return (f) => {
    const t = easeInOut(clamp01(f / Math.max(1, n - 1)));
    return {position: p(t), target: l(t), fov: lerp(fov[0], fov[1], t)};
  };
};

const hash = (n: number) => {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

/** Sparks + dark scrape mark + dust behind the nose from frame `touch`, along z. `scrapeZ(f)` = world z of the scraping point. */
export const Impact: React.FC<{frame: number; touch: number; scrapeZ: (f: number) => number}> = ({frame, touch, scrapeZ}) => {
  if (frame < touch) return null;
  const sz = scrapeZ(frame);
  const start = scrapeZ(touch);
  const age = Math.min(1, (frame - touch) / 5);
  const sparks = Array.from({length: 40}, (_, i) => {
    const h = (k: number) => hash(i * 7.3 + k + Math.floor(frame / 2) * 13.1);
    return (
      <mesh key={i} position={[(h(1) - 0.5) * 3, 0.15 + h(2) * 2.2 * h(3), sz - h(4) * 12]} rotation={[h(5) * 3, h(6) * 3, 0]} scale={age * (0.8 + h(7))}>
        <boxGeometry args={[0.5 + h(8) * 0.6, 0.3, 1.1]} />
        <meshStandardMaterial color={h(9) > 0.5 ? P.orange : "#FFD27A"} emissive={h(9) > 0.5 ? P.orange : "#FFD27A"} emissiveIntensity={2} flatShading />
      </mesh>
    );
  });
  const puffs = Array.from({length: 14}, (_, j) => {
    const sf = touch + j * 2;
    const a = frame - sf;
    if (a < 0 || a > 34) return null;
    const k = a / 34;
    return (
      <mesh key={j} position={[(hash(j) - 0.5) * 4, 0.6 + a * 0.16, scrapeZ(sf) - 1]} scale={1.6 + k * 4}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#8E9AA7" flatShading transparent opacity={0.55 * (1 - k)} depthWrite={false} />
      </mesh>
    );
  });
  return (
    <group>
      <mesh position={[0, 0.06, (start + sz) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.6, Math.max(0.1, sz - start)]} />
        <meshBasicMaterial color="#05070A" />
      </mesh>
      {sparks}
      {puffs}
    </group>
  );
};

export type World = {
  pose: (f: number) => Pose;
  rig: CameraRig;
  gear: GearState | ((f: number) => GearState);
  engineLit?: number | ((f: number) => number);
  cockpitLit?: boolean;
  /** Flap deployment 0..1 (default 0: retracted). */
  flaps?: number;
  /** Draw the runway and its surroundings (default true). */
  runway?: boolean;
  /** Fog near/far in metres (default: shared preset). Wide map-like shots need it pushed out. */
  fog?: [number, number];
  /** Scale the plane (map-like wide shots where a real-size plane would be a speck). */
  planeScale?: number;
  /** Skip the plane (cutaway shots of the ground only). */
  noPlane?: boolean;
  extras?: (f: number) => React.ReactNode;
  /** Objects in the plane's local space (e.g. the dipstick). */
  planeChildren?: (f: number) => React.ReactNode;
};

/** One ThreeCanvas: lighting, camera rig, runway/prairie, the airliner, extras. */
export const WorldShot: React.FC<{w: World}> = ({w}) => {
  const frame = useCurrentFrame();
  const p = w.pose(frame);
  const gear = typeof w.gear === "function" ? w.gear(frame) : w.gear;
  const lit = typeof w.engineLit === "function" ? w.engineLit(frame) : w.engineLit ?? 0;
  return (
    <>
    <ThreeCanvas width={W} height={H} shadows camera={{fov: 36, near: 1, far: 6200, position: [0, 20, -200]}}>
      <Lighting focus={p.pos} shadow={p.pos[1] < 90} fogNear={w.fog?.[0]} fogFar={w.fog?.[1]} />
      <PathCamera rig={w.rig} />
      {w.runway === false ? null : <Runway />}
      {w.runway === false ? null : <Pines />}
      {w.runway === false ? null : <Pines count={60} seed={11} xMin={110} xMax={900} zMin={700} zMax={1900} />}
      {w.noPlane ? null : (
        <group position={p.pos} rotation={euler(p)} scale={w.planeScale ?? 1}>
          <Airliner accent={P.orange} gear={gear} engineLit={lit} cockpitLit={w.cockpitLit} flaps={w.flaps ?? 0}>{w.planeChildren?.(frame)}</Airliner>
        </group>
      )}
      {w.extras?.(frame)}
    </ThreeCanvas>
    <Effects />
    </>
  );
};
