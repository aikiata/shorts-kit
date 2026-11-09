# public/music

Empty on purpose: no music is committed, because almost no music licence allows
redistribution in a public repository, even when it allows use in videos.

Put your bed here (`public/music/<file>.mp3`) and pass it to `ShortsTemplate`
as `music={{src: "music/<file>.mp3"}}`. Before the first video that uses a track,
read §8 (`docs/soul/06-audio.md`):

- record the licence per track, verbatim, in `docs/facts/sources.json`
  (`kind: "music"`), and check it holds on every platform you post to;
- "royalty-free" or "DMCA-free" on a store page says nothing about Content ID;
  a registered track can block a video worldwide;
- CC BY means the credit line is mandatory, in the pinned comment or on frame;
- a play-once bed must be longer than the video minus the outro hold.

Add the file name to `.gitignore` if you keep your repository public.

## Candidate beds (local only, out of git)

Five beds kept on this machine for promos. Each has a source record in `docs/facts/sources.json` (`kind: "music"`)
with its licence, as §8 asks. The grid is measured here with `bun run beats public/music/<file>.mp3` (it also writes
`<file>.beats.json` next to the track), not taken from a store page: one track was 1 BPM off what its listing said.

| File | Source | Track, artist | Licence | BPM, first beat | On the grid |
| --- | --- | --- | --- | --- | --- |
| `cat-walk.mp3` | `s-0003` | Cat Walk, Arulo | Mixkit Free | 130.004, 0.028 s | 55% |
| `g-eazy-nba-type.mp3` | `s-0004` | G Eazy NBA type, Arulo | Mixkit Free | 89.378, 0.188 s | 22% (swung: a guide, not a grid) |
| `house-vibez.mp3` | `s-0005` | House Vibez, Lily J | Mixkit Free | 121.994, 0.0485 s | 42% |
| `tonight-hiphop.mp3` | `s-0006` | Tonight, Michael Ramir C. | Mixkit Free | 104.87, 0.4629 s | 26% (swung: a guide, not a grid) |
| `bgm-tech-house.mp3` | `s-0007` | unknown | **unknown: do not post with it** | 124.293, 0.153 s | 37% |

Mixkit Stock Music Free License: free for commercial use in videos, no credit needed, but the files may not be
redistributed on their own, so they stay out of git (`public/music/*.mp3`). Re-check the licence on mixkit.co before
a video goes out. In `promo.json`, copy the bpm and the first beat as `"bpm"` and `"offset"` (what `bun run beats` prints), or trim the file to its first beat with `"music": {"start": …}` and keep `"offset": 0`.
