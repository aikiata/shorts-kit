import React, {useMemo} from 'react';
import * as THREE from 'three';
import type {Vec3} from './cameraPath';

/**
 * Dashed 3D line that draws itself along a spline: the route a plane will take.
 * `progress` 0..1 (a function of the frame) is how much of the path is drawn.
 * Dashes are flat boxes oriented along the path, unlit, unfogged, so the line
 * stays readable at any distance. `width` is in metres: make it big for a
 * high, wide shot (e.g. 6 for a 1 km view).
 */
export const GlidePath: React.FC<{
  points: readonly Vec3[];
  progress: number;
  color: string;
  dash?: number;
  gap?: number;
  width?: number;
  /** Raise the whole line (m) to keep it above the ground tiles. */
  lift?: number;
}> = ({points, progress, color, dash = 40, gap = 30, width = 5, lift = 0.6}) => {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1] + lift, p[2])), false, 'centripetal'),
    [points, lift],
  );
  const total = useMemo(() => curve.getLength(), [curve]);
  const n = Math.floor(total / (dash + gap));
  const drawn = Math.max(0, Math.min(1, progress)) * total;
  const items: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const s0 = i * (dash + gap);
    if (s0 > drawn) break;
    const len = Math.min(dash, drawn - s0);
    const mid = (s0 + len / 2) / total;
    const pos = curve.getPointAt(mid);
    const tan = curve.getTangentAt(mid);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan);
    items.push(
      <mesh key={i} position={pos} quaternion={q}>
        <boxGeometry args={[width, width * 0.25, len]} />
        <meshBasicMaterial color={color} fog={false} />
      </mesh>,
    );
  }
  return <group>{items}</group>;
};

/** Point at fraction t of the same path (to put a camera target or a marker on the head of the line). */
export const pathPoint = (points: readonly Vec3[], t: number): Vec3 => {
  const c = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
  const v = c.getPointAt(Math.max(0, Math.min(1, t)));
  return [v.x, v.y, v.z];
};
