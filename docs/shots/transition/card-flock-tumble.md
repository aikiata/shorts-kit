---
name: card-flock-tumble
summary: Three UI page cards tumble in 3D from their thin side edges and line up into a staircase (sharp throughout, one continuous smooth spline). After settling they keep rotating slowly without stopping, then collapse fast into the center, burst out a single turbulent smoke ring that expands, and a giant word sweeps across to close.
use: Energy climax (the burst transition from a group of feature pages to the brand slogan). Neon / aurora dark-field tone. Sections that condense "multi-page capability" into one sentence.
length: tumble ~1.5s + slow-spin showcase ~0.3s + collapse 0.3s + smoke ring and giant word ~2s; 4.5s for the whole segment
energy: very high (use at the energy peak of the whole film)
---

## Intent
Three page cards are flung like playing cards, tumbling into line in 3D space. After they settle and show, they are sucked into the center in an instant, a ring of smoke bursts out, and the giant brand word comes through the ring. "Capability showcase → energy collapse → slogan burst" in one breath. Three keys: **smooth** (side edge → tumble → settle is one Catmull-Rom spline with continuous derivative; the jerks of piecewise interpolation get noticed), **never stop** (after settling, keep a low angular speed and rotate slowly until the collapse; a still segment was rejected with "don't stop, keep rotating", and the climax has no still frames), **sharp throughout** (all motion blur / depth-of-field blur was removed, rejected with "don't add blur effects").

## Motion core
- Tumble: each of the three cards follows its own Catmull-Rom spline k0 (side-edge thin side, near 90°) → k1 (mid tumble) → k2 (staircase settle), driven by Easing.out(cubic), ~44f
- Slow spin after settling: idle drift ry +0.34°/f, rx -0.1°/f, rz +0.05°/f (14f squared ease-in to avoid a jerk at the spline join), continuing until the collapse moment
- Collapse: 10f Easing.in(quad), accelerating from the slow-spin pose straight into the center while shrinking, opacity full for the first 60% (the "suck-in" motion must read clearly)
- Flash core: on the same frame the suck-in arrives (70f), a white-hot core at the center + a 12% full-screen overexposure, 6f exponential decay, and the ring grows out of the flash. This fills the energy gap between the collapse and the giant word. Use radial light only. Do not draw a geometric stroke ring and do not add particles (both were rejected in past rulings).
- Smoke ring: **a single** one (multiple rings were rejected). Three feTurbulence displacements (ragged edge / bright patches / dark patches) + a top cream-peach → pink → purple gradient (aurora color band), screen blend. Broken ragged edge, light and dark patches, decelerating outward expansion that grows slowly, very slow decay that lingers, no water-surface light at the center, zero particle residue.
- Giant word: it "slams" in 4f after the collapse (74f). 14f snappy from 1.22 down to 1, letter spacing tightening from +0.06em to −0.025em, then very slow growth without stopping. Solid white-hot core → pale purple vertical gradient fill + pink-purple double-layer bloom (brighter at the moment it lands, then falls back). 282px italic across about 80% of the frame width. Inside the ring above center, an eyebrow (demo: shorts-kit logo drawn on + lowercase wordmark), and below, a 44px tagline (brand short phrase), rising staggered. The last frame is the release poster.
- Background: two rows of 300px single-color pale purple outline text wall drift slowly in opposite directions + an aurora key light behind the cards holding up the card group. On the collapse, the text wall contracts toward the center with the suck-in and fades out. The card group, collapse point, ring center and giant word share one center (frame center shifted down 30px).

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Spacing / size of the three cards | Heavily overlapped into one staircase stack, scale 1.6–1.74 | Two rounds of raising the stakes in the rulings: "get closer, make them bigger". The staircase must read as one group, not three cards |
| Slow spin after settling | ry ~0.34°/f continuous | **Never still** (ruling); >1°/f reads as not yet settled |
| Collapse duration | 10f ease-in | The 22f version was rejected with "make it fast"; fading opacity early makes the suck-in unreadable (rework ruling) |
| Smoke ring | Single ring, turbulent ragged edge, very slow decay | Multiple rings were rejected; the smooth neon ring / particle version was rejected. Build the turbulence texture against the dense frames of the source film |
| Blur | Zero blur throughout | Blur on the tumble / collapse was rejected both times |
| Spline | One Catmull-Rom running through | Piecewise lerp has speed steps; "smooth and fluid" was the ruling's own wording |
| Giant word entrance | 4f after the collapse arrives, 14f snappy 1.22→1 + letter spacing tightening | The original version waited 14f before the word appeared, leaving a black field with only a small ring, and the climax ran out of breath. A slow scale-up (0.7→1 / 34f) reads as a fade-in, not a slam |
| Flash core | Radial white-hot core + 12% full-screen overexposure, 6f decay | Without it the ring looks like it appears from nowhere; adding a stroked bright ring immediately looks cheap (same ruling as the smoke ring) |

## Known traps
- The demo was tuned on grayscale / placeholder material. The parameters are a tuning starting point, not a field-proven final. The first real use must be re-checked with real material.
- Smoke ring texture rulings: clean graphic rings (stroked circles / concentric waves) were rejected three rounds in a row. The final version used feTurbulence turbulent ragged edges, checked frame by frame against the dense frames of the source film: "make it the same". The remaining gap is that the noise field is static (whole-body rotation + growth) with no per-frame turbulence rolling, so the sense of flow is weak when viewed very close.
- The smoke ring is the aftermath of the energy collapse, not a celebration hit point. Do not add particle confetti.

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`card-flock-tumble/CardFlockTumble.tsx`](../../../src/demo/transition/card-flock-tumble/CardFlockTumble.tsx)

