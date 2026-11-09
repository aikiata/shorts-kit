// neon-triple-marquee: three-row counter-moving neon marquee recap (technique from clickup-30 61–64.5s)
//
// Second-round redesign (a wall of signs at night · angled shot + wet floor reflection):
// - look = custom "neon": blue-black brick wall + three tube colors (ice cyan / magenta / sodium amber). No longer flat colored outline text,
//   but a real neon sign wall: the camera is angled (wall rotateY −17°→−9°, a very slow push-in, perspective gives the word stream depth),
//   below the wall is a wet floor, and the lit row casts a reflection and a pool of colored light on the ground.
// - Tubes in three layers: dark glass tube (same color, low brightness, always on, so the three-row structure is always there) → energized colored tube body + two-layer glow → near-white hot core;
//   the lit row's light also spills onto the brick wall behind it (the mortar is lit up): this makes it "lights on a wall" rather than "text on a screen".
// - The font is switched to a bold condensed face (Avenir Next Condensed Heavy), the triple words FRAME / CRAFT / SHIP (shorts-kit's
//   "frame → craft the shot → ship", taken from the brand tagline Frame motion. Craft the shot., used for the recap);
//   word spacing is laid out by canvas-measured width, separators are hollow diamonds ◇.
// - Round-robin: period 42f, phase offset 14f, one lit and two dark; each lighting starts with 2 frames of ignition flicker (real neon striking), then a cosine soft envelope.
//   At the opening the three rows ignite and power up in turn at 0/5/10f; from 124f at the end the rows "cut power" one by one from top to bottom (flicker twice then go out),
//   landing on a lights-out poster with only the dark glass tubes left (the wall still visible), no fade to dead black.
//
// Timeline (30fps, 150f total):
//   0–18     power up: the three rows ignite and flicker in turn (starting at 0/5/10f), dark glass tubes light up
//   18–124   round-robin: 42f period, 14f phase offset, odd and even rows scroll in opposite directions at constant speed (marquee exempt from linear)
//   124–142  power cut: from top to bottom each row staggered 6f flickers twice and goes out
//   142–150  lights-out hold: dark tubes + residual wall light
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, Grain, Vignette, ramp, mix } from '../../../shared/fixtures/Polish';
import { alpha } from '../../../shared/fixtures/Look';

export const NEON_TRIPLE_MARQUEE_DURATION = 150;

const FONT = '"Avenir Next Condensed", "DIN Condensed", "Arial Narrow", Impact, sans-serif';
const WEIGHT = 800;
const SIZE = 286;
const GAP = SIZE * 0.36;
const PLANE_W = 2900; // Wall width (no exposed edges on either side in the perspective angled shot)
const FLOOR_Y = 900; // Wall foot / ground line (wall coordinates)
const ROW_Y = [28, 318, 608];

const WALL = '#0a0b14';
// Brick wall texture: two rows of staggered bricks (small SVG tile), mortar very faint, only visible when lit
const BRICK = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='300' height='120'>" +
  "<rect width='300' height='120' fill='none'/>" +
  "<g stroke='rgba(255,255,255,0.04)' stroke-width='3'>" +
  "<line x1='0' y1='1.5' x2='300' y2='1.5'/><line x1='0' y1='61.5' x2='300' y2='61.5'/>" +
  "<line x1='1.5' y1='0' x2='1.5' y2='60'/><line x1='151.5' y1='0' x2='151.5' y2='60'/>" +
  "<line x1='76.5' y1='60' x2='76.5' y2='120'/><line x1='226.5' y1='60' x2='226.5' y2='120'/></g></svg>",
)}")`;

// Measured text width (same font and size, deterministic); falls back to an estimated width when there is no DOM
const widthCache = new Map<string, number>();
const measure = (text: string) => {
  const hit = widthCache.get(text);
  if (hit !== undefined) return hit;
  let w = text.length * SIZE * 0.6;
  if (typeof document !== 'undefined') {
    const ctx = document.createElement('canvas').getContext('2d');
    if (ctx) {
      ctx.font = `${WEIGHT} ${SIZE}px ${FONT}`;
      w = ctx.measureText(text).width + text.length * SIZE * 0.02; // letterSpacing 0.02em
    }
  }
  widthCache.set(text, w);
  return w;
};

type Row = { word: string; color: string; core: string; dir: 1 | -1; speed: number };
const ROWS: Row[] = [
  { word: 'FRAME', color: '#38d9ff', core: '#e9fbff', dir: 1, speed: 9 },
  { word: 'CRAFT', color: '#ff3d9a', core: '#ffe6f3', dir: -1, speed: 11 },
  { word: 'SHIP', color: '#ffae34', core: '#fff3dc', dir: 1, speed: 9 },
];

