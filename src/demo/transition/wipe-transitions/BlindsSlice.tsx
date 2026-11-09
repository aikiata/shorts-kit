// blinds-slice | venetian blinds slices flip in a stagger
// 12 vertical strips of 160px flip from left to right in a stagger; once the wave passes the whole page changes from A to B.
//
// Second-round redesign (paper · page turn of a Swiss-grid magazine):
// - look = paper. The two pages are consecutive pages of a shorts-kit publication (masthead is the shorts-kit wordmark): page A warm white paper + giant ink letters "Frame.",
//   page B full-bleed vermilion + cream giant letters "Craft." (together the brand tagline Frame motion. Craft the shot.). The light/dark and hue contrast makes every blade of the wave readable.
//   Layout uses a 12-column grid (160px per column, hairlines visible): **column = blade**, the blinds turn the page along the layout grid, form and technique are isomorphic.
// - True 3D blades: each blade is a preserve-3d double-sided panel (front = A slice, back = B slice, backface hidden), rotating about its own vertical axis
//   rotateY 0→180°, sharing a 1900px perspective: at 90° the blade stands edge-on, revealing the dark slot behind, and the dark band sweeps with the wave.
//   Lighting: the side turned away from the key light darkens by sin(θ), the side turned toward it catches a highlight at ~35° (clipped inside the blade, Q4); thin lit line on blade edges.
// - Rhythm: each blade flips with a physical spring (damping 13 / stiffness 75: ~13f to 180°, ≈5° overshoot then settle, like a real blade slapping into place);
//   start staggered by t^0.78 (interval 3.4f → 2.1f, sparse then dense, the wave flips faster and faster, 4–5 blades turning at once); during the wave the camera pushes in very slightly 1→1.02 then returns to 1.
// - After the wave completes the mask is removed (3D structure fully unmounted, page B straight out with sharp text), then a thin cream line at the top of page B draws left to right and the page number jumps to 02.
//
// Timeline (30fps, 132f total):
//   0–24    A page hold (camera 1→1.006 very slow push, picture not dead)
//   24–52   start: blade i starts flipping at frame 24 + stagger(i, 12, 28, t^0.78) (sparse then dense)
//   24–~76  flip: each blade settles in ~13f by spring, ≈5° overshoot then settle; dark slot sweeps with the wave
//   ~80     mask removal: after the last blade spring converges (|θ−180°|<0.3° for 4 consecutive frames), page B straight out
//   82–102  aftershock: masthead thin line redrawn (snappy), camera returns to 1 over 60–94f
//   102–132 hold
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, FONT, Grain, Vignette, ramp } from '../../../shared/fixtures/Polish';
import { LOOKS, alpha, springAt, stagger, type } from '../../../shared/fixtures/Look';
import { ShortKitWordmark } from '../../../shared/fixtures/Brand';

export const BLINDS_SLICE_DURATION = 132;

const L = LOOKS.paper;
const STRIPS = 12;
const W = 160; // 12 × 160 = 1920 (= 12 layout columns)
const WAVE0 = 24;
const SPAN = 28; // total stagger span of the starts
// t^0.78: interval shrinks from ~3.4f to ~2.1f, the wave flips faster and faster, but no idle wait after the first blade (EASE.out first interval of 9f drags too much)
const startOf = (i: number) => WAVE0 + stagger(i, STRIPS, SPAN, (t) => Math.pow(t, 0.78));
const angleOf = (f: number, i: number) => {
  const s = startOf(i);
  return f < s ? 0 : 180 * springAt(f, s, { damping: 13, stiffness: 75 });
};
// Mask-removal frame: after the last blade spring converges (|θ-180| < 0.3°)
const UNMASK = (() => {
  for (let f = startOf(STRIPS - 1); f < 200; f++) {
    let ok = true;
    for (let k = 0; k < 4; k++) if (Math.abs(angleOf(f + k, STRIPS - 1) - 180) > 0.3) ok = false;
    if (ok) return f;
  }
  return 80;
})();

const RED = '#e5432d';
const CREAM = '#fffaf3';

// ───────────── Two-page layout ─────────────
type PageProps = { mark: 'dark' | 'light'; bg: string; ink: string; sub: string; accent: string; line: string; chapter: string; word: string; dot: string; body: string; page: string; rule?: number };

const Page: React.FC<PageProps> = ({ mark, bg, ink, sub, accent, line, chapter, word, dot, body, page, rule = 1 }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, background: bg, overflow: 'hidden' }}>
    {/* 12-column grid hairlines */}
    {Array.from({ length: STRIPS - 1 }, (_, i) => (
      <div key={i} style={{ position: 'absolute', left: (i + 1) * W, top: 0, bottom: 0, width: 1, background: line }} />
    ))}
    {/* Masthead */}
    <div style={{ position: 'absolute', left: 96, right: 96, top: 92, display: 'flex', alignItems: 'baseline', color: ink }}>
      {/* Masthead wordmark: shorts-kit (all lowercase); the mark takes its tone from the page background */}
      <div style={{ width: 480, alignSelf: 'center' }}>
        <ShortKitWordmark size={30} markScale={1.6} gap={14} tone={mark} color={ink} />
      </div>
      <div style={{ ...type(28, 500), color: sub, flex: 1 }}>Shot Recipe Journal</div>
      <div style={{ ...type(26, 500, { mono: true }), color: sub }}>Nº 07 — 2026</div>
    </div>
    <div style={{ position: 'absolute', left: 96, right: 96, top: 152, height: 2, background: ink, transform: `scaleX(${rule})`, transformOrigin: '0 50%' }} />
    {/* Top right: chapter + body text (falls in columns 8–12) */}
    <div style={{ position: 'absolute', left: 7 * W, top: 250, width: 4 * W + 40, color: ink }}>
      <div style={{ ...type(28, 800, { caps: true }), letterSpacing: '0.2em', color: accent }}>{chapter}</div>
      <div style={{ ...type(52, 560), lineHeight: 1.14, letterSpacing: '-0.025em', marginTop: 26, whiteSpace: 'pre-line' }}>{body}</div>
    </div>
    {/* Giant letters: from column 1 (bottom margin leaves room for the descenders of the original "Rhythm") */}
    <div style={{
      position: 'absolute', left: 84, bottom: 156, color: ink, fontFamily: FONT.sans, fontSize: 400, fontWeight: 850,
      letterSpacing: '-0.065em', lineHeight: 0.8, whiteSpace: 'nowrap',
    }}>
      {word}<span style={{ color: dot }}>.</span>
    </div>
    <div style={{ position: 'absolute', right: 96, bottom: 168, color: sub, ...type(28, 500, { mono: true }) }}>{page}</div>
  </div>
);

