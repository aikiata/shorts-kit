---
name: glow-flyline-moves
summary: Three dark-stage moves with light orbs and fly lines: glow-orb-ambient (orb background noise), flyline-arc (fly line connection), orb-flyline-relay (same-frame resonance combo).
use: Atmosphere and data narrative for the one dark-stage section of a film. Use A to lay a background texture, B to show data flow direction, C when the background should answer the foreground. Linear website flavor.
length: A 170f (~5.7s) / B 140f (~4.7s) / C 165f (5.5s)
energy: A low (background-noise level) / B medium / C medium-high
tags: data
---

## Intent
This is the first card in the library that lives entirely on a **dark stage**. Read the "white base makes brightening invisible" precedent the other way around:
to play with light, go to a dark stage first. A is the breathing of space: three big light orbs drift organically on a dark base, swimming behind a central
frosted-glass card, with their color tinting the card face through the glass, and the card edge glows as the nearest orb approaches.
The background is no longer dead. B is the verb of data: a glowing arc "shoots" from card A to card B,
a bright head leads with a fading light tail, the landing outline pulses on, and metric links get a direction for the first time. C welds A+B: on the fly line landing frame, the nearby orb surges brighter for one beat on the same frame,
so the ambient layer and the event layer **resonate on the same frame**, answering each other instead of each playing alone (the key to the combo: if you pull the resonance frame apart,
it degrades into two cards placed side by side).

## Choosing among the three
| Variant | How | Use |
|----|------|------|
| A glow-orb-ambient | Three orbs of 760–1200px made of multi-stop radial gradients (screen blend, no real-time blur), with dual-sine drift. A central 1100×600 frosted-glass card (backdrop blur + saturation boost) lets the orbs show through. The card edge glow is driven by the max of orb distances weighted [240,760]px→[1,0], plus a directional rim light toward the dominant orb. | Background for a dark-stage section; card breathing feel |
| B flyline-arc | Dark-stage dashboard dimmed as the base. A hand-written bezier from card center to card center is sampled at 100 segments and grows over 22f out-cubic. A light head + comet tail are mounted conditionally to lead, segment opacity fades by distance from the head and evens out 10f after arrival. The start anchor lights up and the landing node stays on. The landing card outline pulses with a shock ring, and it can relay on. | Data flow direction / metric links; dashboard narrative |
| C orb-flyline-relay | A+B welded: three glass nodes each get an orb behind them. The orb surge and node lighting share the landing frame constant. The orb brightens to 1+1.6×surge and scales up 12%, rising over 5f and dissipating over 15f. After the fly line arrives it dissipates into a thin dotted line. | Highlight section on a dark stage; closing with a three-stop relay |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| A orbs | Tide cyan / deep sea blue / coral, peak 0.55/0.5/0.42; drift amplitude 280–300px, periods 96–150f crossed and unequal | Same-period drift reads as the whole thing swaying, not "organic" |
| A glass card | backdrop blur 44px + saturate 1.5; no ancestor may have filter / opacity<1 | When an ancestor becomes the backdrop root, the orbs cannot be seen in the glass (put the entrance fade on the glass layer itself) |
| A card edge glow | box-shadow 0→90px in the dominant orb color 0.32 + 1.5px directional gradient rim light | Without the glow, the orbs and the card do not know each other |
| A settle | 115–145f out-sine settle then freeze (amplitude 60/π, start slope = 1 so velocity is continuous), truly still for the last 25f | A hard stop on one frame reads as a freeze; only an eased settle gives true stillness |
| B line body | Dark-stage version (demo): white core 3.5px butt segments + two indigo glow layers of 7px/18px; light-base version: white line 4.5px + 9px dark underlay | On a light base a white line with no underlay simply vanishes (precedent); round caps on the segments stack into a bead string in the fading tail |
| B light head | White dot r7 + r40 halo + 9-point comet tail, mounted conditionally during growth only | Opacity at 0 does not count as unmounting, so it is never truly still |
| B pulse | Outline spreads out-cubic over 6f / dissipates over 12f to a residual 0.25; dark-stage version brightens (accent outline + outer glow + very faint card face brightening) + 14f shock ring; fully still after f86 | No brightening on a white base: the light-base version uses a darkening overlay of 0.16 instead |
| C resonance | The surge starts on the landing frame itself (same constant LIT_B / LIT_C); node rises to 1 in 8f + outline pulse residual 0.35 + 20f shock ring | Off by more than 2f and the resonance does not read as "answering" |
| C timeline | Actions end before f98, orbs settle and freeze over 110–140f, truly still for the last 25f | The ambient layer freezes last, the event layer finishes first |

## Known traps
- The demo was tuned on grayscale/placeholder footage. The parameters are a tuning starting point, not a final production setting.
  On first real use, re-verify against real footage.
- Switching between a dark section and a paper-and-ink light main look is costly. At most 1 dark section per film. Use the
  hidden-cut family from shot-transitions as padding to go in and out. Do not hard-cut between dark and light.
- The end of the orb drift **must** settle to stillness with easing before the freeze. Constant-speed drift clamped directly
  is a visible emergency stop (precedent: the A variant's out-sine settle).
- Production brand-color version: use a brand color pair for the orbs (for example blue and purple). The grayscale parameters only guarantee the lightness relationship,
  so the hue contrast must be retuned.
- With 3 or more B relay lines, switch to C: fly lines fired in a row read as a big-screen template, and resonance is what gives it an author's touch.
- Sound: B/C get one light tick on each landing, A is silent (sound-design §4.5)

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`glow-flyline-moves/FlylineArc.tsx`](../../../src/demo/effects/glow-flyline-moves/FlylineArc.tsx)
- [`glow-flyline-moves/GlowOrbAmbient.tsx`](../../../src/demo/effects/glow-flyline-moves/GlowOrbAmbient.tsx)
- [`glow-flyline-moves/OrbFlylineRelay.tsx`](../../../src/demo/effects/glow-flyline-moves/OrbFlylineRelay.tsx)

