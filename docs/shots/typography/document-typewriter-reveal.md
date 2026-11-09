---
name: document-typewriter-reveal
summary: A full-page, properly typeset document window floating in a dark scene "writes" itself out behind a cursor, the sidebar follows, history entries drop into the track one by one, and the camera pulls back from an oblique title close-up to the full window
use: Feature shots for documents/reports/notes; the beat with the highest information density
length: 150f (about 5s, including the history-list-stack tail and the tagline hold)
energy: low-medium (highest information density, so keep the pacing steady and let the viewer read)
tags: ui-entrance
---

## Intent
The viewer will read every word on screen, so this shot's persuasion rests entirely on "the document is real". The typewriter-style write-in turns a static page into a "document being written out", and the history entries dropping into the sidebar add the time depth of "continuous output".

## Motion core
- Content blocks are written in pairs on a beat: a page-colored mask anchored on the right narrows left→right, and an accent-color caret rides the reveal front
- Person-name @-mentions grow an accent-color background after the wipe completes
- The left and right columns enter by a background-color patch retracting top→bottom, and an accent-color hairline on the inner edge grows with the reveal and then fades
- Tail section (history-list-stack): 6 history entries drop one by one from above into the sidebar track, each drop with one pop sound
- The camera pulls from an oblique title close-up to the full window (both columns must be in frame), then tilts slightly down and moves up to leave the bottom for a tagline, with only a very slow push-in. The page is an application window floating in a dark scene (rounded corners, bright edge, backlight, long drop shadow), not filling the whole screen

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Write-in beat | 20 blocks in pairs, pair g has cue = 8 + g·4.4, each block wipes in 9f, the last pair finishes at ~57f (ahead of the 64f full-window settle) | Writing block by block blows the budget. "Block count × beat must be checked against the budget first" is the core arithmetic of this card: calculate first, then write |
| Write technique | Background mask width 100%→0, bezier(0.4,0,0.6,1). The mask color is the measured color of the textured paper surface, with extra cover on the right (title 120px: the measured block width is shorter than the actual bold glyph width, otherwise the last word leaks out). Accent caret 3px (one step darker aurora purple + same-color soft glow), follows only the newest block, rides only inside the actual text width, fades out 2f after writing finishes. Before the first block starts, the pen tip blinks at the title start for 8f on standby | Several carets appearing at once give it away immediately; there is only ever one "pen tip" |
| li bullet | The mask covers an extra 28px to the left (::marker sits ~22px left of the text) | If the bullet is not covered it shows early. Check every typesetting detail baked into the screenshot texture this way |
| @-mention | Starts 4f after the wipe completes, grows an accent background over 8f (aurora purple 0.4), `mix-blend-mode: multiply` (the background sits over the textured text; normal blending would wash out the name). Skip non-name headings | A highlight that comes later than the writing reads as "key point marked"; appearing in the same frame reads as a decal |
| Column entrance | Left column cue 54 / right column cue 62, background patch retracts top→bottom in 10f + inner-edge 2px accent line grows with the reveal and fades over 24f | Stagger the columns against the body text; entering at the same time they fight for the eye |
| History entry drop | 6 entries, cue = 66 + i·5 (placed after the sidebar wipe completes at 64f), each drops in 9f. Start −48px, bezier(0.2,1.15,0.3,1) light bounce, airborne shadow `0 12·air px 24·air px` | Entry geometry sits right below the entries already baked into the texture, with row heights aligned. DOM-redrawn entries must align strictly with the live entries in the texture |
| Stage | Aurora dark scene: an accent-color backlight ring behind the window (page space translateZ −40, follows the window's perspective), 0 0 0 1.5px bright edge on all sides + 70px long shadow, a highlight along the top edge. The closing tagline is 84px in two segments (second in accent color), left-aligned to the window's left edge | A warm white paper surface in a cold dark scene looks like a lamp: the stage and the window must share one light direction, and the backlight must not overpower the paper |
| Camera | A custom 3D window camera (layout-level CSS zoom, Q2), unrolled per frame with a monotone cubic Hermite spline: f0 zoom 1.42 / rotY −18° / rotX 8° (the window's top-left corner and the stage light both in frame) → f26 1.24 → f64 full window 0.86 → f104 0.74 + rotX 9° + up 78px (bottom left for the tagline) → f150 0.746 | An opening that is too close (>1.6x) leaves only paper surface on screen, with the dark scene and window edges invisible, and it reads as the original flat page. At full window both columns must be in frame (Q10) |

## Sound
In the write-in section, pin keyboard.mp3 trimmed to ~50f (8→57f) to cover the writing section (the foley and the action are strictly the same length, S4). The 6 history-entry pops fire every 5f, with volume stepping down 0.40→0.25 to create distance falloff (S2).

## Known traps
- Mock content must be publication-grade: product-native typesetting, text filling the page, the sidebar fully in frame (Q10). A perfunctory "texture + tagline" document forces the whole shot to be redone
- Data compliance: real customer/member names must never appear in mock content (Q1)
- When the source page is a live data source (collaborative-document type), a full re-capture will wipe out finalized textures. Use an incremental script to refresh only a single page and a single key
- The accent-color examples (caret / @-mention / inner-edge line) are amber in the template video. When adapting to a new brand, change them all to the target brand's accent color

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`document-typewriter-reveal/DocumentTypewriterReveal.tsx`](../../../src/demo/ui-entrance/document-typewriter-reveal/DocumentTypewriterReveal.tsx)

