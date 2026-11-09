// flying-words: word depth tunnel. Keywords spawn far away in depth, fly toward the camera along the z axis and brush past, with opacity following the
// [0,1,0.5,0.2,0] lifecycle curve; the camera is static and the elements move, spawn is fully deterministic, and 2 full cycles run seamlessly from end to start.
//
// Second-round redesign (deep blue night · light-speed tunnel + foreground wordmark):
// - look = midnight (deep blue-black · electric blue). Drawn natively at 1920×1080 (no longer 480×270 scaled up), perspective computed by hand
//   s = P/(P−z) (P=4400, z −7000→+3200, equivalent point by point to CSS perspective), so every element can get effects by screen speed.
// - Three depth layers: ① tunnel walls: 10 flat-ellipse hairline rings pushed toward the camera at the same speed (the tunnel's "structure", thicker and fading out of frame up close);
//   ② light-speed streaks: 56 dust particles drawn as segments stretched radially (length = this frame's screen displacement, longer when closer), the main source of speed feel;
//   ③ 22 product-capability keywords: placed by golden angle, small far and large near, atmospheric haze defocus at the far end, up close dragged along the motion direction by speed into 6 layers of fading ghosts
//   (text-shadow directional trail, much cheaper than a full-screen SVG filter) + defocus as they rush in front of the eyes.
// - Text hierarchy: cold-white three-step sans 700 as the main, 6 keywords in serif italic, 4 emphasis words in electric blue with bloom (light only for emphasis words).
// - End of the tunnel: the central electric-blue halo breathes 2 times per cycle (aligned with CYCLES), the whole tunnel rolls very slowly with sin(2πt) ±2.5°,
//   so the frame is never still yet never shaky (the roll is periodic, the first and last frames match).
// - Foreground: the mid-segment lifecycle curve being capped at 0.5 is to give way to the foreground: the demo stacks a static wordmark group in the center (mono eyebrow + 112px title +
//   a radial scrim; words flying into the wordmark's ellipse region are pressed to 20%), proving the tunnel works as a background layer without clashing; static wordmark = seamless loop.
// - Brand: eyebrow = logo + small shorts-kit text, title = brand phrase; the word list mixes in shorts-kit capability words.
//
// Timeline: t = frame / DURATION (the frame after the last frame = frame 0, a truly seamless loop); CYCLES = 2 full cycles.
//   Each element u = (t·CYCLES + phase) mod 1: 0 spawns far away → 0.25 brightens to full → 0.6 drops to half transparent → 1 brushes past out of frame.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { FONT } from '../../../shared/fixtures/Polish';
import { LOOKS, SERIF, Stage, alpha } from '../../../shared/fixtures/Look';
import { BRAND, PITCH, ShortKitMark } from '../../../shared/fixtures/Brand';

export const FLYING_WORDS_DURATION = 180; // 6000ms @30fps

const L = LOOKS.midnight;
const CYCLES = 2; // integer cycles → first and last frames match

// Keyword list: swap in your project's own keywords; as long as word count / length are similar the rhythm is unaffected (these are shorts-kit's capability words)
const WORDS = ['Timeline', 'Keyframes', 'Easing', 'Camera', 'Depth', 'Parallax', 'Motion blur', 'Springs',
  'Layers', 'Shot cards', 'Typography', 'Lighting', 'Grain', 'Remotion', 'Beat grid', 'Stagger',
  'Transitions', 'Color', 'Workbench', 'Audio sync', 'Storyboard', 'Orbit'];
const N = WORDS.length;
const ACCENT = new Set([3, 7, 12, 19]); // Camera / Springs / Grain / Audio sync
const SERIF_IDX = new Set([1, 5, 10, 14, 17, 21]);
const INKS = ['#f2f5ff', '#c3cbe2', '#8a95b5'];

const P = 4400; // perspective distance
const Z0 = -7000;
const Z1 = 3200;
const CX = 960;
const CY = 540;

