import React, {useMemo, useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import type {Vec3} from './cameraPath';
import {LOWPOLY as P} from './palette';

/**
 * Sky dome: vertex-colour gradient from the horizon colour (= the fog colour) up
 * to the zenith colour. Because the ground fades into the SAME horizon colour, the
 * horizon is a soft haze instead of a hard cut. Not fogged, not lit.
 */
export const SkyDome: React.FC<{radius?: number}> = ({radius = 3000}) => {
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(radius, 24, 16);
    const pos = g.getAttribute('position');
    const top = new THREE.Color(P.sky);
    const hor = new THREE.Color(P.skyLow);
    const c = new THREE.Color();
    const col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const h = Math.max(0, pos.getY(i) / radius);
      c.copy(hor).lerp(top, Math.min(1, Math.pow(h / 0.45, 0.8)));
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }, [radius]);
  // Follow the camera so the dome is always `radius` away: a dome fixed at the origin
  // gets clipped by the far plane when the camera is far from it (dark polygon in the sky).
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({camera}) => ref.current?.position.copy(camera.position));
  return (
    <mesh ref={ref} geometry={geo} frustumCulled={false} renderOrder={-1}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} />
    </mesh>
  );
};

const SUN_DIR = new THREE.Vector3(-220, 260, -120).normalize();

/**
 * Key light with a soft shadow map that follows the subject. `focus` is the
 * subject's world position; the shadow camera is centred between the subject and
 * the ground point its shadow falls on. Only worth enabling when the subject is
 * low (about < 90 m): higher, the shadow lands too far away to be useful, so pass
 * `shadow={false}`. The shadow map is a pure function of the scene: deterministic.
 */
const Sun: React.FC<{focus: Vec3 | undefined; shadow: boolean}> = ({focus, shadow}) => {
  const target = useMemo(() => new THREE.Object3D(), []);
  const f = focus ?? ([0, 0, 0] as Vec3);
  const ground = new THREE.Vector3(...f).addScaledVector(SUN_DIR, -f[1] / SUN_DIR.y);
  const mid = new THREE.Vector3(...f).add(ground).multiplyScalar(0.5);
  target.position.copy(mid);
  const pos = mid.clone().addScaledVector(SUN_DIR, 500);
  return (
    <>
      <primitive object={target} />
      <directionalLight
        position={pos.toArray()}
        target={target}
        intensity={2.2}
        color="#FFD9B0"
        castShadow={shadow}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-camera-near={50}
        shadow-camera-far={1000}
        shadow-bias={-0.0006}
        shadow-radius={6}
        shadow-blurSamples={12}
      />
    </>
  );
};

/**
 * Lighting + fog preset. Flat-shaded materials need a strong key from one side plus
 * a cool rim/fill from the other and a lifted hemisphere so the shadow side still
 * reads as a SHAPE. Fog is thick and shares the horizon colour of the sky dome, so
 * the distance dissolves instead of ending.
 *
 * `focus` + `shadow` enable the soft shadow under the subject (see Sun). Mark the
 * <Canvas> as `shadows` too.
 */
export const Lighting: React.FC<{fogNear?: number; fogFar?: number; focus?: Vec3; shadow?: boolean}> = ({
  fogNear = 250,
  fogFar = 2300,
  focus,
  shadow = false,
}) => (
  <>
    <color attach="background" args={[P.sky]} />
    <fog attach="fog" args={[P.skyLow, fogNear, fogFar]} />
    <SkyDome />
    <hemisphereLight args={['#C2D0DE', '#3A4756', 1.15]} />
    <ambientLight intensity={0.35} color="#8FA3B8" />
    <Sun focus={focus} shadow={shadow} />
    <directionalLight position={[300, 140, 200]} intensity={1.0} color="#A8C8EE" />
  </>
);
