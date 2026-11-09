---
name: orbit-ring-title-open
summary: On a graphite dark field, eight 16:9 dark content cards revolve at constant speed, evenly spaced at 45° on a 720×380 ellipse (the card faces never tilt; depth comes only from sin θ giving ±12% scale, z order and dimming/defocus for far cards). While the ring expands, the card content is frozen on its first frame, and after f24 all eight start playing together. A centered two-level title unblurs letter by letter and sinks into place; at the moment the keyword lands, a fluorescent marker block sweeps in from the left to fill it, and the text under the sweep flips to ink color; a mono sub-line then floats out. Optionally, at the end the whole line defocuses and fades out while the ring keeps turning, handing off to the next shot
use: The opening first shot = "this product has a whole set of things"; a front-door shot for asset libraries/template libraries/feature matrices/case collections; when you need real moving product footage to carry one claim instead of laying screenshots out as a static grid
length: 150f (5s@30fps; after the marker block lands at f64, a 2.9s steady-state tour + a very slow push-in; with HANDOFF_EXIT on, the exit and handoff start at f118)
energy: medium (the only continuous motion is the constant-speed revolution; the whole video has just one impact, the marker block sweep)
tags: ui-entrance
---

## Intent
When an opening wants to say "we have a whole set of things", the most common approach is to arrange screenshots in a grid. But a grid is still, and the viewer reads "a pile of images", not "a set of products in motion". This card changes the display to a **circular tour**: eight cards revolve at constant speed along an ellipse, so there is always a card entering the frame and a card leaving it, the picture carries the hint that "there's more", and the title stays pinned in the exact middle, unaffected.

The key trade-off is that **the card content must really be playing**. With static screenshots on the ring, the viewer only recognizes a "carousel"; with real motion running in the cards, the same ring instantly becomes "the product at work". But if all eight cards start playing at once, eight motions fight for the scene and none of them gets read. So during the entrance the card content is **frozen on its first frame**, and plays together only after the ring has expanded and the title has started. The viewer's attention order is therefore: first recognize this as a ring of product footage → read the title → only then notice that everything in the cards is moving.

## Motion core
- **Placement on the ring**: `θ = -π/2 + i·2π/8 + t·0.3`, `x = 960 + cos θ·RX·ringScale`, `y = 540 + sin θ·RY·ringScale`. An ellipse with RY/RX ≈ 0.53 reads as a "ring seen from above"; a perfect circle reads as a turntable. The elliptical orbit itself is drawn as a hairline in the accent color at 16% opacity, traced in over 0–30f of the entrance with pathLength
- **Card faces never tilt**: the card only changes position following θ, and its own transform has only scale and no rotation at all. Depth is left entirely to `depth = sin θ` (+1 = bottom of frame, near; −1 = top, far): `scale = 1 + 0.12·depth`, `zIndex = 10 + round(depth·5)`; far cards (depth<0) also get `blur(1.6·|depth|px)` + a dimming layer (depth of field + atmospheric perspective), and near cards get a little top light. Scale, z order and brightness must all be driven by the same depth, or "a far card covering a near card" appears
- **Ring entrance**: f0–24 `ringScale 0.62→1` (expo-out, eighty percent done in the first third of the time), expanding from the center; at the same time cards fade in one by one, card i starts at frame `2+1.5i`, fading in over 11f and growing 0.9→1. The expansion and the fade-in overlap, so it reads as "the ring grows out" rather than "cards being pasted on one by one"
- **Freeze the first frame, then play**: the card content is wrapped in `<Freeze frame={max(0, frame - 24)}>`. Before f24 all eight cards sit on their own frame 0, and from f24 they enter the normal timeline together
- **In-card coordinate decoupling**: card content is drawn at 960×540, and the outer layer scales it to the card width with `scale((CW·s)/960)` + `transform-origin: top left`. The content component doesn't need to know it has been shrunk, so when swapping in real screenshots or other shot-card components from the library you don't change a line. Stroke-drawing cards use `pathLength={1}` for the dash, so path length doesn't affect the first frame
- **Two-level title, blur-slide letter by letter**: the upper line is 64px secondary gray (starts at f10, stagger 1f, 27f per letter), and the lower line is the 156px protagonist large text (starts at f18, stagger 2f, 32f per letter: heavier and slower). Each letter has two channels that start together and end differently: the unblur runs the full letter duration (`blur (1-p)·fontSize/6`), and the sink takes only the first 1/3 (`translateY (1-p)·fontSize·0.22`), with quint-out easing. The offset stops first and the blur stops later, so the letters get the feel of "continuing to come into focus after landing"
- **Marker block sweep + color flip**: `spring(frame-50, damping 20, stiffness 190)` drives `scaleX` (capped at 1.03), `transform-origin: left center`, and the block is 0.14em wider than the text on each side, sitting under the text. The text is drawn in two layers: a white text layer clipped to the left of the block's leading edge, and an ink text layer (onAccent) clipped to the right of the leading edge, with the leading edge position converted to the text box by `(m·(W+0.28em) − 0.14em)/W`. Text flips to ink the moment the block sweeps over it, reading as "swiped by a highlighter"
- **Title scrim**: a dark radial scrim sits above the card layer and below the text layer, so near cards passing behind the title are dimmed
- **Hold**: from f40–150 the whole picture pushes in smoothly by 2.5%, and the ring keeps revolving at constant speed
- **Exit (optional, HANDOFF_EXIT)**: from f118, over 10f the whole line goes `opacity 1→0` + `blur 0→6.5px`, after which only the ring keeps turning. Turn it on when the finished video cuts to crash-zoom / straight through a light scene; the single-shot demo stops on the full poster

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Ellipse radii | RX=720 / RY=380 (cards 400×225) | RY/RX≈0.53 is the sweet spot for a "ring seen from above"; a ratio →1 reads as a circular turntable, →0.3 and the cards squeeze into a line at the top and bottom edges |
| Card count | 8 (azimuth spacing 45°) | 8 cards at this radius never cover each other at any rotation; ≥10 cards need RX/RY enlarged in step, or near cards crush the edge |
| Revolution speed | 0.3 rad/s (about 86° in 5s) | **Don't speed it up just because it "looks slow"**: above 0.5 rad/s cards sweeping past the frame edge flicker, and it upstages the title |
| Ring entrance | f0–24, scale .62→1, expo-out | <15f feels like a popup; >30f and the ring is still growing when the title starts, so the two cover each other |
| Per-card fade-in | card i starts at frame `2+1.5i`, 11f | A 1.5f step is just enough to read "one after another"; >3f and the last card arrives after the title |
| Play start frame | PLAY_START=24f | It must be ≥ the end frame of the ring expansion; earlier makes eight motions fight for the scene during the entrance |
| Depth | scale ±12%, far defocus ≤1.6px + dimming | Scale >15% shrinks the top cards into icons and the ring reads as a "perspective tunnel"; defocus >3px makes far cards look dirty |
| Title | upper line 64px/500 gray + lower line 156px/600 white | The ring is always moving, so the protagonist line must be big and heavy enough to hold; two lines at the same size lose hierarchy |
| Per-letter rhythm | upper line stagger 1f / 27f per letter; lower line stagger 2f / 32f per letter | A stagger of 1–2f gives the feel of "unblurring as a whole"; ≥3f reads as a letter-by-letter typewriter |
| Marker block | starts f50, spring damping 20, fluorescent yellow-green #c6f432 | damping <14 bounces past the block edge; on the dark field it is the only highly saturated block, so don't give a second one |
| Sub-line | shorts-kit logo + lowercase wordmark 30px + mono 26px "SHOT RECIPE CARDS" (tracking 0.2em), floats out over 16f from f60 | Wide-tracked mono is how a "product code name" reads; the same font as the title reads as a second headline; don't write numbers that go stale, like a card count |
| Exit (optional) | f118–128, blur 0→6.5px | The whole line defocuses as one; **a letter-by-letter exit reads as a second entrance** |

