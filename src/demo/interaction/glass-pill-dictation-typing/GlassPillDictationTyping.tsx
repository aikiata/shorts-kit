// glass-pill-dictation-typing: Glass Pill Dictation, a frosted-glass capsule transcribing speech
// A fixed-width glass capsule emerges at about 1.25x slightly larger and slowly settles into place; inside the capsule a layer of warm light is spread from faint on the left to dense on the right ("waiting for you to speak");
// the cursor goes first, then the dictated sentence is typed out at a constant speed, the light fades with typing progress, ending as a neutral frosted-glass bar.
// The quietest beat in the whole piece: it does only three things: settle, type, light fades.
//
// Second redesign (sand daylight · frosted glass):
// - look = sand (beige + terracotta). From a near-black base to a bright afternoon-daylight field: behind the capsule are a warm "sun" and several soft lights,
//   the capsule uses backdrop-filter for real frosting (the light behind it is diffused by it), a white highlight line along the top edge, light-top dark-bottom volume, two warm layers of ground shadow.
// - the subject is enlarged until "the material is visible": a 1240×132 capsule, 56px dictation text, a 92px round sound-wave button; the frame has only the capsule + a small shorts-kit brand mark at the bottom.
// - the cause and effect of light is done in three full layers, all hung on the same g (1→0): the terracotta→apricot gradient inside the capsule, the warm light behind it, the ground reflection below the capsule,
//   all fading with the typing; the sound-wave button recedes from "solid warm color" to "outlined neutral".
// - curves: the settle scale 1.25→1 uses a strong ease-out (snappy, 20f), opacity is full within the first 2f (first "it's there", then it settles),
//   the first half of the settle carries a little depth-of-field blur (closer to the lens); typing is at constant speed 2f/char (dictation doesn't hesitate); the light fade is smooth in-out.
//
// Timeline (30fps, 100f total):
//   0–2      the capsule appears as a whole (opacity full), light at its brightest
//   0–20     settle: scale 1.25→1 (snappy) + blur 6px→0 (first 14f); cursor goes first at 2f
//   8–64     typing: 28 characters at constant speed (2f/char)
//   10–72    light fade: g 1→0 (smooth), the three layers of light and the sound-wave button in sync
//   66–74    cursor removed
//   74–100   hold: neutral frosted-glass bar + sentence, ambient light breathes very slowly
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, ramp, mix } from '../../../shared/fixtures/Polish';
import { LOOKS, Stage, alpha, type } from '../../../shared/fixtures/Look';
import { BRAND, ShortKitMark } from '../../../shared/fixtures/Brand';

export const GLASS_PILL_DICTATION_TYPING_DURATION = 100;

const L = LOOKS.sand;
// inset light: terracotta → apricot (to change the brand color, change only these two)
const WARM = '#d9643a';
const APRICOT = '#ffb070';

const PW = 1240; // fixed width: does not stretch with typing (stretching would read as a chip rather than an input bar)
const PH = 132;
const PX = (1920 - PW) / 2;
const PY = 540 - PH / 2;
const BTN = 92;
const BARS = [30, 16, 24, 13, 20]; // base heights of the sound-wave bars (a dictation icon, tall on the left and low on the right)
const TEXT = 'Cut a launch film for my app'; // 28 characters, same length as the original sentence: the typing window 8–64f is unchanged
const TYPE0 = 8;
const CPF = 2; // frames/char (constant speed)

