---
name: text-as-mask
summary: Text video mask: an extra-heavy large title is cut out of a porcelain-white stage, and a dark live product panel drifting slowly shows through inside the letters. At the end, after a breath in, the letterform rushes in exponentially and magnifies 46 times until it overflows, and the picture inside takes over the full screen
use: An opening or chapter card that merges a brand word/slogan with product footage; the letters are the door and the product is behind the door
length: 165f (entrance 18f + drift inside the letters 78f + breath-in 8f + rush-in takeover 24f + settle/hold 37f)
energy: medium-high (the drift section is steady, the takeover section is one burst)
tags: typography
---

## Intent
A title and the product footage fighting for the screen is an old problem: text first and picture later is slow, and the picture laid on the text is crowded. This move makes the two one body: the letterform is the mask, and the product shows only through the strokes, so the viewer reads the word and feels the picture's texture at the same time. At the end the letterform swells and overflows the frame, and the product naturally takes over the full screen: "from the brand word into the product" told in one shot, doubling as a chapter transition (the same family as transition-travel A, the word-cavity pass-through: there the camera drills into the word's counter, here the letterform swells open by itself; the former is a camera move, the latter is a door move).

## Motion core
- A light stage (porcelain cool white + key light + vignette) + an SVG white-text-on-black data-URI handed to CSS `mask-image`, with the mask layer wrapped around the product footage; under the letterform sits a blurred, tinted drop shadow of the same shape (also via a data-URI image), so the text looks like a window "carved" into the stage
- The content in the window needs large saturated color areas and bright lines: the demo is a dark rendering dashboard of shorts-kit (a cobalt-blue→cyan streaming area chart flowing continuously to the left, a rendered-frames counter, a render-queue bar chart breathing; the eyebrow is the shorts-kit wordmark, the subtitle From one prompt to a finished launch film.). During the drift the panel moves up 110px so the bright lines pass exactly through the waist line of the letters and the area gradient fills the lower half of the letters; a white card / light UI showing through white-on-white letters reads as ordinary text
- Entrance: the mask wipes up from the baseline (clip-path bottom edge pulls up, 16f) + 1.04→1 settle; the eyebrow tracking tightens and the subtitle rises
- Drift inside the letters: the product layer is scale 1.32 + translateX +150→-150 (f18–96, bezier(0.3,0,0.7,1), gentle at both ends). The letterform is still while the content flows, and the illusion of "a world outside the window" is the technique itself
- Breath-in: f96–104 the text goes 1→0.965 (swift), while the eyebrow/subtitle exit on ease-in, a preparation before the big move
- Rush-in 24f (f104–128): the mask wrapper `scale(0.965→46)`, interpolated in log space by t^1.8 (`S = s0·(46/s0)^(t^1.8)`; the magnification ratio per frame keeps growing = it gets faster the further it goes); **transform-origin must be pinned inside a solid stroke** (the demo takes the center line of the L's vertical stem, 1236,546): pinned in the hollow of a counter, the magnified result shows only the base color; during the rush-in the wrapper also translates by `(960−Ox, 540−Oy)·t`, pulling the vertical stem back to the frame's center line (otherwise the right-leaning stem doesn't cover the left edge until 30×)
- Counter-compensation on the content layer: a layer of `scale(1/S) translate(−d)` (same origin) cancels the wrapper's magnification and translation, so the product footage isn't distorted by the mask geometry; the panel at the same time goes 1.32→1 with the drift returning to zero (expo-out, f104–132, converging 4f later than the rush-in = following it)
- Takeover insurance: another unmasked full-screen layer sharing the same translate/scale transform is stacked on top, fading in only after the vertical stem already fills the whole screen (t^1.8 ∈ [0.86, 0.95], S≈24×); fading in earlier lays a translucent gray veil over the bright base
- Ending: f132–165 the full-screen panel holds, with the streaming chart still flowing slowly (the product is alive, not a dead frame)

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Font size/weight | 470px / 900 (system-ui Black, tracking −22) | The strokes are the viewport: a thin weight is like squeezing the product through a door crack; the text width takes ~72% of the frame width |
| Drift speed | ~3.8px/f (300px/78f) | Too fast and the picture inside the letters can't be read; choose the drift direction along the axis where the picture is information-dense |
| Breath-in | 8f, 1→0.965 | A rush-in with no breath-in reads as "suddenly swells"; >0.94 reads as the text shrinking away |
| Magnification | 46× (matched to stem width / frame ratio: an 88px stem needs ≥24× to fill the frame) | If too low, the takeover frame still shows a ghost of the letter edge |
| Rush-in curve | log space t^1.8, 24f | Linear log = constant-speed rush; an exponent >2.5 barely moves in the first half and swells hard in the last 3f |
| Ending | hold ≥30f after the takeover | R1; at the frame where the takeover completes, the product should sit in the standard composition |

## Known traps
- The demo uses the shorts-kit rendering dashboard designed for the shot (Render throughput, with the brand logo in the sidebar). When swapping in a real screenshot, first check that what shows through the strokes is large color areas and bright lines; a light page must first be darkened or switched to a dark theme, or the letters don't read as a "window"
- Don't add a stroke highlight to the letterform: glyphs of variable fonts like system-ui are assembled from overlapping outlines, and a stroke draws the internal contour lines such as the crossbar and the apex of the A
- The product footage showing through the letters is stared at in close-up the whole time, so real footage must first go through the high-resolution rasterization technique of aesthetic rule Q2; a low-magnification screenshot blurs into a smear inside the strokes
- After changing the word or font, the hand-derived origin value is sure to fail: after rendering, look at the direction of the magnification, and if the hole is off-center, fine-tune the origin (same as the counter-center drift trap of transition-travel A)
- Don't use it together with transition-travel A in the same video: both are "a world growing out of the letters", and the viewer reads the same trick used twice (P4)
- The mask layer and the content layer must be driven by separate transforms (wrapper magnification / content counter-compensation); merged into one layer, the product swells 26× along with the letterform and the footage is ruined

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`text-as-mask/TextAsMask.tsx`](../../../src/demo/opening/text-as-mask/TextAsMask.tsx)

