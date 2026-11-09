/**
 * Shot table, one row per narration line (14 lines in `narration.json`).
 *
 * The main pictures are public domain or CC photos on Wikimedia Commons
 * (`public/stills/loi-nguyen/CREDITS.json`). Every shot pushes in slowly on the photo.
 * `cover` fills the frame; `fit` places a landscape photo mid-frame over a blurred copy of itself.
 * `title` is the topic title card, `mensa-dots` is a drawn data card, no illustration photo.
 */
export type Img = "trinity" | "ground-zero" | "oppenheimer" | "fuger" | "rubens" | "thinker";

export type ShotCfg = {
  img: Img;
  mode?: "cover" | "fit" | "title" | "mensa-dots";
  /** CSS object-position. */
  focus?: string;
  /** Zoom at the start and end of the shot. */
  zoom?: [number, number];
  /** Vertical slide in px, start and end of the shot. */
  pan?: [number, number];
  /** Small label on the picture: name, year. Never contains a profanity. */
  chip?: string;
  /** Extra filter: darker, cooler. */
  grade?: string;
  /** Fire flickering at the bottom edge. */
  fire?: boolean;
};

export const SHOT_CFG: ShotCfg[] = [
  // opening
  {img: "trinity", mode: "fit", zoom: [1.0, 1.15], chip: "16.07.1945 · TRINITY"},
  {img: "trinity", mode: "title", grade: "blur(22px) brightness(0.3)"},
  {img: "oppenheimer", focus: "50% 30%", zoom: [1.05, 1.2], chip: "AMERICAN PROMETHEUS"},
  // myth
  {img: "fuger", focus: "50% 20%", zoom: [1.0, 1.15], pan: [40, -40], chip: "PROMETHEUS", fire: true},
  {img: "rubens", focus: "45% 50%", zoom: [1.0, 1.15], chip: "PROMETHEUS BỊ XÍCH"},
  // oppenheimer
  {img: "ground-zero", mode: "fit", zoom: [1.0, 1.12], chip: "OPPENHEIMER"},
  {img: "oppenheimer", focus: "50% 35%", zoom: [1.1, 1.3], chip: "25.10.1945"},
  {img: "oppenheimer", focus: "50% 35%", zoom: [1.3, 1.45], grade: "grayscale(1) brightness(0.65) contrast(1.1)"},
  {img: "trinity", mode: "fit", zoom: [1.1, 1.2], chip: "1954", grade: "grayscale(1) brightness(0.7)"},
  // science
  {img: "thinker", mode: "mensa-dots", grade: "blur(18px) brightness(0.35)", chip: "MENSA · TOP 2% IQ"},
  {img: "thinker", focus: "45% 40%", zoom: [1.0, 1.15], grade: "brightness(0.9)"},
  {img: "fuger", focus: "60% 8%", zoom: [1.3, 1.5], fire: true, grade: "brightness(0.75)"},
  // close
  {img: "trinity", mode: "fit", zoom: [1.15, 1.3]},
  {img: "fuger", focus: "60% 8%", zoom: [1.45, 1.6], fire: true, grade: "brightness(0.8)"},
];
