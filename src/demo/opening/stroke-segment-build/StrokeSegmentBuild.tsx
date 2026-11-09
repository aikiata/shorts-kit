// stroke-segment-build: broken strokes forming a word (Alien-style). The title is split into a dozen-plus unconnected strokes that light up in scrambled order,
// for the first 70% the word cannot be read, and the instant the last few "key segments" land, the meaning snaps into place.
//
// Second-round redesign (aurora night, neon sign):
// - look = aurora. "SHIP" is redrawn as single-line geometric letters 400px tall (S uses two opposite arcs, P has a round bowl), split into 16
//   unconnected neon tubes (electrode gaps left between tubes), mounted on a deep purple wall. Each tube "lighting up" is a neon strike:
//   on-off-on-half-on-on, a 7f flicker, then it settles at 0.58 brightness; before the reveal the whole sign is in a "half-lit fragments" state.
// - Rhythm "sparse → dense → hold breath → one, two, three → boom": the first 13 segments start on an ease-out distribution (gaps of 9f tightening to 3f),
//   then a 14f held breath (only a faint hum of tube current), and the last 3 key segments (S spine, H crossbar, P bowl bottom) drop on a 7f/6f beat,
//   on the last segment's landing frame a surge of current rushes through the whole sign: all tubes 0.58→1 and overshoot to 1.25 before falling back, the sign's own wide bloom surges once, wall and floor are lit up.
// - Space: the wall's ambient light = number of lit tubes (physics: more lamps, brighter wall); below is a bright floor that mirrors the lower half of the sign
//   (blur + fade out) + a strip of floor light; the whole shot pushes in very slowly 1→1.035.
// - The subtitle only floats up after the reveal (no spoiling early): shorts-kit wordmark (all lowercase) ● ONE PROMPT, ONE FILM.
//
// Timeline (30fps, 165f total):
//   0-12    dark wall + very faint wall light (the opening is not dead black)
//   12-72   first 13 segments light up in scrambled order, gaps 9f → 3f (faster and faster)
//   72-86   held breath 14f: nothing new is added, only the tubes hum
//   86/93/99 three key segments: S spine → H crossbar → P bowl bottom
//   105     last segment finishes striking = reveal: current surge + bloom + wall/floor light up
//   113-129 subtitle rises
//   129-165 hold: sign glows steadily, camera pushes in very slowly
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { EASE, FONT, ramp } from '../../../shared/fixtures/Polish';
import { LOOKS, Stage, alpha, stagger } from '../../../shared/fixtures/Look';
import { BRAND } from '../../../shared/fixtures/Brand';

export const STROKE_SEGMENT_BUILD_DURATION = 165;

const L = LOOKS.aurora;
const TUBE = '#ff5cab'; // tube base color (neon pink)
const GLOW = L.accent2; // bloom
const CORE = '#fff2f8'; // white-hot core

// ── glyphs: each letter 260×400, 70 between letters; single-line geometric letters, stroke width 30 ──
const LW = 260;
const LH = 400;
const ADV = LW + 70;
const WORD_W = ADV * 3 + LW; // 1250
const OX = (1920 - WORD_W) / 2;
const OY = 190;
const SW = 30;

type Seg = { d: string; key?: boolean };
const at = (k: number) => (x: number) => x + ADV * k;
const S = at(0);
const H = at(1);
const I = at(2);
const P = at(3);
const SEGS: Seg[] = [
  // S: 6 segments (two opposite arcs split apart)
  { d: `M ${S(228)} 92 C ${S(214)} 44 ${S(176)} 20 ${S(130)} 20` }, // 0 top hook
  { d: `M ${S(130)} 20 C ${S(72)} 20 ${S(34)} 54 ${S(34)} 104` }, // 1 upper-left arc
  { d: `M ${S(34)} 104 C ${S(34)} 156 ${S(78)} 178 ${S(130)} 196` }, // 2 upper spine
  { d: `M ${S(130)} 196 C ${S(186)} 214 ${S(228)} 240 ${S(228)} 296`, key: true }, // 3 lower spine (key)
  { d: `M ${S(228)} 296 C ${S(228)} 348 ${S(186)} 380 ${S(130)} 380` }, // 4 lower-right arc
  { d: `M ${S(130)} 380 C ${S(80)} 380 ${S(42)} 356 ${S(30)} 306` }, // 5 tail hook
  // H: 4 segments
  { d: `M ${H(34)} 20 L ${H(34)} 196` }, // 6 left vertical, upper
  { d: `M ${H(34)} 204 L ${H(34)} 380` }, // 7 left vertical, lower
  { d: `M ${H(226)} 20 L ${H(226)} 380` }, // 8 right vertical
  { d: `M ${H(58)} 200 L ${H(202)} 200`, key: true }, // 9 middle crossbar (key)
  // I: 2 segments
  { d: `M ${I(130)} 20 L ${I(130)} 196` }, // 10 upper
  { d: `M ${I(130)} 204 L ${I(130)} 380` }, // 11 lower
  // P: 4 segments
  { d: `M ${P(34)} 20 L ${P(34)} 196` }, // 12 vertical, upper
  { d: `M ${P(34)} 204 L ${P(34)} 380` }, // 13 vertical, lower
  { d: `M ${P(58)} 20 L ${P(140)} 20 C ${P(196)} 20 ${P(228)} 56 ${P(228)} 108` }, // 14 bowl top
  { d: `M ${P(228)} 108 C ${P(228)} 160 ${P(196)} 196 ${P(140)} 196 L ${P(58)} 196`, key: true }, // 15 bowl bottom (key)
];

