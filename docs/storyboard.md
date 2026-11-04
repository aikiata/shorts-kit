# Storyboard: the shot list between the voice and the scenes

The storyboard is the plan for every camera shot: what is on screen, how the camera
moves, how the shot begins, which word it starts on. The agent writes it **after
`bun run tts`** (shots follow the real voice) and you approve it **before any scene
code** is written. Building Remotion scenes from an approved list is fast; building
them from a plan that lives only in the agent's head is where most rework came from.

```bash
bun run storyboard <id> --init   # one planned shot per narration line, to fill in
bun run storyboard <id>          # print the shots with their times, and what to fix
bun run preview                  # Storyboard tab: each shot with its line, still and playback
```

`bun run lint <id>` also checks it.

## Schema: `src/videos/<id>/storyboard.json`

```json
{"shots": [
  {"id": "s01", "line": 0, "anchor": null,
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
| `anchor` | optional word or phrase inside that line where the shot starts; default the line start |
| `camera` | what the camera does, in plain words, with numbers when they matter |
| `onScreen` | the world, the figure, what appears or changes during the shot |
| `text` | on-frame text, data only (a number, a name), or `null` (§7c) |
| `visual` | a visual type id from `docs/visuals/` |
| `transition` | how the shot begins: `cut`, `crossfade`, `continuous` (the same move carries on), `reveal` |
| `sfx` | a bundled SFX id or a file in `public/sfx/`, cued at the shot start ([`sfx.md`](sfx.md)) |
| `notes` | anything the builder must know |
| `status` | `planned` → `approved` (you said yes) → `built` (the scene exists and a still was checked) |

**No times are stored.** A shot starts at its line (or anchor word) as timed in
`voice.json` and ends where the next shot starts. A new TTS run moves every shot with
the voice, and an anchor that no longer exists in its line is an error.

## Rules

1. **Plan against the real voice.** An estimated `voice.json` makes estimated shots.
2. **Every shot moves** (§12): "static" is not a camera value. A held image still gets a
   slow push or drift.
3. **Anchor the change to the word that names it** (§12a). "Molecules fade in on
   `molecules`" is a plan; "molecules appear in this shot" is a guess.
4. **One world, many framings** for `illustrated-scene` and `satellite-map`: prefer
   `continuous` over `cut` when the picture is the same place.
5. **On-frame text is rare** and never a copy of the caption (§7c).
6. **Approval is explicit.** Shots stay `planned` until you approve them; the agent
   builds only `approved` shots and marks them `built` after looking at a still.
7. **Changing the plan after building** means editing the storyboard first, then the
   scene, so the file stays the truth.
