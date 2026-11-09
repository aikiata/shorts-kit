// glitch-cycle: garbled-text carousel. The same row of monospace slots cycles through 4 status phrases, each phrase's head and tail follow probability keyframes
// [1,0,0,0.1,0,0,1] fully garbled, with occasional single-letter jitter mid-segment, and at the moment of switching RGB split, whole-row displacement and horizontal tearing are layered on;
// the last phrase's probability goes to 0 to guarantee a clean finish.
//
// Second-round redesign (aurora night · render console):
// - look = aurora (deep purple-black · purple · pink). Drawn natively at 1920: the phrase is 104px monospace uppercase, a fixed 17 slots
//   (the phrase is centered and padded with spaces, characters are never added or removed, the whole row never reflows), thin corner brackets frame the slots, like a broadcast-grade status screen.
// - A single noise-density variable g drives all of these at once: per-letter garbling (pink / dark purple), whole-row horizontal jitter (±g·36px, vertical only ±g·10),
//   RGB split (pink left / ice blue right, g·10px each), horizontal tear bands for g>0.25 (middle section shifts sideways ±g·80px), 3 pixel-block ghosts for g>0.45,
//   so the several kinds of glitch never fight each other. Re-rolled every 2f (a change every 1f smears into a gray band, 4f or more reads clearly as another word).
// - A status line above (pulse dot + RENDERING · shorts-kit/launch-film · #4127), a 1100px progress track below (fills linearly, four beat ticks +
//   glowing head) + STEP n/4 and a percentage (tabular-nums): gives the noise a stable "it is progressing" reference.
// - Finish: at the moment the last phrase READY TO SHIP clears up, one soft bloom (Q4: only once for the hero); after progress reaches 100%
//   the status line turns to RENDERED, the pulse dot turns solid, and an accent-colored credit line rises below (logo + shorts-kit); the last ~28f is a clean poster.
//
// Timeline (30fps, 168f total): each phrase 38f (garbled → settled → 0.1 letter flicker → settled → garbled melts into the next)
//   0–38    STORYBOARDING (frame 0 is already fully garbled = there is an image from the opening)
//   38–76   LOCKING BEAT GRID
//   76–114  RENDERING FRAMES
//   114–168 READY TO SHIP: runs KF_LAST at 38f, clean from ~139f; progress runs linearly 0→100% up to 140f
//   140–168 RENDERED state + credit rises + hold
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, FONT, ramp } from '../../../shared/fixtures/Polish';
import { LOOKS, Stage, alpha } from '../../../shared/fixtures/Look';
import { BRAND, ShortKitMark } from '../../../shared/fixtures/Brand';

export const GLITCH_CYCLE_DURATION = 168;

const L = LOOKS.aurora;
// The four steps of shorts-kit rendering a promo film; longest is 17 characters (LOCKING BEAT GRID) = slot count, do not exceed
const PHRASES = ['STORYBOARDING', 'LOCKING BEAT GRID', 'RENDERING FRAMES', 'READY TO SHIP'];
const POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&<>/\\';
const KF = [1, 0, 0, 0.1, 0, 0, 1];
const KF_LAST = [1, 0, 0, 0.1, 0, 0, 0];
const MAXCH = Math.max(...PHRASES.map((p) => p.length));
const SLOT = 38; // frames per phrase (continues after the last phrase to the end of the film)
const DONE = 140; // frame where progress is full
const SIZE = 104;
const CELL = 0.64; // slot width (em)
const SPLIT_A = '#ff4fa3'; // RGB split: pink
const SPLIT_B = '#6fd8ff'; // RGB split: ice blue
const BAR_W = 1100;

const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const glitchAt = (kf: number[], p: number) => {
  const segs = kf.length - 1;
  const x = Math.min(segs - 1e-6, Math.max(0, p * segs));
  const i = Math.floor(x);
  return kf[i] + (kf[i + 1] - kf[i]) * (x - i);
};
const padCenter = (s: string) => {
  const left = Math.floor((MAXCH - s.length) / 2);
  return ' '.repeat(left) + s + ' '.repeat(MAXCH - s.length - left);
};

