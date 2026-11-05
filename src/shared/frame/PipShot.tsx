import React from "react";
import {AbsoluteFill, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {clamp, easeOut} from "../motion/anim";
import {H, W} from "../theme";
import {faceAt, type ClipStart, type FaceBands} from "./FootageStage";
import {SAFE_TOP} from "./SafeZones";

export type PipCorner = "top-right" | "top-left";
/** "card": a rounded 3:4 box; "circle": a round face cam. */
export type PipShape = "card" | "circle";

/**
 * Picture-in-picture for a talking-head video (§5j): the speaker shrinks into a
 * corner box and `children` (a globe, a map, a number card, an illustrated scene)
 * fill the frame behind, for the stretch of speech they illustrate. The voice
 * never stops; the person never leaves.
 *
 * - The box grows out of / back into the full frame (`morph` frames), so the
 *   change reads as one camera move, not a cut.
 * - The box shows the same moment of cut.mp4 (`trimBefore` = absolute frame), so
 *   lips stay in sync; it crops around the face band at that time.
 * - Corners stay inside the safe area: top-left or top-right, under the top band
 *   and above the right rail (§7a). Put the content's text below the box.
 *
 * Lint does not check effects inside a PipShot against the face band: the face
 * is in the box, not behind them.
 */
export const PipShot: React.FC<{
  /** footage.json → `video`. */
  src: string;
  /** The scene's absolute first frame (SceneProps.from): keeps the box in sync. */
  sceneFrom: number;
  /** Scene-relative frames: when the PiP starts and ends. */
  at: number;
  until: number;
  face?: FaceBands;
  clips?: readonly ClipStart[];
  corner?: PipCorner;
  shape?: PipShape;
  /** Box width in px; a card is 3:4 portrait (h = w × 4/3), a circle is w × w. */
  width?: number;
  morph?: number;
  children: React.ReactNode;
}> = ({src, sceneFrom, at, until, face, clips, corner = "top-right", shape = "card", width = 340, morph = 12, children}) => {
  const dur = Math.max(1, until - at);
  return (
    <Sequence from={at} durationInFrames={dur} layout="none">
      <PipInner src={src} startAbs={sceneFrom + at} dur={dur} face={face} clips={clips} corner={corner} shape={shape} width={width} morph={Math.min(morph, Math.floor(dur / 3))}>
        {children}
      </PipInner>
    </Sequence>
  );
};

const PipInner: React.FC<{
  src: string;
  startAbs: number;
  dur: number;
  face?: FaceBands;
  clips?: readonly ClipStart[];
  corner: PipCorner;
  shape: PipShape;
  width: number;
  morph: number;
  children: React.ReactNode;
}> = ({src, startAbs, dur, face, clips, corner, shape, width, morph, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  // 0 = full frame, 1 = in the corner
  const k = Math.min(interpolate(frame, [0, morph], [0, 1], {...clamp, easing: easeOut}), interpolate(frame, [dur - morph, dur], [1, 0], {...clamp, easing: easeOut}));
  const h = shape === "circle" ? width : Math.round((width * 4) / 3);
  const margin = 40;
  const box = {
    x: corner === "top-right" ? W - margin - width : margin,
    y: SAFE_TOP + 28,
    w: width,
    h,
  };
  const rect = {
    x: interpolate(k, [0, 1], [0, box.x]),
    y: interpolate(k, [0, 1], [0, box.y]),
    w: interpolate(k, [0, 1], [W, box.w]),
    h: interpolate(k, [0, 1], [H, box.h]),
  };
  // Inside the box, the full 1080×1920 frame is scaled so the face band fills
  // about 80% of the box height, centred on the face.
  const band = faceAt(face, clips, (startAbs + frame) / fps) ?? {top: 500, bottom: 1100};
  const faceH = Math.max(200, band.bottom - band.top);
  // a circle crops tighter: the face fills ~90% of the diameter
  const fill = shape === "circle" ? 0.9 : 0.8;
  const scale = interpolate(k, [0, 1], [1, Math.max(box.w / W, Math.min(1, (box.h * fill) / faceH))]);
  const faceCy = (band.top + band.bottom) / 2;
  const offY = interpolate(k, [0, 1], [0, rect.h / 2 - faceCy * scale]);
  const faceCx = band.cx ?? W / 2;
  const offX = interpolate(k, [0, 1], [0, rect.w / 2 - faceCx * scale]);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{opacity: interpolate(k, [0, 0.35], [0, 1], clamp)}}>{children}</AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: rect.x,
          top: rect.y,
          width: rect.w,
          height: rect.h,
          overflow: "hidden",
          // the radius grows with the morph: a full frame has square corners, the box its shape
          borderRadius: interpolate(k, [0, 1], [0, shape === "circle" ? Math.min(rect.w, rect.h) / 2 : 28]),
          boxShadow: `0 18px 50px rgba(0,0,0,${0.55 * k})`,
          outline: `${4 * k}px solid rgba(255,255,255,${0.85 * k})`,
          outlineOffset: -4 * k,
          background: "#000",
        }}
      >
        <div style={{position: "absolute", left: offX, top: offY, width: W, height: H, transform: `scale(${scale})`, transformOrigin: "0 0"}}>
          <OffthreadVideo src={staticFile(src)} trimBefore={startAbs} muted style={{width: W, height: H, objectFit: "cover"}} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
