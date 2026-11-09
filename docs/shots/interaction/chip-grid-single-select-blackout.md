---
name: chip-grid-single-select-blackout
summary: Five option chips fade in one by one, centered in a 3+2 layout. On the select frame, one frame of gray press block is inserted first, then within a few frames the fill turns ink-black and the text turns white with a very light 1→1.04→1 rebound. The other chips fade to 18% but their positions are locked. Then the rest go to zero, the black chip moves up and narrows, and a settlement price rises below.
use: Interaction demos of single-select / plan / tier selection; "what happens after you pick it" causal shots; price/parameter settlement flows
length: about 5.5s (165f@30fps)
energy: medium-low (the only burst is that one gray flash frame; everything else is settling)
---

## Intent
One gray flash frame plus three frames of blackout acts out the two real UI states `:active → :selected` separately. The viewer sees "a finger presses down" and then "the system confirms", not one gradient. The other chips drop to 18% while their **position never moves**: once they reflow, the viewer thinks the page refreshed, and the semantics of "single select" are lost.

## Motion core
- 5 chips in two rows (3+2), centered (1080p native: height 96, radius 48, gap 22, 36px text, fixed widths 346/364/476/236/330),
  rising snappy from 8f at 3f intervals; the eyebrow above + the 84px question arrive first
- The cursor moves from the lower right along a swift arc to the target chip over 26–54f (causal foreshadowing), and presses at 56f
- **1 frame of press gray flash**: only the single frame FS=56, an `rgba(120,128,146,.5)` overlay
- **Blackout**: 57→62f linear (5 frames) drives the background white → ink-black `#0b1020`, the stroke, and the text ink → white; at the same time the ✓ grows from 0 width
- **Press rebound**: `sc = 1 + sin(pr·π)*0.04`, pr runs over 57→66f. The sine guarantees both ends return exactly to 1
- **Rest downgrade**: 57→66f outQuad pushes opacity down to 18%, `transform` stays `none`
- Hero light: after the blackout, a very faint cobalt landing glow lights under the chip (given to the hero once only), and the shadow deepens and grows with the lift
- **Wrap-up**: from 101f (≈1.5s after selection) the rest go to zero over 9f; the black chip moves up to y=330 over 18f smooth, scale→0.88, and recenters horizontally (geometry computed from fixed widths, not measured at runtime);
  the question moves up and fades out at the same time to make room
- Settlement: 108f the original price $42.00 rises → 118f a strikethrough line crosses it out and it fades to gray → from 116f the current price $34.44 rises letter by letter (180px)
  → 128f the cobalt "Save 18% · billed $413.28 yearly" pops out with overshoot; 134–165f hold

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| entrance | from 8f, 3f interval, 16f snappy each | All 5 chips are laid out within 1s, saving time for the select segment |
| select moment | FS = 56f (about 1/3 of the whole piece) | Front part reads the question, back part watches the result; earlier than 40f the viewer hasn't finished reading the options |
| gray flash | 1 frame, rgba(120,128,146,.5) | **Just one frame**: give it 2 or more and it reads as a hover highlight, not a press |
| blackout | 57→62f linear (5f) | Linear is deliberate: adding an ease gives "turning black" a sense of process, too soft |
| press rebound | 1 + sin(pr·π)·0.04, over 9f | 0.04 is very light; at 0.1 it becomes a bouncy button and steals the scene |
| rest downgrade | down to 18%, position transform:none | **Locked position is the crux**: still at the original spot at 18% reads as "not selected", not "gone" |
| wrap-up moment | from 101f (≈1.5s after selection), 18f smooth in-out | 1.5s is the shortest dwell for the viewer to see the selected state clearly; cut to 0.5s and it feels rushed |
| move up and narrow | to y=330, scale→0.88, horizontal correction back to the center line | Without the center correction it drifts left after moving up and reads as "dragged away"; scaling below 0.85 puts text under 32px |
| settlement order | original price → strikethrough → current price → savings pill, 8–10f apart | Show the old price and then cross it out, so the viewer reads the cause of "it got cheaper" |

## Known traps
- The selected chip's recentering shift is computed from fixed chip widths (offsetWidth is not measured at runtime). When you change the copy, update the width table too,
  otherwise the text overflows or drifts off the center line after moving up
- The `transform` of the other chips must be written explicitly as `'none'`; do not rely on flex auto-reflow, or the rest will slide sideways when they go to zero
- Placeholder content: 5 billing-period option names (Annual billing … Nonprofit rate) + settlement "$42.00 → $34.44/mo, Save 18%",
  all to be replaced in production; an option name that is too long will burst the fixed width (the third, "Two-year commitment", is a long-name stress test)

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`chip-grid-single-select-blackout/ChipGridSingleSelectBlackout.tsx`](../../../src/demo/interaction/chip-grid-single-select-blackout/ChipGridSingleSelectBlackout.tsx)

