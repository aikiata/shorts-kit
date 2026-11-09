# Storyboard: the shot list between the voice and the scenes

The storyboard is the plan for every camera shot: what is on screen, how the camera
moves, how the shot begins, which word it starts on. The agent writes it **after
`bun run tts`** (shots follow the real voice) and you approve it **before any scene
code** is written. Building Remotion scenes from an approved list is fast; building
them from a plan that lives only in the agent's head is where most rework came from.

```bash
bun run storyboard <id> --init   # one planned shot per narration line, to fill in
bun run storyboard <id>          # print the shots with their times, and what to fix
bun run storyboard <id> --sync   # after every tts / cut: re-pin shots to their lines
bun run preview                  # Storyboard tab: each shot with its line, still and playback
```

`bun run lint <id>` also checks it.

## Schema: `src/videos/<id>/storyboard.json`

```json
{"shots": [
  {"id": "s01", "line": 0, "lineText": "Sunlight looks white, so why is the sky blue?", "anchor": null,
   "size": "WS", "angle": "eye",
   "camera": "slow push in over the whole video (zoom 1.00 to 1.05)",
   "onScreen": "empty day sky over a calm sea, sun upper right",
   "text": null, "visual": "illustrated-scene", "transition": "cut", "sfx": null,
   "notes": "", "status": "planned"}
]}
```

| Field | Meaning |
| --- | --- |
| `id` | stable shot id (`s01`, `s02`, …); scenes and stills can refer to it |
| `line` | global narration line index (0 = the first line of the video) |
| `lineText` | the line's on-screen text when the shot was planned (written by `--init` and `--sync`, never typed) |
| `anchor` | optional word or phrase inside that line where the shot starts; default the line start |
| `size` | framing: `WS`, `MS`, `CU` or `ECU` ([`shots/sizes.md`](shots/sizes.md)); every shot has one (lint warns on a shot without), and lint warns when three shots in a row share one |
| `angle` | optional: `eye` (default, leave out), `high`, `low`, `top`, `tilt` |
| `card` | optional shot card from [`shots/`](shots/), a named motion recipe (`crash-zoom-punch`, `tension-camera`); lint warns on an unknown card. Name one whenever the shot is a card, so its parameters can be checked against it |
| `camera` | what the camera does, in plain words, with numbers when they matter |
| `onScreen` | the world, the figure, what appears or changes during the shot |
| `text` | on-frame text, data only (a number, a name), or `null` (§7c) |
| `visual` | a visual type id from `docs/visuals/` |
| `transition` | how the shot begins: `cut`, `crossfade`, `continuous` (the same move carries on), `reveal` |
| `sfx` | a sound card id from [`shots/sfx/`](shots/sfx/README.md) or a file under `public/sfx/` (give it a card with its licence), cued at the shot start; lint warns on an unknown id or a file with no card |
| `notes` | anything the builder must know |
| `status` | `planned` → `approved` (you said yes) → `built` (the scene exists and a still was checked) |

**No times are stored.** A shot starts at its line (or anchor word) as timed in
`voice.json` and ends where the next shot starts. A new TTS run moves every shot with
the voice, and an anchor that no longer exists in its line is an error.

**The line is pinned by its text.** `line` is only a position: insert a sentence and
every later shot would point at the wrong line, still `approved`. So each shot keeps
`lineText`, and after every `bun run tts` or `bun run cut` (both remind you) run
`bun run storyboard <id> --sync`:

| What happened to the line | `--sync` does |
| --- | --- |
| moved (a sentence inserted or removed before it) | moves the shot with it, status kept |
| rewritten (new words, a spelling fix, a re-cut) | keeps the shot, sets it back to `planned`, notes the old line |
| removed | moves the shot to `removed` (delete its scene code if it has any) |
| new line with no shot | adds a `planned` TODO shot |

Lint fails an `approved` or `built` shot whose `lineText` no longer matches its line:
an approval covers the sentence it was given for, not whatever sits at that index now.
The text compared is the **on-screen** text (with `spelling` applied), the same the
preview shows and the captions render.

## A promo with no voice

A voiceless promo has no narration lines to pin to, so its shots are pinned to a **scene of
`promo.json`** and a point inside it, in `beat`s (needs `bpm`) or `seconds`, from the scene start
(default 0). A shot still ends where the next one starts, so a change to the clock moves every shot.

```json
{"shots": [
  {"id": "s01", "scene": "wrong", "beat": 0, "size": "CU", "card": "crash-zoom-punch",
   "camera": "punch in to the red diff on the stamp", "onScreen": "the setup wizard the agent built",
   "text": null, "transition": "cut", "sfx": "glitch", "status": "planned"},
  {"id": "s02", "scene": "wrong", "beat": 6, "size": "MS", "camera": "...", "onScreen": "...", "status": "planned"}
]}
```

`bun run storyboard <id> --init` writes one planned shot per scene; split a scene by adding shots
with a later `beat`. `--sync` after editing `promo.json`: a shot whose scene was renamed or removed
moves to `removed`, a new scene gets a TODO shot. Lint (`lint-promo`) checks scenes, order, that a
shot starts inside its scene, sizes and cards. The preview shows the shots on the Storyboard and
Timeline tabs, with thumbnails cut from the render.

## Rules

1. **Plan against the real voice.** An estimated `voice.json` makes estimated shots.
2. **Vary the size.** Escalate, punch or release at a beat; never three shots in a row at
   the same size ([`shots/sizes.md`](shots/sizes.md)).
3. **Every shot moves** (§12): "static" is not a camera value. A held image still gets a
   slow push or drift.
4. **Anchor the change to the word that names it** (§12a). "Molecules fade in on
   `molecules`" is a plan; "molecules appear in this shot" is a guess.
5. **One world, many framings** for `illustrated-scene` and `satellite-map`: prefer
   `continuous` over `cut` when the picture is the same place.
6. **On-frame text is rare** and never a copy of the caption (§7c).
7. **Approval is explicit.** Shots stay `planned` until you approve them; the agent
   builds only `approved` shots and marks them `built` after looking at a still.
8. **Changing the plan after building** means editing the storyboard first, then the
   scene, so the file stays the truth.
9. **Changing the words means syncing the storyboard.** Script edit, TTS re-run, new cut:
   `--sync`, then re-check and re-approve the shots it set back to `planned`.

## Change log

| Date | Change | Why |
| --- | --- | --- |
| 2026-11-09 | `card` field; a shot without `size` is a lint warning; storyboards for voiceless promos (scene + beat); the preview shows size, angle, card and size runs | the size rule could not be checked on shots without a size (the example has none); shot cards had no place in the plan; a promo's shot list lived only in the brief |

