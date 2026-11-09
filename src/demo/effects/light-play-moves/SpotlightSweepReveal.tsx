// spotlight-sweep-reveal: spotlight sweeping the type: a title almost invisible in the dark is swept bright by a swinging follow-spot, lit wherever the light goes.
//
// Second redesign (theatre opening night, velvet curtain):
// - look = custom "velvet": wine-black velvet curtain + tungsten warm-white follow-spot + champagne-gold accents (theatre colors the library does not have).
//   The title is a 220px serif "Craft the shot." (shorts-kit brand tagline, roman + italic mixed, with a theatre-poster feel),
//   which rests on the shorts-kit wordmark once fully lit: the opening night of a promo film.
// - The light is physical: the lamp head sits directly above, off-screen; the follow-spot swings like a pendulum: the light spot swings along a concave-down-curving arc (lowest at the center), damping to a stop after two swings,
//   with x and velocity both reaching zero at dead center (not a pure sin slammed to a halt). Wherever the light spot lands, the type there (bright copy + soft halo) and the
//   curtain folds (bright velvet) are revealed together; what stays permanently in the dark is only a 0.07 type shadow and a barely visible curtain.
// - Switching on has a "tungsten warm-up" that flickers twice (deterministic flicker table); once settled the light circle opens up like a follow-spot's iris to cover the whole title line =
//   full-bright freeze (spread out-cubic, light cone fade linear, the decoupling precedent), after which a layer of top-light warm veil + floating dust in the beam keeps the hold alive.
// - Space: curtain (far, fold stripes) → title (middle) → stage apron floor (near, apron edge highlight + floor light spot reflection).
//
// Timeline (30fps, 170f total):
//   0–4     dark field: curtain and type shadow almost invisible (the first frame already has the apron edge and top-light spill)
//   4–10    switch on: tungsten warm-up flickers twice then stabilizes
//   8–121   main action: the follow-spot starts swinging from the left, two and a half swings (period 50f), the last 1.5 swings damp inward, stopping at dead center at 121f
//   121–141 iris opens: light circle 360→1080px (out-cubic), title fully lit; light cone linearly collapses into a soft top light over 20f
//   128–152 follow-through: eyebrow letter spacing tightens, subtitle and brand row fade in and float up
//   152–170 hold: top-light warm veil + dust drifting slowly, a clean poster
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, FONT, Grain, Vignette, bezier, mix, ramp } from '../../../shared/fixtures/Polish';
import { SERIF, alpha, type } from '../../../shared/fixtures/Look';
import { ShortKitWordmark } from '../../../shared/fixtures/Brand';

export const SPOTLIGHT_SWEEP_REVEAL_DURATION = 170;

// Custom look "velvet"
const V = {
  bg0: '#1a0a0d', bg1: '#0f0507', bg2: '#070203',
  velvet: '#5a1622', velvetDeep: '#22080c',
  warm: '#ffe6c2', // tungsten warm white
  ink: '#f8efe2',
  gold: '#e3bd7f',
  ink2: '#c9b39d',
};

const CX = 960;
const CY = 470; // title midline
const AMP = 600; // swing amplitude
const PERIOD = 50;
const SWING0 = 8; // swing start
const SWING_END = SWING0 + PERIOD * 2.25; // 121: θ goes from -π/2 to 4π, sin=0 lands at dead center
const IRIS_END = SWING_END + 20; // 141
const LAMP_Y = -160;
const FLOOR_Y = 868; // apron edge
const R0 = 360; // light circle radius during the swing
const outCubic = bezier(0.215, 0.61, 0.355, 1);

const rnd = (i: number) => {
  const s = Math.sin(i * 91.7 + 13.1) * 43758.5453;
  return s - Math.floor(s);
};

// Light spot position: pendulum. θ starts from -π/2 (far left), the first swing is full amplitude, after which the envelope smooths down to 0 (x and velocity reach zero together)
const spotAt = (f: number) => {
  const sf = Math.min(Math.max(f, SWING0), SWING_END);
  const th = -Math.PI / 2 + (2 * Math.PI * (sf - SWING0)) / PERIOD;
  const env = 1 - ramp(sf, SWING0 + PERIOD * 0.75, SWING_END - SWING0 - PERIOD * 0.75, EASE.smooth);
  const u = Math.sin(th) * env; // -1..1
  return { x: CX + AMP * u, y: CY + 26 - 44 * u * u }; // concave arc: lowest at the center
};

// Tungsten warm-up flicker (4–10f)
const FLICKER = [0, 0.55, 0.15, 0.8, 0.45, 1];
const lampOn = (f: number) => (f < 4 ? 0 : f >= 10 ? 1 : FLICKER[Math.min(5, f - 4)]);

