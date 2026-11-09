// crash-zoom punch (rebound variant, second redesign): the full view of the real projects page slams in to a card4 close-up in one beat.
// Technique unchanged: full-view hold → prep pull-back → 6f strong ease-in crash push (speed peaks on the arrival frame) → one visible overshoot-and-rebound to settle.
//
// Design decisions
// - look: ember (warm black + orange). The screenshot itself is a warm-white paper page; placed on a warm-black stage it looks like a screen lit by a spotlight:
//   the full view is "a product on a stage": the browser window leans back slightly (rotateX 11°), an orange backlight behind it traces the outline,
//   and the floor reflects underneath; the crash push straightens the lean at the same time, so the arrival is a head-on close-up (Q6: the card to be read is shown head-on).
// - target teaser: the beat before the push, four orange corner marks close in from a large frame and lock onto card4 ("look at this" is named first in the full view),
//   the corner marks hang in page coordinates, so after the push they naturally become the viewfinder of the close-up card: the full view to the close-up is one line of sight.
// - settle: surrounding page darkens to warm black (spotlight), the target card floats up + orange rim light; on the arrival frame a warm exposure flash (8f decay).
//   Then the camera does one "follow": a smooth leftward move puts the card at the left golden position, and a set of large readouts lands in the right column (matching copy, fictional data).
// - the screenshot texture is kept (Q1: the product's existing page); card4 is overlaid with a 4x high-res texture in place, so the close-up text isn't blurry (Q2).
//
// Timeline (30fps, 132f)
//   0–34   full-view hold: window already on screen, lean 13°→11°, zoom 0.70→0.72 very slow push in (smooth, the camera feels alive but doesn't shake)
//   14–30  lock: four corner marks close in from 150px out to 14px outside the card (snappy 16f), fade in over 4f
//   34–40  prep: zoom pulls back ~4%, lean deepens 1.5°, corner marks expand outward one breath in sync (wind-up)
//   40–46  crash push 6f: strong ease-in in log space 0.69→2.48, lean returns to zero on the same curve, the target card's screen position converges monotonically toward the frame center
//          (only this segment gets time-sampled motion blur: shutter ≈200°, sub-frame spacing ≤6px, cap 44, each layer gets a slight blur by spacing to smooth echoes)
//   46–58  rebound: damped cosine 2.48→2.34, one visible rebound, slight undershoot to settle; from the arrival frame a warm exposure flash with 8f decay
//   47–64  naming: surroundings darken to 86% (warm black), card floats up + rim light (out curve 16f)
//   56–78  follow: camera moves smoothly left 320px (swift 22f), the card lands at the left golden position
//   68–108 right-column readouts: eyebrow → big number rises letter by letter from below the line → hairline → two lines of description (staggered 3–4f);
//          the start of the right-column darkening follows the card's right edge, never covering the hero
//   108–131 hold 24f: very slow push in 1→1.015 + breathing light, the last frame is a complete poster
import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import layout from '../../../shared/fixtures/live-layout.json';
import { Dust, LOOKS, Stage, TextReveal, alpha, type } from '../../../shared/fixtures/Look';
import { EASE, FONT, Vignette, mix, ramp, softShadow } from '../../../shared/fixtures/Polish';

export const CRASHZOOM_DUR = 132;

const L = LOOKS.ember;
const CARD = layout.projects.cards[3];
const TARGET = { cx: CARD.x + CARD.w / 2, cy: CARD.y + CARD.h / 2 }; // ≈ (960, 772) page coordinates
const CARD_R = 8.5; // card corner radius in the screenshot (page px)

// framing of the browser window in page coordinates (page is 1920 wide, content area 408–1512): a strip of page margin kept on each side,
// bottom edge taken to 1060: in the close-up the window's lower edge must be off screen (at 2.34x it lands around screen y≈1220)
const WIN = { x: 220, y: 0, w: 1480, h: 1060 };
const CHROME = 54; // window title bar height (page px)
const WIN_R = 18;
const WIN_C = { x: WIN.x + WIN.w / 2, y: (WIN.y - CHROME + WIN.y + WIN.h) / 2 }; // geometric center of the window

