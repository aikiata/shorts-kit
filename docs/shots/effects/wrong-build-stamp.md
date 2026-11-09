---
name: wrong-build-stamp
summary: Under the line "That's not what we decided.", the decision card lands, then the thing that was built instead, and a tilted red "Not a checklist" tag stamps onto its corner while a red ring snaps around it.
use: A hook that shows a mistake: the agent, the tool or the team made the wrong thing. The stamp is the verdict on a real piece of UI.
length: 150f scene (5 s); the stamp itself 6f, at frame 78
energy: medium-high
tags: effects, stamp, hook, pain-point, verdict, real-ui, promo
source: shorts-kit/knowns-tvc-v4
---
# wrong-build-stamp

## Intent
"It built the wrong thing" is abstract. Show the right thing and the wrong thing on one screen, then mark the
wrong one like a teacher marks a test. The viewer gets the pain in the first two seconds without sound: the red
word in the headline, the decision, the result, the red stamp. The built thing is a real component (a setup wizard),
so it looks plausible, which is the point: it is good work, it is just not what was decided.

## Motion core
Frames are scene-local; `T(x) = round(x · pace)`, pace 1 in the master.
- Headline (`Head`, 108px) lands word by word at 2, 6, 10, 13, 16: "That's **not** what we decided.", "not" in red.
  The film has no voice yet here, so these are fixed frames, 3-4f apart.
- Decision card (real `Card` + accent `Tag` "Decision · last week") at `T(30)`, rise 20px over 10f.
- "What the agent built" caption and the real `SetupWizard` at `T(54)`, rise 24px over 10f, inside a 600px-high
  rounded box with a bottom fade mask (`linear-gradient(#000 80%, transparent)`).
- Stamp at `T(78)`: `k = ramp(f, 78, 6, easeOut)`. A danger `Tag` "Not a checklist" (drawn at `zoom 3`) pinned to the
  box's top-right corner (`right 0, top -12`), `opacity = k`, `rotate(-3deg) scale(1.25 - 0.25·k)`, origin top right.
  It drops onto the corner and settles at full size.
- Ring: the box gets `0 0 0 3px` red the first frame `k > 0`. Not eased: it snaps, like ink.
- A slow push on the whole scene, scale 1 → 1.025, so no frame is static.
- Sound: one `glitch` at 0.22 on the stamp frame. No full-frame hit.

## Parameters
| Parameter | Typical value | Feel when changed |
|---|---|---|
| Setup steps | headline 2-16, decision 30, build 54, stamp 78 (24f apart) | Closer than 15f and the viewer has not read the decision when the build lands |
| Stamp duration | 6f, ease-out | Over 10f it floats on like a tooltip; 2-3f is a cut, not a stamp |
| Stamp scale | 1.25 → 1 | Over 1.5 it covers the component; 1.0 (no scale) reads as a label that was always there |
| Stamp tilt | -3° | 0° looks like UI; over 8° it is a cartoon |
| Ring | 3px, hard on | An eased ring looks like a focus state, not a verdict |
| Bottom mask | fade from 80% | Without it the component's cut-off bottom edge looks like a mistake |
| Pace (cutdown) | 0.6 → stamp at 47 | Below 0.5 the decision card is not readable before the stamp |

## Known traps
- Use the verdict text the viewer can check against the decision on the same screen ("Not a checklist" against
  "Onboarding starts with a checklist."). A generic "WRONG" says nothing.
- The tag is placed at the box's corner, outside its overflow clip; put it in the parent, not inside the masked box.
- The component must be driven by props only (`current={0}`), with its CSS transitions off
  ([`docs/promo/real-ui.md`](../../promo/real-ui.md)).
- In the 6 s cut every beat is scaled by `T()`; a beat written as a bare frame number escapes the re-timing.
- The decision content is illustrative; say so in the brief.

## Pairs with
- [voice-word-relay](../typography/voice-word-relay.md) for the headline.
- [scatter-pull-graph](../ui-entrance/scatter-pull-graph.md) as the next scene (why it went wrong).
- [scan-bracket-sweep](scan-bracket-sweep.md) for a colder, inspecting version of the same verdict.
- Sound card [glitch](../sfx/glitch.md).

## Reference implementation
- [`wrong-build-stamp/scenes.tsx`](../../../src/demo/effects/wrong-build-stamp/scenes.tsx) (`makeWrong`, `STAMP_AT`)
