---
name: photo-print-bed
summary: A small 4:3 photo fills a vertical frame twice; a heavily blurred, darkened copy covers the background, and the sharp copy sits in the middle as a print with a cream border and a deep shadow, pushing in slowly, with an optional orange camera date stamp that blinks
use: An old or low-resolution landscape photo that is the evidence (a viral image, a 2002 snapshot, a scanned print) in a 9:16 short, when cropping it to fill the frame would cut the subject
length: one shot, 60-150f
energy: low (one slow push)
tags: photo, archive, letterbox, blur background, print, date stamp, vertical, still image
source: makevideo/liminal-space
---
# photo-print-bed

## Intent
A 640x480 photo cropped to 9:16 loses two thirds of itself. Letterboxing it on black looks
like a mistake. This shot keeps the whole photo, sharp, framed like a physical print, and
fills the rest of the frame with the photo's own colours, so the frame still feels full and
the viewer looks at the print. It reads as "this exact image", which suits evidence. The
kit's `archive-plate` type says how to treat an artefact (still, provenance on frame); this
card is one way to lay a landscape still onto a vertical frame.

## Motion core
- **Bed:** the same image, `object-fit: cover`, `filter: blur(40px) brightness(0.45) saturate(1.2)`,
  scaled 1.2 so the blurred edges never show.
- **Print:** a 960x720 box (4:3) at left 60, top 460, `outline: 10px solid #f1ede0`,
  `box-shadow: 0 30px 90px rgba(0,0,0,0.8)`, `overflow: hidden`, image with `contrast(1.05)`.
- **Push:** the whole print (border included) scales `move.scale[0] → move.scale[1]` over the
  shot with an eased ramp, about a chosen `transformOrigin` (for example `50% 55%`).
  First appearance `1.0 → 1.14`; a later return of the same photo continues from `1.14 → 1.22`.
- **Entrance:** the print's scale and opacity are multiplied by the `enter` spring
  (damping 200: opacity 0 → 1, scale 0.965 → 1).
- **Date stamp (optional):** bottom right inside the print, monospace 40 px, orange `#FF9A3C`
  with an 8 px glow, like a 2002 digital camera. It appears on the spoken year and blinks off
  for 3 frames every 50 (`(frame - at) % 50 < 47`).
- **Label above:** a letter-spaced mono kicker (30 px, spacing 6) at top 340 names the source
  and date ("4CHAN /x/ · 12/05/2019"), timed a few frames into the shot or to its word.
- **Shade:** a top and bottom gradient keeps captions readable over the bed.

## Parameters
| Parameter | Typical value | How it feels when changed |
|---|---|---|
| Bed blur / brightness | 40 px / 0.45 | Less blur shows a second, competing photo; brighter beds pull the eye away from the print |
| Bed overscale | 1.2 | Below ~1.1 the soft transparent blur edge shows at the frame border |
| Print size | 960x720 (60 px side margins) | Narrower prints feel like a thumbnail; full width loses the "print" read |
| Border | 10 px cream `#f1ede0` | White looks digital; no border and it reads as a letterboxed video |
| Push | 1.0 → 1.14 over the shot | Past 1.125 the border reaches the frame sides; going on to ~1.2 is only right for a return of the same photo |
| Stamp blink | off 3 f in every 50 f | Faster reads as an alarm; steady looks like a caption, not a camera mark |
| Label | top 340, mono 30 px | Keep it above the print; inside the print it covers the evidence |

## Known traps
- **Scale the print box, not the image inside it,** so the border and shadow push with the
  photo. Scaling the inner image crops the evidence while the frame stays still.
- **A push past 1.125 makes the 960 px print wider than 1080 px.** The source's 1.14 end
  value already lets the border touch the frame sides (about 7 px over each) in the last
  frames; on the return shot (1.14 → 1.22) the print bleeds off both sides on purpose. On a
  first showing, more than that hides the edges of the evidence.
- **The stamp is a claim.** Only add a date stamp if the original has one; the source draws it
  because the real photo carries `'02 6 12`.
- **Credit and provenance stay on frame** as the kit's archive rule asks; the kicker is the place.
- **Determinism:** the blink is a pure function of the frame (`% 50`), no timers.

## Pairs with
- [`paper-title-card`](../typography/paper-title-card.md): print-like type for a quote from the image
- [`vhs-grade-flicker`](../effects/vhs-grade-flicker.md): the grade that ties stills and clips together
- [`depth-layer-moves`](../camera/depth-layer-moves.md): when the photo needs more than a push

## Reference implementation
- [`chroma-split-settle/scenes.tsx`](../../../src/demo/typography/chroma-split-settle/scenes.tsx) (`Photo`, `Anh`, `Tim`, `Nha`, `Shade`, `Kicker`; the file is shared with the `chroma-split-settle` card)
- [`chroma-split-settle/anim.ts`](../../../src/demo/typography/chroma-split-settle/anim.ts) (`enter` spring)
