// Kanada perspective snap (kanada-perspective-snap): Yoshinori Kanada style exaggerated perspective entrance: the card hugs the lens at a fisheye-level perspective pose
// and whips in from the left to the center of the frame; perspective converges from short to long focal length as it decelerates, and at the instant of settling it "snaps" flat (rotateY overshoots, then returns to zero).
//
// Second redesign (aurora night, release-film premiere card):
// - look = aurora (purple-black, purple, pink). The hero is a release-film premiere card shot with shorts-kit (1000×580): the left half is a procedural illustration
//   (neon dusk sky + striped sun + city silhouette + water reflection), the right half is a 92px title "Launch Film", film info and a Watch now button.
//   At the top a 168px low-opacity big-type band "FRAME MOTION ✦ CRAFT THE SHOT" (brand tagline) serves as the poster base, drifting slowly in the opposite direction (parallax).
// - Whip-in 18f (2→20f): translateX −1350→0 + a slight downward arc, rotate3d(0.5,1,0.1) 62°→0, scale 1.8→1,
//   perspective 260→1800px, all EASE.snappy (a hard stop: fierce first, then gentle); horizontal SpeedBlur by x velocity + 7 pink-white speed lines behind.
// - The "snap" is in the overshoot: 16–20f rotateY rushes to +6°, from 20f a spring (damping 16) returns it to zero; on the same frame a 2f screen shake of 8px,
//   and a ring of anime focus lines (48 thin wedges pointing from the frame edge to the card center) disperses outward within 8f: Kanada's "freeze for a beat".
// - Follow-through: the in-card text settles 3f later than the card (the title's "drag shadow" straightens out of a −10° skew), and after settling the caption rises word by word.
//
// Timeline (30fps, 120f total):
//   0–2     setup: stage light and background big type are already there, the card's near corner sits beyond the left edge
//   2–20    perspective whip-in (main action 18f)
//   16–26   rotateY overshoot +6° → spring back to zero; 20f shake 2f + focus lines 8f
//   23–36   follow-through: in-card text slides in and settles a beat later, title skew straightens
//   34–56   caption "Premieres Friday · shot with shorts-kit" rises word by word
//   56–120  hold: very slow camera push 1→1.025, background big type drifts slowly
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, FONT, SpeedBlur, bezier, mix, ramp } from '../../../shared/fixtures/Polish';
import { LOOKS, Stage, TextReveal, alpha, springAt } from '../../../shared/fixtures/Look';
import { BRAND, ShortKitMark } from '../../../shared/fixtures/Brand';

export const KANADA_PERSPECTIVE_SNAP_DURATION = 120;

const L = LOOKS.aurora;
const PINK = L.accent2;
const T0 = 2; // whip-in start
const SNAP = 20; // settle frame
const CW = 1000;
const CH = 580;
const CX = (1920 - CW) / 2; // 460
const CY = 236;

// Deterministic pseudo-random
const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const progAt = (f: number) => ramp(f, T0, SNAP - T0, EASE.snappy);
// Pose (perspective / twist / scale) settles later than displacement: the card rushes into place "twisted" and is only flattened in the last few frames: the key of Kanada's style
const TWIST = bezier(0.62, 0, 0.3, 1);
const twistAt = (f: number) => ramp(f, T0, SNAP - T0 - 2, TWIST);
const txAt = (f: number) => mix(-1350, 0, progAt(f));
const tyAt = (f: number) => 120 * Math.sin((1 - progAt(f)) * Math.PI * 0.5) * (1 - progAt(f)); // slight downward arc

// Speed lines (y relative to card center, length factor, thickness)
const STREAKS = [-250, -170, -90, -20, 60, 140, 230].map((y, i) => ({ y, len: 0.7 + rnd(i + 3) * 0.6, w: 2 + rnd(i + 11) * 3 }));
// Focus lines: 48 thin wedges
const FOCUS = Array.from({ length: 48 }, (_, i) => ({
  a: (i / 48) * Math.PI * 2 + (rnd(i * 3.3) - 0.5) * 0.09,
  w: 0.006 + rnd(i * 5.1) * 0.014, // wedge angular width (radians)
  r0: 560 + rnd(i * 7.7) * 220, // inner end radius
}));
// City silhouette: deterministic buildings
const TOWERS = Array.from({ length: 16 }, (_, i) => ({ x: i * 36 - 6, w: 30 + rnd(i * 2.1) * 18, h: 50 + rnd(i * 4.7) ** 1.4 * 150 }));

