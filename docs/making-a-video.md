# Making a video: the runbook

> **This file holds no rules.** Rules are in [`SOUL.md`](../SOUL.md) and `docs/soul/`.
> This is the runbook: what to type, what it produces on disk, and how to check it.
> Where this file and a § disagree, the § is right.

The agent skill `sk-pipeline` walks these steps; each step names the skill that does
the work. You can run every command by hand.

## The principle: evidence is ON DISK

`exit 0` is not evidence. Every step has a **Check** row: do it, do not infer success
from the absence of an error. Three silent-failure shapes that really happened:

| Shape | Real example |
| --- | --- |
| right command, **wrong tool** | a video read with the wrong TTS engine: a different voice, 19% slower |
| a loop that **ignores exit codes** | `for f in …; do ffmpeg …; done` swallowed an error; one file was 199 ms long |
| a check that **reads only the success branch** | an API 403 error block was shown as "0 results" |

## Commands

| Command | Does |
| --- | --- |
| `bun run new <id> --flow <X>` | scaffold `src/videos/<id>/` from `_template`, `narration.json` with the flow and its beats |
| `bun run dev <id>` | Remotion Studio on that video |
| `bun run tts <id> [--force]` | synthesise the whole script → `public/audio/<id>/voice.mp3` + `src/videos/<id>/voice.json` |
| `bun run lint <id>` | machine checks from `thresholds.json` + narration + facts |
| `bun run facts` | validate `docs/facts/*.json` |
| `bun run still <id> [--frame=N]` | render `out/<id>/still-<frame>.png` |
| `bun run render <id>` | render `out/<id>/<id>.mp4` |
| `bun run cover <id>` | render `out/<id>/<id>-cover.png` (+ jpg) |
| `bun run normalize <id>` | loudness to target → `out/<id>/<id>-loud.mp4` |
| `bun run encode <id>` | platform encode → `out/<id>/<id>-upload.mp4` |
| `bun run check` | code boundaries + `tsc --noEmit` |

Always run from the repo root.

---

## 0. Adapt SOUL (once per channel)

If the Change log at the end of `SOUL.md` is empty, the rules are still the source
channel's defaults. Read "This is your channel's soul", decide what you keep (voice,
strong-word threshold, palette, sentence lengths for your language), and record each
change with `sk-improve`. You can start making videos without it; you will just be
making someone else's channel.

## 1. Brief: `sk-brief`

| | |
| --- | --- |
| Do | copy `briefs/_template.md` to `briefs/<id>.md` and fill it |
| Produces | `briefs/<id>.md` |
| Check | the one-sentence idea exists; at least two shapes were considered and the rejected one has a reason; every claim has a visual type and every image a licence |
| Rules | §2 (flow), §5 and `docs/visuals/` (visual types and licences) |

⚠️ **This is the fork of the whole pipeline.** A wrong visual decision here means the
scene work is redone from scratch.

## 2. Facts: `sk-facts`

| | |
| --- | --- |
| Do | add records to `docs/facts/facts.json` and `sources.json`, opening each source page |
| Command | `bun run facts` |
| Check | 0 errors; every claim in the brief has a fact id; the brief cites ids, not numbers or URLs |
| Rules | §9, `docs/facts/README.md` |

No sentence is written before its claim has a `verified` record.

## 3. Scaffold

```bash
bun run new <id> --flow <X>
```