// scramble table: the first 13 segments jump around across letters (unreadable), key segments (S lower spine / H crossbar / P bowl bottom) are pushed to the end
const ORDER = [14, 5, 8, 10, 0, 13, 6, 1, 11, 4, 12, 7, 2, 3, 9, 15];
const FIRST = 12;
const SPAN = 60; // start times of the first 13 segments are spread over 12-72
const KEY_AT = [86, 93, 99]; // the three beats after the 14f held breath
const STRIKE = 7; // strike duration of a single tube
const REVEAL = KEY_AT[2] + 6; // 105
const startOf = (rank: number) => (rank < 13 ? FIRST + stagger(rank, 13, SPAN, EASE.out) : KEY_AT[rank - 13]);

// neon strike: on-off-on-half-on-on → settles at 0.58 (goes to 1 after the reveal)
const strike = (f: number, s: number) =>
  interpolate(f, [s, s + 1, s + 2, s + 3, s + 4, s + 5, s + STRIKE], [0, 1, 0.12, 0.95, 0.4, 1, 0.58], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

// deterministic "current hum": very small brightness fluctuation (different phase per tube)
const hum = (f: number, i: number) => 1 + 0.035 * Math.sin(f * 0.9 + i * 2.3) * Math.sin(f * 0.37 + i);

// the reveal's "bloom once" does not draw a separate light spot, but lets the sign's own wide bloom surge with the current (the shape is the letters, Q4 only for the hero)
const Sign: React.FC<{ frame: number; surge: number; reveal: number; idPrefix: string }> = ({ frame, surge, reveal, idPrefix }) => {
  const lit = SEGS.map((seg, i) => {
    const s = startOf(ORDER.indexOf(i));
    if (frame < s) return null; // unlit segments are not rendered (truly static / no spoilers)
    const b = strike(frame, s);
    const settled = frame >= s + STRIKE;
    const level = settled ? 0.58 + 0.42 * reveal : b;
    return { i, d: seg.d, b: level * (settled ? hum(frame, i) : 1) * (1 + 0.25 * surge) };
  }).filter((x): x is NonNullable<typeof x> => x !== null);
  // electrode gap: 4% at each end of every tube is left undrawn
  const dash = { pathLength: 1, strokeDasharray: '0.92 1', strokeDashoffset: -0.04 } as const;
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      <defs>
        <filter id={`${idPrefix}w`} x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="22" /></filter>
        <filter id={`${idPrefix}n`} x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>
      <g transform={`translate(${OX} ${OY})`} fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* wide bloom (halo on the wall) */}
        <g filter={`url(#${idPrefix}w)`}>
          {lit.map((g) => <path key={g.i} d={g.d} stroke={GLOW} strokeWidth={SW + 46} opacity={Math.min(1, 0.4 * g.b + 0.4 * surge)} {...dash} />)}
        </g>
        {/* near bloom (glow around the tube) */}
        <g filter={`url(#${idPrefix}n)`}>
          {lit.map((g) => <path key={g.i} d={g.d} stroke={TUBE} strokeWidth={SW + 12} opacity={Math.min(1, 0.75 * g.b)} {...dash} />)}
        </g>
        {/* tube body + white-hot core */}
        {lit.map((g) => <path key={g.i} d={g.d} stroke={TUBE} strokeWidth={SW} opacity={Math.min(1, 0.35 + 0.65 * g.b)} {...dash} />)}
        {lit.map((g) => <path key={g.i} d={g.d} stroke={CORE} strokeWidth={SW * 0.32} opacity={Math.min(1, g.b)} {...dash} />)}
      </g>
    </svg>
  );
};

