---
name: grain-dissolve
summary: A whole line of text bursts into boiling grain noise while a diagonal-hatched selection box surfaces. The noise cloud rapidly condenses into a larger, glowing short wordmark, and the displacement decays to zero and freezes.
use: Closing "XX. Now Live" style launch announcements; the energy-gathering beat where a long sentence is compressed into a short brand mark
length: about 2.0s (60f@30fps; graining 0.26–0.56s · condensing 1.2–1.42s · solidify, fall back and end)
energy: medium-high (a short, one-time energy pulse, a natural outro sync point)
---

## Intent
Shoot "a sentence condensed into one word" as a physical event: the sentence first destabilizes and boils into grain (information breaks apart), the selection box hints "now selecting and extracting", then all the grain's energy collapses toward the center into a larger, brighter short wordmark. The viewer reads "all of this comes down to this".

## Motion core
- The filter chain is the only engine: `feTurbulence` (fractalNoise, baseFrequency 0.9→1.3) + `feDisplacementMap` (scale 0→52) + `feGaussianBlur` (0→1.1px), all three driven by the same `burst` curve (t=0.13–0.28, outCubic)
- The noise "boils" by changing the seed every frame with `seed = floor(t*46)`: a new noise map each frame, so the grain is never still
- t=0.60–0.71 cross-fade: the full line (26px) fades out and the short wordmark (44px bold) fades in, both sharing the same filter. The switch happens at the most boiling moment, so the viewer never sees the text swap
- t=0.68–0.90 the `lock` curve pulls the displacement scale and blur back to 0, and the grain "solidifies" into clear letterforms
- White glow in three stages: 0.3 faint glow in the graining phase → 0.7 surge during condensing → fall back to 0.45 after t=0.88. Two layers of cool-white bloom inside the filter chain ("tight glow + wide glow", feGaussianBlur → feColorMatrix → feMerge, radius about 4–33px) breathe in sync; the SVG is rasterized at native 1920×1080 so the grain stays fine
- The diagonal-hatched selection box (45° line array + pixel checkerboard handles at the four corners) surfaces with burst and is removed at t=0.55–0.64: it exits before the condensing, so it doesn't steal from the subject

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| displacement scale | peak 52 | <30 is only "slightly rough edges"; >80 and the grain scatters until the outline is unrecognizable. "Faintly legible" is the floor of the grain texture |
| baseFrequency | 0.9 → +0.4 | Higher gives finer grain; below 0.5 it becomes big-chunk distortion, not "grain" |
| seed change rate | floor(t*46), 46 times in 2s | Lower and you can see the noise maps repeat; keep the map-change rate at ≥20 times per second |
| graining window | 0.13–0.28 (outCubic) | The clean text staying for the first 0.13 is the "normal state before destabilizing"; cut it and there is no contrast |
| condense cross-fade | 0.60–0.71 (inOutCubic) | The text swap must be completed inside the most boiling segment; earlier gives it away with a ghost of two lines overlapping |
| glow envelope | burst·0.3 + cond·0.7 − settle·0.45 | The condensing surge is the sync point, pressing the BGM accent; the fall-back should not reach 0, leave a soft-light "afterwarmth" |

## Known traps
- The demo copy is `{ shorts-kit. Now Live }` → condensing into the `shorts-kit` wordmark (all lowercase). When changing to a project's short mark, both `<text>` lines must be changed: the full-line sentence pattern `{ XX. Now Live }` and the short mark XX must refer to the same object, otherwise the narrative breaks
- A longer short mark (>6 characters) requires shrinking the font size or widening the selection box bw accordingly, otherwise after condensing it overflows the box and the visual center of mass shifts. The demo's 15-character brand name shrank the full line from 33px to 26px and the short mark from 54px to 44px, and the landing range of stray grains was widened in sync to the wordmark's glyph area
- `feDisplacementMap` performs poorly on Safari; for this card, a 2s short beat, that is acceptable; if the duration is extended, measure the frame rate
- The selection box must be removed (0.55–0.64) before the condensing is complete (0.71): if the box stays until after solidifying it reads as "not done selecting", and the semantics are reversed

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`grain-dissolve/GrainDissolve.tsx`](../../../src/demo/outro/grain-dissolve/GrainDissolve.tsx)

