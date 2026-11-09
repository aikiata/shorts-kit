import React from "react";
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from "remotion";
import {useFormat} from "../format";
import {glide} from "../motion/anim";

export type PanPose = {
  /** Image pixel at the top edge of the frame. */
  y: number;
  /** 1 = the image fills the frame width; 1.3 = 30% closer. */
  zoom: number;
};

/**
 * A captured page (bun run capture) under a camera: pan down it and push in,
 * with the real pixels, never a mock-up. `y` is in the capture's own pixels,
 * so a position read off the capture contact sheet can be typed as is. The
 * camera never uncovers an edge: `y` and the horizontal centre are clamped
 * to the image.
 */
export const CapturePan: React.FC<{
  /** Path under public/, e.g. "capture/<id>/home-mobile-3.png". */
  src: string;
  naturalW: number;
  naturalH: number;
  from: PanPose;
  to: PanPose;
  /** Frames the move takes (default: the whole scene is the caller's job, pass `duration`). */
  frames: number;
  /** Frame the move starts on. */
  start?: number;
  /** Horizontal centre in image pixels. Default: the middle. */
  cx?: number;
}> = ({src, naturalW, naturalH, from, to, frames, start = 0, cx}) => {
  const frame = useCurrentFrame();
  const {w, h} = useFormat();
  const zoom = glide(frame, [start, start + frames], [from.zoom, to.zoom]);
  const yWant = glide(frame, [start, start + frames], [from.y, to.y]);
  const scale = (w * zoom) / naturalW;
  const imgW = naturalW * scale;
  const imgH = naturalH * scale;
  const y = Math.min(Math.max(0, yWant), Math.max(0, naturalH - h / scale));
  const centre = Math.min(Math.max(w / 2 / scale, cx ?? naturalW / 2), naturalW - w / 2 / scale);
  return (
    <AbsoluteFill style={{overflow: "hidden"}}>
      <Img src={staticFile(src)} style={{position: "absolute", left: w / 2 - centre * scale, top: -y * scale, width: imgW, height: imgH, maxWidth: "none"}} />
    </AbsoluteFill>
  );
};
