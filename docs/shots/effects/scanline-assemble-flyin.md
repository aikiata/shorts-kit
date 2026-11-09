---
name: scanline-assemble-flyin
summary: The page opens as a blueprint board with only a grid and dashed slots, and a bright scanline sweeps down it. As the scan reaches each slot, that component flies in from off-screen, overshoots and settles, with directional afterimage blur and snap-on corner brackets at landing. The page is exactly fully assembled when the scan finishes.
use: "Page generates itself" openings; the core demo of AI site builders / auto-layout products; capability narratives from blank to finished
length: about 5.2s (156f@30fps)
energy: medium-high (the scanline is steady, but each component fly-in is a burst point, with density building up)
---

## Intent
Give "the page is being generated" a believable construction order: the scanline is the construction progress bar,
and components flying in from off-screen and snapping on are the construction actions. The key is that **the last block is installed exactly when the scan ends**.
If the scanline finishes early or components trail behind, the cause and effect of "scan drives assembly" falls apart.

## Motion core
- Frame 1 is already a complete "construction drawing": a full-screen blueprint grid (24px thin lines α.045 + 120px main lines α.085), a 1640×860 board dashed outline
  with width dimensions, and a dashed slot for every component (with small tags like `H1 820×250`). The viewer first sees "what will be installed and where".
- The scanline runs **strictly at constant speed** from 8 to 92f over board y −20→880: white core + three layers of electric blue glow, each end running 60px off the board and fading.
  The 180px of grid behind the line is lit, and **the page base color is "brushed" in** (the board surface mask moves down with the scanline).
- Landing frames are derived back from the slot lower edge: `land = frameAtY(y + h)`, sorted by lower edge with a minimum gap clamped to 4f. The 14f flight **takes off early**,
  so the component and the scanline arrive at the same time. Measured in the demo: NAV 19f · BADGE 29f · H1 55f · BODY 66f · MEDIA 75f · CTA 79f · STATS 88f.
- The 7 components each have an off-screen start: nav from above (0,−260), badge / H1 / body from the left (−620…−980), media card from the right (+900,+80, 6°),
  CTA / stats row from below (+420…+460). `EASE.overshoot` overshoots ~8% and settles, and rotation of ±2–7° returns to zero in sync.
- During motion, speed is computed from the center-point differences of the pose, and `SpeedBlur` drags a trail along the flight direction (0.32× speed, ≤18px), cleared 4f after landing.
- Landing: the slot's dashed line disappears within 4f. Four electric-blue L corners (arm length 22px) bite in from 20px outside to 10px, brightening over `land+1→+4` and settling over `+5→+14`.
  The full-width nav gets none.
- Status line `BLOCKS 0n / 07` + a stopwatch running live. After the last block lands it switches to `✓ BUILT` and the stopwatch freezes, the blueprint grid falls back to 30%,
  the media card (a galaxy sample shot) brightens one step, and then there is a ~50f hold.

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Scanline | 84f constant speed, board y −20→880 | The finish moment should be slightly after the last block lands to read as "scan done = assembly done" |
| Trigger conversion | land = SCAN0 + (y+h−Y0)/(Y1−Y0)·(SCAN1−SCAN0) | To change the scan window, change only the four constants. The flight duration FLIGHT is the early-takeoff amount; remove it and it becomes "moves only after the scan has passed" |
| Minimum gap | prev + 4f | MEDIA / CTA, whose lower edges are close, would land together; only after clamping is there a "one block at a time" density |
| Fly-in offset | 260–980px off-screen, set by the component's position | An offset under 200px reads as "a shake into place", not coming from off-screen |
| Fly-in rotation | ±2–7° | Above 12° it reads as "tumbling" and does not sit flush when snapping on |
| Fly-in easing | EASE.overshoot, 14f | The overshoot is the feel of "magnetic snap"; plain ease-out becomes a slide-in |
| Afterimage blur | directional SpeedBlur 0.32× speed, ≤18px, cleared on settle | Isotropic blur reads as out of focus rather than speed; if not cleared it leaves a permanent haze layer |
| Landing corner brackets | outset 20→10px, arm length 22px, 3f bright / 9f settle | The brackets stand in for the sound of "snapping on"; a full outline flash reads as a debug box, and 7 of them at once violates Q4 |

## Known traps
- **Trigger moments are bound to the slot boxes in PLAN**: after switching the page template, re-measure each component's box, otherwise components fly in before the scanline arrives.
- Components are absolutely positioned in `Fly` with the slot as origin. The corner bracket layer is an SVG inside the component (overflow:visible),
  and if the component itself is `overflow:hidden` it clips the outset brackets. Put the media card's clipping on an inner layer.
- The page base color is "brushed in" with a linear-gradient mask on the board surface (following the scanline y), and the blueprint grid is a separate layer.
  Both layers follow the scanline. Do not mask the grid too, otherwise the area below the scanline goes dead black.
- It shares the "scanline is cause" logic with `scanline-annotate-focus`. The two cards can be chained (assemble first, analyze after),
  but the scanline must change direction or leave a gap, otherwise it reads as a repeat.
- The page content is a shorts-kit landing page (lens-engraved mark + wordmark nav, the "Shoot the / launch film." H1, sample shot card). The accent color (electric blue / cyan) comes from LOOKS.midnight, and to re-skin you just change L.

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`scanline-assemble-flyin/ScanlineAssembleFlyin.tsx`](../../../src/demo/effects/scanline-assemble-flyin/ScanlineAssembleFlyin.tsx)

