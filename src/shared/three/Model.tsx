import {useThree} from "@react-three/fiber";
import React, {useEffect, useLayoutEffect, useMemo, useState} from "react";
import {cancelRender, continueRender, delayRender, staticFile} from "remotion";
import type * as THREE from "three";
import {GLTFLoader, type GLTF} from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * A .glb model inside a Shot3D, for a hero object built by a Blender script (`bun run model <name>` writes
 * public/models/gen/<name>.glb; docs/visuals/3d-explainer.md). Remotion waits for the file (delayRender), so no
 * frame is captured before the model is there. Each file loads once per tab and is cloned per use.
 *
 * `nodes` moves or hides named parts by frame (a flap, a gear, an engine): the names are the Blender object
 * names. Everything stays a pure function of the props: no useFrame, no clock.
 */
const cache = new Map<string, Promise<GLTF>>();
const load = (src: string) => {
  let p = cache.get(src);
  if (!p) {
    p = new GLTFLoader().loadAsync(staticFile(src));
    cache.set(src, p);
  }
  return p;
};

/** The loaded model, or null while it loads. */
export const useModel = (src: string): GLTF | null => {
  const [gltf, setGltf] = useState<GLTF | null>(null);
  useEffect(() => {
    let live = true;
    load(src)
      .then((g) => live && setGltf(g))
      .catch((e) => cancelRender(new Error(`could not load public/${src}: ${(e as Error).message}. Run \`bun run model <name>\` first.`)));
    return () => {
      live = false;
    };
  }, [src]);
  return gltf;
};

export type NodePose = {position?: [number, number, number]; rotation?: [number, number, number]; visible?: boolean};

export const Model: React.FC<{
  /** Path under public/, e.g. "models/gen/airliner.glb". */
  src: string;
  /** Per named node: a position, rotation (radians, XYZ) or visibility for this frame. */
  nodes?: Record<string, NodePose>;
  scale?: number;
  castShadow?: boolean;
}> = ({src, nodes, scale = 1, castShadow = true}) => {
  // The frame waits until the model is in the scene AND drawn: ThreeCanvas only redraws when the frame
  // changes (frameloop "never" while rendering), so advance once after the model mounts, then release.
  const [handle] = useState(() => delayRender(`model ${src}`, {timeoutInMilliseconds: 60_000}));
  const {advance} = useThree();
  const gltf = useModel(src);
  const scene = useMemo(() => {
    if (!gltf) return null;
    const s = gltf.scene.clone(true);
    s.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = castShadow;
        m.receiveShadow = true;
      }
    });
    return s;
  }, [gltf, castShadow]);
  useLayoutEffect(() => {
    if (!scene) return;
    advance(performance.now());
    continueRender(handle);
  }, [scene, advance, handle]);
  if (!scene) return null;
  for (const [name, pose] of Object.entries(nodes ?? {})) {
    const o = scene.getObjectByName(name);
    if (!o) continue;
    if (pose.position) o.position.set(...pose.position);
    if (pose.rotation) o.rotation.set(...pose.rotation);
    if (pose.visible !== undefined) o.visible = pose.visible;
  }
  return <primitive object={scene} scale={scale} />;
};
