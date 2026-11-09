// letterform-zoom [transition]: the glyphs of a giant chapter title are "windows" that show the next page; the camera pushes in exponentially and drills into
// one stroke, the new page takes over the instant the hole fills the whole screen, and the leftover strokes and cover plate are flung out of frame.
//
// Round 2 redesign (Ember, furnace door):
// - look = ember. The cover plate is a warm-black chapter title card (top light + ember glow behind the letters), with "EDITS" in 560px Black weight cut out as holes;
//   through the holes shows a molten-gold shorts-kit launch page (orange to gold gradient + a sun flare), so the glyphs themselves are the brightest thing in the frame and
//   "there is something in the hole" reads on the very first frame. During the hold the page's text/card layer is fully hidden, leaving only warm gradient and soft light shapes in the holes (read as image,
//   not competing with the two layers of "EDITS" letters); in the middle of the main push, 64-90f, the content fades in from an 18px defocus to focus, already sharp by takeover.
//   A ring of molten light spills from the glyph edges onto the cover plate (blurred stroke, drawn only within the plate area): light leaking out of the holes.
// - Space: cover plate in front, page behind. During the push the plate goes x30 while the page goes only x1.08; the two layers' parallax reads as real depth.
//   In the fast segment, two translucent afterimages of the plate at smaller scales are layered on (radial "zoom trail"), replacing a full-screen realtime blur.
// - Anchor = center of the vertical stroke of "I" (a hole); the stroke is about 106px wide x30 = about 3200px > frame width, so at the end the hole truly fills the whole screen.
// - Aftermath after landing: the render card on the page counts shots 0 to 12, the four shot-duration bars fill staggered (dense first, then sparse),
//   and the "DONE" label pops: after the crossing, the new page is immediately alive, not a dead image.
//
// Timeline (30fps, 150f total):
//   0-26    Setup: title card present (frame 0 already has a picture), eyebrow/subtitle rise, cover plate pushes forward very slowly 1 to 1.03 (building tension)
//   26-34   Anticipation: pull back 2% (anticip)
//   34-86   Main push: scale = 30^u, u follows bezier(0.6,0,0.85,0.5), slow start and steep finish (52f); afterimages + blur from u>0.35
//   64-90   Page content defocus fade-in to focus (18px to 0, EASE.out)
//   76-86   Takeover: scale 14 to 26, cover plate fades out; page exposure +12% flash then falls back
//   86-116  Settle: page keeps pushing forward to 1.08, speed continuous with the end of the main push (quint-out)
//   96-132  Aftermath: count 0 to 12, duration bars fill staggered, DONE label pops
//   132-150 Hold: poster freezes
import React, { useId } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, FONT, Grain, bezier, mix, ramp } from '../../../shared/fixtures/Polish';
import { LOOKS, alpha, springAt, type } from '../../../shared/fixtures/Look';
import { BRAND, ShortKitMark } from '../../../shared/fixtures/Brand';

export const LETTERFORM_ZOOM_DURATION = 150;

const L = LOOKS.ember;
const WORD = 'EDITS';
const FS = 560; // title font size
const BASELINE = 712;
// Push anchor = center of the vertical stroke of "I" (glyph stroke = hole), measured on a rendered frame (scale 1, "EDITS"): stroke x 920-1026, y 316-712.
// It must be re-measured after changing font / word / font size (if the anchor is on the plate, what fills the frame at the end of the push is the plate, and "going through the hole" does not read).
const ORIGIN = { x: 973, y: 515 };
const ZOOM_MAX = 30;
const PUSH0 = 34;
const PUSH1 = 86;
const PAGE_ZOOM = 0.08; // total push amount of the page (background)

const GHOSTS = [
  { lag: 3.2, a: 0.12 },
  { lag: 2.4, a: 0.16 },
  { lag: 1.6, a: 0.22 },
  { lag: 0.8, a: 0.3 },
];

const pushCurve = bezier(0.6, 0, 0.85, 0.5); // slow start, steep finish: the early part lets the viewer see the page in the hole

// Cover plate scale (a pure function of the frame, since afterimages sample different frames)
const plateScale = (f: number) => {
  const creep = 1 + 0.03 * ramp(f, 0, 26, EASE.smooth);
  const inhale = 1 - 0.02 * ramp(f, 26, 8, EASE.smooth) * (1 - ramp(f, PUSH0, 8, EASE.out));
  const u = ramp(f, PUSH0, PUSH1 - PUSH0, pushCurve);
  return creep * inhale * Math.pow(ZOOM_MAX, u);
};

