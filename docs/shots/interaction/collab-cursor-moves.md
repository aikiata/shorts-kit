---
name: collab-cursor-moves
summary: Collaboration cursors as actors. cast-ensemble is an ambient layer of five extra cursors (staggered fly-in + sine drift + a typing cameo + gathering to look on).
use: Canvas scenes on collaboration / multi-user themes, to lay the warmth of "the team is here" over the frame
length: A ~5.2s (156f)
energy: A low-medium (ambient layer, can underlay any length)
---

## Intent
Cursors in the library have always been "operating tools" (the cursor in cursor-flyover
is a single-cursor click tour). This card promotes collaboration cursors with identity name tags to **actors**:
five cursors enter staggered and then keep drifting as ambient particles. The "team is here" feel rests entirely on them, and one of them
can stop and type (a cameo role). An SVG cursor + name-tag chip costs very little and carries a lot of narrative,
making it the cheapest visual argument for the "collaboration" theme.

## Forms
| Form | How | Use |
|----|------|------|
| A cast-ensemble | 5 named colored cursors fly in staggered on springs onto the shorts-kit storyboard whiteboard (the avatar group pops out on the same frame, sticky notes carry the author color) → dual-frequency sine drift as residents → one hangs on the insertion point and types out the brief card title → at the end everyone gathers with smooth to look on | Whole-piece ambient layer for canvas/whiteboard products; background liveliness of "others are here too" outside the main content |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| A entrance | 5 cursors staggered with delay 2/7/11/16/22f, spring(damping 15, stiffness 80); name tag fades in + floats up 12px 10f later; the top-right avatar group pops out on the same frame (slot width grows as they pop) | A name tag on the same frame as its cursor reads as a sticker; fading in as the cursor decelerates is "the person arrives and introduces themselves" |
| A drift | Dual-frequency sine sum (0.055/0.021 rad/f, different phase per cursor), amplitude ±40/26px | A single-frequency sine reads as a pendulum; dual frequency with different phases is "the randomness of a human hand" |
| A typing cameo | 48–104f types 29 characters (1.6–2.4f per character with deterministic jitter, 0.9f extra pause after a space); the cursor arrow hangs on the inline insertion-point anchor and follows through line wraps; while typing the hand is steady (drift pressed to 0) | Computing the arrow and the insertion point positions separately will always misalign; an inline zero-width anchor lets the browser layout do the math |
| A gather | From 98f, 28f smooth to onlooker positions around the card (not covering the title or eyebrow), drift amplitude decays to 25% and is kept | After gathering, drift must not go to zero: a fully still cursor group reads as a crash |

## Known traps
- The demo was tuned on a hand-built frame (porcelain-white whiteboard + sticky notes + brief card, the board name carries the shorts-kit mark, title "Ship a launch film by Friday.").
  The parameters are a tuning starting point, not a final production setting.
  The first production use must be re-verified on real material
- Name tag color = identity coding and must be consistent across the whole piece (blue = Designer stays blue); if the color changes midway the viewer will think it is a different person
- When changing the title copy, keep the character count and space count, so the typing rhythm (per-character jitter taken by index, extra pause on spaces) and the end frame stay unchanged
- Drifting cursors must never cover the main content being read: the ambient layer yields to the scene, and the drift range avoids the safe zone of the main subject
- Division of labor with cursor-flyover: that one is a cursor "operating the UI" (clicks have a payload); here the cursors "perform for you" (displacement is the plot). When a cursor needs to click something, go back to that card
- Sound: one very light pop per cursor on entrance, silence during drift, light keyboard sound during typing

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`collab-cursor-moves/CursorCastEnsemble.tsx`](../../../src/demo/interaction/collab-cursor-moves/CursorCastEnsemble.tsx)

