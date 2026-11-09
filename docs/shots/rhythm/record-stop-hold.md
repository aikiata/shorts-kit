---
name: record-stop-hold
summary: The last frame of a fast montage freezes, drains of colour, blurs and sinks while the music brakes to silence; one word ("Or...") lands on the held frame, and the music comes back on the drop.
use: the hinge between the problem and the product: stop the pain montage dead, give one beat of near silence, then let the turn hit on the downbeat
length: about 41 frames (1.36 s): 9 frames of drain, about 21 frames of held word, the drop at frame 30
energy: low inside a high section (the contrast is the energy)
tags: record-stop, freeze, brake, silence, drop, turn, pain-point
source: knowns-ui/launch-tvc
---
# record-stop-hold

## Intent
A montage that is all cuts has no edge until it stops. This shot is the stop. The last
picture (the day counter at 30) is held, loses its colour, speed and focus, and is gone
before the word lands, so there is no ghost behind it. The music does the same: a record-stop
sound, a brake to zero, and a full second with only the voice. Then the drop.

It is not black. A black frame would read as the end of the film or as a separate title card
(compare the black in [`trailer-bumper`](trailer-bumper.md), which is a breath at the start).
Here the old picture fades out under the new word, on a dim stage with a soft warm glow.

## Motion core
- Held frame: the last cut is re-rendered at a fixed frame (`DayCounterView frame={20}`), so
  it is truly frozen, not a slow drift.
- One progress `stop = 0 to 1` over 9 frames (`f(0.3)`), ease-out quad, drives everything:
  `opacity 1 - stop`, `saturate(1 - stop)`, `blur(stop * 14 px)`, `brightness(1 - 0.6 * stop)`,
  `scale(1 - 0.05 * stop) scaleY(1 - 0.04 * stop)`. The small vertical squash is the
  "tape slowing down" feel.
- The word "Or..." arrives at 0.28 s with the kit's word spring (rise 24 px, unblur 8 px,
  scale 0.94 to 1), 230 px, centred.
- Music volume: `interpolate(frame, [STOP_AT, STOP_AT + 0.3 s, DROP - 0.04 s, DROP], [1, 0, 0, 1])`.
  The stop starts on a beat (`cb(18)` = 9.04 s), exactly 1 s before the drop (10.04 s).
- The spoken word is cut short to fit: its voice segment starts at `STOP_AT + 0.28` s, the
  same moment the word appears.

## Parameters
| Parameter | Typical value | Feel when changed |
|---|---|---|
| Drain | 9 frames, ease-out quad | under 5 frames it reads as a hard cut; over 15 it reads as a slow fade |
| Blur at the end | 14 px | less leaves readable digits behind the word |
| Squash | scale -5%, scaleY -4% | none: a plain fade; more: a cartoon |
| Word at | 0.28 s (8 frames) after the stop starts | before the drain ends, the two pictures fight |
| Silence | about 0.7 s of zero music, between the brake and the drop | under 0.4 s the stop is not felt; over 1.2 s the viewer thinks the film broke |
| Stop to drop | 1 s (2 beats at 120 BPM) | the drop must land on a measured kick (S5) |
| Record-stop sound | volume 0.5 x 0.6, 24 frames | longer smears into the silence |

## Known traps
- Never black (the source marks it so). Pure black between the problem and the drop reads as
  the end of the film. Keep the dim stage and its glow.
- The next shot (the drop) starts 0.35 s early and fades in over 8 frames on top of the held
  word, so the turn never passes through an empty frame.
- The held frame must be gone before the word lands, or a ghost "30" sits behind "Or...".
- Pin the stop to a beat and the drop to the measured kick of the chosen track (S2, S5). A
  different track means re-measuring; the drop here was moved from 12.9 s to 10.04 s when the
  track changed (S3).
- The music brake must be in the volume curve, not only in the sound effect, or the bed keeps
  playing under the record-stop.
- R1: the word is the only thing on screen. Do not add the product name here; it belongs to the drop.

## Pairs with
- [`slop-punch-montage`](slop-punch-montage.md): the montage it stops.
- [`shatter-drop-reveal`](../transition/shatter-drop-reveal.md): what the drop turns into.
- [`speed-ramp-freeze`](speed-ramp-freeze.md): a freeze used to annotate, not to stop the film.
- Sound: [`drop`](../sfx/drop.md) is a different job (a plan fails); use a record-stop sample here.

## Reference implementation
- [`record-stop-hold/Problem.tsx`](../../../src/demo/rhythm/record-stop-hold/Problem.tsx): `RecordStop`, `DayCounterView`, `STOP_AT`
- [`record-stop-hold/Main.tsx`](../../../src/demo/interaction/accent-ripple-chain/Main.tsx): the music brake (`musicVol_` in `Tvc`), the voice and sound tables
