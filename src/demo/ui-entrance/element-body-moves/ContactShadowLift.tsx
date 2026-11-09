// contact-shadow-lift: contact shadow lifting off the surface
//
// Second-round redesign (porcelain desktop · 2.5D oblique top-down · calling out one card at a time):
// - look = porcelain (cool white + cobalt blue). Three 440×580 portrait shorts-kit shot recipe cards lie flat on a porcelain desktop shot from an oblique top-down angle (rotateX ≈ 30°):
//   Whip pan 8f / Crash zoom 12f / Logo sting 24f (the icon slot of the selected card is the shorts-kit mark). The technique itself is made truly physical:
//   the card lifts by translateZ along the desktop normal, and the shadow is a separate layer "lying on the desktop at z=0": the contact core (small and solid, almost hugging the edge)
//   grows, blurs and fades as the lift increases and shifts toward the side away from the light (lower right); the ambient shadow (large and soft) spreads in sync. The card body carries no box-shadow,
//   the shadow stays on the desk, so the distance of "paper lifting off the desk" is proven by the shadow, not hinted by scaling.
// - Rhythm "sweep, sweep, pick": the first two are light, quick call-outs (lift 10f out-cubic → hover 14f → return 8f in-cubic + 2f slight-squash stick),
//   the third is the pick: lifted slower and higher (14f, spring settle, one slight overshoot), stopping in the air without returning, cobalt stroke + checkmark pop-out,
//   becoming the only hero of the ending poster. Only one card is off the desk at a time (P4), and the other two dim slightly in sync to yield.
// - Camera: over the whole piece a very slow oblique-angle straightening (30°→26°) + horizontal shift of ±40px following the called-out card (smooth, no velocity jumps).
//
// Timeline (30fps, 150f total):
//   0–16    Anticipation: desktop, three cards already in place, title rises word by word
//   16–50   Call-out 1: lift 16–26, hover, return 40–48, stick 48–50
//   50–84   Call-out 2: same as above
//   86–100  Pick 3: lift 14f (spring damping 16, ~3% overshoot), hover breathing from 100f
//   96–118  Aftermath: cobalt stroke, checkmark pops out (checkmark line draw), beat cells dyed cobalt in sync
//   118–150 Hold: the picked card stays in the air, very slow camera push
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, ramp } from '../../../shared/fixtures/Polish';
import { LOOKS, Stage, TextReveal, alpha, springAt, type } from '../../../shared/fixtures/Look';
import { ShortKitMark } from '../../../shared/fixtures/Brand';

export const CONTACT_SHADOW_LIFT_DURATION = 150;

const L = LOOKS.porcelain;

// ───────────── Layout (desktop coordinate system, px) ─────────────
const CARD_W = 420;
const CARD_H = 600;
const GAP = 60;
const DESK_W = 3 * CARD_W + 2 * GAP; // 1448
const DESK_H = CARD_H;
const RADIUS = 30;

// ───────────── Lift ─────────────
const LIFT_Z = 96; // lift along the desktop normal (about 40–50px of visible displacement on screen, far above the 28px precedent lower bound)
const LIFT_S = 1.05;
const SCANS = [16, 50]; // start points of the first two call-outs
const PICK = 86; // start point of the third pick

const outCubic = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const inCubic = (t: number) => Math.pow(Math.min(1, Math.max(0, t)), 3);

// Call-out (returns): returns lift 0→1→0 and scale (including landing stick)
const scanMotion = (t: number) => {
  if (t < 0 || t >= 34) return { lift: 0, s: 1 };
  const up = outCubic(t / 10);
  const down = inCubic((t - 24) / 8);
  const lift = up - down;
  let s = 1 + (LIFT_S - 1) * lift;
  if (t >= 32) s = 0.99 + 0.01 * outCubic((t - 32) / 2); // back to 1 after 2f of slight-squash stick
  else if (t >= 31) s = 0.99;
  const hover = t >= 10 && t < 24 ? Math.sin(((t - 10) / 14) * Math.PI) : 0;
  return { lift: lift + 0.05 * hover, s };
};

// Pick (does not return): spring lift + hover breathing
const pickMotion = (f: number) => {
  if (f < PICK) return { lift: 0, s: 1 };
  const k = springAt(f, PICK, { damping: 16, stiffness: 120 });
  const breathe = f > PICK + 16 ? 0.04 * Math.sin(((f - PICK - 16) / 40) * Math.PI * 2) * ramp(f, PICK + 16, 20, EASE.smooth) : 0;
  const lift = 1.15 * k + breathe;
  return { lift, s: 1 + (LIFT_S - 1) * Math.min(1.2, k) };
};

