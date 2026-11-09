// grain-dissolve: Grain Dissolve → Condense, text turns to grain and condenses (motion-lab final, ported to native Remotion)
// A clean full line "{ shorts-kit. Now Live }" first bursts into boiling grain noise (outline faintly legible, white glow),
// while a selection box with 45° hatch fill and pixel-square corner handles appears; about halfway through the noise boiling the selection box disappears,
// and the noise cloud rapidly condenses into a larger grainy short wordmark (the shorts-kit wordmark, all lowercase), displacement decays to zero, the glow peaks then settles,
// solidifying into a crisp glowing short wordmark. The four-corner HUD brackets / dots and the short left and right centerline dashes stay throughout.
// Filter chain: feTurbulence seed per frame + displacement scale animated both ways; the final text goes through the filter too, then it is released.
// Texture upgrade: the SVG is rasterized directly at native 1920×1080 (viewBox 640×360, 1 unit = 3px),
// so the noise grain is a fine 2–3px instead of a 4x enlarged smudge; the glow is made inside the filter chain as two layers, "tight + wide" cool-white bloom;
// plus a cloud of deterministic loose grains: blown apart during the dissolve, pulled back into the wordmark with increasing speed during condensing, extinguished on solidifying;
// the wordmark shrinks from 1.06 to 1 while condensing ("being compacted"), and at the condensing peak a horizontal light streak appears once only.
import React, { useId } from 'react';
import { AbsoluteFill } from 'remotion';
import { E, rand, seg, useT } from '../../../shared/fixtures/Motion';
import { Backdrop, FONT } from '../../../shared/fixtures/Polish';
import { BRAND } from '../../../shared/fixtures/Brand';

export const GRAIN_DISSOLVE_DURATION = 60; // 2000ms @30fps

// Selection box geometry (viewBox coordinates)
const BX = 128;
const BY = 148;
const BW = 384;
const BH = 62;

// 45° hatch: one stripe every 34 starting at x = bx-bh, bottom-right → top-left
const HATCH_XS: number[] = [];
for (let x = BX - BH; x < BX + BW; x += 34) HATCH_XS.push(x);

// Loose grains: starts scattered across the band of the full line, ends land within the glyph extent of the short wordmark (deterministic seed)
const SAND = Array.from({ length: 150 }, (_, i) => {
  const r = (k: number) => rand(i * 13.7 + k * 101.3);
  const hx = 140 + r(1) * 360; // Full-line band: x 140–500
  const hy = 168 + r(2) * 26; // y 168–194
  const ang = r(3) * Math.PI * 2;
  return {
    hx, hy,
    dx: Math.cos(ang) * (8 + r(4) * 26), // Displacement when blown apart during the dissolve
    dy: Math.sin(ang) * (5 + r(5) * 14),
    tx: 140 + r(6) * 360, // Glyph extent of the short wordmark (shorts-kit 44px): x 140–500
    ty: 170 + r(7) * 28, // y 170–198
    size: 0.35 + r(8) * 0.75,
    alpha: 0.25 + r(9) * 0.6,
    lag: r(10) * 0.05, // Staggered start of the pull back (not evenly spaced)
    ph: r(11) * Math.PI * 2,
  };
});

