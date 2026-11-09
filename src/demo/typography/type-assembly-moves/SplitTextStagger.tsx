// Per-letter mask rise (split-text-stagger): the idiomatic GSAP SplitText entrance.
// The title "FRAME MOTION." (first half of the shorts-kit brand phrase) is split into a span per character, each wrapped in an overflow:hidden line-height box,
// the inner part rises from translateY(115%) to 0, 14f each with Easing.out(cubic), with a 10% overshoot
// then 6f settling back (the original plan had 6% overshoot, raised to 10% for the perceptibility floor). delay = character index×2f.
// A thin baseline at the bottom grows from left to right on the same frame the first letter starts, hinting that a crop line exists.
// Keyframes: 0–12 empty hold → 12 first letter starts + baseline starts growing → each letter starts at 12+i*2,
// 14f up to -10% overshoot → 6f settle back to 0 → last letter (index 12) settles at 56f →
// 56–130 fully still (74f ≥ 40f, no per-frame noise layer).
//
// Quality upgrade: removed the debug title; soft-glow Backdrop; system SF stack 700, font size 120→136;
// the fast rising segment adds a y-direction motion blur by each letter's vertical speed (0 at rest); the baseline changes to the accent color, exactly as wide as the text row,
// growth uses a strong ease-out; added an exported duration of 130f (the original workbench inferred 56f, cutting away right as the last letter settled).
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../../shared/fixtures/Fixtures';
import { Backdrop, EASE, FONT as PFONT, ramp } from '../../../shared/fixtures/Polish';

export const SPLIT_TEXT_STAGGER_DURATION = 130;

const TEXT = 'FRAME MOTION.'; // first half of the brand phrase Frame motion. Craft the shot. (13 characters, same length as the original)
const START = 12; // frame where the first letter starts
const RISE = 14; // rise duration
const SETTLE = 6; // overshoot settle-back duration
const OVERSHOOT = -10; // overshoots to -10% (original plan 6%, raised)
const FONT = 136;
const LINE_H = 1.05; // span line height (translateY percentages are based on this)

// Per-character vertical displacement (%): 115 → -10 (out cubic) → 0 (out quad), frame-deterministic
const charY = (f: number, idx: number): number => {
  const t0 = START + idx * 2;
  if (f < t0 + RISE) {
    return interpolate(f, [t0, t0 + RISE], [115, OVERSHOOT], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });
  }
  return interpolate(f, [t0 + RISE, t0 + RISE + SETTLE], [OVERSHOOT, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
};

export const SplitTextStagger: React.FC = () => {
  const frame = useCurrentFrame();
  const chars = TEXT.split('');
  // Baseline: starts on the same frame the first letter starts, grows from left to right to 100%
  const lineW = ramp(frame, START, 30, EASE.snappy) * 100;

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden' }}>
      <Backdrop tone="light" light={{ x: 0.42, y: 0.3 }} accent="#5b63d3" grain={0.045} vignette={0.12} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Row container: baseline is as wide as the text row */}
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex' }}>
            {chars.map((c, i) => {
              const y = charY(frame, i);
              // Vertical speed (px/frame) → y-direction blur
              const vy = Math.abs(charY(frame + 0.5, i) - charY(frame - 0.5, i)) * FONT * LINE_H * 0.01;
              const blur = Math.min(10, vy * 0.32);
              const id = `sts-vb-${i}`;
              return (
                <div
                  key={i}
                  style={{
                    // Mask box: 0.3em of headroom above to hold the overshoot, the bottom edge is the crop line
                    overflow: 'hidden',
                    height: FONT * 1.35,
                    display: 'flex',
                    alignItems: 'flex-end',
                  }}
                >
                  {blur > 0.3 && (
                    <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden>
                      <filter id={id} x="-10%" y="-50%" width="120%" height="200%">
                        <feGaussianBlur stdDeviation={`0 ${blur.toFixed(2)}`} />
                      </filter>
                    </svg>
                  )}
                  <span
                    style={{
                      display: 'inline-block',
                      fontFamily: PFONT.sans,
                      fontWeight: 700,
                      fontSize: FONT,
                      lineHeight: LINE_H,
                      color: G.ink1,
                      letterSpacing: '-0.015em',
                      transform: `translateY(${y.toFixed(3)}%)`,
                      filter: blur > 0.3 ? `url(#${id})` : undefined,
                    }}
                  >
                    {c === ' ' ? '\u00a0' : c}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Thin baseline: width grows from 0 to the full text width (accent color, hints at the crop line) */}
          <div style={{ marginTop: 12, height: 3, display: 'flex' }}>
            <div
              style={{
                height: 3,
                width: `${lineW.toFixed(3)}%`,
                borderRadius: 2,
                background: `linear-gradient(90deg, ${G.accent}, #7c83e6)`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
