// reticle-lock-on: reticle bite (Iron Man HUD / Ender's Game)
// FakeDashboard sits at rest. A viewfinder made of four L-shaped corner marks flies in from off-screen (a big frame),
// overshoots and rebounds, then shrinks to hug the four corners of the target card and "clicks" into a bite-lock freeze; on the lock frame the card brightens slightly +
// a small label pops up above. The picture does not freeze; this is a capture in motion.
// f0–14 panel at rest; f14–24 fly in; f20–46 shrink (with overshoot rebound); f46 bite lock;
// label pops f48–58; then still ≥30f (90f total).
//
// Texture upgrade: added the exported duration (the workbench had guessed 24f from the source and only played half of the fly-in); the target frame now uses the fixture's real
// card geometry (524×454; the original 425 height was 29px short and could not bite the lower edge); the corner marks go from 10px solid black blocks to 5px round-capped accent-color
// strokes + a white outline underlay (clear on any background color) + center cross tick marks; the fly-in is given diagonal motion blur by velocity;
// the shrink now overlaps the fly-in with asymmetric easing as one continuous overshoot (no longer pausing at every keyframe); on the lock frame the corner marks give one "click" of
// tightening pulse, the target brightens slightly as a top-bright gradient clipped to the rounded corners + an accent-color outline, and the rest of the picture is lightly dimmed to focus; the label becomes a publication-grade
// dark capsule (status dot + card name + monospace lock number); the whole shot pushes very slowly toward the target, "calling out while in flow".
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G, FakeDashboard } from '../../../shared/fixtures/Fixtures';
import { EASE, FONT, Grain, SpeedBlur, mix, ramp } from '../../../shared/fixtures/Polish';

export const RETICLE_LOCK_ON_DURATION = 90; // 3s: fly in → bite lock → label → still ≥1s

// Target: the 2nd card of the variant A grid (middle of the first row). Fixture geometry: card 524×454 @ x=808, y=108
const CARD_X = 808;
const CARD_Y = 108;
const CARD_W = 524;
const CARD_H = 454;
const PAD = 16; // breathing distance between corner marks and the card after the lock

const TCX = CARD_X + CARD_W / 2;
const TCY = CARD_Y + CARD_H / 2;

const FLY_IN = 14; // fly-in start
const FLY_END = 24; // fly-in end (big frame in place)
const SHRINK0 = 20; // shrink start (overlaps the fly-in tail by 4f, so the motion is continuous with no pause)
const UNDER = 40; // moment of over-shrinking (0.94×)
const LOCK_END = 46; // bite-lock frame
const LABEL0 = LOCK_END + 2;
const LABEL_END = LOCK_END + 12;

const ARM = 58; // L arm length
const THICK = 5; // L stroke thickness
const INK = G.accent; // corner mark color: the only accent color

const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

// Fly-in displacement (px): the whole frame rushes in from off-screen lower right, ease-out cubic
const flyAt = (f: number) => {
  const t = interpolate(f, [FLY_IN, FLY_END], [0, 1], { easing: Easing.out(Easing.cubic), ...clamp });
  return { x: (1 - t) * 1100, y: (1 - t) * 620 };
};
// Shrink ratio: 2.2 → 0.94 (swift asymmetric easing, overshoots) → 1 (ease-out rebound settles)
const shrinkAt = (f: number) =>
  f < UNDER ? mix(2.2, 0.94, ramp(f, SHRINK0, UNDER - SHRINK0, EASE.swift)) : mix(0.94, 1, ramp(f, UNDER, LOCK_END - UNDER, EASE.out));