const Title: React.FC<{ color: string; style?: React.CSSProperties }> = ({ color, style }) => (
  <div
    style={{
      position: 'absolute', left: 0, right: 0, top: CY - 130, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center',
      ...style,
    }}
  >
    <div style={{ fontFamily: SERIF, fontSize: 220, fontWeight: 500, letterSpacing: '-0.035em', lineHeight: 1, color, whiteSpace: 'nowrap' }}>
      Craft the <span style={{ fontStyle: 'italic', fontWeight: 400, letterSpacing: '-0.02em' }}>shot.</span>
    </div>
  </div>
);

// Velvet curtain: unequal-width vertical folds (three periods superposed) + dark at the top hanging rod, slightly brighter at the hem
const CURTAIN =
  `repeating-linear-gradient(90deg, rgba(0,0,0,0.55) 0px, rgba(0,0,0,0) 46px, rgba(255,210,200,0.10) 70px, rgba(0,0,0,0) 96px, rgba(0,0,0,0.55) 132px),` +
  `repeating-linear-gradient(90deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0.3) 210px, rgba(0,0,0,0) 330px),` +
  `linear-gradient(180deg, ${V.velvetDeep} 0%, ${V.velvet} 55%, #43101a 100%)`;

const Curtain: React.FC<{ opacity: number; style?: React.CSSProperties }> = ({ opacity, style }) => (
  <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: FLOOR_Y, backgroundImage: CURTAIN, opacity, ...style }} />
);

