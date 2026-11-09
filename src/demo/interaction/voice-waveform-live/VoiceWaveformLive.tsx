// voice-waveform-live: recording capsule with a live voiceprint (second redesign: shorts-kit voice-dictated storyboard · afternoon warm light)
//
// Design decisions:
// - look = sand (beige · terracotta): fully set apart from the original raycast dark-field glass: daytime, lifestyle, warm sun.
//   Two layers of subject: above, a 92px bold live transcript ("what you say"), below, a live voiceprint in a 1240px warm-white capsule ("it's listening").
//   The transcript appears word by word following the envelope: each word rises from faint to solid at the syllable start of its beat, a freshly spoken word is terracotta and settles to ink after 3–8f;
//   during pauses the transcript tail carries a blinking cursor: the viewer reads "stop" from both "the words are waiting" and "the waveform collapsing into a dotted line".
// - the voiceprint mechanism keeps the original card's final form: 64 bars, 1.6 frames/sample scrolling from right to left, trapezoid speak/stop envelope × syllable value noise × central sin^0.8 weight
//   × per-bar jitter, silence clamped to a 6px dotted line. Bar color = terracotta vertical gradient, fainter the older; the mic button has a terracotta base + a breathing ring expanding with the envelope;
//   the warm light on the floor below the capsule brightens and dims with the volume.
// - submit: the button compresses and rebounds, the waveform collapses with a 12f ease-in, the transcript as a whole moves up, shrinks and tucks into a terracotta message bubble (ink text → white text),
//   and under the bubble "Sent to shorts-kit · 0:03" appears; the capsule returns to standby (mic turns gray, dotted line). End frame = one complete conversation poster.
//
// Timeline (30fps, 172f total):
//   0–14    entrance: capsule 1.04→1 settles into focus and fades in, label "shorts-kit is listening" follows (after 6f), hint text Describe your next shot… appears, fades out 15f before the first word
//   15–57   speak: Make a launch film for Friday, (words at 17/22/25/32/40/45)
//   57–80   pause: waveform collapses into a dotted line, the transcript tail cursor blinks (the pause must truly "stop")
//   80–124  speak: open with a crash zoom. (82/88/92/102/112)
//   126     submit: button 1→0.82→1, waveform collapses to 0.06 over 12f, arrow flies up, checkmark drops in
//   128–150 transcript moves up + shrinks to 0.72 and tucks into the bubble (22f, EASE.swift), bubble fill / white text in place before 140
//   140–152 "Sent" line rises; capsule sinks 24px and returns to standby
//   152–172 hold: conversation poster frozen, warm light breathes very slowly
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { EASE, FONT, mix, ramp } from '../../../shared/fixtures/Polish';
import { LOOKS, Stage, alpha } from '../../../shared/fixtures/Look';
import { BRAND } from '../../../shared/fixtures/Brand';

export const VOICE_WAVEFORM_LIVE_DURATION = 172;

const L = LOOKS.sand;

