---
name: svg-figure-rig
summary: Flat SVG people with a real skeleton walk, run, crouch, sit, kneel and sleep across a drawn scene; planted feet never slide, idle bodies breathe, and a crowd never moves in sync
use: An illustrated-scene video that needs people on screen (soldiers, a queue at a bank, passers-by, a crowd lit up as a ratio) and has no licensed photo of them
length: any; a walk cycle is 2π/0.2 ≈ 31 frames, a run cycle ≈ 18 frames; a typical shot holds 90-150f
energy: low to medium (walk and stand are low, run and crowds are medium)
tags: people, figure, character, walk cycle, inverse kinematics, crowd, illustrated-scene, svg
source: makevideo/ueno-bank
---
# svg-figure-rig

## Intent
A drawn person reads as a person only when the body obeys weight. Sliding feet, a whole crowd
breathing on the same beat, or a frozen stride give away "clip art". This rig solves the legs
with two-segment inverse kinematics from a step cycle, so the foot on the ground stays put while
the hip travels over it. Everything else (arms against legs, hip bob, breath, outlines, a darker
far side) is there so a small figure at 0.9 scale still feels alive in a 9:16 frame.

The same file drives two jobs: staging (people walk through a street, stand at a closed door)
and counting (ten figures in a grid, six of them light up for "6 in 10").

## Motion core
- One `Figure` is an SVG `<g>` with its origin between the feet on the ground (y = 0), facing
  right. `flip` mirrors it with `scale(-s, s)`. Nine poses: `stand`, `walk`, `run`, `crouch`,
  `slump`, `lie`, `sit`, `kneel`, `ground`.
- Gaited poses use `GAIT`: phase speed `w` (rad per frame), share of the cycle in stance, foot
  lift and default stride. `footAt(u)` gives the ankle: in stance it moves back linearly from
  `+S` to `-S` (the body passes over it), the heel lifts in the last 28% of stance; in swing it
  returns with a smoothstep and lifts by `lift · sin(πk)`.
- The two feet are half a cycle apart. Each leg is solved by `ik(hip, ankle, THIGH, SHIN)`,
  knee always forward (+x). An ankle out of reach is clamped so the leg goes straight.
- Hip height is the largest height at which every planted foot still reaches the ground
  (compass gait), so the hip bobs twice per stride by itself. With no foot planted (run flight)
  the hip pops up by 3 px.
- No foot slide: pass `speed` (parent px per frame). The rig sets the stride so the body
  covers `2S` during one stance: `S = |speed| · stance · (2π / w) / (2s)`, clamped to 6..46.
- Arms swing opposite the same-side leg: angle `-cos(2πu) · amp`, elbow bend added on the
  forward swing; running bends the elbow to 1.55 rad and leans the torso 0.3 rad.
- Idle life: breath `b = sin(frame / 20 + x · 0.037 + y · 0.011)` (lying: `/ 26`). The
  position term offsets every person, so a crowd never breathes as one.
- Look: every limb is drawn twice, a dark outline (`#17110C`, width + 3.5, opacity 0.55) under
  the colour; the far leg and arm are darkened 25-28% with `mixHex`; a shadow ellipse sits under
  the feet. `rim` draws the whole body once more, offset (3, -3) in a light colour, for night.
- Staging from the video: walkers wrap across the frame with
  `x = ((rnd(seed + i) · span + frame · speed) % span + span) % span - 150`, `span = W + 300`,
  `flip` when `speed < 0`, and the same `speed` passed to the figure.

## Parameters
| Parameter | Typical value | How it feels when changed |
|---|---|---|
| `GAIT.walk` | w 0.2, stance 0.6, lift 12, stride 20 | higher `w` is a hurried shuffle; lift above ~20 reads as marching |
| `GAIT.run` | w 0.34, stance 0.4, lift 30, stride 34 | stance under 0.4 gives a flight phase, the body bounces |
| `GAIT.slump` | w 0.12, stance 0.64, lift 6, stride 13, lean 0.24 | the tired walk; lift under 6 drags the feet |
| `GAIT.crouch` | w 0.16, hip fixed at 52, lean 0.62 | sneaking; lean past 0.7 looks like falling |
| Segment lengths | thigh 42, shin 40, upper arm 29, forearm 27, ankle 7 | change them together or the gait math no longer meets the ground |
| Hip keep | walk 0.985, slump 0.95, run 0.93 | lower is a softer, bent-knee stance |
| Arm amplitude | walk 0.42, run 0.95, slump 0.18 | 0.18 reads as exhausted, 0.95 as sprinting |
| Walker speed | 2.1 to 2.6 px per frame at s 0.95-1.3 | under 1.5 the street looks paused; above 4 people rush |
| Grid staging | 5 per row, x = 140 + col · 200, y = 1000 + row · 290, s 0.9 | fade in 3f apart; lit ones get a 110 px glow at 0.22, others dim to 0.45 |

## Known traps
- **No `speed`, no walk.** Without `speed` the phase is the static `phase` prop, so a `walk`
  pose is a frozen stride. Pass `speed` (0 marches on the spot with feet still) or animate
  `phase` yourself.
- **Match `speed` to the real motion.** The stride is computed from `speed` and the figure
  scale `s`. If the `x` you move the figure by per frame differs from `speed`, the feet slide.
- **The knee only bends forward.** To walk left, use `flip`; never move a right-facing figure
  backwards.
- **Determinism.** All variety comes from `rnd(seed)` and frame-based sines; never
  `Math.random()`. The breath offset uses `x` and `y`, so two figures at the same spot breathe
  together: nudge one.
- **Cost.** Each figure is dozens of paths; `rim` doubles it. A grid of 10 is fine, a crowd of
  60 with rim slows renders; scale far figures down and drop `rim` there.
- **One grade for all skies.** Colours in `LOOK` are a daytime set. Put figures inside an svg
  whose group carries the sky's `GradeFilter` (see `sky-graded-world`), do not hand-tune a night
  palette per look.
- Version 1 was judged "still a bit basic" by the owner: flat single-segment limbs with no
  outline and no breath read as stick figures. The two-segment taper, outlines and breath are
  the fix, keep them.

## Pairs with
- [`sky-graded-world`](sky-graded-world.md): the land, sky and colour grade these people stand in.
- [`depth-layer-moves`](../camera/depth-layer-moves.md): walkers on two depths (y offsets, scales 0.95 and 1.3) give parallax.
- [`list-reveal`](../ui-entrance/list-reveal.md): the same stagger logic as the 6-in-10 grid.

## Reference implementation
- [`svg-figure-rig/people.tsx`](../../../src/demo/effects/svg-figure-rig/people.tsx)
