// orbit-ring-title-open: ring-of-cards title opening
// Eight 16:9 content cards are evenly spaced at 45° on an ellipse, orbiting at constant speed (card bodies never tilt; depth is expressed only by sin(θ) driving scale,
// z-order, depth of field and light/dark). During the entrance the card content is frozen on its first frame, and everything starts playing once the ring has expanded and settled; the centered title deblurs and sinks in char by char and settles,
// at the moment all keywords are in place a highlighter marker block sweeps in from the left (text over the swept area flips to ink), then the mono sub-line floats up.
//
// Second-round redesign (graphite night, highlighter):
// - look = lime: graphite dark field + fluorescent lime. The marker block turns from a "yellow sticky note" into a highlighter, the only highly saturated block in the dark field,
//   reserved for the keywords "Every move". All eight cards are now dark product cards (deep graphite base + hairlines + top inner highlight),
//   the small animation in each card uses fluorescent green as the only accent, and the text inside cards is texture only (the title is what gets read).
// - The title goes from one 64px line to two tiers: the upper line is 64px secondary grey "Shot cards plan it", the lower line is 156px "Every move" as the hero;
//   when the marker sweeps, two clipped layers flip the text from white to ink (the flip happens in step with the block's leading edge, read as "struck by a highlighter").
// - Space: the elliptical orbit itself is drawn as a very faint hairline ring (traced in on entry), and beyond ±12% scaling for depth,
//   far (upper) cards are further darkened and slightly defocused while near (lower) cards are fully bright and sharp: the ring has a front and back, and the title sits on the focal plane.
//   A dark scrim behind the title makes sure the title always holds when cards pass behind it.
// - Ending: the original ended with the whole line defocusing out as a handoff; the single-shot demo instead stops on a complete poster (the HANDOFF_EXIT switch keeps the exit logic).
//
// Timeline (30fps, 150f total):
//   0-24    ring expands from 0.62 to full radius (snappy) + cards fade in one by one; orbit hairline traces in over 0-30
//   24      all eight cards start playing at once (frozen first frame → normal timeline)
//   10-40   upper line deblurs and sinks in char by char (1f stagger)
//   18-52   lower line large type deblurs and sinks in char by char (2f stagger, heavier and slower)
//   50-64   highlighter marker block sweeps (spring, damping 20), text over the swept area flips to ink
//   60-76   sub-line (logo + shorts-kit + mono code name) floats up
//   76-150  hold: ring keeps orbiting at constant speed + very slow overall push-in of 2.5%; the last 2.5s is a complete poster
import React from 'react';
import { AbsoluteFill, Easing, Freeze, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { EASE, FONT, ramp } from '../../../shared/fixtures/Polish';
import { LOOKS, Stage, alpha, springAt } from '../../../shared/fixtures/Look';
import { BRAND, ShortKitMark } from '../../../shared/fixtures/Brand';

export const ORBIT_RING_TITLE_OPEN_DURATION = 150; // 5s @30fps

const L = LOOKS.lime;
const LIME = L.accent;

// ---- ring ----
const RX = 720; // ellipse semi-major axis
const RY = 380; // ellipse semi-minor axis (RY/RX≈0.53 → reads as a ring seen from above, not a round turntable)
const CW = 400; // card width (16:9)
const CH = 225;
const N = 8;
const ROT_SPEED = 0.3; // rad/s, positive = clockwise
const RING_IN = 24; // f: expand from center to full radius
const RING_SCALE_FROM = 0.62;
const PLAY_START = 24; // f: card content only starts playing after the ring has expanded
const DEPTH_SCALE = 0.12; // near-large far-small amplitude (bottom is near, top is far)

// ---- title ----
const LINE1 = 'Shot cards plan it';
const LINE2 = 'Every move';
const S1 = 64;
const S2 = 156;
const MARKER_AT = 50; // the sweep starts the moment the last char of the lower line is visually in place
// sub-line = shorts-kit logo + lowercase wordmark + mono product code name (no card count: it would go stale)
const KICKER = 'SHOT RECIPE CARDS';
const HANDOFF_EXIT = false; // true = the whole line defocuses and fades out at the end while the ring keeps turning, handing off to the next shot (turn on when joining the next shot in the final cut)
const EXIT_AT = 118;

const SANS = `${FONT.sans.replace('Arial, sans-serif', '')}"PingFang SC", "Hiragino Sans GB", sans-serif`;
const MONO = FONT.mono;
const INK = L.ink;
const DIM = '#8d937f';

// ── placeholder content inside cards (dark product cards, drawn at 960×540 then scaled to card width) ──────────────────
const F = (frame: number, a: number, b: number, ease = Easing.out(Easing.cubic)) =>
  interpolate(frame, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });

