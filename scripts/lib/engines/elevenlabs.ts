import {join} from "node:path";
import type {Engine, Timed} from "./types";

/**
 * ElevenLabs: the whole script in ONE request with `/with-timestamps`, so voice,
 * pitch and rhythm come from one reading (§4: some models are not
 * deterministic; twelve requests are twelve readings). Character alignment
 * gives line ranges and word times from the same request.
 *
 * Needs ELEVENLABS_API_KEY in .env. Never send the model's own speed setting:
 * `tempo` in narration.json is the only speed knob. Paid per character, and a
 * re-run is paid again: `bun run tts` skips the call when nothing changed.
 */
const API = "https://api.elevenlabs.io/v1";
const TIMEOUT_MS = 180_000;
/** Per-request character cap (eleven_v3); other models allow more. */
const MAX_CHARS: Record<string, number> = {eleven_v3: 3000};

type Alignment = {characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[]};

export const elevenlabs: Engine = {
  name: "elevenlabs",
  defaultVoice: "",
  synth: async (lines, voice, work) => {
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) throw new Error("ELEVENLABS_API_KEY is not set (put it in .env, see .env.example)");
    if (!voice.voice) throw new Error('narration.json voice.voice must be an ElevenLabs voice id for the "elevenlabs" engine');
    const model = voice.model ?? "eleven_v3";
    const text = lines.map((l) => l.spoken).join("\n");
    const cap = MAX_CHARS[model] ?? 5000;
    if (text.length > cap) throw new Error(`script is ${text.length} characters; ${model} accepts ${cap} per request`);

    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    let body: {audio_base64: string; alignment: Alignment};
    try {
      const res = await fetch(`${API}/text-to-speech/${voice.voice}/with-timestamps?output_format=mp3_44100_128`, {
        method: "POST",
        headers: {"xi-api-key": key, "Content-Type": "application/json"},
        body: JSON.stringify({text, model_id: model}),
        signal: ctl.signal,
      });
      if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 400)}`);
      body = (await res.json()) as typeof body;
    } finally {
      clearTimeout(timer);
    }
    const file = join(work, "script.mp3");
    await Bun.write(file, Buffer.from(body.audio_base64, "base64"));
    console.log(`  + ElevenLabs read ${text.length} characters in one request`);

    const a = body.alignment;
    const joined = a.characters.join("");
    let cursor = 0;
    const out = lines.map((l) => {
      const at = joined.indexOf(l.spoken, cursor);
      const from = at >= 0 ? at : cursor;
      const to = Math.min(a.characters.length - 1, from + l.spoken.length - 1);
      cursor = to + 1;
      const words: Timed[] = [];
      const re = /\S+/g;
      for (const m of l.spoken.matchAll(re)) {
        const s = from + (m.index ?? 0);
        const e = Math.min(to, s + m[0].length - 1);
        words.push({start: a.character_start_times_seconds[s], end: a.character_end_times_seconds[e]});
      }
      return {start: a.character_start_times_seconds[from], end: a.character_end_times_seconds[to], words};
    });
    return [{file, lines: out}];
  },
};
