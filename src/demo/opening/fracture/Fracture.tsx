// fracture: Fracture Reassemble (finalized in motion-lab, ported to native Remotion)
// 5×5 tiles gather from a random shattered 3D state (±large displacement + random rotation on all three axes) into a whole poster,
// settling in ripples outward from the center by Manhattan distance; after the hold all fragments accelerate outward, spinning, away from the center and fly off screen.
// Forward = opening, reversed = transition. Design coordinates are 480×270 (DesignStage scales proportionally); parameters are calibrated in this coordinate system.
//
// Texture upgrade:
// - The 25 tiles are cut from **the same poster** (each tile offsets background-position by its own cell), so the full picture only appears once assembled,
//   rather than 25 patches each with its own color; poster = cool deep field + soft upper-left light + a glowing horizon arc at the bottom + title
// - The title is printed on the poster (each tile carries its own slice of the text) and lights up in the hold; on exit the text is torn away with the fragments instead of fading out separately
// - Tiles are shaded by orientation (the more edge-on to the camera, the darker), 1px top-edge highlight; over the last ~10f of landing, one damped small wobble = a "click" into the slot
// - In the hold the whole poster pushes in very slowly by 3%; the flight segments (gather / scatter) are wrapped in CameraMotionBlur, the hold is not
// - The background goes from a dead flat #0b0b10 to a hue-tinted soft-light deep field + an ambient glow behind the poster that brightens with the degree of assembly
// - DesignStage uses raster="zoom": text inside the 3D tiles is rasterized at the target resolution, not by upscaling a bitmap with transform (Q2)
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import { DesignStage, E, rand, seg, useT } from '../../../shared/fixtures/Motion';
import { bezier, Backdrop, FONT, Grain } from '../../../shared/fixtures/Polish';
import { ShortKitWordmark } from '../../../shared/fixtures/Brand';

export const FRACTURE_DURATION = 156; // 5200ms @30fps

const N = 5;
const ACCENT_HUE = 218; // template accent hue, replaceable per project (the poster colors are all derived from it)
const PW = 380; // poster (assembled) design size
const PH = 230;
const TW = PW / N; // 76: grid pitch
const TH = PH / N; // 46
const SEAM = 0.5; // seam (design px, 2px after scale-up): after assembly it still reads as tiles, without cutting strokes out of the text

// gather curve: soft start, fast middle, long deceleration before landing (more "sucked" into the slot than a symmetric inOutCubic)
const landEase = bezier(0.42, 0, 0.3, 1);

// poster base image (the whole thing, drawn at PW×PH; each tile takes its own cell)
const h = ACCENT_HUE;
const POSTER_BG = [
  // glowing horizon arc at the bottom: a thin bright ring + soft halo outside
  `radial-gradient(circle at 64% 168%, rgba(0,0,0,0) 0 61%, hsla(${h},80%,78%,0.85) 61.6%, hsla(${h},70%,62%,0.28) 63.2%, hsla(${h},60%,50%,0) 70%)`,
  // ground light inside the arc
  `radial-gradient(ellipse 70% 55% at 64% 100%, hsla(${h},70%,55%,0.32) 0%, hsla(${h},70%,45%,0) 70%)`,
  // main light at the upper left
  `radial-gradient(ellipse 55% 75% at 18% 0%, hsla(${h},45%,78%,0.30) 0%, hsla(${h},45%,70%,0) 65%)`,
  // base color: cool deep-field vertical gradient
  `linear-gradient(165deg, hsl(${h},30%,21%) 0%, hsl(${h},34%,12%) 55%, hsl(${h},38%,8%) 100%)`,
].join(', ');

// tile parameter table: cell position + random shattered entrance state + exit direction (seeds identical to effect.js)
const TILES = Array.from({ length: N * N }, (_, seed) => {
  const r = Math.floor(seed / N);
  const c = seed % N;
  // exit direction: away from the frame center (center tiles get a random angle), guaranteeing everything flies off screen
  const ang =
    r === 2 && c === 2
      ? rand(seed + 300) * Math.PI * 2
      : Math.atan2(r - 2 + (rand(seed + 310) - 0.5) * 0.8, c - 2 + (rand(seed + 320) - 0.5) * 0.8);
  return {
    r,
    c,
    dx: (rand(seed) - 0.5) * 900,
    dy: (rand(seed + 50) - 0.5) * 600,
    dz: (rand(seed + 100) - 0.3) * 700,
    rx: (rand(seed + 150) - 0.5) * 360,
    ry: (rand(seed + 200) - 0.5) * 360,
    rz: (rand(seed + 250) - 0.5) * 360,
    exX: Math.cos(ang) * (620 + rand(seed + 330) * 260),
    exY: Math.sin(ang) * (470 + rand(seed + 340) * 220),
    exR: (rand(seed + 350) - 0.5) * 300,
    wob: rand(seed + 360) < 0.5 ? -1 : 1, // direction of the slot wobble
    delay: (Math.abs(r - 2) + Math.abs(c - 2)) * 0.045,
  };
});

