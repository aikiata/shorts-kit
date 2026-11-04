import React from "react";
import {AbsoluteFill} from "remotion";
import {H, W} from "../theme";
import {HORIZON, SKIES, type SkyKind, type SkyPreset} from "./skies";

/** Resolve a sky name or a custom preset to its colours. */
export const skyPreset = (sky: SkyKind | SkyPreset) => (typeof sky === "string" ? SKIES[sky] : sky);

/** Gradient sky down to the horizon, sea colour below it. Draw first, under Clouds and Sea. */
export const Sky: React.FC<{sky: SkyKind | SkyPreset; horizon?: number}> = ({sky, horizon = HORIZON}) => {
  const s = skyPreset(sky);
  const k = (horizon / H) * 100;
  return (
    <AbsoluteFill
      style={{width: W, height: H, background: `linear-gradient(to bottom, ${s.top} 0%, ${s.low} ${k}%, ${s.sea} ${k}%, ${s.deep} 100%)`}}
    />
  );
};
