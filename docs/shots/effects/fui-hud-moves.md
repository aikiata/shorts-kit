---
name: fui-hud-moves
summary: FUI/HUD reticle snap. In reticle-lock-on, a viewfinder made of four L-shaped corner brackets flies in from off-screen, overshoots and rebounds, then snaps onto the target.
use: Any "look here" call-out of a target (replaces arrow and red circle, and the picture does not freeze)
length: 2–3s (demo 90f)
energy: medium-high (the snap frame is the hit point)
tags: ui-entrance
---

## Intent
A motif from sci-fi fictional interfaces (Jarvis/Territory) that can be neutralized: capture in motion.
Four L-shaped corner brackets rush in from off-screen, overshoot and rebound, then "click" onto the four corners of the target element, and a label pops up.
Division of labor with freeze-annotate: that card freezes the picture to annotate, this card calls out the target while the picture keeps flowing.

## Variants
| Variant | How | Use |
|----|------|------|
| A reticle-lock-on | The four L corners are four mirrored copies of the same pair of rectangles. Fly-in (10f out cubic) and shrink (2.2×→0.94×→1 overshoot rebound) are decoupled. On the snap frame the target brightens slightly and the label pops out with back easing. | Calling out a target; landing on a heavy beat of the sound effect |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Fly-in travel | Rushes in from ≥1000px off-screen | Short travel reads as "the brackets appear", not "they pounce" |
| Overshoot | Shrinks past to 0.94× then rebounds to 1 | Without overshoot there is no "click" of snapping |
| Snap frame | Target white overlay quick flash 0.55→hold 0.28 + label pops out on the same frame | If the slight brightening and the label are on different frames, it falls apart |

## Known traps
- The demo was tuned on grayscale/placeholder footage. The parameters are a tuning starting point, not a final production setting.
  On first real use, re-verify against real footage.
- At most 2 per film: used back to back it reads as a military template. The two locked targets must differ.
- Sound: one "click" on the snap frame (a mechanical click, not a game UI sound, within the S1 boundary)

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`fui-hud-moves/ReticleLockOn.tsx`](../../../src/demo/effects/fui-hud-moves/ReticleLockOn.tsx)

