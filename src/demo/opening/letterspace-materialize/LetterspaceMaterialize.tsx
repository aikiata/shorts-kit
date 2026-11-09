// letterspace-materialize v3: revised per the batch 11 user feedback (superhuman screenshots, 4 of them):
// ① Glyph proportions made wider: v2 was tall and narrow (60x100); against the end-state screenshot glyph height ≈50 / glyph width ≈58 (aspect ≈1.15),
//    v3 redraws all skeleton glyphs into a 78x64 viewbox (glyph face 58x54), squarish and slightly wide + thin strokes + wide letter-spacing;
// ② All letters start at the same time and finish at the same time: v2's per-letter stagger (PER/jitter) is removed, every character starts drawing on the same frame,
//    and pathLength normalization makes letters with strokes of different lengths finish on the same frame (the full-row parallel half-drawn state of screenshots 2/3).
// v4 texture: the backdrop is reworked from "three blurred color blobs" into a dusk lake scene: layered sky gradient + two procedural ridge layers (atmospheric perspective: far pale, near dark)
//    + a wide horizon glow (spreads past the frame so neither end of the band shows) + water (sky reflection + slowly drifting fine glints) + a wordmark reflection on the water;
//    grain prevents gradient banding; the background pushes in very slowly by 3% (far/near mountains at different speeds, slight parallax), the wordmark itself does not move.
// Brand round: SUPERHUMAN → shorts-kit (all-lowercase wordmark), the glyph library is replaced by 13 geometric lowercase skeleton glyphs (see GLYPHS),
//    draw rhythm, synchronized finish, backdrop and duration unchanged.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { bezier, ramp, EASE, Grain, Vignette } from '../../../shared/fixtures/Polish';

// Brand round: the wordmark becomes shorts-kit (the brand spec requires all lowercase), and the skeleton glyphs are redrawn as geometric lowercase single-line type.
// Unified 64-tall viewbox: baseline y=59, x-height y=22, ascender y=5 (same height as the original uppercase face), each glyph has its own width w;
// rendered scaled up overall by ×GLYPH_SCALE (lowercase x-height is shorter than uppercase; after scaling it has the same presence as the original SUPERHUMAN wordmark and a similar overall row width),
// stroke width is scaled inversely, so on screen it is still a 5.5px thin line. Sub-stroke order = draw order.
const GLYPHS: Record<string, { w: number; d: string }> = {
  v: { w: 42, d: 'M 4 22 L 21 59 L 38 22' },
  i: { w: 14, d: 'M 7 22 L 7 59 M 7 9.5 L 7 10' },
  d: { w: 46, d: 'M 41.5 40.5 A 18.5 18.5 0 0 0 4.5 40.5 A 18.5 18.5 0 0 0 41.5 40.5 M 41.5 5 L 41.5 59' },
  e: { w: 46, d: 'M 4.5 40.5 L 41.5 40.5 A 18.5 18.5 0 1 0 37.2 52.4' },
  o: { w: 46, d: 'M 23 22 A 18.5 18.5 0 0 0 23 59 A 18.5 18.5 0 0 0 23 22' },
  '-': { w: 28, d: 'M 5 41 L 23 41' },
  s: { w: 39, d: 'M 32.6 27.5 C 26.4 21.3, 7.9 20.6, 6.2 28.9 C 4.6 36.4, 14.1 38.4, 19.7 39.8 C 25.8 41.2, 34.8 43.9, 33.1 51.5 C 31.4 59, 9.6 60.4, 4 52.8' },
  h: { w: 41, d: 'M 5 5 L 5 59 M 5 38 C 5 27, 12 22, 20.5 22 C 30 22, 36 27, 36 37 L 36 59' },
  t: { w: 26, d: 'M 12 8 L 12 59 M 3 22 L 23 22' },
  c: { w: 42, d: 'M 37.2 28.6 A 18.5 18.5 0 1 0 37.2 52.4' },
  r: { w: 28, d: 'M 5 22 L 5 59 M 5 38 C 5 27, 13 22, 24 23' },
  a: { w: 46, d: 'M 41.5 40.5 A 18.5 18.5 0 0 0 4.5 40.5 A 18.5 18.5 0 0 0 41.5 40.5 M 41.5 22 L 41.5 59' },
  f: { w: 26, d: 'M 23 7 C 17 4, 11 6, 11 14 L 11 59 M 3 22 L 22 22' },
};