export const StrokeSegmentBuild: React.FC = () => {
  const frame = useCurrentFrame();
  const litCount = ORDER.reduce((n, _, rank) => n + (frame >= startOf(rank) + 1 ? 1 : 0), 0);
  // reveal: tubes 0.72 → 1; current surge (overshoots to 1.25 then falls back)
  const reveal = ramp(frame, REVEAL, 8, EASE.snappy);
  const surge = interpolate(frame, [REVEAL, REVEAL + 3, REVEAL + 22], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.out });
  const pulse = 1 + 0.02 * surge;
  const ambient = 0.12 + 0.5 * (litCount / SEGS.length) + 0.35 * reveal + 0.3 * surge; // wall lighting
  const push = 1 + 0.035 * ramp(frame, 0, STROKE_SEGMENT_BUILD_DURATION, EASE.smooth);
  const kicker = ramp(frame, REVEAL + 8, 16, EASE.out);

  const FLOOR = 780; // wall/floor intersection line
  return (
    <AbsoluteFill style={{ background: L.bg[2] }}>
      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: '50% 45%' }}>
        <Stage look={L} keyLight={{ x: 0.5, y: 0.0 }} fill={null} intensity={0.35} vignette={0.7}>
          {/* wall: a patch of pink-purple light from the sign (grows with the number lit) */}
          <div style={{
            position: 'absolute', left: 160, top: -40, width: 1600, height: 960, opacity: Math.min(1, ambient),
            background: `radial-gradient(ellipse 50% 46% at 50% 46%, ${alpha(GLOW, 0.28)} 0%, ${alpha(L.light, 0.12)} 45%, ${alpha(L.light, 0)} 72%)`,
          }} />
          {/* floor: one notch darker + a strip of lit band at the intersection line */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: FLOOR, bottom: 0, background: `linear-gradient(180deg, ${alpha('#05030a', 0.55)} 0%, ${alpha('#05030a', 0.85)} 100%)` }} />
          <div style={{
            position: 'absolute', left: 260, width: 1400, top: FLOOR - 40, height: 120, opacity: Math.min(1, ambient * 0.9),
            background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${alpha(GLOW, 0.3)} 0%, ${alpha(GLOW, 0)} 70%)`,
          }} />
        </Stage>

        {/* floor reflection: the sign mirrored along the floor intersection line, blurred, fading out */}
        <div style={{
          position: 'absolute', inset: 0, transform: `translateY(${2 * FLOOR}px) scaleY(-1)`, transformOrigin: '0 0', opacity: 0.42,
          filter: 'blur(5px)', // the mask is in local coordinates before mirroring: local y≥FLOOR would flip onto the wall and must be fully transparent; the higher up (farther from the floor), the fainter
          WebkitMaskImage: `linear-gradient(180deg, transparent ${FLOOR - 340}px, rgba(0,0,0,0.9) ${FLOOR - 40}px, #000 ${FLOOR - 1}px, transparent ${FLOOR}px)`,
        }}>
          <div style={{ position: 'absolute', inset: 0, transform: `scale(${pulse})`, transformOrigin: `960px ${OY + LH / 2}px` }}>
            <Sign frame={frame} surge={surge} reveal={reveal} idPrefix="ssbr" />
          </div>
        </div>

        {/* sign */}
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${pulse})`, transformOrigin: `960px ${OY + LH / 2}px` }}>
          <Sign frame={frame} surge={surge} reveal={reveal} idPrefix="ssb" />
        </div>

        {/* subtitle after the reveal: only appears after landing */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: OY + LH + 62, textAlign: 'center', fontFamily: FONT.sans,
          fontSize: 32, fontWeight: 600, letterSpacing: '0.34em', color: L.ink2, opacity: kicker,
          transform: `translateY(${((1 - kicker) * 14).toFixed(2)}px)`,
        }}>
          {/* wordmark in all lowercase with tightened letter-spacing per brand spec; the second half keeps the original subtitle's wide-spaced uppercase */}
          <span style={{ fontFamily: BRAND.font, fontWeight: 700, letterSpacing: '0.06em', color: L.ink }}>{BRAND.name}</span>
          <span style={{ color: TUBE, margin: '0 0.5em 0 0.8em' }}>●</span> ONE PROMPT, ONE FILM
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
