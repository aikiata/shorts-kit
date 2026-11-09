---
name: theme-switch-moves
summary: Two forms of theme switching: theme-sweep (a diagonal sweep where the skin changes in place wherever the boundary passes) and palette-ripple (a combined version: the ⌘K panel shrinks to a dot and a ripple spreads from the dot to change the skin).
use: Narrative segments for dark mode / theme features; the same UI "changing color before your eyes" rather than cutting to a new scene
length: A 140f (4.7s) / B 156f (5.2s)
energy: A medium / B medium-high (the combined version has a full causal chain)
---

## Intent
Two ways to shoot a light/dark switch. A (the usual one in Notion/Figma/Linear): a 15° diagonal
boundary band with a bright line sweeps across the whole frame (in the demo from the right side, where the toggle is, to the left). Where the boundary has passed, light turns dark **in place**,
and for a moment both themes coexist on the same layout. The viewer sees "the same UI changing skin", not a transition.
B (a combined variation): type "dark" in the ⌘K panel and press Return, the panel shrinks to a bright dot,
and a dark ripple **spreads from that dot** across the whole UI, so the causal chain "a command triggers the reskin" is fully readable.
Crux of the combination: the ripple center must be the panel's shrink point, and the start frame must be the frame where the shrink completes.

## Choosing a form
| Form | How | Use |
|----|------|------|
| A theme-sweep-toggle | Close-up of the top-bar day/night toggle (zoom 2.0): the pointer presses, the knob springs over to the moon (the sun draws in its rays and a crescent grows) → the dark world's clip-path polygon with a 15° slanted edge sweeps from the toggle side (64f, bezier(.3,0,.35,1)), while the camera pulls out to the full view over 30f; boundary = terminator line: a white-hot core line + a sunset-orange twilight band on the bright side that widens with speed + a cold blue glow on the night side; after the sweep "the lights come on" (today capsule / now line / window rim light light up in turn) to make it real | Showing the theme feature directly |
| B palette-theme-ripple | The panel drops in on a spring → typed letter by letter at human rhythm → on Return the panel shrinks like a CRT turning off (first squashed vertically to a bright line, then narrowed horizontally to a bright dot) + the dot and the horizontal afterglow are pinned for 5f → a circular clip radius 6→1260px spreads out with strong ease-out, with a 3px white-hot ring + coral outer glow / white inner glow + an echo ring 4f later; the dark version settles 1.035→1, and the camera exhales and pulls back along with it | The highlight segment linking the command palette with the theme |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| making the dark version | Map the palette key by key by hand (bg/card/border each get their own dark value) | A dark version made by filter inversion is wrong (images/avatars all inverted) |
| A diagonal overscan | The diagonal is computed as a polygon extended 400px outside world coordinates, with the end point past the lower-left corner | Without overscan a light triangle is left in the corner |
| A causality | The sweep starts right at the toggle; ~6f after the press the boundary passes the toggle; the camera pulls out from the toggle close-up | If the boundary appears from far away or more than 10f late, the viewer can't read that "this toggle caused it" |
| A poster frame | The camera reaches the full view (40f) before the terminator crosses the midline (~44–50f) | Pull out too late → day and night never share the full view, and the technique is left as a close-up only |
| A settling | After the sweep, lights that only exist at night come on in turn (today capsule / now line / window rim light) | More meaningful than scale 0.99; do not stack a full-screen white flash on top |
| B causal pin | The bright dot hangs 5f at the shrink point (+ horizontal afterglow), the ripple center = that point's coordinates, the start frame = the dot's end frame | A misplaced center or misaligned frame breaks the "command → reskin" causality (the crux of the combination) |
| B ripple radius | End value ≈ distance from the center to the farthest corner × 1.1 (demo 1260px) | An end value that is too large (e.g. 2000+) makes the early part of the curve flash by and the circle can't be read |
| B light layer | Conditionally unmounted after the sweep completes | A precondition for true stillness |

## Known traps
- The demo was tuned on a shorts-kit UI designed for the shot (A release-week production schedule / B sample-film gallery). The parameters are a tuning starting point, not a final production setting.
  The first production use must be re-verified on real material
- The two versions' layouts must match pixel for pixel: any layout difference reads as "switched to another page",
  and the technique fails
- In real-page production: take real screenshots of the light and dark versions separately (Q1); do not fake a dark version with a filter
- At most 1 theme switch per piece: it is a feature narrative, not a transition, and repeated switching reads as a demo accident
- Sound: A one long whoosh for the sweep; B one confirmation on Return + the ripple spreading followed by a whoosh
  (S4 foley first)

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`theme-switch-moves/PaletteThemeRipple.tsx`](../../../src/demo/interaction/theme-switch-moves/PaletteThemeRipple.tsx)
- [`theme-switch-moves/ThemeSweepToggle.tsx`](../../../src/demo/interaction/theme-switch-moves/ThemeSweepToggle.tsx)

