// Text flowing along a curve (text-on-path): characters file in along a rising curve (a chart growth line), rotating by the tangent angle while moving;
// after arriving, each letter lifts from its "lying on the line" pose and straightens into a horizontal title. The curve evolves in sync with the lead character.
//
// Second-round redesign (midnight · dark-field data launch):
// - look = midnight (deep blue night · electric blue · cyan accents). The hero is a revenue growth line filling the frame: electric-blue 5px round-cap stroke +
//   a vertical gradient area under the line + outer glow, the lead is a cyan light point; the background is 4 hairline grid lines + mono ticks (texture level).
// - The copy 'UP AND TO THE RIGHT' at 92px / weight 800 all caps: its literal meaning is this very line, with the text walking the line = the text and the data narrating in the same frame.
//   The whole string advances rigidly by arc length at real steps (last letter leads, rotating by the tangent angle, readable while moving), with a horizontal drag trail by speed.
// - Straightening is no longer an in-place lerp: each letter flies along a "lift first, shift sideways later" arc to the top-left title position (y uses snappy, x uses swift,
//   the two curves are offset → the trajectory is an arc), staggered 1.1f from left to right, landing with at most one slight overshoot.
// - Aftermath: the lead light point lands at the top of the line → a value badge '$48.6M ARR' + '▲ 312%' pops out (spring), the eyebrow and subline rise word by word;
//   during the hold the whole frame pushes in very slowly by 1.5%.
//
// Timeline (30fps, 160f total):
//   0–16    grid lines wipe in from the left, ticks fade in; stage light (frame 1 already has the grid start state)
//   4–64    whole string advances along the line for 60f (slow start, long ease-out), curve and lead grow in sync
//   64–72   pause 8f: the whole sentence hangs on the line, readable
//   72–110  letters lift and straighten one by one (18f/letter, 1.1f stagger), curve completes, area fades to full
//   92–110  subline / eyebrow rise; 98 value badge pops out (spring); from 100 quarter markers light up one by one
//   108–160 hold (very slow 1.5% push-in)
import React, { useLayoutEffect, useRef, useState } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, FONT, bezier, mix, ramp, velocity } from '../../../shared/fixtures/Polish';
import { LOOKS, Stage, TextReveal, alpha, glow, springAt, type } from '../../../shared/fixtures/Look';

export const TEXT_ON_PATH_DURATION = 160;

const L = LOOKS.midnight;

// Growth curve: lower left → upper right (gentle then steep, but the turning radius is large enough that the 92px letters do not bite each other's corners)
const P0 = { x: 150, y: 930 };
const P1 = { x: 860, y: 920 };
const P2 = { x: 1300, y: 780 };
const P3 = { x: 1700, y: 400 };

const bez = (t: number) => {
  const u = 1 - t;
  return {
    x: u * u * u * P0.x + 3 * u * u * t * P1.x + 3 * u * t * t * P2.x + t * t * t * P3.x,
    y: u * u * u * P0.y + 3 * u * u * t * P1.y + 3 * u * t * t * P2.y + t * t * t * P3.y,
  };
};
const tangent = (t: number) => {
  const u = 1 - t;
  const dx = 3 * u * u * (P1.x - P0.x) + 6 * u * t * (P2.x - P1.x) + 3 * t * t * (P3.x - P2.x);
  const dy = 3 * u * u * (P1.y - P0.y) + 6 * u * t * (P2.y - P1.y) + 3 * t * t * (P3.y - P2.y);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
};

// Arc-length table: s(t) sampling + reverse lookup t(s)
const SAMPLES = 300;
const ARC: number[] = (() => {
  const a = [0];
  let prev = bez(0);
  for (let k = 1; k <= SAMPLES; k++) {
    const p = bez(k / SAMPLES);
    a.push(a[k - 1] + Math.hypot(p.x - prev.x, p.y - prev.y));
    prev = p;
  }
  return a;
})();
const LEN = ARC[SAMPLES];
const tAtS = (s: number) => {
  const v = Math.max(0, Math.min(LEN, s));
  let lo = 0;
  let hi = SAMPLES;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (ARC[mid] < v) lo = mid;
    else hi = mid;
  }
  const seg = ARC[hi] - ARC[lo] || 1;
  return (lo + (v - ARC[lo]) / seg) / SAMPLES;
};

