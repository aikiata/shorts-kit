// document-typewriter-reveal: a full-page real-layout document "writes" itself out behind a cursor, the sidebar follows, and history entries drop into the track one by one
// (second-round redesign · aurora dark scene · floating app window)
// Technique unchanged: content blocks are "written" out in pairs on the beat (the page-background mask narrows with a right anchor, an accent-color pen tip rides the reveal front, always only one pen tip);
// after the name heading is written an accent underlay grows; the left and right columns are then revealed from top to bottom; in the final segment 6 weekly-report history entries drop into the left column one by one.
//
// Design decisions
// - look = aurora (purple night + purple/pink light). The real weekly-report page screenshot is kept (Q1), but no longer fills the whole screen: it is an app window floating on a purple-night stage:
//   rounded corners, bright hairline edge, a ring of purple backlight behind, a long drop shadow at its feet; the warm-white paper surface in the cold purple night looks like a lamp.
// - Camera (monotone Hermite spline, no velocity jumps at start and end): opens at 1.42x oblique (rotY −18°) close-up on the title, with the window's upper-left corner and the stage light entering frame together;
//   as the pen writes downward the camera pulls back all the way, reducing the oblique angle, to the full window (both columns fully in frame, Q10); finally tilts slightly down and shifts up to leave the bottom for a tagline.
// - Pen tip: deep purple 3px caret + same-color soft glow; the accent underlay of the name heading becomes aurora purple multiply (tints the paper without washing out the text).
// - Closing tagline "From screenshot / to showreel." (a shorts-kit pitch line: a real screenshot gets filmed into a shot), the second part in accent color, at the bottom, left-aligned to the window's left edge.
//   The screenshot texture and history entries are the filmed document itself (aligned with entries baked into the texture), kept as is.
//
// Timeline (30fps, 150f total)
//   0–8     Title close-up already in frame (window + light), pen tip at the title start
//   8–58    Writing: 20 blocks in pairs, pair g cue = 8 + 4.4g, 9f per block (in-out), the last pair finishes writing at ~57f
//   0–64    Camera pull-back: 1.42x oblique → 0.86x full window
//   54/62   Left / right column revealed from top to bottom (10f) + inner-edge accent line grows then fades
//   66–100  6 weekly-report history entries drop into the left column one by one (every 5f, 9f light bounce + shadow in the air)
//   70–104  Camera tilts slightly down and shifts up to the poster position (0.74x)
//   100–126 Tagline rises word by word
//   126–150 Hold: 0.8% very slow push-in, breathing light
import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, Easing } from 'remotion';
import { EASE, FONT, ramp } from '../../../shared/fixtures/Polish';
import { LOOKS, Stage, Dust, TextReveal, alpha, type } from '../../../shared/fixtures/Look';
import layout from '../../../shared/fixtures/live-layout.json';

export const DOCUMENT_TYPEWRITER_REVEAL_DURATION = 150;

const L = LOOKS.aurora;
type Block = { x: number; y: number; w: number; h: number; tag: string };
const blocks = layout.wbr.blocks as Block[];
const leftRail = layout.wbr.leftRail;
const rightRail = layout.wbr.rightRail;
const PAGE_W = 1920;
const PAGE_H = layout.wbr.pageH;

const PAPER = '#fefcf9'; // measured color of the texture paper surface
const CARET = '#7a4dff'; // one notch deeper aurora purple: must be visible on warm-white paper
const WASH = 'rgba(196,170,255,0.4)';
const SANS = 'ui-sans-serif, system-ui, -apple-system, sans-serif';

