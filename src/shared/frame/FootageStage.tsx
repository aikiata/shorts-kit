import React from "react";
import {AbsoluteFill, Freeze, interpolate, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {clamp} from "../motion/anim";
import {W} from "../theme";

export type FootageJoin = {at: number; db?: number; kind?: "cut" | "gap"};

/** The face band of a take, in frame pixels: narration.json → `face` (§5j). */
export type FaceBand = {top: number; bottom: number};

/**
 * The filmed take as the background of a talking-head video (§5j). Pass it to
 * ShortsTemplate as `background`; the voice plays from voice.json's audio, so
 * the video itself is muted.
 *
 * - **Jump cuts read as edits, not glitches**: after every join that removed
 *   words the framing alternates between `1` and `punch`, so the person seems
 *   to have changed shot, not twitched. A join that only shortened a silence
 *   keeps the framing.
 * - **No frame stands still (§12)**: a slow push over the whole video, toward the face.
 * - **Effects get a readable band**: `scrim` darkens [from, to] (frame pixels),
 *   the band where this video's effects live. Never over the face.
 */
export const FootageStage: React.FC<{
  /** Path under public/, from footage.json → `video`. */
  src: string;
  /** Length of the cut video, seconds (footage.json → `duration`). The outro hold freezes its last frame. */
  duration: number;
  joins?: readonly FootageJoin[];
  /** The face band; the punch and the push zoom toward its centre. */
  face?: FaceBand;
  /** Zoom of the alternate framing after a cut. */
  punch?: number;
  scrim?: {from: number; to: number; strength?: number};
}> = ({src, duration, joins = [], face, punch = 1.1, scrim}) => {
  const frame = useCurrentFrame();
  const {fps, height, durationInFrames} = useVideoConfig();
  const t = frame / fps;
  const last = Math.max(1, Math.floor(duration * fps));
  const cutsSoFar = joins.filter((j) => (j.kind ?? "cut") === "cut" && j.at <= t + 1e-6).length;
  const framing = cutsSoFar % 2 === 1 ? punch : 1;
  const push = interpolate(frame, [0, durationInFrames], [1, 1.04], clamp);
  const originY = face ? ((face.top + face.bottom) / 2 / height) * 100 : 40;
  // Before `bun run cut`, footage.json is a placeholder: show black, not a crash.
  if (!src) return <AbsoluteFill style={{backgroundColor: "#000"}} />;
  const video = <OffthreadVideo src={staticFile(src)} muted style={{width: W, height: "100%", objectFit: "cover"}} />;
  const k = scrim?.strength ?? 0.55;
  const fadeLen = 140;
  return (
    <AbsoluteFill style={{backgroundColor: "#000", overflow: "hidden"}}>
      <AbsoluteFill style={{transform: `scale(${framing * push})`, transformOrigin: `50% ${originY}%`}}>
        {frame < last ? video : <Freeze frame={last - 1}>{video}</Freeze>}
      </AbsoluteFill>
      {scrim ? (
        <AbsoluteFill
          style={{
            background: `linear-gradient(rgba(0,0,0,0) ${scrim.from - fadeLen}px, rgba(0,0,0,${k}) ${scrim.from}px, rgba(0,0,0,${k}) ${scrim.to}px, rgba(0,0,0,0) ${scrim.to + fadeLen}px)`,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
