import type {ReactNode} from "react";
import {AbsoluteFill, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ramp} from "../../shared/map/bits";
import {INK} from "./ink";
import {shotById, useShot, type ShotId} from "./timing";

/**
 * The video's real-picture layer: the portrait still and the pre-cut clips in `public/clips/`.
 * Storyboard rule: her face is always blurred. Blur with `backdrop-filter` on an
 * ellipse mask region, so the same method works for both the still and the clips.
 * Licences for the still and the clips are the channel owner's responsibility.
 */

const STILL = staticFile("stills/nikki-tall.jpg");

/** Face region, as a fraction of the frame (0..1). */
export type Blob = {x: number; y: number; rx: number; ry: number};

/** Her face in `nikki-tall.jpg`. */
export const STILL_FACE: Blob = {x: 0.51, y: 0.62, rx: 0.17, ry: 0.105};
/** Mouth corners and both eyes in `nikki-tall.jpg`, in px of the 1080x1920 frame. */
const MOUTH = {x: 555, y: 1246, half: 52};
const EYES = [
  {x: 491, y: 1146},
  {x: 605, y: 1146},
];

const maskOf = (blob: Blob) => {
  const mask = `radial-gradient(ellipse ${blob.rx * 100}% ${blob.ry * 100}% at ${blob.x * 100}% ${blob.y * 100}%, #000 58%, transparent 100%)`;
  return {WebkitMaskImage: mask, maskImage: mask};
};

