---
name: chroma-split-settle
summary: A big title cuts in with its red and cyan copies shaking far apart sideways; within about 26 frames they settle onto the white text, then a short 3-frame twitch returns every 40 frames until the shot ends
use: Naming an uneasy or unreal thing (a phenomenon, a creepypasta, a glitch in the world); the one title in a found-footage or analogue-horror short
length: one shot, 60-120f (settle 26f, then twitches every 40f)
energy: medium (hard at the cut, calm with small aftershocks)
tags: glitch, chromatic aberration, rgb split, title, horror, vhs, found footage
source: makevideo/liminal-space
---
# chroma-split-settle

## Intent
The word arrives broken and repairs itself. The red and cyan ghosts start far apart and
converge, so the viewer reads the title in the first second and still feels it is wrong.
The rare later twitches keep the unease alive without making the text unreadable. It differs
from [`glitch-cycle`](../typography/glitch-cycle.md), which scrambles characters through a
cycle of phrases: here the letters never change, only the colour channels move, and there is
one title, not a sequence.

## Motion core
- **Three stacked copies** of the same text block, absolutely positioned on top of each other:
  red `#ff3b3b` shifted `+dx`, cyan `#3bd6ff` shifted `-dx`, both at opacity 0.8 with
  `mix-blend-mode: screen`; the white copy on top with a dark text shadow.
- **Amplitude:** `amp = (1 - settle) · 22 + burst · 10` px, where `settle` ramps 0 → 1 over the
  first 26 frames of the shot.
- **Bursts:** `burst = 1` when `local > 30` and `local % 40 < 3`: a 3-frame twitch every 40
  frames, after the settle.
- **Jitter, deterministic:** `dx = (hash(frame) - 0.5) · 2 · amp`, with
  `hash(n) = fract(sin(n · 127.1 + 311.7) · 43758.5453)`. A new offset each frame, the same
  offset every render.
- **Entrance:** the block fades in with the shared `enter` spring (damping 200); the hard cut
  into the shot, not a crossfade, carries the hit.
- **Companions in the source:** a 4 px yellow rule draws to 460 px over 24 frames from `+12`,
  the translated name enters under it on its spoken word, and the global grade fires a
  9-frame light flash (`0.4 → 0`) on this shot only ([`vhs-grade-flicker`](../effects/vhs-grade-flicker.md)).

## Parameters
| Parameter | Typical value | How it feels when changed |
|---|---|---|
| Start amplitude | 22 px at 128 px type | Above ~30 px the copies read as three words; under 10 px the cut has no hit |
| Settle | 26 f | Under 12f the glitch is missed; above 40f the title is hard to read for too long |
| Burst amplitude | 10 px | Equal to the start amplitude and every burst re-breaks the word |
| Burst period / length | every 40 f, 3 f, from frame 30 | Faster than ~20f reads as a broken render; length over 4f looks like a transition |
| Ghost opacity / blend | 0.8, `screen` | Normal blend on a dark clip turns the ghosts into solid coloured text |
| Type | 128 px, weight 900, line-height 1.05 | Thin weights make the ghosts invisible |

## Known traps
- **Never use `Math.random()` for the jitter:** Remotion renders frames in parallel and out of
  order. Hash the frame number.
- **Enter with a hard cut.** The source keeps a set `HARD` of shots that skip the 12-frame
  crossfade; this title is in it, or the glitch is half-hidden by the dissolve.
- **`screen` needs a dark or mid background.** On a bright clip, the red and cyan wash out;
  darken the clip or put a shade behind the text.
- **The burst rule is `local % 40 < 3`,** tied to the shot's local frame, so a re-timed shot
  keeps the same rhythm from its start.
- **One per video.** A second glitch title makes the first one a style, not an event.

## Pairs with
- [`vhs-grade-flicker`](../effects/vhs-grade-flicker.md): the analogue grade it sits in
- [`impact-feedback`](../effects/impact-feedback.md): variant C uses chromatic aberration for a hit
- [`glitch-cycle`](../typography/glitch-cycle.md): the character-scramble version for status text

## Reference implementation
- [`chroma-split-settle/scenes.tsx`](../../../src/demo/typography/chroma-split-settle/scenes.tsx) (`Ten`, `hash`, `Rule`, `Kicker`)
- [`chroma-split-settle/ink.ts`](../../../src/demo/typography/chroma-split-settle/ink.ts) (palette)
- [`chroma-split-settle/anim.ts`](../../../src/demo/typography/chroma-split-settle/anim.ts) (`enter` spring)
