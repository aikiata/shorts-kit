---
name: icon-field-colorize
summary: A dot grid of small gray icons floats in staggered and fills the screen, holds one beat, then several brand-color horizontal bands sweep down the whole field in a very fast ripple. An opening/closing card for "lay out the whole feature landscape first, then light up the brand in an instant"
use: An opening that lays out the product's capability surface (icons = feature universe) and then hits it with the brand color in one stroke; feature-set pages, ecosystem/integration scale displays, a setup shot before the title logo
length: ~45f staggered float-in + ~10f rest + 12–45f color flip + final rest; whole section 3–6s (demo 170f: color flip on the 30f setting + title landing + 1s final hold)
energy: medium (the float-in is setup, the color flip moment is the only burst)
tags: ui-entrance, outro
---

## Intent
First use grayscale to show "many" in full: a hundred-plus small icons float in staggered and fill the frame, and the grayscale makes them read as background texture that doesn't steal the scene. Hold one beat so the viewer realizes "it's full", then the brand color sweeps the whole field very fast in horizontal-band ripples, and the gray world lights up in an instant. The crux is that **the color flip is not a hard same-frame flip**: measured on the source video, several color waves sweep downward in sequence within ~0.5s (blue covers the whole field first, then orange/green/red cover successively lower row bands), and the final state is four layered color bands. The ripple gives the "light up" a direction and a speed, and a hard flip just reads as swapping to another picture.

## Motion core
- Icon field: 150–200 small icons laid out on a grid (rows offset by half a cell), 3–4 random grayscale levels; mulberry32 sets grouping/gray level/shape. The demo puts each icon in a keycap-style rounded square: on a dark field, grayscale = a dark keycap that is "not yet powered" (warm black base, hairline edge, top edge lit, dark gray glyph), and the color flip = powering on: the whole tile becomes a glowing color block + dark glyph + same-color bloom
- Float-in batches are grouped by distance from the frame center (75%) + noise, so it reads as spreading outward from the center
- Float-in: fades in over 10 staggered batches (4.4f between batches + ≤3f jitter within a batch), each with a 0.6→1.06→1 micro-bounce (overshoot once, then settle) + 10px float up
- One beat of rest (~18f): lets the "filled" state be read; in the last 10f the whole field dims 12% as a wind-up (a breath in), and returns to full when the first wave arrives
- Color flip: several color waves advance by row, row difference ~1.4f + column slant 0.25f + ≤1.5f jitter per icon (a slanted wavefront, not a whole row on the same frame); each wave covers downward from its own start row, and later waves cover lower row bands → the final state is multi-color horizontal bands
- Per-icon color flip, 4f: the new color **fills the keycap top-down with a clip** (same direction as the wave, no opacity blending) + a 1.22x sine pop; after filling, a 5f screen white flash + bloom overshoot gives the wavefront a "powered on" feel
- Light spill: after each row lights up, the stage behind it takes on a same-color horizontal band of light (strength = the fraction of that row already lit), so the whole field really lights up
- Landing: once the light is stable, a radial dim veil rises in the center (pressing only the center, the surrounding light stays), the shorts-kit wordmark (in the eyebrow slot) + the two-line 132px title "Every shot, / one place." rise word by word; the second line must not exceed the width of the veil, or the text edge lands on lit keycaps

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Icon count | 170 (17×10 @1080p, grid pitch 108×106, keycap 66px) | <100 doesn't read as a "field"; >250 and each one is too small for the color-flip pop to be seen |
| Total float-in length | ~48f (10 batches × 4.4f + 7f fade-in for the last batch) | Too fast reads as a flash-in; >60f and the viewer can't wait for the burst |
| Total color-flip length | source ~12f for the whole field; demo ~30f | Faster is more explosive; stretch it only for teaching/slow-paced uses |
| Wave count and colors | 4 waves, a same-hue sunrise gradient (gold → amber → orange → coral red) | 1 wave = a single-color light-up also works; four hues across the wheel (blue/orange/green/red) read as a rainbow, and same-hue steps feel more like a brand |
| Row difference | 1.4f/row + 0.25f column slant | A row difference >3f makes the wave read as a row-by-row scanner; 0 = hard flip |
| Color-flip pop | 1.22x sine 4f + clip fill | Without the pop the wavefront can't be read; >1.4x and the icons fight each other |

## Known traps
- The demo was tuned on hand-drawn simple line icons. The parameters are a starting point for tuning, not final production values; the first real use must be re-verified with real footage
- Don't use an opacity cross-fade for the color flip: a warm semi-transparent color over a dark base passes through an olive/gray-plaster color (precedent), so wipe it in with a clip; the white flash also has to start only after the new color has fully covered, or a white flash on a semi-transparent layer looks gray
- **The color flip must not be a same-frame hard flip.** Dense-frame checks of the source video confirmed several ripples sweeping fast (bear-app 25fps dense frames: blue→orange/green/red done within about 0.5s), and a hard flip reads as a picture swap with no "light up" feel
- Icons need recognizable solid simple shapes (heart/star/lightning/check…); abstract color blocks don't carry the "feature universe" meaning
- How it differs from theme-switch-moves: that card is a light/dark theme switch of a UI screen; this card is a brand-color light-up of a decorative icon field and carries no UI meaning

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`icon-field-colorize/IconFieldColorize.tsx`](../../../src/demo/opening/icon-field-colorize/IconFieldColorize.tsx)

