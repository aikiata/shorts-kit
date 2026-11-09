---
name: riso-print-hits
summary: Misregistered-print impact frame. riso-misregistration-hit single shot: at the instant the title stops, it splits into two-color riso plates, shakes twice, and snaps into register.
use: Hit emphasis on a title or card, the paper-and-ink version of a "glitch flash"; a single-shot climax used 1–2 times per film
length: 4s (120f, single shot)
energy: high
tags: typography
---

## Intent
The RGB chromatic glitch flash (part of impact-feedback variant C) is the language of phosphor screens and clashes with the paper-and-ink
tone. This card gives the print equivalent: the element splits into two single-color riso plates (demo: fluorescent pink × blue;
multiply ink feel rather than screen glow, and the two plates overlap into a dark ink when registered),
like a risograph with plates out of alignment. It shakes a few times and
snaps into register with a "pop": the same impact, with the imagined medium swapped entirely to ink on paper. Single shot:
the plates split at the instant of the abrupt stop, the shake decays, a hard cut snaps them into register, stamping one hit. The demo is a shorts-kit
two-color riso promo poster ("CRAFT IT / LOUD." + three columns of selling points, with the single-color plate lens-engraved mark at the center of the round stamp).

## How
| Variant | How | Use |
|----|------|------|
| misregistration-hit single shot | The title slams in over 8f and stops, splits into two plates offset in opposite directions by ~40px, decays through oscillation over 44f, then a hard cut to register + scale pulse + a "ON REGISTER" round stamp comes down | A hit stamp used 1–2 times per film; the instant a title/large text arrives |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Two plates | Two-color riso ink: fluorescent pink #ff4fa3 + blue #1f5fc4 (overlap into deep purple when registered). `mix-blend-mode: multiply` over recycled paper (#f3eee2 + static paper fibers / ink grain), offsets in opposite directions; registering means both plates go to zero and coincide | The ghosting from multiply is exactly "ink out of register"; screen blend instantly becomes a fluorescent glitch. Pick two complementary hues that overlap into near black when registered; avoid pure gray (reads as a shadow) |
| Offset envelope | `offset = A·cos(2πt/18)·exp(-t/60)`, A=(20,8)px with the two plates opposite (300px title); hard cut to zero at frame 72 | The key: registering is a **hard-cut jump**, not a gradual close. Snapping to zero while still ~11px off is what gives the "pop"; a pure gradual close loses the beat of registration |
| Slam in | 8f Easing.in(cubic) abrupt stop from off-screen, plates split on the hit frame | The split must be on the same frame as the abrupt stop: 2f late reads as two separate things |
| Register pulse | On the zero frame 4f scale 1.03→1; on the same frame the round stamp scale 1.5→1 comes down; on the hit frame the whole page hitches 1.2% and recovers over 10f | The stamping beat; without it the registration has no weight |
| Scope | The misregistration only acts on the title; the background (sun / colophon / info bar) stays in register | Splitting the whole frame reads as a glitch rather than printing |
| Ending | ≥40f of true stillness after registering | R1 |

## Known traps
- The demo was tuned on grayscale/placeholder footage. The parameters are a tuning starting point, not a final production setting.
  On first real use, re-verify against real footage.
- **Precedent on perceptibility of the offset (real render of this batch)**: the ±5px of the original vocabulary proposal is almost invisible to the eye at normal speed
  on a 1920-wide frame. It becomes perceptible starting from 16px per plate / 32px total separation (for a 200–300px large title use 20px/40px).
  When unsure about the amplitude, make an extreme version and show it to the user (perceptibility first).
- This card overlaps in meaning with impact-feedback C (negative impact frame). Use this card for paper-and-ink tone films,
  and variant C for game/anime tone. Do not use both in the same film (P4).
- A mix of horizontal and vertical offset directions (mostly x, a little y) looks more like plates out of alignment; purely horizontal
  reads as a left-right wobble.
- With 300px large text at −0.045em negative tracking, the horizontal strokes of adjacent glyphs may just touch (for example the top bar from F to T in CRAFT),
  and the anti-aliasing on both sides stacks into a hairline bright gap. Tighten the previous letter by another ~0.01em so the two strokes overlap.

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`riso-print-hits/RisoMisregistrationHit.tsx`](../../../src/demo/effects/riso-print-hits/RisoMisregistrationHit.tsx)

