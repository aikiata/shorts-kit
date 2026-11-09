---
name: chroma-word-slam
summary: One huge red word drops from 3.4x onto a black frame in 5 frames, splits into cyan and red copies that snap back together, shakes, flashes red, and the music cuts to silence.
use: The breaking point of a pain-point film, once per film: the beat after the repetition, just before the product appears.
length: 60f (2 s, 4 beats at 120 BPM)
energy: high
tags: effects, slam, chromatic-split, impact, silence, promo
source: shorts-kit/knowns-tvc
---
# chroma-word-slam

## Intent
After a climb of repetition the film needs one moment where the pressure breaks. A single word ("AGAIN.") fills
the frame, the screen hits, and then nothing: no music, a dim word, a held breath. The silence is half of the
shot; the reveal that follows sounds bigger because of it. Use it once. It is the film's only full-frame hit.

## Motion core
All frames are scene-local; the scene is 60f on a near-black background `#07090d`.
- Fall: `scale = interpolate(f, [0, 5], [3.4, 1], ease-in cubic)`. Accelerating, so it lands hard on frame 5.
- Chromatic split (`ChromaText`): three copies of the word, no blend modes. Cyan `#19d3ff` shifted `+split`,
  red `#ff2d55` shifted `-split`, both at opacity 0.85, then the base colour on top. `split = 26`px during the fall,
  then `16·exp(-(f-5)/6)`: it snaps most of the way on landing and settles over about 18f.
- Shake on landing: `12·exp(-(f-5)/2)·sin(2.7·f)` px on x, dry by about frame 12.
- Shiver after frame 18: `2·sin(1.57·f)` px on x and y, so the held word is never a dead still.
- Dim: opacity 1 → 0.3 from frame 20 to the end.
- Wash (`Wash`): a full-frame red `#ff2d3a` at opacity 0.6 on frame 0, ease-out to 0 over 16f.
- Sound: one `boom` at 0.5 on frame 0, and the music is silenced from the start of this scene to the start of the
  next (`musicSilence` in `Video.tsx`).
- Type: 262px, weight 900, tracking `-size/30`, one line, centred near y 800 in a 1080x1920 frame.

## Parameters
| Parameter | Typical value | Feel when changed |
|---|---|---|
| Start scale | 3.4 | Under 2.5 it is a zoom, not a drop; over 4 the first frames are only colour |
| Fall | 5f, ease-in cubic | Ease-out makes it float in; over 8f the hit softens |
| Split in fall / after landing | 26px / 16px decaying, constant 6f | No split and it is a plain slam; a split that does not decay reads as a broken render |
| Shake | 12px, decay 2f, `sin(2.7f)` | Over 20px the word leaves the safe panel; a slower decay feels like an earthquake, not a hit |
| Wash | 0.6 peak, 16f | Over 0.8 it whites out the word on the first frames |
| Dim | to 0.3 from frame 20 | Without it the held word competes with the reveal that follows |
| Silence | the whole scene | Leaving music under it removes the breath; the cut back to music must be on the next scene's first frame |

## Known traps
- Three stacked copies, not `mix-blend-mode`: blend modes render differently between Chrome versions and on
  transparent layers. The copies are cheap and exact.
- The word must fit at scale 1 inside the safe panel; check the still at the landing frame and at frame 0
  (it is cropped at 3.4x, which is fine, but the split copies must not show a seam at the frame edge).
- Shake and shiver use `Math.sin(f · k)`: deterministic. Never `Math.random()` for shake.
- Keep it to one per film. A second slam halves both.
- The sound cue and the silence window must both be pinned to the scene's start (`frameAtScene`), never to a bare
  frame, or a re-timed scene list breaks them.

## Pairs with
- [repeat-counter-climb](../rhythm/repeat-counter-climb.md) right before it.
- [impact-feedback](impact-feedback.md) (its anime-impact variant) for a heavier hit frame;
  [riso-print-hits](riso-print-hits.md) for the paper-and-ink version of the split.
- [crash-zoom-punch](../camera/crash-zoom-punch.md) on the product reveal after the silence.
- Sound card [boom](../sfx/boom.md).

## Reference implementation
- [`chroma-word-slam/scenes.tsx`](../../../src/demo/effects/chroma-word-slam/scenes.tsx) (`Slam`)
- [`chroma-word-slam/fx.tsx`](../../../src/demo/effects/chroma-word-slam/fx.tsx) (`ChromaText`, `Wash`, `Vignette`)
- [`chroma-word-slam/Video.tsx`](../../../src/demo/effects/chroma-word-slam/Video.tsx) (`musicSilence`, the boom cue)
