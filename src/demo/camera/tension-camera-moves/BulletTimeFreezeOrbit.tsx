// bullet-time-freeze-orbit: The Matrix bullet time: time stops, yet the camera moves.
//
// Second redesign (midnight · deep blue night + electric blue):
// - the subject is a glass data panel (1180×640) hanging in the dark field: 7 bars grow in a weekly stagger, and from each bar top a string of
//   "data sparks" shoots upward (deterministic particles ×140, with real z depth -300…+600px), and a 120px six-digit odometer counter at upper right races along.
// - two clocks (the crux): all content uses eff (the content clock), the camera uses the real frame. eff doesn't hard-stop, it uses an 8f speed ramp
//   to "slam the brakes" into the freeze (40–48f), freezes for 52 frames, then an 8f ramp recovers (100–108f), like the speed change of high-speed photography.
//   During the freeze: the bars stop in a mid-way wave shape, sparks hang in mid-air and keep their trails (trail length is computed from the content clock's speed, so what is frozen is
//   "a moment in motion" rather than a still image), and the rolling blur of the counter's low digits is frozen too.
// - orbit: a real 3D scene (preserve-3d): the panel, sparks, perspective grid floor and distant dot-matrix wall each sit at their own depth.
//   Camera rotateY 0→-52° (26f, smooth) → slow drift at the apex 12f → back to 0 (22f, swift), while rotateX lifts 6° and
//   pushes in 160px. The parallax between sparks and panel, and between floor and back wall, makes it clear that "the camera is orbiting".
// - recovery: bars finish growing, sparks disperse, value labels above the bars pop out one by one; the hero bar (Sunday) is electric blue + bloom, the rest slate blue.
//
// Timeline (30fps, 170f total):
//   0–40    normal time: bars grow in a stagger (each 5f later), sparks shoot up, counter sprints
//   40–48   speed ramp braking (eff speed 1→0)
//   48–100  freeze: camera orbits to -52° over 46–72, apex slow drift 72–84, returns to center 84–106 (push in / lift in sync)
//   100–108 speed ramp recovery
//   108–140 aftermath: bars finish growing, sparks disperse, value labels pop out (driven by eff)
//   140–170 hold: very slow breathing of light, poster settles
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, FONT, mix, ramp } from '../../../shared/fixtures/Polish';
import { LOOKS, Stage, alpha, springAt, type } from '../../../shared/fixtures/Look';
import { ShortKitMark } from '../../../shared/fixtures/Brand';

export const BULLET_TIME_FREEZE_ORBIT_DURATION = 170;

const L = LOOKS.midnight;
const PANEL = { w: 1180, h: 640 };
const CH = { x: 90, y: 250, w: 1000, h: 300 }; // chart area (panel coordinates)
const BARS = [0.46, 0.58, 0.52, 0.7, 0.64, 0.82, 1.0];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const BAR_W = 96;
const BAR_GAP = (CH.w - BARS.length * BAR_W) / (BARS.length - 1);
const GROW = 40; // growth duration of each bar (content clock)
const startOf = (i: number) => 2 + i * 5; // at freeze (eff≈40) the bar tops are exactly a high-to-low wave
const TOTAL = 184920;

const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// - content clock: speed ramps in and out of the freeze -
const speedAt = (f: number) =>
  f < 40 ? 1 : f < 48 ? 1 - EASE.smooth((f - 40) / 8) : f < 100 ? 0 : f < 108 ? EASE.smooth((f - 100) / 8) : 1;
const EFF: number[] = (() => {
  const out = [0];
  let e = 0;
  for (let f = 0; f < 200; f++) {
    for (let s = 0; s < 4; s++) e += speedAt(f + (s + 0.5) / 4) / 4;
    out.push(e);
  }
  return out;
})();
const effAt = (f: number) => {
  const i = Math.max(0, Math.min(EFF.length - 2, Math.floor(f)));
  return mix(EFF[i], EFF[i + 1], f - i);
};

const growth = (i: number, e: number) => ramp(e, startOf(i), GROW, EASE.swift);
const barTop = (i: number, e: number) => CH.y + CH.h - CH.h * BARS[i] * growth(i, e); // y inside the panel
const barCx = (i: number) => CH.x + i * (BAR_W + BAR_GAP) + BAR_W / 2;

