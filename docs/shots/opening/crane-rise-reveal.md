---
name: crane-rise-reveal
summary: Crane-lift reveal: the opening sits tight on one row of data, the camera rises along the Y axis with a decelerating pull-back, and rows flood in until the whole dashboard fills the frame
use: An establishing opening that goes "from detail to whole"; the reverse of drone-dive-landing (whole → dive to a single point)
length: 5.5s (165f: close-up hold 24f + lift 102f + settle/aftermath/still 39f)
energy: medium-high (continuous one-way motion, no impact beat)
tags: camera, data
---

## Intent
The library already has drone-dive-landing for opening establishing shots: it slams from a god's-eye view into a hero close-up, "whole → focus". This card is its mirror: "focus → whole". First sit tight on one row of real data so the viewer sees clearly "what this is", then pull back crane-style while row after row of content floods into frame, until the whole product fills the screen: "the one row you saw is only one cell of this wall". It suits openings that sell on product scale or content richness. Use only one of the two directions in the same video.

## Motion core
- transform-origin is fixed at top left, with a linked formula `translate = screen center − aim point × scale`; the aim point moves along (left part of the tracked row)→(page center) and scale 3.0→1.0, and both **share one progress curve with the same asymmetric easing bezier(0.2,0,0.25,1)**: one p = one camera, one move (same precedent as the C-style)
- The deceleration curve (fast first, then slow) gives the "crane" feel: a strong start, a gentle stop near the top. It starts at zero speed and peaks at 19% (≈2.3× average speed), so it never jumps from the hold to top speed; during the hold the camera first "takes a breath" and pushes in 1.5% as anticipation
- Focus pull: during the close-up hold only the tracked row is solid (cobalt-blue fill + a breathing tracking dot at the row start), and the other rows are pressed down to 38%; ~26f after liftoff they return to full. First let the viewer see "this one shot" clearly, then see everything
- Row-by-row wash of light: the first time the top edge of the camera's visible area `visTop = fy − 540/s` crosses a row's top edge, an accent-color wash sweeps from the start to the end of that row (starts in 3f, falls off over 18f after 6f, with a 1px accent-color outline). This is the source of the "flood in" readability; the trigger frames are solved frame by frame, strictly in sync with the camera move
- Sense of volume: the header KPI (frames rendered today) counts from 0 to 48,210 during the lift (expo-out, finishing on the same frame as the camera move), the window shadow rises from close to a floating height as it pulls open, and the stage dot grid drifts slowly at 0.35 parallax. The window finally reads as a physical object on a stage
- Aftermath: after settling, the status pill of the tracked row flips from "Rendering" to "Rendered" (spring damping 16 + checkmark draw-on + progress bar fills up), the only small event in the hold
- On a white background, "brightening" is invisible; **darkening/coloring is what reads** (precedent: brightness lift on a white card does nothing)

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Starting close-up | scale 3.0, aimed at the left part of the tracked row (shot number / 63px large text for the transition; the bottom edge of the frame stops above the window's bottom edge, so nothing outside the window shows) | Hold ≥20f so "this is a row of data" reads before takeoff |
| Lift | 102f bezier(0.2,0,0.25,1), scale 3.0→1.0 | Faster than 80f and the row washes can't keep up; slower than 130f and the middle drags |
| Focus pull | untracked rows 38% → 100%, 26f after liftoff | Without dimming, every row in the close-up has equal weight and the viewer doesn't know which row to watch |
| Row wash | triggered on line crossing, accent color sweeps from row start + thin outline, ~24f | A wash that doesn't follow the camera (fixed-interval triggers) breaks immediately |
| Ending | no extra push after full frame; keep the hold alive with a status flip, still ≥30f | R1; the full-frame shot is the standard composition |

## Known traps
- The demo was tuned on a hand-built product window with made-up data (the shorts-kit render queue). The parameters are a starting point for tuning, not final production values; the first real use must be re-verified with real footage
- The starting close-up is one row of content magnified 3.2× and stared at, so real footage must first go through the high-resolution rasterization technique of aesthetic rule Q2; a low-magnification screenshot looks blurry from the first frame
- The fast lift section can be wrapped in CameraMotionBlur (parameters in the motion blur row of deck-deal-flyin), but only wrap the fast first half. Wrapping the slow section near the top smears the text (round #8 precedent). Don't put a semi-transparent wash overlay inside CameraMotionBlur (multi-sample stacking produces vertical-stripe artifacts); put it on its own layer with the same camera
- Don't use it together with drone-dive-landing in the same video (one rises, one dives, they mirror each other, and the viewer reads them as the same trick); tilt-reveal is closest to crane in meaning but is not in the library yet, so don't mix up the names

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`crane-rise-reveal/CraneRiseReveal.tsx`](../../../src/demo/opening/crane-rise-reveal/CraneRiseReveal.tsx)

