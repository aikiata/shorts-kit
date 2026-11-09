---
name: letterspace-materialize
summary: A wide-tracked wordmark crystallizes with all characters drawn in parallel and continuously: every letter starts its stroke on the same frame, strokes grow continuously like handwriting, and all finish together into a word. A brand wordmark develops over an ambient background
use: Brand wordmark entrance at the end or start of a video (a thin skeleton wordmark with wide tracking; the demo is shorts-kit in all lowercase); chapter title lettering; closing frames that need a calm, premium feel
length: rest ~15f + draw ~50f + final rest ≥30f; whole section 3–4s
energy: low (calm ritual feel, done in one breath)
tags: typography, outro
---

## Intent
The wordmark is neither a fade-in nor a typewriter but a "crystallization": the strokes of all letters begin growing continuously at the same time, like an invisible hand writing every letter at once, and finish into a word in the same instant. There are two crux points: **continuous** (the strokes must be a continuous drawing process, and no mask segmentation is allowed: drawing half and then the other half gets seen through; any middle frame should look like "half written"); **synchronized** (all letters start on the same frame and finish on the same frame: per-letter stagger is typewriter semantics, and here the feel is a ritual of the whole word as one).

## Motion core
- Each character uses a skeleton-stroke SVG path (single-line glyph), normalized with pathLength + strokeDashoffset from 1→0 for a continuous draw
- All characters share the same progress p: they start on the same frame, and pathLength normalization guarantees letters with different stroke lengths finish on the same frame (no per-char delay/jitter)
- Glyph proportion: square and slightly wide (glyph width-to-height ratio ≈1.07; measured precedent: tall narrow glyphs were ruled "too tall and narrow"); thin strokes + wide tracking (letterSpacing ≈0.6em). The demo wordmark is shorts-kit (the brand guideline requires all lowercase): a geometric lowercase single-line face with perfectly round bowls; in a 64-high viewbox the baseline is 59 / x-height 22 / ascender 5, the whole thing scaled ×1.3 and the stroke scaled inversely to stay at 5.5px
- Draw curve: overall ease-in-out, slightly faster in the middle and slightly slower at the ends (the feel of putting the pen down and lifting it)
- Background: an ambient gradient / real-footage empty shot (dusk mountain scenery and the like); the wordmark is the only action in the frame

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Draw duration | ~50f (starts f16, ends f68 @30fps) | <30f and the "drawing" process can't be read; >80f drags |
| Synchronization | all characters start and end on the same frame, zero stagger | Precedent: the per-letter staggered version was ruled "all letters should finish writing at the same time" |
| Continuity | pathLength grows continuously, no segment jumps | Precedent: the mask-segmented version was ruled "it should be drawn as continuous strokes" |
| Glyph | skeleton single line, glyph width-to-height ratio ~1.07, thin strokes | Tall narrow (ratio <0.8) was ruled out; heavy strokes lose the crystallization feel |
| Tracking | ~0.6em | Wide tracking is this card's identity; <0.3em, use an ordinary draw-on card instead |
| Final rest | ≥30f | After crystallization finishes, the viewer must get to read the whole word once |

## Known traps
- The demo was tuned on grayscale/placeholder footage. The parameters are a starting point for tuning, not final production values; the first real use must be re-verified with real footage
- How it differs from draw-svg-trace: that card is a general draw-on (icons/illustrations/single elements); this card's crux is the **all-characters-synchronized** crystallization ritual of a whole word, and it is limited to brand wordmark contexts
- How it differs from type-assembly-moves: that card is text block assembly (pieces move into place); on this card the strokes grow from nothing and the characters do not move
- The skeleton glyphs need hand-drawn paths (stock font outlines are double-line outlines, and the draw-on look differs); the demo's 13 lowercase glyphs (v i d e o - s h t c r a f) each carry their own width w, so for real use prefer reusing the glyph library from the demo. Letters with several sub-strokes (the dot of i, the crossbar of t/f) are placed at the end of the path in drawing order, and after pathLength normalization they still finish on the same frame
- The source video (superhuman-promo) background is real dusk mountain footage + a water reflection; the demo approximates it with a gradient, and for real use real footage / an AI-generated empty shot is recommended

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`letterspace-materialize/LetterspaceMaterialize.tsx`](../../../src/demo/opening/letterspace-materialize/LetterspaceMaterialize.tsx)

