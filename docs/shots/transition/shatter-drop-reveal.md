---
name: shatter-drop-reveal
summary: On the music's drop the bad screen bursts into six polygon shards that fly out of frame with spin and motion blur, while five real product screens fly in from depth on curved paths and spring into an exploded 3D stack, under a white ring, a violet flash and one light sweep.
use: the turn of a pain-point promo: the moment the problem is destroyed and the product takes its place, on the strongest hit of the track
length: about 70 frames (2.35 s): burst at frame 11, shards gone by frame 35, stack settled by frame 51, then drifting
energy: high (the film's first peak)
tags: drop, turn, reveal, shatter, 3d-stack, exploded-view, flash, ring, light-sweep
source: knowns-ui/launch-tvc
---
# shatter-drop-reveal

## Intent
The film's turn in one beat: what the viewer believed (UI has to look like this) breaks, and
the answer is already standing where it was. The shards carry the old picture out of frame,
fast, so the eye goes to what replaces it. The new picture is the real product: five screens
as one exploded stack, which says "a whole kit" before a word is read. The voice and the type
("Just use Knowns UI.") arrive with it.

It differs from [`fracture`](../opening/fracture.md) (a grid assembling into a poster): here
the break and the build are two different things, the old one leaving and the new one arriving.

## Motion core
- Shards: six copies of the bad screen, each clipped by its own `polygon(...)`. They start
  clustered at the stack's position and travel to far off-frame targets (for example
  `x1 = -1500, y1 = -200`) on `q = ease-out cubic` over 22 frames, rotating `r1 * q * 1.3`
  degrees and scaling from 0.5 to their own size. Blur is `blur * q + (1 - q) * 14` px, so they
  are smeared by speed at the start and by depth at the end. They fade from frame 14 to 24.
- Stack: five real screens (`Plane n`), one `preserve-3d` parent rotated `rotateX(pitch)
  rotateZ(yaw)`. The camera swings round over 1.7 s: yaw -54 to -27 degrees, pitch 63 to 52,
  scale 0.55 to 0.84, then a slow drift (`+0.07` degrees per frame).
- Each plane flies in from `-2600 px` in depth on its own spring (damping 14, stiffness 110,
  mass 0.9), with a sideways arc `sin(pi * sp) * 420 px`, alternating sides, and a 22-degree
  roll that unwinds. Start frames `[0, 1, 11, 12, 26]`: two pairs, then the last one alone.
- Explode amount `p` springs to 1 (damping 16, stiffness 90): plane spacing `235 px * p`.
  Planes breathe on the beat: `1 + 0.06 * max(0, cos(2 pi frame / 14))^3`.
- The burst (frame `f(0.35)` from the shot start): a white ring growing to 560 px over 15
  frames (opacity 0, 1 at frame 4, 0 at 24), a radial violet glow (0.95 at frame 3, gone by 18),
  a flat violet flash (0.5 at frame 3, gone by 14).
- Camera punch on the downbeat: a spring (damping 10, stiffness 200, mass 0.7) adds 10% scale
  with a little overshoot, plus 6% creep over 1.4 s. It is applied to the stack layer only, so
  the type keeps its margin.
- One light sweep: a skewed white-violet band crosses the stack between 0.5 s and 1.15 s.
- The shot fades in over 8 frames on top of the held "Or..." frame, so there is no empty frame.

## Parameters
| Parameter | Typical value | Feel when changed |
|---|---|---|
| Shard flight | 22 frames, ease-out cubic, fade 14 to 24 | slower and the old picture competes with the new; faster and nobody sees it break |
| Shard count | 6, sizes 0.3 to 0.82 | more reads as confetti; fewer as a crack |
| Plane fly-in spring | damping 14, stiffness 110, mass 0.9 | stiffer loses the curved path; softer overshoots into the type |
| Plane stagger | 0, 1, 11, 12, 26 frames | even stagger reads as a list; pairs plus a late one read as R2's acceleration and rest |
| Explode spacing | 235 px per plane | under 150 the stack reads as one card; over 300 the top plane leaves the frame |
| Ring | 0.2 to 1 of 560 px over 15 frames | a ring that outlives the flash steals the eye from the stack |
| Flash | violet, peak 0.5 at frame 3 | white at full strength burns the first frame of the real UI |
| Punch | +10% scale, spring with overshoot | this is one of the film's three whole-frame hits (R4) |

## Known traps
- **Chrome tiling.** CSS filters on layers inside a perspective made Chrome tile the frame. The
  stack planes carry no `filter`; brightness is faked with a white overlay. The ring is a
  radial gradient, not a huge `box-shadow` (that also tiled at large radii).
- Q2: the screens are rendered as live components inside the composition, not as screenshots,
  so they stay sharp under the punch. Depth of field is mood only.
- Q7: the stack gets volume (spacing), an orbit (the yaw sweep) and a dark ground behind it.
- R4: count this shot as a whole-frame hit. Keep the flash, ring and punch on the same frame,
  the measured drop, and let the next hit be at least 16 beats later.
- S1 and S4: one low hit on the drop and nothing stacked on it (the whoosh was removed). A
  shatter on screen can take a real glass sound, but not on top of the hit.
- Determinism: shard paths and rotations are constants in a table, never random.

## Pairs with
- [`record-stop-hold`](../rhythm/record-stop-hold.md): the frame it breaks.
- [`slop-punch-montage`](../rhythm/slop-punch-montage.md): where the shards come from.
- [`space-camera`](../camera/space-camera.md): the exploded-view camera it borrows.
- [`impact-feedback`](../effects/impact-feedback.md), [`white-flash-logo-simplify-cut`](white-flash-logo-simplify-cut.md).
- Sound: [`boom`](../sfx/boom.md) on the drop.

## Reference implementation
- [`shatter-drop-reveal/Main.tsx`](../../../src/demo/interaction/accent-ripple-chain/Main.tsx): `SnapScene`, `Shards`, `SHARDS`, `Stack`, `Ring`
- [`shatter-drop-reveal/tvc.tsx`](../../../src/demo/rhythm/slop-punch-montage/tvc.tsx): `SlopScreen`, `Plane`, `Stage`, `Finish`; `Snap` and `Exploded` are the earlier style frames of the same shot
