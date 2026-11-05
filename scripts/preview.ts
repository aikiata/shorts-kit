/**
 * `bun run preview [--port N] [--lan]`: a local, read-only dashboard.
 * UI: scripts/preview/ (React + Tailwind v4, Untitled UI free components), bundled in memory at start.
 *
 * Every status shown is inferred from files on disk, in the order of the
 * sk-pipeline step table. The dashboard never renders, encodes or uploads;
 * the only thing it runs is `bun run lint <id>` when you press the button,
 * and `ffprobe` on the upload file. The user uploads by hand.
 *
 *   127.0.0.1:7788 by default, no token (only this machine can reach it).
 *   --lan binds 0.0.0.0 and REQUIRES a token: random per run unless
 *   PREVIEW_TOKEN is set. The URL printed at start carries it as `?t=`;
 *   the first page load turns it into a cookie. No token → 401.
 *
 * Range requests are not an optimisation: without them a browser cannot seek
 * in an mp4, and Safari will not play it at all.
 */
import {existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync, type Stats} from "node:fs";
import {join, resolve, sep} from "node:path";
import {randomBytes, timingSafeEqual} from "node:crypto";

const REPO = resolve(import.meta.dir, "..");
const UI = join(REPO, "scripts", "preview");
const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ── args ──────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const argVal = (name: string): string | true | undefined => {
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === `--${name}`) return argv[i + 1] && !argv[i + 1].startsWith("-") ? argv[i + 1] : true;
    if (a.startsWith(`--${name}=`)) return a.slice(name.length + 3);
  }
  return undefined;
};
const LAN = argVal("lan") !== undefined;
const portArg = argVal("port");
const PORT = Number(typeof portArg === "string" ? portArg : (process.env.PREVIEW_PORT ?? 7788));
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  console.error(`✖ --port must be 1–65535, got ${portArg}`);
  process.exit(1);
}
const HOST = LAN ? "0.0.0.0" : "127.0.0.1";
const TOKEN = LAN ? (process.env.PREVIEW_TOKEN || randomBytes(12).toString("base64url")) : null;
const COOKIE = "sk_preview";
// --root <dir>: read another project tree with the same layout (used to test
// the dashboard against a fixture without touching this repo's out/).
const rootArg = argVal("root");
const ROOT = typeof rootArg === "string" ? resolve(rootArg) : REPO;
if (!existsSync(join(ROOT, "src", "videos"))) {
  console.error(`✖ ${ROOT} has no src/videos/`);
  process.exit(1);
}
const ROOT_REAL = realpathSync(ROOT);
const CACHE_DIR = join(ROOT, ".cache", "preview");

// ── small helpers ─────────────────────────────────────────────────────────
const stat = (f: string): Stats | null => {
  try {
    return statSync(f);
  } catch {
    return null;
  }
};
const isFile = (f: string) => stat(f)?.isFile() ?? false;
const readText = (f: string): string | null => {
  try {
    return readFileSync(f, "utf8");
  } catch {
    return null;
  }
};
const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "");

/** JSON read cached by (mtime, size): status is polled every 5 s. */
const jsonCache = new Map<string, {key: string; value: unknown; error?: string}>();
const readJson = <T>(f: string): {value: T | null; error?: string} => {
  const st = stat(f);
  if (!st) return {value: null};
  const key = `${st.mtimeMs}:${st.size}`;
  const hit = jsonCache.get(f);
  if (hit && hit.key === key) return {value: hit.value as T, error: hit.error};
  let value: unknown = null;
  let error: string | undefined;
  try {
    value = JSON.parse(readFileSync(f, "utf8"));
  } catch (e) {
    error = (e as Error).message;
  }
  jsonCache.set(f, {key, value, error});
  return {value: value as T, error};
};

/** Every subprocess gets a hard timeout. */
const runCmd = async (cmd: string[], timeoutMs: number) => {
  const proc = Bun.spawn(cmd, {cwd: ROOT, stdout: "pipe", stderr: "pipe", stdin: "ignore", env: {...process.env, FORCE_COLOR: "0", NO_COLOR: "1"}});
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    proc.kill("SIGKILL");
  }, timeoutMs);
  const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()]);
  const code = await proc.exited;
  clearTimeout(timer);
  return {code: timedOut ? 124 : code, stdout, stderr, timedOut};
};

// hash of narration → must equal voice.json's hash. Reuse the one tts writes;
// if it cannot be loaded, TTS freshness is "unknown" rather than a guess.
type HashFn = (n: any) => string;
let voiceHash: HashFn | null = null;
let voiceHashError = "";
try {
  const mod = await import("./lib/narration");
  if (typeof mod.voiceHash === "function" && typeof mod.loadNarration === "function") {
    const load = mod.loadNarration as (id: string) => any;
    const h = mod.voiceHash as HashFn;
    // loadNarration applies the defaults tts hashes with; it reads this repo.
    // Under --root, apply the same defaults to the fixture's narration.json.
    voiceHash =
      ROOT === REPO
        ? (id: string) => h(load(id))
        : (id: string) => {
            const raw = JSON.parse(readFileSync(join(ROOT, "src", "videos", id, "narration.json"), "utf8"));
            return h({...raw, pause: {...(mod.DEFAULT_PAUSE ?? {}), ...(raw.pause ?? {})}, voice: {tempo: 1, ...(raw.voice ?? {engine: "say"})}, scenes: raw.scenes ?? []});
          };
  } else voiceHashError = "scripts/lib/narration.ts has no voiceHash/loadNarration export";
} catch (e) {
  voiceHashError = `cannot load scripts/lib/narration.ts: ${(e as Error).message}`;
}

