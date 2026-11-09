# Motion

> Part of [`SOUL.md`](../../SOUL.md). This file holds **§12**. All **[craft]**:
> each rule is a rendering or perception fact, found by a broken render.

---

## 12. Motion rules

"No frame stands still" (§3) was only words while the easing helper every shot used
was a smoothstep, whose **derivative is zero at both ends**. Every move in every
video landed at exactly zero speed and sat there for the rest of the sentence.

- **Vary the shot size.** Motion is one half of a shot; the other half is how big the subject
  is (`WS`, `MS`, `CU`, `ECU`). Change size at a beat and never hold one size for three shots
  in a row: [`docs/shots/sizes.md`](../shots/sizes.md). The storyboard's `size` field and its
  lint warning enforce it.
- **Speed floor: no move lands at zero.** Blend a linear part into the easing
  (`camEase(t, tail)` in `src/shared/motion/Camera`, used by `Camera`): `tail` is the exit speed as a
  fraction of the move's average speed; 0 is plain smoothstep, 1 is linear. Default
  ~0.34. A move that truly stops is rare and needs a reason.
- **After a move, keep moving.** Coast after the move lands, slowly, measured in
  seconds and in fractions of the frame, so it reads the same at any zoom. **The
  coast follows the direction of the move**: zoom in, keep drifting in; a coast
  against the move reads as a bug.
- **Drift needs at least one monotonic axis.** A drift with `sin` on both axes stops
  at each crest: twice a cycle. One axis runs one way (an `interpolate` over the
  scene); sine is for the secondary axis.
- **Cut on MOTION, not only on framing.** The next scene opens on the frame the last
  one ended on **and in the same direction**. Cutting from a zoom-in to a zoom-out is a
  jolt even when frames match. A short scene fade hides the seam; it creates no
  momentum.
- **`interpolate` for anything tied to the voice; `spring` only for graphics that
  appear on their own** (chips, labels, a red X). A voice-tied move must land on the
  frame the sentence ends; a spring promises no landing frame.
- **No `@remotion/transitions` `TransitionSeries`.** It **swallows frames**: 40 + 60
  with a 30-frame transition is 70 frames, not 100. Every sequence here is pinned to
  TTS timestamps; swallowed frames desync voice and picture from that block on, and
  the error accumulates. Smooth transitions come from continuous camera and short
  scene fades.
- **Images use Remotion's `<Img>`**, which calls `delayRender()` until decoded. A
  plain `<img>` or an SVG `<image href>` does not; long renders get away with it by
  luck (later frames hit the cache), and **a single still does not**: a cover once
  rendered with no background, and viewers described the video as "the image jerks
  once, then shows sharply". For images drawn another way, preload them all with an
  explicit `delayRender`, from a **fixed** list (the full set of the video, not the
  layer currently visible: a changing list spawns new delays mid-render); resolve on
  error too, so one broken image cannot hang the render.
- **Hold assets with `OffthreadVideo`**, and pre-loop short clips with ffmpeg
  (`-stream_loop`) rather than `<Video loop>` at render time; one looped render took
  89 minutes for 7,724 frames.
- **Cheap texture**: film grain (`feTurbulence`, low opacity, new seed per frame) and
  a vignette make a flat gradient read as an *image* rather than a slide. Depth comes
  from **different parallax factors** per layer (e.g. 0.18 / 0.45 / 0.9): the eye
  measures the ratio between layers, not absolute motion. Avoid full-frame `blur()`
  at 1080×1920; it multiplies render time for no visible gain.

## 12a. Shots anchored to words

- **Each shot ends on a word of the narration**, not on a second. Change the voice
  or edit a line and every shot moves with it. Punctuation is part of the word, so
  "moved." and "moved" are different anchors.
- **Shots join end to end** (a shot starts where the last one stopped, not at the
  next word's start), so the voice's lead-in silence makes no empty frame.
- ~1–1.5 s per shot is the densest that still reads.
- **No flash on every cut**: a flash every 1–2 s reads as stutter. Save it for big
  beat changes (the name appearing, the chart appearing).
- Two shots on the same image share **one** camera push, or the zoom jumps back at
  the cut. Consecutive shots on the same chart use the same component, so it does
  not remount.
- SFX and animations anchor to words too (§8).

## 12b. The background stays outside the scene fade

When the whole video is **one continuous camera** (one world, one drift), wrapping
each scene in `opacity: fade` dims the background at every seam. Viewers do not read
"transition", they read "the frame darkens and brightens". Measured: frame contrast
dropped to 0.064 at a seam, back to 0.112 once the background moved outside the fade.

```tsx
<AbsoluteFill>
  <World t={clock} />                       {/* background: NOT faded */}
  <AbsoluteFill style={{opacity: fade}}>    {/* text + inserts: faded */}
    …
  </AbsoluteFill>
</AbsoluteFill>
```

## 12c. When a mark is content, its position is data; labels move around it

When a dot is **content** (a real coordinate, a real value on a chart), its position
is exact and **never moves for layout**. What yields is **the label**: on a ring
around the dot, side chosen by free space, with a leader line. Turning the label off
to make room is throwing information away.

- The label's angle must be a **continuous function** of position, not the argmax of
  a score table: two equally good directions swap back and forth as the camera
  drifts, and the label jitters every few frames: visible in renders, never in stills.
- A label that only knows the frame edges cannot dodge other components; in scenes
  with inserts, turn it off by rule ("off when a plate is showing"), not by a
  hand-tuned radius nobody will understand later.

## 12d. Continuous values are a function of the CUMULATIVE clock

Anything continuous across a cut (the camera frame, a layer's opacity, an
animation's progress) is computed from **one pure function of the cumulative frame
count**, and each scene calls it with its own offset. No scene sets the value by hand.

Why this is a rule and not tidiness: hand-set values are **each valid on their own**,
and no check catches them. They break only at the seam, only after someone **inserts,
removes or resizes another scene**, and that person has no reason to open this one.
Five bugs in one video had this shape: two separate camera clocks jumping at a seam; a
camera offset kept from an old script after a scene's length changed; an assertion
that checked the static frame, not the drifted one; a layer driven by seven separate
formulas; scene frame counts copied by hand into three files. The owner saw it: "why
does the ground keep switching colour with no pattern?"

1. **Scene frame counts come from `voice.json` and are copied to ONE place.** A
   second copy is a second version that will drift. Checks read the generated file.
2. **Assertions run on drifted values, not only static ones**: at both ends.
3. **Seams are checkable by number.** Compute the value on the last frame of one scene
   and the first of the next; a difference above ~0.01 is a jump. Cheaper than
   rendering and looking.

Values that follow the script are a **keyed table**, each key tied to a sentence,
interpolated between. Adding a scene edits the table, not seven formulas.
