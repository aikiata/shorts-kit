// tilt-reveal | pitch reveal (second redesign)
// Technique unchanged: the whole page lies flat with rotateX, the opening shows only a narrow perspective band along the top edge, the camera "looks up" and rights itself, and content floods into view row by row.
//
// Design decisions
// - look: midnight (deep blue night · electric blue). The opening is a "horizon" in the dark night: the far top edge of the flat-lying page is just a
//   glowing narrow band (a white-blue bright line along the far upper edge + a wide blue bloom), like the first light on the skyline.
// - subject: a dark-field render dashboard of shorts-kit designed for the shot: top bar (brand logo + wordmark), a 120px headline "Renders are up 38%",
//   a glowing area chart running across the full width, three 76px big-number KPIs. Few elements, big type, strong contrast; settled, it is a poster.
//   The page settles in frame with a margin (0.84x), stage light is visible around it, and a blue halo "floor reflection" lies at its feet.
// - camera move: the page hinges on its lower edge, lying flat face up (the viewpoint is above the page, so text in the narrow band reads upright), rotateX 86°→−2.2° overshoot→0° righting,
//   the same progress p drives zoom 2.5→0.84, hinge position, eye height and perspective distance; the background light pools and floating dust move down in reverse parallax with the pitch, reading as "the camera looks up", not the page rotating.
// - light: during the lift a specular reflection band sweeps from the page's upper edge to the lower edge (the physical reflection of a changing grazing angle, Q4: once for the hero,
//   clipped to the rounded corners); the glowing line of the area chart draws on in the second half of the lift, and a light dot comes on at the end point when settled.
// - Q2: enlarging doesn't use transform scale, it lays out at the target magnification + rasterizes with CSS zoom, then restores the perspective with an equivalent rotateX'·scaleY;
//   when flat, a vertical-only anti-aliasing pre-blur by the vertical compression ratio is applied, turned off automatically before things become readable.
//
// Timeline (30fps, 120f total)
//   0–20   wind-up: the narrow band is already in frame (that light is there at frame 1), very slow creep 86°→83°, backlight goes from dark to bright
//   20–60  look up 40f: asymmetric in-out (soft start, fast middle, zero speed at the end), rushing to the −2.2° overshoot peak;
//          the fastest few frames get vertical motion blur; 32–62 the specular band sweeps over the page
//   60–70  soft return to 0° (smooth): the camera settles
//   38–82  area chart line draws on (out, with a glowing pen tip), the end-point light comes on at 80f; the three KPI cells rise and brighten in a stagger (rows one beat later than the base plate)
//   70–120 hold 50f: very slow push in 1→1.018, breathing backlight, the last frame is a complete poster
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Dust, LOOKS, Stage, alpha, type } from '../../../shared/fixtures/Look';
import { EASE, FONT, SpeedBlur, mix, ramp } from '../../../shared/fixtures/Polish';
import { BRAND, ShortKitMark } from '../../../shared/fixtures/Brand';

export const TILT_REVEAL_DURATION = 120;

const L = LOOKS.midnight;

const HOLD = 20; // wind-up creep ends
const MOVE = 40; // main lift 20→60
const SETTLE = 10; // overshoot fall-back 60→70
const FROM = 86; // flat pitch angle (the page lies down toward the distance, hinged on its lower edge, face up)
const CREEP = 3 / 86; // wind-up segment lifts 3° first
const OVER = 1 + 2.2 / 86; // main lift overshoots past 0° to +2.2°
const S0 = 2.5; // magnification when flat (band wide enough, close enough)
const S1 = 0.84; // settled magnification: stage left around the page
const BOT0 = 600; // screen y of the hinge (page lower edge) when flat: the narrow band lands near the frame midline
const BOT1 = 540 + (1080 * S1) / 2 - 18; // page lower edge when settled (slightly high, leaving room for the floor reflection)
const PAGE_R = 26; // page corner radius (1x page px)

