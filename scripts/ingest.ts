/**
 * `bun run ingest <id> <file> [--lang vi] [--prompt "names, terms"] [--crop-x 0.5] [--model path]`
 *
 * The first step of a video with a RECORDED voice (§5j), either:
 * - talking-head (visual `talking-head`): a filmed take, shown as the background;
 * - voice only (any other visual): a recording (mp3/wav/m4a, or a video whose
 *   picture is dropped) drives an ordinary video, like a TTS voice would.
 *
 * 1. normalises the file to .cache/footage/<id>/source.mp4: 1080×1920 (cover crop,
 *    `--crop-x` 0..1 picks the horizontal centre of a landscape take), 30 fps, 48 kHz;
 *    voice only: source.m4a, 48 kHz mono;
 * 2. transcribes it with whisper.cpp (`whisper-cli`), one entry per word, with times
 *    and confidence → src/videos/<id>/transcript.json;
 * 3. proposes the edit (fillers, stutters, retakes) → src/videos/<id>/cuts.json, if
 *    there is none yet, and prints the review.
 *
 * Run `bun run new <id> --flow <X> --visual talking-head` (or `--voice recorded`) first. The original file
 * is never copied into the repo. Same source file → no Whisper call (`--force` re-reads).
 */
import {existsSync, readFileSync, statSync} from "node:fs";
import {basename, join, resolve} from "node:path";
import {proposeCuts, reviewText} from "./lib/cutplan";
import {cutsPath, FOOTAGE_ENGINE, footageCache, loadTranscript, refineWords, transcriptPath, writeTranscript, type Transcript, type TWord} from "./lib/footage";
import {loadNarration} from "./lib/narration";
import {die, ensureDir, flag, p, videoDir} from "./lib/paths";
import {decodePcm, ffprobeJson, must, run} from "./lib/proc";
import {loadThresholds} from "./lib/thresholds";

const USAGE = 'bun run ingest <id> <file> [--lang vi] [--prompt "names, terms"] [--crop-x 0.5] [--model path] [--force]';
const VALUE_FLAGS = new Set(["--lang", "--prompt", "--crop-x", "--model"]);
const pos = process.argv.slice(2).filter((a, i, all) => !a.startsWith("-") && !VALUE_FLAGS.has(all[i - 1] ?? ""));
const [id, file] = pos;
if (!id || !file) die(`usage: ${USAGE}`);
if (!existsSync(join(videoDir(id), "narration.json"))) die(`no video "${id}": run \`bun run new ${id} --flow <X> --visual talking-head\` first`);
const input = resolve(file);
if (!existsSync(input)) die(`no file ${input}`);

const n = loadNarration(id);
const T = loadThresholds();
const force = flag("force") !== undefined;
const lang = String(flag("lang") ?? n.language ?? "en").split("-")[0].toLowerCase();
const promptArg = flag("prompt");
const prompt = typeof promptArg === "string" ? promptArg : undefined;
const cropX = Number(flag("crop-x") ?? 0.5);
if (!(cropX >= 0 && cropX <= 1)) die("--crop-x must be between 0 and 1");
const modelArg = flag("model");
const model = typeof modelArg === "string" ? resolve(modelArg) : p(".cache/whisper/ggml-large-v3-turbo.bin");
if (!existsSync(model)) {
  die(
    `no Whisper model at ${model}. Download it once (1.6 GB):\n` +
      `  mkdir -p .cache/whisper && curl -L -o .cache/whisper/ggml-large-v3-turbo.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin`,
  );
}
if ((await run("whisper-cli", ["--help"], {timeoutMs: 10_000})).code === 127) die("whisper-cli not found: `brew install whisper-cpp` (macOS) or build whisper.cpp");

if (n.voice.engine !== FOOTAGE_ENGINE) {
  console.log(`  ! narration.json voice.engine is "${n.voice.engine}"; a filmed video uses "${FOOTAGE_ENGINE}". Set it, with voice.source = the sources.json id of the footage.`);
}

