---
name: white-flash-logo-simplify-cut
summary: A liquid-metal colored wordmark rests with flowing light. After a charge-up, a white flash overexposes outward from the center of the letters, and as the exposure falls back, the same position holds the flat version of the wordmark. One flash of white drops the texture down a dimension.
use: Closing a brand section (ornate showpiece → clean final look). A transition beat where the mood switches from showing off to a formal announcement.
length: about 4s (120f@30fps; showpiece 0–34f · charge-up 34–46f · flash 44–54f · exposure falls back 54–76f · lock 72–96f · hold to 120f)
energy: medium-high (one pulse-like accent, still scenes before and after)
---

## Intent
First give plenty of ornament (iridescent liquid metal flowing over the letters, one diagonal highlight sweeping by), then use one white flash to "purify" it into a flat single-color wordmark. The viewer reads "the show is over, this is its official image". The dimension drop is the rhetoric: from sensory texture to rational recognition. The two versions have the same size and position, so it reads as "the same wordmark purified", not a swapped image.

## Motion core
- Liquid layer (the demo wordmark is the shorts-kit wordmark "shorts-kit", wordmark font 190px weight 700, all lowercase, center y=500): one span stacks four background layers, all with `background-clip:text`: (1) iridescent base color `background-size:300%` flowing slowly at 1.1% per frame; (2) vertical volume (bright top, dark bottom); (3) a chrome reflection band at mid-letter; (4) a diagonal highlight sweeping through once over 6–34f (Q4: given to the hero only once, clipped into the letterforms). Below the letters a same-color bloom (blur 38px) + a ground-flipped reflection (0.22, fading mask); the whole frame pushes slowly 1→1.035 over 0–44f.
- Charge-up 34–46f (EASE.exit, faster and faster): wordmark brightness 1→1.7, bloom strengthened. A horizontally stretched flare opens from the center of the letters (wide soft halo + a 4px thin bright core, core ends fading out).
- Flash 44–50f: a radial white blob spreads from the center of the letters to fill the screen (radius 80→1580px, quadratic ease-in, visibly swallowing the wordmark in the last 3 frames). 50–54f pure white hold (a breathing beat), and the scene is swapped at 50f when it is fully white.
- Exposure falls back 54–76f: white layer 1→0 (quint-out, fast first then slow, like eyes adjusting to strong light). The flat wordmark underneath has long been in place and only does a 1.03→1 focus settle.
- Lock: an amber 96px short line draws out from the middle over 72–86f, the camera-engraved logo above the wordmark is drawn on over 74–96f (the viewfinder is revealed first, then the amber slash cuts in), and the brand short phrase "Frame motion. Craft the shot." rises word by word (from 78f). A very slow push-in 1→1.01 over 96–120f.

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Flash window | 44–50f radial fill (t² ease-in) + 50–54f pure white | The flash must be "fast in". A uniform full-screen fade-in reads as an editing soft cut; only a burst from the center of the letters reads as "the letters glowing and overexposing" |
| Charge-up | 34–46f, brightness ×1.7 + horizontal flare | Without the charge-up the white flash has no warning and looks like a dropped frame. Adding a box-shadow to the flare core brings a ring of dark edge (verified) |
| Exposure falls back | 54–76f, white layer receding with quint-out | Using a fade-in of the flat wordmark in place of the fall-back produces a second action of "a word floating up out of white". The fall-back lets the wordmark be "there all along" |
| Flat entrance | 1.03→1 (snappy, 52–78f) | >1.06 reads as the wordmark popping out; fading in at the same time stacks with the fall-back into two reveals |
| Wordmark size | Liquid / flat both 190px, same center (font size for a 15-character wordmark is sized to the frame width; a short 4-letter word can go up to 300px) | If the two versions differ in position or size, it reads as a reskin, not the same identity |
| Brand constants | `PAPER` / `FLAT_INK` / `FLAT_ACCENT` (defined at the top of the block; the demo has folded them into shorts-kit's cut paper / set ink / lens amber) | Swapping in the project's brand colors completes the adoption. The iridescence of the liquid layer is generally kept (it is "the show", not the brand). The logo appears only in the flat segment and is not given the liquid texture (the brand spec forbids gradients / glow) |

## Known traps
- The scene swap happens on the fully white frame at 50f (render either the dark field or the paper surface), and the white layer must not recede before 50f, otherwise both scenes are visible at once.
- `WORD` = `BRAND.name` (15 characters). To change the word, adjust the font size `FS` together. The liquid layer / bloom / reflection / flat layer all share `wordStyle` and `wordText`.
- With +0.03em letter spacing on the wordmark, the two crossbars of "ft" just touch, and at large sizes a bright anti-aliasing line shows at the join. The demo sets the spacing after f to zero so the two strokes overlap.
- Pairing the flash with SFX is mandatory (impact/whoosh-bright types). A silent white flash reads as dropped footage.
- The highlight must be clipped into the letterforms (background-clip:text). If made as a radial light spot laid over the letters, it spills outside the letterforms and smears into white fog on black (Q4 light spill).
- The back half's background is bright paper. If the next shot is a dark field, a separate transition is needed, or reuse this card's ending with a direct cut.

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`white-flash-logo-simplify-cut/WhiteFlashLogoSimplifyCut.tsx`](../../../src/demo/transition/white-flash-logo-simplify-cut/WhiteFlashLogoSimplifyCut.tsx)

