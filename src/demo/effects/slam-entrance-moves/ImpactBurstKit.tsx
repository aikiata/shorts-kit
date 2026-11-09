// Impact burst kit (impact-burst-kit): the hero card slams from in front of the lens into an empty slot on the page, and the landing frame detonates on the same frame:
// shock ring + debris burst + screen shake; on the frame the shockwave front sweeps the left and right neighbor cards (solved from radius-distance = 3f after landing),
// the neighbor cards that were already on stage are visibly pushed outward and then damped back, "this hit shook the neighbors".
//
// Second redesign (porcelain spec page, Launch film slams in):
// - look = porcelain (cool white, cobalt blue). The page is the finished-film spec section of shorts-kit: a masthead logo + title "One prompt to a finished promo.",
//   three 470×600 spec cards: the Teaser / Walkthrough white cards are there from the start, with a dashed empty slot in the middle; the hero Launch film card is on a deep ink-blue base
//   (the only dark surface in the film = visual center of gravity), a 112px duration, a cobalt CTA, and after settling a "DIRECTOR'S CUT" tag pops out above its head.
// - Rhythm "hang, slam, shake, pass, settle": 0–16f the hero card hangs in front of the lens above the slot (scale 1.55→1.6, lifted 20px, depth-of-field blur,
//   the contact shadow in the slot solidifies with height) → 16–22f six frames of ease-in accelerating slam → 22f impact frame: the card squashes for 3f then springs back +
//   cobalt shock ring (white pressure disc as a base, spread out-cubic / fade linear and decoupled) + 18 debris pieces + 8px screen shake for 4f →
//   25f the ring front passes the neighbor card centers: neighbors pushed out 34px + rotated ±3.5°, envelope cos(t/2)·e^(−t/8), hard-clamped to 0 at 40f, with a horizontal motion trail on the push.
// - After settling, at 28f the "DIRECTOR'S CUT" tag springs out, the neighbors return in ~65f, and after that the whole page is truly still (only a very slow camera push remains).
//
// Timeline (30fps, 140f total):
//   0–16    neighbor cards on stage ≥15f; hero card hovers and winds up (lift + enlarge + blur), empty slot visible
//   16–22   slam (main action 6f, ease-in)
//   22–38   impact: squash and rebound, shock ring 16f, debris 22f, shake 4f
//   25–65   neighbors affected: pushed out → damped rebound → hard clamp to zero
//   28–40   DIRECTOR'S CUT tag pops out
//   65–140  hold (75f)
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, FONT, SpeedBlur, bezier, mix, ramp, softShadow } from '../../../shared/fixtures/Polish';
import { LOOKS, Stage, alpha, springAt } from '../../../shared/fixtures/Look';
import { BRAND, ShortKitMark } from '../../../shared/fixtures/Brand';

export const IMPACT_BURST_KIT_DURATION = 140;

const L = LOOKS.porcelain;
const NAVY = '#0e1631';
const CW = 470;
const CH = 600;
const GAP = 44;
const X0 = (1920 - (CW * 3 + GAP * 2)) / 2; // 211
const Y = 300;
const CX = 960;
const CY = Y + CH / 2; // 600
const IMPACT = 22;
const DROP0 = 16;
// Shock ring radius 100→1100 (16f out-cubic). Front reaches the neighbor center distance of 514px: (514−100)/1000=0.414 → p≈0.163 → 2.6f → take +3f
const HIT = IMPACT + 3;
const EASE_IN_CUBIC = bezier(0.55, 0.055, 0.675, 0.19);

const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// Debris: cobalt shards + white paper bits, mostly in the upper hemisphere
const BITS = Array.from({ length: 18 }, (_, i) => ({
  ang: -Math.PI / 2 + (rnd(i + 1) - 0.5) * Math.PI * 1.75,
  dist: 260 + rnd(i + 40) * 300,
  size: 12 + rnd(i + 80) * 16,
  blue: i % 3 !== 2,
  spin: (rnd(i + 120) - 0.5) * 720,
  ratio: 0.35 + rnd(i + 9) * 0.5,
}));

// Damping envelope for the neighbors being pushed: instantly 1 at t=0, cosine decay, clamped to 0 after 40f to guarantee true stillness
const pushEnv = (f: number) => {
  const t = f - HIT;
  if (t < 0 || t >= 40) return 0;
  return Math.cos(t * 0.5) * Math.exp(-t / 8);
};

