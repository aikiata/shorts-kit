---
name: paper-title-card
summary: One sentence presses onto the paper word by word, one word is marked in an accent-color italic, and a short dash closes it
use: Chapter transitions/value-proposition cards; a lead-in card before an important feature appears; a breathing slot in the whole video
length: 1.7–1.8s (50–55f)
energy: low (a breathing slot that separates two high-energy shots)
tags: transition, rhythm
---

## Intent
Give the viewer a one-sentence breather between two product shots that makes clear "what we are about to look at and what it is worth". The letterpress texture puts the card in the same world as the paper-and-ink product footage.

## Motion core
- One sentence of copy enters word by word: scale pressing down from large to 1 + blur→0 + opacity (the letterpress recipe); the demo copy is the shorts-kit slogan
  "Direct the film. / Let the agent shoot it." (emphasis word *shoot*). The word list can mark `br` to force a line break, with the two lines close in length and no orphan word
- Exactly one key word per sentence: italic + accent color (amber in the template video)
- A short accent-color underline closes with scaleX 0→1
- At the end the whole card fades out to hand off; a mono small-text sub line + DigitRoll number can be attached

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Word-by-word entrance | word i has delay = 4 + i·4, 9f, bezier(0.2,0.75,0.3,1); scale 1.28→1 + blur 7px→0 + opacity | The scale start 1.28 is the sweet spot for the "press" read. Compare the dark-scene TitleCard, which uses a 40px upward move + blur 10: the same recipe in a light and a dark version |
| Key word | italic + accent color oklch(52% 0.115 65), exactly one accent per sentence | Two accents equal no accent; choose a feature name/benefit word as the key word (C2) |
| Underline | 16→34f scaleX 0→1, 220×6px accent color | The underline is a closing signal; once it appears it announces that the card is about to end |
| Length | all 4 title cards in the piece are 50–55f (≈1.8s) | Title card duration is standardized: it is the time a viewer needs to read one sentence; longer drags the rhythm, shorter cannot be read in full |
| Layout | font size 116/serif; paper base oklch(97.5% 0.008 82) + center warm radial light; 8f fade-out at the end | Paper base + warm light in the same color family as the product footage keeps the card from feeling like an ad interruption |
| Sub line | mono small text + DigitRoll (demo "12 shots rendered today"); for digit-roll parameters see the counter row of the list-stack-press card | A concrete number in the sub line is the most convincing; the digit roll must land before this card fades out (lesson learned): plan the beats backwards from this card's fade-out frame |

## Sound
Title card entrances all pin swoosh-quick (the four title cards in the template video are pinned at f220/565/725/885 with the same sound). Same sound for same-type elements is a vocabulary discipline (S2); the title card itself has no landing accent, and its energy is left to the shots before and after.

## Known traps
- The copy must be specific: include the product feature name + a concrete benefit. The user rewrote abstract metaphor words verbatim (C2: "one board" → "one place to go", adding "Paper Radar"); after the picture is locked, rewrite the copy once more against the final shots (C1)
- An important feature needs a lead-in title card before it appears (C2 precedent: before a document shot add a line of lead-in such as "Every project, linked to your weekly report"). A title card is not decoration, it is a chapter signpost

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`paper-title-card/PaperTitleCard.tsx`](../../../src/demo/typography/paper-title-card/PaperTitleCard.tsx)

