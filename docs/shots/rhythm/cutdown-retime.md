---
name: cutdown-retime
summary: The 16 s and 6 s versions of a 45 s film are the same scenes rebuilt at their own length and pace, with their own voice line and sound cues, instead of clips chopped out of the master.
use: Any promo with a deliverables matrix (master plus 15/16 s and 6 s cuts): build the cuts as compositions from scene factories.
length: master 1380f (46 s); cut 480f (16 s); cut 180f (6 s)
energy: n/a (an editing technique)
tags: rhythm, cutdown, deliverables, re-timing, promo, remotion
source: shorts-kit/knowns-tvc-v4
---
# cutdown-retime

## Intent
A cutdown chopped from the master keeps the master's pace, so the 6 s version shows half a headline and a cut-off
stamp. A cutdown should be its own small film: pain, product, call to action, each at the length the cut can
afford. Making each scene a factory with its timing as arguments lets the same code produce every length, and the
cuts stay in sync with every later fix to the master.

## Motion core
- Scenes are factories, not constants:
  - `makeWrong(pace)`: every beat goes through `T(x) = round(x · pace)`. Master pace 1, 6 s cut pace 0.6
    (the stamp moves from frame 78 to 47).
  - `makeReveal(line, words, accent, size, termTop)`: the same reveal for another voice line, with its own word list,
    headline size and layout.
  - `makeLockup(installAt?, sub?, installTop)`: the install command can come in early (frame 16 or 12 instead of
    14f after the last word), and the 6 s cut adds a plain sub line.
- Each cut is its own `Promo` built from the master's: `{...ALL, tail, music, voice: {lines: lines(...)}, scenes}`.
  - 16 s: `wrong` 8 beats, `reveal` 16 beats, `lockup` 6 beats, tail 1 s (at 120 BPM: 4 + 8 + 3 + 1 = 16 s).
  - 6 s: `wrong` 2.5 s, `lockup` 3.5 s, tail 0.
- Music in a cut: the master's track from the top, with the master's loop and crossfade removed, and a shorter
  fade-out (1.2 s; 0.8 s in the 6 s cut).
- Voice: a cut that drops a scene may need its own line. Without the `where` scene, "Knowns keeps **them** in your
  repo" names nothing, so the 16 s cut says line `c3`: "Knowns keeps your decisions, specs and tasks in your repo.
  Connected." It sits in the same `promo.json`; the master keeps only lines whose id starts with `v`.
- A line keeps the same offset inside its scene as in `promo.json`, so `wordIn` stays right in every cut.
- Sound cues are rebuilt per cut from that cut's own scene starts: `from(promo, id) + sceneFrame`.
- Each cut is a `Composition` (`Cut16`, `Cut6`) next to `Video` in `entry.tsx`, sharing the same background.

## Parameters
| Parameter | Typical value | Feel when changed |
|---|---|---|
| Cut lengths | 16 s and 6 s | 16 s, not 15: the reveal's graph needs about 7.4 s to land. Choose the length from the slowest scene you keep |
| Scenes kept | pain, product, CTA | Dropping the pain makes it a logo ad; dropping the CTA wastes the impression |
| Pace in the 6 s cut | 0.6 | Below 0.5 the hook is not readable; the lockup is never re-paced, only shortened |
| Lockup install cue | 16f (16 s), 12f (6 s) vs 14f after the tagline in the master | Waiting for the tagline leaves no time to read the command |
| Music fade-out | 1.2 s / 0.8 s | The master's 2.5 s fade eats the end of a short cut |
| Tail | 1 s / 0 | The 6 s cut cannot spare a still second |

## Known traps
- `bun run render <id>` only renders the composition `Video`. Render cuts with
  `bunx remotion render src/videos/<id>/entry.tsx Cut16 <file>`, then normalise and encode by hand.
- Removing a scene can break the meaning of a line that refers back to it ("them"): reread every line in the cut.
- A cut must not import another video; the factories live in the video's own `scenes.tsx`.
- Every beat inside a re-paced scene must go through `T()`. One bare frame number and that element lands at the
  master's time.
- Cue sounds from the cut's own scene starts; the master's cue table is absolute frames of the master.
- A shared background that runs from frame 0 (like the node field) shows a different pattern in a cut; that is fine.
- Decide the cuts at the brief (deliverables matrix), not at the end: the factory arguments only exist if the scenes
  were written for them.

## Pairs with
- [voice-word-relay](../typography/voice-word-relay.md): its scene-relative word times are what make re-placement safe.
- [wrong-build-stamp](../effects/wrong-build-stamp.md), the re-paced hook in the 6 s cut.
- [trailer-bumper](trailer-bumper.md) for a cold open that a cut can reuse as is.

## Reference implementation
- [`cutdown-retime/cuts.tsx`](../../../src/demo/rhythm/cutdown-retime/cuts.tsx) (`PROMO16`, `PROMO6`, `Cut16`, `Cut6`)
- [`cutdown-retime/scenes.tsx`](../../../src/demo/rhythm/cutdown-retime/scenes.tsx) (`makeWrong`, `makeReveal`, `makeLockup`)
- [`cutdown-retime/timing.ts`](../../../src/demo/rhythm/cutdown-retime/timing.ts) (`ALL` vs `PROMO`, `wordIn`)
- [`cutdown-retime/entry.tsx`](../../../src/demo/rhythm/cutdown-retime/entry.tsx) (the extra compositions)
- [`cutdown-retime/promo.json`](../../../src/demo/rhythm/cutdown-retime/promo.json) (master scenes and the `c3` line)