const TEXT = 'UP AND TO THE RIGHT';
const N = TEXT.length;
const FS = 92;
const TRACK = '-0.01em';
const CHAR_W = 60; // fallback character width before measurement
const FINAL = { x: 150, y: 250 }; // title landing: left edge x, letter-center y
const T0 = 4; // start of run
const TRAVEL = 60; // advance along the line
const HOLD = 8; // pause on the line
const SETTLE = 18; // straightening per letter
const SETTLE_STAG = 1.1;
const END_S = LEN * 0.94; // the lead letter's center finally stops at 94% of the arc length
const TRAVEL_EASE = bezier(0.42, 0, 0.12, 1); // slow start, long ease-out
const LIFT_EASE = bezier(0.3, 1.22, 0.6, 1); // lift: arrives fast, overshoots ~4% and settles (the lift travel is large, 8% would push into the eyebrow)

// Grid (y) and ticks
const GRID = [400, 577, 753, 930];
const TICKS = ['$60M', '$40M', '$20M', '$0'];
const QUARTERS: [number, string][] = [[0.42, 'Q2 · $11M'], [0.66, 'Q3 · $24M'], [0.85, 'Q4 · $37M']];
const MONTHS = ['JAN', 'MAR', 'MAY', 'JUL', 'SEP', 'NOV'];

