// Polish texture utilities (Phase 0): small tools for the "finished product" final touches of a demo: Bezier easing,
// film grain, vignette, two-layer soft shadow / hairline / inner highlight, speed-based directional motion blur,
// soft-light gradient background. All are pure functions of props / frame, rendering deterministically (no Math.random / Date).
// Depends only on remotion + react; optional shared piece: when copying a demo, bring it along and fix the import path.
import React from 'react';
import { useCurrentFrame } from 'remotion';

// ───────────────────────── Easing ─────────────────────────

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

// cubic-bezier(x1,y1,x2,y2) → (t)=>number, same meaning as CSS; solved with Newton-Raphson, falling back to bisection on failure.
// x1/x2 must be in [0,1]; y may go out of range (for anticipation/overshoot). Input t is automatically clamped to [0,1].
export const bezier = (x1: number, y1: number, x2: number, y2: number) => {
  if (x1 === y1 && x2 === y2) return (t: number) => clamp01(t);
  const ax = 1 - 3 * x2 + 3 * x1, bx = 3 * x2 - 6 * x1, cx = 3 * x1;
  const ay = 1 - 3 * y2 + 3 * y1, by = 3 * y2 - 6 * y1, cy = 3 * y1;
  const sx = (u: number) => ((ax * u + bx) * u + cx) * u;
  const sy = (u: number) => ((ay * u + by) * u + cy) * u;
  const dx = (u: number) => (3 * ax * u + 2 * bx) * u + cx;
  const solve = (x: number) => {
    let u = x;
    for (let i = 0; i < 8; i++) {
      const err = sx(u) - x;
      if (Math.abs(err) < 1e-7) return u;
      const d = dx(u);
      if (Math.abs(d) < 1e-6) break;
      u -= err / d;
    }
    let lo = 0, hi = 1;
    u = x;
    for (let i = 0; i < 40; i++) {
      const v = sx(u);
      if (Math.abs(v - x) < 1e-7) break;
      if (v < x) lo = u; else hi = u;
      u = (lo + hi) / 2;
    }
    return u;
  };
  return (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : sy(solve(t)));
};

// Named easing presets (entrance snappy / reposition smooth / exit exit / anticipation anticip / overshoot overshoot)
export const EASE = {
  snappy: bezier(0.16, 1, 0.3, 1), // strong ease-out (≈ expo-out): entrances, hard push that settles
  out: bezier(0.22, 1, 0.36, 1), // softer ease-out (≈ quint-out): secondary element entrances, follow-through
  smooth: bezier(0.65, 0, 0.35, 1), // symmetric in-out: repositioning, camera pans
  swift: bezier(0.4, 0, 0.2, 1), // asymmetric in-out (slightly fast start, very soft landing): general movement
  exit: bezier(0.7, 0, 0.84, 0), // strong ease-in (≈ quart-in): exits, flung off screen
  anticip: bezier(0.5, -0.32, 0.25, 1), // pulls back ~5% in reverse first and then launches: anticipation before a big move
  overshoot: bezier(0.34, 1.45, 0.64, 1), // overshoots ~8% then settles back: pop-ups, landing in place
  linear: (t: number) => clamp01(t),
};

// Segment progress: frame is normalized within [start, start+dur] → eased, clamped out of range (the time-axis primitive of all motion)
export const ramp = (frame: number, start: number, dur: number, ease: (t: number) => number = EASE.snappy) =>
  ease(clamp01((frame - start) / Math.max(1e-6, dur)));

// Linear mix a→b (t is not clamped, for use with the out-of-range values of overshoot/anticip)
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// Numeric velocity (displacement per frame): central difference f(frame+0.5) - f(frame-0.5). Feeds speed into SpeedBlur
export const velocity = (f: (frame: number) => number, frame: number) => f(frame + 0.5) - f(frame - 0.5);

// ───────────────────────── Fonts ─────────────────────────

export const FONT = {
  sans: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Inter, Arial, sans-serif',
  mono: '"SF Mono", "JetBrains Mono", Menlo, monospace',
};

// Letter-spacing (em) by font size: large titles tighten, body text tightens slightly, small text loosens; caps=true (all caps) loosens everything by one step
export const tracking = (size: number, caps = false) => {
  const base = size >= 96 ? -0.04 : size >= 56 ? -0.03 : size >= 28 ? -0.02 : size >= 16 ? -0.008 : 0.01;
  return `${(base + (caps ? 0.03 : 0)).toFixed(3)}em`;
};

// ───────────────────────── Surface materials ─────────────────────────

