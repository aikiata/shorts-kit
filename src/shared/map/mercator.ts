/**
 * The one coordinate system every map layer shares: Web Mercator, normalised
 * to [0, WORLD] on both axes ("world units"). x grows east, y grows south.
 *
 * Satellite tiles are Mercator, so a mosaic and a vector river drawn in world
 * units stay welded together inside one SVG viewBox at any zoom. That is what
 * makes a continuous camera move from a country to a street possible.
 *
 * A camera framing is a `Box`: `[x, y, w, h]` in world units, normally at the
 * 9:16 aspect of the canvas.
 */
import {H, W} from "../theme";

export const WORLD = 65536;
/** World units per degree of longitude. */
export const PER_DEGREE = WORLD / 360;
/** Web Mercator stops here; beyond it y goes to infinity. */
export const MAX_LAT = 85.05112878;
/** Width / height of the canvas: every framing is this shape unless asked otherwise. */
export const ASPECT = W / H;

/** `[x, y, w, h]` in world units. */
export type Box = readonly [number, number, number, number];
/** `[lon, lat]` in degrees. */
export type LonLat = readonly [number, number];
/** `[x, y]` in world units. */
export type XY = readonly [number, number];

export const lonToWorld = (lon: number) => ((lon + 180) / 360) * WORLD;

export const latToWorld = (lat: number) => {
  const phi = (Math.max(-MAX_LAT, Math.min(MAX_LAT, lat)) * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(phi) + 1 / Math.cos(phi)) / Math.PI) / 2) * WORLD;
};

/** `[lon, lat]` → `[x, y]` world units. Longitudes past ±180 stay past the edge (for routes across the antimeridian). */
export const toWorld = ([lon, lat]: LonLat): XY => [lonToWorld(lon), latToWorld(lat)];

/** `[x, y]` world units → `[lon, lat]`. */
export const worldToLonLat = (x: number, y: number): LonLat => {
  const lon = (x / WORLD) * 360 - 180;
  const n = Math.PI * (1 - (2 * y) / WORLD);
  const lat = (Math.atan(Math.sinh(n)) * 180) / Math.PI;
  return [lon, lat];
};

/**
 * A framing centred on `[lon, lat]`, `spanLon` degrees of longitude wide, at
 * `aspect` (default 9:16). The height follows from the aspect, so a framing
 * near the poles covers fewer degrees of latitude than one at the equator.
 */
export const boxAround = (lon: number, lat: number, spanLon: number, aspect = ASPECT): Box => {
  const w = spanLon * PER_DEGREE;
  const h = w / aspect;
  return [lonToWorld(lon) - w / 2, latToWorld(lat) - h / 2, w, h];
};

export type Bounds = {west: number; south: number; east: number; north: number};

/** World box of a lon/lat rectangle (any aspect). */
export const boundsToBox = ({west, south, east, north}: Bounds): Box => {
  const x0 = lonToWorld(west);
  const y0 = latToWorld(north);
  return [x0, y0, lonToWorld(east) - x0, latToWorld(south) - y0];
};

/**
 * The smallest framing at `aspect` that contains `bounds` plus a margin
 * (`pad`, a fraction of the larger side). Use it to frame a country or a route.
 */
export const boxOfBounds = (bounds: Bounds, pad = 0.08, aspect = ASPECT): Box => {
  const [x, y, w, h] = boundsToBox(bounds);
  let bw = w * (1 + 2 * pad);
  let bh = h * (1 + 2 * pad);
  if (bw / bh > aspect) bh = bw / aspect;
  else bw = bh * aspect;
  return [x + w / 2 - bw / 2, y + h / 2 - bh / 2, bw, bh];
};

/** Lon/lat bounds of a list of points. */
export const boundsOf = (pts: readonly LonLat[]): Bounds => ({
  west: Math.min(...pts.map((p) => p[0])),
  east: Math.max(...pts.map((p) => p[0])),
  south: Math.min(...pts.map((p) => p[1])),
  north: Math.max(...pts.map((p) => p[1])),
});

/** True when `inner` lies entirely inside `outer`. */
export const contains = (outer: Box, inner: Box) =>
  inner[0] >= outer[0] && inner[1] >= outer[1] && inner[0] + inner[2] <= outer[0] + outer[2] && inner[1] + inner[3] <= outer[1] + outer[3];