const hexRgb = (h: string) => {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mixHex = (a: string, b: string, t: number) => {
  const A = hexRgb(a), B = hexRgb(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
};

export const GlassPillDictationTyping: React.FC = () => {
  const f = useCurrentFrame();

  const appear = ramp(f, 0, 2, EASE.linear);
  const land = ramp(f, 0, 20, EASE.snappy);
  const s = mix(1.25, 1, land);
  const defocus = 6 * (1 - ramp(f, 0, 14, EASE.out));
  const n = Math.floor(Math.min(1, Math.max(0, (f - TYPE0) / (TEXT.length * CPF))) * TEXT.length + 1e-6);
  const caret = ramp(f, 2, 2, EASE.linear) * (1 - ramp(f, 66, 8, EASE.out));
  const g = 1 - ramp(f, 10, 62, EASE.smooth); // light: fades with typing
  const breathe = 0.5 + 0.5 * Math.sin(f / 22);

  return (
    <AbsoluteFill style={{ background: L.bg[1], overflow: 'hidden' }}>
      <Stage look={L} keyLight={{ x: 0.36, y: 0.12 }} fill={{ x: 0.8, y: 0.9 }} vignette={0.22}>
        {/* the "sun" behind the capsule: the main body of warm light, fading together with the light inside the capsule until only a little warmth remains */}
        {/* the light center is pressed right behind the capsule's right section: the frosted glass diffuses it, reading as "the light is behind/inside the glass" */}
        <div style={{
          position: 'absolute', left: 1330, top: 470, width: 1100, height: 900, marginLeft: -550, marginTop: -450, borderRadius: '50%',
          background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${alpha(APRICOT, 0.15 + 0.6 * g)} 0%, ${alpha(APRICOT, 0.1 + 0.42 * g)} 18%, ${alpha(WARM, 0.06 + 0.26 * g)} 40%, ${alpha(WARM, 0.02 + 0.08 * g)} 62%, ${alpha(WARM, 0)} 80%)`,
        }} />
        {/* several distant soft lights (there must be something behind the frosted glass to diffuse) */}
        {[
          { x: 520, y: 470, r: 220, c: '#fff4e4', a: 0.9 },
          { x: 820, y: 620, r: 160, c: '#e9b08a', a: 0.35 },
          { x: 1460, y: 610, r: 200, c: '#f6d2a8', a: 0.55 },
        ].map((b, i) => (
          <div key={i} style={{
            position: 'absolute', left: b.x - b.r + Math.sin(f / 40 + i) * 6, top: b.y - b.r, width: b.r * 2, height: b.r * 2, borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(b.c, b.a)} 0%, ${alpha(b.c, 0)} 70%)`,
          }} />
        ))}
        {/* ground reflection: a smear of warm color below the capsule, going out with g */}
        <div style={{
          position: 'absolute', left: PX + PW * 0.35, width: PW * 0.75, top: PY + PH * 0.9, height: 220,
          background: `radial-gradient(ellipse 50% 40% at 60% 20%, ${alpha(WARM, 0.22 * g)} 0%, ${alpha(WARM, 0)} 72%)`,
          opacity: appear,
        }} />
      </Stage>

      {/* capsule body */}
      <div style={{
        position: 'absolute', left: PX, top: PY, width: PW, height: PH, borderRadius: PH / 2, overflow: 'hidden', boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', padding: `0 20px 0 58px`, opacity: appear,
        transform: `scale(${s})`, filter: defocus > 0.05 ? `blur(${defocus.toFixed(2)}px)` : undefined,
        background: `linear-gradient(180deg, ${alpha('#ffffff', 0.62)} 0%, ${alpha('#fffaf3', 0.42)} 55%, ${alpha('#f3e7d8', 0.5)} 100%)`,
        backdropFilter: 'blur(26px) saturate(1.3)', WebkitBackdropFilter: 'blur(26px) saturate(1.3)',
        border: `1.5px solid ${alpha('#ffffff', 0.85)}`,
        // two layers of ground shadow (near ground small and solid + far ground large and soft, tightens on settling) hung directly on the capsule, sharing the same corner radius as the glass
        boxShadow: `0 0 0 1px ${alpha(L.shadow, 0.07)}, inset 0 2px 0 ${alpha('#ffffff', 0.95)}, inset 0 -10px 24px ${alpha('#c9a888', 0.22)}, ` +
          `0 ${mix(10, 4, land).toFixed(1)}px ${mix(20, 10, land).toFixed(1)}px ${alpha(L.shadow, 0.12)}, 0 ${mix(60, 36, land).toFixed(1)}px 70px -28px ${alpha(L.shadow, 0.4)}, ` +
          `0 0 ${60 * g}px ${alpha(APRICOT, 0.45 * g)}`,
      }}>
        {/* inset warm light: faint on the left, dense on the right, fading with typing (the light is inside the glass, not an external halo) */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: g,
          background: `linear-gradient(90deg, ${alpha(WARM, 0)} 0%, ${alpha(WARM, 0.18)} 38%, ${alpha(WARM, 0.62)} 78%, ${alpha(APRICOT, 0.95)} 100%)`,
        }} />
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: g * 0.7, mixBlendMode: 'screen',
          background: `radial-gradient(ellipse 34% 130% at 100% 100%, ${alpha('#ffe2b8', 0.9)} 0%, ${alpha('#ffe2b8', 0)} 70%)`,
        }} />
        {/* top-edge highlight line: fades at both ends, clipped inside the rounded corners */}
        <div style={{
          position: 'absolute', left: PH * 0.45, right: PH * 0.45, top: 3, height: 1.5, pointerEvents: 'none',
          background: `linear-gradient(90deg, ${alpha('#ffffff', 0)}, ${alpha('#ffffff', 0.95)} 20%, ${alpha('#ffffff', 0.7)} 75%, ${alpha('#ffffff', 0)})`,
        }} />
        {/* dictation text + cursor */}
        <div style={{ position: 'relative', ...type(56, 500), letterSpacing: '-0.015em', color: L.ink, whiteSpace: 'pre', flex: 'none' }}>
          {TEXT.slice(0, n)}
        </div>
        <div style={{
          position: 'relative', width: 4, height: 62, marginLeft: 4, borderRadius: 2, flex: 'none', opacity: caret,
          background: mixHex(L.ink, WARM, 0.8 * g),
        }} />
        {/* sound-wave button: solid warm color → outlined neutral */}
        <div style={{
          position: 'relative', marginLeft: 'auto', width: BTN, height: BTN, borderRadius: BTN / 2, flex: 'none', boxSizing: 'border-box',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: `linear-gradient(180deg, ${alpha('#ffffff', 0.35 * g)}, ${alpha('#ffffff', 0)}), ${alpha(WARM, 0.92 * g)}`,
          border: `1.5px solid ${g > 0.5 ? alpha('#ffffff', 0.5) : alpha(L.ink, 0.16 + 0.1 * (1 - g))}`,
          boxShadow: `inset 0 1.5px 0 ${alpha('#ffffff', 0.5)}, 0 ${6 * g}px ${18 * g}px -6px ${alpha(WARM, 0.8 * g)}`,
        }}>
          {BARS.map((h, i) => (
            <div key={i} style={{
              width: 5, borderRadius: 3, height: h + 2.4 * Math.sin(f * 0.5 + i * 1.7),
              background: mixHex(L.ink2, '#fffaf3', g),
            }} />
          ))}
        </div>
      </div>

      {/* small brand mark (static, appears together with the capsule, doesn't steal the scene) */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 112, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14,
        opacity: ramp(f, 4, 16, EASE.out) * (0.9 + 0.1 * breathe),
      }}>
        <ShortKitMark size={34} tone="light" />
        <span style={{ ...type(30, 650), color: L.ink2 }}>{BRAND.name}</span>
        <span style={{ ...type(30, 450), color: L.ink3 }}>· speak or type</span>
      </div>
    </AbsoluteFill>
  );
};
