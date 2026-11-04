# Visual rules: general, plus the index of visual types

> Part of [`SOUL.md`](../../SOUL.md). This file holds **§5**, the rules for every
> visual type. Rules specific to one visual type live in
> [`docs/visuals/`](../visuals/README.md), one file each. Truth-in-pictures and
> licence rules are **[hard]**; the rest is **[craft]**.

---

## 5. Visual rules

**Flow and visual type are two independent axes.** Flow is how the story is told
(one per video); visual type is how it reaches the screen (a combination per video).
The same flow ran on four different visual combinations in the source pipeline, and
the same visual combination appeared under five flows. Each video declares its
combination in `narration.json` → `visual`.

| id | § | One line |
| --- | --- | --- |
| [`text-as-image`](../visuals/text-as-image.md) | §5a | one sentence fills the frame; the camera moves inside the sentence |
| [`timeline`](../visuals/timeline.md) | §5b | the stage is YEARS, not a place; the axis is true to scale |
| [`archive-plate`](../visuals/archive-plate.md) | §5c | a real artefact is the subject: still, hard cut, provenance on frame |
| [`news-photo`](../visuals/news-photo.md) | §5d | photos of the event itself, credit on the frame |
| [`gif`](../visuals/gif.md) | §5e | no coordinates, no artefact: a looping clip carries rhythm, text carries facts |
| [`b-roll`](../visuals/b-roll.md) | §5f | real footage under the narration, anchored to sentences |
| [`illustrated-scene`](../visuals/illustrated-scene.md) | §5g | no usable photos or footage: build one world from simple drawn layers and stay in it |
| [`satellite-map`](../visuals/satellite-map.md) | §5h | the claim lives on the ground: fly over real imagery and draw the facts on it |
| [`globe`](../visuals/globe.md) | §5i | the claim spans the planet: lines on a sphere, true distances, the pull-out reveal |

The kit ships no map or globe types. If your niche needs one, add it as a visual
type (see the README); the general rules below still apply.

### Rule zero: decide the visual language BEFORE the script

A whole family of claims does not live on any stock image: a word, a year, a name, a
behaviour, a ratio. The first video that met this in the source pipeline spent 49% of
its length on three scenes where the background proved nothing, so the screen was
text on wallpaper. For every claim, decide at the brief which visual type carries
it, **and check the licence then**. If no claim fits any visual type you have, the
topic is not buildable yet; do not write the script first.

### The thing being said must be on screen

- **Graphics are drawn ONTO the subject, not floated as cards.** Lines, arrows with
  measurements, a red X at the exact spot, a filled region, a dot with a real name.
  A stats card floating mid-screen is a different mood and proves nothing.
- **Do not let an available asset drive the edit.** One video ran its last two
  blocks on the only licensed image the topic allowed; the closing line was about a
  boundary, and there was no boundary on screen. The image also turned out unusable
  at every zoom: sixteen seconds of empty frame, and the one viewer comment was
  "broken picture, nothing there". Sign: **if you change the framing a third time,
  the shot has nothing in it.** Drop it. The question is always "is the thing being
  said on screen?" A beautiful image that is not the subject is an **insert**, not a
  stage.
- **No empty shots.** A shot whose content is too small, too blurry or too uniform
  to read is a broken shot, even if every check passes. Check stills, and check the
  *darkest* and *blandest* background in the video, not the prettiest.
- **Resolution must hold along the whole move**, not just at the ends. A layer that
  only becomes sharp at the final frame means 19 seconds of a 4×-upscaled image
  before it, not an error, just blur, and nobody reports blur. Measure source pixels
  per screen pixel along the move.

### Truth in pictures

- **Scale is an ethical question.** A timeline or comparison is either true to scale
  or labelled "not to scale" on frame. No third option. Squeezing marks to even
  spacing is lying with a picture: the exact thing flow E makes into a topic.
- **Every artefact carries its date.** An undated artefact is being borrowed to say
  something it does not say. A 13th-century textile behind a story set in 552 must
  show the seven-century gap; shown, it is still evidence; hidden, it is a trick.
- **Portraits: date the painting, not the person.** Portraits from before ~1500 are
  mostly imagined later. Caption "painting, 19th century", never just the sitter's
  life dates. No contemporary likeness? Do not build a face; show something truly
  tied to the person (a signature, a decree, a ship, a grave).
- **Editing evidence: crop, and brighten evenly. Nothing more.** No local contrast,
  no saturation or hue changes around the point you are making: that manufactures
  evidence. Log every edit in the video's credits.
- **No fake headlines, documents or interfaces** standing in for a point. A press
  headline component is only for a headline that exists.
- **"Phrased after" is said aloud.** A drawn path or curve that is a sketch of a
  published model, not measured data, says so on frame and in the caption.

### Licence order (applies to every visual type)

**PD / CC0 → CC BY → (ask first) CC BY-SA → never CC BY-NC.** A scan with no stated
licence is not usable. The work being out of copyright and the *scan* being free are
separate questions; a photo of an old painting or of a statue carries the
photographer's licence. Open-access museums (CC0) are the best source: check the
licence via the museum's API, not by guessing from the page. Items rejected for
licence are recorded with the reason, like cut facts, or someone searches for them
again in six months.

### Title and caption say two halves

The caption follows the voice word by word, so a headline that copies the sentence
being spoken shows the same sentence twice on one frame. In one audit, **six of eight
scenes** did this: writing the headline by copying the line is the default reflex,
and it is wrong every time. On-frame text rules are in §7.

### Endings

End on the turn of the script. **No** logo or @handle outro. Free trick: **the last
scene can be the opening scene run backwards**: it costs no words and closes the
whole piece.
