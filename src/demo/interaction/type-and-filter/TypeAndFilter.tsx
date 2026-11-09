// type-and-filter: typing a search on a real UI, the grid converges into one card on its own, and a click goes through into the detail page
// The "operation narrative" segment of a feature demo: lets the viewer "follow along". The rhythm must feel like a human hand, not a script.
// The reference implementation is stripped from template SceneFlyIn frames 118–190 (self-contained):
// the camera moves to the search box, types character by character (3f/char, cursor steady on → blinking), leaves a breath after typing (11f),
// the 25 non-target cards fade out and sink in a stagger in reading order, the target card slides to the first-row slot (floating up + shadow widening en route),
// a double-ring accent-color ripple click confirmation + 3px outline + glow, and the camera pushes in over 16f to zoom 2.2, handing off the baton.
// Grid cards use real texture crops (reusing cards already in projects-empty.png), and the nano-lab target card
// slides to the first-row slot after filtering. The missing float-* small blocks use solid-color placeholders, not affecting how the motion reads.
// Texture upgrade: the camera follows the action: the typing segment stays close to the search box (zoom 2.0, effective glyph height of typed text ≈30px, readable),
// in the breath after typing it pulls out to a full-frame panorama (zoom 1.0, the page fills the frame, no longer revealing blank bands outside the page or a broken header edge),
// then pushes toward the click point; the search box has an accent-color focus ring while typing; a macOS pointer is added that slides to the target card in the panorama and then clicks
// ("where was clicked" is visible, constant screen size, fades out before the push); exiting cards get a slight shrink and blur, and the target card's fast
// slide carries a vertical speed trail; the selected outline has concentric rounded corners with the card, and the glow converges.
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, Easing } from 'remotion';
import { PageCam2D, CamKey2D } from '../../../shared/fixtures/PageCam2D';
import { SpeedBlur, velocity } from '../../../shared/fixtures/Polish';
import layout from '../../../shared/fixtures/live-layout.json';

export const TYPE_AND_FILTER_DURATION = 73; // frames 118–190 fall inside the shot at offset 0

const PAGE_H = layout.projects.pageH;
const cards = layout.projects.cards;
const PAPER = '#f9f6f1';
const FIELD = '#fefcf9';
const AMBER = 'oklch(58% 0.13 65)';
const AMBER_RGB = '176,116,40'; // approximate sRGB of AMBER, used for translucent glow
const QUERY = 'nano-lab';
const TYPE_START = 10; // 118 - 118 = 0 offset baseline: scene-local starts from 118
const FILTER_START = 42; // 160 - 118
const CLICK = 58; // 176 - 118

// search box (page-space CSS px)
const SEARCH = { x: 408, y: 130, w: 1016, h: 44 };

// nano-lab target card (the one that filters to row one)
const NANO_TITLE = 'nano-lab';
const nanoIdx = cards.findIndex((c) => c.title.includes(NANO_TITLE));
const nano = cards[nanoIdx];
const NANO_TO = { x: 408, y: 247 }; // first-row slot
const CLICK_C = { x: 586, y: 391 }; // click point on the settled result card

// filter departure rank for the non-target cards (reading order)
const leaveRank = new Map<number, number>();
cards.forEach((_, i) => {
  if (i !== nanoIdx) leaveRank.set(i, leaveRank.size);
});

// camera: typing segment close to the search box → the breathing spot after typing pulls out to a full-frame panorama (filtering/sliding fully visible) → pushes toward the clicked card
const CAM_KEYS: CamKey2D[] = [
  { frame: 0, cx: 820, cy: 270, zoom: 2.0 },
  { frame: 34, cx: 820, cy: 270, zoom: 2.0 },
  { frame: 46, cx: 960, cy: 540, zoom: 1.0 },
  { frame: 56, cx: 960, cy: 540, zoom: 1.0 },
  { frame: 72, cx: CLICK_C.x, cy: CLICK_C.y, zoom: 2.2 },
];
// same easing/interpolation as PageCam2D, to get the current zoom (the pointer is inverse-scaled to keep a constant screen size)
const CAM_EASE = Easing.bezier(0.33, 0, 0.15, 1);
const camZoom = (f: number) => {
  for (let i = 0; i < CAM_KEYS.length - 1; i++) {
    const a = CAM_KEYS[i];
    const b = CAM_KEYS[i + 1];
    if (f >= a.frame && f <= b.frame) {
      const t = interpolate(f, [a.frame, b.frame], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: CAM_EASE });
      return a.zoom + (b.zoom - a.zoom) * t;
    }
  }
  return f < CAM_KEYS[0].frame ? CAM_KEYS[0].zoom : CAM_KEYS[CAM_KEYS.length - 1].zoom;
};

