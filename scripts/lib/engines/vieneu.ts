import {existsSync} from "node:fs";
import {join} from "node:path";
import {must} from "../proc";
import {p} from "../paths";
import type {Engine} from "./types";

/**
 * VieNeu-TTS (https://github.com/pnnbao97/VieNeu-TTS): Vietnamese voices,
 * offline on CPU, Apache-2.0 code and weights, 48 kHz. Runs through a small
 * Python bridge (vieneu_bridge.py) that loads the model once and reads one
 * line per file, like `say`. No word timestamps: words are spread over the
 * line, as with `say` and `edge`.
 *
 * Setup once:
 *   uv venv --python 3.12 .venv-vieneu && uv pip install --python .venv-vieneu/bin/python vieneu
 * The first run downloads the model (~600 MB) into .cache/vieneu/.
 *
 * narration.json voice:
 *   "voice": a preset name ("Thiện Minh", "Mai Anh", ...) or a path to a 3-8 s
 *            reference .wav to clone (only voices you have the right to use);
 *   "model": "v3turbo" (default) or "v3nano".
 * List presets: .venv-vieneu/bin/python scripts/lib/engines/vieneu_bridge.py --voices
 * Watermark: VieNeu adds an inaudible AI-audio watermark (Perth) only when
 * installed as `vieneu[watermark]`; the plain install above adds none.
 */
const python = () => {
  if (process.env.VIENEU_PYTHON) return process.env.VIENEU_PYTHON;
  const venv = p(".venv-vieneu", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
  return existsSync(venv) ? venv : "python3";
};

export const vieneu: Engine = {
  name: "vieneu",
  defaultVoice: "Thiện Minh",
  synth: async (lines, voice, work) => {
    const job = join(work, "vieneu-job.json");
    await Bun.write(
      job,
      JSON.stringify({
        lines: lines.map((l) => l.spoken),
        voice: voice.voice ?? vieneu.defaultVoice,
        mode: voice.model ?? "",
        out: work,
        cache: p(".cache", "vieneu"),
      }),
    );
    try {
      // model load + first-run download + every line: allow a long time
      await must(python(), [p("scripts/lib/engines/vieneu_bridge.py"), job], {timeoutMs: 30 * 60_000, inherit: true});
    } catch (e) {
      const msg = (e as Error).message;
      throw new Error(
        /ENOENT|No module named/.test(msg)
          ? "VieNeu is not installed. Run: uv venv --python 3.12 .venv-vieneu && uv pip install --python .venv-vieneu/bin/python vieneu"
          : msg,
      );
    }
    return lines.map((_, i) => ({file: join(work, `line-${i}.wav`), lines: [{start: 0, end: Number.POSITIVE_INFINITY, words: null}]}));
  },
};
