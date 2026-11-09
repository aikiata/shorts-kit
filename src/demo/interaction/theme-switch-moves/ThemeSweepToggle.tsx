// theme-sweep-toggle: light/dark mode sweep (second redesign: shorts-kit launch-week schedule · day → night)
//
// Design decisions:
// - subject: shorts-kit's weekly production schedule (brand pass: replaces the fictional calendar Solstice, layout unchanged pixel for pixel): a 1680×912 floating window,
//   large type hierarchy: 64px week title, 40px date numbers, 28px event titles; 5 columns with 13 production items (storyboard → live shoot → beat marking → sound effects → render),
//   4 calendar colors, one red "now" line. The top-bar logo = the "shorts-kit" ShortKitMark (a bright / reversed-white version for day and night).
// - look = custom (sand's day face + a custom night face): day = warm ivory stage + window-pane sunlight slanting in from the upper left;
//   night = ink-blue stage + moonlight from the upper right + star points. The theme switch doesn't just change the UI skin, it changes the stage's "hour" with it,
//   but the two layouts are pixel-identical (the same <World> component, only the palette swapped), reading as "the same UI re-skinned in place".
// - cause and effect: the opening shot is close to the big day/night toggle in the top bar (zoom 2.0), the pointer presses → the knob springs to the right, the sun retracts its rays
//   and grows a crescent → the night boundary immediately sweeps across the whole frame at a 15° slant **from the toggle's side** (right→left), while the camera pulls out to the full view,
//   so the viewer follows from "where was pressed" all the way to "the whole world falls into night".
// - the boundary = a terminator: a 2px white-hot core line + on the bright side a sunset-orange twilight band whose width varies with speed + a cool blue glow on the night side + a soft shadow on the bright side.
// - aftermath "lights on": after the sweep, today's date capsule, the now line and the window's cool rim light come on in turn (light that exists only at night).
//
// Timeline (30fps, 140f total):
//   0–8     wind-up: close-up of the toggle (zoom 2.0, very slow push 2.0→2.04), pointer slides onto the toggle
//   8–18    press: pointer presses to 0.86, knob springs to the right (damping 16, one overshoot), sun → crescent; the pointer then steps away
//   14–78   main action: the night slanted edge sweeps from right to left (64f, bezier(.3,0,.35,1)), passes the toggle at ~24f;
//           10–40 camera pulls out to the full view (EASE.smooth), the terminator crosses the frame midline at ~40–50f = the poster frame with day and night on one screen
//   76–96   aftermath: lights on: today capsule / now line / window cool rim light come on in a stagger (EASE.out)
//   96–140  hold: night scene frozen, camera 1.0→1.02 very slow push, stars twinkle slightly
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, FONT, Grain, bezier, mix, ramp, velocity } from '../../../shared/fixtures/Polish';
import { alpha, springAt } from '../../../shared/fixtures/Look';
import { BRAND, ShortKitMark } from '../../../shared/fixtures/Brand';

export const THEME_SWEEP_TOGGLE_DURATION = 140;

// ───────────── timeline ─────────────
const PTR_IN = 0;
const CLICK = 8; // pointer press = knob takes off
const SWEEP0 = 14; // night boundary starts sweeping (the knob is still overshooting and settling, actions overlap)
const SWEEP1 = 78;
const CAM0 = 10; // camera starts pulling out
const CAM1 = 40; // full view arrives first; the terminator crosses the frame midline only at ~44–50f (poster frame with day and night on one screen)
const LIGHTS = 76; // lights-on aftermath start

