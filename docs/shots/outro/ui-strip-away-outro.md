---
name: ui-strip-away-outro
summary: A subtractive ending. After Publish is clicked, the whole editor UI evaporates staggered from the periphery to the center, layer by layer. On a black field only that button remains, sliding to the screen center and enlarging; then the button fades out and hands off to the wordmark for the final set.
use: Outros with "publish / done" semantics; product endings that want to say "after one click all complexity disappears"
length: ~4.8s (144f: cursor arrives 34f → evaporation ~40f → button alone → wordmark takes over → wordmark hold ≥1s)
energy: medium (quiet operation in the first part, continuous exit in the middle, no instantaneous impact)
---

## Intent
The endings in the library are all "additive": outro-group-photo-launch has elements flying in for a group photo, and the logo
sting holds still and then adds an easter egg. This card is the only "subtractive" route: the click detonates the exit of the whole UI,
leaving only the semantic focus (the button that was clicked) on a black field, translating "publish = complexity goes to zero" into
a motion narrative. There are two cruxes: **the evaporation needs order**: from the periphery to the center, one layer every 4f,
each layer with a directional displacement (each scattering off-frame); out of order or all going out on the same frame reads as a power-failure glitch;
**the button is the only survivor and must migrate**: during the evaporation it slides from the corner of the toolbar to the screen center
and enlarges 1.5×, with the white halo strengthening as the field goes black, completing the promotion from "UI control" to "ceremony lead",
and finally it fades out to hand the black field to the wordmark.

## Motion core
- 6 evaporation layers: sidebar → properties panel → canvas cards → toolbar ends → canvas base → toolbar middle,
  starting 4f after the click, one layer every 4f; each layer STRIP_DUR 14f, Easing.in(quad)
  accelerating off, fade + directional displacement + 0→7px evaporation blur (sidebar −140,0 / panel −90,20 /
  toolbar ends ∓80,−60 / canvas base 0,40 / toolbar middle 0,−50)
- The 4 cards inside the canvas are each staggered a further 3f, with displacement alternating left and right (±70px): a big block vanishing as a whole
  reads as a layer being deleted, and breaking apart and leaving is what reads as "evaporation"
- Background goes black: following the canvas base layer's evaporation (from +20f for 20f) gray base → #111110
- Button: on click a spring(damping 12, stiffness 220) compress pulse; during the evaporation
  position/size interpolate sliding to the screen center (18f, inOut cubic), scale ×1.5, white halo
  30→70px strengthening as the field goes black; from +52f a 12f fade-out
- Wordmark takes over: at +62f spring(damping 14, stiffness 90) fade-in +
  86%→100% scale, final set on the black field
- The cursor fades out within 10f after the click: the lead changes, so the cursor must exit

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| layer stagger | 4f × 6 layers | All out on the same frame reads as a power cut; >8f drags into a slow demolition and the ceremony scatters |
| single-layer duration | 14f, ease-in acceleration | An ease-out exit reads as "floating away", not "evaporating"; >20f is sticky |
| evaporation order | periphery → center, the button's layer last | The center emptying first reads as a glitch; the button's layer leaving first collapses the whole card |
| displacement amplitude | 50–140px, each direction toward off-frame | Pure fade with no displacement reads as an opacity tweak; the same direction reads as a whole-screen pan |
| button migration | 18f slide to the screen center + scale ×1.5 + halo strengthening | Without migration a small button sits in a corner of the black field and reads as a missed deletion; the order of migrating first and fading later can't be reversed |
| wordmark takeover | enters ~10f after the button fades, set with a spring | On the same screen as the button they fight for the scene; a black empty window >20f feels like it has finished playing |

## Known traps
- The demo was tuned on grayscale/placeholder material. The parameters are a tuning starting point, not a final production setting.
  The first production use must be re-verified on real material
- Division of labor with outro-group-photo-launch: the group photo is an "additive" peak final shot (the whole cast of a multi-feature
  product taking a bow), this card is a "subtractive" ending (a single action's semantics, getting quieter as it goes). Pick one
  by product temperament; do not use both as endings in one piece
- Each evaporation layer must be a **semantically complete UI block** (sidebar/panel/toolbar); cutting layers by
  pixel region exposes structurally unreasonable broken states during the stagger
- The button keeps the top zIndex throughout its migration: any evaporation layer drifting past in front of the button gives it away
- The triggering action must have "terminal" semantics (Publish/Ship/Done); triggering a whole-UI evaporation with Save or an ordinary
  confirm makes the semantics unequal to the pomp
- In production the button uses the brand highlight color (the source is Framer blue), and the demo uses an accent indigo as a placeholder:
  the contrast of the button and halo on the black field is the lead's halo, and a weak color fails the promotion

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`ui-strip-away-outro/UiStripAwayOutro.tsx`](../../../src/demo/outro/ui-strip-away-outro/UiStripAwayOutro.tsx)

