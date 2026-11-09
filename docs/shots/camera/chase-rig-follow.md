---
name: chase-rig-follow
summary: A 3D camera rides with a moving body (a plane, a car), sliding around it along a short spline of offsets while it keeps looking at a point fixed on the body, so the subject stays framed and the world streams past.
use: Every shot of a 3D explainer where one hero object moves through a single world; also world-fixed fly-bys and short orbits of a parked object.
length: 96-150 frames per shot (3.2-5 s), chained shot after shot in the same world
energy: medium
tags: 3d, three, camera, chase, orbit, spline, deterministic, explainer
source: makevideo/gimli-glider
---
# chase-rig-follow

## Intent
The camera never stops, but the world stays the same. One low-poly world is filmed again
and again with a new camera spline per shot: that is what makes 25 shots out of one set.
The chase rig keeps the subject locked in frame while the background moves, so the viewer
reads motion and scale without losing the object. It differs from
[space-camera](space-camera.md) (a flat page treated as 3D) and
[basic-3d-scene](basic-3d-scene.md) (the camera visits static cards): here the subject
itself travels, and the camera travels with it.

## Motion core
- A pose is a pure function of the frame: `pose(f) => {pos, pitch, yaw, roll}`, Euler order
  `YXZ`. The camera is a rig: `rig(f) => {position, target, fov}`.
- `chaseRig`: `t = easeInOut(f / lastFrame)` (smoothstep). Camera position = `pose(f).pos` plus a
  centripetal Catmull-Rom spline of 3 or 4 offsets sampled at `t`. Target = body position plus a
  fixed `look` offset. `fov` lerps from `fov[0]` to `fov[1]` on the same `t` (a slow zoom).
- `flyRig`: the same, but both position and look-at are world splines (a fly-by of a parked plane).
- Orbit: put the position spline on an arc. Ottawa (s11): angles 72, 58, 44, 30 deg at radius 64 m
  around the nose, height 7.5 m, look-at held on one point. A 42 deg sweep over 5.1 s.
- `lowerTarget(rig, from, dy)`: wraps a rig and slides the target down `dy` metres over 24 frames
  (smoothstep). The subject rises in the frame to make room for an overlay (s02: 30 m, 6 frames before
  the tank gauges appear).
- `PathCamera` applies the pose during render (not in `useFrame`), so each frame gets the pose of its
  frame number.

## Parameters
| Parameter | Typical value | Feel when changed |
|---|---|---|
| Offset spline | 3 points, e.g. `[-110,26,-150] → [-135,42,10] → [-95,30,170]` (climb-out, 4.6 s) | the camera swings from behind to beside to ahead; fewer metres of travel reads calm, a full side swing reads as a reveal |
| Close chase | `[-56,8,34] → [-40,6,20] → [-32,5,10]` (engines out, 3.2 s) | a push toward the detail; under about 30 m the flat shading starts to show its facets |
| Look offset | `[0,0,0]` body centre; `[-8,-2,2]` the left engine; `[0,1.2,15]` the cockpit | aim the frame at the part the voice names, not the body centre |
| fov pair | `[40,34]`, `[36,30]`, telephoto `[11,10.5]` (s22) | a 4-6 deg drop is a slow creep-in; telephoto 11 deg flattens distance and stacks the plane against the far camp |
| Ease | smoothstep over the whole shot | the camera starts and lands still, so a cut between two rigs never jolts |
| Orbit | 4 arc points, radius 64 m, 72 → 30 deg | about 40 deg per 5 s reads as "walking around it"; past 90 deg in one shot the viewer loses which side is which |
| lowerTarget | `dy` 30 m over 24 frames | makes room for a 2D inset without a cut; more than 24 frames and it reads as a camera tilt |
| Shot length | 96-150 frames | one shot per 3-5 s; longer chase shots need a second event inside them |

## Known traps
- Every frame must be a pure function of the frame number. No `useFrame`, no clock, no
  `Math.random`: Remotion renders frames out of order and in parallel, and the render would differ
  from the preview.
- One rig drives both the canvas and any label. If you wrap a rig (`shake`, `lowerTarget`), hand
  the wrapped rig to `Callout3D` too, or the label slides off the object.
- `chaseRig` in `world.tsx` clamps `t`; the shared one in `rig.ts` does `easeInOut(f / lastFrame)`
  and relies on `easeInOut` to clamp. Keep the clamp if you copy only one of them.
- Use `poseEuler` (or `euler`) for both the mesh `<group rotation>` and `onPlane` projection, so the
  two cannot disagree.
- A real-size subject is a speck in a wide route shot: scale it (`planeScale: 8` in s13 and s16) and
  push the fog out (`[2600, 9000]`).
- The sky dome must follow the camera or the far plane clips it when the camera travels.

## Pairs with
- [pinned-callout-3d](../effects/pinned-callout-3d.md): the label that rides the same rig.
- [scrape-sparks-shake](../effects/scrape-sparks-shake.md): wrap the chase rig in `shake` at the hit.
- [tension-camera](tension-camera.md): once, for the key number, after the chase shots.
- [crash-zoom-punch](crash-zoom-punch.md): a 2D accent between two 3D shots.

## Reference implementation
- [`chase-rig-follow/rig.ts`](../../../src/demo/camera/chase-rig-follow/rig.ts)
- [`chase-rig-follow/cameraPath.ts`](../../../src/demo/camera/chase-rig-follow/cameraPath.ts)
- [`chase-rig-follow/PathCamera.tsx`](../../../src/demo/camera/chase-rig-follow/PathCamera.tsx)
- [`chase-rig-follow/world.tsx`](../../../src/demo/camera/chase-rig-follow/world.tsx)
- [`chase-rig-follow/scenes3d.tsx`](../../../src/demo/camera/chase-rig-follow/scenes3d.tsx)
