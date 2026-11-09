---
name: slam-entrance-moves
summary: Three high-energy slam entrances: kanada-perspective-snap (Kanada-style perspective abrupt stop), score-slam (score slam-down), impact-burst-kit (landing impact kit that ripples to neighboring cards).
use: A heavy-punch entrance for a lead card / KPI card. impact-feedback handles the feedback after landing, this card is for when the entrance itself is the impact.
energy: high
length: one variant's action stretch 6–22f + impact aftermath ~16f + hold ≥45f (demo: A 120f / B 135f / C 140f)
tags: ui-entrance
---

## Intent
The ceiling of force in the library's entrance vocabulary has been the "deal" of deck-deal-flyin: fast but not heavy.
This card adds the "slam" tier in three flavors. A is about direction: the card is flung in against the
camera with fisheye-level exaggerated perspective and "snaps" flat, the swagger of the anime Kanada school. B is about weight: a KPI card
slams down from 2.6 times its size in front of the camera, and the ring + dust + screen shake kit goes off on the same frame, with the
weight of a sports score popup. C is about transmission: on top of B's kit, when the front of the shockwave sweeps the left and right neighboring cards it
visibly pushes them away and they bounce back, "this hit shook the neighbors", saying how strong it is in one beat.
Choose by narrative need: to tell the viewer "it's coming" use A, "it's heavy" use B, "it shook the
whole room" use C.

## Choosing among the three
| Variant | How | Use |
|----|------|------|
| A kanada-perspective-snap | perspective 260→1800px + rotate3d 62°→0 + scale 1.8→1 flung in over 18f (pose settles later than position), over the last 5f an overshoot of +6° springs flat + speed lines, long diagonal shadow straightens | A single card's swaggering reveal; anime / light tone |
| B score-slam | The card slams down from in front of the camera at scale 2.6 / rotate 5° over six frames ease-in(quad); on the landing frame the shock ring + debris sparks + screen shake + white flash fire on the same frame, and the score digits land a second time 3/6f later | Heavy number entrances such as a KPI/score |
| C impact-burst-kit | The main card slams from in front of the camera into an empty slot on the page + B's kit + the shockwave front sweeps neighbor cards on frames computed from radius-distance, neighbors are pushed out 34px + rotate ±3.5° and bounce back with damping | "Whole-room shake" when the page already has neighbors |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| A fling-in | 18f: translateX −1350→0 with EASE.snappy (abrupt stop); perspective/twist/scale follow the late-settling curve bezier(.62,0,.3,1) 16f, so the card rushes in "twisted" and only flattens in the last few frames. Horizontal SpeedBlur by x speed (0.2× speed, ≤26px) + 7 speed lines behind it | Faster than 12f and the fisheye distortion cannot be read, slower than 24f and the punch leaks away; if pose and position settle on the same curve at the same time, it is already flat a few frames before arrival and the fisheye feel is gone after the first frame |
| A settle | rotateY overshoots to +6° over 15–20f, from 20f spring(damping 16) back to 0 + 8px screen shake for 2f + 48 speed lines retreat outward over 9f + diagonal long shadow straightens; text inside the card settles 3f later (title −10° skew straightens) | The "snap" is in the overshoot rebound, not where the movement ends; speed lines longer than 10f read as an effect sticker |
| B slam | 0–9f hangs in front of the camera (2.75→2.6, 10px blur, semi-transparent so the background shows) → 9–15f ease-in(quad) slam to 0.965 → spring(damping 14) back to 1 | An ease-out landing is "putting down", only ease-in is "slamming" |
| B kit | Shock ring diameter 120→1500px/16f (white core 9→1.5px + gold soft glow) + 14 polygon glass/gold-foil fragments flying 280–580px (+16 sparks) + screen shake 18px exponential decay over 5f (mostly vertical) + 2f white flash | The original proposal (720px / 10px dust / 8px shake) was imperceptible at every level, real renders went ×1.5–2; solid black thick rings / black square dust read as "stickers" |
| B decoupling, the key | The ring/dust "spread" uses out-cubic and the "dissipation" uses linear frame time | If both use out-cubic, the first part runs too fast and it fades just after spreading |
| C ripple frames | Solve back from the distance the front reaches the neighbor center (ring radius 100→1100/16f, 514px distance ≈ 3f after landing); envelope cos(t/2)·e^(−t/8), hard-clamped to 0 at 40f; horizontal smear by speed at the instant of the push | If the neighbor moves on the same frame as the main card it reads as the whole page shaking; 3f later is "being rippled" |
| C hover and charge | 0–16f the main card hangs above the empty slot: lifts 20px, scale 1.55→1.6 (smooth), the contact shadow in the slot firms up with height, then 16–22f ease-in(cubic) slams into the slot | A dead stop in the hover reads as "stuck"; a charge amplitude above 30px becomes a different move |
| Depth of field | When B/C are near the camera (large scale), blur by height (B ≤10px, C ≤7px), sharp on landing | Sharp elements near the camera actually fail to read as "slamming down from in front of the camera" |
| Ending | True stillness ≥45f after all aftermath returns to zero | Give a heavy punch twice the usual hold (same as the beat-cut A precedent) |

## Known traps
- The demo was tuned with shorts-kit promo content (A the launch film premiere card / B the finale score "shorts-kit vs Keyframes" / C the Launch film card on the final-cut specs page). The parameters are a tuning starting point, not a final production setting.
  On first real use, re-verify against real footage.
- On a light stage (C) the shock ring needs a white pressure disc underneath and the ring itself in a saturated accent color; on a dark stage (A/B) use a white core + colored glow.
  A white ring on a light base or a black ring on a dark base is almost invisible.
- All three variants have screen shake. Within the shake family (impact-feedback), one shot
  may have only one shake source; among the three variants themselves, one shot may also pick only one.
- Sound is a hard dependency: A's "snap" and B/C's sonic boom must be pinned on the same frame (sound-design §4.5).
  The silent version of B/C's kit reads as "the card is twitching".
- In variant C the neighbor cards must sit on stage and stay stable for ≥15f before being rippled. A neighbor pushed away while still entering
  fails to read the chain of cause and effect.
- At most 2 slams per film. With three or more, if every one is loud, none is loud (P4).

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`slam-entrance-moves/ImpactBurstKit.tsx`](../../../src/demo/effects/slam-entrance-moves/ImpactBurstKit.tsx)
- [`slam-entrance-moves/KanadaPerspectiveSnap.tsx`](../../../src/demo/effects/slam-entrance-moves/KanadaPerspectiveSnap.tsx)
- [`slam-entrance-moves/ScoreSlam.tsx`](../../../src/demo/effects/slam-entrance-moves/ScoreSlam.tsx)

