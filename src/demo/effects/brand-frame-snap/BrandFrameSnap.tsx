// brand-frame-snap: figma-devmode 0:28–0:32 (brand-frame-snap) + 0:43–0:47 (frame-color-flip)
// A thick brand-color frame grows first to wrap the full screen → the product window drops into the frame → the cursor clicks the mode switch →
// the whole frame hard-flips from cobalt to orange-red on the same frame, the window layout swaps Design→Dev on the same frame, and the frame-band badge swaps its text on the same frame.
//
// Second redesign (porcelain studio, dual-mode design tool): the brand round swaps the product to shorts-kit: the frame band's top right holds the lens-engraved logo + wordmark,
// and what is designed on the canvas is a shorts-kit promo card (open source $0 / three selling points / Render launch film button).
// - look = porcelain (cool white stage). The frame is the only strong color: Design = cobalt #2F55FF, Dev = orange-red #FF5B1F:
//   hue contrast + lightness difference, so at a glance of the flip you know it "shifted gears"; the UI inside the window is all neutral ink, and the accent color follows only the mode (no orange in the blue segment, no blue in the orange segment).
// - The subject is a design-tool window designed for the camera (1560×864, native-pixel layout, no scaling): left layers bar / center canvas (a large-type pricing card,
//   the selected item is the "Render launch film" button) / right inspector. On the flip frame: the right bar swaps from a light properties panel to a dark code panel (CSS),
//   the left bar swaps from the layer tree to assets and tokens, and the blue selection box on the canvas becomes orange annotation lines. The layout changes its face as a whole, driving the "mode switch" home.
// - Motivation: the cursor slides from the canvas to the Design | Dev switch in the title bar and presses it (wind-up shrink to 0.9) → the color flips on the frame it is released.
// - Frame band 60px, mode badge 32px bold all caps (text to be read ≥32px), and the top right holds the shorts-kit logo + wordmark
//   (the monochrome white logo is used on the color band, since the amber bevel would smear on the orange-red band).
//
// Timeline (30fps, 140f total):
//   0–18    setup: the frame grows from 0 to 60px (snappy, a frame is visible within 2 frames); the badge rises from the lower edge of the frame band from 6f
//   10–40   main action: the window springs from 660px below the frame edge into the frame (damping 15) + 18° forward tilt corrects back, vertical blur by velocity, shadow tightens with height
//   36–52   follow-through: button selection box outline (8 handles pop out staggered) + size capsule 440 × 76
//   56–80   cursor slides from the canvas to the Dev switch (asymmetric in-out); 80–84 press
//   84      flip frame: frame color / window layout / badge text / switch state hard-cut on the same frame + 3 frames of radial white flash + frame thickness damped bounce
//   86–104  aftermath: annotation lines drawn one by one (3f stagger), value capsules pop out with overshoot
//   104–140 hold: content area pushes in very slowly 2%, a clean settle
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { EASE, FONT, SpeedBlur, mix, ramp, softShadow } from '../../../shared/fixtures/Polish';
import { LOOKS, Stage, alpha, springAt } from '../../../shared/fixtures/Look';
import { BRAND, ShortKitMark } from '../../../shared/fixtures/Brand';

export const BRAND_FRAME_SNAP_DURATION = 140;

const L = LOOKS.porcelain;
const BLUE = '#2F55FF'; // Design mode brand color
const ORANGE = '#FF5B1F'; // Dev mode brand color
const FLIP = 84; // hard color flip on the same frame
const BAND = 60; // frame thickness
const WIN_W = 1560;
const WIN_H = 864;
const BAR_H = 64; // window title bar
const LEFT_W = 300;
const RIGHT_W = 400;
const INK = '#14161f';
const MONO = FONT.mono;

