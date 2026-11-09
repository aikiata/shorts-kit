---
name: card-stack
summary: A set of template cards (9 in the demo) spring in one by one from below the screen, landing faster and faster into one stack. Once all are in place the whole stack fans out at once: each card turns 6.5° and shifts 138px by its index, and finally the center card is pulled out
use: Product sections that need to say "we have a set of things"; establishing shot for card walls, template libraries and plan lists; also works as a beat of buildup before a logo
length: about 5.0s (150f@30fps)
energy: medium-high (the entrance is a run of small bursts; the fan-out resolves into one smooth whole-body move)
---

## Intent
A stack of cards first gathers into one object, then spreads into a set of objects. The order matters: give the whole first, then the individuals.
The first thing the viewer remembers is a stack with weight (a sense of quantity); only on the second look do they see that each card is different (variety).
The fan-out is left to the end and done in one move so it does not fight the entrance beat.

## Motion core
(Demo version: porcelain-white template library launch, the shorts-kit shot recipe library, 9 cards 320×440 as shot / template cards, native 1920×1080 coordinates)
- Two layers of motion are separated and added together: the entrance (each card's own spring) and the fan (one shared unfold progress for all cards).
  The final transform is `translate3d(tx, y, tz) rotate(rot)` composed from the components each layer computes
- Entrance: start frame `2 + stagger(i, 9, 40, EASE.out)`. The EASE.out mapping makes gaps start large and shrink (bang... bang.. bang. bang bang, faster and faster);
  each card uses `springAt(f, start, {damping:13, stiffness:150})`, and `y` rises from 820px to 0 (the start is outside the frame), settling in about 20f;
  in flight it carries an alternating ±9° tilt that converges as it lands, and motion blur (≤10px) is added by vertical speed
- Weight: when each card lands (about 6f after takeoff it crosses the end point) the whole stack is pressed down 5px (sin envelope, 9f). When stacked there is a deterministic ±3.2° / ±11px offset,
  like a stack squared up by hand. From 62–72f before the fan-out the whole stack tightens 2% (anticipation)
- Fan: `springAt(f, 68, {damping:20, stiffness:95})` is the only unfold clock (with one slight overshoot = the inertia of a wrist flick).
  The end state is `k = i-4`, `rot = k*6.5°`, `tx = k*138px`; `transform-origin: 50% 130%` puts the rotation axis below the card's bottom edge,
  so the fan handle is in the hand and the cards turn open around the wrist
- Stacking order = index (`zIndex = i`, left over right, like a hand of cards spread out) and it never changes. When stacked the top card is the last one,
  so there is no top-card jump when fanning out
- Camera: during the stacked phase it pushes in very slowly 1→1.06 to give the stack weight; over the same period as the fan-out (64→106f) it pulls back to 0.88 so the whole fan is in frame.
  The ground contact shadow widens from 220 to 760 with the fan
- Ending: the center card (solid cobalt cover: the lens-engraving mark in reversed white + "Launch", card name Launch film) is pulled out along its own axis by 72px (overshoot) + 3px cobalt outline + one sweep of light (Q4).
  The title "Start from a shot recipe." (88px) rises word by word, the subtitle follows, hold 28f

## Parameters
| Parameter | Typical value | Feel when tuning |
|------|--------|----------|
| Card count | N=9 (odd, so the center card has the middle spot alone) | 9 cards × 6.5° = 52° total spread is the comfortable limit. Over 11 cards, drop each angle to 4–5° or the end cards fly out of frame |
| Entrance stagger | 40f span, EASE.out distribution | Faster and faster gives the feel of "a string". An even distribution reads as calling out card by card; under 20f it reads as a clump popping up together |
| Entrance travel | y 820→0, spring damping 13 | The start must be outside the frame. Damping under 10 bounces more than twice, and as a group the shaking interferes |
| Landing press | 5px, sin 9f | This is the source of "weight". Over 10px the whole stack looks like a trampoline |
| Unfold spring | damping 20 / stiffness 95 | One slight overshoot feels like a wrist flick. Damping over 26 has no overshoot and reads as a mechanical unfold; under 16 the fan swings back and forth |
| Fan spread | `k*6.5°`, shift `k*138px` | Tune angle and shift in the same proportion: more angle without more shift makes the cards interpenetrate |
| Depth | `tz = i*2`, perspective 1800px | Only hints at the stacking; depth comes mainly from stacking order + two layers of soft shadow |
| Rotation axis | `transform-origin: 50% 130%` | 130% sets how far the "fan handle" is from the card. Change it to 50% 50% and it degrades at once into a pinwheel spread |
| Card pull | 72px overshoot + outline + sweep | Give it to the center card only, once. A pull under 40px does not read as "chosen"; over 120px the card fights the title |

## Known traps
- The two time windows meet exactly end to start: the last card takes off at 42f and lands at about 62f, anticipation at 62f, fan-out at 68f.
  Adding cards or enlarging the stagger lets the entrance eat into the fan-out, giving a muddy "it starts turning while still flying". When you add cards you must
  push the anticipation and fan-out starts back too
- With an even card count, `k` takes half-integers (±0.5, ±1.5…), there is no center card, and the ending "pull out the lead" falls to one side.
  The demo uses 9 cards. If you switch to a "middle on top of the sides" zIndex, watch for a top-card jump going from stack to fan
- The 320×440 card is centered with `left = CX-CW/2, top = CY-CH/2`, and the fan handle position moves with CH. When you change the size, also check
  whether the end cards leave the safe margin (at camera 0.88 the outermost card corner is about 100px from the frame edge)
- The card faces are hand-made template cover placeholders (generated cover image + title + mono meta info). In production swap in real page slices.
  The covers use only light tints of cobalt / teal / ink, and only the center card uses solid cobalt. Keep one "lead" card in the real material too
- During the fan-out (64→106f) the camera pulls back to 0.88 to keep the end cards in frame. To lead into the next shot, cut after the card pull settles (about 120f) and do not let the fan sit idle too long

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`card-stack/CardStack.tsx`](../../../src/demo/ui-entrance/card-stack/CardStack.tsx)