// time → pose (pure function; velocity by central difference). Angle uses the overshooting q, zoom/translation/perspective use the non-overshooting p
const poseAt = (f: number) => {
  const creep = ramp(f, 0, HOLD, EASE.smooth) * CREEP;
  const lift = ramp(f, HOLD, MOVE, EASE.swift);
  const q = mix(creep, OVER, lift) - (OVER - 1) * ramp(f, HOLD + MOVE, SETTLE, EASE.smooth);
  const p = mix(creep, 1, lift);
  return {
    p,
    rotX: FROM * (1 - q),
    scale: mix(S0, S1, p),
    bot: mix(BOT0, BOT1, p),
    eye: mix(BOT0 - 300, 520, p), // eye height: above the page when flat (looking down at the face), back to the frame center when settled
    persp: mix(700, 1500, p),
  };
};

// ───────────── page: shorts-kit dark-field render dashboard (1920×1080 design coordinates) ─────────────

// area chart data (deterministic): slow rise + two dips + a final surge
const SERIES = [22, 26, 24, 31, 35, 33, 38, 44, 41, 47, 52, 49, 55, 61, 58, 66, 71, 69, 78, 86];
const CH = { x: 0, y: 0, w: 1600, h: 300 };
const pt = (i: number) => {
  const x = CH.x + (i / (SERIES.length - 1)) * CH.w;
  const y = CH.y + CH.h - (SERIES[i] / 100) * CH.h;
  return [x, y] as const;
};
// Catmull-Rom → cubic Bezier, smooth polyline
const linePath = (() => {
  let d = '';
  for (let i = 0; i < SERIES.length; i++) {
    const [x, y] = pt(i);
    if (i === 0) { d += `M${x},${y}`; continue; }
    const [x0, y0] = pt(Math.max(0, i - 2));
    const [x1, y1] = pt(i - 1);
    const [x3, y3] = pt(Math.min(SERIES.length - 1, i + 1));
    d += ` C${x1 + (x - x0) / 6},${y1 + (y - y0) / 6} ${x - (x3 - x1) / 6},${y - (y3 - y1) / 6} ${x},${y}`;
  }
  return d;
})();
const areaPath = `${linePath} L${CH.w},${CH.h} L0,${CH.h} Z`;

const KPIS = [
  { k: 'Frames rendered', v: '4.82M', d: '+38%' },
  { k: 'Shots rendered', v: '12,480', d: '+2.1k' },
  { k: 'Cuts on the beat', v: '99.1%', d: '+1.4 pts' },
];