// Page scale: follows at 0.7*u during the main push; after takeover quint-out covers the remaining 30% (speed continuous at the handoff)
const pageScale = (f: number) => {
  const u = ramp(f, PUSH0, PUSH1 - PUSH0, pushCurve);
  const P = f <= PUSH1 ? 0.7 * u : 0.7 + 0.3 * ramp(f, PUSH1, 30, EASE.out);
  return 1 + PAGE_ZOOM * P;
};

const titleFont: React.CSSProperties = { fontFamily: FONT.sans, fontWeight: 900, fontSize: FS, letterSpacing: '-0.02em' };

// ───────────── Background: molten-gold launch page (shorts-kit, render complete) ─────────────
// The four shots = the real frame counts of this repo's four transition demos; bar length = frames / 160
const SHOTS = [
  { code: 'sh01', name: 'Invisible cut', f: 110 },
  { code: 'sh02', name: 'Letterform zoom', f: 150 },
  { code: 'sh03', name: 'Light leak burn', f: 130 },
  { code: 'sh04', name: 'Versus slam', f: 105 },
];
const INK = '#1c0a02'; // ink color on the molten-gold base (near-black with a warm hue)

// Page content "defocus to focus": during the title card hold the content layer is fully hidden, and only warm gradient and flares show through the glyph holes (read as image/texture,
// not competing with "EDITS"); in the middle of the main push, 64-90f, the content fades in from an 18px defocus and comes into focus, already sharp and readable at takeover.
const REVEAL0 = 64;
const REVEAL_DUR = 26;

