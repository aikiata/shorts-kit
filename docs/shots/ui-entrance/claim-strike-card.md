---
name: claim-strike-card
summary: A red-bordered card with what people repeat appears, a down arrow and a green-bordered card with what the source says rise in under it, and a thick red line slashes diagonally through the first card while it dims to half.
use: The turn of a myth-busting story: the popular version against the primary source, at the word that contradicts it.
length: about 7 s held (210 frames); the motion itself is 10 + 10 + 14 frames
energy: medium
tags: claim, myth, source, strike-through, contradiction, card, turn
source: makevideo/gimli-glider
---
# claim-strike-card

## Intent
The strike is the turn. Two claims stacked top to bottom read as "you heard this, the record
says this", and the diagonal slash is the moment the viewer drops the first belief. The
popular card stays visible at half strength, so the viewer still sees what was wrong. It
differs from [title-demote-to-label](../typography/title-demote-to-label.md), which moves a
title away: here the old claim is overruled in place.

## Motion core
- Card A (popular): `a` 0 → 1 over 10 frames from `from`, with an 18 px rise.
- Card B (source) and the arrow between: `b` 0 → 1 over 10 frames from `secondAt`
  (default `from + 14`), same 18 px rise.
- Strike: `k` 0 → 1 over 14 frames from `strikeAt`. An SVG line from bottom-left
  `(24, CARD_H - 30)` to top-right `(width - 24, 30)`, 9 px, round caps, drawn with
  `strokeDashoffset = width * 1.1 * (1 - k)`.
- Card A dims with the strike: opacity `a * (1 - 0.5 * k)`.
- Cards: 215 px tall, 18 px radius, 3 px border in `bad` (A) or `good` (B), kicker 30 px uppercase
  in the border colour, claim 44 px / 54 px line. A 70 px gap with a 40 px down arrow.

## Parameters
| Parameter | Typical value | Feel when changed |
|---|---|---|
| Card entrance | 10 frames, 18 px rise | slower and the two cards read as separate scenes |
| Second card | `from + 14`, or the word "but" (gimli s23: `r(31, "Nhưng")`, Vietnamese "but") | together kills the turn; give the source its own word |
| Strike draw | 14 frames | under 8 it is a flash; over 20 it reads as handwriting |
| Strike timing | on the word that contradicts (gimli: `r(31, "đơn")`, start of "simplified"; lab: frame 34) | before the source card appears it looks like a mistake |
| Strike stroke | 9 px, diagonal across the card | thinner reads as a decoration; horizontal reads as a typo fix |
| Dim | to 0.5 | to 0 hides what was wrong; the viewer should still read it |
| Size | 774 px wide at x 153 (the safe box), claim 44 px | longer claims than about two lines overflow the 215 px card |

## Known traps
- The strike runs to the card's full width at a fixed angle; the card height is fixed at 215 px,
  so a three-line claim spills out under the line. Cut the claim, do not shrink the type.
- The kicker names the source (in gimli the investigation report); the claim card is only as good
  as the fact record behind it.
- Keep the `bad` and `good` colours the same as the ledger's (`#FF5A4D`, `#5BD68A`).
- Pure function of the frame: three `interpolate` calls, no state.

## Pairs with
- [wrong-right-ledger](../data/wrong-right-ledger.md): the same red strike at number level.
- [failing-layer-bars](../data/failing-layer-bars.md): the argument that follows the claim.
- [marker-underline-title](../typography/marker-underline-title.md): a gentler mark for emphasis.
- [boom](../sfx/boom.md) on the strike: it is the turn.

## Reference implementation
- [`claim-strike-card/ClaimCard.tsx`](../../../src/demo/ui-entrance/claim-strike-card/ClaimCard.tsx)
