/**
 * Ground colours for land scenes, one per `SkyKind`, so a land shot also only
 * has to say `sky: "dusk"`. Sky colours come from `SKIES`; this adds the land.
 */
import type {SkyKind} from "./skies";

export type GroundPreset = {
  /** Land just below the horizon (and the far tree line, darkened). */
  far: string;
  /** Mid ground. */
  ground: string;
  /** Foreground at the bottom of the frame (and tall grass). */
  near: string;
};

export const GROUNDS: Record<SkyKind, GroundPreset> = {
  day: {far: "#8FA56B", ground: "#7C9450", near: "#4F6A30"},
  harsh: {far: "#A9B375", ground: "#8E9C55", near: "#5C7234"},
  storm: {far: "#4E5A46", ground: "#3E4A36", near: "#262E20"},
  grey: {far: "#5E6A55", ground: "#4E5A3E", near: "#323C28"},
  dusk: {far: "#5C4B47", ground: "#4A4433", near: "#2B2C1E"},
  night: {far: "#1A2430", ground: "#141C22", near: "#0B1015"},
  dawn: {far: "#6E7058", ground: "#5E6A44", near: "#38452A"},
};
