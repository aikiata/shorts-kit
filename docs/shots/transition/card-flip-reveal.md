---
name: card-flip-reveal
summary: Feature card 3D flip reveal. A card flips 180° around the Y axis. At the thinnest point on the side edge, the front UI catches a highlight that moves with the angle, and the back reveals a large conclusion number. Cards are staggered one by one across a whole row.
use: Paired "feature to result" storytelling. A row of feature cards flips one by one to show each one's metric or conclusion. Element-level transition card.
length: 150f total (~5s, including hold); per card 4f anticipation + 16f flip + ~10f spring settle, three cards staggered by 12f
energy: medium-high
tags: data
---

## Intent
The library already has wipe-transitions blinds (blades flip one by one, about changing pages) for the "flip" family.
This card is a **semantic flip**: the two faces of a card are a cause-and-effect pair. The front is the feature UI, and the back is the number it produces. The flip itself is the answer to "so what?", the standard grammar of Apple bento sections. Staggering by 10f card by card across a row, three cards with three numbers read as "results reported in a row".

## Motion core
- perspective 1600px + transformStyle preserve-3d; both faces set backfaceVisibility hidden, and the back is pre-rotated rotateY(180°)
- The flip has three phases: 4f anticipation (lean back −10° in the opposite direction, ease-out) → 16f bezier(0.55,0,0.3,1) accelerating flip to 194° (14° overshoot) → physical spring (damping 15) settling back to 180°. During the flip, translateZ lifts 60px (sin envelope).
- **Lighting**: the faces are shaded by their angle off the front (`(1−|cos θ|)` darkens, dark face 0.55 / bright face 0.4). Between 56° and 124° on the side edge, a narrow lit band sweeps from the left of the card to the right with the angle, with a triangular intensity envelope that peaks at 90° (the thinnest moment). A highlight tied to the angle reads as "light sweeping across a turning face". It is physical lighting, not an extra glint effect.
- **Front and back inverted**: in the demo the front is a dark feature card (graphite dark field) and the back is a porcelain-white conclusion card. Flip = dark to light, so after all three flip the frame goes from a row of dark cards to a row of white number posters. The 158px number on the back settles with a 1.08→1 contraction, the conclusion label rises 4f later, and the "before / after" comparison bar above it shortens after the settle.
- Space: the cards stand on a dark mirror floor. Each card has a vertical mirrored reflection that flips in sync (mask fade at 26%, opacity 0.22), and the contact shadow width follows the projected width |cos θ|.
- Stagger delay 12f per card. After all have flipped, hold truly still for ≥40f (the demo holds 78f after 72f). The camera pushes in very slowly 1→1.03 throughout.

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Flip duration | 4f anticipation + 16f flip + ~10f spring | <14f and the side-edge moment can't be seen; >28f reads as slowly turning; cutting the anticipation reads as being knocked open rather than a "flip" |
| Overshoot | 194°→180° (14°), spring damping 15 | Settling with no overshoot reads as a stiff stopwatch stop; damping <12 bounces twice and reads as jelly |
| Lighting | Face darkening ≤0.55 + narrow side-edge band peaking @90° | A peak off 90° reads as a texture error; a sweep with no face darkening reads as a white stripe pasted on |
| Stagger | 12f per card, ≤4 cards | Flipping together reads as the whole wall flipping, and the one-by-one rhythm of "results reported in a row" is lost |
| Back content | Large number (150–170px range) + one line label + at most one comparison bar | A full UI on the back can't be read: there is only one beat of attention after the flip. With numbers over 160px, wide strings like "−41%" push out past the card edge |
| Ending | Last card settles, then truly still ≥40f | R1 |

## Known traps
- The demo was tuned on grayscale / placeholder material. The parameters are a tuning starting point, not a field-proven final. The first real use must be re-checked with real material.
- The two faces must be a semantic pair (interface → its result). If unrelated content flips out, the flip is just a flashy image swap.
- When the front uses a real screenshot, watch the backface rendering cost. With three or more cards, split into Sequences.
- Sound candidate: a light "pop" on each card's stop frame (sound-design §4.5). Three pops in a row doubles the rhythm.

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`card-flip-reveal/CardFlipReveal.tsx`](../../../src/demo/transition/card-flip-reveal/CardFlipReveal.tsx)

