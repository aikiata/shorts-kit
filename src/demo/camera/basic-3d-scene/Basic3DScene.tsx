// basic-3d-scene: impress.js-style spatial stepping (second redesign)
// Technique unchanged: cards are scattered in 3D space (each with x·y·z + rotation + scale), the camera flies by taking the inverse of each station's pose to align,
// and the last station pulls back into an OVERVIEW. The core recipe is camera = stepTransform.inverse().
//
// Design decisions
// - look: graphite (near-monochrome dark field, white as emphasis, champagne gold only as an accent), like a spatial narrative of "three chapters" at a keynote.
//   The product is shorts-kit, and the three stations = three chapters split from the brand phrase: Frame / Craft / Ship,
//   and the overview station is the brand end card "Craft the shot." (logo + wordmark as the eyebrow).
// - cards are posters designed for the shot, not small UIs: laid out natively 1:1 at 1240×700 (on alignment the screen shows native pixels,
//   not scaled up through DesignStage, so text isn't blurry), 150px title + 44px description + a 420px light-weight big chapter number (cropped by the card edge for an editorial feel).
// - sense of space: 70 real 3D dust motes are scattered in the world (each with a z, giving real parallax as the camera flies/turns); non-current cards defocus and darken by "station distance";
//   mid-flight the camera additionally pulls back ~30% (hop) so the viewer sees that "there are other cards in the space", then pushes in to land.
// - while resting at each station a gold progress line at the card's bottom fills up (like a slide timer), so the resting segment isn't a dead frame; 8f before landing the title rises word by word from below the line,
//   each card is revealed only once, and afterwards stays in the read state in the overview.
// - motion blur: flight segments use time sampling (shutter 0.5f, 3–8 sub-frames adaptive to camera displacement), the resting segments cost nothing.
//
// Timeline (30fps, 225f = 7.5s)
//   0–36    station 1 Capture: the camera pushes slowly into place from 1.06x distance (snappy 30f); title rises word by word from 2f; progress line fills
//   36–64   flight 1→2 (28f): move right + world turns left 38°, hop pull-back 30% en route
//   64–96   station 2 Connect rest 32f
//   96–128  flight 2→3 (32f): the frame lying on its side by 90° is righted: the longest segment, the viewer must understand that "the world is turning"
//   128–158 station 3 Ship rest 30f
//   158–190 flight 3→overview (32f): camera pulls back by 1/2.7, the three cards and the brand end card share the frame
//   184–212 end card: eyebrow tracking tightens → "Craft the shot." rises word by word → subline fades in
//   206–224 hold: very slow push in 1.5%, the last frame is a complete poster
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, FONT, bezier, mix, ramp } from '../../../shared/fixtures/Polish';
import { LOOKS, SERIF, Stage, TextReveal, alpha, type } from '../../../shared/fixtures/Look';
import { BRAND, ShortKitMark } from '../../../shared/fixtures/Brand';

export const BASIC_3D_SCENE_DURATION = 225; // 7.5s @30fps

const L = LOOKS.graphite;
const GOLD = L.accent2;
const CW = 1240; // native card size (1:1 on screen when aligned)
const CH = 700;
const PERSP = 2600;

type Pose = { x: number; y: number; z: number; rx: number; ry: number; rz: number; s: number };
// per station: the card's own pose (the camera takes its inverse). Station 2 world turns left 38°, station 3 frame lies on its side 90°, overview s=2.7 pulls back
const POSES: Pose[] = [
  { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1 },
  { x: 1690, y: -260, z: -650, rx: 0, ry: -38, rz: 0, s: 1 },
  { x: 2590, y: 830, z: -850, rx: 0, ry: 0, rz: 90, s: 1 },
  { x: 594, y: 480, z: -400, rx: 0, ry: 0, rz: 0, s: 2.7 },
];
const CHAPTERS = [
  { no: '01', kicker: 'Frame', title: 'Frame.', body: 'Real page captures, staged for the camera.' },
  { no: '02', kicker: 'Craft', title: 'Craft.', body: 'Shot recipe cards turn moves into code.' },
  { no: '03', kicker: 'Ship', title: 'Ship.', body: 'One prompt to a finished promo.' },
];

