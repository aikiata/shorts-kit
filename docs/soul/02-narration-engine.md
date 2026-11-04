# Writing for a text-to-speech voice

> Part of [`SOUL.md`](../../SOUL.md). This file holds **§4**. Almost all of it is
> **[craft]**: how TTS pipelines fail. Engine choice and tempo are **[default]**.

---

## 4. Writing for the narration engine

The script lives in `src/videos/<id>/narration.json`. `bun run tts <id>` reads it,
synthesises the whole script, and writes `public/audio/<id>/voice.mp3` plus
`src/videos/<id>/voice.json` (word timestamps, line and scene boundaries). Scene
length comes from the voice. **Never set it by hand.**

- **One idea, one sentence. The full stop is an editing tool**: captions break and
  cuts land on sentence boundaries, not on grammar.
- **Each block ends on a line that "hits"**, so the cut has somewhere to land.
- **Mock the situation, not the person** (§1).

### Full stops make pauses. Commas, colons and dashes do not.

The pause pipeline inserts silence only after sentence ends (`.` `!` `?`). `,` `;`
`:` `—` `–` are **completely silent** to it: not a shorter pause, no pause at all.
Most engines also run punctuation-light text together. A draft whose key reversal
leaned on a colon plus four commas came out as one breathless run; split into
sentences, the cut count went from 19 to 31, and the owner's question ("why don't
the punctuation marks stop?") was answered.

**Consequence: the rhythm is set by the distance between FULL STOPS, not by
sentence length.** Twelve words with three commas sound longer than two sentences
of eight words, whatever the word counter says.

- **Short sentences are a rhythm tool, not a grammar error.** "Rock takes the
  space." "The water has to rise." Two three-word sentences buy two breaths no comma
  can buy.
