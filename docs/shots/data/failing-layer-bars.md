---
name: failing-layer-bars
summary: Three coloured bars, one per safety layer, slide in from the left one after another, then each fails in its own way: one goes dark, one cracks in two along a jagged line, one is boxed in red with a badge carrying the wrong number.
use: Explaining that an accident needed several defences to fail (the Swiss cheese idea), or any list of safeguards where each broke differently.
length: about 2 s for three layers (60 frames: entrances 16 apart, failures 12 apart); hold for the voice
energy: medium
tags: layers, safety, failure, crack, cross-out, list, cascade, argument
source: makevideo/lab-3d
---
# failing-layer-bars

## Intent
"It was not one mistake" is an abstract claim. Showing each layer fail with its own look
makes the viewer feel that these were three different kinds of failure: a silent one (the
display went dark), a broken rule (the bar snaps), and a check that ran with a wrong input (the
bar is crossed and wears the bad number). It differs from [list-reveal](../ui-entrance/list-reveal.md)
(items arriving) and [screens-go-dark](screens-go-dark.md) (identical failures in a row): each
bar here fails differently.

## Motion core
- Entrance: bar `i` starts at `from + i * stagger`; `inP` 0 → 1 over 12 frames moves it
  `translateX((inP - 1) * 700)` px and fades it in.
- Failure: `f` 0 → 1 over 10 frames from the bar's own `failAt`.
- `dark`: the fill goes from `rgb(30,120,110)` to `rgb(8,15,15)` and the label from white to 0.2.
- `snap`: the bar is drawn twice, clipped by two complementary jagged polygons
  (`56% 0, 50% 25%, 58% 50%, 51% 75%, 56% 100%`). The left half moves `-14, +3` px and turns
  -2 deg around its left edge, the right half `+14, -3` px and +3 deg around its right edge; a
  6 px red polyline traces the crack.
- `cross`: a 5 px red border and a dark wash (`0.45 * f`) cover the bar, with either a red X
  badge or a text badge (40 px, the wrong number) on the right.
- Bars 120 px tall, 34 px apart, label 36 px uppercase.

## Parameters
| Parameter | Typical value | Feel when changed |
|---|---|---|
| Stagger | 16 frames | under 8 the stack lands as one block; over 24 the list drags |
| Entrance | 12 frames, from 700 px left | a shorter slide reads as a fade |
| `failAt` | lab: 22, 34, 46 (12 apart) | tie each to the word that names the failure; equal gaps feel like a cascade |
| Failure draw | 10 frames | instant is a cut; slower softens the break |
| Snap offset | ±14 px, -2 / +3 deg | under 6 px the crack is not seen; over 30 px the bar falls apart |
| Dark target | rgb(8,15,15), label at 0.2 | full black loses the label; the viewer should still read which layer died |
| Badge | 40 px, e.g. "1,77" | the badge links this layer to the number in the ledger |
| Size | 774 px wide at x 153, 120 px bars | three bars use about 460 px of height |

## Known traps
- Three is the right count. Four or more and the different failure styles start repeating.
- The `snap` bar renders the label twice; any change to the label must stay identical in both.
- Bars slide in from 700 px left of their place; at x 153 that is off-frame, which is intended.
  Moving the panel right changes where they enter.
- The colours are props (`ok`, `bad`): in lab-3d `#2C7C8A` and `#FF5A4D`. The `dark` bar ignores
  `ok` and uses its own teal start colour.
- Pure function of the frame: all motion is `interpolate`, no state.

## Pairs with
- [claim-strike-card](../ui-entrance/claim-strike-card.md): the claim the layers argue against.
- [wrong-right-ledger](wrong-right-ledger.md): the badge number comes from the ledger.
- [screens-go-dark](screens-go-dark.md): the `dark` layer shown in full.
- [drop](../sfx/drop.md) on each failure, low level.

## Reference implementation
- [`failing-layer-bars/LayerBars.tsx`](../../../src/demo/data/failing-layer-bars/LayerBars.tsx)
- [`failing-layer-bars/Parts.tsx`](../../../src/demo/data/failing-layer-bars/Parts.tsx)
