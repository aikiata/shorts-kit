// Font weight pump (font-weight-pump): the title's strokes thicken with the beat and bounce back, as if the text were dancing to the kick drum.
//
// Second-round redesign (nightclub poster · echo letter stack):
// - look = aurora (deep purple night · purple-pink neon). The hero is a 250px 'LOUDER': at rest it is a thin weight-250 face with gaps between letters
//   (each letter pinned in a slot laid out at weight 900); on a beat the strokes instantly fill the slot into a solid black face, then decay by a power curve back to thin
//   so "the gap opening and closing on each beat" is itself the rhythm. Letters do not move or reflow, only the property changes.
// - Rhythm progression (128 BPM, 14f per beat, two bars + one drop):
//   Bar 1 has only the main word pulsing; in bar 2 an outlined echo row grows above and below, pulsing 2f after the main word and pushed apart by the impact (following);
//   beat 9 drop: the main word shoots to 900 and no longer returns to thin, but settles at weight 780 filled with a purple→pink gradient, the echoes are pushed apart then return,
//   and a horizontal light band sweeps across (Q4: only one for the hero), so the final frame is a complete poster.
// - The rebound is staggered "center closes first, sides close later" (decay window 9f → 13f), reading as the impact spreading from the middle to both sides;
//   the first beat of each bar is the accent: extra scaleX +6%, tinted pink. A step sequencer of 8+1 cells at the bottom is a silent reference (which cell is lit = which beat).
// - No whole-frame per-beat pumping / shaking (beat-shake precedent): only the letters, the glow behind them, and the sequencer cells move with the beat.
//
// Timeline (30fps, 165f total):
//   0–15    Prep: thin LOUDER, empty sequencer, eyebrow (shorts-kit logo + wordmark) in place, glow behind the letters breathes very slowly
//   16–58   Bar 1, 4 beats (16/30/44/58), each with a 9–13f decay window, beat spacing 14f > decay window
//   64–72   Echo rows fade in, pull apart above and below
//   72–114  Bar 2, 4 beats, echoes follow 2f late and are pushed apart by 26px
//   128     drop: weight 900 + gradient + light band, falls back within ~12f and settles at 780; subtitle (shorts-kit selling point) rises word by word
//   140–165 hold
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, mix, ramp } from '../../../shared/fixtures/Polish';
import { LOOKS, Stage, TextReveal, alpha, type } from '../../../shared/fixtures/Look';
import { BRAND, ShortKitMark } from '../../../shared/fixtures/Brand';

export const FONT_WEIGHT_PUMP_DURATION = 165;

const L = LOOKS.aurora;

