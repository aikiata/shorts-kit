# Promo rules: ads and TVCs

A **promo** (`video.json` → `"mode": "promo"`) sells or announces something: a
product launch film, a feature teaser, a vertical ad. It shares the pipeline's
engine with a short (Remotion, `src/shared/`, render → normalize → encode) but not
its channel rules. SOUL's story rules (facts-before-words, "end on the turn", the
tension pass, strong words) are written for a knowledge channel and do **not**
apply here. The hard rules do: licences, safe zones, encode spec, never auto-publish.

These are starting defaults taken from one real launch film and from product films
reworked after feedback. Tags as in SOUL: **[hard]**
platform or law, **[craft]** a general lesson, **[default]** a taste that worked.
Change one with `sk-improve` and log it.

Case-law rules for the picture, camera, rhythm and clarity (with the precedent and a self-check for
each, and the hand-off review pass): [`aesthetics.md`](aesthetics.md). Named motion recipes:
[`../shots/`](../shots/).

## Format

| | Vertical ad | TVC / landscape |
|---|---|---|
| `video.json` | `portrait` · `promo` | `landscape` · `promo` |
| Canvas | 1080×1920, 30 fps | 1920×1080, 30 fps |
| Safe area | platform bands and button rail (§7a) | 5% title-safe margin, no rail [hard] |
| Captions | on (running captions), bottom 24% | off unless the video is voiced; bottom 12% |
| Where posted | TikTok, Reels, Shorts ads | site, YouTube, event screens, social feed |

Choose the format first, from where it will be watched. One file is not cropped
into the other: re-compose, because a 16:9 frame cropped to 9:16 loses the sides
and a 9:16 frame in 16:9 leaves two empty bars.

## Rules

0. **Start from the user's pain, then reveal the product.** The film opens on the
   moment the target user feels the problem, in their words, and the product enters as
   the turn. No pain, no turn, no reason to watch. Check there is a visible before and
   after (the source film: a garish broken dashboard, then "Just use Knowns UI."). A
   tour of features in order is not a promo. [craft]
1. **State the one thing.** One sentence: what the viewer should do or remember.
   Every shot serves it; a beautiful shot that does not is cut. [default]
2. **Real product, real pixels.** Show the actual page, screen or object, not a
   mock-up in its place. A third-party page or image is a third-party image: its
   licence is checked at the brief (SOUL §5). [craft]
3. **Pace by picture, not by sentence.** A shot lasts as long as its job. No
   scene is the length of a narrated sentence unless the film is voiced. [craft]
4. **Cut on the beat, sparingly.** If there is music, the grid is measured, not
   guessed, and checked against the audio at both ends of the track (a tracker's
   tempo was off by 0.0106 s per beat in the source film: the cuts drifted 0.2 s
   by 20 s in). At most **3 full-frame beat hits** in a film. [craft]
5. **One sound per cut, never stacked.** A whoosh under an impact, or two hits on
   one cut, reads as noise. Impacts about 9 dB below full scale, 8 ms fade-in,
   low-passed around 7 kHz. If a person says it sounds harsh, lower it. [craft]
6. **Mix.** Source film: about −16.7 LUFS integrated, true peak ≤ −1 dBTP after
   encode (AAC overshoots 0.2–0.6 dB). Voiced vertical ads follow SOUL §8
   (−13 LUFS). [default]
7. **No frame that looks broken.** No red error state in the montage, no dip to
   an empty frame, no static hold longer than the shot's job. [craft]
8. **Look at a strip, not only frames.** A single frame hides tiling, dips and
   dead holds. Review a 5 fps contact sheet of the whole film and a 15 fps strip
   around every cut, ideally by a reviewer who did not make it. [craft]
9. **Render safely.** Chrome tiled whole frames in the source film when render
   tabs ran in parallel, with `mix-blend-mode` on large layers, or CSS `filter` on
   perspective-transformed layers. Use `--concurrency=1`, no blend modes or filters
   on 3D layers. A 3D scene that needs real GL (the globe) is rendered with GL on
   and checked on a strip. [craft]
10. **Never auto-publish.** The pipeline ends at `out/<id>/`; the user posts. [hard]

