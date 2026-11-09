// crash-impact: crash push with a hard stop (second redesign), the same push as crash-zoom, but on arrival it doesn't rebound, it stops dead with a screen shake:
// high-frequency jitter + exponential decay over 6f, then truly still. The contrast: a sense of weight ("this is it") vs the rebound variant's elasticity ("look at this").
//
// Design decisions
// - look: lime (graphite dark field + fluorescent yellow-green). Set apart from the rebound variant of the same card (ember · leaned-back browser window · editorial readouts):
//   this one uses a "tactical HUD" language: the real projects page is made into a head-on monitor screen, with a faint grid laid on the stage;
//   a fluorescent viewfinder scans the full view (card1 → card5 → card4, snappy cell jumps), and only after locking card4 does the push come.
// - the weight of the hard stop: on the arrival frame an "impact frame": the whole area outside the card is first filled with fluorescent yellow-green (1f), then crushed to near-black within 3f (the flash
//   of dust kicked up by a heavy object hitting the ground, not a warm exposure); two fluorescent shock-wave rings spread outward from the card edge; screen shake 14px·e^(−t/1.8), the first beat sinks along the impact direction.
//   The target card doesn't float up or glow: it is "slammed solid", not "bounced up". Only this one place acts on the whole frame (R4).
// - after settling: a scan line sweeps over the card face once from top to bottom (Q4: the only light effect, clipped to the rounded corners), and the left and right HUD readouts land in a stagger:
//   the left column has monospace TARGET / OWNER / STATE readouts, the right column a 240px fluorescent "P0" + description. The last frame is a complete poster.
// - the screenshot texture is kept (Q1); card4 is overlaid with a 4x high-res texture in place, so the close-up text isn't blurry (Q2).
//
// Timeline (30fps, 126f)
//   0–4    full view: monitor already on screen, grid and corner marks fade in, stage zoom starts at 0.78 with a very slow 2% push in
//   4–30   scan: viewfinder lands on card1 (4f) → jumps to card5 at 10f → jumps to card4 at 20f (8f snappy each), tightens and locks at 28f + LOCK tag
//   32–40  prep: zoom pulls back ~3% (smooth), viewfinder expands outward one breath
//   40–46  crash push 6f: strong ease-in in log space 0.76→2.35, target card screen position converges monotonically toward the frame center; only this segment gets time-sampled motion blur
//   46     hard stop: impact frame (46 fluorescent / 47 afterglow / 48 onward near-black) + shock-wave rings; 46–52 shake settles (crisp jitter, no blur added)
//   52–68  scan line sweeps over the card face (16f); 54–84 left and right HUD readouts land in a stagger (label → value, one beat every 3–4f)
//   84–125 hold 42f: very slow push in 1→1.012, the last frame settles cleanly
import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import layout from '../../../shared/fixtures/live-layout.json';
import { EASE, Grain, Vignette, mix, ramp } from '../../../shared/fixtures/Polish';
import { LOOKS, Stage, TextReveal, alpha, type } from '../../../shared/fixtures/Look';

export const CRASHIMPACT_DUR = 126;

// lime's key light is changed to a cooler gray-green: the stage light doesn't steal from the fluorescent accent color (fluorescent only goes to the viewfinder / impact / P0)
const L = { ...LOOKS.lime, light: '#9aa58a' };
const LIME = L.accent;
const CARDS = layout.projects.cards;
const CARD = CARDS[3];
const TARGET = { cx: CARD.x + CARD.w / 2, cy: CARD.y + CARD.h / 2 }; // ≈ (960, 772) page coordinates
const CARD_R = 8.5; // card corner radius in the screenshot (page px)
// monitor screen framing (page coordinates): crop a block centered on card4, so three rows of cards are visible in the full view
const CROP = { x: 395, y: 222, w: 1130, h: 1100 };
const CROP_C = { x: CROP.x + CROP.w / 2, y: CROP.y + CROP.h / 2 };
const SCREEN_R = 22; // monitor screen corner radius (page px)

