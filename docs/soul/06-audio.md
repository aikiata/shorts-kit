# Audio, music and licensing

> Part of [`SOUL.md`](../../SOUL.md). This file holds **§8**. Licensing and length
> ceilings are **[hard]**; loudness and bed levels are **[default]**; the traps are
> **[craft]**.

---

## 8. Audio

| | Default |
| --- | --- |
| Music bed | continuous, low under the voice, fade in, and an **even ~9 s fade to 0** at the end |
| Master | ≈ **−13 LUFS** integrated (`loudnessLUFS`), never above 0 dBFS (a −1 dBTP ceiling is safe) |
| End | 3–4 s hold on the last frame with music already at 0 (`outroHold`) |

A raw Remotion render usually sits around −20 LUFS. **Normalize before hand-off**
(`bun run normalize <id>`), or the video plays noticeably quieter than everything
else in the feed. Re-measure **after** encoding.

### The bed level belongs to a TRACK, not to the channel [craft]

"Music at 10%" was tuned by ear on one track measured at −9.1 LUFS. Another track
measured −17.0 LUFS on the part that actually played (7.9 LU quieter) and at the
same 0.1 viewers reported the music too quiet.

- **Measure the segment that plays, not the whole song.** Cinematic tracks build:
  one measured −14.5 LUFS over the whole song, −17.0 over the 0–122 s actually used
  (its climax came after minute three). Using the whole-song number left the bed
  2.5 dB short.

  ```bash
  ffmpeg -hide_banner -t <seconds of the edit> -i public/music/<file>.mp3 \
    -af ebur128=framelog=quiet -f null -
  # gain = 10^((I_reference − I_new) / 20)
  ```
- **Then an ear factor, tied to the track's TEXTURE.** A flat ambient pad at the same
  LUFS sounds quieter than a track with clear attacks (the ear has nothing to hold).
  Do not carry an ear factor to a new track: one tuned for an ambient pad, copied onto
  a track with plucked piano and cello, buried the voice. Reset to a neutral factor
  and raise by ear. Past a point the music eats the voice's consonants.
- **Lowering the bed makes the voice louder**, because normalization pulls the whole
  mix back to target. One fix is enough; do not compensate elsewhere.
- **One video too loud?** Use a per-video bed gain. Never change a shared constant to
  fix one video: that changes every published video's mix on re-render.

### Measuring the bed on the ENCODED file [craft]

`musicUnderVoiceDb` is a floor, measured like this: cut the audio into 200 ms
windows, take the RMS of each, and compute **90th percentile minus 10th percentile**.
P90 approximates the loudest voice; P10 the music alone between sentences. A narrow
spread means the music sits close to the voice. On seven encoded videos the spread
ran 11.5–19.9 dB; the channel's best video sat at 12.1. **Narrow is not bad by
itself**: 9 dB is the floor that catches a bed swallowing the voice, not a target.
Warn, do not block.

Do **not** measure "music-only" windows cut by script timestamps: timestamps do not
match where the sound actually ends, the "music" windows contain voice, and the
subtraction flips sign (one result claimed a voice at −90 dB). Percentiles need no
timestamps.

### Three length ceilings: do not merge them [hard]

| Ceiling | Value | Nature |
| --- | --- | --- |
| Pacing | ~90 s | **soft**: past it the edit starts to drag; break it if the content earns it |
| Music | the bed file's length | **hard** for a play-once bed: past it you hear the loop seam mid-sentence, unfixable in the mix |
| **Platform** | **180 s** (`maxDurationSeconds`) | **hardest**: a YouTube upload over 3 minutes is not a Short |

A 195.5 s video was published as a regular video because of the third ceiling. The
music ceiling had been checked carefully; the platform one never was, because the old
"over limit" warning fired at 90 s on almost every video and became noise nobody read.
The ceiling warning is printed **last**, in its own block, after the long timing log.

`total − outroHold ≤ music length` for a play-once bed (by then the bed has faded).
A bed declared as a **designed loop** has no ceiling: check which one you have before
concluding you need longer music (a wrong conclusion once moved a video to a CC BY
track, taking on an attribution duty for nothing).

### Cutting a loop [craft]

- **The LENGTH must be a whole number of bars.** "0 to 40 s" is round for people, not
  for music: measured at ~136 BPM, 40.00 s was 22.47 bars, 0.84 s off the bar line:
  a stumble every loop. 23 bars = 40.94 s looped clean. Only the length must be whole
  bars; the start point need not be.
- **Measure BPM, do not guess it**: autocorrelate the energy envelope over 50–200 BPM;
  peaks appear at the beat and the half-beat; take the one consistent with both.
- **Fade 60–80 ms at each end** against amplitude clicks; longer is an audible gasp.
- **A building track: cut its sparse opening and crossfade the loop.** One track
  rose 6.4 LU from start to end; spread under a short it got louder toward the end
  and "the music drowns the voice" in the second half. Take the first ~40 s (skipping
  the fade-in from silence), loop it with ~2 s crossfades, and re-measure the result.
