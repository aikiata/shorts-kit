import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { Card } from '../../../shared/fixtures/Fixtures';
import { BRAND, PITCH, ShortKitMark } from '../../../shared/fixtures/Brand';
import { Backdrop, FONT, Grain } from '../../../shared/fixtures/Polish';

// bento-light-up: in a dark scene a 3×2 bento wall stands dimmed and ready, lighting up cell by cell on the beat:
// a border streak first traces one lap (amber), then the cell contents brighten and pop up; once all six are lit the whole wall gives a small push and settles.
// Beats: 0–20 establish (hold) → each cell activates in turn at 12f intervals (stroke 8f + content pop 8f)
//       → ~96f all lit → 96–121 scale 1→1.04 slow push → 121–150 still ending.
// Texture revision:
// - true bento: the two rows have complementary wide/narrow cells (600/420/420 ↔ 420/420/600), no longer six equal cells;
// - cards use the dark publication-grade Card (tone=dark), so the dark brand segment no longer has "blinding white cards", and lighting up reads as powering on rather than changing color;
// - the streak stroke becomes a "comet": a stroke segment with a bright head and fading tail runs one lap then settles into a steady thin border, with the glow only on the stroke (not spilling into a box);
// - the title becomes an eyebrow + main title type hierarchy; dark soft-light base (warm afterglow) + vignette + grain.
// Brand: eyebrow = shorts-kit mark + lowercase wordmark (amber), main title = PITCH slogan "Every shot, tuned in one place."
export const BENTO_LIGHT_UP_DURATION = 150;

const AMBER = '#e8b45e';
const FIRST = 20; // first cell activation frame
const GAP = 12; // beat between cells
const CELL_H = 330;
const GUT = 44;
const U = 480; // wide/narrow cell base: wide 1.25U=600, narrow 0.875U=420, each row 1440 + 2 gutters (the bigger the wide/narrow difference, the more visibly the type scale inside cards would differ)
const ROW_W = U * 3 + GUT * 2;
const LEFT = (1920 - ROW_W) / 2;
const TOP = (1080 - (CELL_H * 2 + GUT)) / 2 + 44;
const WIDTHS = [
  [1.25, 0.875, 0.875],
  [0.875, 0.875, 1.25],
];
const CELLS = WIDTHS.flatMap((row, r) => {
  let x = LEFT;
  return row.map((k) => {
    const w = k * U;
    const c = { x, y: TOP + r * (CELL_H + GUT), w };
    x += w + GUT;
    return c;
  });
});

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const Cell: React.FC<{ i: number; frame: number }> = ({ i, frame }) => {
  const start = FIRST + i * GAP;
  const { x, y, w } = CELLS[i];

  // ① Border streak: a comet segment (22% of the perimeter long) runs one lap along pathLength=100, 8f; then the whole thin border stays lit
  const draw = interpolate(frame, [start, start + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  // After drawing the streak anneals: bright amber border → weakens into a steady thin border
  const strokeFade = interpolate(frame, [start + 12, start + 26], [1, 0.4], { ...clamp, easing: Easing.out(Easing.quad) });
  const ring = interpolate(frame, [start + 2, start + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });

  // ② Content brightens + pops up: takes over after the stroke is half done, pops in 8f (back-out with a bit of overshoot)
  const lit = interpolate(frame, [start + 6, start + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const rise = interpolate(frame, [start + 6, start + 14], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 1.4, 0.5, 1) });
  const opacity = 0.18 + 0.82 * lit;
  const ty = 20 * (1 - rise);
  // seed sine hash gives each cell a small difference (glow intensity at the moment of lighting has a slightly random feel)
  const jitter = Math.abs((Math.sin(i * 127.3) * 43758.5453) % 1);
  const pulse = lit * (1 - lit) * 4; // glow pulse brightest at the middle of lighting
  const head = 100 * draw; // comet head position (percent of perimeter)
  const TAIL = 22;

  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: CELL_H }}>
      {/* Dark-state card + content after lighting (the same card, brightened and floated up via opacity/translateY) */}
      <div style={{ opacity, transform: `translateY(${ty.toFixed(2)}px)`, borderRadius: 14 }}>
        <Card w={w} h={CELL_H} seed={i + 1} tone="dark" />
        {/* A layer of warm light inside the card at the moment of lighting (clipped within the rounded corners, returns to zero after the pulse) */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 14, pointerEvents: 'none',
          background: `radial-gradient(90% 70% at 50% 0%, rgba(232,180,94,${(0.16 * pulse * (0.8 + jitter * 0.4)).toFixed(3)}), rgba(232,180,94,0) 70%)`,
        }} />
      </div>
      {/* Border streak: SVG rect stroke */}
      {draw > 0 && (
        <svg width={w} height={CELL_H} viewBox={`0 0 ${w} ${CELL_H}`} style={{ position: 'absolute', left: 0, top: ty, overflow: 'visible' }}>
          <defs>
            <filter id={`blu-glow-${i}`} x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation={4 + jitter * 2} />
            </filter>
          </defs>
          {/* Steady thin border: appears segment by segment as the comet passes, holds after annealing */}
          <rect
            x={0.75} y={0.75} width={w - 1.5} height={CELL_H - 1.5} rx={14} fill="none"
            stroke={AMBER} strokeWidth={1.5} pathLength={100} strokeDasharray={100} strokeDashoffset={100 * (1 - draw)}
            opacity={ring * strokeFade}
          />
          {/* Comet: glow layer + bright core layer, fading with the anneal after finishing a lap */}
          {[0, 1].map((k) => (
            <rect
              key={k}
              x={1.5} y={1.5} width={w - 3} height={CELL_H - 3} rx={14} fill="none"
              stroke={k ? '#ffe3ae' : AMBER}
              strokeWidth={k ? 2.5 : 6}
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${TAIL} ${100 - TAIL}`}
              strokeDashoffset={TAIL - head}
              opacity={(1 - interpolate(frame, [start + 8, start + 16], [0, 1], clamp)) * (k ? 1 : 0.8)}
              filter={k ? undefined : `url(#blu-glow-${i})`}
            />
          ))}
        </svg>
      )}
    </div>
  );
};

