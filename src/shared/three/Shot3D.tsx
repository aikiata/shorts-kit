import React from "react";
import {ThreeCanvas} from "@remotion/three";
import {useFormat} from "../format";
import type {CameraRig} from "./cameraPath";
import {Effects} from "./Effects";
import {Lighting} from "./Lighting";
import {PathCamera} from "./PathCamera";
import type {Vec3} from "./cameraPath";

/**
 * One 3D shot: a ThreeCanvas sized to the running composition, the shared
 * lighting + fog + sky dome, a camera driven by `rig`, and the CSS finish.
 * Put it inside a <Sequence> so `useCurrentFrame()` (and the rig) is shot-local.
 *
 * Put DOM overlays (Callout3D, chips) AFTER it and give them the SAME `rig`.
 * `focus` is the subject's world position (for the soft shadow); pass `shadow`
 * only when the subject is low (< ~90 units). Everything inside must be a pure
 * function of the frame: no useFrame, no clock, no Math.random.
 */
export const Shot3D: React.FC<{
  rig: CameraRig;
  children: React.ReactNode;
  focus?: Vec3;
  shadow?: boolean;
  fog?: [number, number];
  vignette?: number;
}> = ({rig, children, focus, shadow = false, fog, vignette}) => {
  const {w, h} = useFormat();
  return (
    <>
      <ThreeCanvas width={w} height={h} shadows={shadow} camera={{fov: 36, near: 1, far: 6200, position: [0, 20, -200]}}>
        <Lighting focus={focus} shadow={shadow} fogNear={fog?.[0]} fogFar={fog?.[1]} />
        <PathCamera rig={rig} />
        {children}
      </ThreeCanvas>
      <Effects vignette={vignette} />
    </>
  );
};
