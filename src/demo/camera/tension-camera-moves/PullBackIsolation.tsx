// pull-back-isolation: a pull-back shot.
// Camera container scale 2.2→0.62 (0–110f, Easing.out(cubic)): the opening is jammed on a close-up of the hero card
// "99.9%", slowly pulling back to reveal the 8 sibling cards around it. From frame 30 the sibling cards go out in a stagger by distance from the hero card,
// near to far (one every 8f, opacity→0 + brightness darkened);
// the background sinks over 60–110f from a bright field into a hue-tinted deep field #111216; the hero card's white glow fades in over 60–100f.
// Frames 110–150 are completely still: a single glowing small card hangs alone in the middle of the dark field: the whole piece exists for this one number.
//
// Revision notes: the hero card goes from a "white overlay pressed on a placeholder card" to a publication-grade metric card (label + big number +
// 90-day uptime strip + footer); the camera lays out at 2.2x (CSS zoom) and then shrinks, so the opening close-up
// text is sharp (aesthetic guideline Q2); sibling cards sink slightly (scale 0.97) + defocus as they go out, rather than turning gray in place;
// the background crossfades from a soft-light bright base into the deep field, the glow has a cool hue, and the lit upper edge of the card face emerges with the dark field.
import React from 'react';
import { useCurrentFrame, interpolate, Easing, AbsoluteFill } from 'remotion';
import { Card, G } from '../../../shared/fixtures/Fixtures';
import { Backdrop, EASE, FONT, Grain, mix, softShadow } from '../../../shared/fixtures/Polish';

export const PULL_BACK_ISOLATION_DURATION = 150; // 110f pull-back + 40f isolated still hold

// 8 sibling cards: offset from the hero card center (960,540) + size + seed
const SIBS = [
  { dx: -620, dy: -330, w: 360, h: 240, seed: 3 },
  { dx: 10, dy: -390, w: 420, h: 220, seed: 4 },
  { dx: 620, dy: -320, w: 380, h: 260, seed: 5 },
  { dx: -680, dy: 20, w: 340, h: 230, seed: 6 },
  { dx: 700, dy: 40, w: 360, h: 250, seed: 7 },
  { dx: -600, dy: 360, w: 400, h: 240, seed: 8 },
  { dx: 40, dy: 400, w: 440, h: 220, seed: 9 },
  { dx: 640, dy: 350, w: 370, h: 250, seed: 10 },
].map((s) => ({ ...s, dist: Math.hypot(s.dx, s.dy) }));

// ranked by distance from the hero card → stagger order of going out (nearer ones go out first)
const RANKED = SIBS.map((s, i) => i).sort((a, b) => SIBS[a].dist - SIBS[b].dist);
const FADE_START = RANKED.reduce<number[]>((acc, idx, rank) => {
  acc[idx] = 30 + rank * 8;
  return acc;
}, []);
const FADE_DUR = 16;

const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

// camera layout magnification = starting close-up magnification: rasterized at 2.2x, afterwards only shrinks
const Z = 2.2;

// 90-day render success rate strip: deterministic, mostly all green, 2 days degraded (makes 99.9% believable)
const DAYS = Array.from({ length: 45 }, (_, i) => (i === 17 ? 1 : i === 33 ? 2 : 0));

const HeroCard: React.FC<{ rim: number }> = ({ rim }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      borderRadius: 18,
      background: 'linear-gradient(180deg, #ffffff 0%, #fbfbfa 100%)',
      border: '1px solid rgba(20,22,28,0.08)',
      boxSizing: 'border-box',
      padding: '30px 34px 26px',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: FONT.sans,
      overflow: 'hidden',
      boxShadow: `inset 0 1px 0 rgba(255,255,255,${0.9 + rim * 0.1})`,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 9, height: 9, borderRadius: 5, background: '#2fa36b', boxShadow: '0 0 0 4px rgba(47,163,107,0.14)' }} />
      <div style={{ fontSize: 17, fontWeight: 600, color: G.ink1, letterSpacing: '-0.01em' }}>Render success</div>
      <div style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 550, color: G.ink2, padding: '3px 9px', borderRadius: 7, background: G.fill, boxShadow: `inset 0 0 0 1px ${G.hairline}` }}>
        90 days
      </div>
    </div>
    <div
      style={{
        marginTop: 18,
        fontSize: 128,
        fontWeight: 700,
        lineHeight: 0.96,
        letterSpacing: '-0.045em',
        color: G.ink1,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      99.9<span style={{ fontSize: '0.56em', fontWeight: 600, color: G.ink2, marginLeft: '0.04em' }}>%</span>
    </div>
    <div style={{ marginTop: 'auto', display: 'flex', gap: 3, height: 30, alignItems: 'stretch' }}>
      {DAYS.map((d, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            borderRadius: 2,
            background: d === 0 ? 'rgba(47,163,107,0.78)' : d === 1 ? '#e2a23b' : 'rgba(47,163,107,0.4)',
          }}
        />
      ))}
    </div>
    <div style={{ marginTop: 10, display: 'flex', fontSize: 13, color: G.ink3, fontVariantNumeric: 'tabular-nums' }}>
      <span>90 days ago</span>
      <span style={{ marginLeft: 'auto' }}>Today</span>
    </div>
  </div>
);

