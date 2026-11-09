---
name: tear-streak-transitions
summary: Tear transition. glitch-displace: noise tearing (16 horizontal strips jitter out of register and a hard cut happens in the middle), a strip-level tear with digital glitch semantics.
use: High-energy page change: digital glitch / break semantics; a strip-level tear that pushes energy to the maximum without breaking the page's integrity
length: set-up before ≥40f + tear 16–24f + ending ≥40f, about 4.5s (135f)
energy: high
tags: effects
---

## Intent
This card handles the **strip-level tear**: the page is cut into horizontal strips that move at high speed, but each strip's content stays whole. This is a taste dividing line drawn by repeated rulings: the chunk-type transition trio was rejected (doom-melt vertical strips falling, pixel-dissolve squares flipping to black, facade-block bricks flying all eliminated), and strip types pass. Chunks read as "the page being destroyed" and strips read as "the page moving at high speed": the integrity is intact, but the energy is at maximum. The tear is horizontal: strips jitter left and right out of register, with a two-color silhouette ghost (a restrained version of RGB split: two monochrome silhouettes of the same page's content, using only the frame's two accent colors, offset ±12px). It suits system glitch / instant jump semantics. The demo uses it for the state jump of a "release console going from Rolling out 99% to is live".

## Style choice
| Style | How | Use |
|----|------|------|
| A glitch-displace | 16 horizontal strips of unequal height (outer layer crops + inner layer is the whole page with translateY in register). Each strip's translateX is driven by the library's h(i*31+f*7) jitter of ±70px, with a two-color silhouette ghost + a scan highlight line on top. At 54f, in full-amplitude jitter, hard cut to page B, then 6f more jitter until it returns to place at 60f | Glitch / break semantics; state jumps (going live, switching versions); a violent page change before a climax |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Jitter amplitude | ±70px, energy split by strip (about two tenths stay still / three tenths at full amplitude / the rest tremble lightly), displacement pushed toward both extremes by an exponent of 0.6. A full page is laid underneath to prevent gaps showing the bottom | On peak frames the strip offset must be obvious to the naked eye: a ±12px level can't be read as a tear. All strips jittering at the same amplitude looks like water ripples |
| Envelope | 44–47f out-cubic burst → plateau → 54–60f linear dissipation | Impact ruling: spread out-cubic, dissipate linear |
| Ghost | ±12px two-color silhouette (an accent-color monochrome copy of the page content, screen blend, offset along with the strip, only given to strips with large offsets) | Without the ghost it is just shaking, not a glitch. The silhouette draws only the content, not the background, so it doesn't gray out on a dark field |
| Cut edge / scanline | On strips offset >25px: 1.5px bright line on the top edge, 3px dark gradient on the bottom edge. Each frame 2 full-width scan bright lines of random height | Drawing bright edges on every strip reads as lined paper. Give them only to the heavily torn strips |
| Cut-point cover | 54f exposure 1.28 / 55f 1.12 + a 1.6% whole-screen impact zoom that returns over 6f; at 30–31f two thin strips ±12px as a precursor | The precursor is anticipation: the viewer first "feels something is wrong", then the tear comes |
| Mask removal | From 60f the strips, ghost, scanlines and filter are all conditionally unmounted and bare B is output directly | opacity 0 doesn't count as removal. A leftover filter ruins the true stillness |
| Ending | 75f (aftermath 40f: regional grid teal wave, counter, metrics rise + hold 35f) | R1. The aftermath lives only on the page content layer, with no more tear elements |

## Known traps
- The demo was tuned on a procedurally drawn dark-field console page (midnight look). The parameters are a tuning starting point, not a field-proven final. The first real use must be re-checked with real material. On a bright-background page, change the silhouette ghost to multiply so it can be seen.
- **Strips, not chunks**: all later techniques of this kind are to be done as strips. Each horizontal strip stays whole and never breaks into squares / bricks / independent falling objects (the trio rejection ruling, see Intent).
- This is a high-energy transition. When it shares a film with the whip-pan/crash family, watch the energy budget: high-energy transitions crowded together dilute each other.
- The hard cut hides inside full-amplitude jitter (cut at 54f, back in place at 60f). If the cut point is exposed on a still frame, it loses the cover of the glitch.
- The strip page must carry its own opaque background (gradient + dot grid), with the vignette and grain drawn only once on the top layer. Transparent strips would ghost against the full page underneath, and a vignette that is offset along with the strips gives itself away.

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`tear-streak-transitions/GlitchDisplace.tsx`](../../../src/demo/transition/tear-streak-transitions/GlitchDisplace.tsx)

