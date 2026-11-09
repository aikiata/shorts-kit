---
name: photo-push-fit
summary: Every shot is one still photo with a slow push-in toward a chosen focus point; landscape photos sit sharp in a panel over a blurred copy of themselves, and shots cross-fade while both pushes keep moving
use: A video built from archive photos and paintings (one picture per narration line), especially when portrait and landscape sources are mixed in a 9:16 frame
length: one shot per narration line, 60-180f; cross-fade 14f
energy: low
tags: ken burns, push-in, still photo, archive, crossfade, landscape in portrait, blurred backdrop, shot table
source: makevideo/loi-nguyen
---
# photo-push-fit

## Intent
A still photo on screen for four seconds is dead; the same photo with a slow push toward the
face is a shot. This card is the plain Ken Burns move done carefully for vertical video: the
push goes toward a focus point you choose per shot, a landscape photo is never cropped to a
sliver (it gets a panel over its own blurred copy), and cuts are soft cross-fades during which
neither picture stops moving.

The whole video is a data table (`SHOT_CFG`, one row per narration line): photo id, mode,
focus, zoom range, pan, chip, extra grade, fire. Directing becomes editing that table.

## Motion core
- Shot progress `t = interpolate(frame, [start, start + duration + XFADE], [0, 1], clamp)`. The
  range runs XFADE frames past the shot's end, so while the next shot fades in, the old one is
  still pushing.
- **cover** mode: the image fills the frame with `objectFit: cover`, `objectPosition = focus`
  and `transformOrigin = focus`, so the zoom closes in on the subject, not the frame centre.
  `transform: translateY(p0 + (p1 - p0) t) scale(z0 + (z1 - z0) t)`. Default zoom 1 → 1.12.
- **fit** mode (landscape sources): a backdrop copy at `inset: -80`, 1240 × 2080,
  `blur(40px) brightness(0.35)`; on top, a sharp panel at left/right 40, top 500, height 720,
  radius 6, shadow `0 30px 80px rgba(0,0,0,0.7)`. Only the panel image zooms (default 1 → 1.08).
- **Cross-fade**: when `frame - shot.start < XFADE`, the previous shot is rendered underneath
  (with its own shot context so its `t` keeps counting) and the new one fades in at
  `opacity = local / XFADE`. XFADE = 14.
- **Continuous push across shots on the same photo**: give consecutive rows touching zoom ranges
  (the Oppenheimer portrait goes 1.1 → 1.3, then 1.3 → 1.45 with a grayscale grade). The cut
  becomes a change of grade, not a jump. A photo that returns later picks up near where it left:
  the closing painting runs 1.3 → 1.5, and two shots later 1.45 → 1.6.
- Per-shot `grade` is a CSS filter on the image: `grayscale(1) brightness(0.65) contrast(1.1)`
  for "after", `blur(22px) brightness(0.3)` when the photo is only a backdrop for a title.

## Parameters
| Parameter | Typical value | How it feels when changed |
|---|---|---|
| Zoom range | 1.0 → 1.15 (portraits up to 1.1 → 1.3) | a delta under 0.06 looks like a still; over 0.25 in 4 s feels like a zoom, not a push |
| Focus | `"50% 30%"` on a face, `"60% 8%"` on a detail | the push direction; wrong focus pushes into an empty corner |
| Pan | `[40, -40]` px | adds a tilt feel on tall paintings; over ~80 px it shows the edge at low zoom |
| XFADE | 14f | under 8f reads as a cut with a smear; over 20f the two pictures muddle |
| Fit panel | top 500, height 720, inset 40 | sits above the caption band; lower and the captions cover it |
| Backdrop blur | 40 px, brightness 0.35 | less blur shows a doubled picture; brighter competes with the panel |

## Known traps
- **The push must not stall at the cut.** If `t` ends at the shot's end, the outgoing shot
  freezes during the cross-fade and the eye catches it. Stretch the range by XFADE.
- **Render the old shot with the old context.** The outgoing scene is wrapped in its own
  `ShotContext.Provider` and a distinct `key`; otherwise it reads the new shot's timing and
  jumps.
- **Zoom origin.** `transformOrigin` must equal `objectPosition`; with a centred origin a cover
  crop pushes away from the face you framed.
- **Zoom never below 1 in cover mode**, or the frame edge shows. `inset: -80` on the fit
  backdrop is there for the same reason: a blur fades its own edges, so the blurred copy must
  overhang the frame.
- **Credits.** Every photo is public domain or CC from Wikimedia Commons, recorded in a
  `CREDITS.json` next to the stills. A shot table makes it easy to add a photo without a licence
  record: add the record first.
- **Chips never contain a profanity** (source comment), even when the person or topic does.

## Pairs with
- [`ember-film-grade`](../effects/ember-film-grade.md): the grade, fire and title flare over these shots (same video).
- [`depth-layer-moves`](depth-layer-moves.md): when one photo should get parallax, not just a push.
- [`transition-hidden-cut`](../transition/transition-hidden-cut.md): an alternative to the cross-fade for matched photos.
- [`tension-camera`](tension-camera.md): the pull-back variant for the one closing shot.

## Reference implementation
- [`photo-push-fit/LoiNguyen.tsx`](../../../src/demo/camera/photo-push-fit/LoiNguyen.tsx) (`useProgress`, `Photo`, `Fit`, cross-fade in `LoiNguyen`)
- [`photo-push-fit/shots.ts`](../../../src/demo/camera/photo-push-fit/shots.ts)
