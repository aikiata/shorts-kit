---
name: scan-bracket-sweep
summary: A document pops to the center, L-shaped viewfinder brackets drop on its four corners, and a scan band trailing a gradient sweeps back and forth over the document for 5 passes. The document stays still the whole time and only the light reads it.
use: "This content is being parsed/checked" process shots; capability demos for document products; the middle of an upload → analysis chain
length: about 5.0s (150f@30fps)
energy: medium-low (mechanical and restrained, all the rhythm is in the breathing of the back-and-forth sweeps)
---

## Intent
Let the viewer see that "this thing is being read line by line by a machine". The viewfinder brackets first frame the target (announcing the thing
being checked), then the scan band goes back and forth across the whole page (announcing the checking process). The key is that **the document itself is completely still**:
once the document also moves, the viewer cannot tell "being checked" from "loading".

## Motion core
- The document goes from scale 0.86 to 1 with `seg(0→0.11, outCubic)`, and opacity runs `dp*3`
  so it is fully lit early, landing before the scale finishes: first "it's there", then "it's steady".
- The four 34px L-shaped corner brackets land one by one with `i*0.022` stagger, each finishing in 0.055,
  closing in from outside along the diagonal with an 8px offset (overshoot easing, about 8% light overshoot then settling).
- Scan window `t 0.17→0.95` is cut strictly linearly into 5 passes, and within a pass `inOutSine`
  is slow at both ends and fast in the middle, with the last 12% a full pause (`local=(raw-pi)/0.88`).
- Light band = 1.2px indigo light core + 10px symmetric soft glow + trailing tail. The tail is at most 82px, `SCAN .2→0`
  multiply blend, and its length scales with scan speed (it collapses to 0 at the pause at the end of a pass, so reversing does not jump). Its direction flips with `dir`:
  hanging above the band on the way down and below on the way up, with the gradient reversed in sync.
- Table rows the light core passes over are lightly lit (row base SCAN 9%, Gaussian falloff): the light reads, the document stays still.
- The whole band is clipped inside an `overflow:hidden` layer with the same 10px corner radius as the document,
  fading in over `0.16→0.20` and out over `0.93→0.99`.

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Document pop-in | scale 0.86→1, t 0→0.11 outCubic | A start below 0.8 becomes "flying in from far away"; the pop-in needs a small amplitude to feel like UI |
| Viewfinder brackets | arm length 34px, round-cap stroke 1.6px, outset −7px; stagger 0.022 / 0.055 each | All four corners appearing together read as a static border; a 0.022 gap is enough to read "dropping one by one" |
| Scan passes | PASSES=5, window t 0.17→0.95 linear | 3 passes are not enough to read as "back and forth"; 7 or more passes in 5s make each pass too fast |
| In-pass easing | inOutSine + 12% pause at the end | The pause is the breathing spot for "this pass is seen clearly"; remove it and it becomes a constant-speed pendulum |
| Light band | 1.2px core + soft glow + tail ≤82px SCAN .2→0 (multiply) | A line too thick (>4px) reads as a mask edge, not light; a black-gray tail reads as dirt |
| Tail direction | down: top:−tail / up: top:0, gradient flipped together; tail follows speed | Flip only one and the tail runs ahead of the motion, reading as "the light is sucked back"; a fixed-length tail jumps to the other side as a block on reversal |
| Clip layer | same 10px corner radius overflow:hidden as the document | If it leaks outside the document it is "scanning the frame", not "scanning the document" |

## Known traps
- The light band must be clipped inside the document bbox, with corner radii matching the document. A small leak loses the "scanning
  this document" meaning.
- The tail's `top` and the gradient direction are two separate pieces of code. When you change the scan direction, change both,
  or one missed spot gives the anti-physical look of "tail in front".
- The brackets' 34px arm length and −7px outset were set for a 300×178 document size. With a real screenshot,
  recompute for the new size; an arm longer than 1/4 of the short side covers the content.
- Two color variables: INK (brackets + body text) and SCAN (light core + soft glow + tail + row lighting). To re-skin, change only these two.

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`scan-bracket-sweep/ScanBracketSweep.tsx`](../../../src/demo/effects/scan-bracket-sweep/ScanBracketSweep.tsx)

