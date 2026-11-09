// brace-expand: Brace Expand Reveal, braces pull open like a curtain
// A pair of tightly adjacent curly braces first appears small at dead center, then springs outward to left and right with one overshoot and scales up to title size; the title between the braces is revealed from the middle like a curtain being drawn
// (the clip width is strictly bound to the brace spacing), and after settling the letter-spacing loosens subtly.
//
// Second-round redesign (midnight · developer-launch title card):
// - look = midnight. The frame is a technical-product launch title card: monospace 300px electric-blue curly braces (with bloom) clamp the brand name
//   'shorts-kit' at 164px weight 800 (all lowercase, the text width fills the braces' inner cavity); above it a monospace eyebrow '// shot recipes for your agent',
//   below it a subtitle (brand phrase Frame motion. Craft the shot.) surfaces word by word. The background is an editor-style dot grid
//   (radial fade) + top light + horizon light band, with a cold-light reflection below the braces.
// - Opening: at frame 0 there is already a blinking input caret at the center of the frame (editor feel, not an empty frame); at 6f the caret is replaced by a pair of adjacent 0.4x small braces
//   '{}' with a hard cut (the symbol is just there, no fade-in), first establishing "this is a pair of braces".
// - Main action: from 14f a physical spring ex (damping 14 / stiffness 130: in place ~8f after launch, overshoot peak ≈9% at ~11f, one rebound);
//   sc = mix(0.4, 1, ex), curtain half-width x = (HALF−inner edge)·ex·sc, displacement and scale multiplied together (the scaling itself also pushes the braces apart);
//   brace center = ±(x + inner edge·sc), the text clip width = 2x, strictly bound to the braces' inner edges, the braces and the text share the same sc. The braces get directional motion blur by horizontal speed, 0 once settled.
// - Aftermath: after settling the letter-spacing relaxes −0.05em → −0.03em (a breath out), the brace bloom falls back from its peak; the eyebrow and subtitle enter afterwards.
//
// Timeline (30fps, 120f total):
//   0–6     caret blinks (center, present from frame 0)
//   6–14    small braces '{}' appear with a hard cut, rest 8f
//   14–38   spring open: spring in place at ~22f, overshoot peak ≈9% at ~25f, converged by ~38f; the text is "pulled" out from the middle
//   40–64   relax: letter-spacing −0.05→−0.03em (smooth), bloom falls back
//   44–80   eyebrow enters with tracking tightening (44f), subtitle surfaces word by word (from 54f)
//   80–120  hold: whole frame pushes forward very slowly 1→1.012
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, FONT, SpeedBlur, mix, ramp } from '../../../shared/fixtures/Polish';
import { LOOKS, Stage, TextReveal, alpha, glow, springAt, type } from '../../../shared/fixtures/Look';
import { BRAND, PITCH } from '../../../shared/fixtures/Brand';

export const BRACE_EXPAND_DURATION = 120;

const L = LOOKS.midnight;
const CY = 520; // title midline
const HALF = 676; // final half-distance of the brace centers (px)
const BRACE_FS = 300; // final brace font size
const BRACE_INNER = 64; // distance from the brace glyph center to its inner edge (×sc), the clip starts from here
const TITLE = BRAND.name; // wordmark is all lowercase
const TITLE_FS = 164; // text width ≈ inner cavity width 2·(HALF−inner edge): only fully revealed when the curtain is pulled all the way (change HALF or font size together when changing the copy)
const APPEAR = 6;
const EXPAND = 14;

const expandAt = (f: number) => (f < EXPAND ? 0 : springAt(f, EXPAND, { damping: 14, stiffness: 130 }));
// Curtain half-width x = (HALF − inner edge)·ex·sc; brace center = ±(x + inner edge·sc): at ex=0 the two braces' inner edges touch to form "{}"
const braceX = (f: number) => {
  const ex = expandAt(f);
  return (HALF - BRACE_INNER) * ex * mix(0.4, 1, ex);
};

const Brace: React.FC<{ ch: string; x: number; sc: number; v: number; glowK: number }> = ({ ch, x, sc, v, glowK }) => (
  <SpeedBlur vx={v} amount={0.22} max={16}>
    <div style={{
      position: 'absolute', left: 960 + x, top: CY, transform: `translate(-50%, -52%) scale(${sc.toFixed(4)})`,
      fontFamily: FONT.mono, fontSize: BRACE_FS, fontWeight: 500, lineHeight: 1, color: L.accent,
      textShadow: glow(L.accent, 0.5 + 0.5 * glowK),
    }}>{ch}</div>
  </SpeedBlur>
);

