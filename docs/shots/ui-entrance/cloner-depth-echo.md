---
name: cloner-depth-echo
summary: A column of clones. The main card instantly "photocopies" 7 translucent copies that line up in a queue along a diagonal depth, hold for a beat, then all accelerate back into the original, merge and bounce
use: Selling points of "many copies / multi-tenant / scale / batch processing"; says "one = many" in one shot
length: 138f (about 4.6s)
energy: medium (display-then-collapse type)
---

## Intent
A UI translation of the Spline/C4D Cloner vocabulary: one main card "snaps" out 7 clones
spaced evenly back along the Z axis (spacing 250px, opacity falling from 100% to 28%, the farther the more only an outline remains),
popping out with a stagger into a column. It holds about 32f so the viewer can count "there are many"; then all of them ease-in, accelerate back into the
original and merge, and at the moment of merging the original bounces 1.06x to close. The demo lands "one = many" on a concrete selling point:
one shorts-kit render card (launch-film) × 8 shots; on merge the 8 shot slots at the bottom of the card light up together, and the title lands "One prompt. / Eight shots." It divides labor with the depth-layer-moves parallax
(different content in layers): this is an evenly spaced echo array of the **same content**, and its meaning is scale,
not space.

## Parameters
| Parameter | Typical value | Feel when tuning |
|------|--------|----------|
| Depth layout | real 3D perspective 1500, vanishing point at top left (360,120); clone translateZ = −250·idx, plus dx=−58·idx / dy=−6·idx | **The crux**: with pure translateZ and the vanishing point in the center, the clones are all hidden behind the original (not perceivable). Move the vanishing point to a corner of the frame and receding itself lines the column up toward that corner |
| Clone count / spacing | 7 clones / 250px | Fewer than 5 does not read as a "queue"; more than 9 and the tail smears into a clump |
| Falloff | opacity 100%→28% linear; fill fades out leaving only an accent-color outline; farther clones get extra 0→1.6px depth blur | The farther, the fainter and the more "outline only" = evidence of depth. Clones keep only the top bar + polyline + shot number; do not repeat the big readout (stacked it becomes garbled text) |
| Spread / pull-back | spring stagger 2.2f per clone (damping 15, one light overshoot); pull-back is a strong ease-in over 10f, all in sync, with trailing blur by depth speed | Spreading needs a stagger (photocopy feel), pulling back needs sync (closing feel). The asymmetric rhythm is by design |
| Hold | 32f, during which the camera pushes in very slowly 2% + the column drifts with slight parallax | Too short and "there are many" cannot be counted; fully still is a dead frame |
| Merge | main card single sin pulse 1.06x + one accent-color outline flash (14f decay); on the same frame the shot slots all light and the counter rebounds | A pull-back with no bounce reads as a fade-out. The bounce is evidence of mass |
| Count | bottom left, 260px "×N", rolling one notch per clone popped (5f, the outgoing notch rises and fades + vertical motion blur by speed) | The count turns "scale" from a picture into a number. Do not clip the rolling notch with overflow, it cuts the glow into a box |

## Known traps
- The demo is tuned on a hand-made shorts-kit render card (lime dark scene). The parameters are a tuning starting point, not a final production setting;
  the first production use must re-verify on real material
- Clones must render back to front so occlusion is right; unmount them when opacity ≤0.005
- Two other entries in the same batch of 3D channels (thick-slab turntable dropped, corridor "tweak then look") are pure display types, and
  a 3D camera move on them is of doubtful fit. This card gets across the wall by the narrative action of "spread and pull back";
  in production do not degrade it into a static column display
- Sound: a run of fine "pops" staggered for the spread, one rising whoosh for the pull-back, one solid "thud" for the merge

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`cloner-depth-echo/ClonerDepthEcho.tsx`](../../../src/demo/ui-entrance/cloner-depth-echo/ClonerDepthEcho.tsx)

