---
name: glass-pill-dictation-typing
summary: A fixed-width glass capsule pops out at about 1.25× scale and settles slowly into place. Inside, a layer of accent-color warm light is spread, faint on the left and dense on the right. The cursor leads, then the dictated sentence is typed at a steady pace. The light (together with the ambient light behind the capsule) fades as typing progresses, ending as a neutral frosted-glass bar.
use: Entrance of a voice/AI input box; interaction-hint shots for "talk to it"; a quiet transition beat between high-energy segments
length: about 3.3s (100f@30fps)
energy: low (the quietest beat of the whole piece; only the light is receding)
---

## Intent
Use "the light goes out as input comes in" to tell one very small thing: on standby it glows (waiting for you to speak), and the moment you start speaking
it hands the light over to the text. In 3.3s it does only three things: pop out, type, light recedes. Any extra motion
(bounce, color change, icon animation) stops this beat from being a rest.

## Motion core
- Capsule 1240×132, radius 66, `padding: 0 20px 0 58px`, **fixed width** (does not stretch with typing);
  dictation text 56px, a 92px round waveform button at the right end
- Entrance `scale 1.25→1`, snappy (strong ease-out) 20f; opacity is full within the first 2f: "it's there" first, then it settles into place;
  before landing, 14f of 6px→0 depth-of-field blur (the enlarged stage reads as "closer to the lens")
- Material: `backdrop-filter: blur(26px) saturate(1.3)` real frosted glass (the warm light spot behind it is diffused by it),
  a white volume gradient bright on top and dark at the bottom + 1.5px white stroke + a top-edge highlight line fading out at both ends + a dark inner bottom edge + two layers of warm landing shadow
- Embedded accent-color light: `linear-gradient(90deg, α0 → α.18 @38% → α.62 @78% → apricot α.95 @100%)`, faint left and dense right,
  plus a screen-blend highlight blob at the lower right. The light is **inside** the capsule
- Typing: the cursor leads at f2, characters start at f8 at a steady 2f/char to finish 28 characters; the cursor is removed over f66–74
- Light fade `g = 1 − smooth(f10→f72)`, the same window as typing; `g` drives four things at once: the gradient inside the capsule, the warm "sun" behind the capsule,
  the ground reflection below the capsule, and the waveform button (solid warm → outlined neutral); outer glow `60g px`
- The 5 waveform bars have base heights `[30,16,24,13,20]` (high on the left, low on the right), with a very light breath `±2.4·sin(f·0.5 + i·1.7)` on top

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| capsule fixed width | 1240px (≈1.8× the whole sentence width) | **Fixed width is the key**: stretching with the text reads as a chip, not an input bar |
| entrance scale | scale 1.25→1, snappy 20f | 1.25× is the amount for "dropping back from in front of the viewer"; 1.5× becomes a pop-up window |
| opacity timing | full within the first 2f (earlier than the scale settling) | Fading in in sync makes it look like it "gradually appears" and loses that slight sense of reality |
| embedded light | 90deg, 0 → .18@38% → .62@78% → .95@100% | The light must be inside the capsule; making it an outer glow turns it into "waiting for a notification" instead of "waiting for input" |
| typing | 28 characters, from f8 at a steady 2f/char | Adding an ease reads as "someone hesitating"; dictation is steady |
| light fade | 1 → 0, f10→f72 smooth | Sharing the window with typing is the only causality in the piece: the light yields to the text |
| ambient light follow | warm light behind 0.15+0.6g, ground reflection 0.22g | If only the capsule dims and the environment stays, the "light receding" will not read in a bright scene |
| waveform bars | 5 bars, ±2.4px | An amplitude of 6px becomes the active "recording now" state, which contradicts "standby" |
| cursor | leads at f2, removed f66–74 | The cursor appearing before the text is the signal that "the input box is ready" |

## Known traps
- backdrop-filter only blurs the layer **behind** it: the warm light spot must sit below the capsule (drawn first in the same stacking context),
  and when the light spot is too far from the capsule the frosting just looks like a flat white board
- In a bright scene the light/dark contrast of light is much smaller than in a dark scene: give the embedded light apricot .95 saturation and let the ambient light behind recede too, otherwise "light receding" doesn't hold;
  for a dark version, switch the stage back to near-black and desaturate the light color; the curves stay as they are
- The waveform bars breathe continuously (not controlled by g), so first and last frame heights differ. When using it as loop material, set the frequency to an integer multiple of 2π/duration
- Typing progress is `floor(p·len + 1e-6)`. That epsilon prevents the last character from failing to appear on a whole-number point due to floating-point error; do not delete it
- The WARM / APRICOT variables are the brand colors shared by the embedded light, outer glow, ambient light and button; to change project, change only these two
- If the sentence length changes, update the capsule fixed width (keep ≈ 1.8–2× the sentence width) and the typing window accordingly

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`glass-pill-dictation-typing/GlassPillDictationTyping.tsx`](../../../src/demo/interaction/glass-pill-dictation-typing/GlassPillDictationTyping.tsx)

