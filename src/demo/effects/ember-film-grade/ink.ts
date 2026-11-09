import type {Palette} from "../../shared/theme";

/** The video's palette: charcoal black background, fire accent (Prometheus's flame). */
export const INK = {
  bg: "#0a0705",
  text: "#FFFFFF",
  muted: "rgba(255,255,255,0.62)",
  fire: "#FFB347",
  ember: "#FF6A2B",
  shadow: "0 0 40px rgba(0,0,0,0.9), 0 8px 30px rgba(0,0,0,0.9)",
} as const;

/** Palette for the shared captions: the word being read is coloured fire. */
export const EMBER: Palette = {
  bg: "#0a0705",
  deep: "#1a100a",
  surface: "#2a1a10",
  accent: INK.fire,
  accentSoft: "#FFD9A0",
  good: "#B7E04B",
  warn: "#FFCC00",
  bad: "#FF3B30",
  text: "#FFFFFF",
  muted: "#D9C4B0",
  faint: "#8A7462",
};