const DashboardPage: React.FC<{ draw: number; dot: number; rows: number[] }> = ({ draw, dot, rows }) => {
  const [lx, ly] = pt(SERIES.length - 1);
  return (
    <div style={{
      position: 'absolute', inset: 0, borderRadius: PAGE_R, overflow: 'hidden', fontFamily: FONT.sans,
      background: `linear-gradient(180deg, #121a2e 0%, ${L.surface} 46%, #0c1222 100%)`,
      boxShadow: `inset 0 0 0 1.5px ${L.line}, inset 0 1.5px 0 rgba(200,215,255,0.16)`,
    }}>
      {/* top bar: an electric-blue hairline along the lower edge; when flat it is the opening "horizon" */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 0, height: 104, display: 'flex', alignItems: 'center',
        padding: '0 64px', gap: 22, background: 'rgba(160,190,255,0.035)',
      }}>
        <ShortKitMark size={48} tone="dark" style={{ flex: 'none' }} />
        <div style={{ ...type(36, 700), fontFamily: BRAND.font, letterSpacing: '0.03em', color: L.ink }}>{BRAND.name}</div>
        <div style={{ display: 'flex', gap: 44, marginLeft: 72, ...type(28, 550), color: L.ink3 }}>
          <span style={{ color: L.ink }}>Overview</span><span>Shots</span><span>Renders</span><span>Gallery</span>
        </div>
        <div style={{
          marginLeft: 'auto', padding: '12px 26px', borderRadius: 999, border: `1.5px solid ${L.line}`,
          ...type(26, 550), color: L.ink2, background: 'rgba(160,190,255,0.05)',
        }}>Last 12 months</div>
        <div style={{ width: 52, height: 52, borderRadius: 26, background: 'linear-gradient(135deg,#5b8cff,#3ee6d0)', boxShadow: `0 0 0 3px ${L.surface}` }} />
      </div>
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 103, height: 2,
        background: `linear-gradient(90deg, ${alpha(L.accent, 0)} 0%, ${L.accent} 22%, #b9cdff 50%, ${L.accent} 78%, ${alpha(L.accent, 0)} 100%)`,
        boxShadow: `0 0 18px ${alpha(L.accent, 0.8)}`,
      }} />

      {/* title area */}
      <div style={{ position: 'absolute', left: 120, top: 168, opacity: rows[0], transform: `translateY(${(1 - rows[0]) * 18}px)` }}>
        <div style={{ ...type(26, 650, { caps: true }), color: L.accent, letterSpacing: '0.2em' }}>Render studio · Q3 Overview</div>
        <div style={{ ...type(TYPE_H1, 760), color: L.ink, marginTop: 26 }}>
          Renders are up <span style={{ color: L.accent, textShadow: `0 0 40px ${alpha(L.accent, 0.45)}` }}>38%</span>
        </div>
      </div>

      {/* area chart: runs across the full width */}
      <div style={{ position: 'absolute', left: 160, top: 420, width: CH.w, height: CH.h + 60, opacity: rows[1] }}>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <div key={g} style={{ position: 'absolute', left: 0, right: 0, top: CH.h * (1 - g), height: 1.5, background: L.line }} />
        ))}
        <svg width={CH.w} height={CH.h} viewBox={`0 0 ${CH.w} ${CH.h}`} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
          <defs>
            <linearGradient id="mer-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={L.accent} stopOpacity={0.38} />
              <stop offset="1" stopColor={L.accent} stopOpacity={0} />
            </linearGradient>
            <clipPath id="mer-clip"><rect x={-10} y={-40} width={(CH.w + 20) * draw} height={CH.h + 80} /></clipPath>
          </defs>
          <g clipPath="url(#mer-clip)">
            <path d={areaPath} fill="url(#mer-area)" />
            <path d={linePath} fill="none" stroke={alpha(L.accent, 0.35)} strokeWidth={14} strokeLinecap="round" style={{ filter: 'blur(8px)' }} />
            <path d={linePath} fill="none" stroke="#a9c1ff" strokeWidth={5} strokeLinecap="round" />
          </g>
          {draw > 0.02 && draw < 0.995 && (() => {
            const i = Math.min(SERIES.length - 1, draw * (SERIES.length - 1));
            const i0 = Math.floor(i), i1 = Math.min(SERIES.length - 1, i0 + 1);
            const [ax, ay] = pt(i0), [bx, by] = pt(i1);
            const hx = ax + (bx - ax) * (i - i0), hy = ay + (by - ay) * (i - i0);
            return <circle cx={hx} cy={hy} r={9} fill="#e6edff" style={{ filter: `drop-shadow(0 0 10px ${L.accent})` }} />;
          })()}
          {dot > 0 && (
            <g opacity={dot}>
              <circle cx={lx} cy={ly} r={34 * dot} fill={alpha(L.accent, 0.18)} />
              <circle cx={lx} cy={ly} r={11} fill="#e6edff" stroke={L.accent} strokeWidth={5} />
            </g>
          )}
        </svg>
        <div style={{ position: 'absolute', left: 0, right: 0, top: CH.h + 22, display: 'flex', justifyContent: 'space-between', ...type(24, 550, { caps: true }), color: L.ink3, letterSpacing: '0.14em' }}>
          {['Oct', 'Dec', 'Feb', 'Apr', 'Jun', 'Sep'].map((m) => <span key={m}>{m}</span>)}
        </div>
      </div>

      {/* KPI cells: big number + growth */}
      <div style={{ position: 'absolute', left: 120, right: 120, top: 830, display: 'flex', gap: 40 }}>
        {KPIS.map((k, i) => (
          <div key={k.k} style={{
            flex: 1, height: 190, borderRadius: 22, padding: '30px 38px', boxSizing: 'border-box',
            background: `linear-gradient(180deg, ${L.surface2} 0%, rgba(23,32,54,0.6) 100%)`,
            boxShadow: `inset 0 0 0 1.5px ${L.line}, inset 0 1.5px 0 rgba(200,215,255,0.1)`,
            opacity: 0.55 + 0.45 * rows[2 + i], transform: `translateY(${(1 - rows[2 + i]) * 26}px)`,
          }}>
            <div style={{ ...type(26, 550), color: L.ink2 }}>{k.k}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 20, marginTop: 14 }}>
              <div style={{ ...type(76, 720), color: L.ink }}>{k.v}</div>
              <div style={{ ...type(28, 650), color: L.accent2 }}>{k.d}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
const TYPE_H1 = 120;

export const TiltReveal: React.FC = () => {
  const f = useCurrentFrame();
  const { p, rotX, scale: s0, bot, eye, persp } = poseAt(f);
  // very slow push in after settling (the camera stays alive in the hold segment)
  const push = mix(1, 1.018, ramp(f, 70, 50, EASE.smooth));
  const scale = s0 * push;
  const botY = 540 + (bot - 540) * push;
  const topY = botY - 1080 * scale; // top edge of the layout box (before the 3D transform)

  // look-up angular velocity (°/frame) → approximate vertical on-screen displacement, active only in the fast segment
  const vRot = poseAt(f + 0.5).rotX - poseAt(f - 0.5).rotX;
  const vy = -vRot * 7;

  // Q2: equivalent rotateX'·scaleY (on the plane laid out at s times), projection consistent with scale(s)·rotateX(r)
  const rad = (rotX * Math.PI) / 180;
  const rEq = (Math.atan2(Math.sin(rad), scale * Math.cos(rad)) * 180) / Math.PI;
  const kEq = Math.sqrt(scale * scale * Math.cos(rad) ** 2 + Math.sin(rad) ** 2) / scale;
  const vScale = kEq * Math.abs(Math.cos((rEq * Math.PI) / 180));
  const sigma = vScale > 0.6 ? 0 : (0.55 / Math.max(0.05, vScale)) * 1.6 - 1.2;

  const flat = Math.min(1, Math.abs(rotX) / 86); // 1 = flat
  // projected screen y of the far end (page upper edge): the opening "horizon" hangs here
  const Hs = 1080 * scale * kEq;
  const zFar = -Hs * Math.sin((rEq * Math.PI) / 180);
  const farY = eye + (botY - Hs * Math.cos((rEq * Math.PI) / 180) - eye) * (persp / (persp - zFar));
  const glowUp = ramp(f, 0, 26, EASE.out); // opening backlight goes from dark to bright
  // background parallax: camera looks up → stage light pools / floating dust move down relatively
  const bgShift = mix(-150, 0, p);
  // specular reflection band: sweeps from upper edge to lower edge with the pitch angle (clipped to the page's rounded corners)
  const sheen = ramp(f, 32, 30, EASE.swift);
  // content: line draw-on, end-point light, row stagger
  const draw = ramp(f, 38, 44, EASE.out);
  const dot = ramp(f, 80, 14, EASE.overshoot);
  const rows = [0, 1, 2, 3, 4].map((i) => ramp(f, 34 + i * 4, 22, EASE.out));
  // opening "horizon": the electric-blue rim light on the page's upper edge, brightest when flat, collapsing into a highlight along the page's upper edge once raised
  const rim = glowUp * Math.pow(flat, 3);
  rows[0] = Math.max(rows[0], 0.85 + 0.15 * ramp(f, 30, 20, EASE.out)); // the title is there even when flat (visible in the narrow band)
  rows[1] = 1;

  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: L.bg[2] }}>
      <Stage look={L} keyLight={{ x: 0.5, y: 0.0 }} fill={{ x: 0.82, y: 0.95 }} intensity={0.75 + 0.25 * glowUp} breathe={0.6}
        style={{ transform: `translateY(${bgShift}px)`, inset: '-160px 0 -160px 0' }}>
        <Dust look={L} count={34} seed={7} drift={0.18} opacity={0.5} />
      </Stage>

      {/* backlight behind the page: when flat it is a blue glow hugging the narrow band, once raised it becomes the rim light around the page */}
      <div style={{
        position: 'absolute', left: 960 - 900, width: 1800, top: mix(farY - 90, farY - 40, p), height: mix(180, 1000, p),
        background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${alpha(L.light, 0.55 * glowUp)} 0%, ${alpha(L.light, 0)} 70%)`,
        filter: 'blur(30px)', opacity: 0.9,
      }} />
      {/* floor reflection: a blue halo at the page's feet */}
      <div style={{
        position: 'absolute', left: 160, right: 160, top: 1080 - 150, height: 260, opacity: p,
        background: `radial-gradient(ellipse 50% 40% at 50% 30%, ${alpha(L.accent, 0.4)} 0%, ${alpha(L.accent, 0.08)} 55%, ${alpha(L.accent, 0)} 75%)`,
      }} />

      <SpeedBlur vx={0} vy={vy} amount={0.2} max={9}>
        <div style={{ position: 'absolute', inset: 0, perspective: persp, perspectiveOrigin: `50% ${(eye / 1080) * 100}%` }}>
          <div style={{
            position: 'absolute', left: 960 - 960 * scale, top: topY, width: 1920 * scale, height: 1080 * scale,
            transformOrigin: '50% 100%', transform: `rotateX(${rEq}deg) scaleY(${kEq})`,
            borderRadius: PAGE_R * scale, overflow: 'hidden',
            boxShadow: `0 ${40 * scale}px ${120 * scale}px ${alpha(L.shadow, 0.7)}, 0 0 ${60 * scale}px ${alpha(L.light, 0.18 * (1 - flat))}`,
          }}>
            {sigma > 0.5 && (
              <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden>
                <filter id="tilt-aa" x="0" y="-5%" width="100%" height="110%" colorInterpolationFilters="sRGB">
                  <feGaussianBlur stdDeviation={`0 ${sigma.toFixed(2)}`} />
                </filter>
              </svg>
            )}
            <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, zoom: scale, filter: sigma > 0.5 ? 'url(#tilt-aa)' : undefined }}>
              <DashboardPage draw={draw} dot={dot} rows={rows} />
            </div>
            {/* grazing light: when flat the far end (lower part of the page, far from the hinge) sinks into night */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: `linear-gradient(0deg, ${alpha(L.bg[2], 0.1 * flat)} 0%, ${alpha(L.bg[2], 0.5 * flat)} 45%, ${alpha(L.bg[2], 0.9 * flat ** 1.5)} 100%)`,
            }} />
      {/* specular reflection band: once, from upper edge to lower edge */}
            {sheen > 0 && sheen < 1 && (
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen',
                background: `linear-gradient(180deg, transparent ${(sheen * 130 - 30).toFixed(1)}%, ${alpha('#9fb6ff', 0.16 * Math.sin(sheen * Math.PI))} ${(sheen * 130 - 12).toFixed(1)}%, transparent ${(sheen * 130 + 6).toFixed(1)}%)`,
              }} />
            )}
          </div>
        </div>
      </SpeedBlur>

      {/* horizon rim light: a bright line along the narrow band's upper edge + a wide bloom (screen space, follows the hinge) */}
      {rim > 0.01 && (
        <>
          <div style={{
            position: 'absolute', left: 0, right: 0, top: farY - 60, height: 120, opacity: rim, pointerEvents: 'none',
            background: `radial-gradient(ellipse 46% 50% at 50% 50%, ${alpha(L.accent, 0.5)} 0%, ${alpha(L.accent, 0)} 70%)`,
            mixBlendMode: 'screen',
          }} />
          <div style={{
            position: 'absolute', left: 0, right: 0, top: farY - 1.5, height: 3, opacity: rim, pointerEvents: 'none',
            background: `linear-gradient(90deg, ${alpha('#cfdcff', 0)} 4%, #cfdcff 32%, #ffffff 50%, #cfdcff 68%, ${alpha('#cfdcff', 0)} 96%)`,
            boxShadow: `0 0 14px ${alpha(L.accent, 0.9)}, 0 0 40px ${alpha(L.accent, 0.6)}`,
          }} />
        </>
      )}
    </AbsoluteFill>
  );
};
