# Files and namespaces

> Part of [`SOUL.md`](../../SOUL.md). This file holds **§13**. All **[craft]**: each
> rule prevents a silent overwrite or a lost file.

---

## 13. File rules

### Everything a video produces lives under a namespace named after it

This is not tidiness; it is about **silent overwrites**. Shot and asset names are
unique only *within* a video (`hook`, `middle`, `ridge`, `europe` are names waiting
to collide). Write them into one flat folder and the second video's `europe` replaces
the first one's, **with no error**, and you find out when a render shows the wrong
image.

| What | Path | Made by |
| --- | --- | --- |
| Brief | `briefs/<id>.md` | you, from `briefs/_template.md` |
| Scenes, cover, timing, narration | `src/videos/<id>/` | `bun run new`, then you |
| Generated timing | `src/videos/<id>/voice.json` | `bun run tts` (never hand-edited) |
| Voice audio | `public/audio/<id>/voice.mp3` | `bun run tts` |
| Per-video images and clips | `public/<kind>/<id>/…` | you |
| Renders, encodes, cover, hand-off text | `out/<id>/<id>*.mp4`, `<id>-cover.png`, `caption.txt`, `pinned-comment.txt` | `bun run render/normalize/encode/cover`, the agent |
| Stills for layout checks | `out/<id>/still-<frame>.png` | `bun run still` |
| Facts and sources | `docs/facts/*.json`: **keyed by fact id, not by video** | you |

**One id per video.** The folder name, the `id` in `narration.json`, the `out/`
folder and every file prefix are the same string. The source pipeline let an
internal key and a publishing slug coexist; it could never merge them again without
mass renames, every script had to map between them, and a lookup by the wrong one
returned an empty credit list that read as "no attribution needed". Pick the slug
once, at `bun run new`, and use it everywhere.

### Consequences, each of which happened once

- **No loose files at the root of `out/`.** `out/` holds folders only. A `cover.jpg`
  at the root had to be opened to learn which video it belonged to; by the fourth
  video nobody could guess.
- **File names carry the video id even inside the video's folder.** Files get
  dragged out of the folder to upload, and then `cover.png` says nothing.
- **Run every command from the repo root.** A nested `out/out/` once appeared from a
  render started inside `out/`. Paths in `package.json` are relative to the root.
- **Never write output into `src/`.** `src/` is committed; output is not.
- **`out/` holds deliverables; diagnostics go elsewhere** (`.cache/`, gitignored):
  probes, voice trials, experiments. Underscore-prefixed "not output" folders inside
  `out/` are a naming convention, and nobody reads naming conventions at 11 pm.
- **Superseded outputs leave `public/`.** Everything in `public/` is bundled into
  every render, referenced or not.
- **Downloaded sources stay out of the repo** (`.cache/clips/`). Only the cut,
  licensed derivative goes into `public/`.

### Code boundaries

`bun run check` enforces them: **a video never imports another video**, and
**shared code (`src/shared/`) never imports any video**. When a second video needs
something from the first, move it to `src/shared/<kind>/` (frame, caption, audio,
motion, …) at that moment, not before.

What may be shared, and only this: `src/shared/`, `public/fonts/`, `public/music/`,
`public/sfx/`. Anything new outside a video namespace must first prove it cannot be
overwritten by another video.

### Remaking a topic = a NEW id, never an overwrite

A viewer asks for another angle on a topic you already made, and the reflex is to edit
the existing video. **Don't.** The old scenes are components named after their beats;
renaming beats breaks the published render, which people are still watching and which
`out/` still holds. Remaking means a full new set: **new id, new brief**, and a line at
the top of the new brief saying it replaces nothing.

- The new video's `pronounce` and `spelling` maps do **not** inherit the old ones:
  copying them declares entries the new script never uses, and stray entries
  over-match. Declare what the new narration contains; delete entries when the word
  leaves the script.
- Facts do the opposite: **the ledger is shared**. A fact once cut "to save for
  another video" is reconsidered when that video comes, and its reason rewritten.
