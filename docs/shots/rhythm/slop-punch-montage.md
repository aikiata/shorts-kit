---
name: slop-punch-montage
summary: Rapid-fire hard cuts on the beat, each one a spring punch-in that blows up ONE failure of a deliberately bad, fictional UI (NaN%, Loading..., 187% done!!) until it fills the frame, with a shake, an RGB split and a white flash on every cut.
use: the pain-point opening of a promo: show "what you get today" as comedy, one readable failure per cut, before the product turns it
length: about 9 s (271 frames): five slop macros of 30 frames, three code cuts of 45 frames
energy: high
tags: pain-point, montage, punch-in, hard-cut, beat-sync, comedy, problem
source: knowns-ui/launch-tvc
---
# slop-punch-montage

## Intent
The film opens on the pain, not the product. One fake "AI-generated" screen is drawn on
purpose as gradient soup, emoji, misaligned cards and broken states. Each cut picks ONE of
its failures and punches into it until the words read at a glance. The viewer laughs, then
recognises the problem. The montage then moves from the picture of the slop to its cause:
a wall of Tailwind classes, `// TODO: fix later`, a red `TypeError`, a day counter rolling
from 29 to 30. Every cut keeps pushing in; nothing stands still.

It differs from [`rhythm-interrupt-moves`](rhythm-interrupt-moves.md) (one composition
jumping larger) and [`beat-cut-moves`](beat-cut-moves.md) (flashes on one frame): here every
cut is a new focus point on the same drawn screen, so the joke is "and this is broken too".

## Motion core
- One screen component (`SlopScreen`, 1158x522) drawn with plain divs. A shot is a focus
  point `(fx, fy)` in screen pixels placed at the frame centre, a scale `s` and a small tilt
  `rot`. The screen is wrapped in a 3000 px bleed of the same gradient so a high scale never
  shows the edge.
- Scale per frame: `s * (0.8 + 0.2 * sp) * (1 + 0.05 * frame / 15)`. `sp` is a stiff spring,
  so the punch lands in about 5 frames, then the slow creep keeps the shot alive.
- The first cut is a slam: an extra `1.5 - 0.5 * sp` factor, so it lands from 1.5x too big.
- On every cut: a decaying shake (`sin(frame * 3.1) * (7 - frame) * 2.2` px, first 7 frames),
  an RGB split as two coloured drop-shadows (`(5 - frame) * 3` px, first 5 frames) and a
  white flash (0.35 to 0 over 2 frames; 0.9 to 0 over 3 frames on the slam).
- A small reaction character in the corner bumps on each cut (scale `1 + 0.35 * react`,
  rotate 12 degrees, both decaying over 9 frames), and alternates its tilt direction.
- The spoken lines sit in a separate lower-third layer over all cuts (`ProblemType`), with a
  heavy black text shadow so they read on any cut (C1). "slop" gets a line-through after it lands.
- Cuts sit on a 0.5 s grid: `cb(k) = 0.04 + k * 0.5`, every 2 beats for the slop macros,
  every 3 beats for the code cuts.
- Code cuts: a wall of class strings scrolling at different speeds per row with a horizontal
  SVG motion blur that drops from 30 to 6 px; `// TODO` typed at 1.6 chars per frame with a
  blinking caret; a red `TypeError` that slams from 1.45x with shake and a red flash; a day
  counter whose digits roll in frames 4 to 12.

## Parameters
| Parameter | Typical value | Feel when changed |
|---|---|---|
| Cut length | 30 frames (2 beats at 120 BPM); code cuts 45 frames | under 20 frames the failure cannot be read (C6); over 45 the joke goes flat |
| Macro scale `s` | 2.07 (slam) to 4.4 (`[object Object]`) | pick the scale that makes the failure text at least 80 px on the frame (C7) |
| Punch spring | damping 12, stiffness 220, mass 0.6 | softer springs read as a glide, not a cut |
| Creep | +5% per 15 frames | without it a 30-frame macro freezes |
| Shake | 7 frames, amplitude `(7 - frame) * 2.2` px | longer reads as handheld (Q3) |
| RGB split | 5 frames, up to 15 px | longer reads as a glitch effect instead of an impact |
| Flash | 0.35 for 2 frames (slam: 0.9 for 3) | a full flash on every cut tires the eye |
| Tilt `rot` | -2 to 2 degrees, alternating | flat every time looks like a slideshow |
| Cut sound | one soft glitch per cut, volume 0.105 x 0.6, 9 frames long | louder stacks into noise under the voice |

## Known traps
- **R4.** Shake and flash on every cut act on the whole frame. Here each one is part of a hard
  cut and dies inside 7 frames, so it reads as a cut accent, not a pump. Do not add a scale
  pump between cuts, and keep the flash small (0.35) on all but the slam.
- **C6 and C2.** Each failure must be readable once. Five slop cuts plus three code cuts was the
  limit; a sixth macro in the same 2 beats made the montage flicker.
- **Q1.** The bad UI is drawn and fictional: no product, brand or logo. Keep it that way, and
  keep it obviously broken so nobody mistakes it for a real tool.
- Determinism: the screen's wobble is `Math.sin(jit * 0.9 + k)` driven by the frame (and a
  per-shot offset `7 * fx`), never `Math.random`. The grain overlay is a still SVG noise tile.
- Every emoji comes from a bundled emoji font, not the OS font, or the render changes per machine.
- The 3000 px bleed matters: at 4.4x the screen edge shows within a few frames of creep.
- The lower-third type lives outside the cuts. If it is inside a cut, it restarts on every cut.

## Pairs with
- [`record-stop-hold`](record-stop-hold.md): the montage ends on it.
- [`beat-grid-whip-cuts`](beat-grid-whip-cuts.md): the cut table these shots sit in.
- [`crash-zoom-punch`](../camera/crash-zoom-punch.md): the single-target version of the punch.
- [`trailer-bumper`](trailer-bumper.md): a calmer cold open for films without a pain point.
- Sound: [`glitch`](../sfx/glitch.md) per cut, softened.

## Reference implementation
- [`slop-punch-montage/Problem.tsx`](../../../src/demo/rhythm/record-stop-hold/Problem.tsx): `SlopMacro`, the code cuts, `problemShots`, `ProblemType`
- [`slop-punch-montage/tvc.tsx`](../../../src/demo/rhythm/slop-punch-montage/tvc.tsx): `SlopScreen`, `Stage`, `Finish` (grain and vignette)
- [`slop-punch-montage/motion.tsx`](../../../src/demo/rhythm/slop-punch-montage/motion.tsx): `Word`, `f`, `clamp`
