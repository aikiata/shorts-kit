# trailer-bumper

**Job:** the cold open of a promo. Three of the most striking shots, cut hard and fast, then
**one beat of pure black**, then the title. It is the "preview" in a trailer.
**Length:** about 4.7 s (140 frames). **Energy:** high.

## Intent
Other rhythm cards decide where cuts fall or where to interrupt. This one is about a joint
of the whole film: the first second. Spend it on the strongest pictures, then breathe, then
begin.

## Parameters
| Part | Typical | Feel |
|---|---|---|
| Three shots | 9 frames each, hard cuts at 0, 9, 18 | equal length makes the beat; the three compositions must differ clearly |
| Keep-alive push | each shot scales 1 → 1.04 linearly inside its 9 frames | three still frames read as a slideshow: this push is the fix |
| Black | frames 27-33, pure `#000`, nothing in it | anything in the black ruins the silence |
| Title | from frame 33, 16-frame fade plus a 44 px rise (ease-out cubic) | |
| Hold | the title stops fully for at least 40 frames | a true stop, not a slow drift |

## Known traps
- The black is a breath, not another title card. Keep it empty (and silent: sound goes
  quiet through it, one tick per cut before it).
- Tuned on grey placeholders: re-check on the real shots.
- For a pain-point film, the three shots are the pain, escalating, and the black is the
  held breath before the product turns it.

## Reference implementation

The source demo this card was rewritten from (shorts-kit, kept as reference, not built):

- [`trailer-grammar-moves/TrailerBumper.tsx`](../../../src/demo/rhythm/trailer-grammar-moves/TrailerBumper.tsx)
