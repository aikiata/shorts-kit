---
name: component-glide-montage
summary: Real product components arrive one per two beats, each gliding in from depth and from alternate sides with a settling turn, over its own moving backdrop; the next one glides in over the end of the last, so the frame is never empty.
use: show breadth ("there is a component for that too") after the main features, at a calm pace that still keeps the beat
length: 180 frames (12 beats at 120 BPM): six items of 30 frames, 12-frame overlaps
energy: medium
tags: montage, breadth, real-ui, frame-sequence, glide, depth, parallax, beat-sync
source: knowns-ui/launch-tvc
---
# component-glide-montage

## Intent
After the big moments, the viewer should feel how much is in the kit without reading a list.
Each component gets one beat pair, alone and centred, moving like an object on a turntable.
The moves are calm (a glide, not a cut) so the run rests the eye between the drop and the
colour ripples, while the timing stays on the music.

Unlike [`deck-deal-flyin`](deck-deal-flyin.md), which builds a board, nothing accumulates
here: one thing at a time, then it is replaced.

## Motion core
- Items are a list: a foreground (a captured component sequence by name, or a directly
  rendered panel), an optional full-frame backdrop sequence, a display height, an optional
  colour grade. Missing captures are filtered out, and a missing backdrop falls back to a
  soft violet radial glow, so the montage still renders.
- Time per item: `per = floor(f(beat(28) - beat(16)) / items.length)`: 30 frames for six.
- Entrance on a spring (damping 18, stiffness 90, mass 1): from
  `translate3d(dir * 500 px, 120 px, -700 px)`, `rotateY(-dir * 14deg)`, to centre. `dir`
  alternates per item, so they come from left, right, left.
- While it is on screen: `glide` 0 to 1 over `per` frames: the turn settles from 14 to 6
  degrees, the item drifts 60 px against its entry side and scales 1 to 1.12.
- Overlap: for the first 12 frames of an item the outgoing item is drawn ABOVE the incoming
  one and fades out. Its backdrop covers the new backdrop until the new one is in.
- Captured sequences: transparent PNG frames recorded at 30 fps with a virtual clock, cropped
  to the component by a manifest, shown at a set height with a violet drop-shadow glow. Short
  clips loop ping-pong (forward, then backward), so there is no jump at the loop.
- A decoded line of type (also a captured component) sits at the bottom over the first two items.

## Parameters
| Parameter | Typical value | Feel when changed |
|---|---|---|
| Time per item | 30 frames (2 beats) | under 2 beats the component is not recognised (C6); over 4 beats it drags |
| Overlap | 12 frames | under 6 the backdrops flash; over 18 two items fight for the centre |
| Entry offset | 500 px sideways, 120 px down, 700 px deep | less reads as a fade; more reads as a fly-by |
| Entry spring | damping 18, stiffness 90 | stiffer snaps (a cut); softer is still moving when the next arrives |
| Turn | 14 to 6 degrees rotateY | 0 is flat and dead; over 20 the text slants out of reading |
| Drift and scale | 60 px, 1 to 1.12 | none freezes the tail; more turns it into a camera move |
| Backdrop dim | 0.3 black over the backdrop | less and the backdrop competes with the component |
| Grade for a dim capture | `brightness(1.8) contrast(1.2)` or 4 stacked layers | stacking the same frame multiplies its alpha and lifts faint glows |

## Known traps
- **Frame offset.** All items share the montage's frame counter. Pass `offset = -idx * per`
  to the sequence player, or every capture starts in the middle of its clip.
- Draw the outgoing item above the incoming one. Drawn below, the incoming backdrop pops in
  at full opacity and the frame flashes.
- Q1: these are real components captured from the product, not redrawn. A capture of a number
  that would read as a claim (a run counter) was cut, because nothing backed the number.
- Q2 and C7: captures are made at a large size and scaled down. Real web text must still reach
  about 40 px effective.
- Determinism: frames come from files indexed by frame number. No live animation runs in the
  render; if a component must run live, freeze its clock to the frame.
- R2: equal length per item is fine here because the job is a calm rest. If the run should
  build, shorten the later items and end with a 0.5 s rest.

## Pairs with
- [`macro-measured-press`](../interaction/macro-measured-press.md): the feature shots before it.
- [`accent-ripple-chain`](../interaction/accent-ripple-chain.md): the shot after it.
- [`beat-grid-whip-cuts`](../rhythm/beat-grid-whip-cuts.md): the montage is one 12-beat row of the table.
- [`depth-layer-moves`](../camera/depth-layer-moves.md), [`carousel-3d`](carousel-3d.md).

## Reference implementation
- [`component-glide-montage/Main.tsx`](../../../src/demo/interaction/accent-ripple-chain/Main.tsx): `Montage`, `MView`, `MONTAGE_ALL`
- [`component-glide-montage/Breadth.tsx`](../../../src/demo/ui-entrance/component-glide-montage/Breadth.tsx): `SeqPanel`, `SeqBackdrop`, `ChartPanel` (a real chart with a left-to-right reveal)