const PUSH = 40; // push start
const HIT = 46; // arrival frame (6f crash push)
const PEAK = 2.48; // peak the push rushes to (6% above the settle; the upper edge of the card's "rebound amplitude 3–6%" parameter)
const REST = 2.34; // settled zoom after the rebound (card ≈ 836×730, 68% of the frame height)
const SHIFT = 56; // follow left-shift start (the rebound has settled by ~56f)
const CARD_X_END = 640; // screen x of the card center after the follow

// camera: zoom (page px → screen px), screen position sx/sy of the target card center, lean angle tilt.
// Interpolating the "target card screen position" rather than the camera center: during the push the target converges monotonically to the frame center, without flying out first and coming back.
const camAt = (f: number) => {
  const settle = ramp(f, 0, 34, EASE.smooth);
  const wind = ramp(f, 34, 6, EASE.smooth);
  const z0 = mix(0.7, 0.72, settle) * mix(1, 0.96, wind);
  const tilt0 = mix(13, 11, settle) + 1.5 * wind;
  // screen position of the target card in the full view (window geometric center → screen (960,540))
  const wideSx = 960 + (TARGET.cx - WIN_C.x) * z0;
  const wideSy = 540 + (TARGET.cy - WIN_C.y) * z0;
  let zoom = z0;
  let k = 0; // 0 = full-view composition, 1 = target centered
  if (f >= PUSH && f < HIT) {
    const p = ramp(f, PUSH, HIT - PUSH, EASE.exit);
    zoom = Math.exp(mix(Math.log(z0), Math.log(PEAK), p)); // log space: perceptually uniform acceleration of the push
    k = p;
  } else if (f >= HIT) {
    const t = f - HIT;
    zoom = REST + (PEAK - REST) * Math.exp(-t / 2.2) * Math.cos((Math.PI * t) / 5.2);
    zoom *= 1 + 0.015 * ramp(f, 96, 35, EASE.smooth); // very slow push in at the tail, the frame stays alive
    k = 1;
  }
  const tilt = f >= PUSH ? tilt0 * (1 - ramp(f, PUSH, HIT - PUSH, EASE.exit)) : tilt0;
  const shift = ramp(f, SHIFT, 22, EASE.swift);
  const sx = mix(wideSx, mix(960, CARD_X_END, shift), k);
  const sy = mix(wideSy, 540, k);
  return { zoom, sx, sy, tilt };
};

