---
name: bezier-source-converge-merge
summary: Four source nodes on the left each connect to one shared convergence point on the right by a thin Bezier curve. The curves draw on left to right with a stagger. Each node slides along its own curve toward the point, shrinking in three accelerating stages until it vanishes. Accent-colored data packets glide along the paths the whole time. When the merge is done the curves erase from the left end backward, leaving only the brand mark (demo: a white porcelain disc holding the shorts-kit lens-engraving mark)
use: The core mechanism shot for "multi-source integration / unified access / data convergence"; explainer sections for integration, aggregation and single-entry products
length: about 5.6s (168f@30fps)
energy: medium (a long shot that advances slowly, kept alive by the gliding packets; the moment of merging is the only small peak)
---

## Intent
"We unified four sources" is an abstract sentence. This motion turns it into a visible physical process: first four independent
paths are built (draw-on reads as "connected"), then the four sources actually walk along the paths into one point and are sucked in (shrinking
to 0 reads as "absorbed"), and finally the paths are erased and only the brand mark stays ("now there is only one"). The three phases each have a clear
start and end, so the viewer reads cause and effect without narration.

## Motion core
- Path geometry: each `d = "M -22,y L 74,y C 186,y 214,120 332,120"`. The start is at -22, outside the frame;
  74 is the resting spot of the source node; after it a cubic Bezier bends toward the convergence point (332,120). The four paths differ only in start y
  (36/92/148/204), so their curvature differs naturally, and so do their entry angles
- Draw-on uses `stroke-dasharray = len` + `dashoffset = len*(1-draw)`, `seg(t, 0.04+i*0.045,
  +0.17, E.outQuad)`. The 0.045 stagger makes the four lines look connected one after another, not lit together
- Nodes are positioned with `getPointAtLength`: x=74 is exactly the end of the straight segment, so the path fraction is set directly
  as `f0 = 96/len` (the original 40-step scan was not precise enough and the four nodes would not line up in a column). At runtime `frac = f0 + (1-f0)*conv`, `conv = seg(t, 0.34, 0.74, E.inOutCubic)`.
  The nodes move **along the real curve**, not interpolated between two points
- Three-stage shrinking: for `conv < 0.75`, 44→15px (slow slimming); for `conv ≥ 0.75`, 15→0px (all the rest is dropped in the last
  quarter of the travel). The size change rate in the later stage is more than 4 times the earlier one, which gives the "sucked in" acceleration.
  Font size shrinks with `size*0.26` so the label does not detach from the node
- Data packets: `pkCycle = (seg(t, 0.1, 0.74, E.linear)*2) % 1` runs two whole cycles, with a phase offset of
  `i*0.13` per path. Opacity uses `1 - |cycle-0.5|*0.6` so a packet is brightest mid-path and faint at both ends,
  which avoids a packet appearing from nothing at the start
- Erase: `erase = seg(t, 0.78, 0.9, E.outQuad)` pushes dashoffset negative (`-erase*len`),
  so the dashes retreat from the **start** side. The direction is the opposite of draw-on and reads as "the path is withdrawn"
- Badge: `seg(t, 0.16, 0.26)` fades in and scales from 0.7 to 1. At the moment of absorption (0.7→0.78 outBack adds 12%,
  0.78→0.86 outQuad returns) it does one receiving pulse. The final `endCap` caption fades in after 0.84

## Parameters
| Parameter | Typical value | Feel when tuning |
|------|--------|----------|
| Source count | 4 paths (y=36/92/148/204, spacing 56) | 4 is the sweet spot: clearly different curvature without tangling. Over 6, the middle Bezier curves nearly overlap and entry angles look the same |
| draw-on | start `0.04+i*0.045`, window 0.17, outQuad | A 0.045 stagger is about 7f. At zero it reads as four lines brushed on together and loses the "connected one by one" meaning |
| Convergence window | 0.34→0.74 (inOutCubic) | Takes 40% of the shot and is the main section. The slow start of inOut is "launch" and the slow end is "arrival"; swap in linear and it becomes a constant-speed conveyor belt at once |
| Three-stage shrink | 44→15px (first 75%) → 0 (last 25%) | The later the knee at 0.75, the more sudden the absorption. Move it to 0.5 and it becomes "shrinking all the way", and the gulp is lost |
| Packet cycle | 2 whole cycles (0.1→0.74 linear) | Must be whole cycles, or the packets stop halfway on the last frame. Raising it to 4 reads as a rushed data stream and overlaps nodes more easily |
| Packet phase offset | `i*0.13` | Offsets the packets of the four paths so they do not line up and merge together; at 0 you see four packets merge in a neat row, like one departure |
| Erase | 0.78→0.9, dashoffset negative | Done in 12f. The erase must come after all nodes are gone (conv=0.74 ends, nodes finish fading before 0.92), otherwise the lines vanish first and the nodes hang in mid-air |
| Badge pulse | outBack +12% (0.7→0.78) → fall back (0.78→0.86) | 12% is the "received" amount; over 25% it takes attention away from the convergence itself |

## Known traps
- `getTotalLength` / `getPointAtLength` only work after the SVG is attached to the document and laid out.
  The code uses a `ready` flag and does it in `prime()` on the first frame. When porting to Remotion the first frame may not get
  the length (the fallback is written as `|| 380`). The safe way is to compute after `useEffect`/layout, or to precompute
  a constant table; otherwise the first frame shows one misplaced jump
- `f0` is set directly from the straight segment length 96 (`96/len`). The old version used a 40-step linear scan with only 1/40 precision, so the node resting spot
  drifted away from 74 and the four nodes did not line up in a column. After changing the path (especially the straight segment length) change this calibration too
- Node opacity only starts fading after `conv > 0.92`, but conv reaches 1 at t=0.74, so nodes vanish
  when their size reaches 0 instead of fading out. This is deliberate (something sucked in should not fade), but if you move the three-stage
  knee later, you will see nodes disappear abruptly while they still have size
- The nodes are gray-scale line icons (demo: four materials, page screenshot / shot card / code / sound) on white porcelain placeholder discs (gray levels only tell the four paths apart). In production they can be swapped for real source
  logos. The accent color is reserved for the packets and ripples; do not color the nodes, or the visual subject of the convergence point is stolen. The mark at the convergence point must sit on an opaque
  disc: the path ends and the packets all land at the center of the convergence point, and an open-shaped mark (such as the lens-engraving viewfinder) placed directly there shows line ends through its gap
- The convergence point (332,120), the SVG viewport 440×240 and `overflow:visible` are one bound set of coordinates. Changing the canvas
  ratio means re-marking the whole set, and the path start at -22 relies on `overflow:visible` to show the piece outside the frame
- The caption "From screenshot to showreel" (shorts-kit tagline) appears after 0.84. If you add narration, this line's
  appearance should align with the narration word landing and not with an animation node

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`bezier-source-converge-merge/BezierSourceConvergeMerge.tsx`](../../../src/demo/ui-entrance/bezier-source-converge-merge/BezierSourceConvergeMerge.tsx)

