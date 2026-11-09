---
name: face-blur-mask
summary: A real person stays readable as a figure but never as a face: a feathered ellipse of blur rides on the face through stills and moving clips, while red marks point at the mouth corners or eyes the voice is talking about
use: Talking about a real, private or sensitive person's face (a deepfake, an uncanny expression, a victim) where the story needs the face on screen but the face must not be shown
length: per shot 45-150f; a push can run straight through two or more shots
energy: low
tags: blur, privacy, face, mask, tracking, b-roll, still, annotation, push-in
source: makevideo/uncanny-valley
---
# face-blur-mask

## Intent
The storyboard rule of the source video is "her face is always blurred". The blur is not a
censor bar: it is a soft ellipse with a feathered edge that moves with the head, so the frame
still reads as a person in a room. The voice then talks about details ("the corners of her
mouth", "her eyes") and the card answers with marks drawn where those details are, never by
showing them.

## Motion core
- **Face region as fractions.** `Blob = {x, y, rx, ry}` in 0..1 of the frame. The mask is
  `radial-gradient(ellipse rx% ry% at x% y%, #000 58%, transparent 100%)`, so the inner 58% is
  fully blurred and the edge feathers out.
- **Clips**: a full-frame `backdrop-filter: blur(px)` layer carries that mask, on top of the
  `OffthreadVideo`. Default blur 26 px (18-22 px on smaller faces).
- **Stills**: a second copy of the same image with `filter: blur(30px)` and the mask applied,
  stacked on the sharp image. Same look, no backdrop filter (see traps).
- **Tracking a moving face**: `face` can be a function of clip seconds. `walkFace(sec)`
  interpolates x and y through 7 keyframes (0.1 s to 2.35 s, x 0.83 → 0.39) and shrinks rx 0.24
  → 0.15 as she walks away from the camera. Clip seconds are
  `from + (frame - shot.start) / 30 · rate`, so the track survives a playback rate of 0.55.
- **Stage**: every layer (video, blur, marks) sits inside one transform, `translateY(y)
  scale(s)` around `origin`, so the blur and the marks move with the picture. Close-ups use
  scale 1.75 → 1.95 with y -300 → -330 (lifts the face above the caption band); the closer
  variant 1.9 → 2.35.
- **One push across shots**: `span: [firstShot, lastShot]` computes progress over both shots,
  so the "mouth" and "eyes" lines share one continuous push and the cut between them does not
  jolt. `anchor` does the same for a clip that must keep playing across shots.
- **Marks** (svg in 1080 × 1920 px): mouth corners get a tick and an arrow that extends 0 → 70
  px outward; eyes get dashed rings (`10 8`) growing r 8 → 34. Progress runs from shot frame 4
  to frame 28. `mouth-hot` pulses `0.75 + 0.25 · sin(local / 4)`. An optional vignette closes in
  with progress.
- **Grade per clip**: dark source clips are lifted with `brightness(1.5..2.1) contrast(1.1)
  saturate(0.85)`; a fully blurred clip (`blur(16px)`) becomes a background for a title.

## Parameters
| Parameter | Typical value | How it feels when changed |
|---|---|---|
| Mask core | `#000 58%` → transparent 100% | 80%+ shows a hard-edged disc; under 40% the features leak at the rim |
| Blur on clips | 26 px (18-22 px for small faces) | lower values let features through; check on a still at full size |
| Blur on stills | 30 px | stills are studied longer than clips; keep them blurrier |
| Face ellipse | rx 0.17, ry 0.105 (close still), rx 0.2, ry 0.11 (clip) | size it to the head plus hair line; too tight and the jaw shows on turns |
| Track keys | 7 points over 2.25 s | fewer keys lag behind fast head turns |
| Close-up push | 1.75 → 1.95, y -300 → -330 | the y lift keeps the face above captions; without it the face sits under the text |
| Mark draw | frames 4 → 28 of the shot | must land on the spoken word, not before it |

## Known traps
- **Chrome drops `backdrop-filter` at high zoom.** On a still zoomed past about 1.9×, Chrome
  dropped the backdrop layer and the face showed sharp (caught on two shots, 03/11/2026). Stills
  therefore use a second blurred image with the mask, not a backdrop filter. Check every
  close-up still at its maximum zoom.
- **Blur and marks must live inside the same transform** as the picture, or they drift off the
  face as the camera pushes.
- **Track in clip time, not shot time.** The face function takes seconds in the source clip;
  changing `from` or `rate` without that would desync the blur.
- **Coordinates are per source file.** `STILL_FACE`, `CLIP_FACE`, the mouth and eye points are
  measured on specific images. A new image needs new numbers, checked on a still with the marks
  on.
- **Deterministic**: the pulse and the track are pure functions of the frame. Use
  `OffthreadVideo` with `startFrom` so frames are exact in render.
- **Licences.** Real stills and clips stay the owner's responsibility; blurring a face does not
  make an unlicensed clip usable.

## Pairs with
- [`graph-draw-follow-cam`](../data/graph-draw-follow-cam.md): the blurred face reappears as an inset on the curve (same video).
- [`scan-bracket-sweep`](scan-bracket-sweep.md): another way to point at a detail.
- [`graze-face-tour`](../camera/graze-face-tour.md): camera travel close over a surface.
- [`photo-push-fit`](../camera/photo-push-fit.md): the same slow push on stills, without privacy.

## Reference implementation
- [`face-blur-mask/Face.tsx`](../../../src/demo/effects/face-blur-mask/Face.tsx)
