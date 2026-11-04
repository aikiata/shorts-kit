import React from "react";
import type {SfxCue} from "../../shared/audio/Sfx";
import {ShortsTemplate} from "../../shared/frame/ShortsTemplate";
import {DEFAULT_PALETTE} from "../../shared/theme";
import {frameAtWord} from "../../shared/timings";
import {scenes} from "./scenes";
import {FPS, OUTRO_HOLD, VOICE} from "./timing";
import {World} from "./World";

/** Cue a sound on the word that earns it; `frameAtWord` throws if the word leaves the script (docs/sfx.md). */
const cue = (scene: string, word: string, nth?: number) => frameAtWord(VOICE, FPS, scene, word, nth);

/** Two accents: `pop` when the blue wave's label appears, `ding` when the payoff lands. */
const SFX_CUES: SfxCue[] = [
  {at: cue("layer1", "shorter"), id: "pop"},
  {at: cue("payoff", "paler"), id: "ding"},
];

/** The video: shared frame + one held sky (World) + this video's overlays. `safe` draws the safe zones (stills only). */
export const Video: React.FC<{safe: boolean}> = ({safe}) => (
  <ShortsTemplate
    voice={VOICE}
    fps={FPS}
    outroHold={OUTRO_HOLD}
    scenes={scenes}
    palette={DEFAULT_PALETTE}
    safe={safe}
    background={<World />}
    watermark="shorts-kit"
    sfx={SFX_CUES}
  />
);