// Ignition flicker sequence (deterministic): 0/1 gate, constant 1 after 6 frames
const IGNITE = [0, 1, 0.15, 0, 0.9, 0.6];
const ignite = (f: number, at: number) => {
  const k = Math.floor(f - at);
  if (k < 0) return 0;
  return k < IGNITE.length ? IGNITE[k] : 1;
};
// Power-cut sequence: flicker twice then go out
const KILL = [1, 0.2, 0.85, 0.1, 0.5, 0];
const kill = (f: number, at: number) => {
  const k = Math.floor(f - at);
  if (k < 0) return 1;
  return k < KILL.length ? KILL[k] : 0;
};

const PERIOD = 42;
const SLOT = PERIOD / 3; // 14f per row
// Round-robin brightness: each row lights up in its own 14f slot: first 2 frames striking flicker, 3f ramp to full, plateau, last 4f ease-in fade out overlapping with the next row
// by 2f for the handoff (at any moment one row is lit, so "one lit, two dark" never leaves an all-dark empty beat)
const pulse = (f: number, i: number) => {
  if (f < 18) return 0;
  const ph = ((((f - 18) - i * SLOT) % PERIOD) + PERIOD) % PERIOD;
  const len = SLOT + 2;
  if (ph >= len) return 0;
  const fl = ph < 1 ? 0.6 : ph < 2 ? 0.25 : 1; // Striking
  const up = ramp(ph, 1, 3, EASE.out);
  const down = 1 - ramp(ph, len - 5, 5, EASE.exit);
  return Math.max(up * down, 0) * fl;
};

const MarqueeRow: React.FC<{ row: Row; f: number; y: number; lit: number; glass: number; cheap?: boolean }> = ({ row, f, y, lit, glass, cheap }) => {
  const wordW = measure(row.word);
  const dotW = SIZE * 0.42;
  const unitW = wordW + GAP + dotW + GAP;
  const copies = Math.ceil(PLANE_W / unitW) + 3;
  const raw = (f * row.speed) % unitW;
  const offset = row.dir === 1 ? -unitW * 1.5 + raw : -unitW * 0.5 - raw;
  const base: React.CSSProperties = {
    position: 'absolute', top: y, left: 0, width: PLANE_W, height: SIZE * 1.05,
    transform: `translateX(${offset.toFixed(2)}px)`,
    fontFamily: FONT, fontWeight: WEIGHT, fontSize: SIZE, letterSpacing: '0.02em', lineHeight: 1, color: 'transparent',
  };
  // Separator: hollow diamond (border color / thickness same as the tube in the same layer, the text itself is only stroked, not filled)
  const text = (sep: string, bw: number) => Array.from({ length: copies }).map((_, i) => (
    <span key={i} style={{ position: 'absolute', left: i * unitW, top: 0, whiteSpace: 'nowrap' }}>
      {row.word}
      <span style={{
        position: 'absolute', left: wordW + GAP + dotW * 0.2, top: SIZE * 0.34, width: dotW * 0.6, height: dotW * 0.6,
        transform: 'rotate(45deg)', boxSizing: 'border-box', border: `${bw.toFixed(2)}px solid ${sep}`, borderRadius: 6,
      }} />
    </span>
  ));
  const tube = 6 + lit * 4;
  const core = 2 + lit * 1.8;
  return (
    <>
      {/* Dark glass tube: same color, low brightness, the three-row structure is always there */}
      <div style={{ ...base, WebkitTextStroke: `6px ${alpha(row.color, 0.3 * glass)}` }}>{text(alpha(row.color, 0.3 * glass), 6)}</div>
      {lit > 0.02 && (
        <>
          {/* Energized tube body + two-layer glow */}
          <div style={{
            ...base, WebkitTextStroke: `${tube.toFixed(2)}px ${row.color}`, opacity: Math.min(1, lit * 1.1),
            filter: cheap ? undefined : `drop-shadow(0 0 ${(3 + lit * 6).toFixed(1)}px ${row.color}) drop-shadow(0 0 ${(14 + lit * 22).toFixed(1)}px ${row.color}) drop-shadow(0 0 ${(40 + lit * 50).toFixed(1)}px ${alpha(row.color, 0.9)})`,
          }}>{text(row.color, tube)}</div>
          {/* Hot core: near-white thin line, lit only when energized: the key to "neon" rather than "colored outline" */}
          <div style={{ ...base, WebkitTextStroke: `${core.toFixed(2)}px ${row.core}`, opacity: Math.min(1, lit * 1.3), filter: cheap ? undefined : `drop-shadow(0 0 2px ${alpha(row.core, 0.9)})` }}>
            {text(row.core, core)}
          </div>
        </>
      )}
    </>
  );
};

