---
name: text-column-converge
summary: A two-word standoff that closes in. The left "NEW" and the right feature word are pinned at equal screen margins on both sides and hard-cut cycle with zero shrinking throughout. Only when the last word arrives does one single ease-in-out slide bring them to the center to snap together into a phrase, and small text below surfaces with a near-hard cut. A text card of the closing-reveal type
use: A paragraph where a feature list resolves to a product name/slogan ("NEW × a string of features → NEW <product name>" style); launch-event style recaps, version number reveals
length: cycle 7–16f/word × 8–9 words + ~36f close + rest after the small text; whole section about 5–6s
energy: medium-low (machine rhythm, the temperament of a small-text spec list, not a slammed word)
tags: outro
---

## Intent
Two words sit apart on the left and right like a table-of-contents page facing off, and the viewer thinks it is just cycling captions, until the last word
settles and they find the left and right are two halves of the same sentence. The one continuous closing retroactively makes the whole stretch of
cycling a "suspense build-up". The crux is **pinning**: during the cycle the two words do not move by a single pixel, and
the left and right screen margins are exactly equal (measured in the original 412 vs 413@1280). Any gradual shrinking
spoils the closing early and dilutes the reveal into a progress bar. The closing may happen only once, and must come after
the last word: this is a closing reveal, not a sustained motion.

## Motion core
- The left edge of the left word and the right edge of the right word are each pinned at the equal screen margin (measured in the original 412/413px
  @1280, ×1.5 → 618/1302@1920); the right word is always positioned by its right edge, whether the word is long or short
- Word cycling is a pure hard cut with uneven dwell frames (16/12/9/8/7/8/10/12f, a machine rhythm
  with a human touch); the spacing has zero shrinking throughout the cycle (precedent: the gradual-shrink version was rejected by the user and redone)
- **The one and only closing**: ~10f after the last word settles, a ~1.2s (36f) ease-in-out
  (cubic) continuous slide moves the two words until they freeze centered on the screen midline
- The closing end point is computed from the monospace font's actual advance (0.6em+letterSpacing × character count),
  with the two words snapping together at exactly one space, no overlap and no gap; no stamp scale, no second compensating move
  (demo: eight feature words of shorts-kit cycle, the last word is the all-lowercase wordmark shorts-kit, and the end point is computed from the character count of `NEW ` + the wordmark;
  the small text is the second half of the brand line, "CRAFT THE SHOT.")
- ~18f after freezing, italic small text surfaces with a near-hard cut (4f quick fade, zero offset), sharing
  the same left edge as the whole line, with a font size equal to the body
- Texture: cool dark base + a very faint top light + vignette/grain; a 1-frame brightening at each word swap; NEW is secondary gray during the cycle
  and brightens to the primary color with progress during the closing; the closing slide gets horizontal motion blur by speed (≤4px, zero when still);
  the demo is 180f in total (exported as `TEXT_COLUMN_CONVERGE_DURATION`)

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Screen margin | 618px@1920 (**measured in the original** 412/413@1280 ×1.5) | A left/right difference >2px reads as misaligned; the margin is the identity of this card, do not change it to a golden ratio |
| Word dwell | 7–16f uneven | Even dwell reads as a metronome; <7f and the word cannot be read in full |
| Closing trigger | last word settles +10f (original measured 32.4→32.7s) | If the settle period is too short, the viewer starts sliding before realizing "this word is not changing" |
| Closing duration | 36f ease-in-out cubic (**measured in the original** ~1.2s continuous slide) | <24f reads as bouncing back into place; >50f reads as dragging |
| Snap advance | 0.6em+letterSpacing per character, monospace font | With a non-monospace font the advance is unpredictable and will overlap or leave a gap |
| Font size | 42@1080p (**measured in the original** glyph height ~20/720) | This section has the temperament of a small-text spec list; enlarged to 60+ it becomes a slammed word (for a single-word hammer blow use outline-word-fill) |
| Small text surfacing | freeze +18f, 4f quick fade with zero offset (in the original it appears directly between 34.4→34.6s) | Adding a slide-in/long fade-in steals the closing's scene |

## Known traps
- The demo was tuned on grayscale/placeholder material. The parameters are a tuning starting point, not a field-tested final;
  the first real use must re-check against real material
- It overlaps in territory with type-rhythm-sync (font attribute beat) / beat-cut-moves (hard-cut beat):
  in those two cards "the cycling itself is the content"; the crux of this card is a closing reveal with **pinned positions + a final closing**,
  and the cycling is only the build-up. If the section has no "closing reveal", do not use this card
- The closing is allowed only once. The gradual-shrink version that closes one notch with every word change was disproved against the original and
  deleted; do not revive it
- A monospace font is required (the demo uses SF Mono); with a proportional font the snap end point cannot be computed accurately
- The original has a 1-frame brightness flicker at each word swap (a typewriter line-change feel), and the demo has added back a 1f brightening;
  a flicker >1f reads as a glitch

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`text-column-converge/TextColumnConverge.tsx`](../../../src/demo/typography/text-column-converge/TextColumnConverge.tsx)

