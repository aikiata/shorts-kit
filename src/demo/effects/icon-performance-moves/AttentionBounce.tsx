// Attention bounce (attention-bounce): macOS Dock vocabulary: the icon bounces in place asking for attention, each hop higher than the last, and the camera is drawn toward it.
//
// Second redesign (afternoon window light, one calendar icon):
// - look = sand (beige warm light, terracotta accent). Two slanted blinds-light beams fall on the background wall (a lifestyle afternoon), and the bottom of the frame holds a
//   frosted cream Dock running across the frame with both ends cropped by the frame; the hero is a 360px shorts-kit app icon: a "lens-engraved" mark on a cream base
//   (viewfinder + amber bevel), more recognizable than a generic bell. The neighbor icons left and right (sage / slate blue / sand /
//   charcoal) are held down in low saturation.
// - Bounces follow a real projectile: 4 hops with heights 0.35 → 0.6 → 0.85 → 1.2 times the icon height, each hop's duration ∝ √height (14 / 18 / 22 / 26f),
//   stretched by vertical velocity in the air, 2f contact squash on landing (heavier with each hop, last hop width 1.2x height 0.8x), with a glass ripple ring and a few splash dots at each landing.
// - "Being drawn in": from the second hop the neighbor icons gradually defocus and fade (rack focus, the world recedes), and on the highest hop the camera smooth-pushes in 8%.
// - Settling: damped rebound steadies → on the same frame the badge pops out and a running indicator dot lights under the Dock → the feature panel springs open from the icon's top-right corner
//   (parent arrives first, rows stagger 3f later), panel text ≥32px, and the ending frame is a complete "New in shorts-kit" poster (the storyboard timeline of a promo film).
//
// Timeline (30fps, 156f total):
//   0–12    setup: the frame already has the Dock and icon, camera pushes very slowly; 6–12f crouch to wind up
//   12–100  4 hops of increasing height (take off at 12 / 28 / 48 / 72f, last hop lands at 100f); neighbors defocus 30–96f; camera pushes in 8% over 72–90f
//   100–110 settling rebound; badge pops at 100f; running dot lights up
//   106–132 panel springs open (106f), three rows stagger from 114f
//   132–156 hold: very slow push + window light micro-drift, a clean settle
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, FONT, mix, ramp, softShadow } from '../../../shared/fixtures/Polish';
import { LOOKS, Stage, alpha, springAt, type } from '../../../shared/fixtures/Look';
import { BRAND, ShortKitMark } from '../../../shared/fixtures/Brand';

export const ATTENTION_BOUNCE_DURATION = 156; // 5.2s

const L = LOOKS.sand;
const ICON = 360; // icon side length (half-screen scale)
const RAD = 82; // squircle corner radius
const CX = 600; // hero icon center x
const GROUND = 960; // bottom edge y of the icon at rest (inside the Dock)
const DOCK_TOP = GROUND - ICON - 30;

// 4 hops: takeoff frame, airtime, peak height (relative to icon height); duration ∝ √height (a projectile under the same gravity)
const JUMPS = [
  { start: 12, dur: 14, peak: 0.35 },
  { start: 28, dur: 18, peak: 0.6 },
  { start: 48, dur: 22, peak: 0.85 },
  { start: 72, dur: 26, peak: 1.2 },
];
const LAND = 100; // last hop landing frame (72 + 26 + 2f contact margin)
const LAND_FINAL = JUMPS[3].start + JUMPS[3].dur; // 98

const hs = (n: number) => {
  const x = Math.sin(n * 91.345 + 47.853) * 43758.5453;
  return x - Math.floor(x);
};

// Hero body state: height off the ground y, vertical velocity (normalized), contact squash amount
const body = (f: number) => {
  let y = 0, v = 0, squash = 0;
  JUMPS.forEach((j, ji) => {
    const t = (f - j.start) / j.dur;
    if (t > 0 && t < 1) {
      y = j.peak * ICON * 4 * t * (1 - t);
      v = 1 - 2 * t; // +1 fastest at takeoff → 0 at the apex → -1 fastest at landing
    }
    // Landing contact 2f: squash amount increases with hop height (last hop 0.2 = width 1.2x height 0.8x)
    const land = j.start + j.dur;
    const q = 0.1 + 0.1 * (ji / 3);
    if (ji < 3 && f >= land && f < land + 2) squash = q * (1 - (f - land) / 2) + q * 0.4;
  });
  // Crouch before takeoff
  if (f >= 6 && f < 12) squash = 0.08 * EASE.out((f - 6) / 6);
  // Last hop landing: squash → pull back → steady (damped cosine)
  if (f >= LAND_FINAL) {
    const k = f - LAND_FINAL;
    squash = 0.2 * Math.exp(-k * 0.38) * Math.cos(k * 0.72);
  }
  return { y, v, squash };
};

