/**
 * `bun run dev|still|render|cover <id>`: Remotion on one video's own entry.
 *
 *   dev <id>                         Studio on src/videos/<id>/entry.tsx
 *   still <id> [--frame=N] [--safe]  out/<id>/still-<N>.png (--safe draws the safe zones)
 *   render <id>                      out/<id>/<id>.mp4
 *   cover <id> [--safe]              out/<id>/<id>-cover.png + .jpg (--safe → out/<id>/cover-safe.png)
 *
 * Every video registers the composition ids `Video` and `Cover`.
 */
import {existsSync, readFileSync, statSync} from "node:fs";
import {join} from "node:path";
import {FPS} from "../src/shared/theme";
import type {Voice} from "../src/shared/timings";
import {loadNarration, voiceHash} from "./lib/narration";
import {die, ensureDir, flag, isVoiceless, outDir, p, videoDir} from "./lib/paths";
import {promoSeconds, type Promo} from "../src/shared/promo";
import {duration, must, run} from "./lib/proc";

const [mode, id] = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const MODES = ["dev", "still", "render", "cover"];
if (!MODES.includes(mode) || !id) die(`usage: bun run ${MODES.join("|")} <id> [--frame=N] [--safe]`);
const entry = join(videoDir(id), "entry.tsx");
if (!existsSync(entry)) die(`no video "${id}": src/videos/${id}/entry.tsx does not exist`);
const bin = p("node_modules/.bin/remotion");
const relEntry = `src/videos/${id}/entry.tsx`;
const safe = flag("safe") !== undefined;
const MIN = 60_000;

// voice.json sanity: estimated or stale timing renders silently wrong
const voicePath = join(videoDir(id), "voice.json");
let voice: Voice | undefined;
if (existsSync(voicePath) && existsSync(join(videoDir(id), "narration.json"))) {
  voice = JSON.parse(readFileSync(voicePath, "utf8")) as Voice;
  const n = loadNarration(id);
  if (voice.estimated) {
    const msg = `voice.json is an estimate (no audio). Run \`bun run tts ${id}\` first.`;
    if (mode === "render" && flag("allow-estimated") === undefined) die(`${msg} (--allow-estimated to render anyway)`);
    console.warn(`! ${msg}`);
  } else if (voice.hash !== voiceHash(n)) {
    console.warn(`! narration.json changed since the last TTS: timing is stale. Run \`bun run tts ${id}\`.`);
  }
  if (voice.audio && !existsSync(p("public", voice.audio))) {
    die(`voice.json points at public/${voice.audio}, which does not exist. Run \`bun run tts ${id} --force\`.`);
  }
}

const remotion = async (args: string[], timeoutMs: number) => {
  const r = await run(bin, args, {inherit: true, timeoutMs});
  if (r.timedOut) die(`remotion ${args[0]} timed out after ${timeoutMs / MIN} min`);
  if (r.code !== 0) die(`remotion ${args[0]} exited ${r.code}`);
};
const mustExist = (file: string, since: number) => {
  if (!existsSync(file) || statSync(file).mtimeMs < since || statSync(file).size === 0) {
    die(`${file} was not written (exit 0 is not proof). Re-run the renderer directly on a few frames to see the error.`);
  }
};

const out = ensureDir(outDir(id));
const started = Date.now() - 1000;
const props = JSON.stringify({safe});

if (mode === "dev") {
  const r = await run(bin, ["studio", relEntry], {inherit: true, timeoutMs: 24 * 60 * MIN});
  process.exit(r.code);
}

if (mode === "still") {
  const f = flag("frame");
  const frame = typeof f === "string" ? Number(f) : 0;
  if (!Number.isInteger(frame) || frame < 0) die(`--frame must be a frame number, got "${f}"`);
  const file = join(out, `still-${frame}.png`);
  await remotion(["still", relEntry, "Video", file, `--frame=${frame}`, `--props=${props}`], 10 * MIN);
  mustExist(file, started);
  console.log(`+ out/${id}/still-${frame}.png${safe ? " (safe-zone overlay on)" : ""}. Open it and look (§7).`);
}

if (mode === "render") {
  const file = join(out, `${id}.mp4`);
  await remotion(["render", relEntry, "Video", file, "--codec=h264", `--props=${props}`], 90 * MIN);
  mustExist(file, started);
  const got = await duration(file);
  if (isVoiceless(id)) {
    const want = promoSeconds(JSON.parse(readFileSync(join(videoDir(id), "promo.json"), "utf8")) as Promo);
    console.log(`+ out/${id}/${id}.mp4  ${got.toFixed(2)} s (promo.json ≈ ${want.toFixed(2)} s)`);
    if (Math.abs(got - want) > 0.25) console.warn(`! duration differs from promo.json by ${(got - want).toFixed(2)} s`);
  } else {
    const n = loadNarration(id);
    const want = voice ? Math.ceil((voice.duration + n.outroHold) * FPS) / FPS : NaN;
    console.log(`+ out/${id}/${id}.mp4  ${got.toFixed(2)} s${voice ? ` (voice ${voice.duration.toFixed(2)} s + hold ${n.outroHold} s ≈ ${want.toFixed(2)} s)` : ""}`);
    if (voice && Math.abs(got - want) > 0.25) console.warn(`! duration differs from voice + outro hold by ${(got - want).toFixed(2)} s`);
  }
  console.log(`  Next: pull frames from the mp4 and look, then \`bun run normalize ${id}\`.`);
}

if (mode === "cover") {
  const png = join(out, safe ? "cover-safe.png" : `${id}-cover.png`);
  await remotion(["still", relEntry, "Cover", png, `--props=${props}`], 10 * MIN);
  mustExist(png, started);
  if (safe) {
    console.log(`+ out/${id}/cover-safe.png (overlay on, not for upload)`);
  } else {
    const jpg = join(out, `${id}-cover.jpg`);
    // -q:v 2 ≈ JPEG quality 92; 4:4:4 keeps text edges clean
    await must("ffmpeg", ["-v", "error", "-y", "-i", png, "-pix_fmt", "yuvj444p", "-q:v", "2", jpg], {timeoutMs: 60_000});
    console.log(`+ out/${id}/${id}-cover.png and .jpg. Check it at 200 px wide (sk-handoff, §10).`);
  }
}