// flight schedule (frames): [start, end]
const FLIGHTS: [number, number][] = [[36, 64], [96, 128], [158, 190]];
const ARRIVE = [0, 64, 128, 190]; // landing frame of each station (station 0 is already there at the start)
const HOLD_END = [36, 96, 158, 225];
const FLY_EASE = bezier(0.62, 0, 0.16, 1); // asymmetric in-out: steady start, very soft landing
const HOP = 0.3; // extra pull-back ratio mid-flight between stations

// camera pose (a pure function of the frame, accepts fractional frames: used by motion-blur sub-frame sampling)
const camAt = (f: number) => {
  const cam: Pose = { ...POSES[0] };
  // opening: pushes slowly into place from 1.06x distance (not a dead-frame start)
  cam.s = mix(1.06, 1, ramp(f, 0, 30, EASE.snappy));
  let af = 0; // accumulated flight progress (0..3, fraction = in flight)
  let hop = 0;
  FLIGHTS.forEach(([a, b], i) => {
    const u = ramp(f, a, b - a, FLY_EASE);
    af += u;
    const p = POSES[i + 1];
    (Object.keys(cam) as (keyof Pose)[]).forEach((k) => {
      cam[k] = mix(cam[k], p[k], u);
    });
    if (i < 2 && u > 0 && u < 1) hop = HOP * Math.sin(Math.PI * u);
  });
  cam.s *= 1 + hop;
  // rest segments push in very slowly by 1.5%: eases in after landing, and the next flight start restores it on the same curve (the frame stays alive but doesn't sway)
  let creep = 0;
  for (let i = 0; i < 3; i++) {
    creep += ramp(f, ARRIVE[i] + 4, HOLD_END[i] - ARRIVE[i], EASE.smooth) * (1 - ramp(f, FLIGHTS[i][0], 14, EASE.smooth));
  }
  cam.s *= 1 - 0.015 * creep;
  // after the overview settles, very slow push in 1.5% (the hold segment stays alive, doesn't sway)
  cam.s *= 1 - 0.015 * ramp(f, 196, 29, EASE.smooth);
  return { cam, af };
};

const camTransform = (c: Pose) =>
  `scale(${(1 / c.s).toFixed(5)}) rotateZ(${(-c.rz).toFixed(4)}deg) rotateY(${(-c.ry).toFixed(4)}deg) rotateX(${(-c.rx).toFixed(4)}deg) translate3d(${(-c.x).toFixed(3)}px,${(-c.y).toFixed(3)}px,${(-c.z).toFixed(3)}px)`;
const poseTransform = (p: Pose) =>
  `translate3d(${p.x}px,${p.y}px,${p.z}px) rotateX(${p.rx}deg) rotateY(${p.ry}deg) rotateZ(${p.rz}deg) scale(${p.s})`;

const hash = (n: number) => {
  const x = Math.sin(n * 91.345 + 47.853) * 43758.5453;
  return x - Math.floor(x);
};
// real 3D dust motes in the world: positions fixed in world coordinates, all parallax comes from the camera
const MOTES = Array.from({ length: 70 }, (_, i) => ({
  x: -2600 + hash(i * 3.1) * 6800,
  y: -2000 + hash(i * 5.7 + 1) * 4800,
  z: -3200 + hash(i * 7.3 + 2) * 3600,
  r: 3 + hash(i * 11.9 + 3) * 7,
  a: 0.25 + hash(i * 13.1 + 4) * 0.55,
}));

