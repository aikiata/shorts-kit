import {existsSync, readFileSync} from "node:fs";
import {join} from "node:path";
import {DEFAULT_META, FORMATS, type Mode, type Orientation, type VideoMeta} from "../../src/shared/format";
import {die, videoDir} from "./paths";

/** `src/videos/<id>/video.json`: canvas and mode. Absent means a 9:16 short. */
export const readMeta = (id: string): VideoMeta => {
  const file = join(videoDir(id), "video.json");
  if (!existsSync(file)) return DEFAULT_META;
  const raw = JSON.parse(readFileSync(file, "utf8")) as Partial<VideoMeta>;
  const format = raw.format ?? DEFAULT_META.format;
  const mode = raw.mode ?? DEFAULT_META.mode;
  if (!(format in FORMATS)) die(`src/videos/${id}/video.json: format "${format}" must be portrait or landscape`);
  if (mode !== "short" && mode !== "promo") die(`src/videos/${id}/video.json: mode "${mode}" must be short or promo`);
  return {format: format as Orientation, mode: mode as Mode};
};

export const sizeOf = (id: string) => FORMATS[readMeta(id).format];
