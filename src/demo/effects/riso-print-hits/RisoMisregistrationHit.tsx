// Misregistration impact frame (riso-misregistration-hit): at the instant the title slams to a stop it splits into two single-color "printing plates"
// (mix-blend-mode: multiply stacked on the paper), like a riso print that missed registration; the two plates are offset in opposite directions (mainly x, a little y)
// with a damped oscillation offset = A·cos(ωt)·exp(-t/τ) shaking twice, and at frame 72 it snaps hard back into register, closed out by a 4f scale pulse.
//
// Second redesign (two-color riso gig poster, fluorescent pink × blue):
// - Custom palette: recycled newsprint #f3eee2 + two riso inks: fluorescent pink FLUO #ff4fa3 and blue BLUE #1f5fc4.
//   In register, multiply stacks the two plates into a deep purple ink (the same glyph overlapping on both plates); off register, one side shows a pink fringe and the other a blue one: the classic riso rough edge.
// - Layout: Swiss grid poster (the riso promo poster of shorts-kit). A left-aligned 300px bold sans two-line "CRAFT IT / LOUD." sits over
//   a halftone-dot giant sun on the right (pink plate, dot diameter shrinks with distance from center = true halftone), a colophon at the top and three columns of selling points at the bottom (blue plate). Only the title's two plates misalign;
//   the background elements stay in register (a fully split frame would read as a glitch rather than printing).
// - Rhythm: at the opening the sun looks rolled onto the paper by an ink roller (top-down wipe-in over 0–16f), the info columns land staggered → the title slams in with an 8f ease-in
//   → on impact the same frame splits the plates + the whole page takes a 1.2% beat → 44f damped oscillation → at 72f a hard snap into register + the "ON REGISTER" round stamp lands
//   (the stamp center is the monochrome lens-engraved logo: BRAND.md specifies the mono version for single-color printing, printed in blue only)
//   → 44f clean hold (very slow push).
//
// Timeline (30fps, 120f total):
//   0–18    setup: paper and colophon are there on frame 1; sun ink-roller wipe-in 0–16f; bottom info columns rise staggered over 4–18f
//   20–28   main action: the title slams in from off-screen right with ease-in (cubic) (directional velocity blur), hits at 28f
//   28–71   aftermath: the two plates oscillate in opposite directions with damping (period 18f, τ 60f, still ~11px single-plate residue before 72f)
//   72–76   register: hard cut to zero + 4f scale 1.03→1; the stamp lands at 72f (scale 1.5→1, 4f)
//   76–120  hold 44f: camera smooth very slow push 1.000→1.012 (converges in ~110f), the tail frames are nearly identical
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { EASE, FONT, Grain, SpeedBlur, Vignette, bezier, mix, ramp, velocity } from '../../../shared/fixtures/Polish';
import { MARK_PATHS } from '../../../shared/fixtures/Brand';

export const RISO_MISREGISTRATION_HIT_DURATION = 120;

const HIT = 28; // slam-stop impact frame
const SNAP = 72; // frame where the plates snap into register
const AX = 20; // per-plate x offset amplitude (opposite directions → total separation ~40px; perceptible only at 300px type)
const AY = 8; // per-plate y offset amplitude (small, looks more like a missed registration)
const OMEGA = (2 * Math.PI) / 18; // oscillation period 18f, shaking two and a half times within 44f
const TAU = 60; // slow decay: visible residue remains before frame 72, then gets hard-cut to zero with a "snap"

const PAPER = '#f3eee2'; // recycled newsprint
const FLUO = '#ff4fa3'; // riso fluorescent pink plate
const BLUE = '#1f5fc4'; // riso blue plate
const inCubic = bezier(0.55, 0.055, 0.675, 0.19);
const SANS = FONT.sans;

