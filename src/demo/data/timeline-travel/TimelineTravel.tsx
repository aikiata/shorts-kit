// timeline-travel: horizontal timeline travel (in the style of the film The Kingdom (2007))
// The camera accelerates sideways along a horizontal tick axis; the four ticks v1.0/v2.0/v3.0/Today sweep past in turn,
// as each tick passes its card springs up from the tick line with overshoot + a short pause, the camera never stops;
// at the last tick a 4f hard stop + push-in 1.28×. The world layer only moves translateX/scale.
// f0–12 initial rest; true stillness for 46f from f114 (160f total).
//
// Quality upgrade: added the exported duration (the workbench originally inferred 104f, which cut off exactly at the hard-stop frame so the Today card and push-in never appeared); removed the debug title,
// replaced with a fixed header; gray skeleton Card replaced by publication-grade milestone cards (version chip / year / title / description / metrics, Today card in accent color);
// 6px ink vertical bar ticks replaced by glowing nodes + two-level version/year labels, with a hairline stem between card and node; the sprint segment gets
// horizontal SpeedBlur by camera speed (0 when still/slow); large background years pan with 0.35× parallax and cross-fade by distance, giving the "travel" a distant reference; soft bright light field + grain.
import React from 'react';
import { useCurrentFrame, interpolate, Easing, spring } from 'remotion';
import { G } from '../../../shared/fixtures/Fixtures';
import { Backdrop, FONT, Grain, SpeedBlur, innerHighlight, softShadow, tracking } from '../../../shared/fixtures/Polish';
import { ShortKitMark } from '../../../shared/fixtures/Brand';

export const TIMELINE_TRAVEL_DURATION = 160;

const W = 1920;
const AXIS_Y = 700;
const TICK_GAP = 1400; // tick spacing (world coordinates)
const TICKS = [
  // shorts-kit version history (from July 2026, one major version per month); year = date on the card/tick, far = large parallax background text (month)
  { label: 'v1.0', year: 'Jul 2026', far: 'Jul', x: 960, title: 'Public launch', desc: 'Shot recipe cards, a template and a gallery.', metric: 'Remotion render' },
  { label: 'v2.0', year: 'Aug 2026', far: 'Aug', x: 960 + TICK_GAP, title: 'Camera & sound', desc: '2.5D camera moves with beat-synced SFX.', metric: 'Beat-synced cuts' },
  { label: 'v3.0', year: 'Sep 2026', far: 'Sep', x: 960 + TICK_GAP * 2, title: 'Motion workbench', desc: 'Every shot, tuned in one place.', metric: 'Live preview' },
  { label: 'Today', year: 'Oct 2026', far: 'Oct', x: 960 + TICK_GAP * 3, title: 'One-prompt promos', desc: 'Direct the film. Let the agent shoot it.', metric: 'Claude Code & Codex' },
];
const WORLD_W = 960 + TICK_GAP * 3 + 960;

const TRAVEL_START = 12;
const TRAVEL_END = 104; // hard-stop frame
const ZOOM_END = 114;

