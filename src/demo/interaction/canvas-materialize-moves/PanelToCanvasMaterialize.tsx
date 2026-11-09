// panel-to-canvas-materialize —— miro-promo 84–92s
// Rows in the side-panel list are ticked one by one → the button is pressed → three rows fly out of the panel along a tossed-up arc in a stagger, morphing across containers into three cards on the canvas (row → card form migration).
//
// Second redesign (sand warm field · research insights on the wall):
// - look = sand (beige paper · terracotta accent · navy accents). The product is shorts-kit: the right-hand "Shot recipes" panel lists 5 shot recipe cards
//   (32px row titles, category tags and the picker), and the left is an open storyboard (logo + serif big title "Launch film" + faint dot-grid canvas).
// - the action chain has cause and effect: the cursor ticks three checkboxes one by one (terracotta checkmarks spring out, the check lines draw on) → moves to "Add 3 to board" and presses →
//   the three rows are first "pulled up" (wind-up: enlarge 2% + shadow deepens over 4f) and then toss along a quadratic Bezier arc toward the canvas, staggered 6f.
// - form migration (the crux of this technique): position travels the arc and arrives first, width / height / corner radius converge 3f later (parent first, child after); row content fades out at u<0.4, card content fades in at u>0.5,
//   the two forms are never shown together in the middle; in flight directional motion blur by speed, the shadow lifts, grows and softens with the arc, on landing a 4f squash rebound + contact shadow tightens.
// - the row slot is not restored: a flown-away row collapses into a terracotta dashed blank "On board", so the "migration" is not a "copy".
// - camera: after takeoff a very slow overall push in (2.5% in total); after settling the board-header count "3 shots pinned" rises, hold into a poster.
//
// Timeline (30fps, 150f total):
//   0–18    the panel slides in from the right (snappy), 5 rows in a stagger; the board's serif title rises word by word
//   14/24/34 the cursor ticks the three checkboxes in turn (check spring damping 11, check line draws on over 7f), button count 1→2→3
//   48      cursor reaches the button, presses at 52f (scale 0.94 → rebound)
//   56/62/68 three rows pull up 4f → take off 40f (spring damping 17, arc midpoint lifts 220px)
//   ~104–112 three cards land in turn (squash rebound, tilt −2.5/1.8/−1.2°), row slots collapse into dashed lines
//   112–150 hold: board-header count "3 shots pinned" rises, camera pushes in very slowly
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, FONT, SpeedBlur, mix, ramp, softShadow } from '../../../shared/fixtures/Polish';
import { LOOKS, SERIF, Stage, TextReveal, alpha, springAt, type } from '../../../shared/fixtures/Look';
import { BRAND, ShortKitMark } from '../../../shared/fixtures/Brand';

export const PANEL_TO_CANVAS_MATERIALIZE_DURATION = 150;

const L = LOOKS.sand;
const ACC = L.accent; // terracotta
const NAVY = L.accent2; // navy (accent: tags)

// ── panel geometry ──
const PANEL_X = 1164;
const PANEL_Y = 96;
const PANEL_W = 656;
const PANEL_H = 888;
const ROW_X = PANEL_X + 24;
const ROW_W = PANEL_W - 48;
const ROW_H = 104;
const ROW_STEP = 116;
const ROWS_TOP = 262; // y of the first row on screen (shared by the in-panel layout and the flight start, so takeoff has zero jump)

// ── card landing positions (left area of the canvas) ──
const CARD_W = 486;
const CARD_H = 300;
const TARGETS = [
  { x: 116, y: 268, rot: -2.5 },
  { x: 636, y: 306, rot: 1.8 },
  { x: 330, y: 640, rot: -1.2 },
];

const CHECK_AT = [14, 24, 34];
const PRESS = 52;
const LIFT_AT = [56, 62, 68];
const LIFT = 4; // pull-up wind-up frames
const FLY_DUR = 40;

