// text-column-converge: remake of raycast-teams (measured footage, 28-36s segment):
// Measurements of the original (1280 wide): NEW's left edge is pinned at x=412, the feature word's right edge at x=867,
// both words are equally far from the screen edges (412 vs 413), and the gap never shrinks during the rotation;
// only after the word changes to RAYCAST does the single convergence happen: about 1.2s of continuous ease-in-out sliding
// (left edge 412→554 / right edge 867→725), "NEW RAYCAST" settles centered on the screen midline;
// about 0.6s after settling, the italic "COMING 2026" appears below almost as a hard cut.
// (The above is the measurement record of the original; the demo content is now shorts-kit: feature words rotate → converge into "NEW shorts-kit",
//  the small line is the second half of the brand phrase "CRAFT THE SHOT."; the convergence endpoint is recomputed from the wordmark's character count.)
//
// Quality upgrades (beat / pinning / single convergence all unchanged):
// - The dark field is no longer a dead-black #050506: a cool-tinted deep base + a very faint top light above the midline + vignette + soft-light grain.
// - 1 frame of brightening at each word change (the typewriter line-swap feel of the original; more than 1f reads as a glitch, so only 1f).
// - During the rotation NEW is a secondary gray (like a catalog page label), and brightens with progress during convergence to match the feature word's color: the two halves become one sentence.
// - The convergence slide applies horizontal motion blur by real speed (the two words move in opposite directions), 0 at rest; after settling a soft glow behind lights up slightly.
// - The italic small line drops to the tertiary color for a clear hierarchy; added an exported duration constant (the original workbench inferred 16f, leaving only the first half second).
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { FONT, Grain, SpeedBlur, Vignette, ramp, EASE } from '../../../shared/fixtures/Polish';

// Word rotation table: uneven dwell frame counts (machine rhythm), pinned to the right edge throughout, no gap shrinking
// Content switched to shorts-kit: eight feature words rotate, the last word is the all-lowercase wordmark shorts-kit (wordmark rule: never all caps)
const BRAND_WORD = 'shorts-kit';
const STEPS: { word: string; dur: number }[] = [
  { word: 'SHOT RECIPE CARDS', dur: 16 },
  { word: 'PAGE CAPTURES', dur: 12 },
  { word: '2.5D CAMERA MOVES', dur: 9 },
  { word: 'BEAT-SYNCED CUTS', dur: 8 },
  { word: 'FILM-GRADE SFX', dur: 7 },
  { word: 'MOTION WORKBENCH', dur: 8 },
  { word: 'REMOTION RENDER', dur: 10 },
  { word: 'JIANYING EXPORT', dur: 12 },
  { word: BRAND_WORD, dur: 999 }, // last word: once settled, triggers the single convergence
];

const START = 8; // opening black field, held still

// Original 1280 wide → 1920 wide conversion (×1.5)
const NEW_LEFT_EDGE = 618; // 412×1.5: NEW's left edge (= left screen margin)
const WORD_RIGHT_EDGE = 1302; // 868×1.5: feature word's right edge (= right screen margin, 1920-1302=618 symmetric)

const FS = 42; // the original's glyphs are very small (cap ~20px at 720p → ~30px at 1080p → font size ~42)
const LSP = 3; // letterSpacing
// The convergence endpoint is computed from this font's actual advance (monospace: 0.6em + letterSpacing),
// so "NEW shorts-kit" meshes with exactly one space and the whole line is centered on 960, with no overlap
const ADV = 0.6 * FS + LSP; // advance per character
const LINE_W = (4 + BRAND_WORD.length) * ADV; // "NEW " + wordmark, 19 characters in total
const MERGED_LEFT = 960 - LINE_W / 2; // NEW's left edge after convergence
const MERGED_RIGHT = 960 + LINE_W / 2; // wordmark's right edge after convergence
const CONVERGE_DUR = 36; // convergence duration: original ~1.2s ≈ 36 frames
const CONVERGE_DELAY = 10; // after the wordmark settles, rest 10 frames before converging (original 32.4→32.7s)
const SUB_DELAY = 18; // ~0.6s after convergence settles, the italic small line appears

// 8f black field + 82f rotation + 10f settle + 36f converge + 18f hold + 4f small line + 22f rest = 180f (6.0s)
export const TEXT_COLUMN_CONVERGE_DURATION = 180;

const INK = '#eeeef2';
const INK_NEW = '#8a8c96'; // NEW's secondary gray during the rotation
const INK_SUB = '#a3a5ae';

