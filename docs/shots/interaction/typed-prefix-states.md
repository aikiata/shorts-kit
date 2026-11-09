---
name: typed-prefix-states
summary: A real search typed at a person's speed, where every frame shows the product's true results for what is typed so far: one state per prefix (c, cli, clip, clipbo, clipboard), switched on the frame each burst of keys lands.
use: The "find it in seconds" beat of a product film for anything with live search or filtering (a catalog, a command palette, a docs site); the after half of a before/after search.
length: about 1-1.8 s of typing (5-6 states), then 1-2 s on the result before pointing at the answer
energy: low to medium; the grid narrowing is the motion
---

## Intent
A typed query whose results do not change is a mock. Showing the page's real answer for every prefix makes
"type what you need" true on screen: the grid narrows the way the product narrows it, and the count in the
heading drops with it. Viewers recognise real search behaviour even when they cannot name it.

## Motion core
- Pick 4-6 prefixes, not every letter: people type in bursts. Hold each 6-9 frames (about 22, 29, 35, 43, 52
  in a scene), the full word last.
- Each state is the real result list for its prefix, and the heading count is the page's own count for it.
- Point at the answer only once the query is complete (a ring or a lift on its tile, 8 frames), and only if it is
  really in the results: if it is third, ring the third tile; never reorder results to suit the film.

## Two ways to get the states
| Source | How | When |
|---|---|---|
| Captures | `bun run capture <id> <url> --name type-<prefix> --type "input[type=search]=<prefix>"` once per prefix; swap the image per frame | no source code; pixels exactly as the page draws them |
| Real components | read the result lists and counts from the live page once (a browser, or the page payload), save them as data, render the product's own grid component per state (`docs/promo/real-ui.md`, "The product's own repo") | you have the product's source; sharp at any zoom, works on an isometric turn |

## Rules
- Record the date the lists were read; a live catalog changes. Re-read before a re-render that will be posted.
- When the page payload and what the browser shows disagree, use what the browser shows (that is what viewers
  see) and note it in the brief.
- Hide a consent banner with `--hide`, never by accepting it.

## Pairs with
`type-and-filter` (the drawn version for a product you cannot capture), `macro-measured-press`,
`crash-zoom-punch` (to land on the answer).

## Reference implementation
- [`scripts/capture.ts`](../../../scripts/capture.ts): `--type`, `--hide`.
- A video built with it is kept out of the public repo (a real ad); the recipe is in
  [`docs/promo/real-ui.md`](../../promo/real-ui.md).
