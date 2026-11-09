---
name: light-play-moves
summary: Two light variants: spotlight-sweep (a spotlight sweeps across text) and sheen (a single-point sweep of light).
use: Treat light as another kind of brush stroke (sweep/wipe): a dark-stage title reveal (A), crowning the lead card (B)
length: A 170f ~5.7s / B 150f ~5s
energy: A medium / B low
tags: typography
---

## Intent
So far the library's "light" was only the single-point spotlight-hero-card. These two variants turn light into
a system with two brush strokes and two jobs. A is the **sweep**: a title that is almost invisible on a dark stage is swept bright by a swinging cone
of light, lit wherever the light goes. The difference from spotlight-hero-card is that one lights a card and
this one sweeps text. B is the **wipe**: a 45° highlight band wipes slowly once across a dark-ink lead card, clipped by
the rounded corners, a silent coronation.
Everything is on a dark base or a dark lead. **Brightening is invisible on a white base** (precedent) is the foundation of this whole card.

## Choosing between the two
| Variant | How | Use |
|----|------|------|
| A spotlight-sweep | Two layers of the same text: the dark version stays at 0.07, the bright version follows the light spot through a radial mask. A pendulum-style follow spot swings two and a half passes to and fro with damping and stops dead center, then the iris opens to full brightness and holds (demo title "Craft the shot.", closing on the shorts-kit wordmark). | Dark-stage opening with a big title reveal |
| B sheen-sweep | As a dark-ink card (demo: a titanium-black metal card with the single-color shorts-kit mark and wordmark etched in) turns toward the light source, a 115° highlight band sweeps once, clipped by overflow hidden with rounded corners. | One coronation during the still stretch of a lead card |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| A contrast | Dark version 0.07 vs full bright 1.0; the demo uses warm white #f8efe2 serif text on a wine-black velvet curtain (#1a0a0d→#070203), and the curtain is also lit only inside the light spot | Contrast is the whole point of this variant; a dark version above 0.15 has no "lighting up" |
| A light spot | ellipse 360px (hard core + long soft edge), pendulum: x = 960+600·sin θ·env, θ starts at −π/2 (far left), period 50f, runs 2.25 cycles until f121; y follows a downward arc (lowest 44px at center); env smooth-eases to 0 after the first swing, and x and velocity both reach zero at f121 (a pure sin would brake hard at the center where it is fastest); at lamp-on 4–10f the filament warm-up flashes twice | f121–141 iris opens 360→1080px to full bright (out-cubic), the light cone narrows linearly into a soft top light (precedent on decoupling spread/dissipation) |
| B highlight band | Width 2× the card width, 115° gradient: wide soft light 0.14 + narrow bright core 0.5 (warm white, screen), swift single sweep over 58–90f; during the same span the card rotateY 21°→14° (turning toward the light source = the physical motivation for the sweep); the brushed texture under the band and the bright copy of the etched text are revealed by the same mask | A 0.5 core is loud enough on titanium black without smearing; two-way clamp + conditional mounting guarantee a single sweep |
| Unmounting | The sweep (B) is mounted conditionally and unmounted when done; A's light cone narrows into a permanent soft top light | A layer left at opacity 0 is still composited every frame: unmount light layers you do not use |
| Ending | A ~30f / B ~55f hold; the hold stretch keeps only very slow motion (A dust and top light breathing, B card rotateY another 1.5°) | No handheld shake (Q3) |

## Known traps
- The demo was tuned on grayscale/placeholder footage. The parameters are a tuning starting point, not a final production setting.
  On first real use, re-verify against real footage.
- **At most 2 light effects in total per film**: light is the fastest technique to cheapen, and flashing on every card
  makes a cheap template.
- B passed a high-bar retry: the old rejection (precedent of 2026-07-13) was about the implementation of the time looking bad,
  not about the path being unworkable. Four constraints = single point + lead + rounded clipping + only one sweep. Violating any
  one sends it back to the rejected zone.
- A dark base is the foundation: both variants depend on a dark base/dark lead. Skip this card for light effects on a white base.
- A and spotlight-hero-card: choose one per film, both are "spotlight" vocabulary.

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`light-play-moves/SheenSweepRetry.tsx`](../../../src/demo/effects/light-play-moves/SheenSweepRetry.tsx)
- [`light-play-moves/SpotlightSweepReveal.tsx`](../../../src/demo/effects/light-play-moves/SpotlightSweepReveal.tsx)

