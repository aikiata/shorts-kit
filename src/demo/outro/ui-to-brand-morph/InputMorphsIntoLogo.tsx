// input-morphs-into-logo: slack-promo 40–41s · B-style input-morph-assemble
//
// Second-round redesign ("wordmark construction drawing" · Swiss grid, bright field):
// - look = custom "signal": a cool paper-white base with a hint of gray-green + a faint 12-column grid (the constructed feel of Swiss graphic design),
//   ink black + cobalt blue #2446ff + a touch of amber. Brand round: the end logo = the shorts-kit "Jingke" mark (open viewfinder + amber bevel).
// - The hero is an oversized message input box designed for the camera (1040×132, 44px text, cobalt focus ring + round send button), above it are
//   the channel name and the two most recent messages (34px, exit on send).
//   Click send → the text flies out with acceleration → the input box's x/y/w/h/r (five values) shrink on one spring into the vertical stroke of the viewfinder (the horizontal bar squeezes straight into a vertical bar,
//   rounded corners tighten to square, no other animation layered midway), after sending the mark's ink floods outward in a circle from the send button to fill the input box (solid color throughout).
// - Three primitives fall in from off-screen one after another to assemble the vertical stroke into the "Jingke" mark: top bar (ink) → bottom bar (ink) → amber bevel. 10f before each one falls,
//   a blue dashed construction outline is drawn around its target slot (Q9: the landing spot is the real slot); after landing it stretches / squashes by speed (origin pinned at the bottom), then the construction line fades out.
//   Primitives carry a drop shadow in the air and go flat once settled (the mark itself has no drop shadow).
// - After assembly the mark shifts left to make room and scales to 0.7 (to make room for the 15-character wordmark; mark height ≈ 2.1x the font size),
//   "shorts-kit" rises letter by letter from below the baseline, the tagline rises word by word; the construction grid exits, leaving a clean poster.
//
// Timeline (30fps, 168f total):
//   0–20    cursor slides from bottom right to the send button (frame 0 already shows channel context, input box and cursor), caret blinks
//   20      click: send button compresses + white flash 6f
//   21–32   text ease-in accelerates flying to the upper right + rotation + ghost trail
//   28–40   ink floods outward in a circle from the send button to fill the input box
//   30–60   morph: spring(damping 15, stiffness 95) input box → viewfinder vertical stroke
//   58–76   drop ① top bar (construction outline starts drawing at 48)
//   72–90   drop ② bottom bar
//   86–104  drop ③ amber bevel
//   108–128 mark shifts left to make room + scales to 0.7; construction grid fades out
//   114–140 shorts-kit rises letter by letter, tagline rises word by word
//   140–168 poster hold (camera pushes in very slowly by 2%)
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, FONT, bezier, mix, ramp } from '../../../shared/fixtures/Polish';
import { LOOKS, Stage, TextReveal, alpha, springAt, type, type Look } from '../../../shared/fixtures/Look';
import { BRAND, MARK_PATHS, PITCH } from '../../../shared/fixtures/Brand';

export const INPUT_MORPHS_INTO_LOGO_DURATION = 168;

const L: Look = {
  ...LOOKS.porcelain,
  bg: ['#f5f6f2', '#eeefe9', '#e3e5de'],
  light: '#ffffff',
  surface: '#ffffff',
  ink: '#10121a',
  ink2: '#545966',
  ink3: '#9a9ea6',
  accent: '#2446ff',
  accent2: '#ffb21f',
  shadow: '#1a2030',
};
const COBALT = '#2446ff';
const MARK_INK = BRAND.ink; // Mark viewfinder (ink version on the bright background)
const MARK_CUT = BRAND.amber; // Bevel: brand amber, color not swapped

// -- Keyframes
const CLICK = 20;
const FLY = 21;
const MORPH = 30;
const DROPS = [58, 72, 86];
const SHIFT = 108;
const WORD = 114;