// ── persisted caches (lint results, ffprobe) under .cache/preview ─────────
const loadCache = <T>(name: string): Record<string, T> => {
  try {
    return JSON.parse(readFileSync(join(CACHE_DIR, name), "utf8"));
  } catch {
    return {};
  }
};
const saveCache = (name: string, data: unknown) => {
  try {
    mkdirSync(CACHE_DIR, {recursive: true});
    writeFileSync(join(CACHE_DIR, name), JSON.stringify(data, null, 1));
  } catch {
    /* a cache that cannot be written is only slower */
  }
};

type LintResult = {at: number; code: number; timedOut: boolean; errors: number | null; warnings: number | null; output: string; ms: number};
const lintCache = loadCache<LintResult>("lint.json");
const lintRunning = new Map<string, Promise<LintResult>>();

const runLint = (id: string): Promise<LintResult> => {
  const running = lintRunning.get(id);
  if (running) return running;
  const job = (async () => {
    const t0 = Date.now();
    const r = await runCmd([process.execPath, "run", "lint", id], 60_000);
    const output = stripAnsi(`${r.stdout}${r.stderr ? `\n${r.stderr}` : ""}`).trim();
    const m = output.match(/lint \S+: (\d+) errors?, (\d+) warnings?/);
    const res: LintResult = {
      at: Date.now(),
      code: r.code,
      timedOut: r.timedOut,
      errors: m ? Number(m[1]) : null,
      warnings: m ? Number(m[2]) : null,
      output: r.timedOut ? `${output}\n\n✖ lint timed out after 60 s and was killed` : output,
      ms: Date.now() - t0,
    };
    lintCache[id] = res;
    saveCache("lint.json", lintCache);
    return res;
  })().finally(() => lintRunning.delete(id));
  lintRunning.set(id, job);
  return job;
};

// ── ffprobe summary of the upload file, cached by (path, mtime, size) ─────
type Check = {name: string; ok: boolean; value: string; want: string};
type ProbeSummary = {file: string; size: number; mtime: number; error?: string; video?: Record<string, unknown>; audio?: Record<string, unknown>; faststart: boolean | null; duration: number | null; checks: Check[]};
const probeCache = loadCache<ProbeSummary>("probe.json");

/** Walk the top-level MP4 boxes: faststart means `moov` comes before `mdat`. */
const moovFirst = async (file: string): Promise<boolean | null> => {
  const f = Bun.file(file);
  const size = f.size;
  let off = 0;
  for (let i = 0; i < 64 && off + 8 <= size; i++) {
    const head = new DataView(await f.slice(off, off + 16).arrayBuffer());
    let boxSize = head.getUint32(0);
    const type = String.fromCharCode(head.getUint8(4), head.getUint8(5), head.getUint8(6), head.getUint8(7));
    if (type === "moov") return true;
    if (type === "mdat") return false;
    if (boxSize === 1) boxSize = Number(head.getBigUint64(8));
    else if (boxSize === 0) return null;
    if (boxSize < 8) return null;
    off += boxSize;
  }
  return null;
};

const probe = async (file: string, rel: string): Promise<ProbeSummary> => {
  const st = stat(file)!;
  const key = `${rel}:${st.mtimeMs}:${st.size}`;
  if (probeCache[key]) return probeCache[key];
  const base = {file: rel, size: st.size, mtime: st.mtimeMs};
  const r = await runCmd(["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", file], 20_000);
  if (r.code !== 0) {
    // do not cache failures: the file may still be being written
    return {...base, error: r.timedOut ? "ffprobe timed out after 20 s" : `ffprobe exited ${r.code}: ${r.stderr.slice(-500)}`, faststart: null, duration: null, checks: []};
  }
  let j: {format?: Record<string, any>; streams?: Record<string, any>[]};
  try {
    j = JSON.parse(r.stdout);
  } catch {
    return {...base, error: "ffprobe output is not JSON", faststart: null, duration: null, checks: []};
  }
  const v = j.streams?.find((s) => s.codec_type === "video");
  const a = j.streams?.find((s) => s.codec_type === "audio");
  const faststart = await moovFirst(file).catch(() => null);
  const video = v && {
    codec: v.codec_name, profile: v.profile, width: v.width, height: v.height, pix_fmt: v.pix_fmt,
    color_range: v.color_range ?? "unset", color_primaries: v.color_primaries ?? "unset",
    color_transfer: v.color_transfer ?? "unset", color_space: v.color_space ?? "unset",
    fps: v.r_frame_rate, frames: v.nb_frames ? Number(v.nb_frames) : null,
    bitrate: v.bit_rate ? Number(v.bit_rate) : null,
  };
  const audio = a && {codec: a.codec_name, sample_rate: Number(a.sample_rate), channels: a.channels, bitrate: a.bit_rate ? Number(a.bit_rate) : null};
  const ck = (name: string, value: unknown, want: string, ok: boolean): Check => ({name, ok, value: String(value ?? "missing"), want});
  const checks: Check[] = [
    ck("video codec", v?.codec_name, "h264", v?.codec_name === "h264"),
    ck("size", v ? `${v.width}×${v.height}` : null, "1080×1920", v?.width === 1080 && v?.height === 1920),
    ck("pix_fmt", v?.pix_fmt, "yuv420p", v?.pix_fmt === "yuv420p"),
    ck("color range", v?.color_range, "tv", v?.color_range === "tv"),
    ck("primaries", v?.color_primaries, "bt709", v?.color_primaries === "bt709"),
    ck("transfer", v?.color_transfer, "bt709", v?.color_transfer === "bt709"),
    ck("matrix", v?.color_space, "bt709", v?.color_space === "bt709"),
    ck("audio codec", a?.codec_name, "aac", a?.codec_name === "aac"),
    ck("audio rate", a?.sample_rate, "48000", Number(a?.sample_rate) === 48000),
    ck("faststart", faststart === null ? "unknown" : faststart ? "moov before mdat" : "moov after mdat", "moov before mdat", faststart === true),
  ];
  const out: ProbeSummary = {...base, video, audio, faststart, duration: j.format?.duration ? Number(j.format.duration) : null, checks};
  probeCache[key] = out;
  // keep the cache small: one entry per file path
  for (const k of Object.keys(probeCache)) if (k.startsWith(`${rel}:`) && k !== key) delete probeCache[k];
  saveCache("probe.json", probeCache);
  return out;
};

