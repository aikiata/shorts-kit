// segmented-thumb-hero: the segmented control's thumb displacement as the narrative hero, shot in close-up
// Source: perplexity-promo 2.3–5s. A capsule segmented control (Ask/Computer) floats in with a shadow,
// an oversized outlined arrow cursor slides in from off-screen and clicks, the white thumb slides left→right with ~8f ease-out,
// and at the moment of arrival a small icon pops up before the new option while the old icon retracts.
// Texture upgrade: soft-light paper base + vignette grain; the track becomes a recessed groove (inner shadow + hairline), the thumb is a lit raised piece
// (top-edge highlight + near-solid far-soft two-layer shadow); within the thumb's 8f the leading edge goes first and the trailing edge follows, a rubber-band stretch + speed trail,
// and after arrival a 1.5% overshoot rebound; the segment label colors transition continuously with the thumb position; the new icon carries an accent-color smile;
// the cursor start moves to truly off-screen, with two-layer shadow; the ripple becomes a thin accent-color ring. Timeline unchanged.
// Brand pass: the two segments change from Perplexity's Ask / Computer to shorts-kit's Prompt → Film
// ("one sentence makes a film"), the icons change to a chat bubble / a clapperboard with a smile, geometry and timeline untouched.
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig } from 'remotion';
import { G } from '../../../shared/fixtures/Fixtures';
import { Backdrop, FONT, SpeedBlur, mix, velocity } from '../../../shared/fixtures/Polish';

export const SEGMENTED_THUMB_HERO_DURATION = 110; // float-in 18f + cursor 24f + click + slide 8f + pop-up + hold 50f

const INK = G.ink1;
const DIM = '#8e9097';

// oversized outlined arrow cursor (white core with ink outline, two-layer shadow: near-ground solid, far-ground soft)
const ArrowCursor: React.FC<{ x: number; y: number; press: number }> = ({ x, y, press }) => (
  <svg
    width={130}
    height={150}
    viewBox="0 0 26 30"
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: `scale(${1 - press * 0.14})`,
      transformOrigin: '15% 10%',
      filter: `drop-shadow(0 ${2 - press}px ${3 - press}px rgba(16,18,24,0.22)) drop-shadow(0 ${12 - press * 6}px ${18 - press * 6}px rgba(16,18,24,0.20))`,
    }}
  >
    <path
      d="M4 2 L4 24 L9.5 18.5 L13 27 L16.8 25.4 L13.3 17 L21 17 Z"
      fill="#fff"
      stroke={INK}
      strokeWidth={1.6}
      strokeLinejoin="round"
    />
  </svg>
);

// new identity icon: a clapperboard with an expression (the expression uses the single accent color, half of the "reward feel")
const SmileClapper: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <rect x={6} y={15.5} width={28} height={19} rx={3.5} fill="none" stroke={INK} strokeWidth={2.8} />
    <g transform="rotate(-14 6 13)">
      <rect x={6} y={6.5} width={28} height={6.5} rx={1.5} fill="none" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
      <path d="M14 6.5 L17.5 13 M22.5 6.5 L26 13" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
    </g>
    <circle cx={15.5} cy={22} r={1.9} fill={G.accent} />
    <circle cx={24.5} cy={22} r={1.9} fill={G.accent} />
    <path d="M14.8 26.2 Q20 30.4 25.2 26.2" stroke={G.accent} strokeWidth={2.5} fill="none" strokeLinecap="round" />
  </svg>
);

// old identity icon: a chat bubble (one prompt), with two lines of "text" inside
const PromptIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <path d="M9 8.5 H31 a3.5 3.5 0 0 1 3.5 3.5 V24 a3.5 3.5 0 0 1 -3.5 3.5 H19 L12 33 V27.5 H9 a3.5 3.5 0 0 1 -3.5 -3.5 V12 a3.5 3.5 0 0 1 3.5 -3.5 Z"
      fill="none" stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
    <path d="M12 15 H28 M12 21 H22" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
  </svg>
);

// color interpolation (#rrggbb)
const lerpHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
};

