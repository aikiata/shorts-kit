// circle-match-iris: circle-center-matched iris cut (match-cut × iris): the iris bursts open from the center of a real circle in the foreground,
// and the ring chart of the new scene inside the iris connects onto that same circle: "this person's avatar" becomes "this person's data".
//
// Round 2 redesign (creator weekly leaderboard, neon lime):
// - look = lime (graphite base + neon yellow-green). Scene A is the shorts-kit studio's weekly output leaderboard: five rows of large type,
//   row 3 is "You": a neon-green solid avatar circle (72px) is the only accent block in the whole film, and the anchor of the match cut.
// - Focus: other rows drop to 32% brightness, the "You" row is lifted, the avatar pulses twice with two neon ripples; the camera pushes in slowly 3% about the anchor
//   (the anchor does not move on screen at all).
// - Circle match (the crux): the solid avatar circle itself "hollows out" into a ring: stroke width shrinks from = diameter (solid disc) to 44px, radius 36→300,
//   iris radius = ring outer edge + an ease-in accelerating outward expansion, so it reads as "the ring pushes the iris open", and the match happens before the iris fills the screen.
//   Meanwhile the old page is pushed away with the anchor as its center (scaled up + darkened), and the new scene is "pressed" over the old page.
// - Scene B: concentric timer dial + ring sweeping to 87% (this week's output goal), the 200px center number counts in sync with the sweep; the large title on the right rises word by word,
//   three data points land staggered.
//
// Timeline (30fps, 165f total):
//   0–18    prep: stage light, five-row leaderboard floats up row by row from below (frame 0 already has the first row's start state)
//   14–40   focus: other rows darken; avatar pulses at 18f / 30f + ripples; camera pushes in slowly about the anchor 1→1.03
//   40–47   anticipation: avatar shrinks to 0.9 (windup)
//   47–75   main action: solid avatar hollows into a ring, r 36→300 (spring-like expo-out, 28f), the ring pushes the iris open,
//           54–84 iris accelerates outward with ease-in to fill the screen; old page scales up 1.03→1.22 and darkens
//   60–118  follow-through: sweep 0→87% (slow start, long tail 58f), number counts in sync; 76–104 right title rises word by word, data staggered;
//           at 108f the rank capsule calls back to scene A
//   118–165 hold: dial rotates very slowly + ring glow breathes, ending on a complete poster
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { EASE, FONT, Grain, bezier, mix, ramp } from '../../../shared/fixtures/Polish';
import { LOOKS, Stage, TYPE, TextReveal, alpha, stagger, type } from '../../../shared/fixtures/Look';
import { BRAND, ShortKitMark } from '../../../shared/fixtures/Brand';

export const CIRCLE_MATCH_IRIS_DURATION = 165;

const L = LOOKS.lime;

// ── Anchor: the single circle center shared by both scenes (every circle, namely avatar, ripple, iris, ring and dial, references this set of constants) ──
const CX = 540; // = ROW_X + row left padding 36 + rank column 84 + avatar radius
const CY = 540;
const AV_R = 36; // avatar radius
const RING_R = 300; // new scene ring radius
const RING_W = 44; // ring stroke width
const GOAL = 0.87;

// Leaderboard geometry: five rows, row pitch 124, row 3 (index 2) is centered at CY
const ROW_H = 108;
const ROW_PITCH = 124;
const ROW_X = 384; // row left edge
const ROW_W = 1152;
const rowTop = (i: number) => CY - ROW_H / 2 + (i - 2) * ROW_PITCH;
const ME = 2;

const ROWS = [
  { rank: '01', init: 'JO', name: 'Jonas Ortega', sub: 'Lisbon · 7 films', km: '61', d: '+8' },
  { rank: '02', init: 'AS', name: 'Aiko Sato', sub: 'Osaka · 6 films', km: '53', d: '+3' },
  { rank: '03', init: 'MK', name: 'You', sub: 'Berlin · 6 films', km: '47', d: '+5' },
  { rank: '04', init: 'LB', name: 'Lena Brandt', sub: 'Berlin · 5 films', km: '44', d: '−1' },
  { rank: '05', init: 'TN', name: 'Theo Nakamura', sub: 'Vancouver · 4 films', km: '39', d: '+1' },
];

