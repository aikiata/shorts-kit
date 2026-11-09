// gradient-word-sweep v3: batch 12 fine-tuned per user feedback (v2 structure kept):
// 1) lightning leans magenta-purple + line width thinned (about halved);
// 2) overall bloom strength slightly lowered (each glow layer's opacity reduced);
// 3) wavefront trail gradient: the just-lit characters have the strongest glow, decaying with sweep distance to the steady state
//    (trailing-window brightening layer, fading to the steady-state breathing after the fill ends).
// Texture layer (revision v4):
// a) fix the "box glow": the glow layers' mask/clip were originally cropped to the text box, so blur spilling outside the box got cut into a rectangle;
//    now every blurred layer goes into a Halo box expanded by PAD on all sides, and the mask color stops are converted back to text coordinates with calc;
// b) lightning goes from 36 random events down to 7 scheduled ones (spacing ≥9f, ≤1 on screen at once), the last goes out at ~92f, leaving breathing room at the end;
// c) entrance changed to two staggered blur-slide lines; the whole piece pushes in very slowly 1→1.025; the black base becomes a hue-tinted near-black + vignette + grain.
// Copy: the charge word Supercharged is kept (lightning and glow are laid out by its glyph width), the tagline is changed to shorts-kit's promo line.
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { EASE, Grain, Vignette, ramp } from '../../../shared/fixtures/Polish';
import { BRAND } from '../../../shared/fixtures/Brand';

