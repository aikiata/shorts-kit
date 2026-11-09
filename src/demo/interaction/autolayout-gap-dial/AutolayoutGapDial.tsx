// autolayout-gap-dial —— framer-ai 4.5–5.5s
// A spacing dial drives the layout: a single gap value drives, on the same frame, the positions of the whole row of nav blocks, the measure lines, the badges and the readout.
//
// Second redesign (graphite dark field · design-tool inspector poster):
// - look = graphite (near-monochrome dark field). The two-color semantics of a design tool, "selection white + measure gold": the selection outline/handles use near-white,
//   the spacing measure lines/badges/dial pointer use accent2 champagne gold: in the frame only "the number being dialed" has color.
// - the hero is the "number": a 196px oversized tabular readout at the top (GAP eyebrow + value + px unit), below it a 760px dial ruler,
//   its ticks scroll across the central gold needle with the gap; while dialing the readout turns from white to gold and returns to white on release: the number is the reins.
// - layout body: a row of 120px-tall nav blocks (the top nav of the shorts-kit site), taking ~64–86% of the frame width; the active item has a white base and black text,
//   the rest are hue-tinted dark gray panels + hairlines + top inner highlight; blocks get horizontal motion blur by their own speed (outer blocks displace most, with the longest trails).
// - rhythm "wind-up, stretch, hold breath, rebound": the opening first pulls the gap in a little (anticip wind-up, 12→6), then a swift asymmetric curve
//   stretches it to 104; hold a beat holding breath; after release an underdamped spring overshoots to tighter than the start and then settles (overshoot segment ×0.45 compressed, gap never negative).
//
// Timeline (30fps, 150f total):
//   0–20    entrance: stage light + dot-grid canvas; nav blocks float up in a stagger (parent arrives first), the selection outline closes in from outside, 8 handles pop out 2f apart
//   6–22    readout entrance: eyebrow tracking tightens, value rises from below the line, ruler fades in
//   22–32   wind-up: gap 12→6 (anticip, the viewer first sees "pulling back" then sees "shooting out")
//   32–66   main action: gap 6→104 (34f swift), readout jumps by 2, turns gold; measure lines and badges lengthen in real time
//   66–86   hold breath 20f: camera pushes in very slowly (+2.5% in total), the gold readout rests at 104
//   86–118  rebound: spring(damping 9, stiffness 80) 104→~7→12, settles at ~118f, readout returns to white
//   118–150 settled hold: complete poster (readout 12 + tightened nav bar), the camera keeps pushing in very slowly
import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring } from 'remotion';
import { EASE, FONT, ramp, softShadow } from '../../../shared/fixtures/Polish';
import { LOOKS, Stage, alpha, springAt, type } from '../../../shared/fixtures/Look';

export const AUTOLAYOUT_GAP_DIAL_DURATION = 150;

const L = LOOKS.graphite;
const FPS = 30;
const SEL = 'rgba(244,244,242,0.92)'; // selection white: selection outline / handles
const GOLD = L.accent2; // measure gold: spacing lines / badges / pointer / readout while dialing

const LABELS = ['Recipes', 'Gallery', 'Workbench', 'Showcase', 'Install']; // shorts-kit site nav
const BLOCK_WIDTHS = [252, 206, 278, 268, 220]; // unequal widths are what make it look like a real nav
const BLOCK_H = 120;
const ROW_Y = 684; // row center
const G_REST = 12;
const G_PRE = 6; // wind-up pull-in value
const G_MAX = 104;

const PRE_START = 22;
const PRE_END = 32;
const GROW_END = 66;
const HOLD_END = 86;
// damping 9's raw overshoot ≈18%×106px would pull the gap negative; overshoot segment ×0.45 → tightest about 6px, still "tighter than the start and then settles"
const OVERSHOOT_K = 0.45;

// the same gap parameter derives all geometry (block positions, measure lines, badges, readout, ruler)
const gapAt = (f: number) => {
  if (f < PRE_END) return G_REST + (G_PRE - G_REST) * ramp(f, PRE_START, PRE_END - PRE_START, EASE.swift);
  if (f < HOLD_END) return G_PRE + (G_MAX - G_PRE) * ramp(f, PRE_END, GROW_END - PRE_END, EASE.swift);
  const s = spring({ frame: f - HOLD_END, fps: FPS, config: { damping: 9, stiffness: 80, mass: 1.1 } });
  const s2 = s > 1 ? 1 + (s - 1) * OVERSHOOT_K : s;
  return G_MAX + (G_REST - G_MAX) * s2;
};

