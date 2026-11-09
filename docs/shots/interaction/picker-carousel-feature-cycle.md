---
name: picker-carousel-feature-cycle
summary: A mobile-style vertical picker. The focus pill stays still and the content passes through it. Each item snaps in with a clear outQuint deceleration and then comes to a complete stop. Opacity, font size and grayscale are layered by distance from the center, and the pill does a very light scaleY breath on settling.
use: List shots that read out feature names / scene names one by one; interaction demos of "pick one"; showcases of picker-type controls in mobile products
length: about 3.6s (108f@30fps)
energy: medium (each snap is a beat point; 5 beats advance at a steady pace)
---

## Intent
Build the physical feel of "selecting": the focus frame is fixed, and it is the content that scrolls and gets caught.
After each item stops, it must **really be still for a few frames**. Continuous scrolling reads as a loading animation; the pause is what reads as
"this one was selected". Distance decay (opacity + font size + grayscale decaying on all three channels at once) is the only means of keeping the
viewer's eye locked on the middle row.

## Motion core
- Viewport 300×170px (5 rows × rowH 34), the focus pill fixed at the 3rd row position
  (`top: rowH*2`), white fill + 1px `#E3E3E6` stroke + `0 2px 8px rgba(0,0,0,.06)`
- Over the whole piece `t 0.05→0.95` is cut evenly into STEPS=5 steps; displacement within a step is
  `outQuint(min(1, local/(1−HOLD)))`, and the tail segment of HOLD=5/14 does not move at all
  (each step ≈0.65s = travel ≈0.42s + stillness ≈0.23s)
- The list as a whole uses `translateY(rowH*2 − pos*rowH)`: the content moves, the pill has zero displacement
- Distance decay (`d = |i − pos|`) in three segments: opacity 1→0.55 for `d≤1`,
  0.55→0.18 for `1<d≤2`; fontSize 17→14px (by `d/2`);
  color uses INK for `d<0.5`, MID for `d<1.5`, and `#B9B9BE` farther out
- In-row icon opacity `max(0, 1 − d*1.6)`: only the focus row shows its icon
- After settling, the pill breathes once with `scaleY 1 + sin(min(1, land/0.6)·π)*0.06`
  (`land` is >0 only within the HOLD segment, i.e. it breathes only once the snap is complete)
- The top and bottom 26% of the viewport get an alpha fade mask (`mask-image` transparent→opaque), so entering and leaving items vanish naturally

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| row height / visible rows | rowH 34px × 5 rows, focus on the 3rd row | The number of visible rows must be odd, otherwise the focus row is not at the visual center |
| steps | STEPS=5, window t 0.05→0.95 at a steady pace | 5 beats is the comfortable upper limit for 3.6s; with 7 beats each beat is squeezed to 0.46s and can't be read |
| HOLD | 5/14 ≈ 0.357 (stillness at the tail of each step ≈0.23s) | **The crux**: HOLD at zero turns it into steady scrolling and loses the "snap" semantics entirely |
| snap easing | outQuint (applied to local/(1−HOLD)) | The sharp deceleration of outQuint is the "caught by a magnet" feel; outCubic is too soft |
| opacity decay | 1 → 0.55 (d≤1) → 0.18 (d≤2) | Leaving the adjacent rows at 0.55 lets the viewer sense "there is more above and below"; dropping to 0.3 isolates it |
| fontSize decay | 17→14px, by min(1, d/2) | The font size difference is a second layer of depth; opacity alone looks flat |
| icon visibility | max(0, 1 − d·1.6) | Only the focus row carries an icon, an extra marker of the "current item" |
| pill breath | scaleY 1→1.06→1, completed within 0.6·HOLD after settling | 0.06 is already the upper limit; larger reads as the pill itself moving and steals the content's scene |

## Known traps
- The pill must be a **fixed layer with zero `translateY` displacement**, and the `scaleY` breath must not carry
  displacement either, otherwise the focus frame drifts and the semantics of "content passes through the focus" fail immediately
- Writing the distance decay on `fontSize` triggers per-frame reflow (the layout doesn't jump because the row height is fixed),
  but if the row height is changed to auto it will jitter; rowH must be hard-coded
- Use `mask-image` for the alpha mask on the fade; do not overlay paper-colored blocks: once the background is a gradient or has light spots, a color-block mask exposes a rectangular boundary band
- The 24×24 square app icon on the outer left (dark fill + inverted white version of the shorts-kit mark) is positioned relative to the frame center with
  `margin:-12px 0 0 -186px`; if you change the viewport width you must change the 186px too
- ITEMS are 7 shorts-kit feature names ("Shot recipe cards", etc.); when swapping in other feature names,
  the change in text length affects the centered look: if a single line exceeds 300px, shrink the font size rather than wrapping

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`picker-carousel-feature-cycle/PickerCarouselFeatureCycle.tsx`](../../../src/demo/interaction/picker-carousel-feature-cycle/PickerCarouselFeatureCycle.tsx)

