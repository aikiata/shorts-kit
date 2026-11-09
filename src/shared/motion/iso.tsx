import React from "react";

/**
 * Isometric in CSS 3D (docs/shots/camera/isometric-pile.md). An orthographic plane: no `perspective` anywhere
 * above it, so parallel edges stay parallel; the plane is turned `rotateX` then `rotateZ`, and anything inside
 * it is placed with left/top on the floor and `translateZ` for height. DOM content (a real component, a capture)
 * stays live and sharp on the slab's top face.
 *
 * Read the text on an isometric face at your own risk (aesthetics Q6): use it for piles, turns and reveals, and
 * bring a dense screen back to front-on (`t` → 0) before the viewer has to read it.
 */
export const ISO = {rx: 58, rz: -40} as const;

/**
 * The plane, centred on (cx, cy) in frame pixels. `t` = 1 is isometric, 0 is front-on, anything between is the
 * turn (animate it to bring a slab up to face the viewer).
 */
export const IsoPlane: React.FC<{cx: number; cy: number; t?: number; scale?: number; rx?: number; rz?: number; children: React.ReactNode}> = ({cx, cy, t = 1, scale = 1, rx = ISO.rx, rz = ISO.rz, children}) => (
  <div style={{position: "absolute", left: cx, top: cy, width: 0, height: 0, transformStyle: "preserve-3d", transform: `scale(${scale}) rotateX(${rx * t}deg) rotateZ(${rz * t}deg)`}}>{children}</div>
);

/**
 * A slab centred on its position: the top face at z = 0 holding `children`, and a solid side `depth` px deep
 * built from thin layers (CSS has no extrusion). Depth 0 is a flat card.
 */
export const Slab: React.FC<{w: number; h: number; depth: number; side?: string; radius?: number; children: React.ReactNode}> = ({w, h, depth, side = "#0c101c", radius = 18, children}) => (
  <div style={{position: "absolute", left: -w / 2, top: -h / 2, width: w, height: h, transformStyle: "preserve-3d"}}>
    {Array.from({length: Math.ceil(depth / 2)}, (_, i) => (
      <div key={i} style={{position: "absolute", inset: 0, borderRadius: radius, background: side, transform: `translateZ(${-depth + i * 2}px)`}} />
    ))}
    <div style={{position: "absolute", inset: 0, borderRadius: radius, overflow: "hidden", transform: "translateZ(0.5px)"}}>{children}</div>
  </div>
);

/** Something on the plane at floor position (x, y) and height z, turned `rz` degrees about its own axis. */
export const OnPlane: React.FC<{x?: number; y?: number; z?: number; rz?: number; opacity?: number; children: React.ReactNode}> = ({x = 0, y = 0, z = 0, rz = 0, opacity = 1, children}) => (
  <div style={{position: "absolute", left: x, top: y, transformStyle: "preserve-3d", transform: `translateZ(${z}px) rotateZ(${rz}deg)`, opacity}}>{children}</div>
);

/** A pile's height for item `i`: dropped from `fall` px above while `a` (0..1) is below 1, sunk to the floor by `sink`. */
export const pileZ = (i: number, gap: number, a = 1, sink = 0, fall = 700) => i * gap * (1 - sink) + (1 - a) * fall;
