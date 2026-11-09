// countdown-arc-scatter: dial numbers sweeping past: equal-sized numbers laid out tangentially along a big arc, the whole dial sweeps 96° then stops abruptly,
// the "5" stops at the arc's top and then translates into place as the first character of the title, while the other numbers scatter in place with blur, the title fades in word by word with blur, the last word turning to the accent color.
//
// Second-round redesign (Swiss grid · paper instrument):
// - look = paper (warm white paper · ink · vermilion). Drawn natively at 1920×1080 (no longer 480×270 scaled up):
//   dial radius 700px, center below the frame (960,1150), arc apex at y=450, a visible angular window of ±70° makes the whole arc span ~70% of the frame;
//   9 numbers in 112px Helvetica bold tabular, laid out tangentially, as if engraved on a giant paper instrument.
// - Dial layers: a ring of fine ticks inside the numbers rotating at the same speed as the dial (one every 4°, longer at number positions) + an outer static hairline arc and
//   a vermilion readout marker (after the dial scatters it stays on the poster at 35%, so the title looks read off the instrument);
//   the vermilion needle returns at 0.35x differential speed ("dial vs needle"), the only accent color during the sweep.
// - Sweep: first 5f of reverse wind-up by 3° (anticipation), then a physical spring sweeps 99°→0° (damping 12 / stiffness 60,
//   one visible ~2° overshoot then an abrupt stop, like a real gauge needle); in the fast segment each number gets directional motion blur by its tangential speed.
// - Landing: the "5" takes off at the very moment the rebound settles (no rest), a 20f asymmetric in-out translation + 112→150px scale-up into
//   the title's first-character slot; the other numbers defocus and fade in place (no displacement, so they do not compete with the "5"), ticks/needle exit in sync.
// - Title '5 min to install' at 150px, word-by-word blur fade-in (windows overlap = one sentence), the last word install turning vermilion is the film's
//   only color event; below it a mono 34px command line `$ npx skills add Vincentwei1021/shorts-kit` (the real install command from the README) adds one product fact.
// - Swiss grid frame: top hairline + left label SETUP TIME / right shorts-kit wordmark, 0.6% very slow push-in throughout.
//
// Timeline (30fps, 100f total):
//   0–5     Prep: the dial is already on screen (frame 0 has numbers/ticks), reverse wind-up 3°
//   5–34    Sweep: spring 99°→0°, ~24f overshoots past 0° (≈−2°), ~34f settled
//   28–44   other numbers / ticks / needle defocus and fade out (4f before the "5" takes off, to make way)
//   32–52   "5" translates + scales into place
//   42–66   three title words fade in word by word with blur (the "5" lands into a sentence taking shape); 64–76 install → vermilion
//   62–78   command line rises
//   78–100  hold 22f
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, FONT, SpeedBlur, ramp, mix } from '../../../shared/fixtures/Polish';
import { LOOKS, Stage, alpha, springAt } from '../../../shared/fixtures/Look';
import { ShortKitWordmark } from '../../../shared/fixtures/Brand';

export const COUNTDOWN_ARC_SCATTER_DURATION = 100;

const L = LOOKS.paper;
const GROT = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const NUMS = [45, 35, 28, 22, 17, 10, 5, 4, 3]; // decreasing with uneven spacing = a real measuring range; "5" is at i=6
const HERO = 6;
const SP = 24; // angular spacing between adjacent numbers
const R = 700; // radius where the numbers sit
const CX = 960;
const CY = 1150; // center: arc apex y = 450
const NUM_SIZE = 112;
const TITLE_SIZE = 150;
const ARC = 800; // outer hairline arc radius (apex y = 350)
const SLOT_EM = 0.6; // fixed slot width of the "5" (em): the flying 5 aligns strictly with the title slot's center
const TITLE_Y = 600;
const WORDS: { text: string; win: [number, number] }[] = [
  { text: 'min', win: [42, 56] },
  { text: 'to', win: [46, 60] },
  { text: 'install', win: [50, 66] },
];
const GAP_EM = 0.24;
// Title total width estimate (Helvetica Neue Bold glyph widths, -0.03em letter-spacing): used only to center the whole line
const TITLE_EM = SLOT_EM + GAP_EM * 3 + 1.69 + 0.88 + 2.68;
const TITLE_X0 = CX - (TITLE_EM * TITLE_SIZE) / 2;
const SLOT_CX = TITLE_X0 + (SLOT_EM * TITLE_SIZE) / 2;

