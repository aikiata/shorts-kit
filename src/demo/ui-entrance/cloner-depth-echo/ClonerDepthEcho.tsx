// cloner-depth-echo: cloner column (second redesign · acid-lemon dark scene · edge deployment)
// Technique unchanged: one hero card is "photocopied" into 7 clones lined up at even depth intervals → hold a beat so viewers can count → all accelerate in sync back into the original → the merge gives a bounce.
//
// Design decisions
// - look = lime (graphite black + neon yellow-green). The hero is a shorts-kit render card "launch-film" (top bar with the shorts-kit mark):
//   a large 30fps readout + lemon-green polyline + 8 shot slots at the bottom. The meaning lands on a concrete selling point rather than "many copies": one prompt = 8 shots rendered at once.
// - Depth: true 3D perspective (perspective 1500), vanishing point at the upper left: clones only recede with translateZ and automatically line up toward the upper left,
//   then a little dx/dy fans the column out; the farther away, the fainter, blurrier and more "outline only" (fill fades, lemon-green stroke stays), like the wireframe echo of a C4D Cloner.
//   Each clone's top bar shows its own shot number (S02 / S03 ...): same recipe, different shots.
// - Layout: hero card at the right middle (~36% of frame width), the column stretching to the upper left; lower left is the whole film's counter "×8" (260px lemon-green tabular),
//   which rolls one notch for each clone that pops out; after the merge the title "One prompt. / Eight shots." rises into the vacated upper left, and the last frame is a poster.
// - Merge: all 8 shot slots light up on the same frame the pull-back arrives (the clones "return" into the original), hero card 1→1.06→1 single pulse + one lemon-green stroke glow (Q4 only the hero gets it once).
//
// Timeline (30fps, 138f total)
//   0–16    Entrance: hero card rises 40px from below + blurry to sharp (snappy), card contents staggered by 2f; counter ×1 is already at lower left
//   16–24   Anticipation: hero card presses to 0.96, stroke brightens ("copy button pressed")
//   24–44   Fan-out: 7 clones spring out into depth, staggered 2.2f each (damping 15, one slight overshoot), counter +1 for each pop, top-bar shot numbers appear at the same time
//   44–76   Hold 32f: camera pushes in very slowly by 2%, the column drifts with slight parallax, so "there are many" can be counted
//   76–86   Pull-back 10f: all in sync with strong ease-in (faster and faster), adding trail blur by speed along the depth direction
//   86–104  Merge: shot slots all lit, hero card single pulse 1.06, stroke glow once; counter gets one scale rebound on the same frame
//   92–118  Title rises word by word from under the line (upper left), sub line fades in
//   118–138 Hold 20f: breathing light + 0.6% very slow push-in, a clean landing
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, FONT, mix, ramp } from '../../../shared/fixtures/Polish';
import { LOOKS, Stage, Dust, TextReveal, alpha, glow, springAt, type } from '../../../shared/fixtures/Look';
import { ShortKitMark } from '../../../shared/fixtures/Brand';

export const CLONER_DEPTH_ECHO_DURATION = 138;

const L = LOOKS.lime;
const N = 7; // number of clones
const GAP_Z = 250; // depth gap between adjacent clones (px)
const SPREAD = 24; // fan-out start frame
const EACH = 2.2; // clone stagger (frames per clone)
const MERGE = 76; // pull-back start frame
const MERGE_DUR = 10;
const LAND = MERGE + MERGE_DUR; // merge frame 86

// Hero card geometry (screen px, z=0 plane)
const CW = 660;
const CH = 420;
const CX = 1130; // top-left corner
const CY = 352;
// Perspective: vanishing point at the upper left, clones line up toward the upper left as they recede
const PERSP = 1500;
const VP = { x: 360, y: 120 };

const TYPE_H1 = 112; // title size (slightly reduced for the h1 tier, two lines fit into the upper-left space)

const REGIONS = ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08']; // shot numbers (original variable name kept)
const SPARK = [0.62, 0.58, 0.66, 0.52, 0.55, 0.44, 0.48, 0.36, 0.4, 0.3, 0.33, 0.26, 0.3, 0.22];

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

// Fan-out progress of the idx-th (1..N) clone: physical spring, staggered by EACH frames
const spreadOf = (f: number, idx: number) => (f < SPREAD + (idx - 1) * EACH ? 0 : springAt(f, SPREAD + (idx - 1) * EACH, { damping: 15, stiffness: 150, mass: 0.9 }));
// Pull-back: all in sync with strong ease-in
const mergeOf = (f: number) => ramp(f, MERGE, MERGE_DUR, EASE.exit);
// Depth position of the clone (0 = original plane, 1 = fan-out position)
const depthOf = (f: number, idx: number) => spreadOf(f, idx) * (1 - mergeOf(f));

