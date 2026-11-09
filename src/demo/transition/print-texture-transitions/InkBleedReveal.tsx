// Ink bleed reveal (ink-bleed-reveal): ink-wash transition (orbit mask method).
// Old scene: chapter title page on warm white paper (small monospace chapter number + large serif title + thin rule + subtitle), static paper grain;
// New scene FakeDashboard(A) sits in an SVG <foreignObject> under a <mask>: a white circle at the ink drop point (800,420) serves as the orbit mask.
// Three ink layers (outside in): ① wet halo: a very faint dark ring where the paper is soaked (large radius, heavy feather);
// ② ink edge: deep indigo whiskery bleed edge, radius 20–42px ahead of the new scene: outer rim semi-transparent and heavily feathered, inner core dense, reads as "wet ink";
// ③ new scene: "develops" behind the ink edge, content always sharp, scale 1.035→1 eases back (developing feel).
// All three mask circles share feTurbulence(baseFrequency 0.02, octaves 3, seed 7 fixed) + feDisplacementMap
// (scale 60→160 rising per frame) to make the whiskery edge: the filter only kneads the mask shape, not the picture.
// Beats: 0–14 hold old scene → 14–22 ink drop lands (small ink dot lands with overshoot) → 20–98 radius 0→1450
// (Easing.out(quad)) plus ±8% low-frequency sine perturbation (decays to 0 over frames 78–98, bleeding to fill the screen) →
// 100–130 remove the mask and lay the new scene directly, truly still for 30f.
import React, { useId } from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { FakeDashboard } from '../../../shared/fixtures/Fixtures';
import { EASE, FONT, ramp, mix, Grain } from '../../../shared/fixtures/Polish';

export const INK_BLEED_REVEAL_DURATION = 130;

const SERIF = 'ui-serif, "New York", "Iowan Old Style", Georgia, "Times New Roman", serif';
const PAPER = '#f3efe6'; // warm white paper
const INK = '#1a1c29'; // ink with a hint of indigo (not pure black)
const PAPER_INK = '#2a2620'; // text color printed on paper