// ───────── chapter card ─────────
const ChapterCard: React.FC<{ i: number; frame: number; focus: number }> = ({ i, frame, focus }) => {
  const c = CHAPTERS[i];
  const arrive = ARRIVE[i];
  const reveal = arrive - (i === 0 ? -2 : 8); // the title starts rising one beat before landing
  const hold = ramp(frame, arrive, HOLD_END[i] - arrive, EASE.smooth); // progress line
  const numIn = ramp(frame, reveal - 4, 26, EASE.out);
  const bodyIn = ramp(frame, reveal + 8, 18, EASE.out);
  return (
    <div style={{ position: 'absolute', inset: 0, padding: '74px 84px', boxSizing: 'border-box', fontFamily: FONT.sans }}>
      {/* light-weight big chapter number: cropped by the card's right edge (editorial feel), texture layer only */}
      <div style={{
        position: 'absolute', right: -36, bottom: -118, ...type(560, 200), letterSpacing: '-0.06em',
        color: 'transparent', backgroundImage: `linear-gradient(170deg, ${alpha('#ffffff', 0.16)} 10%, ${alpha('#ffffff', 0.02)} 70%)`,
        WebkitBackgroundClip: 'text', backgroundClip: 'text',
        transform: `translateY(${((1 - numIn) * 60).toFixed(1)}px)`, opacity: numIn,
      }}>{c.no}</div>
      {/* eyebrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, ...type(26, 600, { mono: true }), letterSpacing: '0.14em', color: L.ink3, textTransform: 'uppercase' }}>
        <span style={{ color: GOLD }}>{c.no}</span>
        <span style={{ width: 44, height: 1, background: alpha(GOLD, 0.6) }} />
        <span>Chapter · {c.kicker}</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, textTransform: 'none', fontFamily: BRAND.font, fontSize: 28, fontWeight: 700, letterSpacing: '0.03em', color: L.ink2 }}>
          <ShortKitMark size={32} tone="dark" />{BRAND.name}
        </span>
      </div>
      {/* title: rises word by word from below the line */}
      <div style={{ marginTop: 150, ...type(156, 760), color: L.ink }}>
        <TextReveal text={c.title} by="char" variant="rise" start={reveal} each={20} gap={1.8} />
      </div>
      <div style={{
        marginTop: 34, maxWidth: 820, ...type(44, 420), lineHeight: 1.3, color: L.ink2, textWrap: 'balance',
        opacity: bodyIn, transform: `translateY(${((1 - bodyIn) * 18).toFixed(1)}px)`,
      }}>{c.body}</div>
      {/* bottom: three chapter progress segments, the current one fills with gold */}
      <div style={{ position: 'absolute', left: 84, right: 84, bottom: 70, display: 'flex', gap: 14 }}>
        {[0, 1, 2].map((k) => (
          <div key={k} style={{ flex: 1, height: 3, borderRadius: 2, background: alpha('#ffffff', 0.1), overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${(k < i ? 1 : k === i ? hold : 0) * 100}%`,
              background: k === i ? `linear-gradient(90deg, ${alpha(GOLD, 0.7)}, ${GOLD})` : alpha('#ffffff', 0.45),
              boxShadow: k === i ? `0 0 ${10 * focus}px ${alpha(GOLD, 0.6)}` : undefined,
            }} />
          </div>
        ))}
      </div>
    </div>
  );
};

// ───────── overview end card (hangs in the world at the overview station: laid out s times larger, the camera looks back at 1/s = 1:1 on screen) ─────────
const OverviewPlate: React.FC<{ frame: number }> = ({ frame }) => {
  const st = 184;
  const kick = ramp(frame, st, 22, EASE.snappy);
  const sub = ramp(frame, st + 20, 18, EASE.out);
  return (
    <div style={{ position: 'absolute', left: -960, top: -540, width: 1920, height: 1080, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: 120, bottom: 128 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, ...type(24, 600, { mono: true }), letterSpacing: `${mix(0.6, 0.16, kick).toFixed(3)}em`, color: GOLD, opacity: kick, textTransform: 'uppercase' }}>
          <ShortKitMark size={40} tone="dark" />
          <span style={{ textTransform: 'none', fontFamily: BRAND.font, fontSize: 30, fontWeight: 700, letterSpacing: '0.03em', color: L.ink }}>{BRAND.name}</span>
          <span>· Three chapters, one film</span>
        </div>
        <div style={{ marginTop: 26, ...type(150, 400, { serif: true }), letterSpacing: '-0.035em', color: L.ink }}>
          <TextReveal text="Craft the shot." by="word" variant="rise" start={st + 6} each={22} gap={5} />
        </div>
        <div style={{ marginTop: 22, ...type(38, 420), color: L.ink2, opacity: sub, transform: `translateY(${((1 - sub) * 14).toFixed(1)}px)` }}>
          Shot recipes for cinematic product films.
        </div>
      </div>
    </div>
  );
};

// one complete world (given a frame, may be fractional)
const World: React.FC<{ f: number; frame: number }> = ({ f, frame }) => {
  const { cam, af } = camAt(f);
  const over = ramp(f, FLIGHTS[2][0], FLIGHTS[2][1] - FLIGHTS[2][0], EASE.smooth);
  const plateOn = ramp(frame, 176, 16, EASE.out);
  return (
    <div style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, transformStyle: 'preserve-3d', transform: camTransform(cam) }}>
      {MOTES.map((m, k) => (
        <div key={k} style={{
          position: 'absolute', left: -m.r, top: -m.r, width: m.r * 2, height: m.r * 2, borderRadius: '50%',
          transform: `translate3d(${m.x}px,${m.y}px,${m.z}px)`,
          background: `radial-gradient(circle, ${alpha('#f4efe4', m.a)} 0%, ${alpha('#f4efe4', 0)} 70%)`,
        }} />
      ))}
      {CHAPTERS.map((_, i) => {
        const p = POSES[i];
        // enter/exit: defocus and darken by "station distance"; in the overview everything returns to readable (but slightly darkened, to give the end card hierarchy)
        const d = Math.min(1, Math.abs(af - i));
        const focus = Math.max(1 - d, over * 0.85);
        const lift = (1 - d) * 18;
        return (
          <div key={i} style={{
            position: 'absolute', left: -CW / 2, top: -CH / 2, width: CW, height: CH, borderRadius: 34, overflow: 'hidden',
            transform: `${poseTransform(p)} translateZ(${lift.toFixed(2)}px)`,
            background: `radial-gradient(ellipse 80% 90% at 18% 0%, ${alpha('#ffffff', 0.07)} 0%, ${alpha('#ffffff', 0)} 60%), linear-gradient(165deg, #202226 0%, #16171a 55%, #111214 100%)`,
            border: `1.5px solid ${alpha('#ffffff', 0.08 + 0.08 * focus)}`,
            boxShadow: `inset 0 1.5px 0 ${alpha('#ffffff', 0.12)}, 0 30px 80px -10px rgba(0,0,0,0.7), 0 6px 18px rgba(0,0,0,0.5)`,
            opacity: 0.22 + 0.78 * focus,
            filter: focus < 0.985 ? `blur(${((1 - focus) * 7).toFixed(2)}px)` : undefined,
          }}>
            {/* top-edge light line: bright in the middle, fading at both ends */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 2, background: `linear-gradient(90deg, transparent, ${alpha('#ffffff', 0.35 * (0.4 + 0.6 * focus))}, transparent)` }} />
            <ChapterCard i={i} frame={frame} focus={focus} />
          </div>
        );
      })}
      {/* overview end card: at the overview station pose (laid out 2.7x larger), appears only as the last flight starts */}
      <div style={{ position: 'absolute', left: 0, top: 0, transform: poseTransform(POSES[3]), opacity: plateOn }}>
        <OverviewPlate frame={frame} />
      </div>
    </div>
  );
};

