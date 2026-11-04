/**
 * `bun run encode <id>`: the platform upload file (§11):
 * out/<id>/<id>-loud.mp4 → out/<id>/<id>-upload.mp4
 *
 * H.264 High, CRF 18, yuv420p LIMITED range, BT.709 primaries/transfer/matrix
 * (Remotion tags its output iec61966-2-1 / full range, which platforms
 * re-encode into crushed or washed-out colour), AAC 192k 48 kHz, +faststart.
 * Then verifies the file with ffprobe and prints what it found. Exit 1 when a
 * hard check fails.
 */
import {existsSync, openSync, readSync, closeSync, statSync} from "node:fs";
import {join} from "node:path";
import {die, outDir, videoArg} from "./lib/paths";
import {decodePcm, ffprobeJson, loudness, must} from "./lib/proc";
import {loadThresholds} from "./lib/thresholds";

const id = videoArg("bun run encode <id>");
const T = loadThresholds();
const dir = outDir(id);
const loud = join(dir, `${id}-loud.mp4`);
const raw = join(dir, `${id}.mp4`);
const dst = join(dir, `${id}-upload.mp4`);
let src = loud;
if (!existsSync(loud)) {
  if (!existsSync(raw)) die(`neither out/${id}/${id}-loud.mp4 nor ${id}.mp4 exists. Run render and normalize first.`);
  console.warn(`! out/${id}/${id}-loud.mp4 not found: encoding the raw render, which is NOT loudness-normalized. Run \`bun run normalize ${id}\`.`);
  src = raw;
}
const rate = String(T.audioSampleRate ?? 48000);

await must(
  "ffmpeg",
  [
    "-hide_banner", "-loglevel", "error", "-y", "-i", src,
    "-map", "0:v:0", "-map", "0:a:0",
    // setparams retags the FRAMES: Remotion's iec61966-2-1 transfer otherwise rides through the filter graph and
    // wins over -color_trc in the output stream (seen with ffmpeg 8: color_transfer stayed iec61966-2-1).
    "-vf", "scale=in_range=full:out_range=tv:in_color_matrix=bt709:out_color_matrix=bt709,format=yuv420p,setparams=range=tv:color_primaries=bt709:color_trc=bt709:colorspace=bt709",
    "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-crf", "18",
    "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
    // ffmpeg's -color_* flags do not all reach the H.264 VUI; tell x264 directly
    "-x264-params", "colorprim=bt709:transfer=bt709:colormatrix=bt709:fullrange=off",
    "-c:a", "aac", "-b:a", "192k", "-ar", rate, "-ac", "2",
    "-movflags", "+faststart",
    dst,
  ],
  {timeoutMs: 1_800_000},
);

// ---------------------------------------------------------------- verify
const probe = await ffprobeJson(dst);
const v = probe.streams.find((s) => s.codec_type === "video") ?? {};
const a = probe.streams.find((s) => s.codec_type === "audio") ?? {};

/** Top-level MP4 boxes in order, to prove moov comes before mdat. */
const topBoxes = (file: string) => {
  const fd = openSync(file, "r");
  const size = statSync(file).size;
  const out: string[] = [];
  const head = Buffer.alloc(16);
  let pos = 0;
  while (pos + 8 <= size && out.length < 32) {
    readSync(fd, head, 0, 16, pos);
    let len = head.readUInt32BE(0);
    const type = head.toString("latin1", 4, 8);
    if (len === 1) len = Number(head.readBigUInt64BE(8));
    else if (len === 0) len = size - pos;
    out.push(type);
    if (len < 8) break;
    pos += len;
  }
  closeSync(fd);
  return out;
};
const boxes = topBoxes(dst);
const faststart = boxes.indexOf("moov") >= 0 && boxes.indexOf("moov") < boxes.indexOf("mdat");

const checks: [string, string, boolean][] = [
  ["video codec", String(v.codec_name), v.codec_name === "h264"],
  ["size", `${v.width}x${v.height}`, v.width === 1080 && v.height === 1920],
  ["pix_fmt", String(v.pix_fmt), v.pix_fmt === "yuv420p"],
  ["color_range", String(v.color_range), v.color_range === "tv"],
  ["color_primaries", String(v.color_primaries), v.color_primaries === "bt709"],
  ["color_transfer", String(v.color_transfer), v.color_transfer === "bt709"],
  ["color_space", String(v.color_space), v.color_space === "bt709"],
  ["audio", `${a.codec_name} ${a.sample_rate} Hz ${a.channels} ch`, a.codec_name === "aac" && String(a.sample_rate) === rate],
  ["faststart", faststart ? "moov before mdat" : `boxes: ${boxes.join(" ")}`, faststart],
];

const lu = await loudness(dst);
// voice over music: P90 − P10 of 200 ms RMS windows (§8); silent windows (outro hold) excluded
const pcm = await decodePcm(dst, 16000);
const win = 3200;
const levels: number[] = [];
for (let i = 0; i + win <= pcm.length; i += win) {
  let s = 0;
  for (let j = i; j < i + win; j++) s += pcm[j] * pcm[j];
  const d = 10 * Math.log10(s / win + 1e-12);
  if (d > -70) levels.push(d);
}
levels.sort((x, y) => x - y);
const pct = (q: number) => levels[Math.min(levels.length - 1, Math.floor(q * levels.length))] ?? NaN;
const spread = pct(0.9) - pct(0.1);
const seconds = Number(probe.format.duration);

console.log(`+ out/${id}/${id}-upload.mp4  ${(Number(probe.format.size) / 1e6).toFixed(1)} MB, ${seconds.toFixed(2)} s, from ${src.endsWith("-loud.mp4") ? `${id}-loud.mp4` : `${id}.mp4 (NOT normalized)`}`);
let failed = 0;
for (const [name, got, ok] of checks) {
  console.log(`  ${ok ? "ok " : "✖  "} ${name.padEnd(16)} ${got}`);
  if (!ok) failed++;
}
const I = T.loudnessLUFS as number;
const loudOk = Math.abs(lu.I - I) <= 1;
console.log(`  ${loudOk ? "ok " : "!  "} ${"loudness".padEnd(16)} ${lu.I.toFixed(1)} LUFS (target ${I}), true peak ${lu.truePeak} dBFS`);
const spreadOk = !(spread < T.musicUnderVoiceDb);
console.log(`  ${spreadOk ? "ok " : "!  "} ${"voice spread".padEnd(16)} P90−P10 ${spread.toFixed(1)} dB (floor ${T.musicUnderVoiceDb}; warn only)`);

console.log("");
if (seconds > T.maxDurationSeconds) {
  console.log(`✖ LENGTH ${seconds.toFixed(1)} s is over the ${T.maxDurationSeconds} s platform ceiling: this is not a Short (§8).`);
  failed++;
} else console.log(`  length ${seconds.toFixed(1)} s (ceiling ${T.maxDurationSeconds} s)`);
if (failed) die(`${failed} upload check(s) failed`);
console.log("  Upload file ready. Watch it end to end before hand-off.");
