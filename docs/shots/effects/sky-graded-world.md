---
name: sky-graded-world
summary: A drawn landscape (sky, sun or moon, drifting clouds, swaying grass, tree line) plus a props kit, where one daytime colour set for people and props is re-graded to dawn, noon, dusk, night or rain by a single SVG colour matrix
use: An illustrated-scene video whose story moves through the hours or days of one place (a battle, a journey, a vigil) and needs the time of day to read at a glance
length: a scene holds 90-240f; the world loops forever, so length is set by the narration
energy: low (ambient motion only: clouds, grass, smoke, flags)
tags: illustrated-scene, landscape, time of day, colour grade, props, parallax, svg, seeded random
source: makevideo/san-jacinto
---
# sky-graded-world

## Intent
When a story is told in hours ("by 3:30 the camp was asleep"), the sky is the clock. This kit
makes the sky do that work without redrawing anything: the land and sky come from a `Sky` key,
and every person and prop is drawn once in daytime colours and passed through a per-sky
`feColorMatrix`. Night does not need a night palette per object; it needs one multiplier.

The ambient motion (clouds at depth-dependent speed, grass sway, moss, smoke, flags) keeps a
still frame alive while the voice carries the facts, without competing with captions.

## Motion core
- `SKY[sky]` holds seven skies: gradient stops (`top`, `low`, `far`, `ground`, `near`), a light
  level, a channel multiplier `k` and, for dark skies, a `rim` colour. Examples: `day` k
  [1, 1, 1]; `dusk` [0.82, 0.6, 0.56], rim `#FFB27A`; `night` [0.36, 0.44, 0.6], rim `#BFD6F2`.
- `GradeFilter` writes `k` into a diagonal colour matrix (`colorInterpolationFilters="sRGB"`).
  Put it in the `<defs>` of the svg that draws people and props, and wrap them in
  `<g filter="url(#id)">`.
- `Land`: one CSS gradient for sky and ground split at the horizon `HY = 860`, `SkyLights`
  (sun position and colour per sky, stars and moon at night), `Clouds`, a horizon haze band,
  a tree line of 28 seeded points, and 140 distant grass strokes whose length and width grow
  with `d = rnd^1.7` (more strokes far, fewer near).
- `Clouds`: n clouds per sky (3 at noon, 10 in rain), each 5 blurred ellipses. Depth sets y,
  scale (0.55 + 0.9 · depth), opacity and speed: `x = (rnd · span + frame · (0.12 + depth ·
  0.3)) % span - 350`, `span = W + 700`. Far clouds crawl, near clouds drift.
- `TallGrass`: 220 foreground blades, sway `sin(frame / 18 + i · 0.7) · 10 + sin(frame / 7 + i)
  · 3`. Two out-of-step sines read as wind, one sine reads as a metronome.
- `Camera`: zoom around a look point with `Easing.inOut(cubic)`, optional pan of the origin and
  handheld shake from two sines per axis (0.83 and 2.1 rad per frame). Zoom is clamped to at
  least 1 so the frame edge never shows.
- Props (`props.tsx`) are drawn around their ground contact point and return a `<g>`: live oak
  with swaying moss, tent, breastwork, campfire, smoke, flag (with `lower` 0..1), wagon with
  turning wheels and walking horse, adobe house, cannon (`fire` 0..1), bridge (`burn` 0..1),
  bush, sleeping Zzz, flying letter.
- `DayClock` (also in `kit.tsx`): a small clock and "12:30 NOON" chip under the watermark that
  counts story time; the video lerps the hour across a shot.

## Parameters
| Parameter | Typical value | How it feels when changed |
|---|---|---|
| Horizon `HY` | 860 of 1920 | lower gives more sky and a lonelier frame; above ~700 the ground crowds the caption band |
| Night multiplier `k` | [0.36, 0.44, 0.6] | raise blue relative to red for moonlight; equal channels read as "dimmed", not "night" |
| Cloud speed | 0.12 + depth · 0.3 px/frame | double it and the sky looks time-lapsed |
| Cloud count | 3 (noon) to 10 (rain) | more than 10 hides the sky gradient |
| Grass sway | amplitude 10 + 3, periods 18 and 7 frames | amplitude above ~16 reads as a storm |
| Smoke loop | `p = (frame · 0.012 · speed + i / n) % 1`, radius 14 + 46p, opacity (1 - p) · 0.45 | speed 2 for a burning bridge, 1 for a campfire |
| Flag wave | `sin(frame / 8 + k) · 6` px | period under 5 frames flutters like a storm |
| Camera shake | `shake` 0 to ~6 px | 2-3 is a breathing handheld; over 8 is an explosion |
| Grain | opacity 0.2, overlay, seed changes every 2 frames | seed every frame boils; every 2 frames reads as film |

## Known traps
- **Seeded random only.** Every position goes through `rnd(seed)` (a sine hash) so each frame
  draws the same; `Math.random()` would re-layout the world on every frame and every render.
- **Positive modulo.** Looping values use `((x % 1) + 1) % 1` or `(... % span + span) % span`.
  A plain `%` goes negative for negative speeds and the object jumps.
- **Unique filter ids.** During a cross-fade two scenes are mounted at once. The Ueno version
  names the filter per shot (`g-${id}`); two svgs with the same filter id can pick up the wrong
  sky's matrix.
- **Grade people, not the sky.** The colour matrix goes only on people and props; the sky
  gradient is already the right colour. Filtering the whole frame double-darkens the night.
- **Zoom below 1 shows the edge.** `Camera` clamps it; keep the clamp if you add a pan.
- **Text strings are Vietnamese** in the source (`dayPart`, chip copy): replace them, they are
  content, not code.

## Pairs with
- [`svg-figure-rig`](svg-figure-rig.md): the people that stand in this world.
- [`ember-film-grade`](ember-film-grade.md): the same grain and vignette idea over photographs.
- [`depth-layer-moves`](../camera/depth-layer-moves.md): clouds, tree line, figures and tall grass are ready-made depth layers.
- [`timeline-travel`](../data/timeline-travel.md): when the time itself is the claim, not just the mood.

## Reference implementation
- [`sky-graded-world/kit.tsx`](../../../src/demo/effects/sky-graded-world/kit.tsx)
- [`sky-graded-world/props.tsx`](../../../src/demo/effects/sky-graded-world/props.tsx)
