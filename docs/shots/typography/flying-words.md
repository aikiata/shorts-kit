---
name: flying-words
summary: 22 keywords are laid out on a flat elliptical cross-section by the golden angle and fly along the z axis from far away to brush past the camera, with opacity following a [0,1,0.5,0.2,0] life curve, running exactly 2 full cycles so the head and tail join seamlessly
use: Dynamic background for keyword clouds/capability lists; an "information volume" base layer for intros and outros; a transition that needs a sense of depth traversal
length: about 6.0s (180f@30fps, 2 full loops, can be chained seamlessly)
energy: high (continuous full-screen 3D movement, the frame is never still)
---

## Intent
The crudest way to list keywords is to pile up a screen of static word cloud. The word tunnel **spreads the same set of words along the time axis**:
spawned far away, growing from small to large, brushing past the lens and vanishing. The viewer only ever reads three to five words, but the subjective feeling is
"lots of words". It is a background layer, not a lead layer: the camera is still and the elements move, so a title
or UI laid over it in the foreground never conflicts. Replace the whole word list with the project's keywords and no line of motion logic changes.

## Motion core
- Perspective (in 480 design coordinates) `perspective:1100px`; words advance linearly along z from **-1750 → 800px**. A positive value means passing through
  the camera plane, which is what gives the "brush past". The demo is drawn natively at 1920, with the same numbers all ×4: P=4400, z −7000 → +3200,
  and the projection is computed by hand `s = P/(P−z)` (point-by-point equivalent to CSS perspective)
- Placement uses the golden angle: `a = i·2.39996 + rand(i·7+1)·0.8`, radius `r = 82 + rand·165` (native ×4: 330 + rand·660),
  and the y radius ×0.6 more flattens it into an elliptical shape. This avoids dead center and avoids a few near words piling into a clump
- Life curve `OP=[0,1,0.5,0.2,0]` @ `OT=[0,0.25,0.6,0.85,1]`: **in the first 1/4 it brightens hard to full,
  in the middle it drops to half transparent, and at the end it trails off and vanishes**. It is not a plain fade in and out; dimming the middle is what keeps the foreground unobstructed
- Outward spread `drift = 0.5 + u·1.35`: far away it gathers at the center, and the nearer it gets the more it throws out of frame,
  stacking with the z advance into a true perspective feel
- Near-end blurring: when `u > 0.86`, defocus is added linearly by `(u-0.86)`. A word rushing up to the eye grows out of control, and this blur is there to hide that;
  the real sense of speed is left to a directional trail by screen speed (demo: 6 layers of fading text-shadow ghosts along the −v direction, much cheaper than wrapping every word in a
  full-screen SVG filter); the first 22% of travel at the far end gets an extra atmospheric-haze defocus
- The demo adds two more depth references moving with the same tunnel: 10 flat elliptical hairline rings (the tunnel wall, thickening and fading out when near) + 56 dust specks drawn as
  light-speed streaks stretched along the radial direction (streak length = the screen displacement of the nearest 2.6 frames); the whole tunnel rolls very slowly by `±2.5°·sin(2πt)` (a periodic function, same at head and tail)
- Foreground: the demo lays a static wordmark group at dead center (mono eyebrow + 112px title + radial dark veil), and words that fly into the wordmark's elliptical area have their opacity pressed to 20%
  to demonstrate the use of "background layer + foreground title without conflict"; the wordmark is still and the loop is still seamless
- `CYCLES = 2` is a whole number of cycles. The demo takes `t = frame / DURATION` (the frame after the last frame = frame 0) so it loops seamlessly; each word's phase
  `ph = i/N` is evenly split and the spawn is fully deterministic; the center electric-blue halo `opacity = 0.82 + sin(t·4π)·0.14` breathes twice,
  pinning down the visual anchor of "the end of the tunnel"

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Word list | 22 words, font size `20 + rand·16`px (20–36; native 64–120), weight 700 + 6 serif italic words | Word count is tied to the phase `i/N`: <12 words and the frame is sparse, >30 words and the near ones smear into one patch. Random font size is the source of layering; all the same size reads as a decal |
| Depth travel | z −1750 → +800px, perspective 1100 (native ×4) | A farther start (−2500+) makes words too small to recognize; if the end does not pass 0 there is no "passing through", only "flying up to the face and stopping" |
| Spread coefficient | `drift = 0.5 + u·1.35` | A coefficient <1 makes all words spray out of dead center like an explosion; >2 they fly out of frame too early and the tunnel becomes a fountain |
| Life curve | `[0,1,0.5,0.2,0]` @ `[0,0.25,0.6,0.85,1]` | The 0.5 in the middle yields to the foreground. Change it to full brightness all the way and it steals the lead; change it to zero early and the tunnel goes empty |
| Loop cycles | `CYCLES = 2` (must be an integer) | Non-integer → t=1 does not join t=0 and there is a jump at the loop point; more cycles make each word cross the lens faster |
| Near-end blur | linear defocus from `u>0.86` + a speed-direction trail | Raising the threshold to 0.95 makes the hard edges of huge words jarring; a coefficient >40 turns the end into color patches |
| Palette | demo (midnight): three cool-white tones `#f2f5ff/#c3cbe2/#8a95b5` + 4 electric-blue accent words `#86a8ff` (only accent words get glow), center halo electric blue | Light text glowing on a dark base is the identity; put this card on a white base and it simply fails. For a light base the whole thing must be re-done |
| Center halo | ~1040×720 radial gradient, breathes 2 times per piece | Delete it and the end of the tunnel has no focal point and the words look like they fly at random; the breathing frequency must align with CYCLES or it beats against it |

## Known traps
- The demo was tuned on grayscale/placeholder material. The parameters are a tuning starting point, not a field-tested final;
  the first real use must re-check against real material
- When replacing the word list, **keep the word count and word-length magnitude** (demo 22 words, each 4–9 letters): the phase is
  evenly split by `i/N`, so when the word count changes the density scales overall. Chinese words are more than twice as wide as English,
  so when switching to Chinese keywords the font size must be lowered at the same time, or the near ones fill the whole frame
- `CYCLES` must be an integer, or the head and tail do not join. This is the sole precondition of this card's "seamless loop";
  to adjust the crossing speed, add or subtract whole numbers, and do not change it to a fraction
- Background layer only: pressing the middle of the life curve to 0.5 is to yield to the foreground, and treating it as the lead
  (pushing brightness to full) reads as clutter instead
- Dark base only: the `text-shadow` glow + radial vignette are half of the effect; on a light base the words smear into
  dirty dots. All 22 word elements stay in the DOM throughout (never destroyed and rebuilt) and only transform/opacity change;
  when porting to Remotion keep this structure and do not change it to adding and removing nodes per frame

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`flying-words/FlyingWords.tsx`](../../../src/demo/typography/flying-words/FlyingWords.tsx)

