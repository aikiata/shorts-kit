---
name: avatar-bracket-carousel
summary: "Your ___ agent" fill-in-the-blank line. Four corner focus brackets stay pinned in the sentence while a queue of avatars rotates vertically inside them with a spring, three times. The avatar entering the frame scales up and sharpens; the one leaving shrinks, fades and blurs by distance. The role label changes in sync, and the brackets breathe 7% at each switch
use: Listing capabilities of "one slot, many roles"; the core one-line shot for team, identity, preset or persona products
length: about 5.2s (156f@30fps)
energy: medium (three evenly spaced switches form a steady metronome; the bracket pulse is the only decorative motion)
---

## Intent
"Our agent can be a director, an editor, an animator, a sound designer" written as four rows is a list.
Put into one slot of one sentence, it becomes one promise plus four proofs: the sentence stays still, only the one in the slot changes. The four corner brackets are the key to this technique.
They do not take part in the rotation, but they pin the viewer's eyes to that 92×92 box, so the four changes read as "the same position" and not as "four avatars drifting past".

## Motion core
- The position value `pos` is the sum of three springs: `[0.24, 0.46, 0.68].forEach(s0 => pos +=
  seg(t, s0, s0+0.14, k => E.spring(k, 0.25)))`. It is a continuous value, not an index jump, so at any
  moment you can compute how far each avatar is from the slot
- Distance drives everything: `d = |k - pos|`, then `scale = max(0.5, 1-d*0.38)`,
  `opacity = max(0, 1-d*0.62)`, `blur = min(3, d*2.4)`, `translateY = (k-pos)*76`.
  Four properties come from one distance value, so the enter and exit changes are in sync by nature and need no separate timing
- The queue is stacked with absolute positioning on a 0×0 anchor at `slot` (`left:-29px, top:-29px` to self-center),
  and the vertical offset is entirely `(k-pos)*STEP`. Avatars outside the frame still render, they are just hidden by opacity and blur
- The entrance is another layer on top of the rotation: `el.style.opacity = op * seg(t, 0.02+k*0.03, 0.12+k*0.03)`.
  The four build the queue with a 0.03 stagger within the first 0.15 of the shot, after which this term is always 1 and the rotation takes over
- The role label is a separate set that shares `pos`: `opacity = max(0, 1-|k-pos|*2.2)`. The falloff slope 2.2 is much steeper than
  the avatar's 0.62, so the label is fully gone beyond 0.45 slots of distance and two labels are never on screen together
- Bracket breathing: `breath = Σ sin(seg(t, s0, s0+0.1) * π)`; take `min(1, breath)`, multiply by 0.07
  and add it to scale. The sine envelope peaks the pulse in the middle of the switch and returns to zero when it ends

## Parameters
| Parameter | Typical value | Feel when tuning |
|------|--------|----------|
| Switch points | 0.24 / 0.46 / 0.68, interval 0.22 (about 34f / 1.14s) | The interval is how long it takes to read one role. Under 0.12 the viewer cannot read the label; over 0.3 the metronome feel falls apart |
| Switch travel | window 0.14 (about 22f), `E.spring(k, 0.25)` | Travel takes 64% of the interval, so rest time is about 12f. Damping 0.25 gives one clear bounce; lower values shake twice and clash with the neighboring switch |
| Step | STEP=76px (frame 92px, avatar 58px) | The step must be larger than the avatar diameter or neighbors bite into each other. 76/92 means an avatar leaving the frame still shows a corner, hinting at the queue |
| Scale falloff | `1 - d*0.38`, floor 0.5 | One slot away scales to 0.62. A steeper slope makes the exit more decisive, but the 0.5 floor is hit earlier and the queue becomes "two sizes" |
| Opacity falloff | `1 - d*0.62` | Fully gone beyond 1.6 slots, so about 3 are always visible. At a slope of 0.3 all four of the column show and the "locked" meaning of the viewfinder weakens |
| Blur falloff | `d*2.4`, cap 3px | Blur hints at depth of field; a 2.4 slope gives about 2.4px on the neighbor. Over 4px the neighbors smear into color blocks and the queue no longer reads as avatars |
| Label falloff | `1 - d*2.2` | The slope must be clearly larger than the avatar's 0.62. The label is text, and two half-transparent lines stacked are the hardest to read |
| Bracket pulse | window 0.1, `sin(·π)` × 0.07 | 7% is the amount of a "snap". Over 15% the bracket becomes the lead and steals attention from the avatar change |

## Known traps
- Four avatars for three switches: `pos` ends at 3, exactly the last one. Adding a fifth avatar needs a fourth switch (and
  the last switch must end before 0.86 to leave rest time), otherwise the end of the queue never enters the frame
- The switch points are a hard-coded array that appears in two places (the `pos` sum and the `breath` sum). When changing the beat you must change both;
  missing one makes "the bracket pulse and the avatar swap out of step"
- The gap between the entrance stagger and the first switch is only 0.09 (entrance ends at 0.15, switch at 0.24). More avatars push back
  the end of the entrance (`0.12+k*0.03`); with 5 or more you must move the first switch later
- The avatars are white line icons on neutral-gray lit gradient circles (gray levels only tell queue items apart). The accent color is used only on the
  four SVG corner marks of the bracket (and one dot on the label chip). Keep this split after swapping in real avatars, so the avatars themselves do not grab color
- The four paths of the bracket SVG and the 92×92 viewBox are hard-coded coordinates (`M4,26 L4,4 L26,4` and so on). Changing the
  bracket size means re-marking the whole set; changing only the container width and height distorts the corner marks
- The sentence "Your ___ agent" (demo: the shorts-kit agent crew Director / Editor / Animator / Sound) is centered with flex + gap:22px. The slot width is fixed at 92px so the sentence stem does not
  reflow when avatars change. If you switch to a Chinese sentence, check that the changed text widths on either side do not push the slot off the screen center

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`avatar-bracket-carousel/AvatarBracketCarousel.tsx`](../../../src/demo/ui-entrance/avatar-bracket-carousel/AvatarBracketCarousel.tsx)

