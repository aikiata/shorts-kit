// barn-door-split-reveal: the old page splits down the middle into two doors that accelerate outward and make way, and the new page rises to meet you through the gap.
//
// Round 2 redesign (Ember, version-replacement launch):
// - look = ember (warm black + orange). The meaning is "old gives way to new": the old page = the current shorts-kit release "shorts-kit 3" (illustrative version number),
//   cold grey, no accent color, like a metal plate whose fire has gone out; the new page = the "shorts-kit 4" launch poster, warm black stage + ember orange, with the shot-engraving mark before the eyebrow.
//   Both pages share one layout and the same slots (eyebrow / 220px wordmark / subtitle / three stats), so once the doors open, a "4" stands where the "3" was: the replacement reads at a glance.
// - The doors are solid plates with thickness: the 10px inner-edge bevel is lit by the seam light (orange rim light), and the door face near the crack is tinted warm by the light;
//   the light through the seam is the new page's light: first a hairline of light traces up and down from the midpoint (foreshadowing the crack), then a band of light opens up,
//   and as the doors slide away the new page develops with an overexposed light beam (screen blend, decaying as the doors move off).
// - Motion: the crack pre-opens with ease-in (anticipation), then the doors accelerate with ease-in 1000px ("making way", not "being pushed away"), with horizontal motion blur by speed;
//   the new page rises to meet you 1.08 to 1 (snappy, starting 2f after the doors); after settling, the subtitle rises word by word and the three stats roll from old values to new
//   (render 64s to 11.8s, hand-keyed keyframes 12 to 0: the numbers themselves say "the new version saves effort", all illustrative values).
//
// Timeline (30fps, 150f total):
//   0-24    Old page set up: cold grey poster, camera very slowly pushes in 1 to 1.015; frame 0 is already a complete picture
//   20-30   Foreshadow: the center-seam hairline of light traces up and down from the midpoint (snappy 10f), both door faces tinted warm by the light
//   30-40   Anticipation: the gap opens with ease-in 0 to 16px, the band of light brightens
//   40-64   Main action: each door translateX -/+1000 (ease-in 24f) + horizontal motion blur
//   42-78   New page 1.08 to 1 rising to meet (snappy 36f); overexposed beam decays 40-74
//   64-110  Follow-through: subtitle rises word by word (64), three stats roll to new values staggered (72-104)
//   110-150 Hold: embers slowly drift up, wordmark glow breathes, camera very slowly pushes in 1.8%; the last frame is a complete launch poster
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { EASE, FONT, SpeedBlur, bezier, mix, ramp, velocity } from '../../../shared/fixtures/Polish';
import { Dust, LOOKS, Stage, TextReveal, alpha, glow, stagger, type } from '../../../shared/fixtures/Look';
import { ShortKitMark } from '../../../shared/fixtures/Brand';

export const BARN_DOOR_SPLIT_DURATION = 150;

const L = LOOKS.ember;
// Old page: cold grey metal plate (deliberately no accent color)
const OLD = { bg0: '#1d1f23', bg1: '#141518', ink: '#9a9ea7', ink2: '#6f737b', ink3: '#4a4d54', line: 'rgba(255,255,255,0.07)' };

const CRACK = 20; // hairline of light starts
const GAP = 30; // gap pre-open starts
const SLIDE = 40; // doors start accelerating
const SLIDE_D = 24;
const SLIDE_EASE = bezier(0.42, 0, 0.8, 0.25); // ease-in (about cubic-in, a bit harsher): the start is visible and it gets faster, rather than vanishing only on the last frame

const gapAt = (f: number) => 16 * ramp(f, GAP, 10, EASE.exit);
const slideAt = (f: number) => 1000 * ramp(f, SLIDE, SLIDE_D, SLIDE_EASE);
const doorAt = (f: number) => gapAt(f) / 2 + slideAt(f); // outward offset of a single door

// Three stats: old value to new value (illustrative values)
const STATS = [
  { from: 64, to: 11.8, dec: 1, unit: 's', label: 'Median render' },
  { from: 12, to: 0, dec: 0, unit: '', label: 'Manual keyframes' },
  { from: 6, to: 30, dec: 0, unit: '', label: 'Preview fps' },
];

// Layout skeleton shared by both pages: eyebrow / wordmark / subtitle / stats row (same slots = replacement)
const Layout: React.FC<{
  kicker: React.ReactNode; mark: React.ReactNode; sub: React.ReactNode; stats: React.ReactNode;
}> = ({ kicker, mark, sub, stats }) => (
  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: FONT.sans }}>
    <div style={{ marginTop: 214, height: 40 }}>{kicker}</div>
    <div style={{ marginTop: 26, height: 230, display: 'flex', alignItems: 'center' }}>{mark}</div>
    <div style={{ marginTop: 34, height: 60 }}>{sub}</div>
    <div style={{ marginTop: 92 }}>{stats}</div>
  </div>
);

