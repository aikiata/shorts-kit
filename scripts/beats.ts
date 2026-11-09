/**
 * `bun run beats <file> [--min-bpm 90] [--max-bpm 160] [--hint <bpm>]`
 *
 * Measures the beat grid of a music file for a promo (docs/promo/ rule 4):
 * low-band (kick) onsets, a phase-free comb search for the period, then a
 * least-squares fit of the onsets to the grid. Writes `<file>.beats.json` next
 * to the track with bpm, period, offset (seconds of the first beat) and the
 * error of the grid against the onsets at BOTH ends of the track: a grid that
 * fits the start and drifts by the end is the exact failure a beat tracker's
 * tempo scalar causes (0.5106 s measured, 0.5000 s true: 0.2 s off by 20 s).
 *
 * Put the result in promo.json: `"bpm": <bpm>, "offset": <offset>`.
 */
import {writeFileSync, existsSync, readFileSync} from "node:fs";
import {basename, resolve} from "node:path";
import {die, flag} from "./lib/paths";
import {decodePcm} from "./lib/proc";

const file = process.argv.slice(2).find((a, i, all) => !a.startsWith("-") && !/^--(min-bpm|max-bpm|hint)$/.test(all[i - 1] ?? ""));
if (!file) die("usage: bun run beats <file> [--min-bpm 90] [--max-bpm 160] [--hint <bpm>]");
const path = resolve(file!);
if (!existsSync(path)) die(`${file} does not exist`);
const minBpm = Number(flag("min-bpm") ?? 90);
const maxBpm = Number(flag("max-bpm") ?? 160);
const hint = flag("hint") !== undefined ? Number(flag("hint")) : undefined;
if (!(minBpm > 0 && maxBpm > minBpm)) die("--min-bpm and --max-bpm must be positive and min < max");

const RATE = 11025;
const HOP = 55; // samples: 5 ms
const WIN = 220; // 20 ms
// two low-passes at 150 Hz keep the kick and drop hats and vocals
const pcm = await decodePcm(path, RATE, "lowpass=f=150,lowpass=f=150");
const seconds = pcm.length / RATE;
if (seconds < 8) die(`${seconds.toFixed(1)} s is too short to fit a grid reliably`);

// 1. envelope (RMS per hop) and onset strength (positive change)
const frames = Math.floor((pcm.length - WIN) / HOP);
const env = new Float32Array(frames);
for (let i = 0; i < frames; i++) {
  let s = 0;
  const o = i * HOP;
  for (let j = 0; j < WIN; j++) s += pcm[o + j] * pcm[o + j];
  env[i] = Math.sqrt(s / WIN);
}
const flux = new Float32Array(frames);
for (let i = 1; i < frames; i++) flux[i] = Math.max(0, env[i] - env[i - 1]);

// 2. onsets: local maxima of flux above mean + 1 sd, at least 150 ms apart
const mean = flux.reduce((a, b) => a + b, 0) / frames;
const sd = Math.sqrt(flux.reduce((a, b) => a + (b - mean) ** 2, 0) / frames);
const thr = mean + sd;
const hopSec = HOP / RATE;
const onsets: {t: number; s: number}[] = [];
for (let i = 2; i < frames - 2; i++) {
  if (flux[i] > thr && flux[i] >= flux[i - 1] && flux[i] > flux[i + 1] && flux[i] >= flux[i - 2] && flux[i] > flux[i + 2]) {
    const t = i * hopSec;
    const last = onsets[onsets.length - 1];
    if (last && t - last.t < 0.15) {
      if (flux[i] > last.s) onsets[onsets.length - 1] = {t, s: flux[i]};
    } else onsets.push({t, s: flux[i]});
  }
}
if (onsets.length < 12) die(`only ${onsets.length} kick onsets found: this track has no clear low-band pulse (try another file, or measure by hand)`);

// 3. phase-free comb: |sum s_i e^{i 2π t_i / P}| / sum s_i, over the period range
const totalS = onsets.reduce((a, o) => a + o.s, 0);
const coherence = (P: number) => {
  let re = 0;
  let im = 0;
  for (const o of onsets) {
    const a = (2 * Math.PI * o.t) / P;
    re += o.s * Math.cos(a);
    im += o.s * Math.sin(a);
  }
  return {c: Math.hypot(re, im) / totalS, phase: Math.atan2(im, re)};
};
const lo = 60 / maxBpm;
const hi = 60 / minBpm;
let best = {P: lo, c: -1};
const scores: {P: number; c: number}[] = [];
for (let P = lo; P <= hi; P += 0.0001) {
  const {c} = coherence(P);
  scores.push({P, c});
  if (c > best.c) best = {P, c};
}
// harmonics: prefer the slower of near-equal peaks only when a hint says so; otherwise report it
let P0 = best.P;
if (hint) {
  const want = 60 / hint;
  const near = scores.filter((s) => Math.abs(s.P - want) / want < 0.04).sort((a, b) => b.c - a.c)[0];
  if (near) P0 = near.P;
}

