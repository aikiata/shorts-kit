/**
 * `bun run capture <id> <url> --name <n> [--width 1440 --height 900 --scale 2 --full --wait 1500 --dark]
 *                           [--select "css1,css2"] [--mobile] [--list] [--hide "css1,css2"] [--type "css=text"]`
 *
 * Real pixels of a real page for a promo (docs/promo/ rule 2): Chrome (the one
 * Remotion already downloaded) renders the page at `scale` × device pixels and
 * writes public/capture/<id>/<name>.png. With --select, each CSS selector also
 * gets its own cut-out <name>-<n>.png, and layout.json records every box.
 * A manifest (src/videos/<id>/capture.json) records url, date and size, so the
 * licence check and the credits line can be written from it.
 *
 * A state the URL does not hold: --type focuses the element matching `css` and types `text` into it (as a person
 * would, so the page's own search runs); --hide removes overlays such as a consent banner from the picture without
 * answering them (never accept a consent banner to get a clean shot).
 *
 * A third-party page is a third-party image (SOUL §5): check the licence at the
 * brief, and write it in --licence. This tool does not decide it for you.
 */
import {mkdirSync, readFileSync, writeFileSync, existsSync} from "node:fs";
import {join} from "node:path";
import {openBrowser} from "@remotion/renderer";
import {die, flag, p, videoDir} from "./lib/paths";

const positional = process.argv.slice(2).filter((a, i, all) => !a.startsWith("-") && !/^--(name|width|height|scale|wait|select|licence|hide|type)$/.test(all[i - 1] ?? ""));
const [id, url] = positional;
const usage = "usage: bun run capture <id> <url> --name <n> [--width 1440 --height 900 --scale 2 --full --wait 1500 --dark --mobile --select \"css,css\" --hide \"css,css\" --type \"css=text\" --licence \"text\"]";
if (!id || !url) die(usage);
if (!existsSync(videoDir(id))) die(`no video "${id}": src/videos/${id}/ does not exist`);
const name = String(flag("name") ?? "page");
if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) die(`--name "${name}" must be lowercase kebab-case`);
const mobile = flag("mobile") !== undefined;
const width = Number(flag("width") ?? (mobile ? 430 : 1440));
const height = Number(flag("height") ?? (mobile ? 932 : 900));
const scale = Number(flag("scale") ?? (mobile ? 3 : 2));
const wait = Number(flag("wait") ?? 1500);
const full = flag("full") !== undefined;
const dark = flag("dark") !== undefined;
const selectors = typeof flag("select") === "string" ? String(flag("select")).split(",").map((s) => s.trim()).filter(Boolean) : [];
const hide = typeof flag("hide") === "string" ? String(flag("hide")) : "";
const typeArg = typeof flag("type") === "string" ? String(flag("type")) : "";
const typeAt = typeArg.lastIndexOf("="); // the last "=": a selector may hold one ([type=search])
if (typeArg && typeAt < 1) die(`--type wants "css=text", got "${typeArg}"`);
if (![width, height, scale, wait].every((n) => Number.isFinite(n) && n > 0)) die(usage);

const outDir = join(p("public/capture"), id);
mkdirSync(outDir, {recursive: true});

