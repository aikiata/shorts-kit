import React from "react";
import {AbsoluteFill, Html5Audio, interpolate, Sequence, staticFile, useCurrentFrame} from "remotion";
import {BackgroundMusic} from "../audio/BackgroundMusic";
import {Sfx, type SfxCue} from "../audio/Sfx";
import {Captions} from "../caption/Captions";
import {clamp} from "../motion/anim";
import type {Palette} from "../theme";
import {sceneTimings, wordsInScene, type SceneWord, type Voice} from "../timings";
import {Backdrop} from "./Backdrop";
import {SafeZones} from "./SafeZones";
import {Watermark} from "./Watermark";

export type SceneProps = {
  id: string;
  /** Absolute first frame of the scene. */
  from: number;
  /** Scene length in frames (from the voice). */
  duration: number;
  /** The scene's words, in frames relative to the scene start. */
  words: SceneWord[];
  palette: Palette;
};

export type SceneComponent = React.FC<SceneProps>;

/** Frames a scene overlaps the next one while the next fades in. */
const XFADE = 8;

const FadeIn: React.FC<{frames: number; children: React.ReactNode}> = ({frames, children}) => {
  const frame = useCurrentFrame();
  const k = frames > 0 ? interpolate(frame, [0, frames], [0, 1], clamp) : 1;
  return <AbsoluteFill style={{opacity: k}}>{children}</AbsoluteFill>;
};

/**
 * The frame every short shares. It holds the rules that broke when each video
 * copied this JSX by hand:
 *
 * 1. scene length comes from voice.json, never from a number typed in a scene;
 * 2. a scene id in the script without a component is an error, not a black gap;
 * 3. captions keep their max width and bottom band (§7);
 * 4. the watermark renders AFTER the scene sequences, or scenes paint over it;
 * 5. the music is silent before the outro hold (§8).
 *
 * It does not choose shots or pace. That is each video's job.
 */
export const ShortsTemplate: React.FC<{
  voice: Voice;
  fps: number;
  /** Silent hold after the last word, seconds. */
  outroHold: number;
  scenes: Record<string, SceneComponent>;
  palette: Palette;
  safe?: boolean;
  captions?: boolean;
  watermark?: string;
  music?: {src: string; volume?: number; loop?: boolean};
  /** Sound-effect cues, rendered at the root so a cue on a scene boundary is not cut. */
  sfx?: readonly SfxCue[];
  /** Drawn under every scene. Defaults to the shared Backdrop; pass null for none. */
  background?: React.ReactNode;
}> = ({voice, fps, outroHold, scenes, palette, safe = false, captions = true, watermark, music, sfx, background}) => {
  const timings = sceneTimings(voice, fps, outroHold);
  for (const t of timings) {
    if (!scenes[t.id]) {
      throw new Error(`Scene "${t.id}" is in voice.json but has no component in scenes.tsx.`);
    }
  }
  return (
    <AbsoluteFill style={{backgroundColor: palette.bg}}>
      {background === undefined ? <Backdrop palette={palette} /> : background}
      {voice.audio ? <Html5Audio src={staticFile(voice.audio)} /> : null}
      {music ? <BackgroundMusic src={music.src} volume={music.volume} loop={music.loop} voice={voice} /> : null}
      {sfx?.length ? <Sfx cues={sfx} /> : null}
      {timings.map((t, i) => {
        const Scene = scenes[t.id];
        const last = i === timings.length - 1;
        return (
          <Sequence key={t.id} from={t.from} durationInFrames={t.duration + (last ? 0 : XFADE)} name={t.id}>
            <FadeIn frames={i === 0 ? 0 : XFADE}>
              <Scene id={t.id} from={t.from} duration={t.duration} words={wordsInScene(voice, fps, t)} palette={palette} />
            </FadeIn>
          </Sequence>
        );
      })}
      {captions ? <Captions voice={voice} palette={palette} /> : null}
      {watermark ? <Watermark text={watermark} palette={palette} /> : null}
      {safe ? <SafeZones /> : null}
    </AbsoluteFill>
  );
};
