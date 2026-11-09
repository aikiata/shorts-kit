// row-embed: content rows descend from the air, flatten with rotateX, and at the moment of embedding a bottom-edge accent seam lights up
// A detail page / list shot of "structured data growing into the page". The reference implementation is stripped out of the template SceneDetail:
// rows fly in from above one by one on the beat (perspective translateY(−120·air) + rotateX(16°·air) +
// scale with slight overshoot, then press rebound); the row position is first covered by a page-background-color patch as a placeholder, which disappears after landing to let the texture show through,
// at the moment of embedding a 2px accent seam on the row's bottom edge expands from the center to both sides then fades out, while the camera tilts slowly down.
// Beats (texture revision): cue = 12/22/31/39/46 (spacing decreasing 10→7, the row rain falls faster and faster), flight 12f,
// the last row lands at 58f, the accent seam finishes at 66f ≤ the shot's 68f budget.
// Flying body = full-page screenshot backgroundImage with a negative-offset crop (Q1: crops do not redraw content).
// Texture revision key points:
// - the empty-slot patch takes the page's true background color #f9f6f1 (the original #fdfcfa was too white, so five slots read as one white board), and draws a
//   very faint dashed slot outline: viewers can see "there is an empty spot waiting here", and landing is "snapping in" (Q9);
// - the fall becomes "accelerating slam into the slot" (still moving fast in the final segment) + press rebound, with vertical motion blur by speed in the flight segment;
// - the slot contact shadow tightens and solidifies as the row approaches (small and solid near the ground), and is a large blurry ambient shadow when off the ground;
// - the camera framing now stays filled by the page throughout (the original start showed blank space above the page top, and the end showed 160px of blank below the page bottom).
import React from 'react';
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, Easing } from 'remotion';
import { PageCam2D, CamKey2D } from '../../../shared/fixtures/PageCam2D';
import { Grain, Vignette } from '../../../shared/fixtures/Polish';
import layout from '../../../shared/fixtures/live-layout.json';

export const ROW_EMBED_DURATION = 68;

const DETAIL_H = layout.detail.pageH;
const rows = layout.detail.rows;
const PAGE_BG = '#f9f6f1'; // true background color of the content area in the screenshot (sampled pixel by pixel)

// Start cy=500@1.12: the page top is just out of frame; end cy=740@1.25: tilts down while pushing in slightly, the page bottom meets the lower edge of the frame,
// and the frame's top edge falls between the "Edit metadata" divider and "Project info" (not cutting a line of text in half)
const DETAIL_CAM: CamKey2D[] = [
  { frame: 0, cx: 960, cy: 500, zoom: 1.12 },
  { frame: 68, cx: 960, cy: 740, zoom: 1.25 },
];

const CUES = [12, 22, 31, 39, 46];
const FLY = 12;
// Fall: slow start, still carrying speed when slamming into the slot at the end (end slope ≈1.25), with the press rebound absorbing the impact
const FLY_EASE = Easing.bezier(0.5, 0, 0.8, 0.75);
const detailSrc = staticFile('textures/live/detail-full.png');
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const airOf = (frame: number, cue: number) => 1 - interpolate(frame, [cue, cue + FLY], [0, 1], { ...clamp, easing: FLY_EASE });