const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const ITEMS = WORDS.map((w, i) => {
  // Golden-angle spread + radius avoids the exact center (nothing piles up close in)
  const a = i * 2.39996 + rand(i * 7 + 1) * 0.8;
  const r = 330 + rand(i * 13 + 2) * 660;
  const accent = ACCENT.has(i);
  return {
    text: w, accent, serif: SERIF_IDX.has(i),
    size: 64 + rand(i + 3) * 56,
    color: accent ? '#86a8ff' : INKS[Math.floor(rand(i + 5) * 3)],
    x: Math.cos(a) * r, y: Math.sin(a) * r * 0.6, rz: (rand(i + 21) - 0.5) * 12, ph: i / N,
  };
});

const DUST = Array.from({ length: 56 }, (_, i) => {
  const a = i * 2.39996 + rand(i * 5 + 77) * 1.2;
  const r = 180 + rand(i * 3 + 91) * 1500;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.62, ph: rand(i * 9 + 13), w: 1 + rand(i + 50) * 1.6 };
});

const RINGS = Array.from({ length: 10 }, (_, k) => ({ ph: k / 10 }));

// Lifecycle opacity curve [0,1,0.5,0.2,0] @ [0,0.25,0.6,0.85,1], piecewise linear
const OP = [0, 1, 0.5, 0.2, 0];
const OT = [0, 0.25, 0.6, 0.85, 1];
const curve = (u: number) => {
  for (let k = 0; k < 4; k++) {
    if (u <= OT[k + 1]) return OP[k] + ((OP[k + 1] - OP[k]) * (u - OT[k])) / (OT[k + 1] - OT[k]);
  }
  return 0;
};

// z advances linearly; drift = 0.5 + u·1.35 (converges far away, spreads outward the closer it gets); roll = roll angle of the whole tunnel
const project = (x: number, y: number, u: number, roll: number, drift = true) => {
  const z = Z0 + (Z1 - Z0) * u;
  const d = drift ? 0.5 + u * 1.35 : 1;
  const s = P / (P - z);
  const c = Math.cos(roll), sn = Math.sin(roll);
  const rx = x * c - y * sn, ry = x * sn + y * c;
  return { sx: CX + rx * d * s, sy: CY + ry * d * s, s };
};