// Convergence progress (frame as the independent variable, used to derive speed)
const LAST_START = START + STEPS.slice(0, -1).reduce((a, s) => a + s.dur, 0);
const cvAt = (frame: number) =>
  interpolate(frame - LAST_START - CONVERGE_DELAY, [0, CONVERGE_DUR], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

// Simple hex color mixing (NEW brightens from the secondary gray to the primary color)
const mixHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, k) => Math.round(v + (pb[k] - v) * t)).join(',')})`;
};

export const TextColumnConverge: React.FC = () => {
  const f = useCurrentFrame();
  const t = f - START;

  // Locate the current step
  let acc = 0;
  let idx = 0;
  let stepStart = 0;
  for (let i = 0; i < STEPS.length; i++) {
    if (t >= acc) { idx = i; stepStart = acc; }
    acc += STEPS[i].dur;
  }
  const cur = STEPS[idx];
  const isLast = idx === STEPS.length - 1;
  const local = t - stepStart;

  // The single convergence: CONVERGE_DELAY frames after the wordmark settles, continuous ease-in-out slide
  const cvT = isLast ? local - CONVERGE_DELAY : -1;
  const cv = interpolate(cvT, [0, CONVERGE_DUR], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  // NEW left edge: 618 → 692; feature word right edge: 1302 → 1228
  const newLeft = interpolate(cv, [0, 1], [NEW_LEFT_EDGE, MERGED_LEFT]);
  const wordRight = interpolate(cv, [0, 1], [WORD_RIGHT_EDGE, MERGED_RIGHT]);

  const converged = cv >= 1;

  // Italic small line: SUB_DELAY frames after convergence settles, almost a hard cut (4-frame quick fade-in, no displacement)
  const subT = converged ? cvT - CONVERGE_DUR - SUB_DELAY : -1;
  const subOp = interpolate(subT, [0, 4], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const visible = t >= 0;

  const font: React.CSSProperties = {
    fontFamily: FONT.mono,
    fontWeight: 500,
    fontSize: FS,
    letterSpacing: LSP,
    color: INK,
    whiteSpace: 'nowrap',
    lineHeight: 1,
  };

  // 1 frame of brightening at each word change (the first word does not flash)
  const flash = local === 0 && idx > 0 ? 1 : 0;
  const wordColor = flash ? '#ffffff' : INK;
  const wordGlow = flash ? '0 0 14px rgba(200,210,255,0.35)' : 'none';

  // Convergence speed (px/frame) → horizontal motion blur; the two words move toward each other
  const span = MERGED_LEFT - NEW_LEFT_EDGE;
  const v = (cvAt(f + 0.5) - cvAt(f - 0.5)) * span;
  // Soft glow behind after settling
  const glow = ramp(cvT, CONVERGE_DUR - 6, 24, EASE.out);

  return (
    <AbsoluteFill style={{ background: '#08090c', overflow: 'hidden' }}>
      {/* Cool-tinted deep base + very faint top light above the midline */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 60% 55% at 50% 40%, rgba(120,130,170,0.10), rgba(120,130,170,0) 70%), ' +
            'linear-gradient(180deg, #0d0e12 0%, #08090c 60%, #060709 100%)',
        }}
      />
      {/* Soft glow behind lights up slightly after convergence settles */}
      <div
        style={{
          position: 'absolute', left: 960 - 520, top: 540 - 150, width: 1040, height: 300,
          background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(170,180,230,0.10), rgba(170,180,230,0) 70%)',
          opacity: glow,
        }}
      />
      {visible && (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* NEW: positioned by left edge (pinned at the left screen margin during the rotation); brightens from the secondary gray with the convergence */}
          <SpeedBlur vx={v} amount={0.35} max={4}>
            <div style={{
              ...font, position: 'absolute',
              left: newLeft, top: 519,
              color: mixHex(INK_NEW, INK, ramp(cvT, 0, CONVERGE_DUR * 0.8, EASE.smooth)),
            }}>
              NEW
            </div>
          </SpeedBlur>
          {/* Feature word: positioned by right edge (the right edge stays fixed whether the word gets longer or shorter) */}
          <SpeedBlur vx={-v} amount={0.35} max={4}>
            <div style={{
              ...font, position: 'absolute',
              right: 1920 - wordRight, top: 519,
              color: wordColor, textShadow: wordGlow,
            }}>
              {cur.word}
            </div>
          </SpeedBlur>

          {/* Italic small line: appears right below the whole line after convergence, sharing the whole line's left edge */}
          <div style={{
            ...font,
            fontStyle: 'italic',
            color: INK_SUB,
            position: 'absolute',
            left: MERGED_LEFT, top: 519 + FS + 14,
            opacity: subOp,
          }}>
            CRAFT THE SHOT.
          </div>
        </div>
      )}
      <Vignette strength={0.5} inner={0.45} color="#000000" />
      <Grain opacity={0.07} blend="soft-light" />
    </AbsoluteFill>
  );
};