// Old scene: chapter title page (paper + printed type); title is the shorts-kit brand tagline, subtitle is the promo line
const PaperPage: React.FC = () => (
  <div style={{
    position: 'absolute', inset: 0, background: `radial-gradient(ellipse 80% 70% at 42% 38%, #f8f5ee 0%, ${PAPER} 55%, #e9e4d8 100%)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <div style={{ textAlign: 'center', color: PAPER_INK }}>
      <div style={{ fontFamily: FONT.mono, fontSize: 22, letterSpacing: '0.32em', color: '#8a8173', marginBottom: 34 }}>
        CHAPTER 02
      </div>
      <div style={{ fontFamily: SERIF, fontSize: 112, fontWeight: 500, lineHeight: 1.04, letterSpacing: '-0.025em' }}>
        Frame motion.
        <br />
        <span style={{ fontStyle: 'italic' }}>Craft the shot.</span>
      </div>
      <div style={{ width: 120, height: 1.5, background: '#b7ab97', margin: '44px auto 30px' }} />
      <div style={{ fontFamily: SERIF, fontSize: 34, color: '#6f675a', letterSpacing: '-0.005em' }}>
        Every shot, tuned in one place.
      </div>
    </div>
    {/* Paper grain: static grain (huge step = no frame change, pixels constant during still segments) */}
    <Grain opacity={0.07} step={100000} freq={0.9} blend="multiply" />
  </div>
);

export const InkBleedReveal: React.FC = () => {
  const frame = useCurrentFrame();
  // Filter/mask IDs are generated per instance so multiple instances do not cross-reference (the «:» from useId is illegal in url(), needs cleaning)
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const bleedId = `inkBleed-${uid}`;
  const featherId = `inkFeather-${uid}`;
  const haloId = `inkHalo-${uid}`;
  const maskNew = `inkMaskNew-${uid}`;
  const maskInk = `inkMaskInk-${uid}`;
  const maskHalo = `inkMaskHalo-${uid}`;

  // Ink drop point: slightly up-left of frame center
  const cx = 800;
  const cy = 420;

  // Base radius: frames 20–98, 0 → 1450px (farthest corner ~1300px + 150px margin for bleed-edge displacement)
  const baseR = interpolate(frame, [20, 98], [0, 1450], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // ±8% low-frequency sine perturbation = uneven fast/slow bleeding; amplitude decays to 0 over frames 78–98 so it can truly rest once fully covered
  const wobbleEnv = interpolate(frame, [78, 98], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const r = Math.max(0, baseR * (1 + 0.08 * Math.sin(frame * 0.32) * wobbleEnv));
  // Ink-edge lead: narrow at the start (20px), widest mid-bleed (~42px): ink runs ahead on the paper, picture develops after
  const lead = 20 + 22 * Math.sin(Math.PI * ramp(frame, 20, 78, EASE.linear));
  const rInk = r > 0.5 ? r + lead : 0; // ink edge outer rim (semi-transparent, heavy feather)
  const rCore = r > 0.5 ? r + lead * 0.45 : 0; // ink core (dense, light feather)
  // Wet halo: ~110px beyond the ink edge, very faint
  const rHalo = r > 0.5 ? r + lead + 110 : 0;

  // Bleed-edge spread: displacement scale 60 → 160 (the more it bleeds the more the edge scatters, fingertip forks grow longer)
  const dispScale = interpolate(frame, [20, 98], [60, 160], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Ink drop: over 14–22f a small ink dot lands with overshoot, then gets swallowed by the spreading ink edge
  const drop = ramp(frame, 14, 8, EASE.overshoot);
  const dropR = 16 * drop;

  // New scene develops: scale 1.035 → 1 (20–100f, ease-out), must return exactly to 1 before the mask is removed
  const develop = mix(1.035, 1, ramp(frame, 20, 80, EASE.out));

  // From frame 100 the mask is fully white: remove the SVG and lay the new scene directly, so the end is pixel-perfectly still
  const settled = frame >= 100;

  return (
    <div style={{ width: 1920, height: 1080, background: PAPER, position: 'relative', overflow: 'hidden' }}>
      {!settled && <PaperPage />}

      {settled ? (
        <div style={{ position: 'absolute', inset: 0 }}>
          <FakeDashboard variant="A" />
        </div>
      ) : (
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, display: 'block' }}>
          <defs>
            {/* The filter is attached only to the mask circles: it kneads the mask edge, not the picture content */}
            <filter id={bleedId} x="-40%" y="-40%" width="180%" height="180%">
              <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="7" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={dispScale} xChannelSelector="R" yChannelSelector="G" />
            </filter>
            {/* Ink edge: same whiskery displacement + 1.6px feather = soft edge of wet ink */}
            <filter id={featherId} x="-40%" y="-40%" width="180%" height="180%">
              <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="7" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={dispScale * 1.08} xChannelSelector="R" yChannelSelector="G" result="d" />
              <feGaussianBlur in="d" stdDeviation="3.2" />
            </filter>
            <filter id={`${featherId}c`} x="-40%" y="-40%" width="180%" height="180%">
              <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="7" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={dispScale * 1.03} xChannelSelector="R" yChannelSelector="G" result="d" />
              <feGaussianBlur in="d" stdDeviation="1" />
            </filter>
            {/* Wet halo: heavy feather, leaving only a faint hint of darkness */}
            <filter id={haloId} x="-40%" y="-40%" width="180%" height="180%">
              <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="7" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={dispScale * 1.3} xChannelSelector="R" yChannelSelector="G" result="d" />
              <feGaussianBlur in="d" stdDeviation="34" />
            </filter>
            <mask id={maskHalo} maskUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080">
              <rect x="0" y="0" width="1920" height="1080" fill="black" />
              {rHalo > 0 && <circle cx={cx} cy={cy} r={rHalo} fill="white" filter={`url(#${haloId})`} />}
            </mask>
            <mask id={maskInk} maskUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080">
              <rect x="0" y="0" width="1920" height="1080" fill="black" />
              {rInk > 0 && <circle cx={cx} cy={cy} r={rInk} fill="white" filter={`url(#${featherId})`} />}
              {dropR > 0.5 && <circle cx={cx} cy={cy} r={dropR} fill="white" />}
            </mask>
            <mask id={`${maskInk}c`} maskUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080">
              <rect x="0" y="0" width="1920" height="1080" fill="black" />
              {rCore > 0 && <circle cx={cx} cy={cy} r={rCore} fill="white" filter={`url(#${featherId}c)`} />}
              {dropR > 0.5 && <circle cx={cx} cy={cy} r={dropR * 0.86} fill="white" />}
            </mask>
            <mask id={maskNew} maskUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080">
              <rect x="0" y="0" width="1920" height="1080" fill="black" />
              {r > 0.5 && <circle cx={cx} cy={cy} r={r} fill="white" filter={`url(#${bleedId})`} />}
            </mask>
          </defs>
          {/* ① Wet halo */}
          <rect x="0" y="0" width="1920" height="1080" fill="#5a4e3a" opacity={0.12} mask={`url(#${maskHalo})`} />
          {/* ② Ink edge (including the landing ink drop) */}
          <rect x="0" y="0" width="1920" height="1080" fill={INK} opacity={0.42} mask={`url(#${maskInk})`} />
          <rect x="0" y="0" width="1920" height="1080" fill={INK} opacity={0.86} mask={`url(#${maskInk}c)`} />
          {/* ③ New scene develops */}
          <g mask={`url(#${maskNew})`}>
            <foreignObject x="0" y="0" width="1920" height="1080">
              <div style={{ width: 1920, height: 1080, transform: `scale(${develop})`, transformOrigin: `${cx}px ${cy}px` }}>
                <FakeDashboard variant="A" />
              </div>
            </foreignObject>
          </g>
        </svg>
      )}
    </div>
  );
};
