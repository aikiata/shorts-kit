---
name: impact-feedback
summary: Two hit-feedback variants: hit-counter (combo count with hit-stop, damage numbers and combo pop-ups) and anime-impact (anime impact frame with negative, speed lines and chromatic aberration).
use: The "instant of the hit" when an element lands or collides. Give slams and abrupt stops a game-level feel. Pick the variant by intensity step.
length: n/a (element-level technique, attached to a landing move; frames used by each variant are in the parameter table)
energy: high (instant impact)
---

## Intent
An element slams into place but there is no "it hit" moment, so the landing reads as a PPT fly-in. Game juice
(Vlambeer screenshake theory) and anime impact frames give the same answer:
for the few frames of the hit, time is clamped, so the impulse reaches the viewer's hands. The two variants form an intensity ladder:
B stacks damage numbers and combo pop-ups on a local hit-stop, cutting a feature list into a set of combos,
with the strongest narrative feel. C is the heaviest punch: on the abrupt stop, 3 frames flip to negative and burst with speed lines. Highest emphasis level,
most stylized.

## Choosing between the two
| Variant | How | Use |
|----|------|------|
| B hit-counter combo count | Three cards slam in one after another. Each hit = 2f hit-stop + damage number floating up + ×N counter pop-up that escalates each time. The demo writes the "damage" as the production time each shorts-kit feature saves, which floats away and lands in the card footer. | Feature point chains: tell "many features" as a combo; heavy game language |
| C anime-impact impact frame | For the 3f of the crash-zoom abrupt stop, the whole frame inverts to negative + radial speed lines + red-cyan chromatic aberration, all removed on the 4th frame | The one punch that is the single climax of the film; the cap of the emphasis level |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| B rhythm | Three cards 28f apart (animation time 30/58/86), ease-in(quad) slam in the 10f before the hit; global freeze of 2f on each hit (the background diagonal-stripe scroll freezes too) | Even spacing gives the "combo" beat feel |
| B damage numbers | Hit on the lower-middle of the card face, scale 1.45→1 + float up 150px past the card edge, fade out over 12f after 4f; font size 88/104/124px per hit, yellow italic + hard drop shadow | A fade over >16f is sluggish and hides the next hit; starting the jump above the card top collides with the corner counter |
| B counter | Pulse peaks 1.3/1.45/1.6, rotate −2/−4/−6°, font size 140/166/196px, falls back with `exp(−t/2.4)`; three heat-bar cells light up one by one | Escalating each time is the key: three equal sizes do not read as "hitting harder" |
| C crash-zoom abrupt stop | First a 6f wind-up pull-back to 0.985, then crash-zoom 6f ease-in(cubic) push to 2.25x (card height 454×2.25≈95% of frame height, so the outline is not cut in half by the frame), card center converges to the exact middle of the frame; flight frames get time-sampled motion blur + a sharp center copy | The crash-zoom parameters are in the crash-zoom-punch card |
| C impact frames | 3f from the abrupt stop: `invert(1) grayscale(1) contrast(1.45)` + 34 thick wedge and 22 thin needle speed lines (the shape changes every frame, inner ends eaten by a radial fade to leave a focal point) + red/cyan negative copies screen-blended with ±8px offset; all removed on the 4th frame, and the page outside the card darkens for a beat | 3f is the sweet spot: from the 4th frame viewers start to "see clearly" the negative and the trick is exposed |
| C recovery shake | From the 4th frame a 6px exponential decay (τ≈2.2f), settled in ~12f | The amplitude must pass the visible threshold (precedent on perceptibility) |

## Known traps
- The demo was tuned on grayscale/placeholder footage. The parameters are a tuning starting point, not a final production setting.
  On first real use, re-verify against real footage.
- The B hit-stop **must be global**: the background scroll has to freeze too, otherwise it does not read as "time clamped",
  it only looks like that one card dropping frames. The key is that the demo drives all layers with one shared remapped frame df;
  only effects that must still happen during the freeze, such as the white flash, are driven by the real frame f.
- Frame remapping shares the technical root with speed-ramp-freeze. Do not stack the two cards in the same shot:
  two remaps fight each other and the rhythm reads as a glitch.
- The C negative frames are very loud in a film with a paper-and-ink look. Limit to one climax, and it must land on the same frame as the
  impact sound (foley goes through sound-design). A silent negative frame reads as a broken flash.
- The B variant has heavy game language (damage numbers/combo are an open game reference). Use with care when the product tone
  is serious.
- After several hit-stops in B, the real frame count exceeds the animation time by the accumulated frozen frames. When budgeting shots,
  convert with `real hit frame = animation hit frame + frozen frames so far` (demo HITS_REAL).

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`impact-feedback/AnimeImpact.tsx`](../../../src/demo/effects/impact-feedback/AnimeImpact.tsx)
- [`impact-feedback/HitCounter.tsx`](../../../src/demo/effects/impact-feedback/HitCounter.tsx)

