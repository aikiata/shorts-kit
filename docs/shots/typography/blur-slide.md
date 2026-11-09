---
name: blur-slide
summary: The title enters word by word. y 0.38em→0, blur 18→0 and opacity 0→1 converge together on one ease-out curve, with about 4f between words. The subtitle follows in a staggered overlap, before the title has finished settling
use: Almost any title/subtitle pair; product page hero copy, chapter subtitles; a default text reveal that is "professional but does not steal the scene"
length: about 4.0s (120f@30fps)
energy: low (one convergence, no peak, no loop)
---

## Intent
This is the **default solution** for text reveals. No spectacle, nothing mechanical:
the words are just placed into position, softly, one by one. Its professional feel
comes from one thing: y, blur and opacity share the same progress `p` and the same
easing, so the word "surfaces out of defocus" instead of "sliding in and fading a
little on the way". When a video already has another heavy technique (scramble/roller),
the title should use this card and give way to the lead.

## Motion core
- Per-word progress `p = ramp(frame, start, dur, EASE.out)` (quint-out class). All three channels are bound to the same p:
  `opacity = p`, `translateY = (1-p)·dy`, `blur = (1-p)·B`px (in the demo, the tightening of the lead word's letter-spacing also hangs on the same p)
- Main title (170px serif, two lines): line 1 has 3 words, starting at 10f, 4f between words, 22f per word; line 2 first pauses 6f to breathe,
  "feel" 26f, lead word "cinematic." starts at 30f with a 30f entrance window (it settles last); `dy = 64`px, `B = 18`px
- Subtitle (46px sans-serif, 9 words): starts at 34f, 2.4f between words, 20f per word, `dy = 26`px, `B = 9`px
  (tighter spacing, smaller travel, so **the hierarchy comes from amplitude, not duration**)
- Staggered overlap, not a queue: the subtitle starts at 34f while the title only finishes at 60f, so the two overlap by 26f.
  A queue reads as two beats; an overlap reads as one sentence
- Split by word, not by letter: after `text.split(' ')` each word is one span, and `line` uses `gap:0.32em`
  for word spacing (not space characters). Per-letter entrance is too fragmented; word level gives the "spoken aloud" feel
- Demo layout: paper look (warm white paper + ink + vermilion). A magazine masthead (shorts-kit wordmark) and a footer hairline frame the page as one sheet. A vermilion all-caps eyebrow →
  170px serif main title (lead word in italic vermilion) → 46px sans-serif subtitle, left-aligned on a 168px grid. In the background a 5% ink, 760px
  issue number drifts slowly the opposite way for parallax. The text layer pushes in very slowly throughout, 1→1.03 (smooth), and the footer hairline draws from 72f to close the hold

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Word stagger | main 4f / sub 2.4f | 3–4f is the sweet spot for "word by word"; <2f and the whole line enters together with no stagger, >8f and the viewer starts counting words one by one |
| Per-word entrance window | main 22f (lead word 30f) / sub 20f, `EASE.out` | <10f reads as a hard pop; >30f and every word floats slowly, the sentence drags |
| y offset | main 64px (≈0.38em) / sub 26px | Unequal amplitude between main and sub is the source of hierarchy; <0.15em the offset is not felt, >0.6em the word flies in from off-frame and becomes a slide-in |
| blur channel | main `(1-p)·18`px / sub `(1-p)·9`px | This channel is the "professional feel". Delete it and it degrades into a plain fade-up; above ~12% of the font size the middle frames smear into a color blob |
| Main/sub overlap | main 10f–60f / sub 34f–80f | ~26f of overlap reads as "one sentence"; push the subtitle start past the end of the title and it reads as two beats |
| Size and weight | 170px serif 400 vs 46px sans-serif 400 | A ratio of 2x or more is needed for a main/sub relationship; with equal weight, the font family separates them, and a 600+ weight on the subtitle fights the main title |
| Closing hold | subtitle finishes at 80f, about 40f of tail (only the very slow push-in and the footer close remain) | A rest <8f and the viewer cuts away before finishing reading |

## Known traps
- The demo was tuned on placeholder copy. The parameters are a tuning starting point, not a field-tested final;
  the first real use must re-check against real material
- **The placeholder copy is 5 main words (two lines) / 9 sub words. When swapping in project copy, keep the word count close**: total stagger
  length = `gap × word count`. Double the words and the last word starts twice as late, and its entrance gets squeezed into the closing hold.
  Past 8 words, compress the gap to 2–2.5f at the same time
- All three channels must share the same `p`: writing three separate easings (even with identical curves) gives a
  "moved into place but still blurry" mismatch, and the soft feel falls apart at once
- Word-level splitting must be done by hand for Chinese copy: `split(' ')` on Chinese returns one whole block,
  so segment it by meaning into 3–5 spans yourself. Do not degrade to per-character
- Each line is an absolutely positioned `flex` row (left-aligned on the 168px grid), and word spacing comes from `gap`, not from spaces.
  When changing copy, keep line 1 under ~1450px wide (170px serif is about 17 characters), or it hits the issue-number background on the right
- This is a **low-energy default card**: it has a different job from the scramble/roller cards in this category. They can,
  and should, coexist in one video (the lead uses the heavy technique, all other titles use this card)

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`blur-slide/BlurSlide.tsx`](../../../src/demo/typography/blur-slide/BlurSlide.tsx)

