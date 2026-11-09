---
name: basic-3d-scene
summary: An impress.js-style spatial presentation. Cards are scattered through 3D space with different positions / rotations / scales, and the camera flies through the inverse of each step's pose to line up with it in turn, with the last step pulling out to an OVERVIEW.
use: Spatial storytelling of concepts / roadmaps / three-step methods. A replacement for flat slides where "every step changes the spatial viewpoint".
length: about 7.5s (225f@30fps; four stops, three flights of 28/32/32f, each stop holds ≥30f)
energy: medium (a spatial surprise at every transition, a quiet hold to read the card)
---

## Intent
Turn "turning pages" into "traveling through the space of ideas": each card has not only a position but also an orientation (at the second stop the world turns left 38°, at the third stop the whole frame lies on its side 90°). When the camera lines up with it, the viewer's world turns too, and the spatial change itself becomes the ritual of "entering a new chapter".

## Motion core
- The core recipe in one line: **camera = stepTransform.inverse()**. Each stop writes only the card's own pose (x/y/z/rx/ry/rz/s), and the camera transform takes the inverse `scale(1/s) rotateZ(-rz) rotateY(-ry) rotateX(-rx) translate3d(-x,-y,-z)`, in strictly the opposite order.
- The demo uses a graphite dark field (near monochrome + champagne gold accents) and shorts-kit's three chapter cards Frame / Craft / Ship (the brand short phrase split into three chapters, with the logo + wordmark hung at the right of the card head). The cards are 1240×700 laid out **natively 1:1** (when aligned they are screen pixels, not scaled up from design coordinates, so the type isn't blurry), with a 156px title + 44px description + a 560px thin chapter number cropped by the card edge.
- The four stops each have a dramatic point: STEP01 origin, frontal → STEP02 (1690,−260,−650) + ry−38° → STEP03 (2590,830,−850) + rz90° (the frame lies on its side, and the camera turns along with it to set it upright) → OVERVIEW s=2.7 (camera 1/2.7 pulls far out). The overview stop's position is solved in reverse from "three cards land at the upper right, the lower left is left for the end card".
- Chained flight interpolation: three flights at frames 36–64 / 96–128 / 158–190, asymmetric in-out bezier(0.62,0,0.16,1). During flights between stops the camera additionally pulls out 30% (hop, sin envelope) so the viewer can see the other cards in space. Flight segments use time-sampled motion blur (shutter 0.5f, sub-frames 1–8 adapted to camera displacement).
- The hold is not dead: after landing, the camera pushes in very slowly 1.5% (restored along the same curve when the next flight takes off), and the gold progress line at the card's bottom fills for the current segment. The title rises from below the line letter by letter 8f before landing, and each card is revealed only once.
- Spatial reference: 70 true 3D dust motes are hung in world coordinates (each with its own z), and all parallax comes from the camera. enter/exit focus uses the "stop distance" `d = |af − i|` to give `opacity 0.22–1 + blur 0–7px`, and in the overview everyone returns to 0.85.
- The OVERVIEW end card is hung on the overview stop's pose (laid out at 2.7× enlargement, viewed back by the camera at 1/2.7 = 1:1 on screen). The eyebrow is the shorts-kit logo + wordmark, "Craft the shot." in 150px serif rises word by word, and the tail holds with a 1.5% push-in.

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Stop pose | Every stop has at least one new transform dimension | Moving only x/y is a panning slideshow. An rz stop (frame rotation) is the memorable point, use it once per film |
| Flight duration | 28–32f | Don't make a segment with rotation shorter than 28f. The viewer needs time to understand "the world is turning" |
| Hold duration | ≥30f | The slot for reading the card. When a card has a lot of text, add to the hold first rather than cutting the flight |
| Hop pull-out | 30% | 0 = sliding along the card face, and the space can't be seen; >50% and every segment looks like an overview |
| OVERVIEW scale | s=2.7 | The larger the value, the more "high-altitude" the overview. Decide the overview poster composition first, then solve the world coordinates of the stops in reverse |
| Focus falloff | opacity floor 0.22 + blur peak 7px | Don't set the floor below 0.2: an out-of-focus card must still be "present", and pure black loses the sense of space |
| perspective | 2600px | About 3:1 against the largest |z| (850). For a deeper z, increase the perspective in step to prevent distortion |

## Known traps
- The rotation order of the inverse transform (Z→Y→X, the reverse of the forward X→Y→Z) must not be mixed up. A wrong order is invisible with single-axis rotation but tilts the stops with compound multi-axis rotation.
- The card pose is consumed in two places, the card's own transform and the camera formula. To add a stop, change only the POSES table and leave the two transform strings alone.
- Text inside the card at the rz90° stop lies on its side with it and only becomes readable once the camera turns upright. This is by design (the moment it turns upright, "ah, I get it"), but the copy for that stop should be short.
- When the end card is hung in the world, it is tilted during the last flight. Develop it late (fade in after the flight is half over), and start the letter-by-letter reveal only 6f before landing.
- There is no return trip after OVERVIEW, so use it as the section ending. To loop back to STEP01, add a fly-back segment at the end (lerp cam back to POSES[0]).

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`basic-3d-scene/Basic3DScene.tsx`](../../../src/demo/camera/basic-3d-scene/Basic3DScene.tsx)