export const BentoLightUp: React.FC = () => {
  const frame = useCurrentFrame();

  // ③ After all six are lit (~96f) the whole wall slowly pushes scale 1→1.04, settling in 25f, then truly still
  const push = interpolate(frame, [96, 121], [1, 1.04], { ...clamp, easing: Easing.bezier(0.33, 0, 0.2, 1) });

  // The title brightens slightly with the first cell lighting, setting the scene
  const titleLit = interpolate(frame, [FIRST, FIRST + 20], [0.25, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  // After all lit the ground warm light rises slightly
  const allLit = interpolate(frame, [FIRST + 5 * GAP + 6, FIRST + 5 * GAP + 30], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Backdrop tone="dark" light={{ x: 0.5, y: 0.1 }} accent={AMBER} grain={0} vignette={0.55} />
      <AbsoluteFill style={{
        background: 'radial-gradient(ellipse 50% 40% at 50% 62%, rgba(232,180,94,0.10), rgba(232,180,94,0) 70%)',
        opacity: 0.3 + 0.7 * allLit,
      }} />
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${push.toFixed(5)})`, transformOrigin: '960px 540px' }}>
        <div style={{ position: 'absolute', left: LEFT, top: TOP - 132, fontFamily: FONT.sans, opacity: titleLit }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, height: 18 }}>
            <ShortKitMark size={24} tone="dark" />
            <span style={{ fontFamily: BRAND.font, fontSize: 17, fontWeight: 700, letterSpacing: '0.03em', color: AMBER, opacity: 0.9, lineHeight: 1 }}>{BRAND.name}</span>
          </div>
          <div style={{ marginTop: 10, fontSize: 56, fontWeight: 700, letterSpacing: '-0.03em', color: '#f1efe9', lineHeight: 1 }}>
            {PITCH.en.taglines[2]}
          </div>
        </div>
        {CELLS.map((_, i) => (
          <Cell key={i} i={i} frame={frame} />
        ))}
      </div>
      <Grain opacity={0.08} blend="soft-light" />
    </AbsoluteFill>
  );
};
