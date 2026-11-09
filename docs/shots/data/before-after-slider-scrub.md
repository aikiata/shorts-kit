---
name: before-after-slider-scrub
summary: Before/after slider: the "before" and "after" versions are stacked, the split bar whips across fast and then sweeps slowly, and the new version "develops" into view wherever the bar has passed
use: An effect-comparison section for AI enhancement/optimization/refactor features ("with vs without" explained in one shot)
length: 4–5s
energy: medium (the fast whip is the hit point, the slow sweep is the reading period)
tags: interaction
---

## Intent
The standard comparison grammar of AI image product launch videos: the same picture "before" (low-contrast and grayish) and "after" (the clear version) are stacked, and a vertical split bar with a round handle first whips from the left end to 70% (overshoot and rebound), pauses one beat, then sweeps back at about 1/5 the speed so the viewer can see the difference clearly. **The speed contrast of fast whip and slow sweep is the rhythm**: the fast whip announces "it changed", and the slow sweep proves "where it changed".

## Action phases
| Phase | Frame range reference | Content |
|------|------|------|
| 1 Rest | f0–14 | The bar rests at 8%, and the picture is almost all "before"; f10–14 first pulls back to the left to 6.5% as anticipation |
| 2 Fast whip | 12f | 8%→76% (out cubic) with overshoot |
| 3 Rebound | 12f | 76%→70% |
| 4 Pause | ~18f | Lets the viewer see the after clearly |
| 5 Slow sweep | ~48f | 70%→40%, showing the difference a second time |
| 6 Freeze | last ≥40f | Truly still |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Speed ratio | fast whip 12f vs slow sweep 48f, about 5:1 | A ratio <3:1 and the rhythm contrast isn't perceivable |
| Reveal | the right boundary of the after layer's clip-path inset follows the bar x | If the bar and the reveal boundary are misaligned, it breaks immediately |
| Handle | round handle + a velocity-difference-driven scaleX micro-stretch (peak 1.18), returning to 1 automatically at rest | The stretch gives the handle the weight of "being whipped" |
| Before treatment | low-contrast gray veil | A before that is too ugly is self-sabotage; the "bad" must be believable (a real old version / unoptimized state) |
| Corner tags | BEFORE/AFTER tags go in the content area | Demo precedent: the first version covered the sidebar/avatar and broke |

## Known traps
- The demo was tuned on grayscale/placeholder footage. The parameters are a starting point for tuning, not final production values; the first real use must be re-verified with real footage
- The two versions must share the same layout and camera position: with different layouts they read as two pages and the comparison fails (the same constraint as theme-switch-moves)
- In real use both before and after use real screenshots (Q1): the before is a real state with old data injected / the feature turned off, not a hand-built fake before that is "deliberately ugly"
- The slow sweep ends at 40%, not 0%, leaving a stretch of the after frozen in the frame (the conclusion stays visible)
- Sound: one whoosh for the fast whip + a light tick for the rebound; the slow sweep is silent or has a very light friction sound (S4)

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`before-after-slider-scrub/BeforeAfterSliderScrub.tsx`](../../../src/demo/data/before-after-slider-scrub/BeforeAfterSliderScrub.tsx)