// ── status inferred from disk ─────────────────────────────────────────────
type Status = "done" | "todo" | "warn" | "fail" | "unknown";
type Step = {key: string; n: number; label: string; status: Status; detail: string; command: string; skill: string};

type NarrationLine = {text?: string; fact?: string | string[]};
type Narration = {id?: string; flow?: string; voice?: {engine?: string}; scenes?: {id: string; lines?: NarrationLine[]}[]};
type Voice = {hash?: string; estimated?: boolean; engine?: string; duration?: number; audio?: string | null; words?: unknown[]; lines?: unknown[]; scenes?: {id: string; start: number; end: number}[]};
type Fact = {id: string; status?: string; caveat?: string};

const out = (id: string, f = "") => join(ROOT, "out", id, f);
const rel = (abs: string) => abs.slice(ROOT.length + 1).split(sep).join("/");
const fileInfo = (abs: string) => {
  const st = stat(abs);
  return st?.isFile() ? {path: rel(abs), size: st.size, mtime: st.mtimeMs} : null;
};

const listVideos = () => {
  let names: string[] = [];
  try {
    names = readdirSync(join(ROOT, "src", "videos"), {withFileTypes: true})
      .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))
      .map((d) => d.name);
  } catch {
    /* no videos yet */
  }
  // Newest first, by when the video folder was created; the component gallery goes last.
  const born = (id: string) => {
    const st = stat(join(ROOT, "src", "videos", id));
    return st ? st.birthtimeMs || st.ctimeMs : 0;
  };
  return names.sort((a, b) => (a === "gallery" ? 1 : b === "gallery" ? -1 : born(b) - born(a) || a.localeCompare(b)));
};

const stills = (id: string) => {
  try {
    return readdirSync(out(id))
      .filter((f) => /^still-.*\.png$/.test(f))
      .map((f) => fileInfo(out(id, f))!)
      .filter(Boolean)
      .sort((a, b) => a.path.localeCompare(b.path, undefined, {numeric: true}));
  } catch {
    return [];
  }
};

const factIds = (n: Narration) => {
  const ids = new Set<string>();
  for (const s of n.scenes ?? []) for (const l of s.lines ?? []) {
    const f = l.fact;
    for (const x of Array.isArray(f) ? f : [f]) if (typeof x === "string" && x.trim()) ids.add(x.trim());
  }
  return [...ids];
};

const STEP_META: Record<string, {n: number; label: string; skill: string; command: (id: string) => string}> = {
  brief: {n: 4, label: "Brief", skill: "sk-brief", command: (id) => `cp briefs/_template.md briefs/${id}.md   # then fill it in (sk-brief)`},
  facts: {n: 2, label: "Facts", skill: "sk-facts", command: () => "bun run facts"},
  narration: {n: 5, label: "Narration", skill: "sk-narration", command: (id) => `edit src/videos/${id}/narration.json   # sk-narration`},
  tts: {n: 6, label: "TTS", skill: "sk-narration", command: (id) => `bun run tts ${id}`},
  lint: {n: 7, label: "Lint", skill: "sk-narration", command: (id) => `bun run lint ${id}`},
  storyboard: {n: 7.5, label: "Storyboard", skill: "sk-scene", command: (id) => `bun run storyboard ${id} --init   # then fill in camera and onScreen, get it approved`},
  scenes: {n: 8, label: "Scenes", skill: "sk-scene", command: (id) => `bun run dev ${id}   # then: bun run check`},
  stills: {n: 9, label: "Stills", skill: "sk-scene", command: (id) => `bun run still ${id} --frame=<n>`},
  render: {n: 10, label: "Render", skill: "sk-render", command: (id) => `bun run render ${id}`},
  cover: {n: 11, label: "Cover", skill: "sk-handoff", command: (id) => `bun run cover ${id}`},
  normalize: {n: 12, label: "Normalize", skill: "sk-render", command: (id) => `bun run normalize ${id}`},
  encode: {n: 13, label: "Encode", skill: "sk-render", command: (id) => `bun run encode ${id}`},
  handoff: {n: 14, label: "Hand-off", skill: "sk-handoff", command: (id) => `write out/${id}/caption.txt and out/${id}/pinned-comment.txt   # sk-handoff`},
};

