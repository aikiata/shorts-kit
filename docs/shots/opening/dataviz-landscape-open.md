---
name: dataviz-landscape-open
summary: Dark-field tributary-line landscape opening: many flow lines merge into one trunk, made-up ID labels float on the lines, and the camera flies over slowly with heavy depth of field
use: A brand-level abstract opening (the "data universe" metaphor), followed by a light-field product section or a wordmark. How it differs from glow-flyline-moves: that card is connecting-line storytelling between cards inside a section; this card is a full-frame landscape made just for openings
length: 5–8s (an opening atmosphere section, at most 1 per video; demo 180f)
energy: low start, slow rise (a starting slot, leaves room for later shots to climb)
tags: data, camera
---

## Intent
This is the brand-level opening category proven by the Linear Releases launch video opening: shoot the data world behind the product as a **dark-field landscape**. A bundle of tributary lines merges from deep in the frame into one trunk (the metaphor "countless workflows become one product"). The realism comes from three things: ① made-up issue/task ID labels float on the lines (the demo uses shorts-kit shot numbers + camera move names: each tributary is a shot, and together they merge into one finished video), so the viewer recognizes "this is the kind of thing I see every day"; ② heavy depth of field: large blurred near-field lines flow past, mid-field labels are sharp and readable, and the far field fades out, and these three layers of depth make a flat SVG read as space; ③ the camera flies over slowly and steadily. This is an atmosphere section, not a showpiece, and the sense of speed is left to the shots after it. Hand-built UI is allowed because this is not a recreation scene (this picture does not exist on any page), so under the revised version of core principle 1 it goes through the quality + clarity-of-expression gate.

## Action phases
| Phase | Frame range (@30fps reference, demo 180f) | Content |
|------|------|------|
| 1 Growth | f0–70 | The trunk draws on from near to far toward the vanishing point (36f out-cubic, with a glow dot at the pen tip); tributaries grow in from off-screen on both sides, staggered by 4–6f, merging tangentially |
| 2 Fly-over | f0–180 | The camera flies forward low along the river channel + a slow lateral drift (overlapping the growth phase); labels stand up non-uniformly staggered over f44–96, and bright pulses on the finished lines flow toward the merge point |
| 3 Handoff | f104–180 | Labels stop being added; a glow in the accent color lights up at the vanishing point and a large headline lands in the sky; the camera decelerates to a gentle stop on a bezier, hold ≥30f |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Line bundle size | 8–14 tributaries merging into 1 trunk (demo 11, including 1 near-field tributary that sweeps close to the lens) | More than ~16 reads as a screensaver/tech template; the trunk must be unique (the landscape version of the single-protagonist principle) |
| Landscape projection | Lines are drawn on a true-perspective ground plane with pinhole projection `sx = 960 + F·(X−camX)/Z'`, `sy = horizon + F·camH/Z'`, with F 1100, camera height 220, horizon at 0.39 of frame height | With flat SVG lateral moves you have to fake three layers of parallax by hand; true projection gives you near-large/far-small, parallax and convergence for free |
| Merge topology | Tributaries merge into the trunk tangentially with bezier curves (tangent at the merge point = trunk tangent), and the trunk's direction puts the vanishing point in the right third of the frame | Perpendicular crossings read as a circuit diagram, not a river system; a centered vanishing point is stiff |
| Depth of field | Layer each segment by projected depth: Z' <~1000 goes in the blur layer (blur 11px, line width ×1.3), mid-field is sharp, and from Z' >2600 it fogs and fades; line width = world line width·F/Z' | If the near field is not defocused it reads as a wireframe; if the far field does not fog, it bunches into one bright clump at the horizon |
| Camera fly-over | Forward 950 world units / 180f, bezier(0.3,0.3,0.55,1): already flying at the start, decelerating to a gentle stop at the end; add a lateral drift −140→110 | Faster becomes a chase shot (that is crash-zoom's job); with forward push only and no lateral drift, the near/far offset is weak |
| Line drawing | Each line is sampled at equal arc-length intervals and drawn segment by segment (per-segment width/opacity), with **butt caps** | Round caps stack a ring at every joint on semi-transparent lines, and the whole line reads as a string of beads |
| Sense of flow | After growth finishes, narrow-peak bright pulses drift slowly along the lines toward the merge point, visible only in the mid and far field (a near segment is very long on screen, and per-segment light and dark reads as steps) | With no moving elements after the growth phase, the second half degrades into a "route map fly-over" rather than "data flow" |
| Labels | 5–9 in the mid-field (demo 6): an accent-color square pin lands on the line + a short post + a monospace ID capsule, scaled by perspective 1500/Z' (clamped 0.7–1.7); far ones are drawn first, near ones last | **The post's world height must be far lower than the camera height**: when post height ≈ camera height, all labels project onto the horizon and bunch into a row. Positions must be checked by projecting frame by frame so that neither the start nor the end overlaps |
| Growth rhythm | Trunk goes first at 30–40f out-cubic, each tributary staggered by 3–6f | If everything grows on the same frame it reads as a loading animation |
| Ending | Labels stop being added ≥15f before the handoff frame, and the camera decelerates without a hard brake; the title (eyebrow + two lines at 108px) rises word by word | A hard brake in an atmosphere section is a visible hitch (same origin as the glow-orb convergence precedent) |

## Known traps
- Source of the idea: the Linear Releases opening (evolution round #3 breakdown #7), a single-example sample. Parameters are given as ranges, not dogma; the first real use must be re-verified with real footage
- Don't use it next to glow-flyline-moves in adjacent sections: both cards are "glowing lines on a dark field", and back to back they read as the whole video having only one trick. If both are needed in the same video, leave ≥2 light-field shots between them
- The cost of entering and leaving a dark field is the same as the glow card: to move into a light-field product section, use a cover-cut-family pad from shot-transitions, and don't hard cut between dark and light
- Pure white fully bright lines blur into a spider web. Spread brightness across layers (see the parameters table); the mid-field is the protagonist layer. Give trunk and tributaries 1–2px of soft glow to build the "glowing line" atmosphere; with no glow at all it reads as a wireframe (within the single-point light effect allowance of Q4)
- Label font size must be ≥18px equivalent at the target frame size, or "readable" degrades into decorative noise (same origin as Q6)
- Sound: lay a riser / low-frequency pad as a bed, and don't punctuate each label as it appears (batch, don't sound them one by one; same origin as S2); a single whoosh/impact on the handoff frame goes to the next shot

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`dataviz-landscape-open/DatavizLandscapeOpen.tsx`](../../../src/demo/opening/dataviz-landscape-open/DatavizLandscapeOpen.tsx)