// Dial angle: 0–5 reverse wind-up +3°, from 5 a spring sweeps to 0 (~2° overshoot)
const rotAt = (f: number) => {
  const pre = 96 + 3 * ramp(f, 0, 5, EASE.swift);
  if (f <= 5) return pre;
  return 99 * (1 - springAt(f, 5, { damping: 12, stiffness: 60 }));
};
const HAND0 = 32;
const handAt = (f: number) => ramp(f, HAND0, 20, EASE.swift);
const outAt = (f: number) => ramp(f, 28, 16, EASE.swift);

const deg = Math.PI / 180;
const polar = (a: number, r: number) => ({ x: CX + Math.sin(a * deg) * r, y: CY - Math.cos(a * deg) * r });
const windowOp = (pa: number) => Math.min(1, Math.max(0, (70 - Math.abs(pa)) / 22)); // the two ends of the arc fade in and out by angle

// The i-th number: center position / self-rotation / opacity / font size
const numState = (i: number, f: number) => {
  const pa = (i - HERO) * SP + rotAt(f);
  const p = polar(pa, R);
  let { x, y } = p;
  let rSelf = pa;
  let op = windowOp(pa);
  let size = NUM_SIZE;
  if (i === HERO) {
    const h = handAt(f);
    x = mix(x, SLOT_CX, h);
    y = mix(y, TITLE_Y, h);
    rSelf *= 1 - h;
    size = mix(NUM_SIZE, TITLE_SIZE, h);
    op = Math.max(op, h);
  } else {
    op *= 1 - outAt(f);
  }
  return { x, y, rSelf, op, size };
};

const TICKS = Array.from({ length: 61 }, (_, k) => (k - 30) * 4 - 48); // dial angle −168°..+72° (covers the whole sweep)