const mulberry32 = (a: number) => () => {
  let t = (a += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const FONT = '"Avenir Next", Futura, "Helvetica Neue", sans-serif';
// Screenshot 5: S leans blue-cyan → purple mid-section → pink → amber at the tail
const GRAD = 'linear-gradient(92deg, #59c2ff 0%, #9d6bff 32%, #ff6ed4 62%, #ffc46b 100%)';

export const GRADIENT_WORD_SWEEP_DURATION = 105;

const FILL_START = 12;
const FILL_END = 30; // 18 frames ≈ 0.6s, fast sweep
const LIGHT_START = FILL_END + 3;

// ---------- Seeded noise and lightning ----------
const rand = mulberry32(20260718);
const FLICKER: number[] = Array.from({ length: 160 }, () => rand());

type Bolt = { d: string; long: boolean };
const makeLongBolt = (r: () => number): Bolt => {
  // Long arcs hooking over the word: spanning several characters, jagged polyline
  const x0 = 30 + r() * 220;
  const x1 = x0 + 160 + r() * 320;
  const yBase = 38 + r() * 42;
  const n = 7 + Math.floor(r() * 4);
  let d = `M ${x0.toFixed(1)} ${(yBase + 26 + r() * 20).toFixed(1)}`;
  for (let i = 1; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n + (r() - 0.5) * 22;
    const arch = Math.sin((i / n) * Math.PI) * -22; // arched in the middle
    const y = yBase + arch + (r() - 0.5) * 30 + (i === n ? 30 + r() * 18 : 0);
    d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return { d, long: true };
};
const makeShortBolt = (r: () => number): Bolt => {
  // Short hooks between characters: small vertical zigzags
  const x = 60 + r() * 540;
  const y0 = 72 + r() * 24;
  const y1 = y0 + 55 + r() * 45;
  const n = 4 + Math.floor(r() * 3);
  let d = `M ${x.toFixed(1)} ${y0.toFixed(1)}`;
  for (let i = 1; i <= n; i++) {
    const y = y0 + ((y1 - y0) * i) / n;
    const xx = x + (r() - 0.5) * 30;
    d += ` L ${xx.toFixed(1)} ${y.toFixed(1)}`;
  }
  return { d, long: false };
};

const BOLTS: Bolt[] = Array.from({ length: 16 }, (_, i) =>
  i % 3 === 0 ? makeShortBolt(rand) : makeLongBolt(rand),
);
// Flicker events: scheduled rather than random: sparse and scattered (≤1 on screen, spacing ≥9f), the last goes out at about 92f, leaving a settling breath
type Flash = { at: number; life: number; bolt: number };
const FLASH_AT = [2, 12, 22, 33, 43, 52, 56];
const FLASHES: Flash[] = FLASH_AT.map((d, k) => ({
  at: LIGHT_START + d,
  life: k === FLASH_AT.length - 1 ? 3 : 3 + Math.floor(rand() * 2),
  bolt: (k * 5 + 1) % BOLTS.length,
}));

// Expanded box: blurred glow layers go into a box expanded by PAD on all sides, so the mask no longer cuts the spilled light into a rectangle
const PAD = 90;
// Percentage x in text coordinates → mask color stop in the expanded box
const at = (x: number) => `calc(${PAD}px + (100% - ${PAD * 2}px) * ${(Math.max(-20, Math.min(120, x)) / 100).toFixed(4)})`;
const Halo: React.FC<{ mask?: string; style?: React.CSSProperties; children: React.ReactNode }> = ({ mask, style, children }) => (
  <span
    aria-hidden
    style={{
      position: 'absolute',
      left: -PAD,
      top: -PAD,
      right: -PAD,
      bottom: -PAD,
      padding: PAD,
      ...(mask ? { WebkitMaskImage: mask, maskImage: mask } : {}),
      ...style,
    }}
  >
    <span style={{ position: 'relative', display: 'block', width: '100%', height: '100%' }}>{children}</span>
  </span>
);

export const GradientWordSweep: React.FC = () => {
  const frame = useCurrentFrame();

  // Entrance: two staggered blur-slide lines (second line 4f later), the same snappy progress drives y/blur/opacity
  const enter1 = ramp(frame, 0, 14, EASE.snappy);
  const enter2 = ramp(frame, 4, 14, EASE.snappy);
  const lineIn = (e: number): React.CSSProperties => ({
    opacity: e,
    transform: `translateY(${(1 - e) * 36}px)`,
    filter: e < 0.999 ? `blur(${((1 - e) * 10).toFixed(2)}px)` : undefined,
  });
  // The whole piece pushes in very slowly (smooth, speed 0 at start and end)
  const push = 1 + 0.025 * ramp(frame, 0, 104, EASE.smooth);

  // Fast fill progress
  const p = interpolate(frame, [FILL_START, FILL_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const pPct = p * 100;
  const filling = frame >= FILL_START && frame <= FILL_END + 4;
  const headFade = interpolate(frame, [FILL_END, FILL_END + 6], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Wavefront trail: just-lit characters are brightest, decaying backward; after the fill ends the whole fades to the steady state
  const trailFade = interpolate(frame, [FILL_END, FILL_END + 10], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const TRAIL = 34; // trail length (% of width)
  const trailMask =
    `linear-gradient(90deg, transparent 0%, transparent ${at(pPct - TRAIL)}, ` +
    `rgba(0,0,0,0.9) ${at(pPct - 3)}, rgba(0,0,0,0.9) ${at(pPct + 1)}, ` +
    `transparent ${at(pPct + 6)})`;
  // Fill head bright core: only the wavefront's ~10% of the word width is exposed, with soft edges on both sides (the original clipPath hard crop → box)
  const headMask =
    `linear-gradient(90deg, transparent 0%, transparent ${at(pPct - 12)}, #000 ${at(pPct - 6)}, ` +
    `#000 ${at(pPct - 1)}, transparent ${at(pPct + 2)})`;

  const noise = FLICKER[Math.min(frame, FLICKER.length - 1)];
  // Lightning active on the current frame
  const active = FLASHES.filter((f) => frame >= f.at && frame < f.at + f.life);
  const boltBoost = active.length > 0 ? 0.35 : 0;
  // Glow breathing: after fully filled, a slight flicker with noise + brightens on lightning
  const glowLvl =
    interpolate(frame, [FILL_START, FILL_END], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }) *
    (0.82 + 0.18 * noise) +
    boltBoost;

  // Soft-edge mask: the glow layer's fill edge is not harsh
  const softMask = (soft: number): string | undefined =>
    p >= 1
      ? undefined
      : `linear-gradient(90deg, #000 0%, #000 ${at(pPct - soft)}, transparent ${at(pPct + soft * 0.6)})`;

  const lineStyle: React.CSSProperties = {
    fontFamily: FONT,
    fontWeight: 700,
    fontStyle: 'italic',
    fontSize: 92,
    letterSpacing: -1,
    lineHeight: 1.28,
    color: '#ffffff',
    whiteSpace: 'nowrap',
  };

  const gradText: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundImage: GRAD,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  };

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(ellipse 70% 70% at 50% 48%, #0d0b14 0%, #07060a 60%, #040405 100%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${push})` }}>
        {/* Ambient bloom behind the word (large radius, strengthens with the charge) */}
        <div
          style={{
            position: 'absolute',
            left: 500,
            top: 340,
            width: 820,
            height: 320,
            borderRadius: '50%',
            background:
              'radial-gradient(closest-side, rgba(180,110,255,0.6), rgba(255,110,212,0.25) 55%, transparent 78%)',
            filter: 'blur(38px)',
            opacity: 0.55 * glowLvl,
          }}
        />
      </div>
      <div style={{ textAlign: 'center', transform: `scale(${push})` }}>
        <div style={{ ...lineStyle, ...lineIn(enter1) }}>
          <span style={{ position: 'relative', display: 'inline-block' }}>
            <span>Supercharged</span>
            {/* AE-style glow: large-radius soft glow layer (blurriest) */}
            <Halo mask={softMask(14)} style={{ opacity: 0.55 * glowLvl }}>
              <span style={{ ...gradText, filter: 'blur(46px) saturate(1.6)', transform: 'scale(1.05)' }}>Supercharged</span>
            </Halo>
            {/* Mid halo layer */}
            <Halo mask={softMask(10)} style={{ opacity: 0.62 * glowLvl }}>
              <span style={{ ...gradText, filter: 'blur(18px) saturate(1.4) brightness(1.15)' }}>Supercharged</span>
            </Halo>
            {/* Near-core soft glow */}
            <Halo mask={softMask(7)} style={{ opacity: 0.72 * Math.min(1, glowLvl + 0.1) }}>
              <span style={{ ...gradText, filter: 'blur(6px) brightness(1.25)' }}>Supercharged</span>
            </Halo>
            {/* Crisp gradient body (no blur, clipPath hard crop is the gradient front) */}
            <span
              aria-hidden
              style={{
                ...gradText,
                clipPath: `inset(-25% ${100 - pPct}% -25% 0)`,
              }}
            >
              Supercharged
            </span>
            {/* Wavefront trail brightening: just-lit characters glow strongest, decaying backward to the steady state */}
            {trailFade > 0.01 && (
              <Halo mask={trailMask} style={{ opacity: 0.95 * trailFade }}>
                <span style={{ ...gradText, filter: 'blur(9px) saturate(1.7) brightness(1.7)' }}>Supercharged</span>
              </Halo>
            )}
            {/* Fill-head character overexposed bright core (character shape, not a standalone light point; only during the fill; soft-edge mask no longer produces a box) */}
            {filling && p < 1 && (
              <Halo mask={headMask} style={{ opacity: 0.9 * headFade }}>
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    color: '#fff',
                    filter: 'blur(3px)',
                    textShadow: '0 0 22px rgba(255,255,255,0.9), 0 0 55px rgba(216,150,255,0.8)',
                  }}
                >
                  Supercharged
                </span>
              </Halo>
            )}
            {/* Hooked lightning: after the fill completes, flashes between characters / above the word per the schedule */}
            <svg
              aria-hidden
              viewBox="0 0 700 240"
              style={{
                position: 'absolute',
                left: -25,
                top: -62,
                width: 700,
                height: 240,
                overflow: 'visible',
                pointerEvents: 'none',
              }}
            >
              {active.map((f, i) => {
                const b = BOLTS[f.bolt];
                const decay = 1 - (frame - f.at) / f.life;
                return (
                  <g key={`${f.at}-${i}`} opacity={Math.min(1, 1.1 * decay)}>
                    <path
                      d={b.d}
                      fill="none"
                      stroke="rgba(216,60,190,0.65)"
                      strokeWidth={b.long ? 6 : 4.5}
                      strokeLinejoin="miter"
                      style={{ filter: 'blur(6px)' }}
                    />
                    <path
                      d={b.d}
                      fill="none"
                      stroke="rgba(235,110,215,0.9)"
                      strokeWidth={b.long ? 2.4 : 1.9}
                      strokeLinejoin="miter"
                      style={{ filter: 'blur(1.5px)' }}
                    />
                    <path
                      d={b.d}
                      fill="none"
                      stroke="#ffd8f2"
                      strokeWidth={b.long ? 1.4 : 1.1}
                      strokeLinejoin="miter"
                    />
                  </g>
                );
              })}
            </svg>
          </span>{' '}
          <span>product films</span>
        </div>
        <div style={{ ...lineStyle, ...lineIn(enter2) }}>made with {BRAND.name}</div>
      </div>
      <Vignette strength={0.5} inner={0.45} color="#000000" />
      <Grain opacity={0.07} blend="soft-light" />
    </AbsoluteFill>
  );
};
