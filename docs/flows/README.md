# Flows: `docs/flows/`

A flow is **how a video tells its story**: the order of beats, what replaces spoken
numbering, where the turn lands. Each flow has **one file**, and that file is the
only place that talks about the flow: when to use it, its rules, its traps, the
videos that ran it, and a log of every change.

Why one file per flow: when every flow lived in one long section, editing one meant
editing in the middle of 140 lines about the others, and the lesson from the latest
video stayed in that video's code comments, where the next video never read it.

Flow and visual type are independent axes (§5): a flow can run on several visual
combinations. Each flow lists the visuals it **fits**, not ones it requires.

## The library

| Flow | File | One line |
| --- | --- | --- |
| A | [`A-three-reasons.md`](A-three-reasons.md) | three independent pillars, counted aloud |
| B | [`B-trace-back.md`](B-trace-back.md) | walk a viral claim back to its source, or to nothing |
| C | [`C-one-journey.md`](C-one-journey.md) | one continuous path with a visible destination |
| D | [`D-side-by-side.md`](D-side-by-side.md) | two things at true scale, the gap closes |
| E | [`E-the-picture-lies.md`](E-the-picture-lies.md) | the depiction or the wording is the subject |
| F | [`F-crossing-the-border.md`](F-crossing-the-border.md) | arrival → foreign → modified → local identity |
| G | [`G-recurring-deadline.md`](G-recurring-deadline.md) | a calendar of duties and the misses that break a relationship |
| H | [`H-explain-it.md`](H-explain-it.md) | a mechanism built layer by layer, no turn |
| I | [`I-record-changed.md`](I-record-changed.md) | the number changed on a date, the world did not |
| J | [`J-what-was-lost.md`](J-what-was-lost.md) | a vanished thing and its separate traces |
| K | [`K-argument.md`](K-argument.md) | one sentence, its named holes, a verdict |
| L | [`L-news-explainer.md`](L-news-explainer.md) | this week's event, trigger vs root causes |
| M | [`M-change-one-word.md`](M-change-one-word.md) | a sentence in the viewer's head, one word changed, measured |
| N | [`N-talking-to-one-person.md`](N-talking-to-one-person.md) | a misunderstood experience, explained to the person having it |
| O | [`O-reading-a-graph.md`](O-reading-a-graph.md) | a character placed on one chart |
| P | [`P-empty-world-late-reveal.md`](P-empty-world-late-reveal.md) | stay inside one scene, reveal the map at the end |
| Q | [`Q-line-and-two-clocks.md`](Q-line-and-two-clocks.md) | a route plus planned-vs-actual clocks |
| R | [`R-one-scene-then-pull-out.md`](R-one-scene-then-pull-out.md) | a tiny moment, then the huge consequence |
| S | [`S-name-the-feeling.md`](S-name-the-feeling.md) | a familiar scene, the name of the feeling it gives |
| T | [`T-old-story-new-face.md`](T-old-story-new-face.md) | a modern figure re-enacting a classic story |

A–N were refined over dozens of published videos on the source channel; O–T were
each born from one video. Their "Cases run" tables start empty here: they are yours
to fill.

## Picking or inventing a flow

The library is a **default, not a closed list** (§2). For each video:

1. Ask what shape the fact has. Do not start from A because it is first.
2. Write **at least two candidate shapes** (from the library or invented), one line
   of beats each plus what is on screen.
3. Pick one; write in the brief **why the other was rejected**.
4. Declare the flow letter in `narration.json` → `flow`. `bun run new <id> --flow X`
   scaffolds the beats listed in the flow file. An invented shape needs its file
   **first** (copy the closest flow, rename, edit), because the linter only accepts
   flows that have a file here.

## Structure of a flow file

```markdown
# Flow X: Name

**Shape:** one line, beats joined by →
**Beats** (scene ids): `hook, …, share` · spoken numbering: yes/no · has a turn: yes/no · fits visuals: …

## When to use
## (When not to use / Shapes tried and rejected)
## Rules
## Traps
## Cases run        ← table: video, date, what we learned about the FLOW, result
## Change log       ← table: date, change, because of which video
```

## The improvement loop

When a video in flow X is published:

1. Add a line to **Cases run** in `docs/flows/X-*.md`: video, date, what was learned
   **about the flow** (not about the video), and the result once there are numbers
   (views, 3-second retention, comments).
2. If the lesson is a new rule of the flow, edit **Rules** or **Traps** right there and
   add a line to the **Change log**.
3. If the rule is machine-checkable, add it to the linter (via `sk-improve`) before
   calling it done.

## Adding, changing, retiring

- **Add**: a new file `<Letter>-<slug>.md` with the next unused letter, plus a line in
  the table above and in §2's table. Its first change-log line says which video made
  it necessary.
- **Change beats**: affects only videos scaffolded afterwards; old videos keep their
  scene ids.
- **Never rename a flow's letter or file** once a video declares it; its
  `narration.json` would break. Open a new flow instead.
- **Retire**: a flow with published videos is never deleted. Mark it retired at the
  top, say why and which flow replaces it; its Cases run table is history.
