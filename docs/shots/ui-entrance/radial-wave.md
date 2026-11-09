---
name: radial-wave
summary: A 17×9 dot array lights up staggered by Euclidean distance to the wave source. Each dot overshoots to scale 1.5 and settles back to steady on. After the first wave sweeps through, a second bright-blue pulse closes in from the outer ring back to the center
use: The "system powers on" beat in a product / brand opening; also an establishing shot for data grids, node maps and coverage narratives
length: about 3.8s (114f@30fps)
energy: medium-high (one burst at the start, then a steady-on low-energy base after the wavefront passes)
---

## Intent
It rewrites the static fact "many dots exist at once" into the dynamic fact "energy spreads from one source to everyone". What the viewer
sees is not a dot matrix but a power-on: the center lights first, brightness is pushed outward like a water wave, and when it finishes the whole array
stays in the steady-on state, laying a base for the content that comes next. The second, reverse wave is a receipt, telling the viewer this system responds.

## Motion core
- The array is 17×9 with 153 dots in all, and dots are positioned by percentage (`left:(c+0.5)/COLS`), so changing the number of rows and columns needs no
  recomputing of coordinates; each dot stores a normalized distance `dist = hypot(c-cx, r-cy) / maxD` (maxD = hypot(8,4))
- First wave: `seg(t, dist*0.35, dist*0.35+0.18, E.outCubic)`. The start is delayed linearly by distance (the outermost
  ring is delayed 0.35), and a single dot's own travel is a constant 0.18. The wavefront is a "start stagger", not a change of speed
- Each dot's scale is not a plain 0→1 but `w1*(1+0.5*sin(w1*π))`: it swells to about 1.5 midway and returns to 1,
  and the sine envelope puts the overshoot in the middle of the travel rather than at landing
- Second wave: `seg(t, 0.62+(1-dist)*0.25, +0.15)` flips the sign of the offset (the outer ring moves first) and takes
  `sin(w2*π)` as a pure pulse, adding a 0.8 scale increment and a 0.25 opacity increment, leaving no state when it finishes
- At the pulse peak (`pulse2 > 0.3`) the color hard-cuts to `#b9f2ff` with a `0 0 12px #7fd8ff` glow. Only the second
  wave glows, and the first wave is the steady color `#6c8cff` throughout, so the two waves do not blur into one thing visually

## Parameters
| Parameter | Typical value | Feel when tuning |
|------|--------|----------|
| Array size | COLS=17 / ROWS=9 (153 dots) | The dot count sets the "resolution" of the wavefront. With <8 columns the distance bins are too coarse, and the wave reads as three or four concentric rings hopping |
| Wave speed coefficient | `dist*0.35` | This 0.35 is the inverse of wave speed: larger means the wave moves slower with a longer tail; at >0.5 the outermost ring does not light until past halfway through the shot |
| Single-dot travel | 0.18 (about 21f) | Sets the thickness of the wavefront. Under 0.1 the wavefront is sharp like a scan line; over 0.3 the whole field lights almost together and the sense of spreading is gone |
| Overshoot amount | `1+0.5*sin(w1*π)` → peak 1.5 | The coefficient 0.5 is the amount of a "bounce". Remove the sine term and it is a bland 0→1 fade-in; over 0.8 the dots bite into each other |
| Second wave | start `0.62+(1-dist)*0.25`, window 0.15, amplitude 0.8 | 0.62 is the breath between the two waves. Moved earlier than 0.5 it overlaps with the tail of the first wave and reads as a mess of flashing |
| Steady-on base | `opacity = 0.25 + w1*0.5 + pulse2*0.25` | 0.25 is the presence of an unlit dot; at 0 everything outside the wavefront is black and the "scale" of the array is not conveyed |
| Highlight threshold | `pulse2 > 0.3` switches color + glow | The lower the threshold, the longer the glowing stretch; this is a hard cut and not a gradient, and with the threshold near 0 you see an obvious on/off jump |

## Known traps
- The wave source is hard-coded at the geometric center (`cx=(COLS-1)/2, cy=(ROWS-1)/2`). To start the wave from a corner or some "node",
  you must change cx/cy and maxD together, or the normalized distance is >1 and the start of the outermost ring is pushed beyond t=1 and never lights
- The last frame is not fully still: the center dot's (dist=0) second-wave window is 0.87→1.02, which has only reached 87% at t=1,
  and `pulse2≈0.41` is still highlighted. To loop or end cleanly, move the second wave's start within 0.85
- The dot's `width:10px` and `margin:-5px` are a bound pair (centered by negative margin); when you change the dot diameter, change the
  margin together, or the whole array shifts half a dot diameter to the lower right
- There are only two color levels (steady `#6c8cff` / peak `#b9f2ff`); changing the brand color means changing these two plus the glow color, three places in all.
  The background `#0a0b10` is the premise of the glow, and on a white background this brightness pulse is basically invisible

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`radial-wave/RadialWave.tsx`](../../../src/demo/ui-entrance/radial-wave/RadialWave.tsx)

