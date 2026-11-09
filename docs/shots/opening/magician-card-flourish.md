---
name: magician-card-flourish
summary: On a midnight-blue dark field a blue starburst flashes for 0.3s (X-shaped needle beams rotating 90° + a center glow radiating small spikes), and a card shoots out of the flash point: it flies toward the camera on an arc at extreme spin speed, the spin decays as it gets closer, and it hard-freezes in an instant (card height 86% of frame height), followed by a light pulse + sheen sweep, then the copy on the right is revealed line by line
use: A magical entrance for a single card/poster/cover (opening hero visual, product card reveal); pure black dark field; a burst that needs the ritual feel of "conjuring it out"
length: 156f (flash 0.3s + flight 1.6s + freeze/sweep/copy reveal + hold 3.3s; whole section 5.2s)
energy: high (a one-time burst, still once frozen)
tags: ui-entrance, effects
---

## Intent
A magician flicking a card: a blue starburst flashes by and the card seems to be conjured out of the light. It shoots out from extremely far at the center of the frame (visually a small dot), flies toward the camera on an arc at extreme spin speed, and the instant it reaches the center it hard-freezes into a near-full-frame display. There are three crux points for the magic feel: **the flash goes first** (the light is the ritual of "conjuring", and 0.3s is short and crisp), **the launch rhythm** (a slow start that builds power → a sudden accelerating kick → a decelerating arc on arrival, slow-in→burst→decelerating arc), and **freeze means still** (no deceleration tail and no rebound; 13 whole turns of spin guarantee the freeze lands exactly face-on).

## Motion core
- Opening starburst (the final form reached over rounds of convergence on the user's reference image IMG_2505):
  - X-shaped **diagonal** needle beams (starting at -38°/52°), the whole thing **dynamically rotating 90°** (easeInOut) during the flash; long axis 840 / short axis 420 (ratio 2:1)
  - Beams in pure saturated blue (#3f9bff→#2277f2 along the full length, with the white part kept only at the root 5%), each axis in three layers: a wide soft glow envelope + a bright main beam + an overexposed thin core
  - The center is **not a white ball**: a tiny bright dot (26px) + a blue glow halo (140px) + a ring of 10 radiating short spikes of alternating lengths (slowly counter-rotating against the starburst)
  - Rhythm: brighten in 2.5f → a slight flicker → collapse, done in 9f (0.3s)
- Launch flight: the flash point = the landing point (left third of the frame, cx=700); it departs from extremely far (scale≈0.11), with true perspective scale=F/(F+z) (z 14000→0); travel curve: slow-in (the first 14% of the time covers 6%) → a slope jump for the launch → easeOut(cubic) deceleration; a sine single-arch arc swings out to the upper right (passing through where the copy will be later) and returns to the landing point; in flight the card carries a ring of blue glow, which motion blur drags into a light trail
- Spin: 13 whole turns along the card's diagonal axis; the first 40% of the travel is near-uniform and very fast, and over the last 60% the angular velocity decays by a power of 2.4 (the closer to the camera, the slower the spin), and the whole-turn count guarantees the freeze lands face-on
- Freeze: at f=57 (TAKEOFF+48) everything freezes fully, card height ≈86% of frame height; the instant it settles, a blue light pulse in the same shape as the card expands outward from the card edge and fades (22f), and the backlight behind the card and the stage key light come on at the same time (during the flash the stage is dimmed so the starburst is the only light source)
- Sweep: 8f after the freeze settles, a sheen diagonal band sweeps once from left to right (screen blend, clipped into the rounded corners)
- Card face: a deep navy shorts-kit "Launch Film" premiere ticket: brand row (logo + lowercase wordmark), the shorts-kit logo in the center sitting on concentric thin rings + crossing needle lines (the opening starburst "stays on the card"; the rings and needle lines start from the logo's outer edge and do not pass through the opening of the viewfinder), a 58px large title (≈100px after the freeze), a mono stub row; in the badge area a layer of holographic foil sits under the logo, with hue rolling with the spin angle (shimmering in flight, frozen on the freeze); the card back center is also the logo
- Copy on the right (after the freeze): eyebrow NOW SHOWING with tracking tightening 63f → the 132px title "Craft / the shot." rises in two lines at 67/74f → the 36px subcopy "Cinematic product videos, crafted by your agent." word by word at 86f
- The card is laid out at the frozen size (×1.72) and rasterized with CSS zoom, and the flight only scales it down, so the text on the frozen frame is sharp (Q2)

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Flash duration | 9f (0.3s, an exact value set by the user; it was shortened round by round from 1.5s→0.8s→0.5s) | The light is a ritual, not the protagonist; >15f steals the card's scene |
| Starburst rotation | dynamically rotates 90° during the flash (precedent: a static tilt angle was ruled "I didn't see it rotate") | The rotation must be visible frame by frame; >120° reads as a propeller |
| Beam color | pure saturated blue along the full length | A white section that is too long or a falloff that is too fast was ruled "not faithful enough"; a gray-leaning cyan-blue was ruled "I want blue" |
| Center | small bright dot + glow + radiating short spikes | **A white ball was ruled out**: the center is an optical glow, not a solid ball |
| Launch curve | slow-in 14%→burst→decelerating arc | Constant speed or a plain easeOut has no wind-up feel of a "launch" |
| Spin decay | power-2.4 deceleration over the last 60% of the travel | Constant speed all the way was ruled "it should decay with distance when approaching the camera"; whole-turn count = the guarantee of a face-on freeze |
| Freeze size | card height 86% of frame height (the right side is left for the copy) | The first version at 1.0x was ruled "closer and larger, nearly touching the top and bottom bounds"; a single centered card with no copy can go back to 94% |
| Hard freeze | full freeze, zero rebound | The magic feel = instant stillness; a rebound reads as a physics toy |

## Known traps
- The demo was tuned on grayscale/placeholder footage. The parameters are a starting point for tuning, not final production values; the first real use must be re-verified with real footage
- **The precedent chain for light-effect quality** (a global methodology contributed by this card): geometric color blocks were ruled "cheap 50-cent effect" → redone with optical realism → game-like but realistic → the user gave a reference image and it converged in one round. Opinions about quality are lossy in text, so **proactively ask the user to drop a reference image**
- Engineering trap: the thin needle beams **must not go inside CameraMotionBlur**. The rotation gets split into striped ghost copies by the blur sampling (a hidden source of the "cheap feel"); render the flash layer independently of motion blur
- Engineering trap: the starburst SVG viewBox must be ≥ beam length + rotation sweep radius, or the endpoints get clipped into straight edges
- How it differs from card-flip-reveal/deck-deal-flyin: those two are multi-card rhythm pieces about flipping/dealing cards; this card is a single-card magic ritual of "conjuring it out", one card at a time

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`magician-card-flourish/MagicianCardFlourish.tsx`](../../../src/demo/opening/magician-card-flourish/MagicianCardFlourish.tsx)

