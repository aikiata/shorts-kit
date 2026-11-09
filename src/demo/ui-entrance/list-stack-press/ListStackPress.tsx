// list-stack-press: list cards fly up from the bottom one by one and pile up, each landing presses and bounces the whole pile, the counter ticks a notch in sync
// "Stacks have weight": as each new card lands, the already-settled pile is pressed down then springs back; through the physical feedback you read
// "this was really accumulated". The reference implementation is stripped out of the template ScenePapers:
// an anticipation beat (the counter lights up and shrinks slightly 4–6f before the first card, drawing the eye to the stack area); 5 cards on an even 12f beat
// rise from 600px below (alternating ±2° tilt flattening + scale 1.06→1); when the next card arrives the whole pile presses down
// 6px and bounces back in 8f (the stackPress pulse, the key stroke for "has weight"); after landing the highlight bar grows
// 2–4f late; at the end a glaze sweep passes over the whole pile; the screen-space DigitRoll counter rolls one notch per landed card.
// Front-facing camera (stack/list shots must be front-facing, Q6), with the camera following the stack downward.
// Texture layer (revision):
// · the camera changes from 5 keyframe segments (each ease-in-out on its own, velocity zero at keyframes) to one continuous curve fed to PageCam2D frame by frame
// · flying cards get vertical motion blur by speed; shadows become two layers that vary with height off the ground (contact shadow + ambient shadow)
// · the highlight bar is aligned from the screenshot measurement to the line with the "project-related" project name, laid under the text with multiply (highlighter), no longer covering the body text
// · the glaze now sweeps after the last card settles, and is clipped inside each card's rounded corners (Q4)
// · the counter digits explicitly use system sans-serif + tabular-nums (previously they fell back to the browser default serif), with a vertical trail while rolling
import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, Easing } from 'remotion';
import { PageCam2D, CamKey2D } from '../../../shared/fixtures/PageCam2D';
import { FONT, SpeedBlur, bezier, softShadow, velocity } from '../../../shared/fixtures/Polish';
import layout from '../../../shared/fixtures/live-layout.json';

export const LIST_STACK_PRESS_DURATION = 88; // 18–88f falls inside the shot at offset 0

const cards = layout.papers.cards;
const PAGE_H = layout.papers.pageH;
const MONO = FONT.mono;
const AMBER = 'oklch(52% 0.115 65)';
const FILES = ['paper1.png', 'paper2.png', 'paper3.png', 'paper4.png', 'paper5.png'];
// Measured from the screenshot: the line with the "project-related" project name in each card (page px, in-card coordinates); the highlight bar covers only this line
const HL_TOP = 156, HL_H = 20, HL_LEFT = 16;
const HL_W = [187, 244, 247, 240, 191];

const CUES = [6, 18, 30, 42, 54]; // 6f before the first card is left for the counter anticipation beat (anticipation)
const DUR = 22;
const FLY_EASE = Easing.bezier(0.45, 0.05, 0.25, 1.12);
const TILTS = [2, -2, 2, -2, 2];

// Anticipation beat: the counter lights up before the first card + shrinks slightly (0.96→1), drawing the eye to the stack area (once at the segment level)
const ANTICIPATE_START = 0;
const ANTICIPATE_END = 6;

// Camera: one continuous curve (page-header close-up 1.35 → full view of the whole pile 0.86), following the stack vertically;
// vertical position moves first, the push/pull ends slightly later, still after 82f, leaving room for the sweep and the counter to settle
const CAM_END = 82;
const CY_EASE = bezier(0.42, 0, 0.2, 1);
const Z_EASE = bezier(0.3, 0, 0.18, 1);
const camAt = (f: number) => {
  const u = Math.min(1, Math.max(0, f / CAM_END));
  return { cx: 960, cy: 270 + (815 - 270) * CY_EASE(u), zoom: 1.35 + (0.86 - 1.35) * Z_EASE(u) };
};
// Per-frame keyframes + linear interpolation = hand a continuous curve as-is to PageCam2D (its segmented easing would pause at keyframes)
const CAM_KEYS: CamKey2D[] = Array.from({ length: LIST_STACK_PRESS_DURATION }, (_, f) => ({ frame: f, ...camAt(f) }));
const LINEAR = (t: number) => t;

