// aurora-bloom-bg-flip: Aurora Bloom, aurora rising with a background color flip (motion-lab final converted to native Remotion)
// Purple-orange soft-focus blobs rise from the bottom of a light grey background, then the whole background darkens to near-black within 0.35s and the blobs are pressed down into an afterglow;
// the copy blurs out in sync → swaps to a new line that blurs in (accent color → white color settle), with a gap between the lines and no cross-fade.
// The copy is a narrative turn of shorts-kit (Promos took weeks → Meet shorts-kit); the purple-orange of the blobs/text is the light color of this effect
// itself (the DEEPP constant), and the whole set can be swapped to the project colors when landing.
// Design coordinates 480×270 (DesignStage scales up proportionally), and the parameter table values are calibrated in this coordinate system.
//
// Texture upgrade: the aurora is split into four layers, "main purple + orange core + magenta transition + white blended edge", each with relative drift, so the orange core really shows through;
// at the flip instant the blob group gently contracts (scale −6%), reading as "pressed into an afterglow", and the dark-field afterglow keeps its hue through the magenta transition layer instead of going grey;
// a soft top light in the bright field / a cool sky light in the dark field keep both backgrounds from being dead flat; grain throughout prevents banding in the large gradients.
// Copy: line A pushes in very slowly while at rest (never a dead frame) and floats up with the light on blur-out; line B blurs in with a 6px float-up landing;
// the timeline shifts earlier overall by ≈0.06, line B's color settle completes at t≈0.90, leaving ≈0.5s of finished stillness at the end (in the original the last word stays purple to the end).
import React from 'react';
import { DesignStage, E, lerp, seg, useT } from '../../../shared/fixtures/Motion';
import { EASE, FONT as PF, Grain, Vignette } from '../../../shared/fixtures/Polish';
import { BRAND } from '../../../shared/fixtures/Brand';

export const AURORA_BLOOM_BG_FLIP_DURATION = 156; // 5200ms @30fps

// RGB triplet interpolation → CSS color (effect.js shares mix at file level, inlined here)
const mix = (a: number[], b: number[], k: number) =>
  `rgb(${Math.round(a[0] + (b[0] - a[0]) * k)},${Math.round(a[1] + (b[1] - a[1]) * k)},${Math.round(a[2] + (b[2] - a[2]) * k)})`;
const DEEPP = [124, 92, 255]; // the effect's own light color (deep purple)
const WHITE = [245, 245, 250];
const LIGHT = [236, 236, 236]; // bright-field background color
const DARK = [10, 10, 18]; // dark-field background color
const INK = [22, 23, 28]; // bright-field text (cool-toned near-black)

// Copy (word count / character length stays close to the original "For many years / everything changed"; the word-by-word staggered rhythm depends on this):
// line A has 3 words stating the old pain point, line B has 2 words revealing the brand name (wordmark all lowercase)
const WA = 'Promos took weeks'.split(' ');
const WB = ['Meet', BRAND.name];

// Timeline (normalized t)
const RISE: [number, number] = [0.04, 0.56]; // aurora rises
const FLIP: [number, number] = [0.57, 0.64]; // background color flip ≈0.36s (the make-or-break)
const A_OUT = 0.4; // line A's first word starts blur-out (stagger 0.04, 0.10 each) → finishes at 0.58
const B_IN = 0.7; // line B's first word blur-in (stagger 0.05, 0.11 each); 0.12 ≈ 0.6s with no text