export const RowEmbed: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <PageCam2D src="textures/live/detail-full.png" pageH={DETAIL_H} keys={DETAIL_CAM} bg={PAGE_BG}>
        {rows.map((r, i) => {
          const cue = CUES[i];
          const land = cue + FLY;

          // Empty-slot patch (true background color) + dashed slot outline, disappearing 2f after landing
          const patchOpacity = interpolate(frame, [land, land + 2], [1, 0], clamp);
          // The slot outline brightens slightly as the row flies in ("here"), and disappears with the patch on landing
          const slotHint = interpolate(frame, [cue - 6, cue + 4], [0.55, 1], clamp);

          // flying row: texture-crop dropping in from the air
          let flyer: React.ReactNode = null;
          let contact: React.ReactNode = null;
          if (frame >= cue && frame < land + 4) {
            const air = airOf(frame, cue);
            const p = 1 - air;
            const appear = interpolate(frame, [cue, cue + 3], [0, 1], clamp);
            const scale =
              frame < land
                ? 1.06 - 0.065 * p
                : interpolate(frame, [land, land + 4], [0.995, 1], { ...clamp, easing: Easing.out(Easing.quad) });
            // Vertical velocity (page px/frame) → motion blur, 0 on landing
            const vy = 120 * (airOf(frame - 0.5, cue) - airOf(frame + 0.5, cue));
            const mb = frame < land ? Math.min(3.2, vy * 0.22) : 0;
            flyer = (
              <div
                key={`row-${i}`}
                style={{
                  position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h,
                  opacity: appear, zIndex: 3, pointerEvents: 'none',
                  transform: `perspective(900px) translateY(${(-120 * air).toFixed(2)}px) rotateX(${(16 * air).toFixed(3)}deg) scale(${scale.toFixed(4)})`,
                  filter: mb > 0.25 ? `url(#row-mb-${i})` : undefined,
                }}
              >
                {mb > 0.25 && (
                  <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden>
                    <filter id={`row-mb-${i}`} x="-5%" y="-30%" width="110%" height="160%">
                      <feGaussianBlur stdDeviation={`0 ${mb.toFixed(2)}`} />
                    </filter>
                  </svg>
                )}
                <div
                  style={{
                    position: 'absolute', inset: 0, borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff',
                    backgroundImage: `url(${detailSrc})`,
                    backgroundSize: `1920px ${DETAIL_H}px`,
                    backgroundPosition: `-${r.x}px -${r.y}px`,
                    // Two-layer shadow: a large blurry ambient shadow when off the ground + a near-ground shadow that fades with height; 1px top lit edge
                    boxShadow:
                      `inset 0 1px 0 rgba(255,255,255,${(0.9 * air).toFixed(3)}), ` +
                      `0 0 0 1px rgba(60,45,25,${(0.07 * air).toFixed(3)}), ` +
                      `0 ${(34 * air).toFixed(1)}px ${(64 * air).toFixed(1)}px -${(10 * air).toFixed(1)}px rgba(40,30,18,${(0.24 * air).toFixed(3)}), ` +
                      `0 ${(6 * air).toFixed(1)}px ${(14 * air).toFixed(1)}px rgba(40,30,18,${(0.1 * air).toFixed(3)})`,
                  }}
                />
              </div>
            );
            // Slot contact shadow: the nearer the row, the denser and smaller (densest 4f before landing), fading out 3f after landing
            const near = interpolate(air, [0, 0.5], [1, 0], clamp);
            const contactOp = frame < land ? near * 0.5 : interpolate(frame, [land, land + 3], [0.5, 0], clamp);
            contact = (
              <div
                key={`contact-${i}`}
                style={{
                  position: 'absolute', left: r.x + 10, top: r.y + 6, width: r.w - 20, height: r.h - 6, borderRadius: 10,
                  boxShadow: `0 ${(2 + 6 * air).toFixed(1)}px ${(6 + 18 * air).toFixed(1)}px rgba(60,42,20,${(0.22 * contactOp).toFixed(3)})`,
                  zIndex: 2, pointerEvents: 'none',
                }}
              />
            );
          }

          // embed flash: 2px amber seam at the row's bottom edge, expanding from
          // the center on touchdown, then fading out (feathered at both ends, clipped to the row width)
          let seam: React.ReactNode = null;
          if (frame >= land && frame < land + 8) {
            const spread = interpolate(frame, [land, land + 5], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
            const seamOpacity = interpolate(frame, [land, land + 2, land + 8], [1, 1, 0], clamp);
            const seamW = r.w * spread;
            seam = (
              <div
                key={`seam-${i}`}
                style={{
                  position: 'absolute',
                  left: r.x + (r.w - seamW) / 2,
                  top: r.y + r.h - 2,
                  width: seamW, height: 2, borderRadius: 1,
                  background:
                    'linear-gradient(90deg, rgba(196,120,40,0) 0%, oklch(60% 0.14 62) 18%, oklch(66% 0.15 66) 50%, oklch(60% 0.14 62) 82%, rgba(196,120,40,0) 100%)',
                  boxShadow: '0 0 7px rgba(200,128,52,0.38)',
                  opacity: seamOpacity, zIndex: 4, pointerEvents: 'none',
                }}
              />
            );
          }

          return (
            <React.Fragment key={i}>
              {patchOpacity > 0 ? (
                <div
                  key={`patch-${i}`}
                  style={{
                    position: 'absolute', left: r.x - 8, top: r.y - 4,
                    width: r.w + 24, height: r.h + 8, background: PAGE_BG,
                    opacity: patchOpacity, zIndex: 1, pointerEvents: 'none',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute', left: 8, top: 10, width: r.w, height: r.h - 12, borderRadius: 8,
                      border: '1px dashed rgba(120,96,64,0.20)', boxSizing: 'border-box', opacity: slotHint,
                      background: 'rgba(120,96,64,0.018)',
                    }}
                  />
                </div>
              ) : null}
              {contact}
              {flyer}
              {seam}
            </React.Fragment>
          );
        })}
      </PageCam2D>
      <Vignette strength={0.1} color="#3a2c1c" inner={0.55} />
      <Grain opacity={0.035} />
    </AbsoluteFill>
  );
};
