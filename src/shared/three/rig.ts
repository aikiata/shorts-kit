import * as THREE from 'three';
import {easeInOut, spline, type CameraRig, type Vec3} from './cameraPath';

/**
 * Pose of a plane (or any rigid body) as a pure function of the frame.
 * pitch + = nose DOWN, yaw + = nose toward +x, roll + = +x wing up (Euler 'YXZ':
 * yaw about world Y, then pitch, then roll about the body Z).
 */
export type Pose = {pos: Vec3; pitch: number; yaw: number; roll: number};

/** The Euler for a pose. Use for BOTH <group rotation> and projection, so they cannot disagree. */
export const poseEuler = (p: Pose) => new THREE.Euler(p.pitch, p.yaw, p.roll, 'YXZ');

/** A point fixed on the body (local metres) in world space. Same transform the mesh gets. */
export const onPlane = (p: Pose, local: Vec3): Vec3 => {
  const v = new THREE.Vector3(...local).applyEuler(poseEuler(p));
  return [p.pos[0] + v.x, p.pos[1] + v.y, p.pos[2] + v.z];
};

/**
 * Camera that follows the body: position = body + an offset spline (eased over
 * frames 0..lastFrame), looking at a body-relative point. `fov` goes from[0] to [1].
 */
export const chaseRig = (o: {
  pose: (f: number) => Pose;
  offsets: readonly Vec3[];
  look?: Vec3;
  fov?: [number, number];
  lastFrame: number;
}): CameraRig => {
  const off = spline(o.offsets);
  const look = o.look ?? [0, 0, 0];
  const fov = o.fov ?? [36, 36];
  return (f) => {
    const t = easeInOut(f / Math.max(1, o.lastFrame));
    const {pos} = o.pose(f);
    const v = off(t);
    return {
      position: new THREE.Vector3(pos[0] + v.x, pos[1] + v.y, pos[2] + v.z),
      target: new THREE.Vector3(pos[0] + look[0], pos[1] + look[1], pos[2] + look[2]),
      fov: fov[0] + (fov[1] - fov[0]) * t,
    };
  };
};

/** Decaying camera shake (deterministic). Wrap a rig: `shake(rig, hitFrame, 1.1)`. The shaken rig is what Callout3D must receive too. */
export const shake = (rig: CameraRig, hitFrame: number, amp = 1, decay = 7): CameraRig => (f) => {
  const pose = rig(f);
  if (f < hitFrame) return pose;
  const a = amp * Math.exp(-(f - hitFrame) / decay);
  const dx = Math.sin(f * 12.9898) * a;
  const dy = Math.sin(f * 78.233 + 1.7) * a * 0.7;
  pose.position.add(new THREE.Vector3(dx, dy, 0));
  pose.target.add(new THREE.Vector3(dx * 0.4, dy * 0.4, 0));
  return pose;
};
