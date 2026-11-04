/**
 * Main islands of the Hoàng Sa (Paracel) and Trường Sa (Spratly) archipelagos,
 * `[lon, lat]` degrees, with Vietnamese and English names. Plain data (no React),
 * so scripts can import it. Drawn by `<Archipelagos>` (../archipelagos.tsx).
 * Provenance: ./README.md.
 */
export type ArchId = "hoangsa" | "truongsa";

/** The main islands of each archipelago, `[lon, lat]`, with Vietnamese and English names. */
export const ARCHIPELAGO: Record<ArchId, {vi: string; en: string; islands: readonly [number, number][]}> = {
  hoangsa: {
    vi: "Quần đảo Hoàng Sa",
    en: "Paracel Islands",
    // 11 emergent islands.
    islands: [
      [112.3472, 16.8444],
      [112.2711, 16.98],
      [112.3094, 16.9639],
      [112.7333, 16.6667],
      [111.6069, 16.5339],
      [111.5853, 16.5056],
      [111.5083, 16.4478],
      [111.7125, 16.4514],
      [111.7417, 16.4639],
      [111.7617, 16.0567],
      [111.2, 15.7833],
    ],
  },
  truongsa: {
    vi: "Quần đảo Trường Sa",
    en: "Spratly Islands",
    // The 14 largest natural islands by area.
    islands: [
      [114.3667, 10.375],
      [114.2833, 11.05],
      [115.0167, 11.0833],
      [111.9167, 8.6333],
      [114.35, 11.4667],
      [114.3333, 11.4333],
      [114.3167, 9.8667],
      [115.8167, 10.75],
      [114.4667, 10.3833],
      [114.4167, 10.6667],
      [113.8333, 7.3667],
      [114.3667, 10.1833],
      [112.9167, 7.9],
      [115.8167, 10.8167],
    ],
  },
};
