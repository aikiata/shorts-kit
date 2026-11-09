import React from 'react';
import type {Vec3} from './cameraPath';
import {LOWPOLY as P} from './palette';

/**
 * Sparks + a dark scrape mark + dust for a nose (or belly) dragging on the
 * ground. Deterministic from the frame. `point(f)` gives the world position of
 * the contact on the ground (y is ignored; the effect sits on y≈0) and must move
 * forward along +Z. Starts at `touchFrame`.
 */
const hash = (n: number) => {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

export const NoseScrape: React.FC<{
  frame: number;
  touchFrame: number;
  point: (f: number) => Vec3;
  sparks?: number;
  puffs?: number;
  /** Spark colour pair. */
  hot?: string;
}> = ({frame, touchFrame, point, sparks = 44, puffs = 14, hot = P.orange}) => {
  if (frame < touchFrame) return null;
  const [sx, , sz] = point(frame);
  const start = point(touchFrame)[2];
  const age = Math.min(1, (frame - touchFrame) / 5);
  const sp = Array.from({length: sparks}, (_, i) => {
    const h = (k: number) => hash(i * 7.3 + k + Math.floor(frame / 2) * 13.1);
    const c = h(9) > 0.5 ? hot : '#FFD27A';
    return (
      <mesh key={i} position={[sx + (h(1) - 0.5) * 3, 0.15 + h(2) * 2.2 * h(3), sz - h(4) * 12]} rotation={[h(5) * 3, h(6) * 3, 0]} scale={age * (0.8 + h(7))}>
        <boxGeometry args={[0.5 + h(8) * 0.6, 0.3, 1.1]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={2} flatShading />
      </mesh>
    );
  });
  const pf = Array.from({length: puffs}, (_, j) => {
    const sf = touchFrame + j * 2;
    const a = frame - sf;
    if (a < 0 || a > 34) return null;
    const k = a / 34;
    return (
      <mesh key={j} position={[(hash(j) - 0.5) * 4, 0.6 + a * 0.16, point(sf)[2] - 1]} scale={1.6 + k * 4}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#8E9AA7" flatShading transparent opacity={0.55 * (1 - k)} depthWrite={false} />
      </mesh>
    );
  });
  const len = Math.max(0.1, sz - start);
  return (
    <group>
      <mesh position={[sx, 0.06, (start + sz) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.6, len]} />
        <meshBasicMaterial color="#05070A" />
      </mesh>
      <mesh position={[sx, 0.08, (start + sz) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.35, len]} />
        <meshBasicMaterial color="#8A8F94" />
      </mesh>
      {sp}
      {pf}
    </group>
  );
};