export const SpotlightSweepReveal: React.FC = () => {
  const f = useCurrentFrame();
  const on = lampOn(f);
  const { x, y } = spotAt(f);

  // Iris opens + full bright (spread out-cubic); light cone collapses into a soft top light (linear)
  const iris = ramp(f, SWING_END, IRIS_END - SWING_END, outCubic);
  const coneFade = 1 - 0.7 * ramp(f, SWING_END, IRIS_END - SWING_END, EASE.linear);
  const radius = mix(R0, 1080, iris);
  const ry = mix(R0 * 0.92, 480, iris);
  const breathe = 1 + 0.04 * Math.sin(f / 17) * ramp(f, IRIS_END, 20, EASE.smooth);

  const spotMask = `radial-gradient(ellipse ${radius.toFixed(1)}px ${ry.toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px, #000 0%, rgba(0,0,0,0.92) 42%, rgba(0,0,0,0.35) 72%, transparent 100%)`;
  const maskStyle: React.CSSProperties = { WebkitMaskImage: spotMask, maskImage: spotMask };

  // Light cone: lamp head narrow mouth → tangent points left and right of the light spot
  const topHalf = 40;
  const poolHalf = mix(R0 * 1.05, 1300, iris);
  const coneBottom = y + mix(R0 * 0.8, 420, iris);
  const cone = `${CX - topHalf},${LAMP_Y} ${CX + topHalf},${LAMP_Y} ${x + poolHalf},${coneBottom} ${x - poolHalf},${coneBottom}`;

  // Beam dust: distributed along the cone axis, slow float-up + lateral drift (deterministic)
  const motes = Array.from({ length: 56 }, (_, i) => {
    const u = rnd(i);
    const v = rnd(i + 100) - 0.5;
    const drift = ((f * (0.35 + rnd(i + 200) * 0.5)) % 160) / 160;
    const uu = (u + 1 - drift * 0.4) % 1;
    const yy = mix(LAMP_Y + 120, coneBottom - 40, uu);
    const k = (yy - LAMP_Y) / (coneBottom - LAMP_Y);
    const half = mix(topHalf, poolHalf, k);
    const axisX = mix(CX, x, k);
    const xx = axisX + v * half * 1.6 + Math.sin(f / 23 + i) * 7;
    const r = 0.9 + rnd(i + 300) * 1.8;
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(f / (11 + rnd(i + 400) * 9) + i));
    return { xx, yy, r, a: (0.16 + rnd(i + 500) * 0.4) * tw };
  });

  const kicker = ramp(f, SWING_END + 7, 22, EASE.snappy);
  const sub = ramp(f, SWING_END + 13, 22, EASE.snappy);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${V.bg0} 0%, ${V.bg1} 60%, ${V.bg2} 100%)`, overflow: 'hidden', fontFamily: FONT.sans }}>
      {/* Far view: the curtain is permanently very dark */}
      <Curtain opacity={0.16} />
      {/* Top-light spill: a bit of warm light leaking from the lamp head mouth (permanent, present on the first frame) */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 30% 22% at 50% 0%, ${alpha(V.warm, 0.1)} 0%, ${alpha(V.warm, 0)} 100%)` }} />

      {/* The lit part of the curtain: bright curtain, masked by the light spot */}
      <div style={{ position: 'absolute', inset: 0, opacity: on * breathe, ...maskStyle }}>
        <Curtain opacity={0.95} />
        {/* Warm light tint */}
        <div style={{ position: 'absolute', inset: 0, background: alpha('#ff9a6a', 0.08), mixBlendMode: 'screen' }} />
      </div>

      {/* Stage apron floor: near view */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: FLOOR_Y, bottom: 0, background: 'linear-gradient(180deg, #1c0d0c 0%, #0b0505 100%)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: FLOOR_Y, height: 2, background: `linear-gradient(90deg, transparent, ${alpha(V.warm, 0.14)}, transparent)` }} />
      {/* Floor light spot: the small patch where the follow-spot lands on the stage */}
      <div
        style={{
          position: 'absolute', inset: 0, opacity: on * coneFade * 0.9,
          background: `radial-gradient(ellipse ${(poolHalf * 0.9).toFixed(0)}px 70px at ${x.toFixed(1)}px ${FLOOR_Y + 60}px, ${alpha(V.warm, 0.22)} 0%, ${alpha(V.warm, 0.06)} 55%, ${alpha(V.warm, 0)} 100%)`,
        }}
      />

      {/* Type shadow: the permanent 0.07 in the dark field */}
      <Title color={V.ink} style={{ opacity: 0.07 }} />

      {/* Light cone: soft-edged volumetric light + dust */}
      <div style={{ position: 'absolute', inset: 0, opacity: on * coneFade }}>
        <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <defs>
            <linearGradient id="ssr-beam" x1="0" y1={LAMP_Y} x2="0" y2={coneBottom} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor={V.warm} stopOpacity="0.26" />
              <stop offset="0.6" stopColor={V.warm} stopOpacity="0.07" />
              <stop offset="1" stopColor={V.warm} stopOpacity="0" />
            </linearGradient>
            <filter id="ssr-soft" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="18" />
            </filter>
            <clipPath id="ssr-clip">
              <polygon points={cone} />
            </clipPath>
          </defs>
          <polygon points={cone} fill="url(#ssr-beam)" filter="url(#ssr-soft)" />
          <g clipPath="url(#ssr-clip)">
            {motes.map((m, i) => (
              <circle key={i} cx={m.xx} cy={m.yy} r={m.r} fill={V.warm} opacity={m.a} />
            ))}
          </g>
        </svg>
      </div>

      {/* Wall light spot: warm-white ellipse, a harder core + a long soft edge */}
      <div
        style={{
          position: 'absolute', inset: 0, opacity: on * mix(1, 0.55, iris) * breathe,
          background: `radial-gradient(ellipse ${(radius * 1.2).toFixed(0)}px ${(ry * 1.1).toFixed(0)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px, ${alpha(V.warm, 0.16)} 0%, ${alpha(V.warm, 0.07)} 48%, ${alpha(V.warm, 0)} 100%)`,
          mixBlendMode: 'screen',
        }}
      />

      {/* Bright title: masked by the light spot; a soft halo with the same mask underneath (the lit type edges bleed slightly) */}
      <div style={{ position: 'absolute', inset: 0, opacity: on, ...maskStyle }}>
        <Title color={V.warm} style={{ filter: 'blur(16px)', opacity: 0.5 }} />
        <Title color={V.ink} />
      </div>

      {/* Eyebrow + subtitle (enter after full bright) */}
      <div
        style={{
          position: 'absolute', left: 0, right: 0, top: CY - 210, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22,
          opacity: kicker, ...type(24, 650, { caps: true }), letterSpacing: `${mix(0.62, 0.36, kicker).toFixed(3)}em`, color: V.gold,
        }}
      >
        <span style={{ width: mix(0, 70, kicker), height: 1, background: alpha(V.gold, 0.6) }} />
        Tonight · World premiere
        <span style={{ width: mix(0, 70, kicker), height: 1, background: alpha(V.gold, 0.6) }} />
      </div>
      <div
        style={{
          position: 'absolute', left: 0, right: 0, top: CY + 170, textAlign: 'center',
          opacity: sub, transform: `translateY(${mix(18, 0, sub).toFixed(1)}px)`,
        }}
      >
        <div style={{ ...type(44, 450), color: V.ink2 }}>
          Cinematic product videos, crafted by your agent.
        </div>
        <div style={{ marginTop: 22, display: 'flex', justifyContent: 'center', opacity: ramp(f, SWING_END + 22, 18, EASE.out) }}>
          <ShortKitWordmark size={30} tone="dark" color={V.ink} markScale={1.7} gap={14} />
        </div>
      </div>

      <Vignette strength={0.62} inner={0.36} color="#050102" />
      <Grain opacity={0.09} blend="soft-light" />
    </AbsoluteFill>
  );
};
