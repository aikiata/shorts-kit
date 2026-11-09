// versus-slam opening: two half-screens (78° slanted edge) accelerate in from off-screen and slam together along the diagonal seam;
// white flash on the impact frame + whole-frame screen shake with exponential decay + a "VS" round stamp pressed out; the cut point is the impact itself, ending on a still hold.
//
// Round 2 redesign (Swiss poster, versus comparison "what a launch film costs"):
// - look = paper (warm white paper, ink, vermilion), bold black-type poster layout, no dashboard. Two sides = two color-block posters:
//   left "THE OLD WAY" on ink-black with paper-white 340px "14 days", right "WITH SHORTS-KIT" on vermilion with paper-white "1 prompt":
//   one ink and one vermilion collide, and the numbers themselves are the comparison conclusion; 44px captions, 32px lists, all sized to be readable.
// - The establishing section (0–18f) is not an empty screen: on the paper a line "What does a promo take?" (124px, ink line leaves a gap at the text band),
//   an ink line grows from the midpoint to both ends along the diagonal seam (foreshadowing the collision); the two half-screens rush in with ease-in(cubic) over 10f, swallowing the question as they sweep past.
// - Impact trio starts on the same frame (28f): paper-white flash 0.85→0 over 3f, whole-frame shake 16px·e^(−t/1.7), VS round stamp pressed out by spring
//   (damping 12, one visible overshoot); on the same frame an ink shockwave ring plus 12 radial speed lines (done in 6f).
//   After the collision the diagonal seam is a 6px paper-white "cut", with a narrow drop shadow on each side, like two sheets of cardstock pressed together.
// - The rush gets horizontal motion blur by speed (final speed ~360px/frame, capped at 36px); after impact the numbers on both sides rebound 1.04→1 and settle (2f late, following).
//
// Timeline (30fps, 105f total):
//   0–18    establish: the question rises word by word (1–14), ink line grows along the seam
//   18–28   rush 10f (ease-in cubic: faster and faster = a smash)
//   28      impact: flash / shake / stamp / shockwave ring / speed lines
//   30–44   numbers rebound and settle; 36–60 captions and lists on both sides rise staggered (left first, right after, 4f offset)
//   54–70   bottom conclusion bar (mirror-engraved logo + "Direct the film. Let the agent shoot it.") rises from below, pressed over the seam
//   70–105  hold 35f: whole frame very slowly pushes in 1 → 1.015
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, FONT, Grain, SpeedBlur, mix, ramp, velocity } from '../../../shared/fixtures/Polish';
import { LOOKS, Stage, TextReveal, alpha, springAt, type } from '../../../shared/fixtures/Look';
import { BRAND, ShortKitMark } from '../../../shared/fixtures/Brand';

export const VERSUS_SLAM_DURATION = 105;

const P = LOOKS.paper;
const INK = P.ink;
const RED = P.accent;
const PAPER = '#f8f4ec';
const PAD = 120;
const RUSH = 18; // rush start
const IMPACT = 28; // impact frame

// Seam geometry: 78° slanted edge → horizontal offset ≈ 230px over 1080 height, center line x=960 ±115
const SEAM_TOP_X = 1075;
const SEAM_BOT_X = 845;
const SEAM_DEG = (Math.atan2(SEAM_TOP_X - SEAM_BOT_X, 1080) * 180) / Math.PI; // ≈ +12°
// Gap band for the establishing ink line (line length 1400, starting at y=−160; text at y≈380–560 → 39%–52% of the line)
const SEAM_GAP = 'linear-gradient(180deg, #000 0%, #000 35%, transparent 37.5%, transparent 53%, #000 55.5%, #000 100%)';

// Two half-screens rush: ease-in cubic, 10f from ±1240px into place
const leftXAt = (f: number) => -1240 * (1 - Math.pow(ramp(f, RUSH, IMPACT - RUSH, EASE.linear), 3));