const Pad: React.FC<{ children: React.ReactNode; bg?: string }> = ({ children, bg = L.surface }) => (
  <div style={{ position: 'absolute', inset: 0, background: bg, padding: 60, fontFamily: SANS, boxSizing: 'border-box' }}>{children}</div>
);

const T: React.FC<{ size: number; color?: string; weight?: number; mono?: boolean; style?: React.CSSProperties; children: React.ReactNode }> = ({
  size, color = INK, weight = 500, mono, style, children,
}) => (
  <div style={{
    fontSize: size, color, fontWeight: weight, fontFamily: mono ? MONO : SANS,
    letterSpacing: mono ? 0 : size >= 40 ? '-0.035em' : '-0.01em', lineHeight: 1.2, whiteSpace: 'nowrap', ...style,
  }}>{children}</div>
);
const Caps: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = DIM }) => (
  <div style={{ fontSize: 24, fontWeight: 650, letterSpacing: '0.16em', color }}>{children}</div>
);

/** 1 highlighter skim-read */
const TileSweep: React.FC = () => {
  const f = useCurrentFrame();
  const s = F(f, 14, 32, EASE.snappy);
  return (
    <Pad>
      <Caps>RELEASE NOTES · 4.2</Caps>
      <div style={{ position: 'relative', display: 'inline-block', marginTop: 40 }}>
        <div style={{ position: 'absolute', left: -12, right: -12, top: 4, bottom: 0, background: LIME, borderRadius: 4, transformOrigin: 'left center', transform: `scaleX(${s})` }} />
        <T size={58} weight={700} color={s > 0.6 ? L.onAccent : INK} style={{ position: 'relative' }}>Motion, considered.</T>
      </div>
      <T size={30} color={DIM} weight={450} style={{ marginTop: 34 }}>Every card ships with timing, easing</T>
      <T size={30} color={DIM} weight={450} style={{ marginTop: 8 }}>and a validated reference build.</T>
    </Pad>
  );
};

/** 2 metrics + sparkline line draw */
const SPARK = 'M8 118 L118 92 L228 104 L338 56 L448 68 L558 20 L632 34';
const TileMetric: React.FC = () => {
  const f = useCurrentFrame();
  const draw = F(f, 10, 46, EASE.smooth);
  const val = 128 + Math.round(F(f, 8, 40, Easing.out(Easing.quad)) * 84);
  const chip = F(f, 34, 46);
  return (
    <Pad>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <Caps>RENDERS / DAY</Caps>
        <div style={{ fontSize: 24, fontWeight: 650, color: L.onAccent, background: LIME, padding: '4px 12px', borderRadius: 999, opacity: chip, transform: `translateY(${(1 - chip) * 8}px)` }}>+18.4%</div>
      </div>
      <div style={{ fontSize: 140, fontWeight: 700, color: INK, letterSpacing: '-0.045em', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1, fontFamily: SANS }}>{val}</div>
      <svg width={640} height={140} viewBox="0 0 640 140" style={{ marginTop: 8, overflow: 'visible' }}>
        <defs>
          <linearGradient id="orto-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={LIME} stopOpacity={0.28} />
            <stop offset="1" stopColor={LIME} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={`${SPARK} L632 140 L8 140 Z`} fill="url(#orto-area)" opacity={draw} />
        <path d={SPARK} fill="none" stroke="rgba(220,255,170,0.12)" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
        <path d={SPARK} fill="none" stroke={LIME} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
      </svg>
    </Pad>
  );
};

