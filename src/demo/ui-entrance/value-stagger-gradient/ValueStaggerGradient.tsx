// value-stagger-gradient: Value Stagger numeric gradient (finalized in motion-lab, ported to native Remotion)
// stagger does not just offset time, it also spreads property values into a gradient across N elements: when the 16 bars enter,
// delay=stagger (time), while height/hue/blur are all numeric gradients of stagger([from,to]);
// the second beat switches to from:'center', and the pulse amplitude spreads again with the center as the origin.
// Design coordinates 480×270 (DesignStage zoom enlarges, rasterized at the target resolution); the parameter table values are calibrated in this coordinate system.
// Texture revision:
// - bars now grow with height (bottom-anchored) instead of scaleY, so rounded corners are no longer squashed; top lit highlight + ground reflection + baseline ticks;
// - the code caption is made into a syntax-colored code bar (≥38px output glyph height), and between the two beats the lines swap with a vertical crossfade instead of a hard cut;
// - bar group and code bar are composed centered as a whole; hue-tinted dark base + soft glow under the bar group + vignette + grain (native resolution).
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { DesignStage, E, lerp, seg, useT } from '../../../shared/fixtures/Motion';
import { EASE, FONT, Grain, Vignette } from '../../../shared/fixtures/Polish';

export const VALUE_STAGGER_GRADIENT_DURATION = 150; // 5000ms @30fps

// Numeric gradient util (equivalent to the value mode of stagger([a,b]))
const staggerVal = (i: number, n: number, a: number, b: number, ease?: (x: number) => number) => {
  let k = n <= 1 ? 0 : i / (n - 1);
  if (ease) k = ease(k);
  return lerp(k, a, b);
};

const N = 16;
const C = (N - 1) / 2;
const BARS = Array.from({ length: N }, (_, i) => ({
  i,
  hue: staggerVal(i, N, 200, 320), // numeric gradient: hue spreads
  hMax: staggerVal(i, N, 92, 32), // numeric gradient: height 1→0.35
  distC: Math.abs(i - C) / C,
}));

const BASE_Y = 196; // baseline (design px)
const SWITCH = 0.52; // switch the code line between the two beats

// Syntax-colored fragments: [text, color]
const KEY = '#9aa3bd';
const FN = '#c9b3ff';
const NUM = '#86d4ff';
const STR = '#f3b58c';
const PUN = '#5f6782';
type Tok = [string, string];
const LINE1: Tok[] = [
  ['scale', KEY], [': ', PUN], ['stagger', FN], ['([', PUN], ['1', NUM], [', ', PUN], ['0.35', NUM], ['])', PUN],
  ['   hue', KEY], [': ', PUN], ['stagger', FN], ['([', PUN], ['200', NUM], [', ', PUN], ['320', NUM], ['])', PUN],
];
const LINE2: Tok[] = [
  ['pulse', KEY], [': ', PUN], ['stagger', FN], ['([', PUN], ['.06', NUM], [', ', PUN], ['.42', NUM], ['], { ', PUN],
  ['from', KEY], [': ', PUN], ["'center'", STR], [' })', PUN],
];

const Code: React.FC<{ toks: Tok[]; style: React.CSSProperties }> = ({ toks, style }) => (
  <div style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', whiteSpace: 'pre', ...style }}>
    {toks.map(([s, c], k) => (
      <span key={k} style={{ color: c }}>{s}</span>
    ))}
  </div>
);