// One side's poster
const Side: React.FC<{ side: 'L' | 'R'; f: number }> = ({ side, f }) => {
  const left = side === 'L';
  const fg = PAPER;
  const sub = left ? alpha(PAPER, 0.62) : alpha(INK, 0.82);
  const x0 = left ? PAD : 1190;
  // Post-impact number rebound and settle (follows 2f late)
  const settle = springAt(f, IMPACT + 2, { damping: 14, stiffness: 220 });
  const numScale = f < IMPACT ? 1 : mix(1.05, 1, settle);
  const d = left ? 0 : 4;
  const cap = ramp(f, IMPACT + 8 + d, 18, EASE.snappy);
  const list = ramp(f, IMPACT + 14 + d, 18, EASE.snappy);
  const items = left ? ['Storyboard', 'Keyframe', 'Render', 'Repeat'] : ['Shots picked', 'Beats synced'];
  return (
    <>
      <div style={{ position: 'absolute', left: x0, top: 140, display: 'flex', alignItems: 'center', gap: 16, ...type(30, 800, { caps: true }), letterSpacing: '0.16em', color: left ? alpha(PAPER, 0.7) : INK }}>
        <span style={{ width: 16, height: 16, background: left ? alpha(PAPER, 0.7) : INK, borderRadius: left ? 0 : 8 }} />
        {left ? 'The old way' : `With ${BRAND.name}`}
      </div>
      <div style={{
        position: 'absolute', left: x0 - 14, top: 196, display: 'flex', alignItems: 'baseline', gap: 22,
        transform: `scale(${numScale.toFixed(4)})`, transformOrigin: 'left bottom',
      }}>
        <span style={{ fontFamily: FONT.sans, fontSize: 360, fontWeight: 900, letterSpacing: '-0.07em', lineHeight: 0.9, color: fg, fontVariantNumeric: 'tabular-nums' }}>
          {left ? '14' : '1'}
        </span>
        <span style={{ ...type(96, 800), color: fg }}>{left ? 'days' : 'prompt'}</span>
      </div>
      <div style={{ position: 'absolute', left: x0, top: 590, width: left ? 640 : 620, ...type(44, 600), lineHeight: 1.18, color: fg, opacity: cap, transform: `translateY(${(1 - cap) * 26}px)` }}>
        {left ? <>Storyboards, keyframes and three rounds of render notes.</> : <>Your agent shoots, cuts and scores it to the beat.</>}
      </div>
      <div style={{ position: 'absolute', left: x0, top: 800, display: 'flex', gap: 30, width: left ? 680 : 620, opacity: list, transform: `translateY(${(1 - list) * 20}px)` }}>
        {items.map((it, i) => (
          <span key={it} style={{ display: 'flex', alignItems: 'center', gap: 12, ...type(32, 600), color: sub }}>
            <span style={{ fontFamily: FONT.mono, fontSize: 26, color: left ? alpha(PAPER, 0.4) : alpha(INK, 0.55) }}>{left ? `0${i + 1}` : '✓'}</span>
            <span style={{ textDecoration: left ? 'line-through' : undefined, textDecorationThickness: 2 }}>{it}</span>
          </span>
        ))}
      </div>
    </>
  );
};

