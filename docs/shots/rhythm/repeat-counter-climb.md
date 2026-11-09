---
name: repeat-counter-climb
summary: The same message repeats faster and faster while a big "×n" counter ticks up with a pulse on every hit, and a red rim closes in until the count turns red.
use: The cost beat of a pain-point film: showing that a chore happens again and again (explaining, redoing, re-reviewing) before the breaking point or the reveal.
length: 180-240f (6-8 s); 8 hits in the original
energy: medium, building to high
tags: rhythm, counter, repetition, tension, pain-point, promo
source: shorts-kit/knowns-tvc
---
# repeat-counter-climb

## Intent
Repetition is boring to watch and maddening to live; this shot makes the viewer feel the second part. The
gaps between hits shrink, so the pace itself is the complaint. The counter turns the feeling into a number the
viewer can read on mute. The number is illustration, not a statistic: say so in the brief.

## Motion core
- Hits are scene frames with shrinking gaps: `HITS = [14, 62, 102, 136, 164, 188, 208, 224]`
  (gaps 48, 40, 34, 28, 24, 20, 16).
- Counter: `n = HITS.filter(s => f >= s).length`. The number snaps; it does not count up between hits.
  On each hit it pulses: `scale = 1 + 0.1·exp(-(f - lastHit)/4)`, origin 50% 40%. At `n >= 6` it turns red.
- Message stack: one continuous value `cont = Σ ramp(f, s, 10, easeOut)` over all hits. Message `i` sits at
  `slot = cont - 1 - i` rows above the bottom of a clipped column; each new hit slides the whole stack up one row
  in 10f. Rows 172 design px, column drawn at 1/1.3 and scaled 1.3. Only slots -1 to 3.6 are drawn; opacity fades
  `1 → 0` over slots 0 to 3.2, so old copies dim as they rise.
- Tension: a red radial vignette (`rgba(255,45,45,0.55)`, ellipse 75% 60%) fades in from frame 110 to the scene end,
  peak opacity 0.5.
- Sound: one cue per hit, alternating two samples (`pop`, `tick`), volume stepping down linearly 0.4 → 0.18, so the
  hits get quieter while they get faster. It reads as numbness, not as a louder alarm.

### Variant: two counters (knowns-tvc-v4 `cost`)
Two cards side by side, "Times you explained it" and "Reviews redone", with their own hit lists
(`[22, 56, 82, 102, 118, 130]` and `[70, 98, 120, 138]`). Pulse 0.08; when a list is complete its card gets a red
1px ring and the number turns red. The number is the real Knowns UI `NumberTicker` given `key={n}` so each value
mounts fresh (see [`docs/promo/real-ui.md`](../../promo/real-ui.md)). The rim is a red radial "heat" 0 → 0.35 from
frame 40. Source: [`scatter-pull-graph/scenes.tsx`](../../../src/demo/effects/wrong-build-stamp/scenes.tsx) (`Count`, `Cost`).

## Parameters
| Parameter | Typical value | Feel when changed |
|---|---|---|
| First gap / last gap | 48f / 16f | Equal gaps read as a list, not a climb. A last gap under 12f blurs into one stream |
| Number of hits | 8 (one counter), 4-6 (two counters) | Fewer than 5 does not feel like "again and again"; more than 10 drags past 8 s |
| Pulse | +10% (big counter), +8% (card), decay constant 4f | Over 15% it wobbles; a decay over 8f overlaps the next hit at the end of the climb |
| Stack slide | 10f, ease-out | Must be shorter than the last gap (16f) or rows pile on top of each other |
| Red switch | at hit 6 of 8 | Earlier and the red has nowhere to go; at the last hit it is missed |
| Vignette | from frame 110, peak 0.5 | Above 0.6 the message text near the rim goes muddy |
| SFX volume | 0.4 → 0.18, two samples alternating | One sample repeated becomes a metronome |

## Known traps
- Do not interpolate the counter between hits: a rolling number reads as a timer, not as "one more time".
- The stack must be driven by one continuous sum of ramps, not by `n`, or each new row jumps instead of sliding.
- Clip the column (`overflow: hidden`) and cull slots outside -1..3.6, or faded copies pile up off-frame.
- A component counter (`NumberTicker`) animates on its own; key it by value and keep its animation off.
- Cue the sound from the same `HITS` array as the picture (`Video.tsx`), never from separate frame numbers.
- Determinism: everything is a function of `f` and the constant hit list.

## Pairs with
- [chroma-word-slam](../effects/chroma-word-slam.md): the breaking point right after the last hit.
- [voice-word-relay](../typography/voice-word-relay.md) for the spoken "Explain. Review. Redo." above the counters.
- [list-stack-press](../ui-entrance/list-stack-press.md) for a heavier, physical stack.
- [rhythm-interrupt-moves](rhythm-interrupt-moves.md) to break the climb.

## Reference implementation
- [`repeat-counter-climb/scenes.tsx`](../../../src/demo/rhythm/repeat-counter-climb/scenes.tsx) (`Again`, `Counter`)
- [`repeat-counter-climb/Video.tsx`](../../../src/demo/effects/chroma-word-slam/Video.tsx) (the falling-volume cue table)
