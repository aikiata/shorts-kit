---
name: macro-measured-press
summary: A slow 2D macro glides into one part of a real, live component and settles level; a ghost cursor slides onto the real Approve button, presses it, a ripple spreads and the button turns green with a drawn check.
use: show one real interaction of the product big enough to read, at human speed, on a 4-beat shot
length: 60 frames (4 beats at 120 BPM); the press lands at frame 30
energy: medium
tags: macro, real-ui, cursor, click, approve, ripple, check, dom-measure
source: knowns-ui/launch-tvc
---
# macro-measured-press

## Intent
After the drop, the viewer needs to see that the product really does something. This shot is
a close-up of the real component, not a mock: the camera glides in until the text is large,
and one action happens on it. The press is the one moving thing; the camera only frames it.
Three of these, one per 4 beats, make the run after the drop.

## Motion core
- 2D macro: a zero-size anchor at the frame centre is rotated and scaled; inside it the
  component plane is offset by `(-x, -y)`, so the plane point `(x, y)` sits at the centre.
  No 3D: the plane stays crisp at any scale.
- Over 1.5 s with ease-out cubic: the focus moves from `from` to `focus`, the scale from
  `scale[0]` to `scale[1]` (for example 1.5 to 3.0), the tilt from `tilt[0]` to `tilt[1]` (for
  example -2.5 to 0 degrees, so it settles level). After that the scale keeps drifting,
  `+0.12` per 2 s, so there is no static tail.
- Measured target: the real button is found in the DOM by its text (`/^Approve$/`), its
  rectangle read with `getBoundingClientRect` and divided by the plane's on-screen scale to
  get plane pixels. The overlay is drawn in the same plane, so it moves with the camera.
- The press at frame `pt` (beat 6, 30 frames into the shot):
  - Cursor: a 28 px translucent circle glides from `+190, +120 px` onto the button centre over
    0.55 s (ease-out); it appears 0.6 s before and is gone 6 frames after.
  - Down: cursor scale 1 to 0.82 at `pt + 3`, back to 1 at `pt + 9`.
  - Ripple: a 2 px green ring growing to 120 px over 0.45 s, fading out.
  - Result: a green "Approved" button fades over the real one from `pt + 2` to `pt + 8`; its
    check is drawn with `strokeDashoffset` 24 to 0 from `pt + 6` to `pt + 16`.

## Parameters
| Parameter | Typical value | Feel when changed |
|---|---|---|
| Glide | 1.5 s (45 frames), ease-out cubic | shorter feels like a crash zoom; that is a different card |
| Scale | 1.5 to 3.0 (also 1.6 to 2.4, 1.3 to 2.1) | pick so real 14 px UI text reaches about 40 px (C7) |
| Settling tilt | -2.5 to 0 degrees, or 1.8 to 0 | starting level reads as a pan; more than 4 degrees reads as a dutch angle (Q6) |
| Drift after the ease | +6% per second | without it the end of the shot freezes |
| Cursor approach | 0.55 s from about 225 px away | faster than human speed breaks R3 |
| Press | 3 frames down, 6 back | a slower press reads as a long-press |
| Result | green fill by `pt + 8`, check drawn by `pt + 16` | the check after the fill reads as cause then effect |
| Sound | click at the press minus 0.02 s, chime 0.2 s after | S4: a real click, then the result sound |

## Known traps
- **Measuring needs `delayRender`.** The button position is unknown until fonts and the card's
  own late state settle. The shot holds the render (`delayRender`) until the button is found,
  polls every 100 ms, measures again each frame, and only updates the stored rectangle when it
  moved by more than 0.5 px, so the overlay does not jitter.
- Measure in plane pixels: divide by `rect.width / PLANE.w`, or the overlay drifts as the camera scales.
- Q1: the component is real; only the cursor and the result overlay are drawn. If the
  component can show its own "approved" state, prefer that to an overlay.
- Q6: an information-dense close-up faces front; the tilt is only a few degrees and settles to 0.
- C2: one action per macro. The other two macros in the run have no press; they only glide.

## Pairs with
- [`beat-grid-whip-cuts`](../rhythm/beat-grid-whip-cuts.md): the whips between the macros.
- [`crash-zoom-punch`](../camera/crash-zoom-punch.md): the fast version of the push.
- [`cursor-flyover`](../camera/cursor-flyover.md), [`collab-cursor-moves`](collab-cursor-moves.md).
- Sound: [`tick`](../sfx/tick.md) for the click, [`ding`](../sfx/ding.md) for the result.

## Reference implementation
- [`macro-measured-press/Main.tsx`](../../../src/demo/interaction/accent-ripple-chain/Main.tsx): `Macro` and its three uses in the `Tvc` shot table
