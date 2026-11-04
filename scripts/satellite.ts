/**
 * `bun run satellite <id>`: satellite mosaics for a video's map shots.
 *
 *   bun run satellite <id> [--only <shot>] [--quality 2-31] [--out img/sat/<id>] [--force]
 *
 * Reads `src/videos/<id>/map.json`:
 *
 *   {"shots": [{"id": "country", "lon": 106.8, "lat": 14.5, "spanLon": 21},
 *              {"id": "saigon",  "lon": 106.7, "lat": 10.78, "spanLon": 0.4, "zoom": 12}]}
 *
 * For each shot it fetches the EOX Sentinel-2 cloudless (2016) tiles covering
 * the shot's 9:16 box plus a margin (`pad`, default 0.15 of the box on each
 * side, so a coast or drift after the move stays on imagery), stitches them
 * with ffmpeg into one JPEG, and writes:
 *
 *   public/img/sat/<id>/<shot>.jpg     the mosaic (gitignored: re-run to rebuild)
 *   src/videos/<id>/satellite.json     {attribution, mosaics: [{id, href, zoom, x, y, w, h}]} in world units
 *
 * and adds the EOX attribution to docs/facts/sources.json once. Draw with
 * `<SatelliteMap box={…} mosaics={SAT.mosaics} />`; give a fly from wide to
 * close one shot per scale so the sharper mosaic can take over.
 *
 * `zoom` defaults to the lowest tile zoom that gives at least one mosaic pixel
 * per canvas pixel. Tiles are cached in `.cache/tiles/s2cloudless/`.
 * Every request has a 20 s timeout; the whole command stops after 300 s.
 */
import {existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {type Box, boxAround, WORLD} from "../src/shared/map/mercator";
import {die, flag, ID_RE, p, videoDir} from "./lib/paths";
import {must} from "./lib/proc";

const TOTAL_MS = 300_000;
const TILE_MS = 20_000;
const RETRIES = 2;
const CONCURRENCY = 6;
const MAX_TILES = 1500;
const MAX_ZOOM = 14;
/** Sentinel-2 is 10 m/px: past this zoom the tiles are upsampled, not sharper. */
const NATIVE_ZOOM = 13;

const HOST = "https://tiles.maps.eox.at";
const TILE_URL = (z: number, x: number, y: number) => `${HOST}/wmts/1.0.0/s2cloudless_3857/default/g/${z}/${y}/${x}.jpg`;
const UA = "shorts-kit satellite (https://github.com/howznguyen/shorts-kit)";
const CACHE = p(".cache/tiles/s2cloudless");

export const EOX_ATTRIBUTION =
  "EOxCloudless https://cloudless.eox.at by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2016) released under Creative Commons Attribution 4.0 International License";

type Shot = {id: string; lon: number; lat: number; spanLon: number; zoom?: number; pad?: number};
type Mosaic = {id: string; href: string; zoom: number; x: number; y: number; w: number; h: number};

/** Tile range, zoom and world bounds of the mosaic for one shot. Pure, so a shot list can be checked without fetching. */
export const plan = (s: Shot) => {
  const box: Box = boxAround(s.lon, s.lat, s.spanLon);
  const pad = s.pad ?? 0.15;
  const auto = Math.ceil(Math.log2((1080 * WORLD) / (256 * box[2])));
  const z = Math.max(1, Math.min(MAX_ZOOM, s.zoom ?? auto));
  const n = 2 ** z;
  const unit = WORLD / n; // world units per tile
  const x0 = Math.floor((box[0] - box[2] * pad) / unit);
  const x1 = Math.ceil((box[0] + box[2] * (1 + pad)) / unit);
  const y0 = Math.max(0, Math.floor((box[1] - box[3] * pad) / unit));
  const y1 = Math.min(n, Math.ceil((box[1] + box[3] * (1 + pad)) / unit));
  return {box, z, auto, nx: x1 - x0, ny: y1 - y0, x0, y0, unit};
};

const isImage = (b: Buffer) => b.subarray(0, 3).toString("hex") === "ffd8ff" || b.subarray(0, 4).toString("hex") === "89504e47";

type TileResult = "ok" | "missing";

const isPng = (b: Buffer) => b.subarray(0, 4).toString("hex") === "89504e47";

/**
 * The server answers flat open-ocean tiles with a tiny palette PNG. ffmpeg's
 * concat demuxer reads every file with the first one's decoder, so a PNG among
 * JPEGs is silently dropped and every later tile shifts one place. Store every
 * tile as a real JPEG.
 */
const ensureJpeg = async (file: string) => {
  const head = Buffer.alloc(4);
  const fd = Bun.file(file);
  head.set(new Uint8Array(await fd.slice(0, 4).arrayBuffer()));
  if (!isPng(head)) return;
  const png = file.replace(/\.jpg$/, ".png");
  renameSync(file, png);
  await must("ffmpeg", ["-v", "error", "-y", "-i", png, "-pix_fmt", "yuvj444p", "-q:v", "2", file], {timeoutMs: 20_000});
};

const fetchTile = async (z: number, x: number, y: number): Promise<TileResult> => {
  const file = join(CACHE, `${z}-${x}-${y}.jpg`);
  if (existsSync(file) && statSync(file).size > 0) {
    await ensureJpeg(file);
    return "ok";
  }
  let last = "";
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const r = await fetch(TILE_URL(z, x, y), {headers: {"User-Agent": UA}, signal: AbortSignal.timeout(TILE_MS)});
      if (r.status === 404) return "missing";
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const body = Buffer.from(await r.arrayBuffer());
      if (!isImage(body)) throw new Error(`not an image (${body.length} B)`);
      writeFileSync(file + ".part", body);
      renameSync(file + ".part", file);
      await ensureJpeg(file);
      return "ok";
    } catch (e) {
      const err = e as Error;
      last = err.name === "TimeoutError" ? `no answer within ${TILE_MS / 1000}s` : err.message;
      if (attempt < RETRIES) await Bun.sleep(500 * 2 ** attempt);
    }
  }
  throw new Error(`tile ${z}/${x}/${y} from ${HOST}: ${last}`);
};

