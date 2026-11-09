---
name: integration-hub-map
summary: The old page flips a full 180° in one quick turn (the side edge flashes bright for an instant) and lands as the new hub page. Five integration app icons pop in on the same frame, then five rainbow light pipes connect on the same frame, and pulses keep flowing inside the pipes: "turn to a new page, the whole ecosystem plugs in at once"
use: Integration / ecosystem capability sections (one product connects everything); version-refresh narratives (old page flips into new page); feature climax in a dark neon tone
length: wind-up ~0.5s + quick flip ~1.2s + icons appear together → pipes connect together, two beats ~0.7s + flow breathing ≥1.5s; whole section 4.5–5s
energy: medium-high (the flip is the burst, the flow section is the afterglow)
tags: effects
---

## Intent
The flip is "a change of era": the old document page turns a full 180° to get the new hub page. It must be a
complete flip and not a partial turn (precedent), and the flip action is a **quick flip + end deceleration**, done
in one breath with no staged pauses (the "constant speed" precedent: when the user said constant speed they meant no pauses, not literal
linear; the version with a pause at the 90° side edge was rejected). At the side-edge moment it only "flashes once" (a 1–3f pulse;
a long glow plateau was rejected). Connecting is a **two-beat design**: five icons pop in on the same frame (first beat) → the five
pipes start drawing and connect on the same frame (second beat). Together is what reads as "the ecosystem arrives all at once"; connecting
one by one with a stagger reads as negotiating one by one (rejected in two rounds). Once connected, bright pulses in the pipes keep looping in the direction
icon → hub, and the "sense of delivery" is the life of the end state.

## Motion core
- Flip: rotateY 0→180°, 35f, Easing.out(cubic) (80% of the angle is done in the first 41% of the time,
  with a long decelerating tail for a soft landing), a double-sided card (front old page / back new page)
- Side-edge flash: a 2f bloom pulse at ~90° (0→1→0.25→0, back to zero within 4f)
- Two-beat connection: the five icons tIcon appear on the same frame (3f after the flip settles); 10f later the five pipes
  tPipe start drawing on the same frame, growing together and fully lit in 9f
- Delivery pulse: bright dash spots in the light pipes loop in the direction icon → hub (speed ~4.6px/f,
  with phases offset per pipe), and once fully connected the hub page breathes lightly
- Background: dark purple base noise + neon rectangles floating up as a backdrop

## Parameters
| Parameter | Typical value | Feel when tuning |
|------|--------|----------|
| Flip duration | 35f (once 70f, rejected with "twice as fast") | Under 24f the two sides cannot be read; the end deceleration is about 60% of the time covering 20% of the angle |
| Flip curve | ease-out, monotonic, no pause | A side-edge pause or segmenting was rejected; strict linear with abrupt start and stop was also rejected: quick flip, soft tail |
| Side-edge flash | 2f pulse, back to zero in 4f | A long glow plateau was rejected with "just flash once" |
| Connection rhythm | two beats: icons on the same frame → pipes on the same frame +10f | Staggered one-by-one connecting was rejected in two rounds with "appear together, then connect together"; a gap between the two beats <6f reads as one beat |
| Pipe growth | grow together in 9f | The 18f version is a bit slow; pipes have different lengths but arrive on the same frame (normalized by each len) |
| Delivery pulse | ~4.6px/f loop, phases offset | A static line means no "sense of delivery" (precedent); the same phase reads as flickering |

## Known traps
- The demo passed tuning on grayscale / placeholder material. The parameters are a tuning starting point, not a final production setting;
  the first production use must re-verify on real material
- The timing precedent chain is on record in full: staggered connecting ×2 rejected → pipes together but icons staggered rejected →
  the two-beat design passed. "At the same time" is the rhythmic identity of this card
- Division with glow-flyline-moves: that card is about the light effect of the flylines themselves; this card is
  the narrative structure of flip + two-beat connection + delivery, and the light pipes are just elements
- Division with canvas-materialize-moves: that card is about canvas elements becoming solid; the core of this card
  is the "old page flips into new page" meaning of a changeover
- Double-sided card implementation: a horizontal/vertical line with bbox=0 breaks SVG filters/gradients (the three-pipes-vanished
  precedent). Pipe gradients use userSpaceOnUse, defined separately per pipe

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`integration-hub-map/IntegrationHubMap.tsx`](../../../src/demo/ui-entrance/integration-hub-map/IntegrationHubMap.tsx)

