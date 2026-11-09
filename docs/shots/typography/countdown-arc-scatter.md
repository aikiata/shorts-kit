---
name: countdown-arc-scatter
summary: Nine equal-size numbers on a paper dial are laid out tangentially along a large arc. The whole dial sweeps 96°, then decelerates to a sudden stop. The "5" stops at the top of the arc and immediately translates into place as the first character of the title, while the other numbers scatter in place with blur. The title fades in word by word with blur, and the last word turns to the accent color
use: Countdown/duration-promise copy ("5 min to install"); a data-reveal beat; a short light-background shot that needs a "gauge" vocabulary
length: about 3.3s (100f@30fps: sweep ~30f + landing 20f + title assembly + 22f hold; can be compressed to a 33f single beat at the shortest)
energy: high (a big 96° sweep squeezed into ~20 frames, pure impact)
---

## Intent
"Installs in 5 minutes" written as a static title card, nobody believes it. The dial sweep puts the number inside a
**range**: 45, 35, 28, 22, 17, 10 sweep by one after another and stop at 5. The viewer sees
"from a lot down to a little", so the number argues for itself. After the stop, the "5" does not vanish but **translates to become the
first character of the title**. One element switches identity from gauge to copy, which is the most valuable move in this card.

## Motion core
- Arc layout: 9 numbers hang on the same center (the demo is drawn natively at 1920×1080: center (960,1150), R=700, arc top y=450),
  `ang = (i-6)·24`°, position `x = cx + sin·R`, `y = cy - cos·R`, and each number also does `rotate(position angle)`. This is a **tangential layout**:
  the numbers tilt with the arc as if engraved on the dial; numbers are 112px Helvetica bold tabular, equal size and equal weight
- Whole-dial sweep: first a 5f reverse wind-up of +3° (anticipation), then one physical spring 99°→0° (damping 12 / stiffness 60,
  ~24f to overshoot 0° by about 2°, ~34f to settle). "Decelerating hard stop + one needle rebound" is the entire force of "arriving"
- Fade at both ends of the arc: `op = clamp((70 - |pa|)/22)`, the position angle goes to zero beyond ±70° and fades in from ±48°.
  **No mask, opacity is computed from the angle**, so the numbers "rotate into view"
- The "5" at `i=6` is designed with angle 0 (it stops exactly at the arc top after the sweep). 2f before the rebound settles it takes off: a 20f asymmetric in-out (EASE.swift)
  translates it to the title's first-character slot, and the same curve does the 112→150px scale-up and the rotation back to upright. The title's first slot is an empty space of fixed width 0.6em,
  and the flying "5" also uses a same-width centered box, so the landing point aligns strictly with the slot center and no element swap is needed
- The other 8 numbers defocus and fade out in place over 28→44f (`blur(out·6)`, **no offset**; an offset would fight the "5" translation for attention), clearing the way
  4f before the "5" takes off; during the fast part of the sweep each number gets directional motion blur by its tangential speed (back to zero once it stops)
- Dial layering: inside the numbers, a ring of fine ticks turns at the same speed as the dial (one every 4°, longer at number positions); the accent-color needle hangs on `rot·0.35`
  and follows the rotation: a **0.35x differential speed**, two rotation speeds that build the layering of "dial face + needle". Outside, a still hairline arc + an accent-color readout marker at the top;
  after the dial disperses they stay on the poster at 35% (the title looks as if read off the gauge)
- Three title words, word by word with `blur((1-p)·10)` + fade-in + 0.12em rise, windows 42–56 / 46–60 / 50–66f (overlap = one sentence);
  the last word interpolates from ink to accent color over 64–76f (vermilion in the demo): the only color event in the piece. Below, a mono 34px command line adds one product fact (in the demo, the real install command of shorts-kit `npx skills add Vincentwei1021/shorts-kit`; top right is the shorts-kit wordmark)

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Number sequence | `[45,35,28,22,17,10,5,4,3]`, spacing 24° | Decreasing with uneven steps (45→35→28…) is what looks like a real range; an arithmetic sequence reads as a ruler. The "5" must be at position i=6 (the first 6 sweep past, the last 2 are reserved) |
| Arc radius | R=700px, center below the frame (arc top y≈450) | The radius sets the curvature: <R/3 of the frame width and the numbers crowd into a small circle; when the arc is nearly straight the dial feel disappears. The whole visible arc should span 60–70% of the frame |
| Sweep | wind-up +3° 5f → spring 99°→0° (damping 12 / stiffness 60, ~2° overshoot) | Overshoot >4° reads as a spring toy; an inOut ease-stop with no overshoot lacks the crispness of an instrument |
| Visible angle window | `(70-|pa|)/22` (fully transparent beyond ±70°) | 22 is the fade width (about one notch); widen it to 40 and the numbers enter and leave half-transparent, muddy; set it to 0 and it is a hard-cut appearance |
| "5" landing | 32→52f (20f, EASE.swift), 112→150px, righting itself in sync | The landing follows the sweep stop directly with no rest in between (a rest splits it into two actions); the landing point must be the title's first-character slot (the fixed slot width guarantees alignment) |
| Others fade out | 28→44f + `blur(out·6)` | The fade-out starts **before** the "5" takes off, to clear the way; the blur makes the dispersal read as losing focus rather than vanishing |
| Tick differential | needle `rot·0.35`; title word windows overlap about 10f, `blur (1-p)·10`px | The differential speed is the source of the "dial vs needle" layering; at 1.0 (same speed) it reads as one whole texture rotating. Overlapping word windows are what make "one sentence"; a queue reads as three words each entering on their own |
| Last-word color | 64→76f → accent color | The only color event in the piece; landing on the last word makes it the landing point of the sentence |

## Known traps
- The demo was tuned on grayscale/placeholder material. The parameters are a tuning starting point, not a field-tested final;
  the first real use must re-check against real material
- **33f is the extreme compression** (motion-lab original: sweep 17f, "5" landing 6f, three word fade-ins about 5f each), with information density far above the readable limit;
  the demo is stretched to 100f. When changing the duration again, scale all time windows by the **same ratio** (the ratios are tuned); do not only stretch the sweep section
- **Re-estimate the title width when changing copy**: the demo uses `TITLE_EM` (the full-line em width estimated from glyph widths) to center the title, and the "5" landing point
  derives from the fixed 0.6em first slot. When the copy changes, only change `WORDS` and `TITLE_EM`: the landing point aligns automatically, but the centering of the whole line must be re-estimated
- The dial numbers must be **equal size and equal weight** (demo 112px/700): uneven sizes read as a data visualization,
  not a dial sweeping past
- The "5" angle design (i=6 → ang=0) is the foundation of this card: whenever you change the sequence length or which number
  is the lead, the lead's `ang` must still compute to exactly 0, or it is not at the arc top when the sweep stops
- Light background first: warm white paper + ink numbers + a single accent color is the source of this card's clean feel; a dark-background version
  needs a full re-do (and the blur used for the fade-out turns gray on dark)
- Sound: the sweep stop and the landing are two beats close together (only a few frames apart),
  so give them two short sounds with different timbres (a mechanical stop for the sweep stop, a light settle for the landing); the same sound fired twice
  blurs into one hit. For the mixing discipline see sound-design.md

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`countdown-arc-scatter/CountdownArcScatter.tsx`](../../../src/demo/typography/countdown-arc-scatter/CountdownArcScatter.tsx)

