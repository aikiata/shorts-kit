import React from 'react';
import {AbsoluteFill} from 'remotion';

/**
 * Look-dev overlay for the 3D shots. `@react-three/postprocessing` (EffectComposer) was
 * tried and renders a blank canvas under Remotion's ThreeCanvas (frameloop "never"),
 * so the finish is done outside WebGL: a vignette and a faint cool haze as a CSS overlay.
 * Pure function of nothing but props, so it is deterministic. Soft contact shadows come
 * from the shadow map in Lighting (Canvas needs `shadows`).
 * Place it AFTER the ThreeCanvas, inside the same Sequence.
 */
export const Effects: React.FC<{vignette?: number}> = ({vignette = 0.55}) => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      background: `radial-gradient(ellipse 75% 65% at 50% 48%, rgba(0,0,0,0) 55%, rgba(6,10,16,${vignette}) 100%)`,
    }}
  />
);
