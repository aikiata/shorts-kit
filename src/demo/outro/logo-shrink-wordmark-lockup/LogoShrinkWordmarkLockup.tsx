// logo-shrink-wordmark-lockup: Shrink & Lockup, icon collapses and settles (motion-lab final, ported to native Remotion)
// A big neon notched ring shrinks fast (easeInOut) into a small solid white O at center. At the overshoot brake at the end it swaps to the shorts-kit "Jingke" mark,
// then the icon shifts left to make room, and the letters of the wordmark shorts-kit slide in one by one left to right (opacity + 8px) to complete the lockup,
// and an accent-color tagline fades in as a full line at the end. Design coordinates are 480×270 (DesignStage scales up proportionally; zoom rasterization keeps glyph edges sharp).
// Texture upgrade: the background is a hue-tinted dark field plus a purple energy glow that collapses together with the ring;
// during the shrink the double arc rotates while it shrinks (decelerating rotation, 150°), the fast segment drags two layers of scale ghosts as motion blur; one thin shockwave ring (once only) fires at the braking moment;
// letters slide in with a 2.5px→0 focus blur; the tagline is now a cool purple in the same family as the neon, no longer the clashing red.
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { DesignStage, E, lerp, seg, useT } from '../../../shared/fixtures/Motion';
import { FONT, Grain, Vignette } from '../../../shared/fixtures/Polish';
import { BRAND, PITCH, ShortKitMark } from '../../../shared/fixtures/Brand';

export const LOGO_SHRINK_WORDMARK_LOCKUP_DURATION = 132; // 4400ms @30fps

const ACCENT = '#9d94ff'; // Tagline accent color: same hue as the neon glow, brightened and desaturated
const WORDMARK = BRAND.name; // Wordmark is all lowercase
const ICON = 30; // Icon base size (px)
const MARK = 32; // Mark size: the viewfinder body ≈ 0.81×MARK ≈ 26px, exactly covers the healed ring
const WORD_W = 172; // Measured width of the wordmark row (22px / 700, 15 characters; measured from a rendered frame)
const GAP = 9; // Gap between icon and wordmark
// The icon's left offset in the lockup is coupled to the left edge of the letter row: the whole group (icon + gap + wordmark) is centered in frame
const SHIFT = -(ICON + GAP + WORD_W) / 2 + ICON / 2;
const ROW_LEFT = SHIFT + ICON / 2 + GAP; // Left edge of the letter row relative to the frame centerline
const STAGGER = (0.7 - 0.46) / WORDMARK.length; // Many letters: derive the interval as (0.7-0.46)/n so all of them have started before 0.7
const DT = 1 / 131; // t increment per frame (132f)