## Gates before the build

A launch film for a developer tool was built three times. Each miss would have shown up on paper or in a rough cut,
long before scene code: attempt 1 was the wrong concept (a feature tour), attempt 2 was the right
concept at the wrong pace (not understood, too fast). These four gates catch those misses while
they are still cheap. Each gate's answer is written in the brief (`briefs/_template-promo.md`).

11. **Objective before ideas.** The brief states, before any concept: the **objective** (awareness,
    install, sign-up, launch announcement), the **one measure** that says it worked (installs,
    click-through, watch-through, or "the owner shows it at the event"), the **CTA** in its exact
    words, the **mandatories** (logo, product name, URL or command, legal lines, anything the owner
    requires) and the **placement**. Without an objective, nobody can tell a good cut from a
    bad one. [craft]
12. **Placement sets the opening.** A **feed ad** (paid or organic, in a scrolling feed) has about
    2 s before the thumb moves: the pain is on screen in large type within the first 2 s, and the
    product name or mark is visible by 5 s (a small corner mark counts; the full reveal can still come
    later, rule 0). A **launch film** (site, event screen, a page the viewer chose to open) can hold the
    pain longer and reveal later. Write which one it is; a film made for both gets two cuts (rule
    14). [default]
13. **Two or three concept routes, then pick one.** Before the treatment, write 2-3 routes, each in
    one sentence plus its key frame (the before/after picture, C4) and how it shows the pain. The
    owner picks one; the rejected routes and why they lost stay in the brief. The treatment (C8,
    scene by scene) is written only for the chosen route. A feature tour is not a route. [craft]
14. **Animatic before scenes.** A full-length, timed rough cut in Remotion: each scene a plain card
    (its big type and a box or a still for the picture), the real music on the measured grid, a
    scratch voice if the film is voiced (`bun run voice` / `bun run tts`). Render it and have the
    owner watch it at full speed. Run the "before" comprehension test (C8) on it, with someone who
    has not seen it. Pace, order and understanding are fixed here. Scene code starts only when
    the animatic passes. Keep it as `src/videos/<id>/` at its first commit, or as an
    `animatic` composition, so the cut can be compared later. [craft]
15. **Deliverables matrix at the brief, not at the end.** List every file the owner needs: the
    master, plus any cutdowns (6 s bumper, 15 s, 30 s), every format (9:16, 16:9, 1:1, 4:5),
    captions on or off, with or without sound. A cutdown is **re-edited, not chopped**: it keeps
    pain, product and CTA in its own length. A 6 s cut has no room for the before/after, so it is
    pain line, product, CTA. Each extra format is re-composed (see Format). Each cutdown or format
    is its own composition and is checked like the master (stills, strip, ffprobe). File names:
    `out/<id>/<id>-<len>s-<format>-upload.mp4`. [craft]

## A promo with no voice

`bun run new <id> --voice none [--format portrait|landscape] [--scenes hook,demo,cta]`
scaffolds `src/videos/<id>/` from `_template-promo/`: no narration, no TTS, no flow.
The clock is `promo.json`, written by hand:

```json
{"bpm": 120, "offset": 0, "tail": 1, "fade": 0,
 "music": {"src": "music/track.mp3", "volume": 0.8, "fadeOut": 1.5},
 "scenes": [{"id": "hook", "beats": 4}, {"id": "demo", "seconds": 6.5}]}
```

- A scene lasts `seconds` or `beats` (needs `bpm`). Beats go through cumulative
  time, so a long film does not drift by rounding.
