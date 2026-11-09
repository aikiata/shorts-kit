---
name: pill-chip-slot-cycle-handled
summary: In the white-base sentence "Your `chip` Handled", the word inside a dark capsule rotates like a vertical roller. The capsule width stretches and shrinks smoothly by interpolating pre-measured text widths, the text on both sides is naturally pushed apart and closes in, and above and below the capsule gray ghost items show at 13% opacity
use: "We handle ___ for you" style selling-point sentences; a one-sentence wrap-up of a SaaS feature list; the main visual beat of a light-base brand piece
length: about 5.0s (150f@30fps: rest → 3 switches (0.25/0.47/0.69) → tail rest)
energy: medium (a steady three-beat rhythm, with the width stretching as the only continuous motion)
---

## Intent
There are two schools of word-slot cycling: make the sentence avoid the change (a fixed-width roller), or make the sentence **accept**
the change (the capsule stretches and the text on both sides is pushed apart). This card is the latter. The cost is that the width must be computed accurately;
the reward is a sentence that reads as alive: "Your" and "Handled" are pushed along, and the viewer feels the weight of the word
in the capsule. The gray ghost items above and below are the second marker: they say outright that "this is a rollable
list" and make the viewer expect another word to come.

## Motion core
- Pre-measured width: in setup, a hidden `<span>` measures each word's `offsetWidth`, each plus 74px of padding,
  stored as `widths[]` (with an `o.w.length·13` fallback in case it is unmounted at setup and cannot be measured)
- The position value `pos` is accumulated from 3 window segments: switch points `[0.25, 0.47, 0.69]`, each window 0.12
  (≈18f), easing `E.inOutCubic`: **slow at both ends**, matching "the roller starting and settling"
- The inner column `colIn` moves vertically by `-pos·48`px (row height 48 = capsule height); the capsule width is
  `lerp(frac, widths[ci], widths[ci+1])`, **interpolated within the frame** so the stretching is continuous,
  and the text on both sides, `flex:none`, is naturally pushed apart by the flex layout
- Ghost items sit outside the capsule (inside chipWrap) at -38px above / 58px below, taking the previous and next neighbor texts of `near = round(pos)`,
  and shift slightly with scrolling by `(pos-near)·48·0.5` (**half-speed parallax**, half as fast as the word inside the capsule,
  which is what makes them feel like an "outer ring")
- Ghost item opacity `0.13 · (0.4 + settle·0.6)`, `settle = 1 - min(1, |pos-near|·3)`:
  fainter mid-scroll, clearest when settled
- Each row has a two-part structure of emoji + word (emoji 18px, word weight 700 22px white text),
  the capsule has a `#1a1c24` base + `0 8px 24px rgba(20,22,40,.22)` shadow + `overflow:hidden`

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Word list | 4 words + emoji (Shots/Camera/Sound/Renders: the shots/camera moves/sound effects/renders that shorts-kit takes care of), 3 switches | The word length difference sets how the push-apart feels: in the demo the shortest is 5 letters and the longest 7; a difference >2x makes the capsule jump too hard and the sentence's center of gravity swings left and right |
| Switch points | `[0.25, 0.47, 0.69]`, window 0.12 (≈18f) | About 0.10 (≈15f) of rest between segments to read the word; the rest before the first switch at 0.25 lets the viewer recognize the sentence pattern first |
| Easing | `E.inOutCubic` | Slow at both ends is what feels like a roller starting and stopping; outCubic (slow only at the end) reads as being flung up, and the capsule width also changes abruptly with it |
| Capsule | height 48px, corner radius 99, `#1a1c24`, width = text width + 74 | +74 is left and right padding + the emoji slot; <50 and the word touches the edge, >100 and the capsule fattens into a button |
| Ghost items | -38 above / 58px below, base opacity 0.13 | 0.13 is the sweet spot of "visible but not stealing"; >0.25 reads as three rows of parallel text, not ghosts; delete them and the list hint is gone |
| Ghost parallax | `(pos-near)·48·0.5` (half speed) | Half speed is the source of the "outer ring is farther" depth; at the same speed the three rows slide like one block and the ghosts lose their meaning |
| Sentence font size | sides 30px/800, inside the capsule 22px/700 | Smaller inside the capsule than the sentence is the right hierarchy (the badge depends on the sentence); equal or larger reads as two titles fighting |
| Palette | base `#fbfbfd`, sentence `#15171d`, capsule white text | Light base + a single dark block is the identity of this card; a dark-base version makes the capsule disappear and needs a full re-do |

## Known traps
- The demo was tuned on grayscale/placeholder material. The parameters are a tuning starting point, not a field-tested final;
  the first real use must re-check against real material
- **Width relies on `offsetWidth` measured in setup**: if the font has not finished loading, what is measured is the fallback font's
  width, and the capsule will be too narrow or too wide. When porting, make sure the webfont is ready before measuring, or switch to
  an offscreen canvas `measureText`; the `length·13` fallback only guarantees no crash, not accuracy
- Keep the word length difference within 2x: the adaptive width is both the selling point of this card and its risk.
  A jump of 5→8 letters (such as `Sales`→`Workflow`) is already the acceptable upper limit; larger and the sides of the sentence swing dazzlingly
- The text on both sides must be `flex:none`: otherwise flex compresses them instead of moving them, and
  "pushed apart" becomes "text squashed flat"
- Ghost item text takes the neighbors of `round(pos)`, so at the exact middle of a switch (pos=x.5) the text
  **jumps once**. This happens when `settle` has pressed it to the faintest and is basically imperceptible; but if
  the opacity is raised to 0.25+, this jump shows
- Emoji glyph widths differ across platforms (especially `⚙️` with a variation selector), which makes the measured width
  drift by a few pixels. In practice, swap them for the project's own monochrome icons and do not rely on system emoji
- Division of labor with vertical-word-roll-blur-cycle: that card has fixed width, bare words, and roller blur
  (the word is a sentence component); this card has adaptive width, a dark capsule, and ghost items (the word is a badge).
  Keep only one in a video. Sound-wise, the three settlings are three beats: pair them with light switch/capsule-snap sounds,
  alternating two samples on rapid fire; for the mixing discipline see sound-design.md

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`pill-chip-slot-cycle-handled/PillChipSlotCycleHandled.tsx`](../../../src/demo/typography/pill-chip-slot-cycle-handled/PillChipSlotCycleHandled.tsx)

