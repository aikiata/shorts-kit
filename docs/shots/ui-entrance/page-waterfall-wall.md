---
name: page-waterfall-wall
summary: Page waterfall wall. Real page screenshots are cut into 3–4 columns that scroll endlessly in opposite directions at different speeds on a 3D tilted-back wall, with parallax + a slow camera push giving an overview of "so much content it never finishes flowing"
use: Sections with a sense of volume of "many pages / many features / many templates"; mid-montage spread or a product breadth shot after the intro
length: 4–6s (an infinite loop body, the length is cut to what the section needs)
energy: medium (flowing display type)
---

## Intent
A flowing overview: the viewer "sees many pages flow by" within a few seconds, and what they read is volume, not detail.
Division with outro-group-photo-launch: that is a **gathering** overview (elements fly in and surround the
wordmark to freeze in a group photo, meaning "belongs to the same product"); this card is a **flowing** overview (content keeps
flowing past without freezing, meaning "there is a lot more we have not shown you").
Division with wall-reveal-moves: that is the **entrance action** of the whole wall; this card is the wall's **continuing state**,
and the wall can enter with that card and hand off to this one to keep flowing.

## Motion core
- The lib component `assets/lib/VerticalTicker.tsx`: the parent layer is perspective(1000px)
  rotateX(20°) scale(1.2), tilted back into a wall; each column doubles [...items,...items] +
  progress modulo translateY 0→-50% for a seamless loop; top and bottom gradient masks trim the edges
- Differential reverse speed is the crux of parallax: 3 columns with staggered loop durations (such as 12/9/14s), with the middle column reversed.
  Equal speed in the same direction reads as one big picture scrolling; differential reverse speed reads as "independent columns"
- The slow camera push rides on the outer layer (scale 1→1.06 linear across the whole shot): the wall loops by itself and
  the camera goes one way, two motion sources in different directions that do not fight
- Material: real page screenshot slices (Q1, after anonymizing). Card-level cuts are better than whole-page long images:
  with whole-page slices the viewer has no time to read while scrolling, and card blocks have a complete outline that can be recognized

## Parameters
| Parameter | Typical value | Feel when tuning |
|------|--------|----------|
| Column count | 3 (1080p) / 4 (ultrawide) | 2 columns do not read as a "wall"; with 5 columns each column is too narrow and the texture smears |
| Loop duration | adjacent columns differ ≥25% (12/9/14s) | With too small a speed difference the parallax is not readable; with the fastest column <7s it starts to read as "flooding the screen" |
| Direction | middle column reversed (-1,1,-1 or alternating) | All the same direction = one big picture; the reversed column is the strongest evidence of "independent columns" |
| Tilt / perspective | rotateX 20° / perspective 1000px | Over 25° the text in the top rows is squashed by perspective and smeared (Q2); under 12° the tilt back of the wall is not readable |
| scale | 1.2 base + slow push to ~1.26 | 1.2 is the base value that compensates for perspective shrink; below it the four corners show the background. The demo puts the enlarging and slow push on an outer CSS zoom (layout-level scaling), so slice text is not enlarged and softened (Q2) |
| Mask height | 200px | Too short and rows enter and exit hard; too tall and the visible area cannot hold 2 rows |
| Loop period | the -50% offset must exactly equal one copy's period (content height + n·gap) | The lib already guarantees this with marginBottom; a self-written version using flex gap will be off by gap/2 and jump frames |

## Known traps
- **The parameters are borrowed from an external implementation (remotion-3d-ticker) and are not a final production setting;
  the first production use must re-verify on real material**
- The total item height of each column must be ≥ the effective viewport height (otherwise the same slice is seen twice on one screen, which breaks the illusion);
  do not reuse the same image across columns, as the same image appearing in two columns at once reads as poor material
- This card is an atmosphere / spread shot, not an information shot: the text on the slices only needs to "look like a real page"
  and does not need to be read through. To make the viewer read one block, hand off to spotlight-hero-card for a single-lead treatment
- P4 de-duplication: coexisting with the outro group photo in the same film is fine (one flows, one gathers), but a waterfall wall
  appears only once in the whole film, and a second appearance reads as padding the running time

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`page-waterfall-wall/PageWaterfallWall.tsx`](../../../src/demo/ui-entrance/page-waterfall-wall/PageWaterfallWall.tsx)
- [`page-waterfall-wall/VerticalTicker.tsx`](../../../src/demo/ui-entrance/page-waterfall-wall/VerticalTicker.tsx)

