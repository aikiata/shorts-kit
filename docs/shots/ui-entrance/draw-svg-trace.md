---
name: draw-svg-trace
summary: Stroke-growth circling. An ink line with a pen tip runs once around an element's outline to "draw" it. At the instant it closes it flashes black to hand off, and the content fades in. The same pattern can draw an underline under a headline
use: Called-out entrance of a single card / chart / headline; an element-level technique (the page-level blueprint line drawing belongs to wall-reveal-moves style B)
length: 132f (teaser 10f + stroke 40f + black flash hand-off 16f + underline 18f + hold 40f, about 4.4s)
energy: medium
tags: typography
---

## Intent
"Drawn out" is the most natural entrance metaphor in a paper-and-ink look: the element does not fly in or fade in,
it is drawn on the spot by an invisible pen. The library's wall-reveal-moves style B already has a full-page
blueprint version (full-screen wireframe drawn segment by segment + regions lit up); this card is its **element-level close-up**:
one line, one subject, one closure, with a visible pen tip and a readable direction, suited to the moment of calling out
"next we talk about this". The second use is a growing headline underline: the same pattern as a short 18f version, giving a key word
one hand-drawn emphasis stroke, a natural fit with the marker-aesthetic token.

## Motion core
- **No need to measure the perimeter**: set `pathLength={1}` on the SVG rect/path, strokeDasharray="1",
  and dashoffset 1→0 (40f Easing.inOut(cubic)). No getTotalLength
- **Pen tip**: stack three tapering short dashes on the same path (0.04/6.4px → 0.024/8px → 0.011/9.6px), dashoffset = pen tip length − p,
  which naturally runs at the very front; add a solid pen point (with a drop shadow) positioned exactly by the rounded-rectangle arc length.
  Without a pen tip it is just "the border getting longer"; with a pen tip it is "someone is drawing"
- Teaser: in frames 0–12 at the start, crop marks grow at the four corners first (print registration marks, staggered 2f), over a layer of drawing-paper dot grid that is clear at the center and fades out at the edges.
  There is a picture on frame 1, and the viewer knows first that "something is about to be drawn here". At closure the crop marks spring outward 22px and fade out
- Closure flash: at 50–52f the stroke goes pure black + thickens 6→11px, and at 52–58f it falls back with out easing.
  On a white background, deepen and thicken, no glow (precedent)
- Hand-off: at 56–66f the stroke layer fades out and the element's own hairline border fades in. From 50f the card base takes ink and the card rises off the ground (its shadow grows),
  and the content goes from faint to solid top to bottom with a 3f stagger + float-up, with bar charts growing from the baseline with a 1.5f stagger. Closure means "drawing done", and the content "gets colored" after it
- Second use: at 74–92f draw a vermilion marker underline stroke under the key word "100%" (a hand-drawn path with a slight curve, the pen tip following), and it stays once drawn

## Parameters
| Parameter | Typical value | Feel when tuning |
|------|--------|----------|
| Stroke speed | one full loop 40f (10→50f, inOut cubic with breathing at start and end) | Under 28f it does not read as "being drawn"; over 60f it reads as loading |
| Main line / pen tip | main line 6px; pen tip three tapering segments, thickest 9.6px, point r 7.5 | A pen tip no thicker than the main line disappears into it |
| Closure flash | 2f snap to black + thicken to 11px, 6f fall back | Without this beat, "drawn" has no full stop |
| Subject size | 1120×660, corner radius 28 (stroke rx the same) | The subject takes about 58% of the frame width so one stroke loop carries the weight of "a big thing was drawn". The stroke rx must equal the card corner radius |
| Underline version | 18f out cubic one-way growth, 12px vermilion, the path has ±5px hand-drawn curve, stays once drawn | Use on a single key word; two or more on a screen read as decorative lines |
| Ending | after the hand-off is done hold 40f (92→132f) with only a 0.9% very slow push-in | R1 |

## Known traps
- The demo is tuned on a hand-made shorts-kit render report card (paper-and-ink look, "Cuts on the beat / 100%" + per-shot energy bars + a logo wordmark signature). The parameters are a tuning starting point, not a final production setting;
  the first production use must re-verify on real material
- Same family as, and mutually exclusive with, wall-reveal-moves style B (page-level blueprint line drawing): pick one per film,
  using both reads as announcing the same thing twice
- The stroke path must match the element's real outline (the corner radius rx the same). If the line draws a 14px
  corner and the element has 8px, the mismatch shows at the hand-off instant
- On real material, do not let the content fade in before the closure: if the content appears before the line is finished, the cause and effect
  of "drawing" is broken
- Draw one subject per call-out; several elements on a screen each drawing a loop in line reads as a loading animation

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`draw-svg-trace/DrawSvgTrace.tsx`](../../../src/demo/ui-entrance/draw-svg-trace/DrawSvgTrace.tsx)

