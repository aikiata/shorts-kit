// bezier-source-converge-merge: Bezier Converge, multi-source curves merge and swallow (finalized in motion-lab, ported to native Remotion)
// Four source nodes on the left each connect by a thin Bezier curve to the same convergence point on the right: the curves first draw on from left to right,
// the nodes slide along their own curves toward the convergence point and shrink in three accelerating stages (as if sucked in), an accent-color data-packet dot keeps sliding along
// the path, and after the merge completes the curves are erased in reverse from the left end, leaving only the shorts-kit Frame Chisel mark + a word-by-word darkening caption.
// Design coordinates 480×270 (DesignStage scales proportionally), laid out on a fixed 440×240 canvas centered.
// Texture layer (revision): soft-light pale base + grain; source nodes become lit white-porcelain discs + grayscale line icons (four kinds of material: page screenshot / shot card / code / sound);
// curves use a gray→ink gradient stroke; the data packet is a solid accent-color dot with a comet tail; the convergence point is the shorts-kit mark (light-background version) + a receiving ripple;
// during the erase phase a camera pan moves the badge to the middle of the frame, and the ending composition settles centered.
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { DesignStage, E, lerp, seg, useT } from '../../../shared/fixtures/Motion';
import { Backdrop, EASE, FONT, softShadow } from '../../../shared/fixtures/Polish';
import { ShortKitMark } from '../../../shared/fixtures/Brand';

export const BEZIER_SOURCE_CONVERGE_MERGE_DURATION = 168; // 5600ms @30fps

// ---- Values shared by this card (light-gray Swiss-minimal palette, coordinated with the Phase 0 fixture tokens) ----
const SANS = FONT.sans;
const TXT = '#17181c'; // primary text near black (cool tone)
const DIM = '#c4c6cc'; // light gray placeholder text
const LINE = 'rgba(20,22,28,0.09)'; // hairline stroke
const ACCENT = '#5b63d3'; // the only accent color (matches fixture G.accent)
const ACCENT_HI = '#7d84ea';

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const h2r = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
// Color interpolation: mix(p,'#C9C9CE','#111')
const mix = (p: number, a: string, b: string) => {
  const A = h2r(a), B = h2r(b), q = clamp01(p);
  return `rgb(${Math.round(A[0] + (B[0] - A[0]) * q)},${Math.round(A[1] + (B[1] - A[1]) * q)},${Math.round(A[2] + (B[2] - A[2]) * q)})`;
};

const XC = 332, YC = 120; // convergence point

// Four material sources (grayscale layers, only to tell the four apart): page screenshot / shot recipe card / code / sound, all merging into the same film
const SRCS = [
  { y: 36, icon: 'shot', c: '#2a2c33' },
  { y: 92, icon: 'card', c: '#4b4e57' },
  { y: 148, icon: 'code', c: '#6d7079' },
  { y: 204, icon: 'wave', c: '#8f929c' },
];

// Line icons (24 viewBox)
const ICON: Record<string, React.ReactNode> = {
  // Page screenshot: browser window
  shot: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2.4" />
      <path d="M3.5 9h17" />
      <path d="M6.2 7h.01M8.4 7h.01" />
    </>
  ),
  // Shot recipe card: a stack of cards
  card: (
    <>
      <rect x="6.5" y="7.5" width="12" height="13" rx="2.2" />
      <path d="M9.5 4.5h7.8c1.2 0 2.2 1 2.2 2.2v9.8" />
      <path d="M9.3 12h6.4M9.3 15.5h4" />
    </>
  ),
  // Code
  code: (
    <>
      <path d="M8.5 7 3.8 12l4.7 5M15.5 7l4.7 5-4.7 5" />
      <path d="M13.2 5.5 10.8 18.5" />
    </>
  ),
  // Sound: sound wave
  wave: <path d="M4 12h.01M7.4 9.2v5.6M10.6 5.8v12.4M13.8 8.4v7.2M17 10.4v3.2M20 12h.01" />,
};

type Pt = { x: number; y: number };

// Hand-written cubic bezier sampling: P0=(74,y0) P1=(186,y0) P2=(214,YC) P3=(XC,YC)
const cubic = (y0: number, u: number): Pt => {
  const v = 1 - u;
  return {
    x: v * v * v * 74 + 3 * v * v * u * 186 + 3 * v * u * u * 214 + u * u * u * XC,
    y: v * v * v * y0 + 3 * v * v * u * y0 + 3 * v * u * u * YC + u * u * u * YC,
  };
};

