# Talking head: a filmed take is the voice (§5j): `talking-head`

**Use when** the channel owner films themselves (or someone who agreed to it) saying the video, and the person
on camera is part of the point: a reaction, a demo in the hand, a face the audience follows. **Do not use** to
hide an unwritten script behind a person: a filmed take passes the same fact rules as a written one, and it is
harder to fix, because the words cannot be rewritten after the take.

The voice comes from the footage, not from TTS: `bun run ingest` transcribes the take with Whisper,
`bun run cut` removes fillers, stutters, retakes and long silences, and writes `voice.json` from what is left.
Everything after that (lint, storyboard, scenes, render) is the normal pipeline.

```bash
bun run new <id> --flow <X> --visual talking-head
bun run ingest <id> ~/Movies/take.mov --lang vi --prompt "names, terms said in the take"
# read the review, edit src/videos/<id>/cuts.json
bun run cut <id>
# watch public/footage/<id>/cut.mp4; regroup lines into the flow's beats; facts; "face"
bun run lint <id>
```

## Rules

1. **The words are what was said.** A line in `narration.json` is a range of transcript words
   (`"words": [a, b]`); its `text` is generated from them by `bun run cut`. Three things may change it, and
   nothing else: a cut (`cuts.json`), a spelling fix for what Whisper misheard (`spelling`), or a new take.
   Lint fails a line whose text differs from the transcript.
2. **Every claim said on camera is verified or cut.** A filmed line with no `fact` is an error, not a
   warning: once posted, the claim is out in the world in the owner's own face. A line that asserts nothing
   checkable (a greeting, an opinion as opinion) says so with `"claim": false`.
3. **Every cut has a reason**, from the list in `cuts.json` (`filler`, `retake`, `false-start`,
   `off-topic`, `head`, `tail`, `manual` with a note). A retake keeps the **last** attempt. Do not cut words to
   change the meaning of a sentence: cutting "not" is rewriting.
3b. **Untranscribed speech is confirmed or cut, never guessed.** Where the review shows
   `⟪words missing?⟫`, ask the speaker for the words. If they are not supplied, cut the stretch by time in
   `cuts.json` → `"stretches": [{"start": 7.64, "end": 10.47, "note": "…"}]`, placed on the quiet dips of the
   audio so the words Whisper did hear are kept. A stretch is accepted only inside a flagged word; lint
   clears the flag once at most 1 s of that word is left on air. Re-running Whisper on the stretch alone is
   not a fix: on the first take it gave a different guess every run.
4. **No join through a syllable.** `bun run cut` cuts at the quietest point next to each word edge and
   records the loudness of every join; lint fails a join louder than `footageJoinMaxDb`. Then watch
   `cut.mp4` end to end anyway: Whisper's word edges are often 50–150 ms off.
5. **Declare the face band.** `narration.json` → `"face": {"top": …, "bottom": …}` in frame pixels,
   measured from stills of `cut.mp4` (head top to chin, at the widest the person moves). Effects go above or
   below it, never on it; lint checks every effect's `top`. In a typical seated phone take the face sits at
   about 440–880 px, so effects live **below** it (≈ 940–1440), above the captions.
6. **Effects are drawn on what is said, at the word that says it.** Use the shared graphics
   (`docs/visuals/README.md` → Shared graphics), cued with `frameAtWord`. Density per minute is
   `effectsPerMinute`; one punch effect (`WordSlam`, `Stamp`) per video. A chart over a person is still a
   chart: true to scale, from a fact record.
7. **Jump cuts change the framing.** `FootageStage` alternates the zoom after every cut that removed words,
   so a cut reads as an edit. A join that only shortened a silence keeps the framing.
8. **The take is a source.** `voice.source` names a `sources.json` record of kind `footage` with a licence
   (`"own footage, all rights reserved"` for the owner's own take). Anyone else in frame agreed to be filmed
   and posted; music heard in the room is a licence question like any other track.
9. **End on the turn, not a call to action** (§1). A take that ends "follow for more" is cut before it;
   lint warns on the phrases in `footageCtaPhrases`.

## Voice only

Without `talking-head` in `visual` the same commands use only the recording's audio, and the video is
an ordinary one (Backdrop, text-as-image, illustrated-scene…) with a human voice instead of TTS:
`bun run new <id> --flow <X> --visual text-as-image --voice recorded`. Rules 1–4, 8 and 9 apply; the
face band does not. The source record may be kind `voice`.

## Traps

- **Whisper is confident about wrong words, numbers first.** It writes what it expects to hear. On the
  first real take it wrote "1 tháng xa ra đường đấy" for "một thằng say rượu nào đấy": a number that was
  never said, and an effect was built on it before the speaker corrected it. Every `?`, number and name in
  the review is confirmed with the person who spoke; the fix goes in `spelling`.
- **Whisper drops words.** On the same take it wrote one word over 3.3 s of continuous speech. `ingest`
  flags such a word `⟪words missing?⟫` and leaves it untrimmed (trimming would turn the dropped speech
  into a "silence" that `cut` deletes); lint fails until the stretch is re-transcribed or cut.
- **Whisper's word edges are 100–300 ms off** and its segments touch end to end, hiding pauses. `ingest`
  trims each word to its voiced audio, and `cut` places every cut inside a measured quiet run, never at a
  word edge. A first version cut at word edges and clipped a syllable at −19 dB; lint caught it.
- **Marks do not follow a moving hand.** A `CircleMark` placed on the phone at 6 s circled a shirt at
  10 s. On footage, draw a mark only for the moment the thing holds still, and check stills at the
  start, middle and end of the mark.
- **The source is rotated.** Phone files carry a rotation tag; `ingest` reads it, so a portrait take stays
  portrait. A landscape take is cropped to 9:16 around `--crop-x` (0..1, default centre): check the crop
  keeps the person.
- **Upscaling.** A take under 1280 px tall is soft at 1080×1920 (`ingest` warns). Film in 4K or 1080p
  portrait.
- **A new take is a new transcript.** Re-ingesting a different file replaces the proposal in `cuts.json`;
  your edits to the old one do not carry over, because the word indices changed.

## Files

| File | Written by | Hand-edited? |
| --- | --- | --- |
| `.cache/footage/<id>/source.mp4` | `ingest` | no |
| `src/videos/<id>/transcript.json` | `ingest` | never |
| `src/videos/<id>/cuts.json` | `ingest` (proposal) | yes: this is the edit |
| `public/audio/<id>/voice.mp3` (same place as TTS), `public/footage/<id>/cut.mp4` | `cut` | no |
| `src/videos/<id>/footage.json`, `voice.json` | `cut` | never |
| `src/videos/<id>/narration.json` | `cut` (texts, ranges) | scenes, facts, `face`, `spelling` only |

## Cases run

| Video | Date | What it taught |
| --- | --- | --- |
| first take (test, not posted) | 2026-11-05 | face band at 440–880 px, not the lower half; Whisper misheard and dropped words; word edges unusable as cut points; marks do not track |

## Change log

| Date | Change | Why |
| --- | --- | --- |
| 2026-11-05 | Type added (§5j) | filmed videos in the same pipeline, inspired by mrtkeyword's flow but held to §9 |