// Single-color plate: same glyphs, adjustable color, offsettable, multiply-stacked on the paper
const Plate: React.FC<{ color: string; dx: number; dy: number; scale?: number }> = ({ color, dx, dy, scale = 1 }) => (
  <div style={{
    position: 'absolute', left: 120, top: 250,
    transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${scale})`, transformOrigin: '30% 60%',
    mixBlendMode: 'multiply', color, fontFamily: SANS, fontWeight: 900, fontSize: 300, lineHeight: 0.84,
    letterSpacing: '-0.045em', whiteSpace: 'nowrap',
  }}>
    {/* F and T's top bars just touch at −0.045em letter spacing, and anti-aliasing leaves a hairline gap; tighten another 0.01em after F so the two strokes overlap */}
    <div>CRA<span style={{ marginRight: '-0.01em' }}>F</span>T IT</div>
    <div>LOUD.</div>
  </div>
);

// Halftone-dot sun: pink plate, dots laid on a grid, dot diameter shrinks with distance from center (true halftone, not an equal-size dot matrix)
const SUN_R = 372;
const SUN_STEP = 22;
const SUN_DOTS = (() => {
  const out: { x: number; y: number; r: number }[] = [];
  const n = Math.ceil(SUN_R / SUN_STEP);
  for (let iy = -n; iy <= n; iy++) {
    for (let ix = -n; ix <= n; ix++) {
      // 45° screen angle: odd rows shifted by half a cell
      const x = ix * SUN_STEP + (iy % 2 ? SUN_STEP / 2 : 0);
      const y = iy * SUN_STEP * 0.866;
      const d = Math.hypot(x, y) / SUN_R;
      if (d > 1) continue;
      const tone = 1 - Math.pow(d, 2.4); // solid at the center, dot diameter shrinks to 0 at the edge (the outline is a circle, not the grid's hexagon)
      const r = (SUN_STEP / 2) * 1.1 * Math.sqrt(tone);
      if (r > 0.9) out.push({ x, y, r });
    }
  }
  return out;
})();

const Sun: React.FC<{ reveal: number }> = ({ reveal }) => (
  <svg width={SUN_R * 2 + 40} height={SUN_R * 2 + 40} viewBox={`${-SUN_R - 20} ${-SUN_R - 20} ${SUN_R * 2 + 40} ${SUN_R * 2 + 40}`}
    style={{
      position: 'absolute', left: 1090, top: 108, mixBlendMode: 'multiply',
      // Ink roller wipe-in: a hard-edged mask from top to bottom (printing rolls through once, it does not fade in)
      clipPath: `inset(0 0 ${((1 - reveal) * 100).toFixed(2)}% 0)`,
    }}>
    <g fill={FLUO}>
      {SUN_DOTS.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} />)}
    </g>
  </svg>
);

// Registration crosses (printing alignment marks): static set anchors
const RegMark: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <svg width={40} height={40} viewBox="0 0 40 40" style={{ position: 'absolute', left: x - 20, top: y - 20, mixBlendMode: 'multiply' }}>
    <g fill="none" stroke={BLUE} strokeWidth={1.6} opacity={0.75}>
      <circle cx={20} cy={20} r={9} />
      <path d="M20 1 V39 M1 20 H39" />
    </g>
  </svg>
);

// Round stamp: "ON REGISTER" stamped on the register frame (blue plate, ring text + monochrome lens-engraved logo in the center; the logo is rotated back 14° to stay upright)
const Stamp: React.FC<{ s: number; o: number }> = ({ s, o }) => (
  <svg width={300} height={300} viewBox="-130 -130 260 260"
    style={{ position: 'absolute', left: 1480, top: 500, mixBlendMode: 'multiply', opacity: o, transform: `rotate(-14deg) scale(${s.toFixed(4)})` }}>
    <defs>
      <path id="rmh-ring" d="M -88 0 A 88 88 0 1 1 88 0 A 88 88 0 1 1 -88 0" />
    </defs>
    <g fill="none" stroke={BLUE} strokeWidth={5}>
      <circle r={122} />
      <circle r={66} strokeWidth={3} />
    </g>
    <text fill={BLUE} style={{ fontFamily: FONT.mono, fontSize: 28, fontWeight: 700 }}>
      <textPath href="#rmh-ring" textLength={540} lengthAdjust="spacing">ON REGISTER ✶ SHORTS-KIT ✶</textPath>
    </text>
    {/* Logo content box x16–120 / y16–112, center (68,64); scaled to ~66px wide to fit the inner ring r66 */}
    <g transform="rotate(14) scale(0.64) translate(-68 -64)" fill={BLUE}>
      <path d={MARK_PATHS.frame} />
      <path d={MARK_PATHS.cut} />
    </g>
  </svg>
);

// Slam-in displacement: 1700px off-screen right → 0, 8f ease-in (cubic) (accelerating slam stop)
const slideAt = (f: number) => mix(1700, 0, ramp(f, 20, HIT - 20, inCubic));

export const RisoMisregistrationHit: React.FC = () => {
  const frame = useCurrentFrame();

  const split = frame >= HIT && frame < SNAP;
  const slideX = frame < HIT ? slideAt(frame) : 0;
  const vx = frame >= 20 && frame < HIT ? velocity(slideAt, frame) : 0;

  // Misregistration oscillation envelope: t starts from impact, decaying cosine; hard cut to zero at frame 72
  const t = frame - HIT;
  const m = split ? Math.cos(OMEGA * t) * Math.exp(-t / TAU) : 0;
  const dx = AX * m;
  const dy = AY * m;

  // Register pulse: from 72f, 4f scale 1.03 → 1
  const pulse = frame >= SNAP && frame < SNAP + 4 ? 1 + 0.03 * (1 - (frame - SNAP) / 4) : 1;
  // Impact beat: the whole page 1.2%, arrives in one frame, decays exponentially (exactly 1 outside the 10f window)
  const th = frame - HIT;
  const kick = th >= 0 && th < 10 ? 1 + 0.012 * Math.exp(-th / 2.5) : 1;
  // Camera: smooth very slow push, converges in 110f
  const cam = 1 + 0.012 * ramp(frame, 0, 110, EASE.smooth);

  // Round stamp: lands at 72f, pressed from 1.5 to 1 over 4f (ease-out), then still
  const sp = ramp(frame, SNAP, 4, EASE.out);
  const stampS = frame < SNAP ? 1.5 : mix(1.5, 1, sp);
  const stampO = frame < SNAP ? 0 : Math.min(1, sp * 2.5);

  const sunReveal = ramp(frame, 0, 16, EASE.swift);
  const info = (i: number) => {
    const p = ramp(frame, 4 + i * 4, 14, EASE.snappy);
    return { opacity: p, transform: `translateY(${((1 - p) * 26).toFixed(2)}px)` };
  };

  return (
    <div style={{ width: 1920, height: 1080, background: PAPER, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${(cam * kick).toFixed(5)})`, transformOrigin: '40% 50%' }}>
        {/* Paper: slightly brighter at the center + static paper fibers (multiply) */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 72% 70% at 42% 44%, #f8f4ea 0%, #f3eee2 58%, #e8e1d1 100%)' }} />
        <Grain opacity={0.11} step={100000} scale={2.4} freq={0.55} blend="multiply" />

        <Sun reveal={sunReveal} />

        {/* Colophon: four-corner registration crosses + top bar (blue plate) */}
        <RegMark x={64} y={64} />
        <RegMark x={1856} y={64} />
        <RegMark x={64} y={1016} />
        <RegMark x={1856} y={1016} />
        <div style={{
          position: 'absolute', left: 120, right: 120, top: 104, display: 'flex', justifyContent: 'space-between',
          fontFamily: FONT.mono, fontSize: 26, fontWeight: 600, letterSpacing: '0.12em', color: BLUE, mixBlendMode: 'multiply',
          opacity: ramp(frame, 0, 10, EASE.out),
        }}>
          <span>SHORTS-KIT — Nº 07</span>
          <span>TWO-COLOUR RISO · 1 OF 300</span>
        </div>
        <div style={{ position: 'absolute', left: 120, right: 120, top: 150, height: 4, background: BLUE, mixBlendMode: 'multiply', transformOrigin: '0 50%', transform: `scaleX(${ramp(frame, 0, 18, EASE.snappy).toFixed(4)})` }} />

        {/* Bottom three-column gig info (blue plate) */}
        <div style={{ position: 'absolute', left: 120, right: 120, top: 878, height: 4, background: BLUE, mixBlendMode: 'multiply', transformOrigin: '0 50%', transform: `scaleX(${ramp(frame, 2, 18, EASE.snappy).toFixed(4)})` }} />
        <div style={{ position: 'absolute', left: 120, right: 120, top: 906, display: 'grid', gridTemplateColumns: '1.25fr 1fr 1fr', gap: 48, color: BLUE, mixBlendMode: 'multiply' }}>
          {[
            ['SHOT RECIPE CARDS', 'Cinematic product films'],
            ['ONE PROMPT', 'To a finished promo'],
            ['BUILT ON REMOTION', 'For Claude Code & Codex'],
          ].map(([a, b], i) => (
            <div key={i} style={info(i)}>
              <div style={{ fontFamily: SANS, fontSize: 40, fontWeight: 850, letterSpacing: '-0.01em', lineHeight: 1.1 }}>{a}</div>
              <div style={{ fontFamily: SANS, fontSize: 32, fontWeight: 450, letterSpacing: '-0.01em', lineHeight: 1.35, marginTop: 6 }}>{b}</div>
            </div>
          ))}
        </div>

        {/* Slam-in: the two plates in register move together horizontally, with directional motion blur */}
        {frame >= 20 && frame < HIT && (
          <SpeedBlur vx={vx} amount={0.09} max={34}>
            <div style={{ position: 'absolute', inset: 0, transform: `translateX(${slideX.toFixed(1)}px)` }}>
              <Plate color={FLUO} dx={0} dy={0} />
              <Plate color={BLUE} dx={0} dy={0} />
            </div>
          </SpeedBlur>
        )}

        {/* Dual-plate misregistration: pink and blue plates offset in opposite directions, multiply-stacked into a "ghosted overprint"; after registering the plates return to zero and merge into deep purple */}
        {frame >= HIT && (
          <>
            <Plate color={FLUO} dx={-dx} dy={dy} scale={pulse} />
            <Plate color={BLUE} dx={dx} dy={-dy} scale={pulse} />
          </>
        )}

        <Stamp s={stampS} o={stampO} />
      </div>

      {/* Ink grain: screen-blended fine noise gives the ink blocks the uneven white specks of riso (static) + warm brown vignette */}
      <Grain opacity={0.2} step={100000} freq={1.25} blend="screen" />
      <Vignette strength={0.13} inner={0.55} color="#5a4a32" />
    </div>
  );
};
