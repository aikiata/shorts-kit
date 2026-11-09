// gradient-transition: the background transitions smoothly among three kinds of CSS gradient, linear to radial to conic:
// within a type, each parameter is interpolated (angle / color stops / center / radius / start angle); across types, a narrow crossfade changes the type without changing the mood.
//
// Round 2 redesign (aurora purple, launch-event opener):
// - look = aurora (purple-pink dark field). The gradient is the main visual: the foreground is just one set of big type, and the rhythm changes beat with the gradient type:
//   "Bend light." (linear: angle sweeps) then "Focus it." (radial: light spot wanders diagonally and focuses) then the shorts-kit wordmark (conic: three-color ring rotates).
//   The verb of each line describes exactly how that segment's gradient parameters move: the copy is the technique.
// - Color: no longer a seven-color rainbow; all three segments draw from the same set of purple / magenta / ice blue, with the outer ring darkened (a precondition for the radial light spot to hold,
//   and it also leaves contrast for the white type); conic becomes an A to B to C to A three-color ring, with the center placed behind and to the right of the wordmark and pre-blurred on the small canvas to erase sharp points.
// - Performance: the three gradient layers are drawn on a 480x270 small canvas and then scaled up 4x with transform (upscaling during compositing naturally softens, blur is done on the small canvas,
//   per-frame cost is 1/16 of a full-screen realtime blur), with grain on top to prevent h264 banding.
// - A technical note along the bottom: the left side reads out the gradient parameters being interpolated in real time (mono), the right side shows the segment number, showing the viewer that "parameters are moving".
//
// Timeline (30fps, 200f total):
//   0-68    linear: angle 18 deg to 198 deg (swift in-out), three lightness-tier color stops interpolated in the HSL channels; 6-26f "Bend light." rises word by word
//   56-68   Crossfade linear to radial (12f), both layers moving
//   56-132  radial: center (24%,72%) to (68%,38%) wanders diagonally, radius 48% to 80% expanding; 52-62f old line blurs and floats up, 66-86f "Focus it."
//   118-132 Crossfade radial to conic (14f)
//   118-200 conic: start angle 0 to 250 deg rotation (ease-out long tail, slower and slower as it settles); 114-124f old line exits,
//           128-150f shorts-kit wordmark enters with letter-spacing tightening (logo frame traces in, slanted wipe), 140-160f brand tagline; 160-200f hold
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, Grain, bezier, mix, ramp } from '../../../shared/fixtures/Polish';
import { LOOKS, TYPE, TextReveal, alpha, type } from '../../../shared/fixtures/Look';
import { BRAND, PITCH, ShortKitMark } from '../../../shared/fixtures/Brand';

export const GRADIENT_TRANSITION_DURATION = 200;

const L = LOOKS.aurora;

type H3 = [number, number, number];
const hsl = ([h, s, l]: H3, a = 1) => `hsla(${h.toFixed(1)},${s.toFixed(1)}%,${l.toFixed(1)}%,${a})`;
// HSL channels interpolated independently (less gray than RGB)
const mixH = (a: H3, b: H3, k: number): H3 => [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)];

// Small canvas: gradients are drawn at 480x270 and scaled up 4x to fill the screen
const SW = 480, SH = 270;
const SLOW = bezier(0.45, 0, 0.2, 1);

const layer = (background: string, opacity: number, extra?: React.CSSProperties): React.CSSProperties => ({
  position: 'absolute', inset: 0, background, opacity, ...extra,
});

