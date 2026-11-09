import type {GlobeView} from "../../shared/map/globe";
import {PLACE} from "./route";

const MEXICO = [-99.13, 19.43] as const;
const LA = [-118.24, 34.05] as const;
const DC = [-77.04, 38.9] as const;

/**
 * A view that shows both points: centred on the great-circle midpoint, longitude unwrapped near `a`
 * so the camera does not take the long way round when flying in from the previous shot's view.
 */
const midView = (a: readonly [number, number], b: readonly [number, number], scale: number): GlobeView => {
  const r = Math.PI / 180;
  const v = (p: readonly [number, number]) => [Math.cos(p[1] * r) * Math.cos(p[0] * r), Math.cos(p[1] * r) * Math.sin(p[0] * r), Math.sin(p[1] * r)];
  const [x1, y1, z1] = v(a);
  const [x2, y2, z2] = v(b);
  const [x, y, z] = [x1 + x2, y1 + y2, z1 + z2];
  let lon = Math.atan2(y, x) / r;
  const lat = Math.atan2(z, Math.hypot(x, y)) / r;
  while (lon - a[0] > 180) lon -= 360;
  while (lon - a[0] < -180) lon += 360;
  return {lon, lat, scale};
};

/**
 * Shot table, one row per narration line (n = line number in `narration.json`).
 *
 * The spine of the video is TWO CLOCKS: the year at the top always runs, while the route only
 * moves when he really walks. A shot whose `route` has equal ends is a "waiting"
 * shot: the year keeps running, the line stands still, the pill switches to WAITING.
 */
export type Photo = {
  src: string;
  /** Credit, printed small under the photo. */
  credit: string;
  /** `full`: fills the frame. `card`: a small photo placed over the globe. */
  mode: "full" | "card";
  /** Anchor point when cropping a full photo, as CSS object-position. */
  focus?: string;
};

export type ShotCfg = {
  view: GlobeView;
  /** The route is drawn from this stop to that one during the shot (names in `route.ts`). */
  route: [string, string];
  year: [number, number];
  photo?: Photo;
  chip?: string;
  sub?: string;
  pins?: string[];
  /** A flight out and back, drawn dashed. */
  flight?: {from: string; to: readonly [number, number]; label: string};
  /** A walk OFF the route (LA to Washington), drawn dashed in the warning colour. */
  sidewalk?: {points: readonly (readonly [number, number])[]; label: string};
  bars?: boolean;
  quote?: string;
  /** Show the whole route (faint) as a preview. */
  ghost?: boolean;
  /** Force the side of the small photo when the automatic choice covers a label. */
  cardSide?: "left" | "right";
};

const CC = (who: string, lic: string) => `Ảnh: ${who}, ${lic}, Wikimedia Commons`;
const HULLIAN = CC("Hullian111", "CC BY-SA 4.0");

const V = {
  world: {lon: -30, lat: 20, scale: 0.66},
  ghost: {lon: -95, lat: 10, scale: 0.66},
  vegas: {lon: -97, lat: 24, scale: 1.0},
  saSouth: {lon: -68, lat: -38, scale: 1.05},
  sa: {lon: -74, lat: -10, scale: 0.95},
  ca: {lon: -88, lat: 14, scale: 1.1},
  na: {lon: -118, lat: 42, scale: 0.95},
  bering: {lon: -172, lat: 64, scale: 1.3},
  siberia: {lon: -205, lat: 63, scale: 1.05},
  asia: {lon: -265, lat: 48, scale: 0.92},
  central: {lon: -300, lat: 41, scale: 1.2},
  caspian: {lon: -309, lat: 42, scale: 1.5},
  europe: {lon: -340, lat: 46, scale: 1.15},
  channel: {lon: -359, lat: 51.5, scale: 1.6},
  england: {lon: -360.6, lat: 52.6, scale: 2.0},
  eurasia: {lon: -280, lat: 45, scale: 0.7},
} satisfies Record<string, GlobeView>;