// - sparks: 12 per bar, born at the bar top (the bar top at the moment of birth), fly upward decelerating, with z depth -
const SPARKS = BARS.flatMap((_, i) =>
  Array.from({ length: 20 }, (_, k) => {
    const r = (n: number) => hash(i * 97.1 + k * 13.7 + n);
    return {
      bar: i, born: startOf(i) + 1 + k * 1.9 + r(1) * 2,
      dx: (r(2) - 0.5) * BAR_W * 1.1, vx: (r(3) - 0.5) * 5,
      v0: 12 + r(4) * 14, tau: 8 + r(5) * 9, z: (r(6) - 0.35) * 900,
      size: 4 + r(7) * 7, life: 30 + r(8) * 22, hot: r(9) < 0.35,
    };
  }),
);

// - odometer counter: one digit strip per digit, vertically blurred by the content clock's rotation speed -
const valueAt = (e: number) => TOTAL * ramp(e, 4, 68, EASE.out);
const digitPos = (v: number, k: number) => {
  const p10 = Math.pow(10, k);
  if (k === 0) return v % 10;
  const d = Math.floor(v / p10) % 10;
  const lower = v % p10;
  return d + Math.min(1, Math.max(0, lower - (p10 - 1)));
};
const STRIP = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

const Odometer: React.FC<{ e: number }> = ({ e }) => {
  const v = valueAt(e);
  const v2 = valueAt(e + 0.5);
  const v1 = valueAt(e - 0.5);
  const cols = 6;
  return (
    <div style={{ display: 'flex', ...type(112, 700), letterSpacing: 0, color: L.ink, lineHeight: 1 }}>
      {Array.from({ length: cols }, (_, ci) => {
        const k = cols - 1 - ci;
        const pos = digitPos(v, k);
        const speed = Math.abs(digitPos(v2, k) - digitPos(v1, k));
        const sp = speed > 5 ? 10 - speed : speed; // correction when wrapping 9→0
        const blur = Math.min(9, sp * 112 * 0.1);
        const lit = v >= Math.pow(10, k) || k === 0;
        return (
          <React.Fragment key={ci}>
            {ci === 3 && <span style={{ width: '0.28em', textAlign: 'center', color: lit ? L.ink2 : L.ink3 }}>,</span>}
            <div style={{
              position: 'relative', width: '0.62em', height: '1.24em', margin: '-0.12em 0', overflow: 'hidden',
              // odometer window fades at top and bottom: the frozen blurred digit strip leaves no hard edge
              WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 16%, #000 84%, transparent 100%)',
              maskImage: 'linear-gradient(180deg, transparent 0%, #000 16%, #000 84%, transparent 100%)',
            }}>
              <div style={{
                position: 'absolute', left: 0, top: '0.12em', width: '100%', transform: `translateY(${(-pos).toFixed(4)}em)`,
                filter: blur > 0.3 ? `blur(${(blur * 0.35).toFixed(2)}px)` : undefined,
                color: lit ? L.ink : L.ink3,
              }}>
                {STRIP.map((c, i) => (
                  <div key={i} style={{ height: '1em', textAlign: 'center', opacity: blur > 0.3 ? 1 - Math.min(0.45, blur / 30) : 1 }}>{c}</div>
                ))}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const BulletTimeFreezeOrbit: React.FC = () => {
  const frame = useCurrentFrame();
  const e = effAt(frame);
  const frozen = 1 - speedAt(frame);

  // - camera (real clock) -
  const out = ramp(frame, 46, 26, EASE.smooth);
  const back = ramp(frame, 84, 22, EASE.swift);
  const drift = ramp(frame, 72, 12, EASE.linear);
  const orbit = out * (1 - back); // 0→1→0
  const ry = -52 * out * (1 - back) - 3 * drift * (1 - back);
  const rx = -3 - 6 * orbit;
  const dolly = 160 * orbit;
  const breathe = 1 + 0.05 * Math.sin(frame / 26);

  // air at freeze: cool light brightens slightly, surroundings tighten
  const chill = ramp(frame, 40, 10, EASE.out) * (1 - ramp(frame, 98, 12, EASE.smooth));

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: FONT.sans }}>
      <Stage look={L} keyLight={{ x: 0.5, y: 0.04 }} fill={{ x: 0.5, y: 1.0 }} breathe={0.5} intensity={1 + 0.25 * chill} />

      <AbsoluteFill style={{ perspective: 1800, perspectiveOrigin: '50% 46%' }}>
        <div style={{
          position: 'absolute', left: 960, top: 520, width: 0, height: 0, transformStyle: 'preserve-3d',
          transform: `translateZ(${dolly.toFixed(2)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`,
        }}>
          {/* distant dot-matrix wall */}
          <div style={{
            position: 'absolute', left: -2600, top: -1500, width: 5200, height: 3000,
            transform: 'translateZ(-1200px)',
            backgroundImage: `radial-gradient(circle at 3px 3px, ${alpha(L.accent, 0.35)} 2px, transparent 3px)`,
            backgroundSize: '64px 64px',
            WebkitMaskImage: 'radial-gradient(ellipse 40% 42% at 50% 50%, #000 0%, transparent 100%)',
            maskImage: 'radial-gradient(ellipse 40% 42% at 50% 50%, #000 0%, transparent 100%)',
            opacity: 0.55,
          }} />
          {/* perspective grid floor (70px below the panel's lower edge) */}
          <div style={{
            position: 'absolute', left: -1800, top: PANEL.h / 2 + 70 - 1800, width: 3600, height: 3600,
            transform: 'rotateX(90deg)',
            backgroundImage:
              `radial-gradient(ellipse 22% 14% at 50% 50%, ${alpha(L.accent, 0.32)} 0%, transparent 100%),` +
              `linear-gradient(${alpha(L.accent, 0.22)} 2px, transparent 2px), linear-gradient(90deg, ${alpha(L.accent, 0.22)} 2px, transparent 2px)`,
            backgroundSize: '100% 100%, 120px 120px, 120px 120px',
            backgroundPosition: '0 0, -1px -1px, -1px -1px',
            WebkitMaskImage: 'radial-gradient(circle at 50% 50%, #000 0%, transparent 46%)',
            maskImage: 'radial-gradient(circle at 50% 50%, #000 0%, transparent 46%)',
          }} />

          {/* panel */}
          <div style={{
            position: 'absolute', left: -PANEL.w / 2, top: -PANEL.h / 2, width: PANEL.w, height: PANEL.h, boxSizing: 'border-box',
            borderRadius: 32, overflow: 'hidden',
            background: `linear-gradient(180deg, ${alpha('#1a2440', 0.94)} 0%, ${alpha(L.surface, 0.96)} 100%)`,
            border: `1.5px solid ${alpha('#a0beff', 0.18)}`,
            boxShadow: `inset 0 1.5px 0 ${alpha('#ffffff', 0.12)}, 0 50px 120px -30px ${alpha('#000208', 0.9)}`,
          }}>
            {/* header: shorts-kit render panel (logo + eyebrow + metric name) */}
            <div style={{ position: 'absolute', left: 64, top: 52 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ShortKitMark size={40} tone="dark" style={{ margin: '-6px -2px -6px -5px' }} />
                <div style={{ ...type(26, 650, { caps: true }), letterSpacing: '0.2em', color: L.accent }}>Render farm · promo</div>
              </div>
              <div style={{ ...type(52, 700), color: L.ink, marginTop: 14 }}>Frames rendered</div>
            </div>
            <div style={{ position: 'absolute', right: 64, top: 46 }}><Odometer e={e} /></div>

          {/* tick lines */}
            {[0, 1, 2, 3].map((g) => (
              <div key={g} style={{ position: 'absolute', left: CH.x, width: CH.w, top: CH.y + (CH.h / 3) * g, height: 1, background: g === 3 ? alpha(L.ink, 0.25) : L.line }} />
            ))}
            {/* bars */}
            {BARS.map((b, i) => {
              const top = barTop(i, e);
              const hgt = CH.y + CH.h - top;
              const hero = i === BARS.length - 1;
              const lk = springAt(e, startOf(i) + GROW - 2, { damping: 15, stiffness: 200 });
              return (
                <React.Fragment key={i}>
                  <div style={{
                    position: 'absolute', left: barCx(i) - BAR_W / 2, top, width: BAR_W, height: hgt, borderRadius: '14px 14px 4px 4px',
                    background: hero
                      ? `linear-gradient(180deg, #8fb0ff 0%, ${L.accent} 30%, #2f55d8 100%)`
                      : `linear-gradient(180deg, #3a4b74 0%, #253252 100%)`,
                    boxShadow: hero
                      ? `inset 0 2px 0 rgba(255,255,255,0.5), 0 0 40px ${alpha(L.accent, 0.55)}`
                      : `inset 0 2px 0 rgba(255,255,255,0.18)`,
                  }} />
                  {/* bar-top bright edge (the "knife edge" while growing) */}
                  {growth(i, e) < 1 && growth(i, e) > 0 && (
                    <div style={{ position: 'absolute', left: barCx(i) - BAR_W / 2 - 6, top: top - 3, width: BAR_W + 12, height: 6, borderRadius: 3, background: '#dfe8ff', boxShadow: `0 0 18px ${alpha(L.accent, 0.9)}` }} />
                  )}
                  <div style={{
                    position: 'absolute', left: barCx(i) - 80, width: 160, top: CH.y + CH.h - CH.h * b - 54, textAlign: 'center',
                    ...type(36, 700), color: hero ? '#bcd0ff' : L.ink2, opacity: Math.min(1, lk * 1.4),
                    transform: `translateY(${((1 - lk) * 14).toFixed(2)}px) scale(${(0.8 + 0.2 * lk).toFixed(3)})`,
                  }}>
                    {Math.round(b * 31.4)}k
                  </div>
                  <div style={{ position: 'absolute', left: barCx(i) - 80, width: 160, top: CH.y + CH.h + 18, textAlign: 'center', ...type(26, 550), color: hero ? L.ink : L.ink3 }}>
                    {DAYS[i]}
                  </div>
                </React.Fragment>
              );
            })}
            {/* cool light on the panel surface at freeze (clipped to rounded corners, shifts sideways with the camera angle) */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5 * orbit,
              background: `linear-gradient(105deg, transparent ${(30 + 50 * orbit).toFixed(1)}%, ${alpha('#cfdcff', 0.16)} ${(45 + 50 * orbit).toFixed(1)}%, transparent ${(60 + 50 * orbit).toFixed(1)}%)`,
            }} />
          </div>

          {/* sparks (real z depth, hover at freeze and keep trails) */}
          {SPARKS.map((s, idx) => {
            const age = e - s.born;
            if (age < 0 || age > s.life) return null;
            const birthTop = barTop(s.bar, s.born);
            const k = 1 - Math.exp(-age / s.tau);
            const x = barCx(s.bar) + s.dx + s.vx * age - PANEL.w / 2;
            const y = birthTop - s.v0 * s.tau * k - PANEL.h / 2;
            const z = s.z * k;
            const v = s.v0 * Math.exp(-age / s.tau); // velocity under the content clock
            const len = s.size + v * 3.2;
            const fade = Math.min(1, age / 3) * (1 - Math.pow(age / s.life, 2));
            const c = s.hot ? '#ffffff' : '#9cb8ff';
            return (
              <div key={idx} style={{
                position: 'absolute', left: x - s.size / 2, top: y, width: s.size, height: len, borderRadius: s.size,
                transform: `translateZ(${z.toFixed(1)}px)`,
                background: `linear-gradient(180deg, ${c} 0%, ${alpha(c, 0)} 100%)`,
                boxShadow: `0 0 ${(s.size * 2).toFixed(1)}px ${alpha(L.accent, 0.8)}`,
                opacity: fade * (0.85 + 0.15 * breathe),
              }} />
            );
          })}
        </div>
      </AbsoluteFill>

      {/* vignette tightens during the freeze (screen space) */}
      {frozen > 0.001 || chill > 0.001 ? (
        <AbsoluteFill style={{
          pointerEvents: 'none', opacity: chill,
          background: `radial-gradient(ellipse 64% 64% at 50% 48%, ${alpha('#050a1c', 0)} 50%, ${alpha('#050a1c', 0.55)} 100%)`,
        }} />
      ) : null}
    </AbsoluteFill>
  );
};