export const GradientTransition: React.FC = () => {
  const f = useCurrentFrame();

  // ── linear: angle sweep + color stop drift ──
  const p1 = ramp(f, 0, 68, EASE.swift);
  const ang = mix(18, 198, p1);
  const l1a = mixH([300, 86, 64], [330, 88, 66], p1);
  const l1b = mixH([268, 76, 40], [250, 78, 44], p1);
  const l1c: H3 = [250, 62, 7];
  // Color stops spread in lightness (64 to 40 to 7), so the direction of the bright band is visible at a glance as the angle sweeps
  const bg1 =
    `radial-gradient(ellipse 60% 70% at ${mix(18, 70, p1).toFixed(1)}% ${mix(10, 22, p1).toFixed(1)}%, ${hsl(l1a, 0.3)}, ${hsl(l1a, 0)} 70%), ` +
    `linear-gradient(${ang.toFixed(2)}deg, ${hsl(l1a)} 0%, ${hsl(l1b)} 34%, ${hsl(l1c)} 78%, ${hsl(l1c)} 100%)`;

  // ── radial: center wanders diagonally + radius expands (radius in px, since the CSS circle radius accepts only a length) ──
  const p2 = ramp(f, 56, 76, EASE.swift);
  const rcx = mix(24, 68, p2), rcy = mix(72, 38, p2), rr = mix(48, 80, p2);
  const core = mixH([326, 92, 72], [282, 88, 70], p2);
  const mid = mixH([292, 72, 38], [256, 74, 36], p2);
  const rpx = (rr / 100) * SW;
  const bg2 =
    `radial-gradient(circle ${rpx.toFixed(1)}px at ${rcx.toFixed(2)}% ${rcy.toFixed(2)}%, ${hsl(core)} 0%, ${hsl(mid)} 36%, ${hsl([250, 62, 8])} 100%)`;

  // ── conic: three-color ring A to B to C to A rotating, center behind and to the right of the wordmark ──
  const p3 = ramp(f, 118, 82, SLOW);
  const from = mix(0, 250, p3);
  const bg3 =
    `conic-gradient(from ${from.toFixed(2)}deg at 64% 54%, hsl(262,84%,60%), hsl(322,86%,64%), hsl(205,90%,68%), hsl(262,84%,60%))`;

  // Crossfade weights (narrow window)
  const x12 = ramp(f, 56, 12, EASE.smooth);
  const x23 = ramp(f, 118, 14, EASE.smooth);
  const w1 = 1 - x12;
  const w2 = x12 - x23;
  const w3 = x23;

  // Parameter readout (bottom note)
  const phase = f < 62 ? 0 : f < 125 ? 1 : 2;
  const readout = [
    `linear-gradient(${Math.round(ang)}deg, …)`,
    `radial-gradient(circle ${Math.round(rr)}% at ${Math.round(rcx)}% ${Math.round(rcy)}%)`,
    `conic-gradient(from ${Math.round(from)}deg at 64% 54%)`,
  ][phase];

  // shorts-kit wordmark letter-spacing tightens
  const markP = ramp(f, 128, 26, EASE.snappy);
  const subP = ramp(f, 142, 20, EASE.snappy);

  return (
    <AbsoluteFill style={{ background: L.bg[2], overflow: 'hidden' }}>
      {/* Three background layers: drawn on the small canvas, scaled up 4x */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: SW, height: SH, transform: `scale(${1920 / SW})`, transformOrigin: '0 0' }}>
        <div style={layer(bg1, w1)} />
        <div style={layer(bg2, w2)} />
        {w3 > 0.001 && (
          <div style={{ position: 'absolute', inset: 0, opacity: w3 }}>
            {/* Expand outward then blur: erases the sharp point at the ring center and hard bands at color stops, so no black shows at the edges */}
            <div style={layer(bg3, 1, { inset: -14, filter: 'blur(9px)' })} />
            {/* Outer ring darkened + left side darkened, leaving contrast for the white type */}
            <div style={layer(`radial-gradient(ellipse 62% 78% at 64% 54%, rgba(8,5,18,0) 18%, rgba(8,5,18,0.55) 64%, rgba(8,5,18,0.92) 100%)`, 1)} />
            <div style={layer(`linear-gradient(90deg, rgba(8,5,18,0.55) 0%, rgba(8,5,18,0) 46%)`, 1)} />
          </div>
        )}
      </div>
      {/* The first two segments likewise get a darkening layer on the left text area */}
      <div style={layer(`linear-gradient(90deg, rgba(8,5,18,0.42) 0%, rgba(8,5,18,0) 55%)`, 1 - w3)} />
      <div style={layer(`radial-gradient(ellipse 80% 80% at 50% 50%, rgba(6,4,14,0) 55%, rgba(6,4,14,0.55) 100%)`, 1)} />
      <Grain opacity={0.1} blend="soft-light" />

      {/* Foreground: one line per segment, the verb describes that segment's gradient parameter motion */}
      <div style={{ position: 'absolute', left: 160, top: 404, ...type(TYPE.display, 760), color: L.ink, textShadow: `0 10px 50px ${alpha('#05020c', 0.35)}` }}>
        {f < 66 && <TextReveal text="Bend light." by="word" variant="blur" start={6} each={20} gap={5} out={{ start: 52, dur: 12 }} />}
      </div>
      <div style={{ position: 'absolute', left: 160, top: 404, ...type(TYPE.display, 760), color: L.ink, textShadow: `0 10px 50px ${alpha('#05020c', 0.35)}` }}>
        {f >= 62 && f < 128 && <TextReveal text="Focus it." by="word" variant="blur" start={66} each={20} gap={5} out={{ start: 114, dur: 12 }} />}
      </div>
      {f >= 124 && (
        <div style={{ position: 'absolute', left: 160, top: 300 }}>
          <div style={{ ...type(TYPE.label, 700, { caps: true }), letterSpacing: '0.3em', color: alpha(L.ink, 0.75), opacity: ramp(f, 124, 16, EASE.out) }}>
            Introducing
          </div>
          {/* Brand wordmark: logo (frame traces in then slanted wipe) + all-lowercase shorts-kit, letter-spacing tightens */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 44, marginTop: 30,
            opacity: ramp(f, 128, 12, EASE.out),
            filter: markP < 0.98 ? `blur(${((1 - markP) * 14).toFixed(2)}px)` : undefined,
          }}>
            <ShortKitMark size={168} tone="dark" frameProgress={ramp(f, 128, 18, EASE.snappy)} cutProgress={ramp(f, 138, 14, EASE.snappy)} />
            <div style={{
              fontFamily: BRAND.font, fontSize: 156, fontWeight: 700, lineHeight: 1, whiteSpace: 'nowrap', color: L.ink,
              letterSpacing: `${mix(0.1, 0.01, markP).toFixed(4)}em`,
              textShadow: `0 12px 60px ${alpha('#05020c', 0.4)}`,
            }}>
              {BRAND.name}
            </div>
          </div>
          <div style={{
            ...type(TYPE.h3, 500), color: alpha(L.ink, 0.82), marginTop: 40,
            opacity: subP, transform: `translateY(${((1 - subP) * 18).toFixed(2)}px)`,
          }}>
            {PITCH.en.motto}
          </div>
        </div>
      )}

      {/* Bottom technical note: live parameters + segment number */}
      <div style={{ position: 'absolute', left: 160, right: 160, bottom: 96, opacity: ramp(f, 0, 16, EASE.out) }}>
        <div style={{ height: 1.5, background: alpha(L.ink, 0.18) }} />
        <div style={{ display: 'flex', marginTop: 22, alignItems: 'baseline' }}>
          <div style={{ ...type(30, 500, { mono: true }), color: alpha(L.ink, 0.7) }}>{readout}</div>
          <div style={{ marginLeft: 'auto', ...type(30, 600, { mono: true }), color: alpha(L.ink, 0.7) }}>
            <span style={{ color: L.ink }}>{String(phase + 1).padStart(2, '0')}</span> / 03
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
