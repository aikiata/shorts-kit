---
name: stroke-segment-build
summary: Broken strokes become a word: the title is split into a dozen or so disconnected stroke segments that light up out of order one by one; the first 70% is unreadable, and at the moment the last segments drop into place the meaning snaps into existence
use: An opening that hangs suspense on a product name / big number reveal; at most once per video. How it differs from type-assembly/draw-svg-trace: those are "watch the text being assembled/drawn", this card is "meaning revealed late"
length: 165f (5.5s; hold 2s after the reveal at f105)
energy: low start, medium finish (suspense type; the landing frame is the energy point)
tags: typography
---

## Intent
The Alien title sequence precedent: the title is not drawn, it is "developed". It is split into discrete stroke segments that light up out of order, so for the first 70% of the time the viewer sees only mysterious fragments, and the moment the last few segments land they suddenly read what the word is. The "moment of recognition" is the hook, and the hook's strength depends on how long the unreadable period lasts and how late the key segments are held back.

## Action phases
| Phase | Frame range reference | Content |
|------|------|------|
| 1 Dark field | f0–12 | Deep purple wall + very faint wall light held still (not dead black) |
| 2 Out-of-order light-up | f12–72 | The start times of the first 13 segments are distributed on ease-out (interval 9f getting denser down to 3f); each segment is a 7f neon strike-up flicker (on, off, on, half, on), then holds at 0.58 brightness |
| 3 Held breath | f72–86 | 14f with no new segments added, only a faint hum of tube current: the tightest beat of the suspense |
| 4 Key segments | f86 / f93 / f99 | S lower spine → H crossbar → P bowl bottom, dropping in on three beats |
| 5 Reveal | f105 | All tubes 0.58→1, current surges to 1.25 then falls back (the sign's own wide bloom surges once), whole word scale 1→1.02, the wall and floor get lit |
| 6 Freeze | f113–165 | The subtitle rises then holds; the camera pushes in very slowly 1→1.035 throughout |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Segment granularity | 4 letters, 16 segments (single-line geometric letters 260×400 each, tube line width 30, round caps, a 4% electrode gap left at each end) | Too few segments shortens the suspense; too fragmented reads as noise. S is split into two opposite arcs of 3 segments each |
| Out-of-order table | Hand-ordered: jumping across letters, with the "legibility key segments" (S lower spine / H crossbar / P bowl bottom) held to the last 3 segments | Lighting in order = no suspense; a key segment coming early = leaking the answer |
| Light-up rhythm | sparse→dense (9f→3f, `stagger(.., EASE.out)`) → held breath 14f → three beats 7f/6f | Even constant spacing has no tension; a held breath <8f isn't felt, >20f reads as stuck |
| Unreadable period | The first 13 segments (about 60% of the length) can't be read as text | In QA, pull a mid-sequence frame and ask "could I guess it?"; if you can, reorder |
| Half-lit → full-lit | 0.58 in the suspense period, 1.0 at the reveal + a surge to 1.25 | If the suspense period is too bright (>0.8), the reveal has no "powering on" contrast |
| Landing pulse | scale 1.02 + a surge of light | Neon is an object hung on a wall, and big scaling looks fake; leave the impact to the light |
| Wall lighting | ambient light = 0.12 + 0.5 × fraction of segments lit + reveal/surge | The more tubes, the brighter the wall, which is physically believable; a constant wall light makes the light-up lose its weight |
| Floor reflection | mirrored along the floor intersection line, blur 5px, opacity 0.42, fading with distance from the floor | The mask is written in local coordinates before the mirror, and everything above the intersection line must be fully transparent |
| Unlit segments | not rendered by condition (not opacity 0) | The precondition for a truly still ending and for "not leaking the answer" |

## Known traps
- The demo is a neon sign version (aurora dark field); with other materials (LED segment display, glowing outline) the strike-up curve and half-lit value must be retuned
- Use light gray for helper text on a dark base: in the demo's first version the top title in dark gray on a dark base was invisible (caught by the P1 self-check)
- Don't draw a separate radial light blob for the reveal bloom: it forms a dirty bright spot in the middle of the word; let the sign's own wide bloom (whose shape is the word) surge once
- The reflection renders the whole sign twice (each pass has two layers of SVG Gaussian blur), so a single shot's render cost doubles; when performance is tight, cut the reflection first
- Letter count limit: words of 4–6 letters work best; with long words the unreadable period is hard to control and the segment count explodes
- This card lives on the "moment of recognition", so the title must be a word the viewer knows (a product name / SHIP / LIVE type word); a coined word has no "recognition" to give
- Sound: pair each segment light-up with a short neon strike-up current tick (sparse, with volume stepping down), keep only a low-frequency hum for the held breath, and use one impact on the landing frame, optionally with a riser underneath

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`stroke-segment-build/StrokeSegmentBuild.tsx`](../../../src/demo/opening/stroke-segment-build/StrokeSegmentBuild.tsx)