const Artwork: React.FC = () => (
  <svg width={560} height={CH} viewBox={`0 0 560 ${CH}`} style={{ position: 'absolute', left: 0, top: 0 }}>
    <defs>
      <linearGradient id="kps-sky" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#1d0b3d" />
        <stop offset="0.38" stopColor="#5b1f78" />
        <stop offset="0.6" stopColor="#ff5fa2" />
        <stop offset="0.7" stopColor="#ffb36b" />
      </linearGradient>
      <linearGradient id="kps-sun" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#fff1a8" />
        <stop offset="0.55" stopColor="#ffb15e" />
        <stop offset="1" stopColor="#ff4f9a" />
      </linearGradient>
      <linearGradient id="kps-water" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#ff7aa8" stopOpacity="0.55" />
        <stop offset="1" stopColor="#14082a" stopOpacity="1" />
      </linearGradient>
      <mask id="kps-stripes">
        <rect x={0} y={0} width={560} height={CH} fill="#fff" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={0} y={300 + i * 18 + i * i * 1.2} width={560} height={3 + i * 2.2} fill="#000" />
        ))}
      </mask>
    </defs>
    <rect x={0} y={0} width={560} height={CH} fill="url(#kps-sky)" />
    {/* High-altitude stars */}
    {Array.from({ length: 30 }, (_, i) => (
      <circle key={i} cx={rnd(i * 9.1) * 560} cy={rnd(i * 3.7 + 1) * 180} r={0.8 + rnd(i * 1.3) * 1.6} fill="#fff" opacity={0.4 + rnd(i * 6.2) * 0.5} />
    ))}
    {/* Striped sun */}
    <circle cx={280} cy={330} r={150} fill="url(#kps-sun)" mask="url(#kps-stripes)" />
    <circle cx={280} cy={330} r={190} fill="none" stroke="#ffd3a1" strokeOpacity={0.18} strokeWidth={30} />
    {/* City silhouette + scattered lit windows */}
    {TOWERS.map((t, i) => (
      <g key={i}>
        <rect x={t.x} y={410 - t.h} width={t.w} height={t.h} fill={i % 3 === 0 ? '#2a0f45' : '#1b0a30'} />
        {Array.from({ length: Math.floor(t.h / 26) }, (_, k) =>
          rnd(i * 13 + k * 3.1) > 0.62 ? (
            <rect key={k} x={t.x + 6 + (k % 2) * 10} y={410 - t.h + 10 + k * 24} width={5} height={8} fill={rnd(i + k) > 0.5 ? '#ff8fc0' : '#ffd27a'} opacity={0.85} />
          ) : null,
        )}
      </g>
    ))}
    {/* Water reflection */}
    <rect x={0} y={410} width={560} height={CH - 410} fill="url(#kps-water)" />
    {Array.from({ length: 9 }, (_, i) => (
      <rect key={i} x={170 + rnd(i * 2.7) * 40 - i * 4} y={424 + i * 15} width={220 - i * 18 + rnd(i) * 30} height={3} rx={1.5} fill="#ffd7a0" opacity={0.55 - i * 0.05} />
    ))}
  </svg>
);