export const PullBackIsolation: React.FC = () => {
  const frame = useCurrentFrame();

  // camera pull-back: 2.2 (in-your-face close-up) → 0.62 (big wide shot, isolated)
  const scale = interpolate(frame, [0, 110], [2.2, 0.62], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });

  // background sinks into darkness (60–110f): bright soft-light base → hue-tinted deep field, crossfade
  const bgT = interpolate(frame, [60, 110], [0, 1], { easing: Easing.inOut(Easing.quad), ...clamp });

  // hero card glow fades in (60–100f)
  const glow = interpolate(frame, [60, 100], [0, 1], { easing: Easing.inOut(Easing.quad), ...clamp });

  return (
    <AbsoluteFill style={{ background: G.dark, overflow: 'hidden' }}>
      <Backdrop tone="light" light={{ x: 0.5, y: 0.3 }} grain={0} />
      <AbsoluteFill style={{ opacity: bgT }}>
        <Backdrop tone="dark" light={{ x: 0.5, y: 0.5 }} accent="#5b63d3" grain={0} vignette={0.6} />
      </AbsoluteFill>

      {/* camera container: laid out at Z magnification, then scale(scale/Z) with the hero card center (frame center) as origin */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1920 * Z,
          height: 1080 * Z,
          transformOrigin: `${960 * Z}px ${540 * Z}px`,
          transform: `translate(${960 - 960 * Z}px, ${540 - 540 * Z}px) scale(${scale / Z})`,
        }}
      >
        <div style={{ position: 'relative', width: 1920, height: 1080, zoom: Z }}>
          {/* sibling cards: go out in a stagger from near to far, sinking slightly as they go out */}
          {SIBS.map((s, i) => {
            const t0 = FADE_START[i];
            const k = interpolate(frame, [t0, t0 + FADE_DUR], [0, 1], clamp);
            // opacity goes first (ease-out), darkening after (k²): the going-out process won't stall as a gray slab on the bright base
            const op = 1 - EASE.out(k);
            const dk = k * k;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: 960 + s.dx - s.w / 2,
                  top: 540 + s.dy - s.h / 2,
                  opacity: op,
                  // darken + slight defocus: as if sinking into the shadows
                  filter: k > 0.001 ? `brightness(${mix(1, 0.3, dk).toFixed(3)}) blur(${(k * 5).toFixed(2)}px)` : undefined,
                  transform: `scale(${mix(1, 0.97, k)})`,
                }}
              >
                <Card w={s.w} h={s.h} seed={s.seed} />
              </div>
            );
          })}

          {/* hero card: 520×340 centered; after falling into the dark field, a cold white halo around it */}
          <div
            style={{
              position: 'absolute',
              left: 960 - 260,
              top: 540 - 170,
              width: 520,
              height: 340,
              borderRadius: 18,
              boxShadow:
                `${softShadow(18, { strength: 1 - glow * 0.6 })}, ` +
                `0 0 70px rgba(214,222,255,${(glow * 0.32).toFixed(3)}), 0 0 180px rgba(150,162,240,${(glow * 0.2).toFixed(3)})`,
            }}
          >
            <HeroCard rim={glow} />
          </div>
        </div>
      </div>
      <Grain opacity={mix(0.05, 0.09, bgT)} blend={bgT > 0.5 ? 'soft-light' : 'overlay'} />
    </AbsoluteFill>
  );
};
