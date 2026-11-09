---
name: logo-shrink-wordmark-lockup
summary: A large neon notched ring quickly contracts into a small solid white O at the center. At the overshoot brake it is swapped for the shorts-kit mark, the icon shifts left to make room, the wordmark letters slide in one by one to complete the lockup, and an accent-color tagline closes.
use: Brand finishing at the end of a piece: contracting from full-screen graphic energy into the standard "icon + wordmark + tagline" lockup
length: about 4.4s (132f@30fps; contraction 0.1–1.2s · make-room 1.5–2.1s · letters 2–2.7s · tagline 3.2–3.7s)
energy: medium (the contraction segment has impact, and the overall pace is a steady settling)
---

## Intent
The "stamp" move at the end of a piece: the full-screen neon ring collapses with its energy into a small icon, heals its notch and turns pure white (from performance state to standard state), then lands step by step per the brand lockup spec: the icon makes room, the wordmark enters, the tagline closes. The viewer sees the brand "stand firm" out of motion.

## Motion core
- Main contraction curve: scale 5.4→1 (t=0.02–0.28, inOutCubic), with a `sin(π)*0.06` overshoot brake layered over t=0.26–0.37: at the moment of arrival it swells 6% and falls back, "a sudden stop with inertia"
- Notch healing and the color change share the same track as the contraction (t=0.10–0.28): the neon glow layer fades out, the stroke switches over halfway from #dfe9ff to #fff, and the solid white O fades in. The three layers cross over during the shrinking, so at landing it is already a clean white mark
- t=0.24–0.32 the white O cross-swaps to the shorts-kit "Jingke" mark (inverted white version, on the same beat as the brake and the shockwave; by the swap it has already shrunk to its final size). The ring rotates in the inner layer, and the outer layer holding the mark only scales without rotating, so the angle of the bevel cut never changes
- t=0.34–0.47 the icon as a whole shifts left to make room (inOutCubic, −90.5px = half the width of the whole lockup minus half an icon), freeing the right side of the center axis for the wordmark
- The wordmark `shorts-kit` (15 characters, 22px / 700, all lowercase) slides in with a stagger of `0.46 + i*(0.24/15)`: opacity 0→1 + translateX 8px→0, each 0.10 long outCubic
- The tagline is the brand phrase `FRAME MOTION. CRAFT THE SHOT.` (accent color `ACCENT`, 12.5px wide letter-spacing), the whole line fading in at t=0.72–0.84, not letter by letter: one level lower in hierarchy than the wordmark

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| contraction amplitude | scale 5.4→1 | The starting scale decides "from how full to how small"; <3 lacks impact, >7 the initial state blurs off the frame |
| brake overshoot | +6%, sin envelope 0.26–0.37 | Cut it and it reads as a hard freeze; >10% turns to jelly |
| healing window | 0.10–0.28 (in sync with the contraction) | Healing must finish before landing: still changing color after landing reads as "not ready" |
| shift-left make-room | −90.5px (derived from `WORD_W`/`GAP`/`ICON`), 0.34–0.47 | Almost seamless with the first letter entering (0.46); a larger gap feels like "empty waiting" |
| letter stagger | `(0.7-0.46)/n` (15 characters = 0.016/char), each 0.10 long | A short word of 5 letters can be loosened to 0.035/char; with many letters back-derive the interval from `(0.7-0.46)/n` so that all start running before 0.7 |
| tagline entrance | 0.72–0.84 whole-line fade-in | Deliberately not letter by letter: the tagline is a footnote, not the lead; swap the `ACCENT` constant for the project color |

## Known traps
- `WORDMARK` = `BRAND.name`, tagline = `PITCH.en.motto`; when changing the brand word the letter stagger rhythm depends on the character count (already back-derived automatically from the count), and when the tagline's character count changes adjust the letter-spacing in sync, otherwise the wide-spaced layout overflows or is too sparse
- The icon is a two-layer structure "performance state → standard state": an SVG double-arc notched ring (glow/color) heals into a white O, then at the brake it is cross-swapped to the shorts-kit mark (clean state, no glow); when swapping in another logo, likewise do not let the logo rotate with the ring
- The shift-left amount is coupled to the wordmark width: `WORD_W` is the measured width of the wordmark row (re-measure when changing the font/size), and `SHIFT` and the letter row's left edge `ROW_LEFT` are both derived from it, so the lockup as a whole is centered in the frame
- There is no loop-back design after the ending; use it as the last shot of the outro; when a loop is needed, append a 1s still frame after t=1

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`logo-shrink-wordmark-lockup/LogoShrinkWordmarkLockup.tsx`](../../../src/demo/outro/logo-shrink-wordmark-lockup/LogoShrinkWordmarkLockup.tsx)