/** 3 vertical step checklist ticked off one by one */
const STEPS = ['Draft the storyboard', 'Pick shot cards', 'Tune easing curves', 'Render & review'];
const TileSteps: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Pad bg={L.surface2}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {STEPS.map((label, i) => {
          const on = F(f, 8 + i * 9, 22 + i * 9);
          const tick = F(f, 12 + i * 9, 22 + i * 9, EASE.overshoot);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
              <div style={{
                width: 46, height: 46, borderRadius: 23, flex: 'none', boxSizing: 'border-box',
                background: on > 0.6 ? LIME : 'transparent', border: on > 0.6 ? 'none' : '3px solid rgba(220,255,170,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width={26} height={26} viewBox="0 0 24 24" style={{ transform: `scale(${tick})` }}>
                  <path d="M5 12.5 L10 17 L19 7.5" fill="none" stroke={L.onAccent} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <T size={38} weight={on > 0.6 ? 600 : 500} color={on > 0.6 ? INK : '#5f6556'}>{label}</T>
            </div>
          );
        })}
      </div>
    </Pad>
  );
};

/** 4 route line draw + landing pin (dark grid map base) */
const ROUTE = 'M40 380 C 200 380 190 210 340 200 C 500 190 500 90 700 70';
const TileRoute: React.FC = () => {
  const f = useCurrentFrame();
  const draw = F(f, 6, 42, EASE.smooth);
  const pin = springAt(f, 36, { damping: 12 });
  const tag = F(f, 42, 54);
  return (
    <Pad bg={L.surface2}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(220,255,170,0.06) 2px, transparent 2px), linear-gradient(90deg, rgba(220,255,170,0.06) 2px, transparent 2px)', backgroundSize: '80px 80px' }} />
      <svg width={848} height={428} viewBox="0 0 848 428" style={{ position: 'relative', overflow: 'visible' }}>
        <path d={ROUTE} fill="none" stroke="rgba(220,255,170,0.14)" strokeWidth={10} strokeLinecap="round" />
        <path d={ROUTE} fill="none" stroke={LIME} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
        <circle cx={40} cy={380} r={14} fill={L.surface2} stroke={LIME} strokeWidth={6} />
        <g transform={`translate(700 70) scale(${pin})`}>
          <circle r={36} fill={alpha(LIME, 0.2)} />
          <circle r={24} fill={LIME} />
          <circle r={9} fill={L.onAccent} />
        </g>
      </svg>
      <div style={{ position: 'absolute', left: 470, top: 64, padding: '10px 18px', borderRadius: 12, background: '#262a20', boxShadow: '0 0 0 2px rgba(220,255,170,0.1), 0 10px 24px rgba(0,0,0,0.4)', opacity: tag, transform: `translateY(${(1 - tag) * 10}px)` }}>
        <T size={28} weight={600}>ETA 12 min</T>
      </div>
    </Pad>
  );
};

/** 5 terminal typing (typing is mechanical constant-speed semantics, characters revealed linearly) */
const TERM = [
  { t: '$ npx remotion render Open', c: '#e8ecdf' },
  { t: '✓ Bundled in 2.1s', c: LIME },
  { t: '  Rendering frames 0–149', c: '#8d937f' },
  { t: '✓ Done → out/open.mp4', c: LIME },
];
const TileTerminal: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Pad bg="#0b0c09">
      <div style={{ display: 'flex', gap: 14, marginBottom: 34 }}>
        {[0.5, 0.3, 0.2].map((o, i) => <div key={i} style={{ width: 20, height: 20, borderRadius: 10, background: `rgba(220,255,170,${o})` }} />)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <T size={30} mono color={LIME}>~/shorts-kit</T>
        {TERM.map((row, i) => {
          const p = F(f, 8 + i * 11, 20 + i * 11, Easing.linear);
          const n = Math.round(row.t.length * p);
          return <T key={i} size={30} mono color={row.c} style={{ height: 37 }}>{row.t.slice(0, n)}</T>;
        })}
      </div>
    </Pad>
  );
};