// ---------------------------------------------------------------- 1. normalise
const work = ensureDir(footageCache(id));
const filmed = n.visual.includes("talking-head");
const source = join(work, filmed ? "source.mp4" : "source.m4a");
const probe = await ffprobeJson(input);
// cover art in an mp3/m4a shows up as a one-frame "video" stream: not a take
const v = probe.streams.find((s) => s.codec_type === "video" && !s.disposition?.attached_pic);
const a = probe.streams.find((s) => s.codec_type === "audio");
if (filmed && !v) die(`${basename(input)} has no video stream: visual "talking-head" needs a filmed take. For a voice-only video drop "talking-head" from narration.json "visual"`);
if (!a) die(`${basename(input)} has no audio stream: nothing to transcribe`);
if (!filmed && v) console.log(`  voice only: the picture of ${basename(input)} is dropped (visual has no "talking-head")`);
const rot = !v ? false : Math.abs(Number(v!.side_data_list?.find((d: any) => d.rotation !== undefined)?.rotation ?? v!.tags?.rotate ?? 0)) % 180 === 90;
const [srcW, srcH] = !filmed ? [0, 0] : rot ? [v!.height, v!.width] : [v!.width, v!.height];
if (filmed && srcH < 1280) console.log(`  ! source is ${srcW}×${srcH}: below 1280 px tall it will be upscaled and soft (§5 "resolution must hold")`);

const scaledW = Math.round((srcW * 1920) / srcH);
const cropFilter =
  scaledW >= 1080
    ? `scale=-2:1920,crop=1080:1920:${Math.round((scaledW - 1080) * cropX)}:0`
    : "scale=1080:-2,crop=1080:1920"; // wider-than-tall never reaches here; taller-than-9:16 crops top/bottom evenly
