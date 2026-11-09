---
name: timeline-travel
summary: Timeline pan: the camera accelerates along a horizontal tick axis past version ticks, a card springs up and holds briefly at each tick it passes, and it brakes hard and pushes in on the last tick
use: Changelog/milestone/history sections (another way to shoot "we keep shipping"). How it differs from scroll-brake-moves: that card is a vertical list hard brake, this card is horizontal time travel
length: 4–5s
energy: medium-high (an accelerate→hard brake rhythm shot)
tags: camera
---

## Intent
Shoot the product's version history as a trip along the timeline (as in the opening titles of the film *The Kingdom*, 2007): the camera makes a three-stage variable-speed horizontal pan, slow start → sprint → hard brake, with the v1.0/v2.0/v3.0 ticks sweeping past in turn, and each time a tick is passed its card springs up from the tick line. History flashes by outside the window and the camera brakes on "today" and pushes in. The speed itself says "fast development" and the hard stop says "now is what matters most".

## Action phases
| Phase | Frame range reference | Content |
|------|------|------|
| 1 Rest | f0–12 | Empty axis + the first tick held in place |
| 2 Accelerating sweep | ~f12–100 | World layer translateX with segmented easing: slow start → sprint → hard brake over the last 12% |
| 3 Card pop | during the sweep | The card starts popping 6f before the camera sweeps over the tick (spring damping ~11 with clear overshoot), standing up with scaleY from its bottom edge as the axis |
| 4 Hard stop and push-in | 10f from the stop frame | scale 1→1.28 pushing in on the last tick (out cubic), followed by a still ≥30f |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Speed curve | input breakpoints [0,0.15,0.88,1]→ output [0,0.055,0.9,1] | If the middle isn't fast enough there is no "travel feel"; constant speed all the way is a cheap slideshow |
| Pop timing | pops 6f before the camera reaches the tick, looked up backward from camXAt | Popping only after arrival means the viewer has already missed it; much too early reads as a preview |
| Tick density | 3–5 major ticks + a number of minor tick dots | The minor tick dots are the reference objects for the feeling of speed; delete them and you can't feel the speed |
| Hard-stop push-in | 1→1.28 / 10f | Without a push-in the hard stop is just "stopped"; the push-in is what makes it "arrived" |

## Known traps
- The demo was tuned on grayscale/placeholder footage. The parameters are a starting point for tuning, not final production values; the first real use must be re-verified with real footage
- When the mid-section sprint is fast enough to blur the cards, CameraMotionBlur can be added (wrapping only the fast section, round #8 precedent)
- Budget the stillness after the hard stop up front: the demo's first version had only 25f of stillness, which fell short, and it took moving the stop frame earlier to get enough. When laying out the timeline, first reserve ≥30f for the last section and then work the travel backward
- Each popped card is an information slot: in real use put a real screenshot of the version highlight / one line of text there, and keep the sweep speed such that at least the last two cards can be read (same origin as Q6)
- Sound: a light hit on every pop, one impact for the hard stop (same origin as S2)

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`timeline-travel/TimelineTravel.tsx`](../../../src/demo/data/timeline-travel/TimelineTravel.tsx)