export const VersusSlam: React.FC = () => {
  const frame = useCurrentFrame();
  const leftX = leftXAt(frame);
  const v = velocity(leftXAt, frame);
  const impacted = frame >= IMPACT;

  // From the impact frame: whole-frame shake with exponential decay (settles in ~5f)
  const since = frame - IMPACT;
  const env = since >= 0 ? 16 * Math.exp(-since / 1.7) : 0;
  const shakeX = env * Math.sin(since * 3.3);
  const shakeY = env * 0.55 * Math.sin(since * 4.2 + 0.8);
  const push = 1 + 0.015 * ramp(frame, IMPACT + 10, 105 - IMPACT - 10, EASE.smooth);

  const flash = impacted ? 0.85 * (1 - ramp(frame, IMPACT, 3, EASE.linear)) : 0;
  const stamp = springAt(frame, IMPACT, { damping: 12, stiffness: 260 });
  const wave = ramp(frame, IMPACT, 16, EASE.out);
  const lines = ramp(frame, IMPACT, 7, EASE.out);

  // Establishing ink line: grows from the midpoint to both ends, thickens as they close in
  const preGrow = ramp(frame, 2, 14, EASE.snappy);
  const preW = mix(2, 6, ramp(frame, RUSH, IMPACT - RUSH, EASE.exit));
  const verdict = ramp(frame, IMPACT + 26, 18, EASE.snappy);

  const half = (side: 'L' | 'R') => (
    <SpeedBlur vx={side === 'L' ? v : -v} amount={0.1} max={36}>
      <div style={{
        position: 'absolute', inset: 0, transform: `translateX(${(side === 'L' ? leftX : -leftX).toFixed(2)}px)`,
        clipPath: side === 'L'
          ? `polygon(0px 0px, ${SEAM_TOP_X}px 0px, ${SEAM_BOT_X}px 1080px, 0px 1080px)`
          : `polygon(${SEAM_TOP_X}px 0px, 1920px 0px, 1920px 1080px, ${SEAM_BOT_X}px 1080px)`,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: side === 'L'
            ? `radial-gradient(ellipse 70% 80% at 18% 10%, #2a231c 0%, ${INK} 60%, #0e0b08 100%)`
            : `radial-gradient(ellipse 70% 80% at 85% 10%, #f25a3f 0%, ${RED} 55%, #c9341f 100%)`,
        }} />
        <Side side={side} f={frame} />
      </div>
    </SpeedBlur>
  );

  return (
    <AbsoluteFill style={{ background: P.bg[1], overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${shakeX.toFixed(2)}px, ${shakeY.toFixed(2)}px) scale(${push.toFixed(5)})` }}>
        {/* Establishing section: paper + question + diagonal ink line */}
        {!impacted && (
          <>
            <Stage look={P} keyLight={{ x: 0.5, y: 0.2 }} fill={null} vignette={0.14} grain={0} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: 386, textAlign: 'center' }}>
              <div style={{ ...type(30, 800, { caps: true }), letterSpacing: '0.2em', color: RED, marginBottom: 30 }}>Product launch film</div>
              <div style={{ ...type(124, 880), color: INK }}>
                <TextReveal text="What does a promo take?" by="word" variant="rise" start={1} each={14} gap={3} />
              </div>
            </div>
            <div style={{
              position: 'absolute', left: 960 - preW / 2, top: 540 - 700, width: preW, height: 1400, background: INK,
              transform: `rotate(${SEAM_DEG}deg) scaleY(${preGrow.toFixed(4)})`,
              // Gap around the question: the ink line only grows above and below the text, not across it
              WebkitMaskImage: SEAM_GAP, maskImage: SEAM_GAP,
            }} />
          </>
        )}

        {half('L')}
        {half('R')}

        {impacted && (
          <>
            {/* Collision cut: paper-white 6px + narrow shadows on both sides */}
            <div style={{
              position: 'absolute', left: 960 - 22, top: 540 - 700, width: 44, height: 1400, transform: `rotate(${SEAM_DEG}deg)`,
              background: `linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(10,6,4,0.35) 38%, ${PAPER} 43%, ${PAPER} 57%, rgba(10,6,4,0.35) 62%, rgba(0,0,0,0) 100%)`,
            }} />
            {/* Shockwave ring + radial speed lines (single shot) */}
            {wave < 1 && (
              <div style={{
                position: 'absolute', left: 960 - mix(130, 640, wave), top: 540 - mix(130, 640, wave),
                width: mix(260, 1280, wave), height: mix(260, 1280, wave), borderRadius: '50%',
                border: `${mix(14, 1, wave).toFixed(2)}px solid ${alpha(PAPER, 0.85 * (1 - wave))}`,
              }} />
            )}
            {lines < 1 && (
              <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
                {Array.from({ length: 12 }, (_, i) => {
                  const a = (i / 12) * Math.PI * 2 + 0.26;
                  const r0 = mix(170, 420, lines);
                  const r1 = mix(260, 720, lines);
                  return (
                    <line key={i} x1={960 + Math.cos(a) * r0} y1={540 + Math.sin(a) * r0} x2={960 + Math.cos(a) * r1} y2={540 + Math.sin(a) * r1}
                      stroke={PAPER} strokeWidth={mix(8, 2, lines)} strokeLinecap="round" opacity={1 - lines} />
                  );
                })}
              </svg>
            )}
            {/* VS round stamp */}
            <div style={{
              position: 'absolute', left: 960 - 130, top: 540 - 130, width: 260, height: 260, borderRadius: '50%',
              transform: `rotate(${(SEAM_DEG - 8 * (1 - stamp)).toFixed(3)}deg) scale(${mix(1.9, 1, stamp).toFixed(4)})`,
              opacity: Math.min(1, stamp * 4),
              background: PAPER, border: `8px solid ${INK}`, boxSizing: 'border-box',
              boxShadow: `0 4px 0 ${alpha(INK, 0.9)}, 0 30px 60px -12px rgba(10,6,4,0.6)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: `2px solid ${alpha(INK, 0.35)}` }} />
              <span style={{ fontFamily: FONT.sans, fontSize: 124, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.06em', color: INK, marginLeft: -10, marginTop: -4 }}>
                VS
              </span>
            </div>
            {/* Conclusion bar */}
            <div style={{
              position: 'absolute', left: 960, top: 930, transform: `translate(-50%, ${((1 - verdict) * 40).toFixed(2)}px)`, opacity: verdict,
              height: 84, padding: '0 44px', borderRadius: 42, background: PAPER, display: 'flex', alignItems: 'center', gap: 18, whiteSpace: 'nowrap',
              boxShadow: '0 20px 44px -14px rgba(10,6,4,0.55)', ...type(38, 800), color: INK,
            }}>
              <ShortKitMark size={44} tone="light" />
              Direct the film. Let the agent shoot it.
            </div>
          </>
        )}
      </div>
      {/* Impact white flash (not affected by the shake) */}
      <AbsoluteFill style={{ background: PAPER, opacity: flash, pointerEvents: 'none' }} />
      <Grain opacity={0.06} step={2} blend="overlay" />
    </AbsoluteFill>
  );
};
