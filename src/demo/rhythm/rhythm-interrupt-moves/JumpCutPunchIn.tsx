// Three-step jump-cut punch-in (jump-cut-punch-in): rhythm editing | Godard jump cut / documentary punch-in.
// FakeDashboard A has a fixed composition, with the zoom center pinned to the center of the middle card in row 2 (Deploys)
// (1071px, 817px). Three hard cuts with no tweening zoom in step by step: the jump itself deliberately uses zero interpolate,
// so the cut frame lands in one frame. Each jump-cut frame gets a 2f full-frame brightness 0.92 darkening pulse as a tick.
// Keyframes: 0-34 scale 1.0 -> frame 35 jumps straight to 1.6 (35-36 darkening pulse) -> frame 70 jumps straight to 2.6
// (70-71 darkening pulse) -> last step 86-134 fully still (49f >= 45f).
// Texture: zoom uses CSS zoom (layout-level scaling; Chromium rasterizes at the zoomed size, so text edges stay sharp at 2.6x, Q2);
// the first two steps each have a very slow 0.8% drift push-in (in-out, no velocity jump at start or end) so the held frames are not dead, while the jump is still a hard cut;
// after the last step 16f ease-out finishes it is truly still. The target card has a real "selected state" in the UI (thin accent ring + soft glow),
// and on the third jump, "that is the one", the selection ring deepens a notch; the vignette tightens with each step to pull the eye to the target, with 4.5% grain over the whole piece.
import React from 'react';
import { AbsoluteFill, Freeze, useCurrentFrame } from 'remotion';
import { G, FakeDashboard } from '../../../shared/fixtures/Fixtures';
import { EASE, Grain, Vignette, mix, ramp } from '../../../shared/fixtures/Polish';

export const JUMP_CUT_PUNCH_IN_DURATION = 135; // 35f wide + 35f medium + 65f last step (incl. 49f truly still)

// Target card geometry (middle card in row 2 of the 3x2 grid):
// sidebar 220 + padding 36; card width (1920-220-72-56)/3 = 524.67, card height (1080-72-72-28)/2 = 454
const CARD_L = 220 + 36 + 524.67 + 28; // ≈808.67
const CARD_T = 72 + 36 + 454 + 28; // 590
const CARD_W = 524.67;
const CARD_H = 454;
const ORIGIN_X = CARD_L + CARD_W / 2; // ≈1071
const ORIGIN_Y = CARD_T + CARD_H / 2; // 817

const JUMP_1 = 35;
const JUMP_2 = 70;
const STEPS = [1.0, 1.6, 2.6]; // step difference >=1.5x, otherwise it reads as a camera shake

// Three hard-cut steps (zero tween)
const stepAt = (f: number): number => (f < JUMP_1 ? 0 : f < JUMP_2 ? 1 : 2);

// Drift within a step: first two steps push 0.8% in-out over 35f (a live camera), last step pushes 0.8% with 16f ease-out then holds still
const driftAt = (f: number): number => {
  const st = stepAt(f);
  if (st === 0) return mix(1, 1.008, ramp(f, 0, JUMP_1, EASE.smooth));
  if (st === 1) return mix(1, 1.008, ramp(f, JUMP_1, JUMP_2 - JUMP_1, EASE.smooth));
  return mix(1, 1.008, ramp(f, JUMP_2, 16, EASE.out));
};

// Jump-cut frame 2f darkening pulse (full-frame brightness 0.92)
const pulseAt = (f: number): number =>
  (f >= JUMP_1 && f <= JUMP_1 + 1) || (f >= JUMP_2 && f <= JUMP_2 + 1) ? 0.92 : 1;

export const JumpCutPunchIn: React.FC = () => {
  const frame = useCurrentFrame();
  const st = stepAt(frame);
  const s = STEPS[st]; // step scale: via CSS zoom (layout-level, changes only once per step)
  const drift = driftAt(frame); // drift within a step: via transform (sub-pixel smooth, no reflow)
  const b = pulseAt(frame);

  // Selection ring: quietly present in the first two steps; from the third jump, "that is the one", it deepens a notch with 8f ease-out (element layer, the frame does not animate)
  const lock = ramp(frame, JUMP_2, 8, EASE.out);
  const ringA = mix(0.42, 0.85, lock);
  const haloA = mix(0.07, 0.14, lock);

  return (
    <AbsoluteFill style={{ background: G.canvas, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          filter: b < 1 ? `brightness(${b})` : undefined,
          transform: `scale(${drift})`,
          transformOrigin: `${ORIGIN_X}px ${ORIGIN_Y}px`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            // zoom scales left/top along with itself: left = O/s - O => the zoom center O stays put on screen (same-origin jump cut)
            left: ORIGIN_X / s - ORIGIN_X,
            top: ORIGIN_Y / s - ORIGIN_Y,
            width: 1920,
            height: 1080,
            zoom: s,
          }}
        >
          <FakeDashboard variant="A" />
          {/* Target card selected state: accent 1.5px thin ring + soft glow, scaling together with the composition */}
          <div
            style={{
              position: 'absolute',
              left: CARD_L - 5,
              top: CARD_T - 5,
              width: CARD_W + 10,
              height: CARD_H + 10,
              borderRadius: 19,
              border: `1.5px solid rgba(91,99,211,${ringA.toFixed(3)})`,
              boxShadow: `0 0 0 5px rgba(91,99,211,${haloA.toFixed(3)}), 0 18px 48px -18px rgba(91,99,211,${(haloA * 1.6).toFixed(3)})`,
              boxSizing: 'border-box',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
      {/* Lens vignette: the closer the step, the heavier it presses, drawing the eye to the target card */}
      <Vignette strength={[0.1, 0.14, 0.18][st]} inner={0.52} color="#1a1c24" cx={ORIGIN_X / 1920} cy={0.56} />
      {/* Grain freezes once the last step finishes its push (86f), so the tail of the last step is pixel-level truly still */}
      <Freeze frame={JUMP_2 + 16} active={frame >= JUMP_2 + 16}>
        <Grain opacity={0.045} />
      </Freeze>
    </AbsoluteFill>
  );
};