const rgb = (hex: string) => {
  const h = hex.replace('#', '');
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const n = parseInt(f, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};
const r1 = (x: number) => Math.round(x * 10) / 10;

// Two-layer soft shadow: near contact shadow (small and solid, fades with elevation) + far ambient shadow (large and diffuse, grows and deepens with elevation).
// elevation ≈ object height above ground in pixels (0 on the ground / 4 card at rest / 16 floating / 48+ flying); color uses a hue-tinted dark color.
export const softShadow = (elevation: number, opts: { color?: string; strength?: number } = {}) => {
  const e = Math.max(0, elevation);
  const c = rgb(opts.color ?? '#10121a');
  const s = opts.strength ?? 1;
  const contactA = (0.12 * s) / (1 + e / 24);
  const ambientA = (0.08 + (Math.min(e, 64) / 64) * 0.22) * s;
  return `0 ${r1(0.5 + e * 0.06)}px ${r1(1 + e * 0.18)}px rgba(${c},${contactA.toFixed(3)}), ` +
    `0 ${r1(e * 0.55)}px ${r1(e * 1.3)}px ${r1(-e * 0.22)}px rgba(${c},${ambientA.toFixed(3)})`;
};

// 1px hairline border value (usage: border: hairline()); in dark scenes tone='dark' uses white at low opacity
export const hairline = (alpha = 0.08, tone: 'light' | 'dark' = 'light') =>
  `1px solid ${tone === 'light' ? `rgba(20,22,28,${alpha})` : `rgba(255,255,255,${alpha})`}`;

// Top 1px inner highlight (a box-shadow fragment, joined to softShadow with a comma): gives the panel a "lit top edge"
export const innerHighlight = (alpha = 0.8) => `inset 0 1px 0 rgba(255,255,255,${alpha})`;

// Refined panel in one go: background + hairline + rounded corners + inner highlight + two-layer soft shadow (returns a style object, can be spread and overridden)
export const surface = (opts: { tone?: 'light' | 'dark'; elevation?: number; radius?: number; background?: string } = {}): React.CSSProperties => {
  const tone = opts.tone ?? 'light';
  const dark = tone === 'dark';
  return {
    background: opts.background ?? (dark ? '#18191e' : '#ffffff'),
    border: hairline(0.08, tone),
    borderRadius: opts.radius ?? 14,
    boxShadow: `${innerHighlight(dark ? 0.06 : 0.85)}, ${softShadow(opts.elevation ?? 4, { strength: dark ? 2.6 : 1, color: dark ? '#000000' : '#10121a' })}`,
  };
};

// ───────────────────────── Overlays ─────────────────────────

const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// Grain texture cache: one seamless data-URI tile per each of 6 feTurbulence seeds, so Chrome rasterizes only once
const grainCache = new Map<string, string>();
const grainTile = (variant: number, tile: number, freq: number) => {
  const key = `${variant}|${tile}|${freq}`;
  const hit = grainCache.get(key);
  if (hit) return hit;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${tile}' height='${tile}'>` +
    `<filter id='g' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'>` +
    `<feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='2' seed='${variant * 17 + 3}' stitchTiles='stitch'/>` +
    `<feColorMatrix type='matrix' values='0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 0 1'/>` +
    `<feComponentTransfer><feFuncR type='linear' slope='2.4' intercept='-0.7'/><feFuncG type='linear' slope='2.4' intercept='-0.7'/>` +
    `<feFuncB type='linear' slope='2.4' intercept='-0.7'/></feComponentTransfer></filter>` +
    `<rect width='100%' height='100%' filter='url(#g)'/></svg>`;
  const url = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  grainCache.set(key, url);
  return url;
};

// Film grain: a grayscale noise layer filling the parent (absolute inset 0), swapping texture and offset every step frames (deterministic).
// Bright scenes opacity 0.04–0.08, dark scenes 0.06–0.12; blend defaults to overlay (dark scenes can try 'soft-light' / 'screen').
// Use: prevents banding in large gradients, adds a little film texture to flat UI. Place it after the content it covers (on top).
export const Grain: React.FC<{
  opacity?: number; step?: number; scale?: number; freq?: number;
  blend?: React.CSSProperties['mixBlendMode']; style?: React.CSSProperties;
}> = ({ opacity = 0.06, step = 2, scale = 1, freq = 0.85, blend = 'overlay', style }) => {
  const frame = useCurrentFrame();
  const k = Math.floor(frame / Math.max(1, step));
  const tile = 256;
  const ox = Math.floor(hash(k * 3 + 1) * tile);
  const oy = Math.floor(hash(k * 7 + 2) * tile);
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', opacity, mixBlendMode: blend,
      backgroundImage: grainTile(k % 6, tile, freq), backgroundSize: `${tile * scale}px ${tile * scale}px`,
      backgroundPosition: `${ox}px ${oy}px`, ...style,
    }} />
  );
};

