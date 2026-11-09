---
name: brace-expand
summary: A tight pair of small curly braces appears at dead center, then springs apart left and right with one overshoot and scales up to title size. The text clip width is strictly bound to the braces' inner edges, so the text is revealed from the middle like a curtain being drawn. After it settles, the letter-spacing relaxes slightly
use: Title cards for developer/technical products; chapter openers; a minimal single beat where "one symbol does the reveal"
length: about 4s (120f@30fps: cursor 0–6f → 6f small braces hard cut → 14f spring open → 40–64f letter-spacing relax → subtitle → hold)
energy: medium (the single overshoot is the only peak, everything else is still)
---

## Intent
Of the title reveal techniques, this card is the most economical: no mask bar, no per-letter, no
offset. Just a pair of braces moving apart, and the text gets "braced out". It carries a code feel
by nature (`{}` is curly braces), so in a technical product context it reads as "this is the content itself".
The crux: the clip width **must be strictly bound to the brace positions**. If the text fades in on its own or wipes in on its own,
the braces degrade into decoration and the curtain feel is lost completely.

## Motion core
- At frame 0 the center holds a blinking input cursor (editor feel, not an empty frame). At 6f it is **hard-cut replaced** (no fade) by a pair of "{}" at 0.4x scale
  with inner edges touching, held for 8f, to establish first that "this is a pair of braces"
- Spring open `ex = springAt(f, 14, { damping: 14, stiffness: 130 })`: ~8f after launch it arrives, overshoot peaks at ~11f at ≈9%, converges by ~24f, one visible rebound
- Scale up in sync `sc = mix(0.4, 1, ex)`; curtain half-width `x = (HALF − INNER)·ex·sc`, brace center `±(x + INNER·sc)`
  (HALF=676, INNER=64). **Offset and scale are multiplied together**, so the scale-up itself also pushes the braces apart; at ex=0 the inner edges of the two braces just touch
- Text reveal width `clip.width = 2x` (strictly bound to the braces' inner edges), with 14px feathering on both sides (the feather shrinks when the clip is narrow)
- The text does `scale(sc)` in sync, sharing the same sc as the braces; after settling, letter-spacing relaxes −0.05em → −0.03em (40–64f smooth), "taking a breath"
- Texture (midnight): monospaced 300px electric-blue braces + glow (the glow peak follows the overshoot, falling off over 34–64f). In the fast part of the spring-open, directional
  motion blur is added by horizontal speed (amount 0.22, capped at 16, zero when settled). Title (in the demo the brand name shorts-kit, all lowercase) 164px weight 800 with a white→cool-blue gradient. Background: editor dot grid (32px, radial fade) +
  top light + horizon light band, and below the braces a cool-light reflection that widens as they open
- Aftermath: eyebrow `// shot recipes for your agent` (monospaced 32px cyan) enters from 44f with letter-spacing tightening; subtitle (brand line Frame motion. Craft the shot.) emerges word by word, defocused, from 54f. Over 70–120f the whole frame pushes in slowly 1→1.012
- All positioning is absolute (braces / clip box / text all compute left from the 960 centerline), **no flex**: the width changes throughout and flex would re-lay out

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Brace appearance | 6f hard cut replacing the cursor | A hard cut is right (the symbol is simply there with a "snap"). A fade loses the few frames of "see the braces first" and the spring-open feels sudden |
| Spring open | spring from 14f, damping 14 / stiffness 130 (≈9% overshoot) | The overshoot is the only peak in the piece; damping ≥18 reads as a slide-open with no "pushing apart" force; <12 rebounds twice and reads as jelly |
| Half distance | HALF = 676px (brace center), INNER = 64px (brace center to inner edge) | Sets the width the title can fit: inner cavity = 2·(HALF−INNER) = 1224px |
| Scale | `mix(0.4, 1, ex)`, braces 300px / text 164px | A 0.4 start is the amount of "small font size"; a start >0.8 shows no scale-up, <0.3 and the braces start out as small as punctuation |
| Copy width | "shorts-kit" at 164px measures ≈1130px when settled (inner cavity 1224px minus feathering on both sides) | If the text is much narrower than the cavity, it is fully visible before the braces arrive and the curtain feel weakens; if wider than the cavity, both ends are cut off |
| Letter-spacing relax | −0.05 → −0.03em, 40–64f smooth | This beat is the "breath after settling"; the text gets wider after relaxing, so it must stay inside the cavity |
| Motion blur | SpeedBlur amount 0.22 / max 16 | At amount 0.35 the braces smear into three horizontal lines at the peak frame and cannot be recognized as braces |

## Known traps
- **Copy length must match HALF**: the clip only crops, it does not scale. With a long title, both ends are cut off by the braces,
  so HALF must be increased (or the font size reduced) at the same time; Chinese titles are about twice as wide per character as English, and 6 Chinese characters is close to the limit
- The clip width grows from 0, so the text **is always revealed from the middle outward**: the
  visual center of mass of the copy must be in the center (a centered single short line is best); long/short lines that are asymmetric left to right reveal awkwardly
- The braces and the text must share the same `sc`: writing two scale curves separately (even with identical values)
  gives a mismatch in the overshoot frames, where the braces are already in place and the text is still growing
- The overshoot happens only once: all other motion in the piece has no overshoot, which keeps attention on the "pushing apart"
  action; stacking another back / spring overshoot devalues it
- The clip box height is hard-coded to 220px (title 164px leaves margin top and bottom). When the font size changes a lot, change it in sync, or the top and bottom get cut
- Sound: the spring-open beat deserves one short mechanical/wooden open-close sound, and silence after settling;
  for the mixing discipline see sound-design.md

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`brace-expand/BraceExpand.tsx`](../../../src/demo/typography/brace-expand/BraceExpand.tsx)

