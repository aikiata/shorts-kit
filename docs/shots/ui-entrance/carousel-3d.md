---
name: carousel-3d
summary: 8 cards on a ring, the whole ring turns one full revolution (a constant-speed base plus a step that docks every 45°). Each card only orbits around Y and its own billboard faces outward. Front and back layers use the same texture orientation with backface-visibility:hidden so cards are always upright and never inverted. The card at the front is lit and the caption under the ring changes text with it. The camera is pinned at a shallow downward angle the whole time
use: Looping showcase of a portfolio / template library / integration list; background shots or landing-page hero that need a seamless loop
length: about 5.6s (168f@30fps)
energy: medium (steady motion that can loop forever; each 45° dock gives a beat)
---

## Intent
The easiest way to show "a set of things" is a row sliding sideways, but a sideways slide has a start and an end. A ring does not: it
loops by nature, and however long the viewer watches it never feels "finished". What this card really solves is the spot where a ring carousel most often
fails: the back of the card. The fix is a double-sided same-orientation texture, so a card looks the same upright card from inside the ring or outside,
and no frame of the full turn shows a mirror or an inversion.

## Motion core
(Demo version: acid-lemon graphite dark scene, shorts-kit shot recipe gallery, cards 340×460, radius 700px, native 1920×1080 coordinates)
- The placement formula on the ring is one line: `transform: rotateY(i*360/N) translateZ(RADIUS)`. First turn to its own
  azimuth, then push out the radius along the new Z axis. This one step does both layout and billboard: the card normal faces outward by nature.
  The card that reaches the front is pushed a further 44px along its normal (translation only, no rotation); at dock this reads as "selected"
- The whole ring turns through the parent layer: `ring.transform = rotateY(-spin)`, and the card's own transform has only the placement component.
  **Cards never rotate around X or Z**; this is the basic guarantee of "always upright"
- The turn angle is not plain constant speed: `turn = 0.5·f/168 + 0.5·stepPart(f)`. `stepPart` makes one step every 21f (8f dock + 13f smooth move).
  The constant-speed base keeps the ring always moving (steady loop state), and the step layer gives a "push, then dock" every 45°. 8 steps × 21f = 168f is exactly one turn,
  at f=168 turn=1, so first and last frames join pixel for pixel
- Double-sided same-orientation texture: front and back use **the same card face**, and back adds `rotateY(180deg)`,
  with both layers set to `backface-visibility:hidden`. So from outside the ring you see front and from inside you see back, and the content
  faces the same way. With only one layer you would see mirrored text when the card turns to the back of the ring
- Front lighting: `hl = smooth(1 - |azimuth|/26°)` drives the neon outline, the graphic color (graphite gray → neon yellow-green interpolation) and the push-out amount.
  The caption under the ring (mono number + 72px name) scrolls up inside a clipping window with the step layer to change text, and freezes at dock
- The camera is fixed and does not move for a single frame: `perspective: 2200px`, ring container `translateZ(-RADIUS) rotateX(-9deg)`.
  The front card lands at z=0 (rasterized at native size, so text is not blurry), and all motion comes from the ring's own rotation. This is a "gallery" and not a "roller coaster"
- Ground: a reflective disc of 2.7 times the radius + a 96-tick scale ring (turning with the ring), laid flat with `rotateX(90deg)` under the cards' feet; plus a reflection ring mirrored on the ground
  with `scaleY(-1)` (leaf layer at 8% opacity + fade-out mask; opacity must not sit on a preserve-3d container or the whole ring is flattened)
- Aerial perspective: a base color layer is laid over the card face by the card's azimuth `(1-cos θ)/2` (70% at the very back), so the front-back order of the ring reads at a glance

## Parameters
| Parameter | Typical value | Feel when tuning |
|------|--------|----------|
| Card count | N=8 (azimuth spacing 45°) | 8 cards on a 700px radius do not block each other front to back. Over 12 the cards press on each other's edges and RADIUS must grow with them |
| Radius | RADIUS=700px (card 340×460) | Radius / card width of about 2 is the density sweet spot. Under 1.5 times, the cards on the back of the ring squeeze out through the gaps of the front cards and the picture gets messy |
| Rotation mix | 50% constant + 50% step (21f/step, dock 8f) | With a step share over 70% the whole ring nearly stops at dock and the loop reads as "stuttering"; under 30% the dock feel is gone and it is back to flat constant speed |
| Turns | 1 turn in the whole shot (8 steps) | Turns and steps must both be whole numbers to loop; a non-integer makes the last frame jump |
| Perspective | `perspective: 2200px` | A fairly flat perspective against a 700 radius. Below 1200 the near cards are exaggeratedly enlarged and read as fisheye |
| Camera pitch | `rotateX(-9deg)` | Just "slightly looking down", enough to show the ground disc and scale ring. Past -20° the ring is squashed into an ellipse |
| Light window | azimuth ±26° | Too wide and two neighbors are half lit at once, so the lead is unclear; too narrow and the whole ring goes gray mid-move |
| Reflection | 8% opacity, fades from 62% | Over 15% the text in the reflection is readable and fights the caption below |

## Known traps
- A steady loop is both the feature and the limit of this card: **it has no beginning and no end**. The step docks give a beat, but as the main shot
  it is still flat, so it suits a background layer, loop material, or layering with foreground text / camera motion
- Every frame resets the transform of all 8 cards (`rotateY(i*45) translateZ(RADIUS + 44·hl)`). The rotation component is constant,
  and only the outward push along the normal changes with lighting. This makes "the card itself takes no part in the rotation" explicit in code; do not hang the push on the rotation
- `backface-visibility:hidden` needs a `-webkit-` prefix in some WebKit versions (the code writes both).
  Without the prefix you see both face layers at once and the card content piles into a mess
- The card faces are hand-made shot recipe card placeholders (mono number + generated graphic + big number + name). In production swap in real screenshots,
  **and front/back must be swapped to the same content**, or the premise of the double-sided same orientation breaks
- When the ring turns to the back, the card is a "front facing away from the viewer" (you see the back layer), so the content stays readable, but it also means
  there is no room for a "flip reveal". To do a flip you must give up the backface-hidden approach and start a separate one
- Dark soft-light background + graphite card faces + darkening by aerial perspective go together as a set. On a white background both the darkening layer and the reflection need redoing
  (change the darkening to blend toward the background color and lower the reflection opacity to about 5%)
- The caption's "current card" comes from the step number of the step layer, not from the real azimuth. During dock the constant base lets the ring travel about 8.6° more,
  so the front card sitting slightly left is normal. If you change the step share, check that the light window (±26°) still covers this drift at dock

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`carousel-3d/Carousel3D.tsx`](../../../src/demo/ui-entrance/carousel-3d/Carousel3D.tsx)

