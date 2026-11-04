/**
 * Weather presets for illustrated scenes. One `SkyKind` picks the colours of
 * the sky, the sea, the clouds, the light on the water and the grade for the
 * figures, so a scene config only has to say `sky: "dusk"`.
 */
import type {Rgb} from "../color";

export type SkyKind = "day" | "harsh" | "storm" | "grey" | "dusk" | "night" | "dawn";

/** Default horizon y on the 1080×1920 frame. Every nature component takes `horizon` as a prop. */
export const HORIZON = 880;

export type SkyPreset = {
  /** Sky colour at the top of the frame. */
  top: string;
  /** Sky colour at the horizon (also used for haze and wave crests). */
  low: string;
  /** Sea colour just below the horizon. */
  sea: string;
  /** Sea colour at the bottom of the frame. */
  deep: string;
  /** Wave strength: 1 is a calm day, 3 is a storm. */
  wave: number;
  /** How much light reaches the water (crests, streaks). */
  light: number;
};

export const SKIES: Record<SkyKind, SkyPreset> = {
  day: {top: "#2F7DB5", low: "#BFE3F2", sea: "#1D6E93", deep: "#082D44", wave: 1, light: 1},
  harsh: {top: "#5FA9D6", low: "#F6F0D2", sea: "#2A86A8", deep: "#0B3A52", wave: 0.6, light: 1.1},
  storm: {top: "#1E262C", low: "#55626A", sea: "#22353F", deep: "#071319", wave: 3.2, light: 0.55},
  grey: {top: "#45545D", low: "#8F9CA3", sea: "#2D4B5A", deep: "#0B1E27", wave: 1.8, light: 0.75},
  dusk: {top: "#251F4A", low: "#E07A4F", sea: "#2A3556", deep: "#0A1022", wave: 0.8, light: 0.7},
  night: {top: "#03070F", low: "#0E1F3A", sea: "#0A1A2C", deep: "#010509", wave: 0.7, light: 0.4},
  dawn: {top: "#1F315A", low: "#F3A86A", sea: "#2B5373", deep: "#0A1D2E", wave: 0.8, light: 0.85},
};

export type CloudPreset = {
  /** Number of clouds. */
  n: number;
  /** Colour of the cloud top. */
  body: string;
  /** Colour of the underside (catches the low sun at dusk and dawn). */
  belly: string;
  /** Opacity. */
  a: number;
};

export const CLOUDS: Record<SkyKind, CloudPreset> = {
  day: {n: 6, body: "#FFFFFF", belly: "#D6E6EE", a: 0.75},
  harsh: {n: 2, body: "#FFFFFF", belly: "#F1EEDC", a: 0.5},
  storm: {n: 9, body: "#2A333A", belly: "#11181D", a: 0.95},
  grey: {n: 8, body: "#7D8A91", belly: "#55626A", a: 0.85},
  dusk: {n: 6, body: "#4B3A66", belly: "#F08A5D", a: 0.85},
  night: {n: 4, body: "#16253D", belly: "#0B1526", a: 0.7},
  dawn: {n: 6, body: "#5A5878", belly: "#FFB27F", a: 0.85},
};

export type LightPreset = {
  /** Light source position (sun or moon). */
  x: number;
  y: number;
  /** Colour of the glitter path on the water. */
  glint: string;
  /** Glitter opacity. */
  a: number;
};

/** Light source per sky; storm and grey have none (no glitter). Dusk sits on the horizon. */
export const lightFor = (sky: SkyKind, horizon = HORIZON): LightPreset | null => {
  switch (sky) {
    case "day":
      return {x: 900, y: horizon - 180, glint: "#FFF6D6", a: 0.55};
    case "harsh":
      return {x: 900, y: horizon - 180, glint: "#FFFBEA", a: 0.85};
    case "dawn":
      return {x: 900, y: horizon - 180, glint: "#FFD19A", a: 0.8};
    case "dusk":
      return {x: 250, y: horizon + 18, glint: "#FFB070", a: 0.9};
    case "night":
      return {x: 878, y: horizon - 192, glint: "#DDE8FF", a: 0.6};
    default:
      return null;
  }
};

export type Grade = {
  /** Per-channel multiplier applied to a figure's colours. */
  k: Rgb;
  /** Rim light colour toward the light source, if the sky is dark enough to need one. */
  rim?: string;
};

/** Tint figures to the sky (illustrated-scene rule 6), or they look pasted on. */
export const GRADES: Record<SkyKind, Grade> = {
  day: {k: [1, 1, 1]},
  harsh: {k: [1.04, 1, 0.9]},
  storm: {k: [0.5, 0.57, 0.62]},
  grey: {k: [0.72, 0.78, 0.82]},
  dusk: {k: [0.8, 0.56, 0.55], rim: "#FFB27A"},
  night: {k: [0.32, 0.42, 0.6], rim: "#BFD6F2"},
  dawn: {k: [0.96, 0.8, 0.72], rim: "#FFD2A0"},
};

/** A silhouette against a bright light (a big moon): near black, with a rim. */
export const silhouette = (rim: string): Grade => ({k: [0.06, 0.08, 0.11], rim});
