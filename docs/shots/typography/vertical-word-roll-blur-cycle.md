---
name: vertical-word-roll-blur-cycle
summary: The word at the end of the sentence becomes a vertical roller. Three word changes take 0.55s each (70% outQuint + 30% outBack: fast first, extremely slow after, with a slight overshoot). Adjacent rows get vertical blur and grayscale by distance, and the center word turns from gray to the accent color the moment it settles
use: One-sentence selling points of the form stem + a list of audiences/objects, such as "Crafted for ___" / "Built for ___"; a clean beat for a light-base brand piece
length: about 5.0s (150f@30fps: rest → 3 word changes → whole group fades out at the end)
energy: medium (a steady three beats, no peak)
---

## Intent
The best way to change the word at the end of a sentence is a roller, not a cross-fade: a roller carries a **direction** (flipping a page upward),
and the viewer knows "there is a next one". The two identity markers of this card are the **vertical blur** of adjacent rows
(roller depth of field, simulating the defocus of a mechanical drum) and the **tinting** when it settles (gray → accent color,
"this is the answer"). The stem (demo `Crafted for`) stays absolutely still throughout: the eye is pinned on the roller,
and if the stem wobbles the sense of a list falls apart.

## Motion core
- The position value `p` is accumulated from 3 window segments: `STEPS = [0.16, 0.36, 0.56]`, each window 0.11
  (≈16f, about 0.55s), with 0.09 of rest between segments for the viewer to read the word
- Each segment's easing is a **blended curve**: `0.7·E.outQuint(u) + 0.3·E.outBack(u)`.
  outQuint gives the mechanical deceleration of "fast first, extremely slow after", and the 30% of outBack gives the slight overshoot and fall-back on settling
- The reel is positioned with `translateY(ROW - p·ROW)`, ROW=44px, and the mask height `ROW·3`=132px
  (three rows showing); the center row is always the second row of the mask
- Three distance-driven channels, `d = |i - p|`:
  - blur: `3d` when `d<1`, `3 + 2·min(d-1,1)` when `d≥1` (5px at the farthest); the demo uses SVG
    `feGaussianBlur stdDeviation="0 b"` to blur only vertically, and while turning adds ≤4px of vertical motion blur by roller speed (zero when still)
  - opacity: `1 - 0.65d` when `d<1`, otherwise `max(0.1, 0.35 - 0.23(d-1))`
  - color: `mixHex(ACCENT_DIM, ACCENT, clamp01(1 - 2.4d))`. **At d>0.42 it is already fully
    the dark color**, so only the moment of true settling is the accent color, and mid-scroll it is gray throughout
- Ending: `seg(t, 0.9, 0.985)` fades out the whole group (stem + roller), leaving no ghost for the next shot

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Word list | 4 words (Launches→Demos→Promos→Every Shot), 3 word changes | The last word is the conclusion (the widest word) and the first three are examples; >5 words and the viewer starts counting, <3 words do not read as a "list" |
| Beat points | `[0.16, 0.36, 0.56]`, window 0.11 (≈16f) | The 0.09 (≈13f) rest between segments is for reading the word; a beat that cannot be read in full is the same as no change; a window >0.18 keeps old and new on screen together too long |
| Easing recipe | `0.7·outQuint + 0.3·outBack` | outQuint is the source of the mechanical deceleration; the 30% outBack gives the "click" on settling, and pure outQuint reads as an electronic screen sliding |
| Row height / window | ROW 44px, mask `44×3`px, word width 190px | Showing three rows is what gives the drum feel (one row reads as a cross-fade); the hard-coded width 190 is so it does not crowd the stem, and for longer words it must grow in sync |
| Adjacent-row blur | adjacent rows 3px, farthest 5px, **perceived vertically only** | The blur is the identity of "roller depth of field"; delete it and it degrades into word-strip translation; >8px and adjacent rows smear into gray bars that cannot be recognized as text |
| Settle tint | `1 - 2.4d` mapping ACCENT_DIM→ACCENT | A coefficient of 2.4 makes the tint happen only at the moment of settling; <1.5 colors it mid-scroll and the sense of the answer falls apart |
| Size and weight | stem and roller both 30px/800, `letter-spacing:-.5px` | They must be exactly the same: a roller word larger than the stem reads as two elements, not one sentence |
| Closing fade-out | `seg(t, 0.9, 0.985)` whole group | After the last word settles, about 40f of rest and then the fade-out; without a hold, the listing was for nothing |

## Known traps
- The demo was tuned on grayscale/placeholder material. The parameters are a tuning starting point, not a field-tested final;
  the first real use must re-check against real material
- **The mask width is hard-coded to 190px**: when changing the word list, the longest word (demo `Every Shot`; a phrase with a space needs `white-space: nowrap`) must fit in,
  or the letters get cropped; conversely if all the words are short, a large blank is left on the right and the sentence's center of gravity leans left. When changing the word list the
  width must be measured again
- The word length difference should not be too large: the mask width is fixed (this card does no adaptive width, that is the job of
  pill-chip-slot-cycle-handled), and with a length difference >2x the short word looks isolated in the frame
- The stem must be pinned: the demo uses `flex + gap:14px` because the constant mask width never pushes the stem;
  once it is changed to an adaptive-width roller, it must be switched to absolute positioning anchored at the left end,
  or the stem swings left and right with the word width
- `p` is **accumulated** from the three windows, so the three windows must not overlap: an overlap lets p
  cross a whole row within one frame, and the roller "skips a notch"
- Division of labor with pill-chip-slot-cycle-handled: that card is a dark capsule + adaptive width pushing apart
  (the word is a badge), and this card is a bare-word roller (the word is a sentence component). Keep only one in a video
- Sound: each settling is a beat point, paired with a light mechanical/switch sound; rapid triple fire should alternate two samples
  to avoid a machine-gun feel; for the mixing discipline see sound-design.md

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`vertical-word-roll-blur-cycle/VerticalWordRollBlurCycle.tsx`](../../../src/demo/typography/vertical-word-roll-blur-cycle/VerticalWordRollBlurCycle.tsx)

