---
name: transition-hidden-cut
summary: Three hidden-cut transition styles: foreground-occlusion invisible cut, collision opener, and warm light leak. The hard cut is hidden in 1–3 frames of occlusion / impact / light peak, so the viewer never sees the scissors.
use: When two shots join and need a "seamless scene change" or a "ritual opener" (technique card, chosen on the same layer as the three shot-transitions styles)
length: n/a (technique card; frame counts for each style are in the parameter table, taken from the adjacent shots' budgets)
energy: n/a (technique card, takes no energy slot)
---

## Intent
Same family as shot-transitions style A flash-cut: flash-cut uses a layer of white flash to cover the hard cut, and these three styles use three other "blinds": a sweeping foreground card (A), the impact frame of a collision (B), and a light leak climbing to its peak (C). The shared principle is a magician's misdirection: in the 1–3 frames when the viewer's eye is pulled away by a big action / strong light, the hard cut is made, and by the time they look back the scene has changed, so "the scissors are never seen". Flash-cut is the plainest option. Choose A for a sense of direction, B for a sense of ritual, C for warmth.

## Style choice
| Style | How | Seam it suits |
|----|------|----------|
| A invisible-cut foreground-occlusion invisible cut | An out-of-focus foreground object skimming past the lens (wider than the frame, soft edge = defocus + motion blur) sweeps across, and on the occlusion frame that fills the whole screen the background hard cuts A→B. The foreground sweeps out and the viewer thinks it is still the same shot | Page → page where the scene change must be totally seamless; the main style for a fake "one take" |
| B versus-slam collision opener | Two half-screens (two comparison posters) with slanted cut edges accelerate in from off screen and collide. The impact frame has a white flash + screen shake + a VS stamp, and the cut point is the impact itself | Openers or chapter heads with comparison / head-to-head semantics (old vs new plan, two products, before/after) |
| C light-leak-burn warm light leak | A warm light leak in three color temperatures sweeps diagonally. On the peak frame when the light has swallowed more than 70% of the old picture, hard cut to the new picture, and by the time the light fades the new picture is in place | Chapter transitions that want a warm / film flavor; softer than a white flash, with direction and temperature |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| A occluder | A dark-brown defocused foreground drawn purely with gradients: solid core 2600px + 340px soft edges on both sides (total width 3280), with one terracotta rim light on the leading edge. Right → left in 14f (32–46f), bezier(0.3,0,0.7,1). The cut point = the frame where the solid core covers 0..1920 (f39 in the demo, with the frames before and after covered by the soft edges) | The soft-edge gradient is itself defocus + motion blur, so CameraMotionBlur isn't needed (12× sampling is too expensive). The light/dark overlay on the occluder must be limited to the solid area with a mask, otherwise a hard edge is drawn on the transparent soft edge |
| A near-object shading | A 640px soft drop shadow in front of the occluder (0→0.38→0.5) sweeps across the page with it | Sells the distance of "skimming past the lens" |
| A one take | The whole content drifts slowly sideways +40→−40px (smooth) through the cut point. Before the cut, A is dragged left 28px (ease-in), and after the cut B settles back from 28px on the right over 14f (ease-out). B's layout as a whole is shifted right 40px to offset the end of the sideways drift | Sells the illusion that "the same shot was carried by a gust of wind", and accounts for half of the seamless feel. The sideways drift eats safe margins, so reserve room at the end point |
| A cause and effect | At 24f, Render is pressed (0.96 scale + darken + Rendering… spinner) → sweep → B "That's a wrap." render-complete ticket stub + stamp springs into place, check mark drawn | Give an action before the occlusion and a result after the cut, and the viewer reads it as "done in a blink" |
| B slanted-seam geometry | clip-path polygon slanted edge about 78° (seam top x=1075 → seam bottom x=845). The two half-screens collide into place from ±1240px with ease-in(cubic) in 10f (18–28f), with horizontal motion blur by speed (capped at 36px) | Ease-in acceleration is what gives the "slam" feel; a vertical seam reads as a PPT split screen |
| B impact trio | On the impact frame (28f) fire together: paper-white flash 0.85→0 over 3f + whole-rig shake 16px·e^(−t/1.7) settling in about 5f + VS round stamp pressed out by a spring (damping 12 / stiffness 260, scale 1.9→1, one visible overshoot). Also an impact ring over 16f + 12 radial speed lines over 7f | All three must start on the same frame, and one frame apart they fall apart. The shake amplitude must clear the threshold of the naked eye (perceptibility ruling) |
| B layout | The two sides are made as color-block posters: ink black "The old way" vs vermilion "With shorts-kit", each with one 340px large number (14 days / 1 prompt) + 44px description + 32px list. After the collision the numbers bounce back 1.05→1 (2f late), and the description staggers left first and right after. From 54f a bottom conclusion bar (camera-engraved logo + brand slogan) presses across the slanted seam | The numbers themselves are the comparison conclusion. The set-up segment holds one rhetorical question, and an ink line foreshadows the slanted seam (leave the type band empty, don't draw type there) |
| C light layers | 3 radial gradient ellipses stretched along the diagonal (1.35:1, rotated −34°) (#c2311a / #ff5a1f / #ffb347, major axes 3000/2300/1700px, screen, no blur filter) + a film-gate overflow light line as a linear light band at the upper right edge, sweeping from upper right → lower left over 71f | Offset the light blobs in a trailing arrangement along the sweep direction, avoiding a perfectly concentric "flashlight feel". The gradient is soft by itself, saving a 90px large blur |
| C light intensity envelope | ease-in (t²) rise over 28f (24–52, charge-up) → the cut is hidden on the peak frame → ease-out convergence over 43f (afterglow). At the peak, overlay a 40% full-screen warm veil + a near-white-hot core (opacity=intensity³) + a light 2f lift at the cut point | Slow rise and fast convergence read as a glitch flash; the hot core burns up only near the peak |
| C washing out | At the peak, page filter: brightness raised 85%, contrast lowered 50%, saturate lowered 25%. The old picture's title fades to ~25% with the light intensity | This is where the "burned through" feel comes from. If the light is only overlaid and nothing is washed out, it reads as a sticker pasted on. If the title doesn't burn out with it, the viewer sees the text suddenly swap at the cut point |

## Known traps
- The demo was tuned on procedurally drawn pictures (A warm sand shorts-kit render page / B paper comparison poster / C dark-field shorts-kit viewfinder night → dusk, with the brand short phrase "Frame motion. / Craft the shot." cut in half by the light peak). The parameters are a tuning starting point, not a field-proven final. The first real use must be re-checked with real material.
- Style C is the first light-effect technique put into the library after the Q4 light-effect ruling was lifted. Follow the three Q4 constraints strictly: single-point use (one place per film, not scattered), it must look good on a normal-speed playback self-check to pass, and light effects serve the cut point rather than decoration. Mixing it with flash-cut in the same film counts as two light-effect hidden cuts.
- The occluder in style A must truly cover everything: in the demo only a 2600px solid core leaves a full-cover window of about 1 frame (mid-segment speed ~530px/frame). After changing the sweep duration or width, first calculate / check frame by frame whether the cut-point frame shows any edge of the background. If a gap shows, the whole trick is exposed.
- The VS block semantics of style B fit only "comparison / head-to-head" content. Without a confrontation between two sides, don't use it as a general transition. Without VS, only the collision is left, which degrades into a slanted-seam wipe, and the semantic requirement drops with it.
- Transitions are not stacked (same rule as shot-transitions): one seam uses one style. These three styles are chosen on the same layer as the three shot-transitions styles. In one film, don't use both flash-cut and style C for the same kind of seam.
- Mark every seam at the storyboard-table stage (write it into the "key motion" column), and take the frame budget from the adjacent shots (R3).

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`transition-hidden-cut/InvisibleCut.tsx`](../../../src/demo/transition/transition-hidden-cut/InvisibleCut.tsx)
- [`transition-hidden-cut/LightLeakBurn.tsx`](../../../src/demo/transition/transition-hidden-cut/LightLeakBurn.tsx)
- [`transition-hidden-cut/VersusSlam.tsx`](../../../src/demo/transition/transition-hidden-cut/VersusSlam.tsx)

