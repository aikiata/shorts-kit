import React from "react";
import {PromoTemplate} from "../../shared/frame/PromoTemplate";
import {frameAtScene} from "../../shared/promo";
import {DEFAULT_PALETTE} from "../../shared/theme";
import {HITS, scenes} from "./scenes";
import {FPS, PROMO, VOICE_CLIPS, sceneFrom, wordIn} from "./timing";

/**
 * Sound (docs/promo/sound.md): one sound per cut, never stacked; the repeated explanations alternate two
 * samples and step down in volume (S2); the slam is the only hard hit and the music is cut to silence after
 * it; the payoff lands on the spoken word "sources". All cues are pinned to a scene, never to a bare frame.
 */
const at = (id: string, f: number) => sceneFrom(id) + f;
const AGAIN = HITS.map((s, i) => ({at: at("again", s), id: (i % 2 ? "tick" : "pop") as "tick" | "pop", volume: 0.4 - (0.22 * i) / (HITS.length - 1)}));
const SFX = [
  {at: at("monday", 130), id: "ding" as const, volume: 0.22},
  {at: at("friday", 122), id: "pop" as const, volume: 0.3},
  ...AGAIN,
  {at: at("slam", 0), id: "boom" as const, volume: 0.5},
  {at: at("reveal", 112), id: "pop" as const, volume: 0.28},
  ...[158, 176, 194].map((f, i) => ({at: at("reveal", f), id: "tick" as const, volume: 0.36 - 0.07 * i})),
  {at: at("payoff", wordIn("payoff", "v4", "sources")), id: "ding" as const, volume: 0.32},
  {at: at("lockup", wordIn("lockup", "v5", "line") + 10), id: "ding" as const, volume: 0.35},
];

export const Video: React.FC<{safe: boolean}> = ({safe}) => (
  <PromoTemplate
    promo={PROMO}
    fps={FPS}
    scenes={scenes}
    palette={DEFAULT_PALETTE}
    safe={safe}
    sfx={SFX}
    voiceClips={VOICE_CLIPS}
    musicSilence={[[frameAtScene(PROMO, FPS, "slam", 0), frameAtScene(PROMO, FPS, "reveal", 0)]]}
  />
);
