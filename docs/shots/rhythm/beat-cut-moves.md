---
name: beat-cut-moves
summary: Hard cuts as a percussion instrument. Burst-flash freeze: three white flashes each hard-cut to a different crop of the same frame (wide → card → close-up), the shutter afterglow settles, and it ends held on the close-up.
use: Highlight segments where the "cut" itself is played as a drum beat; the ceremony of an awards-style burst shot, the crowning of key information
length: whole piece 140f ≈4.7s (live material 30f + three flashes + hold 70f)
energy: high
tags: transition
---

## Intent
The rhythm vocabulary in the library has only covered the speed within one move (speed-ramp-freeze freezes and unfreezes inside the same take)
and "how long to stay after settling" (the R-series breathing precedents). No card covers **how to lay out the cut points between shots**.
This card fills that gap: the hard cut uses no transition at all, and the intervals between cut points are themselves the score.
Three white flashes with progressively tighter intervals (22f→18f) read as a shutter burst (A). It does not conflict with the R-series: R governs the stay after settling, this card governs cut point layout,
and when a cut string ends it must be followed by a sufficient hold to return the breath. Note this is a deliberate exception: the rhythm preference precedent is one-way "slow down",
and the harder the hard-cut string cuts, the longer the hold after it must be than usual.

## Choosing a form
| Form | How | Use |
|----|------|------|
| A paparazzi-flash (burst-flash freeze) | Three white flashes each hard-cut to a different crop of the same material (wide → card close-up → "Take 1" close-up); before each flash a focus frame locks onto the next crop, the shutter afterglow settles, and the third flash stops on the close-up to end (demo: shorts-kit's "Shot of the Year" award card, the backdrop is the shorts-kit mark / wordmark tiled) | Ceremony for highlight moments: awards bursts, the crowning of key numbers / key sentences |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| three flash cut points | 30/52/70 (intervals 22f→18f, progressively tighter); before the flash 30f of slow push-in on "live material" (small flashes of other people's cameras on the backdrop) to set off the freeze after the flash | It must be alive before the flash; three flashes on all-dead material don't read as a "freeze" |
| white flash layer | Each flash opacity 0.95→0 decaying over 4f ease-out; on the flash frame a ±2px seed-hash full-screen shake | Starting from 0.95 gives the burst of a flash bulb; decay >6f turns into a soft-light transition and loses the shutter feel |
| shutter afterglow | Cut-in view scale 1.03→1 falling back over 6f ease-out + −16px settle to zero | The afterglow is "got shaken when photographed"; remove it and the three flashes read as slideshow page turns |
| three crops | Same frame, change the CSS zoom focus: 1.0 wide / 1.6 card / 2.8 close-up ("Take 1") | Closing in step by step has narrative direction; out of order (close-up → wide → close-up) reads as a wrong edit; crop edges must not slice a half line of text |
| focus preparation | 8f before the next flash the focus frame shrinks from 1.3× to the next crop range (projected in screen coordinates), and 3f before the flash turns champagne to lock | This is the "ready beat": the viewer knows in advance where the next shot will be taken, so the flash feels like a pressed shutter |
| closing hold | After the third flash hold the close-up 70f, with only a very slow 1→1.015 push-in + HUD "SAVED" fading in | The three flashes are a heavy blow, and the hold should be given at least twice the usual; the freeze is a photo, so add no in-frame motion |

## Known traps
- **The demo was tuned on grayscale/placeholder material. The parameters are a tuning starting point, not a final production setting.
  The first production use must be re-verified on real material**
- The technique **strongly depends on sound**: the cut points must be pinned to beats on the audio track, with one shutter click per flash,
  and the silent version is just the picture jumping around; pin frames per sound-design.md §4.5 relative to the shot start, not at absolute frames
- The three crops must be "the same frame closing in layer by layer", not three unrelated frames. The viewer must keep recognizing who this is
  throughout the burst; do not use this form with material across products/scenes
- At most 1 cut string per piece (P4 restraint principle): this is the loudest hit of the whole piece, and if it appears a second time
  the first one was wasted
- The rhythm preference precedent is one-way "slow down", and this card is a deliberate exception: the hold after the cut (70f)
  is a floor, not a suggestion; err on the side of more
- A true hard cut = the frame falls in an interval and renders the corresponding view, with no transition frames at all; accidentally adding a 2f cross-fade
  means it is no longer a hard cut, and the beat feel blurs immediately

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`beat-cut-moves/PaparazziFlash.tsx`](../../../src/demo/rhythm/beat-cut-moves/PaparazziFlash.tsx)

