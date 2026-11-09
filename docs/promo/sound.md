# Promo sound design

Sound is a timeline asset. Keep every effect in **one central cue table** (frame, source,
volume, and a comment naming the picture action it belongs to); scenes never embed audio.
For the bundled pack and the how-to see [`docs/shots/sfx/`](../shots/sfx/README.md); for loudness and music
licences see [`docs/soul/06-audio.md`](../soul/06-audio.md). This file is the promo method.

## Method

1. At the storyboard, write down for each shot the action, the material, the length and the
   timbre wanted. Pin exact frames only **after the picture is locked** (S3).
2. Lay the music first: it sets the energy. A strong kick already carries the beat, so do
   not add an impact on every beat.
3. Pick effects by film type and by real sound source: whoosh (camera moves), impact
   (landings), riser (build-up), sparkle (light effects), transition (cuts). Any action with
   a recognisable sound gets its own real-world sound (S4).
4. Audition every candidate **inside the cut**. Download counts, ratings, descriptions and
   waveforms are evidence for a shortlist; never write "listened" for a file nobody played.
5. Keep third-party effects as fixed local files with a record of source, author, licence
   and hash. The renderer reads local files only and never fetches audio at render time.
6. Derive the cue table from the shot list, and re-check every cue after any change to the
   timeline.

## Rules, with their cases

**S1. Choose music and effects by film type, not by event: a strong electronic kick bed
and a cinematic effect vocabulary; no game-pack timbres.**
Product films use whoosh, impact, riser, sparkle and transition. Pick a music candidate by
laying it under the cut, never by listening to it alone. What is banned is a *timbre* (synth
plucks, cartoon bounces, game-over scales), not an *action*: if a click, switch or shatter
is on screen, give it a real-world sound. The test: does it sound like the real object
(a shutter, a mechanical switch, glass, paper) or like a game engine's feedback beep?
*Case:* a reviewer said music and effects "sound like a game" and asked for strong,
rhythmic music and typical product-launch effects. Every game-pack sound was replaced with
a tech-house bed and cinematic effects.
*Check:* with eyes closed, does the track sound like a product launch or a phone game? Was
the music chosen in the cut? Is each UI sound a real object or a feedback tone?

**S2. Pin every effect to a frame. For repeated sounds, alternate two samples, step the
volume down, and let the gaps accelerate.**
A declarative table of frame, source and volume, with a comment per row, replaces
"sprinkling sounds by feel". Against a machine-gun effect: two samples alternating; volume
stepping down along the sequence (for example 0.40 → 0.25 over six); gaps that follow the
animation's acceleration. When the hits get too dense to tell apart, fade them into a swoosh.
Pitch-shifting a sample is not a fix.
*Case:* a request to give each of a row of appearing items its own sound. The result was a
frame table, a two-sample alternation, gaps closing from 8 to 3 frames, and a six-hit
volume staircase.
*Check:* is each cue pinned to a frame and commented? Does a repeated passage sound like a
countable rhythm or a mechanical repeat?

**S3. Do sound after the picture is locked. When the timeline moves, re-pin the whole table.**
Any change to a shot's length or order ends with re-checking every cue. A/V drift is a
pre-delivery check. Selecting sounds can happen early; exact frames cannot.
*Case:* "after these changes, re-adjust the effects to the new timeline". Lesson: a first
pass pinned in one evening was invalidated by a big picture change eleven hours later;
two of three re-pins were pure rework cost.
*Check:* did any shot change length or order this round? If so, was every cue re-checked?

**S4. Foley before decoration: give an action its real sound, and trim the audio to exactly
the action's length.**
Typing gets keyboard sound; items landing one by one get one pop each. A generic swoosh does
not cover a recognisable action. Trim long samples to the picture segment. Measure a newly
downloaded file to choose its play window and gain. A sample over 5 s needs an explicit
duration; ambience is laid for the length of the shot; an impact keeps its natural reverb
tail. A quiet source (peak under -12 dB) can still be buried by the music even at volume 1.0:
prefer a cleaner file or pre-process it, then check the peak on the render.
*Case:* a request for typing sounds when text appears. A keyboard sample was trimmed to
24 and 44 frames for two uses.
*Check:* does every recognisable action have its own sound? Does any effect ring on after
the action ends? Is each effect audible in the final mix?

