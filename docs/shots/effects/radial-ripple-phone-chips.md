---
name: radial-ripple-phone-chips
summary: On a warm sand base, four concentric circles breathe out of phase like water ripples. The feed inside the central phone mockup scrolls slowly by itself, and white chips on both sides pop in with a spring one after the other and then float.
use: The "this is it" held shot for a mobile product; an intro section with feature points split on both sides; the full product view at the start or end of a film
length: about 5.6s (168f@30fps)
energy: low (quiet and breathing, the continuous swell of the concentric circles keeps it from going cold)
---

## Intent
Put the phone in the middle of the frame with the least motion and make it "alive": the concentric circles give the atmosphere its breath,
the auto-scrolling screen proves "there is content running inside", and the chips on both sides name the features.
Each of the three layers of motion is extremely slow, and only stacked together do they avoid looking static. This is the standard recipe for a product held shot.

## Motion core
- Demo frame (look = sand, the phone shows a shorts-kit shot library feed): laid out at native 1080p size (not scaled up through DesignStage),
  phone 430×900 taking 83% of frame height. The lens-engraved mark + shorts-kit wordmark at bottom left rise after the two chips settle, and the ending is a product poster.
- 4 concentric circles (2240/1760/1280/840px, #dccbb4→#f2eadf from dark to light, the outer two bleed off-screen to fill it) each
  `scale 1 ± 0.06`, running 1.5 sine cycles over the whole film, with a 1.7 rad phase difference between neighboring layers.
  The phase offset is the key to "water ripple" rather than "whole scaling". Each layer has a lit top edge + white hairline outer edge, and a patch of warm white soft light in the center holds the phone.
- Phone: warm titanium metal bezel 12px + black edge 9px, 70px corner radius, dynamic island / side buttons / glass diagonal reflection, two layers of ground shadow;
  0–26f snappy rise from 90px below, with the shadow tightening as it settles.
- The feed on the screen is designed for the shot: big title + featured large card + 8 episode cards (geometric illustration cover / title / length · show / listening progress),
  a mini player bar always at the bottom (progress advances at constant speed, waveform jitters lightly and deterministically), and a layer of screen-base-color fade under the status bar and above the player bar.
- feed `translateY 0→−560px`, window `t 0.08→0.98`, **constant speed with no easing**
- chip pop: `springAt(t0, damping 13, stiffness 190)` drives scale 0.8→1 (one visible overshoot),
  while snappy moving out 28px from the side of the phone and opacity jumping to full in 5f; left chip starts at 37f, right chip at 67f
- After the pop comes a `sin` float of ±8px (2 cycles over the whole film), blended in gradually with a 24f smooth starting 18f after the pop.
  It does not start drifting the moment it lands.

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Concentric circle count / size | 4 layers 2240/1760/1280/840px (1080p) | 3 layers cannot fill the frame; the outermost must bleed off-screen, otherwise it reads as a round color swatch |
| Breathing amplitude | scale 1±0.06, 1.5 cycles over the whole film | 0.06 is already the upper limit; at 0.1 it reads as a "pulse animation" rather than water ripples |
| Phase difference | 1.7 rad between neighboring layers | Identical phase = the whole block scales up and down; 1.7 gives the illusion of a wave spreading from the center |
| Phone shadow | close contact shadow 0 4px 10px + far shadow 0 40px 80px -20px + ambient shadow 0 90px 140px -40px (sand.shadow with a hue) | The shadow is the only basis for the phone "floating on the waves"; remove it and the phone goes flat |
| Auto-scroll | translateY 0→−560px, t 0.08→0.98 constant speed | Adding ease immediately reads as "someone is swiping"; constant speed is what looks like autoplay |
| chip pop | spring damping 13 / stiffness 190, scale 0.8→1, move out 28px | The overshoot is all of the "pop" texture; damping >20 flattens it |
| chip timing | left 37f / right 67f (1s apart) | Appearing together reads as two labels; staggered gives the rhythm of "saying them one by one" |
| chip float | ±8px, 2 cycles, fades in over 24f starting 18f after the pop | Amplitude above ~12px fights the concentric circles' breathing |
| chip font size | 36px / weight 600 + 60px accent-color icon circle | At 1080p the chip is text to be read; do not go back to the 12–20px sticker size |

## Known traps
- Chips are positioned against the outer edge of the phone with `right: 1920 − PX + CHIP_GAP` / `left: PX + PW + CHIP_GAP`.
  After changing the phone width PW the chips on both sides follow automatically, but check that a chip with long copy still has its outer edge inside the 96px safe margin.
- The feed on the screen is placeholder content with fake entries. When you swap in real screenshots, the total height must be
  greater than "560px + screen height", otherwise it scrolls to the end and shows white.
- The phone screen is only ~390px wide: keep episode card titles to ~18 characters and meta info `nowrap + ellipsis`, otherwise wrapping makes the card taller.
- The concentric circles are stacked solid fills (not outlined rings). Layers must be appended from large to small,
  and if the order is reversed only the largest layer is visible.
- ACCENT (default sand's terracotta #c4552d) applies to the covers / progress bar / play button on the screen and the chip icons.
  To switch to the project's brand color, change this one variable to re-skin.

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`radial-ripple-phone-chips/RadialRipplePhoneChips.tsx`](../../../src/demo/effects/radial-ripple-phone-chips/RadialRipplePhoneChips.tsx)

