# SOUL: your channel's rules, shared by every video

These are the rules every video on your channel follows: voice, structure,
writing for a text-to-speech voice, visuals, captions, audio, facts, cover,
hand-off. One rulebook for every video, not one per video. What a specific video
is about lives in `briefs/<id>.md`.

## This is your channel's soul

These rules came from **one channel's measured results**: a private pipeline that
took a new knowledge channel from zero to ~120k views on its best video in two
months. Almost every rule exists because a published video broke it, and the
**why** is kept next to each rule so you can judge whether it applies to you. A
rule without its reason cannot be applied to a case it does not name.

**Treat them as starting defaults, not a standard.** Change, relax or delete any
rule that your own numbers or your own taste contradict. The way to change one is
the `sk-improve` skill:

1. edit the § text, keeping the reason (and the old reason, if it is still useful);
2. if the rule has a number, update `docs/soul/thresholds.json` to match;
3. add a line to the **Change log** at the end of this file.

Old videos are never rewritten to match a new rule; a published video is history.

Each § marks what kind of rule it is:

| Tag | Meaning | How freely to change it |
| --- | --- | --- |
| **[measured]** | a number or habit measured on the source channel or its niche | re-measure on yours ([`style-measurement.md`](docs/lessons/style-measurement.md)) and replace |
| **[default]** | a taste or niche choice that worked | change on taste; write down why |
| **[craft]** | a general lesson about video, TTS, layout or rendering | change only with a counter-example |
| **[hard]** | platform spec, licence law, safe zone geometry | do not relax; update when the platform changes |

## Which file to open

One section per file, because loading the whole rulebook to fix one scene wastes
context. Open the file for the job you are doing.

| § | File | Open when you are |
| --- | --- | --- |
| §1 §1b §2 §3 §3b §3c §3d | [`01-voice-and-structure.md`](docs/soul/01-voice-and-structure.md) | **writing the script**: voice, the optional strong-word threshold, choosing a flow, fact density, sentence style, tension, the viewer who knows nothing. Per-flow rules live in [`docs/flows/`](docs/flows/README.md) |
| §4 | [`02-narration-engine.md`](docs/soul/02-narration-engine.md) | **running TTS**: full stops make pauses, numbers, the pronunciation map, engines, whole-script reading, loop checks |
| §5 | [`03-visuals.md`](docs/soul/03-visuals.md) | **building scenes**: general visual rules; per-visual rules live in [`docs/visuals/`](docs/visuals/README.md). A recorded voice or a filmed take instead of TTS: [`talking-head.md`](docs/visuals/talking-head.md) (§5j) |
| §6 | [`04-color-and-type.md`](docs/soul/04-color-and-type.md) | **choosing colours or touching fonts** |
| §7 | [`05-captions.md`](docs/soul/05-captions.md) | **putting text on the frame**: safe zones on three edges, captions vs on-frame text, caption mask, layout traps |
| §8 | [`06-audio.md`](docs/soul/06-audio.md) | **mixing or choosing music**: licensing and Content ID, loudness, the bed under the voice, loops, SFX (how-to and bundled pack: [`docs/sfx.md`](docs/sfx.md)) |
| §9 | [`07-facts.md`](docs/soul/07-facts.md) | **checking facts**: the ledger in `docs/facts/` |
| §10 §11 | [`08-cover-and-handoff.md`](docs/soul/08-cover-and-handoff.md) | **making the cover or the hand-off**: cover, encode spec, description template, hand-off files, manual upload |
| §12 | [`09-motion.md`](docs/soul/09-motion.md) | **animating**: what moves, easing, transitions, continuity across cuts |
| §13 | [`10-files.md`](docs/soul/10-files.md) | **naming files or remaking a topic** |

**A rule has two halves.** The argument is in the §; the number is in
[`docs/soul/thresholds.json`](docs/soul/thresholds.json), which `bun run lint <id>`
reads. Change one, change the other, then lint every video.

Supporting docs: [`docs/making-a-video.md`](docs/making-a-video.md) (exact commands
per step), [`docs/lessons/for-you-distribution.md`](docs/lessons/for-you-distribution.md)
(why videos get zero views), [`docs/lessons/style-measurement.md`](docs/lessons/style-measurement.md)
(how to measure the style of top channels in your niche).

---

## Three rules to read before opening any file

1. **Facts first, words second.** Do not write a single sentence before every
   claim in it has a `verified` record in `docs/facts/` (§9). A number that
   passed through someone's summary cannot be checked again; a record can.
2. **Decide the visual language before writing the script.** Every claim must
   have a way onto the screen (a visual type from `docs/visuals/`) decided at
   the brief, **with its licence checked at that moment**. A script written around
   an image you cannot use, or around a claim nothing can show, gets rebuilt from
   scratch at scene time (§5).
3. **End on the turn, not on a logo.** The last beat is the payoff of the script
   (a reversal, the answer, the thing worth remembering), then a share line tied
   to the content, then a silent hold. No logo outro, no @handle card (§1).

---

## Pipeline order

Commands, generated files and how to check each step:
[`docs/making-a-video.md`](docs/making-a-video.md). This list keeps the **order**;
the runbook keeps the **commands**; the rules stay in the §.

0. **Brief** from [`briefs/_template.md`](briefs/_template.md): the angle, the
   question the video answers, why this flow, which visual types.
1. **Facts.** Every claim becomes a record in `docs/facts/facts.json`, every
   source a record in `sources.json` (§9). `bun run facts` clean.
