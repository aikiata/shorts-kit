import React from "react";
import {ShortsTemplate} from "../../shared/frame/ShortsTemplate";
import {DEFAULT_PALETTE} from "../../shared/theme";
import {scenes} from "./scenes";
import {FPS, OUTRO_HOLD, VOICE} from "./timing";

/** The video: shared frame + this video's scenes. `safe` draws the safe zones (stills only). */
export const Video: React.FC<{safe: boolean}> = ({safe}) => (
  <ShortsTemplate voice={VOICE} fps={FPS} outroHold={OUTRO_HOLD} scenes={scenes} palette={DEFAULT_PALETTE} safe={safe} />
);
