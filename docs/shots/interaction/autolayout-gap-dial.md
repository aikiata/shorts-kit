---
name: autolayout-gap-dial
summary: A gap dial drives the layout. A row of link blocks sits in a selection box with gap-spacing annotations. The badge number ticks step by step, the blocks are pushed apart live by the parameter, then spring back into place. A visualization of "parameter-driven layout".
use: Hero shots for design-tool and low-code products where "change one number and the UI follows" is the selling point; the category language of "packaged in design-tool semantics".
length: ~5s (150f: selection box entrance + prep pull-in 10f + loosen 34f + breath-hold hold 20f + spring return + settle hold)
energy: medium (tool-rational type; the payoff is the number and the displacement staying locked in sync)
---

## Intent
"Change the parameter and the UI changes" is the core promise of a design tool, but it is usually shot as a before/after: click the panel, cut to the result. The cause is cut out. This card shoots the cause as one continuous shot. The gap badge number ticks step by step, the link blocks are pushed apart on the **same frame**, and the measure line stretches live. The number is the rein, the layout is the horse. The selection outline, the 8 handles and the gap annotations are all the native language of design tools, so the viewer recognizes at a glance "this is a parameter being tuned in a tool". The return trip deliberately uses an underdamped spring overshoot (it shrinks tighter than the start, then settles), which turns "back in place" into an elastic ending. Division of labor with type-and-filter: that card is the search cause "type content → list narrows"; this card is the parameter cause "dial a value → geometry reflows".

## Motion core
- **One gap parameter drives everything**: block positions are recomputed from gap (the whole row stays centered), the measure line width = gap, the badge is pinned to the gap center, the big readout on top and the dial ruler all derive from the same value. Locked sync is the entire persuasive power of this card
- Parameter curve: first a prep pull-in 12→6 (10f swift, "pull back, then rush out"); outbound 6→104 over 34f swift (asymmetric in-out: slightly fast start, very soft landing); breath-hold hold 20f; return trip spring(damping 9, stiffness 80, mass 1.1) deliberately overshoots below the start and then settles (overshoot segment compressed ×0.45: 104→about 7, then back to 12, so gap is never negative)
- The readout is the lead: a 196px thin-weight tabular number on top + px unit + a 760px dial ruler (ticks roll horizontally across the center gold needle as gap changes); while dialing, the readout turns from white to measure gold (with ~6f afterglow), and fades back to white after release; the value is displayed in steps of 2, and each tick gets a scale pulse 1+0.06·|sin| × a speed gate
- Nav blocks get horizontal motion blur from their own speed (block speed = (i−2)·dgap/dt, outer blocks have the longest trails), 0 when still
- The selection outline springs in from 26px outside, the 8 handles pop in staggered 1.2f apart, and the layer name shows the live size of the whole row next to it; gap annotation = dashed extension lines ×2 + measure line with end ticks + a following badge, rising staggered
- Demo art: graphite dark field, two color semantics: selection white + measure gold (only the number being dialed has color in the frame); the camera pushes in very slowly by 2.5% over the whole shot

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| gap amplitude | 12→104px (source 20→24, the demo enlarged it per ruling) | The source amplitude is almost imperceptible to the eye. Perceptibility precedent: if you can't see it, enlarge it and make an extreme version; in real work use at least 4–5× the travel |
| prep | 12→6, 10f swift | Pull in first, then release, to charge the main action; a pull-in >30% reads as value jitter |
| outbound duration | 34f swift | Faster reads as a twitch; slower than 60f loosens the bond between number ticks and displacement |
| breath-hold hold | 20f | Lets the viewer read the "loosest" frame clearly; <12f and the peak is not read |
| return spring | damping 9 → overshoots below the start, then settles (overshoot segment ×0.45, tightest about 7px) | The overshoot is the source of the "let go and it springs back" feel; damping ≥13 drops straight in, which wastes it |
| number step | step 2 + tick scale pulse 0.06 × speed gate | Stepping by 1 is too fine and reads as a millisecond timer; the step size is the "dial click" granularity |
| motion blur | horizontal stdDeviation = min(9, \|block speed\|×0.5) | Only during the dialing segment; if always on, the block text can't be read |
| annotation geometry | extension lines 58px, measure line pinned to block bottom +74px, badge pinned to gap center | Annotations must be recomputed live with gap: any lag at any spot gives it away |
| block width | unequal (252/206/278/268/220, height 120) | Equal widths read as a schematic; unequal widths look like a real nav |

## Known traps
- The demo was tuned on grayscale/placeholder material. The parameters are a tuning starting point, not a final production setting.
  The first production use must be re-verified on real material
- Number and displacement must share one source and one frame: the badge value and the block coordinates both derive from the same gap. If they are animated separately, even 1f apart, trust in "parameter-driven" is broken
- The demo's top big readout + dial ruler share source and frame with the layout. If the production frame already has a real tool panel (an inspector value box), delete the big readout; do not report the number twice
- Same-family extensions: gap is only one dimension; radius/padding/rotation use the same grammar and can be swapped in as the parameter. But dial only one parameter per shot; two or more read as random fiddling
- The selection outline + handles borrow "design tool semantics" (the native language of Figma/Framer). Use with care in videos for non-design-tool audiences: if the selection box isn't understood, all that is left is blocks moving
- Sound: one very light tick for each badge step (dial click), one pop when the spring-back settles; tick density follows the step

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`autolayout-gap-dial/AutolayoutGapDial.tsx`](../../../src/demo/interaction/autolayout-gap-dial/AutolayoutGapDial.tsx)