const motionOf = (i: number, f: number) => (i < 2 ? scanMotion(f - SCANS[i]) : pickMotion(f));

// ───────────── Content ─────────────
// Shot recipe card: tag = shot name, hours = duration (frames), days = which beats it falls on (original field names kept)
type Focus = { tag: string; hours: string; note: string; days: number[]; glyph: 'whip' | 'zoom' | 'sting' };
const CARDS: Focus[] = [
  { tag: 'Whip pan', hours: '8f', note: 'A blurred hand-off between two scenes.', days: [0, 1, 0, 1, 0, 0, 0], glyph: 'whip' },
  { tag: 'Crash zoom', hours: '12f', note: 'Punch in on the number that matters.', days: [1, 0, 1, 0, 1, 1, 0], glyph: 'zoom' },
  { tag: 'Logo sting', hours: '24f', note: 'Lands the mark on the final downbeat.', days: [1, 1, 1, 1, 1, 0, 0], glyph: 'sting' },
];

// whip = horizontal pan speed lines, zoom = push-in viewfinder corner marks; sting (end-card logo hit) uses the shorts-kit mark directly (the mark does not change color with the selected state)
const Glyph: React.FC<{ kind: Focus['glyph']; color: string }> = ({ kind, color }) =>
  kind === 'sting' ? (
    <ShortKitMark size={46} tone="light" />
  ) : (
    <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      {kind === 'whip' && <path d="M3 8h11M6 12h14M3 16h11M16 8.5l4 3.5-4 3.5" />}
      {kind === 'zoom' && (<><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" /><circle cx={12} cy={12} r={2.4} /></>)}
    </svg>
  );

const DAYS = ['1', '2', '3', '4', '5', '6', '7']; // beat numbers (original variable name kept)

const CardFace: React.FC<{ d: Focus; sel: number; check: number }> = ({ d, sel, check }) => {
  const tint = (a: number) => alpha(sel > 0.5 ? L.accent : L.ink, a);
  return (
    <div style={{ position: 'absolute', inset: 0, padding: '44px 46px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 80, height: 80, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: tint(0.07), border: `1px solid ${tint(0.08)}`,
        }}>
          <Glyph kind={d.glyph} color={sel > 0.5 ? L.accent : L.ink2} />
        </div>
        {/* Selected checkmark */}
        <div style={{
          width: 58, height: 58, borderRadius: 29, background: L.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: `scale(${check.toFixed(4)})`, opacity: Math.min(1, check * 2), boxShadow: `0 8px 20px -6px ${alpha(L.accent, 0.7)}`,
        }}>
          <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray={22} strokeDashoffset={22 * (1 - Math.min(1, Math.max(0, check * 1.2 - 0.2)))} />
          </svg>
        </div>
      </div>
      <div style={{ ...type(26, 650, { caps: true }), letterSpacing: '0.14em', color: L.ink2, marginTop: 44 }}>{d.tag}</div>
      <div style={{ ...type(160, 780), color: L.ink, letterSpacing: '-0.055em', marginTop: 14, lineHeight: 0.92 }}>{d.hours}</div>
      <div style={{ ...type(32, 500), color: L.ink2, marginTop: 22, lineHeight: 1.32 }}>{d.note}</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
        {d.days.map((on, k) => (
          <div key={k} style={{
            flex: 1, height: 52, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: on ? (sel > 0.5 ? L.accent : alpha(L.ink, 0.82)) : alpha(L.ink, 0.05),
            color: on ? '#fff' : L.ink3, ...type(22, 650),
          }}>
            {DAYS[k]}
          </div>
        ))}
      </div>
    </div>
  );
};

// ───────────── Main body ─────────────
export const ContactShadowLift: React.FC = () => {
  const frame = useCurrentFrame();
  const motions = [0, 1, 2].map((i) => motionOf(i, frame));
  const lifts = motions.map((m) => Math.max(0, Math.min(1, m.lift)));

  // Camera: oblique angle slowly straightens + horizontal shift following the called-out card; very slow push-in after the pick
  const tilt = 24 - 4 * ramp(frame, 0, 150, EASE.smooth);
  const follow = lifts.reduce((acc, l, i) => acc + l * (1 - i) * 40, 0);
  const push = 1 + 0.025 * ramp(frame, PICK, 64, EASE.smooth);

  const sel = ramp(frame, PICK + 10, 10, EASE.out);
  const check = frame < PICK + 14 ? 0 : springAt(frame, PICK + 14, { damping: 13, stiffness: 220 });

  return (
    <AbsoluteFill style={{ background: L.bg[1], overflow: 'hidden' }}>
      <Stage look={L} keyLight={{ x: 0.3, y: 0.05 }} fill={null} grain={0.045} vignette={0.2} />

      {/* Title (screen space, not in 3D) */}
      <div style={{ position: 'absolute', top: 92, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ ...type(24, 600, { mono: true }), letterSpacing: '0.16em', color: L.ink3, opacity: ramp(frame, 0, 14, EASE.out) }}>
          SHOT RECIPES · LAUNCH FILM
        </div>
        <div style={{ ...type(120, 760), color: L.ink, marginTop: 18 }}>
          <TextReveal text="Pick your shot." by="word" start={2} each={18} gap={4} />
        </div>
      </div>

      {/* Desktop: oblique top-down 3D plane */}
      <div style={{ position: 'absolute', inset: 0, perspective: 2600, perspectiveOrigin: '50% 34%' }}>
        <div style={{
          position: 'absolute', left: (1920 - DESK_W) / 2, top: 350, width: DESK_W, height: DESK_H,
          transformStyle: 'preserve-3d',
          transform: `translateX(${follow.toFixed(2)}px) scale(${push.toFixed(5)}) rotateX(${tilt.toFixed(3)}deg)`,
          transformOrigin: '50% 60%',
        }}>
          {/* Desktop dot grid: gives the "desktop" plane real perspective under the oblique shot (sparse far, dense near), fading out at the edges */}
          <div style={{
            position: 'absolute', left: -700, top: -520, width: DESK_W + 1400, height: DESK_H + 1000,
            backgroundImage: `radial-gradient(circle, ${alpha(L.ink, 0.13)} 1.6px, transparent 2.2px)`, backgroundSize: '44px 44px',
            backgroundPosition: '-6px 14px',
            WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 50% 52%, #000 30%, transparent 78%)',
          }} />
          {CARDS.map((d, i) => {
            const { lift, s } = motions[i];
            const l = Math.max(0, lift);
            const x = i * (CARD_W + GAP);
            const others = Math.max(0, ...lifts.filter((_, k) => k !== i));
            return (
              <React.Fragment key={i}>
                {/* Ambient shadow: large soft shadow on the desktop, spreading with the lift and shifting to the side away from the light (lower right) */}
                <div style={{
                  position: 'absolute', left: x, top: 0, width: CARD_W, height: CARD_H, borderRadius: RADIUS,
                  background: alpha(L.shadow, 0.09 + 0.13 * l),
                  filter: `blur(${(14 + 40 * l).toFixed(1)}px)`,
                  transform: `translate3d(${(10 + 40 * l).toFixed(1)}px, ${(16 + 60 * l).toFixed(1)}px, 0.5px) scale(${(1.0 + 0.06 * l).toFixed(4)})`,
                }} />
                {/* Contact core: small and solid at the edge, growing, blurring and fading after lift */}
                <div style={{
                  position: 'absolute', left: x, top: 0, width: CARD_W, height: CARD_H, borderRadius: RADIUS,
                  background: alpha(L.shadow, 0.32 - 0.18 * l),
                  filter: `blur(${(3 + 22 * l).toFixed(1)}px)`,
                  transform: `translate3d(${(2 + 18 * l).toFixed(1)}px, ${(4 + 36 * l).toFixed(1)}px, 1px) scale(${(0.99 + 0.05 * l).toFixed(4)})`,
                }} />
                {/* Card body: lifts along the normal, carries no box-shadow (the shadow stays on the desk) */}
                <div style={{
                  position: 'absolute', left: x, top: 0, width: CARD_W, height: CARD_H, borderRadius: RADIUS, overflow: 'hidden',
                  transform: `translate3d(0, 0, ${(2 + LIFT_Z * lift).toFixed(2)}px) scale(${s.toFixed(4)})`,
                  background: 'linear-gradient(180deg, #ffffff 0%, #f8faff 100%)',
                  border: `1px solid ${alpha(L.ink, 0.07)}`, boxSizing: 'border-box',
                  boxShadow: `inset 0 1px 0 #ffffff${i === 2 ? `, inset 0 0 0 ${(3 * sel).toFixed(2)}px ${L.accent}` : ''}`,
                }}>
                  <CardFace d={d} sel={i === 2 ? sel : 0} check={i === 2 ? check : 0} />
                  {/* Yielding dim: when another card is off the desk, this card sinks slightly */}
                  <div style={{ position: 'absolute', inset: 0, background: alpha('#dfe5ef', 1), opacity: others * 0.22, mixBlendMode: 'multiply' }} />
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

    </AbsoluteFill>
  );
};