const Check: React.FC<{ c: string }> = ({ c }) => (
  <svg width={30} height={30} viewBox="0 0 30 30" style={{ flex: 'none' }}>
    <circle cx={15} cy={15} r={14} fill={alpha(c, 0.14)} />
    <path d="M9 15.5 L13.2 19.5 L21 11" fill="none" stroke={c} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type Plan = { name: string; price: string; unit: string; blurb: string; feats: string[]; cta: string; hero?: boolean };
// The three finished-film specs of shorts-kit: the big number is the film length (demo value), the hero is Launch film
const PLANS: Plan[] = [
  { name: 'Teaser', price: '15s', unit: '9:16 social', blurb: 'For a social drop.', feats: ['Crash-zoom open', 'Beat-synced cuts', 'Logo sting'], cta: 'Cut a teaser' },
  { name: 'Launch film', price: '60s', unit: '16:9 · 1080p', blurb: 'Your product, in motion.', feats: ['Real page captures', '2.5D camera moves', 'Film-grade SFX'], cta: 'Render launch film', hero: true },
  { name: 'Walkthrough', price: '90s', unit: 'with voiceover', blurb: 'Every feature, shot by shot.', feats: ['Cursor flyovers', 'Callout zooms', 'JianYing export'], cta: 'Storyboard it' },
];

const PlanCard: React.FC<{ p: Plan }> = ({ p }) => {
  const dark = !!p.hero;
  const ink = dark ? '#f2f5ff' : L.ink;
  const ink2 = dark ? '#a9b4d0' : L.ink2;
  const acc = dark ? '#7d9bff' : L.accent;
  return (
    <div style={{ position: 'absolute', inset: 0, padding: '44px 44px 40px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', fontFamily: FONT.sans, color: ink }}>
      <div style={{ font: `700 34px ${FONT.sans}`, letterSpacing: '-0.02em' }}>{p.name}</div>
      <div style={{ marginTop: 6, font: `500 26px ${FONT.sans}`, color: ink2 }}>{p.blurb}</div>
      <div style={{ marginTop: 30, display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{ font: `820 ${dark ? 112 : 100}px ${FONT.sans}`, letterSpacing: '-0.055em', lineHeight: 0.9, fontVariantNumeric: 'tabular-nums' }}>{p.price}</span>
        <span style={{ font: `500 26px ${FONT.sans}`, color: ink2, whiteSpace: 'nowrap' }}>{p.unit}</span>
      </div>
      <div style={{ marginTop: dark ? 26 : 34, height: 1, background: dark ? 'rgba(160,190,255,0.16)' : L.line }} />
      <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {p.feats.map((f) => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 16, font: `550 30px ${FONT.sans}`, letterSpacing: '-0.012em' }}>
            <Check c={acc} />
            {f}
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 'auto', height: 72, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', font: `680 28px ${FONT.sans}`, letterSpacing: '-0.01em',
        background: dark ? `linear-gradient(180deg, #5b7dff, ${L.accent})` : 'transparent', color: dark ? '#ffffff' : ink,
        border: dark ? 'none' : `2px solid ${alpha(L.ink, 0.14)}`,
        boxShadow: dark ? `0 14px 30px -12px ${alpha(L.accent, 0.9)}, inset 0 1px 0 rgba(255,255,255,0.3)` : 'none',
      }}>
        {p.cta}
      </div>
    </div>
  );
};

