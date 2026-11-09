// multiplane parallax (second redesign): a real page split into 3 depth layers panning sideways, one drive displacement multiplied by a per-layer coefficient
// (far 0.35x / mid 0.7x / near 1.4x); the speed gradient turns one pan into "gliding through space".
//
// Design decisions
// - look: sand (beige + terracotta, warm, paper feel). The real projects page is itself warm paper white, so it sits naturally in sand,
//   and the shot reads as a set of product still lifes on a warm desktop swept by a slider camera, not as a web page pan.
// - each of the three layers gets its own depth anchor:
//   far: the whole-page screenshot scaled down one step, defocused 5px, desaturated, with a warm air haze strong at the top and light at the bottom (recedes into the environment);
//   mid: 10 real project cards (440px, main reading layer, fully sharp, two layers of soft warm shadow falling on the "desktop");
//   near: 5 enlarged terracotta / ink tag capsules (taken from the real tags on the cards) sweep past the lens, depth-of-field blur + horizontal motion trail by speed.
// - Text fixed to the frame (0x layer): top-left eyebrow (shorts-kit logo + name) + 120px title "Your page, in depth." + subline, the still reference for the whole piece:
//   the text stays put while the world moves, so the parallax reads even better.
// - The slider has an end point: when the drive settles, card4 stops exactly at the center of the frame, then floats up (elevation 6→26, 1.035x) + terracotta outline +
//   an "In focus" badge, so the last frame is a complete poster.
//
// Timeline (30fps, 165f)
//   0–6     opening: all three layers already on screen, title starts rising word by word (frame 1 is not an empty frame)
//   6–136   slider 130f: asymmetric in-out (soft start, even middle, very soft landing), mid-layer total displacement 1020px
//   4–40    title: eyebrow tracking tightens (4) → title rises word by word (8) → subline (26)
//   122–144 hero floats up: card4 lift + outline + badge (out curve, ~8f after position converges)
//   144–164 hold 20f: far layer drifts very slowly 4px, the frame stays alive
import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import layout from '../../../shared/fixtures/live-layout.json';
import { EASE, SpeedBlur, bezier, mix, ramp, softShadow, velocity } from '../../../shared/fixtures/Polish';
import { LOOKS, Stage, TextReveal, alpha, type } from '../../../shared/fixtures/Look';
import { BRAND, ShortKitMark } from '../../../shared/fixtures/Brand';

export const MULTIPLANE_DUR = 165;

const L = LOOKS.sand;
const CARDS = layout.projects.cards;
const DRIVE_EASE = bezier(0.45, 0, 0.18, 1);
const HERO = 3; // card4
const MID_W = 440;
const GAP = 500; // mid-layer card pitch
const ROW_X = 260; // left edge of card 0 (mid-layer coordinates)
const ROW_Y = 410;
// total drive: when the mid layer (0.7x) settles, the center of card4 sits exactly at the screen center
const MID_END = 960 - (ROW_X + HERO * GAP + MID_W / 2);
const DRIVE = -MID_END / 0.7;
const driveAt = (f: number) => DRIVE * ramp(f, 6, 130, DRIVE_EASE) + 4 * ramp(f, 136, 29, EASE.smooth);

// near-layer capsules: tags are taken from the real tags on the cards; x is in near-layer coordinates, y in screen coordinates.
// At settle (near-layer displacement −2040) only the EdgeAI / ASR capsules remain, pressed against the lower frame edge as foreground framing; the rest have slid out of frame
const PILLS = [
  { t: 'Calibration', x: 1200, y: 880, tone: 'accent' },
  { t: 'Routing', x: 1640, y: 296, tone: 'ink' },
  { t: 'EdgeAI', x: 2600, y: 905, tone: 'paper' },
  { t: 'Benchmark', x: 4300, y: 300, tone: 'ink' },
  { t: 'ASR', x: 3720, y: 860, tone: 'accent' },
] as const;

