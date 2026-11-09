---
name: line-carry-transition
summary: Line-relay lateral pan transition. Scene A's progress bar extends out of frame, the camera follows the line sideways, and while moving the line turns corners to outline the card frame of scene B, with no cuts at all.
use: Between two scenes with a graphic kinship (progress bar → card frame, underline → chart axis). The signature transition slot of a film, a graphic relay in the style of the Catch Me If You Can title sequence.
length: ~6.3s / 190f (progress bar fills 36f + shoots out 10f + lateral pan 56f + frame closes 24f + poster in frame 30f + still 24f)
energy: medium
tags: camera
---

## Intent
The three big families in the transition library (travel / hidden cut / volume block) all answer "how does the scene change". This card's answer is **it doesn't change at all: one line leads you across**. After the progress bar fills, its end extends into a long line that shoots out past the card edge, and the camera follows the line sideways 1920px into a new world. While moving, the line turns right angles to outline the card frame of scene B, the frame closes, and the content fades in. From start to finish the viewer's eye never leaves this line. Graphic continuity is itself the transition. The difference from a match-cut: that one aligns shapes on both sides of the cut point, which is still a cut. This is continuous drawing: **there is no cut**. The line's identity needs a narrative logic (the progress bar "is done", so it extends out). A line with no reason is just decoration.

## Motion core
- A 3840-wide world container's translateX acts as the camera, moving 1920px over 56–112f, smooth in-out (bezier .65,0,.35,1)
- One hand-written polyline path (progress bar 648 + shoot-out segment + right angle + 720×480 rectangular frame, total length 4944) runs through with a dasharray evolve for the whole time, with the drawn length driven in segments
- **The key: during the lateral pan, drawn = 1144 + cam, so the line grows at the same speed as the camera.** The pen tip is pinned at about x≈1480 on screen, to the right, so it never leaves the frame and never falls behind. If it loses speed, the viewer losing the line means losing the transition.
- **Speed is continuous at the handovers**: the progress bar eases out to zero speed → full bar stops for 6f (state flips to done, check mark pops) → the shoot-out segment has zero speed at both ends (swift) → the camera starts at zero speed in-out → the frame closing, in-out from zero speed, catches the camera's landing point
- The pen tip is the only accent color dot in the whole film (terracotta r=14 + halo ring). After the frame closes it dissolves at 136–142f and is conditionally unmounted (the mask-removal ruling).
- During the lateral pan, the world content (cards, dot grid, exhibit labels) gets horizontal motion blur by camera speed (SpeedBlur, ≤16px), while the line and pen tip stay sharp outside the blur layer. After the line passes, drafting ticks grow below it, giving the eye a speed reference in the middle of the pan when only the line is on screen.
- B's exhibit-label title is outside the frame and can rise before or after the camera arrives. The poster inside the frame must wait until the frame closes (from 136f) to grow in.

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Line body | 8px ink-colored solid line, square cap + right-angle miter | Too thin and it's lost during the pan; a dashed line reads as an unfinished state |
| Pan ratio | 1920px / 56f (average 34px/f) | For a longer pan, stretch the duration proportionally, don't speed up. At peak speed >80px/f the pen tip starts to lose the camera |
| Pen tip position | Frame x≈1480 (about 77%, to the right) | Centered reads as "the line chasing the camera"; at the edge a slight tremor takes it out of frame |
| Corners | Hard right-angle turns, not rounded | Rounded soft corners lose the drafting feel and the Saul Bass flavor is gone |
| Frame closing | In-frame content comes out only from the closing frame | If content comes out before the frame closes, the suspense of the line is wasted |
| Ending | Truly still ≥24f after the poster finishes growing | The pen-tip ink dot must be conditionally unmounted. Any leftover ruins the stillness |

## Known traps
- The demo is a hand-built shorts-kit rendering scene (beige paper + ink + terracotta; A: render release film progress card → B: this film's poster). The parameters are a tuning starting point, not a field-proven final. The first real use must be re-checked with real material.
- Relation to draw-svg-trace: that one is element-level stroke call-out (the line belongs to the element); this one is a scene-level line relay (the line belongs to the camera). They can coexist in one film, but the line's semantics must be consistent: either both are ink 8px geometric hard lines or both are hand-drawn. Mixing reads as two art styles.
- At most 1 time per film. This is a signature transition, not a regular one. The second time, the magic breaks.
- The starting point must be a natural extension of an existing graphic component (progress bar filling, underline finishing). A line started from nothing reads as a screensaver.
- Sound: one continuous pen rub as the line grows, one light tap as the frame closes (sound-design §4.5)

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`line-carry-transition/LineCarryTransition.tsx`](../../../src/demo/transition/line-carry-transition/LineCarryTransition.tsx)