const browser = await openBrowser("chrome", {chromiumOptions: {}});
try {
  const page = await browser.newPage({context: {} as any, logLevel: "error", indent: false, pageIndex: 0, onBrowserLog: null, onLog: () => {}});
  const rawCdp = (page as any)._client() as {send: (m: string, a?: object) => Promise<any>};
  // Remotion's CDP wrapper returns {value: <result>}
  const cdp = {send: async (m: string, a?: object) => { const r = await rawCdp.send(m, a); return r && typeof r === "object" && "value" in r ? r.value : r; }};
  await cdp.send("Emulation.setDeviceMetricsOverride", {width, height, deviceScaleFactor: scale, mobile});
  if (dark) await cdp.send("Emulation.setEmulatedMedia", {features: [{name: "prefers-color-scheme", value: "dark"}]});
  await page.goto({url, timeout: 60_000, options: {}} as any);
  await page.evaluate(() => (document as any).fonts?.ready);
  await new Promise((r) => setTimeout(r, wait));
  // scroll to the bottom and back so lazy images and reveal-on-scroll sections load
  await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += window.innerHeight / 2) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
    window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 300));
  });
  await new Promise((r) => setTimeout(r, wait));
  if (hide) {
    await page.evaluate((css: string) => {
      const st = document.createElement("style");
      st.textContent = `${css} { display: none !important; }`;
      document.head.appendChild(st);
    }, hide);
  }
  if (typeArg) {
    const sel = typeArg.slice(0, typeAt);
    const found = await page.evaluate((s: string) => {
      const el = document.querySelector(s) as HTMLElement | null;
      el?.focus();
      return !!el;
    }, sel);
    if (!found) die(`--type: selector "${sel}" matched nothing`);
    await cdp.send("Input.insertText", {text: typeArg.slice(typeAt + 1)});
    await new Promise((r) => setTimeout(r, wait));
  }

  if (flag("list") !== undefined) {
    // print the page's sections (selector, top, height, heading) so --select can name them
    const rows = (await page.evaluate(() => {
      const sel = (el: Element) => (el.id ? `#${el.id}` : el.tagName.toLowerCase() + (typeof el.className === "string" && el.className ? "." + el.className.split(/\s+/).filter(Boolean).slice(0, 2).join(".") : ""));
      return [...document.querySelectorAll("main > *, section")].map((el) => {
        const r = el.getBoundingClientRect();
        return {sel: sel(el), y: Math.round(r.top + window.scrollY), h: Math.round(r.height), heading: el.querySelector("h1,h2")?.textContent?.trim().slice(0, 60) ?? ""};
      });
    })) as {sel: string; y: number; h: number; heading: string}[];
    for (const r of rows) console.log(`${String(r.y).padStart(6)} ${String(r.h).padStart(5)}  ${r.sel}  ${r.heading}`);
    await browser.close({silent: true});
    process.exit(0);
  }
  const shot = async (file: string, clip?: {x: number; y: number; width: number; height: number}) => {
    const r = await cdp.send("Page.captureScreenshot", {format: "png", captureBeyondViewport: true, ...(clip ? {clip: {...clip, scale: 1}} : {})});
    writeFileSync(file, Buffer.from(r.data, "base64"));
  };
  const metrics = await cdp.send("Page.getLayoutMetrics");
  const content = metrics.cssContentSize ?? metrics.contentSize;
  const pageW = Math.round(content.width);
  const pageH = Math.round(content.height);
  const clip = full ? {x: 0, y: 0, width: pageW, height: pageH} : {x: 0, y: 0, width, height};
  await shot(join(outDir, `${name}.png`), clip);

  const boxes: Record<string, unknown> = {};
  for (let i = 0; i < selectors.length; i++) {
    const sel = selectors[i];
    const rect = (await page.evaluate((s: string) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height};
    }, sel)) as {x: number; y: number; width: number; height: number} | null;
    if (!rect) { console.warn(`! selector "${sel}" matched nothing`); continue; }
    const file = `${name}-${i + 1}.png`;
    await shot(join(outDir, file), rect);
    boxes[sel] = {file, ...rect};
  }
  writeFileSync(join(outDir, `${name}.layout.json`), `${JSON.stringify({url, width, height, scale, page: {width: pageW, height: pageH}, boxes}, null, 2)}\n`);

  const manifestPath = join(videoDir(id), "capture.json");
  const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {captures: []};
  manifest.captures = (manifest.captures as {name: string}[]).filter((c) => c.name !== name);
  manifest.captures.push({name, url, capturedAt: new Date().toISOString().slice(0, 10), viewport: `${width}x${height}@${scale}x${mobile ? " mobile" : ""}${full ? " full" : ""}`, licence: String(flag("licence") ?? "UNCHECKED: write it at the brief (SOUL §5)")});
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`+ public/capture/${id}/${name}.png  (${full ? `${pageW}x${pageH} css px` : `${width}x${height} css px`} at ${scale}x)${selectors.length ? `, ${Object.keys(boxes).length}/${selectors.length} cut-outs` : ""}`);
} finally {
  await browser.close({silent: true});
}
