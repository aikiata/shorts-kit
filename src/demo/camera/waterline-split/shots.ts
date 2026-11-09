/**
 * Shot table, one row per narration line (n = line number in `narration.json`).
 *
 * Shape B "a boat on an empty sea" (chosen by the channel owner 03/11/2026): lines 1-19 only
 * have the boat at sea, moons counted at the top of the frame; line 20 pulls the camera out to
 * the globe and the drift line; lines 21-23 stay on the globe.
 */
export type Sky = "day" | "harsh" | "storm" | "grey" | "dusk" | "night" | "dawn";

export type ShotCfg = {
  sky: Sky;
  /** Moons passed, at the start and end of the shot. */
  moons: [number, number];
  chip?: string;
  sub?: string;
  /** The Mexican coast on the horizon: visibility 1 -> 0 during the shot. */
  coast?: [number, number];
  /** Ezequiel on the boat: "sit", "lie", or "fade" (lying, then gone during the shot). */
  ezequiel?: "sit" | "lie" | "fade";
  names?: boolean;
  fishDump?: boolean;
  radio?: boolean;
  plane?: boolean;
  handFish?: boolean;
  birds?: "few" | "many";
  /** Count dry days 1 -> 14, rain at the end of the shot. */
  dryDays?: boolean;
  trash?: boolean;
  ships?: boolean;
  /** Island on the horizon: size 0..1 at the start and end of the shot. */
  island?: [number, number];
  /** Alvarenga jumps off the boat mid-shot. */
  jump?: boolean;
  /**
   * Frame type (default "side": side view).
   * - "under-*": cut across the water surface, the lower half of the frame is the sea below.
   * - "moon": a big moon behind the horizon, boat and people become silhouettes.
   * - "top": seen from above, the boat is a dot in the night sea.
   */
  view?: "side" | "under-deep" | "under-hands" | "under-shells" | "moon" | "top";
  /**
   * Camera for the "side" frame: zoom at the start and end of the shot, look point at the start and end
   * (1080x1920 frame coordinates), handheld shake (px).
   */
  cam?: {z: [number, number]; at?: [number, number]; to?: [number, number]; shake?: number};
  /** From line 20: the globe. */
  globe?: "reveal" | "compare" | "tracers" | "hold";
};

export const SHOT_CFG: Record<number, ShotCfg> = {
  1: {cam: {z: [1, 1.08], at: [540, 900]}, sky: "day", moons: [0, 0], coast: [1, 0.55], chip: "Costa Azul, Mexico", sub: "17/11/2012 · định đi 30 tiếng"},
  2: {cam: {z: [1.12, 1], at: [540, 900]}, sky: "day", moons: [0, 0], coast: [0.55, 0], chip: "14 tháng sau", sub: "mới chạm lại đất liền"},
  3: {cam: {z: [1.45, 1.55], at: [540, 1005]}, sky: "day", moons: [0, 0], ezequiel: "sit", names: true},
  4: {cam: {z: [1.12, 1.2], at: [540, 1000], shake: 9}, sky: "storm", moons: [0, 0], ezequiel: "sit", fishDump: true, chip: "gần 500 kg cá", sub: "đổ xuống biển"},
  5: {cam: {z: [1.22, 1.32], at: [540, 1010], shake: 4}, sky: "storm", moons: [0, 0], ezequiel: "sit", radio: true},
  6: {cam: {z: [1.3, 1.12], at: [540, 660], to: [540, 960]}, sky: "grey", moons: [0, 0], ezequiel: "sit", plane: true, chip: "Tìm kiếm: 2 ngày", sub: "rồi bỏ cuộc"},
  7: {view: "under-deep", sky: "day", moons: [0, 0], ezequiel: "sit", chip: "Xuồng 7 m", sub: "không mui · không buồm · không mái chèo"},
  8: {view: "under-hands", sky: "day", moons: [0, 1], ezequiel: "sit", handFish: true},
  9: {cam: {z: [1, 1.1], at: [700, 1000]}, sky: "day", moons: [1, 1], ezequiel: "sit", birds: "few", chip: "Rùa · sứa · chim biển", sub: "bắt tay không, ăn sống"},
  10: {cam: {z: [1.02, 1.14], at: [540, 1000]}, sky: "harsh", moons: [1, 1], ezequiel: "sit", dryDays: true},
  11: {cam: {z: [1.25, 1.25], at: [520, 1040], to: [760, 1040]}, sky: "day", moons: [1, 2], ezequiel: "sit", trash: true, chip: "Một túi rác trôi", sub: "nửa cái bắp cải · một mẩu kẹo cao su"},
  12: {cam: {z: [1.6, 1.75], at: [440, 1040]}, sky: "dusk", moons: [2, 3], ezequiel: "lie"},
  13: {view: "moon", sky: "night", moons: [3, 4], ezequiel: "lie"},
  14: {view: "moon", sky: "night", moons: [4, 4], ezequiel: "fade", chip: "6 ngày"},
  15: {view: "top", sky: "night", moons: [4, 7], chip: "Đếm bằng tuần trăng"},
  16: {cam: {z: [1, 1.05], at: [540, 900]}, sky: "day", moons: [7, 14], ships: true},
  17: {cam: {z: [1.12, 1], at: [700, 880]}, sky: "dawn", moons: [14, 15], birds: "many", island: [0, 0.35]},
  18: {cam: {z: [1, 1.15], at: [780, 1000]}, sky: "day", moons: [15, 15], island: [0.35, 1], jump: true},
  19: {sky: "day", moons: [15, 15], view: "under-shells", chip: "Vẫn chiếc xuồng rời Mexico", sub: "phủ đầy vỏ sò"},
  20: {sky: "day", moons: [15, 15], globe: "reveal"},
  21: {sky: "day", moons: [15, 15], globe: "compare"},
  22: {sky: "day", moons: [15, 15], globe: "tracers"},
  23: {sky: "day", moons: [15, 15], globe: "hold"},
};
