---
name: gradient-transition
summary: The background transitions smoothly between three kinds of CSS gradient: linear, radial and conic. Angle, color stops, center and radius are interpolated parameter by parameter, and the type changes with a cross-fade between segments.
use: Continuous variation of an ambient background / chapter background color. Gives static typography sections a "living" background layer.
length: about 6.7s (200f@30fps; linear 0–2.3s · radial 1.9–4.4s · conic 3.9–6.7s)
energy: low (pure background motion, yields to the foreground content)
---

## Intent
A gradient is not a static texture but an animatable set of parameters. Any parameter inside a gradient of the same type can be interpolated into a silky change, and across types a short cross-fade bridges them. Used as a background layer, it gives sections with "no subject motion" a continuous low-speed energy.

## Motion core
- Three layers each hold one gradient type. Only one layer dominates at any moment. The cross-fade window is narrow (12–14f) and both layers are moving inside the window.
- Linear segment (0–68f): angle 18°→198° (swift in-out), three lightness-level color stops (64→40→7) interpolated in HSL space on three channels (`mixH` lerps h/s/l separately, which does not gray out like RGB). The lightness must be spread apart so the bright band's direction shows that "the angle is sweeping".
- Radial segment (56–132f): center (24%,72%)→(68%,38%) diagonal migration + radius 48%→80% expansion, the outer ring near black, so the light spot seems to wander and focus in the frame.
- Conic segment (118–200f): A→B→C→A three-color ring (purple / magenta / ice blue, first and last the same color), `from` rotating 0→250°, slow start and long tail, easing so it turns slower and slower as it settles. The center is placed behind and to the right of the subject at (64%,54%), and the outer ring and the text side are darkened further.
- **Painting on a small canvas**: the three gradient layers are painted at 480×270 and then covered full-screen with `transform: scale(4)`. The enlargement at compositing time naturally softens them. The conic blur(9px) is done on the small canvas (≈36px at full resolution), so the per-frame cost is 1/16 of a full-screen real-time blur. Grain is overlaid on top to prevent banding.
- Demo foreground: one large line (180px) per segment, with verbs describing that segment's parameter motion (Bend light. / Focus it. / shorts-kit wordmark + brand short phrase). The line change and the type change happen on the same beat, and a mono note at the bottom reads out in real time the gradient parameter being interpolated.

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Segment window overlap | Next segment starts 12f before the previous one ends | The overlap ensures both layers are moving during the fade; with no overlap you see "a still moment at the handover" |
| Cross-fade | 56–68f / 118–132f (smooth in-out) | Widening it shows two gradient structures fighting on screen; a narrow fade with parameters moving together is the key to "changing type without changing breath" |
| HSL interpolation | h/s/l lerped independently on three channels | When the hue difference is >180° it takes the long way around (such as 340→160). To take the short path, add +360 to the start |
| Color stop lightness difference | linear bright 64 / mid 40 / dark 7 | With a lightness difference <20, the angle sweep can't be read, leaving only a flat base that changes color |
| Radial migration | Center moves diagonally + radius 48%→80% | A fixed center with only the radius expanding reads as "breathing", not "wandering" |
| Conic rotation | from 0→250° (less than a full turn, ease-out long tail) | A full 360° makes the ending frame the same as the start, useful when looping. For a single play leave a gap to avoid the "back to the origin" feel |
| Color stop set | All three segments use the same purple / magenta / ice blue set | When swapping in a project color, keep the "bright color + dark color" pairing structure. The radial outer ring must be dark (the precondition for the light spot to work) |

## Known traps
- This is a background card. When the foreground holds typography / UI, overlay a dark scrim on the text side (the demo has a linear darkening on the left + outer vignette), otherwise the bright colors of the conic segment eat the foreground contrast.
- The R of `radial-gradient(circle R …)` accepts only a length: writing `circle 45%` voids the whole gradient and that segment renders pure black. Either convert the percentage radius to px (the demo uses the small canvas width of 480px as 100%) or switch to `ellipse X% Y%`.
- Rewriting the CSS gradient string every frame triggers repaint rather than composite. Test on large frame sizes + low-end devices. Remotion server-side rendering has no such concern.
- The conic segment uses a three-color cycle (A→B→C→A). A seven-color rainbow ring is a "show" kind of thing, so don't use it in branded scenes.
- Each of the three segments can be used on its own: just the linear segment (renormalize 0–68f) is a minimal "angle sweeping" base.

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`gradient-transition/GradientTransition.tsx`](../../../src/demo/transition/gradient-transition/GradientTransition.tsx)