// Landing frame list (for ripples / splash dots)
const LANDINGS = JUMPS.map((j, i) => ({ at: j.start + j.dur, k: i }));

// ───────────── Icon ─────────────

// shorts-kit app icon: cream squircle + light-background version of the "lens-engraved" mark (the mark itself gets no glow / shadow; soft light is laid over the icon face)
const ShortKitIcon: React.FC<{ size: number }> = ({ size }) => (
  <div style={{
    position: 'absolute', inset: 0, borderRadius: RAD * (size / ICON), overflow: 'hidden',
    background: 'linear-gradient(180deg, #fffaf2 0%, #f6ecdd 100%)',
    boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.95), inset 0 -6px 14px rgba(120,80,40,0.12), inset 0 0 0 1px rgba(70,45,20,0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    {/* The mark's visible outline x 16–120 / 128, center 4 units to the right: shifted left back to the exact icon center */}
    <ShortKitMark size={size * 0.62} tone="light" style={{ transform: `translateX(${(-size * 0.62 * 4 / 128).toFixed(2)}px)` }} />
    {/* Top soft light */}
    <div style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(ellipse closest-side at 38% 0%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 100%)',
    }} />
  </div>
);

// Neighbor icons: low-saturation color blocks + simple glyphs
const Neighbor: React.FC<{ kind: number }> = ({ kind }) => {
  const bgs = [
    'linear-gradient(180deg, #9db59a 0%, #6f8f70 100%)',
    'linear-gradient(180deg, #6b7e9c 0%, #44567a 100%)',
    'linear-gradient(180deg, #e9dcc4 0%, #cdb894 100%)',
    'linear-gradient(180deg, #4a4741 0%, #2b2925 100%)',
  ];
  const ink = kind === 2 ? '#6d5d4c' : '#fbf6ef';
  return (
    <div style={{
      position: 'absolute', inset: 0, borderRadius: RAD, overflow: 'hidden', background: bgs[kind],
      boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -6px 14px rgba(0,0,0,0.12)',
    }}>
      <svg width={ICON} height={ICON} viewBox="0 0 360 360" style={{ position: 'absolute', inset: 0 }}>
        <g fill="none" stroke={ink} strokeWidth={20} strokeLinecap="round" strokeLinejoin="round">
          {kind === 0 && <path d="M110 250 C 110 150, 190 100, 260 100 C 260 190, 210 250, 110 250 Z M110 250 L 200 160" />}
          {kind === 1 && <g><rect x={90} y={120} width={180} height={130} rx={18} /><path d="M95 130 L180 195 L265 130" /></g>}
          {kind === 2 && <g><rect x={95} y={130} width={170} height={120} rx={22} /><circle cx={180} cy={190} r={36} /><path d="M140 130 L150 108 L210 108 L220 130" /></g>}
          {kind === 3 && <g><path d="M150 240 L150 110 L250 92 L250 222" /><circle cx={128} cy={242} r={24} fill={ink} /><circle cx={228} cy={224} r={24} fill={ink} /></g>}
        </g>
      </svg>
    </div>
  );
};

// ───────────── Panel ─────────────

// Panel content: the storyboard timeline of a promo film (timecode / shot / technique)
const SLOTS = [
  { time: '00:00', title: 'Hero push-in', meta: '2.5D', c: '#3d5a80' },
  { time: '00:04', title: 'Beat-synced cuts', meta: '12 cuts', c: '#7d9a7e' },
  { time: '00:09', title: 'Logo sting', meta: '+ SFX', c: L.accent },
];

