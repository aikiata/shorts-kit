---
name: speed-ramp-freeze
summary: A rhythm technique using a non-linear remap of the frame number: freeze annotation (flow → freeze and circle → unfreeze)
use: In a card flow / long pan, "stop and let people look" at one key point; tutorial explanation, review contexts
length: whole freeze annotation 158f (≈5.3s, freeze segment 67f ≥45f)
energy: medium-high (the speed contrast itself is the energy beat)
---

## Intent
A constant-speed flow reads as a PPT (R2), and a fast flow throughout leaves the viewer unable to grasp the key point (R3). Freeze annotation simply stops inside one
move: circle the key point with a marker, then move on. The technical root is a frame number remap (the slope is the rate),
and the semantics are "stop the lesson and mark the key point".

## Motion core
- The source animation is constant speed, and the output frames apply a non-linear remap to source frames (the slope is the rate): flow segment slope 1 (26px/source frame) →
  freeze segment slope 0 → unfreeze segment smootherstep; **blur is linked to rate**: a directional blur is applied from the actual speed after the remap
  (Polish SpeedBlur, no filter mounted when |v|<8px/f), and the freeze segment renders bare; CameraMotionBlur multi-sampling tints the
  page texture, so this card does not use it
- The freeze segment slope =0 (instant switch, no ease-in: the freeze must be crisp); the freeze frame gives the "pause pressed"
  signal: shutter white flash 3f, viewfinder corners of the whole frame pop in, the timecode switches from running LIVE to PAUSED and stops;
  an accent-color marker superellipse circles in one stroke, 10f of stroke drawing (stroke-dashoffset, 1.08 turns, the pen-lift not closing) around the target +
  arrow shaft 6f + arrowhead 3f to make the point, feTurbulence (scale≈6) gives the hand-drawn tremor, followed by a line of 68px bold annotation +
  hand-drawn underline + signature; the unfreeze segment smootherstep (ease-in start) takes 22f to travel one card,
  with an average slope >1 to compensate the duration, the ink fades out in 8f, but a comment pin is left on the target card's corner and leaves the scene with the card
- The target card is aligned to the screen center and "picked up" (lifted + enlarged 3–5% + deeper shadow), the other cards dim / desaturate;
  at a card width of 600px the 2x card texture is downsampled, so any one of them is sharp (the object stared at / circled must be sharp and centered)

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| freeze duration | ≥45f | Shorter and the gaze doesn't hold (R3, better slow than fast) |
| unfreeze compensation | smootherstep 22f to travel one card (average slope >1) | Too slow an unfreeze drags the whole piece; without compensation the time eaten by the freeze reads as dead air |
| circling stroke | drawn in 10f + tremor scale 6 | Too slow looks like a loading animation; no tremor looks like a mechanical annotation |
| pause signal | shutter white flash 3f + viewfinder corners + timecode PAUSED | Without a signal the viewer can't tell a "freeze" from a "stall" |

## Known traps
- SFX frame pins follow the **output frame**, not the source frame (the on-screen action happens on the output timeline);
  foley slot: the freeze gets a marker scribble sound (S4); it was not matched when this card was promoted, so add it in production
- A freeze annotation at most 2 times in a 30s piece (restraint principle)
- The parameters were promoted after tuning on placeholder material, not a production final; re-verify after the first production use

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`speed-ramp-freeze/FreezeAnnotateReal.tsx`](../../../src/demo/rhythm/speed-ramp-freeze/FreezeAnnotateReal.tsx)

