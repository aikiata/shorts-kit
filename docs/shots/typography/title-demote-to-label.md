---
name: title-demote-to-label
summary: Big title demoted to a section label, in two styles. A: the big title develops at the center and holds for a beat, then shrinks continuously by 0.3x and translates to the top-left corner to land as a small section label, while the content area grows below it. B: the same routine, but on entry a text-selection highlight block sweeps in and is then removed
use: Chapter openers (the title is the lead first, then yields to the content); section handoffs in tutorial/feature-demo videos; style B adds an identity hint to "text/editing" products
length: A ~3.7s (112f) / B ~4.5s (134f); the demo plays the two styles in series for 246f
energy: low-medium (a layout-transformation type, an atmosphere shot)
tags: transition
---

## Intent
The usual fate of a chapter title is "appear → disappear → content enters", with the title and the content never knowing each other.
This card makes the title **demote without leaving**: the big centered text holds for a beat to announce the topic, then one continuous
tween shrinks it to 0.3x and flies it to the top-left corner, where it lands as this section's column label. It is still on screen,
just changed from lead to door sign. The viewer gets free spatial memory: the big word just now is
the small word in the top left now, and this section is about it. The content skeleton starts growing while the demotion is still in progress,
so the handoff has zero gap.

## Motion core
- The demotion is a **single continuous tween**, 26f asymmetric in-out (bezier(0.6,0,0.18,1): decisive start, very soft landing):
  scale 1→0.22 (220px title → ≈48px label) + position (960,540)→(216,196) on the same curve. Split into two segments (shrink first, then fly) it reads as two actions
- transform-origin left-middle; the centering correction translate(-50%) goes to zero in sync with the tween
  (`translate(${-(1-dem)*50}%, -50%)`). If it does not go to zero, the end point is off by half a width
- Entrance develop: the title rises letter by letter from below a mask line (rise, 16f per letter, 1.6f stagger), and the vermilion period pops out 10f later with an overshoot;
  the mono eyebrow "CHAPTER 01" tightens its letter-spacing from wide. After developing it must hold ≥18f before demoting (demo 20f, with a 1.5% very slow push-in during that time):
  shrinking without holding eats the announcement beat. The eyebrow fades out 6f along with takeoff, and before landing the label prefix "01 /" wipes in from the left to take over
- Content grows staggered (the demo is a storyboard workbench page of shorts-kit, and the two section titles take the brand lines "Frame." and "Craft.";
  A = 60px lead paragraph + three cards (shot recipe card / user review / beat-hit rhythm); B = 58px storyboard script + an in-sentence selection → connector line → a side note matching a shot card): each block's crop opens from the left (width 0.3→1, text not squashed) + moves up 30px fading in,
  staggered dense first then sparse; growth starts at 12f into the demotion, so the content is already growing while the title is still flying. This overlap is the source of "no gap in the handoff".
  The full-width divider line is drawn a few frames later, so it does not grow in the same frame on the title's flight path
- Style B selection highlight: the left edge / width percentages tween separately. When sweeping in, the width goes 0→100%
  (covering, 10f), and when removing, the left edge goes 0→100% (yielding from the left, 8f); the demotion starts only after the highlight is fully removed
- The demotion flight gets directional motion blur by the per-frame position difference speed (zero when still); the style B selection is the accent color at 20% transparency with an insertion cursor following the right edge
- The two styles play in series with no white flash: they share one stage, the A content exits by moving up with ease-in over 12f → the B big title develops in place;
  before the B demotion the A label moves up one row, shrinks to 0.7, and turns gray as the "previous section", and the B label lands in the same slot (the way to avoid stacking when used across multiple sections)
  (demo exports `TITLE_DEMOTE_TO_LABEL_DURATION` = 246f, look = paper)

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Demotion tween | 26f asymmetric in-out, scale→0.22 (landing at ≈48px) | <14f reads as the title being flicked away; an end point >0.45 makes the label too big and it crowds the content; a label <40px is unreadable |
| Hold beat | ≥18f of rest after developing | Skip this beat and the title runs off before the viewer has finished reading it, so the demotion was for nothing |
| Content stagger | dense first then sparse, blocks 18–22f, width 0.3→1 | Growing all at once with the same duration reads as a page refresh, not "growth" |
| Growth start | +12f after the demotion starts | Waiting until the title has fully landed leaves 8f of dead air |
| Selection highlight | sweep in 10f / hold 10f / remove 8f, accent color at 20% transparency | A highlight hold <5f reads as a flicker bug; demoting without removing it cleanly makes the color block fly along, which is dirty |
| Two-section handoff | old content exit 12f moving up; old label moves up one row and turns gray over 16f | If the old label does not make way and the new label lands on top of it = a label graveyard |

## Known traps
- The demo was tuned on grayscale/placeholder material. The parameters are a tuning starting point, not a field-tested final;
  the first real use must re-check against real material
- Division of labor with the scene-locking technique of "pinning the title into 3D space so it deforms with the camera perspective" (retired)
  (a spatial type): this card is a continuous demotion in the 2D layout hierarchy (a layout type). Use that card for "the title lives in the
  product space", use this card for "the title becomes a column name", and pick one per video
- Nothing else may move on the demotion path: the title's flight is the only focus of the whole screen, and the skeleton growth
  below the landing point does not steal from it (start times are staggered), but popups/cursors entering in the same frame always steal it
- When used across multiple sections (one demotion per section), the top-left label must **change rows, not stack**: the new label lands
  as the old label moves up to make room, otherwise from the second section on the top left becomes a label graveyard
- Style B's selection highlight is a product hint that "the text can be selected". For products that are not editor/document types
  it means nothing semantically, so do not add it just for looks
- Title copy ≤3 words: after demoting to 0.3x it still has to serve as a readable label, and a long sentence shrunk is just a gray line

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`title-demote-to-label/TitleDemoteToLabel.tsx`](../../../src/demo/typography/title-demote-to-label/TitleDemoteToLabel.tsx)

