import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import { FakeDashboard } from '../../../shared/fixtures/Fixtures';
import { Backdrop, EASE, Grain, mix, ramp } from '../../../shared/fixtures/Polish';

// drone-dive-landing: a god's-eye view looking down on the whole page lying flat as a dashboard (near-vertical downward angle, shrunk and centered),
// the camera plunges down: the pitch levels out, the page enlarges and stands upright, and a final hovercraft-style long-tail deceleration
// settles steadily into a close-up straight in front of the hero card. A camera-move translation of an FPV drone dive landing.
//
// Revision notes: the page is no longer a thin sheet hanging in empty space: it hovers above a dot-grid floor
// (floor and page share one 3D world, the dots rush toward the lens during the dive as a speed reference), and the floor carries
// a same-shape contact shadow that tightens and solidifies as it "lands"; before the dive there is a ~2.5% lift-up wind-up; after settling
// the surroundings are lightly darkened, focus gathers on the hero card, and 1.2s is left to breathe.
//
// hero card = top-left cell of the FakeDashboard A grid:
// sidebar 220 + padding 36 = starts at x 256, column width (1628-56)/3 = 524;
// top bar 72 + padding 36 = starts at y 108, row height (936-28)/2 = 454.
// card center (256+262, 108+227) = (518, 335), transform-origin is pinned here throughout.
const HERO = { cx: 518, cy: 335, w: 524, h: 454 };
const DIVE_START = 24; // first 24f: god's-eye establishing + lift wind-up
const DIVE_END = 49; // main dive segment 25f, ease-in (cubic) faster and faster
const LAND_END = 69; // hover segment 20f, ease-out (quint) long-tail deceleration, truly still afterwards
const DIVE_SHARE = 0.82; // dive segment takes 82% of the travel, the remaining 18% is left to the hover
const PRE_LIFT = 0.025; // camera lifts before the dive (travel backs up 2.5%): wind-up before the big move
export const DRONE_DIVE_LANDING_DURATION = 105; // hold 36f (1.2s) after settling

// the page is laid out at the end-point magnification (CSS zoom), then scaled back as a whole by scale(1/Z):
// the 3D compositing layer is rasterized at 1.35x resolution, so the end close-up text isn't blurry (aesthetic guideline Q2)
const Z = 1.35;
const LIFT = 150; // starting hover height (page-local px, about 60px after the world scale)

// one travel p: wind-up (-2.5%) → dive → hover
const travel = (frame: number) => {
  const pre = -PRE_LIFT * ramp(frame, 4, DIVE_START - 4, EASE.smooth);
  if (frame < DIVE_START) return pre;
  const pDive = interpolate(frame, [DIVE_START, DIVE_END], [-PRE_LIFT, DIVE_SHARE], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });
  if (frame < DIVE_END) return pDive;
  return (
    DIVE_SHARE +
    interpolate(frame, [DIVE_END, LAND_END], [0, 1 - DIVE_SHARE], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.poly(5)),
    })
  );
};

