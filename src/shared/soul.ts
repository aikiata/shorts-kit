/**
 * The numbers from `docs/soul/thresholds.json` that the frame itself needs
 * (safe zones, caption geometry, audio fades). Read from the same file the
 * linter reads, so a channel that changes a threshold changes the picture too.
 */
import thresholds from "../../docs/soul/thresholds.json";

type Entry = {value: unknown};
const raw = thresholds as unknown as Record<string, Entry>;

const value = <T>(key: string, fallback: T): T => {
  const entry = raw[key];
  return entry && entry.value !== undefined ? (entry.value as T) : fallback;
};

export const SOUL = {
  safeTopPx: value("safeTopPx", 212),
  safeBottomPx: value("safeBottomPx", 1726),
  safeRightPx: value<{x: number; fromY: number}>("safeRightPx", {x: 927, fromY: 803}),
  safeLandscapeMarginPct: value("safeLandscapeMarginPct", 0.05),
  captionBottomShareLandscape: value("captionBottomShareLandscape", 0.12),
  captionMaxWidthLandscapePx: value("captionMaxWidthLandscapePx", 1400),
  panelMaxWidthPx: value("panelMaxWidthPx", 774),
  captionWordsPerChunk: value<[number, number]>("captionWordsPerChunk", [2, 4]),
  captionBottomShare: value("captionBottomShare", 0.24),
  captionSecondLangMaxLines: value("captionSecondLangMaxLines", 2),
  musicFadeOutSeconds: value("musicFadeOutSeconds", 9),
  outroHoldSeconds: value<[number, number]>("outroHoldSeconds", [3, 4]),
  coverCropRatio: value("coverCropRatio", 1.29),
} as const;
