---
name: ring-reveal-lockup
summary: A last ring in the brand colour grows from the centre and reveals the end card inside it: the character, then mark plus wordmark rising, the tagline, the URL, and finally the real install command in a large code block.
use: the close of a product promo that has used rings or ripples before; the brand returns as the final wave, then everything holds
length: about 104 frames (3.5 s): ring 26 frames, card built by frame 39, held to the end
energy: medium (it settles the film)
tags: lockup, end-card, brand, ring, reveal, wordmark, tagline, install-command
source: knowns-ui/launch-tvc
---
# ring-reveal-lockup

## Intent
The film already taught the viewer that a ring means "everything changes". The last ring is
the brand colour, and what it reveals is the brand. That gives the end card a cause instead
of a fade. Inside, the card is built in reading order: who (the character), what (mark and
name), why (the tagline), where (the URL), how (one real command). Then it stops and holds (R1).

It differs from [`logo-shrink-wordmark-lockup`](logo-shrink-wordmark-lockup.md), which
contracts a big graphic into the mark: here the mark is revealed, not formed.

## Motion core
- Ring reveal: radius 0 to 1150 px over 0.85 s with `--kn-ease-out`
  (bezier 0.22, 1, 0.36, 1). The card sits under `clip-path: circle(r at 960px 540px)`; the
  same gradient `Ring` as the colour ripples traces the edge and is removed once `r` passes 1140.
- One progress helper `prog(frame, a, b)` (ease-out, clamped) builds the card, all in seconds
  from the ring start:
  - character: opacity over 0.4 s
  - mark plus wordmark (132 px): `prog(0.15, 0.6)`, rising 30 px
  - tagline (50 px): `prog(0.35, 0.7)`, with the word spring (rise 24 px, unblur 8 px)
  - URL (34 px, mono, accent): `prog(0.6, 0.95)`
  - install command: the real code-block component at `scale(2.5)`, `prog(0.85, 1.3)`, rising 20 px
- The voice says the tagline at `beat(32) + 0.6` s, as the tagline type lands (C1).
- Sound: a whoosh with its peak on `beat(32)`, a logo hit 0.05 s later, 90 frames long. The
  music fades out from 28.2 s to 29.5 s.

## Parameters
| Parameter | Typical value | Feel when changed |
|---|---|---|
| Ring | 0.85 s to 1150 px, ease-out | faster reads as a flash; slower and the card waits behind a mask |
| Build stagger | 0.15, 0.35, 0.6, 0.85 s | closer and the four lines read as one block; wider and it becomes a slideshow |
| Rise | 30 px (title), 20 px (command) | larger travel draws the eye away from the words |
| Command scale | 2.5x the real component | real 14 px code text must reach about 35 px or more (C7) |
| Hold | about 2.2 s after the last element | under 1 s breaks R1; the brand must be fully still |
| Music fade | 1.3 s at the very end | a hard stop on the card feels cut off |

## Known traps
- R1: the mark must hold fully still for at least a second. No creep, no breathing on the
  lockup; the character may keep its own idle loop.
- The command is the real component with a real command; do not type a fake one. Check it is
  the command a viewer can paste.
- C3: the tagline (plain words) lands before the URL and the command.
- Q8: for a multi-feature film this card is calm. If the film needs a launch ending, build the
  "group photo" first and let this ring close it.
- The ring is a gradient, not a `box-shadow` (large shadows tiled the frame in Chrome).

## Pairs with
- [`accent-ripple-chain`](../interaction/accent-ripple-chain.md): the ripples this ring ends.
- [`outro-group-photo-launch`](outro-group-photo-launch.md): the high-energy alternative (Q8).
- [`logo-shrink-wordmark-lockup`](logo-shrink-wordmark-lockup.md).
- [`blur-slide`](../typography/blur-slide.md): the word reveal style used for the tagline.
- Sound: [`whoosh`](../sfx/whoosh.md) into the ring, [`boom`](../sfx/boom.md) softened for the logo hit.

## Reference implementation
- [`ring-reveal-lockup/Main.tsx`](../../../src/demo/interaction/accent-ripple-chain/Main.tsx): `RevealLockup`, `Lockup`, `Ring`, `MARK`
