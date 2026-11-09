/**
 * `bun run check` step: the bundled SFX pack is described once, in the front matter of its cards
 * (docs/shots/sfx/<id>.md). src/shared/audio/Sfx.tsx must agree with them, and every card must point at
 * a file that exists. Exits 1 on a mismatch, so the code, the docs and the pack cannot drift apart.
 */
import {existsSync, readdirSync, readFileSync} from "node:fs";
import {join} from "node:path";
import {SFX} from "../src/shared/audio/Sfx";
import {p} from "./lib/paths";

const dir = p("docs/shots/sfx");
const front = (file: string): Record<string, string> => {
  const m = /^---\n([\s\S]*?)\n---/.exec(readFileSync(file, "utf8"));
  const out: Record<string, string> = {};
  for (const line of (m?.[1] ?? "").split("\n")) {
    const kv = /^([a-z]+):\s*(.*)$/.exec(line);
    if (kv) out[kv[1]] = kv[2].trim();
  }
  return out;
};
const errors: string[] = [];
const cards = readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "README.md").map((f) => ({f, fm: front(join(dir, f))}));
for (const {f, fm} of cards) {
  if (fm.kind !== "sfx") errors.push(`docs/shots/sfx/${f}: front matter "kind" must be "sfx"`);
  for (const k of ["name", "file", "seconds", "licence", "use", "avoid"]) if (!fm[k]) errors.push(`docs/shots/sfx/${f}: no "${k}" in the front matter`);
  if (fm.file && !existsSync(p("public", fm.file))) errors.push(`docs/shots/sfx/${f}: public/${fm.file} does not exist`);
  const code = SFX[fm.name as keyof typeof SFX];
  if (!code) continue; // a card for a channel's own file: it has no entry in the bundled pack
  if (code.src !== fm.file) errors.push(`${fm.name}: Sfx.tsx src "${code.src}" ≠ card file "${fm.file}"`);
  if (Math.abs(code.seconds - Number(fm.seconds)) > 1e-6) errors.push(`${fm.name}: Sfx.tsx seconds ${code.seconds} ≠ card ${fm.seconds}`);
  if (fm.gain && Math.abs(code.gain - Number(fm.gain)) > 1e-6) errors.push(`${fm.name}: Sfx.tsx gain ${code.gain} ≠ card ${fm.gain}`);
  if (code.use !== fm.use) errors.push(`${fm.name}: Sfx.tsx use "${code.use}" ≠ card "${fm.use}"`);
}
for (const id of Object.keys(SFX)) if (!cards.some((c) => c.fm.name === id)) errors.push(`${id}: in Sfx.tsx but has no card docs/shots/sfx/${id}.md`);
for (const e of errors) console.error(`✖ sfx: ${e}`);
if (errors.length) process.exit(1);
console.log(`sfx ok: ${cards.length} cards match src/shared/audio/Sfx.tsx`);
