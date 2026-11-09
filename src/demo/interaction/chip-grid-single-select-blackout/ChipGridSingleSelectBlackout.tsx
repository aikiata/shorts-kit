// chip-grid-single-select-blackout: Single Select, 1-frame gray flash, single-select inversion to black
// Five option chips laid out 3+2 centered enter in a stagger; the cursor clicks: first insert a 1-frame gray press block, immediately followed by a 5-frame linear inversion to black (white text) + a very light 1→1.04→1 rebound,
// the other chips fade to 18% but their positions are locked; about 1.5s later the remaining items go to zero, the black chip moves up and narrows back to the centerline, and a settled price rises below.
//
// Second redesign (porcelain white · a "decision" on a checkout page):
// - look = porcelain (cool white · ink-blue black · cobalt blue). Rewritten with native 1080p layout (no longer a 480×270 design scaled up):
//   eyebrow + 84px question "How would you like to pay?", 96px-tall solid chips (36px type, hairline + top inner highlight + two layers of soft shadow),
//   the body takes ~62% of the frame width. The eyebrow carries the shorts-kit logo + name: this is its checkout page.
// - the two-level selected state is staged separately (the crux of this card, parameters unchanged): a 56f single-frame gray flash (:active) → 57–62f linear inversion to black (:selected, no easing)
//   + sin rebound 0.04; the other chips only lower opacity, transform stays none. A newly added cursor arcs in from the lower right to hit it, making cause and effect clearer.
// - after the black chip is selected, a very faint ring of cobalt ground light comes on beneath it (only once, for the hero); on collapse it moves up + shrinks to 0.88 + returns horizontally to the centerline,
//   the shadow deepens and grows with the lift (higher off the ground).
// - the result segment becomes a large-type settlement: current price "$34.44" 180px tabular + "/mo", original price "$42.00" appears first then is struck through by a line and fades to gray,
//   a cobalt "Save 18%" capsule pops out last with overshoot: the ending is a complete price poster.
//
// Timeline (30fps, 165f total):
//   0–14    eyebrow tracking tightens, the question rises word by word
//   8–28    5 chips rise in a stagger (3f apart, snappy)
//   26–54   reading the question: cursor enters from the lower right, swift arc toward "Annual billing" (camera pushes in very slowly 1.5%)
//   56      single-frame gray flash (press)
//   57–62   linear inversion to black 5f; 57–66 rebound; 57–66 the others drop to 18% (outQuad), positions locked
//   66–101  selected state hold ~1.2s (ground light breathes); the cursor fades out from 70f
//   101–119 collapse: the others go to zero over 101–110; the black chip moves up / shrinks to 0.88 / returns to the centerline (18f smooth in-out)
//   108–134 settlement: original price rises → 118f strike-through → current price rises (rise) → 128f Save 18% pops out
//   134–165 settled hold 31f
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, FONT, mix, ramp, softShadow } from '../../../shared/fixtures/Polish';
import { LOOKS, Stage, TextReveal, alpha, type } from '../../../shared/fixtures/Look';
import { BRAND, ShortKitMark } from '../../../shared/fixtures/Brand';

export const CHIP_GRID_SINGLE_SELECT_BLACKOUT_DURATION = 165;

const L = LOOKS.porcelain;
const INK = '#0b1020'; // inversion target: ink-blue black (not pure #000)

const NAMES = ['Annual billing', 'Monthly billing', 'Two-year commitment', 'Student', 'Nonprofit rate'];
const WIDTHS = [346, 364, 476, 236, 330]; // fixed chip widths (measured at 36px type + 44 left/right padding): geometry is deterministic, no runtime measurement
const TI = 0; // selected item
const CHIP_H = 96;
const GAP = 22;
const ROW_Y = [452, 570]; // tops of the two chip rows
const FS = 56; // gray flash frame
const COLLAPSE = 101; // collapse start (~1.5s after selection)
const COLLAPSE_DUR = 18;
const TARGET_Y = 330; // center y of the black chip after collapse
const TARGET_S = 0.88; // narrows to 0.88 (type still ≈32px, meeting the auxiliary-text minimum)

// top-left corners of the chips in the 3+2 centered layout (positions locked throughout)
const chipPos = (i: number) => {
  const row = i < 3 ? 0 : 1;
  const ids = row === 0 ? [0, 1, 2] : [3, 4];
  const total = ids.reduce((a, k) => a + WIDTHS[k], 0) + GAP * (ids.length - 1);
  let x = (1920 - total) / 2;
  for (const k of ids) {
    if (k === i) break;
    x += WIDTHS[k] + GAP;
  }
  return { x, y: ROW_Y[row] };
};

