---
name: accent-ripple-chain
summary: A wall of six real components recolours four times on four consecutive beats; each time a bright ring grows from the centre and everything inside it, including the character, already wears the new accent colour, while a label at the top shows the one variable changing.
use: prove a theming claim ("one variable recolours everything") by showing it, as a rhythmic run near the end of a promo
length: about 87 frames (2.9 s): four ripples of 15 frames, one per beat, then a short hold
energy: medium-high
tags: theme, accent, css-variable, ripple, clip-path, ring, beat-sync, real-ui, recolour
source: knowns-ui/launch-tvc
---
# accent-ripple-chain

## Intent
"Change one variable and the whole kit follows" is a claim; this shot is the proof (C4: the
same picture before and after). The wall stays still and only the colour moves, so the eye
reads the change, not a new scene. Four ripples in a row turn the proof into a beat: green,
pink, orange, sky. The `--kn-accent: #34d399` label names the cause on screen (C5).

It is the chained, beat-locked cousin of the palette ripple in
[`theme-switch-moves`](theme-switch-moves.md), which is one ripple from a shrinking panel.

## Motion core
- The wall: six real components (a chart and five product screens) at scale 0.52 in a 3x2
  grid, the side columns turned `rotateY(16deg)` and `-16deg` toward the centre. Every one of
  them reads the same CSS variable `--kn-accent`.
- Ripples at `beat(28)`, `beat(29)`, `beat(30)`, `beat(31)`: radius
  `min(1, (t - at) / 0.5) ^ 0.7 * 1150` px, so each ripple fills the 1920x1080 frame in 0.5 s
  (one beat), fast at the start and slowing at the edge.
- Only two walls are drawn at any time: the base wall in the colour the last ripple left, and
  the new-colour wall clipped by `clip-path: circle(r at centre)`. When a ripple is complete,
  the base wall takes its colour and the clipped one is dropped.
- The wavefront: a `Ring` drawn as a radial gradient (transparent inside, a soft 140 px
  falloff, a 4 px bright edge), removed once `r` passes 1140.
- The character in the middle is a pre-rendered frame sequence, hue-rotated to each accent
  from a table (`GREEN: -85deg`, `PINK: 85deg`, `ORANGE: 140deg`, `SKY: -35deg`) with
  `saturate(1.35)` and a glow in the accent colour.
- The whole scene creeps 1 to 1.05 over 4 s.
- One soft click per ripple, on the beat.

## Parameters
| Parameter | Typical value | Feel when changed |
|---|---|---|
| Ripple length | 0.5 s (one beat) | longer than a beat and the next ripple starts before this one fills |
| Radius curve | power 0.7 to 1150 px | linear looks mechanical; a stronger ease leaves the corners last for too long |
| Ripple count | 4 | 2 does not read as "any colour"; more than 4 becomes a disco |
| Ring falloff | 140 px soft, 4 px bright edge | a hard ring reads as a wipe, not a wave |
| Side tilt | rotateY plus and minus 16 degrees | flat reads as a slide; more hides the side cards' text |
| Click volume | 0.6 x 0.6, 15 frames | louder becomes a game beep (S1) |
| Last ripple | back to the brand colour, revealing the lockup | see [`ring-reveal-lockup`](../outro/ring-reveal-lockup.md) |

## Known traps
- **Draw two walls, never five.** Stacking one clipped wall per ripple (five walls of 3D
  planes) made Chrome tile the frame. Keep only the base wall and the current ripple.
- **No huge box-shadow ring.** A ring made with a large `box-shadow` also tiled the frame at
  large radii. Draw it as a radial gradient.
- The colour must come from the real variable, not a CSS filter on a picture. A gallery frame
  that pins its own accent inline needs an override (`!important` from a wrapper variable), or
  some components stay violet.
- A hue-rotated character keeps its shading, but check skin-like or white areas on each hue.
- R4: four ripples on four beats is a beat-pump run of 4: the maximum, used once. Only the
  colour moves; the frame does not pulse.
- Determinism: the radius is a function of film time from the shot's start; nothing is timed
  with real clocks.

## Pairs with
- [`ring-reveal-lockup`](../outro/ring-reveal-lockup.md): the fifth ring reveals the end card.
- [`theme-switch-moves`](theme-switch-moves.md): the single-ripple and sweep variants.
- [`circle-match-iris`](../transition/circle-match-iris.md): a circular reveal used as a seam.
- Sound: [`tick`](../sfx/tick.md) per ripple.

## Reference implementation
- [`accent-ripple-chain/Main.tsx`](../../../src/demo/interaction/accent-ripple-chain/Main.tsx): `WaveScene`, `Wall`, `Ring`, `WAVES`, `DEG`