## Known traps
- **Cards must not tilt with θ.** Adding `rotate(θ)` to the cards instantly turns the ring from a "display" into a "roller coaster", and the text inside the cards tilts too, so readability drops to zero. Cards only change position, not angle
- The card content must bring its own static skeleton on the first frame (base color/border/label/dark-base track). What shows during the freeze is frame 0, and if the card's motion is "drawn from nothing", the 24f of entrance are eight blank cards. Every placeholder card in the demo has a dark-base sparkline / faint draft lines / a resident prompt added, precisely so the first frame isn't empty
- `zIndex` must follow depth. With only scale and no z order, the DOM order lets the back cards cover the front ones, and the near-large/far-small solidity is voided on the spot
- The marker block and the text layering come as a pair: block `zIndex:0` + text `position:relative; zIndex:1`. If you leave out the relative on the text, the block covers the text (in a stacking context, static elements are painted after positioned ones)
- Title `white-space: nowrap` is a prerequisite of the marker block: the block's 0.14em overshoot on each side and the color-flip clip both assume the highlighted phrase sits in one line box. After a line break the block breaks into two pieces across lines. If you change the character count of the highlighted word, change the W in the leading-edge conversion too
- The ring is a background layer but it never stops moving, so **don't stack a second moving thing on the ring** (particles, sweeps, gradient breathing). There is already one continuous motion present, and a second makes the picture lose its hierarchy
- How it differs from `carousel-3d`: that card is true 3D (`rotateY + translateZ` + backface-hidden), and the cards turn to the back of the ring, which suits a seamlessly looping pure display; this card is a 2D elliptical pseudo-depth with the cards always facing the viewer, which suits an opening of "ring as the base + a foreground title". Use the former when cards must flip, and the latter when the title must hold
- The demo's eight cards are original generic DOM placeholders (dark product cards + a single fluorescent accent color, with card frame shadow/brightness changing with depth) and contain no product screenshots; when you apply it, replace the whole block with your own shot-card components or real page screenshots, and the ring's grammar needs no changes at all

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`orbit-ring-title-open/OrbitRingTitleOpen.tsx`](../../../src/demo/opening/orbit-ring-title-open/OrbitRingTitleOpen.tsx)

