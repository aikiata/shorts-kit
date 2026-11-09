---
name: marker-underline-title
summary: After the big title settles, a marker underline is drawn quickly left to right under the keyword, with a variable-width nib, rough edges, and a slight upward slant that follows the italic lean of the text, hugging the bottom of the letters
use: Emphasizing a single keyword in a title (new/free/AI…); a handwritten, human brand tone; annotation-style emphasis in body text
length: pen starts +4~8f after the title settles, the underline takes 8–12f, total 1–1.5s
energy: low (one stroke to finish the point, not stealing the title's scene)
---

## Intent
In a print-typeface title, a single hand-drawn marker stroke suddenly appears, and the material contrast pulls one word out of the
typesetting, like a person circling the key point on a poster with a pen. Three crux points: **fast**
(8–12f in one stroke; slower reads as a loading bar), **close** (hugging the bottom of the letters; farther away
reads as a divider line, not emphasis), **follows the lean of the text** (the underline of an italic word must be low on the left, high on the right,
slightly slanting up. Drawing the slant backwards is the easiest mistake and looks fake at a glance, see the precedent in Known traps).

## Motion core
- SVG path drawing (strokeDashoffset or a clip window), left to right in 8–12f,
  ease-out with a slight settle (fast start and slightly slower finish = hand force)
- Nib shape: the path gets wider (widest in the middle) with rough edges (light noise displacement / a rough brush
  texture), thinner at the ends = pen down and pen lift
- Position: hugging the letter bottoms (bottom offset ≈ -0.1em), with the center axis slightly slanting up to follow the italic lean
- Timing: the pen starts +4~8f after the title has fully settled. The underline is "emphasis after reading the title",
  and moving together with the title steals its scene
- Texture (demo): the stroke passes through a deterministic dry-brush filter: low-frequency feTurbulence displacement (1.8px) makes the rough edges,
  and a high-frequency noise threshold stretched along the stroke direction makes fine dry-brush streaks; the ink is a warm near-black multiplied into the paper surface
- The demo exports `MARKER_UNDERLINE_TITLE_DURATION = 75`: two title lines settle staggered by 22f → f32–42 underline → still 33f

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Underline duration | 10f (measured pacing of the original; the 14f version was flagged as slow) | >14f reads as a progress bar; <6f and the stroke direction is invisible |
| Distance from letter bottoms | ≈-0.1em (pulling in from -40 to -20@1080p is what hugs the lean) | Farther reads as a divider; touching the descenders is messy again |
| Slant | low on the left, high on the right, slightly up (follows italic) | **Drawn backwards (high left, low right) looks fake at a glance**: a precedent that forced rework |
| Stroke width | middle ~0.12em, ends ~0.6x | Uniform width reads as a machine line; a difference >2x reads as calligraphy |
| Roughness | light noise on the edges | Too rough reads as a glitch; fully smooth reads as a CSS border |

## Known traps
- The demo was tuned on grayscale/placeholder material. The parameters are a tuning starting point, not a field-tested final;
  the first real use must re-check against real material
- It overlaps in territory with draw-svg-trace (deliberately kept as two cards): that one is a general
  SVG drawing (icons/illustrations/any line art); this card is specifically the marker
  texture of **text emphasis** (variable width + rough + follows the lean). For graphic drawing use that one
- Slant precedent: v1 had high left, low right, which was caught in the comparison step. The underline slant must follow the lean of the text,
  and for upright type use a slight horizontal wobble
- Remaining gap: the dry-brush grain at the nib tip in the original (notion-ai) is finer and more fragmented, and in real use a
  finer brush noise can be added

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`marker-underline-title/MarkerUnderlineTitle.tsx`](../../../src/demo/typography/marker-underline-title/MarkerUnderlineTitle.tsx)

