---
name: type-and-filter
summary: Type a search on a real UI, the grid converges by itself into one card, and a click drills through into the detail page
use: The "operation narrative" segment of a feature demo; any interaction chain of search / filter / entering a detail page
length: about 2.5s (118–190f)
energy: medium (an unhurried beat after the high-energy deal segment)
---

## Intent
Let the viewer "do it along": see what was typed, how the page responds, and where the click lands. This is the only shot in the whole piece that simulates a real person operating, and the rhythm must feel like a human hand, not a script.

## Motion core
- The camera sits close to the search box (zoom 2.0, effective glyph height of the typed text ≈30px) and types character by character, with the cursor always lit → then blinking; the breathing beat after typing pulls out to a full-frame view (zoom 1.0) to watch the grid converge
- After typing, leave a breath, then the non-target cards fade out and sink staggered in reading order, and the grid converges
- The target card slides to the first-row slot, lifting with a wider shadow on the way
- The pointer slides to the target card in the full view (constant on-screen size), a double-ring accent-color (amber for the template piece) ripple confirms the click, and the camera pushes in through to the detail page and hands off to the transition

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| typing speed | 3f/char (TYPE_START=128, "nano-lab" 8 chars ≈149 to finish) | The final value after the first version was reworked for being too fast ("unhurried"); interaction demos run at real human operating speed (R3) |
| breathing beat | From end of typing to filter FILTER_START=160, leave ~11f (0.37s) | Filtering right after typing reads as machine-automatic, and the viewer can't follow the causality |
| cursor | Always lit while typing, then blinking on an 8f cycle; click at 176f, cursor disappears at 185f | Blinking during typing reads as stutter; the switch from always-lit to blinking is itself the signal that "typing is done" |
| filter exit | 25 non-target cards staggered 0.4f apart in reading order, each fading out + sinking 8px over 5f | All disappearing at once reads as the page crashing; even a 0.4f stagger is enough |
| target card slide | 10f slide to the first-row slot, bezier(0.35,0,0.2,1), with a sin lift z 18px, scale +0.02 on the way, shadow widening with the lift | The end point must be the real layout slot (Q9); sliding to the middle of the frame and hovering there looks fake |
| click confirm | Two concentric accent-color ripples (start 3f apart, 10f each, radius 14→54/78) + 3px stroke + 40px glow, then the camera pushes in 16f to zoom 2.2 | A single-ring ripple is too light to see; the push-in hands off to a flash-cut that covers the page-change hard cut (component in assets/lib/FlashCut.tsx, usage: from = cut point − 5, straddling the hard cut with 5f on each side) |
| search box | A page-colored patch covers the placeholder in the texture (the magnifier icon is kept), and the text layer is stacked on top for typing | Stacking text directly on the screenshot texture ghosts with the baked-in placeholder |

## Sound
In the typing segment pin keyboard.mp3 and cut it with a Sequence to exactly 24f, the same length as the action (S4); pin click-camera on the click (the loudest in the piece, vol 0.6, S2 loudness layering); pin whoosh-fast on the grid flying away.

## Known traps
- The first version of typing + filtering was reworked for being "too fast" (R3). The first draft of an interaction shot is almost always too fast, so start at 3f/char
- If after filtering the target card does not return to the real slot and hovers above the grid, it reads as fake (Q9; this once led to almost rewriting the whole file)

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`type-and-filter/TypeAndFilter.tsx`](../../../src/demo/interaction/type-and-filter/TypeAndFilter.tsx)