// text on the poster: eyebrow + shorts-kit wordmark (logo + lowercase wordmark; printed on the poster and sliced with the tiles)
const PosterType: React.FC<{ on: number }> = ({ on }) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: PW,
      height: PH,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      // bottom padding 16 (= eyebrow height + gap): the wordmark center lands exactly on the center of the 3rd row of tiles (y=115), so the logo is not cut by a horizontal seam
      paddingBottom: 16,
      boxSizing: 'border-box',
      fontFamily: FONT.sans,
      color: '#f3f5fb',
      opacity: on,
    }}
  >
    <div style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: '0.24em', color: `hsla(${h},70%,86%,0.85)` }}>
      INTRODUCING
    </div>
    {/* at font size 22 the whole line is centered and the logo lands exactly inside the 2nd column of tiles (x≈76-119), not crossing a vertical seam */}
    <ShortKitWordmark size={22} tone="dark" gap={9} />
  </div>
);

const Scene: React.FC = () => {
  const t = useT();
  const T = FRACTURE_DURATION - 1; // t→frame conversion
  const typeOn = seg(t, 0.42, 0.52, E.outCubic);
  // very slow push-in in the hold (starts at 0.45, keeps its speed during the scatter without stopping abruptly)
  const push = 1 + 0.03 * seg(t, 0.45, 1, E.inOutQuad);
  // degree of assembly → ambient light behind the poster
  const whole = seg(t, 0.28, 0.55, E.outCubic) * (1 - seg(t, 0.7, 0.86, E.inQuad));
  return (
    <DesignStage raster="zoom">
      <Backdrop tone="dark" light={{ x: 0.5, y: 0.08 }} accent={`hsl(${h},70%,60%)`} grain={0} vignette={0.55} />
      {/* ambient light behind the poster: lights up as it assembles, as if the poster were glowing */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 52% 56% at 50% 52%, hsla(${h},70%,58%,0.26) 0%, hsla(${h},70%,50%,0) 70%)`,
          opacity: whole,
        }}
      />
      <div style={{ position: 'absolute', inset: 0, perspective: 900, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: PW,
            height: PH,
            margin: `${-PH / 2}px 0 0 ${-PW / 2}px`,
            transformStyle: 'preserve-3d',
            transform: `scale(${push})`,
          }}
        >
          {TILES.map((tl, i) => {
            const land = tl.delay + 0.34;
            const tin = seg(t, tl.delay, land, landEase);
            // exit window tightened: the last corner tile takes off from 0.79 and finishes flying before 0.97 (the original 0.85 takeoff left it not yet off screen at t=1)
            const tout = seg(t, 0.7 + tl.delay * 0.5, 0.7 + tl.delay * 0.5 + 0.18, E.inCubic);
            const inv = 1 - tin; // entrance: shattered state → in place
            // slot wobble: within ~10f after landing, one damped rotateX swing (≤2.5°) + a slight press into z
            const since = (t - land) * T; // frames elapsed since landing
            const settle = since > 0 && since < 14 ? Math.exp(-since / 3.2) * Math.sin(since * 0.75) : 0;
            const rx = tl.rx * inv + tl.wob * 2.5 * settle;
            const ry = tl.ry * inv;
            const rz = tl.rz * inv + tl.exR * tout;
            const tz = tl.dz * inv - 4 * Math.abs(settle);
            // orientation shading: the further the normal is from the camera, the darker (cosθ = cos rx · cos ry)
            const facing = Math.abs(Math.cos((rx * Math.PI) / 180) * Math.cos((ry * Math.PI) / 180));
            const shade = (1 - facing) * 0.6;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: tl.c * TW + SEAM / 2,
                  top: tl.r * TH + SEAM / 2,
                  width: TW - SEAM,
                  height: TH - SEAM,
                  borderRadius: 1.6,
                  overflow: 'hidden',
                  transform: `translate3d(${tl.dx * inv + tl.exX * tout}px,${tl.dy * inv + tl.exY * tout}px,${tz}px)
          rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`,
                  opacity: Math.min(1, tin * 2.5), // no fade on exit, the solid flies off screen
                  boxShadow: `inset 0 0.35px 0 rgba(255,255,255,0.16), inset 0 0 0 0.3px rgba(255,255,255,0.07)`,
                }}
              >
                {/* this cell's poster slice (base image + text), offset in reverse by cell position */}
                <div style={{ position: 'absolute', left: -tl.c * TW - SEAM / 2, top: -tl.r * TH - SEAM / 2, width: PW, height: PH, background: POSTER_BG }}>
                  <PosterType on={typeOn} />
                </div>
                {/* orientation shading */}
                {shade > 0.004 && <div style={{ position: 'absolute', inset: 0, background: `rgba(4,6,12,${shade.toFixed(3)})` }} />}
              </div>
            );
          })}
        </div>
      </div>
    </DesignStage>
  );
};

export const Fracture: React.FC = () => {
  const t = useT();
  // motion blur only on the flight segments: gather (t<0.53) and scatter (t>0.7); the hold reads the text, so it stays sharp
  const flying = t < 0.53 || t > 0.7;
  return (
    <AbsoluteFill>
      {flying ? (
        <CameraMotionBlur shutterAngle={170} samples={8}>
          <Scene />
        </CameraMotionBlur>
      ) : (
        <Scene />
      )}
      {/* grain sits outside the blur (multi-sampling would smooth the grain away) */}
      <Grain opacity={0.08} blend="soft-light" />
    </AbsoluteFill>
  );
};
