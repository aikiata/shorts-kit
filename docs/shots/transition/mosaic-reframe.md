---
name: mosaic-reframe
summary: 12 tiles morph continuously between three layouts: a regular grid, a feature mosaic and a diagonal cascade. Position, width and height are interpolated separately, tiles are slightly staggered one by one, and there is a hold between segments.
use: Display transition for "many ways to look at the same content": layout capability demos for portfolio / template library / album products
length: about 7.1s (214f@30fps; emerge 0–22f · hold A · A→B 56–92f · hold B · B→C 132–176f · hold C to 214f)
energy: medium (a continuously flowing rearrangement, no burst point, an unhurried character)
---

## Intent
Let the viewer see "the layout itself thinking": the same 12 pieces of content go from a tidy archive state (grid), to a curated state with a hierarchy (feature mosaic), to a dynamic state with attitude (diagonal cascade).

## Motion core
- The three layouts are hard-coded as coordinate tables in native 1920×1080 pixels (content area x 96–1824, y 212–984): A = 4×3 regular grid (gap 24); B = 6×4 unit-cell mosaic (first tile takes a 3×2 large slot, gap 16); C = portrait photo prints 300×372 spread along the diagonal (850,214)→(1724,930), with `rot = −15° + i·3°` increasing rotation.
- Each tile interpolates center x/y, w/h and rot **independently**, not by an overall transform scale. Width and height really change, so rounded corners and shadows don't distort. Position arrives first: w/h converge 2f later and rotation 4f later, and the rotation in B→C has one light overshoot (bezier 0.45,0,0.3,1.22).
- Move curve bezier(0.75,0,0.15,1) (slow start → fast move → long soft landing), 26f per tile for A→B and 30f per tile for B→C. En route, a sin envelope on the segment progress lifts the tile (3.5% larger, bigger and softer shadow), and it settles back on landing.
- Cause-driven: the accent-color capsule of the segmented control at the top right (Grid / Mosaic / Cascade) slides to the next position first (snappy 12f, stretching sideways en route), and the tiles start rearranging 4f later (parent moves first, children follow).
- Stagger: A→B sweeps by index, dense first and sparse after (10f span); B→C spreads out at equal intervals one by one like dealing cards (14f span). From B→C the stacking order switches to "later ones on top" (B has no overlap, so the switch is invisible).
- Three states, three tones: in state B the main image carries a serif large-type caption (Featured shot / Golden Hour / Shot 01 · Crash zoom · 4.5 s rising word by word); in state C the tiles grow a 14px photo-paper white border, and a serif large title + subline rises in the empty space at the lower left. The last frame is a complete poster. (The demo is a 12-shot storyboard board for shorts-kit: header logo + wordmark + Storyboard, closing with "Every shot, in sequence." + the brand tagline.)
- Opening: 12 photos rise staggered along the diagonal (16f snappy), and the camera pushes in very slowly 1→1.025 throughout.

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Segment duration / hold | A→B 26f, B→C 30f; hold A 30f, B 36f, C 34f | The hold is breathing room for reading the layout. Squeezed to <20f, the three segments blur into one |
| Control → tile lag | 4f | 0 = cause can't be read; >8f looks like the control is broken |
| Stagger span | A→B 10f, B→C 14f | 0 = the whole layout flips mechanically; >24f and the wave upstages the layout itself |
| Cascade parameters | Photo prints 300×372, center spacing about (79,65)px, rot −15°+3°/tile | The increasing rotation is the soul of the "string". Equal angles degrade into a slanted grid |
| Mosaic large slot | First tile 3×2 cells | Swap the slots table to rearrange hierarchy; make sure there is one anchor slot ≥2×2 |
| Lift envelope | scale +3.5%, shadow elevation 6→40 | Too big looks like popups flying around; 0 reads as flat sliders |
| Tile content | SVG procedural photos (viewBox + slice ≈ cover, eight warm film-style looks) | When swapping in real photos, keep the overflow:hidden rounded container + object-fit: cover |

## Known traps
- Independent interpolation of center and width/height means you **cannot** swap in `transform: scale`. Width/height animation causes child elements to reflow, so images must use `object-fit: cover`.
- The last tile of segment C deliberately goes past the bottom edge of the frame. The frame crop is part of the composition. The diagonal of C must avoid the logo at the upper left and the control at the upper right, and leave the lower left for the title.
- Portrait photo prints crop a landscape photo down to a center strip: keep the photo subject near the horizontal center of the frame. The sun in the main image is to the right, to make room for the lower-left caption.
- The stacking order can only be switched in a state with "no overlap" (the B→C start frame). Changing zIndex partway through an overlap makes tiles visibly jump layers.
- With segment windows + stagger + lag stacked, the last tile of B→C only settles at about 176f. When adding a segment, compress the earlier segments rather than postponing (so that everything settles before t=1).

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`mosaic-reframe/MosaicReframe.tsx`](../../../src/demo/transition/mosaic-reframe/MosaicReframe.tsx)

