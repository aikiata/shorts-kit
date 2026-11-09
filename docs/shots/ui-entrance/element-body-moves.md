---
name: element-body-moves
summary: Element body feel. Contact-shadow-lift: the shadow on the table scales up and fades as the card lifts, and the shadow proves the paper has left the table
use: Adds "the body is changing" on top of "the position is changing": gives a card called out proof of hovering; pairs with 2.5D camera moves and card-by-card call-outs
length: A 150f 5s
energy: A low-medium
---

## Intent
All the motion cards in the library handle "the position is changing": fly in, slide, bounce, while the element itself stays a rigid body.
This style handles **the body is changing**: it gives hovering a believable proof. When the card lifts, the shadow directly under it grows and fades,
the paper has left the table, and this is the physical line that the staging principle gives to 2.5D camera moves. The difference from CameraMotionBlur:
shutter smear is the camera's business; lifting off the surface is the body's business.

## Options
| Style | How | Use |
|----|------|------|
| A contact-shadow-lift | On a table seen from a slanted top-down view (rotateX 24°→20°), the card does translateZ 96px along its normal + scale 1.05. The shadow is two independent solids lying on the table at z=0 (contact core + ambient shadow) that grow, blur, fade and shift toward the unlit side as it lifts. The called-out card drops back with 8f in-cubic + a 2f slight press into the card shell, and the last selected card springs up and stays in the air | Card-by-card call-out emphasis; the off-surface setup of 2.5D sections |

## Parameters
| Parameter | Typical value | Feel when tuning |
|------|--------|----------|
| A lift amount | 2D: −28px + scale 1.08; 2.5D slanted top-down: translateZ 96px + scale 1.05 (visible screen displacement 40–50px) | Locked by precedent: do not use when the visible screen displacement is <12px (see Known traps) |
| A shadow | independent div (2D uses an elliptical radial gradient; 2.5D uses a rounded rectangle of the same shape as the card + blur): contact core α 0.32→0.14, blur 3→25px; ambient shadow α 0.09→0.22, blur 14→54px, offset to the lower right; the card body carries no drop shadow | A box-shadow follows the card and cannot give "the shadow stays on the table" |
| A landing | scale 0.99 into the shell 2f, then 5f rebound to 1 | Without the slight press it reads as floating down, with no weight |
| Ending | after the last card is selected, hover for about 50f | If you want to loop, make the last one drop back the same way |

## Known traps
- The demo passed tuning on grayscale / placeholder material. The parameters are a tuning starting point, not a final production setting;
  the first production use must re-verify on real material
- A small-amplitude precedent: the original 8px lift was not perceivable and only passed when raised to 28px. In production never dial back below 12px; better not to use it than to use it weakly
- A lifts one card at a time. If two leave the table together, the viewer cannot find which one was called out (P4)
- Sound: a light suck on lift, a light set-down on drop back (sound-design §4.5)

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`element-body-moves/ContactShadowLift.tsx`](../../../src/demo/ui-entrance/element-body-moves/ContactShadowLift.tsx)

