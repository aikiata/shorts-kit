/**
 * `bun run ingest <id> <file|dir>... [--lang vi|auto] [--prompt "names, terms"] [--crop-x 0.5] [--model path]`
 *
 * The first step of a video with a RECORDED voice (§5j), either:
 * - talking-head (visual `talking-head`): a filmed take, shown as the background;
 * - voice only (any other visual): a recording (mp3/wav/m4a, or a video whose
 *   picture is dropped) drives an ordinary video, like a TTS voice would.
 *
 * Several files (or a folder) are several CLIPS of one video: each is normalised,
 * then they are joined in play order (files as given; a folder by filming time,
 * then name). Clip boundaries are kept in the transcript: `cut` never joins
 * across one silently, and each clip has its own face band.
 *
 * 1. normalises each clip to .cache/footage/<id>/clip-NN.mp4: 1080×1920 (cover crop,
 *    `--crop-x` 0..1 picks the horizontal centre of a landscape take), 30 fps, 48 kHz
 *    (voice only: clip-NN.m4a), and joins them into source.mp4 / source.m4a;
 *    filmed clips also get a contact sheet with a pixel ruler, for measuring the face band;
 * 2. transcribes the joined source with whisper.cpp (`whisper-cli`), one entry per
 *    word, with times, confidence and clip → src/videos/<id>/transcript.json;
 * 3. proposes the edit (fillers, stutters, retakes, a clip said again) →
 *    src/videos/<id>/cuts.json, if there is none yet, and prints the review.
 *
 * Run `bun run new <id> --flow <X> --visual talking-head` (or `--voice recorded`) first,
 * or let `bun run from <file>...` do all of it. The original files are never copied into
 * the repo. Same sources → no Whisper call (`--force` re-reads).
 */
import {existsSync, readFileSync, statSync} from "node:fs";
import {basename, join, resolve} from "node:path";
import {proposeCuts, reviewText} from "./lib/cutplan";
import {
  clipAt,
  parseSubs,
  cutsPath,
  expandInputs,
  FOOTAGE_ENGINE,
  footageCache,
  loadTranscript,
  refineWords,
  transcriptPath,
  writeTranscript,
  type Clip,
  type Transcript,
  type TWord,
} from "./lib/footage";
import {loadNarration} from "./lib/narration";
import {die, ensureDir, flag, p, videoDir} from "./lib/paths";
import {decodePcm, ffprobeJson, must, run} from "./lib/proc";
import {loadThresholds} from "./lib/thresholds";

const USAGE = 'bun run ingest <id> <file|dir>... [--lang vi|auto] [--prompt "names, terms"] [--subs captions.json3|.vtt|.srt] [--crop-x 0.5] [--model path] [--force]';
// --subs: the words come from a subtitle file the person already has (their own
// YouTube captions, an editor's .srt, the script they read), not from Whisper.
const VALUE_FLAGS = new Set(["--lang", "--prompt", "--crop-x", "--model", "--subs"]);
const pos = process.argv.slice(2).filter((a, i, all) => !a.startsWith("-") && !VALUE_FLAGS.has(all[i - 1] ?? ""));
const [id, ...paths] = pos;
if (!id || !paths.length) die(`usage: ${USAGE}`);
if (!existsSync(join(videoDir(id), "narration.json"))) die(`no video "${id}": run \`bun run new ${id} --flow <X> --visual talking-head\` first, or \`bun run from <file>\``);
for (const x of paths) if (!existsSync(resolve(x))) die(`no file or folder ${resolve(x)}`);

const n = loadNarration(id);
const T = loadThresholds();
const force = flag("force") !== undefined;
let lang = String(flag("lang") ?? n.language ?? "en").split("-")[0].toLowerCase();
const promptArg = flag("prompt");
const prompt = typeof promptArg === "string" ? promptArg : undefined;
const cropX = Number(flag("crop-x") ?? 0.5);
if (!(cropX >= 0 && cropX <= 1)) die("--crop-x must be between 0 and 1");
const subsArg = flag("subs");
const subs = typeof subsArg === "string" ? resolve(subsArg) : undefined;
if (subs && !existsSync(subs)) die(`no subtitle file ${subs}`);
const modelArg = flag("model");
const model = typeof modelArg === "string" ? resolve(modelArg) : p(".cache/whisper/ggml-large-v3-turbo.bin");
if (!subs && !existsSync(model)) {
  die(
    `no Whisper model at ${model}. Download it once (1.6 GB):\n` +
      `  mkdir -p .cache/whisper && curl -L -o .cache/whisper/ggml-large-v3-turbo.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin`,
  );
}
if (!subs && (await run("whisper-cli", ["--help"], {timeoutMs: 10_000})).code === 127) die("whisper-cli not found: `brew install whisper-cpp` (macOS) or build whisper.cpp");

