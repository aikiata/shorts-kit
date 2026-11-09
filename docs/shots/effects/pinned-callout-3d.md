---
name: pinned-callout-3d
summary: An uppercase label in a dark tag draws a thin leader line to a ring on a 3D object, and the ring stays glued to that object while the camera moves.
use: Naming a part of a 3D subject or a place in a 3D world at the word that names it (an engine, a measurement, a town); also the plain 2D variant over a still or a diagram.
length: draws on in 10 frames, holds for the rest of the shot (60-150 frames), fades out in 6
energy: low
tags: callout, label, leader line, 3d, projection, annotation, hud, safe zone
source: makevideo/gimli-glider
---
# pinned-callout-3d

## Intent
Text on a 3D frame should be the fact the ear cannot catch: a name, a number, a unit. The
callout points at the thing instead of floating as a caption, so the viewer links the word to
the object. The trick is that the 2D overlay projects its point through the same camera rig
as the canvas, so a moving camera does not leave the label behind. It differs from
[fui-hud-moves](fui-hud-moves.md) (brackets lock on a target) and
[scanline-annotate-focus](scanline-annotate-focus.md) (a scan finds blocks): this one is quiet,
one line and one ring.

## Motion core
- `projectToScreen(rig(frame), point, width, height)` gives `{x, y, visible, onScreen}`. The
  point can be fixed (`[0, 0.6, 46]`, scenery) or a function of the frame
  (`(f) => onPlane(pose(f), [0, 1.5, 8])`, a point on a moving body).
- Reveal `p = interpolate(frame, [from, from + 10], [0, 1])`, clamped. Fade
  `alpha = interpolate(frame, [to - 6, to], [1, 0])`.
- On `p`: the leader draws with `strokeDashoffset = len * (1 - p)`; the tag fades in over
  `p` 0 to 0.4; the ring (radius 0 → 11) and the dot (0 → 4) grow over `p` 0.6 to 1, so the
  ring lands after the line reaches it.
- The tag keeps a fixed pixel offset from the point (`offset: {x: -60, y: -210}` and so on), then
  is clamped into the safe band; the leader still reaches the true point.
- Tag: 52 px tall, 28 px uppercase, 800 weight, 2 px tracking, a 5 px left border in the entity
  colour, background `rgba(8,13,19,0.86)`. Width is estimated as `label.length * 19 + 40`.

## Parameters
| Parameter | Typical value | Feel when changed |
|---|---|---|
| Draw time (`DRAW`) | 10 frames | under 6 it pops; over 16 the label arrives after the word that named it |
| Fade out | 6 frames before `to`; `to = n - 4` (shot end minus 4) | ending inside the shot avoids a label cut in half by the next shot |
| `from` | the word's frame minus 2 (`at(id, line, word) - 2`) | 2 frames early feels "in sync"; on the word or later feels late |
| Offset | about 110-140 px sideways, 150-260 px up or down | under 100 px the tag covers the object; over 300 px the line becomes the subject |
| Leader | 3 px, round caps | thicker reads as an arrow, not a label |
| Ring | radius 11, 3 px stroke, dot radius 4 | a bigger ring on a small part hides it |
| Safe clamp | y in `SAFE_TOP + 150` to `SAFE_BOTTOM - 120`; x at least 40 px in; left of the button rail below `SAFE_RAIL_TOP` | the tag never meets platform UI, whatever the camera does |
| Colour | one per entity for the whole video: orange the hero, blue measurements, red a warning | changing a colour mid-video breaks the link between label and thing |

## Known traps
- Give the callout the exact rig the canvas uses. A shaken or lowered rig must be the one
  passed to `Callout3D` too, or the ring drifts off the object.
- A ring in the wrong place usually means the mesh and the projection use different transforms.
  Use one `Pose` and `onPlane` (Euler `YXZ`) for both.
- When the point goes behind the camera the callout returns nothing; when it leaves the frame
  the whole callout fades (`edge = s.onScreen ? 1 : 0`), so the line never dangles.
- The tag width is an estimate (19 px per character). Long or wide-glyph labels can overrun;
  check the still.
- Pure function of the frame: `projectToScreen` uses a scratch camera and `applyPose` each call,
  no stored state.
- Three callouts on one shot is the most gimli uses (s11, s16); stagger them on three words.

## Pairs with
- [chase-rig-follow](../camera/chase-rig-follow.md): the rig the label rides.
- [scrape-sparks-shake](scrape-sparks-shake.md): name the contact point after the hit.
- [fui-hud-moves](fui-hud-moves.md): a louder lock-on for the one key target.
- [draw-svg-trace](../ui-entrance/draw-svg-trace.md): the same stroke-dash draw on a 2D figure.

## Reference implementation
- [`pinned-callout-3d/Callout.tsx`](../../../src/demo/effects/pinned-callout-3d/Callout.tsx)
- [`pinned-callout-3d/cameraPath.ts`](../../../src/demo/camera/chase-rig-follow/cameraPath.ts)
