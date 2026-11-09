// Score slam entrance (score-slam): a sports-broadcast score popup style slam: the score card accelerates from 2.6x size in front of the lens and slams to screen center,
// the impact frame detonates a trio on the same frame (shock ring + shard sparks + screen shake), and the slam settles with one compression overshoot and rebound.
//
// Second redesign (graphite night stage, cup final score):
// - look = graphite (near-monochrome dark field, champagne-gold accents). The stage is a night stadium: four floodlights along the top edge snap on one after another over 0–7f
//   (with downward light cones and haze), and the distant stands are a layer of blurred warm light dots. The hero is a 1240×400 full-time score card:
//   two team badges + team names (home team shorts-kit uses the shorts-kit logo as its crest, away team Keyframes), a 220px bold tabular score "3 – 2",
//   a gold "FULL TIME · 90+4′" tag on top, and a match info row at the bottom.
// - Rhythm "hang, slam, blast, settle, read": 0–9f the card hangs in front of the lens (2.75→2.6, 10px blur, lifted up to wind up) →
//   9–15f six frames of ease-in accelerating slam (scale 2.6→0.965, rotate 5°→0, blur to zero) → 15f impact frame:
//   shock ring (white core + gold glow, spread out-cubic, fade linear and decoupled) + 14 glass/gold-foil shards flying out on parabolas + 16 sparks +
//   vertically biased screen shake 18px exponential decay over 5f + 2f white flash → 15–26f spring rebound to 1.
// - Follow-through: the two score digits each "land a second time" 3f / 6f later (1.16→1 spring), and a gold underline wipes out under the winning digit;
//   the FULL TIME tag slides out of the card top; then the title "shorts-kit lifts the Cup." rises word by word, and the subline (a verdict line) fades in.
//
// Timeline (30fps, 135f total):
//   0–9     setup: floodlights light up in turn; the score card hangs blurred in front of the lens, slowly lifting
//   9–15    slam (main action 6f, ease-in)
//   15–31   impact trio: ring 16f / shards 20f / sparks 10f / shake 5f / white flash 2f
//   15–26   card compression rebound; 18f, 21f score digits land a second time; 24f FULL TIME tag slides out; 28f winner's gold line
//   36–64   title rises word by word + subline fades in
//   64–135  hold: floodlights breathe very slowly, camera push 1→1.02, all aftermath back to zero
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, FONT, bezier, mix, ramp } from '../../../shared/fixtures/Polish';
import { Dust, LOOKS, Stage, TextReveal, alpha, springAt } from '../../../shared/fixtures/Look';
import { BRAND, ShortKitMark } from '../../../shared/fixtures/Brand';

export const SCORE_SLAM_DURATION = 135;

const L = LOOKS.graphite;
const GOLD = L.accent2;
const IMPACT = 15; // impact frame
const SLAM0 = 9; // slam start
const CW = 1240;
const CH = 400;
const CX = 960;
const CY = 500; // card center
const EASE_IN_QUAD = bezier(0.55, 0.085, 0.68, 0.53);

const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// Shards: polygonal glass / gold-foil pieces, parabolic (fly out first, then fall) + spin + flip
const SHARDS = Array.from({ length: 14 }, (_, i) => {
  const ang = (i / 14) * Math.PI * 2 + (rnd(i + 3) - 0.5) * 0.5;
  return {
    ang, dist: 280 + rnd(i + 11) * 300, size: 22 + rnd(i + 23) * 26, spin: (rnd(i + 31) - 0.5) * 620,
    gold: i % 3 === 0, poly: [0, 1, 2, 3].map((k) => `${(50 + Math.cos(k * 1.7 + i) * (30 + rnd(i * 4 + k) * 20)).toFixed(0)}% ${(50 + Math.sin(k * 1.7 + i) * (30 + rnd(i * 5 + k) * 20)).toFixed(0)}%`).join(', '),
  };
});
const SPARKS = Array.from({ length: 16 }, (_, i) => ({
  ang: (i / 16) * Math.PI * 2 + (rnd(i + 61) - 0.5) * 0.4, dist: 360 + rnd(i + 71) * 320, len: 40 + rnd(i + 81) * 50,
}));
const LIGHTS = [250, 600, 1320, 1670];

const Crest: React.FC<{ code: React.ReactNode; filled: boolean }> = ({ code, filled }) => (
  <div style={{
    width: 108, height: 108, borderRadius: 54, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: filled ? 'linear-gradient(180deg, #f6f5f1, #cfcdc6)' : 'transparent',
    border: filled ? 'none' : `3px solid ${alpha(L.ink, 0.55)}`,
    boxShadow: filled ? `0 8px 20px -8px #000, inset 0 -3px 0 ${alpha('#000', 0.12)}` : 'none',
    font: `850 30px ${FONT.sans}`, letterSpacing: '0.02em', color: filled ? '#141416' : L.ink,
  }}>
    {code}
  </div>
);

