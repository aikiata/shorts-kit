/**
 * `bun run geo <id>`: vector map data for a video, from Natural Earth (public domain).
 *
 *   bun run geo <id> [--res 10m|50m] [--layers coast,countries,borders,rivers] [--pad 0.25]
 *   bun run geo --vietnam        regenerate src/shared/map/data/vietnam-data.ts (the bundled Vietnam preset)
 *
 * Reads the shots of `src/videos/<id>/map.json` (`{"shots": [{"id", "lon", "lat", "spanLon"}]}`),
 * takes the area they cover plus a margin, and writes `src/videos/<id>/geo.json`:
 * coastlines, country polygons, land borders and rivers inside that area, as SVG
 * path data in world units (Web Mercator, 0–65536), simplified to about half a
 * pixel at the tightest shot. Draw them with `<VectorLayer d={geo.coast} />`.
 *
 * Optional `"geo"` block in map.json: `{"res": "10m", "layers": [...], "countries": ["VNM", "LAO"], "exclude": ["PGA"]}`.
 *
 * Natural Earth GeoJSON is downloaded once into `.cache/naturalearth/` (each file
 * with a hard timeout; the whole command stops after 5 minutes).
 */
import {existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {ARCHIPELAGO} from "../src/shared/map/data/archipelago-data";
import {type Box, boxAround, type Bounds, latToWorld, lonToWorld, PER_DEGREE, worldToLonLat} from "../src/shared/map/mercator";
import {die, flag, ID_RE, p, videoDir} from "./lib/paths";

const TOTAL_MS = 300_000;
const FILE_MS = 150_000;

const CACHE = p(".cache/naturalearth");
const BASE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson";
export const NE_SOURCE = {
  title: "Natural Earth vector data",
  url: "https://www.naturalearthdata.com",
  licence: "public domain (Natural Earth terms of use)",
  mirror: "https://github.com/nvkelso/natural-earth-vector",
};

type Res = "10m" | "50m";
type Layer = "coast" | "countries" | "borders" | "rivers";
const LAYERS: Layer[] = ["coast", "countries", "borders", "rivers"];
const FILE: Record<Layer, string> = {
  coast: "coastline",
  countries: "admin_0_countries",
  borders: "admin_0_boundary_lines_land",
  rivers: "rivers_lake_centerlines",
};

type Pt = [number, number];
type Geometry = {type: string; coordinates: any};
type Feature = {properties: Record<string, any>; geometry: Geometry | null};

/** Download (once) and parse one Natural Earth GeoJSON file. */
const loadNE = async (res: Res, name: string): Promise<Feature[]> => {
  mkdirSync(CACHE, {recursive: true});
  const file = join(CACHE, `ne_${res}_${name}.geojson`);
  if (!existsSync(file) || statSync(file).size < 1000) {
    const url = `${BASE}/ne_${res}_${name}.geojson`;
    process.stdout.write(`  downloading ${url} … `);
    const t0 = performance.now();
    let r: Response;
    try {
      r = await fetch(url, {signal: AbortSignal.timeout(FILE_MS), headers: {"User-Agent": "shorts-kit geo"}});
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer());
      writeFileSync(file + ".part", buf);
      renameSync(file + ".part", file);
      console.log(`${(buf.length / 1e6).toFixed(1)} MB in ${((performance.now() - t0) / 1000).toFixed(1)}s`);
    } catch (e) {
      const err = e as Error;
      const why = err.name === "TimeoutError" ? `no complete answer within ${FILE_MS / 1000}s` : err.message;
      die(`could not download ${url}: ${why}. Check the network, or save the file as ${file} by hand.`);
    }
  }
  return (JSON.parse(readFileSync(file, "utf8")) as {features: Feature[]}).features;
};

const project = ([lon, lat]: Pt): Pt => [lonToWorld(lon), latToWorld(lat)];

