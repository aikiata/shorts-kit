/**
 * `bun run normalize <id>`: two-pass EBU R128 loudness normalisation of
 * out/<id>/<id>.mp4 to `loudnessLUFS` / `truePeakMaxDb` (§8) →
 * out/<id>/<id>-loud.mp4. Video is stream-copied; audio re-encoded AAC 48 kHz.
 * A raw render sits near −20 LUFS and plays quieter than the rest of the feed.
 */
import {existsSync} from "node:fs";
import {join} from "node:path";
import {die, isVoiceless, outDir, videoArg} from "./lib/paths";
import {loudness, must, run} from "./lib/proc";
import {loadThresholds} from "./lib/thresholds";

const id = videoArg("bun run normalize <id>");
const T = loadThresholds();
// a promo with a voice-over is mixed like a short (§8); only a film with no voice gets the promo targets
const promo = isVoiceless(id);
const I = (promo ? T.promoLoudnessLUFS : T.loudnessLUFS) as number;
const TP = (promo ? T.promoTruePeakMaxDb : T.truePeakMaxDb) as number;
const LRA = 11;
const rate = String(T.audioSampleRate ?? 48000);
const src = join(outDir(id), `${id}.mp4`);
const dst = join(outDir(id), `${id}-loud.mp4`);
if (!existsSync(src)) die(`out/${id}/${id}.mp4 not found. Run \`bun run render ${id}\` first.`);

const pass1 = await run("ffmpeg", ["-hide_banner", "-nostats", "-i", src, "-map", "0:a:0", "-af", `loudnorm=I=${I}:TP=${TP}:LRA=${LRA}:print_format=json`, "-f", "null", "-"], {
  timeoutMs: 600_000,
});
if (pass1.code !== 0) die(`loudness measurement failed:\n${pass1.stderr.slice(-1500)}`);
const json = pass1.stderr.slice(pass1.stderr.lastIndexOf("{"), pass1.stderr.lastIndexOf("}") + 1);
let m: Record<string, string>;
try {
  m = JSON.parse(json);
} catch {
  die(`could not read loudnorm measurement:\n${pass1.stderr.slice(-800)}`);
}
console.log(`measured ${id}.mp4: I=${m!.input_i} LUFS, TP=${m!.input_tp} dBTP, LRA=${m!.input_lra} LU`);

const filter = [
  `loudnorm=I=${I}:TP=${TP}:LRA=${LRA}`,
  `measured_I=${m!.input_i}:measured_TP=${m!.input_tp}:measured_LRA=${m!.input_lra}`,
  `measured_thresh=${m!.input_thresh}:offset=${m!.target_offset}:linear=true:print_format=summary`,
].join(":");
await must(
  "ffmpeg",
  ["-hide_banner", "-loglevel", "error", "-y", "-i", src, "-map", "0:v:0", "-c:v", "copy", "-map", "0:a:0", "-af", filter, "-ar", rate, "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", dst],
  {timeoutMs: 600_000},
);
const after = await loudness(dst);
console.log(`+ out/${id}/${id}-loud.mp4  I=${after.I.toFixed(1)} LUFS (target ${I}), true peak ${after.truePeak} dBFS (max ${TP})`);
if (Math.abs(after.I - I) > 1) console.warn(`! integrated loudness is ${Math.abs(after.I - I).toFixed(1)} LU off target`);
if (after.truePeak > TP + 0.5) console.warn(`! true peak ${after.truePeak} dBFS is above ${TP}`);
console.log(`  Next: listen, then \`bun run encode ${id}\`.`);
