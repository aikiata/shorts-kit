/**
 * Palette for the low-poly "explainer 3D" look: ONE blue-grey family for the whole
 * world, with ONE accent (orange) for what the narration points at. Scenery never
 * uses the accent. `blue` exists only for callouts/measurements (a second entity).
 *
 * Calm and dark on purpose: low contrast, haze hides the distance, trees are
 * silhouettes, and the hero object carries the detail and the accent.
 */
export const LOWPOLY = {
  /** Zenith colour of the sky dome. */
  sky: '#141E28',
  /** Horizon haze = fog colour. */
  skyLow: '#3A4E60',
  ground: '#2C3945',
  groundAlt: '#33414D',
  asphalt: '#1B232C',
  marking: '#AAB7C3',
  body: '#B9C4CF',
  bodyShade: '#7F8FA0',
  dark: '#0E141B',
  tree: '#0F161D',
  /** The one accent. */
  orange: '#FF8A2A',
  /** Callouts / measurements only. */
  blue: '#3FA7FF',
} as const;

export type LowPolyPalette = typeof LOWPOLY;