const WORD = 'shorts-kit';
const GLYPH_SCALE = 1.3; // viewbox → screen scale factor
const GLYPH_H = 64 * GLYPH_SCALE; // glyph row height (screen px)
const TRACK = 30; // letter-spacing (screen px): wide letter-spacing is this card's identity
const START = 16;   // frame on which all characters start drawing (no stagger)
const DUR = 52;     // frames for all characters to finish drawing (pathLength normalized → finish on the same frame)
export const LETTERSPACE_MATERIALIZE_DURATION = 105; // rest 16f + draw 52f + end-state hold 37f (>1s, R1)

const HORIZON = 640; // horizon y
const MARK_Y = 470; // wordmark center y (in the glow zone, above the horizon)
// draw curve: slow start, fast middle, slightly longer finish (handwriting: pen down → stroke → lift)
const strokeEase = bezier(0.5, 0, 0.3, 1);

// procedural ridges: deterministic outlines from layered sines (no random source)
const ridge = (seed: number, base: number, amp: number) => {
  const pts: string[] = [];
  for (let x = -60; x <= 1980; x += 20) {
    const y =
      base -
      amp * (0.55 * Math.sin(x / 233 + seed) + 0.3 * Math.sin(x / 97 + seed * 2.1) + 0.15 * Math.sin(x / 41 + seed * 3.7) + 0.6);
    pts.push(`${x},${y.toFixed(1)}`);
  }
  return `M -60 ${HORIZON + 2} L ${pts.join(' L ')} L 1980 ${HORIZON + 2} Z`;
};
const FAR_RIDGE = ridge(1.3, HORIZON, 70);
const NEAR_RIDGE = ridge(4.1, HORIZON + 2, 34);

// fine glints on the water: a deterministic set of short horizontal bright lines, slowly drifting left and right
const GLINTS = Array.from({ length: 22 }, (_, i) => {
  const s = Math.sin(i * 91.7) * 43758.5453;
  const r = s - Math.floor(s);
  const s2 = Math.sin(i * 47.3 + 5) * 24634.6345;
  const r2 = s2 - Math.floor(s2);
  const depth = (i + 0.5) / 22; // 0 = near the horizon, 1 = near the bottom of the frame
  return {
    y: HORIZON + 8 + depth * depth * 400,
    x: 960 + (r - 0.5) * (500 + depth * 1100),
    w: 40 + r2 * 120 + depth * 160,
    a: 0.05 + (1 - depth) * 0.12,
    ph: r * 6.28,
  };
});

const Word: React.FC<{ e: number; glowAmt: number }> = ({ e, glowAmt }) => (
  <div style={{ display: 'flex', gap: TRACK, alignItems: 'center' }}>
    {WORD.split('').map((ch, li) => {
      const g = GLYPHS[ch];
      return (
        <svg key={li} width={g.w * GLYPH_SCALE} height={GLYPH_H} viewBox={`0 0 ${g.w} 64`} style={{ overflow: 'visible', display: 'block' }}>
          {e > 0 && (
            <path
              d={g.d}
              fill="none"
              stroke="#f6f3fa"
              strokeWidth={5.5 / GLYPH_SCALE}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - e}
              style={{
                filter: `drop-shadow(0 0 ${(5 + glowAmt * 10) / GLYPH_SCALE}px rgba(245,225,240,${0.3 + glowAmt * 0.38}))`,
              }}
            />
          )}
        </svg>
      );
    })}
  </div>
);