// Path geometry = straight segment M -22,y L 74,y (fixed length 96) + the cubic above. Equivalent to getTotalLength /
// getPointAtLength: the cubic segment builds a cumulative arc-length table (1600-segment polyline, error far below 0.01px),
// binary search maps arc length → parameter u; precomputed at module level, no DOM dependency, deterministic rendering.
const SAMPLES = 1600;
const LINE_LEN = 96;
const mkPathGeom = (y0: number) => {
  const cum: number[] = [0];
  let px = 74, py = y0, acc = 0;
  for (let k = 1; k <= SAMPLES; k++) {
    const p = cubic(y0, k / SAMPLES);
    acc += Math.hypot(p.x - px, p.y - py);
    cum.push(acc);
    px = p.x; py = p.y;
  }
  const len = LINE_LEN + acc;
  const pointAt = (s: number): Pt => {
    const sc = Math.max(0, Math.min(len, s));
    if (sc <= LINE_LEN) return { x: -22 + sc, y: y0 };
    const target = sc - LINE_LEN;
    let lo = 0, hi = SAMPLES;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < target) lo = mid + 1; else hi = mid;
    }
    const i = Math.max(1, lo);
    const s0 = cum[i - 1], s1 = cum[i];
    const u = (i - 1 + (s1 > s0 ? (target - s0) / (s1 - s0) : 0)) / SAMPLES;
    return cubic(y0, u);
  };
  // The node rest position x=74 is exactly the end of the straight segment (arc length 96), so calibrate f0 = 96/len directly:
  // the original 40-step scan had only 1/40 precision, so the four nodes' resting positions would be offset left and right by 4–16px and not line up in a column
  const f0 = LINE_LEN / len;
  return { len, pointAt, f0 };
};

const GEOMS = SRCS.map((s) => mkPathGeom(s.y));

// Closing caption (word-by-word darkening grammar, using only the show + inn states)
const CAP_WORDS = 'From screenshot to showreel'.split(' ');
const CAP_ST = 0.78 / CAP_WORDS.length;
const CAP_WIN = CAP_ST * 1.5;

// Convergence point: white porcelain disc + shorts-kit Frame Chisel mark (light-background version)
const BADGE_SIZE = 46; // diameter of the convergence white porcelain disc (= start diameter of the receiving ripple), slightly larger than the 44 source nodes
const MARK_SIZE = 34; // the real shape occupies about 81% of the mark viewBox 128, so 34 → real shape ≈28, leaving enough safe space all around

// Data-packet comet tail: take TAIL sample points backward along the path, spaced TAIL_GAP (path fraction), with decreasing opacity and size
const TAIL = 9;
const TAIL_GAP = 0.0055;

// Closing camera pan: while erasing, shift the canvas left by SHIFT so the badge lands in the middle of the frame (canvas left edge 20 + XC = 352 → 240)
const SHIFT = 352 - 240;