// Vignette: a radial gradient filling the parent that darkens the edges. strength = max opacity at the four corners (0.2 light / 0.4 medium / 0.6 heavy),
// inner = fraction of the fully transparent center radius (0–1), color uses a hue-tinted dark color rather than pure black; cx/cy can offset the light center (0–1).
export const Vignette: React.FC<{
  strength?: number; inner?: number; color?: string; cx?: number; cy?: number; style?: React.CSSProperties;
}> = ({ strength = 0.35, inner = 0.5, color = '#0b0c12', cx = 0.5, cy = 0.46, style }) => {
  const c = rgb(color);
  const mid = inner + (1 - inner) * 0.55;
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: `radial-gradient(ellipse 72% 72% at ${cx * 100}% ${cy * 100}%, rgba(${c},0) ${inner * 100}%, ` +
        `rgba(${c},${(strength * 0.32).toFixed(3)}) ${(mid * 100).toFixed(1)}%, rgba(${c},${strength.toFixed(3)}) 100%), ` +
        `radial-gradient(ellipse 100% 100% at ${cx * 100}% ${cy * 100}%, rgba(${c},0) 60%, rgba(${c},${(strength * 0.6).toFixed(3)}) 100%)`,
      ...style,
    }} />
  );
};

// Directional motion blur: wrap a moving object in it, and it adds a Gaussian trail along the motion direction by speed (px/frame); with speed ≈ 0 no filter is applied (zero overhead).
// Principle: outer layer rotates to the motion direction → SVG feGaussianBlur blurs only along the local x axis → inner layer rotates back to reset, so any direction works.
// It is itself an absolute inset 0 fill layer (position children absolutely yourself); amount = how much blur per 1px/frame of speed (default 0.45),
// max caps it. Use velocity() to get speed from a position function; it only takes effect in fast segments, do not leave it on throughout.
export const SpeedBlur: React.FC<{
  vx: number; vy?: number; amount?: number; max?: number; children: React.ReactNode; style?: React.CSSProperties;
}> = ({ vx, vy = 0, amount = 0.45, max = 36, children, style }) => {
  const rid = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const speed = Math.hypot(vx, vy);
  const sd = Math.min(max, speed * amount);
  const fill: React.CSSProperties = { position: 'absolute', inset: 0 };
  if (sd < 0.35) return <div style={{ ...fill, ...style }}>{children}</div>;
  const deg = (Math.atan2(vy, vx) * 180) / Math.PI;
  const id = `speedblur-${rid}`;
  return (
    <div style={{ ...fill, ...style }}>
      <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden>
        <filter id={id} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={`${sd.toFixed(2)} 0`} edgeMode="none" />
        </filter>
      </svg>
      <div style={{ ...fill, transform: `rotate(${deg}deg)`, filter: `url(#${id})` }}>
        <div style={{ ...fill, transform: `rotate(${-deg}deg)` }}>{children}</div>
      </div>
    </div>
  );
};

// Soft-light background: low-contrast vertical gradient + one soft key light spot (+ optional accent afterglow) + vignette + grain, replacing a dead flat solid base.
// tone light/dark; light = key light position (0–1, default upper left toward center); accent adds a very faint hue afterglow; when drift>0 the light spot drifts slowly (amplitude in px).
export const Backdrop: React.FC<{
  tone?: 'light' | 'dark'; light?: { x: number; y: number }; accent?: string;
  grain?: number; vignette?: number; drift?: number; style?: React.CSSProperties;
}> = ({ tone = 'light', light = { x: 0.32, y: 0.18 }, accent, grain, vignette, drift = 0, style }) => {
  const frame = useCurrentFrame();
  const dark = tone === 'dark';
  const dx = drift * Math.sin(frame / 90);
  const dy = drift * 0.6 * Math.cos(frame / 110);
  const base = dark
    ? 'linear-gradient(180deg, #13151b 0%, #0c0d11 55%, #08090c 100%)'
    : 'linear-gradient(180deg, #f6f6f4 0%, #efefec 55%, #e8e8e4 100%)';
  const glow = dark ? 'rgba(150,160,200,0.16)' : 'rgba(255,255,255,0.95)';
  const lx = `calc(${light.x * 100}% + ${dx.toFixed(2)}px)`;
  const ly = `calc(${light.y * 100}% + ${dy.toFixed(2)}px)`;
  const tint = accent
    ? `radial-gradient(ellipse 55% 60% at ${(1 - light.x) * 100}% ${(1 - light.y * 0.4) * 100}%, rgba(${rgb(accent)},${dark ? 0.14 : 0.07}) 0%, rgba(${rgb(accent)},0) 70%), `
    : '';
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: base, ...style }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `${tint}radial-gradient(ellipse 62% 70% at ${lx} ${ly}, ${glow} 0%, rgba(255,255,255,0) 72%)`,
      }} />
      <Vignette strength={vignette ?? (dark ? 0.5 : 0.14)} color={dark ? '#000000' : '#2a2c36'} inner={0.45} />
      {(grain ?? (dark ? 0.08 : 0.05)) > 0 && (
        <Grain opacity={grain ?? (dark ? 0.08 : 0.05)} blend={dark ? 'soft-light' : 'overlay'} />
      )}
    </div>
  );
};
