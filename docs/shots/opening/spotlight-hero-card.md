---
name: spotlight-hero-card
summary: In a darkened theater, a tungsten spotlight (with a volumetric light shaft) sweeps the page and locks onto one card. After an oblique side push-in the card pops up and hovers, a champagne-colored beam runs around its outline for two laps, and it is pressed back into place together with a 3D annotation
use: A "single protagonist" product opening; makes one core object (card/entry/module) the star of the whole video
length: 172f (about 5.7s; lock at f34 → touchdown at f142 → 30f truly still hold)
energy: medium (the shot with the highest texture quality, slow and steady in pace)
tags: effects, camera
---

## Intent
The opening says only one thing: this one card is the atomic unit of the product. The spotlight guides the viewer's eye, the pop-up and hover give it volume and weight, the outline beam is a metaphor for "scanning/inspecting", and the final press back into place says it belongs to this page.

## Motion core
- **Lights out**: a real page screenshot (Q1) is multiplied down over the whole page to ~6–14% brightness (warm black rgba(14,12,10), hue preserved), and only inside the light pool is the page its native color; turning the lights on is a "slide the fader" move: f1–6 up → flash back to 62% → settle
- **Light pool**: multi-stop near-Gaussian falloff (center transparent → edge fully dark, not a hard-edged ring) + a low-intensity tungsten warm-white soft-light; it wanders over 3 intermediate stops (2–3f pause between stops, smooth in-out), then locks on the card center, with the pool closing in + a 6% pulse at the lock moment, and the area outside the pool pressed one more notch darker; after the lock (f38–58, along with the push-in) the screen-space circular pool cross-fades into **page-space card-shaped light**: under the same camera, a full-page dark field layer (translateZ 1px, 0.94 warm black) has a soft card-shaped hole cut at the card's position (a tight hole σ22 + a ring of 15% wide spill σ60); the card sits higher than this dark layer in z, so it is fully lit edge to edge with native text contrast, and the falloff happens only outside the card; the soft-light warm light fades out in step (no bloom stacked on the card); a ring of warm-white hairline rim light along the card edge + a very faint outer spill keeps the outline readable on the dark page; during the hold the dark field breathes ±1.2% very slowly
- **Volumetric light shaft**: the light source is far above and slightly to the right of the frame, and a trapezoidal shaft hits the pool (outer layer blur 28px, inner layer clip-path, soft edges), with a layer of deterministic floating dust inside the shaft; after the push-in the shaft fades by 45%
- The camera pushes in from a full-page front view to an oblique side close-up (left-side camera position dominant), with the focal point shifted left so the card lands right of center and the left side is left for the annotation; fully locked after the push-in
- Card rise (with overshoot) → hover with a sin bob → reseat (a small press on touchdown + a ring of champagne touchdown light); the hover shadow falls to the lower left (light comes from the upper right)
- An SVG rounded-rect outline beam runs two laps: the first lap fast and bright, the second slow and faint (champagne gold + white core)
- After the card takes off, a page-color patch + champagne stroke is laid at its original spot, and it brightens and disappears at the moment of touchdown
- 3D floating annotation (hover-3d-annotation technique, C3): to the left of the card, a two-line shorts-kit tagline in heavy white bold sans "Your product, / in motion." (34px in page space, ≈100px after the push-in), with a champagne marker bar growing behind the keyword over 12f (the text flips to ink color), and a dark backing under the annotation to cover neighboring card text; the annotation layer is drawn separately above the light layer with the same camera math as the page (camAt), since it is self-illuminated text and is not dimmed by the lights-out. On reseat the annotation drops back onto the page plane in step (translateZ 92→4) and does not exit early, so the ending is one complete poster

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Card choice | cards[3], whose center x is exactly 960 (page center) | Pick the hero card first by its composition after the push-in, not at random |
| Camera | still full page zoom 0.8 (0–40f) → 18f push-in to zoom 2.6; rotY 34° dominant + rotX only 8°, persp 1200; focal point at the card center shifted left 105px and up 10px; locked after the push-in to the end | A side horizontal camera position reads better than a top-down shot ("shoot from the left side, not from below", Q6); no tail drift like zoom 2.6→2.58 at the end, leave the breathing to the light rather than the camera (R1) |
| Lights out | multiply outside the pool 0.90→0.94 (≈6–10% brightness) | <0.8 reads as a "dimmed page" and not a theater; >0.96 and the neighboring cards vanish entirely, losing the context of "being in the page" |
| Spotlight | 3 intermediate stops (4→28f), pool radius 400→300, lock +6% pulse; warm-white soft-light 0.24; swapped for card-shaped light after the lock | A circular pool over the card goes dark at both ends and blows out in the middle ("a flashlight on a page"); the hero card needs the card-shaped soft hole to light it edge to edge; intermediate stops make the "random sweep" believable |
| Volumetric shaft | source (pool.x+420, −720), shaft width 0.6× the pool; screen 0.34→0.06 vertical gradient | A source too close reads as a flashlight; a shaft too wide blurs into the pool |
| Action arc | rise 10f (bezier(0.2,1.25,0.3,1) overshoot) → hover 58f (sin bob amplitude 4px period 40f, z=110px·lift) → reseat 18f, touchdown press 0.997 | Lock → touchdown ≈108f≈3.6s: texture shots need to be "slowed to 3 seconds" (R3), and a first draft is almost always too fast |
| Outline beam | lap1 68→82f (strokeWidth 5+2.5 double layer), lap2 88→108f (3.5+1.75, overall opacity 0.62); strokeDasharray "0.16 1" running dashoffset | Two laps at different speeds read as "continuous scanning", and one lap is a blink; the beam goes to the hero only once (Q4) |
| Double shadow | offset to lower left `-10·lift, 10·lift …, -36·lift 48·lift 90·lift`, growing with height | If the shadow doesn't grow with height, the hover doesn't hold; its direction must match the light source |

## Sound
Lights on: a low light-clunk pinned for the fader slide (f2), pop-up pinned to whoosh-big (f56 in this demo; f127 in the template video), the beam scan pinned to sparkle (f68), and the reseat pinned to transition-snap (f142). The pop-up, the light effect and the landing each get their own sound (S2, S4).

## Known traps
- A multi-card group dance in the opening can't carry the first impression (Q5). The opening was torn down many times before converging on a single card; start the draft directly from a single protagonist + the complete action arc
- Text on the card goes blurry in the push-in close-up, and the root cause is texture rasterization resolution, not DoF. For the matching technique see aesthetic rule Q2
- A per-card glint flash was rejected twice ("not every card needs to flash", Q4); light effects go strictly to the hero only
- The dark field for the card-shaped light must live in page space (inside PageCam, translateZ between the page and the card). A screen-space mask can't keep up with the perspective and the card's lift; the card's translateZ must be at least +2px, so that after the reseat it doesn't flicker coplanar with the dark field
- The right edge of the annotation's dark backing must stop before the card's left edge, or it presses a dark wedge on the left side of the card face
- If the annotation is drawn inside PageCam, below the light layer, it gets dimmed to gray text by the lights-out multiply; the annotation layer must be drawn separately with the same camera above the light layer

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`spotlight-hero-card/SpotlightHeroCard.tsx`](../../../src/demo/opening/spotlight-hero-card/SpotlightHeroCard.tsx)

