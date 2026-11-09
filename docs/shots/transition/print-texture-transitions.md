---
name: print-texture-transitions
summary: Print-texture transition. ink-bleed-reveal: a whisker-edged bleed spreads out and eats the old scene.
use: Paper-and-ink style scene-change seam. The third family alongside the three handover styles and the travel style: the "medium development" type of transition.
length: 4–4.5s (bleed segment 55–80f + still ending ≥30f)
energy: medium (a gradual reveal, no impact beat)
---

## Intent
The transition language already has handover (the three shot-transitions styles) and travel (transition-travel), both spatial / optical metaphors. This style opens a third family: **a medium metaphor**. The new picture doesn't "arrive", it is "printed and stained" in, directly calling on the physical imagination of the library's paper-and-ink aesthetic: like a drop of ink landing on rice paper, spreading and eating the old scene, organic and handwritten in feel. It naturally suits films with a paper/ink tone, and is another "medium family" seam option besides light-leak-burn (accent-color light leak).

## Style choice
| Style | How | Use |
|----|------|------|
| A ink-bleed-reveal | The new page spreads out from the ink drop point through an organic circular mask with a whiskery bleed edge, eating the old scene at an uneven pace | Old scene → new scene replacement; handwriting feel, narrative tone |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Bleed edge | An SVG mask white circle carrying `feTurbulence(fractalNoise, baseFrequency 0.02, octaves 3, fixed seed)` + `feDisplacementMap scale 60→160 growing with the frame` | The filter only kneads the mask shape, and the content stays sharp throughout. The seed must be hard-coded (determinism) |
| Spread | Radius [20,98f]→[0,1450px] Easing.out(quad), multiplied by an uneven-pace disturbance `1+0.08·sin(0.32f)·env` (env decays to zero over the last 20f) | A constant-speed circular expansion reads as an ordinary iris. The disturbance is "the temper of the ink" |
| Ink edge | Two mask circles lead the new scene by 20–42px: outer edge 0.42 opacity + 3.2px feather, inner core 0.86 + 1px feather, and one more ring at +110px with heavy feathering as a wet halo (0.12). A small ink dot lands first at 14–22f | Without an ink edge it reads as an ordinary iris wipe; an ink edge too wide or too solid reads as a burned-paper hole |
| Development | The new scene scales 1.035→1 inside the mask (20–100f ease-out), returning to exactly 1 before the mask is removed | If it isn't settled, it jumps on the mask-removal frame |
| Mask removal at the end | After the bleed fills (about frame 100), remove the SVG mask and lay the new scene down directly | feTurbulence has sub-pixel jitter. If not removed, the ending is never truly still (verified in the real renders of this batch) |
| Ending | Truly still ≥30f after the new scene is in place | R1 |

## Known traps
- The demo was tuned on grayscale / placeholder material. The parameters are a tuning starting point, not a field-proven final. The first real use must be re-checked with real material.
- The one-style-per-seam rule is the same as shot-transitions: a medium transition is not stacked with a white flash / screen shake. This style plus light-leak-burn (the medium family) total ≤2 in one film. More than that and the film reads as a print shop's promo.
- In the middle of the bleed, the old scene's content briefly shows through the noise holes in fragments. Read as an ink-stain texture, this is an acceptable organic effect. But if the old scene holds highly recognizable elements like a face or a logo, it reads as a glitch, so avoid that.
- This is a slow transition (55–80f action segment). Don't use it in sections with a rapid-fire pace. There, use shot-transitions style B whip-pan.

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`print-texture-transitions/InkBleedReveal.tsx`](../../../src/demo/transition/print-texture-transitions/InkBleedReveal.tsx)

