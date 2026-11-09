import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {Callout3D} from "../../shared/frame/Callout3D";
import {ChapterHud} from "../../shared/frame/ChapterHud";
import {RecreationTag} from "../../shared/frame/RecreationTag";
import {easeInOut, makeRig, type Vec3} from "../../shared/three/cameraPath";
import {GlidePath, pathPoint} from "../../shared/three/GlidePath";
import {LOWPOLY as P} from "../../shared/three/palette";
import {Model} from "../../shared/three/Model";
import {Shot3D} from "../../shared/three/Shot3D";
import {chaseRig, onPlane, type Pose} from "../../shared/three/rig";
import {useCurrentFrame} from "remotion";

/**
 * 3D explainer shots for the gallery (docs/visuals/3d-explainer.md). The "vehicle"
 * is built from boxes, which is the point: no model file, no licence to check.
 */
export const THREE_FRAMES = 150;

const ROUTE: Vec3[] = [[-40, 0, -60], [-10, 0, 0], [20, 0, 70], [60, 0, 150]];
/** Body-fixed pose along the route: a pure function of the frame. */
const poseAt = (f: number): Pose => {
  const t = f / THREE_FRAMES;
  const a = pathPoint(ROUTE, t);
  const b = pathPoint(ROUTE, Math.min(1, t + 0.01));
  return {pos: [a[0], a[1] + 1.4, a[2]], yaw: Math.atan2(b[0] - a[0], b[2] - a[2]), pitch: 0, roll: 0};
};

const Truck: React.FC = () => (
  <group>
    <mesh position={[0, 0, 0]} castShadow>
      <boxGeometry args={[3, 2.4, 8]} />
      <meshStandardMaterial color={P.body} flatShading />
    </mesh>
    <mesh position={[0, 0.2, 4.6]}>
      <boxGeometry args={[2.6, 1.6, 1.6]} />
      <meshStandardMaterial color={P.orange} emissive={P.orange} emissiveIntensity={0.6} flatShading />
    </mesh>
  </group>
);

/** A moving subject, a camera that chases it, a dashed route that draws itself, a callout glued to a body point. */
const Chase: React.FC = () => {
  const frame = useCurrentFrame();
  const p = poseAt(frame);
  const rig = makeRig({
    position: [[-38, 16, -100], [-30, 12, -40], [10, 10, 40]],
    lookAt: (f) => poseAt(f).pos,
    from: 0,
    to: THREE_FRAMES,
    fov: 38,
  });
  const nose = onPlane(p, [0, 0.6, 5.4]);
  return (
    <AbsoluteFill>
      <Shot3D rig={rig} focus={p.pos} shadow fog={[120, 700]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 60]} receiveShadow>
          <planeGeometry args={[800, 800]} />
          <meshStandardMaterial color={P.ground} flatShading />
        </mesh>
        <GlidePath points={ROUTE} progress={easeInOut(frame / 60)} color={P.blue} dash={6} gap={5} width={0.9} />
        <group position={p.pos} rotation={[p.pitch, p.yaw, p.roll, "YXZ"]}>
          <Truck />
        </group>
      </Shot3D>
      <Callout3D rig={rig} point={nose} label="Cabin" color={P.orange} from={20} to={THREE_FRAMES - 6} offset={{x: -120, y: -190}} align="right" />
      <Sequence from={0}>
        <ChapterHud channel="3D explainer" chapters={[{num: "01", label: "Route"}, {num: "02", label: "Cabin"}]} chapter={frame < 75 ? 0 : 1} chapterProgress={(frame % 75) / 75} changedAt={frame < 75 ? 0 : 75} accent={P.orange} />
        <RecreationTag kind="illustrative" from={4} />
      </Sequence>
    </AbsoluteFill>
  );
};

/**
 * A Blender-built model (`bun run model airliner` → public/models/gen/airliner.glb) flying a banking climb, a chase
 * camera, and a callout glued to a named part. glTF is Y-up: a Blender point (x, y, z) is (x, z, -y) here, so the
 * left wing tip at Blender (16.5, 6.3, 0.6) is (16.5, 0.6, -6.3) on the body.
 */
const FLY_FRAMES = 150;
const flyPose = (f: number): Pose => {
  const t = f / FLY_FRAMES;
  return {pos: [Math.sin(t * 1.4) * 30, 40 + t * 18, t * 260], yaw: Math.cos(t * 1.4) * 0.22, pitch: -0.08, roll: Math.sin(t * Math.PI) * 0.35};
};
const Flight: React.FC = () => {
  const frame = useCurrentFrame();
  const p = flyPose(frame);
  const rig = chaseRig({pose: flyPose, offsets: [[-70, 22, -120], [-95, 26, -50], [-70, 16, 45]], look: [0, 0, 4], fov: [34, 30], lastFrame: FLY_FRAMES});
  const tip = onPlane(p, [16.5, 0.6, -6.3]);
  return (
    <AbsoluteFill>
      <Shot3D rig={rig} focus={p.pos} fog={[200, 900]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 150]} receiveShadow>
          <planeGeometry args={[1600, 1600]} />
          <meshStandardMaterial color={P.ground} flatShading />
        </mesh>
        <group position={p.pos} rotation={[p.pitch, p.yaw, p.roll, "YXZ"]}>
          <Model src="models/gen/airliner.glb" />
        </group>
      </Shot3D>
      <Callout3D rig={rig} point={tip} label="Left wing" color={P.orange} from={24} to={FLY_FRAMES - 8} offset={{x: 60, y: -160}} />
      <RecreationTag kind="illustrative" from={4} />
    </AbsoluteFill>
  );
};

export type GalleryShot = {id: string; label: string; note: string; frames: number; Component: React.FC};

export const THREE_SHOTS: GalleryShot[] = [
  {id: "three-model", label: "shared/three: Model (a Blender-built .glb, bun run model airliner) + rig/chaseRig", note: "a procedural airliner banking in a climb; a callout glued to the left wing tip", frames: FLY_FRAMES, Component: Flight},
  {id: "three-chase", label: "shared/three: Shot3D, makeRig, GlidePath + frame/Callout3D, ChapterHud, RecreationTag", note: "box-built subject, chase camera, drawing route, callout glued to a body point", frames: THREE_FRAMES, Component: Chase},
];
