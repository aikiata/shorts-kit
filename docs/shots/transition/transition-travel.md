---
name: transition-travel
summary: Travel transition, letterform travel: the glyphs of a giant chapter title act as a window, and the camera dives into the strokes of the letters to change scenes.
use: Seams where the two shots have an "element / container" level spatial relationship (technique card, chosen as a complement to the three shot-transitions styles)
length: n/a (technique card; demo 150f, main push action segment 52f, holds before and after counted separately, frames taken from the adjacent shots' budgets)
energy: n/a (technique card, takes no energy slot)
tags: camera
---

## Intent
The three shot-transitions styles are the "handover" type: the previous shot ends, the next shot enters, and the seam relies on a white flash / blur frames / a window to cover the page-change moment. This card is the "travel" type: the background exists in the foreground picture as a real element (the hole in the letterform), and the camera dives in with one continuous spatial motion. The viewer follows the same object from start to finish, with no handover moment. Selection rule: if the background can be "pre-present" inside the foreground, use travel. If the two scenes are only in sequence with no spatial nesting, use handover. The meaning of the letterform travel is "the title is the door" (chapter title card and transition in one).

## Selection table

| Style | How | Seam it suits |
|----|------|----------|
| A letterform-zoom | The giant title glyphs (SVG mask cut-out) show the new page through the holes. An exponential push goes through the hole, takes over the moment the hole fills the screen, and the remaining strokes are flung out of frame | Chapter title → body; a high-energy replacement for the paper-title-card chapter card |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| A main push through the cavity | A cover plate SVG mask (white base + black text weight 900) cuts out the hole, and the transform-origin is aimed at the center of a glyph stroke (the hole). If anchored inside the letter cavity and pushed to the end, what fills the screen is the cover plate, not the hole (demo: for "EDITS" at 560px, the center of the I's vertical stroke is 973,515, and the vertical stroke 107px×30 is wider than the frame. When choosing the word, put the I's vertical stroke near the center line of the frame so the hole opens up from the middle). scale=30^u, u over 52f bezier(0.6,0,0.85,0.5) slow start and steep finish, and before the push a 2% pull back as anticipation over 26–34f | Set ZOOM_MAX so "the hole fills the frame"; the thinner the stroke, the larger the multiple. Leave the slow start for the viewer to see that "there is something inside the hole" |
| A something inside the hole | The cover plate is dark and the hole is bright: a warm-black cover plate vs a molten-gold gradient shorts-kit release page, and the cards in the hole are also bright-faced (cream frosted). A ring of blurred orange stroke along the letter edge is drawn only over the cover plate area (light leaking out of the hole) + a 1.5px warm-white cut edge | If the hole holds dark blocks, those letters read as "solid letters" and the suspense of going through the hole is gone |
| A only light in the hole, no text | During the title card hold, the page's text / card layers are fully hidden, and the hole shows only a warm gradient + soft light shapes (a blob of cream-white light at the card position, a streak of dark red at the title position). In the middle of the main push, 64–90f, the content layer fades from an 18px defocus into focus (EASE.out), so it is already sharp when it takes over | If the page title can be read in the hole, two layers of readable text fight each other, and the title reads as "clutter" rather than a clean cut-out |
| A exit and trail | At scale∈[14,26] the cover plate opacity goes 1→0. From u>0.35 the expected blur goes 0→20px (divided by scale and written into blur) + four translucent cover plate afterimages from 0.8–3.2 frames earlier stack into a radial zoom trail. At the moment of takeover the page does a +12% brightness flash that falls back | If blur isn't divided by scale it gets enlarged into a wall of mush. With only two afterimage layers it reads as hard-edged translucent color blocks; four layers join into a trail |
| A background parallax | The page pushes only 1→1.08 (0.7·u during the main push, finished with quint-out after takeover, with continuous speed at the handover) + drifts left 28px over 0–100f. After takeover, the shot counter on the render card goes 0→12, duration bars fill in staggered, and a DONE label pops | If the background doesn't move, the hole shows a dead picture. If the background pushes too much it moves at the same speed as the cover plate and the depth disappears |

## Known traps
- The push anchor must be measured on the rendered frame (the vertical stroke coordinates in the demo were measured from a still frame). A different font, different word, or different renderer letter-spacing will make it drift. After rendering, check the push direction, and if the hole isn't centered, fine-tune the origin. Don't trust numbers worked out by hand from the em width of the text. When the anchor stroke is far from the frame's center line (such as the I in "FILM" at x≈726), the hole opens on one side and the cover plate on the other side takes a long time to clear. Change the word so the vertical stroke is centered.
- When the background page is pushed to 1.08, 4% is cropped from each side: leave layout safe margins for "after the push is complete" (demo: left/right 200/230, top 122).
- Letterform travel is not stacked with the three handover styles on the same seam: one style per seam. Travel already carries high energy, and wrapping it in a white flash / screen shake reads as a glitch (same rule as shot-transitions).

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`transition-travel/LetterformZoom.tsx`](../../../src/demo/transition/transition-travel/LetterformZoom.tsx)

