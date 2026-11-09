---
name: wall-reveal-moves
summary: Two styles of whole-wall batch entrance: bento lit up cell by cell, and a blueprint line drawing taking shape. Everything shows up in place without displacement, complementing the fly-in displacement type of deck-deal-flyin into a category matrix
use: The overall debut of feature walls / card walls / whole-page interfaces; sections where the content is already in place and should "show up" and not "pour in"
length: about 5s per style (A 150f / B 150f @30fps, including the establishing hold and still ending)
energy: medium
---

## Intent
For "how does a wall of content come on stage", the library had only one answer before, deck-deal-flyin: high energy, displacement type,
"things pour in". But not every wall should pour in: a brand section should feel dignified, and
"from design to the real thing" should explain the process. What the two styles share is a **non-displacing batch entrance**: elements show up in place,
the layout holds from the first frame, and the viewer watches "a wavefront of state change sweep across a wall", not "objects flying".
First question when choosing: should this wall "pour in" or "light up"? For the former go to deck-deal-flyin, for the latter use this card.

## Choosing between the two styles
| Style | How | Use |
|----|------|------|
| A bento-light-up, cell by cell | A dark-scene 3×2 bento wall (two rows with complementary wide and narrow cells 600/420/420 ↔ 420/420/600, dark card faces) waits dimmed. An accent-color comet streak outlines each cell in turn, then the content brightens and rises, and after everything is lit the camera slowly pushes in and settles. The eyebrow above the wall is the shorts-kit mark + wordmark, and the main title is "Every shot, tuned in one place." | Dignified content / dark-scene brand sections; feature overviews with a steady rhythm |
| B wireframe-draw-on, blueprint line drawing taking shape | The interface is first drawn in groups as a thin-line SVG blueprint, then one glowing accent-color vertical line sweeps from left to right, and where it passes the wireframe becomes the real interface (in the demo, the shorts-kit workbench, with the lens-engraving mark drawn inside the sidebar logo square) | "From design to the real thing / from idea to product" narratives; a product's first whole debut |

## Parameters
| Parameter | Typical value | Feel when tuning |
|------|--------|----------|
| A beat | hold 20f → each cell activates in turn at a 12f interval (six cells fully lit in ~96f) → scale 1→1.04 slow push 25f (bezier 0.33,0,0.2,1) → still ending | A 12f cascade is the balance point between "cells distinguishable one by one" and "the whole wall dragging". With more cells it can be squeezed to 8–10f, but the even interval itself is the source of this style's dignity; do not copy the acceleration of dealing cards |
| A single cell | dim state opacity 0.18 + translateY 20px; the SVG rect pathLength=100 stroke takes 8f: a comet segment of 22% of the perimeter (#e8b45e 6px Gaussian glow + #ffe3ae 2.5px bright core) leads, leaving a 1.5px thin edge behind; when the stroke is past halfway (+6f) the content pops out with back-out(0.3,1.4,0.5,1), brightens in 8f and returns to place; 12f after the stroke finishes the streak cools to a 0.4 steady-on thin edge | The stroke and the content pop-out should be a **relay and not in sync**: starting on the same frame reads as the whole cell flashing in. The glow pulse in the middle of the light-up uses a lit·(1−lit)·4 parabola, with the peak amplitude varying slightly per cell by seed (sine hash, true random forbidden) |
| B line drawing | hold 20f → groups staggered, each drawn in 30f: sidebar starts at 20f / top bar at 30f / 6 cards at 40+i*3f / line chart at 52f; SVG pathLength=1 + dashoffset 1→0, blueprint cool gray-blue #6c7894 (outer frame 1.6px / inner parts 1.25px) round, a light-blue 24px dot-grid base + crop marks at the card corners | The group stagger is the source of the "hand is drawing" feel; starting every stroke on the same frame reads as a printer. The placeholder lines inside cards stagger finely by +3f, with lengths varying slightly by seed hash |
| B materialize | at 88–118f the solid layer unfolds from left to right with clip-path inset(0 right% 0 0) over 30f, bezier(0.55,0,0.25,1); the front edge carries a 4px accent vertical line (#ffc46b + a double-layer glow boxShadow), fading in at 86–92f and out at 112–120f; behind the line a 260px stretch of fading warm light (the afterglow of just-developed content) | The line position and the clip front must be driven by the same scan value; asynchronous reads as a flaw. Leave ~6f of breathing room between the drawing phase and the scan phase (82→88f); scanning right after the wireframe is done reads as rushed |
| Still ending | after all actions of both styles settle, a true stillness of ≥15f (counted for A after the slow push ends, for B after the scan line fades) | R1 breathing precedent: during the still period every property is locked, including glow / shadow / highlight residue |

## Known traps
- **The demo passed tuning on grayscale / placeholder material. The parameters are a tuning starting point, not a final production setting;
  the first production use must re-verify on real material**
- The accent stroke / scan line of A/B belong to "a single point of high-quality light effect" (compliant within the three Q4 constraints), but a film
  lights a whole wall at most once (P4 de-duplication of technique): using A and B in the same film counts as two whole-wall light effects, so pick one
- The B wireframe geometry must align with the solid layer layout pixel by pixel (in the demo it is hand-arranged against FakeDashboard A).
  When swapping material, re-arrange the wireframe: if it does not align, elements jump position at the moment the scan line sweeps by, visible at a glance. Changing the brand name / logo
  also counts as swapping material (text width changes, and the elements after the breadcrumb all shift right as a group), so re-align the line lengths to the measured text widths of the solid layer
- Both styles are "show up in place"; do not mix in displacement entrances (such as adding a translateX fly-in to the cell-by-cell light-up).
  For displacement needs go to deck-deal-flyin; a hybrid resembles neither
- The A-style dim state opacity 0.18 holds only on a dark base (#2a2a28); on a light base the dimming reads as a faded-out glitch

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`wall-reveal-moves/BentoLightUp.tsx`](../../../src/demo/ui-entrance/wall-reveal-moves/BentoLightUp.tsx)
- [`wall-reveal-moves/WireframeDrawOn.tsx`](../../../src/demo/ui-entrance/wall-reveal-moves/WireframeDrawOn.tsx)