// ── pipeline steps from docs/pipeline.json ──────────────────────────────
// Built-in steps keep the checks above; steps a channel adds (sk-improve) are
// checked by a simple evidence rule on disk. Missing file: the built-in order.
type PipeStep = {
  key: string;
  n: number;
  label: string;
  skill?: string;
  command?: string;
  check?: "builtin";
  evidence?: {file?: string; glob?: string; json?: string; nonEmpty?: string};
  /** Show the step only for one voice source: "tts" (written script) or "recorded" (§5j). */
  when?: "tts" | "recorded";
};
const loadPipeline = (): PipeStep[] | null => {
  const r = readJson<{steps?: PipeStep[]}>(join(ROOT, "docs", "pipeline.json"));
  return Array.isArray(r.value?.steps) ? r.value!.steps! : null;
};
const globMatch = (pattern: string): string[] => {
  const dirRel = pattern.split("/").slice(0, -1).join("/");
  const name = pattern.split("/").pop() ?? "";
  const re = new RegExp("^" + name.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$");
  try {
    return readdirSync(join(ROOT, dirRel)).filter((f) => re.test(f)).map((f) => `${dirRel}/${f}`);
  } catch {
    return [];
  }
};
const evidenceStatus = (id: string, ev: PipeStep["evidence"]): {status: Status; detail: string} => {
  const fill = (x: string) => x.replaceAll("{id}", id);
  if (!ev) return {status: "unknown", detail: "no evidence rule in docs/pipeline.json"};
  if (ev.file) {
    const f = fileInfo(join(ROOT, fill(ev.file)));
    return f ? (f.size ? {status: "done", detail: fill(ev.file)} : {status: "fail", detail: `${fill(ev.file)} is empty`}) : {status: "todo", detail: `no ${fill(ev.file)}`};
  }
  if (ev.glob) {
    const hits = globMatch(fill(ev.glob));
    return hits.length ? {status: "done", detail: `${hits.length} match ${fill(ev.glob)}`} : {status: "todo", detail: `nothing matches ${fill(ev.glob)}`};
  }
  if (ev.json) {
    const r = readJson<Record<string, unknown>>(join(ROOT, fill(ev.json)));
    if (r.error) return {status: "fail", detail: `${fill(ev.json)}: ${r.error}`};
    if (!r.value) return {status: "todo", detail: `no ${fill(ev.json)}`};
    if (ev.nonEmpty) {
      const v = r.value[ev.nonEmpty];
      const ok = Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== "";
      return ok ? {status: "done", detail: `${fill(ev.json)} has ${ev.nonEmpty}`} : {status: "todo", detail: `${fill(ev.json)}: ${ev.nonEmpty} is empty`};
    }
    return {status: "done", detail: fill(ev.json)};
  }
  return {status: "unknown", detail: "evidence rule has no file, glob or json"};
};
const applyPipeline = (id: string, builtin: Step[], voiceSource: "tts" | "recorded"): Step[] => {
  const pipe = loadPipeline();
  if (!pipe) return [...builtin].sort((a, b) => a.n - b.n);
  const out: Step[] = [];
  for (const p of pipe) {
    if (p.when && p.when !== voiceSource) continue;
    const command = (p.command ?? "").replaceAll("{id}", id);
    if (p.check === "builtin" || (!p.evidence && builtin.some((b) => b.key === p.key))) {
      const b = builtin.find((x) => x.key === p.key);
      if (b) out.push({...b, n: p.n, label: p.label ?? b.label, skill: p.skill ?? b.skill, command: command || b.command});
      continue;
    }
    const e = evidenceStatus(id, p.evidence);
    out.push({key: p.key, n: p.n, label: p.label, status: e.status, detail: e.detail, command, skill: p.skill ?? ""});
  }
  return out.sort((a, b) => a.n - b.n);
};

const videoState = (id: string) => {
  const dir = join(ROOT, "src", "videos", id);
  const narrationPath = join(dir, "narration.json");
  const voicePath = join(dir, "voice.json");
  const nar = readJson<Narration>(narrationPath);
  const voi = readJson<Voice>(voicePath);
  const n = nar.value;
  const voice = voi.value;
  const steps: Step[] = [];
  const add = (key: string, status: Status, detail: string) => {
    const m = STEP_META[key];
    steps.push({key, n: m.n, label: m.label, status, detail, command: m.command(id), skill: m.skill});
  };

  // 1–4 brief (idea + flow live in it)
  add("brief", isFile(join(ROOT, "briefs", `${id}.md`)) ? "done" : "todo", isFile(join(ROOT, "briefs", `${id}.md`)) ? `briefs/${id}.md` : `no briefs/${id}.md`);

  // 2 facts: every fact id cited in narration is verified in the ledger
  if (!n) add("facts", "unknown", "no narration.json to read fact ids from");
  else {
    const ids = factIds(n);
    const ledger = readJson<Fact[]>(join(ROOT, "docs", "facts", "facts.json"));
    if (ledger.error || !Array.isArray(ledger.value)) add("facts", "unknown", `docs/facts/facts.json unreadable${ledger.error ? `: ${ledger.error}` : ""}`);
    else if (!ids.length) add("facts", "warn", "no line cites a fact id");
    else {
      const byId = new Map(ledger.value.map((f) => [f.id, f]));
      const missing = ids.filter((x) => !byId.has(x));
      const bad = ids.filter((x) => byId.has(x) && !["verified", "contested"].includes(byId.get(x)!.status ?? ""));
      const contestedBare = ids.filter((x) => byId.get(x)?.status === "contested" && !byId.get(x)!.caveat);
      const contested = ids.filter((x) => byId.get(x)?.status === "contested" && byId.get(x)!.caveat);
      if (missing.length) add("facts", "todo", `not in ledger: ${missing.join(", ")}`);
      else if (bad.length) add("facts", "todo", `not verified: ${bad.join(", ")}`);
      else if (contestedBare.length) add("facts", "todo", `contested, no caveat: ${contestedBare.join(", ")}`);
      else if (contested.length) add("facts", "warn", `${ids.length} cited; contested with caveat: ${contested.join(", ")}`);
      else add("facts", "done", `${ids.length} cited, all verified`);
    }
  }

  // 5 narration: exists, has lines, no TODO
  if (nar.error) add("narration", "fail", `narration.json is not valid JSON: ${nar.error}`);
  else if (!n) add("narration", "todo", `no src/videos/${id}/narration.json (bun run new ${id} --flow <X>)`);
  else {
    const lines = (n.scenes ?? []).flatMap((s) => s.lines ?? []);
    const todo = lines.filter((l) => /TODO/.test(l.text ?? "")).length;
    if (!lines.length) add("narration", "todo", "no lines yet");
    else if (todo) add("narration", "todo", `${todo} of ${lines.length} lines contain TODO`);
    else add("narration", "done", `${lines.length} lines in ${(n.scenes ?? []).length} scenes`);
  }

  // 6 tts: real (not estimated), hash matches narration
  if (voi.error) add("tts", "fail", `voice.json is not valid JSON: ${voi.error}`);
  else if (!voice) add("tts", "todo", "no voice.json");
  else if (voice.estimated) add("tts", "todo", "voice.json is an estimate (no audio yet)");
  else if (!n) add("tts", "unknown", "no narration.json to compare with");
  else {
    let expect: string | null = null;
    let why = voiceHashError;
    if (voiceHash) {
      try {
        expect = (voiceHash as unknown as (id: string) => string)(id);
      } catch (e) {
        why = `hash failed: ${(e as Error).message}`;
      }
    }
    const audio = voice.audio ? join(ROOT, "public", voice.audio) : null;
    if (expect === null) add("tts", "unknown", `cannot check freshness (${why})`);
    else if (expect !== voice.hash) add("tts", "todo", n.voice?.engine === "recorded" ? "stale: narration changed since the last cut" : "stale: narration changed since the last TTS");
    else if (!audio || !isFile(audio)) add("tts", "warn", `hash ok but audio file missing: public/${voice.audio ?? "?"}`);
    else add("tts", "done", `${voice.engine ?? "?"}, ${(voice.duration ?? 0).toFixed(1)} s`);
  }

  // 7 lint: only on demand; show the cached result, stale if inputs are newer
  const lint = lintCache[id];
  if (lintRunning.has(id)) add("lint", "unknown", "running…");
  else if (!lint) add("lint", "unknown", "not run yet (press Run lint)");
  else {
    const newest = Math.max(stat(narrationPath)?.mtimeMs ?? 0, stat(voicePath)?.mtimeMs ?? 0, stat(join(ROOT, "docs", "facts", "facts.json"))?.mtimeMs ?? 0);
    const counts = lint.errors === null ? `exit ${lint.code}` : `${lint.errors} errors, ${lint.warnings} warnings`;
    if (lint.timedOut) add("lint", "fail", "timed out after 60 s");
    else if (lint.code !== 0) add("lint", newest > lint.at ? "unknown" : "fail", `${counts}${newest > lint.at ? " (stale: inputs changed, re-run)" : ""}`);
    else if (newest > lint.at) add("lint", "unknown", `${counts} (stale: inputs changed, re-run)`);
    else add("lint", lint.warnings ? "warn" : "done", counts);
  }

  // outputs
  const st = stills(id);
  const render = fileInfo(out(id, `${id}.mp4`));
  const loud = fileInfo(out(id, `${id}-loud.mp4`));
  const upload = fileInfo(out(id, `${id}-upload.mp4`));
  const cover = fileInfo(out(id, `${id}-cover.png`)) ?? fileInfo(out(id, `${id}-cover.jpg`));
  const coverJpg = fileInfo(out(id, `${id}-cover.jpg`));
  const caption = fileInfo(out(id, "caption.txt"));
  const pinned = fileInfo(out(id, "pinned-comment.txt"));
  const voiceM = stat(voicePath)?.mtimeMs ?? 0;

  // 7.5 storyboard: planned after the voice, approved before scene code (docs/storyboard.md)
  const sbPath = join(dir, "storyboard.json");
  const sb = readJson<{shots?: {camera?: string; onScreen?: string; status?: string}[]}>(sbPath);
  if (sb.error) add("storyboard", "fail", `storyboard.json is not valid JSON: ${sb.error}`);
  else if (!sb.value) add("storyboard", "todo", "no storyboard.json: plan the shots before building scenes");
  else {
    const shots = sb.value.shots ?? [];
    const todo = shots.filter((x) => /TODO/.test(`${x.camera ?? ""} ${x.onScreen ?? ""}`)).length;
    const planned = shots.filter((x) => x.status === "planned").length;
    if (!shots.length) add("storyboard", "todo", "storyboard.json has no shots");
    else if (todo) add("storyboard", "todo", `${todo} of ${shots.length} shots still TODO`);
    else if (planned) add("storyboard", "warn", `${planned} of ${shots.length} shots waiting for approval`);
    else add("storyboard", "done", `${shots.length} shots, ${shots.filter((x) => x.status === "built").length} built`);
  }

  // 8 scenes: no command proves it; stills or a render are the evidence
  add("scenes", st.length || render ? "done" : "todo", st.length || render ? "inferred from stills/render on disk" : "no stills or render yet");
  add("stills", st.length ? "done" : "todo", st.length ? `${st.length} still${st.length > 1 ? "s" : ""} in out/${id}/` : "no out/<id>/still-*.png");

  const sized = (f: typeof render, what: string, older?: {m: number; name: string}): [Status, string] => {
    if (!f) return ["todo", `no ${what}`];
    if (!f.size) return ["fail", `${what} is empty (0 bytes)`];
    if (older && older.m > f.mtime) return ["warn", `older than ${older.name}: re-run`];
    return ["done", `${(f.size / 1e6).toFixed(1)} MB`];
  };
  add("render", ...sized(render, `${id}.mp4`, {m: voiceM, name: "voice.json"}));
  add("cover", ...(cover ? (["done", cover.path.split("/").pop()!] as [Status, string]) : (["todo", "no cover png/jpg"] as [Status, string])));
  add("normalize", ...sized(loud, `${id}-loud.mp4`, render ? {m: render.mtime, name: `${id}.mp4`} : undefined));
  add("encode", ...sized(upload, `${id}-upload.mp4`, loud ? {m: loud.mtime, name: `${id}-loud.mp4`} : render ? {m: render.mtime, name: `${id}.mp4`} : undefined));
  if (caption && pinned) add("handoff", caption.size && pinned.size ? "done" : "warn", caption.size && pinned.size ? "caption.txt + pinned-comment.txt" : "a hand-off file is empty");
  else if (caption || pinned) add("handoff", "warn", `missing ${caption ? "pinned-comment.txt" : "caption.txt"}`);
  else add("handoff", "todo", "no caption.txt / pinned-comment.txt");

  // display order = the sk-pipeline table (facts before brief)
  const finalSteps = applyPipeline(id, steps, n?.voice?.engine === "recorded" ? "recorded" : "tts");
  steps.length = 0;
  steps.push(...finalSteps);
  const nextStep = steps.find((s) => s.status === "todo" || s.status === "fail" || s.status === "unknown");
  const next = nextStep
    ? {key: nextStep.key, label: nextStep.label, command: nextStep.command, skill: nextStep.skill, detail: nextStep.detail}
    : {key: "upload", label: "Upload by hand", command: `open out/${id}/`, skill: "sk-handoff", detail: "all hand-off files are on disk; the kit never uploads"};

  return {
    id,
    kind: "video" as const,
    flow: n?.flow ?? null,
    steps,
    next,
    files: {render, loud, upload, cover, coverJpg, caption, pinned, stills: st, voiceJson: fileInfo(voicePath), narrationJson: fileInfo(narrationPath), storyboard: fileInfo(join(dir, "storyboard.json")), brief: fileInfo(join(ROOT, "briefs", `${id}.md`))},
    voice: voice
      ? {
          engine: voice.engine ?? null,
          estimated: !!voice.estimated,
          duration: typeof voice.duration === "number" ? voice.duration : null,
          words: Array.isArray(voice.words) ? voice.words.length : null,
          lines: Array.isArray(voice.lines) ? voice.lines.length : null,
          scenes: Array.isArray(voice.scenes) ? voice.scenes.map((s) => ({id: s.id, start: s.start, end: s.end})) : [],
          audio: voice.audio && isFile(join(ROOT, "public", voice.audio)) ? fileInfo(join(ROOT, "public", voice.audio)) : null,
        }
      : null,
    lint: lint ?? null,
    lintRunning: lintRunning.has(id),
  };
};

const status = () => {
  const videos = listVideos().map((id) => {
    if (id === "gallery") return {id, kind: "gallery" as const, label: "component gallery", command: "bun run dev gallery"};
    const s = videoState(id);
    const st = stat(join(ROOT, "src", "videos", id));
    return {id, kind: s.kind, flow: s.flow, steps: s.steps, next: s.next, created: st ? st.birthtimeMs || st.ctimeMs : 0};
  });
  return {root: ROOT, at: Date.now(), lan: LAN, videos};
};

// ── safe file serving ─────────────────────────────────────────────────────
const ALLOWED = [/^out\/[^/]+\/[^/]+$/, /^public\/audio\/.+$/, /^public\/sfx\/.+$/, /^briefs\/[^/]+\.md$/, /^src\/videos\/[^/]+\/(narration|voice|storyboard)\.json$/, /^docs\/facts\/(facts|sources)\.json$/];
const BASES = ["out", "public/audio", "public/sfx", "briefs", "src/videos", "docs/facts"];

/** Resolve a request path to a file under an allowed base, or null. */
const safePath = (raw: string): string | null => {
  let r: string;
  try {
    r = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (r.includes("\0") || r.includes("\\")) return null;
  const parts = r.split("/").filter(Boolean);
  if (parts.some((p) => p === ".." || p === "." || p.startsWith("."))) return null;
  r = parts.join("/");
  if (!ALLOWED.some((re) => re.test(r))) return null;
  const abs = resolve(ROOT, r);
  if (!abs.startsWith(ROOT + sep)) return null;
  // symlinks must not lead out of the allowed bases either
  let real: string;
  try {
    real = realpathSync(abs);
  } catch {
    return null;
  }
  if (!BASES.some((b) => real.startsWith(join(ROOT_REAL, b) + sep))) return null;
  return stat(real)?.isFile() ? real : null;
};

const MIME: Record<string, string> = {
  mp4: "video/mp4", mp3: "audio/mpeg", wav: "audio/wav", aiff: "audio/aiff", m4a: "audio/mp4", ogg: "audio/ogg",
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", json: "application/json; charset=utf-8",
  txt: "text/plain; charset=utf-8", md: "text/plain; charset=utf-8", srt: "text/plain; charset=utf-8",
  html: "text/html; charset=utf-8", js: "text/javascript; charset=utf-8", css: "text/css; charset=utf-8", svg: "image/svg+xml",
};
const mimeOf = (f: string) => MIME[f.split(".").pop()!.toLowerCase()] ?? "application/octet-stream";
const SECURITY = {"X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "X-Frame-Options": "DENY"};

const serveFile = (abs: string, req: Request, extra: Record<string, string> = {}) => {
  const file = Bun.file(abs);
  const size = file.size;
  const headers: Record<string, string> = {...SECURITY, "Content-Type": mimeOf(abs), "Accept-Ranges": "bytes", "Cache-Control": "no-cache", "Last-Modified": new Date(file.lastModified).toUTCString(), ...extra};
  const range = req.headers.get("range");
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (!m || (m[1] === "" && m[2] === "")) return new Response(null, {status: 416, headers: {...headers, "Content-Range": `bytes */${size}`}});
    let start: number;
    let end: number;
    if (m[1] === "") {
      // suffix range: last N bytes
      start = Math.max(0, size - Number(m[2]));
      end = size - 1;
    } else {
      start = Number(m[1]);
      end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
    }
    if (start >= size || start > end) return new Response(null, {status: 416, headers: {...headers, "Content-Range": `bytes */${size}`}});
    return new Response(req.method === "HEAD" ? null : file.slice(start, end + 1), {
      status: 206,
      headers: {...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1)},
    });
  }
  return new Response(req.method === "HEAD" ? null : file, {status: 200, headers: {...headers, "Content-Length": String(size)}});
};

// ── auth ──────────────────────────────────────────────────────────────────
const sameToken = (a: string | null | undefined) => {
  if (!TOKEN || !a) return false;
  const x = Buffer.from(a);
  const y = Buffer.from(TOKEN);
  return x.length === y.length && timingSafeEqual(x, y);
};
const tokenOf = (req: Request, url: URL) => {
  const q = url.searchParams.get("t");
  if (q) return {token: q, via: "query"};
  const h = req.headers.get("x-preview-token");
  if (h) return {token: h, via: "header"};
  const c = new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`).exec(req.headers.get("cookie") ?? "");
  return {token: c ? decodeURIComponent(c[1]) : null, via: "cookie"};
};

/** Local mode: refuse foreign Host headers (DNS rebinding). */
const LOCAL_HOSTS = new Set([`127.0.0.1:${PORT}`, `localhost:${PORT}`, `[::1]:${PORT}`]);

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {status, headers: {...SECURITY, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store"}});
const text = (body: string, status: number) => new Response(`${body}\n`, {status, headers: {...SECURITY, "Content-Type": "text/plain; charset=utf-8"}});

const validVideo = (id: string) => ID_RE.test(id) && id !== "gallery" && stat(join(ROOT, "src", "videos", id))?.isDirectory();

// ── UI bundle: React + Tailwind v4 (Untitled UI components), built in memory
// at start-up with Bun's bundler. Not `routes: {"/": html}`: routes bypass
// `fetch`, so the page and its chunks would skip the --lan token check.
const UI_ASSETS = new Map<string, {body: ArrayBuffer; type: string}>();
{
  const t0 = Date.now();
  const {default: tailwind} = await import("bun-plugin-tailwind");
  const built = await Bun.build({entrypoints: [join(UI, "index.html")], plugins: [tailwind], minify: true, target: "browser", sourcemap: "none"});
  if (!built.success) {
    console.error("✖ preview UI failed to build:");
    for (const l of built.logs) console.error(String(l));
    process.exit(1);
  }
  for (const o of built.outputs) {
    const name = o.path.replace(/^\.\//, "");
    UI_ASSETS.set(`/${name}`, {body: await o.arrayBuffer(), type: o.type});
  }
  if (!UI_ASSETS.has("/index.html")) {
    console.error("✖ preview UI build produced no index.html");
    process.exit(1);
  }
  UI_ASSETS.set("/", UI_ASSETS.get("/index.html")!);
  console.log(`  UI built in ${Date.now() - t0} ms (${built.outputs.length} files)`);
}

// ── frames from the render, for storyboard thumbnails ────────────────────
// A still can be older than the render; a frame cut from the mp4 is what the
// viewer will see. Cached by mp4 mtime and time, at most 3 ffmpeg runs at once.
const FRAME_CACHE = join(ROOT, ".cache", "preview-frames");
let framesRunning = 0;
const frameQueue: (() => void)[] = [];
const withFrameSlot = async <T,>(fn: () => Promise<T>): Promise<T> => {
  if (framesRunning >= 3) await new Promise<void>((r) => frameQueue.push(r));
  framesRunning++;
  try {
    return await fn();
  } finally {
    framesRunning--;
    frameQueue.shift()?.();
  }
};
const renderFrame = async (id: string, t: number): Promise<Response> => {
  const f = videoState(id).files;
  const mp4 = f.upload ?? f.loud ?? f.render;
  if (!mp4) return text("404 no render for this video", 404);
  const tt = Math.max(0, Math.round(t * 10) / 10);
  const dir = join(FRAME_CACHE, id);
  const file = join(dir, `${Math.round(mp4.mtime)}-${tt.toFixed(1)}.jpg`);
  if (!existsSync(file)) {
    mkdirSync(dir, {recursive: true});
    const r = await withFrameSlot(() => runCmd(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", String(tt), "-i", join(ROOT, mp4.path), "-frames:v", "1", "-vf", "scale=270:-2", "-q:v", "4", file], 20_000));
    if (r.code !== 0 || !existsSync(file)) return text(`500 ffmpeg failed: ${r.timedOut ? "timeout" : r.stderr.slice(0, 200)}`, 500);
  }
  return new Response(Bun.file(file), {headers: {...SECURITY, "Content-Type": "image/jpeg", "Cache-Control": "max-age=3600"}});
};

const handle = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  let setCookie: string | null = null;
  if (LAN) {
    const {token, via} = tokenOf(req, url);
    if (!sameToken(token)) return text("401 unauthorized: open the URL with ?t=<token> printed in the terminal", 401);
    if (via === "query") setCookie = `${COOKIE}=${encodeURIComponent(TOKEN!)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`;
  } else if (!LOCAL_HOSTS.has(req.headers.get("host") ?? "")) {
    return text("403 forbidden host", 403);
  }
  const res = await route(req, url);
  if (setCookie) res.headers.append("Set-Cookie", setCookie);
  return res;
};

const route = async (req: Request, url: URL): Promise<Response> => {
  const path = url.pathname;
  const method = req.method;

  const asset = (method === "GET" || method === "HEAD") && UI_ASSETS.get(path);
  if (asset) {
    const csp = "default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'";
    return new Response(method === "HEAD" ? null : asset.body, {headers: {...SECURITY, "Content-Type": asset.type, "Cache-Control": path.endsWith(".html") || path === "/" ? "no-store" : "no-cache", "Content-Security-Policy": csp}});
  }
  if (method === "GET" && path === "/api/status") return json(status());
  {
    const m = /^\/api\/frame\/([a-z0-9-]+)$/.exec(path);
    if (method === "GET" && m) {
      if (!validVideo(m[1])) return text("404 no such video", 404);
      const t = Number(url.searchParams.get("at"));
      if (!Number.isFinite(t)) return text("400 at must be a number of seconds", 400);
      return renderFrame(m[1], t);
    }
  }

  let m = /^\/api\/video\/([^/]+)$/.exec(path);
  if (method === "GET" && m) {
    const id = decodeURIComponent(m[1]);
    if (!validVideo(id)) return json({error: `no video "${id}"`}, 404);
    return json(videoState(id));
  }

  m = /^\/api\/lint\/([^/]+)$/.exec(path);
  if (m) {
    const id = decodeURIComponent(m[1]);
    if (!validVideo(id)) return json({error: `no video "${id}"`}, 404);
    if (method === "GET") return json({lint: lintCache[id] ?? null, running: lintRunning.has(id)});
    if (method !== "POST") return json({error: "method not allowed"}, 405);
    // a custom header forces a CORS preflight, which this server never answers:
    // another site open in the browser cannot trigger lint runs
    if (req.headers.get("x-sk-preview") !== "1") return json({error: "missing x-sk-preview header"}, 400);
    if (!isFile(join(ROOT, "src", "videos", id, "narration.json"))) return json({error: "no narration.json to lint"}, 400);
    return json({lint: await runLint(id), running: false});
  }

  m = /^\/api\/probe\/([^/]+)$/.exec(path);
  if (method === "GET" && m) {
    const id = decodeURIComponent(m[1]);
    if (!validVideo(id)) return json({error: `no video "${id}"`}, 404);
    const which = url.searchParams.get("file") ?? "upload";
    const name = which === "render" ? `${id}.mp4` : which === "loud" ? `${id}-loud.mp4` : `${id}-upload.mp4`;
    const abs = out(id, name);
    if (!isFile(abs)) return json({probe: null, message: `no out/${id}/${name} yet (bun run encode ${id})`});
    return json({probe: await probe(abs, rel(abs))});
  }

  m = /^\/api\/text\/([^/]+)$/.exec(path);
  if (method === "GET" && m) {
    const id = decodeURIComponent(m[1]);
    if (!validVideo(id)) return json({error: `no video "${id}"`}, 404);
    return json({caption: readText(out(id, "caption.txt")), pinned: readText(out(id, "pinned-comment.txt"))});
  }

  if ((method === "GET" || method === "HEAD") && path.startsWith("/file/")) {
    const abs = safePath(path.slice("/file/".length));
    if (!abs) return text("404 not found", 404);
    return serveFile(abs, req);
  }

  if (method !== "GET" && method !== "HEAD") return json({error: "method not allowed"}, 405);
  return text("404 not found", 404);
};

const server = Bun.serve({hostname: HOST, port: PORT, fetch: handle, idleTimeout: 120});

const shown = LAN ? `http://<this-machine-ip>:${server.port}/?t=${TOKEN}` : `http://127.0.0.1:${server.port}/`;
console.log(`\n  shorts-kit preview (read-only)\n  ${shown}`);
if (LAN) {
  console.log(`  local: http://127.0.0.1:${server.port}/?t=${TOKEN}`);
  console.log(`  token: ${TOKEN}${process.env.PREVIEW_TOKEN ? " (from PREVIEW_TOKEN)" : " (random for this run)"}`);
  console.log("  --lan: anyone on this network with the URL can watch your drafts. Ctrl-C to stop.");
}
console.log("");

const stop = () => {
  server.stop(true);
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
