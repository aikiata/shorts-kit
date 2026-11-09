// before-after-slider-scrub: before/after comparison slider
// Two versions of FakeDashboard stacked: before = low-contrast gray veil ("before processing"), after = normal and sharp.
// A vertical divider bar with a round handle: flicks fast from 8% at the left edge to 70% (overshoots to 76% and bounces back),
// then sweeps back slowly and stops at 40%. The after layer is revealed where the bar passes (clip-path inset follows the bar x).
// The speed contrast of fast flick then slow sweep is the key to the rhythm. Fully still after f=110 (40f).
//
// Quality upgrade: before changed from a "grayscale + gray overlay" self-sabotage into a believable unprocessed state (slight defocus + desaturation + low-contrast haze);
// corner badges are now real Before / After pills, each living inside its own layer and clipped together with the divider; the bar is now a 2px white line +
// hairline stroke + soft shadows on both sides, the handle is a white round knob with an inner highlight + vector double arrows; a 4f anticipation pull-back before the fast flick, and on the flick the handle
// stretches horizontally with speed + directional motion blur, returning to zero once settled.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { G, FakeDashboard } from '../../../shared/fixtures/Fixtures';
import { EASE, FONT, Grain, SpeedBlur, mix, ramp, softShadow, tracking, velocity } from '../../../shared/fixtures/Polish';

export const BEFORE_AFTER_SLIDER_SCRUB_DURATION = 150; // 110f of motion + 40f of true stillness

// Timeline (bar position as a percentage of frame width)
const PRE = 10; // Anticipation: 10→14 pulls back left by 1.5% ("wind-up" before the flick)
const T0 = 14; // Flick start
const FLING = 26; // Fast flick: 14→26 (12f to reach 76%)
const BOUNCE = 38; // Bounce: 26→38 settles at 70%
const HOLD = 56; // Pause to read
const SCRUB = 104; // Slow sweep: 56→104 (48f back to 40%), about 1/5 the speed of the flick

const posAt = (f: number): number => {
  if (f < T0) return mix(8, 6.5, ramp(f, PRE, T0 - PRE, EASE.smooth));
  if (f < FLING) return mix(6.5, 76, ramp(f, T0, FLING - T0, EASE.out));
  if (f < BOUNCE) return mix(76, 70, ramp(f, FLING, BOUNCE - FLING, EASE.smooth));
  if (f < HOLD) return 70;
  return mix(70, 40, ramp(f, HOLD, SCRUB - HOLD, EASE.smooth));
};

const W = 1920;
const H = 1080;

// Badge pills: placed in the empty middle of the top bar (not covering card title/sidebar); before is white background with dark text, after is dark background with white text + accent dot
const Tag: React.FC<{ label: string; x: number; accent?: boolean; muted?: boolean }> = ({ label, x, accent, muted }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: 15,
      height: 42,
      padding: '0 18px 0 15px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      borderRadius: 21,
      background: accent ? G.ink1 : 'rgba(255,255,255,0.88)',
      border: accent ? '1px solid rgba(255,255,255,0.08)' : `1px solid ${G.hairlineStrong}`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,${accent ? 0.12 : 0.9}), ${softShadow(accent ? 10 : 4)}`,
      fontFamily: FONT.sans,
      fontSize: 20,
      fontWeight: 600,
      letterSpacing: tracking(20, false),
      color: accent ? '#ffffff' : muted ? G.ink2 : G.ink1,
      whiteSpace: 'nowrap',
    }}
  >
    <span
      style={{
        width: 9,
        height: 9,
        borderRadius: 5,
        background: accent ? '#8f96f0' : G.ink3,
        boxShadow: accent ? '0 0 0 3px rgba(143,150,240,0.22)' : 'none',
      }}
    />
    {label}
  </div>
);

export const BeforeAfterSliderScrub: React.FC = () => {
  const frame = useCurrentFrame();
  const p = posAt(frame); // bar position %
  const x = (p / 100) * W;

  // Speed (px/frame): drives handle stretch and motion blur, 0 when still
  const vx = velocity((f) => (posAt(f) / 100) * W, frame);
  const speed = Math.abs(vx);
  const squish = 1 + Math.min(speed / 110, 1) * 0.18; // peak 1.18
  const press = 1 - 0.06 * Math.sin(Math.PI * ramp(frame, PRE, FLING - PRE, EASE.linear)); // handle is "pinched" and shrinks slightly during the flick

  return (
    <AbsoluteFill style={{ background: G.bg, overflow: 'hidden' }}>
      {/* before: believable "before processing": slight defocus + desaturation + low contrast, with a warm gray haze on top */}
      <div style={{ position: 'absolute', inset: 0, filter: 'blur(1.6px) saturate(0.18) contrast(0.72) brightness(1.04)' }}>
        <FakeDashboard variant="A" />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(214,212,206,0.30), rgba(196,194,188,0.38))' }} />
      <Tag label="Before" x={1372} muted />

      {/* after: normal sharp version, revealed on the left of the bar; the After badge lives in this layer and is clipped along with the divider */}
      <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${W - x}px 0 0)` }}>
        <FakeDashboard variant="A" />
        {/* x shifted right to clear the breadcrumb (shorts-kit › Overview) that grew longer after FakeDashboard branding; ~20px left on each side (period toggle / divider when settled) */}
        <Tag label="After" x={646} accent />
      </div>

      {/* Reveal edge: a very faint 24px contact shadow on the after side so the two layers have depth order (clipped inside after) */}
      <div
        style={{
          position: 'absolute',
          left: x - 24,
          top: 0,
          width: 24,
          height: H,
          background: 'linear-gradient(90deg, rgba(16,18,26,0), rgba(16,18,26,0.07))',
        }}
      />

      {/* Divider bar + round handle: on the fast flick the handle stretches horizontally with speed, and the bar and handle get directional motion blur together */}
      <SpeedBlur vx={vx} amount={0.12} max={14}>
        {/* Divider bar: 2px white line + hairline stroke + soft shadows on both sides */}
        <div
          style={{
            position: 'absolute',
            left: x - 1,
            top: 0,
            width: 2,
            height: H,
            background: '#ffffff',
            boxShadow: '0 0 0 1px rgba(16,18,26,0.10), 0 0 22px rgba(16,18,26,0.22)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: x - 38,
            top: H / 2 - 38,
            width: 76,
            height: 76,
            borderRadius: 38,
            background: 'linear-gradient(180deg, #ffffff, #f4f4f2)',
            border: `1px solid ${G.hairlineStrong}`,
            boxShadow: `inset 0 1px 0 #ffffff, ${softShadow(14 + Math.min(speed / 8, 18))}`,
            transform: `scale(${press * squish}, ${press})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
          }}
        >
          <svg width={36} height={20} viewBox="0 0 36 20" style={{ display: 'block' }}>
            <path d="M11 3 L4 10 L11 17" fill="none" stroke={G.ink2} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M25 3 L32 10 L25 17" fill="none" stroke={G.ink2} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </SpeedBlur>

      <Grain opacity={0.04} />
    </AbsoluteFill>
  );
};
