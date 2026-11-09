---
name: waterline-split
summary: The frame is cut across a moving water surface; the boat and sky ride up into the top part, and the lower part is the sea below, with sun rays, rising specks, the submerged hull and what happens under it
use: Showing what the surface hides: hands grabbing a fish under the boat, shells grown on a hull, a shark below a swimmer, the depth under a small boat; any "above and below" contrast in one drawn frame
length: one shot, 90-180f (the source holds it for a full narration line)
energy: low (everything sways; the only accent is an action under the surface)
tags: underwater, split frame, water surface, clip path, illustrated, sea, boat, waves
source: makevideo/alvarenga
---
# waterline-split

## Intent
A side view of a boat only shows what is above water. This shot keeps the same drawn world
and slides it up, so the water surface crosses the frame and the lower half becomes the sea
under the boat. The viewer sees both worlds at once, joined by one living line. It reads as
"the camera dipped its lens into the water", not as a new scene, because the boat, its bob
and its waterline are the same functions as in the side view.

## Motion core
- **Shift the whole above-water world up** by `UNDER_SHIFT`: 470 px for a deep view, 300 px
  when the action is near the hull. The boat sits at `by = BOAT_Y - shift`.
- **One surface function for hull and sea.** The surface y at screen x is
  `by + bob * 0.4 + waterlineAt(x - BOAT_X, frame, sky)`, sampled every 20 px from -20 to W+20.
  `waterlineAt = 36 + sin(dx/34 + f/9)·3·wave + sin(dx/13 - f/6)·1.5`. The boat's own
  waterline uses the same function, so the hull meets the water exactly.
- **Boat motion:** bob `sin(f/17)·6·wave`, tilt `sin(f/23)·2.2·wave` degrees; `wave` comes
  from the sky preset (calm 0.6, day 1, storm 3.2).
- **Underwater panel:** the surface path closed down to the frame bottom, filled with a
  vertical gradient (near-surface tint, sea at 0.25, deep at 0.6 for "deep" or 0.75 otherwise,
  then `#01060B`), and used as a `clipPath` for everything below.
- **Inside the clip:** 7 sun rays (`x0 = 80 + i·150`, sway `sin(f/50 + i)·30`, length 1300 deep
  or 900, opacity `0.07·(0.6 + 0.4·sin)`, Gaussian blur 14); 70 specks rising 0.3 to 0.8 px per
  frame and fading with depth; the submerged hull redrawn with a water tint; the action
  (hands closing on a fish, shells, a big fish shadow); a bright band 6 px under the surface at
  opacity 0.18.
- **The surface line** on top: stroke 3, opacity 0.8.
- **A slow camera per variant:** deep `z 1.12 → 1` at (540, 700); hands `1.05 → 1.2` at
  (700, 900); shells `1.5 → 1.65` at (540, 600). Zoom is clamped `>= 1`.
- **Timed action in shot fractions:** the hands spread in a V, close at 0.62 to 0.70, then lift
  60 px over 0.74 to 0.95; fish 0 swims from off-frame into the hands by 0.66.

## Parameters
| Parameter | Typical value | How it feels when changed |
|---|---|---|
| World shift | 470 px (deep) / 300 px (near hull) | Less than ~250 px leaves too little sea to read as "below"; above ~550 px the sky is gone and the link to the side view breaks |
| Surface sampling | every 20 px | 40 px+ shows corners on the swell; finer costs nothing visible |
| Surface bob factor | `bob * 0.4` | 1.0 makes the whole sea lurch with the boat; 0 detaches hull and water |
| Ray opacity | `0.07 · (0.6..1.0)`, blur 14 | Above ~0.15 rays look like spotlights; no blur and they look like stripes |
| Speck count / speed | 70, 0.3-0.8 px/f upward | More than ~120 reads as snow; faster reads as bubbles from a leak |
| Gradient deep stop | 0.6 (deep) / 0.75 (near) | Earlier darkness makes the sea feel deep and threatening |
| Camera push | 1.05 → 1.2 over the shot | Push towards the action point; a push of more than ~25% competes with the action |
| Grab timing | close 0.62-0.70, lift 0.74-0.95 | Put the close on the narration word; late grabs get cut by the next shot |

## Known traps
- **The hull and the surface must share `waterlineAt` and the bob.** Two different wave
  formulas show a gap or the hull poking through the water.
- **Keep the world in one coordinate system.** The above-water part is the normal side scene
  inside a `translateY(-shift)`; the underwater SVG computes `by` from the same shift. Changing
  only one of them misaligns the hull.
- **Clip everything below to the surface path,** or rays and specks draw above the water.
- **Wrap with a double modulo** for things that move up: `((x % span) + span) % span`, since a
  plain `%` goes negative and specks vanish.
- **Determinism:** all scatter comes from `rnd(seed)` (a sine hash), never `Math.random()`, so
  every frame renders the same in any order.
- **Zoom never below 1:** the camera clamps `z >= 1` so the frame edge of the drawn world never
  shows.
- **Unique SVG ids per variant** (`under-${kind}`, `under-clip-${kind}`): during a crossfade two
  variants can be on screen and shared ids would point at the wrong gradient.

## Pairs with
- [`depth-layer-moves`](../camera/depth-layer-moves.md): the same "give a flat world depth" job
- [`overhead-camera`](../camera/overhead-camera.md): the top-down rise of the same boat (`TopWorld` in the source)
- [`light-play-moves`](../effects/light-play-moves.md): light that moves across the frame

## Reference implementation
- [`waterline-split/Alvarenga.tsx`](../../../src/demo/camera/waterline-split/Alvarenga.tsx) (`UnderWorld`, `waterlineAt`, `boatMotion`, `UNDER_CAM`)
- [`waterline-split/shots.ts`](../../../src/demo/camera/waterline-split/shots.ts) (the `view: "under-*"` shot settings)
- [`waterline-split/drift.ts`](../../../src/demo/camera/waterline-split/drift.ts) (data for the globe ending, kept so the file reads whole)

The sea, sky and figures it draws are in this kit as `src/shared/nature/` and `src/shared/figures/`.
