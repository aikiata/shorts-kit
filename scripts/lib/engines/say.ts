import {join} from "node:path";
import {must} from "../proc";
import type {Engine} from "./types";

/**
 * macOS built-in `say`: offline, free, deterministic. The example video uses
 * it so the kit runs on a Mac with no key and no network. Good enough to time
 * scenes and review a cut; use a better engine for what you publish.
 * List voices with `say -v '?'`.
 */
export const say: Engine = {
  name: "say",
  defaultVoice: "Samantha",
  synth: async (lines, voice, work) => {
    if (process.platform !== "darwin") throw new Error('the "say" engine needs macOS; use "edge" or "elevenlabs" in narration.json');
    const out = [];
    for (const [i, l] of lines.entries()) {
      const txt = join(work, `line-${i}.txt`);
      const file = join(work, `line-${i}.aiff`);
      await Bun.write(txt, l.spoken);
      await must("say", ["-v", voice.voice ?? say.defaultVoice, "-o", file, "-f", txt], {timeoutMs: 30_000});
      out.push({file, lines: [{start: 0, end: Number.POSITIVE_INFINITY, words: null}]});
      process.stdout.write(".");
    }
    process.stdout.write("\n");
    return out;
  },
};