export const CountdownArcScatter: React.FC = () => {
  const frame = useCurrentFrame();
  const rot = rotAt(frame);
  const out = outAt(frame);
  const push = 1 + 0.006 * ramp(frame, 0, 100, EASE.smooth);
  const frameIn = ramp(frame, 0, 14, EASE.out);
  const tint = ramp(frame, 64, 12, EASE.swift); // install → vermilion
  const cmd = ramp(frame, 62, 16, EASE.snappy);

  return (
    <AbsoluteFill>
      <Stage look={L} keyLight={{ x: 0.5, y: 0.3 }} fill={null} vignette={0.14} grain={0.05} />

      {/* Swiss grid frame: top hairline + labels */}
      <div style={{ position: 'absolute', left: 120, right: 120, top: 150, height: 1.5, background: alpha(L.ink, 0.5), transform: `scaleX(${frameIn})`, transformOrigin: 'left' }} />
      <div style={{
        position: 'absolute', top: 104, left: 120, fontFamily: GROT, fontSize: 28, fontWeight: 700,
        letterSpacing: '0.14em', color: L.ink, opacity: frameIn,
      }}>
        SETUP TIME
      </div>
      {/* Top right: shorts-kit wordmark (all lowercase), on the same baseline band as the left label */}
      <div style={{ position: 'absolute', top: 104, right: 120, opacity: frameIn }}>
        <ShortKitWordmark size={28} markScale={1.3} gap={12} tone="light" color={L.ink} />
      </div>

      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: '50% 50%' }}>
        {/* Dial: fine ticks rotating with the dial + static hairline arc + vermilion needle at 0.35x differential speed */}
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: 1 - out }}>
          {TICKS.map((a, k) => {
            const pa = a + rot;
            const op = windowOp(pa);
            if (op <= 0) return null;
            const major = ((a % SP) + SP) % SP === 0;
            const p0 = polar(pa, major ? 584 : 600);
            const p1 = polar(pa, 620);
            return (
              <line key={k} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y}
                stroke={L.ink} strokeOpacity={op * (major ? 0.7 : 0.28)} strokeWidth={major ? 3 : 1.5} strokeLinecap="round" />
            );
          })}
          {(() => {
            const a = rot * 0.35;
            const p0 = polar(a, 490), p1 = polar(a, 566);
            return <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={L.accent} strokeWidth={6} strokeLinecap="round" />;
          })()}
        </svg>

        {/* Outer static hairline arc + vermilion readout marker: after the dial scatters it stays on the poster at 35%, a memory of the "instrument reading" */}
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: (1 - out * 0.65) * frameIn }}>
          <path
            d={`M ${polar(-70, ARC).x} ${polar(-70, ARC).y} A ${ARC} ${ARC} 0 0 1 ${polar(70, ARC).x} ${polar(70, ARC).y}`}
            fill="none" stroke={alpha(L.ink, 0.3)} strokeWidth={1.5}
          />
          <path d={`M ${CX - 13} ${CY - ARC + 8} L ${CX + 13} ${CY - ARC + 8} L ${CX} ${CY - ARC + 30} Z`} fill={L.accent} />
        </svg>

        {/* Numbers */}
        {NUMS.map((n, i) => {
          const s = numState(i, frame);
          if (s.op <= 0.002) return null;
          const a = numState(i, frame - 0.5);
          const b = numState(i, frame + 0.5);
          const isHero = i === HERO;
          const blurOut = isHero ? 0 : out * 6;
          const B = 360; // local box: directional motion blur only acts near the numbers
          return (
            <div key={i} style={{ position: 'absolute', left: s.x - B / 2, top: s.y - B / 2, width: B, height: B }}>
              <SpeedBlur vx={b.x - a.x} vy={b.y - a.y} amount={0.16} max={14}>
                <div style={{
                  position: 'absolute', left: B / 2, top: B / 2, width: `${SLOT_EM}em`, textAlign: 'center',
                  fontFamily: GROT, fontWeight: 700, fontSize: s.size, lineHeight: 1, letterSpacing: '-0.03em',
                  fontVariantNumeric: 'tabular-nums', color: L.ink, opacity: s.op,
                  transform: `translate(-50%,-50%) rotate(${s.rSelf.toFixed(3)}deg)`,
                  filter: blurOut > 0.05 ? `blur(${blurOut.toFixed(2)}px)` : undefined,
                  whiteSpace: 'nowrap',
                }}>
                  {n}
                </div>
              </SpeedBlur>
            </div>
          );
        })}

        {/* Title: the first slot is left for the flying "5", the other three words fade in word by word with blur */}
        <div style={{
          position: 'absolute', left: TITLE_X0, top: TITLE_Y, transform: 'translateY(-50%)', display: 'flex', alignItems: 'center',
          fontFamily: GROT, fontWeight: 700, fontSize: TITLE_SIZE, lineHeight: 1, letterSpacing: '-0.03em', color: L.ink, whiteSpace: 'nowrap',
        }}>
          <span style={{ display: 'inline-block', width: `${SLOT_EM}em` }} />
          {WORDS.map((w, k) => {
            const p = ramp(frame, w.win[0], w.win[1] - w.win[0], EASE.out);
            const last = k === WORDS.length - 1;
            return (
              <span key={k} style={{
                display: 'inline-block', marginLeft: `${GAP_EM}em`, opacity: p,
                transform: `translateY(${((1 - p) * 0.12).toFixed(3)}em)`,
                filter: p < 0.999 ? `blur(${((1 - p) * 10).toFixed(2)}px)` : undefined,
                color: last ? `color-mix(in srgb, ${L.accent} ${(tint * 100).toFixed(1)}%, ${L.ink})` : undefined,
              }}>
                {w.text}
              </span>
            );
          })}
        </div>

        {/* Command line */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: TITLE_Y + 130, display: 'flex', justifyContent: 'center',
          opacity: cmd, transform: `translateY(${(1 - cmd) * 24}px)`,
        }}>
          <div style={{
            fontFamily: FONT.mono, fontSize: 34, color: L.ink2, letterSpacing: '0.01em', padding: '14px 30px',
            border: `1.5px solid ${alpha(L.ink, 0.18)}`, borderRadius: 12, background: alpha('#ffffff', 0.35),
          }}>
            <span style={{ color: L.accent }}>$</span> npx skills add Vincentwei1021/shorts-kit
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