// floor dot grid: a large plane spread out around the hero, fading radially into the distance, with no hard edge drawn
const FLOOR = { x: -2400, y: -1500, w: 6720, h: 3300 };
const floorStyle: React.CSSProperties = {
  position: 'absolute',
  left: FLOOR.x,
  top: FLOOR.y,
  width: FLOOR.w,
  height: FLOOR.h,
  backgroundImage: 'radial-gradient(circle at 3px 3px, rgba(40,44,60,0.34) 2.2px, rgba(40,44,60,0) 3.2px)',
  backgroundSize: '48px 48px',
  backgroundPosition: `${(-FLOOR.x) % 48}px ${(-FLOOR.y) % 48}px`,
  WebkitMaskImage: `radial-gradient(ellipse ${FLOOR.w * 0.36}px ${FLOOR.h * 0.42}px at ${-FLOOR.x + 960}px ${-FLOOR.y + 600}px, #000 30%, transparent 100%)`,
  maskImage: `radial-gradient(ellipse ${FLOOR.w * 0.36}px ${FLOOR.h * 0.42}px at ${-FLOOR.x + 960}px ${-FLOOR.y + 600}px, #000 30%, transparent 100%)`,
};

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const p = travel(frame);

  // three axes move together, all driven by the same p (one continuous maneuver of one "camera")
  const rotX = mix(72, 0, p); // pitch levels out
  const scale = mix(0.42, 1.35, p); // shrunk full view → hero close-up
  // translation: at the start the whole page lies flat in the middle of the frame; at the end the hero card center faces the frame center
  const tx = mix(256, 960 - HERO.cx, p);
  const ty = mix(170, 540 - HERO.cy, p);

  // landing: hover height shrinks to 0 with travel (touches down exactly at the end of the hover segment)
  const lift = LIFT * Math.pow(1 - Math.min(1, Math.max(0, p)), 1.4);
  // contact shadow: when high, large and soft, offset down-right (key light top-left); on landing, tightens and solidifies
  const shOff = lift * 0.22;
  const shBlur = 22 + lift * 0.42;
  const shOp = interpolate(p, [0, 0.9, 1], [0.16, 0.12, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {/* camera = perspective container; floor + page share one world, doing rotateX + scale + translate around the hero card center */}
      <AbsoluteFill style={{ perspective: 1400 }}>
        <div
          style={{
            position: 'absolute',
            width: 1920,
            height: 1080,
            transformOrigin: `${HERO.cx}px ${HERO.cy}px`,
            transform: `translate(${tx}px, ${ty}px) rotateX(${rotX}deg) scale(${scale})`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* floor dot grid (rushes toward the lens during the dive = speed reference) */}
          <div style={{ ...floorStyle, opacity: 1 - 0.45 * Math.min(1, Math.max(0, p)) }} />
          {/* floor contact shadow: same shape as the page, tightens as it lands */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 1920,
              height: 1080,
              borderRadius: 18,
              background: 'rgba(22,24,34,1)',
              opacity: shOp,
              filter: `blur(${shBlur.toFixed(1)}px)`,
              transform: `translate3d(${(shOff * 0.5).toFixed(1)}px, ${shOff.toFixed(1)}px, 1px) scale(${(1 + lift * 0.0004).toFixed(4)})`,
            }}
          />
          {/* page body: hovers above the floor at height lift */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 1920,
              height: 1080,
              borderRadius: 16,
              overflow: 'hidden',
              transform: `translateZ(${lift.toFixed(2)}px)`,
              boxShadow: '0 0 0 1px rgba(20,22,28,0.10)',
            }}
          >
            <div style={{ width: 1920 * Z, height: 1080 * Z, transform: `scale(${1 / Z})`, transformOrigin: '0 0' }}>
              <div style={{ zoom: Z }}>
                <FakeDashboard variant="A" />
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// focus after settling: a light darkening ring around the hero card (screen space, hero already at the frame center), appears only in the still segment
const Focus: React.FC = () => {
  const frame = useCurrentFrame();
  const k = ramp(frame, LAND_END - 6, 22, EASE.out);
  if (k <= 0) return null;
  // on-screen size of the hero card at the end = 524×454 × 1.35
  const hw = (HERO.w * 1.35) / 2 + 40;
  const hh = (HERO.h * 1.35) / 2 + 40;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        opacity: k,
        background: `radial-gradient(${hw * 1.9}px ${hh * 1.9}px at 50% 50%, rgba(14,16,24,0) 48%, rgba(14,16,24,0.13) 100%)`,
      }}
    />
  );
};

export const DroneDiveLanding: React.FC = () => (
  <AbsoluteFill>
    {/* background stays still, placed outside the motion blur: stacking large gradients over multiple samples would quantize into color banding */}
    <Backdrop tone="light" light={{ x: 0.5, y: 0.12 }} grain={0} vignette={0.16} />
    <CameraMotionBlur shutterAngle={220} samples={12}>
      <Scene />
    </CameraMotionBlur>
    <Focus />
    {/* grain placed outside the motion blur: not averaged away by multi-sampling */}
    <Grain opacity={0.06} />
  </AbsoluteFill>
);