if (n.voice.engine !== FOOTAGE_ENGINE) {
  console.log(`  ! narration.json voice.engine is "${n.voice.engine}"; a recorded voice uses "${FOOTAGE_ENGINE}". Set it, with voice.source = the sources.json id of the recording.`);
}

// ---------------------------------------------------------------- 1. normalise each clip, join
const work = ensureDir(footageCache(id));
const filmed = n.visual.includes("talking-head");
const ext = filmed ? "mp4" : "m4a";
const source = join(work, `source.${ext}`);
const inputs = await expandInputs(paths, (f) => ffprobeJson(f) as Promise<{format: {tags?: Record<string, string>}}>);
if (!inputs.length) die("no media files found in the given folder");
if (inputs.length > 1) console.log(`ingest ${id}: ${inputs.length} clips, in this order:\n${inputs.map((x, i) => `  ${i + 1}. ${basename(x.file)}${x.created ? `  (${x.created})` : ""}`).join("\n")}`);

type Norm = {file: string; out: string; width: number; height: number; created?: string};
const normed: Norm[] = [];
for (const [k, inp] of inputs.entries()) {
  const input = inp.file;
  const out = join(work, `clip-${String(k + 1).padStart(2, "0")}.${ext}`);
  const probe = await ffprobeJson(input);
  // cover art in an mp3/m4a shows up as a one-frame "video" stream: not a take
  const v = probe.streams.find((st) => st.codec_type === "video" && !st.disposition?.attached_pic);
  const a = probe.streams.find((st) => st.codec_type === "audio");
  if (filmed && !v) die(`${basename(input)} has no video stream: visual "talking-head" needs filmed clips. For a voice-only video drop "talking-head" from narration.json "visual"`);
  if (!a) die(`${basename(input)} has no audio stream: nothing to transcribe`);
  if (!filmed && v) console.log(`  voice only: the picture of ${basename(input)} is dropped (visual has no "talking-head")`);
  const rot = !v ? false : Math.abs(Number(v.side_data_list?.find((d: any) => d.rotation !== undefined)?.rotation ?? v.tags?.rotate ?? 0)) % 180 === 90;
  const [w, h] = !filmed ? [0, 0] : rot ? [v!.height, v!.width] : [v!.width, v!.height];
  if (filmed && h < 1280) console.log(`  ! ${basename(input)} is ${w}×${h}: below 1280 px tall it will be upscaled and soft (§5 "resolution must hold")`);
  const scaledW = filmed ? Math.round((w * 1920) / h) : 0;
  const cropFilter = scaledW >= 1080 ? `scale=-2:1920,crop=1080:1920:${Math.round((scaledW - 1080) * cropX)}:0` : "scale=1080:-2,crop=1080:1920";
  const st = statSync(input);
  const key = `${input}|${st.size}|${st.mtimeMs}|${cropX}|${ext}`;
  const keyFile = `${out}.key`;
  if (force || !existsSync(out) || !existsSync(keyFile) || readFileSync(keyFile, "utf8") !== key) {
    const audioArgs = ["-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "1"];
    console.log(`  normalising ${basename(input)}${filmed ? ` (${w}×${h}) → 1080×1920 30 fps` : " → 48 kHz mono"}`);
    if (filmed) {
      await must("ffmpeg", ["-v", "error", "-y", "-i", input, "-vf", `${cropFilter},fps=30,setsar=1,format=yuv420p`, "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", ...audioArgs, "-movflags", "+faststart", out], {timeoutMs: 1_800_000});
    } else {
      await must("ffmpeg", ["-v", "error", "-y", "-i", input, "-vn", ...audioArgs, out], {timeoutMs: 600_000});
    }
    await Bun.write(keyFile, key);
  }
  normed.push({file: basename(input), out, width: w, height: h, created: inp.created});
}

// join (one clip: still re-wrapped, so every video reads from source.*)
const listFile = join(work, "clips.txt");
await Bun.write(listFile, normed.map((x) => `file '${x.out.replace(/'/g, "'\\''")}'`).join("\n") + "\n");
const joinKey = normed.map((x) => `${x.out}:${statSync(x.out).mtimeMs}`).join("|");
const joinKeyFile = `${source}.key`;
if (force || !existsSync(source) || !existsSync(joinKeyFile) || readFileSync(joinKeyFile, "utf8") !== joinKey) {
  await must("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", ...(filmed ? ["-movflags", "+faststart"] : []), source], {timeoutMs: 600_000});
  await Bun.write(joinKeyFile, joinKey);
}
// clip spans in the joined source, from each normalised clip's own length
const clips: Clip[] = [];
let at = 0;
for (const x of normed) {
  const d = Number((await ffprobeJson(x.out)).format.duration ?? 0);
  clips.push({file: x.file, start: Math.round(at * 1000) / 1000, end: Math.round((at + d) * 1000) / 1000, width: x.width, height: x.height, ...(x.created ? {created: x.created} : {})});
  at += d;
}

