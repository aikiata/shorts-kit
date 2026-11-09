---
name: segmented-thumb-hero
summary: The segmented-control thumb displacement as the lead close-up. An oversized capsule segmented control floats in on a spring, an outlined arrow cursor slides in from off-frame and presses, the white thumb slides to the other segment in 8f ease-out, and at the moment it lands the new icon springs out while the old icon folds away.
use: Announcement shots for "mode switch / pick one of two" features (the demo's shorts-kit Prompt→Film, Chat→Agent style); a close-up approach where one UI micro-interaction carries a whole shot
length: ~3.5s (demo 110f: float-in 18f + cursor 24f + click + slide 8f + icon pop + hold)
energy: medium (micro-interaction close-up; refined, not loud)
---

## Intent
When a product switches to a new mode, the usual way to shoot it is to swap the whole interface. This card does the opposite: it enlarges the segmented
control to 1080px wide for a close-up, and **the thumb's 8-frame displacement is itself the narrative**:
"we went from A to B". There is no page context; the control is the stage. The causal chain is complete: the
cursor slides in (someone arrived) → press + ripple (a decision was made) → thumb slides (the world responds)
→ the new icon pops out (the new identity is established). All four beats are required: without the cursor the UI is moving by itself,
and without the icon pop the switch has no reward.

## Motion core
- Control close-up size 1080×220, floating in from 200px below on a spring
  (spring damping 14 / stiffness 120), the large shadow shrinks as it lands (24→12px)
- The cursor is an oversized outlined arrow (130px, white fill with ink stroke): 24f Easing.out(cubic)
  slides from the lower right off-frame onto the target segment; on press scale 1→0.86→1 (3f down, 4f back)
- **The thumb is strictly 8f** Easing.out(cubic) (demo 52→60f), reproducing the feel of the source;
  these 8f are the heartbeat of the whole shot, and every beat before and after serves it
- At the moment it lands two actions start on the same frame: the new icon pops out with spring(damping 10, stiffness 220)
  overshoot; the old icon collapses with 6f Easing.in and its width goes to zero in sync so the text reflows naturally
- Click ripple: a 3px accent-color thin ring spreads out and fades over 12f from the click point (cursor tip) (Easing.out(quad));
  the ripple confirms that "the press" happened, and a click without a ripple reads as the cursor just passing by

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| control size | 1080×220, thumb inset 16px | Shrunk below 600px wide it is no longer a close-up, and the thumb displacement carries no weight |
| thumb duration | 8f Easing.out(cubic) | >14f reads as a slow-motion demo video; <5f reads as a teleport, and the "slide" is lost |
| cursor slide-in | 24f from off-frame, ease-out | linear or <14f reads as the cursor being thrown in; the start point must be off-frame |
| press | scale 0.86 + ripple 12f | Sliding the thumb with no press breaks the causal chain and reads as autoplay |
| icon pop | spring damping 10 / stiffness 220 | damping <8 bounces three times and steals the thumb's scene; if the old icon doesn't fold away the text is squeezed out of the control |
| closing hold | new state rests ≥30f | Cutting away right after the switch means the "new mode" isn't seen clearly |

## Known traps
- The demo was tuned on grayscale/placeholder material. The parameters are a tuning starting point, not a final production setting.
  The first production use must be re-verified on real material
- Division of labor with cursor-flyover: that card is the cursor clicking and pushing in
  on a full page (with context); this card is the control shot as a background-free close-up detached from the page. They can coexist in one piece,
  but do not shoot the same click both as a page version and as a close-up version
- The icon collapse zeroes the width instead of only scaling: scale alone leaves an empty gap, the text does not reflow,
  and a "ghost seam" appears inside the control (in the demo width and scale are driven in sync)
- Use with care on controls with more than two segments (3+): the thumb crossing several segments in 8f is too fast to read the stop,
  and stretching it breaks the feel. This card works best with "pick one of two"
- The ripple ring needs zIndex above the thumb and its center locked to the click point; if it follows
  the thumb it becomes the thumb's trail and the meaning goes wrong
- Swapping material in production: just replace the segment labels/icons with real feature names, but "the new segment icon has an expression"
  (the demo's smiling clapperboard) is half of the sense of reward; a plain wireframe icon is much paler

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`segmented-thumb-hero/SegmentedThumbHero.tsx`](../../../src/demo/interaction/segmented-thumb-hero/SegmentedThumbHero.tsx)

