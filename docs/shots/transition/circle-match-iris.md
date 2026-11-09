---
name: circle-match-iris
summary: Circle-center match iris cut. An iris bursts open from the center of a circular element on the page, and the circular chart of the new page inside the iris connects onto the same circle. The match cut gives the iris a semantic anchor.
use: Seams where the foreground has a circular element (avatar / icon / round button) and the background has a circular subject (donut chart / ring progress). Technique card.
length: 5.5s / 165f (entrance + eye-catch 40f + anticipation 7f + circle-match iris opening 37f + sweep 58f + still 47f)
energy: medium-high
---

## Intent
An ordinary iris (the original glossary entry) opens from any point, and the viewer reads only "the page changed".
This card welds it to a match-cut: the iris must burst from the center of a **real circular element** in the foreground, and the new page growing inside the iris has a circular chart that connects onto the same circle. The viewer sees "the avatar's circle turned into the chart's circle", and the circle itself carries the story (this person → this person's data). This is the way a match-cut lands in a UI context: not by a coincidence of composition, but by a semantic circle-to-circle. Like the three travel styles, the background is already present inside the foreground, but the anchor here is an abstract shape rather than a container.

## Motion core
- **The circles of both scenes must be strictly concentric. This is the key.** The anchor circle center is hard-coded as one set of constants (demo: CX=540, CY=540, = left edge of the leaderboard row + padding + rank column + avatar radius). The avatar, ripples, clip-path circle, new-scene ring and dial all reference the same constants. If coordinates are computed separately they will certainly be off-center.
- Eye-catch guidance: the other rows are dimmed to ~32% brightness and the anchor's row is lifted. The avatar does two scale pulses + two expanding halo rings (18f / 30f). The camera pushes in 3% slowly with the anchor as transform-origin (the anchor does not move on screen), and from 40–47f the avatar shrinks to 0.9 as anticipation.
- **Circle match = a solid disc hollowed out into a ring**: at the moment the iris opens, the new-scene ring's stroke width = its diameter (it looks exactly like that solid avatar). Over 28f the radius goes 36→300 and the stroke narrows to 44px (expo-out), and the color fades from fluorescent solid to a dark track. Iris radius = ring outer edge + an ease-in accelerating expansion (adding 2400px over 54–84f), so it is "the ring pushing the iris open", and the circle match necessarily happens before it fills the screen.
- At the same time the old page scales up 1.03→1.22 around the anchor and darkens (ease-in). The iris outer edge has a ring of drop shadow and a fluorescent lit ring that appears only in the early part of the opening, so the new scene "presses" onto the old page.
- Ring sweep: strokeDasharray = sweep × circumference, rotate(-90) starting at the top. From 60–118f it goes with a slow start and long tail to 87%. The 200px number in the center counts in sync with the sweep, and a soft glow on the arc head follows the pen tip.

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Anchor pulse | 2 times scale 1→1.16 + halo expanding twice (starting at 18f / 30f, 22f each) | Without eye-catch guidance, the viewer can't find the circle center at the moment the iris opens |
| Circle match | Solid disc → ring: r 36→300, stroke 72→44px / 28f expo-out | If the ring and the iris grow separately, "the avatar turns into a chart" can't be read |
| Iris expansion | Ring outer edge + 0→2400px / 30f bezier(.62,0,.32,1) | Faster than 20f and the circle match can't be read; center offset >10px is obvious at a glance |
| Old page pushed back | scale 1.03→1.22 + brightness 1→0.45 / 34f ease-in | If the old page doesn't move, the new scene looks like a circular sticker pasted on top |
| Sweep | 60–118f to 87%, bezier(.4,0,.12,1), number counts in sync | A number out of sync with the sweep reads as two animations; too fast (<40f) and the number can't be seen climbing |
| Ending | Still for 47f after the sweep completes (only the dial's 0.06°/f slow rotation + arc glow breathing remain) | R1 |

## Known traps
- The demo is a hand-built shorts-kit weekly release leaderboard (dark-field fluorescent green; scene A creator ranking → scene B this week's release goal ring). The parameters are a tuning starting point, not a field-proven final. The first real use must be re-checked with real material.
- On real material, measure the anchor coordinates from the screenshot (devtools / ruler). What you measure is the element box, not the visual circle center. For an avatar with padding, take the center of the content circle. After measuring, render one frame, and if it doesn't line up, adjust the constants. Don't trust the first measured number (same as the cavity-center ruling for the transition-travel A letterform travel).
- The foreground anchor must be a **true circle**: a rounded square (border-radius < 50%) used as the anchor makes the square-to-circle shape mismatch obviously fake at the moment the iris opens. When the anchor in a real screenshot is a rounded square, first cover it with a same-color patch and then lay a true circle on top.
- The semantics must be paired: avatar → personal data, product icon → product metrics. Circle to circle is only the shape. "The content of this circle turns into its expansion" is what makes a match cut hold.
- The one-style-per-seam rule is the same as shot-transitions. This card has its own chart-growth segment, so don't stack entrance effects on the new scene inside the iris.

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`circle-match-iris/CircleMatchIris.tsx`](../../../src/demo/transition/circle-match-iris/CircleMatchIris.tsx)

