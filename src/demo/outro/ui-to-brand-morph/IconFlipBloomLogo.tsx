// icon-flip-bloom-logo: the icon flips on its Y axis and flattens into a vertical line, blooms into a flower-shaped mark, and the wordmark sweeps out
// Source: perplexity-promo 88–91.5s. The smiley laptop icon wobbles twice (anticipation) →
// flips on the Y axis and flattens into a vertical line (ghost trail / blur) → past the thinnest point it blooms into a flower mark (petals open) →
// the wordmark settles letter by letter from large to small (blurred when large, sharp when settled, scale+blur linked).
// Texture: soft bright-field background + a grounded soft shadow under the icon (changes with the wobble / flatten).
// Brand round: the end logo is swapped for the shorts-kit "Jingke" mark. Past the thinnest point, the mark expands from the vertical line on the same overshoot spring
// (viewfinder), then the amber bevel slides in along 45° (replacing the second beat of the original petal opening); the wordmark shorts-kit is all lowercase,
// in the brand font, settling letter by letter from large to small; the only accent color in the whole piece is the mark's amber bevel.
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig } from 'remotion';
import { G } from '../../../shared/fixtures/Fixtures';
import { Backdrop, EASE, ramp } from '../../../shared/fixtures/Polish';
import { BRAND, ShortKitMark } from '../../../shared/fixtures/Brand';

export const ICON_FLIP_BLOOM_LOGO_DURATION = 130;
const MARK = 300; // Mark size (viewBox 128 → visible viewfinder about 244×225)

const SmileLaptop: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <rect x={7} y={6} width={26} height={20} rx={3.5} fill="#fff" stroke={G.ink} strokeWidth={3} />
    <circle cx={15.5} cy={13.5} r={2} fill={G.ink} />
    <circle cx={24.5} cy={13.5} r={2} fill={G.ink} />
    <path d="M14 18.5 Q20 23.5 26 18.5" stroke={G.ink} strokeWidth={2.8} fill="none" strokeLinecap="round" />
    <path d="M3.5 31.5 L36.5 31.5" stroke={G.ink} strokeWidth={3.6} strokeLinecap="round" />
  </svg>
);

const WORD = BRAND.name;