// 4. least-squares fit of onsets to the grid, two robust passes
const fitFrom = (P: number, off: number) => {
  let period = P;
  let offset = off;
  for (let pass = 0; pass < 3; pass++) {
    const pts = onsets
      .map((o) => {
        const k = Math.round((o.t - offset) / period);
        return {k, t: o.t, r: o.t - (offset + k * period)};
      })
      .filter((p) => Math.abs(p.r) < 0.06 && p.k >= 0);
    if (pts.length < 8) break;
    const n = pts.length;
    const sk = pts.reduce((a, p) => a + p.k, 0);
    const st = pts.reduce((a, p) => a + p.t, 0);
    const skk = pts.reduce((a, p) => a + p.k * p.k, 0);
    const skt = pts.reduce((a, p) => a + p.k * p.t, 0);
    const den = n * skk - sk * sk;
    if (!den) break;
    period = (n * skt - sk * st) / den;
    offset = (st - period * sk) / n;
  }
  return {period, offset};
};
const phase0 = coherence(P0).phase;
const guessOffset = ((((phase0 / (2 * Math.PI)) * P0) % P0) + P0) % P0;
const {period, offset: rawOffset} = fitFrom(P0, guessOffset);
// first beat at or after 0
const offset = ((rawOffset % period) + period) % period;

// 5. verify against the onsets at both ends
const residuals = onsets
  .map((o) => {
    const k = Math.round((o.t - offset) / period);
    return {t: o.t, r: o.t - (offset + k * period)};
  })
  .filter((x) => Math.abs(x.r) < 0.06);
const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y);
  return s.length ? s[Math.floor(s.length / 2)] : NaN;
};
const startR = residuals.filter((x) => x.t < seconds * 0.25).map((x) => x.r * 1000);
const endR = residuals.filter((x) => x.t > seconds * 0.75).map((x) => x.r * 1000);
const startMs = median(startR);
const endMs = median(endR);
const driftMs = endMs - startMs;
const fitted = residuals.length / onsets.length;
const bpm = 60 / period;

const out = {
  file: basename(path),
  seconds: Number(seconds.toFixed(3)),
  bpm: Number(bpm.toFixed(3)),
  period: Number(period.toFixed(5)),
  offset: Number(offset.toFixed(4)),
  coherence: Number(best.c.toFixed(3)),
  onsets: onsets.length,
  onGrid: Number(fitted.toFixed(2)),
  residualStartMs: Number(startMs.toFixed(1)),
  residualEndMs: Number(endMs.toFixed(1)),
  driftMs: Number(driftMs.toFixed(1)),
};
writeFileSync(`${path}.beats.json`, `${JSON.stringify(out, null, 2)}\n`);

console.log(`${basename(path)}  ${seconds.toFixed(1)} s, ${onsets.length} kick onsets, ${(fitted * 100).toFixed(0)}% on the grid`);
console.log(`  bpm ${out.bpm}  period ${out.period} s  first beat at ${out.offset} s   (promo.json: "bpm": ${out.bpm}, "offset": ${out.offset})`);
console.log(`  grid vs onsets: start ${out.residualStartMs} ms, end ${out.residualEndMs} ms, drift ${out.driftMs} ms`);
const half = scores.filter((s) => Math.abs(s.P - period * 2) / (period * 2) < 0.01).reduce((a, s) => Math.max(a, s.c), 0);
const dbl = scores.filter((s) => Math.abs(s.P - period / 2) / (period / 2) < 0.01).reduce((a, s) => Math.max(a, s.c), 0);
if (half > best.c * 0.85) console.log(`  ! a ${(bpm / 2).toFixed(1)} BPM grid fits almost as well: if the track feels slower, pass --hint ${(bpm / 2).toFixed(0)}`);
if (dbl > best.c * 0.85) console.log(`  ! a ${(bpm * 2).toFixed(1)} BPM grid fits almost as well: if the track feels faster, pass --hint ${(bpm * 2).toFixed(0)}`);
let bad = 0;
if (Math.abs(driftMs) > 25) {
  console.log(`  ✖ the grid drifts ${driftMs.toFixed(0)} ms between the start and the end of the track: do not cut to it.`);
  bad++;
}
if (Math.abs(startMs) > 30 || Math.abs(endMs) > 30) {
  console.log(`  ! the grid is ${Math.max(Math.abs(startMs), Math.abs(endMs)).toFixed(0)} ms from the onsets at one end: listen before trusting it`);
}
if (fitted < 0.6) console.log(`  ! only ${(fitted * 100).toFixed(0)}% of onsets sit on the grid: the track may be rubato, swung or built on a clap`);
const sibling = path.replace(/\.[^.]+$/, "-beats.json");
if (existsSync(sibling)) {
  try {
    const t = JSON.parse(readFileSync(sibling, "utf8")).tempo;
    if (t) console.log(`  note: ${basename(sibling)} says tempo ${Number(t).toFixed(2)}; measured ${bpm.toFixed(2)} (${(((t - bpm) / bpm) * 100).toFixed(1)}%). A tracker's tempo is not the grid.`);
  } catch {}
}
if (bad) process.exit(1);
