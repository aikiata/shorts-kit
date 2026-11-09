// magician-card-flourish: the magician flicks a card. A blue starburst flashes, the card is "conjured" out of the light,
// flies toward the camera on a fast-spinning arc, hard-freezes the instant it lands, then a single sheen sweeps across after the freeze.
//
// Second-round redesign (midnight blue, launch-event invitation):
// - look = midnight. The card is no longer a white-background small-text poster but a deep navy shorts-kit "Launch Film" premiere ticket:
//   the central emblem = the shorts-kit logo, resting on the concentric thin rings + crossed needle lines that the opening starburst "leaves on the card", with large type Launch / Film +
//   a session number; the card face has a holographic foil layer that shifts color with the spin angle (shimmers in flight, freezes on the freeze). The card back is a crest + logo.
// - Composition: the card lands at the left third of the frame (cx=700, card height ≈ 86% of frame height), the right side is left for a set of shorts-kit promo copy,
//   revealed line by line only after the freeze; during the hold something is always moving and the frame reads as a complete invitation poster.
// - Starburst (values set by the user round by round, kept): X-shaped diagonal needle beams + small central bright dot / glow / short radial spikes, rotating 90° within 9f.
//   Flash point = card landing point: the viewer first sees where the light is, and the card is "conjured" from there, loops around an arc and returns here to freeze.
// - Launch: slow-in (only 6% of the distance in the first 14% of the time) → slope jump kicks it out → cubic ease-out arc deceleration;
//   spins 13 full turns around the card's diagonal axis, the last 60% with angular velocity decaying at power 2.4; a whole number of turns guarantees the freeze lands front-facing.
// - Freeze = everything frozen, zero rebound (the magic feel). At the instant of landing: a ring of blue light pulses outward from the card edge (a "snap"),
//   the backlight behind the card comes on, the stage key light goes from dark to bright; 8f later a sheen diagonal band sweeps through once (clipped into the rounded corners, Q4).
//
// Timeline (30fps, 156f total):
//   0-9     starburst flashes (9f, brightens over 2.5f → small flicker → collapses, rotates 90°); stage darkened with only a little cool light
//   9-57    flight 48f: slow-in 7f → launch → arc deceleration; CameraMotionBlur wraps only the flight segment
//   57      hard freeze; light pulse 57-79, backlight and stage light come up over 53-85
//   65-91   sheen sweep once (26f)
//   62-100  right-side copy: eyebrow letter-spacing tightens 63 → headline two lines rise 67/74 → sub-copy word by word 86
//   104-156 hold: backlight breathes very slowly, floating dust drifts, the last ~1.7s is a complete invitation poster
import React, { useId } from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import { EASE, FONT, ramp } from '../../../shared/fixtures/Polish';
import { Dust, LOOKS, Stage, TextReveal, alpha, type } from '../../../shared/fixtures/Look';
import { BRAND, ShortKitMark } from '../../../shared/fixtures/Brand';

const L = LOOKS.midnight;

const CARD_W = 380;
const CARD_H = 540;
// diagonal axis (the card's own diagonal direction, normalized)
const AX = CARD_W / Math.hypot(CARD_W, CARD_H);
const AY = CARD_H / Math.hypot(CARD_W, CARD_H);

// ── timeline (30fps / 156 frames) ──
export const MAGICIAN_CARD_FLOURISH_DURATION = 156;
const TAKEOFF = 9; // the card only takes off after the opening light effect lasts 0.3s (9f)
const FLASH_END = 12; // flash tail fully gone (collapse drags on by 3 frames)
const FLIGHT = 48; // flight frames
const LAND = TAKEOFF + FLIGHT; // f=57 hard freeze
const SHEEN_START = LAND + 8; // sheen starts after the freeze has held for 8 frames
const SHEEN_DUR = 26; // sheen duration (one-shot)
const TURNS = 13; // total turns in flight (integer → the card is exactly front-facing toward the camera at the freeze)
const FINAL_SCALE = 1.72; // final state: card height 540×1.72≈929 ≈ 86% of frame height
const CX = 700; // landing point (= flash point)
const CY = 540;
const TEXT_X = 1130; // left edge of the right-side copy