export const AuroraBloomBgFlip: React.FC = () => {
  const t = useT();
  // blob rises + scales up
  const rise = seg(t, RISE[0], RISE[1], E.outCubic);
  const flip = seg(t, FLIP[0], FLIP[1], E.inOutQuad); // fast darkening, deliberately only ~0.35s
  // Blob group gently contracts on flip: the "contraction" of being pressed into an afterglow, with a little damped rebound (overshoot reads as pressed down then steady)
  const squash = seg(t, FLIP[0], FLIP[1] + 0.06, EASE.overshoot);
  // Relative drift of the orange core / magenta layer (different frequencies and phases, so the inside of the blob flows rather than rising and falling as one block)
  const drift = Math.sin(t * Math.PI * 2.2);
  const drift2 = Math.sin(t * Math.PI * 1.6 + 1.1);

  const blob = (style: React.CSSProperties, color: string, stop = 68): React.CSSProperties => ({
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(60px)',
    background: `radial-gradient(circle,${color} 0%,${color.replace(/[\d.]+\)$/, '0)')} ${stop}%)`,
    ...style,
  });

  return (
    <DesignStage bg={mix(LIGHT, DARK, flip)}>
      {/* Soft top light in the bright field (removed on flip) + cool sky light in the dark field (appears after flip), so both backgrounds have directional light */}
      <div
        style={{
          position: 'absolute', inset: 0, opacity: 1 - flip,
          background: 'radial-gradient(ellipse 70% 60% at 50% 8%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute', inset: 0, opacity: flip,
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(70,72,120,0.22) 0%, rgba(70,72,120,0) 70%)',
        }}
      />
      {/* Soft-focus blob group: overall translateY rise + scale up, pressed into an afterglow after flip */}
      <div
        style={{
          position: 'absolute',
          inset: '-10%',
          transform: `translateY(${lerp(rise, 32, -6)}%) scale(${lerp(rise, 1, 1.25) * (1 - 0.06 * squash)})`,
          opacity: lerp(flip, 1, 0.4),
        }}
      >
        {/* Purple main blob */}
        <div style={blob({ left: '8%', bottom: '-45%', width: '90%', height: '85%' }, 'rgba(107,79,224,.85)')} />
        {/* Magenta transition layer: the intermediate color between purple and orange, avoiding a grey band from a hard join of the two */}
        <div
          style={blob(
            { left: '22%', bottom: '-36%', width: '60%', height: '58%', transform: `translateX(${drift2 * 6}%)` },
            'rgba(176,86,170,.6)', 64,
          )}
        />
        {/* Orange core: slow horizontal drift, slightly higher than the main layer, peeks out first when rising */}
        <div
          style={blob(
            { left: '32%', bottom: '-18%', width: '44%', height: '46%', transform: `translateX(${drift * 8}%)` },
            'rgba(217,122,74,.9)', 66,
          )}
        />
        {/* White blended edge: removed in the dark field */}
        <div
          style={{
            ...blob({ left: '-12%', bottom: '-40%', width: '64%', height: '60%' }, 'rgba(255,255,255,.8)', 62),
            opacity: 1 - flip,
          }}
        />
      </div>

      {/* Copy row: flex centered, the two lines each absolutely positioned (centered at the same point, not occupying each other's space) */}
      <div
        style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: PF.sans, fontWeight: 600, fontSize: 26, letterSpacing: '-0.022em',
        }}
      >
        {/* Copy A: very slow push-in at rest, word-by-word blur-out while the blobs rise (floats up with the light as it is swallowed) */}
        <div style={{ position: 'absolute', transform: `scale(${lerp(seg(t, 0, A_OUT + 0.18, EASE.swift), 1, 1.035)})` }}>
          {WA.map((w, i) => {
            const out = seg(t, A_OUT + i * 0.04, A_OUT + 0.1 + i * 0.04, E.inQuad);
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  margin: '0 .16em',
                  color: mix(INK, INK, 0), // bright-field text color
                  opacity: 1 - out,
                  filter: out > 0.005 ? `blur(${out * 8}px)` : 'none',
                  transform: `translateY(${-out * 5}px)`,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
        {/* Copy B after the gap: word-by-word blur-in + float-up landing + purple→white color settle (turns white at the instant of settling = finished) */}
        <div style={{ position: 'absolute' }}>
          {WB.map((w, i) => {
            const d0 = B_IN + i * 0.05;
            const a = seg(t, d0, d0 + 0.11, E.outQuint);
            const c = seg(t, d0 + 0.06, d0 + 0.15, E.outQuad);
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  margin: '0 .16em',
                  opacity: a,
                  filter: a < 0.995 ? `blur(${(1 - a) * 8}px)` : 'none',
                  transform: `translateY(${(1 - a) * 6}px)`,
                  color: mix(DEEPP, WHITE, c),
                  // The purple text before the color settle has a little self-glow, removed after it turns white
                  textShadow: `0 0 ${10 * (1 - c)}px rgba(124,92,255,${(0.45 * a * (1 - c)).toFixed(3)})`,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      </div>

      <Vignette strength={lerp(flip, 0.07, 0.55)} inner={0.45} color="#0c0c16" />
      <Grain opacity={lerp(flip, 0.05, 0.09)} blend="soft-light" scale={0.25} />
    </DesignStage>
  );
};
