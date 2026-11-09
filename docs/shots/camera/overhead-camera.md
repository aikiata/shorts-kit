# overhead-camera

**Job:** let the **tilt angle itself** tell the story. Two moves.
**Length:** A 120 frames (4 s), B 140 frames (4.7 s). **Energy:** A medium, B medium-high.

| Move | What happens | Use |
|---|---|---|
| A. tilt-reveal | the page lies flat (rotateX 86°, hinged on its bottom edge); at the start only a thin glowing band of the far edge shows, like the first light on a horizon; the camera "lifts its head" and the page rights itself, content rolling into view | an establishing opening on one page |
| B. tabletop-drop | three page cards lie flat as a tabletop spread (rotateX 62°); the camera looks down and slides sideways past them, then dives into the chosen one and rights it to full screen: "looked around, picked this one" | after a tour of several pages, choosing one; transition or opening |

## Parameters
- **A, angle:** 86° with a very slow creep to 83° over the first 20 frames, to -2.2° by frame
  60 (speed zero there), then 0° by frame 70: asymmetric in-out with a soft overshoot.
  Overshoot at most 3° or it reads as a spring, not a camera. A first try at 55° was too weak
  (half the page showing, no suspense). The viewpoint must be above the page plane or you
  see its back and the text is upside down.
- **A, linked:** perspective 700 → 1500; eye height from 300 px above the hinge to the frame
  centre; scale 2.5 → 0.84; hinge y 600 → 935; the background glow and dust drift the
  opposite way (parallax), or it reads as "the page rotates", not "the camera lifts".
  Draw a line chart in frames 38-82 and light its end point at 80; creep in 1 → 1.018 from
  70 to 120; a fully still hold longer than 1 s is a dead frame.
- **B, pan:** frames 0-50 change only translateX +760 → -360 (smooth); the angle stays
  locked (panning looks, dropping decides: do not mix). Pause 8 frames to select (the target
  lifts 16 px, its lamp lights, the others dim to 35%).
- **B, drop:** frames 58-86, three channels run together: rotateX 62 → -1.6 → 0.5 → 0 (zero
  start speed, then a soft overshoot back), scale 1 → 2.04 → 2.0 (with a 5% pre-recoil),
  translateX -360 → 0. Run in sequence and it reads as two actions. Order the transforms
  translateX, rotateX, scale or the pan curves.
- **B, floor:** dark graphite table, hairline grid, one lamp pool per card, a printed label
  under each card. Without a floor reference the slide does not read as camera movement.
- **Close:** B lands at frame 94; a small in-page action (a gold block sliding into a slot,
  one overshoot) at 98-118; creep in 1 → 1.012. 47 fully still frames is too dead.

## Known traps
- At steep angles give every card `backface-visibility: hidden` and a 4 px translateZ, or
  some frames show the back side or depth glitches.
- A and a "crane rise" opening are alternatives: two reveal openings is no reveal.
- Both are big camera moves: one per section, never together with another camera card.

## Reference implementation

The source demo this card was rewritten from (shorts-kit, kept as reference, not built):

- [`overhead-camera-moves/OverheadTabletopDrop.tsx`](../../../src/demo/camera/overhead-camera-moves/OverheadTabletopDrop.tsx)
- [`overhead-camera-moves/TiltReveal.tsx`](../../../src/demo/camera/overhead-camera-moves/TiltReveal.tsx)
