/** Small colour helpers for SVG and CSS. Hex input is `#RRGGBB`. */

export type Rgb = [number, number, number];

/** `#RRGGBB` → `[r, g, b]` (0–255). */
export const hexRgb = (hex: string): Rgb => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Hex colour with an alpha, as a CSS `rgba(...)` string. */
export const rgba = (hex: string, a: number) => `rgba(${hexRgb(hex).join(",")},${a})`;

/** Mix two hex colours: k = 0 gives `a`, k = 1 gives `b`. */
export const mixHex = (a: string, b: string, k: number) => {
  const [x, y] = [hexRgb(a), hexRgb(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(",")})`;
};

/** Multiply each channel by `k` (a colour grade), e.g. `[0.32, 0.42, 0.6]` for moonlight. */
export const tintHex = (hex: string, k: Rgb) =>
  `rgb(${hexRgb(hex).map((v, i) => Math.round(Math.min(255, v * k[i]))).join(",")})`;
