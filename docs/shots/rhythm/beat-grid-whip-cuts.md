---
name: beat-grid-whip-cuts
summary: The whole film is one table of shots whose start and end are beat numbers on the measured music grid; each seam is a 9-frame whip, the old shot sliding out and the new one sliding in with a horizontal-only motion blur.
use: any promo cut to music: lay out the shots on beats first, then pick per seam a hard cut (the problem section) or a whip (the product section)
length: whole film (885 frames here); each whip seam is 9 frames of overlap
energy: medium to high, set by the shots in it
tags: beat-sync, timeline, whip-pan, motion-blur, seams, music, structure
source: knowns-ui/launch-tvc
---
# beat-grid-whip-cuts

## Intent
Cuts that land on the beat feel inevitable; cuts that miss by 3 frames feel random. This card
makes the beat the unit of the timeline. Shots are declared as `{ from: beat(4), to: beat(8) }`,
the sound effects are pinned to the same beats, and the seams are generated, not hand-placed.
Change the tempo or the drop, and every cut, whoosh and click moves with it.

The whip here is lighter than the hard-brake whip in
[`shot-transitions`](../transition/shot-transitions.md): no long tail, just a 9-frame shove
both ways, so it suits a run of 4-beat product shots.

## Motion core
- The grid: `GRID0 = 10.04` s (the measured kick of the drop), `BEAT = 0.5` s (120 BPM),
  `beat(k) = GRID0 + k * BEAT`. Before the drop the problem cuts use their own
  `cb(k) = 0.04 + k * 0.5`, the same grid counted from the start.
- The shot table: `{ from, to, node, inW?, outW? }` in seconds. Each shot becomes a
  `<Sequence from={f(from)} durationInFrames={f(to - from) + OV}>`: it runs `OV = 9` frames past
  its end, so the outgoing and incoming shots overlap during the whip.
- The whip (`Shot`): in the first 9 frames the shot slides in from `+1500 px` with ease-out
  (`--kn-ease-out`, bezier 0.22, 1, 0.36, 1); in the last 9 frames it slides out to `-1500 px`
  with ease-in quad. Blur is `(in + out) * 46` px, applied as an SVG `feGaussianBlur` with
  `stdDeviation="46 0"`: horizontal only.
- `inW: false` and `outW: false` turn a seam into a hard cut. The problem section is all hard
  cuts; the product section is all whips.
- One filter per shot, its id from `useId()`, because two shots are on screen during a whip.
- The sound table sits on the same grid: a whoosh at `beat(4)`, `beat(8)`, `beat(12)`, `beat(16)`,
  a click and a chime inside the shot at `beat(6)`, one click per colour ripple at `beat(28..31)`.
  Each whoosh is started `skip = 0.62` s into the file so its peak lands on the beat.

## Parameters
| Parameter | Typical value | Feel when changed |
|---|---|---|
| Beat | 0.5 s = 15 frames (120 BPM) | measure it from the track's kicks; never type the BPM from the track's label |
| Product shot length | 4 beats (60 frames) | 2 beats is too short to read a real component (R3); 8 beats sags |
| Whip overlap `OV` | 9 frames | under 6 the blur barely shows and the seam reads as a jump; over 14 it is a slide |
| Whip distance | 1500 px on a 1920 frame | less and the next picture is recognisable mid-whip, which reads as a pan |
| Whip blur | up to 46 px, horizontal only | an isotropic blur reads as a defocus, not speed |
| Easing | ease-out in, ease-in quad out | the same easing both ways makes the seam symmetric and mechanical |
| Whoosh offset | sample peak at 0.6 s, skipped by 0.62 s | without the skip every whoosh lands 18 frames late (S5) |

## Known traps
- Cuts must land within 3 frames of the measured beat. When the track changed, the drop moved
  from 12.9 s (145 BPM) to 10.04 s (120 BPM); because everything was on `beat(k)`, one constant
  moved the film (S3).
- R4: the grid gives the timing, not a hit on every beat. Only the elements in a shot move on
  most beats. Whole-frame hits stay at 3 or fewer.
- S2 and S5: the sound table is declarative, one row per cue with a comment. Each sample's
  peak lag goes in `skip`, once, not into scattered frame numbers.
- Filters on layers inside a CSS perspective made Chrome tile the frame. The whip blur sits on
  the flat `AbsoluteFill` around the shot, never on a 3D child.
- Do not stack a flash on the whip seam: one seam, one style.

## Pairs with
- [`slop-punch-montage`](slop-punch-montage.md): the hard-cut half of the table.
- [`macro-measured-press`](../interaction/macro-measured-press.md): the 4-beat shots the whips join.
- [`shot-transitions`](../transition/shot-transitions.md): the heavier whip with a long tail.
- [`beat-cut-moves`](beat-cut-moves.md), [`trailer-bumper`](trailer-bumper.md).
- Sound: [`whoosh`](../sfx/whoosh.md) on each whip.

## Reference implementation
- [`beat-grid-whip-cuts/Main.tsx`](../../../src/demo/interaction/accent-ripple-chain/Main.tsx): `beat()`, the shot table and the sound table in `Tvc`
- [`beat-grid-whip-cuts/motion.tsx`](../../../src/demo/rhythm/beat-grid-whip-cuts/motion.tsx): `Shot` (the whip), `OV`, `Word`
