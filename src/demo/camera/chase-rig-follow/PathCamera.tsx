import React from 'react';
import {useThree} from '@react-three/fiber';
import {useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {applyPose, type CameraRig} from './cameraPath';

/**
 * Drives the default r3f camera from a rig. Runs during render (not `useFrame`),
 * so each Remotion frame gets exactly the pose of its frame number.
 * Place it inside <ThreeCanvas>. The camera aspect is set from the canvas size.
 */
export const PathCamera: React.FC<{rig: CameraRig}> = ({rig}) => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  camera.aspect = size.width / size.height;
  applyPose(camera, rig(frame));
  return null;
};
