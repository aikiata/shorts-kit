---
name: doc-park-left-pill-deal
summary: The document does not fade out. It slides left until only about 35% of its width shows and shrinks slightly to 0.92. On the right, three white outlined pills are dealt slowly at the pace of the narration (outBack pop-in). After each one settles, the caption below it deepens word by word, and the whole line fades before the next one arrives. The document on the left auto-scrolls extremely slowly the whole time to stay "being read"
use: Narration-driven sections where "analysis conclusions are given one by one"; the core explainer shot for document understanding, recommendation reasons and review comment products
length: about 5.8s (174f@30fps)
energy: low (slow deal rhythm, no peak in the whole shot; kept alive by the auto-scroll)
---

## Intent
Conclusions have to be given one at a time for viewers to remember them. But if the source document fades out, the conclusions become castles in the air: the viewer
does not know where these statements come from. This card's answer is to **keep the source in the picture**: the document parks on the left showing only a strip, still
scrolling slowly (showing it is being read), and each conclusion on the right grows out of this document. The deal rhythm is deliberately slow,
to leave the narration time to finish a sentence.

## Motion core
- Parking is not a fade-out: `seg(t, 0.06, 0.24, E.inOutCubic)` drives
  `translateX(0→-55%) scale(1→0.92)`, and `transform-origin: 0% 50%` anchors the scale at the left edge,
  so the document does not leave the left side of the frame as it shrinks. In the end only about 35% of the width shows
- Permanent auto-scroll: `translateY(-t * 120)` at continuous constant speed (about 0.7px/f), with content at least 140px longer than the container.
  The old form `-(t*3 % 1) * 40` used a modulo; with non-periodic content, the whole page jumped back 40px every 1/3 of the shot, visible to the naked eye, and is deprecated
- Slow deal: the start points of the three pills are hard-coded as `T0 = [0.26, 0.48, 0.70]`. The interval is 0.22 (about 38f / 1.27s),
  which is the length of one short narration sentence, not the usual UI stagger
- Each pill runs two curves in parallel: `o = seg(t, f, f+0.035, E.outQuad)` handles opacity (fast, about 6f),
  `b = seg(t, f, f+0.062, E.outBack)` handles `translateY(14→0) scale(0.94→1)` (slow, about 11f
  with overshoot). It is seen first and settles after, which feels more like "catching" than a single curve
- Caption choreography in four stages: start `cs = f+0.05` (about 3 frames after the pill settles); `show` appears quickly over a 0.02 window;
  `inn` (word-by-word deepening) is spread over `(ce-cs)*0.7`; `ce` is the next one's start minus 0.03 (for the last one ce=0.98);
  `out` fades over `ce-0.05→ce`. Each caption is cleared before the next pill enters, so there is only ever one line on screen
- The final state of the pills is a static list (`top = 54 + k*48`), and all three stay on screen once placed, reading as
  "the conclusion list has taken shape"
- Evidence link: after each pill settles, the supporting sentence in the document is swiped by a highlighter from left to right (f+0.06→0.13),
  and a thin accent-color line connects from the end of that sentence's line to the left edge of the pill (f+0.04→0.11 draw-on), fading out as that sentence's caption exits

## Parameters
| Parameter | Typical value | Feel when tuning |
|------|--------|----------|
| Deal starts | `T0 = [0.26, 0.48, 0.70]`, interval 0.22 (about 38f) | The interval is the narration sentence length. Squeezed below 0.12 the "word-by-word deepening" of the caption cannot finish, and it reads as a caption that flashes and is gone |
| Park window | 0.06→0.24 (inOutCubic) | Must finish before the first pill (0.26). An overlap gives a muddy "the document is still sliding and the pills are already dealing" |
| Park amount | `translateX -55%` + `scale 0.92`, about 35% showing | Showing too little (<25%) turns the document into decoration and loses the "source" meaning; showing too much leaves no room on the right for the 172px wide pills |
| Pill opacity window | 0.035 (about 6f, outQuad) | Shorter than the move window on purpose: solid first, stable after. Two windows of equal length read as a plain fade-in |
| Pill move window | 0.062 (about 11f, outBack), y 14→0, scale 0.94→1 | The outBack overshoot is the feel of a "card dealt onto a table". Switch to outCubic and it becomes a bland float-up |
| Caption delay | `cs = f + 0.05` (about 9f) | The caption starts only after the pill settles (0.062). Earlier and the caption appears before the conclusion |
| Caption deepening travel | `(ce-cs)*0.7` | Takes 70% of that line's visible time, and the last 30% is fully solid reading time. At 1.0 the caption is faded out right after it is read |
| Auto-scroll | `-t × 120px` constant speed | About 0.7px/f over 5.8s, a hint-level speed for "being read". Over 3px/f it grabs attention and becomes a scrolling showcase |

## Known traps
- The auto-scroll is continuous displacement, not a modulo loop (a modulo does not jump back only when the content itself is strictly periodic). When changing the duration or
  travel, make sure the document content is longer than the container by at least the whole travel, or the last part scrolls into blank
- The last caption's `ce = 0.98` means it fades out over 0.93→0.98, so the last frame has only the three pills and no caption. To
  keep the last line to the end, change the last `ce` to >1 and remove the out
- The pill position is hard-coded as `left:214px, top:54+k*48`, width 172px, a set of numbers that matches the parked document
  (about 87px showing) on a 480-wide canvas. When you change the document park amount you must change PX too, or the two overlap
- The three pill texts (in the demo, the three shot cards Crash Zoom / Deck Deal / Logo Sting recommended by a shorts-kit promo brief) and the three captions are all illustrative, and the caption
  length directly affects how fast "word-by-word deepening" reads. After swapping in real copy, retune the `inn` travel to the new line lengths
- The pill count is hard-coded as 3 (the length of `T0`). With 4 there is not enough time: the last start passes 0.9 and the caption cannot
  finish. For 4 or more, consider shortening each line rather than cramming
- The caption's `ce` depends on `T0[k+1]`, so changing any one start also changes the visible time of the previous caption. This
  link is deliberate (a caption always fills up to just before the next one), but be aware when tuning that it is not an independent parameter

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`doc-park-left-pill-deal/DocParkLeftPillDeal.tsx`](../../../src/demo/ui-entrance/doc-park-left-pill-deal/DocParkLeftPillDeal.tsx)

