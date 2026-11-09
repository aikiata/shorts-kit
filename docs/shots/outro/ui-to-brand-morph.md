---
name: ui-to-brand-morph
summary: Two forms of UI turning into brand. icon-flip-bloom: an icon flips on the Y axis, flattens to a vertical line, and from the line bursts open into the brand mark (an amber bevel cut then slashes in), then the wordmark settles letter by letter. input-morph-assemble: an input box shrinks into the vertical stroke of a viewfinder, and three primitives drop into construction slots to assemble the complete mark.
use: The last beat of the brand ending / before the outro; a visual argument that "the UI you use every day is this brand"
length: A ~4.3s (130f) / B ~5.6s (168f)
energy: medium-high (a finishing touch at the end, a complete transformation telling it in one go)
---

## Intent
The library already has two brand-ending routes: brand-ink-open is an opening draw-and-stamp,
and outro-group-photo-launch is elements gathering for a group photo (gathering without changing). This card adds a third:
**product UI elements transform themselves into the brand symbol**. Form A is an icon flipping over to become the logo
(a same-position entity swap), form B is the input box that appears repeatedly through the piece assembling into
the brand mark after the final send (multi-element landing and assembly). What the viewer sees is not "the logo appeared" but
"the thing we just used turns out to be it", and the causal chain itself is the brand argument.

## Choosing a form
| Form | How | Use |
|----|------|------|
| A icon-flip-bloom | The icon wobbles twice in anticipation → flattens by scaleX on the Y axis into a vertical line (double-layer trail + blur) → entity swap at the thinnest point, the mark bursts open from the vertical line on an overshoot spring, the amber bevel cut then slashes in along 45° → the mark shifts left to make room, the wordmark settles letter by letter | Single-icon products; icon and logo forms differ greatly and need the magic of "flipping over to transform" |
| B input-morph-assemble | The cursor clicks send → the text flies away, the mark's ink floods from the send key to fill the input box → five quantities x/y/w/h/r spring-collapse into the viewfinder's vertical stroke → top bar / bottom bar / amber bevel cut drop in staggered from off-frame into dashed construction slots to assemble the mark → makes room and the wordmark emerges | Pieces where a rectangular UI such as an input box or card is the lead of the whole piece; the logo can be decomposed into a combination of geometric primitives |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| A anticipation | 12–34f tilt -12°/+14°/-18°→0°, inOut(sin), transformOrigin pinned at the bottom 78%; the ground soft shadow shifts with the tilt and narrows during the flatten | Increasing amplitude reads as "charging up"; a single wobble doesn't read as a preparation move |
| A flatten | 34–46f Easing.in(cubic), scaleX 1→0.04; two afterimage layers opacity 0.22/0.14 + blur 6px lagging 0.12/0.24 | The accelerating entry is the key to the "whip"; a constant-speed flip reads as a flipping card. 0.04 is the thinnest point, and the entity swap is done on this frame |
| A burst open | From 46f spring(damping 11, stiffness 130) drives the mark scaleX 0.04→1 (with overshoot); from 53f the bevel cut slashes in along 45° with spring(damping 16, stiffness 170) (cutProgress 0→1) | The mark bursting open from a closed vertical line is what catches "flipping past the thinnest point"; scaling the whole mark directly breaks the causality. The bevel cut 7f later is the second beat; appearing at the same time as the viewfinder, the "carving" isn't read |
| A wordmark | mark 64–82f shifts left -471px to make room (wordmark starts at mark+187, the whole group centered); letters staggered 2.6f, each 12f: scale 1.9→1 + blur 14→0 (snappy), origin pinned to the baseline; wordmark 112px brand font 700, +0.03em (mark height ≈ 2.1× the font size) | Compared with the source: each letter settles from large to small, blurred when large and sharp when landed (scale+blur linked, settling letter by letter), not swept out horizontally; a stagger <2.4f and each letter's "large to small" can't be read |
| B send feedback | cursor enters over 20f and presses scale 0.84 + button flashes white 6f; text accelerates out to the upper right (+760,-420) in 11f ease-in + rotate -9° + trail | The flying away must accelerate: constant-speed flight reads as a translation, not "sent" |
| B ink flood | 28–40f the mark's ink floods from the send key position with a circular clip-path to fill the input box (solid color throughout) | Filling color with an opacity gradient passes through a grayish semi-transparent state; the text must fly off before the ink floods, otherwise dark text sits on the ink |
| B morph | From 30f spring(damping 15, stiffness 95), 1040×132 r34 → 89×330 right angles (the viewfinder's vertical stroke, the horizontal bar squeezed directly into a vertical bar), five quantities in sync, with ≤3px trail added by spring velocity; the input box's drop shadow is taken in during the morph | The five quantities must be driven by the same spring; interpolating them separately falls apart midway |
| B three pieces drop | top bar / bottom bar / amber bevel cut at 58/72/86f staggered by 14f, each with spring(damping 13) dropping from off-frame -760px into its slot; 10f before landing the slot first draws a dashed construction frame along its outline (expanded 10px), fading out 14f after settling; stretch by speed / rebound squash (origin pinned at the bottom), a drop shadow in the air, flat as soon as settled | The stagger is the rhythm of "assembling"; dropping together reads as rain; without a slot preview the landing points read as random |
| B settle | From 108f the mark shifts left over 20f to make room and shrinks to 0.7 (to free space for the 15-character wordmark), the construction grid exits, the wordmark 110px rises from the baseline letter by letter (1.5f stagger), the slogan word by word; from 124f the whole group pushes in very slowly by 2% | After settling, a fully motionless segment is a dead frame; beat-by-beat scale breathing is easily read as jitter |

## Known traps
- The demo's end logo is the shorts-kit "Jingke" mark (A: soft-light bright scene + amber bevel cut; B: Swiss-grid bright scene + cobalt construction lines).
  The parameters are a tuning starting point, not a final production setting. The first production use must be re-verified on real material
- In form A the entity swap must happen on the thinnest frame with scaleX ≤0.05: swapping earlier lets the viewer see a ghost of two shapes, and the magic gives itself away
- In form A the wordmark has been changed to letter-by-letter scale+blur settling, with the stagger 2.2→2.6f; when using a longer wordmark, watch the piece at normal speed per the perceptibility precedent and then set the interval
- Form B splits the mark into four pieces: the vertical stroke (= the input box) + top bar + bottom bar + bevel cut. In production decompose your own logo into primitives, with 3–4 primitives being appropriate; more reads as particles, not assembly
- In form B, antialiasing at the overlap of same-color primitives adds up (the edge pixel row is darker), leaving a 1px step at the seam; once assembled (108f), swap the vertical stroke + top and bottom bars for a single viewfinder path of the same geometry
- Do not layer other animation during the morph: the morph itself is all the information
- Division of labor with outro-group-photo-launch: that one has elements from the whole piece flying in to surround the wordmark for a group photo (gathering), this card has a UI element turning into the brand symbol itself (transforming); pick one of the two for a piece's ending
- Sound: A a "whoosh" on the flatten and a "tap" on the burst-open settling; B one send sound on send, one pop for each piece landing, and the wordmark segment silent

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`ui-to-brand-morph/IconFlipBloomLogo.tsx`](../../../src/demo/outro/ui-to-brand-morph/IconFlipBloomLogo.tsx)
- [`ui-to-brand-morph/InputMorphsIntoLogo.tsx`](../../../src/demo/outro/ui-to-brand-morph/InputMorphsIntoLogo.tsx)