/** 6 line-art drawing (dot-grid paper base) */
const SKETCH = ['M80 380 L768 380', 'M140 380 L200 90 L648 90 L708 380', 'M280 90 L280 380', 'M500 90 L500 380'];
const TileSketch: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Pad>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(220,255,170,0.14) 2px, transparent 2.5px)', backgroundSize: '40px 40px' }} />
      <svg width={848} height={428} viewBox="0 0 848 428" style={{ position: 'relative' }}>
        {SKETCH.map((d, i) => <path key={`g${i}`} d={d} fill="none" stroke="rgba(220,255,170,0.12)" strokeWidth={7} strokeLinecap="round" />)}
        {SKETCH.map((d, i) => {
          const p = F(f, 6 + i * 10, 24 + i * 10, EASE.smooth);
          return <path key={i} d={d} fill="none" stroke={i === 1 ? LIME : INK} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />;
        })}
      </svg>
    </Pad>
  );
};

/** 7 card shrinks into a capsule (main body yields) */
const TileShrink: React.FC = () => {
  const f = useCurrentFrame();
  const p = F(f, 16, 44, EASE.smooth);
  const cont = F(f, 28, 50);
  return (
    <Pad bg={L.surface2}>
      <div style={{
        position: 'absolute', left: 60, top: 60, width: 840 - 690 * p, height: 420 - 342 * p, borderRadius: 16 + 30 * p,
        background: '#262a20', boxShadow: '0 0 0 2px rgba(220,255,170,0.08), 0 12px 28px rgba(0,0,0,0.35)', overflow: 'hidden',
        display: 'flex', alignItems: p > 0.6 ? 'center' : 'flex-start', justifyContent: p > 0.6 ? 'center' : 'flex-start',
        padding: p > 0.6 ? 0 : 40, boxSizing: 'border-box',
      }}>
        {p <= 0.6 ? (
          <div style={{ opacity: 1 - p / 0.6 }}>
            <Caps>WEEKLY SUMMARY</Caps>
            <T size={46} weight={700} style={{ marginTop: 18 }}>12 shots approved</T>
            <T size={28} color={DIM} weight={450} style={{ marginTop: 10 }}>3 pending review · 1 re-render</T>
          </div>
        ) : (
          <T size={30} weight={600} color={LIME} style={{ opacity: (p - 0.6) / 0.4 }}>Summary</T>
        )}
      </div>
      <div style={{ position: 'absolute', left: 260, top: 150, opacity: cont, transform: `translateX(${(1 - cont) * 24}px)` }}>
        <T size={48} weight={700}>Q3 launch plan</T>
        <T size={28} color={DIM} weight={450} style={{ marginTop: 14 }}>Owner · Studio team</T>
        <T size={28} color={DIM} weight={450} style={{ marginTop: 6 }}>Due Oct 18</T>
      </div>
    </Pad>
  );
};

/** 8 impact text card */
const TileImpact: React.FC = () => {
  const f = useCurrentFrame();
  const p = springAt(f, 8, { damping: 13, mass: 0.7 });
  return (
    <Pad bg="#0f110c">
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        <div style={{ fontSize: 30, fontWeight: 650, color: LIME, letterSpacing: '0.4em', fontFamily: SANS }}>2026 · Q3</div>
        <div style={{ fontSize: 150, fontWeight: 850, letterSpacing: '-0.05em', color: INK, fontFamily: SANS, transform: `scale(${0.72 + p * 0.28})`, opacity: Math.min(1, p) }}>GO LIVE</div>
      </div>
    </Pad>
  );
};

const TILES: React.FC[] = [TileSweep, TileShrink, TileMetric, TileRoute, TileSteps, TileTerminal, TileSketch, TileImpact];

