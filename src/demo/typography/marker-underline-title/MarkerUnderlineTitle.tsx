// marker-underline-title: after the big title on a white background settles, a marker underline is drawn from left to right
// beneath the italic "new" (stroke width variation / rounded ends / slight tilt / rough edges).
// Benchmarked against notion-ai.mp4 2.3–3.6s. It overlaps with the library's draw-svg-trace, so this version goes for a marker texture.
// Texture layer (revision): added exported duration 75f (the line finishes at f42, then still for 33f ≥1s); the two title lines use a staggered blur-slide
// (snappy, second line 4f later); the stroke gets a deterministic dry-brush texture: feTurbulence displacement makes rough edges + fine dry-streak knockouts,
// the ink is changed to a warm-toned near-black and multiplied into the paper; paper = low-contrast warm white base + key light + grain;
// the second line = the shorts-kit brand line (logo + lowercase brand name); the whole piece pushes in very slowly 1→1.015.
import React, { useId } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { Backdrop, EASE, FONT, ramp } from '../../../shared/fixtures/Polish';
import { BRAND, ShortKitMark } from '../../../shared/fixtures/Brand';

export const MARKER_UNDERLINE_TITLE_DURATION = 75; // title settles at 22f → line drawn at f32–42 → still for 33f

const mulberry32 = (a: number) => () => {
  let t = (a += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Marker stroke: a path with a slightly wobbly center axis + a variable-width outline, generated as one polygon
const buildStroke = (len: number, seed: number) => {
  const rand = mulberry32(seed);
  const N = 40;
  const top: string[] = [];
  const bot: string[] = [];
  // Pre-generate slight wobble offsets (low frequency) and roughness (high frequency)
  const wob = Array.from({ length: N + 1 }, () => rand() - 0.5);
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = t * len;
    // Center axis: follows the italic's slight upward slant (low left, high right, matching the screenshot) + slow wave
    const mid = 19 - t * 9 + Math.sin(t * Math.PI * 1.6 + 0.4) * 2.6 + wob[i] * 1.6;
    // Width: thinner at the start → full in the middle → tapering to a point at the end, plus high-frequency roughness
    const wBase = 14 + Math.sin(t * Math.PI) * 6 - Math.max(0, t - 0.86) * 46 - Math.max(0, 0.06 - t) * 70; // start thinned a bit more, no longer a flat head
    const w = Math.max(2.2, wBase + wob[i] * 3);
    top.push(`${x.toFixed(1)},${(mid - w / 2).toFixed(1)}`);
    bot.push(`${x.toFixed(1)},${(mid + w / 2).toFixed(1)}`);
  }
  return `M${top.join('L')}L${bot.reverse().join('L')}Z`;
};

const LEN = 252;
const PATH = buildStroke(LEN, 77);
const MARKER_INK = '#1b1916'; // warm-toned near-black (marker ink, not pure black)

export const MarkerUnderlineTitle: React.FC = () => {
  const frame = useCurrentFrame();
  // SVG ids are generated per instance so multiple instances on the same scene do not cross-reference (useId's «:» is illegal in url(), needs sanitizing)
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const revealId = `reveal-${uid}`;
  const dryId = `dry-${uid}`;

  // The two title lines settle staggered: the same snappy progress drives y / blur / opacity
  const line = (delay: number): React.CSSProperties => {
    const e = ramp(frame, delay, 22, EASE.snappy);
    return {
      opacity: Math.min(1, e * 1.4),
      transform: `translateY(${(1 - e) * 36}px)`,
      filter: e < 0.999 ? `blur(${((1 - e) * 8).toFixed(2)}px)` : undefined,
    };
  };

  // Underline: drawn after the title settles and a beat passes, 10 frames from left to right (one notch faster), ease-out
  const draw = interpolate(frame, [32, 42], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const drawE = 1 - Math.pow(1 - draw, 2.2);
  // The whole piece pushes in very slowly (smooth, zero speed at start and end)
  const push = 1 + 0.015 * ramp(frame, 0, 74, EASE.smooth);

  return (
    <AbsoluteFill>
      <Backdrop tone="light" light={{ x: 0.42, y: 0.3 }} vignette={0.12} grain={0.05} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', transform: `scale(${push})` }}>
        <div style={{
          fontFamily: FONT.sans,
          fontWeight: 700, fontSize: 118, color: '#17181c',
          textAlign: 'center', lineHeight: 1.12, letterSpacing: '-0.028em',
        }}>
          <div style={line(0)}>
            Meet the{' '}
            <span style={{ fontStyle: 'italic', position: 'relative', display: 'inline-block' }}>
              new
              {/* Marker underline: clip reveals from left to right, keeping the stroke's own width variation */}
              <svg
                width={LEN} height={44} viewBox={`0 0 ${LEN} 44`}
                style={{ position: 'absolute', left: -12, bottom: -20, overflow: 'visible', mixBlendMode: 'multiply' }}
              >
                <defs>
                  <clipPath id={revealId}>
                    <rect x={0} y={-20} width={drawE * (LEN + 6)} height={60} />
                  </clipPath>
                  {/* Dry-brush texture: low-frequency displacement → rough edges; high-frequency noise threshold → fine dry streaks (fixed seed, deterministic) */}
                  <filter id={dryId} x="-5%" y="-40%" width="110%" height="180%" colorInterpolationFilters="sRGB">
                    <feTurbulence type="fractalNoise" baseFrequency="0.09 0.5" numOctaves={2} seed={7} result="warp" />
                    <feDisplacementMap in="SourceGraphic" in2="warp" scale={1.8} xChannelSelector="R" yChannelSelector="G" result="rough" />
                    <feTurbulence type="fractalNoise" baseFrequency="0.035 0.9" numOctaves={2} seed={19} result="grain" />
                    <feColorMatrix in="grain" type="matrix"
                      values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -16 11.4" result="holes" />
                    <feComposite in="rough" in2="holes" operator="in" />
                  </filter>
                </defs>
                {draw > 0 && (
                  <g clipPath={`url(#${revealId})`}>
                    <path d={PATH} fill={MARKER_INK} fillOpacity={0.94} filter={`url(#${dryId})`} />
                  </g>
                )}
              </svg>
            </span>
          </div>
          <div style={{ ...line(4), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
            <ShortKitMark size={112} tone="light" />
            <span>{BRAND.name}</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
