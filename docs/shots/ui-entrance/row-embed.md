---
name: row-embed
summary: Content rows drop from the air like cards, flatten out of a rotateX tilt, and at the instant of embedding a seam of accent color flashes along the bottom edge
use: Detail-page / list shots of "structured data growing into the page"; batch entrance of row-level content
length: about 2s (12–68f)
energy: medium
---

## Intent
The rows of a detail page are not "shown", they "grow in": each row drops from the air and fits tightly into the page layout, and the accent-color seam at the instant of embedding is the visual foley of a "click" snapping shut.

## Motion core
- Rows fly in from above one by one at an ever-faster beat (the last ones slam into the slot with speed + vertical motion blur), flattening from a rotateX tilt, with scale overshooting slightly and then a press rebound
- The row position is first covered by a patch of the page's real background color + a very faint dashed slot frame as a placeholder; after landing the patch disappears to let the texture show through. The slot contact shadow tightens and turns solid as the row approaches
- At the instant of embedding, a 2px accent-color seam along the row's bottom edge unfolds from the center to both sides and then fades out
- The camera slowly pans down and pushes in slightly at the same time, so the row rain and the camera move run in parallel; the framing is filled by the page throughout

## Parameters
| Parameter | Typical value | Feel when tuning |
|------|--------|----------|
| Beat | cue = 12/22/31/39/46 (interval shrinking 10→7), flight 12f, the last row lands at 58f and the accent seam finishes at 66f ≤ the shot's 68f budget | Compute "when the last row lands" first, then set the cue intervals: beat × row count must fit the budget (the same core arithmetic as the document-typewriter-reveal card) |
| Flight pose | `perspective(900px) translateY(−120·air) rotateX(16°·air)`, progress easing bezier(.5,0,.8,.75) (still has speed at the end), scale 1.06→0.995 then a 4f press-bounce back to 1 | The rotateX flattening is the key reading of "embedding"; a pure vertical drop reads as a sticker |
| Flying body | backgroundImage takes the whole-page screenshot, and a negative backgroundPosition offset crops out that row | Texture crops do not redraw the content (Q1): redrawn rows differ visibly from the page in font rendering |
| Empty-slot patch | the row position is first covered by a patch of the page's real background color #f9f6f1 (sampled pixel by pixel; leaning white reads as one white board) + a 20% dashed slot frame, disappearing 2f after landing | Without the patch, the row baked into the texture shows through first, and the fly-in becomes a "double image" |
| Embed flash | a 2px accent-color seam on the bottom edge (feathered at both ends) unfolds from the center to both sides in 5f (Easing.out cubic), fades out in 8f, with a 7px glow | The seam is only on the bottom edge and flashes only once; flashing on all four edges reads as a selection box |
| Camera | cy 500→740, zoom 1.12→1.25, 68f eased pan down + slight push | The camera move runs in parallel with the row rain to create "it grows as you watch". If the camera waits for the rows to finish before moving, the shot drags. At both the start and the end the page must fill the frame; showing beyond the page top/bottom is a blank dead zone |

## Sound
Pin transition-soft at the section cut-in (the template film pins it at f475). Do not score each row landing: with many rows at an even spacing, a pop per row turns into machine-gun fire, so let the accent seam in the picture act as "visual foley" (S2 negative self-check).

## Known traps
- The fly-in end point must be a real slot in the page layout, embedding the moment it lands (Q9): the requirement is "fly in from the air, embed into the dashboard"; hovering above without landing looks fake
- Light effects such as the accent seam must be clipped inside the corner boundary of the carrying element (Q4 precedent); light spilling past the corners is a typical source of a cheap feel

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`row-embed/RowEmbed.tsx`](../../../src/demo/ui-entrance/row-embed/RowEmbed.tsx)

