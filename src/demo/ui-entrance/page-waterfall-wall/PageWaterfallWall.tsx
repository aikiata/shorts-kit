// page-waterfall-wall: page waterfall wall: real page-screenshot slices arranged in 3 columns, scrolling endlessly in opposite directions at different speeds on a tilted-back wall,
// with the outer camera pushing in slowly, making an overview of "so much content it never stops flowing".
// Texture layer (revision):
// · Footage uses only card-level slices (card1–10, not reused across columns); the full-page blank screenshot projects-empty and the
//   2032×88 thin search-bar slice that were mixed in earlier read as blank cards / fragment strips in the wall, so they were removed
// · 3 columns at 420px column width, the whole wall pulled inside the frame (the original 560 column width × 1.2 had the side columns half cut off by the frame, with severe perspective skew on the text of the left and right columns)
// · The wall's enlargement and slow push go through CSS zoom (layout-level scaling), so slice text is rasterized at display size (Q2) and no longer goes soft from enlargement
// · The solid #101014 + solid-color gradient mask is replaced by: a cool-toned dark soft-light base (a faint indigo afterglow behind the wall) + top and bottom feathering
//   (the gradient takes the actual colors of the base's top and bottom edges) + slight darkening at the far top (aerial perspective) + vignette + grain
// · Slice cards get a hairline and a top lit edge, and the shadow becomes two layers (contact shadow + ambient shadow)
// Footage paths are uniformly read from textures/live/ (consistent with the workbench / template public).
import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Backdrop, Grain } from '../../../shared/fixtures/Polish';
import { VerticalTicker, TickerColumn } from './VerticalTicker';

export const PAGE_WATERFALL_WALL_DURATION = 150; // 5s (an endless loop body, trim by segment as needed)

const BG = '#0d0e13';
const ZOOM = 1.2; // base value compensating perspective shrink (recipe scale 1.2)
const PUSH = 0.06; // slow camera push 1→1.06

const shot = (file: string) => (
  <div
    style={{
      position: 'relative',
      borderRadius: 20,
      overflow: 'hidden',
      background: '#fefcf9',
      boxShadow: '0 2px 4px rgba(0,0,0,0.35), 0 22px 48px -12px rgba(0,0,0,0.6)',
    }}
  >
    <Img src={staticFile(`textures/live/${file}`)} style={{ width: '100%', display: 'block' }} />
    {/* Hairline + top lit edge (clipped within rounded corners) */}
    <div
      style={{
        position: 'absolute', inset: 0, borderRadius: 20, pointerEvents: 'none',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.10), inset 0 1px 0 rgba(255,255,255,0.9)',
      }}
    />
  </div>
);

// 3 columns at different speeds in opposite directions (recipe card parameters: loop 12/9/14s, middle column reversed); 10 card slices distributed 4/3/3, not reused across columns
export const buildColumns = (loops: [number, number, number]): TickerColumn[] => [
  {
    items: ['card1.png', 'card2.png', 'card3.png', 'card10.png'].map(shot),
    durationInSeconds: loops[0],
    direction: -1,
  },
  {
    items: ['card4.png', 'card5.png', 'card6.png'].map(shot),
    durationInSeconds: loops[1],
    direction: 1,
  },
  {
    items: ['card7.png', 'card8.png', 'card9.png'].map(shot),
    durationInSeconds: loops[2],
    direction: -1,
  },
];

// Top and bottom feathering: gradient colors take the actual colors of the dark base at the top / bottom edges (the far-end top feather is longer), rows fade softly in and out
const FADE_TOP = 'linear-gradient(to bottom, #111319 0%, rgba(17,19,25,0.85) 10%, rgba(17,19,25,0) 30%)';
const FADE_BOTTOM = 'linear-gradient(to top, #08090c 0%, rgba(8,9,12,0.8) 8%, rgba(8,9,12,0) 22%)';

const Wall: React.FC<{ loops: [number, number, number]; zoom: number }> = ({ loops, zoom }) => (
  <AbsoluteFill>
    {/* zoom makes the wall lay out and rasterize at display size; inside, a css canvas 1920/zoom wide centers 3 columns */}
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1920 / zoom, height: 1080 / zoom, zoom }}>
      <VerticalTicker columns={buildColumns(loops)} backgroundColor="transparent" maskHeight={0} scale={1} columnWidth={420} gap={26} />
    </div>
    {/* Aerial perspective: the far end of the wall (upper part of the frame) is slightly darkened */}
    <AbsoluteFill style={{ background: 'linear-gradient(to bottom, rgba(13,14,19,0.5) 0%, rgba(13,14,19,0) 50%)', pointerEvents: 'none' }} />
    <AbsoluteFill style={{ background: FADE_TOP, pointerEvents: 'none' }} />
    <AbsoluteFill style={{ background: FADE_BOTTOM, pointerEvents: 'none' }} />
  </AbsoluteFill>
);

export const PageWaterfallWall: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  // Camera slow push rides on the outer layer; the wall itself loops, the camera goes one way (linear across the full shot, as defined by the recipe)
  const push = interpolate(frame, [0, durationInFrames], [1, 1 + PUSH], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <Backdrop tone="dark" light={{ x: 0.5, y: 0.42 }} accent="#5b63d3" grain={0} vignette={0} />
      <Wall loops={[12, 9, 14]} zoom={ZOOM * push} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 75% 70% at 50% 50%, rgba(5,6,10,0) 55%, rgba(5,6,10,0.55) 100%)', pointerEvents: 'none' }} />
      <Grain opacity={0.08} blend="soft-light" />
    </AbsoluteFill>
  );
};

// Seam self-check: short loop (3s=90f), no camera push; f0 and f90 should be pixel-identical
export const SeamTest: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: BG }}>
    <Wall loops={[3, 3, 3]} zoom={ZOOM} />
  </AbsoluteFill>
);