export const IconFlipBloomLogo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---- Timeline ----
  // 0–10: icon entrance (fade in with a slight bounce)
  // 12–34: anticipation: tilt to charge up, wobble twice
  // 34–46: Y-axis flip flattens into a vertical line (scaleX -> 0.04, with ghost trail)
  // 46–62: past the thinnest point the mark expands (bloom 0->1 with overshoot), amber bevel slides in from 53
  // 64–100: mark shifts left to make room + wordmark sweeps out with per-character directional blur
  const FLIP_START = 34;
  const FLIP_MID = 46;
  const BLOOM_END = 62;
  const WORD_START = 66;

  // Entrance
  const inT = spring({ frame, fps, config: { damping: 13, stiffness: 140, mass: 0.8 } });

  // anticipation: two tilt swings with increasing amplitude (-10° / +14°), then a press in the opposite direction to charge up
  const wobble =
    interpolate(frame, [12, 18, 24, 30, FLIP_START], [0, -12, 14, -18, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.sin),
    });

  // First half of the flip: scaleX 1 -> 0.04 (ease-in), with ghost trail
  const flipIn = interpolate(frame, [FLIP_START, FLIP_MID], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });
  const iconScaleX = interpolate(flipIn, [0, 1], [1, 0.04]);

  // Bloom: spring overshoot
  const bloomSpring = spring({
    frame: frame - FLIP_MID,
    fps,
    config: { damping: 11, stiffness: 130, mass: 0.9 },
  });
  const bloom = frame < FLIP_MID ? 0 : bloomSpring;
  // The mark expands from the thickness of the vertical line: scaleX 0.04 -> 1
  const markScaleX = interpolate(bloom, [0, 1], [0.04, 1]);
  // Second beat: the amber bevel slides in along its own 45° direction (starts after the viewfinder is more than half expanded)
  const cut = frame < FLIP_MID + 7 ? 0 : spring({ frame: frame - FLIP_MID - 7, fps, config: { damping: 16, stiffness: 170 } });

  // The mark shifts left to make room (when the wordmark enters)
  const shift = interpolate(frame, [WORD_START - 2, WORD_START + 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const markX = interpolate(shift, [0, 1], [0, -471]); // Coupled to the wordmark start +187: the whole lockup is visually centered

  const showIcon = frame < FLIP_MID;

  // Ghost frames (2 afterimages drawn during the flip)
  const ghosts = frame >= FLIP_START && frame < FLIP_MID ? [0.12, 0.24] : [];

  return (
    <AbsoluteFill style={{ background: G.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Backdrop tone="light" light={{ x: 0.5, y: 0.36 }} accent={BRAND.amber} />
      {/* Grounded soft shadow: shifts with the wobble in the icon phase, narrows when flattened, fades after the bloom (the logo is a flat symbol and needs no ground shadow) */}
      <div style={{
        position: 'absolute', left: 960 + markX - 150 * (showIcon ? iconScaleX : markScaleX) + wobble * 2.2, top: 540 + 150,
        width: 300 * (showIcon ? iconScaleX : markScaleX), height: 26, borderRadius: '50%',
        background: 'radial-gradient(ellipse at center, rgba(20,22,28,0.22) 0%, rgba(20,22,28,0) 70%)',
        opacity: inT * (1 - ramp(frame, FLIP_MID, 14, EASE.out)),
      }} />
      <div style={{ position: 'relative', width: 1920, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Icon / mark container */}
        <div
          style={{
            position: 'absolute',
            left: 960 + markX,
            top: 200,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {showIcon ? (
            <>
              {ghosts.map((g, i) => {
                const gs = Math.min(1, iconScaleX + g);
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: `translate(-50%, -50%) scaleX(${gs})`,
                      opacity: 0.22 - i * 0.08,
                      filter: 'blur(6px)',
                    }}
                  >
                    <SmileLaptop size={340} />
                  </div>
                );
              })}
              <div
                style={{
                  transform: `scale(${inT}) rotate(${wobble}deg) scaleX(${iconScaleX})`,
                  transformOrigin: 'center 78%',
                  filter: flipIn > 0.3 ? `blur(${flipIn * 5}px)` : 'none',
                  opacity: inT,
                }}
              >
                <SmileLaptop size={340} />
              </div>
            </>
          ) : (
            <div style={{ transform: `scaleX(${markScaleX})` }}>
              <ShortKitMark size={MARK} tone="light" cutProgress={cut} />
            </div>
          )}
        </div>

        {/* wordmark: settles letter by letter from large to small, blurred when large and sharp when settled (scale + blur linked), origin pinned to the baseline */}
        <div
          style={{
            position: 'absolute',
            left: 960 + markX + 187,
            top: 200,
            transform: 'translateY(-50%)',
            display: 'flex',
            fontFamily: BRAND.font,
            fontWeight: 700,
            fontSize: 112,
            lineHeight: 1,
            color: BRAND.ink,
            letterSpacing: '0.03em',
            whiteSpace: 'nowrap',
          }}
        >
          {WORD.split('').map((ch, i) => {
            const st = WORD_START + i * 2.6; // Each letter has its own "large to small" motion, staggered out to 2.6f to stay readable
            const cT = ramp(frame, st, 12, EASE.snappy);
            const op = ramp(frame, st, 5, EASE.out);
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  opacity: op,
                  transform: `scale(${(1.9 - 0.9 * cT).toFixed(4)})`,
                  transformOrigin: '50% 78%',
                  filter: cT < 0.995 ? `blur(${((1 - cT) * 14).toFixed(2)}px)` : undefined,
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
