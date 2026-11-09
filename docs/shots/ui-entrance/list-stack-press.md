---
name: list-stack-press
summary: List cards fly up from the bottom of the frame one by one and pile up. Each landing presses and rebounds the whole pile, and the counter ticks up one notch in sync
use: Shots for feeds / radar / inboxes where "there is something new every day"; asset lists that stress ongoing accumulation
length: about 3s (18–88f)
energy: medium
---

## Intent
"A stack has weight": each new card that lands presses the already settled pile down and it springs back, and the viewer reads from the physical feedback that "this was really saved up". The counter ticking in sync nails the sense of quantity.

## Motion core
- **Anticipation beat (borrowed from Disney principle 2)**: before the first card rises in, give one section-level beat of anticipation. The counter lights up and resets to zero / shrinks slightly scale(0.96)→1 4–6f before the first card, leading the eyes to the stack area, and then the first card enters. Done once at the section level, not added per card
- Cards rise in from below the frame, straighten with alternating slight tilts, and pile up one by one at an even beat
- Each arrival presses the whole pile down 6px and it rebounds in 8f (a stackPress pulse, which is the follow-through of principle 5: the new card's momentum is passed to the pile and then dissipated with a cushion, and this stroke is the source of "weight")
- After landing, finish in drag-hierarchy order (principle 5): the card body stops first → the pile rebounds → the highlight bar grows out (2–4f later). All three on the same frame read as a texture swap
- A closing glaze sweep of light passes over the whole pile
- A screen-space DigitRoll counter rolls one notch per card landed; the camera follows the stack downward

## Parameters
| Parameter | Typical value | Feel when tuning |
|------|--------|----------|
| Beat | CUES=[18,30,42,54,66] (12f even spacing), each card flies 22f, bezier(0.45,0.05,0.25,1.12) with end overshoot | A small number of cards (5) can be evenly spaced; only large-batch entrances need progressive acceleration (compare R2 of deck-deal) |
| Entrance | rise in from 600px below, straighten from alternating ±2° tilt, scale 1.06→1 | Alternating tilt breaks the symmetry; the same tilt direction reads as copy and paste |
| Stack press | when the next card arrives the pile presses down 6px and rebounds in 8f (pulse [cue,cue+4,cue+8]→[0,6,0]) | This is the key stroke for "weight"; cut it and the stack becomes simple layout |
| Shadow | two layers of softShadow vary with height off the ground: elevation≈56 in the air, 3 when settled (closer to the ground when pressed); the flight segment adds vertical motion blur by speed | The shadow converges with height, the same language as deck-deal/spotlight |
| Linked highlight | after landing, 2–4f later on the project-name line (measured in the screenshot at y156–176 inside the card) an accent-color highlighter underlay as wide as the project name grows (amber in the template film), laid under the text with multiply (7f grow + 5f fade); the last card is only ~12f from the cut point, so compress it to 5f grow + 4f fade | The highlight is a secondary action (principles 5/8): it follows the main action (landing press) and does not compete on the same frame. The beat of the last element must be compressed to the remaining frame budget and not copied from the earlier ones |
| glaze sweep | 360px wide, rotate 14°, mixBlendMode soft-light, after the last card settles on frames 74→87 sweeps from −500 to 2300, clipped inside each card's rounded corners | The sweep happens once in the whole shot, over the whole pile and not card by card (Q4) |
| Counter (digit-roll technique) | continuous odometer position pos: each card landing moves pos +1 notch along the digit strip, each notch rolls to rest in 8f, bezier(0.25,0.8,0.25,1); the roll amount = pos·lineH rolling continuously down a doubled 0-9 strip | A counter out of sync with the landing breaks the illusion at once. **A single-notch roll must be shorter than the card spacing (12f) and the last notch must settle before the shot ends**: the pattern of remounting and rerolling keyed on count has to roll from 0 for 22f every time, so at a 12f beat the previous roll never finishes and the last frame stops at 4 (PR #40 precedent). The digit strip is doubled and joined + overflow hidden + tabular-nums (without tabular it shakes sideways) |
| Camera | zoom 1.35→0.86 one continuous curve following the stack downward (fed frame by frame to PageCam2D to avoid velocity going to zero at segmented keyframes) | Head-on camera position (see Known traps), the camera only follows vertically |

## Sound
Do not score each landing with a long tone; pin click-camera at the counter settle (the template film pins it at f648) and transition-soft at the section cut-in (f623). If you do score a pop per card, see the three S2 ways to avoid a machine-gun feel.

## Known traps
- Stack / list information shots must be head-on (Q6): when the whole film was tilted, this shot was once rolled back alone to head-on. Verify stylized camera positions shot by shot and do not apply them globally
- A per-card glint highlight sweep was rejected twice (Q4); a static accent-color underlay bar is enough for the highlight, and the motion is left to the press and rebound
- It is the same action vocabulary as history-list-stack (the tail section of the document-typewriter-reveal card): the same technique can be the lead only once in a film (P4), and when both are used one must be demoted to a supporting role
- The anticipation / drag-hierarchy parameters are borrowed from the Disney 12 principles (the distilled version built into the pixel2motion skill), not a user precedent: they are default advice, not a rule; when they conflict with a precedent, the precedent wins
- The anticipation amplitude must pass the naked-eye threshold (deck-deal precedent 2026-07-09: a small amplitude was completely imperceptible to the user and only passed when magnified 12 times). After rendering, self-check "can the wind-up be seen without stepping frame by frame"

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`list-stack-press/ListStackPress.tsx`](../../../src/demo/ui-entrance/list-stack-press/ListStackPress.tsx)

