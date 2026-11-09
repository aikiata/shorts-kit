# depth-layer-moves

**Job:** give a flat screenshot thickness. A sideways move across three layers at different
speeds creates depth; when the rail stops, the hero lifts.
**Length:** 4-5.5 s (about 165 frames). **Energy:** medium, a texture shot.
**Use for:** card decks, lists, a page seen sideways.

## Intent
A plain pan "looks at the page"; a parallax rail puts the viewer **inside the space of the
page** (the multiplane camera idea).

## Parameters
| Part | Typical | Feel |
|---|---|---|
| Layers | far 0.35× (one step bigger, 5 px blur, desaturated to 0.7, a faint same-colour haze, fading to the background); middle 0.7× (the real cards, the reading layer: sharp, two soft shadows on the "desk"); near 1.4× (floating blocks, 7 px blur, a long soft shadow, motion smear by speed). Plus a 0× title layer pinned to the frame | at least a 2× step between layers or they cannot be told apart; at most 4 layers |
| Cues | blur on far and near, desaturated background, haze | without them it reads as stickers flying around |
| End point | the total drive is solved backwards so the hero lands at the centre; asymmetric in-out (0.45, 0, 0.18, 1) over 130 frames; after it settles the hero lifts (elevation 6 → 26, scale 1.035, about 8 frames after the position converges) with an outline and a small "in focus" tag | a rail with no end is a screensaver |
| Type | the title does not move: the world moves, the words stay, which reads better | |

## Known traps
- The reading layer must be a sharp, un-blurred texture: that is where people read.
- A per-frame full-screen `blur()` on a changing layer is very expensive (render time can be
  3× or more). Put the blur on small elements inside the layer, not on the full-frame container.
- Do not tear the real page apart: the whole page is one layer; separate elements go on
  their own slices. Depth is "distance", not "the page was shredded".
- Parallax combined with a 3D tilted camera is untested: render a still first.

## Reference implementation

The source demo this card was rewritten from (shorts-kit, kept as reference, not built):

- [`depth-layer-moves/MultiplaneReal.tsx`](../../../src/demo/camera/depth-layer-moves/MultiplaneReal.tsx)
