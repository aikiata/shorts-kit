---
name: glitch-cycle
summary: One row of equal-width slots cycles through 4 status phrases. The head and tail of each phrase go fully scrambled by a probability keyframe [1,0,0,0.1,0,0,1], with an occasional single-character jitter in the middle, and at the moment of switching an RGB split and a whole-row offset are layered on. The probability of the last phrase goes to 0 so the ending is clean
use: Status announcements for loading/build/deploy processes; the "system self-narration" of a technical intro; a base section that moves time forward in a machine voice
length: about 5.6s (168f@30fps; in the demo each phrase is 38f, and the last phrase continues to the end as the closing hold)
energy: medium-high (continuous high-frequency noise pulses, the switch points are the peaks)
---

## Intent
The clumsiest way to announce status is four lines of text fading in one by one. The cycle compresses them into **one slot**:
the head and tail of a phrase "melt" and then "solidify" through scramble, while the middle is almost clean with only an occasional twitch. The viewer reads it as
"the system is advancing step by step", not as four independent lines of copy. Scramble density is the grammar of this card:
dense = switching, thin = resting in this state. A progress bar at the bottom strings the four beats into one timeline,
and the last phrase pulls the probability to 0, ending as soon as it settles.

## Motion core
- The slot builds `MAXCH` spans up front by the longest phrase (`min-width:0.66em` fixed slot width),
  and short phrases are padded symmetrically left and right with spaces (row centered). **Characters are never added or removed, only their content changes**, so the row never re-lays out
- Equal time slots: `slot = floor(frame / SLOT)`, in-phrase progress `p = (frame - slot·SLOT)/SLOT` (demo SLOT=38f;
  the last phrase runs `KF_LAST` on the same 38f and then stays clean until the end, leaving ~28f of closing hold)
- Glitch probability keyframes `KF=[1,0,0,0.1,0,0,1]` interpolated linearly by p: **1.0 at the start (fully scrambled),
  0 in the middle, rebounding to 0.1 around p=0.5 (occasional character twitch), and back to 1.0 at the end, melting into the next phrase**
- The last phrase uses `KF_LAST=[1,0,0,0.1,0,0,0]`, with the probability returning to zero at the end → the frame is clean at t=1
- Per-character decision: only when `rand(i·31 + bucket·17 + slot·97) < g` is it replaced with a character from the glyph pool,
  and a hit character randomly takes an accent highlight color or a dark color (demo aurora: pink / dark purple); `bucket = floor(frame/2)`,
  which is a re-roll every 2 frames
- Whole-row jitter and RGB split intensity are all multiplied by g (values in 480 design coordinates; demo native 1920, phrase 104px): `jx = ±g·10`px
  (demo ±g·36), `jy = ±g·4`px (demo ±g·10), `text-shadow` offset left and right by `g·3`px each (demo pink / ice blue each g·10,
  on only when g>0.04). **One variable of noise density drives character swapping, offset and chromatic split at once**, so the three never fight; when g>0.25 the same g
  also drives a horizontal tear band (the row cut into three segments, the middle one shifted sideways, band height re-rolled every 2 frames), and when g>0.45 3 pixel-block ghosts are layered on top
- Demo layout: a status line above (pulse dot + RENDERING · project name · render number), thin corner brackets around the slot, and below a 1100px progress track
  that runs linearly to full (laid underneath independent of the four beats, with three four-beat ticks + a glowing head) + `STEP n/4` / percentage (tabular-nums);
  when the last phrase settles clean it gets one soft glow (only the lead gets it, once). After the progress is full the status turns to RENDERED, the dot turns solid, and then an accent-color credit line rises (shorts-kit logo + brand name)

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Phrase list | 4 entries, longest 17 characters (demo `LOCKING BEAT GRID`) | 42f per phrase is the lower limit for "long enough to read one state"; with 5 or more, a phrase under 34f is only seen as a flash |
| Probability keyframes | `[1,0,0,0.1,0,0,1]` (6 segments) | The 0.1 in the middle is the proof of "alive"; delete it and the mid-phrase is stiff. Raise the 0 segments to 0.3+ and the whole piece smears into a glitch |
| Re-roll frequency | every 2 frames (`floor(frame/2)`) | Changing every 1 frame smears into a gray band; at 4 frames or more the scramble is clear enough to read as "another word" rather than noise |
| Jitter amplitude | `x ±g·10` / `y ±g·4`px (480 coordinates; 1920 native about ×3.6) | x larger than y is the key to horizontal tearing (proportional jitter reads as an earthquake); beyond ~2 character widths the whole row jumps out of the slot |
| RGB split | red left and cyan right each `g·3`px, threshold g>0.04 | This is the identity of "electronic glitch"; with no threshold, the 0.1 probability in the middle leaves the text with fuzzy edges all the time |
| Slot font | SF Mono 26px (480 coordinates; demo native 104px), slot `0.64–0.66em` | Monospace + fixed slot width is a must; 3px letter-spacing gives the scramble room to breathe, and crowded together it reads as a scramble block |
| Progress bar | 150×2px (demo native 1100×4px), accent-color gradient fill, linear + four-beat ticks | The only linear element, giving the four beats of noise a stable reference; delete it and the cycle does not read as "advancing" |

## Known traps
- The demo was tuned on grayscale/placeholder material. The parameters are a tuning starting point, not a field-tested final;
  the first real use must re-check against real material
- **When swapping in project copy, keep the four phrases close in character count (demo 12–17 characters)**: the slot count is built
  once by the longest phrase, and short phrases are padded with spaces on the right. If one has only 4 characters and another 30,
  the short one sits alone on the left in 30 cells, the row width is propped open by the longest one throughout, and the rhythm reads as drifting
- The probability keyframes are 6 equal segments mapped onto the in-phrase progress: when the number of phrases changes, each phrase's duration changes,
  but the keyframe shape does not. So the more phrases, the shorter the absolute duration of the two "fully scrambled" segments
  and the weaker the switching feel; past 5 phrases, widen the 1.0 segments at the head and tail
- The last phrase must use `KF_LAST` (ending at 0): with the ordinary KF, t=1 stops on full scramble,
  and when cut to the next shot it reads as not fully rendered
- Dark base only: a dark base + cool/vivid noise colors are the foundation of the whole palette (the demo uses aurora deep purple-black + pink / ice-blue split); on a light base the RGB split
  is almost invisible. Sound is also strongly required: the four switch points are naturally four beats, and in practice they must be paired with
  electronic glitch/switch sounds;
  for the mixing discipline see sound-design.md (same sound for same-type elements, alternate two samples on rapid fire to avoid a machine-gun feel)

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`glitch-cycle/GlitchCycle.tsx`](../../../src/demo/typography/glitch-cycle/GlitchCycle.tsx)

