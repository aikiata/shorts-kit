---
name: type-entrance-moves
summary: One title text entrance style. letter-drop-physics (letters fall, smashed down by gravity, bounce, and stand crooked; on the last beat they all snap upright into place)
use: Entrance of big titles/chapter cards; chosen mutually exclusively with type-assembly-moves (gathering family) and document-typewriter-reveal (typewriter) in the same category
length: 5s for the single style (including hold and still ending; action section ~116f, demo 150f)
energy: medium-high (physical fun)
---

## Intent
The title entrance library already has the typewriter (a steady document feel) and the gathering family (letters converge from elsewhere). This card adds
physical comedy: letters fall from the sky, slam down and bounce, stand crooked and wobbly, and on the last beat
all snap upright into place, suited to a lighthearted ice-breaking opener (the demo smashes the brand name "shorts-kit" down to stand,
and the subtitle "Every shot lands on the beat." floats out on the snap-into-place beat). Title entrance: at most 2 kinds per video (P4).

## How
| Style | How | Use |
|----|------|------|
| A letter-drop-physics (letter fall) | Letters smash down from the top, staggered; gravity acceleration + two decaying bounces + a crooked stand on landing, and on the last beat all snap back upright together | A lighthearted opener; an "alive" title ice-breaker |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Fall | Letter i takes off at frame 4+36·(1−(1−i/(n−1))^1.5) (first and last letters fixed at 4f / 40f, with intervals getting denser; demo 9 letters 6.5→1.6f); y = −DROP + DROP·(t/24)² (gravity) → 4u(1−u) parabolic bounce 30% → second bounce 9% | The bounce decay ratio 30%/9% is the sweet spot of "springy but not rowdy"; three bounces or more reads as jelly |
| Crooked | At the moment of landing, rotate to the seed hash ±6° and hold | The crooked angle is half of the "physical feel"; all letters landing straight reads as an ordinary offset entrance |
| Snap-into-place beat | After everyone has settled (e.g. frame 110), 6f ease-out collective rotate→0 + scale 1.06→1 | The collective snap is the period: snapping into place staggered breaks up the ceremony of "standing at attention" |
| Ending | after the action finishes, truly still ≥20f | R1: during the still period all properties are locked (including after the crooked angle returns to zero) |

## Known traps
- The demo was tuned on grayscale/placeholder material. The parameters are a tuning starting point, not a field-tested final;
  the first real use must re-check against real material
- The landing slam sound is a strongly sound-dependent candidate slot (sound-design §4.5): pinning frame by frame per letter doubles the sense of weight,
  and a silent version also works but loses half the punch
- No real collision between letters (in the demo each letter has an independent trajectory): just space the letters out;
  wanting "knocking each other crooked" needs pre-baked trajectories, high cost for thin return
- Choose words that avoid letters with descenders (g/j/p/q/y) or correct the ground per glyph: the demo lands on the baseline,
  and a descender would "stick into" the ground
- A title entrance already carries high attention, so do not fight other high-energy entrances in the same frame

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`type-entrance-moves/LetterDropPhysics.tsx`](../../../src/demo/typography/type-entrance-moves/LetterDropPhysics.tsx)

