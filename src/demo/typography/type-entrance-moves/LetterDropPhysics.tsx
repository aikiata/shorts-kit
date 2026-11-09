// Letter drop and pile-up (letter-drop-physics): FallingLetterAnimation.
// The brand name "shorts-kit" (BRAND.short) 9 characters are laid in one row at the font's natural glyph widths (flex layout only handles the slots, all motion goes through transform without changing layout),
// the i-th character starts falling at frame 4+36·(1−(1−i/8)^1.5) (interval 6.5→1.6f getting denser, R2 hard acceleration):
// ① gravity acceleration y = D*(t/24)^2 drops 720px to the floor, stretched vertically by speed + vertical motion blur while falling;
// ② after landing, 2 decaying bounces (height 30% / 9%, parabola 4u(1-u) stitched in segments), each touchdown squashes
//    and rebounds with damping; at the instant of landing it rotates to a small seed-hash tilt of ±6° and holds it (stands crookedly);
//    under each character a contact shadow: the higher off the ground the larger, blurrier and fainter, collapsing to a small solid smudge on landing;
// ③ one beat at frame 110: first a 2f intake swelling to 1.06, then a 6f ease-out where everything straightens in unison (rotate→0, offsets→0,
//    scale 1.06→1), the subtitle 'Every shot lands on the beat.' floats out afterward; frames 116–150 truly still (≥34f) to finish.
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { G } from '../../../shared/fixtures/Fixtures';
import { Backdrop, EASE, FONT, Grain, SpeedBlur, mix, ramp, tracking } from '../../../shared/fixtures/Polish';
import { BRAND } from '../../../shared/fixtures/Brand';

export const LETTER_DROP_PHYSICS_DURATION = 150;

// Deterministic pseudo-random
const h = (n: number) => {
  const s = Math.sin(n * 127.3) * 43758.5453;
  return s - Math.floor(s);
};

const WORD = BRAND.short; // 'shorts-kit' (no descenders, all baselines rest on the floor)
const SIZE = 176; // font size
const FLOOR_Y = 600; // floor line (character baseline)
const BASE = Math.round(SIZE * 0.886); // line box top to baseline (SF Pro, measured at lineHeight 1)
const ROW_TOP = FLOOR_Y - BASE; // line box top: the baseline sits exactly on the floor line

const PAD = 200; // outward expansion of the motion-blur layer
const DROP = 720; // fall distance
const T_FALL = 24; // time to reach the floor
const T_B1 = 16; // duration of the first bounce (30% height)
const T_B2 = 8; // duration of the second bounce (9% height)
const SNAP = 110; // the beat where everything straightens in unison
const SNAP_DUR = 6;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

// Start frames: non-arithmetic stagger, getting denser
const startOf = (i: number) => 4 + 36 * (1 - Math.pow(1 - i / (WORD.length - 1), 1.5));

// Per-character vertical displacement (relative to the floor, negative = above)
const dropY = (t: number): number => {
  if (t <= 0) return -DROP;
  if (t < T_FALL) return -DROP + DROP * (t / T_FALL) ** 2; // gravity acceleration
  if (t < T_FALL + T_B1) {
    const u = (t - T_FALL) / T_B1;
    return -DROP * 0.3 * 4 * u * (1 - u); // bounce 1: 30%
  }
  if (t < T_FALL + T_B1 + T_B2) {
    const u = (t - T_FALL - T_B1) / T_B2;
    return -DROP * 0.09 * 4 * u * (1 - u); // bounce 2: 9%
  }
  return 0;
};

// Touchdown squash amount: three touchdowns (landing / first bounce landing / second bounce landing) each get a damped oscillation, intensity 1 / 0.45 / 0.18
const IMPACTS: [number, number][] = [
  [T_FALL, 1],
  [T_FALL + T_B1, 0.45],
  [T_FALL + T_B1 + T_B2, 0.18],
];
const squashAt = (t: number) => {
  let s = 0;
  for (const [t0, k] of IMPACTS) {
    const d = t - t0;
    if (d < 0 || d > 16) continue;
    s += k * Math.exp(-d / 2.6) * Math.cos(d * 0.85);
  }
  return s;
};

