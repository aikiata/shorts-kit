import {join} from "node:path";
import type {Engine, Timed} from "./types";

/**
 * Microsoft Edge online voices through `edge-tts-universal`: free, no key,
 * good English. One request per line, with word boundaries from the service.
 *
 * The service can hang or return no audio; every call has a hard timeout and
 * a short retry with backoff. A transient empty stream is not a script
 * failure: do not rewrite the line that happened to fail (§4).
 */
const TIMEOUT_MS = 30_000;
const RETRIES = 2;

const withTimeout = <T>(p: Promise<T>, ms: number, what: string) =>
  new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${what} timed out after ${ms / 1000}s`)), ms);
    p.then(
      (v) => (clearTimeout(t), resolve(v)),
      (e) => (clearTimeout(t), reject(e)),
    );
  });

const once = async (text: string, voice: string) => {
  const {Communicate} = await import("edge-tts-universal");
  const c = new Communicate(text, {voice, connectionTimeout: 10_000});
  const chunks: Uint8Array[] = [];
  const words: Timed[] = [];
  for await (const ch of c.stream()) {
    if (ch.type === "audio" && ch.data) chunks.push(ch.data);
    else if (ch.type === "WordBoundary" && ch.offset !== undefined && ch.duration !== undefined) {
      // offsets are in 100 ns ticks
      words.push({start: ch.offset / 1e7, end: (ch.offset + ch.duration) / 1e7});
    }
  }
  if (!chunks.length) throw new Error("no audio received");
  return {audio: Buffer.concat(chunks), words};
};

export const edge: Engine = {
  name: "edge",
  defaultVoice: "en-US-AndrewNeural",
  synth: async (lines, voice, work) => {
    const out = [];
    for (const [i, l] of lines.entries()) {
      let last: unknown;
      let got: Awaited<ReturnType<typeof once>> | undefined;
      for (let attempt = 0; attempt <= RETRIES && !got; attempt++) {
        if (attempt) await Bun.sleep(1500 * attempt);
        try {
          got = await withTimeout(once(l.spoken, voice.voice ?? edge.defaultVoice), TIMEOUT_MS, `edge line ${i + 1}`);
        } catch (e) {
          last = e;
          console.warn(`  ! edge line ${i + 1} attempt ${attempt + 1}: ${(e as Error).message}`);
        }
      }
      if (!got) throw new Error(`edge failed on line ${i + 1} ("${l.spoken.slice(0, 40)}…"): ${(last as Error)?.message}`);
      const file = join(work, `line-${i}.mp3`);
      await Bun.write(file, got.audio);
      out.push({file, lines: [{start: 0, end: Number.POSITIVE_INFINITY, words: got.words}]});
      process.stdout.write(".");
    }
    process.stdout.write("\n");
    return out;
  },
};
