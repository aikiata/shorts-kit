import React from "react";
import {PromoTemplate} from "../../shared/frame/PromoTemplate";
import {DEFAULT_PALETTE} from "../../shared/theme";
import {scenes} from "./scenes";
import {FPS, PROMO} from "./timing";

/** The promo: shared frame + this video's scenes. `safe` draws the safe zones (stills only). */
export const Video: React.FC<{safe: boolean}> = ({safe}) => (
  <PromoTemplate promo={PROMO} fps={FPS} scenes={scenes} palette={DEFAULT_PALETTE} safe={safe} />
);