// contact sheets with a pixel ruler (every 100 px, heavy every 500), to measure each clip's face band
if (filmed) {
  for (const [k, x] of normed.entries()) {
    const sheet = join(work, `clip-${String(k + 1).padStart(2, "0")}-sheet.jpg`);
    if (!existsSync(sheet) || statSync(sheet).mtimeMs < statSync(x.out).mtimeMs) {
      const d = clips[k].end - clips[k].start;
      const ruler = Array.from({length: 19}, (_, j) => (j + 1) * 100).map((y) => `drawbox=x=0:y=${y}:w=1080:h=${y % 500 ? 2 : 6}:color=${y % 500 ? "yellow@0.5" : "red@0.8"}:t=fill`).join(",");
      await must("ffmpeg", ["-v", "error", "-y", "-i", x.out, "-vf", `fps=${(5 / Math.max(0.5, d)).toFixed(4)},${ruler},scale=360:-1,tile=5x1`, "-frames:v", "1", sheet], {timeoutMs: 120_000});
    }
  }
}

const hasher = new Bun.CryptoHasher("sha1");
hasher.update(readFileSync(source));
const hash = hasher.digest("hex").slice(0, 16);
const duration = Number((await ffprobeJson(source)).format.duration ?? 0);
const srcW = normed[0].width;
const srcH = normed[0].height;