export const KanadaPerspectiveSnap: React.FC = () => {
  const frame = useCurrentFrame();

  const p = progAt(frame);
  const tw = twistAt(frame);
  const persp = mix(260, 1800, tw); // short-focal fisheye → long-focal flattening
  const angle3d = mix(62, 0, tw); // rotate3d(0.5,1,0.1)
  const scale = mix(1.8, 1, mix(p, tw, 0.5));
  const tx = txAt(frame);
  const ty = tyAt(frame);
  const vx = frame < SNAP + 2 ? txAt(frame + 0.5) - txAt(frame - 0.5) : 0;

  // rotateY overshoot: 16–20f rushes to +6°, from 20f a spring returns to zero (one visible rebound)
  const rotY = frame < SNAP ? 6 * ramp(frame, 15, 5, EASE.swift) : 6 * (1 - springAt(frame, SNAP, { damping: 16, stiffness: 260 }));

  // Settle shake: from 20f, 8px, decays over 2f (constantly 0 afterwards)
  const shakeAmp = frame >= SNAP && frame < SNAP + 3 ? 8 * (1 - (frame - SNAP) / 3) : 0;
  const shakeX = shakeAmp * (rnd(frame * 7 + 1) * 2 - 1);
  const shakeY = shakeAmp * (rnd(frame * 13 + 2) * 2 - 1);

  // Shadow: elongated slanted shadow in flight → collapses to a resting drop shadow on settling
  const air = 1 - ramp(frame, T0, SNAP - T0 + 4, EASE.out);
  const cardShadow =
    `0 ${(2 + air * 8).toFixed(1)}px ${(6 + air * 14).toFixed(1)}px ${alpha('#05010d', 0.5 - air * 0.2)}, ` +
    `${(air * 90).toFixed(1)}px ${(40 + air * 50).toFixed(1)}px ${(90 + air * 40).toFixed(1)}px -20px ${alpha('#05010d', 0.75)}, ` +
    `0 0 0 1px ${alpha('#d9c6ff', 0.14)}`;

  // Speed lines: length ∝ velocity, fade out when decelerating to ~5px/frame
  const streakA = ramp(Math.abs(vx), 5, 40, EASE.linear);

  // Focus lines: 8f from the settle frame, inner end radius retreats outward, fade out overall
  const fT = (frame - SNAP) / 9;
  const focusOn = fT >= 0 && fT < 1;

  // Follow-through: in-card text settles 3f later
  const follow = ramp(frame, SNAP + 3, 13, EASE.snappy);
  const skew = mix(-10, 0, follow);

  // Background big type: slow parallax drift + gets "dragged" a bit on the whip-in
  const bgX = -40 * ramp(frame, 0, 120, EASE.linear) - 60 * (1 - ramp(frame, 0, SNAP + 6, EASE.out));
  const push = 1 + 0.025 * ramp(frame, SNAP, 100, EASE.swift);

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Stage look={L} keyLight={{ x: 0.5, y: 0.18 }} fill={{ x: 0.14, y: 0.92 }} horizon={0.83} />
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${shakeX.toFixed(2)}px, ${shakeY.toFixed(2)}px) scale(${push.toFixed(5)})` }}>
        {/* Top low-opacity solid big-type band (a stroke would expose the overlapping outlines of the variable font, so solid is used): a poster key-visual style brand tagline marquee, cropped at both ends of the frame */}
        <div style={{
          position: 'absolute', left: -400, top: 28, transform: `translateX(${bgX.toFixed(1)}px)`,
          font: `900 168px ${FONT.sans}`, letterSpacing: '-0.035em', lineHeight: 1, color: alpha('#c9b6ff', 0.085), whiteSpace: 'nowrap',
          opacity: ramp(frame, 0, 10, EASE.out),
        }}>
          FRAME MOTION <span style={{ color: alpha(PINK, 0.22) }}>✦</span> CRAFT THE SHOT <span style={{ color: alpha(PINK, 0.22) }}>✦</span> FRAME MOTION
        </div>

        {/* Focus lines */}
        {focusOn && (
          <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, opacity: (1 - fT) * 0.9 }}>
            {FOCUS.map((l, i) => {
              const r0 = l.r0 + EASE.out(fT) * 420;
              const r1 = 1500;
              const cx = 960;
              const cy = CY + CH / 2;
              const pts = [
                [cx + Math.cos(l.a - l.w) * r1, cy + Math.sin(l.a - l.w) * r1],
                [cx + Math.cos(l.a) * r0, cy + Math.sin(l.a) * r0],
                [cx + Math.cos(l.a + l.w) * r1, cy + Math.sin(l.a + l.w) * r1],
              ];
              return <polygon key={i} points={pts.map((q) => q.map((v) => v.toFixed(1)).join(',')).join(' ')} fill={i % 4 === 0 ? PINK : '#f3ecff'} opacity={i % 4 === 0 ? 0.75 : 0.5} />;
            })}
          </svg>
        )}

        {/* Speed lines (behind the card, horizontal trail) */}
        {streakA > 0.001 &&
          STREAKS.map((s, i) => {
            const len = Math.min(1400, Math.abs(vx) * 9 * s.len);
            const x1 = CX + tx + 120;
            return (
              <div key={i} style={{
                position: 'absolute', left: x1 - len, top: CY + CH / 2 + ty + s.y * mix(1.5, 1, p) - s.w / 2, width: len, height: s.w, borderRadius: s.w,
                background: `linear-gradient(90deg, ${alpha(i % 3 === 0 ? PINK : '#f3ecff', 0)} 0%, ${alpha(i % 3 === 0 ? PINK : '#f3ecff', 0.7)} 100%)`,
                opacity: streakA,
              }} />
            );
          })}

        {/* Perspective container + card */}
        <SpeedBlur vx={vx} amount={0.2} max={26}>
          <div style={{ position: 'absolute', left: CX, top: CY, width: CW, height: CH, perspective: `${persp.toFixed(1)}px`, perspectiveOrigin: '30% 50%' }}>
            <div style={{
              position: 'absolute', inset: 0,
              transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${scale.toFixed(4)}) rotate3d(0.5, 1, 0.1, ${angle3d.toFixed(3)}deg) rotateY(${rotY.toFixed(3)}deg)`,
              transformOrigin: '20% 50%',
            }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 30, overflow: 'hidden', background: '#170f2a', boxShadow: cardShadow }}>
                <Artwork />
                {/* Transition between the illustration and the info area */}
                <div style={{ position: 'absolute', left: 470, top: 0, width: 98, height: CH, background: `linear-gradient(90deg, ${alpha('#170f2a', 0)} 0%, #170f2a 100%)` }} />
                {/* Info area: settles a beat later */}
                <div style={{
                  position: 'absolute', left: 600, top: 0, width: 360, height: CH, fontFamily: FONT.sans, color: L.ink,
                  transform: `translateX(${mix(-36, 0, follow).toFixed(2)}px)`, opacity: mix(0.4, 1, follow),
                }}>
                  <div style={{ position: 'absolute', top: 76, left: 0, height: 44, padding: '0 16px', borderRadius: 10, background: PINK, color: '#1a0614', display: 'flex', alignItems: 'center', font: `800 22px ${FONT.mono}`, letterSpacing: '0.1em' }}>
                    PREMIERE
                  </div>
                  {/* Studio logo: right-aligned on the same row as the PREMIERE tag */}
                  <ShortKitMark size={44} tone="dark" style={{ position: 'absolute', top: 76, right: 0 }} />
                  <div style={{ position: 'absolute', top: 150, left: -4, font: `880 92px ${FONT.sans}`, letterSpacing: '-0.05em', lineHeight: 0.92, transform: `skewX(${skew.toFixed(2)}deg)`, transformOrigin: '0 100%' }}>
                    Launch
                    <br />
                    Film
                  </div>
                  <div style={{ position: 'absolute', top: 338, left: 0, font: `600 30px ${FONT.sans}`, color: L.ink2, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                    Your product, in motion.
                  </div>
                  <div style={{ position: 'absolute', top: 382, left: 0, font: `500 26px ${FONT.mono}`, color: L.ink3, letterSpacing: '0.04em' }}>60 SEC · 16:9 · 1080P</div>
                  <div style={{ position: 'absolute', top: 452, left: 0, display: 'flex', gap: 14 }}>
                    <div style={{ height: 64, padding: '0 28px', borderRadius: 32, background: '#f7f2ff', color: '#140a24', display: 'flex', alignItems: 'center', gap: 12, font: `750 28px ${FONT.sans}`, letterSpacing: '-0.01em', boxShadow: `0 10px 30px -10px ${alpha(PINK, 0.7)}` }}>
                      <svg width={20} height={22} viewBox="0 0 20 22"><path d="M2 2 L18 11 L2 20 Z" fill="#140a24" /></svg>
                      Watch now
                    </div>
                    <div style={{ width: 64, height: 64, borderRadius: 32, border: `2px solid ${alpha('#f7f2ff', 0.3)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', font: `400 36px ${FONT.sans}`, color: L.ink }}>+</div>
                  </div>
                </div>
                {/* Top-edge inner highlight */}
                <div style={{ position: 'absolute', inset: 0, borderRadius: 30, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)', pointerEvents: 'none' }} />
              </div>
            </div>
          </div>
        </SpeedBlur>

        {/* Caption: rises word by word after settling */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: CY + CH + 64, textAlign: 'center', font: `600 44px ${FONT.sans}`, letterSpacing: '-0.02em', color: L.ink }}>
          <TextReveal text="Premieres Friday" by="word" variant="rise" start={34} each={16} gap={4} />
          <span style={{ color: L.ink3 }}>
            <TextReveal text="  ·  shot with " by="word" variant="rise" start={40} each={16} gap={4} />
          </span>
          <span style={{ color: PINK }}>
            <TextReveal text={BRAND.name} by="word" variant="rise" start={46} each={16} gap={4} />
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
