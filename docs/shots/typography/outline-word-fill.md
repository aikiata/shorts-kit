---
name: outline-word-fill
summary: A hollow word (thin warm-gray stroke, weight 500) shrinks from 3.2x with a fast-then-slow curve and lands. A large dashed circle then closes in from 2.8x around the word and rotates slowly, and left and right horizontal dashed lines extend inward from the frame edges. The stroke brightens slightly first, then solid white-hot text hard-cuts on in a single frame, with one flash of glow and then it holds
use: A hammer-blow beat for a one-word benefit/slogan; a "nail" shot on a rhythm hit; an emphasis frame in a dark-base brand piece
length: about 3.0s (90f@30fps, a short single beat + 36f settle)
energy: high (3.2x shrink + instant light-up, a short, high impact)
---

## Intent
To hit a word in like a nail, the way is not a slow fade-in but **two settlings**: first a huge hollow word
shrinks fast into place (the settling of size), then the stroke turns solid white in a single frame (the settling of texture). The
1.5s of dashed circle shrink and horizontal dashed line extension in between is the "aiming" process, a technical
drafting vocabulary that makes the light-up read as "confirmed". The fill **must be instant**: a slow sweep fill turns
the nail into a slow beautifying animation.

## Motion core
(The demo is calibrated in native 1920×1080 coordinates and frame numbers; look = ember warm black · orange)
- Hollow word fast-then-slow shrink: `scale = mix(3.2, 1, ramp(f, 2, 11, EASE.snappy))`, fade in over 2–8f.
  **The shrink window is only 11f**, so fast it is almost an impact; momentary defocus by scale speed (back to zero when settled)
- Two-layer text: `outline` (`color:transparent` + `-webkit-text-stroke:2px` warm gray) and `solid`
  (white-hot #fff5ee, initial opacity 0) stacked, 220px / **weight 500** Helvetica Neue
  (a medium weight, not the title's 800: a hollow word that is too heavy smears into a block)
- Large dashed circle (r=410, `dasharray 22 18`) + inner 72-tick ring (a long tick every 30°, rotating slowly the opposite way) + four registration ticks:
  fade in over 8–18f, `scale 2.8 → 1` closes slowly over 8–52f (EASE.out, **44f, the slowest curve in the piece**); the main circle rotates 0.22°/f,
  and brakes to a stop at the moment of lighting up ("lock"), while the inner ring keeps turning slowly so the frame still breathes during the hold
- Left and right horizontal dashed lines (`dasharray 14 12`): over 28–46f they extend inward from the frame edges to 28px past the circle edge, with a crosshair dot at the line end;
  above the lines mono readouts "BEFORE 1 week" / "AFTER 4 hrs" tell "faster" as a pair of before/after data (a week by hand vs an afternoon to a finished video with shorts-kit)
- Stroke warm-up: over 44–53f warm gray → bright orange-white with a little outer glow, giving the hard cut a "charging" prelude
- **Instant fill**: at frame 54, `lit = frame >= 54 ? 1 : 0`; the opacity of solid and outline hard-cuts, with no intermediate state;
  in the same frame the circle / horizontal lines lock to orange and the right readout turns orange
- A flash-and-gone glow: `flash = lit · (1 − ramp(f, 54, 8))`, two text-shadow layers (white 14px + orange 60px), and after decaying over 8f
  only a very faint orange halo remains; one shockwave ring expands 160px from the circle edge and fades over 14f (only once); the stage key light pulses once in sync
- Settle: over 56–70f the in-circle eyebrow (small shorts-kit logo + all-lowercase mono wordmark) / sub line (40px, "One prompt to a finished promo.") rise, hold over 70–90f, with a very slow push-in 1→1.015 throughout

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Shrink | `scale 3.2 → 1`, window 11f, snappy | 3.2x is the amount of "backing off from your face"; <2x reads as an ordinary scale; a window >20f becomes a slow zoom and the impact is lost entirely |
| Weight and size | 220px / **500**, about one third of the frame width | 700+ on a hollow word makes the thin stroke wrap a big block of blank space and reads as balloon text; 500 is the sweet spot for hollow words |
| Stroke | 2px warm gray (138,118,104), warming up to bright orange-white before the light-up | A thin stroke is the "drafting" vocabulary; >4px becomes doodle; delete the warm-up step and the hard cut feels unmotivated |
| Dashed circle | r=410, `dash 22 18`, scale 2.8→1 (44f), 0.22°/f rotation, brakes on light-up | The 44f slow shrink is the piece's "breath", contrasting fast and slow with the 11f text shrink; compress the window to 20f and the two collide |
| Horizontal dashed lines | `dash 14 12`, extend inward over 28–46f to 28px past the circle edge | The extension end must stop outside the circle edge (not enter the circle); extending the full width reads as a crosshair, which is overdone |
| Instant fill | hard cut at frame 54 (decided by frame, not a normalized time window) | **This one beat is the purpose of the whole card**: any slow sweep (>3f) downgrades the nail into a beautifying animation |
| Glow | white 14px + orange 60px, decays in 8f; shockwave ring 14f | Flash-and-gone is what feels like "lighting up"; a sustained glow reads as a glowing font and the texture turns cheap at once |
| Length | 90f (3.0s): 36f hold after light-up | <20f after the light-up and the viewer has no time to read the sub line and readouts |

## Known traps
- The demo was tuned on grayscale/placeholder material. The parameters are a tuning starting point, not a field-tested final;
  the first real use must re-check against real material
- **Only suitable for a single short word (demo `Faster`, 6 letters)**: font size 220 and dashed circle r=410 are a hard-coded
  set of coordinates. A longer word pokes through the circle, and the end point of the horizontal dashed line extension also presses onto the word. For
  two words or a four-character Chinese phrase, `SIZE` / `R` / the extension end point must be changed together in three places
- `-webkit-text-stroke` is a prefixed property and works only in Chromium/WebKit; in Firefox the
  outline layer is fully transparent (the word appears abruptly only at the light-up frame). Remotion runs on Chromium, so no problem
- The instant fill must hard-cut by **frame** (demo `frame >= POP`). An early version used a normalized time window `seg(0.742, 0.762)`,
  and once the piece length was stretched that window became a visible fade of several frames. When changing the duration, only move the `POP` frame number
- Dark base only: warm black base + thin stroke + glow is the whole effect; on a light base the hollow word
  is almost invisible and everything must be re-done
- Sound is strongly required: the light-up frame must have one short heavy accent (metal/switch/low-frequency hit),
  which is half of this card's "nail" feel; for the mixing discipline see sound-design.md. Division of labor with
  word-relay-geometry: that card is a three-word relay (this card is the standalone, upgraded version of its first segment),
  and the two are not placed side by side in one video

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`outline-word-fill/OutlineWordFill.tsx`](../../../src/demo/typography/outline-word-fill/OutlineWordFill.tsx)

