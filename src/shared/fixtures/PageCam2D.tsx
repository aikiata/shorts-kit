// PageCam2D: a 2.5D page camera reused by "real texture" demos.
// Tours a full-page screenshot as a 3D plane: (cx, cy) is the page-space point aimed at the viewport center (960,540),
// zoom is the magnification, and optional rotX/rotY/rotZ/persp give an oblique camera angle.
// Same coordinate math as the template's PageCam, but self-contained (depends only on remotion);
// the demo runs once copied into a project, and does not import this library.
// Usage:
//   <PageCam2D src="textures/live/projects-full.png" pageH={PAGE_H} keys={[
//     { frame: 0, cx: 960, cy: 540, zoom: 1 },
//     { frame: 30, cx: 800, cy: 400, zoom: 1.6, rotY: 34, persp: 1200 },
//   ]}>
//     {/* Page-space child elements: positioned in CSS px */}
//   </PageCam2D>
import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, Easing } from 'remotion';

export type CamKey2D = {
  frame: number;
  cx: number;
  cy: number;
  zoom: number;
  rotX?: number; // deg
  rotY?: number; // deg (positive = right edge recedes, i.e. camera at left)
  rotZ?: number; // deg
  persp?: number; // px
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const PageCam2D: React.FC<{
  src: string; // staticFile path (e.g. textures/live/projects-full.png)
  pageH: number;
  keys: CamKey2D[];
  children?: React.ReactNode;
  bg?: string;
  blur?: number; // px, applied to the whole page (blurs the background page for depth of field)
  ease?: (t: number) => number;
}> = ({ src, pageH, keys, children, bg = '#faf7f2', blur = 0, ease = Easing.bezier(0.33, 0, 0.15, 1) }) => {
  const frame = useCurrentFrame();
  let a = keys[0];
  let b = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (frame >= keys[i].frame && frame <= keys[i + 1].frame) {
      a = keys[i];
      b = keys[i + 1];
      break;
    }
  }
  const t =
    a.frame === b.frame
      ? 1
      : interpolate(frame, [a.frame, b.frame], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: ease,
        });
  const cx = lerp(a.cx, b.cx, t);
  const cy = lerp(a.cy, b.cy, t);
  const zoom = lerp(a.zoom, b.zoom, t);
  const rotX = lerp(a.rotX ?? 0, b.rotX ?? 0, t);
  const rotY = lerp(a.rotY ?? 0, b.rotY ?? 0, t);
  const rotZ = lerp(a.rotZ ?? 0, b.rotZ ?? 0, t);
  const persp = lerp(a.persp ?? 1400, b.persp ?? 1400, t);
  const has3D = keys.some(
    (k) => k.rotX !== undefined || k.rotY !== undefined || k.rotZ !== undefined || k.persp !== undefined,
  );

  if (!has3D) {
    return (
      <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: bg }}>
        <div
          style={{
            position: 'absolute',
            width: 1920,
            height: pageH,
            transform: `translate(${960 - cx * zoom}px, ${540 - cy * zoom}px) scale(${zoom})`,
            transformOrigin: '0 0',
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
          }}
        >
          <Img src={staticFile(src)} style={{ position: 'absolute', width: 1920, height: pageH }} />
          {children}
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: bg }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          perspective: `${persp * zoom}px`,
          perspectiveOrigin: '960px 540px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 1920,
            height: pageH,
            zoom,
            transform: `translate(${960 / zoom - cx}px, ${540 / zoom - cy}px) rotateY(${rotY}deg) rotateX(${rotX}deg) rotateZ(${rotZ}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
            transformStyle: 'preserve-3d',
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
          }}
        >
          <Img src={staticFile(src)} style={{ position: 'absolute', width: 1920, height: pageH }} />
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};
