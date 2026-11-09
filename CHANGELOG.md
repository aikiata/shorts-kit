# Changelog

## 2.0.0 (2026-11-09)

Product promos join narrated shorts: the same engine, a second pipeline, and the shot and component libraries
both now lean on.

### Promos
- `sk-promo` and `docs/promo/`: ads, TVCs and launch films, vertical (feed) or landscape (16:9), with or without
  a few spoken lines.
- The gates before a build: objective, CTA, mandatories and placement; the user's pain first; two or three
  concept routes; a confirmed treatment; a timed animatic; a shot-by-shot storyboard; a deliverables matrix.
  After it: a stranger comprehension test and an aesthetics review pass (`docs/promo/aesthetics.md`).
- `bun run beats` measures a track's beat grid; scenes are timed in beats on it.
- `bun run voice` makes a promo's few spoken lines with word times, so type lands on the spoken word; a line can
  belong to one cutdown only (`only`).
- Cutdowns and extra formats as their own compositions, each on its own clock.
- `bun run lint` checks a promo's clock and files; `bun run encode` checks the upload's true peak.

### Shots and sound
- `docs/shots/`: 161 motion cards in ten folders (camera, typography, UI entrances, rhythm, transitions,
  effects, outros, interaction, data, opening) and sound cards for the SFX pack (`docs/shots/sfx/`).
- Storyboard shots carry a `size`, an `angle` and a `card`; a voiceless promo pins shots to scene + beat.
- `src/demo/`: the reference code the cards link to (kept, not built).
- New cards: `isometric-pile`, `typed-prefix-states`.
- The demos carry the kit's own name and mark (`ShortKitMark`, `ShortKitWordmark`, `ShortKitIcon` in
  `src/shared/fixtures/Brand.tsx`), and every text in them, the page textures in `public/textures/live/` included,
  is in English.

### Real components
- Knowns UI is the default kit for interface pieces in any video (`docs/promo/real-ui.md`).
- "The product's own repo": copy a product's components into a video folder, shim the framework, build its own
  stylesheet with `bun run css <id> --dir <folder>`, keep live data and images locally.
- `bun run capture`: `--type "css=text"` types into the page (its own search runs) and `--hide "css"` removes
  overlays such as a consent banner without answering them.

### 3D
- `src/shared/three/`: shots, camera rigs, a model loader for `.glb`, callouts glued to a body point.
- `bun run model <name>`: procedural models built headless with Blender (`scripts/blender/`).
- `src/shared/motion/iso.tsx`: CSS-3D isometric planes, slabs with depth, piles and the turn to front-on.
- Status: the gallery's 3D shots render; awaiting the owner's review before release.

### Preview
- The local dashboard is rebuilt in Knowns UI: Brief and Timeline tabs, promos (landscape, every deliverable),
  storyboard cards with size, angle and card, playback, `--lan` for a phone on your Wi-Fi.

### Shared
- New shared pieces split by job: captions (`InfoStrip`, `DigitRoll`), frames (`ClipCard`), effects
  (`FlashCut`), motion (`PageCam`, `VerticalTicker`, velocity, handheld), fixtures.

## 0.1.0

The first release: narrated vertical shorts with a coding agent (skills, SOUL, flows, fact ledger, shared
Remotion library, maps and globe, TTS engines, recorded voice, preview dashboard).
