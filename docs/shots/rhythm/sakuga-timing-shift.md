---
name: sakuga-timing-shift
summary: From on-3s to on-1s. An element first moves in flipbook stutter at one step per 3 frames, then at the climax cuts to a frame-by-frame silky sprint. The frame-rate-quantized abrupt change is itself the attraction.
use: Emphasis displacement of a single element (card entrance, a metric hitting the line); segments that need the contrast from "handmade feel → climax burst"
length: 150f (5s)
energy: medium-high
tags: ui-entrance
---

## Intent
For time-axis manipulation the library already has the freeze-and-unfreeze of speed-ramp-freeze and the local frame stutter of hit-counter.
This card is another kind: **what it changes is not the speed but the frame rate itself**.
In the stutter segment the driving frame is q=floor(f/3)*3, so the element moves one step only every 3 frames (a 10fps flipbook),
and from the switch frame it uses the raw f to drive frame by frame, a silky sprint. The dullness of on-3s and the smoothness of on-1s
cut against each other on the same screen, the beat-count staging of Japanese animation (shooting on 3s / on 1s). The stutter segment
doesn't feel low-grade, it feels handmade, and the switch point is the climax marker.

## Motion core
- Stutter segment: q = Math.floor(f/3)*3 as the driving frame, position linear X 140→1180,
  16 key drawings, each step ≈69px; the pose freezes with q: sin(q) rotate ±5° + alternating squash/stretch
  (0.97/1.035) + a small alternating high-low hop (−18/−2px), every step looking different
- At f48 the switch: two "impact frames" (the frame inverts to an ink background + speed lines focused on the card) as the climax marker,
  then it is driven continuously by the raw f, Easing.out(poly(4)) high-initial-speed sprint doubling back to center + 40px overshoot
  + 6f rebound, landing with scaleX 0.92 / scaleY 1.07 squash
- Motion stretch in the sprint segment is driven by the position-difference velocity (scaleX peak ≈1.3 / scaleY 0.9),
  with 9 horizontal tapered ink speed lines behind it, length ∝ speed, **conditionally mounted**: removed once the speed is low
- The beat-change annotation is synchronized in three places: the corner badge "ON 3s / ON THREES"→"ON 1s / ON ONES" (pop 1.25×,
  the hand-drawn underline is redrawn every 4 frames to boil, frozen after f=108); the "exposure sheet" at the bottom writes a drawing number only every 3 cells for on-3s,
  with a vertical line in the middle cells (= reuse the previous drawing), and for on-1s every cell has a number, so the viewer sees directly how many drawings per second
- Frame: a paper-look animation paper (registration holes, light blue pencil safe frame / crosshair), the subject is a shorts-kit product card with a 5px ink line + hard-edged
  cel-style drop shadow (30fps · every frame, crafted); after f74 a hold segment with a 2% very slow push-in

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| beat count | stutter segment floor(f/3) (on 3s) | /2 lacks stutter, /4 and above reads as the player freezing |
| displacement per step | ≈69px (back-derived from total travel 1040 ÷ 15 steps) | <30px reads as stalling and dropped frames, not stutter: the crux |
| pose between steps | sin(q) rotate ±5° + alternating squash/stretch + alternating high-low hop | A pure-displacement stutter with no pose change looks like a bug, not a flipbook |
| switch frame | f48 (stutter : sprint ≈ 3:2) | The switch must complete in one frame; any tweening ruins the "beat change" feel |
| sprint easing | Easing.out(poly(4)) + 40px overshoot + 6f rebound | The initial speed must be fierce, to maximize the contrast with the stutter segment |
| ending | After landing hold 70f (only a 2% very slow push-in), the badge boil frozen at f108 | Residual boil ruins true stillness (same family as the feTurbulence mask-off precedent) |

## Known traps
- The demo was tuned with a hand-built animation paper + cel-style card. The parameters are a tuning starting point, not a final production setting.
  The first production use must be re-verified on real material
- The impact frame is a full-frame-level impact (R4 count): one shot gets it only once, at the switch point, and only for 2f
- Single time manipulator per shot precedent: it is mutually exclusive with speed-ramp-freeze / hit-counter frame stutter,
  and one shot can have only one thing moving the time axis
- Each step of the stutter segment must move ≥30px for the "stutter" to read; micro-step stutter reads as render frame drops,
  and this is the crux of the card; if the stride is not enough, shorten the total duration to get a bigger stride
- The switch point must have an annotation (corner badge "ON 3s"→"ON 1s", the exposure sheet cells, or a hit sound,
  sound-design §4.5): without an annotation the viewer only feels "it got faster" and cannot read "the beat changed"

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`sakuga-timing-shift/SakugaTimingShift.tsx`](../../../src/demo/rhythm/sakuga-timing-shift/SakugaTimingShift.tsx)