// Camera X: in-out but slow in the first part and fast in the later part (mostly poly(3) in, ending with a sharp out)
// Stitched from two parts: 0–0.82 acceleration (Easing.in(poly(2.2))), 0.82–1 hard-brake
const camXAt = (f: number): number => {
  const total = TICKS[3].x - 960; // world distance to travel
  const t = interpolate(f, [TRAVEL_START, TRAVEL_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Accelerate → cruise → hard brake: piecewise easing, gentle start for the first 15%, near-uniform acceleration sprint in the middle, sharp finish over the last 12%
  const eased = interpolate(t, [0, 0.15, 0.88, 1], [0, 0.055, 0.9, 1], {
    easing: Easing.inOut(Easing.quad),
  });
  return eased * total;
};

// Pop frame for each card: the moment the camera center sweeps the tick (solved numerically in advance, avoiding per-frame inversion)
// Via camXAt reverse lookup: find the frame where camX == tick.x - 960
const popFrameOf = (tickX: number): number => {
  for (let f = TRAVEL_START; f <= TRAVEL_END; f++) {
    if (camXAt(f) >= tickX - 960) return f;
  }
  return TRAVEL_END;
};

const CARD_W = 360;
const CARD_H = 240;
const STEM = 36; // stem length from card bottom to axis

const MilestoneCard: React.FC<{ i: number }> = ({ i }) => {
  const t = TICKS[i];
  const hero = i === TICKS.length - 1;
  return (
    <div
      style={{
        width: CARD_W,
        height: CARD_H,
        boxSizing: 'border-box',
        borderRadius: 18,
        padding: '24px 26px',
        background: hero ? 'linear-gradient(180deg, #ffffff 0%, #f7f7ff 100%)' : '#ffffff',
        border: hero ? '1px solid rgba(91,99,211,0.35)' : `1px solid ${G.hairline}`,
        boxShadow: `${innerHighlight(0.9)}, ${softShadow(hero ? 18 : 8, { strength: hero ? 1.3 : 1 })}`,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT.sans,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            height: 30,
            padding: '0 12px',
            borderRadius: 8,
            background: hero ? G.accent : G.fill,
            color: hero ? '#fff' : G.ink2,
            fontFamily: FONT.mono,
            fontSize: 18,
            fontWeight: 650,
            lineHeight: '30px',
          }}
        >
          {hero ? 'v4.0' : t.label}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 20, color: G.ink3, fontVariantNumeric: 'tabular-nums' }}>{t.year}</div>
      </div>
      <div style={{ marginTop: 18, fontSize: 32, fontWeight: 700, letterSpacing: tracking(32), color: G.ink1 }}>{t.title}</div>
      <div style={{ marginTop: 8, fontSize: 23, lineHeight: 1.3, color: G.ink2 }}>{t.desc}</div>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 20, fontWeight: 600, color: hero ? G.accent : G.ink3 }}>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: hero ? G.accent : '#c4c6cc' }} />
        {t.metric}
      </div>
    </div>
  );
};

