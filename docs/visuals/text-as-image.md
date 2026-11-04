# Text as image (§5a): `text-as-image`

**Use when** the topic has no place to point at, no artefact to film, and you do not want stock clips: a sentence the viewer says in their head, a label, a definition. The frame **is** that sentence. **Do not use** when there is something real to show: then it trades evidence for an effect. Shared component: `src/shared/caption/TypeStage`.

## Rules

1. **Two layouts, never mixed.** With no background clip, **the text is the subject**,
   filling the frame, one sentence per layout. With a background clip, **the clip is
   the image** and the text is a one-line label on a **fixed strip** near the captions,
   same place every scene. Giant centred text over a clip is a slide; the owner called
   a header per scene "not continuous".
2. **A hook with a clip: the clip runs first, one line of text.** Do not open on a
   three-word poster. Scenes with no text are valid.
3. **On-frame text is not the caption, and is always the VIEWER's sentence** (first
   person), while the caption is the narrator's (second person). Reading the on-frame
   sentence aloud is trap number one (§7c). Test: could the on-frame sentence appear
   in the caption without anyone noticing? Then it is wrong.
4. **Words arrive one by one; the camera never stands still** (§12): a small push and
   slide per scene. Scaling eats width: size the column for the final scale, or the
   text crosses into the button column (measured: x = 939 at the end of a scene).
5. **Exactly one word changes per video, and it changes by picture**: struck out in
   red, the new word grows in place.
6. **Red only for the dropped word**, accent for the new label, yellow for a measured
   number, on a near-black background the contrast depends on.
7. **No cheap text effects**: no 3D spins, no beat-synced bouncing, no glow, no
   marquee. People remember the effect instead of the sentence.
8. **The background needs depth, not a flat plane**: three glow layers at different
   parallax factors, a slow light sweep, film grain, a vignette (§12). Flat gradients
   look like slides; grain makes them an image.
9. **A drawn figure must say something a photo cannot** (a relation, a gap, a curve),
   sits behind the text, opacity ≤ 0.45, and is off when a clip is playing.
10. **A measurement, if any, is one thin bar** under the sentence: label left, number
    right. Comparing two numbers needs another flow and another visual type.

## Traps

- Lines over ~14 words become a block; split ideas across lines.
- Internal metaphors on screen (§7d). The text is what viewers actually say to
  themselves.
- A first-person sentence about an emotion is a statement on the viewer's behalf: no
  diagnosis, no symptom checklist, nothing that labels the reader.
- No `:` `—` `etc.` in on-frame text either (§3b).
- No cover exists by default for this type; the video builds its own `Cover.tsx`.

## Change log

| Date | Change | Because of which video |
| --- | --- | --- |