/** True when the two boxes overlap. */
export const intersects = (a: Box, b: Box) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];

/**
 * How the SVG maps a box onto the 1080×1920 canvas (`preserveAspectRatio="xMidYMid slice"`):
 * `scale` is canvas px per world unit, `ox`/`oy` the canvas position of the box's top-left.
 */
export const viewTransform = (box: Box) => {
  const scale = Math.max(W / box[2], H / box[3]);
  return {scale, ox: (W - box[2] * scale) / 2, oy: (H - box[3] * scale) / 2};
};

/** World units per canvas pixel for this box: `px(box)(4)` is a 4 px line at any zoom. */
export const pxOf = (box: Box) => {
  const k = 1 / viewTransform(box).scale;
  return (n: number) => n * k;
};

/** World `[x, y]` → canvas px `[sx, sy]` for this camera box. */
export const worldToScreen = (box: Box, [x, y]: XY): XY => {
  const {scale, ox, oy} = viewTransform(box);
  return [ox + (x - box[0]) * scale, oy + (y - box[1]) * scale];
};

/** Canvas px `[sx, sy]` → world `[x, y]` for this camera box. */
export const screenToWorld = (box: Box, [sx, sy]: XY): XY => {
  const {scale, ox, oy} = viewTransform(box);
  return [box[0] + (sx - ox) / scale, box[1] + (sy - oy) / scale];
};

const RAD = Math.PI / 180;
/** Mean Earth radius, km (IUGG). */
export const EARTH_RADIUS_KM = 6371.0088;

/** Great-circle distance between two points, km (haversine). Compute on-screen distances, never type them. */
export const distanceKm = (a: LonLat, b: LonLat) => {
  const dLat = (b[1] - a[1]) * RAD;
  const dLon = (b[0] - a[0]) * RAD;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * RAD) * Math.cos(b[1] * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(s)));
};

/**
 * Points along the great circle from `a` to `b` (inclusive), `steps` segments.
 * Longitudes are unwrapped so the line never jumps across the antimeridian:
 * values may run past ±180, which `toWorld` keeps continuous.
 */
export const greatCircle = (a: LonLat, b: LonLat, steps = 64): LonLat[] => {
  const v = ([lon, lat]: LonLat) => [Math.cos(lat * RAD) * Math.cos(lon * RAD), Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD)];
  const p = v(a);
  const q = v(b);
  const dot = Math.max(-1, Math.min(1, p[0] * q[0] + p[1] * q[1] + p[2] * q[2]));
  const omega = Math.acos(dot);
  if (omega < 1e-9) return [a, b];
  const out: LonLat[] = [];
  let prevLon = a[0];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const s0 = Math.sin((1 - t) * omega) / Math.sin(omega);
    const s1 = Math.sin(t * omega) / Math.sin(omega);
    const x = s0 * p[0] + s1 * q[0];
    const y = s0 * p[1] + s1 * q[1];
    const z = s0 * p[2] + s1 * q[2];
    let lon = Math.atan2(y, x) / RAD;
    const lat = Math.atan2(z, Math.hypot(x, y)) / RAD;
    while (lon - prevLon > 180) lon -= 360;
    while (lon - prevLon < -180) lon += 360;
    prevLon = lon;
    out.push([lon, lat]);
  }
  return out;
};

/** Densify a polyline along great circles, about one point per `degPerStep` of arc. */
export const greatCirclePath = (pts: readonly LonLat[], degPerStep = 1): LonLat[] => {
  if (pts.length < 2) return [...pts];
  const out: LonLat[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const deg = distanceKm(pts[i - 1], pts[i]) / ((EARTH_RADIUS_KM * Math.PI) / 180);
    const seg = greatCircle(out[out.length - 1], pts[i], Math.max(1, Math.ceil(deg / degPerStep)));
    out.push(...seg.slice(1));
  }
  return out;
};

/** Path data (world units) of a lon/lat ring or line. */
export const pathOf = (pts: readonly LonLat[], closed = false) =>
  pts.length ? "M" + pts.map((p) => toWorld(p).map((n) => n.toFixed(2)).join(",")).join("L") + (closed ? "Z" : "") : "";