// ───────────── Instance card ─────────────
const InstanceCard: React.FC<{ region: string; clone: number; lit: number; frame: number; inP: number }> = ({ region, clone, lit, frame, inP }) => {
  // clone: 0 = original, >0 farther away: the farther, the fainter the fill, leaving only the outline
  const c = clone / N;
  const fill = clone === 0 ? 1 : mix(0.55, 0.06, c);
  const rise = (k: number) => {
    const p = clone === 0 ? ramp(frame, 4 + k * 2, 14, EASE.snappy) : 1;
    return { opacity: p * inP + (1 - inP) * 0, transform: `translateY(${((1 - p) * 16).toFixed(2)}px)` };
  };
  const pts = SPARK.map((v, i) => `${(i / (SPARK.length - 1)) * 576},${(v * 120).toFixed(1)}`).join(' ');
  return (
    <div
      style={{
        position: 'absolute', inset: 0, borderRadius: 30, overflow: 'hidden',
        background: `linear-gradient(160deg, ${alpha('#20241a', fill)} 0%, ${alpha(L.surface, fill)} 60%, ${alpha('#0f110c', fill)} 100%)`,
        border: `1.5px solid ${clone === 0 ? alpha('#ffffff', 0.12) : alpha(L.accent, mix(0.55, 0.85, c))}`,
        boxShadow: clone === 0
          ? `inset 0 1px 0 ${alpha('#ffffff', 0.1)}, 0 40px 90px -30px ${alpha('#000000', 0.9)}, 0 12px 30px ${alpha('#000000', 0.5)}`
          : `0 0 ${(18 + 20 * c).toFixed(0)}px ${alpha(L.accent, 0.12 + 0.1 * c)}`,
        fontFamily: FONT.sans, color: L.ink,
      }}
    >
      {/* Top of the card face lit: a very faint lemon-green inner glow (original only) */}
      {clone === 0 && (
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 70% 50% at 30% 0%, ${alpha(L.accent, 0.1)} 0%, transparent 70%)` }} />
      )}
      <div style={{ position: 'absolute', left: 42, right: 42, top: 36, display: 'flex', alignItems: 'center', gap: 14, ...rise(0) }}>
        {/* shorts-kit mark (dark-background reversed version); fades with the card on clones */}
        <ShortKitMark size={34} tone="dark" style={{ margin: '-4px 0' }} />
        <div style={{ ...type(32, 600, { mono: true }), color: clone === 0 ? L.ink : alpha(L.ink, 0.85) }}>launch-film</div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            ...type(26, 700, { mono: true }), height: 44, padding: '0 16px', borderRadius: 22, display: 'flex', alignItems: 'center',
            background: clone === 0 ? L.accent : alpha(L.accent, 0.14), color: clone === 0 ? L.onAccent : L.accent,
            border: clone === 0 ? 'none' : `1.5px solid ${alpha(L.accent, 0.6)}`,
          }}
        >
          {region}
        </div>
      </div>
      {/* Readout: 30fps output: on clones it drops to outline text (texture), only the original is solid */}
      <div style={{ position: 'absolute', left: 40, top: 104, display: clone === 0 ? 'flex' : 'none', alignItems: 'baseline', gap: 16, ...rise(1) }}>
        <div
          style={{
            ...type(132, 750), letterSpacing: '-0.05em',
            color: clone === 0 ? L.ink : 'transparent',
            WebkitTextStroke: clone === 0 ? undefined : `1.5px ${alpha(L.accent, 0.7)}`,
          }}
        >
          30<span style={{ fontSize: 72, letterSpacing: '-0.02em', color: clone === 0 ? L.ink2 : 'transparent' }}>fps</span>
        </div>
        <div style={{ ...type(26, 500, { caps: true }), color: L.ink3, letterSpacing: '0.12em', opacity: clone === 0 ? 1 : 0 }}>1080p</div>
      </div>
      {/* Polyline */}
      <svg width={576} height={130} style={{ position: 'absolute', left: 42, top: 246, overflow: 'visible', ...rise(2) }}>
        {clone === 0 && (
          <polygon points={`0,130 ${pts} 576,130`} fill={`url(#cdeFill)`} opacity={0.9} />
        )}
        <defs>
          <linearGradient id="cdeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={L.accent} stopOpacity={0.22} />
            <stop offset="1" stopColor={L.accent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <polyline points={pts} fill="none" stroke={L.accent} strokeWidth={clone === 0 ? 4 : 2.5} strokeLinejoin="round" strokeLinecap="round" opacity={clone === 0 ? 1 : 0.8} />
      </svg>
      {/* Shot slots: 8 cells at the bottom of the original, all lit on merge */}
      {clone === 0 && (
        <div style={{ position: 'absolute', left: 42, right: 42, bottom: 30, display: 'flex', gap: 8, ...rise(3) }}>
          {REGIONS.map((r, i) => {
            const on = i === 0 ? 1 : lit;
            return (
              <div
                key={r}
                style={{
                  flex: 1, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  ...type(18, 600, { mono: true }),
                  background: alpha(L.accent, 0.06 + 0.84 * on),
                  color: on > 0.5 ? L.onAccent : L.ink3,
                  border: `1px solid ${alpha(L.accent, 0.18 + 0.5 * on)}`,
                }}
              >
                {r}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ───────────── Counter: each notch rolls up from below ─────────────
const Counter: React.FC<{ value: number; tickAge: number; punch: number }> = ({ value, tickAge, punch }) => {
  // tickAge: how many frames since the last +1 (roll takes 5f); punch: merge rebound 0..1..0
  const roll = ramp(tickAge, 0, 5, EASE.snappy);
  const size = 260;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', transform: `scale(${(1 + 0.06 * punch).toFixed(4)})`, transformOrigin: '0% 70%' }}>
      <span style={{ ...type(size * 0.62, 500), color: alpha(L.accent, 0.55), marginTop: size * 0.2, marginRight: 8 }}>×</span>
      {/* No overflow clipping (it would crop the bloom into a box): the outgoing cell moves up and fades out, the incoming cell rises from below and fades in */}
      <div style={{ position: 'relative', height: size * 1.02, width: size * 0.62 }}>
        {[value - 1, value].map((v, k) => {
          if (v < 1) return null;
          const y = k === 0 ? -roll * 45 : (1 - roll) * 45;
          // While rolling, both cells get vertical blur by speed (0 at rest)
          const spd = roll < 1 ? 1 - roll : 0;
          return (
            <div
              key={k}
              style={{
                position: 'absolute', left: 0, top: 0, ...type(size, 800), letterSpacing: '-0.04em', color: L.accent,
                transform: `translateY(${y.toFixed(2)}%)`, textShadow: glow(L.accent, 0.35 + 0.5 * punch),
                opacity: k === 0 ? clamp01(1 - roll * 1.6) : clamp01(roll * 1.6),
                filter: spd > 0.05 ? `blur(${(spd * 6).toFixed(2)}px)` : undefined,
              }}
            >
              {v}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ClonerDepthEcho: React.FC = () => {
  const frame = useCurrentFrame();

  // Hero card entrance / anticipation press / merge pulse
  const enter = ramp(frame, 0, 16, EASE.snappy);
  const press = ramp(frame, 16, 8, EASE.swift) * (1 - ramp(frame, SPREAD, 10, EASE.overshoot));
  const popT = clamp01((frame - LAND) / 16);
  const pop = frame >= LAND ? Math.sin(popT * Math.PI) * Math.pow(1 - popT, 0.6) : 0;
  const heroScale = (1 - 0.04 * press) * (1 + 0.06 * pop) * mix(0.94, 1, enter);
  const rimFlash = frame >= LAND ? Math.max(0, 1 - (frame - LAND) / 14) : 0;
  const lit = ramp(frame, LAND - 1, 5, EASE.snappy);

  // Count: +1 once each clone has popped out past 30%; record the frame of the latest +1 for the roll
  let count = 1;
  let lastTick = -99;
  for (let idx = 1; idx <= N; idx++) {
    const f0 = SPREAD + (idx - 1) * EACH + 2;
    if (frame >= f0) { count++; lastTick = f0; }
  }
  const counterPunch = frame >= LAND ? Math.sin(clamp01((frame - LAND) / 12) * Math.PI) : 0;

  // Camera: very slow push-in during the hold; another very slow push after the merge; the column drifts with slight parallax during the hold
  const dolly = 1 + 0.02 * ramp(frame, 40, 40, EASE.smooth) + 0.006 * ramp(frame, 100, 38, EASE.smooth);
  const drift = 14 * ramp(frame, 40, 40, EASE.smooth) * (1 - mergeOf(frame));

  // Title & counter label
  const labelIn = ramp(frame, 6, 16, EASE.out);

  return (
    <AbsoluteFill style={{ fontFamily: FONT.sans, overflow: 'hidden' }}>
      <Stage look={L} keyLight={{ x: 0.62, y: 0.42 }} fill={{ x: 0.1, y: 0.95 }} breathe={0.6} intensity={0.45}>
        <Dust look={L} count={26} seed={5} drift={0.18} opacity={0.35} color={L.accent} />
        {/* Lemon-green ground glow under the hero card */}
        <div
          style={{
            position: 'absolute', left: CX - 160, top: CY + CH - 40, width: CW + 320, height: 220,
            background: `radial-gradient(ellipse 50% 50% at 50% 40%, ${alpha(L.accent, 0.14 + 0.12 * rimFlash)} 0%, transparent 70%)`,
            opacity: enter,
          }}
        />
      </Stage>

      {/* Camera layer: push-in anchored at the hero card center */}
      <AbsoluteFill style={{ transform: `scale(${dolly.toFixed(5)})`, transformOrigin: `${CX + CW / 2}px ${CY + CH / 2}px` }}>
        <AbsoluteFill style={{ perspective: PERSP, perspectiveOrigin: `${VP.x}px ${VP.y}px` }}>
          <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}>
            {/* Clone column: rendered far to near, with correct occlusion */}
            {Array.from({ length: N }, (_, k) => N - k).map((idx) => {
              const d = depthOf(frame, idx);
              const sp = spreadOf(frame, idx);
              const op = (1 - (idx / N) * 0.72) * clamp01(sp * 2.5) * (1 - mergeOf(frame) * 0.4);
              if (op <= 0.005 || d <= 0.002) return null;
              const z = -GAP_Z * idx * d;
              const dx = (-58 * idx - drift * idx * 0.4) * d;
              const dy = -6 * idx * d;
              // Speed → trail blur (along the on-screen direction of depth, approximated with a small isotropic blur + directional stretch)
              const v = Math.abs(depthOf(frame + 0.5, idx) - depthOf(frame - 0.5, idx)) * GAP_Z * idx;
              const blur = Math.min(10, v * 0.06);
              // Birth flash: the stroke is brighter for the first 8 frames after popping out (the "snap" of one copy)
              const born = clamp01(1 - (frame - (SPREAD + (idx - 1) * EACH)) / 8);
              return (
                <div
                  key={idx}
                  style={{
                    position: 'absolute', left: CX, top: CY, width: CW, height: CH,
                    transform: `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, ${z.toFixed(2)}px)`,
                    opacity: op,
                    filter: `blur(${(blur + (idx / N) * 1.6).toFixed(2)}px)${born > 0 ? ` drop-shadow(0 0 ${(14 * born).toFixed(1)}px ${alpha(L.accent, 0.7 * born)})` : ''}`,
                  }}
                >
                  <InstanceCard region={REGIONS[idx]} clone={idx} lit={0} frame={frame} inP={1} />
                </div>
              );
            })}

            {/* Original */}
            <div
              style={{
                position: 'absolute', left: CX, top: CY, width: CW, height: CH,
                transform: `translate3d(0px, ${((1 - enter) * 40).toFixed(2)}px, 0px) scale(${heroScale.toFixed(4)})`,
                opacity: clamp01(enter * 1.4),
                filter: enter < 1 ? `blur(${((1 - enter) * 10).toFixed(2)}px)` : undefined,
              }}
            >
              <InstanceCard region={REGIONS[0]} clone={0} lit={lit} frame={frame} inP={1} />
              {/* Merge stroke glow (once, clipped within the rounded corners) */}
              <div
                style={{
                  position: 'absolute', inset: 0, borderRadius: 30, pointerEvents: 'none',
                  border: `2px solid ${alpha(L.accent, 0.25 * press + 0.9 * rimFlash)}`,
                  boxShadow: `0 0 ${(50 * rimFlash).toFixed(1)}px ${alpha(L.accent, 0.45 * rimFlash)}, inset 0 0 ${(40 * rimFlash).toFixed(1)}px ${alpha(L.accent, 0.18 * rimFlash)}`,
                }}
              />
            </div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* Upper left: title rising after the merge */}
      <div style={{ position: 'absolute', left: 140, top: 168, ...type(TYPE_H1, 780), color: L.ink }}>
        <TextReveal text={'One prompt.'} by="word" variant="rise" start={92} each={16} gap={4} />
        <br />
        <TextReveal text={'Eight shots.'} by="word" variant="rise" start={98} each={16} gap={4} unitStyle={(i) => (i === 1 ? { color: L.accent } : {})} />
      </div>

      {/* Lower left: counter */}
      <div style={{ position: 'absolute', left: 128, top: 622, opacity: labelIn, transform: `translateY(${((1 - labelIn) * 20).toFixed(2)}px)` }}>
        <Counter value={count} tickAge={frame - lastTick} punch={counterPunch} />
      </div>
      <div
        style={{
          position: 'absolute', left: 140, top: 900, display: 'flex', alignItems: 'center', gap: 16,
          opacity: labelIn, ...type(32, 600, { mono: true }), color: L.ink2, letterSpacing: '0.04em',
        }}
      >
        <span style={{ width: 40, height: 2, background: L.accent }} />
        {count === 1 ? 'shot rendered' : 'shots rendered · one prompt'}
      </div>
    </AbsoluteFill>
  );
};

