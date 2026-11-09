---
name: scroll-brake-moves
summary: Two long-scroll hard-brake moves: changelog-scroll-brake (basic: a high-speed long scroll decelerates exponentially and stops precisely + the target lifts) and brake-reticle-lock (combo: reticle corners lock on in the same frame as the brake)
use: Changelog/release history/long-list sections: "we keep shipping, and this one today is the biggest"; use B when the stop point needs a stronger hit
length: A 4–5s / B 5s
energy: high open, medium finish (speed-contrast type)
tags: rhythm
---

## Intent
The grammar of the Linear changelog video: a whole year of update logs sweeps past as a long scroll at high speed (blurred into a color band), brakes exponentially and stops precisely on this release's entry, and that entry lifts off the surface and highlights while the rest dim. The density says "we keep shipping" and the hard stop says "this one today is the biggest". B is a combo variation: on the brake frame, four L-shaped corner marks fly in from off-screen and lock onto the stopped entry on the **same frame**. The "clunk" of the brake and the "click" of the lock resonate on one frame (the combo's crux: the corner marks' takeoff frame = the list's first stopped frame; if they are offset it degrades into two tricks side by side).

## Choosing between the two
| Move | How | Fits |
|----|----|------|
| A changelog-scroll-brake | translateY sweeps ~2400px (cubic-bezier(.45,0,.06,1): reaches full speed in ~5f then a long exponential deceleration tail, 50f in total), a vertical directional blur driven by the frame-to-frame displacement difference (×0.32, capped at 30px, clearing automatically once still); the stop row lifts with scale 1.03 + shadow + a 2px accent-color outline, and the other rows drop to opacity 0.38 | The basic changelog section |
| B brake-reticle-lock | scroll in three segments: sin-in acceleration → cubic-out hard deceleration overshooting by +30px → rebound settle; vertical directional blur = v×0.15 capped at 32px; the corner marks fly in from ±620/±320 off-screen with Easing.back(2.4) and lock on, the highlight completes within 6f, and the label pops out with back(2.6) | A highlight section where the stop point needs a stronger hit |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Deceleration curve | A fast start + a long deceleration tail (bezier .45,0,.06,1); B adds "overshoot by 30px and rebound" | Constant-speed scrolling reads as a marquee; B's overshoot rebound is the source of the "clunk" |
| Blur drive | frame-to-frame displacement difference `|p(f)-p(f-1)|` × a coefficient | Hand-placed blur keyframes can't match the speed; the difference method is frame-deterministic (the pattern has been settled into assets/lib/helpers/motion.ts velocityAt) |
| Row height rhythm | 72/94/116, three tiers mixed | With equal-height rows the color band has no rhythm at high speed |
| Stop position | the target row stops at the vertical center of the frame | A stop off-center reads as an accident |
| B resonance frame | the corner marks' mount/takeoff frame = the first frame the list stops (strictly the same frame) | The combo's crux: off by more than 2f and it falls apart |

## Known traps
- The demo was tuned on grayscale/placeholder footage. The parameters are a starting point for tuning, not final production values; the first real use must be re-verified with real footage
- How it differs from timeline-travel: this card brakes a vertical list to stop on the "latest", while that card travels along a horizontal timeline to see the "history". When both are used in the same video, put them in sequence apart and each at most once
- In the high-speed section the entry content doesn't need real readable text, since it blurs into a color band anyway and gray placeholder blocks will do; the stop-point entry must have publication-grade real content (Q10)
- Dimming the other rows to 0.38 after the stop is a composition move: don't dim them to 0 (the context disappears)
- Sound: a low-frequency riser as setup in the high-speed section, one impact for the hard brake; on B's lock frame stack one more "click" (on the same frame as the impact but a different voice)

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`scroll-brake-moves/BrakeReticleLock.tsx`](../../../src/demo/data/scroll-brake-moves/BrakeReticleLock.tsx)
- [`scroll-brake-moves/ChangelogScrollBrake.tsx`](../../../src/demo/data/scroll-brake-moves/ChangelogScrollBrake.tsx)

