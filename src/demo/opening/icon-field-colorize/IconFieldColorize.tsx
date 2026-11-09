// icon-field-colorize: a field of greyscale icons emerges staggered and fills the whole screen, holds a beat, then several brand-color horizontal-band ripples sweep down extremely fast and flip the whole field,
// ending in multicolor horizontal bands. Modeled on bear-app.mp4 0-3s (verified frame by frame: not a hard flip on the same frame, but several extremely fast ripples flipping color).
//
// Second-round redesign (ember dark field, an array of unlit keycaps lit up by streaks of light):
// - look = ember (warm black + orange / gold). 170 icons are made into unlit dark keycaps (warm black base, hairline edge, top edge catching light, dark grey glyph):
//   greyscale reads in the dark field as "not powered yet"; color flip = powered on: the keycap becomes a glowing color block (dark glyph), with a same-color bloom, a white flash at the instant of the flip + 1.22× pop,
//   and at the same time the stage behind this row is stained with the same color of light (light spill), so the whole field truly "lights up".
// - The color waves are a set of warm sunrise gradients (gold → amber → orange → coral red): 4 waves sweep down fast in turn from their own start rows, later waves cover lower row bands,
//   the final four horizontal bands go from warm gold to coral red top to bottom: same color family in segments, not a rainbow.
// - Rhythm: emerge from the center outward (46f) → during the rest the whole field gently "breathes in" and darkens → the color waves finish in ~28f → once the light is stable a dark scrim rises in the center,
//   then the shorts-kit wordmark + a two-line 132px headline "Every shot, / one place." land, and the end frame is a brand poster.
//
// Timeline (30fps, 170f total):
//   0-48    emerge: 10 batches staggered by distance from center (+noise), 4f between batches + ≤3f within a batch; each icon overshoots 0.6→1.06→1 + floats up 10px
//   48-66   rest (58-66 whole field darkens 12% = building up energy)
//   66-96   color flip: 4 waves (starting at 66/72/78/84f), row offset 1.4f + column slight tilt 0.25f + ≤1.5f jitter, each icon flips over 4f + pop + white flash
//   96-118  aftermath: bloom and light spill stabilize
//   118-140 scrim + wordmark + two-line headline rise
//   140-170 hold; very slow overall push-in of 4% throughout
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, mix, ramp } from '../../../shared/fixtures/Polish';
import { LOOKS, Stage, TextReveal, alpha, type } from '../../../shared/fixtures/Look';
import { ShortKitWordmark } from '../../../shared/fixtures/Brand';