export const SHOT_CFG: Record<number, ShotCfg> = {
  1: {
    view: V.world,
    route: ["punta", "punta"],
    year: [2026.84, 2026.84],
    photo: {src: "stills/karl-bushby/portrait.jpg", credit: HULLIAN, mode: "full", focus: "50% 30%"},
  },
  2: {view: V.ghost, route: ["punta", "punta"], year: [2026.84, 2026.84], ghost: true},
  3: {
    view: V.saSouth,
    route: ["punta", "punta"],
    year: [1998.84, 1998.84],
    pins: ["punta"],
    photo: {src: "stills/karl-bushby/punta-arenas.jpg", credit: CC("Entropy1963", "public domain"), mode: "card"},
  },
  4: {view: V.saSouth, route: ["punta", "punta"], year: [1998.84, 1998.9], chip: "Không xe, không thuyền", sub: "Không về nhà trước khi đi bộ tới nơi", pins: ["punta"]},
  5: {view: V.sa, route: ["punta", "punta"], year: [1998.9, 1998.9], chip: "Dự tính: 12 năm", pins: ["punta"]},
  6: {
    view: V.ca,
    route: ["punta", "darien"],
    year: [1998.9, 2001.15],
    pins: ["darien"],
    chip: "Bị giam 18 ngày ở Panama",
    photo: {src: "stills/karl-bushby/darien.jpg", credit: CC("Päivi & Santeri", "public domain"), mode: "card"},
  },
  7: {
    view: V.vegas,
    cardSide: "left",
    route: ["darien", "lasvegas"],
    year: [2001.15, 2002.6],
    pins: ["lasvegas"],
    flight: {from: "lasvegas", to: [-74.07, 4.71], label: "Bogotá"},
    photo: {src: "stills/karl-bushby/las-vegas.jpg", credit: CC("King of Hearts", "CC BY-SA 4.0"), mode: "card"},
  },
  8: {view: V.na, route: ["lasvegas", "lasvegas"], year: [2002.6, 2002.65], chip: "Bay đi chờ: không phạm luật", sub: "Đường đi bộ không đứt đoạn"},
  9: {
    view: V.bering,
    route: ["lasvegas", "uelen"],
    year: [2002.65, 2006.24],
    pins: ["uelen"],
    photo: {src: "stills/karl-bushby/bering-ice.jpg", credit: "Ảnh vệ tinh: NASA GSFC, public domain", mode: "card"},
  },
  10: {view: V.bering, route: ["uelen", "uelen"], year: [2006.24, 2006.3], pins: ["uelen"], chip: "Biên phòng Nga bắt giữ"},
  11: {view: V.siberia, route: ["uelen", "bilibino"], year: [2006.3, 2008.5], chip: "Visa Nga: 90 ngày một lần"},
  12: {view: midView(PLACE.bilibino, MEXICO, 0.66), route: ["bilibino", "bilibino"], year: [2008.5, 2011.2], chip: "Sang Mexico chờ", sub: "Hơn 2 năm", flight: {from: "bilibino", to: MEXICO, label: "Mexico"}},
  13: {view: midView(PLACE.bilibino, DC, 0.68), route: ["bilibino", "srednekolymsk"], year: [2011.2, 2013.25], chip: "Nga cấm nhập cảnh 5 năm", sub: "Đi bộ 4.800 km tới Washington để phản đối", sidewalk: {points: [LA, [-106.6, 35.1], [-97.5, 35.5], [-90.2, 38.6], [-84.5, 39.1], DC], label: "Washington"}},
  14: {view: V.siberia, route: ["srednekolymsk", "srednekolymsk"], year: [2013.25, 2014.8], chip: "Lệnh cấm được gỡ"},
  15: {view: V.asia, route: ["srednekolymsk", "iran"], year: [2014.8, 2019.6], pins: ["ulaanbaatar", "iran"], chip: "Không có visa Iran"},
  16: {view: midView(PLACE.iran, MEXICO, 0.66), route: ["iran", "iran"], year: [2019.6, 2022.5], chip: "Sang Mexico chờ", sub: "COVID-19", flight: {from: "iran", to: MEXICO, label: "Mexico"}},
  17: {view: V.caspian, route: ["iran", "baku"], year: [2022.5, 2024.8], pins: ["aktau", "baku"], chip: "Bơi 288 km qua biển Caspi"},
  18: {view: V.caspian, route: ["baku", "baku"], year: [2024.8, 2024.85], quote: "“I'm definitely not a swimmer.”", pins: ["baku"]},
  19: {view: midView(PLACE.budapest, MEXICO, 0.66), route: ["baku", "brussels"], year: [2024.85, 2026.45], chip: "Hết 90 ngày Schengen", sub: "Sang Mexico chờ, hai lần", flight: {from: "budapest", to: MEXICO, label: "Mexico"}},
  20: {view: V.channel, route: ["brussels", "grisnez"], year: [2026.45, 2026.72], chip: "Đường hầm: không cho đi bộ", sub: "Luật cấm cả kayak"},
  21: {
    view: V.channel,
    route: ["grisnez", "dover"],
    year: [2026.72, 2026.76],
    pins: ["dover"],
    chip: "Bơi qua eo Manche, 3 ngày",
    photo: {src: "stills/karl-bushby/shakespeare-beach.jpg", credit: CC("Tim Glover", "CC BY-SA 2.0"), mode: "card"},
  },
  22: {
    view: V.england,
    route: ["dover", "hull"],
    year: [2026.76, 2026.84],
    pins: ["hull"],
    chip: "400 km cuối",
    photo: {src: "stills/karl-bushby/homecoming-the-beast.jpg", credit: HULLIAN, mode: "card"},
  },
  23: {
    view: V.england,
    route: ["hull", "hull"],
    year: [2026.84, 2026.84],
    photo: {src: "stills/karl-bushby/homecoming-house.jpg", credit: HULLIAN, mode: "full", focus: "86% 50%"},
  },
  24: {view: V.eurasia, route: ["hull", "hull"], year: [2026.84, 2026.84], bars: true},
  25: {
    view: V.eurasia,
    route: ["hull", "hull"],
    year: [2026.84, 2026.84],
    quote: "“Sorry to keep you waiting.”",
    photo: {src: "stills/karl-bushby/homecoming-photo-op.jpg", credit: HULLIAN, mode: "full", focus: "50% 40%"},
  },
};

export const LABEL: Record<string, string> = {
  punta: "Punta Arenas",
  darien: "Darién",
  lasvegas: "Las Vegas",
  uelen: "Uelen",
  ulaanbaatar: "Ulaanbaatar",
  iran: "Biên giới Iran",
  aktau: "Kazakhstan",
  baku: "Azerbaijan",
  dover: "Dover",
  hull: "Hull",
};
