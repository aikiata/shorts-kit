---
name: canvas-materialize-moves
summary: Two forms of content "materializing onto the canvas": panel-to-canvas (table rows in a panel fly out along an arc and morph across containers into canvas cards) and diagram-cascade (after the prompt is typed, nodes pop out layer by layer; connector lines grow before the nodes).
use: Narrative segments in AI/collaboration tools where "the generated result lands on the canvas". Form A says "existing content took another form of existence"; form B says "a whole structure grows from one sentence".
length: A ~5s (150f) / B ~6s (180f)
energy: medium
tags: ui-entrance
---

## Intent
The library's generation narratives so far are only "text written out letter by letter inside a window" (document-typewriter-reveal, the document writes itself) and "the chart comes alive" (chart-live-moves). Nothing covers **content leaving its container and materializing into a new entity on an open canvas**. This card fills that gap: the canvas is the stage, the generated objects are the actors stepping onto it. The crux of form A is the cross-container form migration. The same piece of content turns from a "row" into a "card", and position, width/height, corner radius and content layout interpolate in sync on one spring, so the viewer reads "it flew over and changed" rather than "one deleted, one added". The crux of form B is the cascade timing: lines draw nodes out, layers feed layers, and the sense of structure comes from sequence, not simultaneity.

## Choosing a form
| Form | How | Use |
|----|------|------|
| A panel-to-canvas (rows to cards) | The cursor ticks the checkboxes one by one → the button presses → the three rows first lift off, then fly out staggered along an upward-thrown arc; mid-flight the row form and the card form cross-fade; they land with a tilt and a landing squash; the panel row slots collapse into dashed blank outlines | Bulk import / one-click to board: content migrates from a list state to a spatial state |
| B diagram-cascade (cascading generated tree) | The prompt is typed letter by letter (outline confirms when typing ends; after submit the outline streams light = generating) → a line drips from the prompt bottom to connect the root (gradient outline lead) → 2 children → 4 grandchildren are pulled out of the top port layer by layer; elbow connectors with a comet head lead by 10f; the camera pulls back from a prompt close-up to reveal the whole tree; once the tree is built the whole tree breathes one beat | AI-generated structure diagrams / mind maps / ER diagrams: one sentence grows a tree |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| A tick | 14/24/34f one by one (cursor swift arc hits each in turn), spring(damping 11, stiffness 300) pop + check stroke drawn in 7f | Ticking is the "foreshadowing"; without it the viewer doesn't know who will fly. Ticking all on the same frame reads as already statically selected |
| A takeoff stagger | Button pressed at 52f, three rows lift at 56/62/68f (4f: scale up 2% + shadow deepens) then take off (stagger 6f) | Taking off on the same frame reads as copy-paste; stagger >12f makes the last row look like a straggler; flying without lifting reads as deleted |
| A flight interpolation | spring(damping 17, stiffness 95, mass 0.9); position follows a quadratic Bézier, midpoint raised 220px; width/height converge 3f later | A straight line reads as a translation, not as "poured out"; a midpoint lift <100px loses the arc feel; size in sync with position loses the weight of "parent first, child after" |
| A form migration | row 626×104 → card 486×300, corner radius 18→24, rowOp fades out at us 0.08→0.4, cardOp fades in at 0.5→0.8 | The cross-fade of the two content sets must be staggered: both visible at mid-point gives it away |
| A landing tilt | −2.5 / 1.8 / −1.2°, on landing 6f scaleY 0.97 squash and rebound | All positive reads as grid layout; >4° reads as a scatter glitch |
| A speed blur | SpeedBlur amount 0.32, max 14 (along the arc velocity direction) | Only during flight; back to zero after settling |
| B typing | 0.95–1.2f per character, uneven, 1.7f pause on a space; when typing ends the prompt bar outline turns purple to confirm, +4f then the submit key is pressed | Even typing reads as a machine; without the confirm state there is no causal hook between "done typing" and "start generating" |
| B camera | Opens at 1.3× pushed in, prompt centered; after submit 72f smooth pull-back to 1.0 | Without the push-in the lower half of the frame is empty for the first 2s; the pull-back must run at the same time as the cascade, so the tree grows into the space the camera "retreats" out of |
| B cascade timing | root = submit +14f, 22f between layers, 5f stagger between siblings in a layer; nodes spring(damping 14, stiffness 190), scale origin = top edge midpoint (pulled out of the port) | Layer gap <12f reads as everything appearing at once; siblings on the same frame read as a copy; center scaling reads as a popup |
| B line leads | SVG arc elbow path (parent bottom port → midline → child top port), stroke drawn in 16f ease-out, 10f earlier than the child node; a comet light dot at the line head | "The line pulls the node out" is the source of the causal feel; a line later than its node becomes a patch-up stroke |
| B closing breath | From the last node +22f, around the tree center scale 1→1.03→1 (smooth, 28f), the aurora behind it brightens one notch in sync | The breath is the full stop of "tree built"; >1.06 reads as a zoom glitch |

## Known traps
- The demo was tuned on grayscale/placeholder material. The parameters are a tuning starting point, not a final production setting.
  The first production use must be re-verified on real material
- Division of labor with chart-live-moves: that card is the liveliness of the data chart itself (flow lines / dot matrix / axis burst).
  Form B is the **birth process** of a structure diagram. A living diagram ≠ a diagram being generated; do not use form B to perform an existing chart
- In form A the row slots must collapse into dashed blank outlines. If the original spot stays intact after the row flies away, "migration" degrades into
  "copy", and the semantics are entirely lost
- In form A the cross-fade window (rowOp gone before u≈0.45, cardOp up after it) is the crux of avoiding a giveaway;
  the spring overshoots, so u can briefly exceed 1, and content opacity must be clamped
- In form B the breath origin must be the visual center of mass of the tree (demo 960,620), not the frame center,
  otherwise it reads as a whole-screen zoom
- In form B the comet head takes its point from the path arc length: the elbow must use SVG arcs (A command), not quadratic Béziers, so the length can be computed analytically,
  and the line head does not come apart from the stroke endpoint

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`canvas-materialize-moves/DiagramCascadeBuild.tsx`](../../../src/demo/interaction/canvas-materialize-moves/DiagramCascadeBuild.tsx)
- [`canvas-materialize-moves/PanelToCanvasMaterialize.tsx`](../../../src/demo/interaction/canvas-materialize-moves/PanelToCanvasMaterialize.tsx)

