---
name: spotlight-sweep-moves
summary: Three dark-stage spotlight reveals: A wake-and-sleep sweep (lit where the light arrives, dark once it leaves), B edge-hugging glow pan (purple light clings to the UI edge and seeps in, with a spotlight moving right at constant speed), C corner constant-speed reveal (a radial spotlight expands from a corner at constant speed to light the whole screen). UI showcases where "light is the narrative" on a black stage.
use: Introducing UI panels / feature areas one by one in a dark-toned brand film; "lighting up" the interface in a black opening; light transitions between sections
length: 3.5–4.5s per variant; A/B can be chained into a tour section
energy: medium-low (restrained, mysterious, the burst is the instant of "lighting up")
tags: ui-entrance, transition
---

## Intent
On a black stage the viewer can only see what the light shows them. The spotlight is lighting, camera movement and editing all at once:
whatever the light reaches comes on stage, and it takes its bow when the light moves on. All three variants share one identity element, the "edge-hugging purple glow line"
(the light line runs along the UI border / logo / top edge, and the glow must be bright and soft, so the light is
"stroking" the interface rather than being a stroke animation). The key is **constant speed**: the spotlight's movement/expansion
is strictly linear. Easing gives the light an "intent", while constant speed reads as the mechanical sweep of a searchlight
(precedent for variant C: linear but with too large a final radius = saturated in the first 1/4, and it still does not feel constant speed).

## Motion core
**A wake-and-sleep sweep** (glow-wake-sleep-panel): a radial reveal mask follows the light head moving from left
to right at constant speed, and everything outside its range is black. The purple light line along the top edge has three layers of glow (blur26 wide haze +
blur9 mid layer + bright core + an offset pink layer) and travels in sync with the sweep. Passing the logo it traces light with boxShadow,
and at the right edge it lights a vertical residual glow. In the last stretch the light leaves and the panel sinks back into darkness: there is a wake and a sleep.
**B edge-hugging glow pan** (slide-spotlight-pan): the light line is anchored to the panel edge (first around the
left-top corner's vertical edge, then after the corner along the top edge), with the purple halo bleeding into the inside of the UI top (light
seeping into the interface from the edge). The spotlight head moves right at constant speed to reveal while the panel slides left at constant speed
= the feel of the camera panning right.
**C corner constant-speed reveal** (corner-spotlight-reveal): the radius of the radial spotlight at top left
expands strictly linearly; what it lights is revealed and what it misses sinks to black, ending fully lit (light as transition).

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Spotlight move/expand | linear throughout, zero easing | **Constant speed is the key**: zero easing the whole way; adding ease reads as the light having subjective intent |
| C final radius | Covers exactly the full screen at the end of the clip (1300@1080p/100f) | A final value that is too large = saturating early, a fake constant speed: sampled brightness must climb smoothly the whole way (measured 8/46/101/…/238) |
| Edge-hugging line glow | 3–4 layers (blur26+blur9+bright core+pink offset) | Too few layers reads as a thin outline; the glow must be bright and soft enough to be "light" |
| Line anchoring | Strictly along the UI edge / top edge / logo | A line floating off the edge = loses the "stroking the interface" meaning (A's rework precedent: positioning was lost and the purple light ran to the bottom edge) |
| Reveal mask | radial gradient with a hard but slightly soft edge (feather ~15%) | Too hard an edge looks like a circular mask; too soft loses the boundary between "lit/unlit" |

## Known traps
- The demo was tuned on grayscale/placeholder footage. The parameters are a tuning starting point, not a final production setting.
  On first real use, re-verify against real footage.
- Division of labor with light-play-moves: that card is a gloss performance on an element/text
  (sheen / glow breathing); in this card the light is **camera movement and editing** (reveal / bow / transition),
  and the light decides what the viewer sees.
- Precedent from redoing all three: the spotlight sweep must carry the edge-hugging line along (v1 had only the reveal mask and was sent back
  with "tweak and look again". A bare spotlight has no identity, and the edge-hugging purple light is the signature of this technique).
- In the original clip (clickup-30) the light line has an instant of rainbow dispersion at the corner, which the demo does not do. In production you can
  add a 1–2f dispersion layer on the corner frame to improve the texture.

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`spotlight-sweep-moves/CornerSpotlightReveal.tsx`](../../../src/demo/effects/spotlight-sweep-moves/CornerSpotlightReveal.tsx)
- [`spotlight-sweep-moves/GlowWakeSleepPanel.tsx`](../../../src/demo/effects/spotlight-sweep-moves/GlowWakeSleepPanel.tsx)
- [`spotlight-sweep-moves/SlideSpotlightPan.tsx`](../../../src/demo/effects/spotlight-sweep-moves/SlideSpotlightPan.tsx)