- **Write down where seams fall** in the edit, so a reviewer knows where to listen.
- **Looping is modifying the work.** CC BY requires stating changes ("cut and
  looped") next to the attribution.

### Implementation traps [craft]

- `<Audio loop>` resets the frame passed to a `volume` callback each loop, so the
  final fade never runs. Compute the envelope from `useCurrentFrame()` at the
  composition root and pass a **number**.
- Rename music files to ASCII; non-ASCII names and brackets break `staticFile`. Keep
  the source's id or ISRC in the name: it is the only path back from the file to its
  licence page. A file called `bgm.mp3` sat unchecked for three videos because nobody
  could tell what it was.

### SFX: accents, same economics as the strong word [default]

- **4–5 per video at most** (`sfxMaxPerVideo`). Scattered evenly, the video turns
  into a meme video and loses the authority the serious part built.
- **Where the SITUATION is funny**, not where the video needs cheering up. The SFX
  says what the viewer is already thinking.
- **Anchored to a WORD**, not to seconds, so it follows script edits.
- **Never over a sentence or over an exclamation**, which needs silence to land.
- **Normalize per file.** Seven SFX files spanned −6.5 to −17.8 LUFS; one shared
  volume made one deafening and one inaudible. Target ~−20 LUFS, just under the voice.
- **SFX licences are usually the gap.** Meme sounds (game sound effects, viral clips)
  have owners; "nobody gets punished" is not a licence. Use CC0 or clearly licensed
  libraries, or record the debt in the video's credits.

How-to, the bundled CC0 pack (`whoosh`, `pop`, `tick`, `boom`, `ding`, `riser`, `glitch`, `drop`)
and worked cases: [`docs/sfx.md`](../sfx.md).

## 8b. Music licensing and Content ID: rules, not suggestions [hard]

Every track must be valid on **every** platform you post to.

- **No released commercial music.** Anything on streaming services is registered
  and fingerprinted.
- **A remix is heavier than the original, not lighter.** The remixer owns nothing to
  re-license; you need two permissions instead of one, and the fingerprint still
  matches.
- **Cutting short exempts nothing.** There is no "under N seconds is fine" in
  copyright law, and fingerprinting matches in seconds.
- **"Not taken down" is not "allowed".** A file ripped from a video and baked into the
  audio is outside every platform music library: the platform cannot license what it
  does not know exists.
- **A platform's music library is valid only inside that platform.** To use one, add
  the track **in the app** and export your edit **without** music.
- **Content ID risk differs by platform.** YouTube has a claim-and-dispute flow;
  TikTok and Instagram mostly do not (at worst they mute silently). A track that is
  "licensed but registered in Content ID" can justify a per-platform render with a
  different bed: and then a different description, because one render's attribution
  must not appear on the other.
- **CC BY attribution is a CONDITION of the licence**, not politeness. Without it the
  licence does not apply, and the author can claim the video. Use the author's string
  **verbatim**, as **text** (description or pinned comment): on-frame credit is valid
  for the licence but useless for Content ID, which does not read pixels. Some
  authors register their CC BY tracks in Content ID on purpose: a claim is then the
  system working; paste the attribution as text first, then dispute, per video.
- **"Royalty-free" is not "clean".** Free sites carry user re-uploads of copyrighted
  music. Record the **track URL and licence name** in credits, not just the title.
- **A licence certificate proves the site licensed it, not that it is clean**: the
  certificate itself says the site does not guarantee uploaders hold third-party
  rights. "DMCA-free" on an author page is advertising, not a measurement. "This is
  my own music" is a claim; record it as a claim and test it.
- **Test in the exact shape you publish.** A Content ID test on a horizontal 640×360
  black-screen clip reported "claim, no effect on video"; the real vertical Short with
  the same track was **blocked worldwide**, because owners can set a length limit for
  Shorts. A horizontal test predicts nothing about a Short. And non-blocking claims do
  not appear in the API for ordinary accounts: "the script says clean" is not
  evidence until someone looks at the Restrictions column in Studio.
- **Changing the music file does not fix rendered videos.** A licence decision takes
  effect only once every rendered file containing the old track is re-rendered.
- **If the operator decides to use an unlicensed track anyway**, the docs cannot veto
  them, but two things are mandatory: (1) the warning is written next to the bed
  constant in code, visibly; (2) the description carries **no** attribution line for
  it: writing a credit for a licence that does not exist claims a right you do not
  have, which is worse than silence.
- Never commit music you may not redistribute. `public/music/README.md` lists each
  file with source URL, licence and attribution string.

Good sources: CC0 / Pixabay Music (commercial use, no attribution, still check for
Content ID), CC BY artists who self-publish (attribution required), or a
subscription library that covers all platforms and issues claim clearances.