const PUSH = 40;
const HIT = 46;
const Z_WIDE = 0.78;
const Z_HIT = 2.35; // settled zoom: card ≈ 840×733, 68% of the frame height, ~540px left on each side for the HUD readouts

// camera: zoom + screen position of the target card center (interpolating the "target position" rather than the camera center: during the push the target converges monotonically to the frame center)
const camAt = (f: number) => {
  const creep = mix(Z_WIDE, Z_WIDE * 1.02, ramp(f, 0, 32, EASE.smooth));
  const wind = creep * mix(1, 0.97, ramp(f, 32, 8, EASE.smooth));
  const wideSx = 960 + (TARGET.cx - CROP_C.x) * wind;
  const wideSy = 540 + (TARGET.cy - CROP_C.y) * wind;
  if (f < PUSH) return { zoom: wind, sx: wideSx, sy: wideSy };
  const p = ramp(f, PUSH, HIT - PUSH, EASE.exit); // stops on arrival: no rebound segment
  const zoom = Math.exp(mix(Math.log(wind), Math.log(Z_HIT), p)) * (1 + 0.012 * ramp(f, 84, 41, EASE.smooth));
  return { zoom, sx: mix(wideSx, 960, p), sy: mix(wideSy, 540, p) };
};

// hard-stop screen shake (screen space, deterministic): the cos starting phase makes frame 0 take the envelope peak and point downward (the impact direction continues),
// frequency ~2.9 rad/f makes adjacent frames nearly flip sign: a high-frequency "hard jitter" rather than a handheld sway; x-axis amplitude 0.55, slight rotation 0.025°/px
const shakeAt = (f: number) => {
  const t = f - HIT;
  if (t < 0) return { sx: 0, sy: 0, rot: 0 };
  const env = 14 * Math.exp(-t / 1.8);
  if (env < 0.15) return { sx: 0, sy: 0, rot: 0 };
  return { sx: env * 0.55 * Math.sin(t * 2.4 + 0.6), sy: env * Math.cos(t * 2.9), rot: env * 0.025 * Math.sin(t * 3.7 + 1.9) };
};

// scan viewfinder: lands in turn on card1 → card5 → card4 (center and size in page coordinates), snappy cell jumps
const HOPS = [
  { at: 4, c: CARDS[0] },
  { at: 10, c: CARDS[4] },
  { at: 20, c: CARD },
];
const reticleAt = (f: number) => {
  const box = (c: typeof CARD) => ({ x: c.x + c.w / 2, y: c.y + c.h / 2, w: c.w, h: c.h });
  let r = box(HOPS[0].c);
  for (let i = 1; i < HOPS.length; i++) {
    const u = ramp(f, HOPS[i].at, 8, EASE.snappy);
    const b = box(HOPS[i].c);
    r = { x: mix(r.x, b.x, u), y: mix(r.y, b.y, u), w: mix(r.w, b.w, u), h: mix(r.h, b.h, u) };
  }
  return r;
};

