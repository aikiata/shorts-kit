# B-roll: real footage under the narration (§5f): `b-roll`

**Use when** there is real footage of the subject (archive film, old photos in motion, a film scene the video discusses, licensed stock of the actual thing) and it runs **under** the narration as the image of what is being told. **Do not use** when no licensed footage exists: then use a weaker licensed medium (photo instead of film) rather than lowering the licence bar.

## Rules

1. **Footage takes the STORY sentences; your main visual keeps the facts it owns.** A
   sentence about a place, a line, a quantity stays on the visual that shows it; a
   sentence about people and events can go to footage.
2. **Anchor each window to a SENTENCE of the real TTS**, never to hand-typed frame
   numbers. One video re-ran TTS three times in a day and the footage followed.
3. **Every window shows provenance on a bottom line**: place, source, year, licence,
   and that source has a record in `sources.json`. Footage shot elsewhere says so
   (`KING X · STOCKHOLM`), so nobody reads it as the city in the story.
4. **Never overlap two pieces of footage.** One ends, the main visual shows for a beat,
   the next starts.
5. **Cut vertical with the subject centred.** Choose segments from a **contact sheet**
   with timestamps, never by guessing (`ffmpeg -vf "fps=1/5,scale=320:-1,tile=6x8"`,
   then a finer sheet around the good part; brighten with `eq=gamma=1.5` to see dark
   scenes; `cropdetect` for letterboxing; check the **last** frames for a cut to another
   shot). A panning camera needs a crop that **follows** the subject. Clip length ≥ the
   window, checked by machine; if too short, slow playback rather than letting it end
   mid-shot.
6. **Pre-cut with ffmpeg** to 9:16 at modest size (hundreds of KB per clip) instead of
   cropping a 1080p file with CSS: lighter bundle, faster seeking. Originals stay in
   `.cache/clips/`, never in the repo.
7. **Darken just enough, per clip.** One film needed a 0.20 overlay; a dark scan needed
   0.04 or the subject vanished. Look at stills; no single number.
8. **Draw nothing on an artefact.**
9. **Use footage by MEANING, not to fill.** The same actor in two states can carry two
   meanings (a normal face vs the thing that is off); place a small still of the scene
   on the exact point of a chart it illustrates.
10. **One material per video.** Real film and drawn illustration do not mix in the same
    short.

## Faces

If a detail is disturbing, blur the face, never the text or the chart. A moving face
needs a blur region keyed over time. Browser `backdrop-filter` blur was **silently
dropped** by the renderer at ~1.9× zoom and the face showed clearly; at large zoom,
overlay a second blurred copy masked to the region. Check stills at the start, middle
and end of every shot with a face: numeric checks cannot see an exposed face.

## Cost

One search pass per video (8–10 items), a licence check per item, cutting per clip, a
still pass at every image change. Footage after ~1950 is mostly still in copyright.
Clips of films the video discusses are a legal judgement for the channel owner; an agent
does not go looking for copyrighted films, and uses only links the owner provides.

## Change log

| Date | Change | Because of which video |
| --- | --- | --- |
