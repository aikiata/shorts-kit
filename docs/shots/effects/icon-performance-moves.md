---
name: icon-performance-moves
summary: Icon performance. In attention-bounce, an icon asks for attention with a bounce (consecutive bounces that grow, a squash on landing, the camera drawn toward it).
use: Half-screen icon close-up sections; introducing a new feature
length: 156f (5.2s)
energy: building anticipation
tags: interaction
---

## Intent
The first batch of icon animation in the library. The icon is a performer the camera shoots up close, not a
micro-interaction in a corner of the UI. attention-bounce uses the macOS Dock vocabulary: the shorts-kit
app icon in the Dock bounces in place 4 times, each higher than the last (0.35→1.2 times the icon height), squashing on each landing
(last bounce width 1.2x height 0.8x) with a ripple splash. Neighboring icons gradually lose focus, and on the highest bounce the camera pushes toward it
by 8% (drawn in). After it settles, the "New in shorts-kit" feature panel pops open, cutting "user attention"
into the narrative.

## How
| Variant | How | Use |
|----|------|------|
| A attention-bounce | Projectile bounce (duration ∝ √height) with growing height + speed stretch in the air + 2f squash on landing + ripple splash. Neighbors rack-focus out of focus, the camera pushes in to scale 1.08 on the peak bounce, and on settle a corner tag + panel spring open. | Introducing a new feature: "look at me" → camera looks at it → it opens a panel |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Icon size | 360–400px tall (half-screen close-up; demo icon 360) | Nobody sees a small corner icon performing: the performer must take the center position |
| Growing bounces | 4 bounces 0.35→0.6→0.85→1.2 times icon height, in the air 14/18/22/26f (∝ √height) | Equal-height bounces read as loading; growth is "getting louder"; duration not following height reads as weightless |
| Landing squash | Contact 2f, squash amount 0.1→0.2 growing (last bounce width 1.2x height 0.8x), damped cosine to settle after the last bounce | No squash means no weight |
| Camera push-in | Last bounce 72–90f smooth push of 8%; neighbors 30–96f defocus to 7px, desaturate 30% | The camera move acts out the viewer's perspective of "being drawn in" |

## Known traps
- The demo was tuned on grayscale/placeholder footage. The parameters are a tuning starting point, not a final production setting.
  On first real use, re-verify against real footage.
- bell-swing-alert (a swinging bell) from the same batch was dropped with no note: hanging, swinging icons
  seem a poor fit for performance. For a new icon performance, prefer bounce/burst types.
- The first version left the frame (the highest point of the last bounce pushed out the top). Work out the bounce height and the headroom in pixels first
  (demo: ground 960, icon 360, last bounce apex 168px, about 119px after the 8% push-in).
- Sound: a "duk" on each landing with rising pitch, and a light "ding" when the panel pops out

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`icon-performance-moves/AttentionBounce.tsx`](../../../src/demo/effects/icon-performance-moves/AttentionBounce.tsx)