// Corner pixel checkerboard handles (two offset 5×5 squares)
const Handle: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x - 5},${y - 5})`} fill="#d6d9e0">
    <rect width={5} height={5} />
    <rect x={5} y={5} width={5} height={5} />
  </g>
);

// HUD brackets + dots (sx/sy control orientation)
const Corner: React.FC<{ x: number; y: number; sx: number; sy: number }> = ({ x, y, sx, sy }) => (
  <>
    <path
      d={`M${x + 14 * sx} ${y}H${x}V${y + 14 * sy}`}
      fill="none"
      stroke="#474a55"
      strokeWidth={1.1}
      strokeLinecap="square"
    />
    <circle cx={x + 34 * sx} cy={y + 28 * sy} r={1.3} fill="#7d808b" />
  </>
);

export const GrainDissolve: React.FC = () => {
  const t = useT();
  // Filter / clipPath IDs are generated per instance, so multiple instances in one Composition do not reference each other
  // (the «:» from useId is illegal inside CSS url(); sanitized to pure alphanumerics)
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const fid = `gd-${uid}`;
  const cid = `gd-${uid}-clip`;
  const sid = `gd-${uid}-streak`;
  const burst = seg(t, 0.13, 0.28, E.outCubic); // Clean text → grain
  const cond = seg(t, 0.60, 0.71, E.inOutCubic); // Full-line noise cloud → short-wordmark noise cloud
  const lock = seg(t, 0.68, 0.90, E.outCubic); // Displacement decays, solidifies
  const settle = seg(t, 0.88, 1, E.outCubic); // Glow settles
  // White glow: slight during the dissolve, peaks while condensing, settles to a soft glow after solidifying
  const glow = Math.max(0, burst * 0.3 + cond * 0.7 - settle * 0.45);
  // Selection box: expands horizontally from the centerline with burst, closes and exits at 0.55–0.64 (before condensing finishes)
  const boxOut = seg(t, 0.55, 0.64, E.inCubic);
  const boxOpen = burst * (1 - boxOut * 0.35);
  const boxOp = Math.min(1, burst * 1.4) * (1 - boxOut);
  // Wordmark compacted: 1.06 → 1 during condensing (converges with the lock curve)
  const markScale = 1 + 0.06 * (1 - lock);
  // Horizontal light streak: appears once only at the condensing peak (rises with cond, dies out late in lock)
  const streak = cond * (1 - seg(t, 0.74, 0.92, E.outCubic));
  const boil = Math.floor(t * 46); // Boil beat synced with the seed

  return (
    <AbsoluteFill style={{ background: '#0a0b0e' }}>
      <Backdrop tone="dark" light={{ x: 0.5, y: 0.47 }} grain={0.07} vignette={0.6} />
      <svg
        viewBox="0 0 640 360"
        width={1920}
        height={1080}
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <filter id={fid} x="-40%" y="-150%" width="180%" height="400%" colorInterpolationFilters="sRGB">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={0.9 + burst * 0.4}
              numOctaves={2}
              seed={boil}
              result="n"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="n"
              scale={burst * 52 * (1 - lock)}
              xChannelSelector="R"
              yChannelSelector="G"
              result="d"
            />
            <feGaussianBlur in="d" stdDeviation={burst * 1.1 * (1 - lock)} result="core" />
            {/* Two bloom layers: tight light (bright halo at glyph edges) + wide light (scatter in the air), leaning cool white, intensity follows the glow envelope */}
            <feGaussianBlur in="core" stdDeviation={1.2 + glow * 1.6} result="g1" />
            <feColorMatrix in="g1" type="matrix" result="g1c"
              values={`0 0 0 0 0.86  0 0 0 0 0.9  0 0 0 0 1  0 0 0 ${(0.15 + glow * 0.95).toFixed(3)} 0`} />
            <feGaussianBlur in="core" stdDeviation={5 + glow * 6} result="g2" />
            <feColorMatrix in="g2" type="matrix" result="g2c"
              values={`0 0 0 0 0.62  0 0 0 0 0.68  0 0 0 0 1  0 0 0 ${(glow * 0.75).toFixed(3)} 0`} />
            <feMerge>
              <feMergeNode in="g2c" />
              <feMergeNode in="g1c" />
              <feMergeNode in="core" />
            </feMerge>
          </filter>
          <linearGradient id={sid} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#9fb0ff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#eef1ff" stopOpacity="1" />
            <stop offset="1" stopColor="#9fb0ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Four-corner HUD brackets + dots + short left and right centerline dashes (present throughout) */}
        <g>
          <Corner x={88} y={96} sx={1} sy={1} />
          <Corner x={552} y={96} sx={-1} sy={1} />
          <Corner x={88} y={264} sx={1} sy={-1} />
          <Corner x={552} y={264} sx={-1} sy={-1} />
          <line x1={52} y1={180} x2={76} y2={180} stroke="#4c4f5a" strokeWidth={1.1} strokeDasharray="4 3" />
          <line x1={564} y1={180} x2={588} y2={180} stroke="#4c4f5a" strokeWidth={1.1} strokeDasharray="4 3" />
        </g>
        {/* Selection box: expands horizontally from the centerline during the dissolve, closes and is removed before condensing */}
        {boxOp > 0.002 && (
          <g opacity={boxOp} transform={`translate(320 0) scale(${(0.2 + 0.8 * boxOpen).toFixed(4)} 1) translate(-320 0)`}>
            <clipPath id={cid}>
              <rect x={BX} y={BY} width={BW} height={BH} />
            </clipPath>
            <rect x={BX} y={BY} width={BW} height={BH} fill="rgba(140,150,200,0.035)" />
            <g clipPath={`url(#${cid})`}>
              {HATCH_XS.map((x) => (
                <line key={x} x1={x} y1={BY + BH} x2={x + BH} y2={BY} stroke="#2f313a" strokeWidth={0.8} />
              ))}
            </g>
            <rect x={BX} y={BY} width={BW} height={BH} fill="none" stroke="#5d606c" strokeWidth={0.7} vectorEffect="non-scaling-stroke" />
            <Handle x={BX} y={BY} />
            <Handle x={BX + BW} y={BY} />
            <Handle x={BX} y={BY + BH} />
            <Handle x={BX + BW} y={BY + BH} />
          </g>
        )}
        {/* Horizontal light streak: once at the condensing peak, thin core + wide halo */}
        {streak > 0.002 && (
          <g opacity={streak}>
            <ellipse cx={320} cy={182} rx={250} ry={7} fill={`url(#${sid})`} opacity={0.12} />
            <ellipse cx={320} cy={182} rx={230} ry={0.7} fill={`url(#${sid})`} opacity={0.7} />
          </g>
        )}
        {/* Loose grains: blown apart and boiling during the dissolve; pulled back into the wordmark with acceleration while condensing; extinguished on solidifying */}
        <g>
          {SAND.map((s, i) => {
            const pull = seg(t, 0.56 + s.lag, 0.71 + s.lag * 0.4, E.inQuart); // Pull back that gets faster and faster
            const jitter = Math.sin(boil * 1.7 + s.ph) * 1.2 * burst * (1 - pull);
            const sx = s.hx + s.dx * burst;
            const sy = s.hy + s.dy * burst + jitter;
            const x = sx + (s.tx - sx) * pull;
            const y = sy + (s.ty - sy) * pull;
            const a = s.alpha * burst * (1 - seg(t, 0.66, 0.8, E.outCubic)) * (0.55 + 0.45 * Math.abs(Math.sin(boil * 0.9 + s.ph)));
            if (a < 0.01) return null;
            return <circle key={i} cx={x} cy={y} r={s.size * (1 - 0.4 * pull)} fill="#e9ecff" opacity={a} />;
          })}
        </g>
        {/* Text group: the full line and the final wordmark both go through the filter chain (including bloom) */}
        <g filter={`url(#${fid})`}>
          <text
            x={320}
            y={191}
            textAnchor="middle"
            opacity={1 - cond}
            style={{
              fill: '#eceef3',
              font: `500 26px ${FONT.sans}`, // The brand name is longer than the placeholder: font size 33→26 to fit inside the selection box
              letterSpacing: '1.2px',
            }}
          >
            {`{ ${BRAND.name}. Now Live }`}
          </text>
          <text
            x={320}
            y={198}
            textAnchor="middle"
            opacity={cond}
            transform={`translate(320 180) scale(${markScale.toFixed(4)}) translate(-320 -180)`}
            style={{
              fill: '#ffffff',
              font: `750 44px ${BRAND.font}`, // 15-character wordmark: 54→44px, still inside the HUD brackets after solidifying
              letterSpacing: '1.5px',
            }}
          >
            {BRAND.name}
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
