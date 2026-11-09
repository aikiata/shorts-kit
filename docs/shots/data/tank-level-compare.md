---
name: tank-level-compare
summary: Two outlined tanks fill side by side, one to full (what was believed) and one to under half (what was really there), with a bobbing surface line and the figure under each; the single-tank variant drains slowly to empty.
use: Believed against actual quantities (fuel, money in an account, water in a reservoir), or a resource running out over a shot.
length: fill 20-22 frames each, second tank 12 frames later; drain 50-70 frames; held for the shot (90-150 frames)
energy: low
tags: gauge, tank, fill, drain, comparison, level, estimate
source: makevideo/gimli-glider
---
# tank-level-compare

## Intent
A quantity is easier to feel as a level than as a number. Two tanks of the same size next to
each other make the gap visible before the numbers are read. The drain variant turns a
deadline into a picture: the level keeps falling while the voice goes on. It differs from
[gauge-readout-moves](gauge-readout-moves.md), which is needles and tapes for a live metric:
this is a container and a fixed amount.

## Motion core
- Gauge appears over 6 frames before `from` (`interpolate(frame, [from - 6, from], [0, 1])`).
- Level: `k = easeOutCubic((frame - from) / fillFrames)`, `level = level0 + (level1 - level0) * k`.
  Fill is `0 → 1` and `0 → 0.45`; drain is `0.45 → 0`.
- The fill is a block from the bottom at `level * 100%`, colour at 0.92 opacity, with a 6 px white
  surface line at 0.55 that bobs by `sin(frame / 5) * 3 * 0.3` px: the liquid looks alive even when
  the level holds.
- Ticks at 25, 50 and 75 percent (the middle one 46 px, the others 28 px); optional side labels.
- An `estimate` tag above the tank marks a derived figure ("estimate", not measured).
- Pair: `TankGaugePair` places two 367 px gauges at x 153 and 560 inside the 774 px safe box.
  In gimli the second (actual) tank starts 12 frames after the first (believed).

## Parameters
| Parameter | Typical value | Feel when changed |
|---|---|---|
| `fillFrames` (fill) | 20-22 | under 10 the tank snaps full; over 40 the comparison is late |
| `fillFrames` (drain) | 50 (lab), 70 (gimli s12) | slow is the point: the viewer watches it run out |
| Second tank delay | 12 frames | together reads as one fact; 12 frames lets the eye read "full", then "not full" |
| Levels | believed 1.0, actual 0.45; drain 0.45 → 0 (or 0.02) | keep the real ratio from the facts; do not exaggerate |
| Ease | cubic out | linear looks mechanical; the cubic out settles like liquid |
| Surface bob | `sin(frame / 5)`, 0.9 px | larger reads as sloshing, which steals the eye |
| Size | width 360-480, tank height 300 (gimli) or 420 (default) | under 300 tall the difference in level is hard to read on a phone |
| Colours | believed blue, actual the accent orange | the accent goes on the real, surprising quantity |

## Known traps
- The tanks show proportions; when the actual figure is derived, put the `estimate` tag on it.
- Value under the tank is 56 px, label 30 px uppercase and allowed two lines: long labels push
  the block down; check the safe zone.
- The pair is fixed at x 153 and 560: it assumes the 1080 px frame and the 774 px safe box.
- Pure function of the frame: the bob uses `sin(frame)`, the fill uses `interpolate`; no state.

## Pairs with
- [wrong-right-ledger](wrong-right-ledger.md): the calculation behind the gap.
- [chase-rig-follow](../camera/chase-rig-follow.md): gimli lowers the camera target 30 m so the
  pair can sit under the plane without a cut.
- [screens-go-dark](screens-go-dark.md): the next failure after the tank runs dry.
- [gauge-readout-moves](gauge-readout-moves.md): for a live reading instead of an amount.

## Reference implementation
- [`tank-level-compare/TankGauge.tsx`](../../../src/demo/data/tank-level-compare/TankGauge.tsx)
- [`tank-level-compare/placeholders.tsx`](../../../src/demo/data/tank-level-compare/placeholders.tsx)
