---
name: isometric-pile
summary: An orthographic isometric plane in CSS 3D: things pile up as slabs with real depth (dealt faster and faster), and one slab turns from isometric to face the viewer when it is time to read it.
use: "Too many of the same thing" (tabs, lists, tickets, files) piling up; a pile collapsing into one product window; a closing "family photo" of app icons or features rising as blocks.
length: about 4-6 s (a pile 2-4 s, the turn to front-on 0.8-1 s, then a hold)
energy: medium; the pile accelerates, the turn is calm
---

## Intent
A pile says "a lot, and all the same" before a word is read, and isometric keeps it tidy: no perspective, so
every slab is the same size wherever it sits and the stack reads as a quantity, not a scene. The turn to
front-on is the hinge of a reveal: the chaos stays isometric, the answer faces the viewer.

## Motion core
- The plane: `rotateX(58deg) rotateZ(-40deg)` with **no perspective** above it (orthographic). Place things with
  left/top on the floor and `translateZ` for height (`IsoPlane`, `OnPlane`).
- A slab is a top face plus a side built from thin layers 2 px apart (`Slab`, `depth` 12-36 px). CSS has no
  extrusion; 6-18 layers are cheap.
- Dealing: each item drops from about 700 px above to `i × gap` (`pileZ`), easeOut over 8-9 frames, starting at
  `4 + 54·(i/n)^0.62` frames: the first alone, the last nearly together (aesthetics R2). Jitter each by a few
  px and ±4° so it reads as thrown, not stacked by a machine. Rest 0.5 s when the pile is full.
- The turn: animate the plane's `t` from 1 to 0 over 0.8-1 s with ease-in-out, and its depth to 0 with it; the
  slab ends front-on and flat, ready to read.
- Collapse into a window: sink each item to z = 0 and fade it, the top one last (0.5 frame stagger), while the
  window appears on the same plane and turns front-on.

## Rules
- Text on an isometric face is decoration (aesthetics Q6). Anything the viewer must read is front-on first.
- Real components and captures stay DOM: put them on the top face as they are; size them with CSS `zoom`, not
  `transform: scale`, so text is laid out at its final size (Q2).
- Keep the pile clear of the safe area's rail on portrait: centre it on the panel, not the frame.
- One full-frame motion at a time: the pile is the scene; do not also push the camera hard.

## Pairs with
`record-stop-hold` (freeze the full pile and grey it), `scatter-pull-graph` (the pieces pulled into one place),
`ring-reveal-lockup` (blocks rising around the mark).

## Reference implementation
- [`src/shared/motion/iso.tsx`](../../../src/shared/motion/iso.tsx): `IsoPlane`, `Slab`, `OnPlane`, `pileZ`.
- [`src/videos/gallery/iso-shots.tsx`](../../../src/videos/gallery/iso-shots.tsx): a dealt pile whose top card
  turns front-on (`bun run dev gallery`, the last shot).
