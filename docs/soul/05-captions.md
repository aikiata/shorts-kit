# Captions, on-frame text and safe zones

> Part of [`SOUL.md`](../../SOUL.md). This file holds **§7**. Safe-zone geometry is
> **[hard]**; caption styling is **[default]**; the traps are **[craft]**.

---

## 7. Captions [default style]

Default style:

- **UPPERCASE, very bold**, ~64 px on a 1080-wide frame, thick dark outline.
- **2–4 words at a time**, following the voice. Never the whole sentence.
- **The word being spoken is highlighted** (accent colour), no coloured box.
- The bottom of the caption block sits **~24% of frame height above the bottom
  edge** (≈ 460 px on a 1920 frame), clear of the platform UI.
- Proper nouns and foreign words appear **in their real spelling** (`spelling` maps
  display forms; `pronounce` only changes what is spoken: §4).

## 7a. Safe zones: three edges, not one [hard]

The 24% rule watches one edge. The other two bit a video before anyone looked.
Numbers measured from iOS interface screenshots (the values Remotion's
`SocialSafeZones` element uses), in a 1080×1920 frame:

| Edge | TikTok | Reels | Use |
| --- | --- | --- | --- |
| Top UI reaches | y = 132 | y = 212 | **212** |
| Right button column starts | x = 949, from y = 803 | x = 927, from y = 1114 | **x 927 from y 803** |
| Platform caption area starts | y = 1749 | y = 1726 | **1726** |

**Take the strictest edge of each platform, not the average**, so one layout is
valid everywhere you post. YouTube Shorts sits inside these numbers. The
intersection box is where text may go; the shared `SafeZones` / `SafeCheck`
components draw it.

Consequences that were each wrong once:

- **A stage's top must be ≥ the safe top.** The habitual 130–150 px puts the kicker
  inside Reels' control strip. A watermark's default top can sit there too; give it
  a `top` prop.
- **An 880 px centred panel spans x 100–980 and pokes 31 px into the button
  column.** Narrow it to the panel max width (774) or shift it left.
- **Captions need a max width.** A caption band reaching x = 1010 put the last word
  of every line under the like/comment buttons: on the most-read text on screen.
- **Scaling eats width.** A 774 px column scaled to 1.075 by a camera push is 832 px
  and crosses x 927 at the end of the scene. Size content for the final scale.
- **The watermark renders AFTER the scene sequences**, not before; placed first, the
  scenes paint over it and it disappears while still "rendering". Adding a watermark
  to an old layout is not an addition: everything that used that strip moves down.

### Checking: two layers, every video

| Layer | Catches | Misses |
| --- | --- | --- |
| static scan (lint) | hard-coded tops in the forbidden band, missing max width, missing watermark, strong words typed into JSX | everything drawn inside a scene |
| still with the safe-zone overlay | everything, by eye | n/a |

**A static scan does not replace eyes.** On one day the scan reported 8/8 clean and
stills showed four families of faults, all the same shape: the rule only saw what it
looked at. A video with **no** watermark had no watermark violations; a component
using its **default** top was never a number in the scene, so never caught.
**A wrong DEFAULT is quieter than a wrong VALUE.** When you change a layout
constant, find everything that eats its default.

`bun run still <id> --frame=N` with the overlay, at least one frame per scene, plus a
frame at each moment a chip or label appears. Check on the laptop at full size and
the layout looks fine: draw the bands and look. **Delete old stills after a fix and
re-render**: the old images look exactly like the new ones, except they lie.

## 7b. The caption mask applies to EVERY text on the frame [craft]

If the channel uses strong words (§1b), the voice keeps them and every **text**
masks them: exclamations become an emoji, a mid-sentence negation becomes its
neutral form. That includes headlines, chips and big numbers typed in scene code,
not only the generated caption: one video showed the raw word in a 100 px headline
while the caption under it showed the masked one. Same frame, two standards. And the
rule was broken in seven places across five videos **after** it was written down,
because nothing checked it. A rule about text with no command that checks it is a
note, not a rule; the linter scans scene files.

Mask both cases: sentence-initial capitalised forms are the *common* form of a
negation, not the rare one.

## 7c. On-frame text never repeats the running caption [craft]

The caption carries every word of the narration. A 60–90 px headline copying the
sentence being read makes the viewer read it twice and, worse, takes the place of
the one thing the frame can do that the voice cannot: **hold a fact still for the eye
to study.** The owner caught it on stills, not in code: "why does the headline look
so much like the captions?"

On-frame text carries only what the voice does **not** say:

| Allowed | Not allowed |
| --- | --- |
| a **label**: name, date, chapter (`1904`, `STEP 2`) | copying the line being read |
| a **reading** of the event the voice does not state outright (`A MILITARY MISSION`) | paraphrasing the line being read |
| a **fact cut from the voice for length** (`1,000 GOLD INGOTS`, units, coordinates, source and document numbers) | an exclamation echoing the voice |
| a **whole-video count** (`5 STEPS · 0 SIGHTINGS`) | |
| **nothing at all**: often the strongest choice | |

