---
name: gradient-word-sweep
summary: In a tagline on a black base, a gradient color light sweeps quickly left to right across a keyword to "charge" it. The glow is strongest at the wavefront characters and decays behind it; once filled, thin magenta lightning links the characters and the whole word breathes with a steady-state glow
use: Charging up a single verb/selling-point word in a tagline (Supercharged/faster/AI…); the text moment of an energy climax; the slogan frame of a black-scene brand piece
length: sweep ~15–20f (must be fast) + steady-state lightning breathing 1–2s; whole section 2.5–3.5s
energy: high (a one-word burst, with everything before and after yielding to it)
tags: effects
---

## Intent
In a whole sentence of white text, only the keyword gets "powered on": a gradient color light sweeps quickly left to right over the characters,
like energy being injected. The moment of sweeping is the brightest (wavefront trail), then it decays to a steady state;
once filled, thin lightning jumps and links between the characters, and the word keeps breathing with glow. Three crux points:
**fast** (sweep 15–20f; slower reads as a progress bar), **brightest wavefront** (the freshly lit
characters have the strongest effect; without this gradient it is just a static gradient crop), **restrained glow**
(AE-style multi-layer bloom, but do not smear it into one mass; thin, sparse lightning is the garnish).

## Motion core
- Gradient fill: the keyword is built as two layers of text (white / gradient color), and the color layer
  is revealed by a mask advancing left to right; the slanted mask edge is slightly soft (~8% of the word width)
- Wavefront trail brightening: a brightening band of ~34% of the word width follows the mask front, with the
  glow strongest at the wavefront and decaying behind it; ~10f after the fill ends it fades out to the steady state
- Glow: 4 bloom layers (large ambient soft light + mid halo + near core + bright core), steady-state opacity
  in the 0.55–0.72 range (measured: the 0.75–0.95 range was flagged as "glow feels a bit strong")
- Lightning: after the fill, thin lightning links the characters, as three magenta-toned strokes (outer halo 6 / mid 2.4 /
  bright core 1.4), jumping position and flickering randomly from a mulberry32 seed, sparse and sporadic (not a continuous arc)
- Forbidden: no following light dot/starlight during the fill (measured precedent: a following white light dot reads as cheap decoration, deleted)
- A blurred glow layer cannot use the text box directly as a mask/clip: the blur overflowing the box gets cut into a rectangular "box of light".
  The demo puts these layers into a box expanded 90px on all sides, and the mask color stops are converted back to text coordinates with `calc(PAD + (100% − 2·PAD)·x)`
- Demo duration `GRADIENT_WORD_SWEEP_DURATION = 105` (3.5s): two lines enter with a staggered blur-slide,
  sweep-charge 12→30f, 7 scheduled lightning strikes from 33f (the last goes out at ~92f), and the whole thing pushes in very slowly 1→1.025

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Sweep duration | 15–20f | The original piece is "very fast"; >28f reads as a progress bar |
| Wavefront brightening band | ~34% of word width, brightest at the wavefront and decaying behind | No gradient = a static gradient; a band that is too wide = the whole word lights up together with no sense of "injection" |
| Steady-state glow | 4 layers, opacity 0.55/0.55/0.62/0.72 | The 0.75+ range was flagged as too strong; fewer than 3 glow layers reads as a flat color |
| Lightning line width | outer 6 / mid 2.4 / core 1.4 @1080p | Doubling it was flagged as "thick"; the color leans magenta (magenta 216,60,190 family) |
| Lightning frequency | sparse and sporadic (≤2 on screen at once, gaps >8f; demo schedules 7 strikes, 1 on screen at a time, spacing ≥4–11f) | High frequency reads as an arc fault |

## Known traps
- The demo was tuned on grayscale/placeholder material. The parameters are a tuning starting point, not a field-tested final;
  the first real use must re-check against real material
- Three precedents (distilled from the user's verbatim feedback): 1) no following light dot during the fill; 2) the lightning
  must be magenta and thin; 3) glow should be weak rather than strong, and the wavefront gradient makes up the impact
- Division of labor with type-rhythm-sync: that card is about the beat;
  this card is the energy semantics of "charging" a single word, and the word must be the selling-point word in the sentence
- Body text outside the keyword stays pure white and still. If the whole sentence moves, there is no drama of "only it is powered on"

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`gradient-word-sweep/GradientWordSweep.tsx`](../../../src/demo/typography/gradient-word-sweep/GradientWordSweep.tsx)

