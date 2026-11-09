// comic-panel-split | comic panels side by side: one subject, three camera positions, three panels freeze-framed click-click-click, the last panel's slanted edge eats the screen.
//
// Second redesign (ink black, vermilion red, a comic-panel night launch of a lens):
// - look = custom "Comic Ink": red-tinted ink-black base (not pure black) + cream paper gutter lines + one vermilion red accent (the lens red ring / focus indicator /
//   one word in the title). The comic panel language rests on three things: 12deg slanted gutters (cream paper core + ink edge), comic caption boxes at the panel corners,
//   and a burst of speed lines when the last panel pops in.
// - Subject = the shorts-kit prime lens "35mm f/1.2" (lens name ring engraved shorts-kit + brand tagline), drawn entirely in SVG vectors (aluminum barrel, rubber focus ring, distance scale, red ring,
//   ring-shaped lens name text, coating reflections, 11 aperture blades), so the 0.68x / 2.3x / 2.2x camera positions of the three panels are all vector redraws with sharp text edges.
//   Three panels = three camera positions on the same lens: (1) 3/4 side shot of the whole body (barrel volume visible) (2) focus ring close-up (numbers turning, manual focus)
//   (3) lens-glass macro (aperture blades closing, f/1.2 -> f/2). Keep-alive is not a slow push but "the lens itself at work".
// - The three caption boxes are numbered "Shot 01 / 02 / 03" (three panels = three shots); the first panel carries the first half of the brand tagline, "Frame motion."
// - After the last panel eats the screen it becomes the closing poster: the lens-glass macro fills the right half, and on the left the shorts-kit wordmark + the big title "Craft / the shot." rise line by line.
//
// Timeline (30fps, 156f total):
//   0-20    full-screen 3/4 side shot (slow push 1->1.04), the lens is already in frame, not starting from blank
//   20/24/28 three slanted gutters chop down in turn (each cut drawn top to bottom over 3f), with the matching panel hard-cutting in on the same frame (5f scale 1.07->1 + white flash)
//            4f per beat, "click, click, click", easier to read than the original 2f
//   27/31/35 three caption boxes stamp in one by one (overshoot, -2deg tilt)
//   35-64   freeze 29f: (1) very slow push (2) focus ring turns 26deg (distance numbers slide past the red indicator) (3) aperture blades close
//   64-80   last panel slanted edge eats the screen: 2f reverse pull-back (anticip) then 14f sweep across the full screen, the lens camera position slides to the poster composition; gutter lines get horizontal drag trails by speed
//   82-106  two title lines rise, subtitle blurs in
//   106-156 hold: aperture very slowly reopens + 1.5% push-in, then settles cleanly
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, FONT, Grain, SpeedBlur, Vignette, mix, ramp, velocity } from '../../../shared/fixtures/Polish';
import { TextReveal, alpha, type } from '../../../shared/fixtures/Look';
import { BRAND, ShortKitWordmark } from '../../../shared/fixtures/Brand';

export const COMIC_PANEL_SPLIT_DURATION = 156;

// ───────────── Palette (custom Comic Ink) ─────────────
const C = {
  ink: '#0b0607', // ink (gutter edges, caption box outlines)
  bg0: '#1c0c0f', bg1: '#0f0708', bg2: '#070304', // red-tinted ink-black stage
  cream: '#f3eadb', // paper core / engraving / title
  cream2: '#b9ab9a', cream3: '#6e625a',
  red: '#ff3346', // vermilion red: red ring, focus indicator, one word in the title
  metal0: '#09090b', metal1: '#1b1b1f', metal2: '#34333a', // anodized black aluminum
};

// ───────────── Timing ─────────────
const SPLIT = 20; // first cut
const BEAT = 4; // interval between panels
const POP = 5;
const CAP = 7; // caption boxes lag the panels by 7f
const HOLD0 = SPLIT + 2 * BEAT + POP + 2; // 35: all three panels settled
const EXP0 = 64; // eat-screen start
const EXP_DUR = 16; // incl. 2f anticipation
const EXP1 = EXP0 + EXP_DUR; // 80
const TITLE = 82;

