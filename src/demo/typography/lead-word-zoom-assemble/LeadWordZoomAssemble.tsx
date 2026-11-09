// lead-word-zoom-assemble: lead word pushes in and lands to assemble a sentence
// The lead word occupies the center of the frame at 2.3x font size and keeps pushing toward the viewer by 6% during the hold, then a single curve simultaneously
// completes "shrink back to final font size" and "the whole line slides left to its final layout", the following words push in from the right, 0.5em outside their own slots;
// in the same window as the whole line moving up the sub line floats out, and after a beat the whole scene crash-zooms in, defocusing, to hand off to the next shot.
//
// The crux of the feel is the pivot: transform-origin is pinned horizontally to **the lead word's center** and vertically to **the baseline**,
// these two points are the only anchors that should never move throughout, measured once at mount (the baseline is read from the
// offsetTop of a zero-size inline-block), otherwise the letters would jitter the baseline frame by frame during scaling.
// Parameters are calibrated at 1920×1080.
// Texture layer (revision): the four-color mesh is reduced to a low-contrast base of "an indigo key light + a touch of warm afterglow" + grain + vignette;
// the lead word enters with an 8px→0 defocus (same 6f as the fade-in); the shrink-back segment gives momentary defocus by scale speed (≤3.5px, back to zero once settled),
// so the large scaling no longer "snaps shut"; the whole-line move-up is advanced to f32–46, the brand line is still for 26f before the crash; the accent color is unified to the batch indigo.
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { Grain, Vignette } from '../../../shared/fixtures/Polish';
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  getRemotionEnvironment,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const LEAD_WORD_ZOOM_ASSEMBLE_DURATION = 84; // 2.8s @30fps

// ---- Choreography constants ----
const TEXT = 'Introducing shorts-kit';
const HIGHLIGHT_WORD = 'shorts-kit'; // the exactly matched word gets the accent color: the brand word comes with its own highlight at the moment it lands
const FONT_SIZE = 96;
const INITIAL_SCALE = 2.3; // lead word's starting magnification
const INTRO_DURATION = 6; // f: lead word fade-in
const HOLD_DURATION = 12; // f: lead word stays at its peak (the push-in happens in this segment)
const PUSH_SCALE = 1.06; // multiplier of the continued push-in during the hold
const RECEDE_DURATION = 12; // f: shrink back to final font size
const ASSEMBLE_DURATION = 24; // f: whole line slides left into place
const WORD_DELAY = 6; // f: the second word starts pushing in after the shrink-back start
const WORD_STAGGER = 4; // f: stagger between following words
const WORD_DURATION = 12; // f: travel of a single word pushing in
const WORD_PUSH = 0.5; // em: how far to the right of its own slot the following words start
const WORD_FADE = 2; // f: following words' fade-in (deliberately very short: they are pushed in, not faded in)
const LETTER_SPACING = '-0.03em';

// ---- Scene layer ----
const LIFT: [number, number] = [32, 46]; // f: whole line moves up + the sub line appears on the same frames (overlaps the left-slide tail by 4f, reads as one breath)
const LIFT_DISTANCE = -56; // px
const SUBLINE = 'One shot card, one motion recipe — copy, paste, render.';
const CRASH_FRAMES = 12; // f: number of closing frames the end-of-segment crash-zoom occupies
const CRASH_SCALE = 0.2;
const CRASH_BLUR = 9;

const INK = '#1d1d1f';
const INK_DIM = '#6e6f76';
const ACCENT = '#5b63d3';
// System Display font stack first (-apple-system often fails to resolve in headless Chrome and falls to PingFang), with PingFang as the CJK fallback
const SANS = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", "PingFang SC", Inter, Arial, sans-serif';
const MESH_BG =
  'radial-gradient(56% 50% at 26% 24%, rgba(91,99,211,0.16) 0%, rgba(91,99,211,0) 72%),' +
  'radial-gradient(50% 46% at 80% 82%, rgba(255,180,120,0.10) 0%, rgba(255,180,120,0) 72%),' +
  'radial-gradient(70% 60% at 50% 46%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 70%),' +
  'linear-gradient(180deg, #f6f6f8 0%, #efeff2 100%)';

/** Lead word drifts toward the viewer: fast then stops, hangs at the peak */
const PUSH_EASE = Easing.bezier(0.25, 1, 0.5, 1);
/** The shrink-back and the left slide share one curve: the two actions must read as one motion, not each going its own way */
const ZOOM_EASE = Easing.bezier(0.5, 0, 0.05, 1);
/** Following words pushing into their slots: fast start, long soft landing */
const WORD_EASE = Easing.bezier(0.22, 0.8, 0.36, 1);

// Whole-line scale: the hold push-in + shrink-back segments added together (no velocity break between the two)
const lineScale = (f: number) =>
  interpolate(f, [0, HOLD_DURATION], [INITIAL_SCALE, INITIAL_SCALE * PUSH_SCALE], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: PUSH_EASE,
  }) +
  interpolate(f, [HOLD_DURATION, HOLD_DURATION + RECEDE_DURATION], [0, 1 - INITIAL_SCALE * PUSH_SCALE], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ZOOM_EASE,
  });

const TextReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  // Whole-line width, lead word's center ratio, baseline position: measured once at mount, rendering suspended until measured
  const lineRef = useRef<HTMLSpanElement>(null);
  const leadRef = useRef<HTMLSpanElement>(null);
  const baselineRef = useRef<HTMLSpanElement>(null);
  const [handle] = useState(() => delayRender('lead-word-zoom-assemble: measure line'));
  const [metrics, setMetrics] = useState<{
    lineWidth: number;
    leadRatio: number;
    baseline: number;
  } | null>(null);

  useEffect(() => {
    const line = lineRef.current;
    const lead = leadRef.current;
    if (!line || !lead) {
      continueRender(handle);
      return;
    }
    setMetrics({
      lineWidth: line.offsetWidth,
      leadRatio: (lead.offsetLeft + lead.offsetWidth / 2) / line.offsetWidth,
      baseline: baselineRef.current?.offsetTop ?? line.offsetHeight * 0.8,
    });
  }, [handle]);

  useEffect(() => {
    if (metrics) continueRender(handle);
  }, [metrics, handle]);

  const words = TEXT.split(' ').filter(Boolean);
  const ready = metrics !== null;
  const leadRatio = metrics?.leadRatio ?? 0.14;
  const lineWidth = metrics?.lineWidth ?? width * 0.5;
  const baseline = metrics?.baseline ?? FONT_SIZE * 0.88;

  const zoomStart = HOLD_DURATION;
  // The lead word travels from "the middle of the frame" to "its own position in the line", the displacement is this eccentricity
  const slideDistance = lineWidth * (0.5 - leadRatio);
  // Lead word entrance defocus: 8px→0 in sync with the 6f fade-in (pre-scale units, magnified with the 2.3x)
  const introBlur = interpolate(frame, [0, INTRO_DURATION], [8 / INITIAL_SCALE, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <span
        ref={lineRef}
        style={{
          position: 'relative',
          display: 'inline-block',
          fontSize: FONT_SIZE,
          fontWeight: 600,
          color: INK,
          letterSpacing: LETTER_SPACING,
          lineHeight: 1.1,
          whiteSpace: 'nowrap',
          fontFamily: SANS,
          transformOrigin: `${leadRatio * 100}% ${baseline}px`,
          scale: lineScale(frame),
          // Momentary defocus in the shrink-back segment: by scale speed (peak about 0.3/frame → ≈3px), 0 once settled
          filter: (() => {
            const v = Math.abs(lineScale(frame + 0.5) - lineScale(frame - 0.5));
            const b = Math.min(3.5, v * 10) + introBlur;
            return b > 0.05 ? `blur(${b.toFixed(2)}px)` : undefined;
          })(),
          translate: `${interpolate(
            frame,
            [zoomStart, zoomStart + ASSEMBLE_DURATION],
            [slideDistance, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ZOOM_EASE },
          )}px`,
          opacity: ready ? 1 : 0,
          textRendering: 'geometricPrecision',
          ...(getRemotionEnvironment().isRendering ? null : { willChange: 'transform' as const }),
        }}
      >
        {words.map((word, i) => {
          const isLead = i === 0;
          const pushStart = zoomStart + WORD_DELAY + (i - 1) * WORD_STAGGER;
          const opacity = isLead
            ? interpolate(frame, [0, INTRO_DURATION], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })
            : interpolate(frame, [pushStart, pushStart + WORD_FADE], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
          return (
            <Fragment key={i}>
              <span
                ref={isLead ? leadRef : undefined}
                style={{
                  display: 'inline-block',
                  opacity,
                  color: word === HIGHLIGHT_WORD ? ACCENT : undefined,
                  translate: isLead
                    ? undefined
                    : `${interpolate(
                        frame,
                        [pushStart, pushStart + WORD_DURATION],
                        [WORD_PUSH * FONT_SIZE, 0],
                        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: WORD_EASE },
                      )}px`,
                }}
              >
                {word}
              </span>
              {/* The space between words must sit outside the inline-block: inside a word it gets clipped by the line box and the words would stick together */}
              {i < words.length - 1 ? ' ' : null}
            </Fragment>
          );
        })}
        {/* Baseline ruler: a zero-size inline-block, its offsetTop is the baseline */}
        <span ref={baselineRef} style={{ display: 'inline-block', width: 0, height: 0 }} />
      </span>
    </AbsoluteFill>
  );
};

export const LeadWordZoomAssemble: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const lift = interpolate(frame, LIFT, [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const crash = interpolate(
    frame,
    [durationInFrames - CRASH_FRAMES, durationInFrames - 1],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad) },
  );

  return (
    <AbsoluteFill style={{ background: MESH_BG, fontFamily: SANS }}>
      <AbsoluteFill
        style={{
          transform: `scale(${1 + crash * CRASH_SCALE})`,
          filter: crash > 0.01 ? `blur(${crash * CRASH_BLUR}px)` : undefined,
          opacity: 1 - crash * 0.55,
        }}
      >
        <AbsoluteFill style={{ transform: `translateY(${lift * LIFT_DISTANCE}px)` }}>
          <TextReveal />
        </AbsoluteFill>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            marginTop: 62,
            textAlign: 'center',
            fontSize: 34,
            fontWeight: 400,
            letterSpacing: '-0.005em',
            color: INK_DIM,
            opacity: lift,
            transform: `translateY(${(1 - lift) * 16}px)`,
          }}
        >
          {SUBLINE}
        </div>
      </AbsoluteFill>
      <Vignette strength={0.12} inner={0.5} color="#2a2c36" />
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
};