export const ScoreSlam: React.FC = () => {
  const frame = useCurrentFrame();

  // Card: 0–9 hover and wind up (2.75→2.6, lifted), 9–15 accelerating slam to 0.965, from 15 spring back to 1
  const hover = ramp(frame, 0, SLAM0, EASE.smooth);
  const drop = ramp(frame, SLAM0, IMPACT - SLAM0, EASE_IN_QUAD);
  const preScale = mix(2.75, 2.6, hover);
  const settle = springAt(frame, IMPACT, { damping: 14, stiffness: 260 });
  const scale = frame < IMPACT ? mix(preScale, 0.965, drop) : mix(0.965, 1, settle);
  const rot = mix(5, 0, drop);
  const dy = frame < IMPACT ? mix(-40 - 30 * hover, 0, drop) : 0;
  const cardOp = ramp(frame, 0, 6, EASE.out) * mix(0.6, 1, drop); // semi-transparent while hovering, so the floodlights lighting up behind are visible
  const height01 = Math.min(1, Math.max(0, (scale - 1) / 1.75));
  const dof = height01 * 10; // the closer to the lens, the blurrier
  const cardShadow =
    `0 ${(2 + height01 * 14).toFixed(1)}px ${(6 + height01 * 24).toFixed(1)}px ${alpha('#000', 0.5 - height01 * 0.25)}, ` +
    `0 ${(40 + height01 * 80).toFixed(1)}px ${(90 + height01 * 120).toFixed(1)}px -20px ${alpha('#000', 0.85 - height01 * 0.3)}, ` +
    `inset 0 1px 0 ${alpha('#ffffff', 0.14)}, inset 0 0 0 1px ${alpha('#ffffff', 0.09)}`;

  // Screen shake: 5f from the impact frame, 18px exponential decay, biased vertical (first frame slams downward)
  let shakeX = 0;
  let shakeY = 0;
  if (frame >= IMPACT && frame < IMPACT + 5) {
    const t = frame - IMPACT;
    const amp = 18 * Math.exp(-t * 0.85);
    shakeX = amp * 0.4 * (rnd(frame * 7 + 1) * 2 - 1);
    shakeY = amp * (t === 0 ? 1 : rnd(frame * 13 + 2) * 2 - 1);
  }
  const flash = frame >= IMPACT && frame < IMPACT + 3 ? [0.22, 0.12, 0.04][frame - IMPACT] : 0;

  // Shock ring: spread out-cubic, fade runs on linear frame time (decoupled, otherwise it fades out right after expanding)
  const ringT = ramp(frame, IMPACT, 16, EASE.snappy);
  const ringLin = ramp(frame, IMPACT, 16, EASE.linear);
  const ringOn = frame >= IMPACT && frame < IMPACT + 16;
  const ringD = mix(120, 1500, ringT);
  const ringOp = ringLin < 0.6 ? mix(1, 0.65, ringLin / 0.6) : mix(0.65, 0, (ringLin - 0.6) / 0.4);
  const ringW = mix(9, 1.5, ringT);

  // Shards 20f / sparks 10f
  const shT = ramp(frame, IMPACT, 20, EASE.out);
  const shLin = ramp(frame, IMPACT, 20, EASE.linear);
  const shOn = frame >= IMPACT && frame < IMPACT + 20;
  const spT = ramp(frame, IMPACT, 10, bezier(0.1, 0.9, 0.2, 1));
  const spLin = ramp(frame, IMPACT, 10, EASE.linear);
  const spOn = frame >= IMPACT && frame < IMPACT + 10;

  // Follow-through: second landing of score digits, FULL TIME tag, winner's gold line
  const digitPop = (start: number) => (frame < start ? 0 : springAt(frame, start, { damping: 13, stiffness: 300 }));
  const d1 = digitPop(IMPACT + 3);
  const d2 = digitPop(IMPACT + 6);
  const tag = ramp(frame, IMPACT + 9, 12, EASE.snappy);
  const underline = ramp(frame, IMPACT + 13, 14, EASE.snappy);

  const push = 1 + 0.02 * ramp(frame, IMPACT, 120, EASE.swift);
  const breathe = 0.92 + 0.08 * Math.sin(frame / 22);

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Stage look={L} keyLight={{ x: 0.5, y: -0.05 }} fill={null} intensity={0.8} horizon={0.8}>
        {/* Distant stands: blurred warm light dots */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 640, height: 440, filter: 'blur(3px)' }}>
          <Dust look={L} count={60} seed={7} drift={0.08} opacity={0.55} color="#f2d9a8" />
        </div>
      </Stage>

      {/* Floodlights: light up in turn over 0–7f (on → flicker dark → on), downward light cones + haze */}
      {LIGHTS.map((x, i) => {
        const t0 = i * 2;
        const on = frame < t0 ? 0 : frame < t0 + 1 ? 1 : frame < t0 + 2 ? 0.35 : 1;
        const o = on * breathe;
        return (
          <React.Fragment key={i}>
            <div style={{
              position: 'absolute', left: x - 380, top: -40, width: 760, height: 1100, opacity: o,
              background: `radial-gradient(ellipse 34% 100% at 50% 0%, ${alpha('#fff4dc', 0.13)} 0%, ${alpha('#fff4dc', 0.05)} 45%, ${alpha('#fff4dc', 0)} 80%)`,
            }} />
            <div style={{
              position: 'absolute', left: x - 160, top: -150, width: 320, height: 300, borderRadius: '50%', opacity: o,
              background: `radial-gradient(circle, ${alpha('#ffffff', 0.95)} 0%, ${alpha('#fff1d2', 0.45)} 18%, ${alpha('#fff1d2', 0)} 66%)`,
            }} />
          </React.Fragment>
        );
      })}

      <div style={{ position: 'absolute', inset: -40, transform: `translate(${shakeX.toFixed(2)}px, ${shakeY.toFixed(2)}px)` }}>
        <div style={{ position: 'absolute', inset: 40, transform: `scale(${push.toFixed(5)})` }}>
          {/* Shock ring: soft glow (gold) + thin white-core ring */}
          {ringOn && (
            <>
              <div style={{
                position: 'absolute', left: CX - ringD / 2, top: CY - ringD / 2, width: ringD, height: ringD, borderRadius: '50%', opacity: ringOp,
                boxShadow: `0 0 ${(30 + ringT * 40).toFixed(0)}px ${(6 + ringT * 8).toFixed(0)}px ${alpha(GOLD, 0.35)}, inset 0 0 ${(30 + ringT * 40).toFixed(0)}px ${alpha(GOLD, 0.22)}`,
              }} />
              <div style={{
                position: 'absolute', left: CX - ringD / 2, top: CY - ringD / 2, width: ringD, height: ringD, borderRadius: '50%', opacity: ringOp,
                border: `${ringW.toFixed(2)}px solid ${alpha('#fffaf0', 0.95)}`, boxSizing: 'border-box',
              }} />
            </>
          )}

          {/* Sparks: thin bright lines elongated along the radial direction */}
          {spOn && SPARKS.map((s, i) => {
            const r = 160 + s.dist * spT;
            const len = s.len * (1 - spLin) + 6;
            return (
              <div key={i} style={{
                position: 'absolute', left: CX + Math.cos(s.ang) * r - len / 2, top: CY + Math.sin(s.ang) * r * 0.8 - 2, width: len, height: 4, borderRadius: 2,
                background: `linear-gradient(90deg, ${alpha('#fff3d6', 0)}, #fffaf0)`, transform: `rotate(${((s.ang * 180) / Math.PI).toFixed(1)}deg)`,
                opacity: 1 - spLin, boxShadow: `0 0 10px ${alpha(GOLD, 0.8)}`,
              }} />
            );
          })}

          {/* Score card */}
          <div style={{
            position: 'absolute', left: CX - CW / 2, top: CY - CH / 2, width: CW, height: CH, borderRadius: 34,
            background: `linear-gradient(180deg, #1f2024 0%, ${L.surface} 100%)`, boxShadow: cardShadow, opacity: cardOp,
            transform: `translateY(${dy.toFixed(2)}px) rotate(${rot.toFixed(3)}deg) scale(${scale.toFixed(4)})`,
            filter: dof > 0.4 ? `blur(${dof.toFixed(2)}px)` : undefined, fontFamily: FONT.sans, color: L.ink,
          }}>
            {/* Gold hairline light on the top edge */}
            <div style={{ position: 'absolute', left: 120, right: 120, top: 0, height: 2, background: `linear-gradient(90deg, ${alpha(GOLD, 0)}, ${alpha(GOLD, 0.8)}, ${alpha(GOLD, 0)})` }} />
            {/* FULL TIME tag: slides out of the card top */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: -26, display: 'flex', justifyContent: 'center', overflow: 'hidden', height: 60 }}>
              <div style={{
                height: 52, padding: '0 24px', borderRadius: 26, background: GOLD, color: '#17130a', display: 'flex', alignItems: 'center',
                font: `800 24px ${FONT.mono}`, letterSpacing: '0.12em', transform: `translateY(${mix(64, 0, tag).toFixed(2)}px)`,
                boxShadow: `0 10px 30px -10px ${alpha(GOLD, 0.8)}`,
              }}>
                FULL TIME · 90+4′
              </div>
            </div>
            {/* Home team */}
            <div style={{ position: 'absolute', left: 70, top: 88, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: 220 }}>
              <Crest code={<ShortKitMark size={64} tone="light" />} filled />
              <div style={{ font: `750 44px ${FONT.sans}`, letterSpacing: '-0.03em' }}>{BRAND.short}</div>
            </div>
            {/* Away team */}
            <div style={{ position: 'absolute', right: 70, top: 88, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: 220 }}>
              <Crest code="KEY" filled={false} />
              <div style={{ font: `750 44px ${FONT.sans}`, letterSpacing: '-0.03em', color: L.ink2, whiteSpace: 'nowrap' }}>Keyframes</div>
            </div>
            {/* Score */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: 58, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 56, font: `860 220px ${FONT.sans}`, letterSpacing: '-0.05em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              <div style={{ position: 'relative', transform: `scale(${mix(1.16, 1, d1).toFixed(4)})` }}>
                3
                <div style={{ position: 'absolute', left: 6, right: 6, bottom: -6, height: 8, borderRadius: 4, background: GOLD, transformOrigin: '0 50%', transform: `scaleX(${underline.toFixed(4)})`, boxShadow: `0 0 18px ${alpha(GOLD, 0.6)}` }} />
              </div>
              <div style={{ width: 54, height: 12, borderRadius: 6, background: alpha(L.ink, 0.35) }} />
              <div style={{ transform: `scale(${mix(1.16, 1, d2).toFixed(4)})`, color: L.ink2 }}>2</div>
            </div>
            {/* Match info row */}
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 34, textAlign: 'center', font: `600 26px ${FONT.mono}`, letterSpacing: '0.14em', color: L.ink3 }}>
              MOTION CUP FINAL · BUILT ON REMOTION
            </div>
          </div>

          {/* Shards (drawn above the card, as if bursting from the impact surface) */}
          {shOn && SHARDS.map((d, i) => {
            const dx = Math.cos(d.ang) * d.dist * shT;
            const dyy = Math.sin(d.ang) * d.dist * 0.75 * shT + 260 * shLin * shLin; // fly out first, then fall
            const s = d.size * (1 - 0.55 * shLin);
            const flip = Math.abs(Math.cos(shLin * Math.PI * 1.6 + i));
            return (
              <div key={i} style={{
                position: 'absolute', left: CX + Math.cos(d.ang) * 300 + dx - s / 2, top: CY + Math.sin(d.ang) * 120 + dyy - s / 2, width: s, height: s,
                clipPath: `polygon(${d.poly})`,
                background: d.gold ? `linear-gradient(135deg, #8a6a2a, ${GOLD} 45%, #fff3cf 55%, #9c7a34)` : `linear-gradient(135deg, ${alpha('#ffffff', 0.9)}, ${alpha('#c9ccd4', 0.55)})`,
                opacity: shLin < 0.7 ? 1 : 1 - (shLin - 0.7) / 0.3,
                transform: `rotate(${(d.spin * shT).toFixed(1)}deg) scaleY(${Math.max(0.15, flip).toFixed(3)})`,
                filter: i % 4 === 0 ? 'blur(2px)' : undefined,
              }} />
            );
          })}

          {/* Title + subline */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: CY + CH / 2 + 92, textAlign: 'center', font: `800 84px ${FONT.sans}`, letterSpacing: '-0.04em', color: L.ink, lineHeight: 1 }}>
            <TextReveal text="shorts-kit lifts the" by="word" variant="rise" start={36} each={16} gap={4} />
            <span style={{ color: GOLD }}>
              <TextReveal text=" Cup." by="word" variant="rise" start={48} each={16} gap={4} />
            </span>
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: CY + CH / 2 + 200, textAlign: 'center', font: `500 36px ${FONT.sans}`, color: L.ink2, letterSpacing: '-0.01em', opacity: ramp(frame, 52, 14, EASE.out), transform: `translateY(${mix(12, 0, ramp(frame, 52, 16, EASE.out)).toFixed(2)}px)` }}>
            Camera moves I would have keyframed for a week.
          </div>
        </div>
      </div>

      {/* Impact white flash */}
      {flash > 0 && <div style={{ position: 'absolute', inset: 0, background: '#fffaf0', opacity: flash, mixBlendMode: 'screen' }} />}
    </AbsoluteFill>
  );
};