// pointer path (page coordinates): when the panorama settles it rests at the lower right of the search box, and slides along an arc to the click point over 46–57f
const PTR_FROM = { x: 1210, y: 214 };
const ptrAt = (f: number) => {
  const t = interpolate(f, [46, 57], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.2, 1) });
  const arc = Math.sin(t * Math.PI) * 60; // an arc bulging slightly downward, not a dead-straight line
  return {
    x: PTR_FROM.x + (CLICK_C.x - PTR_FROM.x) * t,
    y: PTR_FROM.y + (CLICK_C.y - PTR_FROM.y) * t + arc,
  };
};

export const TypeAndFilter: React.FC = () => {
  const frame = useCurrentFrame();

  // typed chars: one every 3 frames (unhurried)
  const typedCount =
    frame < TYPE_START ? 0 : Math.min(QUERY.length, Math.floor((frame - TYPE_START) / 3) + 1);
  // caret: solid while typing, blinks on an 8f cycle after, until the click
  const caretOn =
    frame >= TYPE_START - 2 &&
    frame <= 67 &&
    (frame <= TYPE_START + 24 || Math.floor((frame - (TYPE_START + 24)) / 8) % 2 === 0);
  // search box focus ring: lights up 4f before typing, fades after the click
  const focus = interpolate(frame, [TYPE_START - 6, TYPE_START - 2, CLICK, CLICK + 6], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // pointer: fades in before the panorama settles, fades out during the push after the click (the handoff frame is clean)
  const ptr = ptrAt(frame);
  const ptrO = interpolate(frame, [42, 47, 62, 67], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ptrPress = interpolate(frame, [CLICK - 1, CLICK + 1, CLICK + 5], [1, 0.86, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ptrScale = (1 / camZoom(frame)) * ptrPress;

  // target card slide
  const slideAt = (f: number) =>
    interpolate(f, [FILTER_START, FILTER_START + 10], [0, 1], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.35, 0, 0.2, 1),
    });
  const slideT = slideAt(frame);
  const slideVy = velocity((f) => (NANO_TO.y - nano.y) * slideAt(f), frame);

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      <PageCam2D src="textures/live/projects-empty.png" pageH={PAGE_H} keys={CAM_KEYS} bg={PAPER}>
        {/* ---- 25 non-target cards: staggered fade+sink on filter ---- */}
        {cards.map((c, i) => {
          if (i === nanoIdx) return null;
          const outCue = FILTER_START + leaveRank.get(i)! * 0.4;
          if (frame >= outCue + 5) return null;
          const outT = interpolate(frame, [outCue, outCue + 5], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad),
          });
          return (
            <div
              key={`${c.file}-${i}`}
              style={{
                position: 'absolute', left: c.x, top: c.y, width: c.w, height: c.h,
                transform: `translate3d(0px, ${8 * outT}px, 0px) scale(${1 - 0.015 * outT})`,
                opacity: 1 - outT, borderRadius: 16, overflow: 'hidden',
                filter: outT > 0.02 ? `blur(${(1.5 * outT).toFixed(2)}px)` : undefined,
                boxShadow: '0 1px 2px rgba(60,45,30,.06), 0 4px 12px -4px rgba(60,45,30,.08)',
              }}
            >
              <Img src={staticFile(`textures/live/${c.file}`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
            </div>
          );
        })}

        {/* ---- nano-lab: slides up to the first-row slot on filter, floating (vertical speed trail in the fast segment) ---- */}
        {(() => {
          const slideDy = (NANO_TO.y - nano.y) * slideT;
          const slideDx = (NANO_TO.x - nano.x) * slideT;
          const float = Math.sin(slideT * Math.PI);
          const slideScale = 1 + 0.02 * float;
          const slideZ = 18 * float;
          return (
            <SpeedBlur vx={0} vy={slideVy} amount={0.04} max={7} style={{ zIndex: 2 }}>
              <div
                style={{
                  position: 'absolute', left: nano.x, top: nano.y, width: nano.w, height: nano.h,
                  transform: `translate3d(${slideDx}px, ${slideDy}px, ${slideZ}px) scale(${slideScale})`,
                  transformOrigin: 'center center',
                  // two layers of shadow: near-ground solid + an ambient shadow that widens and fades with the float
                  boxShadow: `0 ${1 + 2 * float}px ${2 + 4 * float}px rgba(60,45,30,${0.07 + 0.03 * float}), 0 ${4 + 18 * float}px ${12 + 30 * float}px -${4 + 6 * float}px rgba(60,45,30,${0.09 + 0.12 * float})`,
                  borderRadius: 16, overflow: 'hidden',
                }}
              >
                <Img src={staticFile(`textures/live/${nano.file}`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
              </div>
            </SpeedBlur>
          );
        })()}

        {/* ---- search box: paper patch over the placeholder (keeps magnifier), typed text + caret ---- */}
        <div
          style={{
            position: 'absolute', left: 440, top: SEARCH.y + 4,
            width: SEARCH.x + SEARCH.w - 448, height: SEARCH.h - 8,
            background: FIELD, opacity: 1, pointerEvents: 'none',
          }}
        />
        {/* focus ring: 1px accent outline + 3px light outer ring (same corner radius as the input, lights/goes out with the input state) */}
        <div
          style={{
            position: 'absolute', left: SEARCH.x - 1, top: SEARCH.y - 1, width: SEARCH.w + 2, height: SEARCH.h + 2,
            borderRadius: 9, boxSizing: 'border-box', pointerEvents: 'none', opacity: focus,
            border: `1px solid rgba(${AMBER_RGB},0.55)`,
            boxShadow: `0 0 0 3px rgba(${AMBER_RGB},0.14)`,
          }}
        />
        <div
          style={{
            position: 'absolute', left: 448, top: SEARCH.y, height: SEARCH.h,
            display: 'flex', alignItems: 'center',
            fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
            fontSize: 15, letterSpacing: 0.2, color: 'oklch(25% 0.006 82)', pointerEvents: 'none',
          }}
        >
          <span>{QUERY.slice(0, typedCount)}</span>
          {caretOn ? (
            <span style={{ display: 'inline-block', width: 1.5, height: 19, marginLeft: 1.5, borderRadius: 1, background: AMBER }} />
          ) : null}
        </div>

        {/* ---- click ripple: two concentric amber rings ---- */}
        {[0, 1].map((r) => {
          const start = CLICK + r * 3; // 176 - 118
          if (frame < start || frame > start + 10) return null;
          const t = interpolate(frame, [start, start + 10], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
          });
          const rad = interpolate(t, [0, 1], [14, r === 0 ? 54 : 78]);
          return (
            <div
              key={`ripple-${r}`}
              style={{
                position: 'absolute', left: CLICK_C.x - rad, top: CLICK_C.y - rad,
                width: rad * 2, height: rad * 2, borderRadius: '50%', boxSizing: 'border-box',
                border: `${r === 0 ? 2 : 1.5}px solid ${AMBER}`,
                background: r === 0 ? `radial-gradient(circle, rgba(${AMBER_RGB},0) 55%, rgba(${AMBER_RGB},0.10) 100%)` : undefined,
                opacity: 1 - t, pointerEvents: 'none', zIndex: 5,
              }}
            />
          );
        })}

        {/* ---- selected-card amber outline, lit from the click (concentric rounded corners with the card, 16+6) ---- */}
        {frame >= CLICK + 2 ? (
          <div
            style={{
              position: 'absolute', left: NANO_TO.x - 6, top: NANO_TO.y - 6,
              width: nano.w + 12, height: nano.h + 12, borderRadius: 22, boxSizing: 'border-box',
              border: `3px solid ${AMBER}`,
              boxShadow: `0 0 0 4px rgba(${AMBER_RGB},0.10), 0 8px 34px -6px rgba(${AMBER_RGB},0.45)`,
              opacity: interpolate(frame, [CLICK + 2, CLICK + 5], [0.5, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
              transform: `scale(${interpolate(frame, [CLICK + 2, CLICK + 7], [1.015, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) })})`,
              pointerEvents: 'none', zIndex: 4,
            }}
          />
        ) : null}

        {/* ---- macOS pointer (positioned in page coordinates, inverse-scaled by camera zoom → constant ~44px on screen) ---- */}
        {ptrO > 0.001 ? (
          <svg
            width={28}
            height={28}
            viewBox="0 0 28 28"
            style={{
              position: 'absolute', left: ptr.x - 2, top: ptr.y - 1, zIndex: 6, opacity: ptrO,
              overflow: 'visible', transformOrigin: '2px 1px', transform: `scale(${(ptrScale * 1.6).toFixed(4)})`,
              filter: 'drop-shadow(0 0.6px 0.6px rgba(20,14,8,0.35)) drop-shadow(0 3px 5px rgba(20,14,8,0.25))',
            }}
          >
            <path d="M2 1 L2 23 L8 17.5 L11.5 25 L15.5 23.2 L12 15.8 L20 15 Z" fill="#17181c" stroke="#ffffff" strokeWidth={1.6} strokeLinejoin="round" />
          </svg>
        ) : null}
      </PageCam2D>
    </AbsoluteFill>
  );
};
