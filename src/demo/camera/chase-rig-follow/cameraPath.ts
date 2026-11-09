import * as THREE from 'three';

/**
 * Deterministic camera paths for Remotion.
 *
 * Remotion renders frames independently (and in parallel), so a camera must be a
 * PURE FUNCTION of the frame number. Never use `useFrame`, `clock` or
 * `requestAnimationFrame`: they read real time or carry state between frames and
 * the render will differ from the preview.
 *
 * A rig is `(frame) => CamPose`. Both the in-canvas camera (`PathCamera`) and the
 * DOM overlay (`projectToScreen`, used by Callout3D) evaluate the SAME rig, which
 * is what keeps a 2D label glued to a 3D point.
 */
export type Vec3 = readonly [number, number, number];

export type CamPose = {position: THREE.Vector3; target: THREE.Vector3; fov: number};
export type CameraRig = (frame: number) => CamPose;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Smoothstep-style ease in/out. Pass your own to change the feel. */
export const easeInOut = (t: number) => {
  const k = clamp01(t);
  return k * k * (3 - 2 * k);
};

/** Catmull-Rom spline through `points`, sampled at t in [0,1] (centripetal: no loops/overshoot). */
export const spline = (points: readonly Vec3[]) => {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...p)),
    false,
    'centripetal',
  );
  return (t: number, out = new THREE.Vector3()) => curve.getPoint(clamp01(t), out);
};

/**
 * Builds a rig from a spline of positions and either a spline of look-at points
 * or a function giving the look-at point (e.g. "follow the plane").
 *
 * `from`/`to` are frames; between them t goes 0→1 through `ease`. Outside they
 * hold the end pose, so the rig is safe to evaluate on any frame.
 */
export const makeRig = (o: {
  position: readonly Vec3[];
  lookAt: readonly Vec3[] | ((frame: number) => Vec3);
  from: number;
  to: number;
  fov?: number | ((t: number) => number);
  ease?: (t: number) => number;
}): CameraRig => {
  const pos = spline(o.position);
  const look = typeof o.lookAt === 'function' ? null : spline(o.lookAt);
  const ease = o.ease ?? easeInOut;
  return (frame) => {
    const t = ease(clamp01((frame - o.from) / Math.max(1, o.to - o.from)));
    const target = look
      ? look(t)
      : new THREE.Vector3(...(o.lookAt as (f: number) => Vec3)(frame));
    const fov = typeof o.fov === 'function' ? o.fov(t) : (o.fov ?? 40);
    return {position: pos(t), target, fov};
  };
};

/** Chains rigs: each runs on its own frame range; the first/last hold outside. */
export const sequenceRigs = (rigs: readonly {until: number; rig: CameraRig}[]): CameraRig => (
  frame,
) => {
  const hit = rigs.find((r) => frame < r.until) ?? rigs[rigs.length - 1];
  return hit.rig(frame);
};

/** Pose → three camera (reused object to avoid allocation per frame). */
export const applyPose = (cam: THREE.PerspectiveCamera, pose: CamPose) => {
  cam.position.copy(pose.position);
  cam.fov = pose.fov;
  cam.up.set(0, 1, 0);
  cam.lookAt(pose.target);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
};

const scratch = new THREE.PerspectiveCamera();

/**
 * Projects a world point to canvas pixels for the pose. `visible` is false when
 * the point is behind the camera; `onScreen` also checks the frame bounds.
 */
export const projectToScreen = (
  pose: CamPose,
  point: Vec3,
  width: number,
  height: number,
): {x: number; y: number; visible: boolean; onScreen: boolean} => {
  scratch.aspect = width / height;
  applyPose(scratch, pose);
  const v = new THREE.Vector3(...point).applyMatrix4(scratch.matrixWorldInverse);
  const visible = v.z < 0;
  v.set(...point).project(scratch);
  const x = ((v.x + 1) / 2) * width;
  const y = ((1 - v.y) / 2) * height;
  return {x, y, visible, onScreen: visible && x >= 0 && x <= width && y >= 0 && y <= height};
};
