---
name: neon-triple-marquee
summary: A three-row counter-moving neon marquee recap. Giant hollow neon-tube letters spelling a three-word phrase fill an obliquely shot brick wall in top, middle and bottom rows. Odd and even rows scroll endlessly at constant speed in opposite directions, the three rows light up in turn at 1/3 phase offsets, and at the end they power off row by row.
use: The closing theme-word repeater segment; the "afterglow" treatment of a three-word slogan; music segments with no narration
length: 4–5s (demo 150f: 18f row-by-row ignition power-up + loop body + 18f row-by-row power-off + 8f lights-out hold)
energy: medium-high (continuous flow + row-by-row pulses, no instantaneous impact)
tags: typography
---

## Intent
A single-row marquee is just web decoration. Stack three rows, make odd and even rows reverse, and then let the brightness walk around by phase,
and it becomes "the theme words parading in formation before the viewer". The crux is the **light/dark round-robin**: at any moment
only one row is the neon lead, and the others are dimmed to thin-outline background. All three rows lit is a signboard accident,
and lighting in turn is what makes a recap. The counter-scroll creates a feeling of being surrounded: the top and bottom rows go right, the middle row goes left,
the gaze is sandwiched in between, and words keep flowing past from both sides, reading as "these three words can't be said enough".

## Motion core
- Seamless wraparound: copies are absolutely positioned at equal spacing of a fixed unitW, and translated by `(frame*speed) % unitW`
  modulo; constant-speed linear (marquee types are the library's linear exemption)
- Hollow tube letters in three layers: `-webkit-text-stroke`, color transparent. Dark-state glass tube (same color at 0.3 opacity, always on, so the three-row structure is always there)
  → powered colored tube body (stroke 6→10px + three-layer drop-shadow glow 9/36/90px) → near-white hot core (2→3.8px); brightness also drives
  the same-color spill light on the brick wall behind (screen blend, the mortar lines are lit up). Adjusting only opacity without the glow doesn't read as "neon powered on"
- Round-robin: period 42f, each row gets a 14f slot, slot length 16f (overlapping the next row by 2f for the handoff, so there is never an all-dark empty beat); inside the slot the first 2 frames are an ignition flicker
  (0.6 → 0.25 → full), 3f ramp to full, plateau, last 5f ease-in extinguish, which guarantees "one lit, two dark" always holds
- Camera: the whole wall sits on a 3D plane at perspective 1700 and is shot obliquely, rotateY −17°→−9° with a very slow smooth pan-in over the whole piece + scale 1→1.05;
  a wet floor at the foot of the wall, the flipped reflection of the bottom row (blur 3px + fade mask) and each row's own floor color-light pool breathe with the brightness
- The three rows are colored ice cyan / magenta / sodium-lamp amber (#38d9ff/#ff3d9a/#ffae34), blue-black brick wall #0a0b14; the middle row is reversed and slightly faster (9/11/9 px/f)
- Power-up / power-off: at the opening the three rows run a deterministic ignition flicker sequence at 0/5/10f; from 124f, top to bottom, each row flashes twice and goes out staggered by 6f,
  landing on a lights-out poster showing only the dark-state glass tubes (not faded to dead black)
- Font Avenir Next Condensed Heavy 286px (falling back to DIN Condensed / Impact), word spacing laid out by canvas-measured width, the separator is a hollow diamond ◇ (border the same color and weight as the tubes in the same layer)

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| font size / line spacing | 286px condensed, line spacing 290px filling the wall | Row whitespace >80px reads as three banner ads rather than one word wall |
| scroll speed | 9/11/9 px/f, middle row reversed | A condensed face is denser, so one notch slower than a wide face; >20 and the words can't be read, only light bands; three rows at the same speed and direction read as a whole-sheet pan |
| pulse period | 42f, each row a 14f slot + 2f handoff overlap | A period <30f makes the three rows fight to flash and reads as a glitch; >70f and the round-robin feel breaks; without overlap an all-dark empty beat appears every 14f |
| brightness range | dark glass 0.3 + powered stroke 6→10px + three-layer glow | Dark state <0.2 and the dark rows vanish, losing the "three rows" structure |
| glow | three-layer drop-shadow, lit state 9/36/90px + wall spill 0.55 | A single layer or <20px reads as ordinary outlined text, not neon; without wall spill it reads as "text on a screen", not "a light on a wall" |
| oblique shot | rotateY −17°→−9°, perspective 1700 | >25° and the far-end words crowd together unreadably; 0° returns to flat, losing depth |
| power-up / power-off | in: ignition staggered 5f row by row; out: from 124f power-off staggered 6f row by row | Hard cutting in or out reads as the material not filling the frame; fading the whole group at once lacks the ritual of "turning off the lights" |

## Known traps
- The demo was tuned on grayscale/placeholder material. The parameters are a tuning starting point, not a final production setting.
  The first production use must be re-verified on real material
- Division of labor with page-waterfall-wall: that card is a vertical waterfall of page screenshots for a "sense of content volume",
  this card is horizontal counter-scrolling text rows for the "afterglow of theme words": the material is words, not pages, and the position is at the end, not mid-piece
- Division of labor with outro-group-photo-launch: the group photo is a peak final shot (elements posing together + a launch-event close),
  this card is a recap lead-in before the final shot or a low-cost alternative final shot; the two can be chained (this card → fade out → group photo) but not stacked
- The number of copies leaves a margin of `ceil(1920/unitW)+3`: for short words (≤4 characters) unitW is small,
  and too few copies show a gap on the right at the moment of wraparound
- Production brand-color version: the three rows can share a brand color and be told apart by light and dark, but the glow contrast must be ≥ the demo's range of
  dark state 0.3 → powered full brightness + three-layer glow, otherwise the round-robin can't be read
- The drop-shadow glow in the 3D oblique plane is not cheap (demo at 1080p takes about 7s to render 150f); the reflection layer draws only the tube body, not the glow (cheap)

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`neon-triple-marquee/NeonTripleMarquee.tsx`](../../../src/demo/outro/neon-triple-marquee/NeonTripleMarquee.tsx)