export const AttentionBounce: React.FC = () => {
  const f = useCurrentFrame();
  const { y, v, squash } = body(f);
  const stretch = Math.abs(v) * 0.1 * (y > 0 ? 1 : 0);
  const sx = 1 + squash - stretch * 0.5;
  const sy = 1 - squash + stretch;
  const lift = y / (1.2 * ICON); // 0 on the ground → 1 highest

  // Camera: very slow push 1→1.015 at the opening; on the highest hop smooth-push in to 1.08; push another 1% in the hold segment
  const zoom = 1 + 0.015 * ramp(f, 0, 72, EASE.smooth) + 0.065 * ramp(f, 72, 18, EASE.smooth) + 0.012 * ramp(f, 110, 46, EASE.smooth);
  const focus = { x: CX + 120, y: 700 };

  // Neighbor defocus (rack focus)
  const defocus = ramp(f, 30, 66, EASE.swift);

  // Badge, running dot, panel
  const badge = f >= LAND ? springAt(f, LAND, { damping: 11, stiffness: 260 }) : 0;
  const dot = ramp(f, LAND + 2, 8, EASE.out);
  const panel = f >= 106 ? springAt(f, 106, { damping: 17, stiffness: 150 }) : 0;
  const row = (i: number) => ramp(f, 114 + i * 3, 16, EASE.snappy);

  // Window light micro-drift
  const shaft = Math.sin(f / 70) * 14;

  return (
    <AbsoluteFill style={{ background: L.bg[1] }}>
      <Stage look={L} keyLight={{ x: 0.3, y: 0.05 }} fill={{ x: 0.85, y: 0.2 }} style={{ background: 'linear-gradient(180deg, #e6d9c6 0%, #dccdb8 60%, #d3c3ac 100%)' }}>
        {/* Blinds light: two slanted light beams on the background wall */}
        <div style={{
          position: 'absolute', left: -400 + shaft, top: -200, width: 2800, height: 1500, transform: 'rotate(-24deg)', transformOrigin: '0 0',
          background: `repeating-linear-gradient(90deg, transparent 0px, transparent 250px, ${alpha('#fffaf0', 0.85)} 280px, ${alpha('#fff6e6', 0.7)} 400px, transparent 430px, transparent 620px)`,
          filter: 'blur(6px)', opacity: 0.9, mixBlendMode: 'soft-light',
          WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 45%, transparent 75%)', maskImage: 'linear-gradient(180deg, #000 0%, #000 45%, transparent 75%)',
        }} />
      </Stage>

      {/* Camera layer */}
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `${focus.x}px ${focus.y}px` }}>
        {/* Dock: a frosted cream glass strip running across the frame, both ends cropped by the frame */}
        <div style={{
          position: 'absolute', left: -80, right: -80, top: DOCK_TOP, height: ICON + 64, borderRadius: 72,
          background: 'linear-gradient(180deg, rgba(255,251,244,0.72) 0%, rgba(250,242,230,0.6) 100%)',
          boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.95), inset 0 0 0 1px rgba(70,45,20,0.07), ${softShadow(30, { color: L.shadow, strength: 1.1 })}`,
        }} />

        {/* Neighbor icons (defocused and faded) */}
        {[CX - 420, CX + 420, CX + 840, CX + 1260].map((x, i) => (
          <div key={i} style={{
            position: 'absolute', left: x - ICON / 2, top: GROUND - ICON, width: ICON, height: ICON,
            filter: `blur(${(defocus * 7).toFixed(2)}px) saturate(${1 - 0.3 * defocus})`, opacity: 1 - 0.4 * defocus,
            boxShadow: softShadow(8, { color: L.shadow }), borderRadius: RAD,
          }}>
            <Neighbor kind={i === 0 ? 0 : i} />
          </div>
        ))}

        {/* Landing ripples + splash dots */}
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {LANDINGS.map(({ at, k }) => {
            const t = (f - at) / 18;
            if (t <= 0 || t >= 1) return null;
            const e = EASE.snappy(t);
            const strength = 0.5 + k * 0.17;
            return (
              <g key={at}>
                <ellipse cx={CX} cy={GROUND + 6} rx={mix(ICON * 0.48, ICON * (0.85 + 0.15 * k), e)} ry={mix(14, 34 + 6 * k, e)}
                  fill="none" stroke={L.ink2} strokeWidth={mix(10, 3, e)} opacity={(1 - t) * strength * 0.3} style={{ filter: 'blur(2.5px)' }} />
                {Array.from({ length: 4 }, (_, i) => {
                  const side = i % 2 ? 1 : -1;
                  const dx = side * (ICON * 0.5 + (40 + 60 * hs(k * 7 + i)) * e * (0.7 + k * 0.25));
                  const dy = -(30 + 40 * hs(k * 11 + i)) * 4 * t * (1 - t) * (0.6 + k * 0.2);
                  return <circle key={i} cx={CX + dx} cy={GROUND - 4 + dy} r={4 + 3 * hs(i + k)} fill={L.ink3} opacity={(1 - t) * 0.7} />;
                })}
              </g>
            );
          })}
        </svg>

        {/* Contact shadow: small and solid near the ground (fades quickly with height) + large and faint far from it */}
        <div style={{
          position: 'absolute', left: CX - ICON * 0.42 * sx * (1 - lift * 0.4), width: ICON * 0.84 * sx * (1 - lift * 0.4),
          top: GROUND - 10, height: 22, borderRadius: '50%', background: alpha(L.shadow, 0.34), filter: 'blur(7px)', opacity: Math.max(0, 1 - lift * 1.8),
        }} />
        <div style={{
          position: 'absolute', left: CX - ICON * 0.52 * (1 - lift * 0.25), width: ICON * 1.04 * (1 - lift * 0.25),
          top: GROUND - 16, height: 46, borderRadius: '50%', background: alpha(L.shadow, 0.16), filter: 'blur(16px)', opacity: 1 - lift * 0.6,
        }} />

        {/* Running indicator dot */}
        <div style={{
          position: 'absolute', left: CX - 7, top: GROUND + 16, width: 14, height: 14, borderRadius: 7,
          background: L.ink2, opacity: dot, transform: `scale(${dot})`,
        }} />

        {/* Hero icon (squashed and stretched about the bottom-edge center) */}
        <div style={{
          position: 'absolute', left: CX - ICON / 2, top: GROUND - ICON - y, width: ICON, height: ICON,
          transform: `scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`, transformOrigin: '50% 100%',
          borderRadius: RAD, boxShadow: softShadow(10 + lift * 40, { color: L.shadow, strength: 1.2 }),
        }}>
          <ShortKitIcon size={ICON} />
          {/* Badge */}
          {badge > 0 && (
            <div style={{
              position: 'absolute', right: -34, top: -34, width: 104, height: 104, borderRadius: 52,
              background: 'linear-gradient(180deg, #e0603a 0%, #c4452a 100%)', color: '#fff8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              ...type(56, 700), letterSpacing: '-0.02em',
              boxShadow: `0 0 0 7px ${L.bg[0]}, 0 10px 22px ${alpha('#7a2a10', 0.35)}`, transform: `scale(${badge})`,
            }}>1</div>
          )}
        </div>

        {/* Feature panel: springs open from the icon's top-right corner */}
        {panel > 0.001 && (
          <div style={{
            position: 'absolute', left: 880, top: 148, width: 860, height: 392, boxSizing: 'border-box',
            transform: `translate(${(1 - panel) * -120}px, ${(1 - panel) * 260}px) scale(${mix(0.2, 1, panel)})`, transformOrigin: '0% 100%',
            opacity: Math.min(1, panel * 2.5),
            background: 'linear-gradient(180deg, #fffdf9 0%, #fbf5ec 100%)', borderRadius: 36, padding: '36px 46px',
            boxShadow: `inset 0 1.5px 0 rgba(255,255,255,1), inset 0 0 0 1px rgba(70,45,20,0.08), ${softShadow(44, { color: L.shadow, strength: 1.25 })}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ ...type(24, 700, { caps: true }), letterSpacing: '0.16em', color: L.accent }}>New in {BRAND.short}</div>
              <div style={{ flex: 1, height: 1.5, background: L.line }} />
            </div>
            <div style={{ ...type(68, 700), color: L.ink, marginTop: 18 }}>Every shot, tuned.</div>
            <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SLOTS.map((s, i) => {
                const r = row(i);
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 24, height: 58, opacity: r, transform: `translateY(${(1 - r) * 22}px)`,
                  }}>
                    <div style={{ fontFamily: FONT.mono, fontSize: 32, color: L.ink3, width: 112, fontVariantNumeric: 'tabular-nums' }}>{s.time}</div>
                    <div style={{ width: 8, height: 50, borderRadius: 4, background: s.c }} />
                    <div style={{ ...type(36, 600), color: L.ink }}>{s.title}</div>
                    <div style={{ marginLeft: 'auto', ...type(32, 450), color: L.ink2 }}>{s.meta}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
