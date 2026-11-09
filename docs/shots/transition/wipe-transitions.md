---
name: wipe-transitions
summary: Geometric wipe transition. blinds-slice: 12 3D blades flip in a staggered wave, and after the wave sweeps through, the whole page changes from A to B.
use: A general transition where the old and new pages stay still and one geometric boundary sweeps across to hand over. It does not depend on suitable elements in the composition, so it works anywhere.
length: set-up before ≥20f + wipe ~56f + ending ≥40f, about 4.4s (132f)
energy: medium
---

## Intent
The transition library already has three families: travel (dive in), hidden cut (cover the cut), and volume block (the page is a physical object). This card is the fourth family, **geometric wipe**: old and new pages both stay still, and one geometric boundary sweeps across to hand over. The wipe's shape is its meaning: the strip sweep is "blinds flipping blade by blade to change the page". The difference from shot-transitions style C window punch (an element-mask wipe): C uses a real element in the page as the mask (depends on the composition), while this card is a pure geometric shape, and its generality is its positioning. It suits horizontal progression and page-turn semantics.

## How
| Style | How | Use |
|----|------|------|
| A blinds-slice | 12 true 3D blades of 160px (preserve-3d double-sided panels: the front is A's slice, the back is B's slice pre-rotated 180°, backface hidden), sharing a 1900px perspective and rotating rotateY 0→180° around their own vertical axes, staggered into a wave. When standing sideways, the dark slot behind the blade is exposed | Page-turn / progression semantics; pages with a horizontal reading flow |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Wave | Starts at 24f, blade i starts at = 24 + 28·(i/11)^0.78 (interval 3.4f→2.1f, flipping faster and faster). Each blade uses a physical spring damping 13 / stiffness 75 (~13f to 180°, ≈5° overshoot then settle) | Only with 4–5 blades turning at once does it read as a "wave". With EASE.out staggering, the first interval is 9f, and the wait after the first blade makes the wave drag |
| Blade face lighting | The face turning away from the key light darkens by 0.5·sin θ (gradient along the blade width), the face turning toward the key light catches a screen highlight at ~35°, and the 2px lit thin line on the blade edge ∝ sin θ. The dark slot #1d1712→#120d0a exposed when standing sideways is the boundary line | The true 3D dark slot + lighting is itself the "bright line" of the wipe boundary, so no extra SVG seam line is needed |
| Mask removal | After the last blade's spring converges (|θ−180°|<0.3° for 4 consecutive frames, ≈80f in the demo), unmount all the 3D blades and output page B directly | opacity 0 doesn't count as removal. Leftover clip-path / 3D layers ruin true stillness, and text inside a 3D layer is also less sharp than flat |
| Ending | Settles ≈50f after mask removal (≥40f; the masthead hairline is redrawn once, the camera settles from 1.02 back to 1) | R1 |

## Known traps
- The demo was tuned on grayscale / placeholder material. The parameters are a tuning starting point, not a field-proven final. The first real use must be re-checked with real material.
- The wipe boundary must carry a bright line / highlight. A wipe with no bright line reads as a PPT transition, and this is the key. This style uses the dark slot exposed when the blades stand sideways + the lit thin line on the blade edge as the boundary.
- Geometric wipes at most 2 times per film, and don't use them back to back in one film (two "boundary sweeps" read as a template feel).
- Mask removal must wait for the last blade's spring to converge (≈80f). Unmounting one frame early makes a blade visibly jump.
- The two pages need strong contrast (demo: warm white paper vs a full-page vermilion; the two pages are consecutive pages of a shorts-kit publication, the masthead is the shorts-kit wordmark, and the giant words "Frame." → "Craft."), and the layout grid is best isomorphic to the blade width (12 columns × 160px). Two pages in the same color family show only the dark slot when they flip.
- Draw the vignette / grain only once on the outermost layer, not into each page (each blade slice would carry its own segment of vignette and give itself away at the blade seams).

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`wipe-transitions/BlindsSlice.tsx`](../../../src/demo/transition/wipe-transitions/BlindsSlice.tsx)

