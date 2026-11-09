// hashtag-to-pill-materialize (bear-app 18–21.5s redo, matched frame by frame against the dense frames of the original)
// Measured rhythm of the original (25fps, frame by frame):
//  1) typing "#music" centered on white: geometric sans-serif (Futura feel), mid-gray ink, solid red cursor always on and not blinking, human rhythm
//  2) materialization = a 1-frame hard cut: text + cursor → a wide light-gray borderless capsule + gray double-eighth-note icon + "music" (font size unchanged, the # is replaced by the icon)
//  3) pause ~0.6s → the whole thing shrinks smoothly (→~0.55x) and moves left to land at the page's tag slot (about 0.55s, easeInOut)
//  4) another 1-frame hard cut reveals the finished note page: cream base, dark green big title "My favorite shots", capsule turns sage green, three lines of body text:
//     the original has no segment where "the capsule flies into a card sliding in below" (the flight segment of batch 8 was invented and has been cut)
// Texture upgrade: both bases are changed to gradients with a very faint paper feel + grain (to keep large areas from being flat solid color); the capsule is a "solid object": lit top edge
// inner highlight + slight volume gradient + soft lift-off shadow (floats 10px at hero, drops to 0 as it lands during the shrink-move, snapping into place means "embedded" in the page);
// the shrink-move segment gets directional motion blur by speed; the finished page gains a header meta line (breadcrumb + edit time), so the layout is complete.
// The two hard cuts, the shrink-move curve and all timing points are unchanged.
// Brand pass: the topic word "#music" → "#shots" (same length as the original word, capsule layout unchanged), the note icon is replaced by a clapperboard,
// the finished page talks about shorts-kit's shots (title "My favorite shots", body names shorts-kit).
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { Grain, SpeedBlur, velocity } from '../../../shared/fixtures/Polish';

// truly still for 37f after the reveal at 83f (≈1.2s of breathing, R1), 4s overall
export const HASHTAG_TO_PILL_MATERIALIZE_DURATION = 120;
const FONT = "Futura, 'Century Gothic', 'Avenir Next', 'Trebuchet MS', sans-serif";

const C = {
  bgWhite: 'linear-gradient(180deg, #fdfdfc 0%, #fbfbfa 60%, #f6f6f3 100%)',
  bgCream: 'linear-gradient(180deg, #f6f3e8 0%, #f3f0e4 55%, #eeeadc 100%)',
  meta: '#a7a392',
  ink: '#454543',
  cursor: '#e0453f',
  pillGray: '#e9e9e7',
  pillTextGray: '#4b4b49',
  iconGray: '#7e7e7c',
  pillSage: '#d5e0cf',
  iconSage: '#5c7a63',
  titleGreen: '#2d5c47',
  pillSageText: '#3f5e4c',
  body: '#4c4b43',
};

// ---- mulberry32 (used only for human jitter in the typing rhythm, deterministic) ----
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TEXT = '#shots';
// typing start & per-character interval (frames), 4–8 frames with jitter, imitating the real person's rhythm in the original
const TYPE_START = 8;
const rand = mulberry32(20260717);
const TYPE_AT: number[] = (() => {
  const at: number[] = [];
  let f = TYPE_START;
  for (let i = 0; i < TEXT.length; i++) {
    at.push(f);
    f += 4 + Math.floor(rand() * 3); // 4–6 frames (original ~6 chars/second)
  }
  return at;
})();

// ---- timeline (30fps, 132 frames total, rhythm aligned to the original 18–21.5s) ----
const MORPH = 48;       // 1-frame hard cut materialization (hold ~0.5s after typing, original 0.45s)
const MOVE_START = 66;  // capsule starts shrinking and moving left (0.6s after morph, same as the original)
const MOVE_END = 80;    // lands (0.47s, original ~0.45s)
const REVEAL = 83;      // 1-frame hard cut reveals the finished page, then rests to close

