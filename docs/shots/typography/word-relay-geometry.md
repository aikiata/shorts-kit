---
name: word-relay-geometry
summary: Three benefit words each get their own geometry relay. A dashed large circle spins and decelerates while a comet arc races around → three solid circles grow by trim one after another, then close in and clamp tight → a chrome metal sheen sweeps across and, one beat later, settles to pure white. The old word shrinks to 0.86 and fades out; the new word is revealed stroke first, then fill
use: Three-point benefit statements (faster / better / stronger); brand values sections; a mid-section push that needs "one word, one world"
length: about 6.0s (180f@30fps: three segments of ≈60f each, 6f overlap between segments)
energy: medium-high (three-beat advance + geometry motion throughout + background particles, no still frame)
---

## Intent
A three-point benefit statement is most easily made as three title cards hard-cut together. The relay approach gives each word a set of
**geometry that belongs only to it**: the dashed circle is "spinning" (fast), three interlocking circles closing in is "biting into each other" (tight / good),
and a metal sweep of light is "hard material" (strong). The geometry itself argues for the adjective. The third word
gets a promotion (sheen sweep + settling to white) because it is the conclusion. Background dust, a shared stage light, and a three-segment progress bar
at the bottom stitch the three beats into one continuous space; otherwise it is still three cards.

## Motion core
(Demo version: graphite dark-scene cinematic title card, word list Faster / Tighter / Stronger, native 1920×1080 coordinates)
- The three segments are laid out by frame: Faster 2→62, Tighter 56→122, Stronger 116→180; each segment's entrance 14f (snappy,
  `scale 1.06→1` + 10px defocus removal), exit 10f (exit with strong ease-in, `scale 1→0.86` + 12px defocus), and
  the 6f overlap at the handoff is a baton pass, not a hard cut; the last segment has no exit and holds 22f after settling to white
- Each word has three text layers (230px/800, static type Helvetica Neue): the `outline` layer is `-webkit-text-stroke:2px`
  + transparent fill, the `fill` layer is pure white. **The stroke arrives first, the fill is revealed after**; the three layers share `padding: 0.08em 0.1em 0.28em`,
  otherwise the mask / background-clip is drawn only inside the box, which crops the descender of g and the right edge of the last letter and exposes the stroke layer underneath
- The fill of the first two words wipes in horizontally with a ±7% soft-edge `mask-image` (starting 10f after entrance, 18f, swift), and the stroke layer's opacity
  drops in sync to 0.2, leaving a little ghost
- Faster's geometry: a dashed large circle (r=400, `dash 10 16`) + an outer 120-tick ring (r=452, rotating slowly the opposite way),
  growing snappily from 0.4 to 1 over 22f on entrance while spinning an extra 160° and braking with deceleration (flywheel feel), then spinning slowly at constant speed and never stopping; a 16-segment
  fading white comet arc races along r=400 at 7.5° per frame. "Fast" is read from the two layers' relative rotation speeds + the comet's speed difference
- Tighter's geometry: three solid circles (r=218) grow by `pathLength=1` + dashoffset trim, starting the stroke around each circle's own center
  `rotate(-90 cx 0)`, with delays 0/6/12f and 22f each (out), and a glowing dot at the pen tip goes out once the stroke is full; from 92f the spacing among the three circles
  closes from 340→300 over 14f (swift), and at settling the circle lines brighten once and the four intersection points light up as diamond rivet light dots (overshoot pop-out).
  "Tight" is a visible closing action
- Stronger has no geometry: from 120f the stroke → a vertical chrome gradient (bright top, dark waist, bright bottom); over 124→148f a narrow white band with a champagne warm tint
  (`100deg`, `background-size:300%`) sweeps from left to right; over 146→158f it settles to pure white + one bloom pulse,
  a horizontal light band under the word expands snappily from 0.2 width, and the stage key light brightens on the same beat. This is the promotion reserved for the conclusion word
