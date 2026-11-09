/**
 * `bun run voice <id> [--force]`: the spoken lines of a promo (docs/promo/).
 *
 * A promo is not narrated end to end: promo.json → `voice.lines` holds a few lines,
 * each placed in a scene. Each is synthesised on its own (ElevenLabs, ELEVENLABS_API_KEY
 * in .env), so a line can be moved on the timeline without re-reading the others.
 * Writes public/audio/<id>/<line id>.mp3 and src/videos/<id>/voice-lines.json
 * ({id, text, file, seconds, hash, words: [{text, start, end}]}); the second is generated, never
 * edit it. Word times come from the service, so type and shots can land on a word.
 * A line whose text and voice did not change is not paid for again.
 */
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import type {Promo} from "../src/shared/promo";
import {die, flag, p, videoDir} from "./lib/paths";
import {duration} from "./lib/proc";

const id = process.argv.slice(2).find((a) => !a.startsWith("-"));
if (!id) die("usage: bun run voice <id> [--force]");
const promoPath = join(videoDir(id!), "promo.json");
if (!existsSync(promoPath)) die(`src/videos/${id}/promo.json does not exist`);
const promo = JSON.parse(readFileSync(promoPath, "utf8")) as Promo;
const cfg = promo.voice;
if (!cfg?.lines?.length) die(`promo.json has no voice.lines`);
const key = process.env.ELEVENLABS_API_KEY ?? die("ELEVENLABS_API_KEY is not set (put it in .env, see .env.example)");
const model = cfg!.model ?? "eleven_v3";
const outDir = p("public/audio", id!);
mkdirSync(outDir, {recursive: true});
const recordPath = join(videoDir(id!), "voice-lines.json");
const old: unknown[] = existsSync(recordPath) ? JSON.parse(readFileSync(recordPath, "utf8")) : [];

type Rec = {id: string; text: string; file: string; seconds: number; hash: string; words: {text: string; start: number; end: number}[]};
const out: Rec[] = [];
for (const l of cfg!.lines) {
  const hash = createHash("sha256").update(`${cfg!.voice}|${model}|${l.text}|ts`).digest("hex").slice(0, 16);
  const file = join(outDir, `${l.id}.mp3`);
  const prev = (old as Rec[]).find((o) => o.id === l.id);
  if (!flag("force") && existsSync(file) && prev?.hash === hash && prev.words?.length) {
    console.log(`  = ${l.id}: unchanged`);
    out.push({...prev, seconds: Number((await duration(file)).toFixed(3))});
    continue;
  }
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${cfg!.voice}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers: {"xi-api-key": key, "Content-Type": "application/json"},
    body: JSON.stringify({text: l.text, model_id: model}),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) die(`ElevenLabs ${res.status} on line "${l.id}": ${(await res.text()).slice(0, 300)}`);
  const body = (await res.json()) as {audio_base64: string; alignment: {characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[]}};
  writeFileSync(file, Buffer.from(body.audio_base64, "base64"));
  // words from the character alignment: a word is a run of non-space characters
  const a = body.alignment;
  const words: Rec["words"] = [];
  let cur = "";
  let st = 0;
  let en = 0;
  a.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) {
      if (cur) words.push({text: cur, start: st, end: en}), (cur = "");
    } else {
      if (!cur) st = a.character_start_times_seconds[i];
      cur += ch;
      en = a.character_end_times_seconds[i];
    }
  });
  if (cur) words.push({text: cur, start: st, end: en});
  console.log(`  + ${l.id}: "${l.text}"`);
  out.push({id: l.id, text: l.text, file: `audio/${id}/${l.id}.mp3`, seconds: Number((await duration(file)).toFixed(3)), hash, words});
}
writeFileSync(recordPath, `${JSON.stringify(out, null, 2)}\n`);
for (const o of out) console.log(`  ${o.id.padEnd(8)} ${o.seconds.toFixed(2)} s  ${o.words.map((w) => `${w.text}@${w.start.toFixed(2)}`).join(" ")}`);
console.log(`+ src/videos/${id}/voice-lines.json. Listen to each line (no one has heard them until you do).`);
