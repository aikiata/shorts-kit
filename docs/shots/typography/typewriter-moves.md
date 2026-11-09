---
name: typewriter-moves
summary: Typewriter error-retype, a three-act "taking it back" play of deleting and retyping: type a mediocre word → hesitate → backspace it away → type the selling-point word faster
use: Slogan/selling-point title cards, negation-style copy; a text entrance that carries its own sense of time
length: ~5.3s (160f)
energy: medium-low
tags: opening
---

## Intent
Typing is the only text entrance with time built in: characters arriving one by one is itself a rhythm,
and no extra motion is needed. Style A treats typing as a **monologue**: type a mediocre word letter by letter
(in the demo, "just a slideshow" under the eyebrow Introducing shorts-kit) → pause and hesitate
→ backspace it away → type the selling-point word faster ("your cinematic crew"). It is a three-act play of hesitation, negation, declaration,
and the drama is all in the difference among the three speeds.

## Styles
| Style | How | Use |
|----|------|------|
| A error-retype | Type at 2f/char → pause 16f with the cursor blinking twice → delete at 1.5f/char → retype at 1.5f/char with no hesitation; the cursor is solid while typing and deleting and blinks only during the pause | The "taking it back" play of a slogan card; negation-style copy |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Character rhythm | substring(0, floor((f-start)/step)), frame-deterministic with no interpolation | Any eased typing reads as a loading animation |
| Three speeds | type 2f/char, delete 1.5f, retype 1.5f with zero hesitation | The difference among the three speeds must be perceptible: a take-back at constant speed reads as a bug, not as drama. This is the crux |
| Cursor three states | solid while typing and deleting = decisive; 4f half-period blinking twice during the pause = hesitation; after the final text, blinks twice and is then removed conditionally | The cursor is the actor's face; blinking at a constant rate throughout leaves no "hesitation" |
| Layout | per-character fixed-width spans (60px monospace slots), left edge anchored | A variable-width font / measuring the whole string reflows and jitters frame by frame |
| Ending | still ≥50f | Even a leftover cursor at 0.05 opacity ruins a true still |

## Known traps
- The demo was tuned on grayscale/placeholder material. The parameters are a tuning starting point, not a field-tested final;
  the first real use must re-check against real material
- Strongly sound-dependent: keystroke sounds aligned per character, with the backspace sound lower in pitch (sound-design
  §4.5). A silent typewriter is only a caption machine
- At most 1 per video: a take-back is a one-time dramatic turn, and taking back twice is stuttering
- One of monospace font or per-character spans must be used, or the whole line
  reflows when characters arrive and the typing turns into a twitch

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`typewriter-moves/TypewriterErrorRetype.tsx`](../../../src/demo/typography/typewriter-moves/TypewriterErrorRetype.tsx)

