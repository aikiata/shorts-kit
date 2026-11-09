---
name: bottom-push-stack-wipe
summary: Bottom push chapter change. The new scene, background color and all, pushes up from the bottom edge and physically shoves the old scene off screen. Several chapters are pushed in a row, each with its own saturated background, and the content is pinned to each chapter's own coordinate system so it travels with the color.
use: Chapter-change skeleton for multi-chapter product films (one selling point and one background color per chapter); section changes that need a "page-turn rhythm" across the whole film
length: demo has three pushes in a row, 170f (~5.7s); one push-in is 26f, plus ~1.2s hold inside the chapter
energy: medium
---

## Intent
wipe-transitions is one boundary sweeping across while old and new pages stay still. page-turn is the old page splitting open like double doors and sliding out.
This card is a third physical behavior: **the new chapter pushes the old chapter out**. Two screens make rigid contact and move at the same speed in the same direction, like a vending machine pressing a stack. The key is "the whole screen moves with its background color": the background, the window card and the decorative bars are welded into one block that pushes in from the bottom edge, so the viewer reads "a different world" instead of "a different card".
A heavy ease-out (fast in, slow stop) gives the push a "thunk" as it lands. The 40px seam shadow on the top edge is the proof of physical contact between the two screens. Three pushes in a row with fully saturated backgrounds turn the chapter change itself into the film's metronome. The original slack film uses this one move as its whole skeleton.

## Motion core
- Each chapter is one full-screen layer: `translateY` pushes from +1080 to 0, and the old chapter is pushed to −1080 in sync. The two layers' displacement must be strictly synchronized with the same easing. Any speed difference reads as "sliding through each other".
- Push-in easing = heavy ease-out `cubic-bezier(0.12, 0.9, 0.2, 1)` (fast in, slow stop), done in 26f (~12f to reach 95%). The y of chapter i = (1 − its own push progress) × H − next chapter's push progress × H. One expression handles both entering and leaving. The whole stack gets a directional vertical blur based on speed.
- The top edge of the new chapter carries a 56px gradient seam shadow (the new chapter's hue-tinted dark color, 0.42 to transparent, pressed onto the old chapter) plus a 2px lit edge on the new chapter's top. Both go to zero once it settles. The feeling of physical "pushing out" depends entirely on this.
- The demo is in a "Swiss poster" style (product shorts-kit, one selling point per chapter): chapter 0 is a near-black opener, then three chapters in cobalt blue #2d4cff / vermilion orange #ff4d1f / acid lime #cdf23a (dark text), hues spread about 120° apart. Each chapter has an eyebrow in the left column + a 116px extra-bold two-line title + a 40px description, and on the right a large-type UI card designed for the shot (chat with an agent / beat-marking timeline / delivery pipeline). The palette is lit from the top left and darkened toward the bottom right, the same light direction as the card shadow.
- All in-chapter animation is staggered after the push: the title rises from below the line only 12f after the push starts (already at 95%), and small UI actions (typing, then message pops in / waveform hands over to the current shot / delivery steps tick off one by one) are placed in the hold.
- Push spacing ~44f (the demo starts pushes at 22/66/110f). Layers that have left the screen are unmounted promptly. The tail has a very slow 1.5% push-in over 28f.

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Push-in duration | 26f, heavy ease-out | <20f reads as a flash cut; linear constant speed reads as a roller shutter and the "thunk" is gone |
| Hold between chapters | ~18f still + the tail of the push; total time in a chapter ~44f | The chapter is the content performance zone. <25f and the viewer is pushed away before seeing anything |
| Seam shadow | Top edge 56px, chapter's dark tone at 0.42 gradient + 2px lit edge | Without it the two screens look like ghosted overlays sliding; >80px reads as the new chapter having its own black border |
| Background color | One saturated color per chapter, adjacent hues spread apart | Adjacent chapters in the same color family make a "chapter change" read as a "small tweak"; a grayscale chapter can only be chapter 0 |
| Content pinned | Window card / decorative bars use in-chapter absolute coordinates | Content positioned relative to the viewport will "drift" against the push animation and break the illusion |
| Number of pushes | 2–4 chapters | 1 push makes no rhythm; >4 and the viewer starts counting background colors, which is tiring |

## Known traps
- The demo was tuned on grayscale / placeholder material. The parameters are a tuning starting point, not a field-proven final. The first real use must be re-checked with real material.
- Division of labor with wipe-transitions: that card keeps old and new pages still and hands over with one geometric boundary sweeping (neutral, usable anywhere). This card moves both pages and pushes out rigidly (physical, brings its own chapter rhythm). For a single seam use that card; for the skeleton of the whole film use this one.
- Same-layer choice with the three shot-transitions styles: this card has medium energy and a fixed upward direction. For a seam that needs a big energy drop (such as going into the outro), give way to the flowing white flash.
- Consistent direction is where the sense of skeleton comes from: every chapter in the film pushes from the bottom edge. If you switch to a left push or top push midway, the metronome falls apart. If you want to change direction, don't use it as the skeleton.
- While a push is in progress, two chapters are on screen at once, both full-screen layers. Keep in-chapter animation (card entrances and so on) out of the 26f push window (wait until at least 95% settled). Otherwise both chapters are moving and the eye has no anchor.
- In real use, take the background colors from the saturated tier of the brand palette. If the saturation is too low, the subordination of "window card pinned on the colored background" can't be read, and it degrades into "each card just changes its background".

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`bottom-push-stack-wipe/BottomPushStackWipe.tsx`](../../../src/demo/transition/bottom-push-stack-wipe/BottomPushStackWipe.tsx)