// ---- geometry (1920x1080, scaled proportionally from the measured pixels of the original 1280x720) ----
const FS = 132;                       // typing/capsule text font size (converted from the original glyph height)
const HERO = { x: 960, y: 540 };      // big capsule center
const PILL_W = 740, PILL_H = 236;     // measured in the original 493x157 @720p ×1.5
const END_SCALE = 0.554;              // landing scale (original 273/493)
const SLOT = { x: 361, y: 473 };      // tag slot center (a compromise between the original gray capsule landing point (244.5,317.5)×1.5 and the reveal position)

// clapperboard icon (solid silhouette, same visual weight as the original note icon): board body + a clapper hinged up on the left, the clapper stripes cut out with a mask
const ClapperIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => {
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ display: 'block' }}>
      <defs>
        <mask id={`k${id}`}>
          <rect x="0" y="0" width="48" height="48" fill="#fff" />
          {[0, 1, 2].map((i) => (
            <polygon key={i} points={`${11 + i * 10},8 ${15.5 + i * 10},8 ${19.5 + i * 10},18 ${15 + i * 10},18`} fill="#000" />
          ))}
        </mask>
      </defs>
      <rect x="4" y="21" width="40" height="23" rx="3.5" fill={color} />
      <g transform="rotate(-17 5 19.5)">
        <rect x="4" y="9" width="40" height="9" rx="2" fill={color} mask={`url(#k${id})`} />
      </g>
    </svg>
  );
};

// capsule (drawn at the large font size, scaled as a whole by transform, so the text stays the same size in place before and after materialization)
// lift = height off the ground (large-font coordinate px): floats at hero, returns to zero on landing, snapping into the page
const Pill: React.FC<{ bg: string; iconColor: string; textColor: string; lift: number }> = ({ bg, iconColor, textColor, lift }) => (
  <div style={{
    width: PILL_W, height: PILL_H, borderRadius: PILL_H / 2,
    // no border: the solid feel comes from a slight top-light bottom-dark volume + top-edge inner highlight + lift-off soft shadow (not a border)
    background: `linear-gradient(180deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0) 46%, rgba(0,0,0,0.025) 100%), ${bg}`,
    boxShadow: `inset 0 3px 0 rgba(255,255,255,0.7), inset 0 -2px 0 rgba(40,40,30,0.03), ` +
      `0 ${(1 + lift * 0.12).toFixed(1)}px ${(2 + lift * 0.3).toFixed(1)}px rgba(40,40,30,${(0.04 + lift * 0.003).toFixed(3)}), ` +
      `0 ${(lift * 1.6).toFixed(1)}px ${(lift * 4).toFixed(1)}px ${(-lift * 0.6).toFixed(1)}px rgba(40,40,30,${(lift * 0.009).toFixed(3)})`,
    display: 'flex', alignItems: 'center', paddingLeft: 96, boxSizing: 'border-box', gap: 66,
  }}>
    <ClapperIcon size={104} color={iconColor} />
    <span style={{ fontSize: FS, fontWeight: 500, color: textColor, letterSpacing: 2 }}>shots</span>
  </div>
);