// ───────────── world geometry (1920×1080 world coordinates, the camera dollies on top of it) ─────────────
const WIN = { x: 120, y: 84, w: 1680, h: 912, r: 28 };
const TOP_H = 92;
const HEAD_H = 112;
const DAYS_H = 80;
const GUT = 104; // time scale column
const COL_W = (WIN.w - GUT - 36) / 5;
const H0 = 9; // starts at 9:00
const H1 = 16; // ends at 16:00
const HOUR = (WIN.h - TOP_H - HEAD_H - DAYS_H - 24) / (H1 - H0);
const GRID_Y = TOP_H + HEAD_H + DAYS_H; // inside-window coordinates
const TOG = { w: 132, h: 66 }; // toggle
const TOG_X = WIN.w - 40 - TOG.w; // inside window
const TOG_Y = (TOP_H - TOG.h) / 2;
const TOG_C = { x: WIN.x + TOG_X + TOG.w / 2, y: WIN.y + TOG_Y + TOG.h / 2 }; // world coordinates
const T15 = Math.tan((15 * Math.PI) / 180);

// ───────────── two themes (same layout, palette mapped by hand key by key, no filter inversion) ─────────────
type Hue = 'blue' | 'green' | 'amber' | 'rose';
type Theme = {
  night: boolean;
  bg: [string, string, string];
  key: { x: number; y: number; c: string; a: number };
  win: string; win2: string; line: string; ink: string; ink2: string; ink3: string;
  accent: string; shadow: string; seg: string;
  track: string; trackOn: string; knob: string;
  ev: Record<Hue, { fill: string; bar: string; text: string; sub: string }>;
};

const DAY: Theme = {
  night: false,
  bg: ['#f4ede1', '#ece2d2', '#e0d3bf'],
  key: { x: 0.18, y: 0.0, c: '#fff8ea', a: 0.95 },
  win: '#fdfaf4', win2: '#f6f0e6', line: 'rgba(70,48,24,0.10)', ink: '#1f1a13', ink2: '#6b5f50', ink3: '#a49784',
  accent: '#e0552a', shadow: '#4a2f12', seg: '#efe7da',
  track: '#ece2d2', trackOn: '#2b3048', knob: '#ffffff',
  ev: {
    blue: { fill: '#e7eefb', bar: '#3d72de', text: '#1a3670', sub: '#5774a8' },
    green: { fill: '#e3f1e6', bar: '#2f9a5c', text: '#184d31', sub: '#4f7f62' },
    amber: { fill: '#fbeedb', bar: '#d98a1c', text: '#6a400f', sub: '#9b6c34' },
    rose: { fill: '#fbe6e7', bar: '#d6455c', text: '#76202e', sub: '#a5525f' },
  },
};

const NIGHT: Theme = {
  night: true,
  bg: ['#0e1426', '#090d1a', '#05070f'],
  key: { x: 0.86, y: 0.02, c: '#5b74c9', a: 0.4 },
  win: '#11151f', win2: '#161b28', line: 'rgba(170,190,240,0.10)', ink: '#eef1fa', ink2: '#9aa3ba', ink3: '#5f6882',
  accent: '#ff9450', shadow: '#000207', seg: '#1a2030',
  track: '#262c40', trackOn: '#262c40', knob: '#f4efe4',
  ev: {
    blue: { fill: 'rgba(96,140,255,0.15)', bar: '#6f9cff', text: '#dfe7ff', sub: '#8ea4d6' },
    green: { fill: 'rgba(72,205,135,0.13)', bar: '#52d38e', text: '#d8f5e5', sub: '#84b89b' },
    amber: { fill: 'rgba(255,172,72,0.14)', bar: '#ffb24c', text: '#ffeacf', sub: '#c9a479' },
    rose: { fill: 'rgba(255,104,134,0.14)', bar: '#ff718c', text: '#ffdee5', sub: '#c98b97' },
  },
};

const DAYS = [
  { d: 'MON', n: 14 },
  { d: 'TUE', n: 15 },
  { d: 'WED', n: 16 },
  { d: 'THU', n: 17 },
  { d: 'FRI', n: 18 },
];
const TODAY = 2;
const NOW = 13 + 40 / 60; // 13:40

