---
name: screens-go-dark
summary: A panel of three glowing digital screens goes dark one screen at a time, each leaving a faint flickering warning word, and then four analogue backup dials light up below and stay lit.
use: A power loss or a cascade of failures, where what is left matters: systems switching off one by one, the backup that remains. Also the "blank from the start" state for a broken display.
length: about 4.3 s (130 frames): screens off about 12 frames apart, 8 frames each, dials light over 14 frames
energy: medium
tags: gauge, cockpit, instrument, blackout, failure, flicker, cascade, backup
source: makevideo/gimli-glider
---
# screens-go-dark

## Intent
Failure told in order. Each screen goes out on its own word, so the viewer counts the losses
with the voice. The flicker on the dead screens says "broken", not "switched off". Then the
four old-fashioned dials come on and never go dark: the story's "this is all they had left".
It differs from [gauge-readout-moves](gauge-readout-moves.md), which powers gauges on; this card
powers them off.

## Motion core
- Three states. `live`: values shown. `blank`: dark from the start, with the warning word.
  `fade`: screen `i` goes from live to dark over 8 frames at `offAt[i]`.
- `live` drives everything on the screen: the background colour
  `rgb(12 + 30 * live, 18 + 60 * live, 24 + 40 * live)`, the inset accent glow
  (`24 * live` px), the 56 px value and the 30 px unit opacity.
- Flicker on a dead or dying screen:
  `0.18 + 0.2 * max(0, sin(frame * 0.9 + i * 2)) * (sin(frame * 0.23 + i) > 0.55 ? 1 : 0)`.
  A slow gate (0.23 rad per frame) switches a fast shimmer (0.9 rad per frame) on and off, with a
  phase per screen, so the three dead screens do not blink together.
- Dials (compass, horizon, airspeed, altitude), 170 px each: opacity `0.25 + 0.75 * on`, with
  `on` 0 → 1 over 14 frames from `dials.from`. The labels follow at `0.3 + 0.7 * on`.
- The compass needle turns `v * 360` deg; the other needles sweep `-130 + v * 260` deg; the
  horizon tilts `(v - 0.5) * 60` deg.

## Parameters
| Parameter | Typical value | Feel when changed |
|---|---|---|
| `offAt` spacing | lab: 10, 22, 34 (12 apart); gimli: three words of one line | under 6 apart it reads as one blackout; tie each to a word |
| Fade per screen | 8 frames | a hard cut (0) is a glitch; over 16 it reads as dimming, not failing |
| Dials `from` | 4 frames after the last screen (lab 38); gimli: the word for "clock" | too early and the dials share the moment with the losses |
| Dial light-up | 14 frames | slower than the screens going out, so the rescue reads as calm |
| Flicker gate | `sin(frame * 0.23 + i) > 0.55` | a lower threshold flickers more often and becomes noise |
| Flicker level | 0.18 to 0.38 opacity | brighter and the dead screen looks alive |
| Dial values | 0.15-0.7 | keep them mid-scale; a needle at the stop looks broken |
| Width | 774 (the safe box), screens `(774 - 40) / 3` wide, 190 px tall | narrower and the 56 px value no longer fits |

## Known traps
- Values are placeholders in gimli (`8.888`): an honest choice when the real reading is not
  known; do not invent a number.
- The flicker only runs when `state === 'blank'` or `live < 1`; a `fade` screen before its
  `offAt` does not flicker.
- Dial SVG clip ids are `dc0` to `dc3`: two `CockpitGauges` on one frame share ids. Show one at a time.
- Pure function of the frame: the flicker uses `sin(frame)`, not random, so preview equals render.

## Pairs with
- [tank-level-compare](tank-level-compare.md): the drain that causes the blackout.
- [failing-layer-bars](failing-layer-bars.md): the same "one by one" failure as an argument.
- [glitch](../sfx/glitch.md) per screen, or a single [drop](../sfx/drop.md) on the last one.
- [tension-camera](../camera/tension-camera.md) variant B: also ends on "only this is left".

## Reference implementation
- [`screens-go-dark/CockpitGauges.tsx`](../../../src/demo/data/screens-go-dark/CockpitGauges.tsx)
