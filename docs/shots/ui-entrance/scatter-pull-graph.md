---
name: scatter-pull-graph
summary: Four tilted cards land far apart, one on each spoken word; a scene later the same parts fly in from far outside and settle as labelled nodes around one hub, their links drawing out as they arrive.
use: A before/after of "your things are scattered" against "the product connects them": the problem scene, then the reveal of a hub, a repo, a workspace.
length: scatter 4 x 10f on the voice; graph about 70f (5 nodes 14f apart plus a 14f landing), inside a 240-300f reveal scene
energy: medium
tags: ui-entrance, graph, hub, reveal, before-after, voice, promo
source: shorts-kit/knowns-tvc-v4
---
# scatter-pull-graph

## Intent
The pain is a layout: the decision is here, the spec there, the task somewhere else. Show it as a layout. The
scattered cards are slightly rotated and set in two loose columns, so the frame looks untidy. In the reveal the same
names come back as one ring around a hub, pulled inward from outside the frame, so the motion itself says
"brought together". It is two scenes and a cut, not one morph: each scene stays readable on its own.

## Motion core
Scatter (scene `where`):
- Four cards (real Knowns UI `Card` + `Tag`, drawn at `zoom 2.4`, 350 design px wide): Chat, Doc, Board, Code.
- Each lands on the voice word that names it (`decisions,`, `specs`, `tasks`, `scattered.`):
  `k = ramp(f, at, 10, easeOut)`, `opacity = k`, `translateY = (1-k)·30`px, a fixed tilt.
- Positions: x `L-6`, `L+410`, `L+6`, `L+416`; y 540, 580, 860, 880; tilt -2.5°, 2°, 1.5°, -2°. Uneven on purpose.
- The headline above lands on the same words ([voice-word-relay](../typography/voice-word-relay.md)), the last word
  "Scattered." in red.

Pull into the graph (scene `reveal`, `RepoGraph`):
- Hub card "your repo / .knowns/" at (panel centre, y 1320), `k = ramp(f, firstNode - 12, 10)`,
  scale 0.85 → 1, accent ring and glow.
- Five nodes at frames 150, 164, 178, 192, 206 (14f apart), placed on an ellipse from the top, clockwise:
  angle `-90° + i·72°`, x radius `235·1.2`, y radius `235·0.86`.
- Each node: `k = ramp(f, at, 14, easeOut)`, distance factor `far = 1.8 - 0.8·k`: it starts 1.8x out (mostly off
  the panel) and is pulled in to 1x. Label opacity `min(1, 2k)`.
- Link: an SVG line from the hub to the node's current position times `k`, so it grows out with the node;
  stroke the foreground colour at `0.35·k`, 2px (the same hairline as the Node Field background).
- Sound: one `tick` per node, volume `0.32 - 0.04·i`.

## Parameters
| Parameter | Typical value | Feel when changed |
|---|---|---|
| Scatter tilt | ±1.5-2.5° | 0° looks like a tidy grid, the point is lost; over 5° it looks thrown, playful |
| Scatter rise | 30px, 10f | Larger competes with the headline words landing at the same time |
| Node stagger | 14f | Under 8f the nodes arrive as one burst and the sound ticks blur; over 20f the ring takes too long for a 9:16 cut |
| Pull distance | 1.8x → 1x over 14f | 1.3x is a gentle settle; over 2.2x nodes cross the frame edge and pop in |
| Hub lead | 12f before the first node | The hub must be there before anything is pulled to it |
| Ring radius | 235 (x 1.2, y 0.86) | Larger than the panel width and side labels clip; smaller and labels overlap the hub |
| Node count | 5 | 3-6 reads as a set; more shrinks each label below phone size |

## Known traps
- A generic graph component (`AgentGraph`) was tried for the ring and dropped: it fits the whole canvas into its
  box, and five nodes shrank its labels to about 18px on screen. Lay the ring out by hand with real `Tag`s.
- The graph needs about 7.4 s of the reveal to land after the plain sentence and the install command; that is why
  the short cutdown is 16 s, not 15 ([cutdown-retime](../rhythm/cutdown-retime.md)).
- Cards and nodes are different objects in different scenes. Do not try to animate the cards across the cut; the
  name on the node is what carries the match.
- A card on the voice word needs `nth` for repeated words ("Your ... Your").
- Render the components with their CSS animations off and props from the frame
  ([`docs/promo/real-ui.md`](../../promo/real-ui.md)).

## Pairs with
- [bezier-source-converge-merge](bezier-source-converge-merge.md) for curved links into one point.
- [node-field-backdrop](../effects/node-field-backdrop.md): its hairlines rhyme with the graph links, and its lift
  starts with this reveal.
- [crash-zoom-punch](../camera/crash-zoom-punch.md) onto the hub.
- Sound card [tick](../sfx/tick.md).

## Reference implementation
- [`scatter-pull-graph/scenes.tsx`](../../../src/demo/effects/wrong-build-stamp/scenes.tsx) (`Where`, `Place`, `RepoGraph`, `makeReveal`)