export const GlitchCycle: React.FC = () => {
  const frame = useCurrentFrame();
  const N = PHRASES.length;
  const slot = Math.min(N - 1, Math.floor(frame / SLOT));
  const p = Math.min(1, (frame - slot * SLOT) / SLOT);
  const text = padCenter(PHRASES[slot]);
  const g = glitchAt(slot === N - 1 ? KF_LAST : KF, p);
  const bucket = Math.floor(frame / 2);

  const jx = (rand(bucket * 5 + slot) - 0.5) * g * 36;
  const jy = (rand(bucket * 9 + slot + 40) - 0.5) * g * 10;
  const tear = g > 0.25;
  const bandTop = 12 + rand(bucket * 3 + 7) * 50;
  const bandH = 16 + rand(bucket * 11 + 3) * 24;
  const tearX = (rand(bucket * 13 + 5) - 0.5) * g * 160;
  const split = g * 10;

  const prog = Math.min(1, frame / DONE);
  const done = frame >= DONE;
  const landed = slot === N - 1 && p > 0.66; // last phrase is clean
  const bloom = landed ? Math.max(0, 1 - (frame - (slot * SLOT + SLOT * 0.66)) / 26) : 0;
  const link = ramp(frame, DONE + 2, 16, EASE.snappy);
  const pulse = 0.55 + 0.45 * Math.sin(frame / 4);
  const intro = ramp(frame, 0, 14, EASE.out);

  const row = (dx: number, clip?: string, key?: string) => (
    <div key={key} style={{
      position: clip ? 'absolute' : 'relative', left: 0, top: 0, display: 'flex',
      transform: `translateX(${dx.toFixed(1)}px)`, clipPath: clip,
      textShadow: g > 0.04
        ? `${split.toFixed(1)}px 0 ${alpha(SPLIT_A, 0.8 * Math.min(1, g * 1.4))}, ${(-split).toFixed(1)}px 0 ${alpha(SPLIT_B, 0.8 * Math.min(1, g * 1.4))}`
        : `0 0 ${(20 + 40 * bloom).toFixed(0)}px ${alpha(L.accent, 0.25 + 0.45 * bloom)}`,
    }}>
      {Array.from({ length: MAXCH }, (_, i) => {
        const ch = text[i];
        let content = ch;
        let color: string = L.ink;
        if (ch !== ' ') {
          const hit = rand(i * 31 + bucket * 17 + slot * 97) < g;
          if (hit) {
            content = POOL[Math.floor(rand(i * 131 + bucket * 7 + slot * 13) * POOL.length)];
            color = rand(i + bucket) > 0.5 ? L.accent2 : L.ink3;
          }
        }
        return <span key={i} style={{ width: `${CELL}em`, textAlign: 'center', color, display: 'inline-block' }}>{content}</span>;
      })}
    </div>
  );

  // Pixel-block ghosts: at high g, 3 small rectangles flash in the slots (re-rolled every 2f)
  const blocks = g > 0.45
    ? Array.from({ length: 3 }, (_, k) => ({
      x: rand(bucket * 19 + k * 7) * 100, y: rand(bucket * 23 + k * 5) * 90,
      w: 4 + rand(bucket * 29 + k) * 14, h: 6 + rand(bucket * 31 + k) * 14, c: k % 2 ? SPLIT_B : SPLIT_A,
    }))
    : [];

  const slotW = MAXCH * CELL * SIZE;

  return (
    <AbsoluteFill>
      <Stage look={L} keyLight={{ x: 0.5, y: 0.45 }} fill={{ x: 0.82, y: 0.12 }} breathe={0.4} vignette={0.65}>
        {/* Signal band: a horizontal soft glow behind the phrase */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 380, height: 300,
          background: `radial-gradient(ellipse 45% 50% at 50% 50%, ${alpha(L.accent, 0.16 + 0.1 * g)} 0%, ${alpha(L.accent, 0)} 70%)`,
        }} />
        {/* Scanlines (static, very faint) */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.5,
          background: `repeating-linear-gradient(180deg, ${alpha('#000000', 0)} 0px, ${alpha('#000000', 0)} 3px, ${alpha('#000000', 0.22)} 4px)`,
        }} />
      </Stage>

      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: slotW, opacity: intro }}>
          {/* Status line */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 18, marginBottom: 54, fontFamily: FONT.mono, fontSize: 30,
            letterSpacing: '0.14em', color: L.ink2,
          }}>
            <span style={{
              width: 14, height: 14, borderRadius: 7, boxSizing: 'border-box', border: `2px solid ${L.accent2}`,
              background: done ? L.accent2 : alpha(L.accent2, pulse * 0.8),
              boxShadow: `0 0 ${done ? 16 : 10 * pulse}px ${alpha(L.accent2, 0.7)}`,
            }} />
            <span style={{ color: done ? L.ink : L.ink2, fontWeight: 600 }}>{done ? 'RENDERED' : 'RENDERING'}</span>
            <span style={{ color: L.ink3 }}>·</span>
            <span>shorts-kit/launch-film</span>
            <span style={{ marginLeft: 'auto', color: L.ink3 }}>#4127</span>
          </div>

          {/* Slots: four corner brackets + phrase */}
          <div style={{ position: 'relative', padding: '30px 0' }}>
            {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([rx, ry], k) => (
              <div key={k} style={{
                position: 'absolute', width: 30, height: 30, left: rx ? undefined : -36, right: rx ? -36 : undefined,
                top: ry ? undefined : 0, bottom: ry ? 0 : undefined,
                borderLeft: rx ? undefined : `2px solid ${alpha(L.ink, 0.35)}`, borderRight: rx ? `2px solid ${alpha(L.ink, 0.35)}` : undefined,
                borderTop: ry ? undefined : `2px solid ${alpha(L.ink, 0.35)}`, borderBottom: ry ? `2px solid ${alpha(L.ink, 0.35)}` : undefined,
              }} />
            ))}
            <div style={{
              position: 'relative', fontFamily: FONT.mono, fontSize: SIZE, fontWeight: 600, lineHeight: 1.1,
              transform: `translate(${jx.toFixed(1)}px,${jy.toFixed(1)}px)`, whiteSpace: 'pre',
            }}>
              {tear ? (
                <>
                  <div style={{ visibility: 'hidden' }}>{row(0)}</div>
                  {row(0, `inset(0 -200px ${100 - bandTop}% -200px)`, 'a')}
                  {row(tearX, `inset(${bandTop}% -200px ${Math.max(0, 100 - bandTop - bandH)}% -200px)`, 'b')}
                  {row(0, `inset(${Math.min(100, bandTop + bandH)}% -200px 0 -200px)`, 'c')}
                </>
              ) : row(0)}
              {blocks.map((b, k) => (
                <div key={k} style={{
                  position: 'absolute', left: `${b.x}%`, top: `${b.y}%`, width: b.w * 4, height: b.h * 2,
                  background: alpha(b.c, 0.55), mixBlendMode: 'screen',
                }} />
              ))}
            </div>
          </div>

          {/* Progress track: fills linearly (the only linear element in the film), four beat ticks + glowing head */}
          <div style={{ position: 'relative', marginTop: 56, width: BAR_W, marginLeft: (slotW - BAR_W) / 2, height: 4, borderRadius: 2, background: alpha(L.ink, 0.1) }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: `${prog * 100}%`, borderRadius: 2,
              background: `linear-gradient(90deg, ${alpha(L.accent, 0.3)} 0%, ${L.accent} 70%, ${L.accent2} 100%)`,
              boxShadow: `0 0 14px ${alpha(L.accent, 0.6)}`,
            }} />
            {[1, 2, 3].map((k) => {
              const x = (k * SLOT) / DONE;
              return (
                <div key={k} style={{
                  position: 'absolute', left: `${x * 100}%`, top: -7, width: 2, height: 18, marginLeft: -1,
                  background: prog >= x ? L.accent : alpha(L.ink, 0.25),
                }} />
              );
            })}
            <div style={{
              display: 'flex', justifyContent: 'space-between', position: 'absolute', left: 0, right: 0, top: 30,
              fontFamily: FONT.mono, fontSize: 32, letterSpacing: '0.1em', color: L.ink2, fontVariantNumeric: 'tabular-nums',
            }}>
              <span>STEP {slot + 1}/{N}</span>
              <span style={{ color: done ? L.ink : L.ink2 }}>{String(Math.round(prog * 100)).padStart(3, ' ')}%</span>
            </div>
          </div>

          {/* Closing credit: logo + brand name */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: -170, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 16, fontFamily: FONT.sans, fontSize: 40,
            fontWeight: 600, letterSpacing: '-0.01em', color: L.accent, opacity: link, transform: `translateY(${(1 - link) * 24}px)`,
          }}>
            <ShortKitMark size={48} tone="dark" />
            <span>Crafted with {BRAND.name}</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