// card front: 380×540 design coordinates; the outer layer is laid out at ×FINAL_SCALE then rasterized with zoom (the frozen frame is natively sharp, Q2)
const CardFace: React.FC<{ theta: number }> = ({ theta }) => {
  const gid = useId().replace(/[^a-zA-Z0-9]/g, '');
  // holographic foil: hue rolls with the spin angle (shimmers in flight, theta freezes after the freeze → static)
  const holo = (theta * 0.9) % 360;
  return (
    <div style={{
      width: CARD_W, height: CARD_H, borderRadius: 24, boxSizing: 'border-box', padding: '22px 24px 24px',
      position: 'relative', overflow: 'hidden', fontFamily: FONT.sans, color: L.ink,
      background: 'linear-gradient(165deg, #16244a 0%, #0d1631 46%, #080d20 100%)',
      boxShadow: 'inset 0 0 0 1px rgba(170,200,255,0.16), inset 0 1px 0 rgba(255,255,255,0.22)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* holographic foil: just a swipe above the emblem area, screen blend */}
      <div style={{
        position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: 0.28,
        background: `conic-gradient(from ${holo}deg at 50% 40%, rgba(91,140,255,0.0), rgba(62,230,208,0.5), rgba(91,140,255,0.0), rgba(167,139,250,0.45), rgba(91,140,255,0.0))`,
        WebkitMaskImage: 'radial-gradient(ellipse 70% 46% at 50% 40%, #000 0%, transparent 75%)',
      }} />
      {/* brand row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
        <ShortKitMark size={22} tone="dark" />
        <div style={{ fontFamily: BRAND.font, fontSize: 14, fontWeight: 700, letterSpacing: '0.03em' }}>{BRAND.name}</div>
        <div style={{ marginLeft: 'auto', fontFamily: FONT.mono, fontSize: 11, color: L.ink2, letterSpacing: '0.04em' }}>SC 01 · TAKE 01</div>
      </div>
      {/* emblem: concentric thin rings + crossed needle lines (the "fossil" of the opening starburst) + shorts-kit logo (the logo itself gets no glow; the halo behind it is stage light) */}
      <div style={{ flex: 1, position: 'relative' }}>
        <svg viewBox="-190 -150 380 300" width={332} height={262} style={{ position: 'absolute', left: 0, top: 6 }}>
          <defs>
            <radialGradient id={`halo${gid}`}>
              <stop offset="0" stopColor="#5b8cff" stopOpacity="0.55" />
              <stop offset="1" stopColor="#5b8cff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`ray${gid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#bcd4ff" stopOpacity="0.9" />
              <stop offset="1" stopColor="#5b8cff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle r={130} fill={`url(#halo${gid})`} />
          {/* rings and needle lines both start outward from the logo's outer edge (≈56 units): the logo is an open viewfinder frame, and lines must not pass through the opening */}
          {[68, 94, 120].map((r, i) => (
            <circle key={r} r={r} fill="none" stroke={`rgba(170,200,255,${0.18 - i * 0.04})`} strokeWidth={0.8} />
          ))}
          {[-38, 52, 142, 232].map((d, i) => (
            <path key={d} transform={`rotate(${d})`} d={`M 62 -0.9 L ${i % 2 ? 110 : 180} 0 L 62 0.9 Z`} fill={`url(#ray${gid})`} />
          ))}
        </svg>
        {/* logo sits at the svg center (svg 332×262 @ top 6, viewBox origin at the center → screen center (166, 137)) */}
        <ShortKitMark size={112} tone="dark" style={{ position: 'absolute', left: 166 - 56, top: 6 + 131 - 56 }} />
      </div>
      {/* title */}
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.24em', color: L.accent, marginBottom: 8 }}>PREMIERE · REEL 01</div>
        <div style={{ fontSize: 58, fontWeight: 760, letterSpacing: '-0.045em', lineHeight: 0.92 }}>Launch</div>
        <div style={{ fontSize: 58, fontWeight: 300, letterSpacing: '-0.04em', lineHeight: 0.98, color: '#c9d6f5' }}>Film</div>
      </div>
      {/* bottom ticket stub row */}
      <div style={{
        position: 'relative', display: 'flex', alignItems: 'center', marginTop: 18, paddingTop: 12,
        borderTop: '1px dashed rgba(170,200,255,0.22)', fontFamily: FONT.mono, fontSize: 11, color: L.ink2, letterSpacing: '0.06em',
      }}>
        <span>ADMIT ONE</span>
        <span style={{ marginLeft: 'auto' }}>1920×1080 · 30 FPS</span>
      </div>
    </div>
  );
};

// card back: deep navy + fine crest + central shorts-kit logo
const CardBack: React.FC = () => (
  <div style={{
    position: 'absolute', inset: 0, borderRadius: 24, overflow: 'hidden',
    background: 'linear-gradient(160deg, #1b2a55 0%, #101a3a 55%, #0a1028 100%)',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.18)',
  }}>
    <div style={{
      position: 'absolute', inset: 0,
      background:
        'repeating-linear-gradient(45deg, rgba(150,180,255,0.07) 0 1px, transparent 1px 12px), ' +
        'repeating-linear-gradient(-45deg, rgba(150,180,255,0.07) 0 1px, transparent 1px 12px)',
    }} />
    <div style={{
      position: 'absolute', inset: 22, borderRadius: 14, boxShadow: 'inset 0 0 0 1px rgba(200,215,255,0.24)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <ShortKitMark size={120} tone="dark" />
    </div>
  </div>
);

// ── opening starburst (the form the user converged on round by round from reference image IMG_2505, kept) ──
// X-shaped diagonal needle beams (long axis 840 / short axis 420) + small central bright dot + blue glow + short radial spikes; rotates 90° within 9f.
const SpawnFlash: React.FC<{ f: number }> = ({ f }) => {
  const SPIKE_ID = `mcf-needle-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  if (f > FLASH_END) return null;
  const grow = interpolate(f, [0, 2.5], [0.2, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });
  const shrink = interpolate(f, [6, TAKEOFF, FLASH_END], [1, 0.3, 0.05], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad) });
  const s = grow * shrink;
  const flicker = 0.94 + 0.06 * (0.5 + 0.5 * Math.sin(f * 1.9) * Math.sin(f * 0.83 + 1.7));
  const opacity = interpolate(f, [0, 1.5, 6, FLASH_END], [0.35, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) * flicker;
  const rot = interpolate(f, [0, FLASH_END], [0, 90], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) });
  const needle = (deg: number, len: number, w0: number) => (
    <g key={`${deg}-${len}-${w0}`} transform={`rotate(${deg})`}>
      <path d={`M 0 ${-w0 / 2} L ${len} 0 L 0 ${w0 / 2} Z`} fill={`url(#${SPIKE_ID})`} />
      <path d={`M 0 ${-w0 / 2} L ${len} 0 L 0 ${w0 / 2} Z`} fill={`url(#${SPIKE_ID})`} transform="scale(-1,1)" />
    </g>
  );
  return (
    <div style={{ position: 'absolute', left: CX, top: CY, width: 0, height: 0, transform: `scale(${s})`, opacity, pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', left: -13, top: -13, width: 26, height: 26, borderRadius: 13,
        background: 'radial-gradient(circle, #ffffff 0%, rgba(225,245,255,0.95) 45%, rgba(140,215,255,0) 80%)', filter: 'blur(0.6px)',
      }} />
      <div style={{
        position: 'absolute', left: -70, top: -70, width: 140, height: 140, borderRadius: 70,
        background: 'radial-gradient(circle, rgba(90,175,255,0.75) 0%, rgba(50,130,245,0.35) 45%, rgba(40,110,235,0) 75%)', filter: 'blur(4px)',
      }} />
      <svg width={260} height={260} viewBox="-130 -130 260 260" style={{ position: 'absolute', left: -130, top: -130, transform: `rotate(${-rot * 0.6}deg)` }}>
        {[15, 52, 88, 123, 160, 197, 231, 268, 305, 341].map((deg, i) => {
          const ln = 46 + ((i * 37) % 3) * 16;
          return (
            <g key={deg} transform={`rotate(${deg})`} opacity={0.75}>
              <path d={`M 8 -1.1 L ${ln} 0 L 8 1.1 Z`} fill="rgba(150,210,255,0.85)" filter="blur(0.8px)" />
            </g>
          );
        })}
      </svg>
      <svg width={3200} height={3200} viewBox="-1600 -1600 3200 3200" style={{ position: 'absolute', left: -1600, top: -1600, transform: `rotate(${rot}deg)` }}>
        <defs>
          <linearGradient id={SPIKE_ID} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#eaf6ff" stopOpacity="1" />
            <stop offset="0.05" stopColor="#8cc8ff" stopOpacity="0.95" />
            <stop offset="0.3" stopColor="#3f9bff" stopOpacity="0.88" />
            <stop offset="0.62" stopColor="#2277f2" stopOpacity="0.6" />
            <stop offset="0.88" stopColor="#1b64e0" stopOpacity="0.25" />
            <stop offset="1" stopColor="#1a5fd8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g filter="blur(7px)" opacity={0.75}>{needle(-38, 826, 26)}</g>
        <g filter="blur(1.8px)">{needle(-38, 840, 8)}</g>
        {needle(-38, 819, 3)}
        <g filter="blur(5px)" opacity={0.75}>{needle(52, 413, 20)}</g>
        <g filter="blur(1.5px)">{needle(52, 420, 6.5)}</g>
        {needle(52, 410, 2.6)}
      </svg>
    </div>
  );
};

// flight state (pure function of the frame; after the freeze tEff=1 freezes everything)
const flight = (f: number) => {
  const tEff = Math.min(1, Math.max(0, (f - TAKEOFF) / FLIGHT));
  // spin: first 40% nearly constant and very fast, then decays at power 2.4; spinP(1)=1 → whole turns → freeze front-facing
  const spinP = tEff < 0.4 ? tEff * 1.55 : 0.62 + 0.38 * (1 - Math.pow(1 - (tEff - 0.4) / 0.6, 2.4));
  const theta = TURNS * 360 * Math.min(1, spinP);
  // travel: slow-in (6% of the travel in the first 14% of the time) → launch → cubic ease-out deceleration
  const tp = tEff < 0.14 ? 0.06 * (tEff / 0.14) ** 2 : 0.06 + 0.94 * (1 - Math.pow(1 - (tEff - 0.14) / 0.86, 3));
  // arc: starts from the landing point, swings out to the upper right (through where the copy will later sit), then returns to the landing point
  const arc = Math.sin(tp * Math.PI);
  const cx = CX + arc * 470;
  const cy = CY - arc * 230;
  // depth: true perspective scale=F/(F+z), z pushes in from very far to 0
  const FOCAL = 900;
  const z = 14000 * (1 - tp);
  const scale = FINAL_SCALE * (FOCAL / (FOCAL + z));
  return { tEff, theta, cx, cy, scale };
};

const Card: React.FC = () => {
  const f = useCurrentFrame();
  const { theta, cx, cy, scale } = flight(f);
  const facingBack = Math.cos((theta * Math.PI) / 180) < 0;
  const sheenP = ramp(f, SHEEN_START, SHEEN_DUR, EASE.smooth);
  const sheenOn = f >= SHEEN_START && f <= SHEEN_START + SHEEN_DUR;
  const W = CARD_W * FINAL_SCALE;
  const H = CARD_H * FINAL_SCALE;
  const R = 24 * FINAL_SCALE;
  const landed = f >= LAND;
  const sin = Math.sin((theta * Math.PI) / 180);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', left: cx - W / 2, top: cy - H / 2, width: W, height: H,
        transform: `scale(${scale / FINAL_SCALE})`, transformOrigin: '50% 50%', opacity: f >= TAKEOFF ? 1 : 0,
      }}>
        <div style={{
          width: '100%', height: '100%', position: 'relative', borderRadius: R,
          transform: `perspective(${1300 * FINAL_SCALE}px) rotate3d(${AX}, ${AY}, 0, ${theta}deg)`, transformOrigin: '50% 50%',
          // after the freeze: two hue-tinted dark shadow layers + a very faint blue rim light
          boxShadow: landed
            ? `0 40px 90px -20px rgba(0,2,10,0.9), 0 12px 30px rgba(0,2,10,0.6), 0 0 0 1px rgba(140,175,255,0.18), 0 0 80px ${alpha(L.accent, 0.22)}`
            : `0 0 70px ${alpha(L.accent, 0.55)}, 0 0 0 1px rgba(160,195,255,0.35)`, // in flight: the card still carries the light from when it was conjured (dragged into a light trail by motion blur)
        }}>
          <div style={{ position: 'absolute', inset: 0, zoom: FINAL_SCALE }}>
            <CardFace theta={theta} />
            <div style={{ opacity: facingBack ? 1 : 0, position: 'absolute', inset: 0 }}><CardBack /></div>
          </div>
          {/* moving side light while spinning (on the card face); frozen with theta after the freeze */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: R, pointerEvents: 'none', mixBlendMode: 'screen',
            background: `linear-gradient(${115 + sin * 30}deg, rgba(255,255,255,0) 30%, rgba(200,220,255,${0.08 + 0.16 * Math.abs(sin)}) 50%, rgba(255,255,255,0) 70%)`,
          }} />
          {/* one-shot sheen after the freeze: diagonal highlight band left→right (clipped into the rounded corners, Q4) */}
          {sheenOn && (
            <div style={{ position: 'absolute', inset: 0, borderRadius: R, overflow: 'hidden', pointerEvents: 'none' }}>
              <div style={{
                position: 'absolute', top: '-45%', bottom: '-45%', left: `${-70 + sheenP * 215}%`, width: '34%', transform: 'rotate(16deg)',
                background: 'linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(210,225,255,0.10) 35%, rgba(235,242,255,0.34) 50%, rgba(210,225,255,0.10) 65%, rgba(255,255,255,0) 100%)',
                mixBlendMode: 'screen',
              }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// light pulse at the instant of landing: a rounded frame the same shape as the card spreads outward from the card edge and fades out (once)
const LandPulse: React.FC = () => {
  const f = useCurrentFrame();
  if (f < LAND || f > LAND + 24) return null;
  const p = ramp(f, LAND, 22, EASE.out);
  const W = CARD_W * FINAL_SCALE;
  const H = CARD_H * FINAL_SCALE;
  const grow = 1 + p * 0.14;
  return (
    <div style={{
      position: 'absolute', left: CX - W / 2, top: CY - H / 2, width: W, height: H, borderRadius: 24 * FINAL_SCALE,
      transform: `scale(${grow})`, opacity: (1 - p) * 0.9, pointerEvents: 'none',
      boxShadow: `0 0 0 ${(2.5 - p * 1.5).toFixed(2)}px ${alpha('#9cc0ff', 0.9)}, 0 0 40px ${alpha(L.accent, 0.7)}, inset 0 0 40px ${alpha(L.accent, 0.35)}`,
    }} />
  );
};

// right-side copy: appears only after the freeze (eyebrow letter-spacing tightens → headline two lines rise → sub-copy word by word)
const Copy: React.FC = () => {
  const f = useCurrentFrame();
  const rule = ramp(f, 62, 22, EASE.snappy);
  return (
    <div style={{ position: 'absolute', left: TEXT_X, top: 300, width: 700, color: L.ink }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 34 }}>
        <div style={{ width: 56 * rule, height: 2, background: L.accent, boxShadow: `0 0 12px ${alpha(L.accent, 0.8)}` }} />
        <TextReveal text="NOW SHOWING" variant="track" start={63} each={20} gap={0.8}
          style={{ ...type(TYPE_LABEL, 700, { caps: true }), letterSpacing: '0.26em', color: L.accent }} />
      </div>
      <div style={{ ...type(132, 780), color: L.ink }}>
        <TextReveal text={'Craft\nthe shot.'} by="line" variant="rise" start={67} each={22} gap={7} />
      </div>
      <div style={{ ...type(36, 420), color: L.ink2, marginTop: 40, maxWidth: 600, lineHeight: 1.38, letterSpacing: '-0.01em' }}>
        <TextReveal text={'Cinematic product videos,\ncrafted by your agent.'} by="word" variant="blur" start={86} each={16} gap={1.6} />
      </div>
    </div>
  );
};
const TYPE_LABEL = 24;

export const MagicianCardFlourish: React.FC = () => {
  const f = useCurrentFrame();
  const moving = f >= TAKEOFF && f <= LAND;
  // stage light: darkens during the flash (so the starburst is the only light source), comes up around the landing, breathes very slowly in the hold
  const lit = ramp(f, LAND - 6, 30, EASE.out);
  const back = lit * (1 + 0.06 * Math.sin((f - LAND) / 16));
  return (
    <AbsoluteFill style={{ background: L.bg[2] }}>
      <Stage look={L} keyLight={{ x: CX / 1920, y: 0.1 }} fill={null} intensity={0.25 + 0.75 * lit} vignette={0.6}>
        {/* backlight behind the card: a blue glow that comes up after landing */}
        <div style={{
          position: 'absolute', left: CX - 620, top: CY - 560, width: 1240, height: 1120, opacity: back,
          background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${alpha(L.light, 0.38)} 0%, ${alpha(L.light, 0.1)} 42%, ${alpha(L.light, 0)} 70%)`,
        }} />
        <Dust look={L} count={26} seed={7} drift={0.22} opacity={0.35 + 0.35 * lit} />
      </Stage>
      {moving ? (
        <CameraMotionBlur shutterAngle={150} samples={7}>
          <Card />
        </CameraMotionBlur>
      ) : (
        <Card />
      )}
      <LandPulse />
      <Copy />
      {/* flash layer is independent of CameraMotionBlur (rotating thin needle beams would be split into striped ghost copies by sampling) */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <SpawnFlash f={f} />
      </div>
    </AbsoluteFill>
  );
};
