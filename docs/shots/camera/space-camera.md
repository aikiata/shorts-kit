# space-camera

**Job:** treat a page as a 3D object and film it with real camera moves. Two big moves; at
most two in a whole film.
**Energy:** high.

| Move | What happens | Use |
|---|---|---|
| A. exploded view | the page lies in a three-quarter isometric pose; its parts fly apart along the page normal in a stagger, hang (with numbered callouts), then come back in reverse order and close with a thud: "see what it is made of" | architecture or "what is in this product"; 170 frames (5.7 s) |
| C. drone dive | a near-vertical overhead hover, a hard dive, an air-cushion deceleration, landing on a close-up of the hero card: wide to point | an opening that goes from map to subject; 105 frames (3.5 s): 69 dive + 36 hold |

## Parameters
- **A, base:** perspective 2400 and `translate · scale · rotateX(54°) · rotateZ(-34°)` with
  preserve-3d. During the explosion pull the camera back 0.56 → 0.47 and lower it to give
  the stack room; during the hang orbit rotateZ +10° and ease the tilt by 4° so layers show
  parallax. A mild tilt (18°/-12°) reads only as "floating"; the flat isometric pose reads
  as an exploded diagram.
- **A, explosion:** 5 layers at translateZ 150/270/400/520/640 on springs (damping 15,
  stiffness 120) staggered 5 frames. Layers further up the page go higher, or a low layer
  rises and hides the one above. Identical depths read as "the page floats".
- **A, close:** labels leave first (ease-in 8 frames), layers return in reverse, ease-in 14,
  stagger 3. On the landing frame the whole group sinks 8 px with a damped rebound and the
  contact shadow tightens, then one sweep of light crosses the page. The thud is required
  (without it the return is a limp fade), but no screen shake: the sink plus the tightening
  shadow also sounds "clack".
- **A, depth cues:** each layer's shadow on the base drops lower, softer and fainter with
  height; a thickness edge behind each layer; dashed slots visible on the base. Drop any
  one and the relationships blur.
- **A, callouts:** anchor at the 3D projection of each layer's outer edge midpoint (hand
  computed with the same matrix as the CSS), two columns, horizontal leader with one elbow;
  title 44 px, text 30 px; draw 8 frames, rise 12, stagger 6. A leader from a layer's middle
  crosses others; text under 32 px is unreadable.
- **C, travel:** one progress value p drives rotateX 72° → 0, scale 0.42 → 1.35 and the
  translation together; origin pinned on the hero card's centre; lay the page out at the
  end scale 1.35 and rasterise with layout zoom, so the close-up text is sharp. One p = one
  camera = one move; separate drivers read as three animations fighting.
- **C, speed curve:** 0-24 frames establish plus a small lift (travel backs up 2.5%); main
  dive 25 frames ease-in cubic taking 82% of the travel; air cushion 20 frames ease-out
  (power 5) taking 18%; hold 36. The 82/18 split matters more than the frame counts; the
  sudden slow-down is the cushion.
- **C, atmosphere:** wrap the scene in camera motion blur (shutter 220°, 12 samples), but keep
  the background and grain outside it; the page hovers over a dot-grid floor (start lift
  150) that rushes toward the camera in the dive; a same-shape contact shadow tightens and
  fades to 0 before touchdown; a light vignette tightens focus on the hero after landing.
  The soft shadow sells height; blur sells speed; without one of them it is fake. Big
  gradients inside multi-sample blur show colour banding.

## Known traps
- A needs the page cut into parts (top bar, sidebar, each card as its own image); one
  full-page image cannot explode. Lay the parts out absolutely at the original grid.
- C ends on a close-up: capture the page at high resolution first.
- Power-of-5 easing is `Easing.poly(5)` in Remotion (there is no quint).

## Reference implementation

The source demo this card was rewritten from (shorts-kit, kept as reference, not built):

- [`space-camera-moves/DroneDiveLanding.tsx`](../../../src/demo/camera/space-camera-moves/DroneDiveLanding.tsx)
- [`space-camera-moves/ExplodedView.tsx`](../../../src/demo/camera/space-camera-moves/ExplodedView.tsx)