// ───────────── Slanted gutter geometry (12deg: tan12deg x 1080 ~ 230) ─────────────
const SLANT = 230;
const B1 = 750; // gutter 1 top x
const B2 = 1405; // gutter 2 top x
const HALF = 9; // gutter half width (paper core + ink edge)

// ───────────── Camera positions: screen = c + s*(p - f), world origin = lens optical axis ─────────────
type Cam = { fx: number; fy: number; cx: number; cy: number; s: number };
const CAM_OPEN: Cam = { fx: -90, fy: 0, cx: 1040, cy: 560, s: 1.12 }; // opening full-screen 3/4 side shot
const CAM1: Cam = { fx: -90, fy: 0, cx: 360, cy: 590, s: 0.68 }; // (1) whole body
const CAM2: Cam = { fx: 0, fy: -240, cx: 1010, cy: 300, s: 2.3 }; // (2) top of focus ring
const CAM3: Cam = { fx: 0, fy: 0, cx: 1640, cy: 540, s: 2.2 }; // (3) lens glass
const CAM_END: Cam = { fx: 0, fy: 0, cx: 1360, cy: 540, s: 2.45 }; // poster: lens glass fills the right half
const camT = (c: Cam) => `translate(${(c.cx - c.s * c.fx).toFixed(2)} ${(c.cy - c.s * c.fy).toFixed(2)}) scale(${c.s.toFixed(4)})`;

// Eat-screen progress: 2f reverse pull-back + 14f screen sweep (snappy, punchy start, stable landing)
const expandAt = (f: number) => {
  if (f < EXP0) return 0;
  const pre = ramp(f, EXP0, 2, EASE.out);
  const go = ramp(f, EXP0 + 2, EXP_DUR - 2, EASE.snappy);
  return -0.03 * pre * (1 - go) + go;
};
const edgeAt = (f: number) => mix(B2 + 5, -SLANT - 40, expandAt(f)); // third panel left slanted edge top x
const cam3At = (f: number): Cam => {
  const e = Math.max(0, expandAt(f));
  const hold = ramp(f, HOLD0, EXP0 - HOLD0, EASE.smooth);
  return {
    fx: 0, fy: 0, cy: 540,
    cx: mix(CAM3.cx, CAM_END.cx, e),
    s: mix(CAM3.s + hold * 0.06, CAM_END.s, e) * (1 + 0.015 * ramp(f, EXP1, 76, EASE.smooth)),
  };
};
const cam3X = (f: number) => { const c = cam3At(f); return c.cx; };

// Aperture: 0 = fully open f/1.2, 1 = closed to f/2; closes during the freeze, reopens halfway during the poster hold
const apertureAt = (f: number) =>
  ramp(f, HOLD0 - 2, 30, EASE.swift) * (1 - 0.55 * ramp(f, 100, 50, EASE.smooth));
// Focus ring rotation (degrees): turns a stretch during the freeze = manual focus
const focusAt = (f: number) => -18 + 26 * ramp(f, HOLD0 - 4, 30, EASE.swift);

// ───────────── Lens (SVG vectors, world coordinates) ─────────────
const R = 300; // outer barrel radius
const DIST = ['0.3', '0.5', '0.7', '1', '2', '5', '∞'];

