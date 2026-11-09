// vertical-word-roll-blur-cycle: Word Roll, vertical word-strip reel (motion-lab final, ported to native Remotion)
// The second half of the tagline (shorts-kit selling line "Crafted for ___") cycles on a vertical reel Launches→Demos→Promos→Every Shot: the center word is crisp and colored, adjacent rows are light gray with
// vertical blur (reel depth of field), each step uses outQuint, fast then slow, with slight overshoot, and at the moment of settling the center word is dyed from gray to the accent color.
// Quality: the blur is now a true vertical Gaussian (SVG feGaussianBlur on the y axis only, horizontal strokes stay sharp), and while rolling a vertical motion blur
// is layered on top by reel speed (0 at rest); rows farther from the center are slightly squashed along the drum surface; the top and bottom edges of the window fade out softly,
// no longer a hard crop; background soft glow + grain.
// Design coordinates 480×270 (DesignStage scales up proportionally); the parameter table values are calibrated in this coordinate system.
import React from 'react';
import { DesignStage, E, seg, useT } from '../../../shared/fixtures/Motion';
import { Backdrop, FONT, Grain } from '../../../shared/fixtures/Polish';

export const VERTICAL_WORD_ROLL_BLUR_CYCLE_DURATION = 150; // 5000ms @30fps

const ROW = 44;
const WORDS = ['Launches', 'Demos', 'Promos', 'Every Shot'];
// 3 word changes, 0.11 each (≈0.55s)
const STEPS = [0.16, 0.36, 0.56];

const ACCENT = '#5b63d3';
const ACCENT_DIM = '#B9B9BE';
const INK = '#17181c';
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
// Hex color mixing by k (equivalent to mixHex in the original effect.js)
const mixHex = (a: string, b: string, k: number) => {
  k = clamp01(k);
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * k));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

// Reel progress p: each step is 0.7·outQuint + 0.3·outBack (fast then very slow + slight overshoot and settle)
const reelAt = (t: number) => {
  let p = 0;
  for (const s of STEPS) {
    const u = seg(t, s, s + 0.11);
    p += 0.7 * E.outQuint(u) + 0.3 * E.outBack(u);
  }
  return p;
};
const DT = 0.5 / (VERTICAL_WORD_ROLL_BLUR_CYCLE_DURATION - 1); // t corresponding to half a frame

export const VerticalWordRollBlurCycle: React.FC = () => {
  const t = useT();
  const p = reelAt(t);
  // Reel speed (rows/frame) → vertical motion blur (design px), 0 at rest
  const speed = Math.abs(reelAt(t + DT) - reelAt(t - DT));
  const motionBlur = Math.min(4, speed * ROW * 0.22);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
    <DesignStage bg="#F4F4F2">
      <Backdrop tone="light" light={{ x: 0.5, y: 0.3 }} accent={ACCENT} vignette={0.12} grain={0} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT.sans,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            // fade out the whole group at the end
            opacity: 1 - seg(t, 0.9, 0.985) * 0.999,
          }}
        >
          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: INK,
              letterSpacing: -0.5,
            }}
          >
            Crafted for
          </div>
          {/* A window three rows tall, the reel column slides inside it, center row = second row; top and bottom edges fade out softly */}
          <div
            style={{
              position: 'relative',
              height: ROW * 3,
              width: 190,
              overflow: 'hidden',
              WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 26%, #000 74%, transparent 100%)',
              maskImage: 'linear-gradient(180deg, transparent 0%, #000 26%, #000 74%, transparent 100%)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                transform: `translateY(${ROW - p * ROW}px)`,
              }}
            >
              {WORDS.map((w, i) => {
                const d = Math.abs(i - p);
                // Vertical blur on adjacent rows: within 1 row of the center linear 0→3px, farther 3→5px; motion blur layered while rolling
                const blur = (d < 1 ? 3 * d : 3 + 2 * Math.min(d - 1, 1)) + motionBlur;
                const op = d < 1 ? 1 - 0.65 * d : Math.max(0.1, 0.35 - 0.23 * (d - 1));
                // Drum surface: the farther from the center, the flatter (up to 14%)
                const squash = 1 - 0.14 * Math.min(1, d / 1.4);
                const fid = `vroll-${i}`;
                return (
                  <div key={w} style={{ position: 'relative', height: ROW }}>
                    <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden>
                      <filter id={fid} x="-10%" y="-120%" width="120%" height="340%" colorInterpolationFilters="sRGB">
                        <feGaussianBlur stdDeviation={`0 ${blur.toFixed(2)}`} />
                      </filter>
                    </svg>
                    <div
                      style={{
                        height: ROW,
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: 30,
                        fontWeight: 800,
                        letterSpacing: -0.5,
                        whiteSpace: 'nowrap', // the last word "Every Shot" contains a space, disallow wrapping
                        filter: blur > 0.05 ? `url(#${fid})` : undefined,
                        opacity: op,
                        transform: `scaleY(${squash.toFixed(4)})`,
                        // Settle coloring: center word gray→accent color (the smaller d, the more colorful)
                        color: mixHex(ACCENT_DIM, ACCENT, clamp01(1 - d * 2.4)),
                      }}
                    >
                      {w}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DesignStage>
    {/* Grain sits outside the design-coordinate container, sampled at final-frame pixels, so it does not get coarser with the 4× scale-up */}
    <Grain opacity={0.05} />
    </div>
  );
};