export const FlyingWords: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FLYING_WORDS_DURATION;
  const roll = (2.5 * Math.PI / 180) * Math.sin(t * Math.PI * 2);
  const du = CYCLES / FLYING_WORDS_DURATION; // increment of u per frame
  const glowB = 0.82 + 0.14 * Math.sin(t * Math.PI * 4);

  return (
    <AbsoluteFill>
      <Stage look={L} keyLight={{ x: 0.5, y: 0.5 }} fill={null} intensity={0.5} vignette={0.7} grain={0.08}>
        {/* Halo at the end of the tunnel: breathes 2 times per cycle, aligned with CYCLES */}
        <div style={{
          position: 'absolute', left: CX - 520, top: CY - 360, width: 1040, height: 720, borderRadius: '50%', opacity: glowB,
          background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${alpha(L.light, 0.42)} 0%, ${alpha(L.light, 0.12)} 38%, ${alpha(L.light, 0)} 70%)`,
        }} />
      </Stage>

      {/* ① Tunnel walls + ② light-speed streaks (one SVG) */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {RINGS.map((rg, k) => {
          const u = (t * CYCLES + rg.ph) % 1;
          const p = project(0, 0, u, roll, false);
          const rx = 1150 * p.s;
          const op = Math.min(1, u / 0.3) * (1 - Math.min(1, Math.max(0, (u - 0.55) / 0.3)));
          if (op <= 0.01) return null;
          return (
            <ellipse key={`r${k}`} cx={CX} cy={CY} rx={rx} ry={rx * 0.6} fill="none"
              stroke={L.accent} strokeOpacity={op * 0.16} strokeWidth={1 + p.s * 0.8}
              transform={`rotate(${(roll * 180) / Math.PI} ${CX} ${CY})`} />
          );
        })}
        {DUST.map((d, i) => {
          const u = (t * CYCLES + d.ph) % 1;
          const u0 = Math.max(0, u - du * 2.6);
          const a = project(d.x, d.y, u0, roll);
          const b = project(d.x, d.y, u, roll);
          const op = curve(u) * 0.75;
          if (op <= 0.01) return null;
          return (
            <line key={`d${i}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} stroke="#cfdcff" strokeOpacity={op}
              strokeWidth={d.w * Math.min(2.4, b.s)} strokeLinecap="round" />
          );
        })}
      </svg>

      {/* ③ Keywords: haze at the far end, crisp mid-segment, directional trail + defocus at the near end */}
      {ITEMS.map((it, i) => {
        const u = (t * CYCLES + it.ph) % 1;
        const p = project(it.x, it.y, u, roll);
        const q = project(it.x, it.y, Math.max(0, u - du), roll);
        const vx = p.sx - q.sx, vy = p.sy - q.sy; // screen velocity px/frame
        // Words inside the foreground wordmark area (ellipse) are pressed to 20%: as if covered by a scrim, so they do not fight the title
        const k = ((p.sx - CX) / 760) ** 2 + ((p.sy - CY) / 190) ** 2;
        const occl = k < 1 ? 0.2 + 0.8 * k * k : 1;
        const op = curve(u) * occl;
        if (op <= 0.005) return null;
        const fog = u < 0.22 ? (1 - u / 0.22) * 2.2 : 0;
        const near = u > 0.86 ? (u - 0.86) * 60 : 0;
        const blur = fog + near;
        const sp = Math.hypot(vx, vy);
        const trail = sp > 6
          ? [1, 2, 3, 4, 5, 6].map((j) => {
            const k = (j / 6) * 0.9 / p.s;
            return `${(-vx * k).toFixed(1)}px ${(-vy * k).toFixed(1)}px ${(j * 0.8).toFixed(1)}px ${alpha(it.color, 0.2 - j * 0.026)}`;
          }).join(', ')
          : '';
        const glowS = it.accent ? `0 0 18px ${alpha(L.accent, 0.55)}, 0 0 48px ${alpha(L.accent, 0.3)}` : '';
        return (
          <div key={i} style={{
            position: 'absolute', left: p.sx, top: p.sy, whiteSpace: 'nowrap', lineHeight: 1,
            transform: `translate(-50%,-50%) scale(${p.s.toFixed(4)}) rotate(${it.rz + (roll * 180) / Math.PI}deg)`,
            fontFamily: it.serif ? SERIF : FONT.sans, fontStyle: it.serif ? 'italic' : undefined,
            fontWeight: it.serif ? 500 : 700, fontSize: it.size, letterSpacing: it.serif ? '-0.01em' : '-0.03em',
            color: it.color, opacity: op,
            textShadow: [glowS, trail].filter(Boolean).join(', ') || undefined,
            filter: blur > 0.05 ? `blur(${(blur / Math.max(0.6, p.s)).toFixed(2)}px)` : undefined,
          }}>
            {it.text}
          </div>
        );
      })}

      {/* Foreground wordmark: static (seamless loop), a very faint radial scrim separates it from the tunnel */}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{
          position: 'absolute', left: CX - 760, top: CY - 260, width: 1520, height: 520, borderRadius: '50%',
          background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${alpha('#04060d', 0.7)} 0%, ${alpha('#04060d', 0.38)} 45%, ${alpha('#04060d', 0)} 72%)`,
        }} />
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18,
            fontFamily: FONT.mono, fontSize: 30, letterSpacing: '0.3em', color: L.accent, marginBottom: 30,
          }}>
            <ShortKitMark size={42} tone="dark" />
            <span>{BRAND.name}</span>
          </div>
          <div style={{
            fontFamily: FONT.sans, fontSize: 112, fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 1, color: L.ink,
            textShadow: `0 4px 40px ${alpha('#000', 0.6)}`,
          }}>
            {PITCH.en.motto}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
