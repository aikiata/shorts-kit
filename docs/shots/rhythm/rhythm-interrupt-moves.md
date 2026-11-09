---
name: rhythm-interrupt-moves
summary: Interrupting the rhythm. jump-cut-punch-in is a three-level jump-cut push-in: the same composition hard-jumps larger three times with no tweening, closing in on the target level by level.
use: Using "interrupting continuity" itself as a rhythm device: a stuttering push-in (A); complementary to beat-cut-moves (cut point layout)
length: A 135f ≈4.5s
energy: A medium
---

## Intent
The rhythm cards in the library all govern "how to cut and how densely"; this card governs **how to break**. The viewer expects
continuity, and you interrupt it instead, so the way of interrupting is the expression. A is a spatial break: the same composition jumps larger three times with no tweening
(1x→1.6x→2.6x), the stutter of a Godard jump cut, with more of a command feel of "look here, closer, that's it"
than a continuous push-in. Suited to forcing focus on a metric.

## Choosing a form
| Form | How | Use |
|----|------|------|
| A jump-cut-punch-in | transform-origin pinned to the target center, three-step scale staircase jumps (zero tween), each jump with a 2f deepening pulse as the tick | Closing in on a core metric level by level; documentary-style staring |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| A jump levels | 1.0→1.6→2.6, each hold ≥35f | A level difference <1.5× reads as the frame shaking once |
| A tick | From the jump frame a 2f brightness 0.92 full-frame pulse | A jump cut without a tick reads as a dropped frame |
| ending | last level truly still for ≥45f | For interruption types the after-hold is weighted heavy |

## Known traps
- The demo was tuned on grayscale/placeholder material. The parameters are a tuning starting point, not a final production setting.
  The first production use must be re-verified on real material
- Like speed-ramp-freeze it moves the "time axis", so one shot can have only one
  time manipulator
- The three levels' composition must share the same origin (target center pinned): recomposing at each level makes
  three shots, not a jump cut
- Strongly depends on sound: one tick per jump (sound-design §4.5)

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`rhythm-interrupt-moves/JumpCutPunchIn.tsx`](../../../src/demo/rhythm/rhythm-interrupt-moves/JumpCutPunchIn.tsx)