const Lens: React.FC<{ id: string; tilt?: number; focus: number; aperture: number }> = ({ id, tilt = 0, focus, aperture }) => {
  const th = (tilt * Math.PI) / 180;
  const cs = Math.cos(th);
  const len = 400 * Math.sin(th); // barrel projected length (to the left)
  const g = (n: string) => `${n}${id}`;
  // Aperture opening: 11-gon, radius 128 (fully open) -> 74 (f/2)
  const open = mix(128, 74, aperture);
  const blades = 11;
  const rot = aperture * 18; // blades rotate as a whole when stopping down
  const poly = Array.from({ length: blades }, (_, i) => {
    const a = ((i / blades) * 360 + rot) * (Math.PI / 180);
    return [open * Math.cos(a), open * Math.sin(a)];
  });
  const holePath = poly.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('') + 'Z';
  const ridges: React.ReactNode[] = [];
  if (tilt > 0) {
    for (let k = -84; k <= 84; k += 5) {
      const ph = (k * Math.PI) / 180;
      const y = R * Math.sin(ph);
      const xo = -R * cs * Math.cos(ph);
      ridges.push(
        <line key={k} x1={xo - len * 0.32} y1={y} x2={xo - len * 0.7} y2={y}
          stroke={k % 10 === 0 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.55)'} strokeWidth={2.2} />,
      );
    }
  }
  const arc = (x: number) => `M${x},${-R} A${R * cs},${R} 0 0 0 ${x},${R}`;
  return (
    <g>
      <defs>
        <linearGradient id={g('side')} x1="0" y1={-R} x2="0" y2={R} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={C.metal0} />
          <stop offset="0.16" stopColor="#4a464e" />
          <stop offset="0.3" stopColor={C.metal1} />
          <stop offset="0.72" stopColor={C.metal0} />
          <stop offset="0.9" stopColor="#3a1a1e" />
          <stop offset="1" stopColor={C.metal0} />
        </linearGradient>
        <radialGradient id={g('lip')} cx="-0.25" cy="-0.35" r="1.2">
          <stop offset="0" stopColor="#4b4950" />
          <stop offset="0.5" stopColor={C.metal1} />
          <stop offset="1" stopColor={C.metal0} />
        </radialGradient>
        <radialGradient id={g('glass')} cx="0.42" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#1a1430" />
          <stop offset="0.55" stopColor="#0a0a18" />
          <stop offset="1" stopColor="#020206" />
        </radialGradient>
        <radialGradient id={g('deep')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#2a0c1c" />
          <stop offset="0.6" stopColor="#0c0612" />
          <stop offset="1" stopColor="#040306" />
        </radialGradient>
        <filter id={g('soft')} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" /></filter>
        <filter id={g('soft2')} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12" /></filter>
        <clipPath id={g('iris')}><circle r={152} /></clipPath>
        <path id={g('name')} d="M -186,0 A 186,186 0 1 1 186,0 A 186,186 0 1 1 -186,0" />
      </defs>
      {tilt > 0 && (
        <g>
          {/* Barrel: rear ellipse + side band (one contour highlight on top, a smear of red ambient reflection at the bottom) */}
          <ellipse cx={-len} cy={0} rx={R * cs} ry={R} fill={`url(#${g('side')})`} />
          <rect x={-len} y={-R} width={len} height={2 * R} fill={`url(#${g('side')})`} />
          <ellipse cx={-len} cy={0} rx={R * cs * 0.9} ry={R * 0.9} fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth={6} />
          {ridges}
          {[0.3, 0.72, 0.84].map((t) => (
            <path key={t} d={arc(-len * t)} fill="none" stroke="rgba(0,0,0,0.7)" strokeWidth={4} transform={`translate(${-R * cs * 0} 0)`} />
          ))}
          <path d={arc(-len * 0.88)} fill="none" stroke={C.red} strokeWidth={5} />
        </g>
      )}
      <g transform={`scale(${cs.toFixed(4)} 1)`}>
        {/* Outer barrel lip */}
        <circle r={R} fill={`url(#${g('lip')})`} />
        <circle r={R - 1} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={2} />
        {/* Focus ring: rubber texture + distance scale band (turns with focus) */}
        <g transform={`rotate(${focus.toFixed(2)})`}>
          <circle r={275} fill="none" stroke="#141417" strokeWidth={28} />
          {Array.from({ length: 120 }, (_, i) => (
            <line key={i} x1={0} y1={-288} x2={0} y2={-263} stroke={i % 2 ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.08)'}
              strokeWidth={3} transform={`rotate(${i * 3})`} />
          ))}
          <circle r={260} fill="#101013" />
          <circle r={260} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={1.5} />
          {DIST.map((d, i) => {
            const a = -66 + i * 22;
            return (
              <g key={d} transform={`rotate(${a})`}>
                <line x1={0} y1={-259} x2={0} y2={-251} stroke={C.cream} strokeWidth={2.4} />
                <text x={0} y={-240} textAnchor="middle" dominantBaseline="central" fill={d === '∞' ? C.red : C.cream}
                  style={{ font: `650 ${d === '∞' ? 24 : 18}px ${FONT.sans}`, fontVariantNumeric: 'tabular-nums' }}>{d}</text>
              </g>
            );
          })}
          {Array.from({ length: 13 }, (_, i) => (
            <line key={`m${i}`} x1={0} y1={-259} x2={0} y2={-254} stroke={C.cream2} strokeWidth={1.4} transform={`rotate(${-66 + i * 11 + 5.5})`} />
          ))}
        </g>
        {/* Fixed indicator line (red triangle) */}
        <path d="M -9,-300 L 9,-300 L 0,-287 Z" fill={C.red} />
        <circle r={226} fill="#0d0d10" />
        <circle r={223} fill="none" stroke={C.red} strokeWidth={5} />
        {/* Lens name ring */}
        <circle r={219} fill="#111014" />
        <text fill={C.cream2} style={{ font: `600 15px ${FONT.sans}`, letterSpacing: '0.32em' }}>
          <textPath href={`#${g('name')}`} startOffset="2%">{`${BRAND.name} 35mm 1:1.2 · FRAME MOTION · CRAFT THE SHOT · ${BRAND.name} 35mm 1:1.2`}</textPath>
        </text>
        <circle r={170} fill="#060508" />
        {/* Front lens element */}
        <circle r={164} fill={`url(#${g('glass')})`} />
        {/* Aperture blades: 11 blades, each shaded by its orientation to the key light (top left), like real metal blades */}
        <g clipPath={`url(#${g('iris')})`}>
          <circle r={152} fill="#0b0a0e" />
          {poly.map((p, i) => {
            const q = poly[(i + 1) % blades];
            const a0 = Math.atan2(p[1], p[0]) + 1.05, a1 = Math.atan2(q[1], q[0]) + 1.05;
            const mid = (a0 + a1) / 2;
            const lit = 0.5 + 0.5 * Math.cos(mid - (-2.3));
            const v = Math.round(10 + lit * 30);
            return (
              <path key={i} d={`M${p[0]},${p[1]} L${q[0]},${q[1]} L${200 * Math.cos(a1)},${200 * Math.sin(a1)} L${200 * Math.cos(a0)},${200 * Math.sin(a0)} Z`}
                fill={`rgb(${v},${v - 2},${v + 4})`} stroke="rgba(255,255,255,0.10)" strokeWidth={1.4} />
            );
          })}
        </g>
        {/* Rear group in the opening: deep red afterglow + two rings of rear element reflections */}
        <path d={holePath} fill={`url(#${g('deep')})`} />
        <circle r={open * 0.55} fill="none" stroke="rgba(255,80,120,0.22)" strokeWidth={3} />
        <circle r={open * 0.3} fill="none" stroke="rgba(120,255,200,0.16)" strokeWidth={2} />
        {/* Coating reflections: magenta / cyan-green two crescents + white highlight, layered on the glass (only inside the lens circle) */}
        <g filter={`url(#${g('soft')})`}>
          <path d="M -120,-60 A 135,135 0 0 1 20,-132" fill="none" stroke="rgba(255,70,170,0.55)" strokeWidth={10} strokeLinecap="round" />
          <path d="M 70,110 A 130,130 0 0 0 128,20" fill="none" stroke="rgba(90,255,190,0.4)" strokeWidth={8} strokeLinecap="round" />
        </g>
        <path d="M -98,-88 A 132,132 0 0 1 -30,-124" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={5} strokeLinecap="round" />
        <rect x={-40} y={-150} width={120} height={46} rx={20} fill="rgba(255,255,255,0.07)" transform="rotate(28)" filter={`url(#${g('soft')})`} />
        <circle cx={-62} cy={-60} r={9} fill="rgba(255,255,255,0.7)" filter={`url(#${g('soft')})`} />
        <circle r={164} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={2} />
      </g>
    </g>
  );
};

// ───────────── Background: red-tinted ink black + halftone dots (comic print feel) ─────────────
const PanelBg: React.FC<{ lx: number; ly: number; k?: number }> = ({ lx, ly, k = 1 }) => (
  <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${C.bg0} 0%, ${C.bg1} 55%, ${C.bg2} 100%)` }}>
    <div style={{
      position: 'absolute', inset: 0,
      background: `radial-gradient(ellipse 46% 56% at ${lx}px ${ly}px, ${alpha(C.red, 0.34 * k)} 0%, ${alpha(C.red, 0.08 * k)} 45%, ${alpha(C.red, 0)} 75%)`,
    }} />
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: `radial-gradient(circle, ${alpha(C.red, 0.5)} 1.7px, transparent 2.3px)`, backgroundSize: '13px 13px',
      WebkitMaskImage: `radial-gradient(ellipse 60% 70% at ${lx}px ${ly}px, rgba(0,0,0,0.0) 20%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0) 100%)`,
      maskImage: `radial-gradient(ellipse 60% 70% at ${lx}px ${ly}px, rgba(0,0,0,0.0) 20%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0) 100%)`,
      opacity: 0.6 * k,
    }} />
  </div>
);

// Lens layer for one panel (SVG filling 1920x1080, framed by the camera position)
const Shot: React.FC<{ id: string; cam: Cam; tilt?: number; focus: number; aperture: number }> = ({ id, cam, tilt, focus, aperture }) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
    <g transform={camT(cam)}>
      {/* Contact shadow under the lens */}
      <ellipse cx={tilt ? -120 : 0} cy={R + 40} rx={R * 1.3} ry={50} fill="rgba(0,0,0,0.6)" filter="blur(20px)" />
      <Lens id={id} tilt={tilt} focus={focus} aperture={aperture} />
    </g>
  </svg>
);

// Comic caption box: cream base + ink outline + hard drop shadow, stamping in
const Caption: React.FC<{ f: number; at: number; x: number; y: number; kicker: string; text: string; tilt: number; anchor?: 'left' | 'right' }> = ({
  f, at, x, y, kicker, text, tilt, anchor = 'left',
}) => {
  if (f < at) return null;
  const p = ramp(f, at, 9, EASE.overshoot);
  return (
    <div style={{
      position: 'absolute', top: y, [anchor]: x, transform: `rotate(${tilt}deg) scale(${mix(1.25, 1, p).toFixed(3)})`,
      transformOrigin: anchor === 'left' ? '0% 0%' : '100% 0%', opacity: Math.min(1, ramp(f, at, 3, EASE.linear)),
      background: C.cream, border: `4px solid ${C.ink}`, boxShadow: `7px 7px 0 ${C.ink}`, padding: '14px 22px 16px',
    }}>
      <div style={{ ...type(22, 800, { caps: true }), color: C.red, letterSpacing: '0.16em' }}>{kicker}</div>
      <div style={{ ...type(40, 850), color: C.ink, marginTop: 6, whiteSpace: 'nowrap' }}>{text}</div>
    </div>
  );
};

// Speed lines: the last panel pops in once (comic "impact"), radiating from the lens glass center, fading out quickly
const SpeedLines: React.FC<{ f: number; at: number; cx: number; cy: number }> = ({ f, at, cx, cy }) => {
  const t = (f - at) / 12;
  if (t < 0 || t > 1) return null;
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: 1 - EASE.out(t) }}>
      {Array.from({ length: 40 }, (_, i) => {
        const h = Math.sin(i * 91.7) * 43758.5;
        const r = h - Math.floor(h);
        const a = (i / 40) * Math.PI * 2 + r * 0.1;
        const r0 = 470 + r * 160 + t * 120;
        return <line key={i} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={cx + Math.cos(a) * 1300} y2={cy + Math.sin(a) * 1300}
          stroke={i % 3 ? C.cream : C.red} strokeWidth={2 + r * 4} strokeOpacity={0.5} />;
      })}
    </svg>
  );
};

const Headline: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ position: 'absolute', left: 120, top: 300, color: C.cream }}>
    <div style={{ opacity: ramp(f, TITLE - 2, 10, EASE.out) }}>
      <ShortKitWordmark size={30} markScale={1.7} gap={16} tone="dark" color={C.cream} />
    </div>
    <div style={{ ...type(150, 850), marginTop: 26, lineHeight: 0.98 }}>
      <TextReveal text={'Craft\nthe shot.'} by="line" variant="rise" start={TITLE} each={20} gap={6}
        unitStyle={(i) => (i === 1 ? { color: C.cream } : {})} />
    </div>
    <div style={{ ...type(38, 500), color: C.cream2, marginTop: 34, maxWidth: 640 }}>
      <TextReveal text="Three angles, cut on the beat." by="word" variant="blur" start={TITLE + 14} each={14} gap={3} />
    </div>
  </div>
);

export const ComicPanelSplit: React.FC = () => {
  const f = useCurrentFrame();
  const focus = focusAt(f);
  const aperture = apertureAt(f);

  // ===== Poster: after the eat-screen completes the mask comes off, leaving only the lens camera position + title =====
  if (f >= EXP1) {
    return (
      <AbsoluteFill style={{ background: C.bg2, overflow: 'hidden' }}>
        <PanelBg lx={CAM_END.cx} ly={540} />
        <Shot id="end" cam={cam3At(f)} focus={focus} aperture={aperture} />
        {/* Darken the left side to leave a clean ink base for the title */}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${alpha(C.bg2, 0.92)} 0%, ${alpha(C.bg2, 0.6)} 34%, ${alpha(C.bg2, 0)} 52%)` }} />
        <Headline f={f} />
        <Vignette strength={0.5} inner={0.45} color="#050102" />
        <Grain opacity={0.08} blend="soft-light" />
      </AbsoluteFill>
    );
  }

  // ===== Opening: full-screen 3/4 side shot =====
  if (f < SPLIT) {
    const push = ramp(f, 0, SPLIT, EASE.linear);
    return (
      <AbsoluteFill style={{ background: C.bg2, overflow: 'hidden' }}>
        <PanelBg lx={1100} ly={520} />
        <Shot id="open" cam={{ ...CAM_OPEN, s: CAM_OPEN.s * (1 + 0.04 * push) }} tilt={38} focus={focus} aperture={aperture} />
        <Vignette strength={0.5} inner={0.45} color="#050102" />
        <Grain opacity={0.08} blend="soft-light" />
      </AbsoluteFill>
    );
  }

  // ===== Panels + eat-screen =====
  const hold = ramp(f, HOLD0, EXP0 - HOLD0, EASE.smooth);
  const e = edgeAt(f);
  const seamV = velocity(edgeAt, f);
  const contentV = velocity(cam3X, f);
  const cut = (k: number) => SPLIT + k * BEAT;

  const panels = [
    { clip: `polygon(0px 0px, ${B1 - HALF}px 0px, ${B1 - SLANT - HALF}px 1080px, 0px 1080px)`, ox: 330,
      bg: { lx: 380, ly: 560 }, shot: <Shot id="p1" cam={{ ...CAM1, s: CAM1.s * (1 + 0.035 * hold) }} tilt={38} focus={focus} aperture={aperture} /> },
    { clip: `polygon(${B1 + HALF}px 0px, ${B2 - HALF}px 0px, ${B2 - SLANT - HALF}px 1080px, ${B1 - SLANT + HALF}px 1080px)`, ox: 962,
      bg: { lx: 1000, ly: 900 }, shot: <Shot id="p2" cam={{ ...CAM2, s: CAM2.s * (1 + 0.03 * hold) }} focus={focus} aperture={aperture} /> },
    { clip: `polygon(${e + HALF}px 0px, 1920px 0px, 1920px 1080px, ${e - SLANT + HALF}px 1080px)`, ox: 1610,
      bg: { lx: 1640, ly: 540 }, shot: <Shot id="p3" cam={cam3At(f)} focus={focus} aperture={aperture} /> },
  ];

  // One slanted cut: chops from top to bottom over 3f (paper core + ink edge + a soft shadow)
  const seam = (x: number, at: number, key: string) => {
    const d = ramp(f, at - 1, 3, EASE.out);
    if (d <= 0) return null;
    const y2 = -20 + 1120 * d;
    const x2 = x - SLANT * ((y2 + 20) / 1080);
    return (
      <g key={key}>
        <line x1={x + 4} y1={-20} x2={x2 + 4} y2={y2} stroke="rgba(0,0,0,0.55)" strokeWidth={34} filter="url(#seamSoft)" />
        <line x1={x} y1={-20} x2={x2} y2={y2} stroke={C.ink} strokeWidth={2 * HALF + 2} />
        <line x1={x} y1={-20} x2={x2} y2={y2} stroke={C.cream} strokeWidth={2 * HALF - 7} />
      </g>
    );
  };
  const capOut = 1 - ramp(f, EXP0 + 1, 6, EASE.exit);

  return (
    <AbsoluteFill style={{ background: C.ink, overflow: 'hidden' }}>
      {/* The split original frame: areas not yet popped in remain the darkened opening wide shot, reading as "cutting this picture into panels, one blade at a time" */}
      {f < cut(2) + 2 && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <PanelBg lx={1100} ly={520} />
          <Shot id="under" cam={{ ...CAM_OPEN, s: CAM_OPEN.s * 1.04 }} tilt={38} focus={focus} aperture={aperture} />
          <div style={{ position: 'absolute', inset: 0, background: C.ink, opacity: 0.72 }} />
        </div>
      )}
      {panels.map((p, i) => {
        if (f < cut(i)) return null; // hard cut: not rendered before the beat point
        const pop = ramp(f, cut(i), POP, EASE.snappy);
        const flash = 1 - ramp(f, cut(i), 4, EASE.out);
        return (
          <div key={i} style={{
            position: 'absolute', inset: 0, overflow: 'hidden', clipPath: p.clip, zIndex: i === 2 ? 3 : 1,
            transform: `scale(${mix(1.07, 1, pop).toFixed(4)})`, transformOrigin: `${p.ox}px 540px`,
          }}>
            <PanelBg lx={p.bg.lx} ly={p.bg.ly} />
            {i === 2 ? <SpeedBlur vx={contentV} amount={0.14} max={20}>{p.shot}</SpeedBlur> : p.shot}
            {i === 2 && <SpeedLines f={f} at={cut(2)} cx={CAM3.cx} cy={540} />}
            {flash > 0.01 && <div style={{ position: 'absolute', inset: 0, background: C.cream, opacity: 0.55 * flash }} />}
            {/* Caption boxes live inside the panels: they are covered together when the last panel eats the screen (the last panel own box fades out at the eat-screen start) */}
            {i === 0 && <Caption f={f} at={cut(0) + CAP} x={88} y={96} kicker="Shot 01 · Wide" text="Frame motion." tilt={-2} />}
            {i === 1 && <Caption f={f} at={cut(1) + CAP} x={800} y={810} kicker="Shot 02 · Close" text="0.3 m → ∞" tilt={1.5} />}
            {i === 2 && <div style={{ position: 'absolute', inset: 0, opacity: capOut }}>
              <Caption f={f} at={cut(2) + CAP} x={92} y={96} kicker="Shot 03 · Macro" text="f/1.2" tilt={-1.5} anchor="right" />
            </div>}
          </div>
        );
      })}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none' }}>
        <defs><filter id="seamSoft" x="-50%" y="-10%" width="200%" height="120%"><feGaussianBlur stdDeviation="8" /></filter></defs>
        {e > B1 + HALF && seam(B1, cut(1), 's1')}
      </svg>
      <div style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none' }}>
        <SpeedBlur vx={seamV} amount={0.1} max={18}>
          <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            {f < EXP0 ? seam(B2, cut(2), 's2') : seam(e, cut(2), 's2')}
          </svg>
        </SpeedBlur>
      </div>
      <Vignette strength={0.5} inner={0.45} color="#050102" style={{ zIndex: 7 }} />
      <Grain opacity={0.08} blend="soft-light" style={{ zIndex: 8 }} />
    </AbsoluteFill>
  );
};