export const BezierSourceConvergeMerge: React.FC = () => {
  const t = useT();
  const conv = seg(t, 0.34, 0.74, E.inOutCubic);            // main convergence progress
  const erase = seg(t, 0.78, 0.9, E.outQuad);               // erase from the start
  const pkCycle = (seg(t, 0.1, 0.74, E.linear) * 2) % 1;    // data-packet loop (whole-number cycles at t=1)
  const pan = seg(t, 0.76, 0.93, EASE.smooth);              // closing centering pan (parallel with the erase)

  // Badge breathing: entrance fade-in + outBack pop at the moment the merge completes, then settle
  const bp = seg(t, 0.16, 0.26, E.outCubic);
  const badgeScale = lerp(bp, 0.7, 1) * (1 + seg(t, 0.7, 0.78, E.outBack) * 0.12 - seg(t, 0.78, 0.86, E.outQuad) * 0.12);
  // Receiving ripple: at the merge moment (0.72) a thin ring spreads and fades, emitted only once
  const ripple = seg(t, 0.72, 0.86, EASE.out);
  const capShow = seg(t, 0.84, 0.9, EASE.out);
  const capInn = seg(t, 0.84, 0.95);

  return (
    <AbsoluteFill>
      <Backdrop tone="light" light={{ x: 0.62, y: 0.3 }} accent={ACCENT} grain={0.05} vignette={0.12} />
      <DesignStage bg="transparent">
        {/* Page + 440×240 fixed canvas (centered) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            fontFamily: SANS,
            WebkitFontSmoothing: 'antialiased',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 440,
              height: 240,
              margin: '-120px 0 0 -220px',
              transform: `translateX(${(-pan * SHIFT).toFixed(2)}px)`,
            }}
          >
            {/* Four Bezier curves: dashoffset forward draw-on, reversed erase during the erase phase */}
            <svg width={440} height={240} viewBox="0 0 440 240" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
              <defs>
                {/* Stroke transitions from light gray to near black: light at the source end, heavy at the convergence end, reading as "flow direction" */}
                <linearGradient id="bscm-stroke" gradientUnits="userSpaceOnUse" x1={-22} y1={0} x2={XC} y2={0}>
                  <stop offset="0" stopColor="#b8bac2" />
                  <stop offset="0.45" stopColor="#7c7f89" />
                  <stop offset="1" stopColor="#2a2c33" />
                </linearGradient>
              </defs>
              {SRCS.map((s, i) => {
                const { len } = GEOMS[i];
                const draw = seg(t, 0.04 + i * 0.045, 0.04 + i * 0.045 + 0.17, E.outQuad);
                const off = erase > 0 ? -erase * len : len * (1 - draw);
                return (
                  <path
                    key={i}
                    d={`M -22,${s.y} L 74,${s.y} C 186,${s.y} 214,${YC} ${XC},${YC}`}
                    fill="none"
                    stroke="url(#bscm-stroke)"
                    strokeWidth={0.9}
                    strokeLinecap="round"
                    strokeDasharray={len}
                    strokeDashoffset={off.toFixed(1)}
                    opacity={(draw * (1 - clamp01((erase - 0.85) / 0.15))).toFixed(3)}
                  />
                );
              })}
            </svg>

            {/* Source nodes + data-packet layer */}
            <div style={{ position: 'absolute', left: 0, top: 0, width: 440, height: 240 }}>
              {SRCS.map((s, i) => {
                const { len, pointAt, f0 } = GEOMS[i];
                // Nodes slide along the path toward the convergence point, shrinking in three stages (44→15→0, as if sucked in)
                const tt = conv;
                const frac = f0 + (1 - f0) * tt;
                const pt = pointAt(len * frac);
                const size = tt < 0.75 ? lerp(tt / 0.75, 44, 15) : lerp((tt - 0.75) / 0.25, 15, 0);
                // Entrance: pops out with slight overshoot (≈8%), one more "settle" than the original outCubic
                const appear = seg(t, 0.02 + i * 0.04, 0.02 + i * 0.04 + 0.1, EASE.overshoot);
                const appearOp = seg(t, 0.02 + i * 0.04, 0.02 + i * 0.04 + 0.06, EASE.out);
                // Data packet (phase offset, constant size) + comet tail
                const ph = (pkCycle + i * 0.13) % 1;
                const pkOn = seg(t, 0.1, 0.16) * (1 - seg(t, 0.7, 0.76));
                const pkOp = pkOn * (1 - Math.abs(ph - 0.5) * 0.6);
                const k = size / 44; // elements inside the node scale proportionally with size
                return (
                  <React.Fragment key={i}>
                    {/* Comet tail: drawn from tail to head, the head brightest */}
                    {pkOp > 0.01 &&
                      Array.from({ length: TAIL }, (_, j) => TAIL - j).map((j) => {
                        const pj = ph - j * TAIL_GAP;
                        if (pj < 0) return null;
                        const q = pointAt(len * (f0 + (1 - f0) * pj));
                        const r = 2.6 * (1 - j / (TAIL + 1));
                        return (
                          <div
                            key={`tail${j}`}
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              width: r * 2,
                              height: r * 2,
                              borderRadius: '50%',
                              background: ACCENT,
                              transform: `translate(${(q.x - r).toFixed(2)}px,${(q.y - r).toFixed(2)}px)`,
                              opacity: (pkOp * 0.38 * (1 - j / (TAIL + 1))).toFixed(3),
                            }}
                          />
                        );
                      })}
                    {pkOp > 0.01 && (() => {
                      const q = pointAt(len * (f0 + (1 - f0) * ph));
                      return (
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: `radial-gradient(circle at 35% 35%, ${ACCENT_HI}, ${ACCENT})`,
                            boxShadow: '0 0 0 1.5px rgba(91,99,211,0.16), 0 1px 3px rgba(91,99,211,0.45)',
                            transform: `translate(${(q.x - 3).toFixed(2)}px,${(q.y - 3).toFixed(2)}px)`,
                            opacity: pkOp.toFixed(3),
                          }}
                        />
                      );
                    })()}
                    {/* Source node: white porcelain disc (top-lit gradient + hairline + inner highlight + two-layer soft shadow) */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        borderRadius: '50%',
                        background: 'linear-gradient(180deg, #ffffff 0%, #f6f6f4 100%)',
                        border: `0.5px solid ${LINE}`,
                        boxSizing: 'border-box',
                        boxShadow: `inset 0 0.5px 0 rgba(255,255,255,1), ${softShadow(2 + 4 * k, { strength: 0.8 })}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: s.c,
                        willChange: 'transform',
                        width: Math.max(0.1, size),
                        height: Math.max(0.1, size),
                        transform: `translate(${(pt.x - size / 2).toFixed(2)}px,${(pt.y - size / 2).toFixed(2)}px) scale(${appear.toFixed(3)})`,
                        opacity: (appearOp * (tt > 0.92 ? clamp01((1 - tt) / 0.08) : 1)).toFixed(3),
                      }}
                    >
                      <svg
                        width={Math.max(0.1, size * 0.46)}
                        height={Math.max(0.1, size * 0.46)}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.6}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {ICON[s.icon]}
                      </svg>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Receiving ripple: a thin accent-color ring that expands from the badge edge to 2.1 times and fades */}
            <div
              style={{
                position: 'absolute',
                left: XC - BADGE_SIZE / 2,
                top: YC - BADGE_SIZE / 2,
                width: BADGE_SIZE,
                height: BADGE_SIZE,
                borderRadius: '50%',
                border: `0.75px solid ${ACCENT}`,
                boxSizing: 'border-box',
                transform: `scale(${lerp(ripple, 1, 2.1)})`,
                opacity: ripple > 0 && ripple < 1 ? (1 - ripple) * 0.55 : 0,
              }}
            />

            {/* Convergence point: a white porcelain disc (same material as the source nodes, covering the incoming ends of curves and data packets) holding the shorts-kit Frame Chisel mark (light-background version,
                the mark itself gets no gradient/shadow); entrance and receiving pulse reuse the scale of the original badge */}
            <div
              style={{
                position: 'absolute',
                width: BADGE_SIZE,
                height: BADGE_SIZE,
                left: XC - BADGE_SIZE / 2,
                top: YC - BADGE_SIZE / 2,
                borderRadius: '50%',
                background: 'linear-gradient(180deg, #ffffff 0%, #f6f6f4 100%)',
                border: `0.5px solid ${LINE}`,
                boxSizing: 'border-box',
                boxShadow: `inset 0 0.5px 0 rgba(255,255,255,1), ${softShadow(8, { strength: 1 })}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: bp,
                transform: `scale(${badgeScale})`,
              }}
            >
              <ShortKitMark size={MARK_SIZE} tone="light" />
            </div>

            {/* Closing caption: word-by-word darkening (light gray placeholder → near black), centered below the badge, fading in and floating up with show */}
            <div
              style={{
                position: 'absolute',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'center',
                whiteSpace: 'nowrap',
                left: XC - 120,
                width: 240,
                top: YC + 36,
                opacity: capShow,
                transform: `translateY(${((1 - capShow) * 4).toFixed(2)}px)`,
              }}
            >
              {CAP_WORDS.map((w, i) => {
                const q = clamp01((capInn - i * CAP_ST) / CAP_WIN);
                return (
                  <span
                    key={i}
                    style={{
                      font: `600 13px/1.25 ${SANS}`,
                      color: mix(q, DIM, TXT),
                      letterSpacing: (-0.012 - 0.02 * (1 - q)).toFixed(4) + 'em',
                      marginRight: i === CAP_WORDS.length - 1 ? 0 : 4,
                    }}
                  >
                    {w}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </DesignStage>
    </AbsoluteFill>
  );
};