// Circular arc path (angles in degrees, clockwise sweep)
const arcPath = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p = (a: number) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 ${large} 1 ${x1.toFixed(2)},${y1.toFixed(2)}`;
};

// Double-arc group: arc a0-a1 and its opposite (+180°), two arcs forming a notched ring
const Arcs: React.FC<{ a0: number; a1: number; col: string; w: number; blur: number; opacity: number; stroke?: string }> = ({
  a0,
  a1,
  col,
  w,
  blur,
  opacity,
  stroke,
}) => (
  <g opacity={opacity}>
    {[
      [a0, a1],
      [a0 + 180, a1 + 180],
    ].map(([b0, b1], i) => (
      <path
        key={i}
        d={arcPath(15, 15, 10.5, b0, b1)}
        fill="none"
        stroke={stroke ?? col}
        strokeWidth={w}
        strokeLinecap="round"
        style={blur ? { filter: `blur(${blur}px)` } : undefined}
      />
    ))}
  </g>
);

// Main shrink curve: scale 5.4→1 (easeInOut), with a slight 1.06 overshoot brake at the end
const scaleAt = (t: number) => {
  const k = seg(t, 0.02, 0.28, E.inOutCubic);
  const brake = Math.sin(seg(t, 0.26, 0.37) * Math.PI) * 0.06;
  return lerp(k, 5.4, 1) * (1 + brake);
};
// Spin during the shrink: decelerating 150° (the gap "tightens" as it shrinks), invisible once healed
const spinAt = (t: number) => -150 * seg(t, 0.0, 0.3, E.outCubic);

export const LogoShrinkWordmarkLockup: React.FC = () => {
  const t = useT();
  const s = scaleAt(t);
  const spin = spinAt(t);
  // Shift left to make room: t 0.34-0.47 after landing
  const shift = seg(t, 0.34, 0.47, E.inOutCubic) * SHIFT;
  // Neon notched state → solid white O cross-fade (progresses with the shrink)
  const heal = seg(t, 0.10, 0.28, E.inOutQuad);
  // White O → shorts-kit mark: cross-fade at the landing brake (same beat as the shockwave); the swap happens at the final size
  const markIn = seg(t, 0.24, 0.32, E.inOutQuad);
  // Scale ghost: intensity from the per-frame scale delta, 0 when still
  const ds = Math.abs(scaleAt(t) - scaleAt(t - DT));
  const trail = Math.min(1, ds / 0.35);
  // Shockwave: one thin ring fires at the brake rebound (t≈0.28), expands and dissipates
  const wave = seg(t, 0.28, 0.46, E.outCubic);
  // Energy glow: covers the big ring at the start, collapses and shrinks with it, then settles into a faint glow behind the icon after landing
  const haloR = lerp(seg(t, 0.02, 0.3, E.inOutCubic), 150, 34);
  const haloA = 0.5 - 0.32 * seg(t, 0.3, 0.5, E.outCubic);

  // The outer layer only handles translation + scale; the ring rotates in the inner layer. The mark itself never rotates (brand rule: the bevel angle never changes)
  const icon = (sc: number, rot: number, opacity: number, ghost = false) => (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: ICON,
        height: ICON,
        margin: `${-ICON / 2}px 0 0 ${-ICON / 2}px`,
        transform: `translateX(${shift}px) scale(${sc})`,
        opacity,
      }}
    >
      <svg viewBox="0 0 30 30" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', transform: `rotate(${rot}deg)` }}>
        {/* Neon halo (with gap) */}
        <Arcs a0={-32} a1={122} col="rgba(118,96,255,.62)" w={6.5} blur={2.5} opacity={1 - heal} />
        {/* Neon core: turns pure white once the heal is past halfway */}
        {!ghost && (
          <Arcs a0={-32} a1={122} col="#dfe9ff" w={3.4} blur={0} opacity={(1 - heal * 0.75) * (1 - markIn)} stroke={heal > 0.5 ? '#fff' : '#dfe9ff'} />
        )}
        {/* Solid white O after healing (transitional state, yields to the mark at the brake) */}
        {!ghost && <circle cx={15} cy={15} r={10.5} fill="none" stroke="#fff" strokeWidth={5.5} opacity={heal * (1 - markIn)} />}
      </svg>
      {/* Standard state after healing: shorts-kit mark (reversed-out version, no glow) */}
      {!ghost && markIn > 0 && (
        <ShortKitMark size={MARK} tone="dark" style={{ position: 'absolute', left: (ICON - MARK) / 2, top: (ICON - MARK) / 2, opacity: markIn }} />
      )}
    </div>
  );

  // Base color calibration: the original sample mp4 (yuv420p, no color metadata) decodes #05060a back to rgb(3,5,9); here a hue-tinted dark field is used instead
  return (
    <AbsoluteFill>
    <DesignStage bg="#06070c" raster="zoom">
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Dark field: cool vertical gradient, slightly brighter at the top */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0d0f17 0%, #07080d 60%, #05060a 100%)' }} />
        {/* Energy glow (collapses with the big ring) */}
        <div
          style={{
            position: 'absolute',
            left: `calc(50% + ${shift}px - ${haloR}px)`,
            top: `calc(50% - ${haloR}px)`,
            width: haloR * 2,
            height: haloR * 2,
            borderRadius: '50%',
            opacity: haloA,
            background: 'radial-gradient(circle, rgba(110,92,255,0.42) 0%, rgba(110,92,255,0.12) 38%, rgba(110,92,255,0) 70%)',
          }}
        />
        {/* Shockwave: thin bright ring + outer soft glow, thinner and fainter as it expands */}
        {wave > 0 && wave < 1 && (
          <div
            style={{
              position: 'absolute',
              left: `calc(50% - ${lerp(wave, 16, 70)}px)`,
              top: `calc(50% - ${lerp(wave, 16, 70)}px)`,
              width: lerp(wave, 32, 140),
              height: lerp(wave, 32, 140),
              borderRadius: '50%',
              boxSizing: 'border-box',
              border: `${lerp(wave, 0.9, 0.25)}px solid rgba(214,220,255,${(0.55 * (1 - wave)).toFixed(3)})`,
              boxShadow: `0 0 ${lerp(wave, 4, 10)}px rgba(130,112,255,${(0.45 * (1 - wave)).toFixed(3)})`,
            }}
          />
        )}
        {/* Scale ghost (only in the fast segment): scale and angle from 1f and 2f earlier */}
        {trail > 0.02 && icon(scaleAt(t - 2 * DT), spinAt(t - 2 * DT), 0.16 * trail, true)}
        {trail > 0.02 && icon(scaleAt(t - DT), spinAt(t - DT), 0.3 * trail, true)}
        {/* Icon: SVG double-arc notched ring (performance state) → on shrink the gap heals and cross-fades into the shorts-kit mark (standard state) */}
        {icon(s, spin, 1)}
        {/* Letter row (right of the icon): left-to-right stagger, opacity 0→1 + translateX 8px→0 + focus blur */}
        <div
          style={{
            position: 'absolute',
            left: `calc(50% + ${ROW_LEFT}px)`,
            top: '50%',
            height: ICON,
            marginTop: -ICON / 2,
            display: 'flex',
            alignItems: 'center',
            gap: 0,
          }}
        >
          {[...WORDMARK].map((ch, i) => {
            const lk = seg(t, 0.46 + i * STAGGER, 0.46 + i * STAGGER + 0.10, E.outCubic);
            return (
              <span
                key={i}
                style={{
                  color: '#f3f5fb',
                  font: `700 22px/1 ${BRAND.font}`,
                  letterSpacing: 0.66, // Wordmark +0.03em
                  whiteSpace: 'pre',
                  opacity: lk,
                  transform: `translateX(${lerp(lk, 8, 0)}px)`,
                  filter: lk < 0.999 ? `blur(${lerp(lk, 2.5, 0).toFixed(2)}px)` : undefined,
                  textShadow: '0 0 12px rgba(150,140,255,0.18)',
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
        {/* Accent-color tagline (brand motto): delayed full-line fade-in, moving up 3px as it settles */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 'calc(50% + 34px)',
            textAlign: 'center',
            color: ACCENT,
            font: `600 12.5px/1 ${FONT.sans}`,
            letterSpacing: 2.6, // 29 characters: letter spacing 4.6→2.6 so the width matches the lockup
            opacity: seg(t, 0.72, 0.84, E.outQuad),
            transform: `translateY(${lerp(seg(t, 0.72, 0.86, E.outCubic), 3, 0)}px)`,
          }}
        >
          {PITCH.en.motto.toUpperCase()}
        </div>
      </div>
    </DesignStage>
    {/* Vignette and grain sit outside the design coordinates, laid at native 1920 pixels so the grain is not zoomed into blobs */}
    <Vignette strength={0.55} inner={0.4} color="#000000" />
    <Grain opacity={0.07} blend="soft-light" />
    </AbsoluteFill>
  );
};