// Coordinates inside the window (relative to the window's top-left): canvas area, promo card, button
const CANVAS_X = LEFT_W;
const CANVAS_W = WIN_W - LEFT_W - RIGHT_W; // 860
const BODY_H = WIN_H - BAR_H; // 800
const CARD_W = 468;
const CARD_H = 600;
const CARD_X = CANVAS_X + (CANVAS_W - CARD_W) / 2;
const CARD_Y = BAR_H + (BODY_H - CARD_H) / 2 + 12;
const BTN_W = 404;
const BTN_H = 76;
const BTN_X = CARD_X + 32;
const BTN_Y = CARD_Y + CARD_H - 32 - BTN_H;
// Center of the "Dev" segment in the title bar mode switch (cursor target)
const TOG_W = 230;
const TOG_X = WIN_W - 24 - TOG_W;
const DEV_CX = TOG_X + TOG_W * 0.75;
const DEV_CY = BAR_H / 2;

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

// ───────── Small icons ─────────
const ModeIcon: React.FC<{ dev: boolean; size: number; color: string }> = ({ dev, size, color }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {dev ? (
      <>
        <path d="M5.2 4 1.6 8l3.6 4" />
        <path d="M10.8 4 14.4 8l-3.6 4" />
        <path d="M9.2 2.6 6.8 13.4" />
      </>
    ) : (
      <>
        <path d="M8 1.6 12.8 7 8 14.4 3.2 7z" />
        <path d="M8 14.4V8.6" />
        <circle cx="8" cy="7.6" r="1.1" />
      </>
    )}
  </svg>
);

const Check: React.FC = () => (
  <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill="#eef0f5" />
    <path d="M7.4 12.4l3 3 6.2-6.6" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Cursor (white outline, black core, neutral color, not part of the color coding)
const Cursor: React.FC<{ x: number; y: number; press: number }> = ({ x, y, press }) => (
  <svg width={44} height={44} viewBox="0 0 24 24" style={{
    position: 'absolute', left: x - 7, top: y - 4, transform: `scale(${1 - 0.12 * press})`, transformOrigin: '7px 4px',
    filter: 'drop-shadow(0 4px 8px rgba(12,20,40,0.28))',
  }}>
    <path d="M5 3.2 19 12l-6.4 1.3L9.4 19.6z" fill={INK} stroke="#ffffff" strokeWidth={1.6} strokeLinejoin="round" />
  </svg>
);

// ───────── Window: title bar ─────────
const TitleBar: React.FC<{ dev: boolean; color: string }> = ({ dev, color }) => (
  <div style={{
    position: 'absolute', left: 0, top: 0, width: WIN_W, height: BAR_H, boxSizing: 'border-box',
    background: 'linear-gradient(180deg,#fbfcfe 0%,#f3f5f9 100%)', borderBottom: '1px solid rgba(15,30,60,0.08)',
    display: 'flex', alignItems: 'center', padding: '0 24px', gap: 10, fontFamily: FONT.sans,
  }}>
    {[0, 1, 2].map((i) => (
      <div key={i} style={{ width: 14, height: 14, borderRadius: 7, background: '#d9dde5', boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.12)' }} />
    ))}
    <div style={{ marginLeft: 22, display: 'flex', alignItems: 'center', gap: 12, fontSize: 22, color: L.ink2, letterSpacing: '-0.01em' }}>
      <span style={{ color: L.ink3 }}>Landing</span>
      <span style={{ color: L.ink3 }}>/</span>
      <span style={{ color: L.ink, fontWeight: 600 }}>Promo card</span>
    </div>
    {/* Mode switch: active segment = current mode color (swapped in sync on the flip frame) */}
    <div style={{
      position: 'absolute', left: TOG_X, top: (BAR_H - 44) / 2, width: TOG_W, height: 44, borderRadius: 12,
      background: '#e9ecf2', boxShadow: 'inset 0 1px 2px rgba(15,30,60,0.08)', display: 'flex', padding: 4, boxSizing: 'border-box',
    }}>
      {(['Design', 'Dev'] as const).map((m, i) => {
        const on = (i === 1) === dev;
        return (
          <div key={m} style={{
            flex: 1, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: on ? color : 'transparent', color: on ? '#fff' : L.ink2, fontSize: 21, fontWeight: 650,
            boxShadow: on ? `inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 6px ${alpha(color, 0.35)}` : 'none',
          }}>
            <ModeIcon dev={i === 1} size={17} color={on ? '#fff' : L.ink3} />
            {m}
          </div>
        );
      })}
    </div>
  </div>
);

// ───────── Left bar ─────────
const PanelHead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: L.ink3, margin: '0 0 14px' }}>{children}</div>
);

