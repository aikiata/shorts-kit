---
name: brand-frame-snap
summary: A brand-color frame grammar. A thick solid-color frame grows to wrap the full screen before the content, and the screen-recording window drops into it. On a mode switch, the whole frame hard-flips color on one frame and the layout inside the window changes on the same frame. One borderColor does three jobs: chapter navigation, status signal, brand exposure.
use: The packaging layer of a whole two-mode or two-chapter product film (blue = mode A, green = mode B as color coding); branding wrapper for real screen-recording footage
length: one color flip ~4.7s (140f); the frame itself can stay on screen for the whole film
energy: medium (high at the flip instant, a quiet packaging layer the rest of the time)
tags: transition
---

## Intent
A real screen recording filling the screen has no brand presence, and a logo watermark looks cheap. This card
"mounts" the recording with a thick brand-color frame. The frame **appears before the content** (frame first, then the picture,
for a sense of ritual). After that the frame color becomes the semantic code of the whole film. In the demo, cobalt blue = Design and
orange-red = Dev Mode (the original used blue/green; what matters is opposing hues plus a lightness difference). At a chapter switch the whole frame hard-flips color within one frame, with no gradient. A hard color cut is the visual equivalent of a
"gear shift" sound. The layout inside the window switches A→B on the same frame, and the corner tag and badge change text in sync. Three things resonating on the same frame
make the "mode switch" land. Division of labor with theme-switch-moves: that card swaps the skin of the UI itself
(with a sweeping boundary), while this card swaps the "frame" packaging layer (same frame, no boundary).
The meaning is a mode/chapter switch, not a theme switch.

## Motion core
- The frame is 4 solid color bands (not the border property). Thickness grows 0→60px with snappy over 19f
  (a visible frame by frame 2). The opening has 22px rounded corners (corner fill blocks added), and the bands carry a thin glaze, bright on top and dark at the bottom. The flip = changing background on one frame, so the frame is deterministic.
- The product window (1560×864, native pixel layout) uses spring(damping 15, stiffness 115)
  to drop in from 660px below + 18° forward tilt→0 + scale 0.88→1 into the frame (from frame 10, mid-growth of the frame).
  The drop gets vertical motion blur by speed, and the shadow tightens from 70→22 as it lowers.
- Motivation: the cursor slides along an arc over 56–80f toward the Design | Dev switch in the title bar, presses at 80, releases at 84 = the flip frame.
- Four things on the flip frame, all on the same frame: frame color change + layout inside the window hard-cuts A→B (right column light inspector→dark
  CSS panel, left column layers→tokens, blue selection box→orange annotation) + frame band corner tag changes text
  (DESIGN→DEV MODE, the shorts-kit wordmark stays at top right, using the single-color white mark on the band) + switch state.
- At the flip, add 3 frames of radial white flash (starts at 0.6, stepped decay, brightest on the frame bands) + a damped bounce of the frame thickness
  (exp(-0.24t)·cos(0.95t)·12px) + a ~1% hitch in the content, for a "gear shift" impact.
  Aftermath: annotation lines draw in staggered by 3f, value capsules pop out with overshoot.

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Frame thickness | 60px (1080p), corner tag 30px bold all caps | Too thin reads as an outline and the corner tag cannot hold a readable size; above 64px it starts eating the content area |
| Frame growth | 19f snappy, 10f before the window | The frame must be there first: content first and frame after reads as a patch |
| Window landing | spring(damping 15, stiffness 115), y 660→0 + rotateX 18°→0 + scale 0.88→1 | Landing "inside the frame" is the semantic key; the landing point must be fully inside the frame bands |
| Flip moment | demo 84f (the cursor release frame); hold a beat (≥30f after the window settles) then flip | If you flip before the window has settled, the viewer has not yet learned the code "blue = current mode" |
| White flash pulse | 3f, 0.6→0.2 stepped, radial (brightest at the frame bands) | Helps the eye register "this frame changed"; above 4f it reads as a base-color strobe and steals the flip's moment |
| Thickness bounce | exp-decay cos, initial amplitude 12px | A pure hard cut is a bit dry; the bounce is the mechanical feedback of "the gear clicking in" |

## Known traps
- The demo was tuned with a hand-built design tool window (the frame band corner tag is the shorts-kit mark + wordmark, and the canvas shows a shorts-kit promo card). The parameters are a tuning starting point, not a final production setting.
  On first real use, re-verify against real footage.
- The flip must be truly on the same frame: if the frame, the layout inside the window and the corner tag text are off by even 2f, the "gear shift" falls apart into three small animations.
- Keep the color code across the whole film: no green main UI elements in a blue-frame section. Once the code is diluted, the flip is just a color change.
- The frame is a packaging layer, not the lead: at most 2 flips in the whole film. More than that reads as a neon sign (P4 restraint principle).
- The brand colors of the two modes need enough contrast (the demo uses cobalt blue #2F55FF / orange-red #FF5B1F, opposing hues plus a lightness difference). Flipping between neighboring colors of the same lightness is the same as not flipping.
- Keep the UI inside the window in neutral ink colors, and let the accent color follow the mode only (the selected state in the blue section is blue, the annotations in the orange section are orange). Otherwise the UI's own colors dilute the code.
- Sound: pin a crisp mechanical click/gear-shift sound on the flip frame, with the white flash on the same frame as the sound. The frame growth stage can stay silent.

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`brand-frame-snap/BrandFrameSnap.tsx`](../../../src/demo/effects/brand-frame-snap/BrandFrameSnap.tsx)