export const LetterDropPhysics: React.FC = () => {
  const frame = useCurrentFrame();
  // Frame 110 straightening: 108–110 intake swells up, 110–116 ease-out falls back
  const inhale = ramp(frame, SNAP - 2, 2, EASE.out);
  const snap = ramp(frame, SNAP, SNAP_DUR, EASE.snappy);
  const snapRot = ramp(frame, SNAP, SNAP_DUR + 2, EASE.overshoot); // the tilt straightens with a bit of overshoot
  const pulse = 0.06 * inhale * (1 - snap);
  // Subtitle: floats out after the straightening
  const sub = ramp(frame, SNAP + 4, 18, EASE.out);

  return (
    <div style={{ width: 1920, height: 1080, overflow: 'hidden', position: 'relative', fontFamily: FONT.sans }}>
      <Backdrop tone="light" light={{ x: 0.5, y: 0.16 }} grain={0} vignette={0.16} />

      {/* Floor: a table surface below the horizon that deepens downward + a hairline horizon fading out at both ends */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: FLOOR_Y, bottom: 0,
        background: 'linear-gradient(180deg, rgba(40,42,52,0.035) 0%, rgba(40,42,52,0.012) 30%, rgba(40,42,52,0) 64%)',
      }} />
      <div style={{
        position: 'absolute', left: 160, right: 160, top: FLOOR_Y, height: 1,
        background: 'linear-gradient(90deg, rgba(20,22,28,0) 0%, rgba(20,22,28,0.16) 22%, rgba(20,22,28,0.16) 78%, rgba(20,22,28,0) 100%)',
      }} />
      <div style={{
        position: 'absolute', left: 160, right: 160, top: FLOOR_Y + 1, height: 1,
        background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.7) 70%, rgba(255,255,255,0) 100%)',
      }} />

      {/* Letter row: flex lays out slots at natural glyph widths, the character in each slot only does transform */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: ROW_TOP, height: SIZE,
        display: 'flex', justifyContent: 'center',
        fontSize: SIZE, fontWeight: 800, lineHeight: 1, letterSpacing: tracking(SIZE, true), color: G.ink1,
      }}>
        {WORD.split('').map((ch, i) => {
          const t = frame - startOf(i);
          const y = dropY(t);
          const vy = dropY(t + 0.5) - dropY(t - 0.5);
          const air = -y; // height above the ground
          // At the instant of landing, tilts to a small seed angle (±6°), 0 before landing; the snap beat straightens it to zero in unison
          const tiltTarget = (h(i + 1) - 0.5) * 12;
          const landP = EASE.out(clamp01((t - T_FALL) / 6));
          const rot = tiltTarget * landP * (1 - snapRot);
          // Standing tilted = one bottom corner on the ground: lift the letter by sin|θ|·half the glyph width per the tilt angle, so the bottom corner always touches the ground without piercing it
          const jitter = -Math.sin((Math.abs(rot) * Math.PI) / 180) * 48;
          // Stretch (fall speed) + squash (touchdown), volume-preserving: scaleX ≈ 1/scaleY
          const stretch = Math.min(1, Math.abs(vy) / 60) * 0.1 * (t < T_FALL ? 1 : 0.6);
          const sq = squashAt(t);
          const sy = (1 + stretch) * (1 - 0.2 * sq) + pulse;
          const sx = (1 - stretch * 0.55) * (1 + 0.15 * sq) + pulse;
          // Contact shadow: small and solid on the ground, large, blurry and faint off the ground; almost invisible before entering the frame
          const lift = clamp01(air / 420);
          const shOp = (t < 0 ? 0 : 0.2) * (1 - lift * 0.85) * clamp01((t + 2) / 8);
          const shW = mix(0.74, 1.3, lift) * (1 + 0.12 * Math.max(0, sq));
          const shBlur = mix(7, 28, lift);
          return (
            <span key={i} style={{ position: 'relative', display: 'inline-block' }}>
              {/* Placeholder letter: holds up the natural glyph width, invisible */}
              <span style={{ visibility: 'hidden' }}>{ch}</span>
              {/* Contact shadow */}
              <div style={{
                position: 'absolute', left: '50%', top: BASE - 7, width: '84%', height: 14,
                transform: `translateX(-50%) scaleX(${shW.toFixed(3)})`,
                borderRadius: '50%', background: 'rgba(22,24,34,1)',
                opacity: shOp, filter: `blur(${shBlur.toFixed(1)}px)`,
              }} />
              {/* Motion layer: displacement outside, blur moves with it (full during the fall, halved during bounces, to avoid smearing into a blob at touchdown); squash / tilt about the touchdown point */}
              {/* Blur layer expanded by PAD on all sides: the SVG filter region is computed from the element box, a box that is too tight clips the trail into a hard edge */}
              <div style={{
                position: 'absolute', left: -PAD, right: -PAD, top: -PAD, bottom: -PAD,
                transform: `translateY(${(y + jitter).toFixed(2)}px)`,
              }}>
                <SpeedBlur vx={0} vy={vy} amount={t < T_FALL ? 0.26 : 0.12} max={16}>
                  <div style={{
                    position: 'absolute', left: PAD, right: PAD, top: PAD, bottom: PAD, textAlign: 'center',
                    transform: `rotate(${rot.toFixed(3)}deg) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`,
                    transformOrigin: '50% 86%',
                  }}>
                    {ch}
                  </div>
                </SpeedBlur>
              </div>
            </span>
          );
        })}
      </div>

      {/* Subtitle: the period after the one beat of straightening */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: FLOOR_Y + 70, textAlign: 'center',
        fontSize: 36, fontWeight: 500, letterSpacing: tracking(36), color: G.ink2,
        opacity: sub, transform: `translateY(${((1 - sub) * 10).toFixed(2)}px)`,
      }}>
        Every shot lands on the beat.
      </div>

      <Grain opacity={0.05} />
    </div>
  );
};
