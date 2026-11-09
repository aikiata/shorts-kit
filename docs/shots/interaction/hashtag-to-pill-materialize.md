---
name: hashtag-to-pill-materialize
summary: A hashtag typed into an entity. "#word" is typed in the center (solid red cursor always lit), 1 hard-cut frame turns it into a large capsule tag, after a hold it shrinks and moves left to land in the page's tag slot, then 1 more hard-cut frame reveals the finished page. The rhythm skeleton is "two hard cuts, one slide".
use: Demo segments for tag/category/keyword features (typing a tag in a notes app, topic aggregation); the three-part narrative "input → becomes a UI entity → settles into the finished product"
length: 120f (4s): typing ~40f + hard-cut capsule hold ~18f + shrink-and-move ~14f + stillness after the hard-cut reveal ~1.2s (source 18–21.5s)
energy: medium (crisp and clean; the punch comes from the hard cuts, not from bouncing)
tags: typography
---

## Intent
The usual way to turn text into an entity is a fade, morph or expand. The frame-by-frame breakdown of the source shows Bear does the opposite:
**the materialization is a 1-frame hard cut**. One frame is still text plus cursor, the next is the complete
capsule, with no expansion, no cross-fade and no rebound. The hard cut gives the certainty of "snap, done".
Any gradient would soften the "entity" into an "effect". The skeleton of the whole segment is **two hard cuts around one
slide**: hard-cut materialization → smooth shrink-and-move into place → hard-cut reveal of the finished page. The only continuous
motion (the shrink-and-move) is framed by two hard cuts, which is why it feels both fast and steady. This rhythm skeleton is the crux:
if the nature of any of the three moves changes (hard cut turned into a gradient, slide turned into a hard cut), the whole card collapses.

## Motion core
- Typing segment: a geometric sans-serif (Futura character) types "#word" in the center, with a **solid red cursor
  always lit and never blinking** (measured from the source, do not add blink); human rhythm of 4–6f/char with deterministic jitter
- **Materialization = 1 hard-cut frame**: the text + cursor layer disappears entirely, and on the same frame an unstroked light-gray
  capsule + icon + word appears (same font size, same position and size, the # replaced by the icon); only
  a 3f 1.03→1 micro-settle is allowed, to avoid stiffness
- The capsule holds ~0.6s → one bezier easeInOut shrinks and moves it left (~0.55x,
  ~14f) into the page tag slot; position and scale share the same curve and start/end, with no splitting midway
- After it lands, **another 1-frame hard cut** reveals the finished page: background / title / body / capsule colors
  all change on the same frame, then it ends truly still
- Implementation point: draw the capsule at the large font size and scale it with a whole transform, and
  transformOrigin must be 0 0 with translate first, otherwise the landing center drifts

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| typing rhythm | 4–6f/char (source ~6 chars/second), mulberry32 jitter | Even spacing reads as machine typing; the cursor must stay lit (**measured from source**, it does not blink) |
| materialization | **1-frame hard cut** (source measured frame by frame, no transition at all) + 3f 1.03→1 micro-settle | Adding a fade-in or expansion instantly downgrades it to an ordinary morph; a micro-settle >4f reads as a bounce |
| capsule geometry | 740×236@1920 (**source measured** 493×157@720p ×1.5), no stroke | The capsule must be "excessively wide and large" to feel like an entity; adding a stroke reads as a button |
| hold | ~18f (0.6s, **source measured**) | <12f and the viewer flies past before seeing what the capsule looks like |
| shrink-and-move | ~0.55x (**source measured** 273/493), 14f, bezier(0.5,0,0.25,1) | Scale and displacement must share one curve; tuning them separately reads as two animations |
| reveal | 3f after landing, another 1-frame hard cut of the whole page | If the reveal is made a transition, the second hard cut is gone and half the skeleton collapses |

## Known traps
- The demo was tuned on grayscale/placeholder material. The parameters are a tuning starting point, not a final production setting.
  The first production use must be re-verified on real material
- It overlaps in domain with typewriter-moves (typing presentation) and ui-to-brand-morph (gradient morph forming):
  the crux of this card is **hard-cut materialization, not gradient morphing**. As soon as you want to add a transition,
  use those two cards instead of changing this one
- An early version invented a "capsule flies in and slides into a note card below" segment; comparison with the source disproved it and it was cut.
  Do not revive the flight segment
- The default transformOrigin of 50% 50% makes the scaled landing center drift by (1−s)×half-width,
  so you must use origin 0 0 + translate to the target center and then scale (comment in the demo)
- Remaining gaps from the source: Futura fallback font weight, and the reveal-frame body spacing is off by ~10px;
  the rhythm and hard-cut timing are aligned frame by frame. The demo content has been changed to the shorts-kit world
  (source "#music" + note icon → "#shots" + clapperboard icon, finished page "My favorite shots"),
  the hashtag word is the same length as the original word, and the capsule geometry is unchanged

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`hashtag-to-pill-materialize/HashtagToPillMaterialize.tsx`](../../../src/demo/interaction/hashtag-to-pill-materialize/HashtagToPillMaterialize.tsx)

