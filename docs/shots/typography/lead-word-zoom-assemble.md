---
name: lead-word-zoom-assemble
summary: The first word takes the center of the frame at 2.3x font size and keeps pushing in 6% during the hold. Then one curve does both "shrink back to final font size" and "slide the whole line left into place", and each later word is pushed in from 0.5em to the right of its slot. The pivot is pinned horizontally at the first word's center and vertically at the baseline (measured at mount). In the same window as the line moving up, a sub line surfaces; after one beat of stillness, the whole scene crash-zooms in and defocuses to hand off
use: An Introducing title card for a brand/product name; the second shot of a launch-event style opening; cases where a one-line claim needs "one word to fill the frame first, then the full sentence to be completed"
length: about 2.8s (84f@30fps; sentence assembly completes at f36, move-up and sub line f32–46, still 26f, final 12f crash)
energy: medium-high (starts with full-frame big text, but there is only one movement throughout, with no second impact)
tags: opening
---

## Intent
The easiest mistake in a title card is "the whole sentence fades in together". The viewer receives 5 words at once and remembers none. This card makes
the reading order a **physical order**: give only one word first, big enough to fill the frame and still pushing toward the viewer, so the viewer
is forced to read it first. Then this word returns to its own size and position in the sentence, and the whole sentence grows around it. By the time it settles,
the viewer has read the lead word twice.

The real crux of the feel is not the scale curve but the **pivot**. The first word travels from "dead center of the frame" to "the position of the third character in the line".
If the pivot is the line box center, the scaling and the left slide each pull the text to opposite sides, and the baseline wobbles visibly in the last few frames.
Pin `transform-origin` horizontally at the first word's center and vertically at the baseline; these two points do not move at all, and the whole line simply
"shrinks", with no drift.

## Motion core
- **Two scale segments added into one scale**:
  `scale = interpolate(f, [0,12], [2.3, 2.3·1.06], PUSH_EASE)
         + interpolate(f, [12,24], [0, 1-2.3·1.06], ZOOM_EASE)`.
  The first segment is the push-in during the hold (`cubic-bezier(.25,1,.5,1)`, decelerating and then parked at the peak), the second is the shrink back
  (decelerating all the way from the peak to the final font size 1). It is written as addition rather than a piecewise condition, so there is no velocity discontinuity between the two segments
- **The shrink and the left slide share ZOOM_EASE** (`cubic-bezier(.5,0,.05,1)`, heavy ease-in-out, zero rebound):
  `translate = interpolate(f, [12,36], [slideDistance, 0], ZOOM_EASE)`. The two actions must read as **one**
  movement; each on its own curve reads as two beats, "shrink first, then slide away"
- **Where the eccentric offset comes from**: `slideDistance = lineWidth · (0.5 - leadRatio)`, with `leadRatio` =
  the first word's center as a fraction of the whole line. For the first word to stop at the center of the frame, the whole line must first be shifted right by this amount
- **Measure the pivot**: at mount, `delayRender` suspends rendering and three values are measured: the whole line's `offsetWidth`,
  the first word's `offsetLeft + offsetWidth/2`, and the baseline. The baseline is read with a **zero-size inline-block ruler**
  (the `offsetTop` of `<span style={{display:'inline-block',width:0,height:0}}>` is the baseline),
  far more accurate than an estimate like `lineHeight × 0.8`. After measuring, `continueRender`, and `transform-origin`
  is written as `${leadRatio*100}% ${baseline}px`
- **Later words are pushed in, not faded in**: word i (i≥1) starts at
  `pushStart = 12 + 6 + (i-1)·4`, with `translate` going from `0.5em → 0`
  (`cubic-bezier(.22,.8,.36,1)`, fast start, long landing), and the opacity finishes fading in only 2f. The fade-in must be extremely short,
  or the word "emerges" instead of being "pushed into the slot"
- **The space between words must sit outside the inline-block**. A trailing space inside the word span gets cropped by the line box,
  and after settling all the words stick together (a bug in the upstream original component, fixed here)
- **Three-beat close of the scene layer**: f32–46 the whole line `translateY 0→−56px` (outCubic), and the sub line fades in in the **same window**
  + moves up 16px; the space vacated by moving up is filled by the sub line in the same frame, with no gap. f46–72 fully still for 26f;
  f72–83 the whole scene `scale 1→1.2` + `blur 0→9px` + `opacity 1→0.45` (ease-in-quad), pushing in and defocusing
  to hand off to the next shot
