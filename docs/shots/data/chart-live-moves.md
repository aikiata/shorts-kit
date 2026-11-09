---
name: chart-live-moves
summary: Three live-chart moves: oscilloscope-stream (the right end of the curve is written in real time + a sudden spike), unit-dot-swarm-regroup (a dot cloud migrates in three acts and gathers into a number), axis-rescale-shock (a new value bursts out of the frame and forces the y axis to rescale)
use: Data storytelling sections; they say "real-time", "every number is a person" and "growth doesn't fit" respectively
length: 165–192f each (5.5–6.4s)
energy: medium-high (the data is the plot)
---

## Intent
A chart is not an illustration, it is the plot. The shared precondition of the three moves (measured precedent): **it must be a real chart context**: real axis labels / real data / real copy, because grayscale placeholder bars can't test the expressive power of data storytelling.
A oscilloscope-stream: the curve's write point is pinned at the right end and bobs up and down, old data flows out to the left, and midway there is one sudden spike (amplitude 2.2×, the readout jumps large and takes the accent color). "Real-time" never has to be said aloud, and there is an event as well.
B dot-swarm regroup: 320 dots (each dot ≈40 renders) scatter → gather into three clusters (floating real labels Promo/Launch film/Explainer) → line up into columns (real axis labels) → gather into a large dot-matrix number "12,847". It is the same batch of dots, and the viewer can follow one dot to see it return to formation.
C axis shock: the line climbs normally, a new value breaks through the chart's ceiling guide line and bursts out 226px (a thick accent-color line pokes into the title area and crashes into the KPI number at the upper right), pauses half a beat, and the y axis rescales with a "whoosh" (old ticks fly out / new ticks slide in / the grid densifies / the old line flattens into the horizon), and the new value drops back + pops up a real-value label. It acts out growth with "the axis can't hold it".

## Choosing among the three
| Move | Core action | Fits |
|----|----------|------|
| A oscilloscope-stream | sampling window pans 8px/f + a Gaussian pulse spike (with a precursor / aftershocks) + braking to a truly still stop + a slow push-in toward the spike after braking | Monitoring/real-time products: a system that is "alive" |
| B unit-dot-swarm-regroup | three-act spring staggered migration (stiffness 150, damping 13, stagger 8f), clusters packed tightly in a sunflower spiral, the final act forms a number out of the dot matrix | User count/composition stories: "every dot is a person" |
| C axis-rescale-shock | bursts out 226px past the ceiling (guide-line crack + debris) + a three-way rescale link (ticks swap / grid densifies / old line flattens) + a 10px shake | Growth curve highlight: "off the charts" made literal |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Real context | real title / real axis labels / real units / real readouts | **A precondition for entering the library**: the grayscale versions were all ruled out on all three counts, and after switching to a real context all passed |
| Hero color | the accent color marks the event/protagonist (demo: A coral-red spike, B cobalt-blue Launch film cluster, C terracotta burst section) | All gray and you can't read "where the point is" |
| A flow speed | 8px/f | 5.5 is already perceivable, 8 is clearer; the waveform is a pure function, no randomness |
| B dot count / dot diameter | 320 / diameter 20px (stretched into a capsule by speed during migration, capped at +20px) | Too few dots can't form the number, too small and individuals can't be seen; stretching too long smears into a blur |
| C burst amplitude | 226px past the ceiling guide line | The 80px version isn't "explosive" enough; it feels like an incident only when it really pokes into the title area |
| Ending | all three need ≥36f truly still | Tail drift on a data chart reads as not finished playing |

## Known traps
- The demo was tuned on illustrative render data of shorts-kit (A a deep-blue oscilloscope screen, render farm fps; B a porcelain-white infographic, render volume split by video type; C a sand-colored Swiss poster, monthly render volume). The numbers are illustrative: the parameters are a starting point for tuning, not final production values, and the first real use must be re-verified with real footage
- Readouts / ticks / labels in all three are sized for the finished video (≥32px, main readout 120–176px); the chart fills the frame rather than shrinking into a card
- The three are three independent techniques, not a package: when using more than one in the same video, each at most once and in separate sections
- A's spike event and C's rescale can only happen once; repeating them is cheap
- B's final-act number glyphs must be computed by hand in advance (it is only tidy when the dot count fully uses up the slots; the reference implementation uses a single-line skeleton sampled at equal arc length, a double row along the normal, exactly 320 dots with no overlap)
- How it differs from dataviz-landscape-open (the abstract data landscape opening): that one is opening atmosphere, and these three moves are concrete data arguments inside a section
- Sound: a warning tick for A's spike; one whoosh per migration act in B; one riser as C bursts out of the frame and a "splash" for the rescale

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`chart-live-moves/AxisRescaleShockV2.tsx`](../../../src/demo/data/chart-live-moves/AxisRescaleShockV2.tsx)
- [`chart-live-moves/OscilloscopeStreamV2.tsx`](../../../src/demo/data/chart-live-moves/OscilloscopeStreamV2.tsx)
- [`chart-live-moves/UnitDotSwarmRegroupV2.tsx`](../../../src/demo/data/chart-live-moves/UnitDotSwarmRegroupV2.tsx)

