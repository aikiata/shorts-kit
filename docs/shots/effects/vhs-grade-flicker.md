---
name: vhs-grade-flicker
summary: The whole video sits under an old-camcorder grade (dark vignette, moving grain, a faint bright band rolling down the frame), and in the closing shot the fluorescent lights stutter dark with a click on every flicker
use: Found footage, analogue horror, "liminal" or uncanny places, archive clips from the 1990s and 2000s; a closing beat where the room itself reacts
length: the grade runs the whole video; the flicker runs the closing shot (about 90-150f)
energy: low (texture), with sharp low-level flicker accents at the end
tags: grade, vhs, grain, vignette, scanline, flicker, fluorescent, sound sync, horror, found footage
source: makevideo/liminal-space
---
# vhs-grade-flicker

## Intent
Real clips from different sources look like one tape when they share one grade on top. The
grade is quiet: the viewer should feel "old camera", not notice an effect. The flicker is the
opposite: a rare, irregular stutter of the lights that makes the last empty corridor feel
watched. Picture and sound come from the same function, so every dark frame has its click.

## Motion core
- **One overlay above every shot** (`pointer-events: none`), under the captions:
  - Vignette: `radial-gradient(ellipse 75% 60% at 50% 45%)`, clear to 55 %, black 0.6 at the edge.
  - Grain: SVG `feTurbulence` fractal noise, `baseFrequency 0.85`, 2 octaves, desaturated,
    `seed = frame % 24`, opacity 0.1, `mix-blend-mode: overlay`.
  - Scan band: a 60 px band, white peaking at 0.05 alpha, `top = (frame · 7) % 1920`, so it
    rolls down the frame every 274 frames (about 9 s).
  - Flash: on one named shot only, a warm `#fff8d0` fill `0.4 → 0` over 9 frames.
- **Flicker, one function for picture and sound:**
  `flickerAt(f) = f >= closingStart && hash(floor(f / 2)) > 0.93`. Pairs of frames, about 7 %
  of them, go dark.
- **Picture:** the closing clip's CSS filter becomes `brightness(1.05 · 0.55)` on a flicker frame.
- **Sound:** at module load, list every frame where `flickerAt(f) && !flickerAt(f - 1)` (the
  rising edges) and put a 6-frame `<Sequence>` with `flick.mp3` at volume 0.35 on each.
- **Bed:** a synthetic fluorescent hum (`hum.mp3`: 120 Hz plus harmonics and pink noise, made
  with ffmpeg) under the voice at 0.1, ramping to 0.3 across 20 frames either side of the
  closing shot's start, fading out over the last 30 frames.
- **Cuts between shots** crossfade over 12 frames with no dip to black; the overlay is drawn
  once above them, so the grade does not double during the dissolve.

## Parameters
| Parameter | Typical value | How it feels when changed |
|---|---|---|
| Grain opacity | 0.1 (overlay) | 0.2+ on real footage reads as noise filter; the illustrated Alvarenga short used 0.22 with a new seed every 2 frames |
| Grain seed cycle | `frame % 24` | A fixed seed freezes the grain into a dirty lens; a 2-frame hold (`floor(f/2)`) is calmer |
| Scan band speed | 7 px/f, 60 px tall, 0.05 alpha | Faster than ~15 px/f looks like a broken monitor; alpha above 0.1 is noticed as an effect |
| Vignette | clear to 55 %, 0.6 black | Stronger closes the frame in and hides safe-zone text at the corners |
| Flicker threshold | `hash > 0.93` (about 7 % of frame pairs) | 0.85 becomes a strobe; 0.97 may give no flicker in a short shot |
| Flicker pairing | `floor(f / 2)` | Single-frame flickers are too short to see at 30 fps |
| Flicker depth | brightness × 0.55 | Full black reads as a cut; 0.8 is not seen |
| Click | 6 f, volume 0.35, on rising edges only | A click on every dark frame doubles up on paired frames |
| Hum | 0.1 bed, 0.3 on the closing line | A louder bed fights the voice (check with the normalize step) |

## Known traps
- **Picture and sound must call the same function.** Precomputing the click frames from
  `flickerAt` keeps them in sync by construction; a separate random list drifts.
- **Hash the frame, never `Math.random()`:** parallel, out-of-order rendering must give the
  same flicker in every chunk.
- **Click on the rising edge only** (`flickerAt(f) && !flickerAt(f - 1)`), or two clicks play
  for one stutter.
- **Grain via `feTurbulence` is costly** over a full 1080x1920 frame; keep it one layer for the
  whole video, not one per shot.
- **The grade is above the scenes and under captions,** so caption text stays clean and
  readable.
- **The flash is per shot id,** tied to the title shot; do not add flashes on other cuts or
  they stop meaning "something happened".

## Pairs with
- [`chroma-split-settle`](../typography/chroma-split-settle.md): the glitch title that triggers the flash
- [`grain-dissolve`](../outro/grain-dissolve.md): grain as an ending, not a texture
- [`print-texture-transitions`](../transition/print-texture-transitions.md): the paper version of a texture language

## Reference implementation
- [`vhs-grade-flicker/Grade.tsx`](../../../src/demo/effects/vhs-grade-flicker/Grade.tsx) (vignette, grain, scan band, flash)
- [`vhs-grade-flicker/LiminalSpace.tsx`](../../../src/demo/effects/vhs-grade-flicker/LiminalSpace.tsx) (hum volume, click list from `flickerAt`, 12-frame crossfade and `HARD` cuts)
- [`chroma-split-settle/scenes.tsx`](../../../src/demo/typography/chroma-split-settle/scenes.tsx) (`flickerAt`, `Chot`; the file is shared with the `chroma-split-settle` card)

This kit has `src/shared/fx/Grain.tsx` and `src/shared/fx/Vignette.tsx` for the static parts.
