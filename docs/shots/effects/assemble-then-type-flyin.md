---
name: assemble-then-type-flyin
summary: On an empty dark grid, text-free component skeletons fly in from all sides and snap into place. Then the text flies in character by character, rotating in 3D space, big headline first and small annotations last. When everything has landed, the page is complete.
use: Openings where a page or poster "grows by itself"; capability demos for layout products; two-stage stories from skeleton to finished layout
length: about 5.6s (168f@30fps)
energy: medium-high (sparse skeleton stage, dense text stage, energy rises steadily to the end)
---

## Intent
Split "page generation" into two clearly separate stages: first build the skeleton (frames, cards, dividers,
color blocks, all without text), then fill in the text. The text lands with per-character 3D rotation because the
skeleton stage only has flat translation. The two stages must differ in motion dimension, or the viewer cannot read "this is step two".

## Motion core
- The finished demo is a dark launch page for shorts-kit (graphite look, film gold accent2 is the only accent color; the nav bar is the lens-engraved mark +
  the shorts-kit wordmark, the big headline is the brand line "Frame motion. / Craft the shot."),
  in native 1920×1080 coordinates. Frame 1 already shows 12-column layout guides, which fade out once the skeleton is complete.
- 10 skeleton pieces (nav bar, color-grading card + film-frame color block, lens-engraved mark, three color wheel rings, divider, CTA, secondary button, three metric blocks)
  fly in at takeoff frames 6/10/15/19/23/27/31/35/39/44. Each piece takes 16f with `EASE.overshoot` to overshoot and settle,
  `from` offset 120–420px + ±7° rotation (rotation converges 4f later).
- While the skeleton moves, add directional motion blur from the real speed (px/frame) (`SpeedBlur` ×0.32, capped at 18px). At rest it is 0.
- 19 text blocks start one after another from frame 58 to 114: the 112px serif headline first (58/66),
  then nav, eyebrow, description line, button text (76–95), metric numbers (96–102), and last the mono small annotations (104–114).
- Per-character 3D: each character holds a deterministic seeded random
  `dx ±260px / dy ±200px / dz −200→−760 / rotateX ±170° / rotateY ±190° /
  rotateZ ±120°`, applied through `perspective(900px) translate3d + rotateX/Y/Z`.
  Each character lands in 16f with `EASE.snappy`, gets depth-of-field blur by defocus distance in flight, and its transform is set directly to `none` when `a>=1`.
- Character spacing inside a block adapts: `step = clamp((128 − start − 16)/character count, 0.35, 1.6)` frames.
  This guarantees every block finishes landing before f128 no matter how long it is, leaving 40f at the end where the whole page rests and breathes (1.5% very slow push-in).
- A "final cut" stroke after settling: the CTA powers up from an outline to a solid gold fill (118–132), a vertical gold line wipes the film frame
  from a log-gray plate to a warm-graded final image (124–146), and the three color wheel control points move from neutral to tinted positions in sync.
- All randomness comes from `rand(i) = frac(sin(i*127.1 + 311.7) * 43758.5453)`,
  which is deterministic and seekable.

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Skeleton timing | 10 pieces, takeoff frames 6→44 (4–5f apart) | The skeleton stage takes the first 30%; squeezed under 20f it blurs into the text stage |
| Skeleton fly-in | overshoot, 16f, offset 120–420px + ±7° | Same technique as `scanline-assemble-flyin`; without the scanline, the order reads from timing |
| Skeleton afterimage | directional motion blur, by speed ×0.32, capped at 18px | Only in fast stretches; permanent blur reads as out of focus |
| Break between stages | skeleton complete (f50) → text starts (f58), 8f gap, guides fade out in the same span | Without this half beat the viewer cannot read "this is step two" |
| Text start | headline 58/66, small annotations 104→114 | Big text must land first for readability: if small text lands first, viewers read the small text |
| Per-character offset | dx ±260 / dy ±200 / dz −200→−760 | dz does the "coming from far away" work; with only dx/dy it becomes a flat scatter-in |
| Per-character rotation | rotateX/Y/Z each ±120°–190° | Big angles give the "tumbling in" feel; ±30° only looks like jitter |
| perspective | 900px (written in each character's own transform) | 600px on 112px text distorts too much; above 1400px the 3D feel almost disappears |
| Character interval | clamp((128−start−16)/n, 0.35, 1.6) frames | The 1.6f cap is the slowest speed at which characters are still individually distinguishable |
| Reset on landing | a>=1 → transform:'none' | Without the reset, 19 blocks keep compositing layers and long videos drop frames |

## Known traps
- Character spans stay in normal layout flow (`display:inline-block`) and the animation only moves transform.
  Do not position characters one by one with absolute positioning: changing the copy breaks everything.
- Space characters must be explicitly turned into non-breaking spaces (the code uses `ch === ' ' ? ' ' : ch`),
  otherwise an empty inline-block span collapses to zero width and the word spacing disappears.
- `start` is 19 hand-written values. When you change the copy (especially when character counts change a lot), check
  that the last block still lands before f128. `step` only guarantees this inside a block, not between blocks.
- The content is a sample launch page for shorts-kit (headline / metrics / color wheel labels). Replace it with the project's own on delivery.
  GOLD (graphite's accent2 `#e4c58a`) is the accent slot. The CTA text color goes from gold to dark as it powers up, so change both together.
- The difference from `scanline-assemble-flyin` is that there is **no scanline**: that card uses the scanline
  to explain the order, this one uses the two-stage "skeleton first, then text" to explain the order. Do not mix the two.

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`assemble-then-type-flyin/AssembleThenTypeFlyin.tsx`](../../../src/demo/effects/assemble-then-type-flyin/AssembleThenTypeFlyin.tsx)

