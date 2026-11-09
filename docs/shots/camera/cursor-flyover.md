# cursor-flyover

**Job:** a feature tour in one continuous shot. From a wide overview the camera flies to four
areas in turn, a cursor arrives first and clicks, the interface reacts, then the camera
pulls back to the overview. The cursor is the viewer's attention made visible.
**Length:** about 8 s (240 frames): overview 22, four stops of 44 (flight 20 + stay 24),
pull-back 24, hold 18. **Energy:** medium, paced by the clicks.

## Intent
Replaces "four features, four cuts" with one camera that links four corners into a route,
so the viewer also remembers where things are relative to each other.

## Parameters
| Part | Typical | Feel |
|---|---|---|
| World | the real layout, drawn at 1:1 on a big canvas (2400×1500); overview scale 0.66, close-up 1.3 | pick the close-up scale so the text you want read is at least 40 px on screen; past 1.6 modules leave the frame |
| Camera | a step table: overview → four module centres; x, y, scale each interpolated with an asymmetric in-out (bezier 0.55, 0, 0.18, 1: crisp start, soft landing); on each hop pull the scale out about 8% and back | editing the table changes the route; visit neighbours in order, a diagonal jump makes people dizzy |
| Cursor | **hand before eye:** it moves first (swift 16 frames on a slight arc perpendicular to the move), the camera starts 2 frames later and settles in 20; the cursor "aims" for a beat, then clicks (22 frames after it starts); press shrinks to 0.84 then overshoots back; drawn in screen space at a constant 40 px | lead 0 = the cursor is dragged by the camera (looks like a screen recording); lead over 10 frames = the viewer watches the cursor and then hunts for the picture |
| Click | a ring ripple, 80 px, 18 frames, scale 0.3 → 1.5 and fading; four clicks evenly 44 frames apart | the ripple is the metronome; put a click sound on each |
| Responses | every click lands on a real control and the UI answers (a segmented control slides, a tooltip pops with overshoot, a switch springs, a row tints and a tick draws itself) | |
| Close | smooth 24-frame pull-back to the overview so all four states sit in one frame, then a 1% creep in | without it the shot just stops on the last module |

## Known traps
- Targets are positions of real controls: re-mark them on the real picture; use a capture
  with native resolution of at least 1.3× the close-up scale.
- The camera table is in world pixels; a different aspect ratio (9:16) means re-marking the
  whole table.
- Cursor and camera each have their own table; change their start and arrival frames as a
  pair, or the camera is still moving at the click and the UI response is eaten by blur.
- Motion blur: above about 0.12 amount on a bright UI it reads as out of focus, not as speed.

## Reference implementation

The source demo this card was rewritten from (shorts-kit, kept as reference, not built):

- [`cursor-flyover/CursorFlyover.tsx`](../../../src/demo/camera/cursor-flyover/CursorFlyover.tsx)