const STATS = [
  { v: '47', u: 'shots', k: 'Rendered' },
  { v: '6', u: 'films', k: 'This week' },
  { v: '4:52', u: 'min', k: 'Avg render' },
];

// Iris expansion: very slow in the early part (let the ring push it open first), accelerating in the later part to fill the screen
const IRIS_EASE = bezier(0.62, 0, 0.32, 1);
// sweep: slightly slow start (catches the ring growth's end speed), long tail to settle, the readout slowly creeps up to 87 in the last third
const SWEEP_EASE = bezier(0.4, 0, 0.12, 1);

export const CircleMatchIris: React.FC = () => {
  const f = useCurrentFrame();

  // ── Scene A ──
  const rowIn = (i: number) => ramp(f, -6 + stagger(i, 5, 14, EASE.out), 16, EASE.snappy);
  const focus = ramp(f, 14, 18, EASE.out); // dim the other rows
  const pulse = (s: number) => ramp(f, s, 5, EASE.snappy) - ramp(f, s + 5, 11, EASE.out);
  const anticip = ramp(f, 40, 7, EASE.swift);
  const avScale = 1 + 0.16 * (pulse(18) + pulse(30)) - 0.1 * anticip;
  const waves = [18, 30].map((s) => {
    const p = ramp(f, s, 22, EASE.out);
    return { r: AV_R + 10 + p * 64, o: f >= s && f < s + 22 ? 0.85 * (1 - p) : 0, w: mix(4, 1, p) };
  });
  // Camera: slow push about the anchor, the old page is pushed away when the iris opens (scaled up + darkened)
  const push = ramp(f, 4, 40, EASE.smooth);
  const away = ramp(f, 47, 34, EASE.exit);
  const aScale = 1 + 0.03 * push + 0.19 * away;
  const aDim = 1 - 0.55 * away;

  // ── Circle match: solid avatar → ring ──
  const grow = ramp(f, 47, 28, EASE.snappy);
  const ringR = mix(AV_R * 0.9, RING_R, grow);
  const ringW = mix(AV_R * 0.9 * 2, RING_W, ramp(f, 47, 22, EASE.snappy)); // stroke = diameter means a solid disc
  const opened = f >= 47;
  const irisR = ringR + ringW / 2 + 10 + 2400 * ramp(f, 54, 30, IRIS_EASE);
  const discToTrack = ramp(f, 50, 14, EASE.out); // solid neon → dark track
  const sweep = GOAL * ramp(f, 60, 58, SWEEP_EASE);
  const circ = 2 * Math.PI * ringR;
  const headA = -Math.PI / 2 + sweep * 2 * Math.PI;
  const hx = CX + Math.cos(headA) * ringR;
  const hy = CY + Math.sin(headA) * ringR;
  const numIn = ramp(f, 58, 16, EASE.out);
  const dialIn = ramp(f, 56, 30, EASE.out);
  const dialRot = (f - 56) * 0.06;
  const breathe = f > 118 ? 0.5 - 0.5 * Math.cos((f - 118) / 9) : 0;
  const rimO = opened ? (1 - ramp(f, 70, 14, EASE.out)) * ramp(f, 49, 4, EASE.out) : 0;

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden', background: L.bg[2] }}>
      {/* ===== Scene A: shorts-kit weekly output leaderboard (the shared stage is just this one Stage layer; scene B brings its own dark base inside the iris) ===== */}
      <div style={{ position: 'absolute', inset: 0, transformOrigin: `${CX}px ${CY}px`, transform: `scale(${aScale.toFixed(4)})`, filter: away > 0 ? `brightness(${aDim.toFixed(3)})` : undefined }}>
        <Stage look={L} keyLight={{ x: 0.5, y: -0.06 }} fill={{ x: 0.92, y: 0.98 }} intensity={0.7} grain={0} breathe={0.4} />
        {/* Header */}
        <div style={{ position: 'absolute', left: ROW_X, top: 76, width: ROW_W, display: 'flex', alignItems: 'flex-end', opacity: ramp(f, 0, 14, EASE.out) }}>
          <div>
            {/* Brand eyebrow: logo + lowercase wordmark (wordmark not all caps) + small caps label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <ShortKitMark size={34} tone="dark" />
              <span style={{ ...type(TYPE.label + 4, 700), fontFamily: BRAND.font, letterSpacing: '0.03em', color: L.ink }}>{BRAND.name}</span>
              <span style={{ ...type(TYPE.label, 700, { caps: true }), letterSpacing: '0.22em', color: L.accent }}>· Berlin Studio</span>
            </div>
            <div style={{ ...type(TYPE.h2, 760), color: L.ink, marginTop: 12 }}>Week 41</div>
          </div>
          <div style={{ marginLeft: 'auto', ...type(TYPE.small, 500), color: L.ink3, paddingBottom: 10 }}>Shots rendered</div>
        </div>
        {ROWS.map((r, i) => {
          const me = i === ME;
          const p = rowIn(i);
          const dim = me ? 1 : 1 - 0.68 * focus;
          return (
            <div key={r.rank} style={{
              position: 'absolute', left: ROW_X, top: rowTop(i), width: ROW_W, height: ROW_H, boxSizing: 'border-box',
              borderRadius: 22, display: 'flex', alignItems: 'center', padding: '0 40px 0 36px',
              opacity: p * dim, transform: `translateY(${((1 - p) * 26).toFixed(2)}px)`,
              background: me
                ? `linear-gradient(90deg, ${alpha(L.accent, 0.1 + 0.05 * focus)}, ${alpha(L.surface2, 0.9)} 46%)`
                : `linear-gradient(180deg, ${alpha('#ffffff', 0.035)}, ${alpha('#ffffff', 0.018)})`,
              boxShadow: me
                ? `inset 0 0 0 1px ${alpha(L.accent, 0.18 + 0.2 * focus)}, inset 0 1px 0 ${alpha('#ffffff', 0.08)}, 0 30px 60px -30px #000`
                : `inset 0 0 0 1px ${L.line}, inset 0 1px 0 ${alpha('#ffffff', 0.04)}`,
            }}>
              <div style={{ ...type(TYPE.small, 600, { mono: true }), width: 84, color: me ? L.accent : L.ink3 }}>{r.rank}</div>
              {/* Avatar slot: the "You" avatar is drawn separately in the outer layer (pulse / circle match need exact centering) */}
              <div style={{
                width: AV_R * 2, height: AV_R * 2, borderRadius: '50%', flex: 'none',
                background: me ? 'transparent' : `linear-gradient(150deg, #3a3f33, #22261e)`,
                boxShadow: me ? 'none' : `inset 0 0 0 1px ${alpha('#ffffff', 0.08)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                ...type(26, 650), color: L.ink2,
              }}>{me ? null : r.init}</div>
              <div style={{ marginLeft: 28 }}>
                <div style={{ ...type(TYPE.body, me ? 720 : 600), color: L.ink }}>{r.name}</div>
                <div style={{ ...type(26, 450), color: L.ink3, marginTop: 6 }}>{r.sub}</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'baseline', gap: 26 }}>
                <div style={{ ...type(26, 600, { mono: true }), color: r.d.startsWith('−') ? L.ink3 : alpha(L.accent, 0.8) }}>{r.d}</div>
                <div style={{ ...type(TYPE.h3, 720), color: L.ink, width: 170, textAlign: 'right' }}>{r.km}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* The "You" avatar (anchor true circle) + ripple, taken over by the ring once the iris opens */}
      {!opened && (
        <>
          <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {waves.map((w, i) => w.o > 0 && (
              <circle key={i} cx={CX} cy={CY} r={w.r * aScale} fill="none" stroke={L.accent} strokeWidth={w.w} opacity={w.o} />
            ))}
          </svg>
          <div style={{
            position: 'absolute', left: CX - AV_R, top: CY - AV_R, width: AV_R * 2, height: AV_R * 2, borderRadius: '50%',
            opacity: rowIn(ME), transform: `scale(${(avScale * aScale).toFixed(4)})`,
            background: `radial-gradient(circle at 36% 30%, #e6ff86 0%, ${L.accent} 55%, #9fcc12 100%)`,
            boxShadow: `0 0 ${(18 + 40 * (avScale - 1)).toFixed(1)}px ${alpha(L.accent, 0.35 + 1.2 * Math.max(0, avScale - 1))}, inset 0 -3px 6px rgba(40,60,0,0.25)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', ...type(27, 800), color: L.onAccent,
          }}>MK</div>
        </>
      )}

      {/* ===== Scene B: this week's goal ring, pushed open from the same circle center ===== */}
      {opened && (
        <>
          {/* Drop shadow outside the circle: the new scene presses on the old page */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `radial-gradient(circle at ${CX}px ${CY}px, rgba(0,0,0,0) ${irisR.toFixed(1)}px, rgba(0,0,0,0.45) ${(irisR + 1).toFixed(1)}px, rgba(0,0,0,0) ${(irisR + 90).toFixed(1)}px)`,
          }} />
          <div style={{ position: 'absolute', inset: 0, clipPath: `circle(${irisR.toFixed(1)}px at ${CX}px ${CY}px)` }}>
            {/* B base: deeper olive black + neon afterglow lit from the circle center + cool white key light at top right */}
            <div style={{
              position: 'absolute', inset: 0,
              background:
                `radial-gradient(circle at ${CX}px ${CY}px, ${alpha(L.accent, 0.2 + 0.03 * breathe)} 0px, ${alpha(L.accent, 0.06)} 380px, ${alpha(L.accent, 0)} 760px), ` +
                `radial-gradient(ellipse 50% 60% at 78% 14%, ${alpha('#e9f3d4', 0.07)}, rgba(0,0,0,0) 70%), ` +
                `linear-gradient(180deg, #11140d 0%, #0a0c08 55%, #050604 100%)`,
            }} />
            <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
              <defs>
                <linearGradient id="cmi-arc" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f4ffc4" />
                  <stop offset="55%" stopColor={L.accent} />
                  <stop offset="100%" stopColor="#8fbf0c" />
                </linearGradient>
                <radialGradient id="cmi-head">
                  <stop offset="0%" stopColor="#f6ffd0" stopOpacity={0.9} />
                  <stop offset="40%" stopColor={L.accent} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={L.accent} stopOpacity={0} />
                </radialGradient>
              </defs>
              {/* Concentric timer dial (120 ticks, long tick every 10), very slow rotation */}
              <g opacity={dialIn} transform={`rotate(${dialRot.toFixed(3)} ${CX} ${CY})`}>
                {Array.from({ length: 120 }, (_, i) => {
                  const a = (i / 120) * Math.PI * 2;
                  const major = i % 10 === 0;
                  const r0 = RING_R + 46, r1 = r0 + (major ? 26 : 12);
                  return (
                    <line key={i} x1={CX + Math.cos(a) * r0} y1={CY + Math.sin(a) * r0} x2={CX + Math.cos(a) * r1} y2={CY + Math.sin(a) * r1}
                      stroke={major ? alpha(L.ink, 0.45) : alpha(L.ink, 0.16)} strokeWidth={major ? 2.5 : 1.5} />
                  );
                })}
              </g>
              <circle cx={CX} cy={CY} r={RING_R - RING_W / 2 - 22} fill="none" stroke={alpha(L.ink, 0.06 * dialIn)} strokeWidth={1.5} />
              {/* Dark track: at the moment the iris opens it is still the solid neon avatar, then recedes into a dark track */}
              <circle cx={CX} cy={CY} r={ringR} fill="none" strokeWidth={ringW}
                stroke={discToTrack < 1 ? `rgba(${mix(198, 40, discToTrack).toFixed(0)},${mix(244, 48, discToTrack).toFixed(0)},${mix(50, 28, discToTrack).toFixed(0)},1)` : '#283018'} />
              {/* sweep arc: starts at 12 o'clock */}
              {sweep > 0.002 && (
                <circle cx={CX} cy={CY} r={ringR} fill="none" stroke="url(#cmi-arc)" strokeWidth={ringW} strokeLinecap="round"
                  strokeDasharray={`${(sweep * circ).toFixed(2)} ${circ.toFixed(2)}`} transform={`rotate(-90 ${CX} ${CY})`}
                  style={{ filter: `drop-shadow(0 0 ${(14 + 8 * breathe).toFixed(1)}px ${alpha(L.accent, 0.45)})` }} />
              )}
              {sweep > 0.01 && <circle cx={hx} cy={hy} r={RING_W * 1.25} fill="url(#cmi-head)" />}
            </svg>
            {/* Center number: counts with the sweep */}
            <div style={{
              position: 'absolute', left: CX - 240, top: CY - 130, width: 480, height: 260, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', opacity: numIn, transform: `scale(${mix(0.86, 1, ramp(f, 58, 22, EASE.snappy)).toFixed(4)})`,
            }}>
              <div style={{ ...type(200, 760), color: L.ink, display: 'flex', alignItems: 'baseline' }}>
                {Math.round(sweep * 100)}
                <span style={{ ...type(TYPE.h3, 650), color: L.accent, marginLeft: -2 }}>%</span>
              </div>
              <div style={{ ...type(TYPE.small, 500), color: L.ink2, marginTop: 8 }}>of 54-shot goal</div>
            </div>
            {/* Right side: title + data */}
            <div style={{ position: 'absolute', left: 1010, top: 262, width: 820 }}>
              <div style={{ ...type(TYPE.label, 700, { caps: true }), letterSpacing: '0.22em', color: L.accent, opacity: ramp(f, 72, 14, EASE.out) }}>
                Your week · Mara K.
              </div>
              <div style={{ ...type(TYPE.h1, 780), color: L.ink, marginTop: 22 }}>
                <TextReveal text="Almost there." by="word" variant="rise" start={76} each={20} gap={5} />
              </div>
              <div style={{ ...type(TYPE.body, 450), color: L.ink2, marginTop: 26, opacity: ramp(f, 86, 18, EASE.out), transform: `translateY(${((1 - ramp(f, 86, 18, EASE.snappy)) * 14).toFixed(2)}px)` }}>
                7 shots left — one more render.
              </div>
              <div style={{ display: 'flex', gap: 56, marginTop: 64 }}>
                {STATS.map((s, i) => {
                  const p = ramp(f, 92 + stagger(i, 3, 10, EASE.out), 18, EASE.snappy);
                  return (
                    <div key={s.k} style={{ opacity: p, transform: `translateY(${((1 - p) * 22).toFixed(2)}px)` }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ ...type(TYPE.h3, 720), color: L.ink }}>{s.v}</span>
                        <span style={{ ...type(28, 500), color: L.ink3 }}>{s.u}</span>
                      </div>
                      <div style={{ height: 1, background: L.line, margin: '14px 0 12px', width: '100%' }} />
                      <div style={{ ...type(26, 500), color: L.ink2 }}>{s.k}</div>
                    </div>
                  );
                })}
              </div>
              {/* Narrative close: callback to scene A's ranking */}
              <div style={{
                marginTop: 56, display: 'inline-flex', alignItems: 'center', gap: 16, padding: '16px 26px', borderRadius: 999,
                background: alpha(L.accent, 0.1), boxShadow: `inset 0 0 0 1px ${alpha(L.accent, 0.28)}`,
                opacity: ramp(f, 108, 16, EASE.out), transform: `translateY(${((1 - ramp(f, 108, 16, EASE.snappy)) * 16).toFixed(2)}px)`,
              }}>
                <svg width={22} height={22} viewBox="0 0 22 22"><path d="M11 3 19 15H3z" fill={L.accent} /></svg>
                <span style={{ ...type(TYPE.small, 600), color: L.ink }}>6 shots to pass Aiko for <span style={{ color: L.accent }}>#2</span></span>
              </div>
            </div>
          </div>
          {/* Iris edge light ring (only in the early part of the iris opening) */}
          {rimO > 0.01 && (
            <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <circle cx={CX} cy={CY} r={irisR} fill="none" stroke={L.accent} strokeWidth={2} opacity={0.7 * rimO}
                style={{ filter: `drop-shadow(0 0 10px ${alpha(L.accent, 0.6)})` }} />
            </svg>
          )}
        </>
      )}
      <Grain opacity={0.08} blend="soft-light" />
    </div>
  );
};
