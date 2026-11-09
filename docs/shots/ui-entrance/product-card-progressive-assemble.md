---
name: product-card-progressive-assemble
summary: A detail card builds itself as if its fields were being grabbed one by one. A "fill cursor" jumps ahead from field to field: image → title → category pill pop in turn → the original price appears and is then struck through and demoted, while an accent-color new price springs out → body text is revealed line by line with a highlight block brushing across from left to right → color swatches light up → the button fills. The whole card pushes forward very slowly in scale throughout
use: Capability display of product / item detail pages; the main shot for narratives like "structured extraction", "auto-fill" and "data grows by itself"
length: about 5.7s (172f@30fps)
energy: medium (many small events laid out densely, no single burst; the forward push keeps the sense of progress)
---

## Intent
A detail card that just fades in shows the viewer only "there is a card". Placing fields one by one turns the card into a **form being filled in**:
each field arrives on its own, and the viewer's attention is led once through the card's information structure: where the image is, where the title is,
where the price is, where the key point of the body text is. The strike-through demotion of the price is the only semantic event in the shot (not "appears" but "changes"),
so it is placed at the most prominent spot in the middle.

## Motion core
(Demo: porcelain-white look, native 1920 coordinates; the 1520×840 detail card takes 79% of the frame width, and the product is shorts-kit itself: the mark is placed in a studio shot, and the title shorts-kit, the selling points and the swatches are all its own)
- The field schedule uses 30fps frame numbers directly: cursor arrives at image 8 / title 20 / pill 30 / price 42 / body 76 / swatches 96 / button 114,
  and a field starts settling 2f after the cursor arrives. Inside a group the interval is 3f (pill, body lines, swatches), between groups 10–20f; the density of the intervals is the information grouping
- Fill cursor: a cobalt 2.5px outlined box + a 6px soft outer glow + a small AUTOFILL tag, jumping between two adjacent field boxes with an asymmetric in-out
  (`cubic-bezier(.4,0,.2,1)`, 6f) interpolating position and width/height together. It finally tucks into the button (ease-in 8f fade-out). It is the only light effect in the shot
- Skeleton slots: before a field settles the slot holds a light-gray skeleton bar that fades with progress as the field settles: "the form is being filled", not "elements are appearing"
- Two kinds of settling: `rise` (up 10–26px + 6px→0 defocus fade-in, expo-out 14f) for the image / title / price / body; `pop`
  (physical spring damping 13, scale 0.4→1 with one visible overshoot) for the pill and the swatches. Small pieces pop, large pieces rise
- Price demotion at f62 ($449 fully settled then hold 18f): in a 6f window together "scale 1→0.46 + turns gray + a 9px strike-through draws across from the left",
  and from f63 the cobalt new price Free (Apache-2.0 open source) springs (damping 14) from 1.18 down to 1, and the OPEN SOURCE chip slides in at f69
- Marker highlight: a cobalt 16% underlay block `scaleX 0→1` (origin left), starting at f86 / f90 for 6f each, faster than the field settling and reading as "the pen swept across"
- Button: ink-black base fills from left to right in 12f from f116, and the label fades in at f122
- Whole-card breathing: `scale 1→1.035` (asymmetric in-out) spread over 0–132f; entrance 0–14f scale .96→1 + up 30px; the last 40f hold still

## Parameters
| Parameter | Typical value | Feel when tuning |
|------|--------|----------|
| Field schedule | cursor 8/20/30/42/76/96/114, settle +2f | 3 frames between fields of the same kind, 10–20 frames between kinds. Making all of them evenly spaced reads as mechanical roll call |
| Cursor jump | 6f, swift in-out, box shape morphs in sync | Under 4f it reads as a flash; over 10f the cursor drags behind the field and "grab ahead" becomes "box after the fact" |
| Single field travel | 14f expo-out | Travel far longer than the in-group interval → several fields of a group move at once, and the picture "gushes" instead of "points" |
| rise offset | 10–26px (by font size) | Large titles move more, small text less; over 40px it fights the sense of direction of the whole-card forward push |
| pop | spring damping 13, 0.4→1 | The pill and swatches are small, so the overshoot does not hit neighbors; using pop on a large piece looks cheap |
| Price demotion point | f62 (hold 18f after the price settles) | Time must be left for "seeing the original price first". Right after settling it reads as always having been the discounted price |
| New price spring | damping 14, 1.18→1 | The only enlarge-and-rebound event in the shot. With a lower damping it shakes twice and competes with the strike-through next to it |
| Highlight brush | 6f, `scaleX` from the left | 5–6f is marker speed; over 12f it reads as a background color gradient and not a stroke |
| Whole-card push | `scale 1→1.035`, 0–132f | Spread over 4.4s it is pure breathing; over 8% the card hits the frame edge |

## Known traps
- The field boxes (cursor landing points) are hard-coded absolute coordinates: after changing font size or copy, change the box in the `F` table too, or the cursor box no longer frames the field
- The last field settles at ~f128, after which there is only a very slow push for ~1.3s. It gives the viewer time to read the whole card; do not cut it as a bug
- The three body lines are hard-coded `white-space: nowrap` with no wrapping (34px, line width ≤ 700px). Longer copy or Chinese overflows the card edge,
  and production must re-fit font size and line length
- The new price and the discount chip are absolutely positioned (x estimated from the width of 112px bold digits); when the price has a different number of digits, re-lay out, or the chip covers the text
- The content is shorts-kit's example fill ($449 struck through → Free, selling-point copy, a four-color brand swatch; $449 is only an illustrative original price), and only the field structure itself is reusable.
  After swapping in real product data the number of fields often changes, and the schedule must re-space the intervals by the new field grouping
- The highlight start (f86/90) is 8–9f later than the start of its line settling (f78/81); when you change a line's settle time you must change the highlight too, or "the highlight arrives first and the text after" appears
- `BLUE` (cobalt) is the only hue source in the whole card (cursor + new price + chip + highlight); to change the brand color, change the look's accent. Everything else is neutral

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`product-card-progressive-assemble/ProductCardProgressiveAssemble.tsx`](../../../src/demo/ui-entrance/product-card-progressive-assemble/ProductCardProgressiveAssemble.tsx)

