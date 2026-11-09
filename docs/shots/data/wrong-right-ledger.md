---
name: wrong-right-ledger
summary: A two-column ledger shows the same calculation done wrong (left, red heading) and right (right, green heading) row by row; one number waits as a pulsing "?", and at the flagged row the wrong value turns red and is struck through while the right one turns green.
use: Any "where did the numbers part" story: a wrong unit, a wrong factor, a skipped step. The viewer follows both calculations at once and sees the exact row where they split.
length: 4 s as a single shot (120 frames); up to 13-16 s when rows are tied to the voice and the ledger is split across shots
energy: low
tags: ledger, calculation, comparison, strike-through, reveal, numbers, voice-synced
source: makevideo/gimli-glider
---
# wrong-right-ledger

## Intent
A spoken calculation is impossible to follow by ear. The ledger writes it down, one step per
row, in two columns that share every row label, so the eye compares across instead of
remembering. The beat is the flag: the wrong cell is crossed out at the moment the voice
names the error. It differs from [before-after-slider-scrub](before-after-slider-scrub.md)
(one image, two states) and [chart-live-moves](chart-live-moves.md) (shapes of data): this is
arithmetic, step by step.

## Motion core
- Header (`✕ wrong` in `bad`, `✓ right` in `good`, 32 px uppercase) fades in over 10 frames at `from`.
- Row `i` appears at `r.at` or `from + 12 + i * stagger`: opacity 0 → 1 and a 14 px rise over 10 frames.
- Each row: a 30 px label with a mono `01`, `02` index, then two cells (expression 30 px,
  value 60 px tabular figures, unit 30 px).
- Pending cell (`revealAt`): the row is there, but the cell shows a pulsing 84 px "?" with
  `pulse = 0.55 + 0.45 * sin(frame / 4)` on both the glyph and the border, until the voice says
  the number. `hidden` shows an empty box instead (a slot for an answer not given yet).
- Flag (`flag: true`): at `flagAt` (default 12 frames after the row) `flagP` goes 0 → 1 over
  10 frames. The strike bar (5 px) grows across the wrong value; past `flagP > 0.5` the wrong
  value turns `bad` and the right value turns `good`; both borders take their tint.
- One clock across segments: in gimli rows are placed by their absolute word time minus the
  segment start, so a segment that starts late shows earlier rows already in place.

## Parameters
| Parameter | Typical value | Feel when changed |
|---|---|---|
| Stagger | 24 (default), 20 in lab-3d | under 12 the rows arrive as a block; over 40 each row is a separate beat |
| Row entrance | 10 frames, 14 px rise | a bigger rise reads as a list animation, not a ledger |
| Flag delay | 12 frames after the row, or tied to a word (`flagAt: r(9, "pound")`) | right on the word is the punch; before the voice explains, it confuses |
| Flag draw | 10 frames | instant is a cut; over 20 the viewer waits for it |
| "?" pulse | `0.55 + 0.45 * sin(frame / 4)` (about 1.2 s period) | faster reads as an alarm; static reads as a typo |
| Row height | 210 px (default), 200 in gimli, 160 compact | below about 150 the 30 px text no longer fits |
| Panel | left 48, width 850 (ends at x 898, 29 px before the button rail at 927); gimli 153 / 774 | wider runs under the right-hand buttons |
| Rows | 3 (gimli), 4 (lab) | 4 rows of 210 px end at y about 1450; more and it reaches the caption band |
| Colours | bad `#FF5A4D`, good `#5BD68A` | keep the same pair through the whole video |

## Known traps
- The component prints `LEDGER TOO TALL` in magenta when the last row passes
  `SAFE_BOTTOM - 150`. Do not ship a frame with it; drop a row or use `compact`.
- Smallest text is 30 px (`LEDGER_MIN_PX`), about 10 px on a phone. Do not go lower to fit more.
- Time rows from voice anchors (`frameAtWord(line, word)`), which throw if a word is gone, so a
  rewritten script fails loudly instead of drifting.
- When the ledger is split by other shots, keep one clock (absolute word frame minus segment
  start), or a row will re-animate after the cut.
- Keep `expr` short and mono-friendly; a long expression wraps out of the 30 px line.
- Every frame is a pure function of the frame number: the pulse uses `sin(frame)`, no timers.

## Pairs with
- [claim-strike-card](../ui-entrance/claim-strike-card.md): the same red strike, at claim level.
- [tank-level-compare](tank-level-compare.md): show what the wrong number means physically.
- [chase-rig-follow](../camera/chase-rig-follow.md): a 3D interlude between ledger segments.
- [ding](../sfx/ding.md) on the right value turning green.

## Reference implementation
- [`wrong-right-ledger/FuelLedger.tsx`](../../../src/demo/data/wrong-right-ledger/FuelLedger.tsx)
- [`wrong-right-ledger/overlays.tsx`](../../../src/demo/data/wrong-right-ledger/overlays.tsx)
