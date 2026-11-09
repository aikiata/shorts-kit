---
name: beat-step-list-theme-cycle
summary: A three-channel metronome. On a dark field an adjective list moves up one row per beat, a capsule fixed at the viewport center "catches" the next word and changes color, and the whole field's background changes color on the same beat. The row, color and field channels are locked to the same beat point.
use: "One product, many moods / multi-theme showcase" segments (modern/playful/expressive style adjective bursts); the densest-rhythm segment of the piece; beat-matched music segments
length: setup 30f + 18f per beat × number of beats + closing hold; 4 beats about 4.7s (demo 140f)
energy: high (one beat every 0.6s with three channels jumping together; a density-type high energy)
tags: typography
---

## Intent
Changing a theme color once is a feature demo. Changing it every 0.6 seconds, three times in a row, with "selected row + capsule color
+ whole-field background" all jumping on the same frame each time, makes it a metronome. The cheapest variable switch produces
the highest rhythm density of the whole piece. There are two cruxes: one is that **the three channels must lock to the same beat point**. If any
channel is half a beat late, "jumping together" degrades into three animations each doing their own thing. The other is **the boundary between jump and slide**:
the jump takes only the first 6f of the beat and the remaining 12f are completely still. A beat point should "jump", not "slide",
and a list scrolling at constant speed is just a list.

## Motion core
- The capsule is fixed in the center row of the viewport and **does not move**; the list translateY steps beat by beat. Visually
  it reads as "the capsule jumps to the next row to catch the new word", but what actually moves is the world, not the capsule
- Beat length 18f (0.6s @30fps ≈ 100BPM), the jump window is only the first 6f of the beat:
  `snap(t) = 1-(1-x)^3.2` (steep ease-out), the remaining frames are still
- The three channels are driven from one source: the same tInBeat feeds the list displacement, the capsule/background
  rgb per-channel cross-mix, and the capsule squash. One clock, and no curve hung separately
- The theme table swaps pairs beat by beat (demo "Make it modern → playful → expressive → BOLD → yours.":
  bone white / deep espresso → orange / deep plum → iris purple / deep indigo → mint / deep teal → sunflower yellow / deep navy), and the capsule color and
  background are matched light/dark pairs, not independent random colors; each theme also carries a font for the selected word (sans / rounded /
  serif italic / all-caps Futura), changed on the same beat, so the reskin reads as "many moods" and not just a color swap
- Capsule = lens: outside the capsule is a uniform dim white list, inside the capsule is a cropped copy of the same list (dark text + theme font),
  and a word changes color and font only at the moment it crosses the capsule edge; capsule width = the measured text width of the selected word + padding, interpolated with the same tInBeat
- Capsule landing squash: vertical 1.14→0.96→1, horizontal in opposite phase 0.97→1.01→1, finished within the first 6f of the beat; at the catch moment
  the capsule brightens + the same-color glow swells once (exponential, returning in ~3f)
- Unselected words decay by row distance from the viewport center (adjacent rows 42% white, each farther row −15%, font size shrinking slightly, far rows blurred);
  the top and bottom background gradients feather the viewport edge, and the feather color must sync with bgColor in real time; a hard-coded color gives itself away when the field changes
- Element-layer echo (optional): the corner theme counter 03/05 and the swatch row change state on the same integer beat, with no whole-frame impact added
- 30f of stillness setup before the first beat: let the viewer see clearly that "this is a list" first, then start hitting the beat

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| beat length | 18f (BEAT_LEN, change it to change the BPM to match the track) | <12f and the viewer has no time to read the word and only sees color flashes; >26f and the beat feel scatters into showing items one by one |
| jump window | first 6f of the beat, ease-out exponent 3.2 | A window >10f or a gentle curve turns "jump" into "slide", and the metronome collapses into a scrolling list |
| number of beats | 3–4 beats | At 5+ beats the viewer adapts to the rhythm and drifts; at 1–2 beats the "metronome" persona doesn't stand up |
| squash | vertical 1.14→0.96→1 / horizontal opposite phase 0.97→1.01→1 | Without it the capsule looks like a texture changing color; >1.2 bounces and steals the color change's scene |
| background span | Adjacent theme backgrounds must have the same lightness and different hues (all dark) | A lightness jump (dark → light) reads as a screen flash rather than a reskin |
| setup / ending | first 30f still; hold ≥30f after the last beat | Without setup the first beat reads as a bug; cutting right after the last beat gives no confirmation of "stopping on the final color" |

## Known traps
- The demo was tuned on grayscale/placeholder material. The parameters are a tuning starting point, not a final production setting.
  The first production use must be re-verified on real material
- Division of labor with theme-switch-moves: that card is the ritual of a single reskin (sweep/ripple, one change
  tells one story); this card uses continuous multiple reskins as a beat. Use that card to tell the "dark mode feature",
  and this card to tell "many moods / multi-theme scale"
- **Strongly depends on sound**: beat points align to the drum hits (change BEAT_LEN to match BPM), and in the silent version the three channels
  jumping together read as the interface glitching
- Word list length ≥ number of beats + 2: leave unselected words at the bottom of the list as padding, otherwise stopping on the last row of the list on the last beat
  shows "nothing below"
- For the selected state, do not "decide the inversion by integer beat": during the 6f jump the new word is still below the capsule and turns black first, which reads as a giveaway.
  The demo uses a capsule lens (cropped copy), where the text color / font is decided by the geometric boundary, and the color still follows the fractional tInBeat
- The capsule width is hard-coded from the measured text width of the selected word (re-measure when changing the font / font size), otherwise the text touches the edge or the capsule is half empty
- Theme fonts use system stacks: Chrome does not recognize `ui-rounded`, so the rounded face uses Arial Rounded MT Bold, falling back to sans-serif when the font is missing

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`beat-step-list-theme-cycle/BeatStepListThemeCycle.tsx`](../../../src/demo/rhythm/beat-step-list-theme-cycle/BeatStepListThemeCycle.tsx)