export const BraceExpand: React.FC = () => {
  const frame = useCurrentFrame();
  const on = frame >= APPEAR;
  const ex = expandAt(frame);
  const sc = mix(0.4, 1, ex);
  const x = braceX(frame);
  const v = braceX(frame + 0.5) - braceX(frame - 0.5); // brace horizontal speed (px/frame)

  // Text reveal width: strictly bound to the braces' inner edges (= 2x), 14px feather on both sides (follows when narrow)
  const clipW = Math.max(0, 2 * x);
  const bx = x + BRACE_INNER * sc; // brace center
  const feather = Math.min(14, clipW / 4);
  const mask = `linear-gradient(90deg, transparent 0px, #000 ${feather}px, #000 calc(100% - ${feather}px), transparent 100%)`;

  // Letter-spacing relaxes after settling + bloom falls back (the bloom peak follows the overshoot)
  const relax = ramp(frame, 40, 24, EASE.smooth);
  const ls = mix(-0.05, -0.03, relax);
  const glowK = Math.min(1, ex) * (1 - ramp(frame, 34, 30, EASE.out));

  // Caret: blinks during 0–6f
  const caretOn = !on && Math.floor(frame / 3) % 2 === 0;

  const cam = 1 + 0.012 * ramp(frame, 70, 50, EASE.smooth);

  return (
    <AbsoluteFill style={{ background: L.bg[1], overflow: 'hidden' }}>
      <Stage look={L} keyLight={{ x: 0.5, y: 0.02 }} fill={null} horizon={0.66} breathe={0.4}>
        {/* Editor dot grid: 32px lattice, bright at the center, fading out around */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(circle, ${alpha('#a9bcff', 0.16)} 1.4px, transparent 1.8px)`,
          backgroundSize: '32px 32px', backgroundPosition: '16px 8px',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 55% at 50% 48%, #000 0%, rgba(0,0,0,0.35) 55%, transparent 85%)',
          maskImage: 'radial-gradient(ellipse 60% 55% at 50% 48%, #000 0%, rgba(0,0,0,0.35) 55%, transparent 85%)',
        }} />
        {/* Cold-light reflection band below the braces (widens as they spring open) */}
        <div style={{
          position: 'absolute', left: 960 - (x + 120), width: 2 * (x + 120), top: CY + 150, height: 90,
          background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${alpha(L.accent, 0.22 * Math.min(1, ex))} 0%, ${alpha(L.accent, 0)} 70%)`,
        }} />
      </Stage>

      <div style={{ position: 'absolute', inset: 0, transform: `scale(${cam.toFixed(5)})`, transformOrigin: `50% ${CY}px` }}>
        {/* Eyebrow: monospace comment */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: CY - 248, textAlign: 'center', color: L.accent2,
          ...type(32, 500, { mono: true }), letterSpacing: `${mix(0.5, 0.08, ramp(frame, 44, 20, EASE.snappy)).toFixed(3)}em`,
          opacity: ramp(frame, 44, 14, EASE.out),
        }}>// shot recipes for your agent</div>

        {/* Title: clip width bound to the brace spacing (curtain feel, not fade-in / typing) */}
        {on && (
          <div style={{
            position: 'absolute', left: 960 - clipW / 2, width: clipW, top: CY - 110, height: 220, overflow: 'hidden',
            WebkitMaskImage: mask, maskImage: mask,
          }}>
            <div style={{
              position: 'absolute', left: clipW / 2, top: 110, transform: `translate(-50%, -54%) scale(${sc.toFixed(4)})`,
              fontFamily: FONT.sans, fontSize: TITLE_FS, fontWeight: 800, letterSpacing: `${ls.toFixed(4)}em`, lineHeight: 1,
              whiteSpace: 'nowrap',
              backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #e8eeff 55%, #a9b9e8 100%)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', paddingBottom: 8,
            }}>{TITLE}</div>
          </div>
        )}

        {on && <Brace ch="{" x={-bx} sc={sc} v={-v} glowK={glowK} />}
        {on && <Brace ch="}" x={bx} sc={sc} v={v} glowK={glowK} />}

        {/* Opening caret */}
        {caretOn && (
          <div style={{
            position: 'absolute', left: 960 - 4, top: CY - 60, width: 8, height: 120, borderRadius: 2,
            background: L.accent, boxShadow: glow(L.accent, 0.6),
          }} />
        )}

        {/* Subtitle */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: CY + 170, textAlign: 'center', color: L.ink2, ...type(44, 450) }}>
          <TextReveal text={PITCH.en.motto} by="word" variant="blur" start={54} each={16} gap={3} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
