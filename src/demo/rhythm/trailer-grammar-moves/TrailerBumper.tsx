// trailer-bumper | front-loaded quick-cut teaser
// The structure is everything: a triple 9f quick cut (A full page / B full page / A middle-column Top pages card in a 2.2x in-your-face close-up) -> 6f pure-black breath
// -> formal opening title fades in with a slight rise over 16f, then freezes. Each quick-cut shot carries a 1->1.04 gentle push-in.
// Truly still ending: after the title tracking settles over 30f (63f), all animation ends and the frame stays still for 77f (>40f).
// Texture: three shots with different composition (wide / page-switch wide / close-up); the close-up magnification uses CSS zoom so it rasterizes at target size (Q2);
// all three shots share lens vignette + grain, as if shot by the same camera; the black is a truly pure-black empty frame (a beat of silence);
// the opening title card is a finished-grade title: soft-light base + eyebrow + main title (shorts-kit lowercase wordmark) + subtitle (brand tagline); while the main title fades in with a slight rise its letter spacing goes from
// 0.05em to -0.012em (the "breathing" of a trailer title), the subtitle follows 6f later, and the whole frame freezes after 63f.
import React from 'react';
import { AbsoluteFill, Freeze, useCurrentFrame, interpolate, Easing } from 'remotion';
import { G, FakeDashboard } from '../../../shared/fixtures/Fixtures';
import { Backdrop, EASE, FONT, Grain, Vignette, mix, ramp, tracking } from '../../../shared/fixtures/Polish';
import { BRAND, PITCH } from '../../../shared/fixtures/Brand';

export const TRAILER_BUMPER_DURATION = 140; // quick cut 27f + black 6f + title entrance 30f + still 77f

// Timeline (frames)
const CUT_1 = 0; // shot 1: variant A full page
const CUT_2 = 9; // shot 2: variant B full page
const CUT_3 = 18; // shot 3: variant A middle-column card 2.2x in-your-face close-up
const BLACK = 27; // pure black silence
const TITLE = 33; // formal opening
const TITLE_IN = 16; // title fade-in + slight rise duration
const SETTLED = TITLE + 30; // tracking settled = the last animated frame of the whole piece

// Gentle push-in inside a quick-cut shot: local 0->9f in the shot, scale 1->1.04 (constant speed: a steady creep over 9f, reads as one breath across the cut points)
const push = (frame: number, start: number) =>
  interpolate(frame, [start, start + 9], [1, 1.04], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

// Shot 3 focus point: center of the Top pages card (/changelog etc. rows) in the middle column top -> pushed to the screen center
const FOCUS_X = 1071;
const FOCUS_Y = 335;
const CLOSE = 2.2;

const Shot: React.FC<{ children: React.ReactNode; s: number }> = ({ children, s }) => (
  <AbsoluteFill style={{ background: G.canvas, overflow: 'hidden' }}>
    <AbsoluteFill style={{ transform: `scale(${s})`, transformOrigin: '50% 50%' }}>{children}</AbsoluteFill>
    <Vignette strength={0.18} inner={0.5} color="#1a1c24" />
    <Grain opacity={0.05} />
  </AbsoluteFill>
);

export const TrailerBumper: React.FC = () => {
  const frame = useCurrentFrame();

  // -- Sections 1-3: triple quick cut --
  if (frame < BLACK) {
    if (frame < CUT_2) {
      // shot 1: A full page + gentle push-in
      return (
        <Shot s={push(frame, CUT_1)}>
          <FakeDashboard variant="A" />
        </Shot>
      );
    }
    if (frame < CUT_3) {
      // shot 2: B full page + gentle push-in
      return (
        <Shot s={push(frame, CUT_2)}>
          <FakeDashboard variant="B" />
        </Shot>
      );
    }
    // shot 3: A middle-column card 2.2x in-your-face close-up (CSS zoom, layout-level magnification), with the same gentle push-in
    return (
      <Shot s={push(frame, CUT_3)}>
        <div
          style={{
            position: 'absolute',
            // zoom scales its own left/top too: left = 960/s - cx => the focus point lands at the screen center
            left: 960 / CLOSE - FOCUS_X,
            top: 540 / CLOSE - FOCUS_Y,
            width: 1920,
            height: 1080,
            zoom: CLOSE,
          }}
        >
          <FakeDashboard variant="A" />
        </div>
      </Shot>
    );
  }

  // -- Section 4: pure-black silence 6f, must be pure black with nothing in it --
  if (frame < TITLE) {
    return <AbsoluteFill style={{ background: '#000000' }} />;
  }

  // -- Section 5: formal opening: title card fades in + slight rise 16f, tracking eases in over 30f then freezes --
  const opacity = interpolate(frame, [TITLE, TITLE + TITLE_IN], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const rise = interpolate(frame, [TITLE, TITLE + TITLE_IN], [44, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const track = mix(0.05, -0.012, ramp(frame, TITLE, SETTLED - TITLE, EASE.out));
  const eyebrow = ramp(frame, TITLE + 2, 16, EASE.out);
  const sub = ramp(frame, TITLE + 6, 18, EASE.out);
  // The opening base "lights up" out of the black: background goes from black to the soft-light base over 12f (no hard jump to bright white after the black)
  const lightUp = ramp(frame, TITLE, 12, EASE.out);

  return (
    <AbsoluteFill style={{ background: '#000000', overflow: 'hidden', fontFamily: FONT.sans }}>
      <Freeze frame={SETTLED} active={frame >= SETTLED}>
        <AbsoluteFill style={{ opacity: lightUp }}>
          <Backdrop tone="light" light={{ x: 0.5, y: 0.36 }} vignette={0.2} />
        </AbsoluteFill>
      </Freeze>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transform: `translateY(${rise}px)`,
          }}
        >
          <div
            style={{
              opacity: eyebrow,
              fontSize: 34,
              fontWeight: 600,
              letterSpacing: '0.18em',
              color: G.accent,
              marginBottom: 30,
            }}
          >
            INTRODUCING
          </div>
          <div
            style={{
              opacity,
              fontFamily: BRAND.font,
              fontWeight: 800,
              fontSize: 176,
              lineHeight: 1,
              color: G.ink1,
              letterSpacing: `${track.toFixed(4)}em`,
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            {BRAND.name}
          </div>
          <div
            style={{
              opacity: sub,
              marginTop: 38,
              fontSize: 40,
              fontWeight: 500,
              color: G.ink2,
              letterSpacing: tracking(40),
            }}
          >
            {PITCH.en.taglines[1]}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