| | |
| --- | --- |
| Produces | `src/videos/<id>/` (`entry.tsx`, scenes, `Cover.tsx`, `timing.ts`, `narration.json` with the flow's beats) |
| Check | `flow` and `visual` in `narration.json` match the brief |

Pick the id once; it is the folder, the `out/` folder and every file prefix (§13).

## 4. Narration: `sk-narration`, then `sk-style`

| | |
| --- | --- |
| Do | write `src/videos/<id>/narration.json`: scenes, lines, a `fact` id per line, `pronounce`, `spelling`, optional second-language `caption` per line |
| Command | `bun run lint <id>` (runs before any TTS) |
| Check | 0 errors; every warning read; then the human passes: style (§3b), tension (§3c: first and last sentence of each scene, hook, payoff), viewer-knows-nothing (§3d) |
| Rules | §1–§3d, §4, the flow file |

## 5. TTS

```bash
bun run tts <id>
```

| | |
| --- | --- |
| Produces | `public/audio/<id>/voice.mp3`, `src/videos/<id>/voice.json` |
| Check | the log names the engine and voice you declared; duration ≤ 180 s; **listen to the whole file**; transcribe it and look for repeated words (loops); listen at every inserted pause for clipped syllables |
| Rules | §4 |

- Unchanged script and voice settings: no engine call. Use `--force` to re-read.
- Editing a line means re-running TTS (the whole script is one reading). Fix a loop or
  a mispronunciation by **rewriting the line** or adding `pronounce`, not by re-rolling.
- Then `bun run lint <id>` again: the duration checks need `voice.json`.

## 5b. Storyboard: `sk-scene`

After the voice, plan every shot and get it approved before writing scene code:
`bun run storyboard <id> --init`, fill it in, review it in `bun run preview`
(Storyboard tab), set the shots to `approved`. See [`storyboard.md`](storyboard.md).

## 6. Scenes: `sk-scene`

```bash
bun run dev <id>
bun run still <id> --frame=<n>
```

| | |
| --- | --- |
| Do | build scenes from `src/shared/` components; shots anchored to words (§12a) |
| Check | at least one still per scene **with the safe-zone overlay**, plus each frame where a chip or label appears; look at them. Delete old stills after fixing |
| Rules | §5, §6, §7, §12, the visual type files |

Measuring a source file (brightness of a clip, size of an image) only chooses where to
look; the conclusion is read on a rendered still.

Sound effects (optional, 2–3 per video): cue them to words with `frameAtWord`, see
[`docs/sfx.md`](sfx.md).

## 7. Render, normalize, encode: `sk-render`

```bash
bun run check
bun run render <id>
bun run normalize <id>
bun run encode <id>
```

| | |
| --- | --- |
| Produces | `out/<id>/<id>.mp4` → `<id>-loud.mp4` → `<id>-upload.mp4` |
| Check | frame count matches the timing; `ffprobe` the upload file: `yuv420p`, `color_range=tv`, BT.709 tags, 48 kHz, `moov` before `mdat`; loudness ≈ −13 LUFS **re-measured after encode**; voice-over-music spread above the floor; watch the file itself end to end |
| Rules | §8, §11 |

- Never pipe an encode into `head` (truncated mp4, exit 0).
- A render that "succeeds" with no file: run the renderer directly on a few frames
  (`--frames=0-9`) to see the real error; the package manager can swallow bundle
  errors. Re-running the same command is never the next diagnostic step; changing *how*
  you run it is. A short probe passing does not prove the full render: it only touched
  the first scene.
- A silent log does not mean dead or alive: look at files growing on disk.

## 8. Cover: `sk-handoff`

```bash
bun run cover <id>
```

| | |
| --- | --- |
| Produces | `out/<id>/<id>-cover.png` and `.jpg` |
| Check | crop to 1:1.29, scale to 200 px wide, look; **read the text aloud** and ask "meaning what?" |
| Rules | §10 |

## 9. Caption and pinned comment: `sk-handoff`

No command writes these; the agent writes them from the §11 templates.

| | |
| --- | --- |
| Produces | `out/<id>/caption.txt` (§11a), `out/<id>/pinned-comment.txt` (§11b) |
| Check | first line ≤ 100 characters and debatable; alternative counts pre-empted; every attribution verbatim from `sources.json`; no strong words; total ≤ 4,000 characters with hashtags |

## 10. Hand-off

`out/<id>/` holds `<id>-upload.mp4`, `<id>-cover.png`, `caption.txt`,
`pinned-comment.txt`. Walk the **pre-hand-off checklist in `SOUL.md`** (it is the only
copy; two checklists always drift). Then upload by hand (§11d): from the web, public
directly, cover set explicitly, pinned comment pasted at once.

## 11. After publishing: `sk-improve`

- In `briefs/<id>.md` → **Posted**: link, visibility, title used, date.
- One line in the **Cases run** table of `docs/flows/<flow>.md`: what was learned about
  the *flow*, and results once there are numbers.
- A new rule? Edit the flow file or the § (and `thresholds.json` if it has a number),
  add a change-log line, lint every video. Old videos are not rewritten.
- A video that gets no views: read
  [`docs/lessons/for-you-distribution.md`](lessons/for-you-distribution.md) before
  touching the content.
