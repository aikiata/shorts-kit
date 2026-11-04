/**
 * `bun run check` (first half): import boundaries under src/.
 *
 * - a video never imports another video;
 * - a video imports only its own folder, src/shared/ and packages;
 * - src/shared/ never imports a video or a script.
 *
 * A half-built video must never break another video's bundle (§13).
 */
import {readdirSync, readFileSync, statSync} from "node:fs";
import {dirname, join, relative, resolve} from "node:path";
import {p} from "./lib/paths";

const SRC = p("src");
const files: string[] = [];
const walk = (dir: string) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(name)) files.push(path);
  }
};
walk(SRC);

const IMPORT_RE = /(?:import|export)\s[^"']*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|require\(\s*["']([^"']+)["']\s*\)|^\s*import\s+["']([^"']+)["']/gm;
const errors: string[] = [];

for (const file of files) {
  const rel = relative(SRC, file);
  const text = readFileSync(file, "utf8");
  for (const m of text.matchAll(IMPORT_RE)) {
    const spec = m[1] ?? m[2] ?? m[3] ?? m[4];
    if (!spec || !spec.startsWith(".")) continue; // a package
    const target = relative(SRC, resolve(dirname(file), spec));
    if (rel.startsWith("shared/")) {
      if (target.startsWith("videos/")) errors.push(`${rel}: shared code imports a video (${spec})`);
      else if (target.startsWith("..") && !target.startsWith("../docs/soul/")) errors.push(`${rel}: shared code reaches outside src/ (${spec})`);
    } else if (rel.startsWith("videos/")) {
      const video = rel.split("/")[1];
      if (target.startsWith("videos/")) {
        const other = target.split("/")[1];
        if (other !== video) errors.push(`${rel}: video "${video}" imports video "${other}" (${spec})`);
      } else if (!target.startsWith("shared/")) {
        errors.push(`${rel}: video "${video}" imports outside its folder and src/shared (${spec})`);
      }
    }
  }
}

if (errors.length) {
  console.error(errors.map((e) => `✖ ${e}`).join("\n"));
  console.error(`\n${errors.length} boundary error(s). Move shared code to src/shared/<kind>/ (§13).`);
  process.exit(1);
}
console.log(`boundaries ok: ${files.length} files under src/`);
