# Visual types: `docs/visuals/`

A visual type is **how a claim reaches the screen**. Each type has one file: when to
use it, its rules, its traps, and a change log. General rules for every type
(the thing said is on screen, truth in pictures, licence order, title and caption say
two halves) live in [`docs/soul/03-visuals.md`](../soul/03-visuals.md) §5.

**Flow and visual type are two independent axes.** Flow is how you tell the story
(one per video); visual type is how it appears (a combination per video). Declare the
combination in `narration.json` → `visual`, using the ids below. An empty list means
"not decided", and rule 2 of SOUL says decide before writing the script.

| id | § | File | One line |
| --- | --- | --- | --- |
| `text-as-image` | §5a | [`text-as-image.md`](text-as-image.md) | one sentence fills the frame; the camera moves inside it |
| `timeline` | §5b | [`timeline.md`](timeline.md) | the stage is years, true to scale, vertical |
| `archive-plate` | §5c | [`archive-plate.md`](archive-plate.md) | a real artefact, still, hard cut, provenance on frame |
| `news-photo` | §5d | [`news-photo.md`](news-photo.md) | images of the event itself, credit on the frame |
| `gif` | §5e | [`gif.md`](gif.md) | a looping bed for rhythm; text and voice carry the facts |
| `b-roll` | §5f | [`b-roll.md`](b-roll.md) | real footage under story sentences, anchored to the TTS |
| `illustrated-scene` | §5g | [`illustrated-scene.md`](illustrated-scene.md) | no photos: one drawn world, held all video |
| `satellite-map` | §5h | [`satellite-map.md`](satellite-map.md) | real ground from satellite or vector data; the camera flies, facts are drawn on it |
| `globe` | §5i | [`globe.md`](globe.md) | the planet: great-circle lines, distances, the pull-out from a scene to Earth |

## Choosing

For each claim in the brief, ask "what is on screen while this is said?"

| The claim is… | Usually |
| --- | --- |
| a word, a label, a sentence in someone's head | `text-as-image` |
| a date, a gap between dates, a sequence | `timeline` |
| a document, an old map, a photograph as evidence | `archive-plate` |
| an event with photos or before/after imagery | `news-photo` |
| a behaviour, a rule, a paradox with no place or object | `gif` (+ a data figure) |
| people and events with licensed footage | `b-roll` |
| a person, a place, time passing, with nothing licensed to show | `illustrated-scene` |
| a distance, a route, a border, a coastline, a place on the ground | `satellite-map` |
| two places far apart, a journey across oceans, the scale of a trip | `globe` |

If a claim fits none, the topic is not buildable yet. Check licences at this moment.

## Adding a visual type

Your niche may need a type the kit does not ship (a map, a globe, a 3D model, a
screen recording). Add a file with the next § number (§5h, …), the same sections as
the others (Use when / Rules / Traps / Change log), a line in the table above and in
§5's index. Build a **probe still** of the new type before anyone writes a script
around it: every lesson in these files came from the first render, not from reasoning.
Never rename an id once a video declares it.
