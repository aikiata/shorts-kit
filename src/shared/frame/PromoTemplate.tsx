import React from "react";
import {AbsoluteFill, Html5Audio, interpolate, Sequence, staticFile, useCurrentFrame} from "remotion";
import {Sfx, type SfxCue} from "../audio/Sfx";
import {clamp} from "../motion/anim";
import {promoFrames, promoTimings, assertPromo, type Promo} from "../promo";
import type {Palette} from "../theme";
import {Backdrop} from "./Backdrop";
import type {SceneComponent} from "./ShortsTemplate";
import {SafeZones} from "./SafeZones";

const FadeIn: React.FC<{frames: number; children: React.ReactNode}> = ({frames, children}) => {
  const frame = useCurrentFrame();
  const k = frames > 0 ? interpolate(frame, [0, frames], [0, 1], clamp) : 1;
  return <AbsoluteFill style={{opacity: k}}>{children}</AbsoluteFill>;
};

/** One spoken line, already placed: absolute first frame and length in frames. */
export type VoiceClip = {src: string; at: number; frames: number; volume?: number};

const RAMP = 4; // frames: a duck or a mute never steps

/** 1 inside a window, ramping to 0 outside it over RAMP frames. */
const near = (f: number, a: number, b: number) => (f < a ? interpolate(f, [a - RAMP, a], [0, 1], clamp) : f > b ? interpolate(f, [b, b + RAMP], [1, 0], clamp) : 1);

const Music: React.FC<{promo: Promo; fps: number; total: number; clips: readonly VoiceClip[]; silence: readonly (readonly [number, number])[]; duck: number}> = ({promo, fps, total, clips, silence, duck}) => {
  const m = promo.music!;
  const fadeIn = Math.round((m.fadeIn ?? 0.3) * fps);
  const fadeOut = Math.round((m.fadeOut ?? 1.5) * fps);
  const every = m.repeatEvery ? Math.round(m.repeatEvery * fps) : 0;
  const xf = Math.round((m.crossfade ?? 1.9) * fps);
  const copies = every ? Math.ceil(total / every) : 1;
  // the level of the whole bed at an absolute frame: fades, the duck under a spoken line, the held silences
  const level = (f: number) => {
    let voice = 0;
    for (const c of clips) voice = Math.max(voice, near(f, c.at, c.at + c.frames));
    let mute = 0;
    for (const [a, b] of silence) mute = Math.max(mute, near(f, a, b));
    return (m.volume ?? 0.8) * (fadeIn > 0 ? interpolate(f, [0, fadeIn], [0, 1], clamp) : 1) * (fadeOut > 0 ? interpolate(f, [total - fadeOut, total], [1, 0], clamp) : 1) * (1 - (1 - duck) * voice) * (1 - mute);
  };
  return (
    <>
      {Array.from({length: copies}, (_, k) => {
        const from = k * every;
        // copy k fades in over the crossfade (k > 0) and out as the next copy comes in
        const edge = (f: number) => (k > 0 ? interpolate(f, [from, from + xf], [0, 1], clamp) : 1) * (k + 1 < copies ? interpolate(f, [from + every, from + every + xf], [1, 0], clamp) : 1);
        return (
          <Sequence key={k} from={from} name={`music ${k + 1}`}>
            <Html5Audio src={staticFile(m.src)} volume={(lf) => level(from + lf) * edge(from + lf)} trimBefore={Math.round((m.start ?? 0) * fps)} />
          </Sequence>
        );
      })}
    </>
  );
};

/**
 * The frame of a promo with no voice (docs/promo/). Scene length comes from
 * promo.json (seconds or beats), never from voice.json. No captions: a promo
 * puts its words in scenes. It keeps the three guards ShortsTemplate has:
 * a scene id without a component is an error, the sfx render at the root so a
 * cue on a boundary is not cut, and the safe overlay is stills-only.
 */
export const PromoTemplate: React.FC<{
  promo: Promo;
  fps: number;
  scenes: Record<string, SceneComponent>;
  palette: Palette;
  safe?: boolean;
  sfx?: readonly SfxCue[];
  /** Spoken lines already placed on the timeline (see `voiceLineFrame`). */
  voiceClips?: readonly VoiceClip[];
  /** Frame ranges where the music is cut to silence (a held breath before a release). */
  musicSilence?: readonly (readonly [number, number])[];
  /** Music level while a line is spoken, as a multiplier. */
  duck?: number;
  /** Drawn under every scene. Defaults to the shared Backdrop; pass null for none. */
  background?: React.ReactNode;
}> = ({promo, fps, scenes, palette, safe = false, sfx, voiceClips = [], musicSilence = [], duck = 0.5, background}) => {
  assertPromo(promo);
  const timings = promoTimings(promo, fps);
  const total = promoFrames(promo, fps);
  for (const t of timings) {
    if (!scenes[t.id]) throw new Error(`Scene "${t.id}" is in promo.json but has no component in scenes.tsx.`);
  }
  return (
    <AbsoluteFill style={{backgroundColor: palette.bg}}>
      {background === undefined ? <Backdrop palette={palette} /> : background}
      {promo.music ? <Music promo={promo} fps={fps} total={total} clips={voiceClips} silence={musicSilence} duck={duck} /> : null}
      {voiceClips.map((c) => (
        <Sequence key={c.src} from={c.at} durationInFrames={c.frames} name={`voice ${c.src}`}>
          <Html5Audio src={staticFile(c.src)} volume={c.volume ?? 1} />
        </Sequence>
      ))}
      {sfx?.length ? <Sfx cues={sfx} /> : null}
      {timings.map((t, i) => {
        const Scene = scenes[t.id];
        const fade = i === 0 ? 0 : promo.scenes[i].fade ?? promo.fade ?? 0;
        const nextFade = i + 1 < timings.length ? promo.scenes[i + 1].fade ?? promo.fade ?? 0 : 0;
        return (
          <Sequence key={t.id} from={t.from} durationInFrames={t.duration + nextFade} name={t.id}>
            <FadeIn frames={fade}>
              <Scene id={t.id} from={t.from} duration={t.duration} words={[]} palette={palette} />
            </FadeIn>
          </Sequence>
        );
      })}
      {safe ? <SafeZones /> : null}
    </AbsoluteFill>
  );
};