const lin = (f: number, a: number, b: number) => Math.max(0, Math.min(1, (f - a) / (b - a)));
const outQuad = (t: number) => 1 - (1 - t) * (1 - t);
const h2r = (h: string) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
const mixC = (p: number, a: string, b: string) => {
  const A = h2r(a), B = h2r(b), q = Math.max(0, Math.min(1, p));
  return `rgb(${A.map((v, k) => Math.round(v + (B[k] - v) * q)).join(',')})`;
};

const Cursor: React.FC<{ frame: number }> = ({ frame }) => {
  const p0 = chipPos(TI);
  const tx = p0.x + WIDTHS[TI] * 0.62, ty = p0.y + CHIP_H * 0.58;
  const p = ramp(frame, 26, FS - 2 - 26, EASE.swift);
  const x = mix(1500, tx, p);
  const y = mix(960, ty, p) - Math.sin(Math.PI * p) * 60;
  const press = frame >= FS - 1 && frame < FS + 6 ? 1 - 0.16 * Math.sin((Math.PI * (frame - FS + 1)) / 7) : 1;
  const show = ramp(frame, 24, 8, EASE.out) * (1 - ramp(frame, 70, 12, EASE.out));
  return (
    <svg width={46} height={50} viewBox="0 0 20 22" style={{
      position: 'absolute', left: x, top: y, transform: `scale(${press.toFixed(3)})`, transformOrigin: '4px 2px', opacity: show,
      filter: `drop-shadow(0 3px 5px ${alpha(L.shadow, 0.28)})`,
    }}>
      <path d="M2 1 L2 17 L6.5 13.2 L9.4 20 L12.4 18.7 L9.5 12 L15 11.6 Z" fill={L.ink} stroke="#ffffff" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
};

export const ChipGridSingleSelectBlackout: React.FC = () => {
  const frame = useCurrentFrame();

  // ── two-level selected state ──
  const flash = frame === FS ? 1 : 0; // just one frame
  const bk = lin(frame, FS + 1, FS + 6); // linear inversion to black 5f (deliberately no easing)
  const pr = lin(frame, FS + 1, FS + 10);
  const pulse = 1 + Math.sin(pr * Math.PI) * 0.04 * (pr > 0 ? 1 : 0);
  const fade = outQuad(lin(frame, FS + 1, FS + 10));
  const gone = outQuad(lin(frame, COLLAPSE, COLLAPSE + 9));
  const lift = ramp(frame, COLLAPSE, COLLAPSE_DUR, EASE.smooth);

  const p0 = chipPos(TI);
  const c0x = p0.x + WIDTHS[TI] / 2, c0y = p0.y + CHIP_H / 2;
  const dx = (960 - c0x) * lift, dy = (TARGET_Y - c0y) * lift;

  // camera: very slow push in during the reading segment, righting after the collapse
  const cam = 1 + 0.015 * ramp(frame, 20, 60, EASE.smooth) - 0.015 * ramp(frame, COLLAPSE, 30, EASE.smooth);

  // the question gives way with the collapse (moves up and fades), leaving the stage to the result
  const titleOut = ramp(frame, COLLAPSE - 4, 16, EASE.exit);

  // ── settlement ──
  const oldIn = ramp(frame, 108, 14, EASE.snappy);
  const strike = ramp(frame, 118, 8, EASE.swift);
  const saveIn = ramp(frame, 128, 14, EASE.overshoot);

  return (
    <AbsoluteFill style={{ background: L.bg[1], overflow: 'hidden', fontFamily: FONT.sans }}>
      <Stage look={L} keyLight={{ x: 0.5, y: 0.12 }} fill={null} />

      <AbsoluteFill style={{ transform: `scale(${cam.toFixed(4)})`, transformOrigin: '50% 50%' }}>
        {/* eyebrow + question */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 168, textAlign: 'center', opacity: 1 - titleOut, transform: `translateY(${(-30 * titleOut).toFixed(2)}px)` }}>
          {/* eyebrow: logo + lowercase brand name (no tracking animation) + caps tag (tracking tightens) */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, opacity: ramp(frame, 0, 10, EASE.out) }}>
            <ShortKitMark size={32} tone="light" />
            <span style={{ ...type(26, 680), letterSpacing: '0.01em', color: L.ink }}>{BRAND.name}</span>
            <span style={{
              ...type(22, 650, { caps: true }), color: L.accent,
              letterSpacing: `${(0.24 + 0.3 * (1 - ramp(frame, 0, 18, EASE.snappy))).toFixed(3)}em`,
            }}>· Billing cycle</span>
          </div>
          <div style={{ marginTop: 22 }}>
            <TextReveal text="How would you like to pay?" by="word" variant="rise" start={3} each={16} gap={2.5}
              style={{ ...type(84, 700), color: L.ink }} />
          </div>
        </div>

        {/* chip */}
        {NAMES.map((n, i) => {
          const { x, y } = chipPos(i);
          const inP = ramp(frame, 8 + i * 3, 16, EASE.snappy);
          const sel = i === TI;
          if (!sel) {
            const op = inP * mix(1, 0.18, fade) * (1 - gone);
            return (
              <div key={i} style={{
                position: 'absolute', left: x, top: y + (1 - inP) * 30, width: WIDTHS[i], height: CHIP_H, boxSizing: 'border-box',
                borderRadius: CHIP_H / 2, background: `linear-gradient(180deg, #ffffff, ${L.surface2})`,
                border: `1px solid ${L.line}`, boxShadow: `inset 0 1px 0 #ffffff, ${softShadow(6, { color: L.shadow, strength: 1.1 })}`,
                display: 'grid', placeItems: 'center', opacity: op, transform: 'none',
                ...type(36, 560), color: L.ink,
              }}>{n}</div>
            );
          }
          const elev = 6 + 10 * bk + 26 * lift;
          return (
            <div key={i} style={{
              position: 'absolute', left: x, top: y + (1 - inP) * 30, width: WIDTHS[i], height: CHIP_H, opacity: inP,
              transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${(pulse * mix(1, TARGET_S, lift)).toFixed(4)})`,
            }}>
              {/* ground light: comes on beneath the chip after selection, only once for the hero */}
              <div style={{
                position: 'absolute', left: -120, right: -120, top: CHIP_H * 0.35, height: CHIP_H * 1.3,
                background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${alpha(L.accent, 0.2 * bk * (1 - 0.5 * lift))} 0%, transparent 70%)`,
                filter: 'blur(6px)',
              }} />
              <div style={{
                position: 'absolute', inset: 0, boxSizing: 'border-box', borderRadius: CHIP_H / 2, overflow: 'hidden',
                background: bk > 0 ? `linear-gradient(180deg, ${mixC(bk, '#ffffff', '#1d2438')}, ${mixC(bk, '#f3f6fb', INK)})` : `linear-gradient(180deg, #ffffff, ${L.surface2})`,
                border: `1px solid ${bk > 0 ? alpha(INK, 0.1 + 0.9 * bk) : L.line}`,
                boxShadow: `inset 0 1px 0 ${alpha('#ffffff', 1 - 0.85 * bk)}, ${softShadow(elev, { color: L.shadow, strength: 1.1 + 0.9 * bk })}`,
                display: 'grid', placeItems: 'center', ...type(36, 600), color: mixC(bk, L.ink, '#ffffff'),
              }}>
                {/* press gray block: 1 frame */}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(120,128,146,0.5)', opacity: flash }} />
                <span style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <svg width={30} height={30} viewBox="0 0 18 18" style={{ marginLeft: -12 * bk, width: 30 * bk, opacity: bk }}>
                    <path d="M3.5 9.5 L7.3 13 L14.5 5" stroke="#ffffff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {n}
                </span>
              </div>
            </div>
          );
        })}

        {/* ── settlement: original price struck through → current price → Save 18% ── */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 452, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 44 }}>
          {/* hidden before playback: the tops of the not-yet-risen "$42.00" glyphs ($ tip, top of the digits) would show a few thin marks from the bottom of the 82px mask box, pressing on the left of the second-row chip */}
          <div style={{ height: 82, overflow: 'hidden', marginBottom: 0, opacity: frame >= 108 ? 1 : 0 }}>
            <div style={{ position: 'relative', transform: `translateY(${((1 - oldIn) * 110).toFixed(1)}%)`, ...type(60, 500), color: mixC(strike, L.ink2, L.ink3) }}>
              $42.00
              <div style={{
                position: 'absolute', left: -4, top: '54%', height: 4, borderRadius: 2, background: L.ink3,
                width: `calc(${(strike * 100).toFixed(1)}% + ${(8 * strike).toFixed(1)}px)`,
              }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <TextReveal text="$34.44" by="char" variant="rise" start={116} each={14} gap={1.2}
              style={{ ...type(180, 750), letterSpacing: '-0.05em', color: L.ink }} />
            <span style={{ ...type(48, 500), color: L.ink2, opacity: ramp(frame, 124, 10, EASE.out) }}>/mo</span>
          </div>
        </div>
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 690, display: 'flex', justifyContent: 'center',
        }}>
          <div style={{
            padding: '12px 26px', borderRadius: 99, background: L.accent, color: L.onAccent, ...type(32, 650),
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 10px 26px -10px ${alpha(L.accent, 0.8)}`,
            opacity: Math.min(1, saveIn * 1.5), transform: `translateY(${((1 - saveIn) * 16).toFixed(2)}px) scale(${(0.8 + 0.2 * saveIn).toFixed(3)})`,
          }}>Save 18% · billed $413.28 yearly</div>
        </div>

        <Cursor frame={frame} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
