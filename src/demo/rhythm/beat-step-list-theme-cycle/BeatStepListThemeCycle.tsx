// beat-step-list-theme-cycle (bear 22.3-24.6s): a three-channel metronome. The adjective list moves up one row per beat,
// a fixed capsule at viewport center "catches" the new word and changes color, and the whole stage background changes color on the same beat; row / color / stage share one beat point.
//
// Second redesign (look = custom "five dark-stage skins", the theme-preset piece of shorts-kit):
// - Layout is now one sentence: a static light-weight "Make it" on the left (132px / 300) + the adjective in a 960px capsule on the right (132px),
//   reading as "Make it modern -> playful -> expressive -> BOLD -> yours.", with the last beat landing on the slogan.
// - Each theme = capsule color + stage background color + text color on the capsule + **font character of the selected word** (sans-serif / rounded /
//   serif italic / all-caps Futura), all jumping on one beat, so the skin change reads as "one product, many personalities", not just a color swap.
// - The capsule is a "lens": outside it is a uniform dim-white sans-serif list; inside it is a clipped copy of the same list (dark text + theme font),
//   so a word changes color and font only once it crosses the capsule edge, and no glitch shows a word turning dark before it enters the capsule. Capsule width follows the selected word
//   measured text width (same tInBeat interpolation), no longer a long bar that is half empty.
// - The stage is not a flat fill: background + a large same-hue capsule glow (changes color on the same clock) + top-left cool white key light + vignette + grain;
//   list opacity / font size / blur falls off by row distance from viewport center (scroll-wheel depth of field), and the beat head jump carries vertical motion blur.
// - A fourth echo on the element layer: the top-right "THEME 03 / 05" counter and the bottom-left five color swatches both switch state on the same integer beat.
//
// Timeline (30fps, 140f total):
//   0-16    intro: "Make it" and the list rise from blurred to sharp, the capsule expands horizontally (snappy)
//   16-30   setup rest (very slow push 1.0->1.03 throughout), the viewer reads "this is a list"
//   30/48/66/84  four beats (BEAT_LEN 18f ~ 100BPM): 6f steep ease-out jump + squash at the beat head, 12f rest for the remainder
//   84-96   last-beat aftermath: slogan line "Your product, in motion." rises word by word
//   96-140  hold: rests on the final poster of "Make it yours." yellow / deep navy
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { FONT, Grain, SpeedBlur, Vignette, mix, ramp, velocity, EASE } from '../../../shared/fixtures/Polish';
import { SERIF, TextReveal, alpha } from '../../../shared/fixtures/Look';
import { PITCH, ShortKitWordmark } from '../../../shared/fixtures/Brand';

export const BEAT_STEP_LIST_THEME_CYCLE_DURATION = 140; // setup 30f + 4 beats x 18f + 38f hold after the last beat

const ROW_H = 176;
const FS = 132; // adjective font size
const CY = 520; // viewport center row (slightly above the frame midline, leaving room for the bottom swatches / slogan)
// Two unselected words padded above and two below: modern is at center at the first beat, and words still pad below at the last beat (yours.)
const WORDS = ['minimal', 'clean', 'modern', 'playful', 'expressive', 'bold', 'yours.', 'timeless', 'quiet'];
const START_IDX = 2; // modern

// Beat point: ~0.6s per beat = 18 frames
const BEAT_LEN = 18;
const FIRST_BEAT = 30;
const N_BEATS = 4;
const JUMP = 6; // jump window: 6f at the beat head, the other 12f fully at rest

// Layout: "Make it" + capsule are centered horizontally as a whole by the median capsule width; capsule width follows the selected word (same clock interpolation)
const PILL_H = 156;
const PAD_L = 64; // left padding inside the capsule
const PAD_R = 76; // right padding slightly larger (visual centering: lowercase words have side bearing whitespace on the right)
const LEAD_W = 470; // width reserved for "Make it"
const GAP = 34;
const MID_PILL = 560;
const LEFT = (1920 - (LEAD_W + GAP + MID_PILL)) / 2; // 428
const PILL_X = LEFT + LEAD_W + GAP; // 932
const WORD_X = PILL_X + PAD_L; // left-aligned start point inside the capsule
const MARGIN = 128; // safe margin for corner info

// Word layout box: full row height, left-aligned, vertically centered (shared by the outer list and the capsule lens, so the two layers coincide pixel by pixel)
const wordBox: React.CSSProperties = {
  position: 'absolute', top: 0, height: ROW_H, display: 'flex', alignItems: 'center',
  fontSize: FS, lineHeight: 1, letterSpacing: '-0.035em', whiteSpace: 'nowrap', transformOrigin: '0% 50%',
};