// blend two hex colors by t
const mixHex = (a: string, b: string, t: number) => {
  const pa = a.match(/[0-9a-f]{2}/gi)!.map((h) => parseInt(h, 16));
  const pb = b.match(/[0-9a-f]{2}/gi)!.map((h) => parseInt(h, 16));
  const k = Math.max(0, Math.min(1, t));
  return `rgb(${pa.slice(0, 3).map((x, i) => Math.round(x + (pb[i] - x) * k)).join(',')})`;
};

const rowLayout = (gap: number) => {
  const total = BLOCK_WIDTHS.reduce((a, b) => a + b, 0) + gap * (BLOCK_WIDTHS.length - 1);
  const startX = (1920 - total) / 2;
  const xs: number[] = [];
  let acc = startX;
  for (const w of BLOCK_WIDTHS) {
    xs.push(acc);
    acc += w + gap;
  }
  return { total, startX, xs };
};

const IconAutoLayout: React.FC<{ c: string; size?: number }> = ({ c, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <rect x={1} y={3} width={3.4} height={8} rx={1} fill={c} />
    <rect x={5.3} y={3} width={3.4} height={8} rx={1} fill={c} opacity={0.7} />
    <rect x={9.6} y={3} width={3.4} height={8} rx={1} fill={c} opacity={0.45} />
  </svg>
);

// dial ruler: each 1 unit = UNIT px, the central gold needle reads the current gap
const RULER_W = 760;
const UNIT = 6.5;
const Ruler: React.FC<{ gap: number; op: number; hot: number }> = ({ gap, op, hot }) => {
  const ticks: React.ReactNode[] = [];
  for (let u = -60; u <= 180; u += 2) {
    const x = RULER_W / 2 + (u - gap) * UNIT;
    if (x < -10 || x > RULER_W + 10) continue;
    const major = u % 10 === 0;
    const edge = Math.max(0, Math.min(1, Math.min(x, RULER_W - x) / 150)); // fades out at both ends
    const near = Math.abs(x - RULER_W / 2);
    ticks.push(
      <div key={u} style={{
        position: 'absolute', left: x - 1, bottom: 0, width: 2, height: major ? 30 : 14, borderRadius: 1,
        background: u < 0 ? alpha(L.ink, 0.08) : major ? alpha(L.ink, 0.5) : alpha(L.ink, 0.22), opacity: edge,
      }} />,
    );
    if (major && u >= 0) {
      ticks.push(
        <div key={`l${u}`} style={{
          position: 'absolute', left: x, bottom: 40, transform: 'translateX(-50%)',
          ...type(22, 500, { mono: true }), color: L.ink3,
          opacity: edge * Math.min(1, Math.max(0, (near - 18) / 22)), // numbers near the pointer give way
        }}>{u}</div>,
      );
    }
  }
  return (
    <div style={{ position: 'absolute', left: 960 - RULER_W / 2, top: 414, width: RULER_W, height: 76, opacity: op }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>{ticks}</div>
      {/* baseline */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, background: `linear-gradient(90deg, transparent, ${alpha(L.ink, 0.18)} 20%, ${alpha(L.ink, 0.18)} 80%, transparent)` }} />
      {/* gold needle: glows while dialing */}
      <div style={{
        position: 'absolute', left: RULER_W / 2 - 1.5, bottom: -6, width: 3, height: 50, borderRadius: 2, background: GOLD,
        boxShadow: `0 0 ${8 + hot * 14}px ${alpha(GOLD, 0.35 + hot * 0.4)}`,
      }} />
      <div style={{
        position: 'absolute', left: RULER_W / 2 - 8, bottom: 44, width: 0, height: 0,
        borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: `10px solid ${GOLD}`,
      }} />
    </div>
  );
};

export const AutolayoutGapDial: React.FC = () => {
  const frame = useCurrentFrame();

  const gap = gapAt(frame);
  const gapShown = Math.max(0, Math.round(gap / 2) * 2); // jumps cell by cell (step 2 = the grain of a dial click)
  const v = gapAt(frame + 0.5) - gapAt(frame - 0.5); // gap velocity (px/frame)
  const moving = Math.min(1, Math.abs(v) / 1.2);
  // dialing heat: readout white→gold, with ~6f of afterglow (slowly fades back to white after release and settling)
  let hot = 0;
  for (let k = 0; k <= 6; k++) hot = Math.max(hot, Math.min(1, Math.abs(gapAt(frame - k + 0.5) - gapAt(frame - k - 0.5)) / 1.5) * (1 - k / 7));
  // jump pulse: phase driven by the value itself (one pulse per step cell crossed) × speed gate
  const tickPulse = 1 + 0.06 * Math.abs(Math.sin((Math.PI * gap) / 2)) * moving;

  const { total, startX, xs } = rowLayout(gap);

  // camera: very slow push in over the whole shot (smooth, no speed jumps at start and end)
  const cam = 1 + 0.025 * ramp(frame, 0, AUTOLAYOUT_GAP_DIAL_DURATION, EASE.smooth);

  // selection outline: spring closes in from 26px outside
  const selIn = springAt(frame, 4, { damping: 16, stiffness: 140 });
  const pad = 30;
  const grow = (1 - selIn) * 26;
  const selX = startX - pad - grow;
  const selW = total + pad * 2 + grow * 2;
  const selY = ROW_Y - BLOCK_H / 2 - pad - grow;
  const selH = BLOCK_H + pad * 2 + grow * 2;

  const measOp = ramp(frame, 14, 10, EASE.out);
  const eyebrow = ramp(frame, 4, 18, EASE.snappy);
  const numIn = ramp(frame, 8, 18, EASE.snappy);
  const rulerIn = ramp(frame, 12, 16, EASE.out);

  // readout color: white ↔ gold
  const numColor = mixHex(L.ink, GOLD, hot);

  return (
    <AbsoluteFill style={{ background: L.bg[1], overflow: 'hidden', fontFamily: FONT.sans }}>
      <Stage look={L} keyLight={{ x: 0.5, y: 0.0 }} fill={{ x: 0.5, y: 1.05 }} horizon={0.62} breathe={0.4}>
        {/* canvas dot grid: clear around the nav bar, fading out around the edges */}
        <AbsoluteFill style={{
          backgroundImage: `radial-gradient(${alpha(L.ink, 0.13)} 1.4px, transparent 1.7px)`,
          backgroundSize: '36px 36px', backgroundPosition: '6px 16px',
          WebkitMaskImage: 'radial-gradient(ellipse 52% 40% at 50% 62%, #000 20%, transparent 100%)',
          maskImage: 'radial-gradient(ellipse 52% 40% at 50% 62%, #000 20%, transparent 100%)',
        }} />
        {/* pool of light where the nav bar lands: the bar "stands" on the canvas */}
        <div style={{
          position: 'absolute', left: 260, right: 260, top: ROW_Y + 40, height: 200,
          background: `radial-gradient(ellipse 50% 50% at 50% 30%, ${alpha(L.light, 0.1)} 0%, transparent 70%)`,
        }} />
      </Stage>

      <AbsoluteFill style={{ transform: `scale(${cam})`, transformOrigin: '50% 52%' }}>
        {/* ── readout: eyebrow + oversized value + unit ── */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 150, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16,
          opacity: eyebrow, letterSpacing: `${(0.28 + (1 - eyebrow) * 0.4).toFixed(3)}em`,
          ...type(22, 600, { caps: true }), color: L.ink2,
        }}>
          <IconAutoLayout c={L.ink2} />
          <span style={{ letterSpacing: 'inherit' }}>Auto layout · Gap</span>
        </div>
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 186, height: 220, overflow: 'hidden',
          display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
        }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 18,
            transform: `translateY(${((1 - numIn) * 105).toFixed(2)}%)`,
          }}>
            <span style={{
              ...type(196, 300), letterSpacing: '-0.05em', color: numColor, display: 'inline-block',
              minWidth: '1.9em', textAlign: 'right', transform: `scale(${tickPulse})`, transformOrigin: '100% 80%',
              textShadow: hot > 0.05 ? `0 0 ${(40 * hot).toFixed(1)}px ${alpha(GOLD, 0.35 * hot)}` : undefined,
            }}>{gapShown}</span>
            <span style={{ ...type(60, 500), color: L.ink3, width: '1.9em' }}>px</span>
          </div>
        </div>
        <Ruler gap={gap} op={rulerIn} hot={hot} />

        {/* ── nav blocks (shorts-kit site top nav) ── */}
        {BLOCK_WIDTHS.map((w, i) => {
          const inP = ramp(frame, 1 + i * 2, 16, EASE.snappy);
          const active = i === 0;
          const vx = (i - 2) * v; // block velocity = (i−2)·dgap/dt: outer blocks displace most
          const blur = Math.min(9, Math.abs(vx) * 0.5);
          const fid = `nb${i}`;
          const dy = (1 - inP) * 34;
          return (
            <div key={i} style={{
              position: 'absolute', left: xs[i], top: ROW_Y - BLOCK_H / 2, width: w, height: BLOCK_H,
              opacity: inP, transform: `translateY(${dy.toFixed(2)}px)`,
            }}>
              {blur > 0.5 && (
                <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden>
                  <filter id={fid} x="-20%" y="-10%" width="140%" height="120%" colorInterpolationFilters="sRGB">
                    <feGaussianBlur stdDeviation={`${blur.toFixed(2)} 0`} />
                  </filter>
                </svg>
              )}
              <div style={{
                position: 'absolute', inset: 0, boxSizing: 'border-box', borderRadius: 24,
                background: active ? 'linear-gradient(180deg, #fbfbf8, #e6e6e1)' : 'linear-gradient(180deg, #212327, #17181b)',
                border: active ? '1px solid rgba(255,255,255,0.7)' : `1px solid ${alpha('#ffffff', 0.09)}`,
                boxShadow: active
                  ? `inset 0 1px 0 rgba(255,255,255,1), inset 0 -2px 0 rgba(0,0,0,0.08), ${softShadow(18, { color: '#000000', strength: 2.4 })}`
                  : `inset 0 1px 0 ${alpha('#ffffff', 0.08)}, ${softShadow(12, { color: '#000000', strength: 2.4 })}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
                filter: blur > 0.5 ? `url(#${fid})` : undefined,
              }}>
                {active && <div style={{ width: 12, height: 12, borderRadius: 99, background: '#111214' }} />}
                <span style={{ ...type(36, active ? 650 : 520), color: active ? '#0d0e10' : alpha(L.ink, 0.86) }}>{LABELS[i]}</span>
              </div>
            </div>
          );
        })}

        {/* ── selection outline + 8 handles + layer name ── */}
        <div style={{
          position: 'absolute', left: selX, top: selY, width: selW, height: selH, boxSizing: 'border-box',
          border: `2px solid ${SEL}`, borderRadius: 6, opacity: Math.min(1, selIn * 1.4),
        }}>
          <div style={{
            position: 'absolute', left: -2, top: -50, display: 'flex', alignItems: 'center', gap: 10,
            ...type(26, 560), color: SEL, whiteSpace: 'nowrap',
          }}>
            <IconAutoLayout c={SEL} size={20} />
            Nav links
            <span style={{ ...type(22, 500, { mono: true }), color: L.ink3, marginLeft: 8 }}>
              {Math.round(total)} × {BLOCK_H}
            </span>
          </div>
          {[[0, 0], [0.5, 0], [1, 0], [0, 0.5], [1, 0.5], [0, 1], [0.5, 1], [1, 1]].map(([hx, hy], i) => {
            const hp = springAt(frame, 7 + i * 1.2, { damping: 13, stiffness: 240 });
            return (
              <div key={i} style={{
                position: 'absolute', left: `${hx * 100}%`, top: `${hy * 100}%`, width: 16, height: 16, marginLeft: -8, marginTop: -8,
                background: L.bg[1], border: `2px solid ${SEL}`, borderRadius: 3, boxSizing: 'border-box', transform: `scale(${hp})`,
              }} />
            );
          })}
        </div>

        {/* ── spacing annotations: extension lines ×2 + measure line + badges (all recomputed live from the gap) ── */}
        {xs.slice(0, -1).map((x, i) => {
          const gx = x + BLOCK_WIDTHS[i];
          const cy = ROW_Y + BLOCK_H / 2 + 74;
          const extTop = ROW_Y + BLOCK_H / 2 + 34;
          const span = Math.max(0, gap);
          const bp = ramp(frame, 14 + i * 2, 12, EASE.snappy);
          return (
            <div key={i} style={{ position: 'absolute', left: 0, top: 0, opacity: measOp }}>
              {[gx, gx + gap].map((lx, k) => (
                <div key={k} style={{
                  position: 'absolute', left: lx - 0.75, top: extTop, width: 1.5, height: 58,
                  backgroundImage: `linear-gradient(${GOLD} 55%, transparent 55%)`, backgroundSize: '1.5px 7px', opacity: 0.7,
                }} />
              ))}
              <div style={{ position: 'absolute', left: gx, top: cy - 1, width: span, height: 2, background: GOLD, boxShadow: `0 0 10px ${alpha(GOLD, 0.4)}` }} />
              <div style={{ position: 'absolute', left: gx - 1, top: cy - 8, width: 2, height: 16, background: GOLD }} />
              <div style={{ position: 'absolute', left: gx + gap - 1, top: cy - 8, width: 2, height: 16, background: GOLD }} />
              <div style={{
                position: 'absolute', left: gx + gap / 2, top: cy + 20,
                transform: `translateX(-50%) translateY(${((1 - bp) * 10).toFixed(1)}px) scale(${(tickPulse * (0.7 + 0.3 * bp)).toFixed(3)})`,
                opacity: bp, minWidth: 64, textAlign: 'center', boxSizing: 'border-box', padding: '6px 14px', borderRadius: 10,
                background: GOLD, color: L.onAccent, ...type(28, 700), lineHeight: 1.1,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.45), 0 6px 18px -6px ${alpha(GOLD, 0.6)}`,
              }}>{gapShown}</div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