- Under each word a 40px sub-sentence gives product evidence (rise word by word; the demo uses three promotional lines of shorts-kit), top-left a mono counter "01 / 03",
  top-right an engraved logo + shorts-kit lowercase wordmark, and a bottom three-segment progress bar (label-grade texture);
  the camera pushes in very slowly 1→1.025 smooth throughout (no shake)

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Three segment periods | ≈60f each, 6f overlap | About 2s per word is the lower limit for "read the word + look at the geometry"; an overlap <3f reads as a hard cut, >12f and the two words fight on screen |
| Entrance / exit windows | in 14f snappy / out 10f exit | Exit shorter than entrance is right (a departure should be decisive); an exit on an out curve reads as "reluctant to leave" |
| outline→fill | 18f swift, ±7% soft edge, outline keeps 0.2 | Keeping a little stroke as a ghost is the source of texture; dropping it to 0 flattens the text; a window >30f wipes in as slowly as a loading bar |
| Dashed circle | r=400, `dash 10 16`, scale 0.4→1, extra 160° spin on entrance and braking | The braking is the first evidence of "fast"; a scale start >0.7 loses the "growing out" |
| Comet arc | 7.5° per frame, 16 fading segments | It must be 8x faster or more than the ring to read the "speed difference"; fewer than 8 segments and the tail breaks into dashes |
| trim growth | delay 6f per circle, 22f each | The phase difference is the key to "interlocking one after another"; growing at the same time reads as three independent circles |
| Closing in | spacing 340→300 (14f swift) + intersection rivets | A closing amount <20px shows no action; >60px and the three circles crowd into a lump |
| sheen sweep | `100deg`, `background-size:300%`, 24f smooth | 300% keeps the white band to a small stretch of the word width (= metal highlight); the chrome base layer cannot be skipped, otherwise before the sweep it is a block of gray text |
| Settle to white | 12f + bloom pulse + light band underfoot | This beat is the only "conclusion" treatment in the piece; delete it and the three words are equals, with no landing for the third point |
| Size and palette | word 230px/800, sub-sentence 40px, geometry `rgba(236,238,244,.42)`, graphite dark scene | Geometry one step dimmer than the text is the hierarchy; geometry brighter than the text steals the lead |

## Known traps
- The demo was tuned on grayscale/placeholder material. The parameters are a tuning starting point, not a field-tested final;
  the first real use must re-check against real material
- **The three words must be three points of the same syntax (the demo's are all comparative words, 6–8 letters)**:
  the periods are equal in length, and the geometry (circle radius, spacing) uses hard-coded coordinates,
  so a long word pokes out of the dashed circle or presses onto the interlocking circles. When changing the word list, adjust r and the closing spacing in sync
- `-webkit-text-stroke` is a prefixed property: available only in Chromium/WebKit, and in Firefox the stroke layer
  is simply transparent (the word disappears). Remotion renders on Chromium so it is fine, but watch out in the preview environment
- The `pathLength=1` normalization used for SVG trim is not fully supported on `<circle>` in some older browsers,
  and the degraded behavior is the circle drawing fully at once (losing the sense of growth). When porting, verify one frame on the target
  renderer first
- The exit trim is "entrance trim minus exit seg" directly subtracted: if the two windows are too close
  (segment length <40f), it starts retracting before it has finished growing, and the circle draws only a short stretch
- The sheen layer and the fill layer are two stacked DOM elements: switching is a cross-fade of opacity, and if the `white` window
  and the `sh` window overlap too little, there are 1–2 frames where both layers are half transparent (the text goes gray)
- The third word's promotion can be given only once: putting sheen on all three words removes the sense of conclusion
  (in the spirit of P4 technique de-duplication); sound-wise the three entrances are three beat points, and the settle-to-white of the third word deserves
  an accent of its own; for the mixing discipline see sound-design.md

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`word-relay-geometry/WordRelayGeometry.tsx`](../../../src/demo/typography/word-relay-geometry/WordRelayGeometry.tsx)

