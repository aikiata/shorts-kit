---
name: shot-transitions
summary: Three camera-handover styles: push-in flowing white, whip-pan (hard-brake version), and mask-wipe through a window (depth version). Choose by energy drop and by the meaning of the seam.
use: Any place where two shots join (technique card; after the shots are laid out in the storyboard stage, pick one style for each seam)
length: n/a (technique card; frame counts for each style are in the parameter table, taken from the adjacent shots' budgets)
energy: n/a (technique card, takes no energy slot)
---

## Intent
The shot cards in the library only handle their own entrance and exit, and "how shots join" has had no vocabulary. A bare cut at the seam leaks all the cinematic feel built up shot by shot at once. The widely admired release films (Linear Releases/Agent, reverse-engineered from extracted frames on 2026-07-11) have not a single bare cut anywhere: scene changes happen either by travel through depth, by focus relay, or by a black title card building up charge. This card collects three styles: a white flash covering the cut, a whip-pan using blur frames to change scenes, and a window punch into a detail world.

## Style choice

| Style | How | Seam it suits |
|----|------|----------|
| A push-in flowing white flash-cut | The previous shot's camera pushes in, and a white flash straddles the cut point to cover the page change | Page → page with interaction punch-through and similar energy (already in the library, folded in) |
| B whip-pan (hard-brake version) | The camera whips sideways to the next scene in one beat, mid-pan motion blur smears it beyond recognition, and the scene change is made on the blur frames. It brakes hard before landing and slides in with a long tail | Rapid-fire feature sections (a light version of high energy → high energy); the landing is a shot that "needs to be read" |
| C mask-wipe through a window (depth version) | A real element in the page (a card) enlarges into a full-screen window, and the new scene grows inside the window and takes over | Semantic seam: feature overview → that feature's detail ("click this card to enter its world") |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| A flash-cut | `assets/lib/FlashCut.tsx`, from = cut point − 5, 5f on each side | See the type-and-filter card for usage. The white flash only covers a hard cut and is not used as a decorative light effect (Q4) |
| B whip-pan hard-brake version | Start hold ≥20f → the first 70% of the distance in 30% of the time (blur segment, peak ~300px/f) → the last 30% of the distance eases out over a ~48f long tail into place. Integrate the displacement from one continuous speed curve (3f ramp-up + exponential decay). Don't apply a separate ease-out to each segment (the speed jumps a second time at the joins). Apply directional motion blur by instantaneous speed (`SpeedBlur` from `_fixtures/Polish`, sd ≈ 0.085×speed, capped at 64px), active only in the whip segment. The reference implementation connects the same displacement curve to a mechanical-roller index counter (Nº 02→09) and a ruler that travels with the gallery + a fixed playhead, and after settling the target card lifts to 1.2× readable | Suits a landing that is a shot that "needs to be read". The long tail gives the viewer's eye a slope to catch up on. A long tail >60f steals from the next shot's entrance, so keep it short rather than long. Size the span so "peak speed ≥300px/f"; if short of that, the blur doesn't smear enough and the scene change shows. The two scenes are stitched on the same horizontal line (page space at the same y). CameraMotionBlur sub-frame stacking at 8 bit tints the whole clip yellow and the trails come out as stepped echoes, so don't use it for whip-pans on bright UI scenes |
| C window depth version portal-wipe | The target card first floats up as anticipation (−10px, 1.03×, neighbor cards dim back) → the window enlarges over 40f with bezier(0.7,0,0.3,1), slow then fast. The new scene inside the window grows from ~0.42 scale back to 1 with reverse compensation (the same t as the window geometry). The card face fades out in the first ~28% of travel (opacity 1−t·3.6; slower and it stretches into a giant-text full-screen afterimage). Inside the window **only 2 layers** of parallax (far panel factor 0.08 + near 2 cards 0.3, no blur). After the punch-through completes, an 8f soft stop → still ≥30f to read the new scene. The world inside the window is best the cover of the opened card "growing up" (reference implementation: in the shorts-kit Workspace, the cobalt-blue waveform cover of the "Premiere Forecast" project card → a view-count forecast world with the same waveform terrain + glass panels + 2 metric float cards, the curve drawing itself complete along t) | Window geometry and the scene inside must be driven in sync; out of sync reads as a glitch. Layer count / spread is the key to readability: the 3 layers + 0.85 spread + blur version was rejected, and passed after being reduced. After punching through, it must truly stop. Parallax that keeps drifting steals reading from the next shot |

## Known traps
- Mark the transition style for every seam at the storyboard-table stage (write it into the "key motion" column). Adding them only at the per-shot stage means shifting frames across the whole line. The frames a transition uses are taken from the adjacent shots' budgets, the same rule as the hold budget (R3).
- Transitions are not stacked: one seam uses one style. Adding a flash on top of the whip-pan blur segment or midway through the window punch reads as a glitch.
- The parameters for B/C were tuned on placeholder material and then promoted on real material. They are not rulings from the user's own field use. They are a single-case ruling, and when they conflict with a ruling, the ruling wins.
- The new scene inside the window in style C should semantically be the "detail world" of the opened element (in real use, connect a real detail-page screenshot). Putting an unrelated scene in the window breaks the semantics and ends as a fancy wipe. The enlarged element uses a high-resolution texture (Q2, since it is in close-up the whole time).
- The parameters of C depth version are a tuning starting point on hand-built placeholder UI (shorts-kit Workspace / view-count forecast world), not verified with real screenshots. Reference implementation: src/demo/transition/shot-transitions/PortalWipeV2.tsx

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`shot-transitions/PortalWipeV2.tsx`](../../../src/demo/transition/shot-transitions/PortalWipeV2.tsx)
- [`shot-transitions/WhipBrakeReal.tsx`](../../../src/demo/transition/shot-transitions/WhipBrakeReal.tsx)