const BEATS = [16, 30, 44, 58, 72, 86, 100, 114];
const DROP = 128;
const DOWN = new Set([0, 4]); // accent on the first beat of each bar
const TEXT = 'LOUDER';
const SIZE = 240;
const CY = 505; // main word row center (slightly above frame center, leaving room for the subtitle and sequencer below)
const W_REST = 250; // resting weight (thin)
const W_PEAK = 900;
const W_FINAL = 780; // weight that settles after the drop
const DECAY = 9; // decay window of the center letter
const SPREAD = 1.6; // each letter away from the center adds 1.6f to the decay window
const ECHO_IN = 64;
const ECHO_DY = 0.85 * SIZE; // echo row spacing
const LAG = 2; // echo is 2f behind the main word

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const hex = (c: string) => [1, 3, 5].map((k) => parseInt(c.slice(k, k + 2), 16));
const mixRgb = (a: string, b: string, k: number) => {
  const A = hex(a), B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`;
};

// Power-decay envelope after a hit: t=0 → 1, t>=decay → exactly 0
const envAt = (frame: number, beat: number, decay: number) => {
  const t = frame - beat;
  if (t < 0 || t >= decay) return 0;
  return Math.pow(1 - t / decay, 0.8);
};
// Max envelope at a frame + beat index (beat spacing 14f > longest decay window 13f, so only one beat is active at a time)
const pulse = (frame: number, decay: number) => {
  let env = 0;
  let beat = -1;
  BEATS.forEach((b, i) => {
    const e = envAt(frame, b, decay);
    if (e > env) { env = e; beat = i; }
  });
  return { env, beat };
};
// drop: shoots to 1 then falls back to the settled value (0.75 of 0→1 ≈ weight 780)
const dropEnv = (frame: number, decay: number) => {
  const t = frame - DROP;
  if (t < 0) return 0;
  const fin = (W_FINAL - W_REST) / (W_PEAK - W_REST);
  return fin + (1 - fin) * Math.pow(1 - clamp01(t / (decay + 4)), 1.4);
};

const CHARS = TEXT.split('');
const CENTER = (CHARS.length - 1) / 2;
const GRAD = (i: number) => mixRgb(L.accent, L.accent2, i / (CHARS.length - 1)); // purple→pink gradient after the drop (color picked per letter)

// One row of letters: each letter is pinned in a weight-900 slot and thickens in place
const Row: React.FC<{ frame: number; lag?: number; outline?: boolean; opacity?: number }> = ({ frame, lag = 0, outline = false, opacity = 1 }) => {
  const f = frame - lag;
  const drop = clamp01(f - DROP + 1) > 0;
  return (
    <div style={{ display: 'flex', whiteSpace: 'pre', ...type(SIZE, W_REST), letterSpacing: '-0.01em', lineHeight: 1, opacity }}>
      {CHARS.map((ch, i) => {
        const decay = DECAY + Math.max(0, Math.abs(i - CENTER) - 0.5) * SPREAD;
        const { env: e0, beat } = pulse(f, decay);
        const de = dropEnv(f, decay);
        const e = Math.max(e0, de);
        const weight = Math.round(W_REST + (W_PEAK - W_REST) * e);
        const down = beat >= 0 && DOWN.has(beat);
        const hitCol = down ? L.accent2 : L.accent;
        const tint = drop ? 1 : Math.min(1, e0 * 1.25);
        const col = drop ? GRAD(i) : mixRgb(L.ink, hitCol === L.accent2 ? L.accent2 : '#c9b8ff', tint);
        const shine = drop ? 0.35 + 0.65 * Math.pow(1 - clamp01((f - DROP) / 24), 2) : e0;
        return (
          <span key={i} style={{ position: 'relative', display: 'inline-block' }}>
            <span style={{ visibility: 'hidden', fontWeight: W_PEAK }}>{ch}</span>
            <span style={{
              position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', fontWeight: weight,
              color: outline ? 'transparent' : col,
              WebkitTextStroke: outline ? `2px ${alpha(drop ? L.accent : L.ink, 0.55)}` : undefined,
              textShadow: !outline && shine > 0.05
                ? `0 0 ${(18 * shine).toFixed(1)}px ${alpha(drop ? GRAD(i) : hitCol, 0.5 * shine)}, 0 0 ${(70 * shine).toFixed(1)}px ${alpha(drop ? GRAD(i) : hitCol, 0.35 * shine)}`
                : 'none',
            }}>
              {ch}
            </span>
          </span>
        );
      })}
    </div>
  );
};

export const FontWeightPump: React.FC = () => {
  const frame = useCurrentFrame();
  const { env, beat } = pulse(frame, DECAY);
  const dEnv = frame >= DROP ? Math.pow(1 - clamp01((frame - DROP) / 16), 1.2) : 0;
  const down = beat >= 0 && DOWN.has(beat);
  const scaleX = 1 + 0.06 * (down ? env : 0) + 0.08 * dEnv; // accent beat / drop stretches horizontally (transform does not change layout)
  const intro = ramp(frame, 0, 12, EASE.out);
  // Echo: fades in and pulls apart from 64f; each beat pushed apart 26px 2f late; drop pushes 60px apart then returns
  const echoIn = ramp(frame, ECHO_IN, 10, EASE.snappy);
  const { env: eEnv } = pulse(frame - LAG, DECAY + 2);
  const eDrop = frame >= DROP + LAG ? Math.pow(1 - clamp01((frame - DROP - LAG) / 18), 1.6) : 0;
  const echoPush = mix(-40, 0, echoIn) + 26 * eEnv * echoIn + 60 * eDrop;
  const breathe = 0.5 + 0.5 * Math.sin(frame / 9);
  const glowA = 0.1 + 0.05 * breathe * (1 - clamp01(frame / 16)) + 0.3 * env * (down ? 1.3 : 1) + 0.4 * dEnv + (frame >= DROP ? 0.12 : 0);
  // Horizontal light band: sweeps left to right once at the drop
  const streak = ramp(frame, DROP, 16, EASE.out);
  const bar = frame >= BEATS[4] ? 2 : 1;

  const label: React.CSSProperties = { ...type(30, 600, { caps: true }), letterSpacing: '0.16em' };

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Stage look={L} keyLight={{ x: 0.5, y: 0.5 }} fill={{ x: 0.85, y: 0.15 }} intensity={0.7} />

      {/* Glow behind the letters: brightens and dims with the beat, only behind the title */}
      <div style={{
        position: 'absolute', left: 260, right: 260, top: CY - 240, height: 480, borderRadius: '50%',
        background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${alpha(down || frame >= DROP ? L.accent2 : L.accent, Math.min(0.6, glowA))} 0%, ${alpha(L.accent, 0)} 100%)`,
        mixBlendMode: 'screen',
      }} />

      {/* Eyebrow */}
      <div style={{ position: 'absolute', left: 120, top: 92, display: 'flex', alignItems: 'center', gap: 14, opacity: intro }}>
        <ShortKitMark size={46} tone="dark" />
        {/* The wordmark is all lowercase, does not use the eyebrow's caps style */}
        <span style={{ ...type(30, 700), fontFamily: BRAND.font, letterSpacing: '0.03em', color: L.ink }}>{BRAND.name}</span>
      </div>
      <div style={{ position: 'absolute', right: 120, top: 96, ...label, color: L.ink2, opacity: intro, fontVariantNumeric: 'tabular-nums' }}>
        128 BPM <span style={{ color: L.ink3, marginLeft: 18 }}>{`BAR ${bar} / 2`}</span>
      </div>

      {/* Echo rows (outlined): one row above and one below */}
      {[-1, 1].map((s) => (
        <div key={s} style={{
          position: 'absolute', left: 0, right: 0, top: CY - SIZE / 2 + s * (ECHO_DY + echoPush), display: 'flex', justifyContent: 'center',
          opacity: echoIn, transform: `scaleX(${(1 + (scaleX - 1) * 0.5).toFixed(4)})`,
        }}>
          <Row frame={frame} lag={LAG} outline opacity={0.75} />
        </div>
      ))}

      {/* Main word */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: CY - SIZE / 2, display: 'flex', justifyContent: 'center',
        transform: `scaleX(${scaleX.toFixed(4)})`,
      }}>
        <Row frame={frame} />
      </div>

      {/* Drop light band: once, across the main word */}
      {streak > 0 && streak < 1 && (
        <div style={{
          position: 'absolute', left: mix(-600, 1920, streak), top: CY - 4, width: 600, height: 6, borderRadius: 3,
          background: `linear-gradient(90deg, ${alpha('#ffffff', 0)} 0%, ${alpha('#ffffff', 0.9)} 70%, ${alpha('#ffffff', 0)} 100%)`,
          boxShadow: `0 0 30px ${alpha(L.accent2, 0.8)}`, opacity: 1 - streak * 0.6, mixBlendMode: 'screen',
        }} />
      )}

      {/* Subtitle: rises word by word after the drop */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 850, textAlign: 'center', ...type(40, 500), color: L.ink2 }}>
        <TextReveal text="Beat-synced cuts, right on the drop." by="word" variant="rise" start={DROP + 8} each={14} gap={2.5} />
      </div>

      {/* Step sequencer: 8 beats + drop */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 944, display: 'flex', justifyContent: 'center', gap: 16, opacity: intro }}>
        {[...BEATS, DROP].map((b, i) => {
          const isDrop = i === BEATS.length;
          const e = isDrop ? dEnv : envAt(frame, b, DECAY);
          const passed = frame >= b;
          const dn = DOWN.has(i) || isDrop;
          const col = dn ? L.accent2 : L.accent;
          return (
            <div key={i} style={{
              width: isDrop ? 132 : 54, height: 54, borderRadius: 12, position: 'relative', marginLeft: i === 4 || isDrop ? 22 : 0,
              background: alpha(L.ink, 0.05), boxShadow: `inset 0 0 0 1.5px ${alpha(dn ? L.accent2 : L.ink, dn ? 0.35 : 0.14)}`,
              transform: `scale(${(1 + 0.12 * e).toFixed(3)})`,
            }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 12, background: col,
                opacity: e > 0.02 ? Math.max(isDrop ? 0.9 : 0, 0.35 + 0.65 * e) : passed ? (isDrop ? 0.9 : 0.28) : 0,
                boxShadow: e > 0.02 ? `0 0 ${(30 * e).toFixed(1)}px ${alpha(col, 0.8)}` : 'none',
              }} />
              {isDrop && (
                <span style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  ...type(22, 800, { caps: true }), letterSpacing: '0.2em', color: passed ? L.onAccent : L.ink3,
                }}>
                  Drop
                </span>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