export const HashtagToPillMaterialize: React.FC = () => {
  const frame = useCurrentFrame();

  // ---- typing ----
  const typedCount = TYPE_AT.filter((t) => frame >= t).length;
  const typed = TEXT.slice(0, typedCount);

  // ---- shrink and move left ----
  const moveAt = (f: number) => interpolate(f, [MOVE_START, MOVE_END], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.5, 0, 0.25, 1),
  });
  const pxAt = (f: number) => interpolate(moveAt(f), [0, 1], [HERO.x, SLOT.x]);
  const pyAt = (f: number) => interpolate(moveAt(f), [0, 1], [HERO.y, SLOT.y]);
  const moveT = moveAt(frame);
  const px = pxAt(frame);
  const py = pyAt(frame);
  const ps = interpolate(moveT, [0, 1], [1, END_SCALE]);
  // shrink-move peak ~70px/frame: a trail along the direction of motion by speed, with zero speed at start and end so there is automatically no blur
  const vx = velocity(pxAt, frame);
  const vy = velocity(pyAt, frame);
  // off the ground: floats 10px during the hero hold, lands in the second half of the shrink-move, sits flat when landed (Q9: snapping in = embedded in the page)
  const lift = 10 * (1 - interpolate(moveT, [0.35, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  // the instant of materialization settles very slightly (the original is nearly a hard cut, only 3 frames 1.03→1, to avoid stiffness)
  const settle = interpolate(frame, [MORPH, MORPH + 3], [1.03, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad),
  });

  const revealed = frame >= REVEAL;

  return (
    <AbsoluteFill style={{ background: revealed ? C.bgCream : C.bgWhite, fontFamily: FONT }}>
      {/* finished page (hard-cut reveal, completely still afterwards) */}
      {revealed && (
        <>
          {/* header meta: breadcrumb + edit time, completing the layout of the "finished page" (auxiliary text 32px, low contrast so it doesn't steal from the title) */}
          <div style={{
            position: 'absolute', left: 164, right: 160, top: 86, display: 'flex', alignItems: 'center',
            fontSize: 32, fontWeight: 500, color: C.meta, letterSpacing: 0.6,
          }}>
            <span>Notes</span>
            <span style={{ margin: '0 18px', opacity: 0.7 }}>/</span>
            <span>Shots</span>
            <span style={{ marginLeft: 'auto' }}>Edited just now</span>
          </div>
          <div style={{
            position: 'absolute', left: 164, right: 160, top: 144, height: 1,
            background: 'linear-gradient(90deg, rgba(120,112,80,0.16), rgba(120,112,80,0.06))',
          }} />
          <div style={{
            position: 'absolute', left: 160, top: 168,
            fontSize: 122, fontWeight: 700, color: C.titleGreen, letterSpacing: 0.5,
          }}>
            My favorite shots
          </div>
          <div style={{
            position: 'absolute', left: 152, top: 618,
            fontSize: 70, fontWeight: 500, color: C.body, lineHeight: 1.33, letterSpacing: 0.3,
          }}>
            A few camera moves I keep stealing from<br />
            shorts-kit: the crash zoom, the orbit,<br />
            the whip pan. Welcome. Bring popcorn.
          </div>
        </>
      )}

      {/* typing layer: text + always-on red cursor (the original cursor doesn't blink), disappears as a whole on the materialization frame */}
      {frame < MORPH && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: FS, fontWeight: 500, color: C.ink, letterSpacing: 2, whiteSpace: 'pre' }}>
              {typed}
            </span>
            <span style={{
              display: 'inline-block', width: 7, height: 150,
              background: C.cursor, marginLeft: 8, borderRadius: 2,
            }} />
          </div>
        </AbsoluteFill>
      )}

      {/* capsule layer: materialization appears with a 1-frame hard cut → hold → shrinks and moves left to land → reveal frame switches to sage green */}
      {frame >= MORPH && (
        <SpeedBlur vx={vx} vy={vy} amount={0.1} max={7}>
        <div style={{
          position: 'absolute', left: 0, top: 0,
          // origin must be 0 0: translate first sends the origin to the target center, scale scales around that point,
          // otherwise the default 50% 50% would make the center drift by (1-s)*half-width on landing
          transformOrigin: '0 0',
          transform: `translate(${px}px, ${py}px) scale(${ps * settle})`,
        }}>
          <div style={{ transform: 'translate(-50%, -50%)' }}>
            {revealed
              ? <Pill bg={C.pillSage} iconColor={C.iconSage} textColor={C.pillSageText} lift={0} />
              : <Pill bg={C.pillGray} iconColor={C.iconGray} textColor={C.pillTextGray} lift={lift} />}
          </div>
        </div>
        </SpeedBlur>
      )}
      {/* very faint paper grain: prevents banding on large light fills, the reveal frame hard-cuts together with the base color (same layer, no transition) */}
      <Grain opacity={0.05} step={2} />
    </AbsoluteFill>
  );
};