const st = statSync(input);
const inputKey = `${input}|${st.size}|${st.mtimeMs}|${cropX}`;
const keyFile = join(work, "source.key");
if (force || !existsSync(source) || !existsSync(keyFile) || readFileSync(keyFile, "utf8") !== inputKey) {
  const audioArgs = ["-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "1"];
  if (filmed) {
    console.log(`ingest ${id}: normalising ${basename(input)} (${srcW}×${srcH}) → 1080×1920 30 fps`);
    await must(
      "ffmpeg",
      ["-v", "error", "-y", "-i", input, "-vf", `${cropFilter},fps=30,setsar=1,format=yuv420p`, "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", ...audioArgs, "-movflags", "+faststart", source],
      {timeoutMs: 1_800_000},
    );
  } else {
    console.log(`ingest ${id}: voice only, normalising the audio of ${basename(input)} → 48 kHz mono`);
    await must("ffmpeg", ["-v", "error", "-y", "-i", input, "-vn", ...audioArgs, source], {timeoutMs: 600_000});
  }
  await Bun.write(keyFile, inputKey);
} else console.log(`= ${source.replace(p(""), "").slice(1)} is current`);

const hasher = new Bun.CryptoHasher("sha1");
hasher.update(readFileSync(source));
const hash = hasher.digest("hex").slice(0, 16);
const duration = Number((await ffprobeJson(source)).format.duration ?? 0);

// ---------------------------------------------------------------- 2. transcribe
const prev = loadTranscript(id);
let transcript: Transcript;
if (!force && prev && prev.hash === hash && prev.language === lang && prev.prompt === prompt && prev.model === basename(model)) {
  console.log(`= transcript.json matches the source (hash ${hash}); no Whisper call. --force re-reads.`);
  transcript = prev;
} else {
  const wav = join(work, "voice16k.wav");
  await must("ffmpeg", ["-v", "error", "-y", "-i", source, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", wav], {timeoutMs: 600_000});
  const outBase = join(work, "whisper");
  console.log(`  whisper ${basename(model)} (${lang}) on ${duration.toFixed(1)} s of audio…`);
  // -ml 1 -sow: one segment per WORD, split at word boundaries, so every segment's
  // text is whole UTF-8 (Vietnamese letters can span several tokens).
  await must(
    "whisper-cli",
    ["-m", model, "-f", wav, "-l", lang, "-ml", "1", "-sow", "-ojf", "-of", outBase, "-np", ...(prompt ? ["--prompt", prompt] : [])],
    {timeoutMs: 3_600_000},
  );
  const raw = JSON.parse(readFileSync(`${outBase}.json`, "utf8")) as {
    transcription: {offsets: {from: number; to: number}; text: string; tokens?: {text: string; p: number}[]}[];
  };
  const words: TWord[] = [];
  for (const seg of raw.transcription) {
    const text = seg.text.trim();
    if (!text || !/[\p{L}\p{N}]/u.test(text)) {
      // a lone punctuation mark: attach it to the previous word ("thế" + "." → "thế.")
      if (text && words.length) words[words.length - 1].text += text;
      continue;
    }
    const toks = (seg.tokens ?? []).filter((t) => !t.text.startsWith("[_"));
    const prob = toks.length ? toks.reduce((s, t) => s + t.p, 0) / toks.length : 1;
    words.push({i: words.length, text, start: seg.offsets.from / 1000, end: seg.offsets.to / 1000, p: Math.round(prob * 100) / 100});
  }
  if (!words.length) die("Whisper heard no words: check the audio, the language (--lang) and the model");
  // Whisper's segments touch end to end; trim each word to its voiced audio.
  const refined = refineWords(words, await decodePcm(wav, 16000), 16000);
  const silence = refined.reduce((s, w, i) => s + (i ? Math.max(0, w.start - refined[i - 1].end) : 0), 0);
  console.log(`  word edges trimmed to the voiced audio: ${silence.toFixed(1)} s of silence found between words`);
  words.splice(0, words.length, ...refined);
  for (const w of refined.filter((x) => x.suspect)) {
    console.log(`  ! ${w.start.toFixed(1)}–${w.end.toFixed(1)} s is voiced but Whisper wrote only "${w.text}": words were probably dropped. Listen there; re-run with --prompt naming the terms said, or re-record.`);
  }
  transcript = {
    hash,
    model: basename(model),
    language: lang,
    ...(prompt ? {prompt} : {}),
    source: {file: source.replace(`${p("")}/`, ""), duration, width: srcW, height: srcH},
    words,
  };
  await writeTranscript(transcriptPath(id), transcript);
  console.log(`+ src/videos/${id}/transcript.json  ${words.length} words, ${duration.toFixed(1)} s`);
}

// ---------------------------------------------------------------- 3. propose the edit
const fillers = (T.footageFillers as Record<string, string[]>)[lang] ?? [];
const opts = {fillers, maxGap: T.footageMaxGapSeconds, pad: T.footagePadSeconds, retakeWindow: T.footageRetakeWindowWords, lowConfidence: T.footageLowConfidence};
const existing = existsSync(cutsPath(id)) ? (JSON.parse(readFileSync(cutsPath(id), "utf8")) as {transcript: string}) : null;
if (existing && existing.transcript === transcript.hash) {
  console.log(`= cuts.json already made for this transcript; kept (delete it to get a fresh proposal)`);
} else {
  if (existing) console.log(`  ! cuts.json was made for another take (${existing.transcript}); replacing it with a fresh proposal`);
  const cuts = proposeCuts(transcript, opts);
  await Bun.write(cutsPath(id), `${JSON.stringify(cuts, null, 2)}\n`);
  console.log(`+ src/videos/${id}/cuts.json  ${cuts.cuts.length} proposed cuts (${[...new Set(cuts.cuts.map((c) => c.reason))].join(", ") || "none"})`);
}
const cuts = JSON.parse(readFileSync(cutsPath(id), "utf8"));
const review = reviewText(transcript, cuts, opts.lowConfidence);
await Bun.write(join(work, "cut-review.txt"), `${review}\n`);
if (!fillers.length) console.log(`  ! no filler list for "${lang}" in thresholds.json (footageFillers); only retakes and stutters were proposed`);
console.log(`\n${review}\n`);
console.log("Review: [i: cut words ]{reason}, word? = low confidence, ⟨1.4s⟩ = silence that will shrink to maxGap.");
console.log(`Edit src/videos/${id}/cuts.json (keep the LAST attempt of a retake), fix misheard spellings with narration.json "spelling",`);
console.log(`then: bun run cut ${id}`);