const EVENTS: { day: number; s: number; e: number; t: string; hue: Hue }[] = [
  { day: 0, s: 9.5, e: 10.75, t: 'Storyboard crit', hue: 'rose' },
  { day: 0, s: 12.5, e: 14.5, t: 'Shot list review', hue: 'blue' },
  { day: 1, s: 9, e: 10, t: 'Standup', hue: 'amber' },
  { day: 1, s: 10.75, e: 12.5, t: 'Page captures', hue: 'green' },
  { day: 1, s: 14, e: 15.25, t: 'Voiceover · Theo', hue: 'amber' },
  { day: 2, s: 9.25, e: 10.5, t: 'Launch sync', hue: 'blue' },
  { day: 2, s: 11, e: 12.75, t: 'Camera moves', hue: 'green' },
  { day: 2, s: 14.25, e: 15.75, t: 'Beat-sync pass', hue: 'rose' },
  { day: 3, s: 9.5, e: 11.25, t: 'SFX design', hue: 'amber' },
  { day: 3, s: 12.5, e: 13.5, t: 'Lunch & learn', hue: 'green' },
  { day: 3, s: 14.75, e: 16, t: 'Render review', hue: 'blue' },
  { day: 4, s: 10, e: 12.5, t: 'Final render', hue: 'green' },
  { day: 4, s: 13.5, e: 14.75, t: 'Ship the film', hue: 'rose' },
];

const fmt = (h: number) => {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  const h12 = hh > 12 ? hh - 12 : hh;
  return `${h12}:${String(mm).padStart(2, '0')}`;
};

// deterministic hash (star points)
const hash = (n: number) => {
  const x = Math.sin(n * 91.345 + 47.853) * 43758.5453;
  return x - Math.floor(x);
};

// ───────────── day → moon icon (sun retracts its rays, a mask circle slides in to grow a crescent) ─────────────
const SunMoon: React.FC<{ p: number; color: string; size: number }> = ({ p, color, size }) => {
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const rays = 1 - EASE.out(Math.min(1, p * 1.6));
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <mask id={`m${id}`}>
          <rect x={-10} y={-10} width={60} height={60} fill="#fff" />
          <circle cx={mix(44, 27, EASE.snappy(p))} cy={mix(-4, 13, EASE.snappy(p))} r={10.5} fill="#000" />
        </mask>
      </defs>
      <g transform={`rotate(${(p * 90).toFixed(2)} 20 20)`}>
        {Array.from({ length: 8 }, (_, i) => (
          <line key={i} x1={20} y1={4.5 - (1 - rays) * 4} x2={20} y2={8.5 - (1 - rays) * 6}
            stroke={color} strokeWidth={3} strokeLinecap="round" opacity={rays}
            transform={`rotate(${i * 45} 20 20)`} />
        ))}
      </g>
      <circle cx={20} cy={20} r={mix(7.5, 11, EASE.out(p))} fill={color} mask={`url(#m${id})`} />
    </svg>
  );
};