// the whole world under one camera pose (monitor + page + viewfinder + shock waves), reused for the motion-blur sub-frames
const World: React.FC<{ f: number; frame: number }> = ({ f, frame }) => {
  const { zoom, sx, sy } = camAt(f);
  const tx = sx - TARGET.cx * zoom;
  const ty = sy - TARGET.cy * zoom;
  const px = (n: number) => n / zoom; // screen px → page px (constant line width)
  // viewfinder
  const r = reticleAt(frame);
  const show = ramp(frame, 3, 6, EASE.out);
  const lock = ramp(frame, 28, 8, EASE.snappy);
  const breath = ramp(frame, 32, 8, EASE.smooth) * (1 - ramp(frame, PUSH, 5, EASE.exit));
  const pad = mix(26, 10, lock) + 16 * breath;
  const arm = px(30);
  const bx = r.x - r.w / 2 - pad, by = r.y - r.h / 2 - pad, bw = r.w + pad * 2, bh = r.h + pad * 2;
  // hard stop: first the impact frame outside the card (fluorescent) → crushed to near-black within 3f
  const t = frame - HIT;
  const crush = t >= 0;
  const impact = t < 0 ? 0 : t < 1 ? 0.8 : t < 2 ? 0.22 : 0; // impact frame: 1f fluorescent → 1f afterglow → near-black
  const scrimColor = `rgba(${Math.round(mix(11, 198, impact))},${Math.round(mix(12, 244, impact))},${Math.round(mix(9, 50, impact))},${(t < 0 ? 0 : 1).toFixed(3)})`;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: layout.projects.pageH, transformOrigin: '0 0', transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${zoom.toFixed(5)})` }}>
      {/* monitor screen: crops out the CROP block of the page; outside the screen is the stage */}
      <div style={{
        position: 'absolute', left: CROP.x, top: CROP.y, width: CROP.w, height: CROP.h, borderRadius: SCREEN_R, overflow: 'hidden',
        background: '#f9f6f1',
        boxShadow: `0 0 0 ${px(1.5)}px ${alpha(LIME, 0.35)}, 0 ${px(40)}px ${px(110)}px ${px(-10)}px rgba(0,0,0,0.85)`,
      }}>
        <div style={{ position: 'absolute', left: -CROP.x, top: -CROP.y, width: 1920, height: layout.projects.pageH }}>
          <Img src={staticFile('textures/live/projects-full.png')} style={{ position: 'absolute', width: 1920 }} />
          {/* in the full view the page is pressed down one step, so it doesn't fight the dark-field stage */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(12,14,10,0.1)' }} />
          {/* scan crosshair: runs across the monitor screen, following the viewfinder center */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: r.y, height: px(1.2), background: alpha('#2d3a00', 0.35 * show * (1 - lock * 0.6)) }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: r.x, width: px(1.2), background: alpha('#2d3a00', 0.35 * show * (1 - lock * 0.6)) }} />
        </div>
      </div>
      {/* hard-stop darkening: a shadow with a huge spread around the card serves as a mask (impact frame fluorescent first, then near-black) */}
      {crush && (
        <div style={{ position: 'absolute', left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, borderRadius: CARD_R, boxShadow: `0 0 0 6000px ${scrimColor}` }} />
      )}
      {/* the darkened "desktop": a very faint cool-gray pool of light behind the card, so the dark field isn't a dead flat color (not a glow: the card itself doesn't glow) */}
      {crush && (
        <div style={{
          position: 'absolute', left: CARD.x - CARD.w * 1.6, top: CARD.y - CARD.h * 1.3, width: CARD.w * 4.2, height: CARD.h * 3.6,
          background: `radial-gradient(ellipse 50% 50% at 50% 46%, ${alpha('#c9d4b8', 0.09 * (1 - impact))}, ${alpha('#c9d4b8', 0)} 70%)`,
        }} />
      )}
      {/* high-res target card overlaid in place (Q2) */}
      <Img src={staticFile('textures/live/card4-hires.png')} style={{ position: 'absolute', left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, borderRadius: CARD_R }} />
      {/* scan line: after settling, sweeps over the card face once from top to bottom, clipped to the rounded corners (Q4) */}
      {frame >= 52 && frame <= 70 && (
        <div style={{ position: 'absolute', left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, borderRadius: CARD_R, overflow: 'hidden', pointerEvents: 'none' }}>
          {(() => {
            const y = mix(-0.12, 1.08, ramp(frame, 52, 16, EASE.swift)) * CARD.h;
            return (
              <>
                <div style={{ position: 'absolute', left: 0, right: 0, top: y - 60, height: 60, background: `linear-gradient(180deg, ${alpha(LIME, 0)}, ${alpha(LIME, 0.16)})` }} />
                <div style={{ position: 'absolute', left: 0, right: 0, top: y - px(1.5), height: px(3), background: alpha(LIME, 0.95), boxShadow: `0 0 ${px(14)}px ${alpha(LIME, 0.8)}` }} />
              </>
            );
          })()}
        </div>
      )}
      {/* shock wave: two rounded rings spread outward from the card edge (page coordinates, line width constant on screen) */}
      {t >= 0 && t < 20 && [0, 3].map((d, k) => {
        const u = ramp(frame, HIT + d, 16, EASE.snappy);
        const grow = mix(0, k ? 60 : 110, u);
        const op = (1 - u) * (k ? 0.6 : 1) * (frame >= HIT + d ? 1 : 0);
        return (
          <div key={k} style={{
            position: 'absolute', left: CARD.x - grow, top: CARD.y - grow, width: CARD.w + grow * 2, height: CARD.h + grow * 2,
            borderRadius: CARD_R + grow * 0.5, border: `${px(k ? 2 : 4)}px solid ${alpha(LIME, op)}`, boxSizing: 'border-box',
            boxShadow: `0 0 ${px(20)}px ${alpha(LIME, op * 0.5)}`,
          }} />
        );
      })}
      {/* card edge: after settling, a ring of fluorescent hairline (the viewfinder's "locked" state) */}
      {t >= 0 && (
        <div style={{ position: 'absolute', left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, borderRadius: CARD_R, boxShadow: `0 0 0 ${px(2)}px ${alpha(LIME, 0.9)}`, pointerEvents: 'none' }} />
      )}
      {/* viewfinder corner marks (page coordinates; line width inverse-scaled by zoom, a constant 4px on screen) */}
      {show > 0 && (
        <svg width={bw + 80} height={bh + 80} viewBox={`${bx - 40} ${by - 40} ${bw + 80} ${bh + 80}`}
          style={{ position: 'absolute', left: bx - 40, top: by - 40, overflow: 'visible', opacity: show }}>
          <g fill="none" stroke={LIME} strokeWidth={px(4)} strokeLinecap="square">
            <path d={`M${bx} ${by + arm} V${by} H${bx + arm}`} />
            <path d={`M${bx + bw - arm} ${by} H${bx + bw} V${by + arm}`} />
            <path d={`M${bx + bw} ${by + bh - arm} V${by + bh} H${bx + bw - arm}`} />
            <path d={`M${bx + arm} ${by + bh} H${bx} V${by + bh - arm}`} />
          </g>
          {/* center crosshair */}
          <g stroke={LIME} strokeWidth={px(2)} opacity={1 - lock}>
            <path d={`M${r.x - px(14)} ${r.y} H${r.x + px(14)} M${r.x} ${r.y - px(14)} V${r.y + px(14)}`} />
          </g>
        </svg>
      )}
    </div>
  );
};

// equal-weight stacking within the shutter window: layer i has opacity 1/(i+1), and compositing layer by layer with over gives exactly the arithmetic mean; sub-frame spacing ≤8px, capped at 36
const SHUTTER = 0.55;
const edgeAt = (f: number) => {
  const a = camAt(f), b = camAt(f - SHUTTER);
  return Math.abs(a.zoom - b.zoom) * 1100 + Math.hypot(a.sx - b.sx, a.sy - b.sy);
};

// HUD readouts (screen space): label → value, landing in a stagger
const Readout: React.FC<{ frame: number; at: number; label: string; children: React.ReactNode }> = ({ frame, at, label, children }) => {
  const a = ramp(frame, at, 12, EASE.snappy);
  return (
    <div style={{ marginBottom: 46 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, ...type(22, 600, { mono: true }), letterSpacing: '0.2em', color: LIME, opacity: a, textTransform: 'uppercase' }}>
        <span style={{ height: 2, width: mix(0, 28, a), background: LIME }} />
        {label}
      </div>
      <div style={{ marginTop: 12, opacity: ramp(frame, at + 3, 10, EASE.out), transform: `translateX(${((1 - ramp(frame, at + 3, 14, EASE.snappy)) * -24).toFixed(1)}px)` }}>{children}</div>
    </div>
  );
};

export const CrashImpactReal: React.FC = () => {
  const frame = useCurrentFrame();
  const { sx, sy, rot } = shakeAt(frame);
  const n = frame >= PUSH && frame <= HIT ? Math.max(1, Math.min(36, Math.ceil(edgeAt(frame) / 8))) : 1;
  const smear = n > 1 ? Math.min(4, (edgeAt(frame) / n) * 0.5 * Math.min(1, Math.max(0, (edgeAt(frame) - 60) / 200))) : 0;
  const wide = 1 - ramp(frame, PUSH, HIT - PUSH, EASE.exit);
  const vig = frame < HIT ? 0.35 + 0.25 * ramp(frame, PUSH, HIT - PUSH, EASE.exit) : mix(0.75, 0.4, ramp(frame, HIT, 16, EASE.out));
  // viewfinder label (screen space, follows the viewfinder in the full view; retracts as soon as the push begins)
  const cam = camAt(frame);
  const r = reticleAt(frame);
  const lock = ramp(frame, 28, 8, EASE.snappy);
  const tagX = cam.sx + (r.x - r.w / 2 - TARGET.cx) * cam.zoom - 12;
  const tagY = cam.sy + (r.y + r.h / 2 - TARGET.cy) * cam.zoom + 22; // the label hangs at the viewfinder's lower left (the first cell card1 is in the top row, hanging at the top edge would collide with the screen title)
  const hop = frame < 10 ? '01' : frame < 20 ? '05' : '04';
  return (
    <AbsoluteFill style={{ background: L.bg[2], overflow: 'hidden' }}>
      <Stage look={L} keyLight={{ x: 0.5, y: -0.1 }} fill={{ x: 0.5, y: 1.1 }} intensity={0.6} breathe={0.4} vignette={0.2}>
        {/* stage grid: parallax with 30% of the camera's scale, hides into the dark field after the push */}
        <div style={{
          position: 'absolute', inset: -400, opacity: 0.55 * wide + 0.1,
          transform: `scale(${(1 + (cam.zoom / Z_WIDE - 1) * 0.3).toFixed(4)})`,
          backgroundImage: `linear-gradient(${alpha(LIME, 0.07)} 1.5px, transparent 1.5px), linear-gradient(90deg, ${alpha(LIME, 0.07)} 1.5px, transparent 1.5px)`,
          backgroundSize: '64px 64px', backgroundPosition: '400px 400px',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 80%)',
        }} />
      </Stage>

      {/* shake layer: page + mask + shock waves shake together (at 2.35x the page far exceeds the frame, so shaking shows no edge) */}
      <AbsoluteFill style={{ transform: `translate(${sx.toFixed(2)}px, ${sy.toFixed(2)}px) rotate(${rot.toFixed(4)}deg)` }}>
        {n > 1 ? (
          Array.from({ length: n }, (_, i) => (
            <AbsoluteFill key={i} style={{ opacity: 1 / (i + 1), filter: smear > 0.3 ? `blur(${smear.toFixed(2)}px)` : undefined }}>
              <World f={frame - (SHUTTER * i) / (n - 1)} frame={frame} />
            </AbsoluteFill>
          ))
        ) : (
          <World f={frame} frame={frame} />
        )}
      </AbsoluteFill>

      {/* full-view HUD: monospace labels at the two upper corners of the monitor screen + viewfinder label */}
      <AbsoluteFill style={{ opacity: wide, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', left: 960 - (CROP.w / 2) * cam.zoom, top: 540 - (CROP.h / 2) * cam.zoom - 50, display: 'flex', gap: 14, alignItems: 'center', ...type(22, 600, { mono: true }), letterSpacing: '0.18em', color: L.ink2, opacity: ramp(frame, 0, 8, EASE.out) }}>
          <span style={{ width: 10, height: 10, borderRadius: 5, background: LIME, boxShadow: `0 0 12px ${alpha(LIME, 0.8)}` }} />
          LIVE · /PROJECTS
        </div>
        <div style={{ position: 'absolute', right: 960 - (CROP.w / 2) * cam.zoom, top: 540 - (CROP.h / 2) * cam.zoom - 50, ...type(22, 600, { mono: true }), letterSpacing: '0.18em', color: L.ink3 }}>
          10 PROJECTS · SCANNING
        </div>
        {frame >= 4 && (
          <div style={{
            position: 'absolute', left: tagX, top: tagY, height: 34, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 10, borderRadius: 4,
            background: lock > 0.5 ? LIME : alpha('#0b0d06', 0.85), color: lock > 0.5 ? L.onAccent : LIME,
            border: `1.5px solid ${LIME}`, ...type(22, 700, { mono: true }), letterSpacing: '0.14em',
            opacity: ramp(frame, 4, 4, EASE.out), transform: `scale(${mix(1.25, 1, ramp(frame, 28, 6, EASE.snappy)).toFixed(3)})`, transformOrigin: '0 0',
          }}>
            {lock > 0.5 ? `LOCK ${hop}` : `SCAN ${hop}`}
          </div>
        )}
      </AbsoluteFill>

      {/* settled HUD: monospace readouts in the left column, P0 in the right column */}
      {frame >= 52 && (
        <AbsoluteFill style={{ pointerEvents: 'none', transform: `translate(${(sx * 0.4).toFixed(2)}px, ${(sy * 0.4).toFixed(2)}px)` }}>
          <div style={{ position: 'absolute', left: 104, top: 262 }}>
            <Readout frame={frame} at={54} label="Target">
              <div style={{ ...type(64, 600, { mono: true }), color: L.ink }}>04<span style={{ color: L.ink3 }}>/10</span></div>
            </Readout>
            <Readout frame={frame} at={58} label="Owner">
              <div style={{ ...type(48, 600), color: L.ink }}>Yuki</div>
            </Readout>
            <Readout frame={frame} at={62} label="State">
              <div style={{ ...type(48, 600), color: L.ink, display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ width: 16, height: 16, borderRadius: 8, background: LIME, boxShadow: `0 0 16px ${alpha(LIME, 0.9)}` }} />
                Active
              </div>
            </Readout>
          </div>
          <div style={{ position: 'absolute', left: 1452, top: 258, width: 400 }}>
            <div style={{ ...type(22, 600, { mono: true }), letterSpacing: '0.2em', color: LIME, opacity: ramp(frame, 60, 10, EASE.out) }}>PRIORITY · THIS SPRINT</div>
            <div style={{ ...type(250, 800, { mono: true }), letterSpacing: '-0.04em', color: LIME, marginTop: 18, marginLeft: -12, textShadow: `0 0 60px ${alpha(LIME, 0.35)}` }}>
              <TextReveal text="P0" by="char" variant="rise" start={62} each={16} gap={3} />
            </div>
            <div style={{ height: 2, width: 360, marginTop: 28, background: alpha(L.ink, 0.18), transform: `scaleX(${ramp(frame, 70, 18, EASE.snappy).toFixed(4)})`, transformOrigin: '0 50%' }} />
            <div style={{ ...type(40, 500), color: L.ink, marginTop: 28 }}>
              <TextReveal text="7 open questions" by="word" variant="blur" start={74} each={14} gap={3} ease={EASE.out} />
            </div>
            <div style={{ ...type(32, 400), color: L.ink2, marginTop: 10 }}>
              <TextReveal text="Routing ships first." by="word" variant="blur" start={79} each={14} gap={3} ease={EASE.out} />
            </div>
          </div>
        </AbsoluteFill>
      )}
      <Vignette strength={vig} inner={0.4} color={L.shadow} cy={0.5} />
      <Grain opacity={0.07} blend="soft-light" />
    </AbsoluteFill>
  );
};