// the whole world under one camera pose (window + page + corner marks), reused for the motion-blur sub-frames
const World: React.FC<{ f: number; lift: number; lock: number; breath: number }> = ({ f, lift, lock, breath }) => {
  const { zoom, sx, sy, tilt } = camAt(f);
  const tx = sx - TARGET.cx * zoom;
  const ty = sy - TARGET.cy * zoom;
  // corner marks: outward expansion is set by lock progress and the prep breath; line width is inverse-scaled by zoom, a constant 3px on screen
  const pad = mix(150, 14, lock) + 8 * breath;
  const sw = 3 / zoom;
  const arm = 34 / Math.max(1, zoom * 0.7);
  const bx = CARD.x - pad, by = CARD.y - pad, bw = CARD.w + pad * 2, bh = CARD.h + pad * 2;
  const tilted = tilt > 0.01;
  return (
    <AbsoluteFill style={tilted ? { perspective: 2600, perspectiveOrigin: '50% 40%' } : undefined}>
      <AbsoluteFill style={tilted ? { transform: `rotateX(${tilt.toFixed(3)}deg)`, transformOrigin: '50% 60%' } : undefined}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1200, transformOrigin: '0 0', transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${zoom.toFixed(5)})` }}>
          {/* window: title bar + viewport, hue-tinted dark double-layer shadow + lit top edge */}
          <div
            style={{
              position: 'absolute', left: WIN.x, top: WIN.y - CHROME, width: WIN.w, height: WIN.h + CHROME, borderRadius: WIN_R, overflow: 'hidden',
              background: '#f9f6f1',
              boxShadow: `0 0 0 1px ${alpha('#ffd9bf', 0.22)}, 0 40px 90px -10px rgba(5,1,0,0.75), 0 12px 30px rgba(5,1,0,0.5)`,
            }}
          >
            <div style={{ position: 'absolute', left: 0, top: 0, width: WIN.w, height: CHROME, background: 'linear-gradient(180deg, #f1ebe2, #e9e2d7)', borderBottom: '1px solid rgba(60,40,20,0.12)' }}>
              {['#ef6a5b', '#f2be4f', '#5fc35a'].map((c, i) => (
                <div key={c} style={{ position: 'absolute', left: 24 + i * 24, top: 20, width: 14, height: 14, borderRadius: 7, background: c, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)' }} />
              ))}
              <div style={{ position: 'absolute', left: WIN.w / 2 - 210, top: 12, width: 420, height: 30, borderRadius: 9, background: 'rgba(255,255,255,0.7)', boxShadow: 'inset 0 0 0 1px rgba(60,40,20,0.1)', fontFamily: FONT.sans, fontSize: 15, color: '#8a7a68', display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '0.01em' }}>
                localhost:3000/projects
              </div>
            </div>
            <div style={{ position: 'absolute', left: 0, top: CHROME, width: WIN.w, height: WIN.h, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: -WIN.x, top: -WIN.y, width: 1920, height: layout.projects.pageH }}>
                <Img src={staticFile('textures/live/projects-full.png')} style={{ position: 'absolute', width: 1920 }} />
                {/* naming: a shadow with a huge spread around the card serves as a mask, the surroundings darken to warm black; the target card grows a floating shadow */}
                {lift > 0.001 && (
                  <div
                    style={{
                      position: 'absolute', left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, borderRadius: CARD_R,
                      boxShadow: `0 0 0 4000px rgba(14,6,2,${(0.86 * lift).toFixed(3)}), ${softShadow(14 * lift, { color: '#050100', strength: 2.4 })}`,
                    }}
                  />
                )}
                {/* high-res target card overlaid in place, text stays sharp after enlarging (Q2) */}
                <Img src={staticFile('textures/live/card4-hires.png')} style={{ position: 'absolute', left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, borderRadius: CARD_R }} />
                {/* rim light: the hero's only light effect, hugging the rounded corners (Q4) */}
                {lift > 0.001 && (
                  <div
                    style={{
                      position: 'absolute', left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, borderRadius: CARD_R, pointerEvents: 'none',
                      boxShadow: `0 0 0 ${(1.2 / zoom).toFixed(3)}px ${alpha(L.accent, 0.85 * lift)}, 0 0 ${(26 / zoom).toFixed(2)}px ${alpha(L.accent, 0.45 * lift)}`,
                    }}
                  />
                )}
                {/* lock corner marks (page coordinates): close in on the card in the full view, become the viewfinder in the close-up */}
                {lock > 0.001 && (
                  <svg
                    width={bw + 40} height={bh + 40} viewBox={`${bx - 20} ${by - 20} ${bw + 40} ${bh + 40}`}
                    style={{ position: 'absolute', left: bx - 20, top: by - 20, overflow: 'visible', opacity: Math.min(1, lock * 4) * (1 - 0.35 * lift) }}
                  >
                    <g fill="none" stroke={L.accent} strokeWidth={sw} strokeLinecap="square">
                      <path d={`M${bx} ${by + arm} V${by} H${bx + arm}`} />
                      <path d={`M${bx + bw - arm} ${by} H${bx + bw} V${by + arm}`} />
                      <path d={`M${bx + bw} ${by + bh - arm} V${by + bh} H${bx + bw - arm}`} />
                      <path d={`M${bx + arm} ${by + bh} H${bx} V${by + bh - arm}`} />
                    </g>
                  </svg>
                )}
              </div>
            </div>
            {/* top-edge light: a warm inner highlight along the window's upper edge */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: WIN_R, boxShadow: `inset 0 1px 0 ${alpha('#fff4e8', 0.9)}`, pointerEvents: 'none' }} />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// equal-weight stacking within the shutter window: layer i has opacity 1/(i+1), and compositing layer by layer with over gives exactly the arithmetic mean.
// sub-frame count adapts to this frame's displacement: pixels the frame edge travels in the shutter window / 6px, capped at 44.
const SHUTTER = 0.55; // frames (≈200° shutter)
const samplesAt = (f: number) => {
  const a = camAt(f), b = camAt(f - SHUTTER);
  const edge = Math.abs(a.zoom - b.zoom) * 1100 + Math.hypot(a.sx - b.sx, a.sy - b.sy) + Math.abs(a.tilt - b.tilt) * 30;
  return Math.max(1, Math.min(44, Math.ceil(edge / 6)));
};
// sub-frame spacing (screen px) → add a bit of isotropic blur to each layer, smoothing discrete echoes into a continuous trail (small page text is only ~14px tall,
// and with 6px echo spacing the eye can still count the layers)
const smearAt = (f: number, n: number) => {
  const a = camAt(f), b = camAt(f - SHUTTER);
  const edge = Math.abs(a.zoom - b.zoom) * 1100 + Math.hypot(a.sx - b.sx, a.sy - b.sy);
  // only add on truly fast frames: displacement <60px adds none (otherwise the slow segment goes soft overall), ≥260px adds the full amount
  const fast = Math.min(1, Math.max(0, (edge - 60) / 200));
  return Math.min(4, (edge / Math.max(1, n)) * 0.6 * fast);
};

export const CrashZoomReal: React.FC = () => {
  const frame = useCurrentFrame();
  const lock = ramp(frame, 14, 16, EASE.snappy);
  const breath = ramp(frame, 34, 6, EASE.smooth) * (1 - ramp(frame, PUSH, 4, EASE.exit));
  const lift = ramp(frame, HIT + 1, 16, EASE.out);
  const flash = frame >= HIT ? Math.exp(-(frame - HIT) / 3) : 0;
  // frame edge tightens during the push: vignette deepens with the push, relaxes after settling
  const vig = 0.1 + 0.3 * ramp(frame, PUSH, HIT - PUSH, EASE.exit) - 0.36 * ramp(frame, HIT, 18, EASE.out);
  // the stage is almost entirely covered by the window after the push; in the full view it carries "product on a stage"
  const wideFade = 1 - ramp(frame, PUSH, HIT - PUSH, EASE.exit);
  const n = frame >= PUSH && frame <= HIT + 1 ? samplesAt(frame) : 1;
  const smear = n > 1 ? smearAt(frame, n) : 0;
  const callout = frame >= 58;
  const scrim = ramp(frame, 58, 14, EASE.out);
  // the start of the right-column darkening follows the card's right edge (card right edge + 70px), never pressing on the hero
  const cam = camAt(frame);
  const scrimX = cam.sx + (CARD.w / 2) * cam.zoom + 70;
  return (
    <Stage look={L} keyLight={{ x: 0.5, y: 0.0 }} fill={{ x: 0.5, y: 1.05 }} horizon={0.86} intensity={0.9} breathe={0.5} vignette={mix(0.1, 0.5, wideFade)}>
      {/* backlight: an orange halo behind the window traces the outline; floor reflection ellipse */}
      <div style={{ position: 'absolute', inset: 0, opacity: wideFade, background: `radial-gradient(ellipse 38% 44% at 50% 46%, ${alpha(L.accent, 0.34)}, ${alpha(L.accent, 0)} 70%)` }} />
      <div style={{ position: 'absolute', left: 360, right: 360, top: 900, height: 160, opacity: wideFade, borderRadius: '50%', background: `radial-gradient(closest-side, ${alpha('#ff9a5c', 0.28)}, ${alpha('#ff9a5c', 0)})`, filter: 'blur(8px)' }} />
      <div style={{ position: 'absolute', inset: 0, opacity: wideFade }}>
        <Dust look={L} count={34} seed={7} drift={0.3} opacity={0.55} color="#ffb27a" />
      </div>

      {n > 1 ? (
        Array.from({ length: n }, (_, i) => (
          <AbsoluteFill key={i} style={{ opacity: 1 / (i + 1), filter: smear > 0.3 ? `blur(${smear.toFixed(2)}px)` : undefined }}>
            <World f={frame - (SHUTTER * i) / (n - 1)} lift={lift} lock={lock} breath={breath} />
          </AbsoluteFill>
        ))
      ) : (
        <World f={frame} lift={lift} lock={lock} breath={breath} />
      )}

      {/* arrival-frame warm exposure flash: centered on the target card, 8f exponential decay */}
      {flash > 0.01 && (
        <div style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen', background: `radial-gradient(ellipse 55% 60% at 50% 50%, ${alpha(L.accent2, 0.32 * flash)}, ${alpha(L.accent, 0.12 * flash)} 55%, ${alpha(L.accent, 0)} 80%)` }} />
      )}

      {/* right-column readouts: the spot freed by the follow left-shift. A layer of warm black darkening on the right keeps them readable */}
      {callout && (
        <>
          <div style={{ position: 'absolute', inset: 0, opacity: scrim, background: `linear-gradient(90deg, ${alpha('#0e0603', 0)} ${scrimX.toFixed(1)}px, ${alpha('#0e0603', 0.96)} ${(scrimX + 90).toFixed(1)}px, ${alpha('#0e0603', 0.97)} 100%)` }} />
          <div style={{ position: 'absolute', left: 1212, top: 300, width: 620, color: L.ink }}>
            <div style={{ ...type(28, 650, { caps: true }), letterSpacing: '0.2em', color: L.accent, display: 'flex', alignItems: 'center', gap: 16, opacity: ramp(frame, 68, 10, EASE.out), transform: `translateY(${(14 * (1 - ramp(frame, 68, 14, EASE.snappy))).toFixed(2)}px)` }}>
              <span style={{ width: 12, height: 12, borderRadius: 6, background: L.accent, boxShadow: `0 0 14px ${alpha(L.accent, 0.8)}` }} />
              In focus · Efficient Models
            </div>
            {/* clipPath only clips below the line box's lower edge: when rising letter by letter from below the line, un-risen glyphs won't peek out of the mask's inner padding */}
            <div style={{ ...type(232, 700), letterSpacing: '-0.055em', marginTop: 26, marginLeft: -10, clipPath: 'inset(-40px -60px 0 -60px)' }}>
              <TextReveal text="−41%" by="char" variant="rise" start={71} each={18} gap={2.2} ease={EASE.snappy} />
            </div>
            <div style={{ height: 2, width: 520, marginTop: 30, background: alpha(L.ink, 0.16), transform: `scaleX(${ramp(frame, 76, 22, EASE.snappy).toFixed(4)})`, transformOrigin: '0 50%' }} />
            <div style={{ ...type(52, 600), marginTop: 30 }}>
              <TextReveal text="inference cost" by="word" variant="blur" start={79} each={16} gap={4} ease={EASE.out} />
            </div>
            <div style={{ ...type(40, 400), color: L.ink2, marginTop: 14 }}>
              <TextReveal text="at equal accuracy, routed per query" by="word" variant="blur" start={83} each={15} gap={2} ease={EASE.out} />
            </div>
          </div>
        </>
      )}
      <Vignette strength={Math.max(0, vig)} inner={0.42} color={L.shadow} cy={0.5} />
    </Stage>
  );
};
