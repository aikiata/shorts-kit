/**
 * The Goliath Expedition route, APPROXIMATED from the stops in `facts.json`
 * (Wikipedia "Karl Bushby", Explorersweb 01/2025 and 10/2026, karlbushby.world).
 * Not a GPS track: each point is a city or place a source names,
 * or a point joining two stops so the line does not cut across the sea.
 *
 * Longitude is "unwrapped" across the date line (Russia written as negatives below -180), so
 * the line and the moving point interpolate smoothly across the Bering Strait. The globe's
 * `project` uses trigonometry, so -190 and 170 are the same place.
 */
export type LonLat = readonly [number, number];
export type Leg = "walk" | "swim";

type Stop = {at: LonLat; name?: string; leg?: Leg};

const E = (lon: number) => lon - 360; // east longitude, unwrapped across the date line

const STOPS: Stop[] = [
  // South America
  {at: [-70.91, -53.16], name: "punta"},
  {at: [-71.6, -46.5]},
  {at: [-69.2, -39.0]},
  {at: [-68.8, -32.9]},
  {at: [-70.4, -23.6]},
  {at: [-71.5, -16.4]},
  {at: [-77.0, -12.05]},
  {at: [-79.9, -2.2]},
  {at: [-78.5, -0.2]},
  {at: [-75.6, 6.25], name: "medellin"},
  {at: [-77.3, 7.9], name: "darien"},
  {at: [-79.5, 9.0]},
  // Central America
  {at: [-84.1, 9.9]},
  {at: [-86.9, 12.4], name: "leon"},
  {at: [-90.5, 14.6]},
  {at: [-99.1, 19.4]},
  {at: [-105.0, 25.0]},
  // North America
  {at: [-110.94, 31.34], name: "nogales"},
  {at: [-115.14, 36.17], name: "lasvegas"},
  {at: [-112.0, 41.5]},
  {at: [-111.9, 48.99], name: "montana"},
  {at: [-114.0, 51.0]},
  {at: [-120.0, 55.5]},
  {at: [-128.0, 59.5]},
  {at: [-135.05, 60.72]},
  {at: [-147.7, 64.84], name: "fairbanks"},
  {at: [-160.8, 63.88], name: "unalakleet"},
  {at: [-168.1, 65.6], name: "wales"},
  // Bering Strait: walked on drift ice, still "walk"
  {at: [-169.8, 66.16], name: "uelen"},
  // Siberia
  {at: [E(177.5), 64.7]},
  {at: [E(166.4), 68.05], name: "bilibino"},
  {at: [E(153.7), 67.45], name: "srednekolymsk"},
  {at: [E(143.0), 64.5]},
  {at: [E(129.7), 62.03], name: "yakutsk"},
  {at: [E(124.7), 56.6]},
  {at: [E(113.5), 52.03]},
  {at: [E(107.6), 51.8]},
  // Mongolia, China, Central Asia
  {at: [E(106.92), 47.92], name: "ulaanbaatar"},
  {at: [E(100.0), 44.5]},
  {at: [E(93.5), 42.8]},
  {at: [E(87.6), 43.8]},
  {at: [E(80.3), 44.1]},
  {at: [E(76.9), 43.24]},
  {at: [E(69.24), 41.3]},
  {at: [E(64.42), 39.77], name: "bukhara"},
  {at: [E(61.83), 37.6]},
  {at: [E(58.38), 37.95], name: "iran"},
  // Could not cross Iran: back to Bukhara (flown), across the Kyzylkum to the Caspian shore
  {at: [E(61.83), 37.6]},
  {at: [E(64.42), 39.77]},
  {at: [E(62.0), 41.9]},
  {at: [E(59.6), 42.45]},
  {at: [E(55.2), 45.3]},
  {at: [E(51.2), 43.65], name: "aktau"},
  // Swim across the Caspian Sea
  {at: [E(50.6), 42.0], leg: "swim"},
  {at: [E(49.87), 40.4], name: "baku", leg: "swim"},
  // Caucasus, Turkey, Europe
  {at: [E(44.8), 41.7]},
  {at: [E(43.1), 40.6]},
  {at: [E(41.3), 39.9]},
  {at: [E(37.0), 39.75]},
  {at: [E(32.85), 39.93]},
  {at: [E(28.98), 41.01], name: "istanbul"},
  {at: [E(26.55), 41.68]},
  {at: [E(25.97), 43.85]},
  {at: [E(26.1), 44.43]},
  {at: [E(21.2), 45.75]},
  {at: [E(19.04), 47.5], name: "budapest"},
  {at: [E(17.1), 48.15]},
  {at: [E(16.37), 48.2]},
  {at: [E(11.58), 48.14]},
  {at: [E(8.68), 50.11]},
  {at: [E(6.96), 50.94]},
  {at: [E(4.35), 50.85], name: "brussels"},
  {at: [E(3.06), 50.63]},
  {at: [E(1.58), 50.87], name: "grisnez"},
  // Swim across the English Channel
  {at: [E(1.29), 51.11], name: "dover", leg: "swim"},
  // the last 400 km
  {at: [E(0.52), 51.27]},
  // England lies west of the prime meridian: keep unwrapping (minus 360), do not go back to small
  // negatives, or the last leg interpolates all the way round the 51st parallel.
  {at: [-0.13 - 360, 51.5]},
  {at: [-0.12 - 360, 52.2]},
  {at: [-0.34 - 360, 53.74], name: "hull"},
];

/** Named coordinates, longitude already unwrapped. */
export const PLACE: Record<string, LonLat> = Object.fromEntries(
  STOPS.filter((s) => s.name).map((s) => [s.name!, s.at]),
);

const RAD = Math.PI / 180;
const km = (a: LonLat, b: LonLat) => {
  const dLat = (b[1] - a[1]) * RAD;
  const dLon = (b[0] - a[0]) * RAD;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * RAD) * Math.cos(b[1] * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};

/** Split each edge so the line curves with the sphere and clips cleanly at the horizon. */
const STEP_KM = 120;

export type RoutePoint = {at: LonLat; dist: number; leg: Leg};

const build = (): RoutePoint[] => {
  const out: RoutePoint[] = [{at: STOPS[0].at, dist: 0, leg: "walk"}];
  let dist = 0;
  for (let i = 1; i < STOPS.length; i++) {
    const a = STOPS[i - 1].at;
    const b = STOPS[i].at;
    const leg = STOPS[i].leg ?? "walk";
    const len = km(a, b);
    const n = Math.max(1, Math.ceil(len / STEP_KM));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      out.push({at: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], dist: dist + len * t, leg});
    }
    dist += len;
  }
  return out;
};

export const ROUTE = build();
export const TOTAL_KM = ROUTE[ROUTE.length - 1].dist;

/** Distance (km along the drawn route) to a named stop. A repeated stop takes its first visit. */
export const distTo = (name: string): number => {
  const p = PLACE[name];
  const hit = ROUTE.find((r) => r.at[0] === p[0] && r.at[1] === p[1]);
  return hit ? hit.dist : 0;
};

/** The point on the route at distance `d` km. */
export const pointAt = (d: number): LonLat => {
  if (d <= 0) return ROUTE[0].at;
  for (let i = 1; i < ROUTE.length; i++) {
    if (ROUTE[i].dist >= d) {
      const a = ROUTE[i - 1];
      const b = ROUTE[i];
      const t = (d - a.dist) / Math.max(1e-6, b.dist - a.dist);
      return [a.at[0] + (b.at[0] - a.at[0]) * t, a.at[1] + (b.at[1] - a.at[1]) * t];
    }
  }
  return ROUTE[ROUTE.length - 1].at;
};