const PageA: React.FC = () => (
  <Page mark="light" bg="#f3eee4" ink={L.ink} sub={L.ink2} accent={RED} line={alpha(L.ink, 0.07)} chapter="Chapter 01"
    word="Frame" dot={RED} body={"Shot recipes for\ncinematic product films."} page="01 / 02" />
);
const PageB: React.FC<{ rule?: number }> = ({ rule }) => (
  <Page mark="dark" bg={RED} ink={CREAM} sub={alpha(CREAM, 0.72)} accent={L.ink} line={alpha(CREAM, 0.13)} chapter="Chapter 02"
    word="Craft" dot={L.ink} body={"Direct the film.\nLet the agent shoot it."} page="02 / 02" rule={rule} />
);

// One blade slice: outer layer 160 wide clips, inner layer offsets the full page negatively to align
const Slice: React.FC<{ x: number; children: React.ReactNode }> = ({ x, children }) => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: -x, top: 0, width: 1920, height: 1080 }}>{children}</div>
  </div>
);

// Blade face lighting: darkens when facing away from the light + a highlight sweeps by when turning toward the key light (θf = this face rotation from head-on, 0–90°)
const FaceLight: React.FC<{ th: number; lead: 'left' | 'right' }> = ({ th, lead }) => {
  const r = (th * Math.PI) / 180;
  const shade = 0.5 * Math.sin(r);
  const spec = 0.22 * Math.max(0, Math.cos((th - 35) * (Math.PI / 70))) * Math.sin(r * 2 > Math.PI ? Math.PI : r * 2);
  return (
    <>
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(${lead === 'left' ? 90 : 270}deg, rgba(20,12,6,${(shade * 0.7).toFixed(3)}) 0%, rgba(20,12,6,${shade.toFixed(3)}) 100%)`,
      }} />
      {spec > 0.005 && <div style={{ position: 'absolute', inset: 0, background: `rgba(255,248,236,${spec.toFixed(3)})`, mixBlendMode: 'screen' }} />}
      {/* Blade edge lit thin line */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, [lead]: 0, width: 2, background: `rgba(255,250,240,${(0.7 * Math.sin(r)).toFixed(3)})` } as React.CSSProperties} />
    </>
  );
};

export const BlindsSlice: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = 1 + 0.006 * ramp(frame, 0, WAVE0, EASE.smooth)
    + 0.014 * ramp(frame, WAVE0, 26, EASE.smooth) * (1 - ramp(frame, 60, 34, EASE.smooth));
  const rule = frame < UNMASK ? 1 : ramp(frame, UNMASK + 2, 20, EASE.snappy);

  let body: React.ReactNode;
  if (frame < startOf(0)) {
    body = <PageA />;
  } else if (frame >= UNMASK) {
    // Mask removal: page B straight out, masthead thin line redrawn (the "settle" beat after the page turn)
    body = <PageB rule={rule} />;
  } else {
    body = (
      <>
        {/* Dark slot behind blades: the wall revealed when a blade stands edge-on */}
        <AbsoluteFill style={{ background: 'linear-gradient(180deg, #1d1712 0%, #120d0a 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, perspective: 1900, perspectiveOrigin: '50% 50%' }}>
          {Array.from({ length: STRIPS }, (_, i) => {
            const x = i * W;
            const th = angleOf(frame, i);
            const front = th < 90;
            return (
              <div key={i} style={{
                position: 'absolute', left: x, top: 0, width: W, height: 1080, transformStyle: 'preserve-3d',
                transform: `rotateY(${(-th).toFixed(3)}deg)`, transformOrigin: '50% 50%',
              }}>
                {/* Front: A slice */}
                <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', overflow: 'hidden' }}>
                  <Slice x={x}><PageA /></Slice>
                  {front && th > 0.05 && <FaceLight th={th} lead="left" />}
                </div>
                {/* Back: B slice (pre-rotated 180°, so after a full turn it faces front exactly, not mirrored) */}
                <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', overflow: 'hidden', transform: 'rotateY(180deg)' }}>
                  <Slice x={x}><PageB /></Slice>
                  {!front && Math.abs(180 - th) > 0.05 && <FaceLight th={Math.min(90, Math.abs(180 - th))} lead="right" />}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  return (
    <AbsoluteFill style={{ background: L.bg[1], overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${cam.toFixed(5)})`, transformOrigin: '50% 50%' }}>
        {body}
      </div>
      {/* Shared vignette and paper grain: drawn once, shared by both pages (no stacked vignette at the transition seam) */}
      <Vignette strength={0.2} inner={0.5} color={L.shadow} />
      <Grain opacity={0.06} />
    </AbsoluteFill>
  );
};
