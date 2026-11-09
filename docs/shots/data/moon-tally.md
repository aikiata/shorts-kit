---
name: moon-tally
summary: A row of 15 empty moon circles sits at the top of the frame for the whole video; each one fills from dim to bright as a month passes, and a label under it reads "MOON 7"
use: Counting long survival or waiting time in a unit the subject would have used (moons, winters, harvests, tides); a story where the length of time is the claim and a date would be cold
length: the whole video as a persistent HUD; each shot moves it 0 to 7 units over 90 % of the shot
energy: low (a slow fill; the hook is the speed change when months fly by)
tags: counter, tally, hud, time, moons, months, progress, survival
source: makevideo/alvarenga
---
# moon-tally

## Intent
"He drifted for 14 months" is a number the viewer forgets. A row of moons that fills one by
one is a clock the viewer watches. Empty circles show from the first frame, so the viewer
knows how long the story will be before it is told. The fill is continuous, not a step, so
the passing of time is felt even in shots where nothing happens. When the story jumps
(three moons in one line, then seven), the speed of the fill is the edit.

## Motion core
- **Count per shot:** `moons: [a, b]` in the shot table. The live value is
  `a + (b - a) · ease(t)` with `Easing.inOut(cubic)` over `[0, duration · 0.9]`.
- **Per circle fill:** `lit = clamp(count - i, 0, 1)`, so the circle being "lived" fills
  gradually. Background `rgba(244,241,228, 0.08 + 0.92 · lit)`, a 2 px border at 0.55, and a
  14 px glow only when `lit > 0.9`.
- **Geometry:** 15 circles of 38 px, 12 px gap (738 px total), centred at `SAFE_TOP + 112`.
- **Label:** `n = floor(count + 0.001)`; "MOON n" (30 px, weight 800, letter-spacing 4), or the
  unit name when n is 0.
- **One instance, drawn above the scene layer.** The tally is rendered once at the top level,
  not inside each shot, so it never doubles during the 12-frame shot crossfade. It fades in over
  the first 15 frames of the video and stays full (15) on the closing globe shots.
- **The world agrees with the count:** shells on the hull grow with it
  (`round(moons · 10)` shells), and the small moon in the sky is full brightness on night shots where the count moves (0.85 otherwise).

## Parameters
| Parameter | Typical value | How it feels when changed |
|---|---|---|
| Units | 15 | Up to ~20 fit at 38 px on 1080 width; past that, wrap or switch to a number |
| Advance window | `duration · 0.9`, in-out cubic | Linear looks mechanical; 1.0 lands the fill on the cut, which reads as a glitch |
| Units per shot | 0-1 in most shots, 3-7 in the time-jump shots | A sudden 3-unit fill after slow shots is the "months went by" beat; using it often kills it |
| Dim fill | 0.08 alpha + 0.55 border | Below 0.05 the empty slots vanish and the viewer loses the total |
| Glow threshold | `lit > 0.9` | Glowing the partial circle too makes the row look all lit |
| Label floor epsilon | `+ 0.001` | Without it a count of 3.0 computed as 2.9999 shows "MOON 2" |

## Known traps
- **Floating point at whole numbers:** an eased value can land on `2.9999`; add the epsilon
  before `floor` and cap with `Math.min(15, ...)`.
- **Render it once.** If the tally lives inside each shot it is drawn twice during a
  crossfade and the partial circle shows two fill levels.
- **The total must be a fact.** 15 circles means "about 15 months" is the verified claim;
  the empty row is a promise to the viewer.
- **Keep it in the top band** under the watermark and above the caption zone; it is HUD, not
  content.
- **Determinism:** the count is a pure function of the frame and the shot table, so stills and
  out-of-order renders agree.

## Pairs with
- [`gauge-readout-moves`](../data/gauge-readout-moves.md): another persistent readout
- [`timeline-travel`](../data/timeline-travel.md): a time axis when dates matter more than duration
- [`two-clock-route`](../data/two-clock-route.md): the same "time keeps running" idea on a map

## Reference implementation
- [`waterline-split/Alvarenga.tsx`](../../../src/demo/camera/waterline-split/Alvarenga.tsx) (`Moons`, `moonsAt`, and the top-level render in `Alvarenga`; the file is shared with the `waterline-split` card)
- [`waterline-split/shots.ts`](../../../src/demo/camera/waterline-split/shots.ts) (the `moons: [a, b]` column)
