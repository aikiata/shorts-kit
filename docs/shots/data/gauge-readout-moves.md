---
name: gauge-readout-moves
summary: Two gauge readout moves: needle-sweep-selftest (ignition self-check: the needle whips across the full arc and settles back to the true value) and tape-scroll-fixed-pointer (the pointer stays put while the tick tape scrolls past + a sprint and a brake)
use: A dashboard opening ritual / performance metric reveal; A gives a multi-gauge power-on feel, B a single metric with a big jump
length: A 140f (4.7s) / B 150f (5s)
energy: medium-high (mechanical ritual type)
---

## Intent
Turn "reporting a value" into a physical action of the instrument. A is a car ignition self-check: the needles of three side-by-side gauges in a card first whip across the full arc (270°) with a "swoosh", the ticks they sweep over light up in turn, then a spring settles them back onto the true values; the gauges are staggered into a wave, and on the same frame as the settle the value under each dial pops out, first lighting the range and then reporting the number, an oath-taking opening feel. B is the grammar of an aircraft airspeed tape: a readout window + a pointer pinned to the center line of the frame, with a tick tape spanning the full frame height scrolling past behind the window as a whole. It first creeps up against the old upper limit, then sprints after the upgrade (peak ~100px/f), and at the end a spring brake swings back with overshoot: "the world moves, the pointer doesn't", and the size of the value becomes a visible distance of displacement.

## Choosing between the two
| Move | How | Fits |
|----|----|------|
| A needle-sweep-selftest | face and outer ring light up → the needle's outbound run is a 12f ease-out whip across the full arc (ticks swept over light up in turn, falling back within 24f) → a spring return with ~8° overshoot swing-back settles on the true value; three gauges staggered by 4f; on the same frame as the settle the value under the dial pops out with overshoot and the metric name fades in, and after everything settles a self-test capsule Running self-test… → Ready to render | Dashboard opening / system-ready ritual |
| B tape-scroll-fixed-pointer | full-frame-height tick tape translate: creep up against the old limit line → the limit line breaks → anticipation pull-back 5 → sprint 22f (peak ~100px/f, vertical motion blur) → spring brake overshoot swing-back to the stop position, and the new limit tag parks into the pointer; the readout in the window refreshes in step | A single metric with a big jump (performance doubled / quota raised) |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| A whip arc amplitude | full range 270°, returning as soon as it hits the top | Whipping only to the true value = no self-check ritual feel; full arc then falling back is what makes "light the range first"; ticks swept on the outbound run (including the red zone) light up in turn |
| A overshoot | the fall-back has a ~8° swing-back (spring damping derived back from the travel) | No overshoot reads as a digital watch; overshoot = the mass of a mechanical needle |
| A stagger | 4f per gauge (left → middle → right) | Whipping together reads as copy-paste; staggering makes a wave |
| B sprint speed | 5px per unit, peak ~100px/f (the big jump section) | Too slow reads as a constant-speed climb and "the world moves" doesn't hold; the longer the tape, the more it needs vertical motion blur |
| B brake | spring overshoot (overshoots then springs back to the stop position) | The swing-back in the original vocabulary is the source of the "clunk", and a straight stop would waste it |
| Truly still | ≥30f fully locked after the stop position (A last gauge settles at ~66f, B locks constants at 110f) | Tail drift is the worst sin for pointer types |

## Known traps
- The demo was tuned on grayscale/placeholder footage. The parameters are a starting point for tuning, not final production values; the first real use must be re-verified with real footage
- The same batch's ring-close-overfill (ring-close overshoot) was sent back as "change it and look again" with no further comment: ring-progress types are to be redone, so don't rush to fold it in as a third move
- A's gauge is a self-drawn SVG (arc ticks + pointer); when applying it to a real dashboard, first look for a ready-made gauge component in the page for a close-up, and build one only if there isn't any
- Sound: for A, a "swoosh" for the needle whip + a "tick" on settling (one per gauge, staggered); for B, a low-frequency rolling sound in the sprint section and a dull "clunk" for the brake

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`gauge-readout-moves/NeedleSweepSelftest.tsx`](../../../src/demo/data/gauge-readout-moves/NeedleSweepSelftest.tsx)
- [`gauge-readout-moves/TapeScrollFixedPointer.tsx`](../../../src/demo/data/gauge-readout-moves/TapeScrollFixedPointer.tsx)

