---
name: node-field-backdrop
summary: Behind the whole film, faint dots drift slowly and link with hairlines when they come close, fading out toward the edges; the web brightens when the product arrives.
use: A quiet, on-brand moving background for a dark product film, especially one whose subject is connections (memory, graphs, data). Lives under every scene, not in one shot.
length: the whole film; the lift is 60f
energy: low
tags: effects, background, particles, nodes, deterministic, promo
source: shorts-kit/knowns-tvc-v4
---
# node-field-backdrop

## Intent
A flat black background makes a phone video feel like slides; a busy one fights the type. The node field is
barely there: slow, thin, masked to the middle. It keeps every frame alive under the static moments and it tells the
product's story in its own texture (things linking up). Its one beat is the lift: the links are dimmer during the
pain and come up when the product is revealed, so the background agrees with the story.

## Motion core
- Layout at half size, a 540x960 "web view", drawn into a 1080x1920 SVG at 2x. This keeps node density and speed
  the same as the web component on a phone.
- Nodes from the kit's own helpers: `makeNodes(nodeCount(540, 960, 1), 540, 960, seed 11)` = 58 nodes, each with a
  random direction and a speed of 6-16 px/s (half-size px), from a seeded `mulberry32`.
- One step per frame: `stepNodes(copy of previous, (1/30)·0.9, 540, 960)`: velocity times dt, soft bounce off
  the edges. Speed factor 0.9.
- States are cached in an array that grows from frame 0: `STATES[n] = step(STATES[n-1])`. Frame N is always the same
  picture, whatever order frames are rendered in.
- Links: every pair under `linkDistance(1) = 130` px (half size) is drawn; alpha `linkAlpha = (1 - d/130)²`, stroke
  the foreground `#fafafa` at `alpha·0.32·lift`, 2px. Nodes: radius 2.8, opacity `0.55·lift`.
- Mask: `radial-gradient(ellipse 70% 65% at 50% 45%, #000 35%, transparent 100%)`. The field fades out before the
  frame edges and the safe-zone UI.
- Lift: `lift = interpolate(f, [revealStart, revealStart + 60], [0.7, 1.25])`, clamped. Before the reveal the field
  runs at 70%; from the reveal on at 125%.
- Passed once as the template's `background`, so it is continuous across cuts.

## Parameters
| Parameter | Typical value | Feel when changed |
|---|---|---|
| Field size | 540x960 drawn at 2x | Laying it out at 1080x1920 doubles node count to the area and halves the apparent speed: a dense, static web |
| Density | 1 (58 nodes) | 1.5 gives about 130 nodes and the links start to read as a texture, competing with type |
| Speed factor | 0.9 | Over 1.5 the drift is noticed as motion; under 0.5 it looks frozen between cuts |
| Link distance | 130 half-size px | Longer links form a mesh; shorter leaves isolated dots |
| Link opacity | 0.32 x lift | Over 0.5 the lines show through text cards; under 0.15 it vanishes on a phone screen |
| Lift | 0.7 → 1.25 over 60f at the reveal | A hard step reads as a glitch; no lift wastes the background's one beat |
| Mask | ellipse 70% x 65% at 50% 45% | A wider mask puts lines under the platform UI at the edges |
| Seed | 11 | Any fixed seed; change it only if the opening frame has an ugly cluster under the headline |

## Known traps
- The original web component runs on `requestAnimationFrame` with mutable state. Remotion renders frames out of
  order and in parallel, so it cannot be used as is: redraw it per frame from the pure helpers, as here.
  The general rule is in [`docs/promo/real-ui.md`](../../promo/real-ui.md) (Traps).
- `stepNodes` mutates its input. Copy the previous state (`map(n => ({...n}))`) before stepping, or the cache is
  corrupted and frame N changes after frame N+1 is drawn.
- Each render worker rebuilds the cache from frame 0 the first time it is asked for a frame. That is O(N) once per
  worker: fine for a 45 s film, worth knowing for a 10 min one.
- Links are O(n²): 58 nodes is about 1,650 pair checks per frame. Do not raise density without checking render time.
- Prove determinism: render the same frame twice and compare file hashes (done on frames 340 and 930).
- A cutdown with the same background starts the field from frame 0 again, so its first frames show a different
  pattern than the master at the same scene. That is expected; do not try to offset it.

## Pairs with
- [scatter-pull-graph](../ui-entrance/scatter-pull-graph.md): the lift starts with that reveal and the hairlines
  match.
- [glow-flyline-moves](glow-flyline-moves.md) for a brighter, more active dark-stage background.
- [voice-word-relay](../typography/voice-word-relay.md) (the `Head` style) for type in the same look.

## Reference implementation
- [`node-field-backdrop/look.tsx`](../../../src/demo/effects/node-field-backdrop/look.tsx) (`nodesAt`, `FieldBg`)
- [`node-field-backdrop/Video.tsx`](../../../src/demo/effects/node-field-backdrop/Video.tsx) (the `lift` window on the reveal)
- The helpers (`makeNodes`, `stepNodes`, `linkAlpha`, `linkDistance`, `nodeCount`) come from Knowns UI's
  `blocks/backgrounds/bg-utils.ts` (MIT), not copied here.
