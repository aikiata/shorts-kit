/**
 * `bun run model <name> [--no-preview]`: build a procedural 3D model with Blender, headless.
 * Runs scripts/blender/<name>.py, which writes public/models/gen/<name>.glb (and a preview PNG in
 * out/blender-preview/ unless --no-preview). Needs `blender` on PATH (docs/visuals/3d-explainer.md).
 */
import {existsSync} from "node:fs";
import {die, p} from "./lib/paths";

const name = process.argv.slice(2).find((a) => !a.startsWith("-"));
if (!name) die("usage: bun run model <name> [--no-preview]   (a script in scripts/blender/<name>.py)");
const script = p("scripts/blender", `${name}.py`);
if (!existsSync(script)) die(`no scripts/blender/${name}.py`);
const which = Bun.spawnSync(["which", "blender"]);
if (which.exitCode !== 0) die("blender is not on PATH: install Blender (brew install --cask blender) and try again");
const extra = process.argv.includes("--no-preview") ? ["--", "--no-preview"] : [];
const r = Bun.spawnSync(["blender", "-b", "--factory-startup", "-P", script, ...extra], {stdout: "pipe", stderr: "pipe"});
const out = `${r.stdout.toString()}\n${r.stderr.toString()}`;
for (const line of out.split("\n")) if (/^(wrote|preview)\s/.test(line) || /Error|Traceback/.test(line)) console.log(`  ${line}`);
if (r.exitCode !== 0 || !existsSync(p("public/models/gen", `${name}.glb`))) die(`blender failed (exit ${r.exitCode}); run it directly to see why: blender -b -P scripts/blender/${name}.py`);
console.log(`+ public/models/gen/${name}.glb`);
