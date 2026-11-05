---
name: sk-narration
description: Writes or edits the spoken script of a short in src/videos/<id>/narration.json, generates the voice track with bun run tts (by default Edge for English, VieNeu for Vietnamese; ElevenLabs optional), and runs the machine lint. Use when the user says "write the script", "change this line", "fix the pronunciation", "it reads too fast", "add a pause", "re-run TTS", "change the voice", or when lint reports narration errors. Steps 5, 6 and 7 of sk-pipeline.
---

# sk-narration: script, TTS, lint

**Announce:** "Using sk-narration for <id>."

Rules: §1, §3, §3b, §3c (`docs/soul/01-voice-and-structure.md`), §4
(`docs/soul/02-narration-engine.md`), the flow file in `docs/flows/`, numbers in
`docs/soul/thresholds.json`. The § wins over this file.

## Where to edit

Only `src/videos/<id>/narration.json` (schema in
`docs/making-a-video.md`). **Never hand-edit `voice.json`**: it is generated and
carries a hash of the script it was made from.

## Steps

1. **Read the flow file** for this video's `flow`: its beats become scenes, its
   "Traps" are mistakes already made once.
2. **Write scene by scene.** Each line is one idea; a line stating a fact carries
   `"fact": "f-xxxx"`. Hook: a number or claim in the first seconds, without
   giving away the final answer (§3c). Last line of each scene pulls into the
   next. End on the turn that negates what the viewer believed, then a share line
   tied to the content, not a logo or "follow for more" (§1).
3. **Read §3c (tension) before TTS**, not after. Re-recording costs more than
   re-reading.
4. **Write for the engine (§4).**
   - Pauses come from **full stops**. Commas, colons and dashes are nearly silent
     to TTS engines; where the viewer needs a breath, end the sentence.
   - Write numbers the way they should be spoken; put the display form in
     `spelling` (caption-only) and respellings in `pronounce` (spoken-only).
   - Silence between lines and scenes comes from `pause.line` / `pause.scene`,
     not from punctuation tricks.
5. **Engine default by language** (§4, "Pick the engine by language"): when the
   user has not chosen an engine, use English → `edge`, Vietnamese → `vieneu`, and
   say which one you used. It is a default, not a rule: an engine the user picked
   stays. If `vieneu` is not installed, give them the setup commands from the README.
6. **Generate the voice:**
   ```bash
   bun run tts <id>            # whole script in one request, word timestamps
   bun run tts <id> --force    # re-synthesise even if the hash matches
   ```
   The whole script is read in one pass so intonation carries across sentences;
   per-line synthesis sounds like a list.
7. **Listen to the whole track.** TTS engines can repeat or loop a phrase, and
   that passes every numeric check. Machines count words; only ears catch rhythm.
8. **Lint:**
   ```bash
   bun run lint <id>
   ```
   0 errors, and read every warning. Duration against `maxDurationSeconds` and
   `targetDurationSeconds`, sentence length, banned phrases, fact references all
   come from `thresholds.json`.

## Rules that bite silently

- **Changed `text` means run `bun run tts <id>` again.** Scene lengths and
  captions come from `voice.json`; a stale one drifts with no error on screen.
- **Scene length is never set by hand.** It comes from the real voice track.
- On-frame text must not repeat the line being spoken (§7); that is the caption's job.

## Verify

- [ ] `flow` and `visual` set; every fact id resolves
- [ ] `voice.json` newer than the last edit to `narration.json`
- [ ] whole track listened to, no loops, numbers pronounced right
- [ ] `bun run lint <id>` 0 errors, warnings read

Next: wording polish with `sk-style` if lint flags §3b, else `sk-scene`.