type Item = { title: string; tag: string; who: string; name: string; quote: string; meta: string };
const ITEMS: Item[] = [
  // shot recipe cards (card names that really exist in the library); quote = the picker's note, meta = indicative duration
  { title: 'Crash zoom punch-in', tag: 'Camera', who: 'AO', name: 'Ama Owusu', quote: '“Lands right on the beat drop.”', meta: '24 frames' },
  { title: 'Text as mask opener', tag: 'Opening', who: 'LB', name: 'Lars Berg', quote: '', meta: '' },
  { title: 'Cursor flyover tour', tag: 'Interaction', who: 'PS', name: 'Priya Sethi', quote: '“Reads like a real screen take.”', meta: '96 frames' },
  { title: 'Chart axis rescale shock', tag: 'Data', who: 'TM', name: 'Tomás Mena', quote: 'Rescales on the cut, holds two beats.', meta: '72 frames' },
  { title: 'Grain dissolve outro', tag: 'Outro', who: 'AO', name: 'Ama Owusu', quote: '', meta: '' },
];
const SLOTS = [0, 2, 3]; // ticked rows (non-contiguous: reads as "picking" rather than "select all")
const AV = ['#c4552d', '#3d5a80', '#7c6a4f', '#9a5b3f'];

const rowY = (slot: number) => ROWS_TOP + slot * ROW_STEP;

// flight progress (spring, may briefly exceed 1)
const flyU = (f: number, k: number) => springAt(f, LIFT_AT[k] + LIFT, { damping: 17, stiffness: 95, mass: 0.9 });

// flight geometry: position follows a quadratic Bezier (midpoint lifted), size converges 3f later
const flyGeom = (f: number, k: number) => {
  const slot = SLOTS[k];
  const u = flyU(f, k);
  const us = flyU(f - 3, k); // size 3f later
  const t = TARGETS[k];
  const sx = ROW_X + ROW_W / 2, sy = rowY(slot) + ROW_H / 2;
  const ex = t.x + CARD_W / 2, ey = t.y + CARD_H / 2;
  const cx = (sx + ex) / 2, cy = Math.min(sy, ey) - 220;
  const q = Math.min(1, Math.max(0, u));
  const bx = (1 - q) * (1 - q) * sx + 2 * (1 - q) * q * cx + q * q * ex + (u - q) * (ex - cx) * 0.6;
  const by = (1 - q) * (1 - q) * sy + 2 * (1 - q) * q * cy + q * q * ey + (u - q) * (ey - cy) * 0.6;
  const w = mix(ROW_W, CARD_W, us);
  const h = mix(ROW_H, CARD_H, us);
  return { u, us, cx: bx, cy: by, w, h, rot: t.rot * u, arc: Math.sin(Math.PI * q) };
};

const Avatar: React.FC<{ s: string; c: string; size?: number }> = ({ s, c, size = 44 }) => (
  <div style={{
    width: size, height: size, borderRadius: 99, flex: 'none', display: 'grid', placeItems: 'center',
    background: `linear-gradient(180deg, ${alpha(c, 0.85)}, ${c})`, color: '#fff8f0',
    ...type(size * 0.38, 650), letterSpacing: '0.02em', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
  }}>{s}</div>
);

const Tag: React.FC<{ s: string }> = ({ s }) => (
  <span style={{
    ...type(20, 650, { caps: true }), color: NAVY, padding: '6px 12px', borderRadius: 99,
    background: alpha(NAVY, 0.09), border: `1px solid ${alpha(NAVY, 0.16)}`, whiteSpace: 'nowrap',
  }}>{s}</span>
);

const CheckBox: React.FC<{ frame: number; at: number | null }> = ({ frame, at }) => {
  const checked = at !== null && frame >= at;
  const pop = at === null ? 0 : springAt(frame, at, { damping: 11, stiffness: 300 });
  const draw = at === null ? 0 : ramp(frame, at + 1, 7, EASE.out);
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 10, flex: 'none', boxSizing: 'border-box',
      border: checked ? 'none' : `2px solid ${alpha(L.ink, 0.22)}`,
      background: checked ? `linear-gradient(180deg, #d4673e, ${ACC})` : L.surface,
      boxShadow: checked ? `inset 0 1px 0 rgba(255,255,255,0.3), 0 3px 8px -3px ${alpha(ACC, 0.7)}` : `inset 0 1px 2px ${alpha(L.shadow, 0.08)}`,
      transform: checked ? `scale(${(0.75 + 0.25 * pop).toFixed(3)})` : undefined,
      display: 'grid', placeItems: 'center',
    }}>
      {checked && (
        <svg width="22" height="22" viewBox="0 0 18 18">
          <path d="M3.5 9.5 L7.3 13 L14.5 5" stroke="#fff8f0" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round"
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
        </svg>
      )}
    </div>
  );
};

