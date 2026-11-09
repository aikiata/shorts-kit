---
name: value-stagger-gradient
summary: 16 bars enter. The delay is a time stagger, while four properties (height / hue / offset / blur) each spread a numeric gradient from first to last. In the second beat the stagger origin switches to the center, and the pulse amplitude re-spreads with the center as the largest
use: Showcase shots for technique demos and parametric capability; also usable directly as the entrance of data / spectrum / equalizer interfaces
length: about 5.0s (150f@30fps)
energy: medium-high (the first beat is a continuous spread, the center pulse of the second beat is a clear single peak)
---

## Intent
Stagger is usually used only to offset time. What this card wants to say is that it can also offset **values**: the same index decides both
"when it moves" and "how much it moves". The two beats are a controlled experiment: in the first beat the origin is at the first bar (the gradient spreads monotonically from left to
right), and in the second beat the origin moves to the center (the gradient spreads symmetrically about the center axis). The viewer sees not two animations
but one recipe with one parameter changed. The code caption on screen switches in sync to the matching stagger call and says so outright.

## Motion core
- The core tool is an 8-line `staggerVal(i, n, a, b, ease)`: normalize the index to `k = i/(n-1)`
  and then `lerp(k, a, b)`. It is equivalent to the value mode of anime.js `stagger([a, b])`, and an optional ease makes the gradient nonlinear
- Static gradients (written in setup, computed once): hue `staggerVal(i,N,200,320)`,
  max height `staggerVal(i,N,92,32)`. The 16 bars are by nature a slope from blue to purple and from tall to short
- Dynamic gradients (used every frame): offset `staggerVal(i,N,46,14)`, blur `staggerVal(i,N,8,2)`.
  The first bar travels 46px and blurs 8px, while the last travels only 14px and blurs 2px. **In the same entrance every bar's travel is different**
- First-beat time stagger: `d = i*0.02`, `e = seg(t, 0.06+d, 0.28+d, E.outCubic)`. From the first bar,
  the 16 are spread over a 0.3 window; `opacity = e`, `filter = blur((1-e)*b0)`,
  `translateY((1-e)*y0)` + height `hMax*e` (anchored at the bottom and grown by height, so corner radii are not squashed by scaleY), all three driven by the same e
- Second beat switches the origin: `distC = |i - 7.5| / 7.5` is the normalized distance to the center,
  `w = seg(t, 0.56 + distC*0.13, +0.18)`. The center bar moves first and the wave spreads to both ends; this is `from:'center'`
- The second beat's amplitude is also a gradient: `amp = lerp(1-distC, 0.06, 0.42)`, a 42% pulse for the center bar and only 6% at the ends;
  `pulse = sin(w*π)` is a pure pulse, added to both height `hMax*e*(1+pulse*amp)` and
  `brightness(1+pulse*0.55)`
- The code caption is a syntax-colored code strip. At t≈0.52 it swaps lines with an up/down cross in about 5f (the old line moves up and fades out, the new line enters from below), from `scale: stagger([1, 0.35])  hue: stagger([200, 320])`
  to `pulse: stagger([.06, .42], { from: 'center' })`, landing exactly between the two beats

## Parameters
| Parameter | Typical value | Feel when tuning |
|------|--------|----------|
| Bar count | N=16 (`left: 8+i*5.4%`, width 3.4%) | 16 bars give the gradient enough steps. With <8 bars the gradient reads as "every bar is different" and not as one slope; with >24 the bar spacing must be recomputed |
| Time stagger | `d = i*0.02` (about 3f per bar, 0.3 in total) | 3f is a flowing spread; over 0.05 it becomes roll call bar by bar and the "wholeness" of the gradient is lost |
| Single-bar travel | window 0.22 (about 33f, outCubic) | Travel is 0.73 times the total stagger → most of the time a dozen bars are moving at once; when travel < the total stagger it becomes one after another |
| Height gradient | `stagger([92, 32])`px | A 2.9 times difference between first and last is a clear slope; under 1.5 the gradient is unreadable, and over 4 the end bars are too short to see |
| Hue gradient | `stagger([200, 320])` | A 120° span (blue → purple); with a span <40° the hue is given away for nothing, and over 200° it wraps back to red and the slope reads as a ring |
| Offset / blur gradient | `stagger([46,14])`px / `stagger([8,2])`px | These two are the main evidence of "value stagger" on this card: change them to constants and the motion degrades at once into an ordinary stagger entrance |
| Second-beat origin | `from:'center'`, `distC*0.13` | 0.13 is the propagation delay from center to end (about 4f); at zero the whole row pulses at once and the `from` parameter is meaningless |
| Pulse amplitude gradient | `lerp(1-distC, 0.06, 0.42)` | Center 42% / ends 6% is a 7 times difference and the waveform is clear; giving the ends a large amplitude too reads as the whole row swelling together, and the center origin cannot be seen |
| Brightness pulse | `brightness(1 + pulse*0.55)` | A 55% lift makes the pulse readable on a dark base. This term has no gradient (same amplitude for all bars), on purpose: with too many gradients stacked the viewer cannot tell which is the lead |

## Known traps
- The first and second beats meet end to start: the last bar finishes its entrance at `0.28+15*0.02 = 0.58`, while the center bar's pulse starts at 0.56.
  Adding bars or enlarging the time stagger lets the entrance eat into the pulse section, and the two beats blur into one thing. When you add bars, push 0.56 later
- The end bars' second-beat window is `0.69→0.87`, after which there is a stretch of about 0.13 (20f) of complete stillness up to t=1. This is the time to let
  the viewer see the "end-state gradient", not blank space
- The denominator `C=(N-1)/2` of `distC` divides by zero when N=1; `staggerVal` is covered with `n<=1 ? 0`,
  but `distC` is not: changing the bar count to 1 gives NaN
- The bar position `left: 8+i*5.4%` and width `3.4%` are hand-fitted for N=16 (the right edge of the last bar is 8+15*5.4+3.4 = 92.4%).
  When changing the bar count, recompute these two percentages, or the bars overflow or crowd into the left half
- The caption is an anime.js API call string, essentially a **technique explanation** and not content. In a real finished film
  either swap it for a meaningful title or remove it, otherwise the viewer reads code
- The 16 small dots at the bottom (`bottom:17%`, opacity .35) are static decoration and take part in no animation. Their
  `left` offset `+1.2%` is a hand-matched centering amount for the bar width 3.4%; change the bar width and it must change together
- A dark base (`#0a0b10`) + highly saturated bars (85%/66%) + a 12px glow go together as a set. In a light theme both the glow and the
  brightness pulse stop working, and you need to express the pulse with saturate or a shadow instead

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`value-stagger-gradient/ValueStaggerGradient.tsx`](../../../src/demo/ui-entrance/value-stagger-gradient/ValueStaggerGradient.tsx)

