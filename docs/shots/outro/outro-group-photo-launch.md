---
name: outro-group-photo-launch
summary: Elements from the whole piece fly in from all sides and surround the wordmark for a group photo; a crane landing camera position + stage light + gold dust make a launch-event close.
use: Outro / brand ending; the "family photo" final shot for multi-feature products
length: about 4.8s (145f)
energy: peak (the highest point of the whole piece)
---

## Intent
Call back one representative element from each feature the viewer has seen for a group photo, with the wordmark making its entrance as the finale. What the viewer remembers last before leaving is "these things belong to the same product". The spec must be launch-event grade: energy pushed to the highest point of the whole piece.

## Motion core
- 9 page elements (nav/card/content bar/search box/stats bar/document header) fly in from four sides with rotation, directional motion blur by speed during the flight segment, and land with a settle (contact shadow tightens + 1.5% light press, no individual glows, Q4)
- The wordmark (demo: shorts-kit mark + wordmark, the eyebrow is the brand phrase) makes its entrance letter by letter in letterpress, everyone "steps back to the back row" to yield to the lead; the rule grows, extension lines shoot out
- Crane camera move: the group-photo layer as a whole drops with rotateX 4°→0 + scale, then pushes in slowly
- Launch-event atmosphere trio: an opening light band sweeps across, stage light behind the wordmark, gold dust floating up
- The background page is blurred into depth of field

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| element fly-in | 9 elements cued from 4, one every 3f, each flying 12f; start offset ±360–500px; render order = cue order, later arrivals stack on top | Every feature already shown needs a representative element (Q8 self-check item), and the viewer will notice whoever is missing |
| fly-in easing | bezier(0.34,1.4,0.44,1) | A lesson named in the code comment: the old bezier(0.25,0.9,0.3,1) "never crossed 1" and had no real overshoot; for a landing bounce y1 must be >1 |
| flight pose | in flight rot×2→settled rot (within ±5°), scale ×1.12→1; directional motion blur by screen speed (0.3×px/frame, capped at 22); landing cue+9→16f contact shadow tightens + 1.5% light press | Settled angles are kept within ±5°: the group photo should be tidy but not stiff |
| step back to the back row | While the wordmark enters, at 42–50f everyone gets opacity −12%, saturate −8% | When the lead enters the supporting cast must yield; without yielding the wordmark can't hold against 9 elements |
| crane camera | `perspective(1400px) rotateX(4°→0) scale(1.06→1)` dropping over the first 40f, then a slow push of +0.035 (from 36f in-out with zero-velocity start, joining the crane without a sudden change) | The crane amplitude is this small (4°) and already enough to read as a "landing camera position"; larger is dizzying (conjecture) |
| atmosphere trio | light band 2–14f (600px wide overlay, peak opacity 0.12); stage light 42→50→58f 0→0.5→0.25; gold dust 20 specks 2.4–4.2px with a warm halo, opacity 0.35–0.7 with slight twinkle + 6 foreground out-of-focus light spots, all parameters derived deterministically from the index | Particle/light parameters must be derived deterministically (hard rule: renders must be reproducible); gold dust beyond 30 specks starts to look like snow (conjecture) |
| wordmark | The demo uses the shorts-kit mark + lowercase wordmark (brand font 118px): the mark presses first at 38f, letters delay=42+i·1.8, 8f, with the same letterpress; the rule grows 58→70f, extension lines of 190px at both ends shoot out in 8f and fade in 6f; letter spacing breathes 62–66f; background page blur 0→14 within 24f; after settling a sign-off hold of 30f | The wordmark holds a full 1 second after settling (R1 decision); the outro gets no narration caption, to stay clean (C1 exception) |

## Sound
A fixed three-beat sentence pattern: riser-cine lays in the assembly (pinned at f945 in the template piece) → impact-deep-whoosh pinned on the wordmark stamp (f980, vol 0.55, the peak of the whole piece) → sparkle on the rule (f1005). This is the only sentence pattern in the template piece that has never been changed since it was finalized (S2; see sound-design 4.3 for details).

## Known traps
- The first draft of an ending is almost always too conservative (Q8: quiet signature-style → group photo → launch event, escalated through three levels). Start from the beginning with the "like a product launch" spec and give full crane/stage light/particles
- Structure before effects: first have the "fly in from four sides for a group photo" structure and then add atmosphere; piling on effects directly leaves no skeleton
- Check the outro tagline against the copy below the wordmark for duplicates (P4 dedupe precedent); the same sentence appears only once in the whole piece

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`outro-group-photo-launch/OutroGroupPhotoLaunch.tsx`](../../../src/demo/outro/outro-group-photo-launch/OutroGroupPhotoLaunch.tsx)