/** Douglas–Peucker, world units. */
export const simplify = (pts: Pt[], tol: number): Pt[] => {
  if (pts.length < 3) return pts;
  const sq = tol * tol;
  const segSq = (q: Pt, a: Pt, b: Pt) => {
    let [x, y] = a;
    let dx = b[0] - x;
    let dy = b[1] - y;
    if (dx !== 0 || dy !== 0) {
      const t = ((q[0] - x) * dx + (q[1] - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) [x, y] = b;
      else if (t > 0) {
        x += dx * t;
        y += dy * t;
      }
    }
    dx = q[0] - x;
    dy = q[1] - y;
    return dx * dx + dy * dy;
  };
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop()!;
    let index = -1;
    let max = sq;
    for (let i = first + 1; i < last; i++) {
      const d = segSq(pts[i], pts[first], pts[last]);
      if (d > max) {
        index = i;
        max = d;
      }
    }
    if (index !== -1) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  return pts.filter((_, i) => keep[i]);
};

const inside = (q: Pt, b: Box) => q[0] >= b[0] && q[0] <= b[0] + b[2] && q[1] >= b[1] && q[1] <= b[1] + b[3];

/** Sutherland–Hodgman: a ring clipped to a rectangle (world units). */
const clipRing = (ring: Pt[], [bx, by, bw, bh]: Box): Pt[] => {
  const edges: [(q: Pt) => boolean, (a: Pt, b: Pt) => Pt][] = [
    [(q) => q[0] >= bx, (a, b) => [bx, a[1] + ((b[1] - a[1]) * (bx - a[0])) / (b[0] - a[0])]],
    [(q) => q[0] <= bx + bw, (a, b) => [bx + bw, a[1] + ((b[1] - a[1]) * (bx + bw - a[0])) / (b[0] - a[0])]],
    [(q) => q[1] >= by, (a, b) => [a[0] + ((b[0] - a[0]) * (by - a[1])) / (b[1] - a[1]), by]],
    [(q) => q[1] <= by + bh, (a, b) => [a[0] + ((b[0] - a[0]) * (by + bh - a[1])) / (b[1] - a[1]), by + bh]],
  ];
  let out = ring;
  for (const [ins, cut] of edges) {
    const input = out;
    out = [];
    for (let i = 0; i < input.length; i++) {
      const cur = input[i];
      const prev = input[(i + input.length - 1) % input.length];
      if (ins(cur)) {
        if (!ins(prev)) out.push(cut(prev, cur));
        out.push(cur);
      } else if (ins(prev)) out.push(cut(prev, cur));
    }
    if (!out.length) break;
  }
  return out;
};

/** A polyline cut into the runs inside the box, each keeping one point past the edge so it reaches it. */
const cropLine = (line: Pt[], b: Box): Pt[][] => {
  const runs: Pt[][] = [];
  let run: Pt[] = [];
  for (let i = 0; i < line.length; i++) {
    if (inside(line[i], b)) {
      if (!run.length && i > 0) run.push(line[i - 1]);
      run.push(line[i]);
    } else if (run.length) {
      run.push(line[i]);
      runs.push(run);
      run = [];
    }
  }
  if (run.length) runs.push(run);
  return runs.filter((r) => r.length >= 2);
};

const linesOf = (g: Geometry | null): Pt[][] =>
  !g ? [] : g.type === "LineString" ? [g.coordinates] : g.type === "MultiLineString" ? g.coordinates : [];
const ringsOf = (g: Geometry | null): Pt[][] =>
  !g ? [] : g.type === "Polygon" ? g.coordinates : g.type === "MultiPolygon" ? (g.coordinates as Pt[][][]).flat() : [];

const fmt = (decimals: number) => {
  const k = 10 ** decimals;
  return (n: number) => String(Math.round(n * k) / k);
};
const toD = (parts: Pt[][], closed: boolean, f: (n: number) => string) =>
  parts.map((pts) => "M" + pts.map((q) => `${f(q[0])},${f(q[1])}`).join("L") + (closed ? "Z" : "")).join("");

const bboxOf = (pts: Pt[]): Box => {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of pts) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return [x0, y0, x1 - x0, y1 - y0];
};
const overlaps = (a: Box, b: Box) => a[0] <= b[0] + b[2] && b[0] <= a[0] + a[2] && a[1] <= b[1] + b[3] && b[1] <= a[1] + a[3];

type Extract = {
  area: Box;
  tol: number;
  decimals: number;
  /** Country codes (ADM0_A3) to keep; all if empty. */
  countries?: string[];
  exclude?: string[];
  /** Drop polygon rings whose centre falls in one of these boxes (world units). */
  dropRingsIn?: Box[];
  /** Per-country tolerance multiplier. */
  tolFor?: (iso: string) => number;
  /** Per-country decimals. */
  decimalsFor?: (iso: string) => number;
};

