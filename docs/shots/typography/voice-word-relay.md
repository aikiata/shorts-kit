---
name: voice-word-relay
summary: Big headline words land one at a time, each on the frame the voice says it, so the screen says the same sentence as the narrator at the same moment.
use: Any spoken line that should also be on screen in large type: a promo's claim, a hook, a tagline lockup. The default for burned-in type in a feed ad watched on mute.
length: per word 9-10f; a line is as long as the voice line (about 45-90f for 4-7 words)
energy: medium
tags: typography, voice, kinetic-type, captions, promo
source: shorts-kit/knowns-tvc-v4
---
# voice-word-relay

## Intent
The viewer reads and hears one sentence, not two. Each word appears on its spoken frame, so a viewer on mute
still gets the line at the speaker's pace, and a viewer with sound feels the type "say" it. It is not a caption
band: the words are the headline of the shot, large, in the upper half, and they stay on screen once landed.
Accent words (the product name, the turn word) take a colour. Unlike [blur-slide](blur-slide.md), the stagger is
not a fixed gap: it is the voice's own rhythm, so a re-recorded voice re-times the type.

## Motion core
- Each word's start comes from the voice transcript, not a hand-typed frame:
  `wordIn(sceneId, lineId, word, nth)` = absolute frame of the nth spoken `word` in line `lineId`, minus the
  scene's start (`timing.ts`, built on `voiceWordFrame` in `src/shared/promo.ts`). Punctuation is normalised, so
  `"decided."` and `"decided"` match. A missing word throws at build time, so a changed script fails loudly.
- Per-word progress `k = ramp(f, at, len, easeOut)` (cubic out). All channels hang on the same `k`.
- Two styles in the source:
  - `Kinetic` (heavy, the knowns-tvc look): `len = 9`, `opacity = k`, `translateY = (1-k)·0.28·size`,
    `scale = 1.12 - 0.12·k` with origin at the word's bottom-left, so it settles down into the line. Weight 900,
    line-height 1.02, tracking `-size/35`.
  - `Head` (quiet, the Knowns UI site look): `len = 10`, `opacity = k`, `translateY = (1-k)·0.18·size`,
    `blur = (1-k)·6`px, no scale, no bounce. Weight 600, line-height 1.06, tracking `-0.045·size`.
- Words are flex items with `flexWrap`, gap from `columnGap` (not spaces), so long lines wrap by themselves.
- A repeated word ("your ... your") needs its `nth`: the reveal keeps a `seen` counter per word while it maps the
  word list, so the second "your" reads the second spoken "your".
- Words can be grouped: `{text: "what you decided.", at: w("what")}` lands three words as one block on the first
  of them, when the voice runs them together.

## Parameters
| Parameter | Typical value | Feel when changed |
|---|---|---|
| Entrance window | 9f (Kinetic) / 10f (Head) | Under 6f each word pops; over 14f the word is still moving when the next is spoken, and fast speech smears |
| Rise | 0.28·size (Kinetic) / 0.18·size (Head) | Larger reads as a throw; under 0.1·size the motion is not seen and it is a fade |
| Scale settle | 1.12 → 1 (Kinetic only) | Adds weight; above 1.2 the word visibly shrinks and fights the rise |
| Blur | 6px → 0 (Head only) | The soft, product-site feel; above about 8% of the font size the mid frames smear |
| Size | headline 80-112px, lockup 150-168px, sub line 0.45-0.62 of the lockup | A 9:16 line holds about 4-6 words at 100px inside the safe panel |
| Column gap | 0.2-0.24·size | Below 0.15 words touch on landing; above 0.3 the line falls apart into tokens |
| Lead before the word | 0 (land on the word) | Moving `at` 2-4f earlier makes the type feel ahead of the voice; later feels like a lagging caption |

## Known traps
- Word times are relative to the scene. A cutdown that reuses the scene must place the voice line at the same
  offset inside the scene, or every word lands off its sound (see [cutdown-retime](../rhythm/cutdown-retime.md)).
- A line said in a cut but not in the master (id `c3`) lives in the same `promo.json`; the master filters lines by
  id prefix so it does not play it.
- `nth` is easy to forget. Without the `seen` counter the second "your" lands on the first one's frame.
- Every spoken line should be on screen (a promo rule), but the type is a headline, not a transcript. Group or drop
  filler words rather than shrinking the type to fit them.
- Determinism: the only input is the frame and the transcript JSON. No CSS transitions, no `Date`, no timers.
- The voice must be generated before the scene builds (`wordIn` needs `voice-lines.json`).

## Pairs with
- [blur-slide](blur-slide.md) for secondary type that does not follow the voice.
- [type-rhythm-sync](type-rhythm-sync.md) when the type should follow the music, not the voice.
- [chroma-word-slam](../effects/chroma-word-slam.md) for the one word that breaks the pattern.
- [crash-zoom-punch](../camera/crash-zoom-punch.md) on the product name.

## Reference implementation
- [`voice-word-relay/fx.tsx`](../../../src/demo/effects/chroma-word-slam/fx.tsx) (`Kinetic`)
- [`voice-word-relay/look.tsx`](../../../src/demo/effects/node-field-backdrop/look.tsx) (`Head`)
- [`voice-word-relay/timing.ts`](../../../src/demo/rhythm/cutdown-retime/timing.ts) (`wordIn`)
