---
name: neon-frame-forerun
summary: A strongly perspective right-angled neon frame races out from the left edge in two directions and forms first. The page goes from dark to lit inside the frame, while components / text inside it drop in from 3D overhead with a same-shape soft shadow, staggered, and finish fitting as the page lights up. The background neon group (in the demo, a tunnel of same-shape frame echoes in depth) goes out in the last stretch to give way
use: A "debut ceremony" for a UI panel in a dark-scene brand film (frame first, content after); the first reveal of a feature area; section openings in a neon / cyber tone
length: frame race ~0.7s + light-up & drop ~2.7s + background fade-out close ~1s; whole section 4–4.7s (demo 140f)
energy: medium-high (three layers of action stack up, but all serve the same debut)
tags: effects
---

## Intent
Build the frame first, then fill in the flesh: the neon wireframe races in two directions like runway lights to outline the position and announce
"something will appear here". While the page goes from dark to lit inside the frame, components drop in from the air with their shadows,
and the viewer sees the interface being "placed" into the frame. The three layers of action (frame race / page light-up /
component drop) must **mesh in sync**: the drop progress moves in step with the light-up progress and finishes slightly after it,
and the frame light finally merges into the panel glow. The background neon tube group goes out in the last stretch, handing the brightness to
the lead to complete the close.

## Motion core
- Neon frame: a strongly perspective right-angled frame. Two white-hot bright heads leave the midpoint of the left edge and race up and down separately (20f; swift start,
  brake at the midpoint of the right edge, collide and flash once). The tube is four stroked layers plus glow (wide soft halo / medium halo / color core / white-hot core),
  with no blur filter, which is cheap and sharp. After forming, the core line shrinks to a hairline and the frame light merges into the panel rim glow
- Page light-up: only after the frame closes does the page float up out of black (16–30f), then go from dark to lit (24–84f smooth),
  while a layer of cold purple dark veil retreats from the left edge to the right, reading as "the neon lights the page"
- Component drop: **true 3D hovering**. The panel and components are both inside preserve-3d, with components at translateZ 120–170px,
  and a same-shape silhouette soft shadow falls on the panel (the higher, the bigger, blurrier and fainter, offset to the lower right). Brightness uses brightness on leaf nodes,
  and no filter/opacity is put on a 3D parent (it would flatten the 3D). Each piece falls with 24f of acceleration + a soft landing,
  and landing points 54→104f are staggered "sidebar top to bottom → main area top to bottom" (dense first, sparse after), finishing about 20f later than the light-up
- Background: 5 layers of echoes of the same frame in depth (translateZ receding, enlarged layer by layer) form a neon tunnel,
  which "strikes" layer by layer from near to far after the frame closes (a deterministic flicker like a fluorescent tube starting); in the last stretch the middle goes out first and the two ends later (94–118f)
- Camera: rotateY −30° → −12° (0–96f EASE.out long deceleration), then a very slow further 1.5° turn in the hold section

## Parameters
| Parameter | Typical value | Feel when tuning |
|------|--------|----------|
| Frame race | 20f, two heads racing toward each other (swift) | One head drawing reads as drawing a picture; >30f and the viewer cannot wait for the content |
| Hover height | translateZ 120–170px, shadow converges with height | Precedent: too small a height + a too early start = shadow not perceivable (v3 round 1 was redone, enlarged 1.7x and delayed) |
| Drop window | 24f each; landing points 54→104f, finishing about 20f later than the light-up | Drops that finish before the light-up = furniture landing in a dark room; too much lag reads as two separate scenes |
| Stagger | offset starts, falls overlap and run in parallel (EASE.out distribution, dense first, sparse after) | Serial waiting was rejected (general precedent for falling rhythm) |
| Background fade-out | middle lit, tail out; each layer flickers out in 6f, layer interval 7f | Without fading out the lead does not stand out; all out on the same frame reads as a power cut |
| Drop granularity | card / row level (brand, 4 nav items, greeting, 3 number cards, 4 task rows) | The finer the granularity the more expensive; the fewer the elements, the larger and easier to read each piece |

## Known traps
- The demo passed tuning on grayscale / placeholder material. The parameters are a tuning starting point, not a final production setting;
  the first production use must re-verify on real material
- Hovering drop is the core signature of the clickup language (a verified signal of taste). This card
  shares the FloatWrap pattern with graze-face-tour: a shadow that cannot be perceived is as if it was not done
- Division with brand-frame-snap: that card is the beat piece of the brand frame snapping into position with a click; this card is the debut ceremony of frame first + content drop, and the frame is only the prologue
- Note on a derived direction: the view-rotation variant (camera rotating in an arc left to right + simultaneous drop)
  was once rejected with "tweak then look again" (it asked for all components to drop at the same time), and has been folded into the neon-frame-orbit-drop card

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`neon-frame-forerun/NeonFrameForerun.tsx`](../../../src/demo/ui-entrance/neon-frame-forerun/NeonFrameForerun.tsx)