// Mark local geometry (relative to the mark center, px): the "Jingke" mark has viewBox 128; the viewfinder vertical stroke = the vertical bar the input box shrinks into,
// the top bar / bottom bar / bevel fall in and assemble. U = pixels per viewBox unit (vertical stroke height 96 units = 330px).
const U = 330 / 96;
const MY = 492;
const MX0 = 960; // Mark is centered during assembly
const END_S = 0.7; // During the shift to make room, the mark scales to 0.7
const SHIFT_DX = -466; // After the shift, the whole lockup is centered (coupled to the wordmark start and font size 110)
const STEM = { x: (29 - 64) * U, y: 0, w: 26 * U, h: 96 * U };
// Horizontal bars take the full width (x 16..112, covering both ends of the vertical stroke, same color overlap): no antialiasing hairlines / steps at the seams
type Piece = { x: number; y: number; w: number; h: number; color: string; cut?: boolean };
const PIECES: Piece[] = [
  { x: 0, y: (29 - 64) * U, w: 96 * U, h: 26 * U, color: MARK_INK }, // Top bar
  { x: 0, y: (99 - 64) * U, w: 96 * U, h: 26 * U, color: MARK_INK }, // Bottom bar
  { x: (88 - 64) * U, y: (66 - 64) * U, w: 64 * U, h: 36 * U, color: MARK_CUT, cut: true }, // Bevel (bounding box 56..120 × 48..84)
];
// The two most recent messages in the channel (context)
const THREAD = [
  { n: 'Maya', t: '8:52', m: 'Storyboard is locked: twelve shots.', c: '#1f7a5c' },
  { n: 'Theo', t: '8:55', m: 'Crash zoom lands right on the beat.', c: '#c2410c' },
];
// Initial input box geometry (screen coordinates, center)
const BOX = { x: 960, y: 690, w: 1040, h: 132, r: 34 };

// Free fall: spring from above the screen to the slot; stretches vertically by speed, squashes on rebound
const DROP_H = 760;
const dropAt = (f: number, i: number) => (f < DROPS[i] ? 0 : springAt(f, DROPS[i], { damping: 13, stiffness: 120, mass: 0.9 }));

// Dashed construction outline (target slot expanded by 10px): drawn along the outline → fades out once settled. Two kinds: rectangle / bevel parallelogram (45° edge).
const guidePoints = (p: Piece, cx: number, cy: number, k: number) => {
  const d = 10;
  if (!p.cut) {
    const w = (p.w * k) / 2 + d;
    const h = (p.h * k) / 2 + d;
    return [[cx - w, cy - h], [cx + w, cy - h], [cx + w, cy + h], [cx - w, cy + h]];
  }
  // Bevel vertices (92,48)(120,48)(84,84)(56,84), origin at the bounding box center (88,66); when the 45° edge expands by d, horizontal shift is d·√2
  const u = U * k;
  const r2 = Math.SQRT2;
  return [
    [(92 - 88) * u + d * (1 - r2), (48 - 66) * u - d],
    [(120 - 88) * u + d * (1 + r2), (48 - 66) * u - d],
    [(84 - 88) * u + d * (r2 - 1), (84 - 66) * u + d],
    [(56 - 88) * u - d * (1 + r2), (84 - 66) * u + d],
  ].map(([x, y]) => [cx + x, cy + y]);
};
const Guide: React.FC<{ f: number; i: number; pts: number[][] }> = ({ f, i, pts }) => {
  const draw = ramp(f, DROPS[i] - 10, 12, EASE.out);
  const fade = 1 - ramp(f, DROPS[i] + 14, 10, EASE.out);
  const a = draw > 0 ? Math.min(draw * 2, 1) * fade : 0;
  if (a <= 0.001) return null;
  const d = `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`;
  const cx = pts.reduce((s, q) => s + q[0], 0) / pts.length;
  const cy = pts.reduce((s, q) => s + q[1], 0) / pts.length;
  const mid = `guide-draw-${i}`;
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible', opacity: a }}>
      <defs>
        <mask id={mid} maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
          <path d={d} fill="none" stroke="#fff" strokeWidth={8} pathLength={1} strokeDasharray={`${draw.toFixed(4)} 1`} />
        </mask>
      </defs>
      <path d={d} fill="none" stroke={COBALT} strokeWidth={2} strokeDasharray="10 8" opacity={0.75} mask={`url(#${mid})`} />
      <line x1={cx - 12} y1={cy} x2={cx + 12} y2={cy} stroke={COBALT} strokeWidth={1.5} opacity={0.7} />
      <line x1={cx} y1={cy - 12} x2={cx} y2={cy + 12} stroke={COBALT} strokeWidth={1.5} opacity={0.7} />
    </svg>
  );
};

