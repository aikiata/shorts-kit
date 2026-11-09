---
name: research-card-stack-scroll
summary: A dark paper card flies in every 12 frames along a lower-right axis and presses onto the stack in the center, landing with a 1-frame squash. Only the top card renders fully sharp with title + authors + abstract. The cards below get progressively blurrier and darker by stack depth and show only a title bar, and the horizontal background grid moves down in sync as a speed reference
use: Conveying the scale of "read a huge amount of material / processed a huge number of documents"; capability shots for research, retrieval and batch-processing products
length: about 4.8s (144f@30fps)
energy: medium-high (constant high frequency, no burst but sustained pressure)
---

## Intent
What it wants to say is "quantity", but giving 13 cards at once reads as a wall. Turn it into an assembly line: cards come in one at a time, and each one is
read (the top card is always the one rendered in full), and once read it sinks into the stack and blurs. The viewer feels a continuous
throughput, not a static pile. The background grid moving down at the same speed is the speed reference: without it, the pile reads as
"cards shrinking in place".

## Motion core
- The timeline uses real frame numbers rather than a normalized t: internally `F=144`, each card's local time is `e = t*144 - i*12`,
  and all choreography (entrance, stacking, depth) is hard-coded in the beat unit `PER=12` frames
- The entrance is a 6-frame brisk action: `seg(clamp((e+6)/6), 0, 1, E.outCubic)`. Note that the start is `e=-6`,
  that is, the card starts flying 6 frames before its own beat arrives, `translateY(-40→0)` + `scale(0.94→1)`
- Landing squash: for `e ∈ [0, 1.6)` the y-axis scale is additionally multiplied by 0.97, pressing for only 1.6 frames. It is so short it does not read as
  deformation, only as "slammed solid"
- Stack drift: after landing `drift = e/12*30`, 30px down and `XOFF=9`px right per beat, forming a slight
  axis toward the lower right. The axis makes the 13 cards a pile with thickness and not a concentric stack
- Depth falloff: `depth = min(1, drift/(30*3))`, decaying to the end within three beats, `blur(depth*4)` +
  `brightness(1-depth*0.25)`; further down `(drift-30*3.2)/(30*1.6)` pulls opacity to 0 for recycling
- A single focus: `focus = floor(f/12)`, and only the card with `i === focus` shows its body (author line + 4 abstract
  skeleton bars). The body of all other cards is set to `opacity:0` leaving only the title, so "the one being read" is always exactly one
- Background grid: `translateY((f/12*30*S) % 24)`, with the offset derived from the same `GAP=30` as the card drift,
  so the grid and the card pile move at exactly the same speed; the modulo by 24px makes it loop seamlessly

## Parameters
| Parameter | Typical value | Feel when tuning |
|------|--------|----------|
| Beat | PER=12 frames/card, 13 cards | 12f is the lower limit of "tight but still legible"; under 8f the title cannot be read, and over 20f the sense of scale collapses into card-by-card display |
| Entrance travel | 6 frames (outCubic), lead -6 frames | Travel is only half the beat → each card has settled before the next arrives; with travel ≥ PER two cards fly at once |
| Entrance offset / scale | `translateY(-40→0)`, `scale 0.94→1` | 40px against a 96px card height is small: the card "drops in" and does not "fly in"; the scale difference is only 0.06, and more reads as a pop-up |
| Landing squash | 1.6 frames, y-axis ×0.97 | 3% is just barely perceivable; over 6% or longer than 3f you can see rubbery deformation |
| Stack axis | per beat y+30px, x+9px | The ratio 9/30 sets the slope of the axis; with x at zero it becomes a concentric stack straight down and the sense of thickness is lost |
| Depth falloff | `depth = drift/90`, blur 0→4px, brightness 1→0.75 | Decays fully within 90px (3 beats) → there are always only about 3 "half-sharp" cards in the picture; a longer decay distance makes the blurred pile below too thick and the picture dirty |
| Recycle window | fades out from `drift > 96px`, reaches 0 within 48px | Recycling too early shows cards vanishing mid-screen; too late and all 13 are on stage, raising DOM and blur cost |
| Content coordinate system | logical 420×250, whole thing `scale(min(W/420, H/250))` | All pixel values are written in logical coordinates, so changing the canvas size needs no re-layout; the card 296×96 and font size 9.5px are logical values |

## Known traps
- Card count and beat are bound: `13 cards × 12 frames = 156 frames > F=144`, so the last two cards are still entering at t=1,
  and the last frame is not a clean still. For a freeze-frame ending, keep the card count within `F/PER - 1` (≤11 cards at a 12-frame beat)
- `focus = floor(f/12)` can exceed the upper bound of the card count (at f=144 focus=12, exactly the last card). After adding cards
  or changing the beat, confirm that focus does not point at a nonexistent index for long, or "not a single card is sharp" appears
- All time constants are hard-coded on the assumption of 144 frames (`F=144`, `fr=f/F`). When changing the duration you must change F too,
  or the beat stretches with the duration and the tight 12-frame feel is lost
- The titles are 13 realistic-looking paper title placeholders, and the `preprint:24xx` number is generated from the index; production must swap in the project's
  real document titles. The abstract skeleton bar widths generated by `rand(i*5+k)` are deterministic pseudo-random; do not swap in Math.random
- Dark cards (`INK` base + `#2A2A2A` outline) pressed on a `#FAFAFA` light base are the premise of this contrast; once the card color
  goes light, the `brightness(0.75)` depth falloff is barely visible and you need to switch to an opacity or grayscale falloff

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`research-card-stack-scroll/ResearchCardStackScroll.tsx`](../../../src/demo/ui-entrance/research-card-stack-scroll/ResearchCardStackScroll.tsx)

