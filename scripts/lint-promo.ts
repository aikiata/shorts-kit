/**
 * Lint of a promo with no voice (`bun run lint <id>` routes here when the
 * video has promo.json and no narration.json). Checks the clock and the files
 * it points at; the story rules of SOUL do not apply (docs/promo/).
 */
import {existsSync, readFileSync} from "node:fs";
import {join} from "node:path";
import {promoProblems, promoSeconds, type Promo} from "../src/shared/promo";
import {readMeta} from "./lib/format";
import {p, videoDir} from "./lib/paths";
import {loadThresholds} from "./lib/thresholds";
import {checkPromoStoryboard, loadStoryboard} from "./lib/storyboard";
import {readdirSync} from "node:fs";

export const lintPromo = (id: string): number => {
  const T = loadThresholds();
  const dir = videoDir(id);
  const errors: string[] = [];
  const warnings: string[] = [];
  let promo: Promo;
  try {
    promo = JSON.parse(readFileSync(join(dir, "promo.json"), "utf8")) as Promo;
  } catch (e) {
    console.error(`lint ${id}: promo.json is not valid JSON: ${(e as Error).message}`);
    return 1;
  }
  errors.push(...promoProblems(promo));
  if (readMeta(id).mode !== "promo") errors.push('video.json "mode" must be "promo" for a video with no voice');
  if (promo.music) {
    if (!existsSync(p("public", promo.music.src))) errors.push(`music file public/${promo.music.src} does not exist`);
    else if (!existsSync(p("public/music/README.md"))) warnings.push("no public/music/README.md: record the track's licence before you post (SOUL §8)");
  }
  if (promo.voice?.lines?.length) {
    const rec = join(dir, "voice-lines.json");
    if (!existsSync(rec)) errors.push(`promo.json has voice lines but no voice-lines.json: run \`bun run voice ${id}\``);
    else {
      const have = JSON.parse(readFileSync(rec, "utf8")) as {id: string; text: string; file: string}[];
      for (const l of promo.voice.lines) {
        if (l.only !== undefined && (!Array.isArray(l.only) || !l.only.every((c) => typeof c === "string" && c))) errors.push(`voice line "${l.id}": "only" must be a list of composition ids, e.g. ["Cut16"]`);
        const r = have.find((x) => x.id === l.id);
        if (!r) errors.push(`voice line "${l.id}" is not in voice-lines.json: run \`bun run voice ${id}\``);
        else if (r.text !== l.text) errors.push(`voice line "${l.id}" changed since the audio was made: run \`bun run voice ${id}\``);
        else if (!existsSync(p("public", r.file))) errors.push(`public/${r.file} does not exist: run \`bun run voice ${id}\``);
      }
    }
  }
  // storyboard: planned per scene and beat, approved before scene code (docs/storyboard.md)
  if (!errors.length) {
    const sb = loadStoryboard(id);
    if (sb.error) errors.push(`storyboard.json is not valid JSON: ${sb.error}`);
    else if (!sb.value) warnings.push(`no storyboard yet: plan the shots before building scenes (bun run storyboard ${id} --init, docs/storyboard.md)`);
    else {
      const visualIds = readdirSync(p("docs/visuals")).filter((f) => f.endsWith(".md") && f !== "README.md").map((f) => f.replace(/\.md$/, ""));
      for (const i of checkPromoStoryboard(sb.value, promo, visualIds)) (i.level === "error" ? errors : warnings).push(`storyboard: ${i.message}`);
      const todo = sb.value.shots.filter((s) => /TODO/.test(`${s.camera} ${s.onScreen} ${s.size ?? ""}`)).length;
      if (todo) warnings.push(`storyboard: ${todo} shot${todo > 1 ? "s" : ""} still TODO`);
    }
  }
  const scenesFile = join(dir, "scenes.tsx");
  if (existsSync(scenesFile) && readFileSync(scenesFile, "utf8").includes("TemplateScene")) warnings.push("scenes.tsx still uses the TemplateScene placeholder");
  if (!promo.music) warnings.push("no music: the film needs some audio (music or sfx) or normalize has no track to measure");
  const seconds = errors.length ? 0 : promoSeconds(promo);
  if (seconds > (T.promoMaxDurationSeconds as number)) warnings.push(`length ${seconds.toFixed(1)} s is over ${T.promoMaxDurationSeconds} s (promoMaxDurationSeconds): is this two films?`);
  if (promo.bpm !== undefined && (promo.bpm < 60 || promo.bpm > 200)) warnings.push(`bpm ${promo.bpm} is outside 60 to 200: was it measured, or is it the tracker's half or double?`);

  for (const e of errors) console.log(`error  ${e}`);
  for (const w of warnings) console.log(`warn   ${w}`);
  console.log(`\nlint ${id}: ${errors.length} errors, ${warnings.length} warnings (promo, ${promo.scenes?.length ?? 0} scenes)`);
  if (!errors.length) console.log(`\n  length ${seconds.toFixed(1)} s`);
  return errors.length ? 1 : 0;
};
