---
name: page-turn-transitions
summary: Whole-page volume transition. barn-door-split: the old page splits into two halves like double doors and slides out, and the new page comes up to meet it.
use: Chapter-level page change, a "turning the page" ritual between two big sections as old gives way to new. Division of labor with the shot-transitions family (camera handover): that is "an aerial camera moves over", this is "the page is itself a physical object".
length: single style 150f (set-up before 30–40f + transition 24–40f + follow-through and ending ≥70f), about 5.0s
energy: medium-high
---

## Intent
The three shot-transitions styles and transition-travel/hidden-cut all treat a page as a "scene", with the camera moving between scenes. This card treats a page as a **physical object**: it has thickness, weight, and can split open. The volume metaphor has more sense of ritual, suited to big chapter-level page changes (feature A is done → feature B) rather than small camera-level handovers. The double door is "the old gives way": the old page tears open from the middle and slides away while the new page comes up from underneath, implying replacement. It handles old-to-new succession.

## Style choice
| Style | How | Use |
|----|------|------|
| A barn-door-split | The old page is two 960px overflow containers joined in register, which slide out of frame at the same time, accelerating outward with ease-in (horizontal motion blur attached by speed). The light of the new page shows through the gap: the 10px cut face on the inner edge of the door is lit, and the door face near the seam is tinted warm by the light. The new page comes up with one overexposed light beam, scale 1.08→1. The demo is the shorts-kit version update in the same layout: the cool-gray old page "shorts-kit 3" → the ember-colored release page "shorts-kit 4" (eyebrow carries the camera-engraved logo), with the data rolling from the old value to the new value (illustrative values). | Old-to-new succession: before and after a redesign, plan A→plan B, version release |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Teaser | Before the split, a hairline bright line (with bloom) at the center seam is drawn from the midpoint up and down (20–30f), and at 30–40f the gap eases in open 0→16px into a slit of light | Splitting directly means the viewer doesn't see where the split point is; a hard on/off flash line reads as a rendering glitch |
| Slide out | Each translateX ∓1000px / 24f, accelerating with bezier(0.42,0,0.8,0.25) | An ease-out slide is "being pushed away"; ease-in is "giving way". Quart-in is too violent and reads as "stop → last frame vanishes" |
| New page comes up | scale 1.08→1 (snappy 36f, starting 2f after the doors), the overexposed beam decays over ~30f as the doors move away; old and new pages use the same layout in the same slots | If old and new pages have different layouts, "replacement" can't be read |
| Torn edge | 10px lit cut face on the inner edge (bright → accent color → dark) + 620px light tint on the door face near the seam (screen); the doors cast no shadow onto the new page | Without an edge line the two halves read as an ordinary left-right wipe; shadows from the doors into the seam would gray out the light |
| Ending | After the new page settles, follow-through action (data roll / checklist ticks) + hold ≥30f, and the camera pushes in very slowly 1.5–2% during the hold | R1 |

## Known traps
- The demo was tuned on pages hand-built for the shot. The parameters are a tuning starting point, not a field-proven final. The first real use must be re-checked with real material.
- The one-style-per-seam rule is the same as shot-transitions. Volume transitions are heavier than camera handovers, so **at most 2 times per film**. Two seams in a row using volume transitions read as PowerPoint page turns.
- The two halves must **join in register with no gap** (right half's inner layer translateX(−960px)). A visible seam at rest breaks the illusion. With real screenshots, watch the rounding of odd widths.
- Both the page before and the page after the transition need ≥30f of still set-up / ending. If both ends are moving, the volume feel is drowned by motion.

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`page-turn-transitions/BarnDoorSplit.tsx`](../../../src/demo/transition/page-turn-transitions/BarnDoorSplit.tsx)