export const ValueStaggerGradient: React.FC = () => {
  const t = useT();
  // Code bar: entrance fade-in and float up; between the two beats the old line moves up and fades out, the new line replaces it from below (≈5f crossfade)
  const capIn = seg(t, 0.03, 0.12, EASE.out);
  const sw = seg(t, SWITCH - 0.018, SWITCH + 0.022, EASE.smooth);
  // Soft glow under the bar group spreads with the first beat and pulses slightly up on the second beat
  const pulseC = Math.sin(seg(t, 0.56, 0.74) * Math.PI);
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #0e0f15 0%, #0a0b0f 100%)' }}>
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse 46% 34% at 50% 66%, rgba(120,110,255,0.16), rgba(120,110,255,0) 70%)',
          opacity: 0.35 + 0.65 * seg(t, 0.06, 0.5) + pulseC * 0.3,
        }}
      />
      <DesignStage bg="transparent" raster="zoom">
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: FONT.mono }}>
          {/* Code bar */}
          <div
            style={{
              position: 'absolute', left: '50%', top: 40, height: 22, width: 316, marginLeft: -158, borderRadius: 7,
              background: 'rgba(255,255,255,0.035)', boxShadow: 'inset 0 0 0 0.25px rgba(255,255,255,0.12), inset 0 0.25px 0 rgba(255,255,255,0.08)',
              overflow: 'hidden', opacity: capIn, transform: `translateY(${lerp(capIn, 4, 0).toFixed(3)}px)`,
            }}
          >
            <Code toks={LINE1} style={{ top: 5.6, fontSize: 9.5, lineHeight: '11px', opacity: 1 - sw, transform: `translateY(${(-sw * 12).toFixed(3)}px)` }} />
            <Code toks={LINE2} style={{ top: 5.6, fontSize: 9.5, lineHeight: '11px', opacity: sw, transform: `translateY(${((1 - sw) * 12).toFixed(3)}px)` }} />
          </div>
          {/* Baseline + ticks */}
          <div style={{ position: 'absolute', left: '7%', right: '7%', top: BASE_Y + 0.5, height: 0.3, background: 'rgba(255,255,255,0.12)', opacity: seg(t, 0.02, 0.1) }} />
          {BARS.map(({ i, hue, hMax, distC }) => {
            // Beat one: time stagger (linear from first) × numeric gradient (y/blur spread at the same time)
            const d = i * 0.02;
            const e = seg(t, 0.06 + d, 0.28 + d, E.outCubic);
            const y0 = staggerVal(i, N, 46, 14); // the displacement amount is itself a gradient
            const b0 = staggerVal(i, N, 8, 2); // blur amount gradient
            // Beat two: from:'center': both the wave and the amplitude spread with the center as origin
            const w = seg(t, 0.56 + distC * 0.13, 0.74 + distC * 0.13);
            const pulse = Math.sin(w * Math.PI);
            const amp = lerp(1 - distC, 0.06, 0.42); // amplitude gradient: largest at the center
            const h = hMax * e * (1 + pulse * amp);
            const x = `${8 + i * 5.4}%`;
            const blur = (1 - e) * b0;
            const bright = 1 + pulse * 0.55;
            const body = `linear-gradient(180deg, hsl(${hue},80%,70%) 0%, hsl(${hue},72%,56%) 45%, hsl(${hue},66%,40%) 100%)`;
            return (
              <React.Fragment key={i}>
                {/* Tick */}
                <div style={{ position: 'absolute', top: BASE_Y + 3, left: `${8 + i * 5.4 + 1.7}%`, width: 0.3, height: 2.5, background: 'rgba(255,255,255,0.18)', opacity: seg(t, 0.02, 0.1) }} />
                {/* Bar body (bottom-anchored, height growth) */}
                <div
                  style={{
                    position: 'absolute',
                    top: BASE_Y - h,
                    left: x,
                    width: '3.4%',
                    height: h,
                    borderRadius: 4,
                    background: body,
                    boxShadow: `inset 0 0.5px 0 rgba(255,255,255,0.45), inset 0 0 0 0.25px rgba(255,255,255,0.10), 0 0 10px hsla(${hue},85%,58%,${(0.18 + pulse * 0.22).toFixed(3)})`,
                    opacity: e,
                    filter: `${blur > 0.02 ? `blur(${blur.toFixed(2)}px) ` : ''}brightness(${bright.toFixed(3)})`,
                    transform: `translateY(${((1 - e) * y0).toFixed(3)}px)`,
                    overflow: 'hidden',
                  }}
                >
                  {/* Left lit strip */}
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '34%', background: 'linear-gradient(90deg, rgba(255,255,255,0.16), rgba(255,255,255,0))' }} />
                </div>
                {/* Ground reflection: flipped, fading out, slightly blurred */}
                <div
                  style={{
                    position: 'absolute',
                    top: BASE_Y + 1.5,
                    left: x,
                    width: '3.4%',
                    height: h * 0.45,
                    borderRadius: 4,
                    background: `linear-gradient(180deg, hsla(${hue},70%,52%,0.32), hsla(${hue},70%,40%,0))`,
                    opacity: e * 0.8,
                    filter: `blur(${(0.8 + blur).toFixed(2)}px) brightness(${bright.toFixed(3)})`,
                    transform: `translateY(${((1 - e) * y0 * 0.4).toFixed(3)}px)`,
                  }}
                />
              </React.Fragment>
            );
          })}
        </div>
      </DesignStage>
      <Vignette strength={0.5} color="#000000" inner={0.45} />
      <Grain opacity={0.08} blend="soft-light" />
    </AbsoluteFill>
  );
};