const LeftPanel: React.FC<{ dev: boolean; color: string }> = ({ dev, color }) => (
  <div style={{
    position: 'absolute', left: 0, top: BAR_H, width: LEFT_W, height: BODY_H, boxSizing: 'border-box', padding: '28px 22px',
    background: '#fafbfd', borderRight: '1px solid rgba(15,30,60,0.07)', fontFamily: FONT.sans,
  }}>
    {!dev ? (
      <>
        <PanelHead>Layers</PanelHead>
        {[
          ['Promo card', 0, false], ['Header', 1, false], ['Price', 1, false], ['Features', 1, false],
          ['Render launch film', 1, true], ['Footnote', 1, false],
        ].map(([n, d, sel]) => (
          <div key={n as string} style={{
            height: 46, display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 12 + (d as number) * 22, borderRadius: 10,
            background: sel ? alpha(color, 0.1) : 'transparent', color: sel ? color : L.ink2, fontSize: 20, fontWeight: sel ? 650 : 500,
          }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.6px solid ${sel ? color : L.ink3}` }} />
            {n as string}
          </div>
        ))}
      </>
    ) : (
      <>
        <PanelHead>Tokens</PanelHead>
        {[
          ['color/ink-900', INK], ['color/paper', '#ffffff'], ['radius/lg', null], ['space/8', null], ['type/label-lg', null],
        ].map(([n, sw]) => (
          <div key={n as string} style={{ height: 46, display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 12, fontFamily: MONO, fontSize: 18, color: L.ink2 }}>
            <div style={{
              width: 18, height: 18, borderRadius: sw ? 5 : 3, background: (sw as string) ?? 'transparent',
              border: sw ? '1px solid rgba(15,30,60,0.18)' : `1.6px dashed ${L.ink3}`,
            }} />
            {n as string}
          </div>
        ))}
        <div style={{ height: 22 }} />
        <PanelHead>Assets</PanelHead>
        {['cta-arrow.svg', 'check.svg'].map((n) => (
          <div key={n} style={{ height: 46, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', fontFamily: MONO, fontSize: 18, color: L.ink2 }}>
            {n}
            <span style={{ fontFamily: FONT.sans, fontSize: 16, fontWeight: 650, color }}>Export</span>
          </div>
        ))}
      </>
    )}
  </div>
);

// ───────── Right bar: Design = light inspector; Dev = dark code panel ─────────
const Field: React.FC<{ k: string; v: string; w?: number }> = ({ k, v, w = 150 }) => (
  <div style={{ width: w, height: 48, borderRadius: 10, background: '#f1f3f7', display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px', boxSizing: 'border-box', fontSize: 20 }}>
    <span style={{ color: L.ink3, fontWeight: 600 }}>{k}</span>
    <span style={{ color: L.ink, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{v}</span>
  </div>
);

const CODE: Array<Array<[string, 'c' | 'p' | 'v' | 's' | 'k']>> = [
  [['/* Button · Primary */', 'c']],
  [['.cta', 'k'], [' {', 'p']],
  [['  height', 's'], [': ', 'p'], ['76px', 'v'], [';', 'p']],
  [['  padding', 's'], [': ', 'p'], ['0 32px', 'v'], [';', 'p']],
  [['  border-radius', 's'], [': ', 'p'], ['20px', 'v'], [';', 'p']],
  [['  background', 's'], [': ', 'p'], ['#14161F', 'v'], [';', 'p']],
  [['  font-weight', 's'], [': ', 'p'], ['650', 'v'], [';', 'p']],
  [['  gap', 's'], [': ', 'p'], ['12px', 'v'], [';', 'p']],
  [['}', 'p']],
];

const RightPanel: React.FC<{ dev: boolean; color: string }> = ({ dev, color }) =>
  !dev ? (
    <div style={{
      position: 'absolute', right: 0, top: BAR_H, width: RIGHT_W, height: BODY_H, boxSizing: 'border-box', padding: '28px 26px',
      background: '#ffffff', borderLeft: '1px solid rgba(15,30,60,0.07)', fontFamily: FONT.sans,
    }}>
      <PanelHead>Frame</PanelHead>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}><Field k="W" v="404" w={168} /><Field k="H" v="76" w={168} /></div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 34 }}><Field k="R" v="20" w={168} /><Field k="↔" v="12" w={168} /></div>
      <PanelHead>Fill</PanelHead>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: 48, marginBottom: 34, fontSize: 20, color: L.ink, fontWeight: 600 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: INK }} />
        14161F
        <span style={{ marginLeft: 'auto', color: L.ink3 }}>100%</span>
      </div>
      <PanelHead>Auto layout</PanelHead>
      <div style={{ display: 'flex', gap: 12 }}>
        {['→', '↓', '⤢'].map((g, i) => (
          <div key={g} style={{
            width: 64, height: 48, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            background: i === 0 ? alpha(color, 0.12) : '#f1f3f7', color: i === 0 ? color : L.ink3, fontWeight: 700,
          }}>{g}</div>
        ))}
      </div>
      <div style={{ height: 34 }} />
      <PanelHead>Effects</PanelHead>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: 48, fontSize: 20, color: L.ink, fontWeight: 600 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fff', boxShadow: '0 3px 8px rgba(12,20,40,0.3), 0 0 0 1px rgba(15,30,60,0.08)' }} />
        Drop shadow
        <span style={{ marginLeft: 'auto', color: L.ink3 }}>22%</span>
      </div>
      <div style={{ height: 34 }} />
      <PanelHead>Prototype</PanelHead>
      <div style={{ height: 48, borderRadius: 10, background: '#f1f3f7', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', fontSize: 20, color: L.ink2, fontWeight: 550 }}>
        On tap <span style={{ color: L.ink3 }}>→</span> <span style={{ color: L.ink, fontWeight: 650 }}>Render queue</span>
      </div>
    </div>
  ) : (
    <div style={{
      position: 'absolute', right: 0, top: BAR_H, width: RIGHT_W, height: BODY_H, boxSizing: 'border-box',
      background: 'linear-gradient(180deg,#16181f 0%,#111318 100%)', fontFamily: MONO,
    }}>
      <div style={{ display: 'flex', gap: 26, height: 64, alignItems: 'center', padding: '0 26px', borderBottom: '1px solid rgba(255,255,255,0.07)', fontFamily: FONT.sans, fontSize: 20, fontWeight: 650 }}>
        {['CSS', 'SwiftUI', 'Compose'].map((t, i) => (
          <span key={t} style={{ color: i === 0 ? '#fff' : 'rgba(255,255,255,0.38)', borderBottom: i === 0 ? `3px solid ${color}` : 'none', padding: '20px 0 17px' }}>{t}</span>
        ))}
      </div>
      <div style={{ padding: '26px 26px', fontSize: 21, lineHeight: '42px' }}>
        {CODE.map((ln, i) => (
          <div key={i} style={{ whiteSpace: 'pre', display: 'flex' }}>
            <span style={{ width: 34, color: 'rgba(255,255,255,0.2)' }}>{i + 1}</span>
            {ln.map(([s, k], j) => (
              <span key={j} style={{
                color: k === 'c' ? 'rgba(255,255,255,0.34)' : k === 'k' ? '#ffffff' : k === 's' ? '#c9ced9' : k === 'v' ? color : 'rgba(255,255,255,0.5)',
                fontWeight: k === 'k' ? 700 : 400,
              }}>{s}</span>
            ))}
          </div>
        ))}
      </div>
      <div style={{
        position: 'absolute', left: 26, right: 26, bottom: 26, height: 56, borderRadius: 12, background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: FONT.sans, fontSize: 21, fontWeight: 700, color: '#fff',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28)',
      }}>Copy code</div>
    </div>
  );

// ───────── Canvas and promo card (shorts-kit open-source skill) ─────────
const PricingCard: React.FC = () => (
  <div style={{
    position: 'absolute', left: CARD_X, top: CARD_Y, width: CARD_W, height: CARD_H, borderRadius: 28, background: '#ffffff',
    boxSizing: 'border-box', padding: 32, fontFamily: FONT.sans, color: INK,
    boxShadow: `0 0 0 1px rgba(15,30,60,0.06), ${softShadow(18, { color: '#0c1a3a', strength: 0.9 })}`,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: BRAND.font, fontSize: 22, fontWeight: 700, letterSpacing: '0.03em' }}>
        <ShortKitMark size={30} tone="light" />{BRAND.name}
      </span>
      <span style={{ fontSize: 18, fontWeight: 650, color: L.ink2, background: '#f1f3f7', padding: '7px 14px', borderRadius: 99 }}>Open source</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 30 }}>
      <span style={{ fontSize: 124, fontWeight: 800, letterSpacing: '-0.055em', lineHeight: 0.9 }}>$0</span>
      <span style={{ fontSize: 26, color: L.ink2, fontWeight: 500 }}>/ forever</span>
    </div>
    <div style={{ fontSize: 22, color: L.ink2, marginTop: 14 }}>Your product, in motion.</div>
    <div style={{ marginTop: 34, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {['Shot recipe cards', '2.5D camera moves', 'Beat-synced cuts'].map((s) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 24, fontWeight: 550 }}><Check />{s}</div>
      ))}
    </div>
    <div style={{
      position: 'absolute', left: 32, bottom: 32, width: BTN_W, height: BTN_H, borderRadius: 20,
      background: 'linear-gradient(180deg,#22252f 0%,#14161f 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), 0 6px 14px rgba(12,20,40,0.22)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#fff', fontSize: 28, fontWeight: 650, letterSpacing: '-0.01em',
    }}>
      Render launch film
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    </div>
  </div>
);

// Design mode: button selection box + 8 handles (popping out staggered) + size capsule
const Selection: React.FC<{ f: number; color: string }> = ({ f, color }) => {
  const draw = ramp(f, 36, 12, EASE.snappy);
  const pad = 6;
  const x = BTN_X - pad, y = BTN_Y - pad, w = BTN_W + pad * 2, h = BTN_H + pad * 2;
  const per = 2 * (w + h);
  const hs = [[0, 0], [0.5, 0], [1, 0], [1, 0.5], [1, 1], [0.5, 1], [0, 1], [0, 0.5]];
  const pill = springAt(f, 46, { damping: 15, stiffness: 200 });
  return (
    <>
      <svg width={WIN_W} height={WIN_H} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <rect x={x} y={y} width={w} height={h} rx={24} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={`${per} ${per}`} strokeDashoffset={per * (1 - draw)} />
      </svg>
      {hs.map(([u, v], i) => {
        const p = springAt(f, 40 + i * 1.2, { damping: 14, stiffness: 260 });
        return (
          <div key={i} style={{
            position: 'absolute', left: x + u * w - 8, top: y + v * h - 8, width: 16, height: 16, borderRadius: 4, background: '#fff',
            border: `3px solid ${color}`, boxSizing: 'border-box', transform: `scale(${p})`,
          }} />
        );
      })}
      <div style={{
        position: 'absolute', left: x + w / 2, top: y + h + 16, transform: `translateX(-50%) scale(${pill})`, transformOrigin: '50% 0',
        background: color, color: '#fff', fontFamily: FONT.sans, fontSize: 21, fontWeight: 700, padding: '7px 14px', borderRadius: 9,
        fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', boxShadow: `0 4px 12px ${alpha(color, 0.35)}`,
      }}>404 × 76</div>
    </>
  );
};

// Dev mode: orange annotation lines (drawn one by one) + value capsules (popping out with overshoot)
const Redlines: React.FC<{ f: number; color: string }> = ({ f, color }) => {
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number; label: string; lx: number; ly: number }> = [
    // Button width (above the button)
    { x1: BTN_X, y1: BTN_Y - 22, x2: BTN_X + BTN_W, y2: BTN_Y - 22, label: '404', lx: BTN_X + BTN_W / 2, ly: BTN_Y - 22 },
    // Button height (outside the right of the card)
    { x1: CARD_X + CARD_W + 28, y1: BTN_Y, x2: CARD_X + CARD_W + 28, y2: BTN_Y + BTN_H, label: '76', lx: CARD_X + CARD_W + 28, ly: BTN_Y + BTN_H / 2 },
    // Card inner padding (left of the button)
    { x1: CARD_X, y1: BTN_Y + BTN_H / 2, x2: BTN_X, y2: BTN_Y + BTN_H / 2, label: '32', lx: CARD_X - 34, ly: BTN_Y + BTN_H / 2 },
    // Button distance from the card bottom
    { x1: BTN_X + BTN_W * 0.78, y1: BTN_Y + BTN_H, x2: BTN_X + BTN_W * 0.78, y2: CARD_Y + CARD_H, label: '32', lx: BTN_X + BTN_W * 0.78 + 34, ly: BTN_Y + BTN_H + 16 },
  ];
  return (
    <>
      {/* Button outer frame: orange dashed line (the "being inspected" state of Dev mode) */}
      <div style={{
        position: 'absolute', left: BTN_X - 1, top: BTN_Y - 1, width: BTN_W + 2, height: BTN_H + 2, borderRadius: 21,
        border: `2px dashed ${color}`, boxSizing: 'border-box',
      }} />
      <svg width={WIN_W} height={WIN_H} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        {lines.map((l, i) => {
          const p = ramp(f, FLIP + 2 + i * 3, 9, EASE.snappy);
          const cx = (l.x1 + l.x2) / 2, cy = (l.y1 + l.y2) / 2;
          const x1 = mix(cx, l.x1, p), y1 = mix(cy, l.y1, p), x2 = mix(cx, l.x2, p), y2 = mix(cy, l.y2, p);
          const vert = l.x1 === l.x2;
          return (
            <g key={i} stroke={color} strokeWidth={2.5} strokeLinecap="round" opacity={p > 0 ? 1 : 0}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} />
              {vert ? (
                <>
                  <line x1={x1 - 9} y1={y1} x2={x1 + 9} y2={y1} />
                  <line x1={x2 - 9} y1={y2} x2={x2 + 9} y2={y2} />
                </>
              ) : (
                <>
                  <line x1={x1} y1={y1 - 9} x2={x1} y2={y1 + 9} />
                  <line x1={x2} y1={y2 - 9} x2={x2} y2={y2 + 9} />
                </>
              )}
            </g>
          );
        })}
      </svg>
      {lines.map((l, i) => {
        const s = springAt(f, FLIP + 6 + i * 3, { damping: 13, stiffness: 240 });
        return (
          <div key={i} style={{
            position: 'absolute', left: l.lx, top: l.ly, transform: `translate(-50%,-50%) scale(${s})`,
            background: color, color: '#fff', fontFamily: FONT.sans, fontSize: 21, fontWeight: 750, padding: '5px 11px', borderRadius: 8,
            fontVariantNumeric: 'tabular-nums', boxShadow: `0 4px 10px ${alpha(color, 0.35)}`,
          }}>{l.label}</div>
        );
      })}
    </>
  );
};

export const BrandFrameSnap: React.FC = () => {
  const f = useCurrentFrame();
  const dev = f >= FLIP;
  const color = dev ? ORANGE : BLUE;

  // 1) Frame stands up first: 0 → 60px (snappy, a visible frame by frame 2)
  const grow = ramp(f, -1, 19, EASE.snappy);
  // Flip frame: 3 frames of radial white flash + frame thickness damped bounce (the mechanical feedback of a "gear clicking in")
  const since = f - FLIP;
  const flash = since >= 0 && since < 3 ? 0.6 - since * 0.2 : 0;
  const bounce = since >= 0 ? Math.exp(-since * 0.24) * Math.cos(since * 0.95) * 12 : 0;
  const band = BAND * grow + bounce;

  // 2) Window drops into the frame: spring y 660 → 0, forward tilt 18° → 0, scale 0.88 → 1
  const dropAt = (fr: number) => springAt(fr, 10, { damping: 15, stiffness: 115 });
  const yAt = (fr: number) => mix(660, 0, dropAt(fr));
  const d = dropAt(f);
  const winY = yAt(f);
  const vy = f >= 10 ? yAt(f + 0.5) - yAt(f - 0.5) : 0;
  const tilt = mix(18, 0, d);
  const winS = mix(0.88, 1, d);
  const elev = mix(70, 22, clamp01(d));

  // 3) Cursor: 56–80 slides from the canvas bottom right to the Dev switch; 80–84 press, 84 release (= the flip frame)
  const cT = ramp(f, 56, 24, EASE.swift);
  const cx = mix(CARD_X + CARD_W + 120, DEV_CX, cT);
  const cy = mix(CARD_Y + CARD_H - 40, DEV_CY + 6, cT) - Math.sin(cT * Math.PI) * 60; // slight arc, not a straight line
  const press = f >= 80 && f < FLIP ? ramp(f, 80, 3, EASE.out) : f >= FLIP ? 1 - ramp(f, FLIP, 6, EASE.out) : 0;
  const cursorOp = ramp(f, 54, 6, EASE.out) * (1 - ramp(f, FLIP + 16, 10, EASE.exit));

  // 4) Content area very slow push-in (from after the window settles, smooth with no velocity jump)
  // Flip-frame gear-shift jolt: content as a whole 1 → 1.012 → 1 (8f damping), on the same frame as the frame thickness bounce
  const punch = since >= 0 ? Math.exp(-since * 0.35) * Math.sin(Math.min(Math.PI, since * 0.9) + 0.0001) * 0.012 : 0;
  const push = mix(1, 1.02, ramp(f, 40, 100, EASE.smooth)) + punch;

  const labelIn = ramp(f, 6, 14, EASE.snappy);
  const inner = Math.max(0, band);

  return (
    <div style={{ width: 1920, height: 1080, background: '#0c1020', position: 'relative', overflow: 'hidden', fontFamily: FONT.sans }}>
      {/* In-frame content area: porcelain stage (with a very faint ground glow in the current mode color, flipping on the same frame) */}
      <div style={{ position: 'absolute', inset: inner, overflow: 'hidden', borderRadius: 22 }}>
        <Stage look={L} keyLight={{ x: 0.5, y: 0.0 }} fill={null} vignette={0.07} intensity={1.15}>
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse 70% 40% at 50% 104%, ${alpha(color, 0.16)} 0%, ${alpha(color, 0)} 70%)`,
          }} />
        </Stage>
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${push})`, transformOrigin: '50% 52%' }}>
          <SpeedBlur vx={0} vy={vy} amount={0.28} max={14}>
            <div style={{ position: 'absolute', inset: 0, perspective: 2400, perspectiveOrigin: '50% 30%' }}>
              <div style={{
                position: 'absolute', left: '50%', top: '50%', width: WIN_W, height: WIN_H,
                marginLeft: -WIN_W / 2, marginTop: -WIN_H / 2 + 6,
                transform: `translateY(${winY.toFixed(2)}px) rotateX(${tilt.toFixed(2)}deg) scale(${winS.toFixed(4)})`,
                transformOrigin: '50% 100%', opacity: clamp01(d * 5),
                borderRadius: 18, overflow: 'hidden', background: '#eef1f6',
                boxShadow: `0 0 0 1px rgba(15,30,60,0.10), inset 0 1px 0 rgba(255,255,255,0.9), ${softShadow(elev, { color: '#0c1a3a', strength: 1.3 })}`,
              }}>
                {/* Canvas: dot grid */}
                <div style={{
                  position: 'absolute', left: CANVAS_X, top: BAR_H, width: CANVAS_W, height: BODY_H,
                  backgroundImage: 'radial-gradient(circle, rgba(15,30,60,0.13) 1.2px, transparent 1.5px)', backgroundSize: '28px 28px',
                }} />
                <div style={{ position: 'absolute', left: CARD_X, top: CARD_Y - 38, fontSize: 19, fontWeight: 600, color: L.ink3 }}>Promo card · 468 × 600</div>
                <PricingCard />
                {!dev ? <Selection f={f} color={color} /> : <Redlines f={f} color={color} />}
                <LeftPanel dev={dev} color={color} />
                <RightPanel dev={dev} color={color} />
                <TitleBar dev={dev} color={color} />
                {cursorOp > 0.01 && (
                  <div style={{ position: 'absolute', inset: 0, opacity: cursorOp }}>
                    <Cursor x={cx} y={cy} press={press} />
                  </div>
                )}
              </div>
            </div>
          </SpeedBlur>
        </div>
        {/* Frame inner edge: inset shadow = cardboard thickness */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 22, pointerEvents: 'none',
          boxShadow: 'inset 0 0 0 1px rgba(10,16,40,0.10), inset 0 4px 14px rgba(10,16,40,0.18)',
        }} />
      </div>

      {/* Brand-color frame: 4 solid color bands, color flip = swap background on the same frame */}
      {([
        { left: 0, top: 0, right: 0, height: inner },
        { left: 0, bottom: 0, right: 0, height: inner },
        { left: 0, top: 0, bottom: 0, width: inner },
        { right: 0, top: 0, bottom: 0, width: inner },
      ] as React.CSSProperties[]).map((pos, i) => (
        <div key={i} style={{ position: 'absolute', background: color, ...pos }} />
      ))}
      {/* Thin glaze lit on the color bands: bright on top, dark on the bottom (same direction as the stage key light); fill the color at inner rounded corners so the frame is "one plate with a hole cut in it" */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 35%, rgba(0,0,0,0.10) 100%)',
        clipPath: `polygon(0 0,100% 0,100% 100%,0 100%,0 0,${inner}px ${inner}px,${inner}px calc(100% - ${inner}px),calc(100% - ${inner}px) calc(100% - ${inner}px),calc(100% - ${inner}px) ${inner}px,${inner}px ${inner}px)`,
      }} />
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {/* Inner rounded corners: color blocks at the four corners (the frame band is a right-angle plate, the opening has rounded corners) */}
        <path fillRule="evenodd" fill={color}
          d={`M${inner} ${inner}H${1920 - inner}V${1080 - inner}H${inner}Z M${inner} ${inner + 22}A22 22 0 0 1 ${inner + 22} ${inner}H${1920 - inner - 22}A22 22 0 0 1 ${1920 - inner} ${inner + 22}V${1080 - inner - 22}A22 22 0 0 1 ${1920 - inner - 22} ${1080 - inner}H${inner + 22}A22 22 0 0 1 ${inner} ${1080 - inner - 22}Z`} />
      </svg>

      {/* Frame-band badge: top-left mode name (32px bold all caps), top-right shorts-kit logo + wordmark (all lowercase); text swaps on the flip frame */}
      <div style={{
        position: 'absolute', left: 66, top: 0, height: inner, display: 'flex', alignItems: 'center', gap: 14,
        fontWeight: 800, fontSize: 30, letterSpacing: '0.16em', color: '#fff', whiteSpace: 'nowrap',
        opacity: labelIn, transform: `translateY(${((1 - labelIn) * 16).toFixed(2)}px)`,
      }}>
        <ModeIcon dev={dev} size={28} color="#ffffff" />
        {dev ? 'DEV MODE' : 'DESIGN'}
      </div>
      <div style={{
        position: 'absolute', right: 66, top: 0, height: inner, display: 'flex', alignItems: 'center', gap: 12,
        fontFamily: BRAND.font, fontWeight: 700, fontSize: 30, letterSpacing: '0.03em', color: '#fff', whiteSpace: 'nowrap',
        opacity: labelIn * 0.92, transform: `translateY(${((1 - labelIn) * 16).toFixed(2)}px)`,
      }}>
        <ShortKitMark size={40} frameColor="#ffffff" cutColor="#ffffff" />
        {BRAND.name}
      </div>

      {/* Flip white flash: radial flash inward from the frame (brightest at the frame band, centered at about 1/3) */}
      {flash > 0 && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: flash,
          background: 'radial-gradient(ellipse 75% 75% at 50% 50%, rgba(255,255,255,0.3) 40%, rgba(255,255,255,1) 100%)',
        }} />
      )}
    </div>
  );
};
