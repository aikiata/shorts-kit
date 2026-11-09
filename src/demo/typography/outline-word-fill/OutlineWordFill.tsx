// outline-word-fill: Outline→Solid Fill, hollow word lit up instantly
// The hollow word shrinks from about 3.2x with a fast-then-slow curve and lands centered; a large dashed circle behind it keeps contracting from off-screen to around the word while slowly rotating, and horizontal dashed lines on both sides extend inward from the frame
// edges toward the circle ("aiming"); the outline first warms up and brightens, then the solid word hard-cuts on within one frame (no slow sweep), and settles after a flash of glow.
//
// Second-round redesign (drafting HUD · white-hot ignition):
// - look = ember (warm black · orange). Rewritten in native 1920 coordinates (no longer through the 480×270 DesignStage): 220px / 500 Helvetica Neue
//   hollow word (2px warm-gray stroke), an r=410 dashed circle + an inner 72-tick ring (a long tick every 30°, slowly counter-rotating) + four registration ticks, horizontal dashed lines on both sides with mono readouts
//   'BEFORE 1 week' / 'AFTER 4 hrs': telling "faster" as a set of before/after data (hand-keyed one week vs shorts-kit an afternoon to ship), so the aiming has content.
// - Ignition: frame 54 hard-cuts to the white-hot solid word (#fff5ee); on the same frame the circle and horizontal lines "lock" to orange and the right readout 4 hrs turns orange;
//   the glow (white + orange, two layers) decays in 8f; a shock ring expands from the circle's edge and dissipates over 14f (only once); the stage key light pulses in sync then falls back.
// - The main ring's rotation brakes to a stop at the moment of ignition ("lock"), while the inner tick ring keeps counter-rotating slowly.
// - Curves: the word shrinks fast over 11f (EASE.snappy, instantaneous defocus by scale speed), the circle contracts slowly over 44f (EASE.out, the slowest breath in the film),
//   the fast/slow contrast is this card's rhythm; the horizontal lines extend inward with an 18f ease-out, stopping 28px outside the circle's edge.
// - The hollow word must use a static font (Helvetica Neue): SF variable font glyphs have internal overlapping contours, and text-stroke would outline the overlap lines inside a/e.
//
// Timeline (30fps, 90f total):
//   0–2    stage light and floating dust already there (frame 1 is not empty)
//   2–13   hollow word shrinks 3.2→1 fast (2–8 fades in)
//   8–52   dashed circle slowly contracts 2.8→1 + rotates (8–18 fades in)
//   28–46  horizontal dashed lines on both sides extend inward, readouts fade in
//   44–53  stroke warm-up: warm gray → bright orange-white
//   54     hard-cut ignition + lock (main ring brakes); 54–62 glow decay; 54–68 shock ring
//   56–70  eyebrow / sub line rise inside the circle
//   70–90  hold 20f (very slow 1.5% push-in)
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, mix, ramp } from '../../../shared/fixtures/Polish';
import { Dust, LOOKS, Stage, alpha, type } from '../../../shared/fixtures/Look';
import { BRAND, ShortKitMark } from '../../../shared/fixtures/Brand';

export const OUTLINE_WORD_FILL_DURATION = 90; // 3.0s @30fps

const L = LOOKS.ember;
const CX = 960;
const CY = 540;
const R = 410; // dashed circle radius
const WORD = 'Faster';
const SIZE = 220;
const POP = 54; // hard-cut ignition frame
const STATIC_SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const lerpColor = (a: [number, number, number], b: [number, number, number], t: number) =>
  `rgb(${Math.round(mix(a[0], b[0], t))},${Math.round(mix(a[1], b[1], t))},${Math.round(mix(a[2], b[2], t))})`;
const GREY: [number, number, number] = [138, 118, 104]; // warm-gray stroke / drafting lines
const HOT: [number, number, number] = [255, 196, 150]; // bright orange-white after warm-up
const ORANGE: [number, number, number] = [255, 107, 44];

const wordScaleAt = (f: number) => mix(3.2, 1, ramp(f, 2, 11, EASE.snappy));