// ── title char by char: displacement only takes the first 1/3, deblur runs the full length (same start, different end = blur-slide feel) ──
const charStyle = (frame: number, at: number, size: number, dur: number): React.CSSProperties => {
  const pMain = ramp(frame, at, dur, EASE.out);
  const pTravel = ramp(frame, at, dur / 3, EASE.out);
  return {
    display: 'inline-block', whiteSpace: 'pre', transformOrigin: '50% 55%', opacity: pMain,
    filter: pMain < 1 ? `blur(${((1 - pMain) * (size / 6)).toFixed(2)}px)` : undefined,
    transform: `translateY(${((1 - pTravel) * size * 0.22).toFixed(2)}px)`,
  };
};

// ── main body ───────────────────────────────────────────────────────────────────
export const OrbitRingTitleOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const ringIn = ramp(frame, 0, RING_IN, EASE.snappy);
  const ringScale = RING_SCALE_FROM + (1 - RING_SCALE_FROM) * ringIn;
  const rot = t * ROT_SPEED;
  const track = ramp(frame, 0, 30, EASE.out);
  const push = 1 + 0.025 * ramp(frame, 40, 110, EASE.smooth); // very slow push-in during the hold

  const marker = Math.min(1.03, springAt(frame, MARKER_AT, { damping: 20, stiffness: 190 }));
  const kickerIn = ramp(frame, 60, 16, EASE.out);
  const exitQ = HANDOFF_EXIT ? ramp(frame, EXIT_AT, 10, EASE.exit) : 0;
  const titleExit: React.CSSProperties = { opacity: 1 - exitQ, filter: exitQ > 0.01 ? `blur(${(exitQ * 6.5).toFixed(2)}px)` : undefined };

  const l1 = Array.from(LINE1);
  const l2 = Array.from(LINE2);
  const line2 = (color: string) => l2.map((ch, j) => <span key={j} style={{ ...charStyle(frame, 18 + j * 2, S2, 32), color }}>{ch}</span>);
  // the marker block is 0.14em wider than the text on each side: position of the block's leading edge in the text box = (m·(W+0.28em) − 0.14em) / W, W ≈ 5.05em
  const edge = Math.min(1, Math.max(0, (Math.min(1, marker) * 5.33 - 0.14) / 5.05));
  const clipR = ((1 - edge) * 100).toFixed(2);
  const clipL = (edge * 100).toFixed(2);

  return (
    <AbsoluteFill style={{ background: L.bg[1], fontFamily: SANS }}>
      <Stage look={L} keyLight={{ x: 0.5, y: 0.0 }} fill={null} intensity={0.5} vignette={0.62}>
        {/* dark scrim behind the title: the title always holds when cards pass behind it */}
        <div style={{ position: 'absolute', left: 360, top: 300, width: 1200, height: 480, background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${alpha('#050604', 0.75)} 0%, ${alpha('#050604', 0)} 70%)` }} />
      </Stage>

      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        {/* elliptical orbit hairline: traced in on entry, gives the ring visible geometry */}
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          <ellipse cx={960} cy={540} rx={RX * ringScale} ry={RY * ringScale} fill="none" stroke={alpha(LIME, 0.16)} strokeWidth={1.5}
            pathLength={1} strokeDasharray="1" strokeDashoffset={1 - track} />
        </svg>

        {TILES.map((Comp, i) => {
          const theta = -Math.PI / 2 + (i * Math.PI * 2) / N + rot;
          const x = 960 + Math.cos(theta) * RX * ringScale;
          const y = 540 + Math.sin(theta) * RY * ringScale;
          const depth = Math.sin(theta); // +1 = bottom of frame (near), −1 = top (far)
          const s = 1 + DEPTH_SCALE * depth;
          const op = ramp(frame, 2 + i * 1.5, 11, EASE.out);
          const grow = 0.9 + 0.1 * op;
          const far = Math.max(0, -depth); // far: darkened + slightly defocused
          const elev = 14 + 12 * depth;
          return (
            <div key={i} style={{
              position: 'absolute', left: x - (CW * s) / 2, top: y - (CH * s) / 2, width: CW * s, height: CH * s,
              borderRadius: 14, overflow: 'hidden', opacity: op, transform: `scale(${grow})`, zIndex: 10 + Math.round(depth * 5),
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px ${L.line}, 0 ${(elev * 0.6).toFixed(1)}px ${(elev * 1.6).toFixed(1)}px rgba(0,0,0,${(0.45 + 0.2 * depth).toFixed(2)})`,
              filter: far > 0.05 ? `blur(${(far * 1.6).toFixed(2)}px)` : undefined,
            }}>
              {/* content inside the card is drawn at 960×540 then scaled to card width, so content components need not know they were shrunk */}
              <div style={{ position: 'absolute', left: 0, top: 0, width: 960, height: 540, transform: `scale(${(CW * s) / 960})`, transformOrigin: 'top left' }}>
                <Freeze frame={Math.max(0, frame - PLAY_START)}>
                  <Comp />
                </Freeze>
              </div>
              {/* depth light and dark: far darkened, near gets a bit of top light */}
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(255,255,255,${(0.04 * Math.max(0, depth)).toFixed(3)}) 0%, rgba(5,6,4,${(0.5 * far).toFixed(3)}) 100%), rgba(5,6,4,${(0.25 * far).toFixed(3)})` }} />
            </div>
          );
        })}

        {/* dark scrim between cards and title (above cards, below text): near cards passing behind the title get darkened, so the text always holds */}
        <div style={{ position: 'absolute', left: 260, top: 250, width: 1400, height: 560, zIndex: 25, background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${alpha('#060705', 0.82)} 0%, ${alpha('#060705', 0.55)} 45%, ${alpha('#060705', 0)} 72%)` }} />

        {/* title: upper line secondary grey, lower line hero large type + highlighter marker */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 336, textAlign: 'center', zIndex: 30, ...titleExit }}>
          <div style={{ fontSize: S1, fontWeight: 500, letterSpacing: '0.02em', color: '#b7bdaa', whiteSpace: 'nowrap', lineHeight: 1 }}>
            {l1.map((ch, i) => <span key={i} style={charStyle(frame, 10 + i, S1, 27)}>{ch}</span>)}
          </div>
          <div style={{ marginTop: 34, display: 'inline-block', position: 'relative', fontSize: S2, fontWeight: 600, letterSpacing: '0.01em', lineHeight: 1.12, whiteSpace: 'nowrap' }}>
            {/* marker block: sweeps in from the left to fill (sits under the text) */}
            <span aria-hidden style={{
              position: 'absolute', left: '-0.14em', right: '-0.14em', top: '0.1em', bottom: '0.04em', background: LIME, borderRadius: 8,
              transformOrigin: 'left center', transform: `scaleX(${marker.toFixed(4)})`, boxShadow: marker > 0.02 ? `0 0 60px ${alpha(LIME, 0.28)}` : undefined,
            }} />
            {/* two text layers: left of the block's leading edge is ink, right is white; flips on sweep */}
            <span style={{ position: 'relative', display: 'inline-block', clipPath: `inset(-20% 0 -20% ${clipL}%)`, color: INK }}>{line2(INK)}</span>
            <span aria-hidden style={{ position: 'absolute', left: 0, top: 0, display: 'inline-block', clipPath: `inset(-20% ${clipR}% -20% 0)` }}>{line2(L.onAccent)}</span>
          </div>
          <div style={{
            marginTop: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, whiteSpace: 'pre',
            opacity: kickerIn, transform: `translateY(${((1 - kickerIn) * 12).toFixed(2)}px)`,
          }}>
            <ShortKitMark size={44} tone="dark" />
            <span style={{ fontFamily: BRAND.font, fontSize: 30, fontWeight: 700, letterSpacing: '0.03em', color: INK, lineHeight: 1 }}>{BRAND.name}</span>
            <span style={{ fontFamily: MONO, fontSize: 26, fontWeight: 600, color: DIM, lineHeight: 1 }}>·</span>
            <span style={{ fontFamily: MONO, fontSize: 26, fontWeight: 600, letterSpacing: '0.2em', marginRight: '-0.2em', color: DIM, lineHeight: 1 }}>{KICKER}</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