const TickStop: React.FC<{ i: number; frame: number }> = ({ i, frame }) => {
  const tick = TICKS[i];
  const hero = i === TICKS.length - 1;
  const pop = popFrameOf(tick.x) - 6; // start popping 6f early so it is just standing when swept past
  const s = spring({
    frame: frame - pop,
    fps: 30,
    config: { damping: 11, stiffness: 160, mass: 0.9 }, // clear overshoot
    durationInFrames: 26,
  });
  const appeared = frame >= pop;
  // Node is "lit up": switches from hollow gray to solid on the same beat the card starts popping
  const lit = interpolate(frame, [pop, pop + 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ position: 'absolute', left: tick.x, top: 0 }}>
      {/* Tick node: outer halo + solid core */}
      <div
        style={{
          position: 'absolute',
          left: -16,
          top: AXIS_Y - 16,
          width: 32,
          height: 32,
          borderRadius: 16,
          background: hero ? 'rgba(91,99,211,0.16)' : 'rgba(20,22,28,0.06)',
          transform: `scale(${(0.6 + 0.4 * lit).toFixed(3)})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: -8,
          top: AXIS_Y - 8,
          width: 16,
          height: 16,
          borderRadius: 8,
          boxSizing: 'border-box',
          border: `3px solid ${hero ? G.accent : G.ink1}`,
          background: lit > 0.5 ? (hero ? G.accent : G.ink1) : '#f4f4f2',
        }}
      />
      {/* Tick label: version + year */}
      <div style={{ position: 'absolute', left: -110, top: AXIS_Y + 34, width: 220, textAlign: 'center', fontFamily: FONT.sans }}>
        <div style={{ fontWeight: 720, fontSize: 40, letterSpacing: tracking(40), color: hero ? G.accent : G.ink1 }}>{tick.label}</div>
        <div style={{ marginTop: 2, fontSize: 28, fontWeight: 500, color: G.ink3, fontVariantNumeric: 'tabular-nums' }}>{tick.year}</div>
      </div>
      {/* Card pops up from the tick line: scaleY 0→1 about the bottom edge (with overshoot), with a slight horizontal tightening */}
      {appeared && (
        <>
          <div
            style={{
              position: 'absolute',
              left: -0.5,
              top: AXIS_Y - 8 - STEM * Math.min(1, s),
              width: 1,
              height: STEM * Math.min(1, s),
              background: hero ? 'rgba(91,99,211,0.5)' : 'rgba(20,22,28,0.22)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: -CARD_W / 2,
              top: AXIS_Y - 8 - STEM - CARD_H,
              transform: `scaleY(${s}) scaleX(${0.85 + 0.15 * s})`,
              transformOrigin: '50% 100%',
              opacity: Math.min(1, s * 2),
            }}
          >
            <MilestoneCard i={i} />
          </div>
        </>
      )}
    </div>
  );
};

export const TimelineTravel: React.FC = () => {
  const frame = useCurrentFrame();
  const camX = camXAt(frame);
  const vx = -(camXAt(frame + 0.5) - camXAt(frame - 0.5)); // world layer screen velocity (px/f, negative is leftward)

  // Push in on the last tick after the hard stop: scale 1 → 1.28, centered on the Today tick
  const zoom = interpolate(frame, [TRAVEL_END, ZOOM_END], [1, 1.28], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const headIn = interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });

  return (
    <div style={{ width: W, height: 1080, overflow: 'hidden', position: 'relative', fontFamily: FONT.sans }}>
      <Backdrop tone="light" light={{ x: 0.5, y: 0.22 }} accent={G.accent} vignette={0.16} grain={0} />
      {/* Distant parallax: large years pan at 0.35× speed and zoom in only 0.35× as much (background is outside the push-in layer);
          fade in/out by distance from the camera center, only the current year is readable at any moment */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${(1 + (zoom - 1) * 0.35).toFixed(4)})`,
          transformOrigin: '50% 62%',
        }}
      >
        {TICKS.map((t, i) => {
          const d = Math.abs(camX - i * TICK_GAP) / TICK_GAP; // 0 = that year's tick is directly facing the camera
          const op = Math.max(0, 1 - d / 0.62);
          if (op <= 0) return null;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 960 + i * TICK_GAP * 0.35 - camX * 0.35 - 500,
                width: 1000,
                top: 210,
                textAlign: 'center',
                fontSize: 280,
                lineHeight: 1,
                fontWeight: 800,
                letterSpacing: '-0.05em',
                color: `rgba(20,22,28,${(0.04 * op).toFixed(4)})`,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {t.far}
            </div>
          );
        })}
      </div>
      {/* Push-in layer: scales from slightly below the frame center (where the last tick lands) */}
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: '50% 62%' }}>
        {/* World layer: the only container that pans sideways; horizontal motion blur during the sprint */}
        <SpeedBlur vx={vx} amount={0.16} max={9}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: WORLD_W, height: 1080, transform: `translateX(${(-camX).toFixed(2)}px)` }}>
            {/* Main axis line */}
            <div
              style={{
                position: 'absolute',
                left: 200,
                top: AXIS_Y - 1,
                width: WORLD_W - 400,
                height: 2,
                background: 'linear-gradient(90deg, rgba(20,22,28,0) 0%, rgba(20,22,28,0.22) 4%, rgba(20,22,28,0.22) 96%, rgba(20,22,28,0) 100%)',
              }}
            />
            {/* Minor ticks (thin short bars, speed reference) */}
            {Array.from({ length: 22 }).map((_, i) =>
              i % 5 === 0 ? null : (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: 960 + i * (TICK_GAP / 5) - 1,
                    top: AXIS_Y - 9,
                    width: 2,
                    height: 18,
                    background: 'rgba(20,22,28,0.2)',
                    borderRadius: 1,
                  }}
                />
              ),
            )}
            {TICKS.map((_, i) => (
              <TickStop key={i} i={i} frame={frame} />
            ))}
          </div>
        </SpeedBlur>
      </div>
      {/* Fixed header */}
      <div style={{ position: 'absolute', left: 120, top: 96, opacity: headIn, transform: `translateY(${((1 - headIn) * 8).toFixed(2)}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 30, fontWeight: 650, letterSpacing: tracking(30, true), textTransform: 'uppercase', color: G.accent }}>
          <ShortKitMark size={36} tone="light" />
          Release history
        </div>
        <div style={{ marginTop: 6, fontSize: 56, fontWeight: 720, letterSpacing: tracking(56), color: G.ink1 }}>Shipping every month</div>
      </div>
      <Grain opacity={0.05} />
    </div>
  );
};
