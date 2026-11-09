# Shot sizes and angles

The cards in this folder say **how the camera moves**. This page says **how big the subject
is in the frame and from where it is seen**. Every shot in `storyboard.json` carries a
`size` and, when it matters, an `angle`. Without them an agent builds the whole video at
one size (usually a medium UI panel) and the eye has nothing to react to.

## Size

| `size` | Name | In a 9:16 frame | Makes the viewer feel | Use it for |
|---|---|---|---|---|
| `WS` | wide / establishing | the whole world; the subject is a small part of it | where am I, how big is this | the opening of a chapter, a map, a scale comparison, the pull-back before the ending |
| `MS` | medium | the subject fills about half the width; its surroundings still read | this is the thing, in its place | explaining: a UI panel, a figure with its label, a graph with its axes |
| `CU` | close-up | one part of the subject fills the width | look at this detail | the number, the button, the face, the word the voice just stressed |
| `ECU` | extreme close-up | a fragment so large it is nearly abstract | this is the one thing that matters | the single digit, the crack, the cursor on the click; use once per video |

A vertical frame is narrow: a `WS` that works in 16:9 turns into a thin strip in 9:16. Make
the world taller (stack it, tilt the camera down) instead of just zooming out. Check every
`CU` and `ECU` on a still with the safe overlay, because the caption zone eats the bottom
third.

## Angle

| `angle` | Reads as | Use it for |
|---|---|---|
| `eye` | neutral, honest (default) | explaining, anything that should not editorialise |
| `high` | the subject is small, overlooked, under review | a map, a table, a list of options, a layout seen from above |
| `low` | the subject is large, powerful, a threat | a reveal, a claim the video is about to overturn, the product as hero |
| `top` | tabletop, flat, a decision to be made | choosing one of several pages (see [`overhead-camera`](camera/overhead-camera.md)) |
| `tilt` | something is off, tension builds | the beat before a turn (see [`tension-camera`](camera/tension-camera.md)) |

Leave `angle` out when it is `eye`.

## How the size changes

Change size **at a beat**, not at random. Three jobs:

- **Escalate.** `WS` then `MS` then `CU`: the video goes in as the claim sharpens. The
  default shape of an explainer.
- **Punch.** `MS` then `ECU` in a few frames on the word that names the target
  ([`crash-zoom-punch`](camera/crash-zoom-punch.md)).
- **Release.** `CU` then `WS` for the turn or the ending: the camera lets go and the viewer
  sees the whole thing they believed differently.

Rules of thumb:

- No more than **two shots in a row at the same size**; the lint warns at three.
- Neighbouring shots differ by **one step or more**. A `CU` after a `CU` of the same subject
  is a jump cut that reads as a mistake, not a choice.
- Open on `WS` or `CU`, not `MS`: a first frame that is neither far nor near gives the
  scroll-past nothing to stop on.
- Keep the **ending's size different from the opening's**, so the loop reads as a turn.
- A size is a framing, not a zoom value: a slow push (§12) inside a shot does not change its
  `size`.

## Pairs with

[`crash-zoom-punch`](camera/crash-zoom-punch.md) (`MS` to `ECU`), [`tension-camera`](camera/tension-camera.md)
(`tilt`, then `WS` to release), [`overhead-camera`](camera/overhead-camera.md) (`top`),
[`space-camera`](camera/space-camera.md) (`WS` and `high` for the exploded view).