export const NeonTripleMarquee: React.FC = () => {
  const f = useCurrentFrame();

  // Per-row power: power-up ignition × power cut
  const power = ROWS.map((_, i) => ignite(f, i * 5) * kill(f, 124 + i * 6));
  // Dark glass: always on after power-up, still keeps 0.6 after power cut (lights-out poster: tubes visible)
  const glass = ROWS.map((_, i) => Math.max(ignite(f, i * 5), f >= 124 ? 1 : 0) * (1 - 0.25 * ramp(f, 124 + i * 6 + 4, 8, EASE.out)));
  // Brightness: at the opening power-up, all rows ignite and flash once (0.7) → round-robin
  const lit = ROWS.map((_, i) => {
    const boot = f < 18 ? 0.7 * ignite(f, i * 5) * (1 - ramp(f, 12, 6, EASE.out)) : 0;
    const killFlash = f >= 124 ? 0.55 * kill(f, 124 + i * 6) * (f < 124 + i * 6 ? 0 : 1) : 0;
    return Math.max(boot, pulse(f, i) * power[i], killFlash);
  });

  // Camera: wall angled shot, rotateY −17° → −9° very slow push-in (smooth), slight overall push
  const cam = ramp(f, 0, 150, EASE.smooth);
  const rotY = mix(-17, -9, cam);
  const scale = mix(1.0, 1.05, cam);

  return (
    <AbsoluteFill style={{ background: '#05050a', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, perspective: 1700, perspectiveOrigin: '50% 45%' }}>
        <div style={{
          position: 'absolute', left: (1920 - PLANE_W) / 2, top: 40, width: PLANE_W, height: 1200,
          transform: `rotateY(${rotY.toFixed(3)}deg) scale(${scale.toFixed(4)})`, transformOrigin: '50% 40%',
        }}>
          {/* Brick wall: base color + very faint mortar (only visible when lit) */}
          <div style={{
            position: 'absolute', left: 0, top: -40, width: PLANE_W, height: FLOOR_Y + 40, background: WALL,
            backgroundImage: BRICK, backgroundSize: '300px 120px',
          }} />
          {/* Wall spill light: a same-color soft light band behind each row, breathes with brightness (screen blended over the brick wall) */}
          {ROWS.map((r, i) => (
            <div key={`spill${i}`} style={{
              position: 'absolute', left: 0, right: 0, top: ROW_Y[i] - 200, height: SIZE + 400, mixBlendMode: 'screen',
              background: `radial-gradient(ellipse 50% 44% at 50% 50%, ${alpha(r.color, 0.6)} 0%, ${alpha(r.color, 0.12)} 45%, ${alpha(r.color, 0)} 72%)`,
              opacity: 0.05 * glass[i] + lit[i] * 0.55,
            }} />
          ))}
          {ROWS.map((r, i) => (
            <MarqueeRow key={r.word} row={r} f={f} y={ROW_Y[i]} lit={lit[i]} glass={glass[i]} />
          ))}
          {/* Wet floor: a dark reflective surface below the wall foot, the reflection takes only the bottom row (flipped, blurred, fading out) */}
          <div style={{ position: 'absolute', left: 0, top: FLOOR_Y, width: PLANE_W, height: 300, background: 'linear-gradient(180deg, #08080e 0%, #040407 100%)' }} />
          <div style={{
            position: 'absolute', left: 0, top: FLOOR_Y, width: PLANE_W, height: 300, overflow: 'hidden',
            WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 70%)',
            maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 70%)',
            filter: 'blur(3px)',
          }}>
            {/* Mirror: a point at y_w on the wall maps to below the ground at (FLOOR_Y − y_w); the inner layer is 600 tall, flipped about its own center → the row is placed at y_w − 300 */}
            <div style={{ position: 'absolute', left: 0, top: 0, width: PLANE_W, height: 600, transform: 'scaleY(-1)', transformOrigin: '50% 50%' }}>
              <MarqueeRow row={ROWS[2]} f={f} y={ROW_Y[2] - 300} lit={lit[2]} glass={glass[2]} cheap />
            </div>
          </div>
          {/* Floor light pool: each row's light lands on the ground (farther rows weaker) */}
          {ROWS.map((r, i) => (
            <div key={`pool${i}`} style={{
              position: 'absolute', left: 0, right: 0, top: FLOOR_Y - 40, height: 220, mixBlendMode: 'screen',
              background: `radial-gradient(ellipse 46% 40% at 50% 30%, ${alpha(r.color, 0.55)} 0%, ${alpha(r.color, 0)} 70%)`,
              opacity: lit[i] * [0.18, 0.28, 0.5][i],
            }} />
          ))}
          {/* Wall foot seam: a hairline highlight separating wall and floor */}
          <div style={{ position: 'absolute', left: 0, top: FLOOR_Y, width: PLANE_W, height: 2, background: 'rgba(255,255,255,0.06)' }} />
        </div>
      </div>
      <Vignette strength={0.62} inner={0.36} color="#020205" />
      <Grain opacity={0.08} blend="soft-light" />
    </AbsoluteFill>
  );
};
