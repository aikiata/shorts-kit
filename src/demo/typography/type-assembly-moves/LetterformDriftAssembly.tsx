// Letterform drift assembly (letterform-drift-assembly): Stranger Things title-style entrance.
// The brand name "shorts-kit" (BRAND.short, short for shorts-kit) is split into 9 characters: each drifts in slowly from a different direction (h(i) seeded random vector,
// magnitude ±260–360px) with blur 8px + opacity 0.35, landing staggered
// (delay i×3f, 45f travel, Easing.out(cubic)). The moment each letter locks it gets one
// "deepen pulse": letter color ink→#000→ink + stroke 0→3px→0 (8f); on a white background
// we deepen instead of glowing (library precedent). After all have assembled the whole word does a scale 1→1.04→1 closing breath
// (precedent: 1.02 is too weak, raised to 1.04).
// Keyframes: 0–24 letters set off staggered → letter i drifts in and lands over [i*3, i*3+45] →
// lock frame i*3+45 starts an 8f deepen pulse (last letter 69–77) → 80–104 whole-word breath →
// 104–150 fully still (46f, no per-frame filters).
//
// Quality upgrade: removed the debug title; soft-glow Backdrop; system SF stack 700, a hue-tinted near-black ink;
// besides displacement/blur/opacity the drift binds the same p to a rotation (±24°→0) and depth scale (1.22→1),
// so each letter floats back to the page from the space in front of the lens rather than sliding flat; after assembly a very faint ground shadow floats up under the letters.
// Added an exported duration of 150f (the original workbench inferred 56f, so the render stopped mid-air).
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../../shared/fixtures/Fixtures';
import { Backdrop, EASE, FONT, ramp } from '../../../shared/fixtures/Polish';
import { BRAND } from '../../../shared/fixtures/Brand';

export const LETTERFORM_DRIFT_ASSEMBLY_DURATION = 150;

const h = (n: number) => {
  const s = Math.sin(n * 127.3) * 43758.5453;
  return s - Math.floor(s);
};

const WORD = BRAND.short; // 'shorts-kit': the title-style reveal lands on the brand name
const TRAVEL = 45; // drift-in travel frames per letter
const STAG = 3; // stagger interval
const INK = [23, 24, 28]; // G.ink1 #17181c

export const LetterformDriftAssembly: React.FC = () => {
  const frame = useCurrentFrame();
  const chars = WORD.split('');
  const lastLock = (chars.length - 1) * STAG + TRAVEL; // 69

  // Whole-word closing breath: 80–92 grows to 1.04, 92–104 falls back, then constant 1 → frame-deterministic
  const breath =
    frame < 92
      ? interpolate(frame, [80, 92], [1, 1.04], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.inOut(Easing.cubic),
        })
      : interpolate(frame, [92, 104], [1.04, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.inOut(Easing.cubic),
        });
  // Ground shadow after assembly
  const ground = ramp(frame, lastLock - 6, 30, EASE.out);

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden' }}>
      <Backdrop tone="light" light={{ x: 0.5, y: 0.32 }} accent="#5b63d3" grain={0.05} vignette={0.14} />
      {/* Ground shadow: a very faint elliptical shadow that appears under the letters after assembly */}
      <div
        style={{
          position: 'absolute',
          left: 960 - 520,
          top: 540 + 70,
          width: 1040,
          height: 70,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(20,22,32,0.13), rgba(20,22,32,0) 70%)',
          opacity: ground,
          transform: `scale(${breath})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${breath})`,
        }}
      >
        {chars.map((c, i) => {
          const start = i * STAG;
          const lock = start + TRAVEL;
          // Drift-in progress (displacement / blur / opacity / rotation / depth share one p)
          const p = interpolate(frame, [start, lock], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic),
          });
          // Seeded start vector: direction h(i), magnitude 260–360px
          const ang = h(i + 1) * Math.PI * 2;
          const mag = 260 + h(i + 101) * 100;
          const dx = Math.cos(ang) * mag * (1 - p);
          const dy = Math.sin(ang) * mag * (1 - p);
          const rot = (h(i + 201) - 0.5) * 48 * (1 - p);
          const depth = 1 + 0.22 * (1 - p);
          const blur = 8 * (1 - p);
          const op = interpolate(p, [0, 1], [0.35, 1]);
          // Lock deepen pulse: lock→lock+8, triangle wave 0→1→0
          const pulse =
            frame <= lock || frame >= lock + 8
              ? 0
              : frame < lock + 4
                ? (frame - lock) / 4
                : (lock + 8 - frame) / 4;
          const color = `rgb(${INK.map((v) => Math.round(v * (1 - pulse))).join(',')})`;
          const strokeW = 3 * pulse;
          const settled = p >= 1 && pulse === 0;
          return (
            <span
              key={i}
              style={{
                fontFamily: FONT.sans,
                fontWeight: 700,
                fontSize: 148,
                letterSpacing: '0.02em',
                color: settled ? G.ink1 : color,
                display: 'inline-block',
                transform: settled
                  ? undefined
                  : `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) rotate(${rot.toFixed(2)}deg) scale(${depth.toFixed(4)})`,
                opacity: op,
                filter: blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : undefined,
                WebkitTextStroke: strokeW > 0.01 ? `${strokeW.toFixed(2)}px #000` : undefined,
              }}
            >
              {c}
            </span>
          );
        })}
      </div>
    </div>
  );
};
