import {existsSync, mkdirSync} from "node:fs";
import {join} from "node:path";

export const ROOT = join(import.meta.dir, "..", "..");
export const p = (...parts: string[]) => join(ROOT, ...parts);

export const videoDir = (id: string) => p("src/videos", id);
export const outDir = (id: string) => p("out", id);
export const audioDir = (id: string) => p("public/audio", id);
export const cacheDir = (id: string) => p(".cache/tts", id);

export const ensureDir = (dir: string) => {
  mkdirSync(dir, {recursive: true});
  return dir;
};

/** Ids are folder names and file prefixes everywhere (§13): lowercase kebab-case. */
export const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const die = (msg: string): never => {
  console.error(`✖ ${msg}`);
  process.exit(1);
};

/** The `<id>` argument of a command, checked to be an existing video folder. */
export const videoArg = (usage: string): string => {
  const id = process.argv.slice(2).find((a) => !a.startsWith("-"));
  if (!id) die(`usage: ${usage}`);
  if (!existsSync(join(videoDir(id!), "narration.json")) && !existsSync(join(videoDir(id!), "promo.json"))) {
    die(`no video "${id}": src/videos/${id}/narration.json (or promo.json) does not exist`);
  }
  return id!;
};

export const flag = (name: string): string | true | undefined => {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === `--${name}`) {
      const next = args[i + 1];
      return next && !next.startsWith("-") ? next : true;
    }
    if (a.startsWith(`--${name}=`)) return a.slice(name.length + 3);
  }
  return undefined;
};

/** A promo with no voice: its clock is promo.json and it has no narration.json. */
export const isVoiceless = (id: string): boolean =>
  existsSync(join(videoDir(id), "promo.json")) && !existsSync(join(videoDir(id), "narration.json"));
