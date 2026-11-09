// E-style hard-brake whip-brake: real project cards in a horizontal gallery; after whipping past 7 cards, hard brake before the target card (card4-hires, hi-res texture)
// then a long tail slides it into place. Fits landings where the content has to be read: the long tail gives the eye a ramp to catch up.
//
// Round 2 redesign (warm paper, index gallery + mechanical counter):
// - look = paper (warm white paper, ink, vermilion). The frame is no longer just a row of cards: top left is an **index counter** "Nº 02 / 10",
//   150px serif digits on a mechanical wheel: the digits scroll continuously with the gallery position (the ones digit gets vertical motion blur by scroll speed and carries at 9),
//   spinning wildly during the whip, slowing as the brake hits, and finally stopping with a "click" at 09; motion and typography share one curve.
// - A fixed vermilion "playhead" on the center line (top triangle + hairline vertical), and a ruler along the gallery bottom that moves with it
//   (one major tick per card + monospace index, minor ticks between): during the whip the ticks blur together, at the brake the playhead "locks" into slot 09.
// - Speed: one velocity curve v(u) = V0·e^(−6u/60)·smoothstep(0,3,u), integrated: 3f start-up, then monotonic decay
//   (first 70% of the distance ≈12f blur section, last 30% of the distance a 48f long tail), speed continuous throughout with no swing back; directional smear by instantaneous speed.
// - Settle: the target card lifts and scales to 1.2× (hi-res texture, text readable), shadow grows and softens, neighbors fall back to 45% and recede slightly;
//   the card's section name "Efficient Models" floats up under the playhead.
//
// Timeline (30fps, 130f total):
//   0–24    start hold: card 02 under the playhead, counter 02
//   24–36   full-speed whip (blur section, peak ~300px/f, counter spinning)
//   36–84   hard brake, long tail slides into slot 09
//   80–98   target card lifts 1→1.2, neighbors dim; section name rises from 88f
//   98–130  true stillness hold
import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import layout from '../../../shared/fixtures/live-layout.json';
import { EASE, FONT, ramp, mix, velocity, softShadow, SpeedBlur } from '../../../shared/fixtures/Polish';
import { LOOKS, Stage, alpha, type, SERIF } from '../../../shared/fixtures/Look';

export const WHIPBRAKE_DUR = 130;

const L = LOOKS.paper;
const cards = layout.projects.cards;
// Gallery order: target card card4 (hi-res) is 9th, 10th is the real next card
const RAIL = [cards[0], cards[1], cards[2], cards[4], cards[5], cards[6], cards[7], cards[8], null, cards[9]];
const TARGET_I = 8;
const START_I = 1;
const CARD_W = 460;
const GAP = 64;
const PITCH = CARD_W + GAP;
const RAIL_Y = 318;
const CARD_H = 402; // 460 × 312/357
const LEFT0 = 960 - CARD_W / 2 - START_I * PITCH; // start: card 02 centered
const END = (TARGET_I - START_I) * PITCH;
const T0 = 24;

// Velocity curve integral table (deterministic precompute, 0.05f step): 3f smoothstep start-up, then e^(−6u/60) decay
const STEP = 0.05;
const TABLE = (() => {
  const n = Math.round(60 / STEP);
  const vel = (u: number) => {
    const r = Math.min(1, u / 3);
    return Math.exp((-6 * u) / 60) * r * r * (3 - 2 * r);
  };
  const out = new Float64Array(n + 1);
  for (let i = 1; i <= n; i++) out[i] = out[i - 1] + ((vel((i - 1) * STEP) + vel(i * STEP)) / 2) * STEP;
  const total = out[n];
  for (let i = 0; i <= n; i++) out[i] /= total;
  return out;
})();
const progress = (u: number) => {
  if (u <= 0) return 0;
  if (u >= 60) return 1;
  const x = u / STEP;
  const i = Math.floor(x);
  return TABLE[i] + (TABLE[i + 1] - TABLE[i]) * (x - i);
};
const dxAt = (f: number) => END * progress(f - T0);
// Counter value: card index under the playhead (continuous, 1-based)
const indexAt = (f: number) => START_I + 1 + dxAt(f) / PITCH;

// One digit of the mechanical wheel: vertical digit strip, vertical blur by rotation speed
const DIGIT = 150;
const Wheel: React.FC<{ pos: number; speed: number }> = ({ pos, speed }) => {
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const p = ((pos % 10) + 10) % 10;
  const blur = Math.min(14, speed * DIGIT * 0.2);
  return (
    <span style={{
      display: 'inline-block', width: '0.6em', height: '1em', overflow: 'hidden', position: 'relative', verticalAlign: 'top',
      // Drum feel: top and bottom edges fade out (digits spin out of the drum instead of being cut by a hard frame)
      WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 16%, #000 84%, transparent 100%)',
      maskImage: 'linear-gradient(180deg, transparent 0%, #000 16%, #000 84%, transparent 100%)',
    }}>
      {blur > 0.3 && (
        <svg width={0} height={0} style={{ position: 'absolute' }}>
          <filter id={`wb${id}`} x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation={`0 ${blur.toFixed(2)}`} /></filter>
        </svg>
      )}
      <span style={{
        position: 'absolute', left: 0, top: 0, display: 'flex', flexDirection: 'column', lineHeight: 1,
        transform: `translateY(${(-p).toFixed(4)}em)`, filter: blur > 0.3 ? `url(#wb${id})` : undefined,
      }}>
        {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((d, k) => <span key={k} style={{ height: '1em', textAlign: 'center' }}>{d}</span>)}
      </span>
    </span>
  );
};