Exception: the share scene, where the text *is* the invitation and must read without
sound.

### And a rule about QUANTITY

The table says whether a text is allowed; it does not say whether the frame needs
one. Seven of nine scenes with valid headlines and the viewer remembers none. The
owner: "a headline or badge should appear only when it is data that really matters;
printing too much confuses people."

1. **At most half the scenes carry on-frame text** (`onFrameTextMaxSceneShare`).
   More is a sign of failure, not diligence.
2. For each headline ask: **can the ear catch this?** If yes, drop it. The ear
   misses decimals, negatives, opposing pairs, years, foreign names, units.
3. A headline that is a **sentence** goes, even if it copies nothing. Sentences are
   the voice's job; the frame carries data. Kicker ≤ 25 characters, headline ≤ 6
   words (`kickerMaxChars`, `headlineMaxWords`).

### A long scene that cannot be cut: ledger details go to the frame

When a scene's narration passes ~20 s (`longSceneSpokenSeconds`) and the content
cannot be cut, do not read it all. The voice keeps the mechanism; numbers, years,
sample sizes and source names leave the voice and go on the frame. The ear cannot
follow "one hundred and thirty-seven students, fourteen days before, ten days after,
seven weeks after"; the eye reads `137 STUDENTS · MEASURED 14 DAYS BEFORE` at a
glance, and the line becomes "they measured before the earthquake hit." The text
comes **from the ledger record**, it is still data not a sentence, the half-the-scenes
limit still holds, and the number on frame still needs its caveat (§9).

## 7d. Counting markers carry a NAME, in the viewer's words [craft]

Flows without spoken numbering use an on-screen marker. Two ways it breaks:

1. **A bare row of numbers is not a marker.** `1 2 3 4 5` says where you are, not
   *what* the step is. The active item expands to carry its name
   (`STEP 2 · PRINTED ON THE MAP`), the rest stay numbers.
2. **Never use the builder's metaphor as the viewer's text.** A draft labelled five
   "links" `LINK 1…5` and the owner asked "five links of what?" Use the viewer's
   words (*step*, *stage*), or the thing's name (*a page*, *a source*). Keep internal
   metaphors out of briefs too: what is written in the brief drifts into the script.
   Words SOUL uses for structure ("the turn", "the payoff") are never spoken.

Changing the on-frame word means changing the narration and re-running TTS, or the
caption says one thing and the voice another.

## 7e. Second-language caption: secondary, one tier lower, always clean [default]

A line's optional `caption` field holds a translation. Shape: the main caption keeps
everything; the translation is **a smaller block below**, sentence case, dimmer, **no
word highlight**. It is a translation to skim, not a second caption competing for
attention.

- **One translation per sentence**, not per caption chunk. Caption chunks are cut by
  word and character limits; change one word and the chunks change, and a
  chunk-aligned translation shifts silently. Sentences are stable.
- **The whole sentence appears at once**, not karaoke. The main caption serves the
  ear (2–4 words follow the voice); the translation reader cannot hear and needs the
  whole clause. Most sentences stand 1–3 s, a normal subtitle rhythm.
- **Known cost, accepted:** the full sentence can reveal a number ~2 s before the
  voice says it. Every subtitled film pays this. If you reopen the decision, start
  from the two rejected options: reveal progressively, or align by clause.
- **Two lines is a geometric ceiling** (`captionSecondLangMaxLines`,
  `captionSecondLangMaxChars`): a third line overlaps the main caption silently.
- **Clean by construction**, matched on word boundaries (or "ass" bites "assumed").

## 7f. Layout traps you cannot see by reading code [craft]

1. **`opacity: 0` still takes space.** A hidden block keeps its slot in a flex
   column and pushes the next one down. Collapse its height to 0.
2. **Its twin: unmounting reflows in ONE frame.** Two count blocks in one flex column
   with a gap; the first unmounts when its fade drops below a threshold, and the
   second jumps up ~280 px in a single frame. The owner: "the number moves very
   weirdly by itself". There is no animation to find: the cause is a `null`. Blocks
   that alternate in one position each get their own absolutely positioned layer,
   anchored to the frame, not to each other.
3. **Two blocks in the SAME place transition in sequence, not by crossfade.** An
   overlap of 12–20 frames gives one frame with two titles and two dates printed on
   top of each other.
4. **Do not tie block A's position to block B's opacity.** They meet halfway: the date
   line landed on the photo's caption while the photo faded. A starts where B ends.
5. **Flex shrink climbs.** A long label squeezes its neighbour until text overlaps;
   `minWidth` does not save it. Fixed cells get `flexShrink: 0` plus a real width;
   flexible cells get `flex: 1` **and** `minWidth: 0`. **A number never wraps**
   (`1,300` / `m` reads as a font bug): `whiteSpace: nowrap`.
6. **A one-line title field fits ~30 characters** in a typical plate; a second line
   pushes the next block onto the image. Write short, then look at a still.