// ───────────── the whole world (stage + window), both themes share this one layout ─────────────
const World: React.FC<{ th: Theme; knob: number; icon: number; lights: number; frame: number }> = ({ th, knob, icon, lights, frame }) => {
  const n = th.night;
  const [t, m, b] = th.bg;
  const todayLit = n ? EASE.out(Math.min(1, Math.max(0, lights * 2.2))) : 0;
  const nowLit = n ? EASE.out(Math.min(1, Math.max(0, lights * 2.2 - 0.5))) : 0;
  const rimLit = n ? EASE.out(Math.min(1, Math.max(0, lights * 2.2 - 1))) : 0;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* stage: extended 260px outward, so the upper right also has a base in the close-up */}
      <div style={{ position: 'absolute', left: -260, top: -260, right: -260, bottom: -260, background: `linear-gradient(180deg, ${t} 0%, ${m} 55%, ${b} 100%)` }} />
      <div style={{
        position: 'absolute', left: -260, top: -260, right: -260, bottom: -260,
        background: `radial-gradient(ellipse 60% 64% at ${th.key.x * 100}% ${th.key.y * 100}%, ${alpha(th.key.c, th.key.a)} 0%, ${alpha(th.key.c, 0)} 72%)`,
        mixBlendMode: n ? 'screen' : 'normal',
      }} />
      {!n && (
        // day: window-pane light slanting in from the upper left (three warm-white light shafts, very faint)
        <div style={{ position: 'absolute', inset: -260, overflow: 'hidden' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              position: 'absolute', left: 120 + i * 300, top: -300, width: 150, height: 2200,
              transform: 'rotate(-32deg)', transformOrigin: '0 0',
              background: 'linear-gradient(90deg, rgba(255,250,236,0) 0%, rgba(255,250,236,0.55) 50%, rgba(255,250,236,0) 100%)',
              opacity: 0.55 - i * 0.12,
            }} />
          ))}
        </div>
      )}
      {n && (
        // night: star points (the sky outside the window), deterministic slight twinkle
        <div style={{ position: 'absolute', inset: -260 }}>
          {Array.from({ length: 70 }, (_, i) => {
            const x = hash(i * 3.1) * 2440;
            const y = hash(i * 7.7 + 2) * 1600;
            const z = hash(i * 1.9 + 5);
            const tw = 0.55 + 0.45 * Math.sin(frame / (9 + z * 14) + i * 1.7);
            const s = 1.4 + z * 2.4;
            return <div key={i} style={{ position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: '#dfe6ff', opacity: (0.25 + 0.6 * z) * tw, boxShadow: z > 0.75 ? '0 0 6px rgba(190,205,255,0.8)' : undefined }} />;
          })}
        </div>
      )}
      {/* ground light / shadow of the window resting on the "desktop" */}
      <div style={{
        position: 'absolute', left: WIN.x + 80, top: WIN.y + WIN.h - 40, width: WIN.w - 160, height: 140,
        background: n
          ? 'radial-gradient(ellipse 50% 50% at 50% 30%, rgba(90,120,220,0.20) 0%, rgba(90,120,220,0) 70%)'
          : 'radial-gradient(ellipse 50% 50% at 50% 30%, rgba(74,47,18,0.16) 0%, rgba(74,47,18,0) 70%)',
        filter: 'blur(14px)',
      }} />

      {/* window */}
      <div style={{
        position: 'absolute', left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, borderRadius: WIN.r, overflow: 'hidden',
        background: th.win, fontFamily: FONT.sans, color: th.ink,
        boxShadow: n
          ? `inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 1px rgba(150,175,255,${(0.1 + 0.18 * rimLit).toFixed(3)}), 0 0 ${(60 * rimLit).toFixed(1)}px rgba(90,125,255,${(0.22 * rimLit).toFixed(3)}), 0 40px 90px -20px rgba(0,2,7,0.9), 0 12px 30px rgba(0,2,7,0.6)`
          : `inset 0 1px 0 rgba(255,255,255,0.9), 0 0 0 1px rgba(70,48,24,0.08), 0 40px 90px -24px rgba(74,47,18,0.32), 0 10px 26px -6px rgba(74,47,18,0.16)`,
      }}>
        {/* top bar */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: WIN.w, height: TOP_H, borderBottom: `1px solid ${th.line}`, display: 'flex', alignItems: 'center', padding: '0 40px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* "shorts-kit" logo: ink frame by day, reversed white frame by night, amber slant unchanged (the logo itself gets no base block / glow) */}
            <ShortKitMark size={44} tone={n ? 'dark' : 'light'} />
            <span style={{ fontFamily: BRAND.font, fontSize: 32, fontWeight: 700, letterSpacing: '0.03em' }}>{BRAND.name}</span>
          </div>
          <div style={{ marginLeft: 72, display: 'flex', gap: 4, padding: 5, borderRadius: 14, background: th.seg }}>
            {['Day', 'Week', 'Month'].map((s, i) => (
              <div key={s} style={{
                padding: '9px 22px', borderRadius: 10, fontSize: 24, fontWeight: i === 1 ? 650 : 500,
                color: i === 1 ? th.ink : th.ink2,
                background: i === 1 ? (n ? '#262d40' : '#ffffff') : 'transparent',
                boxShadow: i === 1 ? (n ? 'inset 0 1px 0 rgba(255,255,255,0.06)' : '0 1px 2px rgba(74,47,18,0.12), 0 2px 8px -2px rgba(74,47,18,0.12)') : 'none',
              }}>{s}</div>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', marginRight: TOG.w + 28, fontSize: 24, color: th.ink2, fontWeight: 500 }}>Today</div>
        </div>
        {/* day/night toggle */}
        <div style={{
          position: 'absolute', left: TOG_X, top: TOG_Y, width: TOG.w, height: TOG.h, borderRadius: TOG.h / 2,
          background: n ? th.track : `linear-gradient(90deg, ${th.trackOn} 0%, ${th.trackOn} ${(knob * 100).toFixed(1)}%, ${th.track} ${(knob * 100).toFixed(1)}%)`,
          boxShadow: n ? 'inset 0 2px 4px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.06)' : 'inset 0 2px 4px rgba(74,47,18,0.16), inset 0 0 0 1px rgba(74,47,18,0.06)',
          overflow: 'hidden',
        }}>
          {/* little stars in the track (appear when switched to night) */}
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ position: 'absolute', left: 18 + i * 13, top: 18 + (i % 2) * 18, width: 4, height: 4, borderRadius: 2, background: '#e8edff', opacity: Math.min(1, Math.max(0, knob * 1.4 - 0.3)) * (0.5 + 0.2 * i) }} />
          ))}
          <div style={{
            position: 'absolute', top: 6, left: 6 + knob * (TOG.w - TOG.h), width: TOG.h - 12, height: TOG.h - 12, borderRadius: '50%',
            background: `linear-gradient(180deg, #ffffff, ${th.knob})`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.22), 0 6px 14px -4px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <SunMoon p={icon} color={icon > 0.5 ? '#3b4366' : '#f0a020'} size={34} />
          </div>
        </div>

        {/* week title */}
        <div style={{ position: 'absolute', left: 40, top: TOP_H, height: HEAD_H, display: 'flex', alignItems: 'center', width: WIN.w - 80 }}>
          <span style={{ fontSize: 64, fontWeight: 760, letterSpacing: '-0.035em' }}>September 14 – 18</span>
          <span style={{ marginLeft: 26, fontSize: 26, fontWeight: 600, letterSpacing: '0.08em', color: th.ink3, transform: 'translateY(8px)' }}>WEEK 38</span>
          <span style={{ marginLeft: 'auto', fontSize: 26, color: th.ink2, fontWeight: 500 }}>Launch film · ships Friday</span>
        </div>

        {/* weekday / date */}
        {DAYS.map((d, i) => {
          const today = i === TODAY;
          return (
            <div key={d.d} style={{ position: 'absolute', left: GUT + i * COL_W, top: TOP_H + HEAD_H, width: COL_W, height: DAYS_H, display: 'flex', alignItems: 'center', gap: 14, paddingLeft: 14, boxSizing: 'border-box' }}>
              <span style={{ fontSize: 22, fontWeight: 650, letterSpacing: '0.1em', color: today ? th.accent : th.ink3 }}>{d.d}</span>
              <span style={{
                fontSize: 40, fontWeight: 720, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
                color: today ? '#ffffff' : th.ink,
                ...(today ? {
                  background: th.accent, borderRadius: 30, padding: '2px 16px',
                  boxShadow: n ? `0 0 ${(26 * todayLit).toFixed(1)}px ${alpha(th.accent, 0.6 * todayLit)}, 0 0 ${(70 * todayLit).toFixed(1)}px ${alpha(th.accent, 0.3 * todayLit)}` : `0 4px 12px -4px ${alpha(th.accent, 0.5)}`,
                } : {}),
              }}>{d.n}</span>
            </div>
          );
        })}

        {/* time grid */}
        <div style={{ position: 'absolute', left: 0, top: GRID_Y, width: WIN.w, height: WIN.h - GRID_Y, borderTop: `1px solid ${th.line}` }}>
          {Array.from({ length: H1 - H0 + 1 }, (_, k) => (
            <React.Fragment key={k}>
              <div style={{ position: 'absolute', left: GUT, right: 36, top: k * HOUR, height: 1, background: th.line }} />
              <span style={{ position: 'absolute', left: 30, top: k * HOUR - 13, fontSize: 21, color: th.ink3, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                {`${H0 + k > 12 ? H0 + k - 12 : H0 + k} ${H0 + k >= 12 ? 'PM' : 'AM'}`}
              </span>
            </React.Fragment>
          ))}
          {DAYS.map((_, i) => (
            <div key={i} style={{ position: 'absolute', left: GUT + i * COL_W, top: 0, bottom: 0, width: 1, background: th.line }} />
          ))}
          {/* very faint background tint for today's whole column */}
          <div style={{ position: 'absolute', left: GUT + TODAY * COL_W, top: 0, bottom: 0, width: COL_W, background: alpha(th.accent, n ? 0.04 : 0.035) }} />
          {/* events */}
          {EVENTS.map((ev, i) => {
            const c = th.ev[ev.hue];
            const top = (ev.s - H0) * HOUR + 4;
            const h = (ev.e - ev.s) * HOUR - 8;
            return (
              <div key={i} style={{
                position: 'absolute', left: GUT + ev.day * COL_W + 8, top, width: COL_W - 16, height: h, borderRadius: 12,
                background: c.fill, overflow: 'hidden', boxSizing: 'border-box', padding: '12px 16px 0 22px',
                boxShadow: n ? `inset 0 0 0 1px ${alpha(c.bar, 0.18)}` : `inset 0 0 0 1px ${alpha(c.bar, 0.1)}`,
              }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: c.bar, boxShadow: n ? `0 0 12px ${alpha(c.bar, 0.6)}` : 'none' }} />
                <div style={{ fontSize: 27, fontWeight: 650, letterSpacing: '-0.015em', color: c.text, whiteSpace: 'nowrap', lineHeight: 1.15 }}>{ev.t}</div>
                {h > 70 && <div style={{ fontSize: 21, color: c.sub, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{fmt(ev.s)} – {fmt(ev.e)}</div>}
              </div>
            );
          })}
          {/* now line */}
          <div style={{ position: 'absolute', left: GUT, right: 36, top: (NOW - H0) * HOUR, height: 0 }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: -1, height: 2, background: alpha(th.accent, 0.35) }} />
            <div style={{
              position: 'absolute', left: TODAY * COL_W, width: COL_W, top: -1.5, height: 3, background: th.accent,
              boxShadow: n ? `0 0 ${(14 * nowLit).toFixed(1)}px ${alpha(th.accent, 0.9 * nowLit)}, 0 0 ${(40 * nowLit).toFixed(1)}px ${alpha(th.accent, 0.4 * nowLit)}` : 'none',
            }} />
            <div style={{
              position: 'absolute', left: TODAY * COL_W - 9, top: -9, width: 18, height: 18, borderRadius: 9, background: th.accent,
              boxShadow: n ? `0 0 0 ${(5 * nowLit).toFixed(1)}px ${alpha(th.accent, 0.22)}, 0 0 ${(24 * nowLit).toFixed(1)}px ${alpha(th.accent, 0.8 * nowLit)}` : `0 0 0 4px ${alpha(th.accent, 0.16)}`,
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// macOS pointer
const Pointer: React.FC<{ x: number; y: number; s: number; o: number }> = ({ x, y, s, o }) => (
  <svg width={30} height={30} viewBox="0 0 28 28" style={{
    position: 'absolute', left: x - 2, top: y - 1, opacity: o, overflow: 'visible',
    transformOrigin: '2px 1px', transform: `scale(${s.toFixed(3)})`,
    filter: 'drop-shadow(0 1px 1px rgba(20,14,8,0.35)) drop-shadow(0 4px 6px rgba(20,14,8,0.25))',
  }}>
    <path d="M2 1 L2 23 L8 17.5 L11.5 25 L15.5 23.2 L12 15.8 L20 15 Z" fill="#16171b" stroke="#ffffff" strokeWidth={1.6} strokeLinejoin="round" />
  </svg>
);

const SWEEP_EASE = bezier(0.3, 0, 0.35, 1); // asymmetric in-out: starts in the close-up (already looks fast at 2× on screen), passes evenly in the full view, lands softly at the left end

export const ThemeSweepToggle: React.FC = () => {
  const frame = useCurrentFrame();

  // ── camera: close-up of the toggle → pull out to the full view → very slow push ──
  const camT = ramp(frame, CAM0, CAM1 - CAM0, EASE.smooth);
  const pre = ramp(frame, 0, CAM0, EASE.linear);
  const hold = ramp(frame, CAM1, THEME_SWEEP_TOGGLE_DURATION - CAM1, EASE.swift);
  const z = mix(2.0 + 0.04 * pre, 1.0, camT) + 0.02 * hold;
  const cx = mix(TOG_C.x - 300, 960, camT);
  const cy = mix(TOG_C.y + 150, 540, camT);
  const camStyle: React.CSSProperties = {
    position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '0 0',
    transform: `translate(${(960 - cx * z).toFixed(2)}px, ${(540 - cy * z).toFixed(2)}px) scale(${z.toFixed(4)})`,
  };
  const toScreen = (wx: number, wy: number) => ({ x: (wx - cx) * z + 960, y: (wy - cy) * z + 540 });

  // ── toggle: spring slides to the right (one overshoot), icon day→moon ──
  const knob = frame < CLICK ? 0 : springAt(frame, CLICK, { damping: 16, stiffness: 210 });
  const icon = ramp(frame, CLICK + 1, 12, EASE.out);

  // ── pointer: slides onto the toggle → presses → fades out as the view pulls out ──
  const ptrT = ramp(frame, PTR_IN, CLICK - PTR_IN, EASE.out);
  const away = ramp(frame, CLICK + 6, 16, EASE.swift); // steps away after clicking, so it doesn't block the moon
  const ptrX = mix(TOG_C.x + 150, TOG_C.x + 20, ptrT) + 60 * away;
  const ptrY = mix(TOG_C.y + 120, TOG_C.y + 8, ptrT) + Math.sin(ptrT * Math.PI) * 10 + 70 * away;
  const press = frame < CLICK - 1 ? 1 : mix(0.86, 1, ramp(frame, CLICK + 1, 6, EASE.out));
  const ptrO = 1 - ramp(frame, 22, 10, EASE.exit);

  // ── sweep boundary: a 15° slanted line in world coordinates x(y) = p + y·tan15 (top end leads), night is on the right of the line ──
  const pAt = (f: number) => mix(1960, -480, ramp(f, SWEEP0, SWEEP1 - SWEEP0, SWEEP_EASE));
  const p = pAt(frame);
  const v = Math.abs(velocity(pAt, frame)); // px/frame (world)
  const streak = Math.min(1, v / 110);
  const sweeping = frame >= SWEEP0 && frame < SWEEP1;
  const night = frame >= SWEEP0;
  const dayGone = frame >= SWEEP1;
  const nightClip = dayGone ? 'none' : `polygon(${p - 400 * T15}px -400px, 2400px -400px, 2400px 1500px, ${p + 1500 * T15}px 1500px)`;
  const edgeO = ramp(frame, SWEEP0, 3, EASE.linear) * (1 - ramp(frame, SWEEP1 - 8, 8, EASE.linear));

  // screen-space terminator polygon (used to split the screen-space vignette into day and night layers)
  const a = toScreen(p - 400 * T15, -400);
  const b = toScreen(p + 1500 * T15, 1500);
  const screenNightClip = `polygon(${a.x}px ${a.y}px, 4000px ${a.y}px, 4000px ${b.y}px, ${b.x}px ${b.y}px)`;
  const screenDayClip = `polygon(-2000px ${a.y}px, ${a.x}px ${a.y}px, ${b.x}px ${b.y}px, -2000px ${b.y}px)`;

  const lights = ramp(frame, LIGHTS, 20, EASE.linear);

  // boundary geometry (world coordinates): center point (xc, 540), the vertical strip rotated 15° counterclockwise about the center
  const xc = p + 540 * T15;
  const duskW = 70 + 170 * streak;
  const coolW = 60 + 140 * streak;

  return (
    <AbsoluteFill style={{ background: NIGHT.bg[2], overflow: 'hidden' }}>
      <div style={camStyle}>
        {!dayGone && <World th={DAY} knob={knob} icon={icon} lights={0} frame={frame} />}
        {night && (
          <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, clipPath: dayGone ? undefined : nightClip }}>
            <World th={NIGHT} knob={knob} icon={icon} lights={lights} frame={frame} />
          </div>
        )}
        {sweeping && (
          <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, pointerEvents: 'none', opacity: edgeO }}>
            {/* bright side: soft shadow pressed on by the curtain + sunset-orange twilight band (widens with speed) */}
            <div style={{
              position: 'absolute', left: xc - duskW, top: 540 - 1100, width: duskW, height: 2200,
              transformOrigin: '100% 50%', transform: 'rotate(-15deg)',
              background: `linear-gradient(90deg, rgba(255,150,70,0) 0%, rgba(255,150,70,${(0.06 + 0.08 * streak).toFixed(3)}) 60%, rgba(255,128,56,${(0.22 + 0.12 * streak).toFixed(3)}) 94%, rgba(60,30,30,0.22) 100%)`,
            }} />
            {/* night side: cool blue glow */}
            <div style={{
              position: 'absolute', left: xc, top: 540 - 1100, width: coolW, height: 2200,
              transformOrigin: '0% 50%', transform: 'rotate(-15deg)',
              background: `linear-gradient(90deg, rgba(150,180,255,${(0.26 + 0.1 * streak).toFixed(3)}) 0%, rgba(90,120,255,0.1) 30%, rgba(90,120,255,0) 100%)`,
            }} />
            {/* white-hot core line */}
            <div style={{
              position: 'absolute', left: xc - 1.5, top: 540 - 1100, width: 3, height: 2200,
              transformOrigin: '50% 50%', transform: 'rotate(-15deg)', background: '#fffaf0',
              boxShadow: '0 0 8px 1px rgba(255,236,210,0.9), 0 0 26px 4px rgba(255,170,90,0.5)',
            }} />
          </div>
        )}
        {/* pointer (world coordinates, scales with the camera) */}
        {ptrO > 0.01 && <Pointer x={ptrX} y={ptrY} s={1.15 * press} o={ptrO} />}
      </div>

      {/* screen-space vignette (two layers for day and night, split by the terminator), one grain layer */}
      {!dayGone && (
        <div style={{ position: 'absolute', inset: 0, clipPath: night ? screenDayClip : undefined, background: 'radial-gradient(ellipse 75% 75% at 50% 46%, rgba(74,47,18,0) 55%, rgba(74,47,18,0.16) 100%)' }} />
      )}
      {night && (
        <div style={{ position: 'absolute', inset: 0, clipPath: dayGone ? undefined : screenNightClip, background: 'radial-gradient(ellipse 72% 72% at 50% 46%, rgba(0,2,8,0) 45%, rgba(0,2,8,0.55) 100%)' }} />
      )}
      <Grain opacity={0.06} blend="overlay" />
    </AbsoluteFill>
  );
};