- **But commas are not a crime.** A list read quickly is right ("Tefé, Coari,
  Manaus, Santarém, Belém, every city clings to the water.") and full stops would
  break the list's rhythm. The measured fault is the **combination**: a sentence
  already over the word limit that still leans on silent marks, because the writer thought
  the comma had broken the sentence for them.

Pauses are declared in seconds (`pause.line`, `pause.scene` in `narration.json`),
not hoped for. A slower, solemn video gets longer pauses; do not slow the whole
voice to get them.

### Inserting pauses: cut at SILENCE, never at a word timestamp

When pauses are inserted into synthesised audio, the cut point must be found by
**energy**, not taken from the word-end timestamp. Recogniser or aligner
timestamps mark where a word was recognised, which is often **earlier** than where
the sound stops. Cutting there splits a vowel: the first half ends abruptly, silence
is inserted, and the next segment opens with the **leftover tail**. The ear hears a
stutter and half a syllable repeated ("error … or").

And **every numeric check passed**: total duration matched to the millisecond, the
alignment rate was 82%, captions had the right words. Only an ear caught it.

1. Search for the quietest point in `[end(i), start(i+1)]`, widened by ±0.15 s,
   because both boundary timestamps are estimates too.
2. If even the quietest point is loud, **skip that cut.** Better a missing pause
   than a torn syllable: nobody notices a sentence without a pause; everyone hears a
   word cut in half.
3. Shift later word timestamps by the number of cuts **actually applied**, not the
   number of eligible ones.

A check that is too sensitive is as useless as one that is too loose. A scan that
alarmed on both sides of each gap reported 10 failures, 9 of them correct pauses.
The sides are not symmetric: sound **just before** the gap is a torn syllable (bug);
sound **just after** is the next sentence starting (correct).

### Read the whole script in ONE request

Synthesise the full script in a single call and take word timestamps from that one
file. Some engines (ElevenLabs `eleven_v3` among them) are **not deterministic**:
twelve requests for twelve sentences produce twelve readings, and the owner heard
"the voice isn't consistent". One request means voice, pitch and inter-sentence
rhythm all come from one reading.

The cost: changing one word re-reads the whole script (~1,300–1,400 characters for
an 80 s short; engines have per-request caps, e.g. 3,000 characters). So
`bun run tts` hashes the script text plus the voice settings and **does not call the
engine when nothing changed**; `--force` overrides. Paid engines bill per
character, and a re-run is paid again.

`voice.json` is generated and never hand-edited. Timing helpers use real timestamps
only when the words match the current script; edit the text without re-running TTS
and you are previewing against estimates.

### Numbers, names, and the two maps

The script you write is **the text the caption shows**. Two maps separate what the
ear needs from what the eye needs:

- **`pronounce`**: spoken-only respellings (`{"Nguyen": "Nwin"}`), applied just
  before synthesis. The caption keeps the real spelling.
- **`spelling`**: caption-only display forms (`{"nine metres": "9 m"}`). Write the
  number in words for the ear, show symbols to the eye, because a caption is read in
  two seconds and "ONE HUNDRED AND THIRTY-EIGHT BC" is a wall of text.

Why a **map** and not hand-edited script text: in one session the scripts were
rewritten between the two forms **four times** because the engine changed. Each was a
find-and-replace across nine videos, each a chance to miss one (and one was missed).
Changing engines must be a one-line change.

Rules that came from real failures:

- **Write numbers the way they should be spoken** if your engine misreads digits
  ("7.100 km" read as "seven point one hundred kilometres" in one locale). Many
  modern English engines read digits well; test yours on dates, decimals, ranges,
  units and negative numbers, and write down what it gets wrong.
- **Keys must be long enough not to over-match.** A `spelling` entry for "two"
  swallows "Two things nobody tells you". Declare whole phrases.
- **Do not put a word used as an SFX or animation anchor inside a `spelling`
  phrase**: merged tokens make the anchor unfindable.
- **Match on word boundaries and on case.** A mask table that matched exact case let
  the sentence-initial capitalised form through on four videos; nothing failed,
  the caption simply printed the word. After every TTS, scan the **generated** words
  in `voice.json`, not the source table.
- **Word tokens carry no punctuation.** Punctuation is detected from the source text
  and attached as a break marker; tokens like `origin,` silently break caption line
  breaks and every display mapping at once.
- **Prefer engines that read foreign names directly.** An engine that misreads them
  forces a `pronounce` entry per name: a whole family of bugs a better engine
  removes. When you switch engines, test one scene full of names before deciding.

### Tempo: scales do not convert between engines

Each engine's speed knob is its own scale. Measured on one script: engine A at
"+20%" ran 3.67 syllables/s; engine B at tempo 1.0 already ran 4.03, at 1.2 ran
4.84. Copying "+20%" across as tempo 1.2 made a video 32% faster than the approved
one while everyone believed it unchanged. **When you change engine, reset tempo to
1.0 and listen.** Do not run two speed controls at once (e.g. an engine's own speed
setting plus `atempo`); `tempo` in `narration.json` is the only knob.

**Tempo follows what the eye has to do, not taste.** A fast read works when the frame
asks nothing to be read; slow down for videos with archive plates, photos,
before/after pairs, timelines or dense on-frame text. A video about deaths read fast
sounds excited: slow it. Override per video; do not lower the default.

### Voice identity

- **Changing the voice changes the channel.** Regular listeners notice on the next
  video. Change it on purpose and completely; never alternate voices between videos,
  and never let one video have two voices. A new default must not silently re-voice
  an old video: old videos pin their engine and voice.
- **Pin versions.** A local model package *and* its weights revision: a package
  that pulls weights from a moving branch changes the voice without telling you.
  Upgrading is its own decision: upgrade, re-voice one video, listen.
- **Preset voices yes, cloning real people no.** Cloning a real person's voice to
  publish is impersonating them.
- **Model choice can fail silently.** One popular "most lifelike" multilingual model
  had no support for the channel's language and read it with foreign phonetics,
  without an error. Free tiers may lock every voice for your language. Check the
  engine's language table and your plan before building on it.

### Check the TTS output for loops: numeric checks will not

A local engine once read *"…the British consul judged, by British law"* as *"…the
consul British consul British consul British, by British law"*: stuck, repeating a
phrase three times, two seconds of nonsense mid-scene. It passed **everything**:
scene duration matched, the timing build was clean, the alignment rate was 93%
(the repeated words exist in the script, so the aligner matched them, just in the
wrong place). The owner caught it by ear.

**Catch it by machine:** transcribe the generated audio with a speech recogniser and
search for runs where the same 1–3 words repeat three times in a row. Do not compare
word counts with the script: numbers spelled out in the script come back as digits,
so dated scenes differ by 10–15 words while perfectly fine. Repetition is the alarm,
not the difference.

**Where it trips, and the fix:** clusters of similar words with sibilants close
together ("consul British judged" among three uses of "British"). **Rewrite the
line**; do not re-roll the TTS and hope: a re-roll is a dice throw that sticks
somewhere else. Move the repeated name onto the frame (§7), where it does not pass
through the engine.

**Transient failures are not script failures.** An empty audio stream from a free
online engine under rapid calls happens; retry with backoff and do not "fix" the
sentence that happened to fail (time was once lost suspecting an innocent word).

### Engines

`voice.engine` in `narration.json` picks the engine; one command (`bun run tts`)
calls the right one. Never call an engine script directly: that is how a video was
once read with the wrong voice.

| `engine` | Cost | Notes |
| --- | --- | --- |
| `edge` (default) | free, no key | online Microsoft voices; good English; retry on empty streams |
| `elevenlabs` | per character, `ELEVENLABS_API_KEY` in `.env` | `with-timestamps` gives per-character timing from the same request, so no recogniser is needed; use a model that lists your language; do not send its own speed setting |

API keys live only in `.env` (gitignored). An agent should not read `.env`.

### Locale profile example: Vietnamese

Kept as an example of what a locale profile looks like, not as a rule of the kit.

- Online neural voices misread Latin proper names badly ("Bartolomeu Dias" →
  "Bát Thông Điát"); a local model that reads English names directly removed the
  need for `pronounce` entirely. The best Vietnamese results came from local
  models (with their own tempo scale, pinned weights) and from ElevenLabs
  `eleven_v3`; the multilingual v2 model had no Vietnamese.
- Numbers had to be written in words for most engines; `spelling` mapped them back
  to digits for captions ("một trăm ba mươi tám trước Công nguyên" → "138 TCN").
- Word = syllable, so sentence-length thresholds are much higher than English ones.
- Platform keyword filters reacted to a few literal words ("die", "kill"); the
  channel masked them in captions with an emoji, and noted it is useless on YouTube
  (which judges content, not keywords) and reads as flippant under a tragedy.
- A spelling slip that also changes meaning (a common misspelling of "share") went
  into both caption and voice; proofread the share line like any other.
