---
name: list-reveal
summary: A vertical menu of 6 items scales into place one by one at 10f intervals with a soft back overshoot, while the whole list container moves up at constant speed throughout. Per-item entrance and overall drift are two unrelated layers of motion
use: Entrance of navigation / sidebar / settings panels; any UI section where "the interface grows by itself", and also a low-energy bed under narration setup
length: about 4s (120f@30fps)
energy: low (steady beat, no peak; kept alive by the drift)
---

## Intent
Fading a list in item by item is one of the easiest motions to make stiff: each item stops after it moves, and between two items the picture is completely still.
This card's answer is to give the container a slow drift unrelated to the per-item entrance: locally the items are "finding their place", and as a whole the list is "breathing".
The viewer can read every item, and no frame of the picture is pinned dead from start to finish.

## Motion core
- The two layers of motion are fully decoupled: the container's `translateY(DRIFT/2 − DRIFT·f/(N−1))` uses only the global frame and is a constant-speed drift through the whole shot
  (demo: 96px total in 1920 coordinates, +48 → −48, about 0.8px/f); each item uses only its own local window, and neither takes part in the other's computation
- Per-item entrance: start `2 + i·10f`, window 24f. A stagger of 10f is one notch slower than a usual UI stagger: it is the interval of "can be read",
  not the interval of "spreads out quickly". The window is 2.4 times the stagger → 2–3 adjacent items move at once, and the queue flows
- The placement action is led by scale: `scale(0.82 → 1)` with `translateY(44 → 0)` + focus blur 8px → 0,
  and the viewer perceives "from blurry to sharp, growing from small into place", not "flying up from below"
- Soft overshoot `bezier(0.3, 1.18, 0.5, 1)` (~1.5%): the amount is tiny, and its job is to turn the landing frame from a "stop" into a "latch"
- Follow-through: the icon settles 2f later, the right-side shortcut / badge 4f later; opacity `min(1, lin·2.2)`, fully solid by 45% of the travel
- The current item (Home) is the only highlight in the whole shot: a solid porcelain-white bar + one sweep of light after it lands (Q4); the other items are dark graphite surfaces + hairlines

## Parameters (demo in native 1920×1080 coordinates)
| Parameter | Typical value | Feel when tuning |
|------|--------|----------|
| Item count | 6 (Home…Sign out) | The last item starts at 52f and settles at 76f, leaving ~44f at the tail for the viewer to wrap up; over 8 items the stagger must be squeezed or the last item eats into the ending |
| stagger | 10f/item | 10f is "read item by item". Squeezed to 4f it becomes a one-time spread (a different technique), and past 16f the beat falls apart |
| Item window | 24f | A window 2.4 times the stagger → adjacent items overlap; equal to the stagger it becomes hard item-after-item joins |
| Start scale | 0.82 | The scale at which "it can already be recognized as an entry"; under 0.5 it reads as popping from zero and is confused with pop-type techniques |
| Start offset / blur | 44px / 8px | The offset must be smaller than the row pitch (92px row height + 14px gap), or items interpenetrate |
| Overshoot | soft back ~1.5% | Small enough to be barely readable. Switch to a spring or enlarge the overshoot and 6 items shaking in sequence look cheap |
| Container drift | constant speed 96px throughout (about 0.8px/f) | The total is 2 times a single item's offset and the speed is an order of magnitude slower: it reads as "the picture is breathing". When the speed is near the per-item entrance speed, the two layers of motion blur into one thing |
| Opacity slope | `min(1, lin·2.2)` | Dropped to 1 you see half-transparent items laid over the background, especially dirty on a dark scene |

## Known traps
- The container drift is constant speed through the whole shot, and the last frame stops at −48px, not 0. This motion **does not return to rest on the last frame**.
  To loop playback or align positions with the next shot, replace the drift with a settling curve, or add a reverse ease-out at the end
- When the item count changes, recompute the stagger: the last item's start is `2 + (n−1)·10f`, plus the 24f window, and you must leave ≥30f for the ending
- Row width 700px, labels `nowrap`: Chinese or longer English labels hit the right-side shortcut, so widen when changing copy;
  total list height is ~644px, and before adding items compute whether the first and last items still sit in the safe zone after drift (demo drift range y 188–928)
- The drift direction (up) is the same as the per-item offset direction (44px→0, also up). This is deliberate (adding in the same direction is smoother),
  but the two speeds must stay an order of magnitude apart, or it reads as "everything floats up together" and not as two layers
- The right-side title waits until the list is half spread (46f) to enter: the opening gives the list one lead (Q5), otherwise the viewer searches back and forth between two places
- The icons are single-color line icons; only the current item uses a solid highlight, and the unread badge uses the accent color. On a light interface, the stroke and shadow both need retuning

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`list-reveal/ListReveal.tsx`](../../../src/demo/ui-entrance/list-reveal/ListReveal.tsx)

