// Karaoke fill sync (karaoke-fill-sync): whichever word the narration is reading gets filled bright from left to right.
// A two-line centered tagline "FRAME MOTION / CRAFT SHOTS" (a four-word version of the shorts-kit phrase Frame motion. Craft the shot.),
// each word is two stacked layers of the same text: the bottom layer is low-opacity ink for unread text,
// the top layer uses a mask revealed linearly by in-word progress (each word has its own independent overlay, the reveal percentage is the in-word progress, no need to measure word width;
// the reveal front is a ±4% soft edge rather than a hard cut). The word being read is filled with the accent color, and within 10f after being read it fades to the primary ink color:
// the accent color belongs only to "right now". Word-level timing simulates speech rate: FRAME 20–38, MOTION 42–75 (long word, read slowly),
// CRAFT 85–103, SHOTS 107–130, with pauses between words (breaths).
// Reading pointer: under the word being filled, an 8px accent rounded underline whose right edge follows the fill front; after the word is read it retracts from left to right (6f), leaving no line.
// At the bottom a narration waveform serves as a silent-preview reference: swells within words, drops at breaths, the played portion is tinted.
// 0–19f hold; 130–149f truly still (the final fade-out / line retraction finishes before f140).
import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { G } from '../../../shared/fixtures/Fixtures';
import { Backdrop, EASE, FONT, ramp, tracking } from '../../../shared/fixtures/Polish';

export const KARAOKE_FILL_SYNC_DURATION = 150;

type Word = { text: string; start: number; end: number };

const LINES: Word[][] = [
  [
    { text: 'FRAME', start: 20, end: 38 },
    { text: 'MOTION', start: 42, end: 75 },
  ],
  [
    { text: 'CRAFT', start: 85, end: 103 },
    { text: 'SHOTS', start: 107, end: 130 },
  ],
];
const ALL = LINES.flat();
const SIZE = 150;
const FEATHER = 4; // soft edge of the reveal front (%)
const ACC = [91, 99, 211]; // G.accent
const INK = [23, 24, 28]; // G.ink1

const rgbMix = (a: number[], b: number[], k: number) =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;

const KaraokeWord: React.FC<{ word: Word; frame: number }> = ({ word, frame }) => {
  // In-word linear fill progress, clamp keeps it held once read (follows speech rate, no easing)
  const p = interpolate(frame, [word.start, word.end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const edge = p * (100 + FEATHER * 2) - FEATHER; // soft-edge center (%), fully hidden / fully revealed at p=0/1
  const mask = `linear-gradient(90deg, #000 ${(edge - FEATHER).toFixed(2)}%, transparent ${(edge + FEATHER).toFixed(2)}%)`;
  const settle = ramp(frame, word.end, 10, EASE.out); // fade to the primary ink color once read
  const fillColor = rgbMix(ACC, INK, settle);
  // Reading pointer: follows the front while reading, retracts from left to right 6f after the word is read
  const retract = ramp(frame, word.end, 6, EASE.swift);
  const showLine = frame >= word.start && retract < 1;
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      {/* Bottom layer: low-opacity ink for unread text */}
      <span style={{ color: 'rgba(23,24,28,0.13)' }}>{word.text}</span>
      {/* Top layer: soft-edge reveal from left to right by progress */}
      {p > 0 && (
        <span style={{
          position: 'absolute', inset: 0, color: fillColor,
          WebkitMaskImage: mask, maskImage: mask,
        }}>
          {word.text}
        </span>
      )}
      {/* Reading pointer underline: right edge follows the fill front, retracts from the left once read */}
      {showLine && (
        <span style={{
          position: 'absolute', bottom: -6, height: 8, borderRadius: 4,
          left: `${(retract * p * 100).toFixed(2)}%`,
          width: `${(Math.max(0, p - retract * p) * 100).toFixed(2)}%`,
          background: G.accent, boxShadow: '0 2px 10px rgba(91,99,211,0.35)',
        }} />
      )}
    </span>
  );
};

// Narration waveform: 48 vertical bars, envelope by "whether a word is being read right now", deterministic hash for the variation
const BARS = 48;
const WAVE_W = 560;
const WAVE_T0 = 14;
const WAVE_T1 = 136;
const h = (n: number) => {
  const s = Math.sin(n * 91.7 + 13.1) * 43758.5453;
  return s - Math.floor(s);
};
const speechAt = (f: number) => {
  let e = 0.06;
  for (const w of ALL) {
    const fadeIn = ramp(f, w.start - 2, 3, EASE.out);
    const fadeOut = 1 - ramp(f, w.end - 2, 4, EASE.out);
    e = Math.max(e, fadeIn * fadeOut);
  }
  return e;
};

export const KaraokeFillSync: React.FC = () => {
  const frame = useCurrentFrame();
  const playhead = (frame - WAVE_T0) / (WAVE_T1 - WAVE_T0);
  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden', fontFamily: FONT.sans }}>
      <Backdrop tone="light" light={{ x: 0.5, y: 0.22 }} accent="#5b63d3" />

      {/* Tagline: two lines centered */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 0, bottom: 60,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontSize: SIZE, fontWeight: 800, letterSpacing: tracking(SIZE, true), lineHeight: 1.18,
      }}>
        {LINES.map((words, li) => (
          <div key={li} style={{ display: 'flex', gap: 56 }}>
            {words.map((w) => (
              <KaraokeWord key={w.text} word={w} frame={frame} />
            ))}
          </div>
        ))}
      </div>

      {/* Narration waveform: played portion in accent color, unplayed portion in light ink */}
      <div style={{
        position: 'absolute', left: 960 - WAVE_W / 2, top: 860, width: WAVE_W, height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {Array.from({ length: BARS }, (_, i) => {
          const u = i / (BARS - 1);
          const at = WAVE_T0 + u * (WAVE_T1 - WAVE_T0); // the narration moment this bar corresponds to
          const env = speechAt(at);
          const amp = 0.12 + env * (0.35 + 0.65 * h(i * 3 + 1));
          const played = u <= playhead;
          return (
            <div key={i} style={{
              width: 4, height: `${(amp * 100).toFixed(1)}%`, borderRadius: 2,
              background: played ? G.accent : 'rgba(23,24,28,0.16)',
              opacity: played ? 0.9 : 1,
            }} />
          );
        })}
      </div>
    </div>
  );
};