export const LetterspaceMaterialize: React.FC = () => {
  const frame = useCurrentFrame();

  // all characters share the same progress: start together, finish together
  const e = ramp(frame, START, DUR, strokeEase);
  // a slight brighten-and-settle at the instant drawing completes (crystallization closing in), same frame for all characters; builds brightness over the last 30% of the stroke
  const rise = ramp(frame, START + DUR * 0.7, DUR * 0.3, EASE.swift);
  const fall = 1 - ramp(frame, START + DUR, 14, EASE.out);
  const glowAmt = e >= 1 ? fall : rise;

  // background pushes in very slowly: far mountains 1→1.02, near ground/water 1→1.035 (slight parallax); the wordmark stays still
  const push = ramp(frame, 0, LETTERSPACE_MATERIALIZE_DURATION, EASE.smooth);
  const sFar = 1 + 0.02 * push;
  const sNear = 1 + 0.035 * push;
  // the glow brightens slightly with the crystallization (the wordmark "lights up" the edge of the sky)
  const dawn = 0.85 + 0.15 * ramp(frame, START + DUR * 0.5, DUR, EASE.out);

  return (
    <AbsoluteFill style={{ background: '#120f24', overflow: 'hidden' }}>
      {/* sky + far mountains (far layer) */}
      <AbsoluteFill style={{ transform: `scale(${sFar})`, transformOrigin: `50% ${HORIZON}px` }}>
        <AbsoluteFill
          style={{
            background:
              `linear-gradient(180deg, #17153a 0%, #24204f 24%, #3a2f63 42%, #5f4270 53%, #8a5878 ${((HORIZON - 14) / 1080) * 100}%, #1c1838 ${(HORIZON / 1080) * 100}%, #0b0a17 100%)`,
          }}
        />
        {/* wide horizon glow: ellipse spreads past the frame, no break at either end */}
        <div
          style={{
            position: 'absolute', left: -480, right: -480, top: HORIZON - 260, height: 520, opacity: dawn,
            background: 'radial-gradient(ellipse 50% 50% at 54% 50%, rgba(246,168,170,0.42) 0%, rgba(214,130,160,0.2) 35%, rgba(140,100,170,0.06) 65%, rgba(0,0,0,0) 80%)',
          }}
        />
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <linearGradient id="lm-far" x1="0" y1={HORIZON - 120} x2="0" y2={HORIZON} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#5a4473" />
              <stop offset="1" stopColor="#3e3260" />
            </linearGradient>
          </defs>
          {/* far mountains: brighter and more glow-tinted (atmospheric perspective) */}
          <path d={FAR_RIDGE} fill="url(#lm-far)" opacity={0.75} style={{ filter: 'blur(1.2px)' }} />
        </svg>
      </AbsoluteFill>

      {/* near mountains + water (near layer, pushes in faster) */}
      <AbsoluteFill style={{ transform: `scale(${sNear})`, transformOrigin: `50% ${HORIZON}px` }}>
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          <path d={NEAR_RIDGE} fill="#271f43" />
        </svg>
        {/* water: sky reflection (the glow stretches and fades in the water) + gradually deepening to the bottom of the frame */}
        <div
          style={{
            position: 'absolute', left: 0, right: 0, top: HORIZON, bottom: 0,
            background:
              'radial-gradient(ellipse 46% 40% at 54% 0%, rgba(230,150,165,0.22) 0%, rgba(150,105,160,0.08) 50%, rgba(0,0,0,0) 80%), ' +
              'linear-gradient(180deg, #2a2346 0%, #18142e 30%, #0d0b1a 100%)',
          }}
        />
        {/* a very thin bright edge on the waterline */}
        <div
          style={{
            position: 'absolute', left: 0, right: 0, top: HORIZON - 1, height: 2,
            background: 'linear-gradient(90deg, rgba(255,200,210,0) 8%, rgba(255,200,210,0.35) 54%, rgba(255,200,210,0) 92%)',
          }}
        />
        {/* fine glints: drifting slowly */}
        {GLINTS.map((g, i) => (
          <div
            key={i}
            style={{
              position: 'absolute', top: g.y, height: 1.5, borderRadius: 1, width: g.w,
              left: g.x - g.w / 2 + Math.sin(frame / 38 + g.ph) * 14,
              background: `linear-gradient(90deg, rgba(255,215,225,0), rgba(255,215,225,${(g.a * (0.75 + 0.25 * Math.sin(frame / 23 + g.ph))).toFixed(3)}), rgba(255,215,225,0))`,
            }}
          />
        ))}
      </AbsoluteFill>

      {/* wordmark water reflection: mirrored on the waterline axis, low opacity + slightly blurred + fading out downward */}
      <div
        style={{
          position: 'absolute', left: 0, right: 0, top: 2 * HORIZON - MARK_Y - GLYPH_H / 2, height: GLYPH_H,
          display: 'flex', justifyContent: 'center',
          transform: 'scaleY(-1)', opacity: 0.12, filter: 'blur(2.4px)',
          WebkitMaskImage: 'linear-gradient(0deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.2) 100%)',
          maskImage: 'linear-gradient(0deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.2) 100%)',
        }}
      >
        <Word e={e} glowAmt={glowAmt * 0.5} />
      </div>

      {/* wide-spaced wordmark: all characters drawn in parallel, continuously */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: MARK_Y - GLYPH_H / 2, height: GLYPH_H, display: 'flex', justifyContent: 'center' }}>
        <Word e={e} glowAmt={glowAmt} />
      </div>

      <Vignette strength={0.45} inner={0.5} color="#05040c" cy={0.5} />
      <Grain opacity={0.08} blend="soft-light" />
    </AbsoluteFill>
  );
};