const polygonsOf = (features: Feature[], x: Extract) => {
  const out: {iso: string; name: string; nameVi: string; label?: [number, number]; d: string}[] = [];
  for (const feat of features) {
    const iso = String(feat.properties.ADM0_A3 ?? feat.properties.adm0_a3 ?? "");
    if (x.countries?.length && !x.countries.includes(iso)) continue;
    if (x.exclude?.includes(iso)) continue;
    const tol = x.tol * (x.tolFor?.(iso) ?? 1);
    const f = fmt(x.decimalsFor?.(iso) ?? x.decimals);
    const parts: Pt[][] = [];
    for (const ring of ringsOf(feat.geometry)) {
      const w = ring.map(project);
      const bb = bboxOf(w);
      if (!overlaps(bb, x.area)) continue;
      const c: Pt = [bb[0] + bb[2] / 2, bb[1] + bb[3] / 2];
      if (x.dropRingsIn?.some((b) => inside(c, b))) continue;
      // Rings smaller than ~2 tolerance are dust at this scale.
      if (bb[2] < tol * 1.5 && bb[3] < tol * 1.5) continue;
      const clipped = clipRing(w, x.area);
      if (clipped.length < 3) continue;
      const s = simplify([...clipped, clipped[0]], tol).slice(0, -1);
      if (s.length >= 3) parts.push(s);
    }
    if (!parts.length) continue;
    const name = String(feat.properties.NAME ?? feat.properties.NAME_EN ?? iso);
    const lx = Number(feat.properties.LABEL_X);
    const ly = Number(feat.properties.LABEL_Y);
    const label: [number, number] | undefined = Number.isFinite(lx) && Number.isFinite(ly) ? [Math.round(lx * 100) / 100, Math.round(ly * 100) / 100] : undefined;
    out.push({iso, name, nameVi: String(feat.properties.NAME_VI ?? name), label, d: toD(parts, true, f)});
  }
  return out;
};

const linesIn = (features: Feature[], x: Extract, keep: (props: Record<string, any>) => boolean = () => true) => {
  const f = fmt(x.decimals);
  const parts: Pt[][] = [];
  for (const feat of features) {
    if (!keep(feat.properties)) continue;
    for (const line of linesOf(feat.geometry)) {
      for (const run of cropLine(line.map(project), x.area)) {
        const s = simplify(run, x.tol);
        if (s.length >= 2) parts.push(s);
      }
    }
  }
  return {d: toD(parts, false, f), count: parts.length};
};

const riversIn = (features: Feature[], x: Extract, maxRank = 10) => {
  const f = fmt(x.decimals);
  const byName = new Map<string, Pt[][]>();
  for (const feat of features) {
    if (Number(feat.properties.scalerank ?? 0) > maxRank) continue;
    const name = String(feat.properties.name_en ?? feat.properties.name ?? "");
    for (const line of linesOf(feat.geometry)) {
      for (const run of cropLine(line.map(project), x.area)) {
        const s = simplify(run, x.tol);
        if (s.length >= 2) byName.set(name, [...(byName.get(name) ?? []), s]);
      }
    }
  }
  return [...byName].map(([name, parts]) => ({name, d: toD(parts, false, f)}));
};

const unionBox = (boxes: Box[], pad: number): Box => {
  const x0 = Math.min(...boxes.map((b) => b[0]));
  const y0 = Math.min(...boxes.map((b) => b[1]));
  const x1 = Math.max(...boxes.map((b) => b[0] + b[2]));
  const y1 = Math.max(...boxes.map((b) => b[1] + b[3]));
  const w = x1 - x0;
  const h = y1 - y0;
  const m = Math.max(w, h) * pad;
  return [x0 - m, y0 - m, w + 2 * m, h + 2 * m];
};

const boundsOfBox = ([x, y, w, h]: Box): Bounds => {
  const [west, north] = worldToLonLat(x, y);
  const [east, south] = worldToLonLat(x + w, y + h);
  return {west, south, east, north};
};

/** English form of a Vietnamese place name: diacritics dropped ("Huế" → "Hue"). */
const ascii = (s: string) => s.replace(/đ/g, "d").replace(/Đ/g, "D").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/–/g, "-");

const kb = (s: string) => `${(Buffer.byteLength(s) / 1024).toFixed(0)} KB`;