// flight-segment time sampling: N sub-frames within a 0.5-frame shutter stack with layer opacity 1/(i+1) = equal-weight average; N adapts to camera displacement
const SHUTTER = 0.5;
const samplesAt = (f: number) => {
  const a = camAt(f).cam, b = camAt(f - SHUTTER).cam;
  const disp = Math.hypot(a.x - b.x, a.y - b.y) / a.s + Math.abs(a.z - b.z) * 0.4
    + (Math.abs(a.ry - b.ry) + Math.abs(a.rz - b.rz)) * 14 + Math.abs(Math.log(a.s / b.s)) * 1400;
  return Math.max(1, Math.min(8, Math.ceil(disp / 5)));
};

export const Basic3DScene: React.FC = () => {
  const frame = useCurrentFrame();
  const flying = FLIGHTS.some(([a, b]) => frame > a && frame < b);
  const n = flying ? samplesAt(frame) : 1;
  return (
    <AbsoluteFill style={{ background: L.bg[2] }}>
      <Stage look={L} keyLight={{ x: 0.5, y: -0.08 }} fill={{ x: 0.85, y: 1.05 }} breathe={0.6} intensity={0.55} />
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        {Array.from({ length: n }, (_, i) => (
          <AbsoluteFill key={i} style={{ perspective: `${PERSP}px`, opacity: 1 / (i + 1) }}>
            <World f={n > 1 ? frame - (SHUTTER * i) / (n - 1) : frame} frame={frame} />
          </AbsoluteFill>
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
