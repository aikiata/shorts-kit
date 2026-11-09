---
name: type-rhythm-sync
summary: Two styles of text synced to sound. font-weight-pump (strokes thicken on the drum beat and spring back) and karaoke-fill-sync (words light up one by one with the narration)
use: Sections where a title/tagline is tightly bound to the audio track; A binds to the beat (drum hits), B binds to speech (narration word by word)
length: A FontWeightPump 165f / B KaraokeFillSync 150f; A 128 BPM with 14f per beat and a 9–13f decay window, B each word 18–33f by speaking rate
energy: A high (club-dancing feel) / B medium (read-along guidance)
tags: rhythm
---

## Intent
Everything in the text motion library so far has been about "how it enters", and no card covers "how text that is already on screen lives with the sound".
These two styles fill that gap: A turns the title into a rhythm organ: the strokes twitch thicker on the kick drum and spring back,
the text is dancing, suited to a visual subwoofer in high-energy sections; B turns the tagline into read-along captions:
whichever word the narration reaches fills with color left to right and lights up, the eye is led along, suited to voice-over/
tagline emphasis sections. What they share is that **the text does not move, the attributes do**: no offset, no entrance or exit,
just weight/color breathing on the beat points of the sound.

## Choosing between the two
| Style | How | Use |
|----|------|------|
| A font-weight-pump | On the hit frame, thin text instantly swells into black weight (variable weight continuously interpolated) and springs back over 9–13f of decay; accent beats additionally widen by 6%; from bar 2, upper and lower outline echo lines grow and follow the beat, and the drop beat settles into a bold gradient poster | High-energy sections driven by music; the title as the subwoofer |
| B karaoke-fill-sync (fill follows reading) | A two-line tagline on a light base (demo "FRAME MOTION / CRAFT SHOTS"), each word fills and lights from left to right with a soft edge, progress following the speaking rate; the word being read fills with the accent color, and once read recedes to the main ink color and stays; a read-along underline sits under the active word | Voice-over emphasis sections; eye guidance for multi-word taglines |

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| A pulse envelope | `env=(1−t/D)^0.8` (t = frames since the hit; in the demo the rebound is staggered per letter from 9f at the center to 13f at the edges, exactly 0 at ≥D); fontWeight `250+650·env` continuously interpolated (SF Pro variable weight); each letter is pinned in a slot laid out at **weight 900**, so at rest there are gaps between thin letters and on a hit the strokes fill the slot and "close up", with the line never re-laying out; with no variable font, fall back to an env>0.15 window with a 300↔900 jump + `-webkit-text-stroke` continuous decay to cover the transition | Laying the slots out at the heaviest weight is key: laid out at the regular weight, the letters squeeze and overlap each other at the peak |
| A beat | 128 BPM, one beat every 14f (16/30/…/114) + the 9th beat is the drop (128f); the first beat of each bar is accented with `scaleX = 1+0.06·env` and tinted pink; the drop surges to 900 and does not return to thin, falling back over ~16f and freezing at weight 780 + purple→pink per-letter gradient + one horizontal light band | The beat spacing must be > the longest decay window (14>13); two overlapping beats read as a twitch |
| A echo lines | From bar 2, one 2px outlined line of the same text above and below, pulsing 2f late following the beat and pushed apart by 26px on each beat (the drop pushes 60px before returning) | Escalation comes from "adding layers", not from larger amplitude; putting the echo in bar 1 leaves no cards to play afterward |
| A beat reference object | An 8+1 cell step sequencer below the frame (two bars + a DROP cell); the cell for whichever beat hits lights up and enlarges 12%, and cells already passed stay dimly lit | In a muted environment (preview / still frame), without this row of cells it does not read as "following the beat"; only let the cells and the text move, and do not pump the whole picture on every beat |
| B word-level timetable | Per-word [start,end] frame intervals, linear fill within a word; leave a 4–10f pause between words (a breath) | In practice the timestamps come from the narration's marking table; an even allocation reads as machine reading |
| B word-level timetable (demo) | FRAME 20–38, MOTION 42–75 (long word read slowly), CRAFT 85–103, SHOTS 107–130; 0–19f lead-in, 130–149f truly still | Give long words a longer reading window, so it reads at a real person's speaking rate |
| B fill implementation | Two layers of the same text stacked per word: the base layer light gray (13% transparent ink) + the upper layer revealed by progress: `mask-image: linear-gradient(90deg, #000 e−4%, transparent e+4%)`, e=p·108−4 (±4% soft-edge front; for a hard cut use `clipPath: inset(0 (1−p)·100% 0 0)`); the word being read fills with the accent color, and 10f after being read recedes to the main ink color | Independent stacking per word avoids measuring word width ratios; a single clip over the whole line needs an exact pixel table and tends to drift |
| B read-along marker | An 8px rounded underline under the active word (the demo uses the accent color), width = p·100%; after reading it retracts left to right over 6f | A 4px light gray line is invisible at 1080p thumbnail size (a trap stepped in with this batch's real render); words already read keep no line |
| B narration reference object | A 48-bar vertical narration waveform below the tagline: it rises where words are read and drops at breaths, and the already played part is tinted with the accent color | In a muted preview / still frame, without this waveform it does not read as "reading along" |
| Ending | after A's last beat decays to zero / after B's last word is filled, truly still ≥20f | R1 breathing precedent |

## Known traps
- The demo was tuned on grayscale/placeholder material. The parameters are a tuning starting point, not a field-tested final;
  the first real use must re-check against real material
- Both styles are **strongly sound-dependent** techniques: in A the hit frame must be the same frame as the drum hit, and in B the fill intervals must
  follow the narration word boundaries (pinning frames goes by sound-design §4.5, relative to the start). Placed in a silent video, A reads as
  a seizure and B as an inexplicable color change; do not use them in sections with no audio track
- Style A relies on a system variable font (macOS SF Pro) for continuous wght interpolation; switching fonts or on a render machine without a variable font
  it falls back to a few jumps, so first confirm the font loads and the renderer supports it, and if not, use the stroke + jump fallback
- Style A at most 1 section per video (P4): a dancing title is a big scene-stealer, and two sections in one video undermine each other
- Style B at most 6 words per screen: with more words the fill progress cannot be read in time, so split into lines or shots

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`type-rhythm-sync/FontWeightPump.tsx`](../../../src/demo/typography/type-rhythm-sync/FontWeightPump.tsx)
- [`type-rhythm-sync/KaraokeFillSync.tsx`](../../../src/demo/typography/type-rhythm-sync/KaraokeFillSync.tsx)