const mulberry32 = (a: number) => () => {
  let t = (a += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// value noise: seeded random values at integer sample points, smooth interpolation between sample points
const noiseAt = (x: number) => {
  const i = Math.floor(x);
  const fr = x - i;
  const a = mulberry32(i * 7919 + 13)();
  const b = mulberry32((i + 1) * 7919 + 13)();
  const s = fr * fr * (3 - 2 * fr); // smoothstep
  return a + (b - a) * s;
};

// speaking envelope (counted by "the moment the sound happens"): speak → pause → speak
const envelope = (t: number) => {
  const seg = (a: number, b: number, rise = 5, fall = 7) =>
    interpolate(t, [a, a + rise, b - fall, b], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const talk = Math.max(seg(15, 57), seg(80, 124));
  const syllable = 0.55 + 0.45 * noiseAt(t / 4.5 + 200);
  return talk * syllable;
};

const N_BARS = 64;
const SCROLL = 1.6; // frames/sample: scroll speed
const MAX_H = 150;
const SUBMIT = 126;

// word-by-word transcript: a word appears at the syllable start of its beat
const LINES: { w: string; at: number }[][] = [
  [{ w: 'Make', at: 17 }, { w: 'a', at: 22 }, { w: 'launch', at: 25 }, { w: 'film', at: 32 }, { w: 'for', at: 40 }, { w: 'Friday,', at: 45 }],
  [{ w: 'open', at: 82 }, { w: 'with', at: 88 }, { w: 'a', at: 92 }, { w: 'crash', at: 102 }, { w: 'zoom.', at: 112 }],
];

const CAP = { w: 1240, h: 196, cy: 760 };
const TEXT_CY = 372;

export const VoiceWaveformLive: React.FC = () => {
  const f = useCurrentFrame();

  // ── entrance ──
  const inT = ramp(f, 0, 14, EASE.snappy);
  const labelT = ramp(f, 6, 12, EASE.out);

  // ── submit ──
  const submitted = f >= SUBMIT;
  const btnPress = interpolate(f, [SUBMIT, SUBMIT + 3, SUBMIT + 9], [1, 0.82, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const collapse = mix(1, 0.06, ramp(f, SUBMIT, 12, EASE.exit));
  const arrowOut = ramp(f, SUBMIT + 1, 6, EASE.exit);
  const checkIn = ramp(f, SUBMIT + 4, 8, EASE.overshoot);
  const toBubble = ramp(f, SUBMIT + 2, 22, EASE.swift);
  const bubbleFill = ramp(f, SUBMIT + 6, 10, EASE.out);
  const sentT = ramp(f, SUBMIT + 14, 12, EASE.out);
  const idle = ramp(f, SUBMIT + 14, 14, EASE.swift); // capsule returns to standby

  // ── voiceprint ──
  const bars = Array.from({ length: N_BARS }, (_, i) => {
    const sampleT = f - (N_BARS - 1 - i) * SCROLL; // the rightmost bar is "now", the further left the older
    const env = sampleT < 0 ? 0 : envelope(sampleT);
    const center = Math.pow(Math.sin((i / (N_BARS - 1)) * Math.PI), 0.8);
    const jitter = 0.35 + 0.65 * noiseAt(sampleT * 1.7 + i * 0.13);
    return Math.max(6, env * center * jitter * MAX_H * collapse);
  });
  const nowEnv = submitted ? 0 : envelope(f);
  const level = (bars.slice(-12).reduce((a, b) => a + b, 0) / 12 / MAX_H) * collapse;

  // timer (speaking duration, stops after submit)
  const secs = Math.min(f, SUBMIT) / 30;
  const timer = `0:${String(Math.floor(Math.max(0, secs - 0.4))).padStart(2, '0')}`;

  // transcript tail cursor: steady while speaking, blinks during pauses, gone after submit
  const lastAt = LINES.flat().filter((w) => f >= w.at).pop()?.at ?? -99;
  const talking = nowEnv > 0.05;
  const caretOn = !submitted && f > 14 && (talking || Math.floor((f - lastAt) / 8) % 2 === 0);

  // transcript → bubble: moves up + shrinks to 0.72
  const textScale = mix(1, 0.72, toBubble);
  const textY = mix(TEXT_CY, 330, toBubble);
  const hintO = ramp(f, 4, 10, EASE.out) * (1 - ramp(f, 15, 4, EASE.linear)); // hint text before speaking starts
  const inkToWhite = bubbleFill;

  const word = (w: { w: string; at: number }, k: number) => {
    const p = ramp(f, w.at, 8, EASE.snappy);
    const fresh = 1 - ramp(f, w.at + 3, 6, EASE.linear); // just spoken → terracotta, then settles to ink
    const c = inkToWhite > 0 ? mixColor(L.ink, '#fff8f0', inkToWhite) : mixColor(L.ink, L.accent, fresh);
    return (
      <span key={k} style={{
        display: 'inline-block', marginRight: '0.24em', opacity: p, color: c,
        filter: p < 1 ? `blur(${((1 - p) * 10).toFixed(2)}px)` : undefined,
        transform: `translateY(${((1 - p) * 0.22).toFixed(3)}em)`,
      }}>
        {w.w}
        {/* tail cursor hangs after the last word that has appeared */}
        {caretOn && w.at === lastAt && (
          <span style={{ display: 'inline-block', width: 6, height: '0.8em', verticalAlign: '-0.08em', marginLeft: '0.06em', marginRight: '-0.12em', borderRadius: 3, background: L.accent }} />
        )}
      </span>
    );
  };

  return (
    <AbsoluteFill style={{ background: L.bg[1], overflow: 'hidden', fontFamily: FONT.sans }}>
      <Stage look={L} keyLight={{ x: 0.3, y: 0.0 }} fill={{ x: 0.78, y: 0.9 }} breathe={0.4}>
        {/* warm floor light under the capsule: brightens and dims with the volume "now" */}
        <div style={{
          position: 'absolute', left: 960 - 820, top: CAP.cy - 40, width: 1640, height: 420,
          background: `radial-gradient(ellipse 50% 46% at 50% 40%, ${alpha('#e2885a', 0.08 + 0.22 * level)} 0%, ${alpha('#e2885a', 0)} 70%)`,
          opacity: inT,
        }} />
      </Stage>

      {/* ── live transcript / message bubble ── */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: textY, height: 0, display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      }}>
        <div style={{ position: 'relative', transform: `translateY(-50%) scale(${textScale.toFixed(4)})`, transformOrigin: '50% 50%' }}>
          {/* bubble base */}
          <div style={{
            position: 'absolute', left: -64, right: -64 + 0, top: -44, bottom: -44, borderRadius: 64,
            background: L.accent, opacity: bubbleFill,
            borderBottomRightRadius: mix(64, 18, bubbleFill),
            boxShadow: `0 30px 70px -26px ${alpha(L.shadow, 0.55 * bubbleFill)}, 0 8px 20px -8px ${alpha(L.shadow, 0.3 * bubbleFill)}`,
          }} />
          <div style={{ position: 'relative', fontSize: 92, fontWeight: 760, letterSpacing: '-0.035em', lineHeight: 1.08, textAlign: 'left', whiteSpace: 'nowrap' }}>
            {LINES.map((line, li) => (
              <div key={li} style={{ minHeight: '1.08em' }}>
                {line.map((w, k) => word(w, k))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* hint text before speaking: fades out before the first word lands (the upper half of the screen isn't empty at the start) */}
      {hintO > 0.01 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: TEXT_CY - 52, textAlign: 'center', fontSize: 92, fontWeight: 760, letterSpacing: '-0.035em', color: alpha(L.ink3, 0.55), opacity: hintO, filter: `blur(${((1 - hintO) * 6).toFixed(2)}px)` }}>
          Describe your next shot…
        </div>
      )}

      {/* Sent line */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 492, textAlign: 'center', fontSize: 32, fontWeight: 550, color: L.ink2,
        opacity: sentT, transform: `translateY(${((1 - sentT) * 16).toFixed(2)}px)`,
      }}>
        <span style={{ color: L.accent }}>✓</span>&nbsp; Sent to {BRAND.short} · {timer}
      </div>

      {/* label: shorts-kit is listening */}
      <div style={{
        position: 'absolute', left: 960 - CAP.w / 2 + 24, top: CAP.cy - CAP.h / 2 - 62, display: 'flex', alignItems: 'center', gap: 14,
        fontSize: 32, fontWeight: 600, color: L.ink2, letterSpacing: '-0.01em',
        opacity: labelT * (1 - idle), transform: `translateY(${((1 - labelT) * 10).toFixed(2)}px)`,
      }}>
        <span style={{ width: 14, height: 14, borderRadius: 7, background: L.accent, boxShadow: `0 0 0 ${(4 + 6 * nowEnv).toFixed(1)}px ${alpha(L.accent, 0.18)}` }} />
        {BRAND.short} is listening
      </div>

      {/* ── capsule ── */}
      <div style={{
        position: 'absolute', left: 960 - CAP.w / 2, top: CAP.cy - CAP.h / 2 + 24 * idle, width: CAP.w, height: CAP.h, borderRadius: CAP.h / 2,
        opacity: inT, transform: `scale(${(mix(1.04, 1, inT) * mix(1, 0.94, idle)).toFixed(4)})`,
        filter: inT < 1 ? `blur(${((1 - inT) * 6).toFixed(2)}px)` : undefined,
        background: 'linear-gradient(180deg, #fffcf7 0%, #f8f1e7 100%)',
        boxShadow: `inset 0 1.5px 0 #ffffff, inset 0 0 0 1px rgba(70,45,20,0.07), 0 2px 4px rgba(58,36,16,0.08), 0 40px 80px -30px ${alpha(L.shadow, 0.45)}, 0 14px 30px -12px ${alpha(L.shadow, 0.22)}`,
        display: 'flex', alignItems: 'center', padding: '0 38px', gap: 30, boxSizing: 'border-box',
      }}>
        {/* mic button: terracotta base, a breathing ring expands while speaking */}
        <div style={{ position: 'relative', width: 120, height: 120, flex: 'none' }}>
          {[0, 1].map((k) => (
            <div key={k} style={{
              position: 'absolute', inset: -(8 + (14 + k * 14) * nowEnv), borderRadius: '50%',
              background: alpha(L.accent, (0.14 - k * 0.06) * Math.min(1, nowEnv * 1.6)),
            }} />
          ))}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: idle > 0 ? mixColor('#cc5a30', '#d9cfc2', idle) : 'linear-gradient(160deg, #d8673a, #b8481f)',
            boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.35), 0 8px 20px -8px ${alpha('#b8481f', 0.6 * (1 - idle))}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width={56} height={56} viewBox="0 0 24 24" fill="none">
              <rect x={8.5} y={3} width={7} height={12} rx={3.5} fill="#fff8f0" />
              <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" stroke="#fff8f0" strokeWidth={1.9} strokeLinecap="round" />
              <path d="M12 18v3M9 21h6" stroke="#fff8f0" strokeWidth={1.9} strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* voiceprint */}
        <div style={{
          flex: 1, height: 160, display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden',
          WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 14%, #000 100%)',
          maskImage: 'linear-gradient(90deg, transparent 0%, #000 14%, #000 100%)',
        }}>
          {bars.map((h, i) => {
            const k = Math.min(1, h / MAX_H);
            const age = i / (N_BARS - 1); // 0 = oldest
            const quiet = h <= 7 || collapse < 0.25;
            return (
              <div key={i} style={{
                flex: 1, height: h, borderRadius: 99,
                background: quiet
                  ? alpha(L.ink3, 0.55)
                  : `linear-gradient(180deg, ${alpha('#e8956a', 0.6 + 0.4 * age)} 0%, ${alpha(L.accent, 0.65 + 0.35 * age)} 50%, ${alpha('#e8956a', 0.6 + 0.4 * age)} 100%)`,
                boxShadow: !quiet && i === N_BARS - 1 && !submitted ? `0 0 14px ${alpha(L.accent, 0.5 * k)}` : undefined,
              }} />
            );
          })}
        </div>

        {/* timer */}
        <div style={{ fontSize: 32, fontWeight: 600, color: L.ink2, fontVariantNumeric: 'tabular-nums', width: 70, textAlign: 'right', flex: 'none' }}>{timer}</div>

        {/* submit button: ink circle + up arrow; on submit the arrow flies up, the checkmark drops in */}
        <div style={{
          position: 'relative', width: 120, height: 120, borderRadius: 60, flex: 'none', overflow: 'hidden',
          background: 'linear-gradient(180deg, #2c241b, #191410)', transform: `scale(${btnPress.toFixed(4)})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.14), 0 10px 24px -8px ${alpha(L.shadow, 0.6)}`,
        }}>
          <svg width={52} height={52} viewBox="0 0 24 24" style={{ position: 'absolute', opacity: 1 - arrowOut, transform: `translateY(${(-30 * arrowOut).toFixed(2)}px)` }}>
            <path d="M12 20V5M12 5l-6.5 6.5M12 5l6.5 6.5" stroke="#fff8f0" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          {checkIn > 0.001 && (
            <svg width={54} height={54} viewBox="0 0 24 24" style={{ position: 'absolute', opacity: Math.min(1, checkIn * 1.4), transform: `translateY(${(16 * (1 - checkIn)).toFixed(2)}px) scale(${(0.7 + 0.3 * checkIn).toFixed(3)})` }}>
              <path d="M5.5 12.5l4.2 4.2L18.5 7.8" stroke="#fff8f0" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// blend two hex colors by t → rgb()
function mixColor(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a);
  const B = p(b);
  const k = Math.max(0, Math.min(1, t));
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`;
}