// ---------------------------------------------------------------- 2. transcribe
const prev = loadTranscript(id);
let transcript: Transcript;
const textSource = subs ? `subs:${basename(subs)}` : basename(model);
if (subs && inputs.length > 1) die("--subs works with one recording; for several clips, transcribe them (no --subs)");
if (!force && prev && prev.hash === hash && (lang === "auto" || prev.language === lang) && prev.prompt === prompt && prev.model === textSource) {
  lang = prev.language;
  console.log(`= transcript.json matches the source (hash ${hash}); no Whisper call. --force re-reads.`);
  transcript = prev;
} else {
  const wav = join(work, "voice16k.wav");
  await must("ffmpeg", ["-v", "error", "-y", "-i", source, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", wav], {timeoutMs: 600_000});
  // One Whisper run PER CLIP, offset into the joined timeline. Clips are separate
  // recordings: a run over all of them carries context across the joins, and on
  // the first multi-clip test (a clip said twice) it collapsed into "à à à …".
  type RawSeg = {offsets: {from: number; to: number}; text: string; tokens?: {text: string; p: number}[]};
  const whisper = async (file: string, outBase: string, language: string, extra: string[] = []) => {
    // -ml 1 -sow: one segment per WORD, split at word boundaries, so every segment's
    // text is whole UTF-8 (Vietnamese letters can span several tokens).
    await must("whisper-cli", ["-m", model, "-f", file, "-l", language, "-ml", "1", "-sow", "-ojf", "-of", outBase, "-np", ...extra, ...(prompt ? ["--prompt", prompt] : [])], {timeoutMs: 3_600_000});
    return JSON.parse(readFileSync(`${outBase}.json`, "utf8")) as {result?: {language?: string}; transcription: RawSeg[]};
  };
  const bareOf = (x: string) => x.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
  /** One word over and over is Whisper's repetition loop, not a transcript. */
  const looped = (segs: RawSeg[]) => {
    const ws = segs.map((x) => bareOf(x.text)).filter(Boolean);
    const top = Math.max(0, ...[...new Set(ws)].map((x) => ws.filter((y) => y === x).length));
    return ws.length >= 8 && top / ws.length > 0.5 ? {word: ws.find((x) => ws.filter((y) => y === x).length === top)!, top, of: ws.length} : null;
  };
  // Greedy first; on a loop, sample at a higher temperature (beam search and padding
  // were tried on the first looping clip: beam looped too, padding made Whisper
  // invent "Hãy subscribe cho kênh …", a sentence nobody said).
  const ATTEMPTS: string[][] = [[], ["-tp", "0.4"], ["-tp", "0.6"]];
  const hallucinations = ((T.whisperHallucinations as Record<string, string[]>)?.[lang] ?? Object.values((T.whisperHallucinations as Record<string, string[]>) ?? {}).flat()).map(bareOf);
  const words: TWord[] = [];
  const detected: string[] = [];
  if (subs) {
    words.push(...parseSubs(subs, readFileSync(subs, "utf8")));
    if (lang === "auto") lang = String(n.language ?? "en").split("-")[0];
    console.log(`  words from ${basename(subs)}: ${words.length} (no Whisper call); machine captions are still machine-heard, numbers and names go to the speaker`);
  }
  for (const [k, c] of (subs ? [] : clips).entries()) {
    const clipWav = clips.length > 1 ? join(work, `clip-${String(k + 1).padStart(2, "0")}-16k.wav`) : wav;
    if (clips.length > 1) {
      await must("ffmpeg", ["-v", "error", "-y", "-i", wav, "-ss", String(c.start), "-to", String(c.end), "-c:a", "pcm_s16le", clipWav], {timeoutMs: 120_000});
    }
    console.log(`  whisper ${basename(model)} (${lang}) on ${clips.length > 1 ? `clip ${k + 1}, ` : ""}${(c.end - c.start).toFixed(1)} s of audio…`);
    const base = join(work, clips.length > 1 ? `whisper-${String(k + 1).padStart(2, "0")}` : "whisper");
    let raw = await whisper(clipWav, base, lang);
    for (let attempt = 1; looped(raw.transcription) && attempt < ATTEMPTS.length; attempt++) {
      const l = looped(raw.transcription)!;
      console.log(`  ! Whisper looped ("${l.word}" ${l.top}/${l.of}); retrying with ${ATTEMPTS[attempt].join(" ")}`);
      raw = await whisper(clipWav, base, lang, ATTEMPTS[attempt]);
    }
    const stillLooped = looped(raw.transcription);
    if (stillLooped) {
      die(`Whisper looped on ${clips.length > 1 ? `clip ${k + 1}` : "the take"} at every setting: "${stillLooped.word}" ${stillLooped.top} times out of ${stillLooped.of} words. Re-run with --lang set and a --prompt naming what is said, or re-record that clip.`);
    }
    detected.push((raw.result?.language ?? lang).toLowerCase());
    const before = words.length;
    for (const seg of raw.transcription) {
      const text = seg.text.trim();
      if (!text || !/[\p{L}\p{N}]/u.test(text)) {
        // a lone punctuation mark: attach it to the previous word of this clip ("thế" + "." → "thế.")
        if (text && words.length > before) words[words.length - 1].text += text;
        continue;
      }
      const toks = (seg.tokens ?? []).filter((t) => !t.text.startsWith("[_"));
      const prob = toks.length ? toks.reduce((s, t) => s + t.p, 0) / toks.length : 1;
      words.push({i: words.length, text, start: c.start + seg.offsets.from / 1000, end: Math.min(c.end, c.start + seg.offsets.to / 1000), p: Math.round(prob * 100) / 100});
    }
    // Known Whisper inventions ("subscribe to the channel …" over silence or noise):
    // never trust them, put them in front of the speaker.
    // Mark only the run of words that spells the phrase, never every "cho" in the clip.
    const mine = words.slice(before);
    for (const h of hallucinations) {
      if (!h) continue;
      for (let a = 0; a < mine.length; a++) {
        let acc = "";
        let b = a;
        while (b < mine.length && acc.length < h.length) acc += bareOf(mine[b++].text);
        if (acc === h) {
          for (const w of mine.slice(a, b)) w.p = Math.min(w.p, 0.2);
          console.log(`  ! ${clips.length > 1 ? `clip ${k + 1}: ` : ""}${mine[a].start.toFixed(1)} s: Whisper wrote a phrase it often invents ("${mine.slice(a, b).map((w) => w.text).join(" ")}"): marked unsure, confirm it with the speaker`);
          a = b - 1;
        }
      }
    }
  }
  if (lang === "auto") {
    const counts = new Map<string, number>();
    for (const d of detected) counts.set(d, (counts.get(d) ?? 0) + 1);
    lang = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "en";
    console.log(`  language detected: ${lang}${new Set(detected).size > 1 ? ` (clips: ${detected.join(", ")})` : ""}`);
  }
  if (!words.length) die("Whisper heard no words: check the audio, the language (--lang) and the model");
  // Whisper's segments touch end to end; trim each word to its voiced audio.
  const refined = refineWords(words, await decodePcm(wav, 16000), 16000);
  const silence = refined.reduce((s, w, i) => s + (i ? Math.max(0, w.start - refined[i - 1].end) : 0), 0);
  console.log(`  word edges trimmed to the voiced audio: ${silence.toFixed(1)} s of silence found between words`);
  words.splice(0, words.length, ...refined.map((w) => (clips.length > 1 ? {...w, clip: clipAt(clips, w.start)} : w)));
  for (const w of refined.filter((x) => x.suspect)) {
    console.log(`  ! ${w.start.toFixed(1)}–${w.end.toFixed(1)} s is voiced but the transcript has only "${w.text}": words were probably dropped. Listen there; re-run with --prompt naming the terms said, or re-record.`);
  }
  transcript = {
    hash,
    model: textSource,
    language: lang,
    ...(prompt ? {prompt} : {}),
    source: {file: source.replace(`${p("")}/`, ""), duration, width: srcW, height: srcH, ...(clips.length > 1 ? {clips} : {})},
    words,
  };
  await writeTranscript(transcriptPath(id), transcript);
  console.log(`+ src/videos/${id}/transcript.json  ${words.length} words, ${duration.toFixed(1)} s${clips.length > 1 ? `, ${clips.length} clips` : ""}`);

  // clips recorded at different levels or rooms: the join will be heard
  if (clips.length > 1) {
    const pcm = await decodePcm(wav, 16000);
    const level = clips.map((c) => {
      const a = Math.floor(c.start * 16000);
      const b = Math.min(pcm.length, Math.floor(c.end * 16000));
      const fr: number[] = [];
      for (let i = a; i + 160 <= b; i += 160) {
        let e = 0;
        for (let j = i; j < i + 160; j++) e += pcm[j] * pcm[j];
        fr.push(10 * Math.log10(e / 160 + 1e-12));
      }
      fr.sort((x, y) => x - y);
      return {speech: fr[Math.floor(fr.length * 0.95)] ?? -60, room: fr[Math.floor(fr.length * 0.1)] ?? -60};
    });
    const spread = (k: "speech" | "room") => Math.max(...level.map((l) => l[k])) - Math.min(...level.map((l) => l[k]));
    if (spread("speech") > 6) console.log(`  ! clips differ by ${spread("speech").toFixed(0)} dB in voice level (${level.map((l) => l.speech.toFixed(0)).join(", ")} dB): the change will be heard at each clip join; normalize evens the whole, not each clip`);
    if (spread("room") > 8) console.log(`  ! clips differ by ${spread("room").toFixed(0)} dB in room tone (${level.map((l) => l.room.toFixed(0)).join(", ")} dB): different rooms or mics; expect an audible change at each clip join`);
  }
}

// ---------------------------------------------------------------- 3. propose the edit
lang = transcript.language;
const fillers = (T.footageFillers as Record<string, string[]>)[lang] ?? [];
const opts = {fillers, maxGap: T.footageMaxGapSeconds, pad: T.footagePadSeconds, retakeWindow: T.footageRetakeWindowWords, lowConfidence: T.footageLowConfidence, clipRetakeShare: T.footageClipRetakeShare, clipRetakeMinWords: T.footageClipRetakeMinWords};
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
if (filmed) console.log(`Face band: open .cache/footage/${id}/clip-*-sheet.jpg (ruler lines every 100 px, red every 500) and set narration.json "face": {top, bottom}${clips.length > 1 ? ", or one per clip: [{top, bottom}, …]" : ""}.`);
console.log(`then: bun run cut ${id}`);