// odometer digit column: a continuous odometer, not remounted: `pos` is a continuous position along the digit strip
// (0→5), each card landing rolls pos one more notch. A single-notch roll must be shorter than the 12f card-landing gap,
// and the last notch must settle before the shot ends: the key-remount approach that rerolls 22f from 0 trips on both
// (the previous notch never finishes rolling, and the last frame stalls at 4).
const DIGITS = '0123456789';
const ROLL_DUR = 8; // frames per single-notch roll, < the 12f card-landing gap
const ROLL_EASE = Easing.bezier(0.25, 0.8, 0.25, 1);
const rollAt = (frame: number) => {
  let pos = 0;
  for (const c of CUES) {
    pos += interpolate(frame, [c + DUR, c + DUR + ROLL_DUR], [0, 1], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ROLL_EASE,
    });
  }
  return pos;
};
const DigitRoll: React.FC<{ pos: number; lineH: number; color: string; blur: number }> = ({ pos, lineH, color, blur }) => (
  <span style={{ display: 'inline-flex', overflow: 'hidden', height: lineH, verticalAlign: 'bottom' }}>
    <span style={{ display: 'inline-block', height: lineH }}>
      <span style={{ display: 'block', transform: `translateY(${-pos * lineH}px)`, filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined }}>
        {(DIGITS + DIGITS).split('').map((d, j) => (
          <span
            key={j}
            style={{
              display: 'block', fontFamily: FONT.sans, fontWeight: 500, fontSize: 104, letterSpacing: '-0.04em',
              lineHeight: `${lineH}px`, color, fontVariantNumeric: 'tabular-nums',
            }}
          >
            {d}
          </span>
        ))}
      </span>
    </span>
  </span>
);

// Flight progress (with overshoot) and vertical displacement, as pure functions of the frame: velocity blur must be evaluated on adjacent frames
const flyT = (i: number, f: number) =>
  interpolate(f, [CUES[i], CUES[i] + DUR], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: FLY_EASE });
const flyY = (i: number, f: number) => 600 * (1 - flyT(i, f));

