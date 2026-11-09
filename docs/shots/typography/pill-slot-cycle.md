---
name: pill-slot-cycle
summary: Mid-sentence word slot cycling. The fixed sentence stem is pinned and never moves, and the pill badge at the end of the sentence rolls one notch like a slot machine every ~0.7s (the old one flies up, accelerating and fading out; the new one slides in from below with blur). After N feature words in a row, the full sentence lands and closes
use: The most elegant solution for "feature list" copy (faster than a list, more semantic than character-level rolling); a one-sentence selling point + a paragraph of multiple verb phrases
length: entrance 12f + 21f per beat × word count + 14f close + hold; 6 words about 6.7s (demo 200f, including a 48f full-sentence hold)
energy: medium (a steady metronome, no peak)
---

## Intent
To list six features, a list needs six rows, and fading in one by one takes six beats and fills the screen. Word slot cycling
packs them into **one slot of one sentence**: the stem "One skill to ___" (the demo is about shorts-kit: Storyboard it → Capture the page →
Move the camera → Cut on the beat → Design the sound → Render the film) is the promise, every pill
rolling through the slot is evidence, and finally the last pill flies away and "do it all." lands: the evidence
list is complete and the conclusion is stamped. The structure has three acts built in: promise → list → close. The crux is that the stem is
**absolutely still**: the viewer's eyes stay pinned on the slot throughout, and if the stem wobbles the sense of a list falls apart.

## Motion core
- The stem is absolutely positioned and its left end is anchored. **Do not use flex centering**: a change in pill width would drag
  the stem into re-laying out (a trap stepped in on the first round, now a precedent)
- Each beat is 21f (~0.7s): the first 8f complete the swap, the last 13f are at rest. The rest is for the viewer to
  read the word; a beat that cannot be read in full is the same as no change
- Entrance: translateY 120→0 + blur 14→4→0, Easing.out(cubic);
  exit: translateY 0→-130 + blur 0→10, Easing.in(cubic), flying out with acceleration.
  The newcomer decelerates and settles, the old one accelerates and escapes, giving a direction like "turning a page upward"
- Inside the slot, an invisible placeholder pill (visibility hidden) props up the width, and the new and old pills are absolutely positioned
  and stacked: the slot width changes naturally with the current word without jitter
- Closing beat: the last pill flies up (7f ease-in), and "do it all." comes from 90px below with
  Easing.back(1.4) overshoot into place. This is the only overshoot in the piece, saved for the conclusion; after it lands the whole line centers slowly with smooth over 26f
  (during the listing the stem stays anchored on the left, and moves only once the conclusion sentence is complete), and between "to do" the spacing returns to a normal word gap

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Beat length | 21f/word, 5–7 words | <16f and the phrase cannot be read in full; >28f and the metronome feel falls apart; at 8+ words the viewer starts counting |
| Swap window | first 8f of the beat | Stretching it to 12f+ keeps old and new on screen together too long and reads as two pills fighting |
| Flight distance | in +120 / out -130px | <80px reads as a flash swap in place; asymmetry between in and out (out slightly farther) makes the exit more decisive |
| Motion blur | in ≤14 / out ≤12px vertical blur, computed from true speed (zero when still); in rotateX -38°→0, out 0→34° flipping around the drum | Remove the blur and the swap reads as a hard pop; >20px and the middle frames smear into a color block |
| Closing overshoot | Easing.back(1.4), 14f | >2 and the conclusion lands like a cartoon; with no overshoot the conclusion has no step up in grade from the list |
| Closing hold | full sentence rests ≥45f | This sentence is the purpose of the whole section; without a hold, the listing was for nothing |

## Known traps
- The demo was tuned on grayscale/placeholder material. The parameters are a tuning starting point, not a field-tested final;
  the first real use must re-check against real material
- This card is whole-word pill cycling embedded in a live sentence (not character/digit-level mechanical rolling). Use this card only when the copy has
  a "stem + verb phrase" structure; do not force it onto pure numbers or pure title words
- Division of labor with typewriter-moves: the typewriter "builds a sentence one letter at a time", and this card
  "swaps parts after the sentence is built". They can coexist in one video but must not be used back to back on the same line of copy
- Division of labor with type-rhythm-sync: that one changes the attributes of existing text with the audio track (the content does not change),
  and this card changes the content. When tied to an audio track, just match this card's beat points to the drum hits, and do not stack a font-weight pulse on top
- Pill phrase lengths must be close (the demo's longest are "Capture the page" / "Design the sound"). With a length difference >2x
  the slot width jumps too hard and the sentence's center of gravity swings left and right
- The closing sentence and the stem must have exactly the same font size and weight (the demo uses 96px/800 for both).
  If "do it all." is larger than the stem, it reads as a new title rather than the completion of the sentence

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`pill-slot-cycle/PillSlotCycle.tsx`](../../../src/demo/typography/pill-slot-cycle/PillSlotCycle.tsx)

