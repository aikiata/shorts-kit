---
name: panel-grid-moves
summary: Panel rhythm. comic-panel-split cuts comic-style diagonal panels showing three camera angles of the same subject; after three click-click-click panel freezes, the last panel's diagonal edge eats the screen into a poster.
use: Treating the "panel" as a rhythm device: side-by-side freezes of the same subject from multiple angles, cut out panel by panel on the beat; catches beat points
length: 156f ≈5.2s (full-screen side shot 20f + three-cut panel freezes + screen-eating + poster hold)
energy: medium-high
tags: ui-entrance
---

## Intent
The difference from wall-reveal-moves is this card's positioning anchor: that one is "how the whole wall enters"
(a one-time reveal); this one is "how panels act as a rhythm device". The panel split happens on the beat, and a panel change is a drum hit.
A is a join: the frame is split open by three diagonal gutters, click-click-click, the same product is frozen from three camera angles at once,
and after a one-beat pause the last panel's diagonal edge sweeps across and eats the full screen. This is Scott Pilgrim's split-screen language.
It suits a single product with multiple views (demo: a prime lens engraved with shorts-kit, the three panels' caption boxes numbered
"Shot 01 / 02 / 03", landing as a "Craft the shot." poster after the screen is eaten).

## Choosing a form
| Form | How | Use |
|----|------|------|
| A comic-panel-split | Full-screen 3/4 side shot 20f → three 12° diagonal gutters cut from top to bottom, one every 4f, with the matching panel hard-cut popping in (5f scale 1.07→1 + white flash); the three panels = full body / detail close-up / macro of the same subject; the 29f freezes are kept alive by the subject's own motion; the last panel pulls back in reverse for 2f + 14f sweeps the screen and eats it into a poster | Side-by-side multiple views of the same subject; comic-feel segments |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| A diagonal gutter | SVG double line: ink edge + cream paper core (total width 18px), 12° slant, each cut drawn from top to bottom in 3f | The paper core of the diagonal gutter is the crux of the comic feel; a straight gutter reads as a split-screen tool |
| A keep-alive | The subject moves by itself during the freezes: focus ring turns 26°, aperture blades close in, the full-body panel pushes in very slowly | Three fully still panels read as a screenshot collage; "the lens is working" has more content than a slow push |
| A caption box | Cream fill + 4px ink stroke + 7px hard drop shadow, stamped in with a -2° tilt, lives inside the panel and is covered along with the panel | The second anchor of the comic language; floating above the panel gives it away |
| ending | ~50f poster hold after the last line of text is revealed (only a 1.5% very slow push-in) | R1; the mask-off frame is aligned pixel for pixel with the screen-eating end value to avoid a jump |

## Known traps
- The demo was tuned on invented content (a vector lens). The parameters are a tuning starting point, not a final production setting.
  The first production use must be re-verified on real material
- The three panels must be **different camera angles of the same subject**. If three panels hold different content it reads as a bento
  layout, not comic panels, and the semantics scatter
- Catches beat points, strongly depends on sound: three clicks panel by panel (sound-design §4.5); a panel split that doesn't hit the beat is just a layout animation
- Draw the subject as SVG vector (or use high-resolution material): the three panel angles enlarge up to 2.45x,
  and a bitmap screenshot goes blurry when enlarged (Q2)
- At most 1 panel-split segment per piece: the panel language is too recognizable, and two segments collide

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`panel-grid-moves/ComicPanelSplit.tsx`](../../../src/demo/rhythm/panel-grid-moves/ComicPanelSplit.tsx)