const mulberry32 = (a: number) => () => {
  let t = (a += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// 16 simple line-style icons (viewBox 0 0 24 24, pure fill), recognizable rather than refined
const SHAPES: ((c: string, k: string) => React.ReactNode)[] = [
  (c) => <path fill={c} d="M12 21s-7.5-4.7-9.6-9C.9 8.7 2.7 5 6.2 5c2 0 3.3 1 4 2.1h3.6C14.5 6 15.8 5 17.8 5c3.5 0 5.3 3.7 3.8 7-2.1 4.3-9.6 9-9.6 9z" transform="scale(0.92) translate(1,0)" />,
  (c) => <path fill={c} d="M12 2l2.7 6.3 6.8.5-5.2 4.4 1.6 6.6L12 16.2 6.1 19.8l1.6-6.6L2.5 8.8l6.8-.5z" />,
  (c) => <path fill={c} d="M13 2L4 14h6l-1 8 9-12h-6z" />,
  (c) => <circle fill={c} cx="12" cy="12" r="9" />,
  (c) => <path fill={c} d="M9 3v12.3A3.5 3.5 0 1 0 11 18V7h7v6.3A3.5 3.5 0 1 0 20 16V3z" transform="scale(0.85) translate(1.5,1.5)" />,
  (c) => <path fill={c} d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V6a2 2 0 0 1 2-2z" transform="scale(0.85) translate(2,2)" />,
  (c, k) => <><rect fill={c} x="3" y="6" width="18" height="13" rx="2.5" /><circle fill={k} cx="12" cy="12.5" r="3.6" /><rect fill={c} x="8" y="3.5" width="8" height="4" rx="1.5" /></>,
  (c) => <path fill={c} d="M6.5 19a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 17.8 8.7 4.2 4.2 0 0 1 17.5 19z" />,
  (c) => <path fill={c} d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" transform="scale(0.9) translate(1.2,0.5)" />,
  (c) => <path fill={c} d="M3.5 10L12 3l8.5 7V21h-6v-6h-5v6h-6z" />,
  (c, k) => <><rect fill={c} x="3" y="8" width="18" height="4" rx="1" /><rect fill={c} x="5" y="12" width="14" height="9" rx="1" /><rect fill={k} x="10.9" y="8" width="2.2" height="13" /></>,
  (c) => <path fill={c} d="M9.4 20.6l-1 1.9 7.2-.1 4.9-8.5-2.2.1-2 3.4L13 4.5h-2.1L7.6 17.3z" transform="scale(0.9) translate(1,1)" />,
  (c) => <path fill={c} d="M20.3 6.7L9.6 17.4l-5.9-5.9 2.1-2.1 3.8 3.8 8.6-8.6z" />,
  (c) => <path fill={c} d="M21.5 15.5L14 12V5.5a2 2 0 1 0-4 0V12l-7.5 3.5v2l7.5-2v4l-2.5 2v1.5l4.5-1 4.5 1V21.5l-2.5-2v-4l7.5 2z" transform="scale(0.85) translate(1.8,1.8)" />,
  (c) => <><circle fill={c} cx="12" cy="12" r="4" /><path fill={c} d="M12 1.5l1.4 3.6h-2.8zM12 22.5l-1.4-3.6h2.8zM1.5 12l3.6-1.4v2.8zM22.5 12l-3.6 1.4v-2.8zM4.6 4.6l3.5 1.5-2 2zM19.4 19.4l-3.5-1.5 2-2zM19.4 4.6l-1.5 3.5-2-2zM4.6 19.4l1.5-3.5 2 2z" /></>,
  (c) => <path fill={c} d="M20 4C10 4 4.5 9 4 15.7 3.9 17.5 4 20 4 20s2.7-.2 4.4-.3C15 19.2 20 13.5 20 4zM6.8 17.2C10 11 15 8 15 8s-5.5 1.5-8.8 8z" />,
];

export const ICON_FIELD_COLORIZE_DURATION = 170; // emerge ~48f + rest 18f + color flip ~30f + aftermath / headline / hold

const L = LOOKS.ember;
const COLS = 17, ROWS = 10;
const CELL_X = 108, CELL_Y = 106; // cell pitch (half-cell offset between rows)
const TILE = 66; // keycap edge length
const GLYPH = 32;
const X0 = (1920 - ((COLS - 1) * CELL_X + CELL_X / 2 + TILE)) / 2;
const Y0 = (1080 - ((ROWS - 1) * CELL_Y + TILE)) / 2;
// unlit-state glyphs: 3 levels of warm grey
const GRAYS = ['#6e5c50', '#806b5d', '#5f4f45'];
// four color waves: sunrise gradient (gold → amber → orange → coral red), later waves cover lower row bands
type RGB = [number, number, number];
const WAVES: { color: RGB; fromRow: number; start: number }[] = [
  { color: [255, 196, 84], fromRow: 0, start: 66 },
  { color: [255, 150, 62], fromRow: 3, start: 72 },
  { color: [255, 108, 46], fromRow: 5, start: 78 },
  { color: [240, 70, 86], fromRow: 8, start: 84 },
];
const shade = (c: RGB, k: number): RGB => c.map((v) => Math.round(Math.max(0, Math.min(255, v + k * 255)))) as RGB;
const css = (c: RGB, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const FLIP = 4; // flip frames per icon

// precompute deterministic properties of each icon
const rnd = mulberry32(20260718);
const ICONS = Array.from({ length: ROWS * COLS }, (_, idx) => {
  const r = Math.floor(idx / COLS);
  const c = idx % COLS;
  const r1 = rnd(), r2 = rnd(), r3 = rnd();
  const x = X0 + c * CELL_X + (r % 2) * (CELL_X / 2);
  const y = Y0 + r * CELL_Y;
  const d = Math.hypot(x + TILE / 2 - 960, y + TILE / 2 - 540) / Math.hypot(960, 540);
  const batch = Math.min(9, Math.floor((d * 0.75 + r1 * 0.35) * 10));
  return {
    r, c, x, y,
    t0: 2 + batch * 4.4 + r2 * 3,
    gray: GRAYS[Math.floor(r2 * GRAYS.length)],
    jit: (r1 - 0.5) * 0.08, // ±4% lightness micro-difference within the same color band
    shape: SHAPES[Math.floor(r3 * SHAPES.length) % SHAPES.length],
    arrive: WAVES.filter((w) => r >= w.fromRow).map((w) => ({ w, at: w.start + (r - w.fromRow) * 1.4 + c * 0.25 + r3 * 1.5 })),
  };
});

// keycap: tint=null is the unlit state
const Key: React.FC<{ shape: (c: string, k: string) => React.ReactNode; gray: string; tint: RGB | null; glowK?: number }> = ({ shape, gray, tint, glowK = 1 }) => {
  const lit = tint !== null;
  const top = lit ? shade(tint, 0.08) : null;
  return (
    <div style={{
      position: 'absolute', inset: 0, borderRadius: 18,
      background: lit ? `linear-gradient(180deg, ${css(top!)} 0%, ${css(tint)} 55%, ${css(shade(tint, -0.08))} 100%)` : 'linear-gradient(180deg, #2a1e17 0%, #1d1510 100%)',
      boxShadow: lit
        ? `inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 0 ${css(shade(tint, -0.2), 0.5)}, 0 0 ${(26 * glowK).toFixed(1)}px ${css(tint, 0.42 * glowK)}, 0 10px 22px -8px ${css(shade(tint, -0.3), 0.6)}`
        : `inset 0 1px 0 rgba(255,220,190,0.07), inset 0 0 0 1px rgba(255,200,160,0.06), 0 6px 14px -6px rgba(0,0,0,0.7)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg viewBox="0 0 24 24" width={GLYPH} height={GLYPH} style={{ display: 'block' }}>
        {shape(lit ? alpha(L.onAccent, 0.86) : gray, lit ? css(tint) : '#241a14')}
      </svg>
    </div>
  );
};

export const IconFieldColorize: React.FC = () => {
  const frame = useCurrentFrame();
  // "breathe in" during the rest: the whole field darkens 12% before the flip, returns to full when the first wave arrives
  const inhale = ramp(frame, 56, 10, EASE.smooth) * (1 - ramp(frame, 66, 8, EASE.out));
  const rowLit = new Array(ROWS).fill(0);
  const rowColor: (RGB | null)[] = new Array(ROWS).fill(null);

  const icons = ICONS.map((ic) => {
    const op = ramp(frame, ic.t0, 7, EASE.out);
    if (op <= 0) return null;
    const appearScale = mix(0.6, 1, ramp(frame, ic.t0, 13, EASE.overshoot));
    const lift = (1 - ramp(frame, ic.t0, 13, EASE.snappy)) * 10;
    let prev: RGB | null = null;
    let cur: RGB | null = null;
    let p = 0;
    let since = -1;
    for (const a of ic.arrive) {
      const q = Math.min(1, Math.max(0, (frame - a.at) / FLIP));
      if (q > 0) { prev = cur; cur = shade(a.w.color, ic.jit); p = q; since = frame - a.at; }
    }
    if (cur) { rowLit[ic.r] += 1 / COLS; rowColor[ic.r] = cur; }
    const flipping = p > 0 && p < 1;
    const pop = flipping ? 1 + Math.sin(p * Math.PI) * 0.22 : 1;
    // powered-on white flash + bloom overshoot: strong to steady within ~10f after the flip
    // the white flash only starts after the new color has fully filled in, screen blend only brightens without graying
    const flash = since >= FLIP ? Math.max(0, 1 - (since - FLIP) / 5) : 0;
    const glowK = since >= 0 ? 1 + 1.2 * Math.max(0, 1 - since / 12) : 1;
    return (
      <div key={`${ic.r}-${ic.c}`} style={{
        position: 'absolute', left: ic.x, top: ic.y + lift, width: TILE, height: TILE,
        opacity: op, transform: `scale(${(appearScale * pop).toFixed(4)})`,
      }}>
        <Key shape={ic.shape} gray={ic.gray} tint={flipping ? prev : cur} glowK={glowK} />
        {flipping && (
          // the new color "pours in" to the keycap from top to bottom (consistent with the wave direction): clip wipe-in with no opacity blending, so warm gold on a dark base does not turn olive
          <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 0 ${((1 - EASE.out(p)) * 100).toFixed(2)}% 0 round 18px)` }}>
            <Key shape={ic.shape} gray={ic.gray} tint={cur} glowK={glowK} />
          </div>
        )}
        {flash > 0 && <div style={{ position: 'absolute', inset: 0, borderRadius: 18, mixBlendMode: 'screen', background: `rgba(255,244,226,${(0.45 * flash).toFixed(3)})` }} />}
      </div>
    );
  });

  const push = 1 + 0.04 * ramp(frame, 0, ICON_FIELD_COLORIZE_DURATION, EASE.smooth);
  const title = ramp(frame, 118, 22, EASE.out);
  const litAll = ramp(frame, 66, 34, EASE.out);
  return (
    <AbsoluteFill style={{ background: L.bg[2], overflow: 'hidden' }}>
      <Stage look={L} keyLight={{ x: 0.5, y: 0.0 }} fill={{ x: 0.5, y: 1.1 }} intensity={0.45 + 0.35 * litAll} grain={0} vignette={0.62}>
        {/* light spill: after each row lights up, a same-color horizontal light band stains behind it */}
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${push})` }}>
          {rowColor.map((c, r) => c && (
            <div key={r} style={{
              position: 'absolute', left: -100, right: -100, top: Y0 + r * CELL_Y + TILE / 2 - CELL_Y * 1.1, height: CELL_Y * 2.2,
              background: `linear-gradient(180deg, ${css(c, 0)} 0%, ${css(c, 0.16 * rowLit[r])} 50%, ${css(c, 0)} 100%)`,
            }} />
          ))}
        </div>
      </Stage>
      <AbsoluteFill style={{ transform: `scale(${push})`, opacity: 1 - 0.12 * inhale }}>{icons}</AbsoluteFill>

      {/* ending: center scrim + headline (the scrim only darkens the center, light around the edges is kept) */}
      <AbsoluteFill style={{
        opacity: title, pointerEvents: 'none',
        background: `radial-gradient(ellipse 46% 44% at 50% 50%, ${alpha('#0a0503', 0.9)} 0%, ${alpha('#0a0503', 0.78)} 45%, ${alpha('#0a0503', 0)} 100%)`,
      }} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        {/* eyebrow slot: shorts-kit wordmark (originally "400+ INTEGRATIONS") */}
        <div style={{
          opacity: ramp(frame, 120, 14, EASE.out), transform: `translateY(${((1 - ramp(frame, 120, 18, EASE.snappy)) * 12).toFixed(2)}px)`,
        }}>
          <ShortKitWordmark size={36} tone="dark" />
        </div>
        <div style={{ ...type(132, 750), color: L.ink, marginTop: 30, textAlign: 'center' }}>
          <TextReveal text="Every shot," by="word" variant="rise" start={124} each={20} gap={5} />
        </div>
        {/* the second line uses the first wave's warm gold (background-clip:text makes the whole line vanish when a child element has a per-word transform, so no gradient text) */}
        <div style={{ ...type(132, 750), marginTop: 6, textAlign: 'center', color: css(WAVES[0].color) }}>
          <TextReveal text="one place." by="word" variant="rise" start={132} each={20} gap={5} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