export const ListStackPress: React.FC = () => {
  const frame = useCurrentFrame();
  // Counter continuous position: rolls forward one notch when each card lands (cue+DUR), settling in 8f.
  // The last card lands at f76 and settles at f84, before the shot ends at f88.
  const rollPos = rollAt(frame);
  const rollV = Math.abs(velocity(rollAt, frame)); // notches/frame

  // Anticipation beat: over 0→6f the counter shrinks slightly from scale 0.96 back to 1 and lights up, drawing the eye first to the stack area
  const antT = interpolate(frame, [ANTICIPATE_START, ANTICIPATE_END], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad),
  });
  const counterScale = 0.96 + 0.04 * antT;
  const counterOpacity = 0.3 + 0.7 * antT;

  // when a *later* card enters, the settled stack gets pressed down 6px then
  // springs back over ~8 frames
  const stackPress = (settledIndex: number) => {
    let press = 0;
    for (let j = settledIndex + 1; j < CUES.length; j++) {
      const cue = CUES[j];
      const p = interpolate(frame, [cue, cue + 4, cue + 8], [0, 6, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin),
      });
      press = Math.max(press, p);
    }
    return press;
  };

  // glaze: after the last card settles at f76, sweeps from the upper left across the whole pile (page coordinates), visible only inside the card rounded corners
  const glazeX = interpolate(frame, [74, 87], [-500, 2300], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.35, 1),
  });
  const glazeVis = interpolate(frame, [74, 77, 84, 87], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#faf7f2' }}>
      <PageCam2D src="textures/live/papers-full.png" pageH={PAGE_H} keys={CAM_KEYS} ease={LINEAR}>
        {/* cover the printed cards so blank slots stack in */}
        {cards.map((c, i) => (
          <div
            key={`slot-${i}`}
            style={{
              position: 'absolute', left: c.x - 12, top: c.y - 10,
              width: c.w + 24, height: c.h + 20, background: '#faf7f2',
              opacity: frame >= CUES[i] + DUR - 2 ? 0 : 1,
            }}
          />
        ))}

        {cards.map((c, i) => {
          const cue = CUES[i];
          const t = flyT(i, frame);
          if (t <= 0) return null;
          const settled = t >= 0.999;
          const dy = flyY(i, frame) + (settled ? stackPress(i) : 0);
          const rot = TILTS[i] * (1 - t);
          const scale = 1.06 - 0.06 * t;
          // Height off the ground: in the flight segment mapped 0–56px by remaining travel, 3px when settled (closer to the ground when pressed)
          const elev = settled ? 3 - stackPress(i) * 0.3 : 3 + 53 * Math.min(1, Math.max(0, 1 - t));
          const vy = settled ? 0 : velocity((f) => flyY(i, f), frame);

          // Highlight bar: grows 3f late after landing; the last card has only 12f left before the cut, so the beat is compressed to 5f of growth + 4f of fade
          const lastCard = i === CUES.length - 1;
          const hlStart = cue + DUR + (lastCard ? 2 : 3);
          const hlLen = lastCard ? 5 : 7;
          const hlGrow = interpolate(frame, [hlStart, hlStart + hlLen], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.3, 0, 0.2, 1),
          });
          const hlFade = interpolate(frame, [hlStart + hlLen, hlStart + hlLen + (lastCard ? 4 : 5)], [1, 0], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });

          const card = (
            <div
              style={{
                position: 'absolute', left: c.x, top: c.y, width: c.w, height: c.h,
                transform: `translateY(${dy.toFixed(3)}px) rotate(${rot.toFixed(4)}deg) scale(${scale.toFixed(5)})`,
                transformOrigin: 'center center', borderRadius: 12,
                boxShadow: softShadow(elev, { color: '#3c2d1e', strength: 1.15 }),
              }}
            >
              <div style={{ position: 'absolute', inset: 0, borderRadius: 12, overflow: 'hidden' }}>
                <Img src={staticFile(`textures/live/${FILES[i]}`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
                {hlGrow > 0 && hlFade > 0 ? (
                  // Highlighter: laid under the text with multiply, text keeps its original depth
                  <div
                    style={{
                      position: 'absolute', left: HL_LEFT, top: HL_TOP, height: HL_H,
                      width: HL_W[i] * hlGrow, borderRadius: 3,
                      background: 'oklch(90% 0.075 82)', mixBlendMode: 'multiply', opacity: 0.85 * hlFade,
                      pointerEvents: 'none',
                    }}
                  />
                ) : null}
                {/* glaze: a diagonal soft light sweeping continuously across the whole pile in page coordinates, clipped by each card's rounded corners */}
                {glazeVis > 0 && (
                  <div
                    style={{
                      position: 'absolute', top: -200, height: c.h + 400, left: glazeX - c.x - (c.y - 200) * 0.25, width: 360,
                      transform: 'rotate(14deg)', opacity: glazeVis * 0.55, mixBlendMode: 'soft-light',
                      background: 'linear-gradient(90deg, rgba(255,236,200,0), rgba(255,226,170,0.95) 45%, rgba(255,226,170,0.95) 55%, rgba(255,236,200,0))',
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </div>
              {/* Top 1px lit edge + hairline (the screenshot card already carries a light outline, only the lit edge is added here) */}
              <div style={{ position: 'absolute', inset: 0, borderRadius: 12, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)', pointerEvents: 'none' }} />
            </div>
          );
          return Math.abs(vy) > 1 ? (
            <SpeedBlur key={FILES[i]} vx={0} vy={vy} amount={0.22} max={14}>
              {card}
            </SpeedBlur>
          ) : (
            <React.Fragment key={FILES[i]}>{card}</React.Fragment>
          );
        })}
      </PageCam2D>

      {/* screen-space counter, top-right — lands one digit per card */}
      <div
        style={{
          position: 'absolute', top: 70, right: 96, textAlign: 'right',
          pointerEvents: 'none', opacity: counterOpacity,
          transform: `scale(${counterScale})`, transformOrigin: 'top right',
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 500, letterSpacing: '0.18em', color: 'oklch(48% 0.008 82)', textTransform: 'uppercase' }}>
          Paper Radar
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <DigitRoll pos={rollPos} lineH={104 * 1.12} color={AMBER} blur={Math.min(6, rollV * 30)} />
        </div>
        <div style={{ height: 1, background: 'oklch(80% 0.01 82)', margin: '8px 0 10px auto', width: 220 }} />
        <div style={{ fontFamily: MONO, fontSize: 19, letterSpacing: '0.14em', color: 'oklch(52% 0.008 82)', textTransform: 'uppercase' }}>
          Of 31 Fetched Today
        </div>
      </div>
    </AbsoluteFill>
  );
};