const pool = async <T>(jobs: (() => Promise<T>)[], limit: number, onDone: (n: number) => void) => {
  const out: T[] = new Array(jobs.length);
  let next = 0;
  let done = 0;
  await Promise.all(
    Array.from({length: Math.min(limit, jobs.length)}, async () => {
      while (next < jobs.length) {
        const i = next++;
        out[i] = await jobs[i]();
        onDone(++done);
      }
    }),
  );
  return out;
};

/** A plain 256 px tile for tiles the server does not have (open ocean at the edge of coverage). */
const fillerTile = async () => {
  const file = join(CACHE, "filler.jpg");
  if (!existsSync(file)) {
    await must("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "color=c=0x0A1A2A:s=256x256", "-frames:v", "1", file], {timeoutMs: 20_000});
  }
  return file;
};

const buildShot = async (id: string, s: Shot, outRel: string, quality: number, force: boolean): Promise<Mosaic> => {
  const {z, auto, nx, ny, x0, y0, unit} = plan(s);
  const count = nx * ny;
  if (count > MAX_TILES) die(`shot "${s.id}": ${nx}×${ny} = ${count} tiles at z${z} (limit ${MAX_TILES}). Lower "zoom" or narrow "spanLon".`);
  if (z > NATIVE_ZOOM) console.warn(`! shot "${s.id}": z${z} is past Sentinel-2's 10 m/px (z${NATIVE_ZOOM}); tiles will look soft`);
  const href = `${outRel}/${s.id}.jpg`;
  const out = p("public", href);
  const mosaic: Mosaic = {id: s.id, href, zoom: z, x: x0 * unit, y: y0 * unit, w: nx * unit, h: ny * unit};
  if (!force && existsSync(out)) {
    console.log(`  ${s.id}: exists (${href}); --force to rebuild`);
    return mosaic;
  }
  console.log(`  ${s.id}: z${z}${s.zoom === undefined || s.zoom === auto ? "" : ` (auto would be z${auto})`}, ${nx}×${ny} = ${count} tiles → ${nx * 256}×${ny * 256} px`);
  const n = 2 ** z;
  const coords: [number, number][] = [];
  for (let dy = 0; dy < ny; dy++) for (let dx = 0; dx < nx; dx++) coords.push([x0 + dx, y0 + dy]);
  const results = await pool(
    coords.map(([x, y]) => () => fetchTile(z, ((x % n) + n) % n, y)),
    CONCURRENCY,
    (d) => d % 25 === 0 && process.stdout.write(`    ${d}/${count}\r`),
  );
  const missing = results.filter((r) => r === "missing").length;
  if (missing === count) die(`shot "${s.id}": the server has none of these tiles (all 404)`);
  if (missing) console.warn(`! shot "${s.id}": ${missing} tile(s) missing on the server, filled flat`);
  const filler = missing ? await fillerTile() : "";
  const list = coords
    .map(([x, y], i) => `file '${results[i] === "ok" ? join(CACHE, `${z}-${((x % n) + n) % n}-${y}.jpg`) : filler}'`)
    .join("\n");
  const listFile = join(CACHE, `list-${id}-${s.id}.txt`);
  writeFileSync(listFile, list + "\n");
  mkdirSync(join(out, ".."), {recursive: true});
  await must(
    "ffmpeg",
    ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", listFile, "-vf", `tile=${nx}x${ny}`, "-frames:v", "1", "-q:v", String(quality), out],
    {timeoutMs: 120_000},
  );
  if (!existsSync(out) || statSync(out).size === 0) die(`ffmpeg wrote no ${out}`);
  console.log(`    → public/${href} (${(statSync(out).size / 1024).toFixed(0)} KB)`);
  return mosaic;
};

/** Local date, YYYY-MM-DD (toISOString would give the UTC date). */
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Add the EOX source to docs/facts/sources.json unless it is there already. */
const recordSource = () => {
  const file = p("docs/facts/sources.json");
  const sources = JSON.parse(readFileSync(file, "utf8")) as {id: string; url?: string}[];
  if (sources.some((s) => s.url === "https://cloudless.eox.at")) return;
  const next = Math.max(0, ...sources.map((s) => Number(s.id.replace(/^s-/, "")) || 0)) + 1;
  sources.push({
    id: `s-${String(next).padStart(4, "0")}`,
    title: "Sentinel-2 cloudless 2016 (EOxCloudless) satellite mosaic tiles",
    url: "https://cloudless.eox.at",
    publisher: "EOX IT Services GmbH",
    kind: "image",
    licence: "CC BY 4.0",
    attribution: EOX_ATTRIBUTION,
    accessed: today(),
  } as {id: string; url: string});
  writeFileSync(file, JSON.stringify(sources, null, 2) + "\n");
  console.log(`  recorded the EOX attribution in docs/facts/sources.json (s-${String(next).padStart(4, "0")})`);
};

const main = async () => {
  const id = process.argv.slice(2).find((a, i, all) => !a.startsWith("-") && !/^--(only|quality|out)$/.test(all[i - 1] ?? ""));
  if (!id) die("usage: bun run satellite <id> [--only <shot>] [--quality 2-31] [--out img/sat/<id>] [--force]");
  if (!ID_RE.test(id!)) die(`"${id}" is not a video id (lowercase kebab-case)`);
  const mapFile = join(videoDir(id!), "map.json");
  if (!existsSync(mapFile)) die(`no ${mapFile}. Write {"shots": [{"id", "lon", "lat", "spanLon", "zoom"?}]} first.`);
  const shots = (JSON.parse(readFileSync(mapFile, "utf8")) as {shots?: Shot[]}).shots ?? [];
  if (!shots.length) die(`${mapFile}: "shots" is empty`);
  for (const s of shots) {
    if (!s.id || !/^[a-z0-9-]+$/.test(s.id)) die(`${mapFile}: shot id "${s.id}" must be lowercase kebab-case`);
    if (![s.lon, s.lat, s.spanLon].every(Number.isFinite) || s.spanLon <= 0) die(`${mapFile}: shot "${s.id}" needs numeric lon, lat and spanLon > 0`);
  }
  const only = flag("only");
  const quality = Number(flag("quality") ?? 3);
  if (!(quality >= 2 && quality <= 31)) die("--quality is ffmpeg's JPEG q:v, 2 (best) to 31");
  const outRel = String(flag("out") ?? `img/sat/${id}`).replace(/^public\//, "").replace(/\/$/, "");
  const force = flag("force") !== undefined;
  const todo = typeof only === "string" ? shots.filter((s) => s.id === only) : shots;
  if (!todo.length) die(`no shot "${only}" in ${mapFile}`);

  mkdirSync(CACHE, {recursive: true});
  // Probe the host once with a short request, so a dead host fails in 20 s with a clear message.
  const first = plan(todo[0]);
  try {
    await fetchTile(first.z, ((first.x0 % 2 ** first.z) + 2 ** first.z) % 2 ** first.z, first.y0);
  } catch (e) {
    die(`EOX tile server did not answer: ${(e as Error).message}. Check the network and try again.`);
  }

  console.log(`satellite ${id}: ${todo.length} shot(s), EOX Sentinel-2 cloudless 2016`);
  const manifestFile = join(videoDir(id!), "satellite.json");
  const prev: Mosaic[] = existsSync(manifestFile) ? ((JSON.parse(readFileSync(manifestFile, "utf8")) as {mosaics?: Mosaic[]}).mosaics ?? []) : [];
  const built: Mosaic[] = [];
  for (const s of todo) built.push(await buildShot(id!, s, outRel, quality, force));
  const byId = new Map(prev.filter((m) => shots.some((s) => s.id === m.id)).map((m) => [m.id, m]));
  for (const m of built) byId.set(m.id, m);
  const mosaics = shots.map((s) => byId.get(s.id)).filter((m): m is Mosaic => !!m);
  writeFileSync(manifestFile, JSON.stringify({attribution: EOX_ATTRIBUTION, mosaics}, null, 2) + "\n");
  console.log(`wrote src/videos/${id}/satellite.json (${mosaics.length} mosaic(s))`);
  recordSource();
};

if (import.meta.main) {
  const killer = setTimeout(() => {
    console.error(`✖ satellite: gave up after ${TOTAL_MS / 1000}s. The tile server is too slow or hung; re-run (cached tiles are kept).`);
    process.exit(1);
  }, TOTAL_MS);
  try {
    await main();
  } finally {
    clearTimeout(killer);
  }
}
