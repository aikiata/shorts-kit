---
name: voice-waveform-live
summary: A live voiceprint in a recording capsule. 64 thin vertical bars rise and fall with "speech": tall in the middle while speaking, shrunk to a dotted line during pauses, with the waveform scrolling from right to left. A full performance of speak → pause → speak → submit collapse.
use: Feature shots of voice input / AI assistants "listening to you"; segments with no UI content to show that still need continuous liveliness to hold the frame
length: 172f (~5.7s: entrance 14f + speak 1.4s + pause 0.8s + speak 1.4s + submit collapse / tucking into the bubble 0.8s + hold 0.7s)
energy: medium (functional liveliness, not showing off)
---

## Intent
This card is a **functional** voiceprint: a live receipt of "listening to you". The crux is causality:
the waveform moves with "the user speaking" and is the product feature itself, not a decorative wrapper that moves with the BGM.
Tall while speaking, shrunk into a row of dots during pauses, history scrolling out to the left: the viewer reads "it really is listening" from the rise and fall of the waveform. A 6s+ stretch of frames rests entirely on this
liveliness and needs no other content. Division of labor with gauge-readout-moves: a gauge is a
mechanical ritual of "reporting one value"; this card is the vital sign of "continuous listening" and has no final value.

## Motion core
- **Frame-deterministic pseudo-randomness is the crux**: mulberry32 takes values at integer sample points + smoothstep
  interpolation between neighbors (value noise), with no Math.random, so renders are reproducible and neighboring frames are continuous
- Scrolling feel: the sample time of bar i = f - (N-1-i)·1.6, the rightmost bar is "now",
  and history flows to the left; the bars are not translating, each bar is reading the signal of a different moment
- Bar height = speech envelope (trapezoid seg with two levels, speak/pause + syllable noise 0.55+0.45·noise)
  × central spatial weight sin^0.8 × per-bar jitter (0.35+0.65·noise);
  silence is clamped to a 6px dotted line
- Submit: the button compresses scale 1→0.82→1 and rebounds in 3f, the waveform collapses to 0.06 with 12f ease-in,
  and the microphone breathing ring expands outward with the envelope
- The demo adds a layer of live transcription (92px bold): each word rises from faint to solid at the syllable start of its beat, a just-spoken word is accent color,
  sinks to ink color a few frames later, and the trailing cursor blinks during pauses; on submit the whole transcript moves up, shrinks and tucks into the accent-color message bubble.
  The "pause" can be read from both the text and the waveform, and the end frame is a complete conversation poster

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| bar count / gap | 64 bars, gap 5px (1240px wide capsule, voiceprint area ≈820px) | Fewer than 40 bars reads as an equalizer; denser than 90 and individual bars can't show the rise and fall |
| scroll rate | 1.6 frames/sample point | Faster and history rushes by like a glitch; slower and the "scrolling feel" vanishes and becomes jitter in place |
| speak/pause envelope | seg trapezoid rise 5f / fall 7f; demo speak 15–57f, pause 80–124f | The pause segment must really collapse to a dotted line: without the contrast of "pause", "speak" doesn't hold |
| syllable noise | 0.55+0.45·noiseAt(t/4.5) | Without the syllable layer the waveform is a smooth hill and the "cadence of a sentence" can't be read |
| central weight | sin^0.8 spatial envelope | With no weight, all bars are equal height like an equalizer; an exponent >1.5 makes the middle stand out alone like a single bar jumping |
| silence clamp | max 6px dotted line (dotted line in a neutral muted color, speaking bars in an accent-color gradient) | Clamping to 0 makes the waveform vanish and reads as a broken line; the dotted line is "listening but you're not speaking" |
| submit collapse | 12f ease-in to 0.06 + button compress-and-rebound 3f | The collapse is "this passage was taken away"; a fade-out doesn't read as submit |
| transcript rhythm | A word's appearance frame = that word's syllable start (within the envelope rise segment), 8f from faint to solid | A word earlier than the waveform reads as subtitles ahead of the sound; more than 10f late reads as delayed recognition |
| tuck into bubble | 22f EASE.swift move up + shrink to 0.72, bubble fill / white text follow within 10f | Only fading the transcript out doesn't read as "sent" |

## Known traps
- The demo was tuned on the warm bright scene of the shorts-kit voice-dictation storyboard ("shorts-kit is listening"). The parameters are a tuning starting point, not a final production setting.
  The first production use must be re-verified on real material
- **When there is an audio track the waveform must follow the human voice**: if the piece has real narration/voice, the speak/pause segments of the envelope must align with the track's speak/pause, and one second of misalignment gives it away; a purely synthetic envelope is only usable in pieces with music and no voice
- The demo is a bright-scene capsule with a warm white solid fill (1.5px inner highlight on top + two layers of landing shadow); for a dark-scene piece, switch to a glass capsule with a 1.5px gradient border, and the voiceprint parameters stay the same
- The microphone is already an SVG line icon (the early emoji + grayscale placeholder has been replaced); in production just swap in the brand icon library
- Sound: the frame here is itself "the shape of sound", so it pairs most smoothly with a human voice; one light pop on the submit button and a short downward slide on the collapse

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`voice-waveform-live/VoiceWaveformLive.tsx`](../../../src/demo/interaction/voice-waveform-live/VoiceWaveformLive.tsx)