export const ImpactBurstKit: React.FC = () => {
  const frame = useCurrentFrame();

  // ── Hero card (Launch film): 0–16 hover and wind up → 16–22 accelerating slam → from 22 squash and rebound
  const wind = ramp(frame, 0, DROP0, EASE.smooth);
  const drop = ramp(frame, DROP0, IMPACT - DROP0, EASE_IN_CUBIC);
  const hoverScale = 1.55 + 0.05 * wind;
  const hoverDy = -110 - 20 * wind;
  const mScale = mix(hoverScale, 1, drop);
  const mDy = mix(hoverDy, 0, drop);
  const lift = Math.min(1, Math.max(0, (mScale - 1) / 0.6));
  const dof = lift * 7;
  const squash = frame < IMPACT ? 0 : frame < IMPACT + 3 ? ramp(frame, IMPACT, 3, EASE.out) : 1 - springAt(frame, IMPACT + 3, { damping: 12, stiffness: 320 });
  const sx = mScale * (1 + 0.06 * squash);
  const sy = mScale * (1 - 0.085 * squash);
  const mOp = ramp(frame, 0, 5, EASE.out);

  // ── Shock ring + pressure disc
  const ringP = ramp(frame, IMPACT, 16, EASE.snappy);
  const ringLin = ramp(frame, IMPACT, 16, EASE.linear);
  const ringOn = frame >= IMPACT && frame < IMPACT + 16;
  const ringR = mix(100, 1100, ringP);
  const ringOp = mix(0.95, 0, ringLin);
  const ringW = mix(10, 1.5, ringP);

  // ── Debris 22f
  const pT = ramp(frame, IMPACT, 22, EASE.out);
  const pLin = ramp(frame, IMPACT, 22, EASE.linear);
  const pOn = frame >= IMPACT && frame < IMPACT + 22;

  // ── Neighbor card ripple
  const env = pushEnv(frame);
  const pushX = 34 * env;
  const pushRot = 3.5 * env;
  const pushV = 34 * (pushEnv(frame + 0.5) - pushEnv(frame - 0.5));

  // ── Screen shake 4f, 8px decay
  let shakeX = 0;
  let shakeY = 0;
  if (frame >= IMPACT && frame < IMPACT + 4) {
    const amp = 8 * (1 - (frame - IMPACT) / 4);
    shakeX = (rnd(frame * 3.7) - 0.5) * 2 * amp;
    shakeY = (frame === IMPACT ? 1 : (rnd(frame * 7.1 + 13) - 0.5) * 2) * amp;
  }

  const badge = frame < IMPACT + 6 ? 0 : springAt(frame, IMPACT + 6, { damping: 13, stiffness: 240 });
  const push = 1 + 0.02 * ramp(frame, IMPACT, 118, EASE.swift);
  const neighborShadow = `${softShadow(6 + Math.abs(env) * 26, { color: L.shadow })}, inset 0 0 0 1px ${alpha(L.ink, 0.07)}, inset 0 1px 0 #ffffff`;

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Stage look={L} keyLight={{ x: 0.5, y: 0.12 }} fill={{ x: 0.5, y: 1.0 }} />
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${shakeX.toFixed(2)}px, ${shakeY.toFixed(2)}px) scale(${push.toFixed(5)})` }}>
        {/* Page title area: already there from the start */}
        <div style={{ position: 'absolute', left: X0, top: 104, fontFamily: FONT.sans, color: L.ink }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, font: `700 24px ${FONT.mono}`, letterSpacing: '0.06em', color: L.accent }}>
            <ShortKitMark size={34} tone="light" />
            <span style={{ color: L.ink }}>{BRAND.name}</span>
            <span>· formats</span>
          </div>
          <div style={{ marginTop: 14, font: `780 76px ${FONT.sans}`, letterSpacing: '-0.045em', lineHeight: 1 }}>One prompt to a finished promo.</div>
        </div>

        {/* Middle empty slot: dashed slot + contact shadow that solidifies as the card falls */}
        <div style={{ position: 'absolute', left: X0 + CW + GAP, top: Y, width: CW, height: CH, borderRadius: 30, border: `2px dashed ${alpha(L.accent, 0.3)}`, background: alpha(L.accent, 0.035), opacity: 1 - ramp(frame, IMPACT, 3, EASE.out) }} />
        <div style={{
          position: 'absolute', left: X0 + CW + GAP - 30, top: Y + CH - 60, width: CW + 60, height: 120, borderRadius: '50%',
          background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${alpha(L.shadow, 0.22)} 0%, ${alpha(L.shadow, 0)} 70%)`,
          opacity: frame < IMPACT ? mix(0.25, 1, drop) : 1 - ramp(frame, IMPACT, 4, EASE.out), transform: `scale(${mix(1.5, 1, drop).toFixed(3)})`,
        }} />

        {/* Left and right neighbor cards: pushed by the shockwave then bounce back */}
        {[0, 2].map((k) => {
          const dir = k === 0 ? -1 : 1;
          return (
            <SpeedBlur key={k} vx={dir * pushV} amount={0.22} max={8}>
              <div style={{
                position: 'absolute', left: X0 + k * (CW + GAP), top: Y, width: CW, height: CH, borderRadius: 30, background: '#ffffff', boxShadow: neighborShadow,
                transform: `translateX(${(dir * pushX).toFixed(2)}px) rotate(${(dir * pushRot).toFixed(3)}deg)`, transformOrigin: `50% 100%`,
              }}>
                <PlanCard p={PLANS[k]} />
              </div>
            </SpeedBlur>
          );
        })}

        {/* Pressure disc: the white air blast at the instant of landing (a base layer so the cobalt ring reads on the bright background) */}
        {ringOn && (
          <div style={{
            position: 'absolute', left: CX - ringR * 0.9, top: CY - ringR * 0.9, width: ringR * 1.8, height: ringR * 1.8, borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha('#ffffff', 0)} 40%, ${alpha('#ffffff', 0.55 * (1 - ringLin))} 68%, ${alpha('#ffffff', 0)} 72%)`,
          }} />
        )}

        {/* Hero card Launch film */}
        <div style={{
          position: 'absolute', left: X0 + CW + GAP, top: Y + mDy, width: CW, height: CH, borderRadius: 30, opacity: mOp,
          background: `linear-gradient(170deg, #1a2550 0%, ${NAVY} 55%, #0a1026 100%)`,
          boxShadow: `0 ${(18 + lift * 60).toFixed(1)}px ${(50 + lift * 90).toFixed(1)}px -18px ${alpha('#0c1a3a', 0.55 - lift * 0.15)}, 0 0 0 1px ${alpha('#9db4ff', 0.18)}, inset 0 1px 0 ${alpha('#ffffff', 0.14)}`,
          transform: `scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`, transformOrigin: '50% 100%',
          filter: dof > 0.4 ? `blur(${dof.toFixed(2)}px)` : undefined,
        }}>
          {/* Top cobalt glow */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: 30, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: -80, right: -80, top: -260, height: 420, background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${alpha(L.accent, 0.45)} 0%, ${alpha(L.accent, 0)} 70%)` }} />
          </div>
          <PlanCard p={PLANS[1]} />
          {/* DIRECTOR'S CUT tag: pops out after settling, riding the card's top edge */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: -24, display: 'flex', justifyContent: 'center' }}>
            <div style={{
              height: 48, padding: '0 22px', borderRadius: 24, background: L.accent, color: '#ffffff', display: 'flex', alignItems: 'center',
              font: `800 22px ${FONT.mono}`, letterSpacing: '0.12em', transform: `scale(${badge.toFixed(4)})`, opacity: Math.min(1, badge * 2),
              boxShadow: `0 10px 24px -8px ${alpha(L.accent, 0.8)}, inset 0 1px 0 rgba(255,255,255,0.35)`,
            }}>
              {"DIRECTOR'S CUT"}
            </div>
          </div>
        </div>

        {/* Debris (above the card): elongated along the flight direction by speed */}
        {pOn && BITS.map((b, i) => {
          const sp = Math.pow(1 - pT, 2 / 3);
          const px = CX + Math.cos(b.ang) * (140 + b.dist * pT);
          const py = CY - 40 + Math.sin(b.ang) * (140 + b.dist * pT) * 0.85 + 120 * pLin * pLin;
          const s = b.size * (1 - 0.6 * pLin);
          const stretch = 1 + Math.min(1.6, sp * 1.6);
          return (
            <div key={i} style={{ position: 'absolute', left: px - s / 2, top: py - (s * b.ratio) / 2, width: s, height: s * b.ratio, transform: `rotate(${((b.ang * 180) / Math.PI).toFixed(1)}deg) scaleX(${stretch.toFixed(3)})`, opacity: pLin < 0.65 ? 1 : 1 - (pLin - 0.65) / 0.35 }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 2,
                background: b.blue ? L.accent : '#ffffff', boxShadow: b.blue ? `0 0 8px ${alpha(L.accent, 0.45)}` : `0 0 0 1px ${alpha(L.ink, 0.1)}, 0 3px 8px ${alpha(L.shadow, 0.25)}`,
                transform: `rotate(${(b.spin * pT).toFixed(1)}deg)`,
              }} />
            </div>
          );
        })}

        {/* Shock ring: thin cobalt ring + soft glow, getting thinner as it expands */}
        {ringOn && (
          <div style={{
            position: 'absolute', left: CX - ringR, top: CY - ringR, width: ringR * 2, height: ringR * 2, borderRadius: '50%', boxSizing: 'border-box', opacity: ringOp,
            border: `${ringW.toFixed(2)}px solid ${alpha(L.accent, 0.9)}`,
            boxShadow: `0 0 ${(18 + ringP * 30).toFixed(0)}px ${alpha(L.accent, 0.35)}, inset 0 0 ${(18 + ringP * 30).toFixed(0)}px ${alpha(L.accent, 0.2)}`,
          }} />
        )}
      </div>
    </AbsoluteFill>
  );
};