- **Texture (demo)**: the first word enters with an 8px→0 defocus within 6f; the shrink segment gets momentary defocus by scale speed (≤3.5px, back to zero when settled);
  the base is an indigo key light + a touch of warm afterglow in a low-contrast mesh + grain + vignette
- **Accent word**: exactly match one word and give it the accent color (in the demo it is the brand name `shorts-kit`). The moment the brand word is pushed in and lands carries its
  own highlight, so no second action is needed

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| First-word start multiple | initialScale 2.3 | 2.3 lets the first word overflow the frame horizontally a little (reads as "too big to fit"); <1.8 is just "somewhat larger text" and the impact is gone |
| Push-in | pushScale 1.06, fills the 12f hold | 6% is the smallest perceivable amount of "still coming toward the viewer"; >1.15 reads as a reverse bounce during the shrink |
| hold | 12f | How long the first word has the frame alone; <8f and the viewer cannot finish a long word, >20f and the rhythm of the whole sentence collapses |
| Shrink | 12f, ZOOM_EASE | Same curve as the left slide; giving the shrink its own faster curve makes the whole line "finish shrinking, then slide", breaking into two beats |
| Left slide | assembleDuration 24f | Twice as long as the shrink: the font size has settled and the position is still moving, and this "gliding tail" is the source of the cinematic feel |
| Later-word delay | wordDelay 6f (after the shrink start) | Later words are released only once the first word starts shrinking; released in the same frame they crowd together and it is unclear who is moving |
| Word stagger | wordStagger 4f | 4f reads as "pushed in one after another"; 0 sends the whole tail in together and goes back to "the whole sentence fades in" |
| Word push-in | wordDuration 12f, wordPush 0.5em | 0.5em is "just outside the slot"; >1em reads as flying in from off-screen, fighting the first word's settling direction |
| Word fade-in | wordFade 2f | Deliberately very short. >6f and the word reads as "emerging", losing the mechanical feel of the push-in |
| Size/weight/letter-spacing | 96px / 600 / −0.03em | Negative letter-spacing keeps the text from falling apart at 2.3x enlargement; big text with positive letter-spacing reads as a "slogan banner" |
| Move-up + sub line | f34–50, −56px, sub line in the same window | The two must share a window: moving up first and then bringing in the sub line adds an empty beat |
| Still | 22f | Readable time after settling; below 15f the viewer has no time to read the sub line |
| crash | last 12f, scale→1.2, blur→9px | This is the **first half** of a transition, and its motivation must match the first frame of the next shot; played alone it looks "unfinished", which is normal |

## Known traps
- **A wrong pivot makes the baseline wobble.** `transform-origin` must be the pair "first-word center % + baseline px".
  With the line box center (default `50% 50%`) the scaling and the left slide pull against each other, and in the last few frames the baseline visibly jumps
- Do not estimate the baseline. Rules of thumb like `lineHeight × 0.8` are off by a few pixels across fonts, and after 2.3x enlargement that is
  a jitter of a dozen pixels. The `offsetTop` of the zero-size inline-block ruler is the only reliable reading
- During `delayRender` the whole line is `opacity: 0`. This is **required**. Otherwise, in the first frame before the pivot is measured, a misplaced big
  word flashes, which is one dirty frame in the final video
- The layout is measured at mount, so **the result varies with the fonts of the render environment**: when cross-platform font fallbacks differ, the whole line width
  drifts as a whole (and the first word's share changes with it). If that matters, hard-code the three measured values as constants
- `scale` / `translate` use the independent CSS properties (not the `transform` shorthand). Mixing them lets one
  override the other; to merge them into `transform` you must guarantee the `translate → scale` order yourself
- A space between words placed inside the word span is cropped by the line box (see above). The bug is hard to see at small font sizes, but at 96px
  all the words visibly stick together
- The first word must be a **short word**. About 10 characters like "Introducing" is just right; with a first word over 14 characters, 2.3x
  enlargement overflows both sides of the frame and the viewer cannot read the end of the word
- Give the accent color to one word only. With two words colored the viewer does not know which to remember, and the highlight of the push-in landing becomes
  a "colored headline", wiping out the meaning of the action
- The final crash is the first half of a transition, not a closing. Used alone as an outro it looks "cut off": to close, replace the
  crash with a still hold or a fade-out

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`lead-word-zoom-assemble/LeadWordZoomAssemble.tsx`](../../../src/demo/typography/lead-word-zoom-assemble/LeadWordZoomAssemble.tsx)