export const InputMorphsIntoLogo: React.FC = () => {
  const f = useCurrentFrame();

  // -- Cursor
  const curT = ramp(f, 0, CLICK - 2, EASE.swift);
  const sendX = BOX.x + BOX.w / 2 - 24 - 42;
  const cursorX = mix(1560, sendX + 6, curT);
  const cursorY = mix(940, BOX.y + 8, ramp(f, 0, CLICK - 2, bezier(0.25, 0.6, 0.3, 1)));
  const press = f >= CLICK && f <= CLICK + 4 ? 0.84 : 1;
  const cursorOp = 1 - ramp(f, FLY + 2, 8, EASE.out);
  const flash = f >= CLICK && f <= CLICK + 5 ? 1 - (f - CLICK) / 6 : 0;

  // -- Text flies out (accelerating)
  const flyT = ramp(f, FLY, 11, bezier(0.5, 0, 0.9, 0.55));

  // -- morph: five values on one spring
  const m = f < MORPH ? 0 : springAt(f, MORPH, { damping: 15, stiffness: 95, mass: 1 });
  const flood = ramp(f, 28, 12, EASE.snappy); // Blue floods outward from the send button
  const fill = flood;
  const flat = 1 - Math.min(1, m); // The input box's shadow retracts with the morph: the settled mark is flat
  // After assembly (start of the shift, all three pieces settled), swap the vertical stroke + top and bottom bars for one complete viewfinder path:
  // antialiased edges of stacked same-color blocks add up, leaving a 1px step at the seams; with the same geometry as a single path the edges are clean
  const assembled = f >= SHIFT;
  const shift = ramp(f, SHIFT, 20, EASE.swift);
  const MX = MX0 + SHIFT_DX * shift;
  const S = mix(1, END_S, shift); // Overall mark scale (shrinks when making room)
  const bx = mix(BOX.x, MX + STEM.x * S, m);
  const by = mix(BOX.y, MY + STEM.y * S, m);
  const bw = mix(BOX.w, STEM.w * S, m);
  const bh = mix(BOX.h, STEM.h * S, m);
  const br = Math.max(0, mix(BOX.r, 0, Math.min(1, m))); // Rounded corners tighten into the viewfinder's square corners
  // Morph speed → slight ghost trail in the shrink direction (fast segment only)
  const mPrev = f - 1 < MORPH ? 0 : springAt(f - 1, MORPH, { damping: 15, stiffness: 95, mass: 1 });
  const mBlur = Math.min(3, Math.abs(m - mPrev) * 30);

  // Input box UI elements (exit as early as possible with the morph, no animation layered midway)
  const uiOut = Math.min(1, m * 3);

  // Construction grid & crosshair: appear during assembly, exit during the shift
  const gridA = 0.55 * ramp(f, MORPH + 10, 20, EASE.out) * (1 - ramp(f, SHIFT, 18, EASE.out)) + 0.25;
  const constrA = ramp(f, DROPS[0] - 14, 16, EASE.out) * (1 - ramp(f, SHIFT - 4, 16, EASE.out));

  // The whole group pushes in very slowly after settling
  const push = 1 + 0.02 * ramp(f, 124, 44, EASE.smooth);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: FONT.sans }}>
      <Stage look={L} keyLight={{ x: 0.42, y: 0.2 }} fill={{ x: 0.9, y: 0.95 }} grain={0.05} vignette={0.2}>
        {/* 12-column faint grid + baseline: Swiss-style construction base */}
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: gridA }}>
          {Array.from({ length: 13 }, (_, i) => (
            <line key={i} x1={96 + i * 144} y1={0} x2={96 + i * 144} y2={1080} stroke={alpha(L.ink, 0.06)} strokeWidth={1} />
          ))}
          {[180, 492, 804].map((y) => <line key={y} x1={0} y1={y} x2={1920} y2={y} stroke={alpha(L.ink, 0.05)} strokeWidth={1} />)}
        </svg>
      </Stage>

      <div style={{ position: 'absolute', inset: 0, transform: `scale(${push.toFixed(5)})`, transformOrigin: '960px 540px' }}>
        {/* Construction crosshair: through the mark center and the bowl center */}
        {constrA > 0.001 && (
          <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: constrA }}>
            <line x1={0} y1={MY + PIECES[0].y * S} x2={1920} y2={MY + PIECES[0].y * S} stroke={alpha(COBALT, 0.28)} strokeWidth={1.2} />
            <line x1={MX + PIECES[2].x * S} y1={0} x2={MX + PIECES[2].x * S} y2={1080} stroke={alpha(COBALT, 0.28)} strokeWidth={1.2} />
            <line x1={MX + (STEM.x - STEM.w / 2) * S} y1={0} x2={MX + (STEM.x - STEM.w / 2) * S} y2={1080} stroke={alpha(COBALT, 0.18)} strokeWidth={1.2} strokeDasharray="6 8" />
            <line x1={0} y1={MY + (STEM.h / 2) * S} x2={1920} y2={MY + (STEM.h / 2) * S} stroke={alpha(COBALT, 0.18)} strokeWidth={1.2} strokeDasharray="6 8" />
          </svg>
        )}

        {/* Channel context: channel name + two recent messages (exit on send, giving "the input box you use every day" a real context) */}
        <div style={{
          position: 'absolute', left: BOX.x - BOX.w / 2 + 8, top: BOX.y - BOX.h / 2 - 410, width: BOX.w - 16,
          opacity: 1 - ramp(f, FLY + 1, 10, EASE.out), transform: `translateY(${(-24 * ramp(f, FLY + 1, 10, EASE.exit)).toFixed(2)}px)`,
          filter: f > FLY + 1 ? `blur(${(6 * ramp(f, FLY + 1, 10, EASE.linear)).toFixed(2)}px)` : undefined,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, ...type(34, 650), color: L.ink, paddingBottom: 22, borderBottom: `1px solid ${alpha(L.ink, 0.08)}` }}>
            <span style={{ color: COBALT, fontWeight: 800 }}>#</span>launch-film
            <span style={{ ...type(26, 500), color: L.ink3, marginLeft: 'auto' }}>12 members</span>
          </div>
          {THREAD.map((msg, i) => (
            <div key={i} style={{ display: 'flex', gap: 22, marginTop: 30, opacity: i === 0 ? 0.55 : 1 }}>
              <div style={{ width: 60, height: 60, borderRadius: 18, background: msg.c, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', ...type(24, 700), color: '#fff' }}>{msg.n[0]}</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                  <span style={{ ...type(30, 700), color: L.ink }}>{msg.n}</span>
                  <span style={{ ...type(24, 500), color: L.ink3 }}>{msg.t}</span>
                </div>
                <div style={{ ...type(34, 450), color: L.ink2, marginTop: 6 }}>{msg.m}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main body: input box → viewfinder vertical stroke */}
        {!assembled && <div style={{
          position: 'absolute', left: bx - bw / 2, top: by - bh / 2, width: bw, height: bh, borderRadius: br,
          boxSizing: 'border-box', overflow: 'hidden',
          background: flood >= 1 ? MARK_INK : '#ffffff', // After flooding the base color also switches to ink: the vertical stroke edge has no white fringe and joins the horizontal bars with no hairline seam
          boxShadow: `0 0 0 ${(3 * (1 - fill)).toFixed(2)}px ${alpha(COBALT, 0.9 * (1 - fill))}, 0 0 0 ${(9 * (1 - fill)).toFixed(2)}px ${alpha(COBALT, 0.12 * (1 - fill))}, ` +
            `0 2px 4px ${alpha(L.shadow, 0.06 * flat)}, 0 ${mix(24, 18, m).toFixed(1)}px ${mix(50, 36, m).toFixed(1)}px -18px ${alpha(L.shadow, 0.3 * flat)}`,
          filter: mBlur > 0.3 ? `blur(${mBlur.toFixed(2)}px)` : undefined,
        }}>
          {/* Solid mark ink: floods outward in a circle from the send button (send = filling the input box into the mark's vertical stroke), solid color throughout, no semi-transparent intermediate state;
              after flooding, the base color takes over (stacking another layer of the same color would deepen the antialiased edge) */}
          {flood < 1 && <div style={{
            position: 'absolute', inset: 0,
            clipPath: flood >= 1 ? undefined : `circle(${(flood * Math.hypot(bw, bh)).toFixed(1)}px at ${(bw - 66 * (1 - m)).toFixed(1)}px ${(bh / 2).toFixed(1)}px)`,
            background: MARK_INK,
          }} />}
          {/* Tool icons (texture level, exit with the morph) */}
          <div style={{ position: 'absolute', right: 132, top: 0, height: BOX.h, display: 'flex', alignItems: 'center', gap: 22, opacity: 1 - uiOut }}>
            {['M12 5v14M5 12h14', 'M8 9h.01M16 9h.01M8 15q4 3 8 0'].map((d, i) => (
              <svg key={i} width={34} height={34} viewBox="0 0 24 24" fill="none" stroke={L.ink3} strokeWidth={2} strokeLinecap="round">
                {i === 1 && <circle cx={12} cy={12} r={9} />}
                <path d={d} />
              </svg>
            ))}
          </div>
          {/* Send button */}
          <div style={{
            position: 'absolute', right: 24, top: (BOX.h - 84) / 2, width: 84, height: 84, borderRadius: 42,
            background: flash > 0 ? `rgb(${Math.round(mix(36, 140, flash))},${Math.round(mix(70, 160, flash))},255)` : COBALT,
            boxShadow: `0 6px 16px -6px ${alpha(COBALT, 0.7)}, inset 0 1.5px 0 rgba(255,255,255,0.3)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: `scale(${press})`, opacity: 1 - uiOut,
          }}>
            <svg width={38} height={38} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" />
            </svg>
          </div>
        </div>}

        {/* Text (rendered outside the input box: not clipped by the input box's rounded corners when flying out) */}
        <div style={{
          position: 'absolute', left: BOX.x - BOX.w / 2 + 44, top: BOX.y - BOX.h / 2, height: BOX.h, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap',
          ...type(44, 450), color: L.ink, opacity: (1 - flyT) * (1 - uiOut),
          transform: `translate(${(flyT * 760).toFixed(1)}px, ${(-flyT * 420).toFixed(1)}px) rotate(${(-flyT * 9).toFixed(2)}deg)`,
          filter: flyT > 0.15 ? `blur(${(flyT * 6).toFixed(2)}px)` : undefined,
        }}>
          Render the launch film. Ship it.
          <span style={{ display: 'inline-block', width: 3, height: 50, marginLeft: 6, background: COBALT, opacity: f < FLY && Math.floor(f / 8) % 2 === 0 ? 1 : 0 }} />
        </div>

        {/* Dashed construction outline (target slot) */}
        {PIECES.map((p, i) => <Guide key={i} f={f} i={i} pts={guidePoints(p, MX + p.x * S, MY + p.y * S, S)} />)}

        {/* Three primitives fall in (shadow in the air, flat once settled) */}
        {assembled && (
          <svg width={128 * U * S} height={128 * U * S} viewBox="0 0 128 128"
            style={{ position: 'absolute', left: MX - 64 * U * S, top: MY - 64 * U * S, overflow: 'visible' }}>
            <path d={MARK_PATHS.frame} fill={MARK_INK} />
          </svg>
        )}
        {PIECES.map((p, i) => {
          if (f < DROPS[i] || (assembled && !p.cut)) return null;
          const s = dropAt(f, i);
          const v = (s - dropAt(f - 1, i)) * DROP_H; // Pixels fallen per frame (negative on rebound)
          const k = Math.max(-1, Math.min(1, v / 70));
          const sy = 1 + 0.14 * k;
          const sx = 1 - 0.09 * k;
          const w = p.w * S;
          const h = p.h * S;
          const top = MY + p.y * S - h / 2 - (1 - s) * DROP_H;
          const air = Math.max(0, Math.min(1, (1 - s) * 3));
          const shadow = air > 0.01 ? `drop-shadow(0 ${(14 * air).toFixed(1)}px ${(16 * air).toFixed(1)}px ${alpha('#1a1a10', 0.35 * air)})` : '';
          const blur = Math.abs(v) > 14 ? `blur(${Math.min(3, Math.abs(v) * 0.03).toFixed(2)}px)` : '';
          return (
            <div key={i} style={{
              position: 'absolute', left: MX + p.x * S - w / 2, top, width: w, height: h,
              background: p.cut ? undefined : p.color,
              transform: `scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`, transformOrigin: '50% 100%',
              filter: [blur, shadow].filter(Boolean).join(' ') || undefined,
            }}>
              {p.cut && (
                <svg width={w} height={h} viewBox="56 48 64 36" preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
                  <path d="M92 48h28L84 84H56l36-36Z" fill={p.color} />
                </svg>
              )}
            </div>
          );
        })}

        {/* Wordmark + tagline */}
        {/* Wordmark start = visible right edge of the viewfinder (bevel tip x=120) + 60px, follows the mark position / scale */}
        <div style={{
          position: 'absolute', left: MX + (120 - 64) * U * S + 60, top: MY - 4, transform: 'translateY(-50%)',
          fontFamily: BRAND.font, fontSize: 110, fontWeight: 700, lineHeight: 1, letterSpacing: '0.03em', color: MARK_INK, whiteSpace: 'nowrap',
        }}>
          <TextReveal text={BRAND.name} by="char" variant="rise" start={WORD} each={16} gap={1.5} ease={EASE.snappy} />
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: MY + 190, textAlign: 'center', ...type(46, 450), color: L.ink2 }}>
          <TextReveal text={PITCH.en.taglines[0]} by="word" variant="rise" start={WORD + 16} each={16} gap={3} ease={EASE.out} />
        </div>
      </div>

      {/* Cursor */}
      {cursorOp > 0.001 && (
        <svg width={40} height={46} viewBox="0 0 40 44" style={{
          position: 'absolute', left: cursorX, top: cursorY, opacity: cursorOp, transform: `scale(${press})`, transformOrigin: '4px 2px',
          filter: `drop-shadow(0 4px 8px ${alpha(L.shadow, 0.3)})`,
        }}>
          <path d="M4 2 L4 34 L13 26 L19 40 L26 37 L20 23 L32 22 Z" fill={L.ink} stroke="#ffffff" strokeWidth={2.2} strokeLinejoin="round" />
        </svg>
      )}
    </AbsoluteFill>
  );
};