// row-form content (shared by the in-panel row and the in-flight row, so takeoff keeps the same shape)
const RowContent: React.FC<{ item: Item; hue: string; check: React.ReactNode }> = ({ item, hue, check }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: ROW_W, height: ROW_H, display: 'flex', alignItems: 'center', gap: 22, padding: '0 24px', boxSizing: 'border-box' }}>
    {check}
    <span style={{ ...type(32, 600), color: L.ink, whiteSpace: 'nowrap', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</span>
    <Avatar s={item.who} c={hue} size={40} />
  </div>
);

// card-form content (laid out at the card's final size, clipped by the outer frame in flight)
const CardContent: React.FC<{ item: Item; hue: string }> = ({ item, hue }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: CARD_W, height: CARD_H, padding: '26px 30px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Tag s={item.tag} />
      <span style={{ marginLeft: 'auto', ...type(20, 500), color: L.ink3 }}>{item.meta}</span>
    </div>
    <div style={{ marginTop: 18, fontFamily: SERIF, fontSize: 38, fontWeight: 600, lineHeight: 1.04, letterSpacing: '-0.02em', color: L.ink }}>{item.title}</div>
    <div style={{ marginTop: 12, ...type(24, 450), lineHeight: 1.3, color: L.ink2 }}>{item.quote}</div>
    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
      <Avatar s={item.who} c={hue} size={36} />
      <span style={{ ...type(22, 560), color: L.ink2 }}>{item.name}</span>
    </div>
  </div>
);

const Cursor: React.FC<{ frame: number }> = ({ frame }) => {
  // cursor path: enter frame → three checkboxes → button; swift easing between segments + light arc, a small shrink on click
  const cb = (slot: number) => ({ x: ROW_X + 24 + 18 + 6, y: rowY(slot) + ROW_H / 2 + 6 });
  const btn = { x: PANEL_X + PANEL_W / 2 + 190, y: PANEL_Y + PANEL_H - 70 };
  const keys = [
    { f: 4, ...{ x: 860, y: 760 } },
    { f: CHECK_AT[0] - 1, ...cb(SLOTS[0]) },
    { f: CHECK_AT[1] - 1, ...cb(SLOTS[1]) },
    { f: CHECK_AT[2] - 1, ...cb(SLOTS[2]) },
    { f: PRESS - 2, ...btn },
  ];
  let x = keys[0].x, y = keys[0].y;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    const p = ramp(frame, a.f + 1, b.f - a.f - 1, EASE.swift);
    if (frame >= a.f) {
      x = mix(a.x, b.x, p);
      y = mix(a.y, b.y, p) - Math.sin(Math.PI * p) * 26;
    }
  }
  const clicks = [...CHECK_AT, PRESS];
  let press = 1;
  for (const c of clicks) if (frame >= c - 1 && frame < c + 6) press = Math.min(press, 1 - 0.16 * Math.sin((Math.PI * (frame - c + 1)) / 7));
  const show = ramp(frame, 3, 8, EASE.out) * (1 - ramp(frame, PRESS + 26, 10, EASE.out));
  return (
    <svg width={44} height={48} viewBox="0 0 20 22" style={{
      position: 'absolute', left: x, top: y, transform: `scale(${press.toFixed(3)})`, transformOrigin: '4px 2px', opacity: show,
      filter: `drop-shadow(0 3px 4px ${alpha(L.shadow, 0.3)})`,
    }}>
      <path d="M2 1 L2 17 L6.5 13.2 L9.4 20 L12.4 18.7 L9.5 12 L15 11.6 Z" fill={L.ink} stroke="#fff8f0" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
};

export const PanelToCanvasMaterialize: React.FC = () => {
  const frame = useCurrentFrame();

  const panelIn = ramp(frame, 0, 18, EASE.snappy);
  const checkedCount = CHECK_AT.filter((c) => frame >= c).length;
  const btnPress = frame < PRESS ? 0 : ramp(frame, PRESS, 3, EASE.out) * (1 - ramp(frame, PRESS + 3, 9, EASE.out));
  const btnReady = ramp(frame, CHECK_AT[0], 8, EASE.out);
  const landed = (k: number) => flyU(frame, k) > 0.96;
  const doneCount = [0, 1, 2].filter((k) => frame >= LIFT_AT[k] + LIFT + 30).length;

  // camera: after takeoff a very slow move left + push in, following the content toward the canvas
  const camP = ramp(frame, LIFT_AT[0], 94, EASE.smooth);
  const camS = 1 + 0.025 * camP;

  return (
    <AbsoluteFill style={{ background: L.bg[1], overflow: 'hidden', fontFamily: FONT.sans }}>
      <Stage look={L} keyLight={{ x: 0.3, y: 0.1 }} fill={{ x: 0.9, y: 0.9 }}>
        {/* canvas dot grid (board area) */}
        <AbsoluteFill style={{
          backgroundImage: `radial-gradient(${alpha(L.ink, 0.13)} 1.5px, transparent 1.8px)`,
          backgroundSize: '38px 38px', backgroundPosition: '10px 14px',
          WebkitMaskImage: 'radial-gradient(ellipse 46% 60% at 30% 56%, #000 30%, transparent 100%)',
          maskImage: 'radial-gradient(ellipse 46% 60% at 30% 56%, #000 30%, transparent 100%)',
        }} />
      </Stage>

      <AbsoluteFill style={{ transform: `scale(${camS.toFixed(4)})`, transformOrigin: '52% 50%' }}>
        {/* ── board header ── */}
        <div style={{ position: 'absolute', left: 120, top: 92 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: ramp(frame, 2, 12, EASE.out) }}>
            <ShortKitMark size={34} tone="light" />
            <span style={{ ...type(26, 680), letterSpacing: '0.01em', color: L.ink }}>{BRAND.name}</span>
            <span style={{ ...type(22, 650, { caps: true }), letterSpacing: '0.2em', color: ACC }}>· Storyboard</span>
          </div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 26 }}>
            <TextReveal text="Launch film" by="word" variant="rise" start={4} each={18} gap={5}
              style={{ fontFamily: SERIF, fontSize: 84, fontWeight: 600, letterSpacing: '-0.03em', color: L.ink, lineHeight: 1 }} />
            <div style={{ height: 44, overflow: 'hidden' }}>
              <div style={{
                ...type(32, 500), color: L.ink2, whiteSpace: 'nowrap',
                transform: `translateY(${((1 - ramp(frame, LIFT_AT[0] + LIFT + 30, 14, EASE.snappy)) * 110).toFixed(1)}%)`,
              }}>
                <span style={{ color: ACC, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{Math.max(1, doneCount)}</span> shot{doneCount === 1 ? '' : 's'} pinned
              </div>
            </div>
          </div>
        </div>

        {/* ── right panel ── */}
        <div style={{
          position: 'absolute', left: PANEL_X, top: PANEL_Y, width: PANEL_W, height: PANEL_H, boxSizing: 'border-box',
          borderRadius: 30, background: `linear-gradient(180deg, ${L.surface}, #f7f0e6)`,
          border: `1px solid ${L.line}`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.9), ${softShadow(30, { color: L.shadow, strength: 1.3 })}`,
          transform: `translateX(${((1 - panelIn) * 160).toFixed(2)}px)`, opacity: panelIn,
        }}>
          <div style={{ position: 'absolute', left: 32, top: 34, right: 32 }}>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ ...type(44, 700), color: L.ink }}>Shot recipes</span>
              <span style={{ marginLeft: 'auto', ...type(24, 500), color: L.ink3 }}>5 suggested</span>
            </div>
            <div style={{ marginTop: 14, ...type(26, 450), color: L.ink2 }}>Pick the shots for this cut.</div>
          </div>
          {/* button */}
          <div style={{
            position: 'absolute', left: 24, right: 24, bottom: 24, height: 92, borderRadius: 20,
            background: `linear-gradient(180deg, #2c241b, ${L.ink})`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), ${softShadow(10 - 6 * btnPress, { color: L.shadow, strength: 1.6 })}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
            opacity: 0.35 + 0.65 * btnReady, transform: `scale(${(1 - 0.04 * btnPress).toFixed(4)})`,
          }}>
            <span style={{ ...type(32, 620), color: '#fff8f0' }}>Add to board</span>
            <span style={{
              minWidth: 44, height: 44, borderRadius: 22, display: 'grid', placeItems: 'center', background: ACC,
              ...type(26, 700), color: '#fff8f0', transform: `scale(${(1 + 0.12 * Math.max(0, 1 - Math.min(...CHECK_AT.map((c) => Math.abs(frame - c - 2))) / 4)).toFixed(3)})`,
            }}>{checkedCount}</span>
          </div>
        </div>

        {/* ── panel rows (not yet flown away / collapsed into dashed blank) ── */}
        {ITEMS.map((item, slot) => {
          const k = SLOTS.indexOf(slot);
          const inP = ramp(frame, 6 + slot * 2.5, 16, EASE.snappy);
          const y = rowY(slot);
          const gone = k >= 0 && frame >= LIFT_AT[k] + LIFT;
          const ghost = k >= 0 ? ramp(frame, LIFT_AT[k] + LIFT + 4, 10, EASE.out) : 0;
          return (
            <div key={slot} style={{
              position: 'absolute', left: ROW_X, top: y, width: ROW_W, height: ROW_H,
              opacity: inP, transform: `translateX(${((1 - panelIn) * 160 + (1 - inP) * 40).toFixed(2)}px)`,
            }}>
              {k >= 0 && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 18, border: `2px dashed ${alpha(ACC, 0.45)}`, boxSizing: 'border-box',
                  background: alpha(ACC, 0.04), opacity: ghost, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                  ...type(24, 600), color: alpha(ACC, 0.85),
                }}>
                  <svg width={22} height={22} viewBox="0 0 18 18"><path d="M3.5 9.5 L7.3 13 L14.5 5" stroke={ACC} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  On board
                </div>
              )}
              {!gone && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 18, overflow: 'hidden',
                  background: k >= 0 && frame >= CHECK_AT[k] ? `linear-gradient(180deg, #fffaf3, ${L.surface})` : L.surface2,
                  border: `1px solid ${k >= 0 && frame >= CHECK_AT[k] ? alpha(ACC, 0.35) : L.line}`,
                  boxShadow: k >= 0 && frame >= CHECK_AT[k] ? `0 0 0 3px ${alpha(ACC, 0.08)}` : undefined,
                }}>
                  <RowContent item={item} hue={AV[slot % 4]} check={<CheckBox frame={frame} at={k >= 0 ? CHECK_AT[k] : null} />} />
                </div>
              )}
            </div>
          );
        })}

        {/* ── flying / settled cards ── */}
        {SLOTS.map((slot, k) => {
          const liftStart = LIFT_AT[k];
          if (frame < liftStart) return null;
          const item = ITEMS[slot];
          const pre = ramp(frame, liftStart, LIFT, EASE.out); // pull-up wind-up
          const g = flyGeom(frame, k);
          const flying = frame >= liftStart + LIFT;
          // speed (px/frame) → directional blur
          const g0 = flyGeom(frame - 0.5, k), g1 = flyGeom(frame + 0.5, k);
          const vx = flying ? g1.cx - g0.cx : 0, vy = flying ? g1.cy - g0.cy : 0;
          // landing squash: when u first crosses near 1, give a 4f scaleY 0.97 rebound
          const landF = liftStart + LIFT + 22;
          const squash = 1 - 0.03 * Math.sin(Math.PI * Math.min(1, Math.max(0, (frame - landF) / 6)));
          const rowOp = 1 - ramp(g.us, 0.08, 0.32, EASE.linear);
          const cardOp = ramp(g.us, 0.5, 0.3, EASE.linear);
          const elev = flying ? 8 + 46 * g.arc + (landed(k) ? 0 : 6) : 4 + 10 * pre;
          const radius = mix(18, 24, Math.min(1, g.us));
          const w = flying ? g.w : ROW_W * (1 + 0.02 * pre);
          const h = flying ? g.h : ROW_H * (1 + 0.02 * pre);
          const cx = flying ? g.cx : ROW_X + ROW_W / 2;
          const cy = flying ? g.cy : rowY(slot) + ROW_H / 2;
          return (
            <SpeedBlur key={slot} vx={vx} vy={vy} amount={0.32} max={14}>
              <div style={{
                position: 'absolute', left: cx - w / 2, top: cy - h / 2, width: w, height: h,
                transform: `rotate(${(flying ? g.rot : 0).toFixed(3)}deg) scaleY(${squash.toFixed(4)})`, transformOrigin: '50% 100%',
                borderRadius: radius, overflow: 'hidden', boxSizing: 'border-box',
                background: `linear-gradient(180deg, #fffaf3, ${L.surface})`,
                border: `1px solid ${alpha(ACC, 0.35 * (1 - cardOp))}`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.95), ${softShadow(elev, { color: L.shadow, strength: 1.5 })}`,
              }}>
                {/* terracotta top line: the identity mark of the card form */}
                <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 6, background: ACC, opacity: cardOp }} />
                <div style={{ position: 'absolute', inset: 0, opacity: rowOp }}>
                  <RowContent item={item} hue={AV[slot % 4]} check={<CheckBox frame={frame} at={CHECK_AT[k]} />} />
                </div>
                <div style={{ position: 'absolute', inset: 0, opacity: cardOp }}>
                  <CardContent item={item} hue={AV[slot % 4]} />
                </div>
              </div>
            </SpeedBlur>
          );
        })}

        <Cursor frame={frame} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
