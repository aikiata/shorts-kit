---
name: graph-draw-follow-cam
summary: A concept curve draws itself with a glowing pen tip while a zoomed camera rides the tip; segments get named, glow, go dashed or wobble like a pencil sketch, and real photos pinned to the curve pop in as round insets, all on one graph across many shots
use: Explaining a famous diagram or curve (uncanny valley, hype cycle, Dunning-Kruger) where the shape is the claim and the voice walks along it
length: one shot 45-150f; the graph sequence in the source runs across 15 consecutive shots
energy: medium
tags: graph, curve, line draw, camera follow, sketch, pencil, data, diagram, inset, smoothing
source: makevideo/uncanny-valley
---
# graph-draw-follow-cam

## Intent
A curve shown whole is read in one glance and forgotten. Drawn while the voice walks along it,
with the camera close on the pen tip, the viewer feels the climb, the drop and the recovery. The
graph is one persistent world: every later shot (naming the valley, placing examples, a second
"moving" curve, the doubt at the end) is a camera move and a layer change on the same box, so
the viewer never loses the shape.

## Motion core
- **Curve from a formula, sampled once.** `curve(peak, bottom, end)` is piecewise: a climb mixing
  linear and smoothstep to `PEAK_X = 0.7`, a smoothstep drop to `BOTTOM_X = 0.83`, a smoothstep
  rise to the end. 321 samples (`N = 320`) map to px in a 1000 × 1000 box (`X0 120`, `X1 940`,
  zero line at y 600, `UNIT 330`).
- **Arc length table.** `CUM[i]` is the cumulative length of the polyline. The full path is drawn
  with `strokeDasharray = TOTAL`, `strokeDashoffset = TOTAL - drawn`. `pointAt(len)` finds the
  tip by binary search in `CUM` and lerps inside the segment.
- **Drawing across shots.** `drawnAt(frame)` is piecewise by shot: 0 → climb during shot `len`
  (finishing at 92% of the shot), climb → valley floor during `xuong` (85%), holds at the floor
  while the valley is named, then floor → end during `lai` (95%). Finishing before the shot ends
  leaves a beat of stillness before the cut.
- **Pen tip**: a 11 px dot with a 22 px halo at 0.18 opacity, shown only while drawing.
- **Follow camera.** Each shot defines a raw camera `{s, f}`: zoom and the graph point to put on
  the screen target `(540, 860)`. While drawing, `f` is pulled toward the tip:
  `f = CENTER + (tip - CENTER) · k`, k 0.6 to 0.8, zoom 1.2 to 1.45. Static shots aim at fixed
  points (zoom 1.0 to 1.3).
- **Smoothing over cuts.** `camAt(frame)` averages `rawCam(frame + i)` for i in -16..16 with
  triangular weights `17 - |i|`. Shot changes become 33-frame glides; there is no tween code.
  A slow drift `sin(frame / 45) · 4` px keeps the wide shots alive.
- **Layers that change meaning**: the below-zero area fills red at 0.16; the valley segment is
  redrawn at width 12 with a Gaussian glow (stdDeviation 9), pulses `0.5 + 0.5 · sin(t / 3.2)`
  on "some people see it", then flickers (product of two sines) and goes grey and dashed
  `22 18` on "some people do not".
- **Pencil sketch**: from the "hand sketch" shot, `feTurbulence` (baseFrequency 0.035) into
  `feDisplacementMap` with scale `7 · sketch`, sketch ramping in over 20f, seed
  `floor(frame / 4) % 50`: the line boils at 7.5 fps like a redrawn sketch.
- **Insets**: round photo windows (r 78 and 64, 5 px ring, glow) pinned at graph coordinates,
  scale 0.6 → 1 with a spring `enter`. A second "moving" curve draws in accent colour with its
  own dash length.

## Parameters
| Parameter | Typical value | How it feels when changed |
|---|---|---|
| Samples `N` | 320 | under ~100 the tip moves in visible steps at 1.45× zoom |
| Draw finish | 92%, 85%, 95% of the shot | 100% leaves no beat before the cut; under 75% the line waits too long |
| Follow `k` | 0.6 (climb), 0.8 (drop) | 1.0 locks the tip dead centre and the viewer loses the shape; 0.3 barely follows |
| Follow zoom | 1.25 to 1.45 | over 1.6 the axes leave the frame and the climb has no reference |
| Smoothing window | ±16 frames, triangular | ±6 still jerks on cuts; ±30 makes every move late |
| Pencil displacement | scale 7, seed every 4f | scale 12+ breaks the line; seed every frame looks like noise, not hand drawing |
| Glow | stdDeviation 9, width 12 (+6 on pulse) | the named segment must be visibly thicker than the 7 px base line |
| Screen target | (540, 860) | the focus sits above the caption band; lower and captions cover the tip |

## Known traps
- **Do not use `getTotalLength()`.** The arc length is computed from the sample points, once, at
  module load. It is deterministic and works in every render process; DOM measurement is not
  available before mount.
- **Camera averaging calls the shot lookup 33 times per frame**, including frames past the last
  shot. `rawCam` must handle any frame (the source has a `default` case).
- **Insets and labels are placed for the zoomed view.** The face inset sits left of the valley
  floor and the real-human inset left of the right peak, so neither slips under the caption band
  when the camera zooms. Re-check them on stills at every camera stop, not only the wide shot.
- **Seed the sketch from the frame.** `floor(frame / 4)` keeps the wobble deterministic; a
  random seed differs between render workers.
- **Shapes are a sketch, not data.** Mori's curve is qualitative; the source labels it "hand
  sketch, Mori 1970" on screen. If the curve is real data, plot real values and label the axes.

## Pairs with
- [`draw-svg-trace`](../ui-entrance/draw-svg-trace.md): the basic stroke draw-on this builds on.
- [`chart-live-moves`](chart-live-moves.md): live chart moves when the data is real numbers.
- [`face-blur-mask`](../effects/face-blur-mask.md): the blurred face used in the valley inset (same video).
- [`marker-underline-title`](../typography/marker-underline-title.md): the hand-drawn underline under the sketch stamp.

## Reference implementation
- [`graph-draw-follow-cam/Graph.tsx`](../../../src/demo/data/graph-draw-follow-cam/Graph.tsx)
- [`graph-draw-follow-cam/scenes.tsx`](../../../src/demo/data/graph-draw-follow-cam/scenes.tsx) (`rawCam`, `camAt`, `Chart`)
