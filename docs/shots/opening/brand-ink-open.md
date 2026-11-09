---
name: brand-ink-open
summary: Ink crosshair draws on, the wordmark presses in letter by letter, a typewriter subtitle follows, then a full one-second hold before it floats up and dissolves
use: Brand opening; any title sequence that "sets the name first, then goes into the product"
length: about 2.8s (83f)
energy: low (a starting slot, leaves room for later shots to climb)
tags: typography
---

## Intent
The first beat gives the brand a memory hook: before any product footage appears, the viewer clearly sees and remembers the name. Quiet, paper-and-ink texture, one complete still moment.

## Motion core
- SVG crosshair stroke draws on (pathLength dashoffset), vertical first, then horizontal, and fades out when done
- Wordmark letterpress, letter by letter: scale presses from large down to 1 + blur→0, with a short glint stroke of the accent color (amber in the template video) sweeping under the letters
- Kicker subtitle appears character by character like a typewriter, with an accent-color block cursor blinking periodically
- The lockup holds fully still for 1 second, then the whole thing floats up + shrinks + fades out, handing off to the dashboard

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Crosshair draw | vertical line 0→9f, horizontal line 8→18f, fade out 24→34f | It must fade out after drawing; a leftover crosshair fights the wordmark for focus |
| Wordmark per letter | letter i: delay=10+i·3, 12f; scale 1.6→1 (origin center bottom) + blur 6px→0 | "opacity + offset/scale + blur→0" is the standard three-part entrance for the whole video; without blur it looks hard |
| Kicker typewriter | 0.7f/char (starts at 28, done at ~43.4), cursor blinks on a 2f period, stops blinking at 74f | 0.7f/char only suits small decorative text; body-text interactive typing needs 3f/char (compare type-and-filter, where the user found it too fast and sent it back) |
| Brand hold | frames 46→76, a full 1 second | Hard floor: the user named it in two rounds, "extend the hold after it appears by 1 second" (R1); anything under 1s gets reworked |
| Exit | 7f float up 40px + shrink 12% + fade out | The exit is faster than the entrance: the viewer has already read it, and dragging it out deflates the beat |

## Sound
The brand landing is pinned to transition-soft (pinned at f12 in the template video), and the brand→dashboard camera move is pinned to whoosh-fast (f78). SFX are pinned frame by frame and managed in a declarative table (S2); sounds use cinematic vocabulary, not a game-UI tap (S1).

## Known traps
- The hold belongs to the moment the wordmark lands, not to an ordinary text card or content card (R1). The hold was once wrongly added to an ordinary content card and rolled back soon after. When "stay longer" feedback is ambiguous about what it refers to, confirm the target before acting (P3)
- The opening must start low in energy: the whole-video energy curve is low open → build through the middle → outro peak, and a flashy opening crushes the climb that follows (compare the energy-curve requirement in Q8)

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`brand-ink-open/BrandInkOpen.tsx`](../../../src/demo/typography/brand-ink-open/BrandInkOpen.tsx)