2. **Choose the flow** (§2) before writing a sentence. The default is *not*
   flow A; ask what shape the fact has first. Write the reason in the brief.
3. **Choose the visual types** (`docs/visuals/`). Flow is how you tell it; visual
   type is how it reaches the screen; the two are independent. Check licences now.
4. **Scaffold:** `bun run new <id> --flow <X>`.
5. **Write the narration** in `src/videos/<id>/narration.json`, every line tied to
   a fact id. Do a style pass (§3b) and a tension pass (§3c) by reading it.
   `bun run lint <id>` before spending a TTS call.
6. **TTS:** `bun run tts <id>`. The script decides scene length; never set it by
   hand. Then **listen** to the whole file, and check it for loops (§4).
7. **Build scenes** in `bun run dev <id>`. Render stills with the safe-zone
   overlay and **look** (§7) before rendering the full video.
8. **Render → normalize → encode** (§8, §11).
9. **Cover** (§10); the agent writes `out/<id>/caption.txt` and
   `out/<id>/pinned-comment.txt` from the §11 templates.
10. **Hand-off:** `out/<id>/` holds `<id>-upload.mp4`, `<id>-cover.png`,
    `caption.txt`, `pinned-comment.txt`. You upload by hand (§11d).
11. **After publishing:** one line in the "Cases run" table of
    `docs/flows/<flow>.md`: a lesson about the *flow*, not about the video. A
    lesson left in a TSX comment is a lesson the next video never reads.

## Pre-hand-off checklist

Generic items only. Anything the linter can check, it checks; the rest needs eyes
and ears.

**Script**
- [ ] The flow was chosen on purpose (§2), not by habit; `flow` in
      `narration.json` and the brief name the same flow
- [ ] `bun run lint <id>` has 0 errors, and every warning was read
- [ ] `bun run facts` is clean; every number spoken or shown has a `verified`
      record; every `contested` fact on screen carries its caveat (§9)
- [ ] Style pass done (§3b): no sentence over the limit, no banned phrase, no
      four-word phrase reused from another video, no colon/dash in spoken text
- [ ] Tension pass done (§3c): the hook asks and does not answer, every scene ends
      with a pull, the payoff does not recap, no sentence exists only to name a
      source, at least one moment (person, place, time, action) on record
- [ ] Every contrast ("one X, the other Y") names both sides earlier and the
      contrast itself is in the ledger (§3b)
- [ ] Every term is defined aloud in plain words; every proper noun says what it is
      at first mention (§3d)
- [ ] Where the listener must breathe there is a **full stop**. Commas, colons and
      dashes create no pause at all (§4)
- [ ] Strong words: count matches the channel threshold (default 0), each one is
      an exclamation at a number or situation, never at a person (§1b)
- [ ] Ends on the turn, then a share line tied to the content, then 3–4 s hold

**Voice**
- [ ] The whole TTS file was listened to end to end, and checked for loops and
      clipped syllables: numeric checks pass on both (§4)
- [ ] Every proper noun is pronounced correctly; fixes live in `pronounce`, not
      in rewritten script text (§4)

**Frame**
- [ ] Stills rendered with the safe-zone overlay, at least one per scene, and
      looked at; every text block sits inside the safe box (§7)
- [ ] No on-frame text repeats the running caption; at most half the scenes carry
      on-frame text, and each is a fact the ear cannot catch (§7)
- [ ] Counting markers carry the item's name in the viewer's words (§7)
- [ ] No frame is static while the voice is talking; no shot is empty (§5, §12)
- [ ] Every archive item shows its date and licence on frame (§5)
- [ ] Timelines and comparisons are to true scale or say "not to scale" (§5)

**Audio**
- [ ] Music licence recorded per track, valid on every platform you post to; a
      Content-ID-registered track has its attribution as text (§8)
- [ ] SFX (if any): ≤ `sfxMaxPerVideo`, each cued to a word with `frameAtWord`, only on a moment the
      facts already made funny or sharp, never on a sentence or a death toll ([`docs/sfx.md`](docs/sfx.md))
- [ ] Music fades evenly to 0 and the last 3–4 s are a silent hold
- [ ] Master ≈ −13 LUFS, no clipping; voice-over-music spread above the floor (§8)
- [ ] Total length ≤ 180 s, and ≤ the music file for a play-once bed (§8)

**Hand-off**
- [ ] The cover is its own composition, text inside the 1:1.29 crop, readable at
      200 px wide, no spoiler, and its text stands alone (§10)
- [ ] Upload file is yuv420p limited range with BT.709 tags, 48 kHz audio,
      `+faststart`, and `ffprobe` opens it (§11)
- [ ] Description first line is a debatable claim (≤ 100 chars), not a greeting;
      alternative counts are pre-empted (§11)
- [ ] Every required attribution is in the pinned comment or on the end frame,
      written verbatim from the licensor (§11)
- [ ] Every output lives under the video's namespace: `out/<id>/`,
      `public/audio/<id>/`: no loose files at the root of `out/` (§13)
- [ ] After publishing: a line in the flow's "Cases run" table; a new flow rule,
      if any, written into that file and its change log

---

## Change log

`sk-improve` appends one line per rule change. An empty table means this SOUL has
not been adapted to your channel yet (`sk-pipeline` checks this at step 0).

| date | rule (§) | old | new | why |
| --- | --- | --- | --- | --- |