const StatRow: React.FC<{ cells: { value: string; label: string; color: string; labelColor: string; line: string; o?: number; y?: number }[] }> = ({ cells }) => (
  <div style={{ display: 'flex', gap: 56 }}>
    {cells.map((c, k) => (
      <div key={k} style={{ width: 300, borderTop: `1px solid ${c.line}`, paddingTop: 26, opacity: c.o ?? 1, transform: `translateY(${(c.y ?? 0).toFixed(2)}px)` }}>
        <div style={{ ...type(72, 700), color: c.color, letterSpacing: '-0.04em' }}>{c.value}</div>
        <div style={{ ...type(30, 500), color: c.labelColor, marginTop: 10 }}>{c.label}</div>
      </div>
    ))}
  </div>
);

// Old page: shorts-kit 3 (cold grey poster)
const OldPage: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 70% 60% at 50% 30%, #25272c 0%, ${OLD.bg0} 45%, ${OLD.bg1} 100%)` }}>
    {/* Fine horizontal grain on the plate: brushed-metal texture (very faint) */}
    <div style={{ position: 'absolute', inset: 0, opacity: 0.5, background: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 4px)' }} />
    <Layout
      kicker={<span style={{ ...type(30, 650, { caps: true }), letterSpacing: '0.22em', color: OLD.ink3 }}>Current release</span>}
      mark={<span style={{ ...type(220, 760), color: OLD.ink, letterSpacing: '-0.055em' }}>shorts-kit 3</span>}
      sub={<span style={{ ...type(48, 450), color: OLD.ink2 }}>Shot recipes for product films.</span>}
      stats={<StatRow cells={STATS.map((s) => ({
        value: `${s.from.toFixed(s.dec)}${s.unit}`, label: s.label, color: OLD.ink, labelColor: OLD.ink3, line: OLD.line,
      }))} />}
    />
  </div>
);

// New page: shorts-kit 4 (launch poster on the ember stage)
const NewPage: React.FC<{ frame: number }> = ({ frame }) => {
  const statP = (k: number) => ramp(frame, 72 + stagger(k, 3, 12, EASE.out), 26, EASE.snappy);
  const breath = 0.85 + 0.15 * Math.sin(frame / 16);
  return (
    <>
      <Layout
        kicker={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 18 }}>
            <ShortKitMark size={44} tone="dark" />
            <span style={{ ...type(30, 700, { caps: true }), letterSpacing: '0.22em', color: L.accent }}>Introducing</span>
          </span>
        }
        mark={
          <span style={{ ...type(220, 800), letterSpacing: '-0.055em', color: L.ink, position: 'relative' }}>
            shorts-kit{' '}
            <span style={{
              backgroundImage: `linear-gradient(180deg, ${L.accent2} 0%, ${L.accent} 70%, #e0471a 100%)`,
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
              filter: `drop-shadow(0 0 ${(30 * breath).toFixed(1)}px ${alpha(L.accent, 0.55)})`,
            }}>4</span>
          </span>
        }
        sub={
          <span style={{ ...type(48, 450), color: L.ink2 }}>
            <TextReveal text="One prompt to a finished promo." start={64} by="word" variant="rise" each={18} gap={3} />
          </span>
        }
        stats={<StatRow cells={STATS.map((s, k) => {
          const p = statP(k);
          const v = mix(s.from, s.to, p);
          return {
            value: `${v.toFixed(s.dec)}${s.unit}`, label: s.label,
            color: L.ink,
            labelColor: L.ink2, line: alpha(L.accent, 0.35),
            o: ramp(frame, 66 + k * 4, 12, EASE.out), y: mix(18, 0, ramp(frame, 66 + k * 4, 18, EASE.snappy)),
          };
        })} />}
      />
    </>
  );
};

// Door: a full old page inside a 960-wide viewport (the right door's inner layer is shifted left by 960 to line up and join) + inner-edge bevel + crack light tint
// (The door casts no shadow on the new page: the light comes from behind the door and the shadow falls toward the camera side; cast into the gap it would only dull the light.)
const Door: React.FC<{ side: 'left' | 'right'; offset: number; light: number; edge: number }> = ({ side, offset, light, edge }) => {
  const inner = side === 'left' ? 'right' : 'left';
  const toward = side === 'left' ? 'to left' : 'to right';
  return (
    <div style={{
      position: 'absolute', top: 0, left: side === 'left' ? 0 : 960, width: 960, height: 1080, overflow: 'hidden',
      transform: `translateX(${side === 'left' ? -offset : offset}px)`,
    }}>
      <div style={{ position: 'absolute', top: 0, left: side === 'left' ? 0 : -960, width: 1920, height: 1080 }}>
        <OldPage />
      </div>
      {/* Door face tinted warm by the crack light: brightest near the seam, decaying over 520px outward */}
      {light > 0.01 && (
        <div style={{
          position: 'absolute', top: 0, bottom: 0, [inner]: 0, width: 620, mixBlendMode: 'screen', opacity: light,
          background: `linear-gradient(${toward}, ${alpha(L.light, 0.5)} 0%, ${alpha(L.light, 0.14)} 30%, ${alpha(L.light, 0)} 100%)`,
        }} />
      )}
      {/* Plate bevel: 10px thickness band lit by the seam light (bright, then warm, then dark) */}
      {edge > 0.01 && (
        <div style={{
          position: 'absolute', top: 0, bottom: 0, [inner]: 0, width: 10, opacity: edge,
          background: `linear-gradient(${toward}, #ffe2c2 0%, ${L.accent} 35%, #5a2410 100%)`,
        }} />
      )}
    </div>
  );
};

