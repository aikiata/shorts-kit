---
name: quad-split-parallel-scenes
summary: The frame hard-cuts into a 2×2 quad. The four quadrants run their own micro-scenes in parallel (typing, a whip push-in, word by word, an interaction chain), with key beats staggered by 3–6 frames to create an information barrage.
use: Montage beats in rhythm segments where "there are many features, all happening at once"; the density peak in the middle of a trailer
length: 90f (3s@30fps: 0–62f parallel barrage + 28f final-state hold, no transition throughout)
energy: high (four lines in parallel + staggered-beat impact, a standard BGM chorus slot)
---

## Intent
Replace sequential display with parallel density: four things happen in front of the viewer at once. The viewer has no time to read each in detail, but every 3–6 frames a quadrant "moves", and the scanning rhythm is firmly pinned down. This is a technique card: all in-cell content is replaceable, and the stagger arrangement is the recipe.

## Motion core
- Four independent quadrant scenes (content is an example: the four live scenes that happen at once when shorts-kit produces a promo film): TL browser tabs pop in one after another with overshoot + the address bar types letter by letter + at 44f the page loads and the big headline slides in from below + the whole time a slow inQuad push 1→1.1; TR terminal command typing + two lines of output + at the moment the last line appears a whip push 1→1.85 (sin-envelope blur 5px, old lines fade to 8%); BL three 132px big words drop in one by one with overshoot; BR an approval card slides in → the cursor flies along a bezier to Approve and clicks → the button becomes Approved → second leg flies to Publish and clicks → a go-live notification pops up and counts
- **The stagger is the soul**: TL tabs 6/11/16/21, page 44; TR output 27/33, whip push 37; BL words 14/30/49; BR click 25, color change 27, click 52, notification 56. Any two adjacent heavy events are at least 3 frames apart, so something is always moving but never everything at once
- The two typing cursors blink on offset cycles (16 frames vs 14 frames +5 phase), to avoid blinking together
- The four cells alternate in a lightness checkerboard (ember: cream #f7eee4 / warm black #160d09 / orange solid / latte #e9d7c4), with 8px warm-black gutters + 20px rounded corners; in-cell text re-laid out for 1080p (secondary ≥32px, main word 132px)
- After 62f all four cells rest in their final states (Launch film. / promo.mp4 ready / Prompt. Render. Ship. / Live · 3,214 views), forming one complete poster held for 28f

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| stagger interval | adjacent heavy events 3–6 frames | <2 frames reads as the same beat (moving together = stiff); >8 frames and the density scatters, losing the barrage feel |
| TL slow push | inQuad 1→1.1, origin 50% 90% | A "background-noise motion" that slowly accelerates the whole time, so even a still cell isn't still; too large a window runs into the corner badge |
| TR whip push | 37–47f, scale 1.85 + blur peak 5px, old lines fade to 8% | This is the heaviest beat of the whole card, pressing the BGM accent; the blur envelope must be sin (symmetric in and out) |
| typing speed | TL 20 characters / 0–40f, TR 19 characters / 0–24f | Keep the character count similar when changing copy, otherwise the typing rhythm drifts from its stagger relationship with the other quadrants |
| BR interaction chain | slide in 4 → cruise 14 → click 25 → color change 27 → second-leg cruise 38 → click 52 → notification 56 | Each link depends on the last; changing any step requires shifting the rest; the notification's overshoot pop is the accent at the end of the chain |
| background colors | light / dark / accent / light checkerboard | When changing to a project theme color keep the lightness difference between adjacent cells ≥15%, otherwise the grid-line feel vanishes |
| ending | final-state hold 28f after 62f | After the parallel barrage give one beat so that all four cells are read at the same time |

## Known traps
- This is a technique card: the content of all four cells can be swapped as a whole (product screenshots / screen recordings / other motion cards), but **the stagger table must be re-laid out**: the keyframes of the new content inherit the original timetable, otherwise the four cells become a collage of four independent videos
- The barrage segment of ~2.1s is the density limit; to stretch it further, add a second round of events to each quadrant, otherwise "nothing moves" in the second half; the ending hold is counted separately
- Cursor blinking is computed from the frame number (period 16f / 14f+5); after changing the timetable, re-check the out-of-phase relation of the two cursors
- Four cells typing / popping in at the same time is the most common degraded form. How to check: go through frame by frame, and no frame should have two quadrants with a "heavy event" at once

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`quad-split-parallel-scenes/QuadSplitParallelScenes.tsx`](../../../src/demo/rhythm/quad-split-parallel-scenes/QuadSplitParallelScenes.tsx)

