/**
 * `bun run css <id> [--dir <folder>]`: compile a video's Tailwind CSS (src/videos/<id>/<folder>/theme.css,
 * folder `knowns-ui` by default) to <folder>.css next to it. `--dir` is for a product's own components
 * copied into another folder (e.g. `mg-ui`). For a video that uses Knowns UI components (docs/promo/): the
 * components are Tailwind v4 classes, so the stylesheet is built once, offline, and imported
 * by the entry. Re-run after adding a class to a scene or a component.
 */
import {existsSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {die, flag, videoDir} from "./lib/paths";

const args = process.argv.slice(2);
const id = args.find((a, i) => !a.startsWith("-") && args[i - 1] !== "--dir");
if (!id) die("usage: bun run css <id> [--dir <folder>]");
const folder = typeof flag("dir") === "string" ? String(flag("dir")) : "knowns-ui";
if (!/^[a-z0-9][a-z0-9-]*$/.test(folder)) die(`--dir "${folder}" must be a folder name in kebab-case`);
const dir = join(videoDir(id!), folder);
const entry = join(dir, "theme.css");
if (!existsSync(entry)) die(`src/videos/${id}/${folder}/theme.css does not exist`);
const {default: tailwind} = await import("bun-plugin-tailwind");
const built = await Bun.build({entrypoints: [entry], plugins: [tailwind], minify: false, target: "browser", sourcemap: "none"});
if (!built.success) die(`css build failed:\n${built.logs.map(String).join("\n")}`);
const css = await built.outputs[0].text();
writeFileSync(join(dir, `${folder}.css`), css);
console.log(`+ src/videos/${id}/${folder}/${folder}.css  ${(css.length / 1024).toFixed(0)} KB`);