**S5. A/V alignment has two offsets: the output audio offset (measured per render
pipeline) and each source's own peak lag (measured per file).**
The whole audio track of a render lags the video by a fixed amount. The cause is in the
output encode and mux chain, not in the audio component: AAC encoders add priming samples,
typically 2048 at 48 kHz, about 1.3 frames at 30 fps. Measure it for **your** pipeline
(video tool version, codec, sample rate, container): render, extract the track, and
cross-correlate two or three sharp effects with their source files; only consistent residuals
count. Do not carry the constant across pipelines. Then:

```
Sequence.from = target peak frame − source peak lag (frames) − output offset (frames)
```

Compute in floating point and round at the last step. Uncompensated, the two add up and the
heaviest hit can land a quarter second late; in a beat-synced film a 2-3 frame error is
enough to make a reasonable beat effect read as random shake.
*Case:* on one pipeline a click lagged 2032 samples and an impact 2066 (about 1.3 frames),
matching AAC priming; an older pipeline measured 4 frames, a different cause. In our own
earlier film the track lagged about 55 ms (1.7 frames) and was trimmed in the re-encode.
*Check:* is the output offset measured for this pipeline and recorded with its versions? Is
the compensation applied in one formula, not scattered over frame numbers? Was each sharp
source's peak lag measured?

## Choosing and checking sources

| Picture | Search for | Look for |
|---|---|---|
| card flying in, camera move | `short soft whoosh` | where the attack peak sits; no long tail |
| paper card sliding, page turn | `dry paper slide`, `single page turn` | real paper, one action |
| switch, light tap | `mechanical switch click` | short physical feel, not a notification tone |
| wordmark landing | `short cinematic impact` | weight, but low end that does not bury the music |
| typing | `computer keyboard typing` | density, length of the passage, noise floor |
| assembly and aftermath | `cinematic riser`, `subtle shimmer` | does the build reach the landing; natural tail |

- Be specific: name the source, the texture, the attack length and the tail. A bare `click`
  or `impact` returns noise.
- Two names or two ids can be the same recording. Compare file hashes to find identical
  files, then listen to confirm they differ. Two encodings of one recording can hash
  differently. A renamed copy is not a second sample for alternation.
- Check every UI sound one by one. Real switches, shutters, glass and paper are good;
  `confirmation tone`, `bleep` and `notification` are usually synthetic feedback and are
  used only when the film deliberately shows a system message (write the reason down). A
  clear description of source and device is a clue; "made with my mouth" or "built-in mic"
  rarely suits a clean product film.
- Take only the candidates the current action needs; do not download a library.

## Pinning

- Write a cue as `shot start + offset` (or a beat number on a beat-synced film), never a
  bare absolute frame in a new project: when a shot moves, its cues follow. Cues whose
  action moved *inside* the shot still need a check.
- The analysis of a file gives a 10 ms RMS energy peak, the sample peak and the overall RMS.
  It is **not** LUFS or true peak. For a source with several hits or a build, choose the
  semantic landing by ear; the loudest sample in the file is not each action's landing.
- Phrase for closing a shot: riser during assembly, impact on the landing, sparkle on the
  aftermath. Place the three by the shot's real landing; use it only when the storyboard
  calls for it, not on every ending.
- Music: `volume` is a multiplier, not a loudness target. Fade in and out with an
  interpolation; with a voice-over, duck the music while it speaks. A film with a music bed
  should be delivered both with and without the bed (effects kept). Check clipping and
  masking after layering. Music licences are separate from effect licences.