- Cue a sound or a shot with `frameAtSceneBeat(PROMO, FPS, "demo", 4)` (drift-free,
  relative to the scene start), `frameAtBeat(...)` (on the music's grid) or
  `frameAtScene(...)` (seconds after a scene starts). Never type a frame number.
- `bun run lint <id>` checks the clock and the files it points at, not the story.
- `normalize` and `encode` use the promo targets (`promoLoudnessLUFS`,
  `promoTruePeakMaxDb`) and skip the voice-spread check and the 180 s ceiling.
- Checked end to end on a 13 s landscape film: scene edge at frame 60 (4 beats at
  120 BPM), sound cues at 2.0 s and 8.0 s, upload file passes every ffprobe check.

A voiced promo (voice-over) is a normal `--mode promo` video: it keeps `voice.json`.

## Tools

- `bun run beats <file>`: measures the grid from the kick onsets and checks it at both
  ends of the track. On the source film's track it gave 119.952 BPM, drift −3 ms; the
  tracker file next to it said 117.45 (2.1% off). A track with no clear kick (28-34% of
  onsets on the grid in two of three tried) is reported, not forced.
- `bun run capture <id> <url> --name <n> [--mobile] [--full] [--select "css,css"] [--list] [--type "css=text"] [--hide "css,css"]`:
  real pixels of a real page via the Chrome Remotion already has. `--mobile` gives the
  site's own 9:16 layout; `--list` prints the sections to pick selectors from;
  `--type` focuses an element and types into it as a person would (the page's own search runs; a state the
  URL does not hold); `--hide` removes overlays such as a consent banner from the picture **without answering
  them** (never accept a banner to get a clean shot); `src/videos/<id>/capture.json` records url, date and licence.
  A search typed at human speed is one capture per prefix: see `docs/shots/interaction/typed-prefix-states.md`.
- `CapturePan` (`src/shared/frame/CapturePan.tsx`) pans and pushes through a capture in
  the capture's own pixels, and never uncovers an edge.
- `bun run voice <id>`: a promo's few spoken lines (`promo.json` → `voice.lines`, each placed in a scene by
  seconds or beats; a line written for a cutdown only carries `"only": ["Cut16"]`, the composition ids it plays
  in, and stays out of the master and its timeline), one ElevenLabs request per line with word times, so type and shots can land on a
  spoken word (`voiceWordFrame`). Music ducks under a line and can be cut to silence for a held breath.
- `bun run css <id> [--dir <folder>]`: compiles a video's Tailwind v4 stylesheet, for a video that uses **real
  components**: Knowns UI in `src/videos/<id>/knowns-ui/` (default), or a product's own components copied into
  another folder (`--dir mg-ui`, see `real-ui.md` "The product's own repo"). Controlled by props, animations off.
- **Real components.** `real-ui.md`: how to run a product's own components inside Remotion deterministically.
- A promo longer than its music: `music.repeatEvery` restarts the track every N seconds (a whole number
  of bars of the measured grid, 14 bars = 56 beats) and crossfades; the beats of the two copies line up.
  Listen at the seam: an equal crossfade of two different passages dips about 5 dB.
- Brief template: `briefs/_template-promo.md` (objective, pain point, routes, treatment, animatic, deliverables).

## What is not built yet

- a virtual clock for captures (captures are still images: a page that animates is not
  recorded as motion);
- `scripts/strip.ts`, `sk-review` (the strip was made by hand with ffmpeg);
- promo lint for a voiced promo (lint still applies the short rules to the script);
- an animatic scaffold (rule 14): build the cards by hand in the video's `scenes.tsx` for now;
- cutdowns and extra formats (rule 15): `bun run render` only renders the composition `Video`
  (`scripts/remotion.ts`). Until it takes a composition id, register each cut in the video's
  `entry.tsx`, render it with `bunx remotion render src/videos/<id>/entry.tsx <CompId> <file>
  --concurrency=1`, then normalize and encode that file and name it by hand.

## Change log

| Date | Change | Why |
| --- | --- | --- |
| 2026-11-09 | storyboard for a voiceless promo (shots pinned to scene + beat); preview reads promo.json, landscape and every deliverable | the shot list of a promo lived only in the brief: nothing to approve shot by shot, nothing on a timeline |
| 2026-11-09 | rules 11-15: objective/CTA/mandatories/placement, feed-ad opening, concept routes, animatic gate, deliverables matrix | a launch film took three builds: wrong concept, then right concept not understood. Both could have been caught on paper or in a rough cut. Compared with a standard agency TVC process, these were the missing gates |
| 2026-11-09 | `capture --type/--hide`, `css --dir`, the product's-own-repo recipe, isometric and typed-prefix cards | the MacGrove ad needed a search state the URL does not hold, a consent banner out of the picture without answering it, and then the site's own components |