const Blur = ({blob, px}: {blob: Blob; px: number}) => {
  const mask = `radial-gradient(ellipse ${blob.rx * 100}% ${blob.ry * 100}% at ${blob.x * 100}% ${blob.y * 100}%, #000 58%, transparent 100%)`;
  return (
    <AbsoluteFill
      style={{
        backdropFilter: `blur(${px}px)`,
        WebkitBackdropFilter: `blur(${px}px)`,
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
    />
  );
};

const Shade = () => (
  <AbsoluteFill
    style={{
      background:
        "linear-gradient(to bottom, rgba(2,7,12,0.45) 0%, rgba(2,7,12,0) 22%, rgba(2,7,12,0) 55%, rgba(2,7,12,0.88) 100%)",
    }}
  />
);

/** `span` for a push-in that runs straight through several shots, so the cuts between them do not jolt. */
type Move = {scale: [number, number]; origin: string; y?: [number, number]; span?: [ShotId, ShotId]};

/** Shared frame: slow push-in per shot, every child layer moves together. */
const Stage = ({move, children, grade}: {move: Move; children: ReactNode; grade?: string}) => {
  const frame = useCurrentFrame();
  const shot = useShot();
  const from = move.span ? shotById(move.span[0]).start : shot.start;
  const last = move.span ? shotById(move.span[1]) : shot;
  const t = ramp(frame, from, last.start + last.duration);
  const scale = interpolate(t, [0, 1], move.scale);
  const y = move.y ? interpolate(t, [0, 1], move.y) : 0;
  return (
    <AbsoluteFill style={{overflow: "hidden", background: INK.bg}}>
      <AbsoluteFill
        style={{
          transform: `translateY(${y}px) scale(${scale})`,
          transformOrigin: move.origin,
          filter: grade,
        }}
      >
        {children}
      </AbsoluteFill>
      <Shade />
    </AbsoluteFill>
  );
};

const fill = {width: "100%", height: "100%", objectFit: "cover" as const};

/**
 * One 720x1280 portrait clip. `from` is the second in the clip file.
 * `face` takes the time (seconds in the clip) so the blur region follows the person.
 */
export const Clip = ({
  src,
  from = 0,
  rate = 1,
  move = {scale: [1.02, 1.1], origin: "50% 45%"},
  face,
  blur = 26,
  grade = "brightness(1.25) contrast(1.05) saturate(0.9)",
  anchor,
}: {
  /** Anchor the clip to the start of this shot instead of the current shot, so one clip runs straight through several shots. */
  anchor?: ShotId;
  src: string;
  from?: number;
  rate?: number;
  move?: Move;
  face?: Blob | ((sec: number) => Blob);
  blur?: number;
  grade?: string;
}) => {
  const frame = useCurrentFrame();
  const current = useShot();
  const shot = anchor ? shotById(anchor) : current;
  const sec = from + ((frame - shot.start) / 30) * rate;
  const blob = typeof face === "function" ? face(sec) : face;
  return (
    <Stage move={move} grade={grade}>
      <Sequence from={shot.start} layout="none">
        <OffthreadVideo src={staticFile(`clips/${src}`)} startFrom={Math.round(from * 30)} playbackRate={rate} muted style={fill} />
      </Sequence>
      {blob ? <Blur blob={blob} px={blur} /> : null}
    </Stage>
  );
};

/** Close-up portrait still. The face is always blurred. `mark` points at the spot the voice is talking about, it does not redraw detail. */
export const Still = ({
  move,
  mark,
  vignette = 0,
}: {
  move: Move;
  mark?: "mouth" | "eyes" | "mouth-hot";
  vignette?: number;
}) => {
  const frame = useCurrentFrame();
  const shot = useShot();
  const t = ramp(frame, shot.start + 4, shot.start + Math.min(28, shot.duration));
  const pulse = 0.75 + 0.25 * Math.sin((frame - shot.start) / 4);
  return (
    <AbsoluteFill>
      <Stage move={move} grade="brightness(1.1) contrast(1.08)">
        <Img src={STILL} style={fill} />
        {/*
          Blur with a second, already blurred copy of the image, cut to the face region. Do NOT use
          backdrop-filter here: when the close-up zooms past ~1.9x, Chrome drops
          the backdrop layer and the face shows sharp (caught on shots ron and sey, 03/11/2026).
        */}
        <Img src={STILL} style={{...fill, position: "absolute", inset: 0, filter: "blur(30px)", ...maskOf(STILL_FACE)}} />
        <svg viewBox="0 0 1080 1920" style={{position: "absolute", inset: 0, width: "100%", height: "100%"}}>
          {mark === "mouth" || mark === "mouth-hot" ? (
            <g stroke={INK.dip} strokeWidth={5} strokeLinecap="round" fill="none" opacity={mark === "mouth-hot" ? pulse : 1}>
              {[-1, 1].map((side) => {
                const x0 = MOUTH.x + side * MOUTH.half;
                const x1 = x0 + side * interpolate(t, [0, 1], [0, 70]);
                return (
                  <g key={side}>
                    <line x1={x0} y1={MOUTH.y} x2={x1} y2={MOUTH.y} />
                    <polyline points={`${x1 - side * 14},${MOUTH.y - 12} ${x1},${MOUTH.y} ${x1 - side * 14},${MOUTH.y + 12}`} />
                    <line x1={x0} y1={MOUTH.y - 22} x2={x0} y2={MOUTH.y + 22} />
                  </g>
                );
              })}
            </g>
          ) : null}
          {mark === "eyes"
            ? EYES.map((eye, index) => (
                <circle
                  key={index}
                  cx={eye.x}
                  cy={eye.y}
                  r={interpolate(t, [0, 1], [8, 34])}
                  stroke={INK.dip}
                  strokeWidth={4}
                  strokeDasharray="10 8"
                  fill="none"
                  opacity={t}
                />
              ))
            : null}
        </svg>
      </Stage>
      {vignette > 0 ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 60% 42% at 50% 46%, rgba(0,0,0,0) 40%, rgba(0,0,0,${vignette * t}) 100%)`,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

/**
 * Close-up on her face in the portrait still. The image zooms around the face and then pushes up, so the face sits
 * above the caption band instead of slipping under the words.
 */
export const CLOSE: Move = {scale: [1.75, 1.95], origin: "51% 62%", y: [-300, -330]};
/** The two shots "mouth corners" and "eyes" share one continuous push-in. */
export const CLOSE_RUN: Move = {...CLOSE, span: ["lo", "khoc"]};
export const CLOSER: Move = {scale: [1.9, 2.35], origin: "51% 62%", y: [-320, -360]};

/** Face region in `face.mp4` (Stay, 95s-112s): she stands next to a stack of boxes. */
export const CLIP_FACE: Blob = {x: 0.5, y: 0.33, rx: 0.2, ry: 0.11};

/** Face region in `walk.mp4`: she walks backward through a doorway, the face drifts from right to left. */
const WALK_T = [0.1, 0.5, 0.9, 1.3, 1.7, 2.1, 2.35];
const clampAll = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
export const walkFace = (sec: number): Blob => ({
  x: interpolate(sec, WALK_T, [0.83, 0.69, 0.55, 0.54, 0.49, 0.46, 0.39], clampAll),
  y: interpolate(sec, WALK_T, [0.6, 0.39, 0.52, 0.43, 0.47, 0.46, 0.43], clampAll),
  // At the start of the clip she is close to the camera so the face is big, and the blur region grows with it.
  rx: interpolate(sec, [0.1, 0.9, 1.3], [0.24, 0.2, 0.15], clampAll),
  ry: interpolate(sec, [0.1, 0.9, 1.3], [0.15, 0.12, 0.09], clampAll),
});
