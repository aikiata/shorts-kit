# 3D explainer (§5k): `3d-explainer`

**Use when** the claim is a mechanism or a sequence of events that has no usable
photo or footage: how a system works, how an accident unfolded, where a number goes.
One low-poly world, a camera that never stops, chapters that each answer the
previous chapter's question, labels pinned to the objects.

Learned from `gimli-glider` (Air Canada 143, 25 shots, six chapters, built in the
MakeVideo repo) and the reel study that preceded it. Components: `src/shared/three/`
(`Shot3D`, `cameraPath`, `rig`, `Lighting`, `Effects`, `GlidePath`, `palette`) and
`src/shared/frame/` (`Callout3D`, `ChapterHud`, `RecreationTag`). Browse the demo with
`bun run dev gallery` (shot `three-chase`).

## Rules

1. **Every frame is a pure function of the frame number.** Remotion renders frames
   independently and in parallel. No `useFrame` animation, no `clock`, no
   `Math.random`; scatter with a seeded hash. A camera is a `CameraRig`
   `(frame) => {position, target, fov}`; the poses of moving things are functions
   `(frame) => Pose`. This is the rule that makes preview equal render.
2. **One rig drives both the canvas and the labels.** `Shot3D` gives the rig to the
   camera; `Callout3D` projects its point through the *same* rig. If you wrap the rig
   (`shake`, `lowerTarget`) give the wrapped one to both, or the label slides off the
   object.
3. **Pin labels to the object, not to the screen.** Use `onPlane(pose, local)` for a
   point fixed on a moving body (the transform the mesh gets), a world point for
   scenery. Draw the label on over 10 frames at the word that names it; fade it out
   before the cut. One colour per entity for the whole video.
4. **The camera moves in every shot, the world stays the same.** About one shot per
   3 to 5 s; many "shots" are the same world with a new camera spline and a new label
   layer. Prefer `chaseRig` (follows a body through a spline of offsets) and `makeRig`
   (spline of positions plus a look-at) with `easeInOut`; `sequenceRigs` chains them.
5. **Chapters, not a stream.** Four to six chapters, each answering the question the
   last one raised, named on a fixed `ChapterHud` with a segmented progress bar and a
   small diagram that changes per chapter. The HUD is what keeps a viewer who scrolled
   in late from being lost. Put the chapter table in the brief (§5k beat map).
6. **Say what the picture is.** Anything that is not footage carries a
   `RecreationTag` (`recreated`, `illustrative`, `simplified`) on every shot. No real
   logos, registrations or liveries: build generic.
7. **Palette: one blue-grey family plus one accent.** `LOWPOLY` in `three/palette.ts`:
   the world is calm and dark, haze hides the distance, trees are silhouettes; the
   hero object carries the detail and the **one accent** (orange) for what the
   narration points at. `blue` is for callouts and measurements only (a second
   entity). Scenery never uses the accent.
8. **Fog and sky share the horizon colour.** `Lighting` ties the fog colour to the sky
   dome's horizon so the ground dissolves instead of ending in a hard line. Flat-shaded
   materials need a strong warm key from one side, a cool rim from the other, and a
   lifted hemisphere light, or the shadow side reads as a hole.
9. **Scale the thing to the shot.** A real-size subject is a speck in a wide shot:
   scale it (`planeScale` in gimli) or use pins tall enough to read from 1 to 2 km.
   Wide route shots need the fog pushed out (`fog` prop).
10. **Timing comes from the voice, never typed.** Anchor events to words with a
    helper like gimli's `frameAtWord(line, word)` that *throws* if the word is gone,
    so a rewritten script fails loudly instead of drifting the picture.
11. **Text on a 3D frame is facts the ear cannot catch** (a number, a unit, a
    measurement), not captions. Keep it to chips or callouts and stay inside the safe
    zone (`Callout3D` clamps to it and to the button rail).
12. **Check the licence at the brief.** Procedural geometry (boxes, cylinders,
    icospheres, or Blender scripts that export `.glb`) needs none. A downloaded model
    does: CC0 only is committed (`public/models/ATTRIBUTION.md`); CC BY needs credit in
    the pinned comment; sites that refuse non-browser downloads cannot be scripted.

## Building the world