export const MultiplaneReal: React.FC = () => {
  const frame = useCurrentFrame();
  const drive = driveAt(frame);
  const vFg = -1.4 * velocity(driveAt, frame); // near-layer screen velocity (px/frame)
  const lift = ramp(frame, 122, 22, EASE.out);
  const ring = ramp(frame, 128, 16, EASE.snappy);
  const kick = ramp(frame, 4, 20, EASE.snappy);
  const sub = ramp(frame, 26, 18, EASE.out);

  return (
    <AbsoluteFill style={{ background: L.bg[1], overflow: 'hidden' }}>
      <Stage look={L} keyLight={{ x: 0.3, y: 0.0 }} fill={{ x: 0.85, y: 1 }} grain={0.06}>
        {/* far 0.35x: whole page scaled down one step, defocused, desaturated (page blank matches the base color, so no edge shows when panning) */}
        <div style={{ position: 'absolute', left: 0, top: 0, transform: `translateX(${(-drive * 0.35).toFixed(2)}px)`, filter: 'blur(5px) saturate(0.7)', opacity: 0.75 }}>
          <Img src={staticFile('textures/live/projects-full.png')} style={{ position: 'absolute', left: -40, top: -170, width: 2100 }} />
        </div>
        {/* aerial perspective: a warm thin haze above the far layer, denser at the top */}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${alpha(L.bg[0], 0.82)} 0%, ${alpha(L.bg[1], 0.62)} 50%, ${alpha(L.bg[2], 0.55)} 100%)` }} />
        {/* desktop: the surface that carries the mid-layer card shadows, a very faint horizon light line */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: ROW_Y + 330, height: 340, background: `linear-gradient(180deg, ${alpha(L.shadow, 0)}, ${alpha(L.shadow, 0.06)} 40%, ${alpha(L.shadow, 0.02)})` }} />
      </Stage>

      {/* mid 0.7x: real card set in a row (main reading layer, no blur) */}
      <div style={{ position: 'absolute', left: 0, top: ROW_Y, transform: `translateX(${(-drive * 0.7).toFixed(2)}px)` }}>
        {CARDS.map((c, k) => {
          const hero = k === HERO;
          const h = (MID_W * c.h) / c.w;
          const e = hero ? mix(6, 26, lift) : 6;
          return (
            <div key={c.file} style={{
              position: 'absolute', left: ROW_X + k * GAP, top: (312 - c.h) * (MID_W / c.w) * 0.5, width: MID_W, height: h, borderRadius: 12, overflow: 'hidden',
              transform: hero ? `translateY(${(-14 * lift).toFixed(2)}px) scale(${(1 + 0.035 * lift).toFixed(4)})` : undefined,
              boxShadow: `0 0 0 ${hero ? (2.5 * ring).toFixed(2) : 0}px ${alpha(L.accent, 0.9)}, ${softShadow(e, { color: L.shadow, strength: 1.2 })}`,
            }}>
              <Img src={staticFile(`textures/live/${hero ? 'card4-hires.png' : c.file}`)} style={{ width: '100%', height: '100%' }} />
            </div>
          );
        })}
        {/* hero badge: drops from the card's top edge after floating up */}
        <div style={{
          position: 'absolute', left: ROW_X + HERO * GAP + 2, top: -64, height: 44, padding: '0 18px', borderRadius: 22, display: 'flex', alignItems: 'center', gap: 10,
          background: L.accent, color: L.onAccent, ...type(22, 700, { caps: true }), letterSpacing: '0.14em', whiteSpace: 'nowrap',
          opacity: ring, transform: `translateY(${((1 - ring) * 14 - 14 * lift).toFixed(2)}px)`,
          boxShadow: softShadow(8, { color: L.shadow }),
        }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: L.onAccent }} />
          In focus
        </div>
      </div>

      {/* near 1.4x: enlarged tag capsules sweep past the lens (depth-of-field blur, deeper and farther shadow), horizontal motion trail only in the fast segment */}
      <SpeedBlur vx={vFg} amount={0.2} max={10}>
        <div style={{ position: 'absolute', inset: 0, transform: `translateX(${(-drive * 1.4).toFixed(2)}px)` }}>
          {PILLS.map((p) => {
            const bg = p.tone === 'accent' ? L.accent : p.tone === 'ink' ? L.ink : L.surface;
            const fg = p.tone === 'paper' ? L.ink : L.onAccent;
            return (
              <div key={p.t} style={{
                position: 'absolute', left: p.x, top: p.y, height: 128, padding: '0 56px', borderRadius: 64, display: 'flex', alignItems: 'center',
                background: bg, color: fg, ...type(60, 650), filter: 'blur(7px)', opacity: 0.92,
                boxShadow: `0 40px 70px -10px ${alpha(L.shadow, 0.35)}`,
              }}>{p.t}</div>
            );
          })}
        </div>
      </SpeedBlur>

      {/* 0x layer: title fixed to the frame */}
      <div style={{ position: 'absolute', left: 120, top: 96 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, ...type(22, 700, { caps: true }), letterSpacing: `${mix(0.5, 0.18, kick).toFixed(3)}em`, color: L.accent, opacity: kick }}>
          <ShortKitMark size={34} tone="light" />
          <span style={{ textTransform: 'none', fontFamily: BRAND.font, fontSize: 26, fontWeight: 700, letterSpacing: '0.03em', color: L.ink }}>{BRAND.name}</span>
          <span style={{ width: 28, height: 2, background: L.accent }} />
          2.5D camera moves
        </div>
        <div style={{ marginTop: 18, ...type(120, 760), color: L.ink }}>
          <TextReveal text="Your page, in depth." by="word" variant="rise" start={8} each={20} gap={4} />
        </div>
      </div>
      <div style={{ position: 'absolute', right: 120, top: 196, width: 520, textAlign: 'right', ...type(34, 450), lineHeight: 1.35, color: L.ink2, opacity: sub, transform: `translateY(${((1 - sub) * 14).toFixed(1)}px)` }}>
        Screenshots, split into layers and flown in 2.5D.
      </div>
    </AbsoluteFill>
  );
};