const NextPage: React.FC<{ frame: number }> = ({ frame }) => {
  const reveal = ramp(frame, REVEAL0, REVEAL_DUR, EASE.out);
  const defocus = 18 * (1 - reveal);
  const count = Math.round(12 * ramp(frame, 96, 30, EASE.snappy));
  const live = springAt(frame, 124, { damping: 15, stiffness: 240 });
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {/* Molten-gold gradient: gold at top left, orange in the middle, deep red at bottom right, with a sun flare on the right sitting behind the deploy card */}
      <AbsoluteFill style={{ background: 'linear-gradient(128deg, #ffcf5a 0%, #ff9a3c 34%, #ff6b2c 62%, #c2370e 100%)' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(circle 520px at 1450px 540px, rgba(255,236,170,0.75) 0%, rgba(255,200,110,0.25) 45%, rgba(255,160,80,0) 72%)' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 70% 60% at 20% 100%, rgba(120,20,0,0.35) 0%, rgba(120,20,0,0) 70%)' }} />
      {/* Defocus-phase light shapes: a blob of creamy-white soft light where the deploy card is, a smear of dark red in the title area; the glyph holes show only "light and shape", no text */}
      <AbsoluteFill style={{
        opacity: 1 - reveal,
        background: 'radial-gradient(ellipse 380px 340px at 1390px 580px, rgba(255,246,228,0.55) 0%, rgba(255,240,220,0) 100%), ' +
          'radial-gradient(ellipse 520px 260px at 560px 500px, rgba(110,25,0,0.22) 0%, rgba(110,25,0,0) 100%)',
      }} />

      {/* Content layer: hidden during hold, defocus fade-in then focus in the middle of the main push */}
      {reveal > 0 && (
      <AbsoluteFill style={{ opacity: reveal, filter: defocus > 0.05 ? `blur(${defocus.toFixed(2)}px)` : undefined }}>
      {/* Navigation */}
      <div style={{ position: 'absolute', left: 200, right: 230, top: 122, display: 'flex', alignItems: 'center', color: INK }}>
        {/* App icon: ink rounded-square base + reversed-out shot-engraving mark */}
        <div style={{ width: 46, height: 46, borderRadius: 13, background: INK, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShortKitMark size={34} tone="dark" />
        </div>
        <div style={{ fontFamily: BRAND.font, fontSize: 34, fontWeight: 700, letterSpacing: '0.03em', marginLeft: 16 }}>{BRAND.name}</div>
        <div style={{ flex: 1 }} />
        {['Shots', 'Workbench', 'Gallery'].map((s) => (
          <div key={s} style={{ ...type(28, 550), marginLeft: 48, opacity: 0.72 }}>{s}</div>
        ))}
        <div style={{ ...type(28, 650), marginLeft: 48, padding: '14px 28px', borderRadius: 999, background: INK, color: '#ffe7c4' }}>Render</div>
      </div>

      {/* Main title area */}
      <div style={{ position: 'absolute', left: 200, top: 312, width: 860, color: INK }}>
        <div style={{ ...type(26, 750, { caps: true }), letterSpacing: '0.2em', opacity: 0.62 }}>Launch film · Final cut</div>
        <div style={{ ...type(140, 820), letterSpacing: '-0.05em', lineHeight: 0.92, marginTop: 30 }}>
          Every shot.<br />One prompt.
        </div>
        <div style={{ ...type(40, 480), lineHeight: 1.3, marginTop: 40, opacity: 0.78, width: 720 }}>
          Storyboard, animate, sound-design and deliver — cut to the beat.
        </div>
      </div>

      {/* Render card: creamy-white frosted glass (bright surface, so the whole card is bright through the glyph holes) + top inner highlight + two layers of warm shadow */}
      <div style={{
        position: 'absolute', left: 1070, top: 282, width: 640, height: 600, borderRadius: 32,
        background: 'linear-gradient(180deg, rgba(255,250,242,0.94) 0%, rgba(255,240,224,0.88) 100%)',
        border: `1px solid ${alpha('#ffffff', 0.7)}`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.9), 0 6px 14px rgba(110,30,0,0.18), 0 50px 100px -24px rgba(120,30,0,0.45)`,
        padding: '40px 48px', boxSizing: 'border-box', color: INK,
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ ...type(26, 500, { mono: true }), color: alpha(INK, 0.55) }}>launch-film.mp4</div>
          <div style={{ flex: 1 }} />
          <div style={{
            ...type(22, 750, { caps: true }), letterSpacing: '0.16em', padding: '8px 16px', borderRadius: 999,
            background: INK, color: '#ffd46a', display: 'flex', alignItems: 'center', gap: 10,
            transform: `scale(${mix(0.6, 1, live).toFixed(4)})`, opacity: Math.min(1, live * 1.5),
          }}>
            <div style={{ width: 10, height: 10, borderRadius: 5, background: '#ffb02e', boxShadow: '0 0 10px #ffb02e' }} />
            Done
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 34 }}>
          <div style={{ ...type(132, 820), letterSpacing: '-0.05em', width: 168, textAlign: 'right' }}>{count}</div>
          <div style={{ ...type(60, 650), color: alpha(INK, 0.32), marginLeft: 14 }}>/12</div>
          <div style={{ ...type(32, 520), color: alpha(INK, 0.6), marginLeft: 22 }}>shots rendered</div>
        </div>
        <div style={{ marginTop: 34 }}>
          {SHOTS.map((r, i) => {
            const fill = ramp(frame, 100 + [0, 4, 10, 18][i], 22, EASE.snappy);
            const on = fill > 0.02;
            return (
              <div key={r.code} style={{ marginTop: i ? 22 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                  <div style={{ ...type(30, 650) }}>{r.name}</div>
                  <div style={{ ...type(22, 500, { mono: true }), color: alpha(INK, 0.4), marginLeft: 14 }}>{r.code}</div>
                  <div style={{ flex: 1 }} />
                  <div style={{ ...type(30, 600, { mono: true }), color: alpha(INK, on ? 0.9 : 0.3) }}>{on ? `${r.f}f` : '—'}</div>
                </div>
                <div style={{ marginTop: 10, height: 6, borderRadius: 3, background: alpha(INK, 0.08), overflow: 'hidden' }}>
                  <div style={{ width: `${(fill * (r.f / 1.6)).toFixed(2)}%`, height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${L.accent}, #ffb02e)` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </AbsoluteFill>
      )}
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
};

// ───────────── Foreground: warm-black cover plate with glyph holes cut out ─────────────
const Plate: React.FC<{ scale: number; id: string; ghost?: boolean; blur?: number; intro?: number }> = ({ scale, id, ghost, blur = 0, intro = 1 }) => {
  const k = 1 / scale; // stroke width / blur radius compensated by scale, so it looks constant during the push
  return (
    <div style={{
      position: 'absolute', inset: 0, transform: `scale(${scale.toFixed(5)})`, transformOrigin: `${ORIGIN.x}px ${ORIGIN.y}px`,
      filter: blur > 0.05 ? `blur(${(blur * k).toFixed(3)}px)` : undefined,
    }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <radialGradient id={`${id}g`} cx="50%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#2a1810" />
            <stop offset="45%" stopColor="#150b07" />
            <stop offset="100%" stopColor="#080403" />
          </radialGradient>
          <mask id={`${id}m`} maskUnits="userSpaceOnUse" x={-200} y={-200} width={2320} height={1480}>
            <rect x={-200} y={-200} width={2320} height={1480} fill="#fff" />
            <text x={960} y={BASELINE} textAnchor="middle" fill="#000" style={titleFont}>{WORD}</text>
          </mask>
          {!ghost && (
            <filter id={`${id}f`} x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur stdDeviation={(16 * k).toFixed(3)} />
            </filter>
          )}
        </defs>
        <g mask={`url(#${id}m)`}>
          <rect x={-200} y={-200} width={2320} height={1480} fill={`url(#${id}g)`} />
          {!ghost && (
            <>
              {/* Molten light spill: the blurred orange stroke is drawn only on the plate: light leaking from the glyph holes onto the plate edge */}
              <text x={960} y={BASELINE} textAnchor="middle" fill="none" stroke={L.accent} strokeWidth={22 * k}
                opacity={0.55} filter={`url(#${id}f)`} style={titleFont}>{WORD}</text>
              {/* Lit edge of the cutout: 1.5px warm white, reads as the plate having thickness */}
              <text x={960} y={BASELINE} textAnchor="middle" fill="none" stroke="#ffd9b0" strokeWidth={3 * k}
                opacity={0.5} style={titleFont}>{WORD}</text>
            </>
          )}
        </g>
      </svg>
      {!ghost && (
        <>
          <div style={{
            position: 'absolute', left: 0, right: 0, top: 196, textAlign: 'center', color: L.accent,
            ...type(30, 750, { caps: true }), letterSpacing: `${mix(0.8, 0.42, intro).toFixed(3)}em`, opacity: intro,
          }}>Chapter 02</div>
          <div style={{
            position: 'absolute', left: 0, right: 0, top: 790, textAlign: 'center', color: L.ink2, ...type(44, 480),
            opacity: intro, transform: `translateY(${((1 - intro) * 24).toFixed(2)}px)`,
          }}>
            Your product, in motion.
          </div>
        </>
      )}
    </div>
  );
};

export const LetterformZoom: React.FC = () => {
  const frame = useCurrentFrame();
  const id = `lfz${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const s = plateScale(frame);
  const u = ramp(frame, PUSH0, PUSH1 - PUSH0, pushCurve);
  const plateOpacity = 1 - ramp(s, 14, 12, EASE.linear);
  const blur = 20 * ramp(u, 0.35, 0.65, EASE.swift); // desired visual blur (px), compensated by scale inside the component
  const ghostK = ramp(u, 0.5, 0.2, EASE.out) * plateOpacity;

  // Eyebrow letter-spacing tightens / subtitle rises (the title card is already there at frame 0, text enters over 2-18f)
  const intro = ramp(frame, 2, 16, EASE.snappy);
  // Page exposure flashes at the instant of takeover: +12%, then falls back
  const expo = 1 + 0.12 * ramp(frame, 76, 8, EASE.out) * (1 - ramp(frame, 86, 14, EASE.smooth));
  const ps = pageScale(frame);
  // Background parallax drift: the page drifts left 28px half a beat slower than the plate, so the content in the holes is "moving", reading as depth rather than a pasted texture
  const drift = 28 * (1 - ramp(frame, 0, 100, EASE.smooth));

  return (
    <AbsoluteFill style={{ background: L.bg[2], overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0, transform: `translateX(${drift.toFixed(2)}px) scale(${ps.toFixed(5)})`, transformOrigin: `${ORIGIN.x}px ${ORIGIN.y}px`,
        filter: expo > 1.002 ? `brightness(${expo.toFixed(3)})` : undefined,
      }}>
        <NextPage frame={frame} />
      </div>

      {plateOpacity > 0 && (
        <div style={{ position: 'absolute', inset: 0, opacity: plateOpacity }}>
          {/* Zoom trail: four layers of the plate from 0.8-3.2 frames earlier (smaller scale), with decreasing opacity, stacked into a radial trail */}
          {ghostK > 0.01 && GHOSTS.map((g, i) => (
            <div key={i} style={{ position: 'absolute', inset: 0, opacity: g.a * ghostK }}>
              <Plate scale={plateScale(frame - g.lag)} id={`${id}g${i}`} ghost blur={blur} />
            </div>
          ))}
          <div style={{ position: 'absolute', inset: 0 }}>
            <Plate scale={s} id={id} blur={blur} intro={intro} />
          </div>
        </div>
      )}
      {/* Stage grain during the title card phase (after the page takes over, the page brings its own grain) */}
      {plateOpacity > 0 && <Grain opacity={0.08 * plateOpacity} blend="soft-light" />}
    </AbsoluteFill>
  );
};