| Need | How |
| --- | --- |
| a subject | boxes and extruded shapes in r3f for simple things; for a hero object write a deterministic Blender script (`scripts/blender/common.py` has `material`, `obj`, `empty`, `srgb`) that exports `public/models/gen/<name>.glb` and **names its nodes** (`gear_nose`, `flap_L`, `engine_R`) |
| the model in a shot | `<Model src="models/gen/<name>.glb" nodes={{flap_L: {rotation: [a, 0, 0]}}} />` (`src/shared/three/Model.tsx`): the frame waits until the model is loaded and drawn, so no frame is captured empty |
| moving parts | `Model`'s `nodes` finds parts by their Blender name and sets `position` / `rotation` / `visible` from props, so state (gear, flaps, lights on or off) is a prop of the frame |
| a route | `GlidePath` draws a dashed line along a Catmull-Rom spline as `progress` 0..1; `pathPoint` gives the head of the line for a marker or a camera target |
| an impact or a hit | a pure-function particle burst: seeded hash per particle, age from `frame - hitFrame`, plus a decaying `shake(rig, hitFrame)` |
| a pose | `Pose = {pos, pitch, yaw, roll}` with Euler order `YXZ`; use `poseEuler` for both `<group rotation>` and projection so they cannot disagree |

Build a model: `bun run model <name>` runs `scripts/blender/<name>.py` headless and writes
`public/models/gen/<name>.glb` plus a preview in `out/blender-preview/`. The worked example is
`scripts/blender/airliner.py`, flown in the gallery shot `three-model` with a callout on a named
point (a Blender point `(x, y, z)` is `(x, z, -y)` in three.js). Blender is Z-up and
glTF is Y-up: a nose toward Blender `-Y` ends up toward three.js `+Z`. Units are
metres. Keep the script deterministic so the `.glb` can be rebuilt byte for byte.

## Traps (each cost a render)

- **`@react-three/postprocessing` renders a blank canvas** under Remotion's
  `ThreeCanvas` (`frameloop="never"`). Do the finish outside WebGL: `Effects` is a CSS
  vignette overlay placed after the canvas. Soft contact shadows come from the shadow
  map (`shadows` on the canvas, `shadow` on `Lighting`), worth it only when the subject
  is low (under about 90 units); higher, the shadow lands too far away.
- **A sky dome fixed at the origin gets clipped** by the far plane when the camera
  travels. The dome copies the camera position, so it is always `radius` away.
- **Per-instance materials.** A cloned glTF shares materials; clone any material you
  recolour per prop, or a state leaks between two copies of the object.
- **Label ring on the wrong spot** usually means the mesh and the projection use
  different transforms. Use one `Pose` and one `onPlane`.
- **Scenery in the accent colour** steals the viewer's eye from the subject.
- **Render time.** 3D is slow in Remotion. Render a 5 s slice first, then the whole
  video; use `bun run still <id> --frame=N` on the first, middle and last frame of
  each shot (the darkest shot, not the prettiest).
- **Pin shadow, not lines.** If a pin's glow merges with the fog, raise it (`lift`) or
  widen it, then look at the still again.

## Brief template (add to the brief)

| # | HUD label | Question it answers | Facts | Shot idea |
| --- | --- | --- | --- | --- |

Plus: the one accent entity; which shots are `recreated`, `illustrative`,
`simplified`; and the assets list with a licence for every downloaded model.

## Cases run

| Video | Date | What it taught |
| --- | --- | --- |
| `three-model` (gallery) | 2026-11-09 | The loop runs end to end in this repo: `bun run model airliner`, `Model`, a chase rig, a callout on the wing tip, a 5 s render. `ThreeCanvas` redraws only when the frame changes, so a model that loads later was missing from the frame: `Model` now advances the canvas once it mounts, then releases the frame |
| `gimli-glider` (MakeVideo) | 2026-11-08 | 25 shots on one low-poly airfield; a Blender-made airliner with named nodes; chapter HUD plus plane-fixed callouts. Postprocessing blank canvas, dome clipping, pure-function particles. Poly Pizza airliners were CC BY, so the plane was built instead |

## Change log

| Date | Change | Why |
| --- | --- | --- |
| 2026-11-09 | file created from gimli-glider | port the 3D explainer practice into shorts-kit |