// ───────────── Camera ─────────────
type Cam = { cx: number; cy: number; zoom: number; rotX: number; rotY: number; sx: number; sy: number };
type Key = Cam & { frame: number };
const ANCHORS: Key[] = [
  { frame: 0, cx: 690, cy: 320, zoom: 1.42, rotX: 8, rotY: -18, sx: 0, sy: 0 },
  { frame: 26, cx: 770, cy: 390, zoom: 1.24, rotX: 6, rotY: -13, sx: 0, sy: 0 },
  { frame: 64, cx: 960, cy: 540, zoom: 0.86, rotX: 4, rotY: -6, sx: 0, sy: -10 },
  { frame: 104, cx: 960, cy: 540, zoom: 0.74, rotX: 9, rotY: -3, sx: 0, sy: -78 },
  { frame: 150, cx: 960, cy: 540, zoom: 0.746, rotX: 9, rotY: -3, sx: 0, sy: -80 },
];
const PARAMS: (keyof Cam)[] = ['cx', 'cy', 'zoom', 'rotX', 'rotY', 'sx', 'sy'];
const hermite = (xs: number[], ys: number[]) => {
  const n = xs.length;
  const d = xs.slice(0, -1).map((x, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - x));
  const m = xs.map((_, i) => (i === 0 || i === n - 1 ? 0 : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
    if (h > 9) { const k = 3 / Math.sqrt(h); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
};
const CURVES = Object.fromEntries(PARAMS.map((p) => [p, hermite(ANCHORS.map((k) => k.frame), ANCHORS.map((k) => k[p]))])) as Record<keyof Cam, (x: number) => number>;
const camAt = (f: number): Cam => Object.fromEntries(PARAMS.map((p) => [p, CURVES[p](f)])) as Cam;
// Camera layer: scaling goes through layout-level zoom (Q2), sending page point (cx,cy) to screen (960+sx, 540+sy)
const PERSP = 2200;

// ───────────── Writing beats ─────────────
const REVEAL_EASE = Easing.bezier(0.4, 0, 0.6, 1);
const cueFor = (i: number) => 8 + Math.floor(i / 2) * 4.4;
const WIPE = 9;

const PAST_WEEKS = [
  { week: '2026 Week 27', date: 'Jul 3', title: '2026-W27 · shorts-kit Weekly' },
  { week: '2026 Week 26', date: 'Jun 26', title: '2026-W26 · shorts-kit Weekly' },
  { week: '2026 Week 25', date: 'Jun 19', title: '2026-W25 · shorts-kit Weekly' },
  { week: '2026 Week 24', date: 'Jun 12', title: '2026-W24 · shorts-kit Weekly' },
  { week: '2026 Week 23', date: 'Jun 5', title: '2026-W23 · shorts-kit Weekly' },
  { week: '2026 Week 22', date: 'May 29', title: '2026-W22 · shorts-kit Weekly' },
];
const WEEK_Y0 = 228;
const WEEK_H = 56;
const WEEK_CUE = (i: number) => 66 + i * 5;
const WEEK_DROP = Easing.bezier(0.2, 1.15, 0.3, 1);

// Accent underlay grows after the member-name headings (tag=h2, skipping the first "Jackie's Download" summary heading) are written
const memberH2 = new Set<number>();
{
  let seenH2 = 0;
  blocks.forEach((b, i) => {
    if (b.tag === 'h2' && seenH2++ > 0) memberH2.add(i);
  });
}

export const DocumentTypewriterReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);

  // Only one pen tip: follows the newest block that is still being written
  let caretIdx = -1;
  blocks.forEach((_, i) => {
    if (frame >= cueFor(i) && frame <= cueFor(i) + WIPE + 2) caretIdx = i;
  });
  // In the first 8f the pen tip blinks at the title start, standing by
  const idleBlink = frame < cueFor(0) ? (Math.floor(frame / 4) % 2 === 0 ? 1 : 0.25) : 0;

  const tagIn = ramp(frame, 100, 20, EASE.out);

  return (
    <AbsoluteFill style={{ fontFamily: FONT.sans, overflow: 'hidden' }}>
      <Stage look={L} keyLight={{ x: 0.5, y: 0.02 }} fill={{ x: 0.88, y: 0.95 }} horizon={0.9} breathe={0.7} intensity={0.9}>
        <Dust look={L} count={24} seed={9} drift={0.16} opacity={0.4} />
      </Stage>

      {/* 3D camera */}
      <AbsoluteFill style={{ transform: `translate(${cam.sx.toFixed(2)}px, ${cam.sy.toFixed(2)}px)` }}>
        <div style={{ position: 'absolute', inset: 0, perspective: `${(PERSP * cam.zoom).toFixed(2)}px`, perspectiveOrigin: '960px 540px' }}>
          <div
            style={{
              position: 'absolute', width: PAGE_W, height: PAGE_H, zoom: cam.zoom,
              transform: `translate(${(960 / cam.zoom - cam.cx).toFixed(3)}px, ${(540 / cam.zoom - cam.cy).toFixed(3)}px) rotateY(${cam.rotY.toFixed(3)}deg) rotateX(${cam.rotX.toFixed(3)}deg)`,
              transformOrigin: `${cam.cx.toFixed(2)}px ${cam.cy.toFixed(2)}px`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Backlight: a ring of purple light behind the window (page space, with the same perspective as the window) */}
            <div
              style={{
                position: 'absolute', left: -220, top: -180, width: PAGE_W + 440, height: PAGE_H + 400, pointerEvents: 'none',
                background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${alpha(L.accent, 0.34)} 0%, ${alpha(L.accent2, 0.1)} 55%, transparent 72%)`,
                transform: 'translateZ(-40px)',
              }}
            />
            {/* App window: real screenshot + writing mask + columns + history entries, all clipped inside the rounded corners */}
            <div
              style={{
                position: 'absolute', left: 0, top: 0, width: PAGE_W, height: PAGE_H, borderRadius: 26, overflow: 'hidden',
                background: PAPER,
                boxShadow: `0 0 0 1.5px ${alpha('#ffffff', 0.35)}, 0 70px 160px -20px ${alpha(L.shadow, 0.95)}, 0 20px 60px ${alpha('#000000', 0.55)}`,
              }}
            >
              <Img src={staticFile('textures/live/wbr-full.png')} style={{ position: 'absolute', width: PAGE_W, height: PAGE_H }} />

              {blocks.map((p, i) => {
                const cue = cueFor(i);
                const coverT = interpolate(frame, [cue, cue + WIPE], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: REVEAL_EASE });
                const bx = p.tag === 'li' ? p.x - 28 : p.x - 4;
                const by = p.y - 3;
                const bw = p.w + (p.tag === 'li' ? 34 : 10) + (p.tag === 'li' ? 24 : 120);
                const bh = p.h + 6;
                const caretX = bx + bw * (1 - coverT);
                const caretH = Math.min(22, p.h - 2);
                const nameCue = cue + WIPE + 4;
                const nameGrow = memberH2.has(i)
                  ? interpolate(frame, [nameCue, nameCue + 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.3, 0, 0.2, 1) })
                  : 0;
                // The pen tip while writing only rides within the actual text width (the extra blank stretch covered on the right of the mask does not carry the pen tip)
                const textRight = p.x + p.w + 6;
                return (
                  <React.Fragment key={i}>
                    {nameGrow > 0 ? (
                      <div style={{ position: 'absolute', left: p.x - 4, top: p.y - 1, width: (p.w + 10) * nameGrow, height: p.h + 2, background: WASH, borderRadius: 4, mixBlendMode: 'multiply' }} />
                    ) : null}
                    {coverT > 0 ? (
                      <div style={{ position: 'absolute', left: bx, top: by, width: bw, height: bh, overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${coverT * 100}%`, background: PAPER }} />
                      </div>
                    ) : null}
                    {i === caretIdx ? (
                      <div
                        style={{
                          position: 'absolute', left: Math.min(caretX, textRight), top: p.y + (p.h - caretH) / 2, width: 3, height: caretH, background: CARET, borderRadius: 2,
                          boxShadow: `0 0 8px ${alpha(CARET, 0.6)}, 0 0 20px ${alpha(L.accent, 0.45)}`,
                          opacity: coverT > 0 ? 1 : interpolate(frame, [cue + WIPE, cue + WIPE + 2], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                        }}
                      />
                    ) : null}
                  </React.Fragment>
                );
              })}
              {/* Opening standby pen tip */}
              {idleBlink > 0 ? (
                <div style={{ position: 'absolute', left: blocks[0].x - 4, top: blocks[0].y + 3, width: 3, height: 22, background: CARET, borderRadius: 2, opacity: idleBlink, boxShadow: `0 0 8px ${alpha(CARET, 0.6)}` }} />
              ) : null}

              {/* Two-column reveal: the paper patch retracts from top to bottom, the inner-edge accent line grows with the reveal then fades */}
              {[
                { rail: leftRail, cue: 54, inner: 'right' as const },
                { rail: rightRail, cue: 62, inner: 'left' as const },
              ].map(({ rail, cue, inner }, i) => {
                const t = interpolate(frame, [cue, cue + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.3, 0, 0.2, 1) });
                const lineFade = interpolate(frame, [cue + 10, cue + 24], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
                return (
                  <React.Fragment key={`rail${i}`}>
                    {t < 1 ? <div style={{ position: 'absolute', left: rail.x, top: rail.y + rail.h * t, width: rail.w, height: rail.h * (1 - t), background: PAPER }} /> : null}
                    {frame >= cue && lineFade > 0 ? (
                      <div style={{ position: 'absolute', left: inner === 'right' ? rail.x + rail.w - 2 : rail.x, top: rail.y, width: 2, height: rail.h * t, background: CARET, opacity: lineFade, boxShadow: `0 0 10px ${alpha(L.accent, 0.6)}` }} />
                    ) : null}
                  </React.Fragment>
                );
              })}

              {/* Weekly-report history: drops into the left column one by one from above */}
              {PAST_WEEKS.map((w, i) => {
                const cue = WEEK_CUE(i);
                if (frame < cue) return null;
                const t = interpolate(frame, [cue, cue + 9], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: WEEK_DROP });
                const appear = interpolate(frame, [cue, cue + 3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
                const air = Math.max(0, 1 - t);
                return (
                  <div
                    key={w.week}
                    style={{
                      position: 'absolute', left: 4, top: WEEK_Y0 + i * WEEK_H, width: leftRail.w - 8, height: WEEK_H,
                      transform: `translateY(${-48 * air}px)`, opacity: appear,
                      boxShadow: air > 0.02 ? `0 ${12 * air}px ${24 * air}px rgba(40,20,60,${0.2 * air})` : 'none',
                      background: PAPER, borderBottom: '1px solid rgba(31,41,55,0.07)', padding: '8px 10px 0', boxSizing: 'border-box', fontFamily: SANS,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#1f2937' }}>{w.week}</span>
                      <span style={{ fontSize: 10, color: '#9ca3af' }}>{w.date}</span>
                    </div>
                    <div style={{ marginTop: 2, fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.title}</div>
                  </div>
                );
              })}
              {/* Window top edge lit: a very faint top highlight (glass feel) */}
              <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 3, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)' }} />
            </div>
          </div>
        </div>
      </AbsoluteFill>

      {/* Closing tagline: at the bottom, left-aligned to the window's left edge */}
      <div style={{ position: 'absolute', left: 250, top: 930, display: 'flex', alignItems: 'baseline', gap: 0, ...type(84, 760), color: L.ink, opacity: tagIn > 0 ? 1 : 0 }}>
        <TextReveal text="From screenshot" by="word" variant="rise" start={100} each={16} gap={3} />
        <TextReveal text="to showreel." by="word" variant="rise" start={108} each={16} gap={3} style={{ color: L.accent, marginLeft: '0.26em' }} />
      </div>
    </AbsoluteFill>
  );
};