// Theme fonts (system font stack; ui-rounded does not work in Chrome, so rounded uses Arial Rounded; falls back to sans-serif when a font is missing)
const ROUNDED = `"Arial Rounded MT Bold", "SF Pro Rounded", ${FONT.sans}`;
const GEOMETRIC = `Futura, "Avenir Next", ${FONT.sans}`;

// ink = measured text width of the selected word (measured on a 1080p rendered frame, 132px), capsule width = ink + left/right padding
type Theme = { name: string; pill: string; bg: string; ink: string; inkW: number; font: React.CSSProperties };
// Start state + four beats; adjacent backgrounds share lightness with different hues (all dark stages at ~ L6-9), and the capsule color and background color are a matched light/dark pair
const THEMES: Theme[] = [
  { name: 'Bone', pill: '#ece6da', bg: '#15120f', ink: '#17130f', inkW: 425, font: { fontFamily: FONT.sans, fontWeight: 700 } },
  { name: 'Tangerine', pill: '#ff8a3d', bg: '#1d0e17', ink: '#260e03', inkW: 384, font: { fontFamily: ROUNDED, fontWeight: 700, letterSpacing: '-0.03em' } },
  { name: 'Iris', pill: '#9d8aff', bg: '#0f0d25', ink: '#120b36', inkW: 540, font: { fontFamily: SERIF, fontWeight: 600, fontStyle: 'italic', letterSpacing: '-0.02em' } },
  { name: 'Mint', pill: '#38d690', bg: '#06181a', ink: '#03150d', inkW: 376, font: { fontFamily: GEOMETRIC, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.01em' } },
  { name: 'Sun', pill: '#ffd43b', bg: '#0f1834', ink: '#1a1404', inkW: 352, font: { fontFamily: FONT.sans, fontWeight: 800 } },
];

// Jump within a beat: steep ease-out (exponent 3.2), done within 6 frames
const snap = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3.2);

const hex = (a: string) => [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
const mixRgb = (a: string, b: string, t: number) => {
  const pa = hex(a);
  const pb = hex(b);
  return pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
};
const css = (c: number[], a = 1) => (a >= 1 ? `rgb(${c.join(',')})` : `rgba(${c.join(',')},${a.toFixed(3)})`);
const lighten = (c: number[], k: number) => c.map((v) => Math.round(v + (255 - v) * k));
const darken = (c: number[], k: number) => c.map((v) => Math.round(v * (1 - k)));

// One clock: number of beats triggered + progress within the beat (the jump only takes the JUMP frames at the beat head); all three channels read from here
const clock = (frame: number) => {
  const raw = (frame - FIRST_BEAT) / BEAT_LEN;
  const beat = Math.min(N_BEATS, Math.max(0, Math.floor(raw) + 1));
  const beatStart = FIRST_BEAT + (beat - 1) * BEAT_LEN;
  const tInBeat = beat === 0 ? 1 : snap((frame - beatStart) / JUMP);
  const step = beat === 0 ? 0 : beat - 1 + tInBeat; // continuous step amount
  return { beat, tInBeat, step, sinceBeat: beat === 0 ? 99 : frame - beatStart };
};

export const BeatStepListThemeCycle: React.FC = () => {
  const frame = useCurrentFrame();
  const { beat, tInBeat, step, sinceBeat } = clock(frame);

  // Three channels: 1) list moves up one row
  const listY = -step * ROW_H;
  const vy = velocity((f) => -clock(f).step * ROW_H, frame); // px/frame, feeds motion blur

  // 2) capsule / 3) stage background color: cross-mix per channel with the same tInBeat
  const prev = THEMES[Math.max(0, beat - 1)];
  const now = THEMES[beat];
  const mixT = beat === 0 ? 1 : tInBeat;
  const pill = mixRgb(prev.pill, now.pill, mixT);
  const bg = mixRgb(prev.bg, now.bg, mixT);
  const bgColor = css(bg);
  const pillW = mix(prev.inkW, now.inkW, mixT) + PAD_L + PAD_R;

  // Capsule landing squash: vertical 1.14->0.96->1, horizontal in opposite phase 0.97->1.01->1 (a volume-preserving feel), finishing within the 6f beat head
  const sy = beat === 0 ? 1 : interpolate(tInBeat, [0, 0.6, 1], [1.14, 0.96, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const sx = beat === 0 ? 1 : interpolate(tInBeat, [0, 0.6, 1], [0.97, 1.01, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // At the catch moment the capsule brightens and the glow surges, then recovers exponentially over 8f
  const hit = beat === 0 ? 0 : Math.exp(-sinceBeat / 3.2);

  // Intro (0-16f): capsule expands horizontally, text goes from blurred to sharp
  const open = ramp(frame, 2, 16, EASE.snappy);
  const listIn = ramp(frame, 4, 18, EASE.out);

  // Very slow push throughout (1.0->1.03, smooth start and end with no velocity jump)
  const cam = mix(1, 1.03, ramp(frame, 0, BEAT_STEP_LIST_THEME_CYCLE_DURATION, EASE.smooth));

  const listPos = START_IDX + step; // continuous row number at viewport center

  // Last-beat aftermath: slogan rises word by word
  const LAST = FIRST_BEAT + (N_BEATS - 1) * BEAT_LEN;

  return (
    <AbsoluteFill style={{ background: bgColor, overflow: 'hidden', fontFamily: FONT.sans }}>
      {/* Stage: top-left cool white key light + large same-hue capsule glow (changes color on the same clock) */}
      <AbsoluteFill style={{
        background:
          `radial-gradient(ellipse 60% 70% at 62% ${(CY / 1080) * 100}%, ${css(pill, 0.2 + 0.06 * hit)} 0%, ${css(pill, 0.06)} 45%, ${css(pill, 0)} 75%),` +
          `radial-gradient(ellipse 55% 55% at 18% 0%, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 70%)`,
      }} />

      <AbsoluteFill style={{ transform: `scale(${cam})`, transformOrigin: `${PILL_X}px ${CY}px` }}>
        {/* Word list (outside the capsule): uniform dim-white sans-serif, falling off by row distance; the beat head jump carries vertical motion blur, and rest frames carry no filter */}
        <SpeedBlur vx={0} vy={vy} amount={0.16} max={9}>
          <div style={{
            position: 'absolute', left: 0, right: 0, top: CY - ROW_H / 2 - START_IDX * ROW_H,
            transform: `translateY(${(listY + (1 - listIn) * 40).toFixed(2)}px)`,
          }}>
            {WORDS.map((w, i) => {
              const d = Math.abs(i - listPos); // rows away from viewport center (continuous value)
              const op = Math.max(0, 0.42 - 0.15 * Math.max(0, d - 1)) * listIn;
              const sc = 1 - Math.min(0.14, 0.05 * Math.max(0, d - 0.5));
              const blur = Math.max(0, d - 1.2) * 3.5 + (1 - listIn) * 10;
              return (
                <div key={w} style={{ height: ROW_H, position: 'relative' }}>
                  <span style={{
                    ...wordBox, left: WORD_X, fontFamily: FONT.sans, fontWeight: 700,
                    color: `rgba(255,255,255,${op.toFixed(3)})`,
                    transform: `scale(${sc.toFixed(4)})`,
                    filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined,
                  }}>{w}</span>
                </div>
              );
            })}
          </div>
        </SpeedBlur>

        {/* Fixed capsule at center = lens: the list scrolls beneath it, and inside the capsule is a clipped copy of the same list (dark text + that word theme font),
              the text color / font changes only the moment a word crosses the capsule edge; visually "the capsule jumps to the next row and catches the new word" */}
        <div style={{
          position: 'absolute', left: PILL_X, top: CY - PILL_H / 2, width: pillW, height: PILL_H,
          transformOrigin: '0% 50%', transform: `scale(${(sx * mix(0.55, 1, open)).toFixed(4)}, ${sy.toFixed(4)})`,
          opacity: Math.min(1, open * 2.5), borderRadius: PILL_H / 2, overflow: 'hidden',
          background: `linear-gradient(180deg, ${css(lighten(pill, 0.16 + 0.07 * hit))} 0%, ${css(lighten(pill, 0.03 * hit))} 50%, ${css(darken(pill, 0.1))} 100%)`,
          boxShadow: [
            'inset 0 2px 0 rgba(255,255,255,0.5)',
            'inset 0 -3px 8px rgba(0,0,0,0.12)',
            '0 3px 6px rgba(0,0,0,0.35)',
            `0 30px 90px -20px ${css(pill, 0.5 + 0.25 * hit)}`,
            `0 0 ${(40 + 60 * hit).toFixed(1)}px ${css(pill, 0.18 + 0.2 * hit)}`,
          ].join(', '),
        }}>
          <SpeedBlur vx={0} vy={vy} amount={0.16} max={9}>
            <div style={{
              position: 'absolute', left: 0, right: 0, top: PILL_H / 2 - ROW_H / 2 - START_IDX * ROW_H,
              transform: `translateY(${listY.toFixed(2)}px)`,
            }}>
              {WORDS.map((w, i) => {
                const k = i - START_IDX;
                const th = k >= 0 && k < THEMES.length ? THEMES[k] : null;
                return (
                  <div key={w} style={{ height: ROW_H, position: 'relative' }}>
                    <span style={{
                      ...wordBox, left: PAD_L, fontFamily: FONT.sans, fontWeight: 700, ...(th ? th.font : null),
                      color: th ? th.ink : THEMES[0].ink, opacity: Math.min(1, open * 2),
                    }}>{w}</span>
                  </div>
                );
              })}
            </div>
          </SpeedBlur>
          {/* Capsule top lighting: a soft highlight hugging the top edge, laid over the text so the text sits "inside the capsule" */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: PILL_H * 0.45, background: 'linear-gradient(rgba(255,255,255,0.18), rgba(255,255,255,0))', pointerEvents: 'none' }} />
        </div>

        {/* "Make it": a static anchor, light weight + right-aligned against the capsule */}
        <div style={{
          position: 'absolute', left: LEFT, width: LEAD_W, top: CY - FS * 0.62, textAlign: 'right',
          fontSize: FS, fontWeight: 300, letterSpacing: '-0.035em', lineHeight: 1.2, color: 'rgba(255,255,255,0.94)',
          whiteSpace: 'nowrap',
        }}>
          <TextReveal text="Make it" by="word" variant="blur" start={2} each={16} gap={4} />
        </div>
      </AbsoluteFill>

      {/* Viewport top/bottom feather: color syncs with bgColor in real time, so scene changes show no glitch */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 300, background: `linear-gradient(${bgColor} 34%, ${css(bg, 0)})` }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 330, background: `linear-gradient(${css(bg, 0)}, ${bgColor} 62%)` }} />

      {/* Top bar: brand + theme counter (hooked to the same integer beat, scrolling one notch vertically in the 6f beat head) */}
      <div style={{ position: 'absolute', left: MARGIN, top: 96, opacity: ramp(frame, 0, 12, EASE.out) }}>
        <ShortKitWordmark size={30} markScale={1.6} gap={14} tone="dark" />
      </div>
      <div style={{
        position: 'absolute', right: MARGIN, top: 98, display: 'flex', alignItems: 'baseline', gap: 18,
        opacity: ramp(frame, 0, 12, EASE.out), fontVariantNumeric: 'tabular-nums',
      }}>
        <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.5)' }}>THEME</span>
        <span style={{ display: 'inline-block', height: 38, overflow: 'hidden', fontFamily: FONT.mono, fontSize: 32, fontWeight: 500, color: '#fff' }}>
          <span style={{ display: 'block', transform: `translateY(${(-(beat - 1 + (beat === 0 ? 1 : tInBeat)) * 38).toFixed(2)}px)` }}>
            {THEMES.map((_, k) => <span key={k} style={{ display: 'block', height: 38, lineHeight: '38px' }}>{String(k + 1).padStart(2, '0')}</span>)}
          </span>
        </span>
        <span style={{ fontFamily: FONT.mono, fontSize: 32, color: 'rgba(255,255,255,0.4)' }}>/ 05</span>
      </div>

      {/* Bottom-left: five color swatches, the current theme enlarged + ringed (integer beat switches state, springing into place in the 6f beat head) */}
      <div style={{ position: 'absolute', left: MARGIN, top: 900, display: 'flex', alignItems: 'center', gap: 22 }}>
        {THEMES.map((t, k) => {
          const cur = k === beat;
          const pop = cur ? (beat === 0 ? 1 : interpolate(tInBeat, [0, 0.6, 1], [0.7, 1.12, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })) : 1;
          const appear = ramp(frame, 6 + k * 2, 12, EASE.overshoot);
          return (
            <div key={t.name} style={{
              width: 46, height: 46, borderRadius: 23, background: t.pill,
              transform: `scale(${((cur ? 1 : 0.62) * pop * appear).toFixed(4)})`, opacity: cur ? 1 : k < beat ? 0.55 : 0.32,
              boxShadow: cur ? `0 0 0 5px ${bgColor}, 0 0 0 7px rgba(255,255,255,0.85), 0 0 30px ${alpha(t.pill, 0.6)}` : 'none',
            }} />
          );
        })}
        <span style={{
          marginLeft: 18, fontSize: 32, fontWeight: 600, color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.01em',
          opacity: ramp(frame, 8, 12, EASE.out),
        }}>{now.name}</span>
      </div>

      {/* Last-beat aftermath: slogan rises word by word, right-aligned to the capsule right edge */}
      <div style={{
        position: 'absolute', right: MARGIN, top: 896, fontSize: 40, fontWeight: 500,
        color: 'rgba(255,255,255,0.72)', letterSpacing: '-0.015em', whiteSpace: 'nowrap',
      }}>
        <TextReveal text={PITCH.en.taglines[5]} by="word" variant="rise" start={LAST + 6} each={16} gap={3} />
      </div>

      <Vignette strength={0.5} inner={0.42} color="#020306" />
      <Grain opacity={0.09} blend="soft-light" />
    </AbsoluteFill>
  );
};