export const BarnDoorSplit: React.FC = () => {
  const frame = useCurrentFrame();
  const door = doorAt(frame);
  const vx = velocity(doorAt, frame);

  // Foreshadow hairline: traces up and down from the midpoint; merges into the band of light as soon as the gap opens
  const crack = ramp(frame, CRACK, 10, EASE.snappy);
  const seamLight = ramp(frame, CRACK, 12, EASE.out); // door face tint / bevel brightness
  const edge = frame >= GAP ? 1 : 0;
  // Overexposed beam: decays as the doors move away
  const flash = ramp(frame, GAP, 12, EASE.exit) * (1 - ramp(frame, SLIDE + 6, 30, EASE.out));
  const bP = ramp(frame, SLIDE + 2, 36, EASE.snappy);
  const bScale = mix(1.08, 1, bP) * mix(1, 1.018, ramp(frame, 78, 72, EASE.smooth)); // after settling, push in again very slowly so the hold segment is not dead
  const push = mix(1, 1.015, ramp(frame, 0, SLIDE, EASE.smooth));
  const doorsGone = frame > SLIDE + SLIDE_D;
  const showNew = frame >= GAP;
  // Door face tint: weakens as the doors slide open (the farther from the light source, the darker)
  const doorLight = seamLight * (1 - ramp(frame, SLIDE, 14, EASE.out) * 0.6);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: L.bg[2] }}>
      {/* New page: draw only one Stage as the stage base; mounted only once the gap opens */}
      {showNew && (
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${bScale.toFixed(5)})`, transformOrigin: '50% 46%' }}>
          <Stage look={L} keyLight={{ x: 0.5, y: 0.12 }} fill={{ x: 0.5, y: 1.08 }} breathe={0.6}>
            <Dust look={L} count={28} seed={4} drift={0.35} opacity={0.55} color={L.accent2} />
          </Stage>
          {/* Warm glow behind the wordmark */}
          <div style={{
            position: 'absolute', left: 960 - 700, top: 366 - 260, width: 1400, height: 520,
            background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${alpha(L.accent, 0.16)} 0%, ${alpha(L.accent, 0)} 70%)`,
          }} />
          <NewPage frame={frame} />
          {/* Overexposed beam: light flooding in through the seam */}
          {flash > 0.01 && (
            <div style={{
              position: 'absolute', top: 0, bottom: 0, left: 960 - (door + 160), width: 2 * (door + 160), mixBlendMode: 'screen', opacity: flash,
              background: `linear-gradient(90deg, ${alpha(L.light, 0)} 0%, ${alpha(L.light, 0.55)} 40%, ${alpha('#ffe6cc', 0.85)} 50%, ${alpha(L.light, 0.55)} 60%, ${alpha(L.light, 0)} 100%)`,
            }} />
          )}
        </div>
      )}

      {!doorsGone && (
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${push.toFixed(5)})`, transformOrigin: '50% 50%' }}>
          <SpeedBlur vx={-vx} amount={0.09} max={22}>
            <Door side="left" offset={door} light={doorLight} edge={edge} />
          </SpeedBlur>
          <SpeedBlur vx={vx} amount={0.09} max={22}>
            <Door side="right" offset={door} light={doorLight} edge={edge} />
          </SpeedBlur>
          {/* Crack foreshadow: hairline of light + bloom, traces up and down from the midpoint */}
          {crack > 0 && frame < SLIDE + 4 && (
            <div style={{
              position: 'absolute', left: 960 - 1, top: 0, width: 2, height: 1080, transform: `scaleY(${crack.toFixed(4)})`,
              background: 'linear-gradient(180deg, rgba(255,226,194,0) 0%, #ffe2c2 22%, #fff6ec 50%, #ffe2c2 78%, rgba(255,226,194,0) 100%)',
              boxShadow: glow(L.accent, 0.9), opacity: 1 - ramp(frame, SLIDE, 4, EASE.out),
            }} />
          )}
        </div>
      )}
    </div>
  );
};
