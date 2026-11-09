# tension-camera

**Job:** the camera feels for the viewer instead of showing. Small movements, heavy
meaning. At most two of these in a film, once each.
**Length:** 5-6 s each (150-170 frames).

## Variants
| Variant | What happens | Use |
|---|---|---|
| A. bullet-time freeze-orbit | a chart is growing; freeze it mid-growth (sparks hang in the air, trails kept), the camera sweeps around the panel in real 3D, then time resumes and it finishes growing | the crowning moment of a key number: "worth stopping time for" |
| B. pull-back isolation | pull back from a glowing hero card; its sibling cards go dark one by one, nearest first; the background sinks to black; one card is left hanging in the dark | the ending: "in the end, only this" |

## Parameters
- **A, two clocks:** the content runs on an "effective" clock (8-frame smooth stop, about
  52 frames frozen, 8-frame resume); the camera runs on real time. During the freeze the
  content must be visibly perfectly still while the camera moves. Hard stop and hard start
  has no bullet-time feel.
- **A, orbit:** perspective about 1800, rotate Y 0 → -52° (26 frames, smooth), drift at the
  apex 12 frames, back to 0 (22 frames, swifter); lift 6° and push in 160 px. 50-55° is the
  least that reads as "seen from the side"; past 70° the panel becomes paper. Give the
  scene depth cues (floor grid, distant points) or it does not read as 3D.
- **A, frozen things:** spark trails and counter blur are computed at the content clock's
  speed, so they keep a "moving" shape: you froze an instant, not a still life.
- **B, pull-back:** scale 2.2 → 0.62 over 110 frames, ease-out cubic, origin locked on the
  hero card. The first 20 frames still fill the frame, so the opening is a close-up with no
  extra hold.
- **B, dimming:** sort siblings by distance; from frame 30, one every 8 frames, each over
  16 frames: opacity to 0, brightness to 0.3, 5 px blur, sink to 0.97. Near to far reads as
  "the world collapses outward"; random order reads as a glitch. Two cold-white box-shadow
  layers fade in on the hero between frames 60 and 100.
- **Hold** at least 30 frames after (B: a true stop for 40+, room for one closing line).

## Known traps
- A is a time manipulation: do not stack it with speed-ramp or freeze-frame in one shot
  (the frame remaps fight).
- B is a full stop; do not follow it with a "group photo" ending (one closes, the other
  opens): pick one.

## Reference implementation

The source demo this card was rewritten from (shorts-kit, kept as reference, not built):

- [`tension-camera-moves/BulletTimeFreezeOrbit.tsx`](../../../src/demo/camera/tension-camera-moves/BulletTimeFreezeOrbit.tsx)
- [`tension-camera-moves/PullBackIsolation.tsx`](../../../src/demo/camera/tension-camera-moves/PullBackIsolation.tsx)