/** The bundled Vietnam preset: Vietnam, neighbours, major rivers, main cities. */
const buildVietnam = async () => {
  const area: Box = (() => {
    // Holds VIETNAM_VIEWS.wide (the widest preset framing) with a margin.
    const x0 = lonToWorld(93);
    const y0 = latToWorld(36);
    return [x0, y0, lonToWorld(122) - x0, latToWorld(-8) - y0];
  })();
  // Half a pixel at a 12°-wide framing (the mainland view); neighbours, drawn
  // faint, 8× coarser (~2 px at the 21°-wide country view). Closer framings
  // should use `bun run geo <id>` for their own detailed data.
  const tol = ((12 * PER_DEGREE) / 1080) * 0.5;
  // Rings inside the archipelago outlines are drawn by <Archipelagos>, not as anyone's land.
  const archBoxes: Box[] = Object.values(ARCHIPELAGO).map((a) => {
    const xs = a.islands.map((q) => lonToWorld(q[0]));
    const ys = a.islands.map((q) => latToWorld(q[1]));
    const m = 0.6 * PER_DEGREE;
    return [Math.min(...xs) - m, Math.min(...ys) - m, Math.max(...xs) - Math.min(...xs) + 2 * m, Math.max(...ys) - Math.min(...ys) + 2 * m];
  });
  const x: Extract = {
    area,
    tol,
    decimals: 0,
    countries: ["VNM", "CHN", "LAO", "KHM", "THA", "MMR", "MYS", "IDN", "PHL", "BRN", "TWN", "SGP", "IND", "BGD", "BTN", "NPL", "HKG", "MAC"],
    exclude: ["PGA", "SCR"],
    dropRingsIn: archBoxes,
    tolFor: (iso) => (iso === "VNM" ? 1 : 8),

  };
  const countries = polygonsOf(await loadNE("10m", FILE.countries), x);
  const vn = countries.find((c) => c.iso === "VNM");
  if (!vn) die("Vietnam (VNM) not found in Natural Earth countries");
  const neighbours = countries.filter((c) => c.iso !== "VNM");

  const riverFeatures = await loadNE("10m", FILE.rivers);
  const RIVERS: Record<string, {vi: string; en: string; names: string[]}> = {
    mekong: {vi: "Sông Mê Kông", en: "Mekong", names: ["Mekong", "Lancang"]},
    red: {vi: "Sông Hồng", en: "Red River", names: ["Hong"]},
    black: {vi: "Sông Đà", en: "Black River", names: ["Da"]},
  };
  const rivers = Object.entries(RIVERS).map(([id, r]) => ({
    id,
    vi: r.vi,
    en: r.en,
    d: linesIn(riverFeatures, {...x, tol: tol * 2}, (pr) => r.names.includes(String(pr.name))).d,
  }));
  // Delta distributaries: unnamed short lines of the Mekong system in Natural Earth.
  const deltaBox: Box = (() => {
    const x0 = lonToWorld(104.4);
    const y0 = latToWorld(11.2);
    return [x0, y0, lonToWorld(107) - x0, latToWorld(8.5) - y0];
  })();
  const delta = linesIn(riverFeatures, {...x, area: deltaBox, tol}, (pr) => !pr.name || pr.name === "Mekong").d;

  const places = (await loadNE("10m", "populated_places"))
    .filter((f) => f.properties.ADM0_A3 === "VNM" && Number(f.properties.SCALERANK) <= 7)
    .sort((a, b) => Number(a.properties.SCALERANK) - Number(b.properties.SCALERANK) || String(a.properties.NAME_EN).localeCompare(String(b.properties.NAME_EN)))
    .map((f) => ({
      en: ascii(String(f.properties.NAME_EN ?? f.properties.NAME)),
      vi: String(f.properties.NAME_VI ?? f.properties.NAME),
      lon: Math.round(f.geometry!.coordinates[0] * 1e4) / 1e4,
      lat: Math.round(f.geometry!.coordinates[1] * 1e4) / 1e4,
      rank: Number(f.properties.SCALERANK),
      capital: f.properties.ADM0CAP === 1 || f.properties.FEATURECLA === "Admin-0 capital",
    }));

  const out = `/**
 * GENERATED by \`bun run geo --vietnam\` (scripts/geo.ts). Do not edit by hand.
 *
 * Natural Earth 1:10m (public domain): https://www.naturalearthdata.com
 * Country polygons are today's borders; path data is world units (Web Mercator,
 * 0–65536), simplified to half a pixel at a 12°-wide framing (neighbours 8× coarser),
 * for country and regional views. For closer framings run \`bun run geo <id>\`.
 * Land inside the Hoàng Sa and Trường Sa outlines is left out here and drawn by
 * <Archipelagos> instead. See ./README.md.
 */
export type CountryPath = {iso: string; en: string; vi: string; /** Natural Earth label point, [lon, lat]. */ label?: readonly [number, number]; d: string};
export type RiverPath = {id: string; en: string; vi: string; d: string};
export type Place = {en: string; vi: string; lon: number; lat: number; rank: number; capital: boolean};

export const VIETNAM: CountryPath = ${JSON.stringify({iso: vn!.iso, en: "Vietnam", vi: "Việt Nam", label: vn!.label, d: vn!.d})};

export const NEIGHBOURS: CountryPath[] = ${JSON.stringify(neighbours.map((c) => ({iso: c.iso, en: c.name, vi: c.nameVi, label: c.label, d: c.d})))};

export const RIVERS: RiverPath[] = ${JSON.stringify(rivers)};

/** Short unnamed distributaries of the Mekong delta. */
export const MEKONG_DELTA_BRANCHES = ${JSON.stringify(delta)};

/** Cities from Natural Earth populated places (SCALERANK ≤ 7), most important first. */
export const PLACES: Place[] = ${JSON.stringify(places).replace(/\},\{/g, "},\n  {")};
`;
  const file = p("src/shared/map/data/vietnam-data.ts");
  mkdirSync(p("src/shared/map/data"), {recursive: true});
  writeFileSync(file, out);
  console.log(`wrote src/shared/map/data/vietnam-data.ts (${kb(out)}; Vietnam ${kb(vn!.d)}, ${neighbours.length} neighbours, ${places.length} places)`);
};