export const TextOnPath: React.FC = () => {
  const frame = useCurrentFrame();

  // Measure each character's center (relative to the left edge of the whole string)
  const measRef = useRef<HTMLDivElement>(null);
  const [centers, setCenters] = useState<number[]>(() => TEXT.split('').map((_, i) => i * CHAR_W + CHAR_W / 2));
  useLayoutEffect(() => {
    const el = measRef.current;
    if (!el) return;
    const kids = Array.from(el.children) as HTMLElement[];
    const c = kids.map((k) => k.offsetLeft + k.offsetWidth / 2);
    if (el.offsetWidth > 0) setCenters(c);
  }, []);
  const lastC = centers[N - 1];

  // Lead advances along the arc length
  const headAt = (f: number) => -24 + (END_S + 24) * ramp(f, T0, TRAVEL, TRAVEL_EASE);
  const headS = headAt(frame);
  const headV = Math.abs(velocity(headAt, frame)); // px/frame
  // Curve evolve: in sync with the lead (slightly ahead), then completes the remaining line after arrival
  const tail = ramp(frame, T0 + TRAVEL - 4, 30, EASE.out);
  const evolveS = Math.min(LEN, Math.max(headS + FS * 0.45, 0) * (1 - tail) + LEN * tail);
  const tip = bez(tAtS(evolveS));
  const evolveFrac = evolveS / LEN;

  const pathD = `M ${P0.x} ${P0.y} C ${P1.x} ${P1.y}, ${P2.x} ${P2.y}, ${P3.x} ${P3.y}`;
  const areaD = `${pathD} L ${P3.x} ${GRID[3]} L ${P0.x} ${GRID[3]} Z`;
  const areaFull = ramp(frame, 70, 34, EASE.out);

  // The hold segment pushes in very slowly (targeting the area near the curve's apex)
  const push = 1 + 0.015 * ramp(frame, 100, 60, EASE.swift);
  // Value badge
  const badge = springAt(frame, 98, { damping: 15, stiffness: 190 });
  const badgeIn = ramp(frame, 98, 8, EASE.out);
  const pulse = ramp(frame, T0 + TRAVEL + 2, 24, EASE.out); // one ring of pulse when the light point reaches the top

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Stage look={L} keyLight={{ x: 0.78, y: 0.28 }} fill={{ x: 0.12, y: 0.95 }} breathe={0.6} />
      {/* Hidden width-measuring row (same font and letter-spacing as the final state) */}
      <div ref={measRef} style={{ position: 'absolute', visibility: 'hidden', whiteSpace: 'pre', display: 'flex', ...type(FS, 800, { caps: true }), letterSpacing: TRACK }}>
        {TEXT.split('').map((ch, i) => <span key={i}>{ch === ' ' ? ' ' : ch}</span>)}
      </div>

      <AbsoluteFill style={{ transform: `scale(${push.toFixed(5)})`, transformOrigin: '70% 40%' }}>
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <linearGradient id="top-area" x1="0" y1={400} x2="0" y2={930} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor={L.accent} stopOpacity={0.34} />
              <stop offset="0.6" stopColor={L.accent} stopOpacity={0.08} />
              <stop offset="1" stopColor={L.accent} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="top-line" x1={P0.x} y1="0" x2={P3.x} y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor={alpha(L.accent, 0.35)} />
              <stop offset="0.55" stopColor={L.accent} />
              <stop offset="1" stopColor="#9fc0ff" />
            </linearGradient>
            <clipPath id="top-reveal"><rect x={0} y={0} width={tip.x} height={1080} /></clipPath>
            <filter id="top-glow" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="10" /></filter>
          </defs>
          {/* Hairline grid + ticks (texture level) */}
          {GRID.map((y, k) => {
            const g = ramp(frame, k * 3, 18, EASE.out);
            return (
              <g key={y} opacity={0.4 + 0.6 * g}>
                <line x1={150} x2={150 + 1560 * g} y1={y} y2={y} stroke={k === 3 ? alpha(L.ink, 0.22) : L.line} strokeWidth={1.5} strokeDasharray={k === 3 ? undefined : '2 10'} />
                <text x={1740} y={y + 8} fontFamily={FONT.mono} fontSize={22} fill={L.ink3} opacity={g}>{TICKS[k]}</text>
              </g>
            );
          })}
          {MONTHS.map((m, k) => (
            <text key={m} x={150 + k * 300} y={980} fontFamily={FONT.mono} fontSize={22} letterSpacing="0.12em" fill={L.ink3} opacity={ramp(frame, 6 + k * 2, 16, EASE.out)}>{m}</text>
          ))}
          {/* Area under the line: revealed as the curve grows, filled fully once it reaches the top */}
          <path d={areaD} fill="url(#top-area)" clipPath="url(#top-reveal)" opacity={0.55 + 0.45 * areaFull} />
          {/* Outer glow + main line */}
          <path d={pathD} fill="none" stroke={L.accent} strokeWidth={14} strokeLinecap="round" opacity={0.55} filter="url(#top-glow)"
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - evolveFrac} />
          <path d={pathD} fill="none" stroke="url(#top-line)" strokeWidth={5} strokeLinecap="round"
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - evolveFrac} />
          {/* Quarter markers: light up one by one after the curve is drawn past them (texture-level labels) */}
          {QUARTERS.map(([tq, lab], k) => {
            const q = bez(tq);
            const on = ramp(frame, 100 + k * 4, 12, EASE.overshoot);
            if (evolveFrac < tq || on <= 0) return null;
            return (
              <g key={lab} opacity={Math.min(1, on)}>
                <line x1={q.x} x2={q.x} y1={q.y + 14} y2={GRID[3]} stroke={alpha(L.accent, 0.25)} strokeWidth={1.5} strokeDasharray="2 6" />
                <circle cx={q.x} cy={q.y} r={7 * on} fill={L.bg[1]} stroke={L.accent} strokeWidth={3} />
                <text x={q.x + 16} y={q.y + 34} fontFamily={FONT.mono} fontSize={22} fill={L.ink2}>{lab}</text>
              </g>
            );
          })}
          {/* Lead light point + pulse at the top */}
          {evolveFrac > 0.002 && (
            <g>
              {pulse > 0 && pulse < 1 && <circle cx={tip.x} cy={tip.y} r={12 + 60 * pulse} fill="none" stroke={L.accent2} strokeWidth={2} opacity={1 - pulse} />}
              <circle cx={tip.x} cy={tip.y} r={22} fill={L.accent2} opacity={0.18} />
              <circle cx={tip.x} cy={tip.y} r={9} fill={L.ink} stroke={L.accent2} strokeWidth={4} />
            </g>
          )}
        </svg>

        {/* Value badge: pinned to the lower left of the line's top */}
        <div style={{
          position: 'absolute', left: P3.x - 56, top: P3.y - 168, transform: `translateX(-100%) translateY(${((1 - badge) * 30).toFixed(2)}px) scale(${(0.9 + 0.1 * badge).toFixed(4)})`,
          transformOrigin: '100% 100%', opacity: badgeIn, textAlign: 'right',
        }}>
          <div style={{ ...type(84, 760), color: L.ink, textShadow: glow(L.accent, 0.35) }}>$48.6M</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 18, marginTop: 10, alignItems: 'baseline' }}>
            <span style={{ ...type(32, 500), color: L.ink2 }}>ARR</span>
            <span style={{ ...type(32, 700), color: L.accent2 }}>▲ 312%</span>
          </div>
        </div>

        {/* Eyebrow + subline */}
        <div style={{ position: 'absolute', left: FINAL.x + 4, top: FINAL.y - 112, ...type(26, 700, { caps: true, mono: true }), letterSpacing: '0.18em', color: L.accent }}>
          <TextReveal text="FY2026 · Annual report" start={96} by="word" variant="rise" each={14} gap={3} />
        </div>
        <div style={{ position: 'absolute', left: FINAL.x + 4, top: FINAL.y + 70, ...type(40, 450), color: L.ink2 }}>
          <TextReveal text="Every quarter beat the last one." start={92} by="word" variant="blur" each={16} gap={2.5} />
        </div>

        {/* Characters: advance along the line → lift and straighten */}
        {TEXT.split('').map((ch, i) => {
          if (ch === ' ') return null;
          const s = headS - (lastC - centers[i]);
          const onPath = bez(tAtS(s));
          const pre = Math.min(0, s); // letters not yet on the line retreat off the line along the start tangent
          const ang0 = tangent(0) * (Math.PI / 180);
          const px = onPath.x + Math.cos(ang0) * pre;
          const py = onPath.y + Math.sin(ang0) * pre;
          const angOnCurve = tangent(tAtS(s));
          const st = T0 + TRAVEL + HOLD + i * SETTLE_STAG;
          const sx = ramp(frame, st, SETTLE, EASE.swift); // sideways shift (in-out)
          const sy = ramp(frame, st, SETTLE, LIFT_EASE); // lift arrives first (with ~4% slight overshoot)
          const sr = ramp(frame, st + 2, SETTLE, EASE.out); // rotation converges 2f later
          const x = mix(px, FINAL.x + centers[i], sx);
          const y = mix(py, FINAL.y, sy);
          const ang = angOnCurve * (1 - sr);
          const lift = -0.4 * FS * (1 - Math.min(1, sy)); // letter bottom on the line → letter center
          const op = ramp(s, -FS * 0.9, FS * 0.9, EASE.linear);
          // Horizontal drag trail by speed while moving (the text's own blur only in the fast segment)
          const moving = frame < st ? Math.min(6, headV * 0.12) : 0;
          return (
            <div key={i} style={{
              position: 'absolute', left: x, top: y, opacity: op,
              transform: `translate(-50%, -50%) rotate(${ang.toFixed(3)}deg) translateY(${lift.toFixed(2)}px)`,
              ...type(FS, 800, { caps: true }), letterSpacing: TRACK, lineHeight: 1, color: L.ink, whiteSpace: 'pre',
              textShadow: `${(-moving * 1.4).toFixed(1)}px 0 ${(moving * 2).toFixed(1)}px ${alpha(L.accent, 0.5)}, 0 0 24px ${alpha(L.accent, 0.25)}`,
            }}>
              {ch}
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
