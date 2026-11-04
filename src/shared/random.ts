/**
 * Seeded pseudo-random number in [0, 1). The same seed always gives the same
 * value, so every frame and every re-render draws identically (never use
 * `Math.random()` in a scene). Offset seeds per property: `rnd(i)`, `rnd(i + 50)`.
 */
export const rnd = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** A safe id for SVG `url(#...)` references, built from React's `useId()`. */
export const svgId = (reactId: string, prefix: string) => `${prefix}-${reactId.replace(/[^a-zA-Z0-9]/g, "")}`;
