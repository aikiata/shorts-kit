# crash-zoom-punch

**Job:** name a target. From a wide shot, slam to a close-up of one card or module in
6 frames, so the viewer's eye has no choice. A slow push says "please look"; this says
"LOOK AT THIS".
**Length:** about 0.5 s of motion (6-11 frames), at least 30 frames of wide before it to
establish, at least 45 after it to read the close-up. **Energy:** high but instant.

## Variants
| Variant | Landing | Use |
|---|---|---|
| Rebound | overshoot, then settle back 3-6% (2.6 → 2.45) | elastic: "look at this" |
| Impact stop | no rebound; camera shakes at the landing frame and the shake dies out (about 14 px, decay constant about 1.8 frames, dry by 6 frames) | heavy: "this is the one"; pick it for emphasis |

## Parameters
- Zoom 6 frames, ease-in (accelerating), for example 1 → 2.6; centre moves to the target
  with the same curve.
- A 3-4% pull-back in the 6-8 frames before the punch (back first, then forward).
- While the wide is held, a very slow creep of 2-3% so it does not freeze.
- Motion blur only on the fast push, never on the shaking landing. Blur by sampling
  sub-frames; space the echoes no further apart than the text is tall, or you see ghosts.
- Small text in a captured page is tiny (about 14 px): zoom with layout-level scaling so
  it stays sharp (see `docs/promo/aesthetics.md` Q2).

## Pairs with
A flash or a flare on the landing frame for a reveal. In a pain-point film this is the
moment the product's real UI first fills the frame.

## Reference implementation

The source demo this card was rewritten from (shorts-kit, kept as reference, not built):

- [`crash-zoom-punch/CrashImpactReal.tsx`](../../../src/demo/camera/crash-zoom-punch/CrashImpactReal.tsx)
- [`crash-zoom-punch/CrashZoomReal.tsx`](../../../src/demo/camera/crash-zoom-punch/CrashZoomReal.tsx)
