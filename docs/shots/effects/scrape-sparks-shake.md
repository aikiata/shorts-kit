---
name: scrape-sparks-shake
summary: A body hits the ground and drags: a spray of orange and yellow sparks flickers behind the contact point, a dark scrape mark grows along the ground, grey dust puffs rise and fade, and the camera shakes and settles.
use: The impact beat of a 3D recreation: a nose or belly scraping, a car grinding a rail, anything that touches down hard and slides.
length: shake decays in about 20 frames; sparks run as long as the drag (50-150 frames); each puff lives 34 frames
energy: high
tags: 3d, particles, sparks, impact, camera shake, seeded hash, deterministic
source: makevideo/lab-3d
---
# scrape-sparks-shake

## Intent
The hit has to be felt, not only seen. Three layers do it at once: sparks (the heat), the
scrape mark (the proof it happened, it stays), dust (the weight) and a camera shake that dies
away. All of it is a pure function of the frame, so it renders the same in parallel. It differs
from [impact-feedback](impact-feedback.md), which is a 2D game-style hit frame: this one is
inside the 3D world and lasts for the whole slide.

## Motion core
- Starts at `touchFrame`; nothing renders before it. `age = min(1, (frame - touch) / 5)`: the
  sparks grow in over 5 frames.
- Sparks: 44 boxes (40 in the first version). Each reads a seeded hash
  `hash(n) = fract(sin(n * 127.1) * 43758.5453)` keyed on
  `i * 7.3 + k + floor(frame / 2) * 13.1`. The `floor(frame / 2)` term re-rolls every spark
  every 2 frames: a flicker at 15 Hz, not a smooth flow.
- Each spark: x within ±1.5 m of the contact, height `0.15 + h * 2.2 * h` (most stay low), up to
  12 m behind the contact, scale `age * (0.8 + h)`, box `0.5-1.1 × 0.3 × 1.1` m, colour orange or
  `#FFD27A` by a coin flip, emissive 2.
- Scrape mark: a 1.6 m wide black plane from the touch point to the current contact point, plus
  a 0.35 m grey centre line. It only grows.
- Dust: 14 puffs, one every 2 frames from the touch. Each rises `0.16` m per frame, grows scale
  1.6 → 5.6 and fades opacity 0.55 → 0 over 34 frames, `depthWrite={false}`.
- Shake: `shake(rig, hitFrame, amp, decay)`; amplitude `amp * exp(-(f - hit) / 7)`,
  `dx = sin(f * 12.9898) * a`, `dy = sin(f * 78.233 + 1.7) * a * 0.7`. The target moves 0.4 of
  that, so the frame jolts rather than slides.

## Parameters
| Parameter | Typical value | Feel when changed |
|---|---|---|
| Spark count | 44 | under 20 reads as a few embers; over 80 becomes a fire |
| Re-roll rate | every 2 frames | every frame is a strobe; every 4 frames the sparks look frozen |
| Spark spread | ±1.5 m wide, 12 m long, up to 2.2 m high | a longer trail sells speed; higher sparks read as an explosion |
| Grow-in | 5 frames | instant reads as a cut glitch; slower loses the hit |
| Puff life | 34 frames, one every 2 frames, 14 puffs | longer and the dust hides the subject |
| Shake amp | 1.1 (lab), 1.0 (gimli s21) | 0.5 barely reads at 40 deg fov; 2+ and the label leader whips around |
| Shake decay | 7 frames (time constant) | 4 is a single knock; 12 feels like a rough road |
| Hit frame | lab: frame 26 of a 90-frame shot; gimli: the word "gập" (Vietnamese: "fold") | anchor it to the word, and cue the scrape SFX on the next word |

## Known traps
- No `Math.random`. Use the seeded hash so every frame can be rendered alone and in any order.
- The contact point function `point(f)` must move forward along +Z; the mark is drawn from
  `point(touchFrame)` to `point(frame)` and a negative length is clamped to 0.1 m.
- Wrap the rig with `shake` and pass the shaken rig to the callouts too, or the labels will not
  shake with the picture.
- Puffs are transparent: keep `depthWrite={false}` or they cut holes in each other.
- Effect sits on y ≈ 0: it is a ground effect, not a mid-air one.
- Postprocessing bloom is not available (blank canvas under `ThreeCanvas`), so the glow is just
  emissive 2 on flat-shaded boxes.

## Pairs with
- [chase-rig-follow](../camera/chase-rig-follow.md): the rig to shake.
- [pinned-callout-3d](pinned-callout-3d.md): "nose on the ground" right after the hit.
- [impact-feedback](impact-feedback.md): a 2D hit frame for a punchier, non-3D video.
- [boom](../sfx/boom.md) or a scrape sound on the hit frame.

## Reference implementation
- [`scrape-sparks-shake/NoseScrape.tsx`](../../../src/demo/effects/scrape-sparks-shake/NoseScrape.tsx)
- [`scrape-sparks-shake/rig.ts`](../../../src/demo/camera/chase-rig-follow/rig.ts)
- [`scrape-sparks-shake/Lab3d.tsx`](../../../src/demo/effects/scrape-sparks-shake/Lab3d.tsx)
