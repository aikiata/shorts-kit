---
name: neon-frame-orbit-drop
summary: After the neon frame runs ahead and outlines the page, the camera orbits the page in an arc from left to right, and all page components / text drop from the air and fit into place on the **same frame** (the same-shape soft shadows converge in sync): a whole-page debut, placed inside the frame
use: A one-time grand debut of a single-page UI (as opposed to a tour or area-by-area reveals); the main visual unveiling of a dark neon section; sister shot of neon-frame-forerun
length: frame outline ~0.5s + rotation & simultaneous drop ~2.5s + settle ~1s; whole section ~4.7s (140f, rotation ends at 128f and then a settle remains)
energy: medium-high (one big action, still once settled)
tags: effects, camera
---

## Intent
A twin variant of neon-frame-forerun: the same frame first, content after, but the camera
is not fixed. It rotates in a continuous arc from the left-side view of the page to the right-side view, and while the rotation
is under way all components drop from the air. The crux is **fitting at the same time**: all components and text
rise and fall on the same frame, fit on the same frame, and their soft shadows vanish in sync. This is the grammar of a "whole debut"
(precedent: the staggered version was rejected with "all components and text should drop from the air and fit together at the same time").
A staggered drop belongs to the tour shot (graze-face-tour); a one-time reveal of one page
must drop together, and the rhythm semantics cannot be mixed.

## Motion core
- Neon outline: a gradient neon frame races out and forms in ~14f (same as neon-frame-forerun)
- View arc: rotateY +38° → -26° as a continuous arc (the perspective origin moves 30%→64% to
  approximate a camera orbit), through the whole shot
- Simultaneous drop: all elements share one LAND moment (normalized ~0.52): they leave the ground and hover on the same frame,
  descend through the air on the same frame, and fit on the same frame; the FloatWrap same-shape soft shadows (blur/offset/
  opacity by height) all converge in sync
- A group of neon tube frames sets the scene in the background and gives way once the main panel settles

## Parameters
| Parameter | Typical value | Feel when tuning |
|------|--------|----------|
| Drop simultaneity | all elements rise and fall on the same frame (zero stagger) | **The crux**; any stagger reads as tour grammar (see the precedent ruling quoted above) |
| View arc | rotateY +38°→-26°, perspective origin follows | A small arc reads as shaking; rotating without dropping = spinning in place |
| Rotation × drop coupling | the drop window is centered on the rotation travel | Dropping only after the rotation ends = two scenes; still rotating after the drop is done = no way to close |
| Hover height / soft shadow | same as graze-face-tour (100–180px, shadow follows height) | A shadow that cannot be perceived is as if not done (accumulated precedent) |
| Outline | ~14f race | Same as neon-frame-forerun |

## Known traps
- The parameters passed two rounds of tuning on placeholder material and are not a final production setting; the first production use must re-verify on real material
- **Precedent on the semantics of drop rhythm** (this card and graze-face-tour are each other's counterexample):
  a tour shot = offset starts + overlapping parallel falls; a whole-debut shot = everything on the same frame. Picking the wrong grammar
  gets either side rejected
- Division with neon-frame-forerun: that card has a fixed camera, a staggered drop, and three layers meshing with the page light-up; this card has a rotating camera + all dropping on the same frame. Pick one for the same section and do not use them back to back (the same frame language repeated)
- The arc rotation approximates by moving the perspective origin and is not a real 3D camera orbit, so at extreme angles the deformation of the frame glow
  is slightly flat. If production needs a large-angle orbit, consider a real 3D scene

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`neon-frame-orbit-drop/NeonFrameForerunOrbit.tsx`](../../../src/demo/ui-entrance/neon-frame-orbit-drop/NeonFrameForerunOrbit.tsx)