type MapShot = {id: string; lon: number; lat: number; spanLon: number};
type MapJson = {shots: MapShot[]; geo?: {res?: Res; layers?: Layer[]; countries?: string[]; exclude?: string[]}};

const buildVideo = async (id: string) => {
  const mapFile = join(videoDir(id), "map.json");
  if (!existsSync(mapFile)) die(`no ${mapFile}. Write {"shots": [{"id", "lon", "lat", "spanLon"}]} first.`);
  const map = JSON.parse(readFileSync(mapFile, "utf8")) as MapJson;
  if (!map.shots?.length) die(`${mapFile}: "shots" is empty`);
  const res = (flag("res") as Res | undefined) ?? map.geo?.res ?? "10m";
  if (res !== "10m" && res !== "50m") die(`--res must be 10m or 50m, not ${res}`);
  const layerArg = flag("layers");
  const layers = (typeof layerArg === "string" ? (layerArg.split(",") as Layer[]) : (map.geo?.layers ?? LAYERS)).filter((l) => LAYERS.includes(l));
  const pad = Number(flag("pad") ?? 0.25);
  const boxes = map.shots.map((s) => boxAround(s.lon, s.lat, s.spanLon));
  const area = unionBox(boxes, pad);
  const minW = Math.min(...boxes.map((b) => b[2]));
  const tol = (minW / 1080) * 0.5;
  const decimals = Math.max(0, Math.min(3, Math.ceil(-Math.log10(tol)) + 1));
  const x: Extract = {area, tol, decimals, countries: map.geo?.countries, exclude: map.geo?.exclude};
  console.log(`geo ${id}: Natural Earth ${res}, ${layers.join(", ")}; area ${JSON.stringify(boundsOfBox(area), (_, v) => (typeof v === "number" ? Math.round(v * 100) / 100 : v))}`);

  const out: Record<string, unknown> = {
    source: `Natural Earth 1:${res} (public domain), ${NE_SOURCE.url}`,
    res,
    area,
    bounds: boundsOfBox(area),
  };
  if (layers.includes("coast")) out.coast = linesIn(await loadNE(res, FILE.coast), x).d;
  if (layers.includes("borders")) out.borders = linesIn(await loadNE(res, FILE.borders), x).d;
  if (layers.includes("countries")) out.countries = polygonsOf(await loadNE(res, FILE.countries), x);
  if (layers.includes("rivers")) out.rivers = riversIn(await loadNE(res, FILE.rivers), x);
  const file = join(videoDir(id), "geo.json");
  const text = JSON.stringify(out);
  writeFileSync(file, text + "\n");
  const n = (k: string) => (Array.isArray(out[k]) ? ` ${(out[k] as unknown[]).length} ${k}` : "");
  console.log(`wrote src/videos/${id}/geo.json (${kb(text)};${n("countries")}${n("rivers")})`);
};

const main = async () => {
  if (flag("vietnam") !== undefined) return buildVietnam();
  const id = process.argv.slice(2).find((a) => !a.startsWith("-"));
  if (!id) die("usage: bun run geo <id> [--res 10m|50m] [--layers coast,countries,borders,rivers] | bun run geo --vietnam");
  if (!ID_RE.test(id!)) die(`"${id}" is not a video id (lowercase kebab-case)`);
  return buildVideo(id!);
};

if (import.meta.main) {
  const killer = setTimeout(() => {
    console.error(`✖ geo: gave up after ${TOTAL_MS / 1000}s. A download or parse hung; re-run, or put the GeoJSON in .cache/naturalearth/ by hand.`);
    process.exit(1);
  }, TOTAL_MS);
  try {
    await main();
  } finally {
    clearTimeout(killer);
  }
}
