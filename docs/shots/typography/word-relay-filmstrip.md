---
name: word-relay-filmstrip
summary: The left column is a stepwise-scrolling strip of equal-height page cards alternating black and white (the focus card fully bright, neighbor cards defocused and dimmed), and on the right a big serif word is relayed in place (the noun stays constant + the verb cycles). It scrolls one notch only at the instant of a word change, and the vertical center of the word block aligns precisely with the midpoint of the current page card
use: Enumeration sections of "one subject × many capabilities" (shorts-kit frames/builds/ships…); portfolio / case-stream displays; a multi-scene tour of a product
length: each word period ~1.5–2s × 3–4 words; demo 180f (6s)
energy: medium-low (editorial temperament, the rhythm rests on the "click" of the word change)
tags: ui-entrance
---

## Intent
The left side is evidence (a filmstrip of page screenshots) and the right side is the argument (the big word): each time the verb changes,
the strip steps one notch to give new evidence, so text and picture footnote each other. The crux is **stepping**:
the left column is completely still most of the time and scrolls one notch only at the instant of a word change (scrolling = the mechanical action of changing evidence);
continuous scrolling reduces the left column to background decoration and the word change loses its "click". The second crux is
**alignment**: the vertical center of the big word block must align precisely with the midpoint of the current page card (pixel-level),
and if it is off, the "editorial rigor" of the whole layout collapses.

## Motion core
- Stage: graphite near-monochrome dark scene + gold accents; left column: equal-height page cards (940×530, spacing 105) stacked vertically,
  forced to alternate black and white (dark and light) so the scroll steps show; within the word-change window an 18f asymmetric in-out (EASE.swift) scrolls exactly one card height,
  with zero offset the rest of the time, plus vertical motion blur in the fast section
- Depth of field: by distance from the focus point `dist = |card top - 275| / 635`, neighbor cards are dimmed by `0.68·dist`, scaled to 0.94, and blurred ≤3px.
  When stepping, the new evidence "comes into focus"
- Right side: serif type (Didot class, 140px) in two lines. The subject noun "shorts-kit" stays constant in upright secondary ink, and the verb is relayed in place in italic white:
  the old word grays out for 10f → from the switch point it rises out of the top edge of the mask with an 8f ease-in (leaves first), and the new word rises letter by letter from the mask's bottom edge from switch point +7f
  (1.2f stagger, the gold period arrives last, enters after). Leave first, then enter, with no ghosting allowed (precedent: v2 had a ghost "resebuilds" and was caught)
- Gold leader line: from the right edge of the focus card to the word block midline y=540, retracting for 6f from the word change and redrawn over 16f after switch point +10f;
  the mono index 01/03 above the word block and the 32px evidence footnote below are relayed in sync with the verb
- Alignment: each of the two lines of the word block is one 154px line box, `top = 540 - 154`, and the center of the total height = current card top + card height/2 = y540@1080p
  (accurate to the single pixel)
- Scrolling is synced with the word change: scroll start = the old word begins to gray out, scroll end = the new word has settled

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Page cards | equal height (530px@1080p), alternating black and white, about half the screen wide | Unequal heights / the same color family do not read as stepping; cards that are too narrow lose the weight of "evidence" |
| Word period | ~45–60f/word | <40f and the word cannot be read in full + the strip cannot be seen clearly; word periods need not be even |
| Scroll window | ~16–18f asymmetric in-out, exactly one card height | Continuous scrolling = a violation of the crux; scrolling too far / too little reads as a mechanical fault |
| Word relay | old word grays out then rises out 8f → new word rises letter by letter from switch point +7f (16f per letter, 1.2f stagger) | Crossing in the same frame always ghosts; a gap >10f reads as a dropped thread |
| Vertical alignment | word block center = current card midpoint (pixel-level) | A single-point user note: "the text height should align with the midpoint of the page in the middle"; a difference >8px is noticeable |
| Font | serif Didot class, verb in italic white / noun in upright secondary ink | Sans-serif loses the "editorial" temperament; the verb must be brighter than the noun, since it is the one that changes |
| Neighbor-card defocus | dim 0.68·dist, scale 6%, blur ≤3px | Without dimming, neighbor cards fight the focus card; a blur >5px and it cannot be recognized as a page |

## Known traps
- The demo was tuned on grayscale/placeholder material. The parameters are a tuning starting point, not a field-tested final;
  the first real use must re-check against real material
- Division of labor with text-column-converge: that card is a reveal play of left and right facing off and closing in;
  this card is a vertical evidence stream + in-place relay, with no closing and no reveal
- Division of labor with pill-slot-cycle: that card is a capsule slot-cycling UI element;
  this card is a layout-level system of matching text and image
- Real material: page cards should use real screenshots (the demo uses hand-made fake pages: storyboard script / render pipeline / finished-video PR review, with each verb resting on
  its corresponding evidence card, and the remaining gap is known); screenshot brightness must be graded by hand to keep the alternation readable

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`word-relay-filmstrip/WordRelayFilmstrip.tsx`](../../../src/demo/typography/word-relay-filmstrip/WordRelayFilmstrip.tsx)

