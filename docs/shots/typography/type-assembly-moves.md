---
name: type-assembly-moves
summary: Three ways for text to gather. split-text-stagger (letters split and rise one by one), letterform-drift-assembly (letters drift in and close up), text-on-path (letters flow in along a line)
use: Entrance of big titles/taglines; belongs to the same big title-entrance category as type-entrance-moves and document-typewriter-reveal, at most 2 kinds per video
length: 4–5.5s per style (action section A ~56f / B ~104f / C ~110f; demo full length including hold: A 130f / B 150f / C 160f, each exporting its own `*_DURATION`)
energy: A medium / B medium-high / C medium
---

## Intent
Title entrance already has an "in-place transformation family" (letter drop / typewriter, where the letters change form in place). This card adds the "gathering family": the letters **converge into** the title from elsewhere, and the motion path
itself is the drama. A is piano-key style: each letter rises from an invisible crop line, rational and clean, the most
general; B is title-sequence style: letters drift in scattered and blurred, lock in one by one and deepen, the
ceremony of Stranger Things, suited to a brand name reveal; C is semantic style: the letters stream in one after another along a rising curve
and then straighten up, and the curve can trace exactly a chart's growth line, so text and data tell a story in one frame.

## Choosing among the three
| Style | How | Use |
|----|------|------|
| A split-text-stagger (split and rise) | Each letter does translateY(115%→0) inside an overflow box with 10% overshoot, delay i×2f, and the baseline grows in sync (demo: light scene, 136px brand line "FRAME MOTION.") | General default; clean and rational |
| B drift-assembly (drift and close up) | Letters drift in from a seeded direction ±260–360px + blur 8px + rotation ±24° + depth 1.22, staggered back into place; a lock frame gives a deepening pulse, and after assembly the whole word breathes at 1.04 (demo: light scene, 148px brand name "shorts-kit") | Brand name / title-sequence-grade reveal |
| C text-on-path (flow along a line) | The whole string advances rigidly along the arc length by the real advance (last letter leads, rotating to the tangent angle, readable while moving), and on arrival the letters lift one by one along the arc to the top-left title position (demo: midnight dark scene, revenue growth line + value badge) | When the curve has meaning (growth line / process line) |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| A overshoot | 10% (14f out-cubic rises to −10% then 6f falls back; the original plan's 6% is measurable but not perceptible, so the real render adds more) | At normal speed the fall-back beat must be visible; in the fast rising section add y-direction blur by vertical speed |
| B lock pulse | text color deepens to #000 + stroke 0→3px→0 / 8f | On a white base use deepening + stroke, not glow (precedent) |
| B drift binding | offset (1−p), rotation, depth scale, blur 8(1−p), opacity 0.35→1 share one p (Easing.out(cubic), 45f per letter, 3f stagger) | On separate curves, the letters "arrive but are still blurry" |
| C straightening | On arrival hold 8f, then left to right with a 1.1f stagger, 18f lift: y uses a fast curve with ~4% overshoot, x uses in-out, rotation converges 2f later → the trajectory is an arc; final positions are laid out by measured letter widths | Without straightening it is forever "hanging on the line" and the title cannot be read; when the lift travel is large, an overshoot >5% pokes into the eyebrow |
| C curve | evolve (dashoffset by arc-length ratio) grows in sync with the lead letter; the demo makes it a chart growth line (electric-blue 5px stroke + outer glow + gradient area under the line + cyan lead light dot and top-reached pulse + grid ticks + quarter markers) | If the curve finishes drawing before the letters move, it reads as two animations |
| Ending | everyone settled, truly still ≥30f | R1 |

## Known traps
- The demo was tuned on grayscale/placeholder material. The parameters are a tuning starting point, not a field-tested final;
  the first real use must re-check against real material
- The big title-entrance category now has five styles (the three in this card + type-entrance-moves + document-typewriter-reveal),
  and the iron rule **at most 2 per video** (P4) is unchanged
- Both B and C are high-attention entrances, so do not stack camera moves on top: while the letters are flying the camera must be steady
- In C, do not let the letters each start running on their own: the later letters would overtake the earlier ones, and the low section of the curve inevitably bunches up (stepped in on the original version);
  advance rigidly by arc length and use the real advance for letter spacing so the whole sentence can be read; with a font size >80px the letters nibble each other's corners at the curve's bends,
  so for big text use a gentler curve or fewer letters

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`type-assembly-moves/LetterformDriftAssembly.tsx`](../../../src/demo/typography/type-assembly-moves/LetterformDriftAssembly.tsx)
- [`type-assembly-moves/SplitTextStagger.tsx`](../../../src/demo/typography/type-assembly-moves/SplitTextStagger.tsx)
- [`type-assembly-moves/TextOnPath.tsx`](../../../src/demo/typography/type-assembly-moves/TextOnPath.tsx)