export const WhipBrakeReal: React.FC = () => {
  const frame = useCurrentFrame();
  const dx = dxAt(frame);
  const v = velocity(dxAt, frame);

  // Counter: ones digit scrolls continuously, tens digit only carries when ones goes 9→0
  const idx = indexAt(frame);
  const ones = idx % 10;
  const tens = Math.floor(idx / 10) + Math.max(0, ones - 9);
  const iv = Math.abs(velocity(indexAt, frame));

  // Settle focus
  const lift = ramp(frame, 80, 18, EASE.out);
  const dim = ramp(frame, 82, 16, EASE.out);
  const label = ramp(frame, 88, 16, EASE.snappy);
  const targetScale = mix(1, 1.2, lift);

  const cardStyle = (k: number): React.CSSProperties => ({
    position: 'absolute', left: LEFT0 + k * PITCH, top: RAIL_Y, width: CARD_W, borderRadius: 12,
    boxShadow: softShadow(8, { color: L.shadow, strength: 0.9 }),
    opacity: k === TARGET_I ? 1 : 1 - 0.55 * dim,
    transform: k !== TARGET_I && dim > 0 ? `scale(${(1 - 0.04 * dim).toFixed(4)})` : undefined,
  });

  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: L.bg[1] }}>
      <Stage look={L} keyLight={{ x: 0.5, y: 0.25 }} fill={null} />

      {/* Gallery (world): cards + ruler, shifted together by the camera, horizontal smear by speed */}
      <SpeedBlur vx={-v} amount={0.085} max={64}>
        <div style={{ position: 'absolute', left: 0, top: 0, transform: `translateX(${(-dx).toFixed(2)}px)` }}>
          {RAIL.map((c, k) => (c ? (
            <Img key={c.file} src={staticFile(`textures/live/${c.file}`)} style={cardStyle(k)} />
          ) : (
            <Img key="target" src={staticFile('textures/live/card4-hires.png')} style={{
              ...cardStyle(k), top: RAIL_Y - 12 * lift, transform: lift > 0 ? `scale(${targetScale.toFixed(4)})` : undefined,
              boxShadow: softShadow(mix(8, 44, lift), { color: L.shadow, strength: 1.3 }), zIndex: 2,
            }} />
          )))}
          {/* Ruler: one major tick + index per card, 4 minor ticks between */}
          <svg width={LEFT0 + RAIL.length * PITCH + 400} height={200} style={{ position: 'absolute', left: 0, top: 812 }}>
            <line x1={LEFT0 - 300} x2={LEFT0 + RAIL.length * PITCH + 200} y1={0} y2={0} stroke={alpha(L.ink, 0.22)} strokeWidth={1.5} />
            {Array.from({ length: (RAIL.length + 1) * 5 + 6 }, (_, j) => {
              const x = LEFT0 + CARD_W / 2 + (j - 5) * (PITCH / 5);
              const major = j % 5 === 0;
              return <line key={j} x1={x} x2={x} y1={0} y2={major ? 26 : 12} stroke={alpha(L.ink, major ? 0.5 : 0.22)} strokeWidth={major ? 2 : 1.5} />;
            })}
          </svg>
          {RAIL.map((_, k) => (
            <div key={k} style={{
              position: 'absolute', left: LEFT0 + k * PITCH, width: CARD_W, top: 852, textAlign: 'center',
              fontFamily: FONT.mono, fontSize: 32, fontWeight: 500, color: k === TARGET_I ? L.ink : L.ink3,
              opacity: k === TARGET_I ? 1 : 1 - 0.5 * dim,
            }}>
              {String(k + 1).padStart(2, '0')}
            </div>
          ))}
        </div>
      </SpeedBlur>

      {/* Fixed playhead: top vermilion triangle + hairline vertical (crosses the ruler) */}
      <svg width={40} height={80} style={{ position: 'absolute', left: 940, top: 770 }}>
        <path d="M6 0 L34 0 L20 18 Z" fill={L.accent} />
        <line x1={20} x2={20} y1={16} y2={70} stroke={L.accent} strokeWidth={2} />
      </svg>
      {/* After settling: section name floats up under the playhead */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 930, textAlign: 'center', ...type(32, 600, { caps: true }), letterSpacing: '0.16em',
        color: L.accent, opacity: label, transform: `translateY(${((1 - label) * 16).toFixed(2)}px)`,
      }}>
        Efficient Models
      </div>

      {/* Index counter */}
      <div style={{ position: 'absolute', left: 120, top: 70 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, ...type(30, 600, { caps: true }), color: L.ink2, letterSpacing: '0.18em' }}>
          <span style={{ width: 12, height: 12, borderRadius: 6, background: L.accent }} />Project index
        </div>
      </div>
      <div style={{ position: 'absolute', left: 1800, top: 64, transform: 'translateX(-100%)', display: 'flex', alignItems: 'flex-start', whiteSpace: 'nowrap' }}>
        <span style={{ fontFamily: SERIF, fontSize: 56, fontStyle: 'italic', color: L.ink3, marginRight: 18, marginTop: 30 }}>Nº</span>
        <span style={{ fontFamily: SERIF, fontSize: DIGIT, fontWeight: 600, color: L.ink, lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', height: '1em' }}>
          <Wheel pos={tens} speed={0} />
          <Wheel pos={ones} speed={iv} />
        </span>
        <span style={{ fontFamily: SERIF, fontSize: 56, color: L.ink3, marginLeft: 16, marginTop: 84 }}>/ 10</span>
      </div>
    </AbsoluteFill>
  );
};
