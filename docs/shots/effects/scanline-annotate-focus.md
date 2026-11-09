---
name: scanline-annotate-focus
summary: A scanline sweeps down an existing page at constant speed. Each block whose lower edge it crosses is closed in on by four corner viewfinder brackets, springing in from outside with one overshoot, and then a machine label is typed out character by character. The status line at the top counts 00/06→06/06 in sync.
use: "AI is reading your page/brand" analysis shots; breakdown intros for design systems / brand guidelines; self-explanation sections for product capabilities
length: about 5s (150f@30fps)
energy: medium (mechanical and calm, the rhythm is driven by the constant-speed scanline, annotations are the beat points)
---

## Intent
Make the abstract act of "analysis" a visible chain of cause and effect: wherever the scanline goes, that block is framed and
named. The viewer reads "the machine's gaze", so the scanline must move at constant speed and each annotation must strictly lag the
scanline passing over it. **Scan first, then pop the frame.** Once the order is scrambled it becomes a pre-choreographed animation.

## Motion core
- Two colors with a strict division of labor: the **brand color** (demo: terracotta `#C4552D`) lives only in the page content, and the **machine color** (cobalt `#2B4FD8`)
  goes only to the scanline / corner brackets / labels / status line. The viewer can tell at a glance the "page itself" from the "machine's gaze".
- The page (demo: the shorts-kit website: lens-engraved mark + wordmark, H1, sample cover, CTA, color palette) sits in a 1560×840 browser window (two layers of soft shadow), with the status line above the window. The whole time there is a very slow push-in 1.000→1.035.
- The scanline runs **strictly at constant speed** from 6 to 80f over window y −20→860: 3px light core + a 140px fading pale-blue wash behind it and an 18px dot-matrix afterglow.
  A triangular cursor slides with the line on each side of the window frame, and the left one reads out the current `Y 0412`.
- Trigger frames are derived back from the bbox: `ft = frameAtY(y + h)` (the frame where the scanline crosses the **lower edge** of the bbox), sorted by lower edge and clamped
  to a minimum gap of 4f. Measured in the demo: LOGO 19f · NAV 23f · H1 48f · CTA 68f · HERO 72f · PALETTE 77f.
- Viewfinder: four L corners (3.5px round caps) close in from 76px outside to the bbox with `spring(damping 15, stiffness 210)`
  (one visible overshoot, slightly inside the bbox and back). Arm length goes 40→26px, one step 3f later (follow). `ft+3→+6` a cobalt focus flash inside the frame
  (fill 0.075 + 2px inner stroke), `+6→+18` settles.
- Label appears at `ft+5`: a small design-tool-style cobalt tag with white text (height 50, 32px monospace, category 750 bright / detail 500 · 78% white),
  typed out at ~2.2 characters/frame, the tag width grows with text length (right edge slightly ahead) + a white block cursor, floating up 8px→0.
- The status line counts live the number already triggered `SIGNALS 0n / 06` + a scan progress bar. 8f after the last block triggers it switches to `BRAND READ` (turning machine color),
  and the ~60f hold after that is the complete poster.

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Scanline | 74f constant speed, window y −20→860 | **Zero easing**: adding ease reads as "someone dragging a progress bar"; under 60f the labels cannot finish typing and pile up |
| Trigger conversion | ft = SCAN0 + (y+h−Y0)/(Y1−Y0)·(SCAN1−SCAN0) | To change the scan window, change only the four constants SCAN0/SCAN1/Y0/Y1 and the triggers follow automatically |
| Minimum gap | prev + 4f | LOGO / NAV on the same row would pop on the same frame; only after clamping can they be read one by one |
| Viewfinder close-in | 76px outside → 0, spring damping 15 | Outset by pixels, not scaled by ratio: big and small targets close in by the same amount; an outset under 40px does not read as an "aiming" move |
| Corner brackets | arm length 40→26px, stroke 3.5px | An arm longer than 1/3 of the target's short side becomes a full border and loses the "viewfinder" meaning |
| Focus flash | fill peak 0.075 | Above 0.12 it becomes a gray box on a light base, reading as "selection highlight" rather than focus confirmation |
| Label | starts at ft+5, ~2.2 characters/frame, 32px monospace | The 5f lag is the cause and effect of "named only once the frame is steady"; drawing the tag to full width before typing shows an empty blue bar |
| Counter line | counted live by fired, 30px monospace | A counter on a hard-coded timeline stops matching once a bbox changes; it must count live |

## Known traps
- **The scanline trigger moment is tightly bound to the target bbox**: after changing the page content, re-measure the `x/y/w/h` of the targets.
  The bboxes are measured by hand (elements are not measured automatically), with about 12–16px of margin.
- Label placement has four choices (`right / above / below / belowRight`), and the width is estimated from the monospace character count `CHAR_W = 0.6em`.
  When a word gets longer, first check whether it overlaps a neighboring module or is pushed out of the window. Put labels for wide targets like the H1 above, and right-align labels for top-right targets below.
- On a light page the scanline and corner brackets need a dark, saturated machine color; a light glow line is almost invisible on a light base.
- Division of labor with `scanline-assemble-flyin`: that one is "scan = assemble" (the page goes from empty to full),
  this card is "scan = annotate" (the page already exists, only analysis is done).

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`scanline-annotate-focus/ScanlineAnnotateFocus.tsx`](../../../src/demo/effects/scanline-annotate-focus/ScanlineAnnotateFocus.tsx)