export const OutlineWordFill: React.FC = () => {
  const frame = useCurrentFrame();

  const born = ramp(frame, 2, 6, EASE.out);
  const ws = wordScaleAt(frame);
  const zoomBlur = Math.min(6, Math.abs(wordScaleAt(frame + 0.5) - wordScaleAt(frame - 0.5)) * 9);
  const cin = ramp(frame, 8, 10, EASE.out);
  const shrink = ramp(frame, 8, 44, EASE.out);
  const ext = ramp(frame, 28, 18, EASE.out);
  const warm = ramp(frame, 44, 9, EASE.swift);
  const lit = frame >= POP ? 1 : 0; // hard cut: no intermediate state
  const flash = lit * (1 - ramp(frame, POP, 8, EASE.out));
  const lock = lit * (0.55 + 0.45 * flash); // keeps half the orange after locking
  const shock = ramp(frame, POP, 14, EASE.out);
  // The main ring's rotation "locks" at the moment of ignition (slides another 6° and brakes); the inner tick ring keeps counter-rotating, so the frame still breathes during the hold
  const rot = 0.22 * Math.min(frame, POP) + (frame > POP ? 6 * ramp(frame, POP, 14, EASE.out) : 0);
  const rotIn = -0.14 * frame;
  const sub = (d: number) => ramp(frame, 56 + d, 14, EASE.snappy);
  const push = 1 + 0.015 * ramp(frame, 0, OUTLINE_WORD_FILL_DURATION, EASE.swift);

  const strokeC = lerpColor(GREY, HOT, warm);
  const lineC = lit ? lerpColor([150, 120, 100], ORANGE, lock) : lerpColor(GREY, [150, 120, 100], warm);
  const lineEnd = CX - R - 28; // horizontal lines stop 28px outside the circle's edge

  return (
    <AbsoluteFill style={{ background: L.bg[1] }}>
      <Stage look={L} keyLight={{ x: 0.5, y: 0.5 }} fill={{ x: 0.5, y: 1.1 }} intensity={0.45 + 0.5 * flash + 0.15 * lit} grain={0.09} vignette={0.6}>
        <Dust look={L} count={22} seed={3} drift={0.12} opacity={0.4} />
      </Stage>

      <AbsoluteFill style={{ transform: `scale(${push.toFixed(5)})` }}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
          {/* Shock ring: expands from the circle's edge and dissipates at the moment of ignition (only once) */}
          {lit > 0 && shock < 1 && (
            <circle cx={CX} cy={CY} r={R + shock * 160} fill="none" stroke={alpha('#ff8a4c', 0.55 * (1 - shock))} strokeWidth={2 + 10 * (1 - shock)} />
          )}
          <g transform={`translate(${CX} ${CY}) scale(${mix(2.8, 1, shrink).toFixed(5)})`} opacity={cin}>
            {/* Main dashed circle (rotating) */}
            <g transform={`rotate(${rot.toFixed(3)})`}>
              <circle r={R} fill="none" stroke={lineC} strokeWidth={2} strokeDasharray="22 18" />
              {[0, 90, 180, 270].map((a) => (
                <line key={a} x1={0} y1={-R - 22} x2={0} y2={-R + 10} stroke={lineC} strokeWidth={2.5} strokeLinecap="round" transform={`rotate(${a})`} />
              ))}
            </g>
            {/* Inner tick ring (slow counter-rotation, dimmed: texture layer) */}
            <g transform={`rotate(${rotIn.toFixed(3)})`}>
              <circle r={R - 34} fill="none" stroke={lineC} strokeWidth={1} opacity={0.35} />
              {Array.from({ length: 72 }, (_, i) => {
                const major = i % 6 === 0;
                return (
                  <line key={i} x1={0} y1={-(R - 34)} x2={0} y2={-(R - (major ? 58 : 44))} stroke={lineC}
                    strokeWidth={major ? 2 : 1.2} opacity={major ? 0.7 : 0.32} transform={`rotate(${i * 5})`} />
                );
              })}
            </g>
          </g>
          {/* Horizontal dashed lines on both sides: extend inward from the frame edge to outside the circle's edge */}
          <line x1={0} y1={CY} x2={lineEnd * ext} y2={CY} stroke={lineC} strokeWidth={2} strokeDasharray="14 12" opacity={ext} />
          <line x1={1920} y1={CY} x2={1920 - lineEnd * ext} y2={CY} stroke={lineC} strokeWidth={2} strokeDasharray="14 12" opacity={ext} />
          {/* Line-end crosshair points */}
          <circle cx={lineEnd * ext} cy={CY} r={5} fill={lineC} opacity={ext} />
          <circle cx={1920 - lineEnd * ext} cy={CY} r={5} fill={lineC} opacity={ext} />
        </svg>

        {/* Readouts: above the horizontal lines, left = old value (weak), right = new value (turns orange on ignition) */}
        <div style={{ position: 'absolute', left: 120, top: CY - 74, opacity: ext, transform: `translateX(${((1 - ext) * -30).toFixed(2)}px)`, ...type(30, 500, { mono: true }), letterSpacing: '0.12em', color: L.ink3 }}>
          BEFORE <span style={{ color: L.ink2 }}>1 week</span>
        </div>
        <div style={{ position: 'absolute', right: 120, top: CY - 74, opacity: ext, transform: `translateX(${((1 - ext) * 30).toFixed(2)}px)`, ...type(30, 500, { mono: true }), letterSpacing: '0.12em', color: L.ink3, textAlign: 'right' }}>
          AFTER <span style={{ color: lit ? L.accent : L.ink2, textShadow: lit && flash > 0.02 ? `0 0 ${(18 * flash).toFixed(1)}px ${alpha(L.accent, 0.8)}` : undefined }}>4 hrs</span>
        </div>

        {/* Eyebrow / sub line: inside the circle, above and below the word */}
        {/* Eyebrow = brand sign-off: small reversed logo + all-lowercase shorts-kit (wordmark rule: never all caps) */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: CY - 200, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, opacity: sub(0), transform: `translateY(${((1 - sub(0)) * 16).toFixed(2)}px)`, ...type(28, 600, { mono: true }), letterSpacing: '0.16em', color: L.ink2 }}>
          <ShortKitMark size={40} tone="dark" />
          <span>{BRAND.name}</span>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: CY + 128, textAlign: 'center', opacity: sub(3), transform: `translateY(${((1 - sub(3)) * 16).toFixed(2)}px)`, ...type(40, 450), letterSpacing: '-0.01em', color: L.ink2 }}>
          One prompt to a finished promo.
        </div>

        {/* Double-layer word: hollow outline underneath, white-hot solid on top (hard cut) */}
        <div style={{
          position: 'absolute', left: CX, top: CY, fontFamily: STATIC_SANS, fontSize: SIZE, fontWeight: 500, letterSpacing: '0.005em', lineHeight: 1,
          opacity: born, transform: `translate(-50%, -54%) scale(${ws.toFixed(5)})`, whiteSpace: 'nowrap',
        }}>
          <div style={{
            color: 'transparent', WebkitTextStroke: `2px ${strokeC}`, opacity: 1 - lit,
            filter: zoomBlur > 0.05 ? `blur(${(zoomBlur / ws).toFixed(2)}px)` : warm > 0.01 ? `drop-shadow(0 0 ${(10 * warm).toFixed(1)}px ${alpha('#ff9a5c', 0.5 * warm)})` : undefined,
          }}>
            {WORD}
          </div>
          <div style={{
            position: 'absolute', inset: 0, color: '#fff5ee', opacity: lit,
            textShadow: flash > 0.01 ? `0 0 ${(14 * flash).toFixed(1)}px rgba(255,255,255,${(0.7 * flash).toFixed(3)}), 0 0 ${(60 * flash).toFixed(1)}px ${alpha(L.accent, 0.65 * flash)}` : `0 0 40px ${alpha(L.accent, 0.18)}`,
          }}>
            {WORD}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