export const ReticleLockOn: React.FC = () => {
  const frame = useCurrentFrame();

  const fly = flyAt(frame);
  const fly0 = flyAt(frame - 0.5);
  const fly1 = flyAt(frame + 0.5);
  const shrink = shrinkAt(frame);
  // Lock "click": at the instant of locking the corner marks tighten a further 6px inward then spring back (4f)
  const bite = interpolate(frame, [LOCK_END, LOCK_END + 1, LOCK_END + 5], [0, 1, 0], clamp);
  const hw = (CARD_W / 2 + PAD) * shrink - 6 * bite;
  const hh = (CARD_H / 2 + PAD) * shrink - 6 * bite;

  // Lock frame: the card brightens slightly (quick flash 0.55 then settles at 0.28; clipped to the card's rounded corners)
  const glow = interpolate(frame, [LOCK_END, LOCK_END + 3, LOCK_END + 10], [0, 0.55, 0.28], clamp);
  // Focus: lightly dim everything outside the target (reaches 0.10 within 10f after the lock)
  const focus = interpolate(frame, [LOCK_END - 2, LOCK_END + 10], [0, 1], { easing: Easing.out(Easing.cubic), ...clamp });

  // Label: after the lock, pops up from above the top-left corner mark (scale back overshoot + fade in)
  const labelT = interpolate(frame, [LABEL0, LABEL_END], [0, 1], { easing: Easing.out(Easing.back(1.8)), ...clamp });

  // Camera: very slow push toward the target throughout (1 → 1.035), smooth in-out, no velocity jump at start or end
  const cam = mix(1, 1.035, ramp(frame, 0, RETICLE_LOCK_ON_DURATION - 1, EASE.smooth));

  const showReticle = frame >= FLY_IN;
  const locked = frame >= LOCK_END;
  const reticleOp = interpolate(frame, [FLY_IN, FLY_IN + 3], [0, 1], clamp);

  // Four L corners: position = center ± (hw, hh), each mirrored
  const corners = [
    { x: TCX - hw, y: TCY - hh, sx: 1, sy: 1 },
    { x: TCX + hw, y: TCY - hh, sx: -1, sy: 1 },
    { x: TCX - hw, y: TCY + hh, sx: 1, sy: -1 },
    { x: TCX + hw, y: TCY + hh, sx: -1, sy: -1 },
  ];
  // L stroke: white underlay (expanded 2px) + accent-color core, round caps
  const stroke = (w: number, h: number, under: boolean): React.CSSProperties => ({
    position: 'absolute', left: under ? -2 : 0, top: under ? -2 : 0,
    width: w + (under ? 4 : 0), height: h + (under ? 4 : 0), borderRadius: 4,
    background: under ? 'rgba(255,255,255,0.92)' : INK,
    boxShadow: under ? '0 2px 6px rgba(16,18,40,0.18)' : 'none',
  });

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${cam})`, transformOrigin: `${TCX}px ${TCY}px` }}>
        <FakeDashboard variant="A" />
        {/* Focus dimming: a giant box-shadow ring outside the target card (hollowed at the target, same corner radius) */}
        {focus > 0 && (
          <div style={{
            position: 'absolute', left: CARD_X, top: CARD_Y, width: CARD_W, height: CARD_H, borderRadius: 14,
            boxShadow: `0 0 0 3000px rgba(16,18,28,${(0.1 * focus).toFixed(3)})`, pointerEvents: 'none',
          }} />
        )}
        {/* Lock brightening layer: conditionally rendered, absent before the lock; a top-bright bottom-faint gradient clipped to the rounded corners + a thin accent-color outline */}
        {locked && (
          <div style={{
            position: 'absolute', left: CARD_X, top: CARD_Y, width: CARD_W, height: CARD_H, borderRadius: 14,
            overflow: 'hidden', pointerEvents: 'none',
            boxShadow: `0 0 0 1.5px rgba(91,99,211,${(0.55 * focus).toFixed(3)}), 0 18px 48px -16px rgba(91,99,211,${(0.35 * focus).toFixed(3)})`,
          }}>
            <div style={{
              position: 'absolute', inset: 0, opacity: glow,
              background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.55) 60%, rgba(255,255,255,0.35) 100%)',
            }} />
          </div>
        )}
        {showReticle && (
          <SpeedBlur vx={fly1.x - fly0.x} vy={fly1.y - fly0.y} amount={0.3} max={22}>
            <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${fly.x}px, ${fly.y}px)`, opacity: reticleOp }}>
              {corners.map((c, i) => (
                <div key={i} style={{ position: 'absolute', left: c.x, top: c.y, transform: `scale(${c.sx}, ${c.sy})`, transformOrigin: '0 0' }}>
                  {/* L-shaped corner marks: horizontal arm + vertical arm (underlay first, then core) */}
                  <div style={stroke(ARM, THICK, true)} />
                  <div style={stroke(THICK, ARM, true)} />
                  <div style={stroke(ARM, THICK, false)} />
                  <div style={stroke(THICK, ARM, false)} />
                </div>
              ))}
              {/* Center cross tick: visible in flight, fades out after the lock (the semantic handoff from reticle → viewfinder) */}
              {[0, 1].map((k) => (
                <div key={k} style={{
                  position: 'absolute', left: TCX - (k ? 1.5 : 14), top: TCY - (k ? 14 : 1.5), width: k ? 3 : 28, height: k ? 28 : 3,
                  borderRadius: 2, background: INK, opacity: 0.8 * (1 - focus), boxShadow: '0 0 0 2px rgba(255,255,255,0.85)',
                }} />
              ))}
            </div>
          </SpeedBlur>
        )}
        {/* Small label: pops up directly above the top-left corner mark (lands in the empty area of the top bar, without covering the neighboring card's title) */}
        {frame >= LABEL0 && (
          <div style={{
            position: 'absolute', left: TCX - hw + 2, top: TCY - hh - 70,
            transform: `scale(${labelT})`, transformOrigin: '0 100%', opacity: Math.min(1, labelT * 1.5),
            display: 'flex', alignItems: 'center', gap: 14, whiteSpace: 'nowrap',
            background: 'linear-gradient(180deg, #23252c 0%, #17181d 100%)', color: '#fff', fontFamily: FONT.sans,
            padding: '10px 16px 10px 14px', borderRadius: 12,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 0 0 1px rgba(0,0,0,0.25), 0 2px 4px rgba(16,18,24,0.18), 0 16px 32px -10px rgba(16,18,24,0.45)',
          }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: '#8a91ff', boxShadow: '0 0 0 4px rgba(138,145,255,0.22)' }} />
            <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.015em' }}>Top pages</span>
            <span style={{
              fontFamily: FONT.mono, fontSize: 18, fontWeight: 500, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)',
              padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.07)',
            }}>LOCK 02</span>
          </div>
        )}
      </div>
      <Grain opacity={0.035} />
    </div>
  );
};
