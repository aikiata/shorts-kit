---
name: aurora-bloom-bg-flip
summary: On a light gray base, soft-focus purple and orange blobs rise from the bottom. Then the whole base color darkens to near black within about 0.36s and the blobs shrink to an afterglow. The copy blurs out and the next line blurs in at the same time, with a gap between lines and no cross-fade.
use: Narrative turning points ("for many years... → everything changed"); the beat where a brand film moves from setup to accent; section switches between light and dark palettes
length: about 5.2s (156f@30fps)
energy: low to high (the first 2/3 is build-up, the darkening instant is the accent of the whole film)
---

## Intent
Use the "base color reversal" as an accent mark. For the first 56% the aurora rises slowly and the viewer settles into the light base.
Then the whole frame is pushed to near black in under 0.4s. This reads more like
a "page turn" than any zoom or white flash. The copy change must land after the reversal, with a gap in between, so the viewer first absorbs the visual
change and then reads the new line.

## Motion core
- Three `blur(60px)` blob layers rise from the bottom of the frame: main purple `rgba(107,79,224,.85)`
  at 90%×85%, orange core `rgba(217,122,74,.9)`, white blending edge `rgba(255,255,255,.8)`
- Rise `seg(0.04→0.56, outCubic)`: `translateY 32%→−6%` + `scale 1→1.25`
- Reversal `flip = seg(0.57→0.64, inOutQuad)` (normalized 0.07 ≈ 0.36s):
  base color `mix([236,236,236] → [10,10,18])`, blob opacity 1→0.4 to shrink it to an afterglow,
  and the white blending edge layer is removed directly with `1−flip`
- The orange core drifts on its own with `translateX ±8%` (2.2 cycles over the whole film), a slow sideways move, so the inside of the blob
  has relative motion instead of the whole mass just rising and falling
- Line A goes word by word `blur 0→8px` + fade out (from t 0.40, stagger 0.04, 0.10 each, inQuad);
  line B goes word by word with `outQuint` blur-in (from t 0.70, stagger 0.05, 0.11 each), and within 0.09 after landing
  the color settles from DEEPP purple to white. At t≈0.90 it is final and holds still for ≈0.5s.

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Blob blur / size | blur(60px), main layer 90%×85%, container inset −10% | Blur under 40px shows the circle, so it becomes a "color ball" instead of "light" |
| Rise | translateY 32%→−6% + scale 1→1.25, t 0.04→0.56 outCubic | Taking over half the length is deliberate: the longer the build-up, the heavier the reversal |
| Reversal length | t 0.57→0.64 inOutQuad ≈ 0.36s | **The key**: stretched to 1s it is no longer an accent but a gradient transition |
| Base color | #ececec → #0a0a12 (not pure black) | Pure black makes banding appear at the edges of the afterglow blobs |
| Blob darkening | opacity 1→0.4, white blending edge layer goes to zero in sync | If the blobs are not darkened, purple and orange overexpose and smear into one mass on the dark base |
| Orange core drift | translateX ±8%, 2.2 cycles over the whole film | At 15% amplitude it reads as "a ball moving" |
| Line A blur-out | per-word stagger 0.04, 0.10 each, inQuad, blur→8px | inQuad makes the disappearance accelerate, which reads as "swallowed by the light" |
| Line B blur-in | per-word stagger 0.05, 0.11 each outQuint + purple→white within 0.09 | The color change comes slightly after the entrance, turning white only at the moment of landing, as the "final" signal |
| Gap between lines | A ends at t≈0.58 → B starts at 0.70 (≈0.6s with no text) | A cross-fade smears the two lines together, the gap is what reads as "turning the page" |

## Known traps
- The white blending edge layer (blobC) only works on a light base. At the reversal it must be removed with `1−flip`,
  otherwise a patch of gray haze stays on the dark base.
- DEEPP/PURPLE are the **native light colors** of this effect, not a brand color slot. To switch to project colors,
  change the three blob layers and the line B text color as one group. Changing only the text color separates it from the background.
- The demo copy is a narrative turn for shorts-kit ("Promos took weeks" / "Meet shorts-kit",
  with word counts and lengths close to the original's "For many years" / "everything changed"). The per-word
  stagger rhythm depends on word count and length, so when you change the lines, retune the two intervals 0.04/0.06.
- Write the base color with JS into `background` on every frame (a solid color from `mix()`). Do not use a CSS transition,
  otherwise the color is undefined when you seek to an arbitrary frame.

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`aurora-bloom-bg-flip/AuroraBloomBgFlip.tsx`](../../../src/demo/effects/aurora-bloom-bg-flip/AuroraBloomBgFlip.tsx)

