---
name: ember-film-grade
summary: Old paintings and archive photos sit under one warm oil-painting grade (amber multiply, dark vignette, moving film grain), with firelight breathing up from the bottom edge and a title that flares orange as its word is spoken
use: A myth, history or "curse" story told over public-domain paintings and photos, where the grade must tie mismatched sources into one film; the fire layer for shots about fire, gods or destruction
length: whole video for the grade; fire layer per shot (90-180f); title flare 30f
energy: low (grade), medium on the flare
tags: grade, film grain, vignette, warm, fire, flicker, glow, archive, painting, title
source: makevideo/loi-nguyen
---
# ember-film-grade

## Intent
A Rubens canvas, a 1945 test photo and a portrait from 1954 do not belong in one frame. A single
grade on top of everything makes them one film: an amber multiply warms them all toward oil
paint, a vignette pulls the eye to the middle, and grain that changes every frame says "this is
moving picture", even when the picture underneath is a still.

Fire is the video's motif, so it is a light, not an object: a radial orange glow at the bottom
edge whose strength follows two out-of-step sines. The title uses the same colour: the key words
flare when the voice says them, then settle to an ember.

## Motion core
- **Grade** (on top of every scene, under captions):
  1. `rgba(80, 40, 10, 0.12)` full-frame with `mix-blend-mode: multiply`.
  2. Vignette: `radial-gradient(ellipse 80% 65% at 50% 45%, transparent 55%, rgba(0,0,0,0.65) 100%)`.
  3. Grain: an SVG `feTurbulence` (`fractalNoise`, baseFrequency 0.85, 2 octaves) desaturated
     with `feColorMatrix saturate 0`, at opacity 0.09, `overlay`, `seed = frame % 24`.
- **Shade**: a vertical gradient, 0.55 black at the top to clear at 24%, clear to 50%, then 0.9
  at the bottom, so the caption band always has dark ground.
- **Fire**: strength `k = 0.55 + 0.25 · sin(frame · 0.37) + 0.15 · sin(frame · 0.91 + 1.3)`;
  `radial-gradient(ellipse 90% 40% at 50% 100%, rgba(255,106,43,0.45k) 0%, rgba(255,179,71,0.15k)
  45%, transparent 75%)` with `mix-blend-mode: screen`. Turned on per shot (`fire: true`).
- **Title flare**: line 1 fades in over 10f from the frame its word is spoken (`wordAt`), with a
  20 px rise. The key line fades in at its own word, scales 0.92 to 1, and a flare curve
  `[b, b + 6, b + 30] → [0, 1, 0.35]` drives both a radial orange wash behind the text
  (0.35 · flare) and a `textShadow` blur of 40 · flare px in `#FF6A2B`.
- **Chip**: a small "NAME · YEAR" label slides in from -24 px over frames 8-20 of the shot, with
  an 8 × 44 px fire-coloured bar that glows.
- Palette: background `#0a0705`, fire `#FFB347`, ember `#FF6A2B`. The captions use the same
  palette, so the word being read is fire-coloured too.

## Parameters
| Parameter | Typical value | How it feels when changed |
|---|---|---|
| Warm multiply | rgba(80,40,10) at 0.12 | 0.2+ turns everything sepia and kills blues in photos |
| Vignette | 55% clear, 0.65 at the edge | 0.8 feels like a peephole; under 0.4 it disappears on bright paintings |
| Grain opacity | 0.09 overlay | 0.2 on photos looks like VHS; under 0.05 nobody sees it |
| Grain seed | `frame % 24` (new every frame) | `floor(frame / 2)` reads slower, more like film (used in `sky-graded-world` at 0.2) |
| Fire base and swing | 0.55 ± 0.25 ± 0.15 | a single sine pulses like a warning light; keep two incommensurate rates |
| Fire rates | 0.37 and 0.91 rad per frame | slower than ~0.15 reads as a sunset, not a fire |
| Flare curve | 0 → 1 in 6f, down to 0.35 by 30f | no settle (stays at 1) looks like a neon sign |
| Title scale | 0.92 → 1 with the fade | larger start (0.8) turns it into a slam, a different card |

## Known traps
- **Determinism.** Grain and fire are pure functions of `frame`: the seed comes from the frame,
  the flicker from sines. Never use `Math.random()` for flicker; Remotion renders frames in
  parallel and out of order.
- **One `<filter id="grain">` only.** The grain svg is mounted once at the top level; if a scene
  also defines `id="grain"`, the first one in the DOM wins.
- **Grade order.** The grade sits above scenes and below captions and watermark. Above captions
  it greys the white text and adds grain to it.
- **Cue on words, not frames.** The title flare is cued with `wordAt("trí", shot.start)`, the
  frame the word is spoken. A typed frame number drifts as soon as TTS is regenerated.
- **Avatar preload.** The source preloads the channel avatar with `delayRender` before the
  first frame, so the watermark image is ready before any frame is captured. Any image a layer
  needs on frame 0 needs the same guard.
- **Title copy.** The source comment says the title must never contain a profanity, even when
  the topic name does. Keep that rule when you swap copy.

## Pairs with
- [`photo-push-fit`](../camera/photo-push-fit.md): the slow push and cross-fade under this grade (same video).
- [`grain-dissolve`](../outro/grain-dissolve.md): a grain-based exit for the same look.
- [`light-play-moves`](light-play-moves.md): other light-as-object effects.
- [`blur-slide`](../typography/blur-slide.md): a calmer title entrance when no flare is wanted.

## Reference implementation
- [`ember-film-grade/LoiNguyen.tsx`](../../../src/demo/camera/photo-push-fit/LoiNguyen.tsx) (`Grade`, `Fire`, `Title`, `Shade`, `Chip`)
- [`ember-film-grade/ink.ts`](../../../src/demo/effects/ember-film-grade/ink.ts)