export const SegmentedThumbHero: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---- timeline ----
  const FLOAT_IN = 0; // control floats in 0–18
  const CURSOR_IN = 20; // cursor slides in 20–44
  const CLICK = 48; // press
  const SLIDE = 52; // thumb starts sliding 52–60 (~8f)
  const SLIDE_END = 60;

  // control float-in: spring float-in from 200px below with a shadow
  const floatT = spring({ frame: frame - FLOAT_IN, fps, config: { damping: 14, stiffness: 120, mass: 0.9 } });
  const ctrlY = interpolate(floatT, [0, 1], [200, 0]);

  // control geometry (close-up size)
  const CW = 1080; // control width
  const CH = 220;
  const PAD = 16;
  const SEGW = (CW - PAD * 2) / 2;
  const TH = CH - PAD * 2; // thumb height

  // cursor slide-in: ease-out drifts from off-screen at the lower right (the whole cursor outside the frame) onto the Film segment
  const curT = interpolate(frame, [CURSOR_IN, CURSOR_IN + 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const curX = interpolate(curT, [0, 1], [2020, 1210]);
  const curY = interpolate(curT, [0, 1], [1200, 590]);
  // click point = cursor tip (svg (4,2)×5 → +20,+10), converted to the control's padding-box coordinates (control top-left (420,430), 1px border)
  const TIP = { x: 1210 + 20 - 420 - 1, y: 590 + 10 - 430 - 1 };
  // press action
  const press = interpolate(frame, [CLICK, CLICK + 3, CLICK + 7], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // thumb displacement: ~8f ease-out (main curve), leading edge slightly faster, trailing edge slightly slower → stretched ~10% mid-slide, retracts on arrival;
  // after arrival a 1.5% overshoot rebound (converges within 6f), giving "settling" a physical feel
  const slide = (f: number, ease: (x: number) => number) =>
    interpolate(f, [SLIDE, SLIDE_END], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const thumbT = slide(frame, Easing.out(Easing.cubic));
  const settle = (f: number) =>
    f < SLIDE_END ? 0 : 0.015 * Math.sin(Math.min(1, (f - SLIDE_END) / 6) * Math.PI) * (1 - Math.min(1, (f - SLIDE_END) / 6));
  const leadAt = (f: number) => slide(f, Easing.out(Easing.poly(4))) + settle(f);
  const trailAt = (f: number) => slide(f, Easing.out(Easing.quad)) + settle(f);
  const thumbL = PAD + trailAt(frame) * SEGW; // trailing edge (left)
  const thumbR = PAD + SEGW + leadAt(frame) * SEGW; // leading edge (right)
  const thumbV = velocity((f) => PAD + slide(f, Easing.out(Easing.cubic)) * SEGW, frame);

  // at the moment of arrival: the Film icon pops out (overshoot), the Prompt icon retracts
  const iconIn = spring({ frame: frame - SLIDE_END, fps, config: { damping: 10, stiffness: 220, mass: 0.6 } });
  const filmScale = frame >= SLIDE_END ? iconIn : 0;
  const askScale = interpolate(frame, [SLIDE, SLIDE + 6], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });

  // click ripple
  const rippleT = interpolate(frame, [CLICK, CLICK + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  const labelStyle = (activeAmt: number): React.CSSProperties => ({
    fontFamily: FONT.sans,
    fontWeight: 650,
    fontSize: 72,
    letterSpacing: '-0.025em',
    color: lerpHex(DIM, INK, activeAmt),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
    width: SEGW,
    height: TH,
    position: 'relative',
    zIndex: 2,
  });

  // label activation follows the thumb position continuously (no longer a hard color jump at 0.5)
  const compAmt = Math.min(1, Math.max(0, (thumbT - 0.2) / 0.6));

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Backdrop tone="light" light={{ x: 0.5, y: 0.3 }} accent={G.accent} />
      {/* contact light pool beneath the control: after the float-in settles it "places" the control on the tabletop */}
      <div
        style={{
          position: 'absolute',
          left: 960 - 700,
          top: 540 + 40,
          width: 1400,
          height: 260,
          background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 70%)',
          opacity: floatT,
        }}
      />
      {/* segmented control: recessed track */}
      <div
        style={{
          width: CW,
          height: CH,
          borderRadius: CH / 2,
          background: 'linear-gradient(180deg, #e2e2df 0%, #e9e9e6 100%)',
          border: '1px solid rgba(20,22,28,0.09)',
          boxShadow: [
            'inset 0 2px 5px rgba(16,18,24,0.08)',
            'inset 0 -1px 0 rgba(255,255,255,0.7)',
            '0 1px 0 rgba(255,255,255,0.9)',
            `0 ${mix(30, 14, floatT).toFixed(1)}px ${mix(80, 44, floatT).toFixed(1)}px -18px rgba(16,18,24,${mix(0.32, 0.2, floatT).toFixed(3)})`,
          ].join(', '),
          transform: `translateY(${ctrlY}px)`,
          opacity: Math.min(1, floatT * 1.5),
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          padding: PAD,
          boxSizing: 'border-box',
        }}
      >
        {/* white thumb: a lit raised piece; mid-slide the leading and trailing edges separate to form the stretch + speed trail */}
        <SpeedBlur vx={thumbV} amount={0.06} max={6} style={{ zIndex: 1 }}>
          <div
            style={{
              position: 'absolute',
              left: thumbL,
              top: PAD,
              width: thumbR - thumbL,
              height: TH,
              borderRadius: TH / 2,
              background: 'linear-gradient(180deg, #ffffff 0%, #fbfbfa 100%)',
              boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,1), 0 0 0 1px rgba(20,22,28,0.06), 0 2px 4px rgba(16,18,24,0.08), 0 12px 28px -8px rgba(16,18,24,0.20)',
            }}
          />
        </SpeedBlur>
        {/* click ripple (center locked to the click point, pressed above the thumb) */}
        {rippleT > 0 && rippleT < 1 && (
          <div
            style={{
              position: 'absolute',
              left: TIP.x - 130 * rippleT,
              top: TIP.y - 130 * rippleT,
              width: 260 * rippleT,
              height: 260 * rippleT,
              borderRadius: '50%',
              boxSizing: 'border-box',
              border: `3px solid ${G.accent}`,
              background: 'radial-gradient(circle, rgba(91,99,211,0) 50%, rgba(91,99,211,0.12) 100%)',
              opacity: (1 - rippleT) * 0.9,
              zIndex: 3,
            }}
          />
        )}
        {/* Prompt segment */}
        <div style={labelStyle(1 - compAmt)}>
          <span
            style={{
              display: 'inline-flex',
              transform: `scale(${askScale})`,
              width: askScale < 0.05 ? 0 : 78,
              overflow: 'visible',
            }}
          >
            <PromptIcon size={78} />
          </span>
          Prompt
        </div>
        {/* Film segment */}
        <div style={labelStyle(compAmt)}>
          <span
            style={{
              display: 'inline-flex',
              transform: `scale(${filmScale})`,
              width: filmScale < 0.05 ? 0 : 78,
              overflow: 'visible',
            }}
          >
            <SmileClapper size={78} />
          </span>
          Film
        </div>
      </div>
      <ArrowCursor x={curX} y={curY} press={press} />
    </AbsoluteFill>
  );
};
