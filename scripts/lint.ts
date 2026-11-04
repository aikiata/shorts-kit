/**
 * `bun run lint <id>`: the machine half of the SOUL rules, read from
 * docs/soul/thresholds.json, run against narration.json, voice.json, the fact
 * ledger and a light static scan of the video's .tsx files.
 *
 * Errors block (exit 1). Warnings must be read; a warning that is wrong most of
 * the time teaches people to ignore warnings, so each one names its §.
 * The platform length ceiling is printed last, in its own block (§8).
 */
import {existsSync, readdirSync, readFileSync} from "node:fs";
import {join} from "node:path";
import type {Voice} from "../src/shared/timings";
import {ENGINES} from "./lib/engines";
import {loadLedger, type Fact} from "./lib/facts";
import {flatLines, loadNarration, voiceHash, type Narration} from "./lib/narration";
import {p, videoArg, videoDir} from "./lib/paths";
import {checkStoryboard, loadStoryboard} from "./lib/storyboard";
import {loadThresholds, ruleOf} from "./lib/thresholds";
import {phraseRe, sentences, wordCount, words} from "./lib/text";

const id = videoArg("bun run lint <id>");
const T = loadThresholds();
const dir = videoDir(id);
const rawNarration = JSON.parse(readFileSync(join(dir, "narration.json"), "utf8")) as Partial<Narration>;
const n = loadNarration(id);

const errors: string[] = [];
const warnings: string[] = [];
const ref = (key: string) => (ruleOf(key) ? ` (${ruleOf(key)}, ${key})` : "");
const err = (m: string) => errors.push(m);
const warn = (m: string) => warnings.push(m);
const short = (s: string, k = 60) => (s.length > k ? `${s.slice(0, k)}…` : s);

// ------------------------------------------------------------------ schema
if (rawNarration.id !== id) err(`narration.json id is "${rawNarration.id}", folder is "${id}" (§13)`);
const flowFile = rawNarration.flow ? readdirSync(p("docs/flows")).find((f) => f.startsWith(`${rawNarration.flow}-`)) : undefined;
if (!rawNarration.flow) err('"flow" is missing: choose the shape before writing (§2)');
else if (!flowFile) err(`flow "${rawNarration.flow}" has no file in docs/flows/ (§2)`);
const visualIds = readdirSync(p("docs/visuals")).filter((f) => f.endsWith(".md") && f !== "README.md").map((f) => f.replace(/\.md$/, ""));
if (!Array.isArray(rawNarration.visual) || !rawNarration.visual.length) err('"visual" is empty: decide the visual types before the script (SOUL rule 2, docs/visuals/)');
else for (const v of rawNarration.visual) if (!visualIds.includes(v)) err(`visual "${v}" has no file in docs/visuals/`);
if (!rawNarration.language) warn('"language" is missing (BCP-47, e.g. "en")');
if (!ENGINES[n.voice.engine]) err(`voice.engine "${n.voice.engine}" is not one of ${Object.keys(ENGINES).join(", ")} (§4)`);
const [holdMin, holdMax] = T.outroHoldSeconds as [number, number];
if (n.outroHold < holdMin || n.outroHold > holdMax) warn(`outroHold ${n.outroHold} s is outside ${holdMin}–${holdMax} s${ref("outroHoldSeconds")}`);
if (!(n.pause.line >= 0) || !(n.pause.scene >= 0)) err("pause.line and pause.scene must be seconds ≥ 0 (§4)");

const scenes = n.scenes;
if (!scenes.length) err("no scenes");
const seen = new Set<string>();
for (const s of scenes) {
  if (!s.id || !/^[a-z][a-z0-9-]*$/.test(s.id)) err(`scene id "${s.id}" must be lowercase (letters, digits, -)`);
  if (seen.has(s.id)) err(`scene id "${s.id}" is used twice`);
  seen.add(s.id);
  if (!s.lines?.length) err(`scene "${s.id}" has no lines`);
  if (s.hold !== undefined && !(s.hold >= 0)) err(`scene "${s.id}" hold must be seconds ≥ 0`);
  s.lines?.forEach((l, i) => {
    if (!l.text?.trim()) err(`scene "${s.id}" line ${i + 1} is empty`);
    else if (/\bTODO\b/.test(l.text)) err(`scene "${s.id}" line ${i + 1} is still a TODO`);
  });
}
if (scenes.length && scenes[0].id !== "hook") warn(`first scene is "${scenes[0].id}", not "hook" (§2)`);
if (scenes.length && scenes[scenes.length - 1].id !== "share") warn(`last scene is "${scenes[scenes.length - 1].id}", not "share": end on the turn, then a share line (§1)`);

const lines = flatLines(n);
const sceneText = (sid: string) => n.scenes.find((s) => s.id === sid)?.lines.map((l) => l.text).join(" ") ?? "";
const allText = lines.map((l) => l.text).join(" ");

// ------------------------------------------------------------------ facts
let facts = new Map<string, Fact>();
try {
  facts = new Map(loadLedger().facts.map((f) => [f.id, f]));
} catch (e) {
  err(`fact ledger unreadable: ${(e as Error).message}`);
}
const weak = new Set<string>(T.weakEvidenceLevels ?? []);
for (const s of scenes) {
  const used: Fact[] = [];
  s.lines.forEach((l, i) => {
    const at = `scene "${s.id}" line ${i + 1}`;
    if (!l.fact) {
      if (s.id !== "share") warn(`${at} cites no fact: every claim needs a verified record (§9)`);
      return;
    }
    const f = facts.get(l.fact);
    if (!f) return err(`${at} cites ${l.fact}, which is not in docs/facts/facts.json (§9)`);
    used.push(f);
    if (f.status === "unverified") err(`${at} cites ${l.fact}, which is unverified (§9)`);
    else if (f.status === "contested" && !f.caveat) err(`${at} cites ${l.fact}, contested with no caveat (§9)`);
    else if (f.status === "contested") warn(`${at} cites contested ${l.fact}: its caveat must be said on frame or in the description (§9, §11a)`);
  });
  const graded = used.filter((f) => f.evidence);
  if (graded.length && graded.every((f) => weak.has(String(f.evidence)))) {
    const hits = (T.universalWords as string[]).filter((w) => phraseRe(w).test(sceneText(s.id)));
    if (hits.length) warn(`scene "${s.id}" rests only on ${[...new Set(graded.map((f) => f.evidence))].join("/")} evidence but says "${hits.join('", "')}"${ref("universalWords")}`);
  }
}

// ------------------------------------------------------------------ sentence style
type Sent = {scene: string; text: string; words: number};
const sents: Sent[] = lines.flatMap((l) => sentences(l.text).map((text) => ({scene: l.scene, text, words: wordCount(text)})));
const maxW = T.maxWordsPerSentence as number;
for (const s of sents) {
  if (s.words > maxW) {
    err(`scene "${s.scene}": ${s.words} words, limit ${maxW}; split it with a full stop: "${short(s.text)}"${ref("maxWordsPerSentence")}`);
    const silent = (T.silentPunctuation as string[]).reduce((k, m) => k + (s.text.split(m).length - 1), 0);
    if (silent > T.maxSilentInLongSentence) warn(`scene "${s.scene}": a long sentence leaning on ${silent} comma/colon/dash marks, which make no pause${ref("maxSilentInLongSentence")}`);
  }
}
if (sents.length >= 5) {
  const sorted = sents.map((s) => s.words).sort((a, b) => a - b);
  const median = sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
  if (median < T.medianWordsPerSentence) warn(`median sentence is ${median} words (default ${T.medianWordsPerSentence}, measured in another language; re-measure yours)${ref("medianWordsPerSentence")}`);
  const shortShare = sents.filter((s) => s.words <= T.shortSentenceMaxWords).length / sents.length;
  if (shortShare > T.shortSentenceMaxShare) warn(`${Math.round(shortShare * 100)}% of sentences are ${T.shortSentenceMaxWords} words or fewer (max ${Math.round(T.shortSentenceMaxShare * 100)}%)${ref("shortSentenceMaxShare")}`);
  const veryShort = sents.filter((s) => s.words <= 4).length / sents.length;
  if (veryShort > T.veryShortSentenceMaxShare) warn(`${Math.round(veryShort * 100)}% of sentences are 4 words or fewer (max ${Math.round(T.veryShortSentenceMaxShare * 100)}%)${ref("veryShortSentenceMaxShare")}`);
}

for (const ph of T.bannedPhrases as string[]) {
  for (const l of lines) if (phraseRe(ph).test(l.text)) err(`scene "${l.scene}": banned phrase "${ph}"${ref("bannedPhrases")}`);
}
const intensifierHits = (T.intensifiers as string[]).flatMap((w) => allText.match(phraseRe(w)) ?? []);
if (intensifierHits.length > T.intensifiersMax) warn(`${intensifierHits.length} intensifiers (${intensifierHits.join(", ")}), max ${T.intensifiersMax}${ref("intensifiersMax")}`);
const hook = scenes.find((s) => s.id === "hook") ?? scenes[0];
if (hook) for (const ph of T.hookOnlyPhrases as string[]) if (phraseRe(ph).test(sceneText(hook.id))) err(`hook: "${ph}" is banned in the hook${ref("hookOnlyPhrases")}`);

for (const l of lines) {
  for (const mark of T.bannedMarks as string[]) {
    const hit = mark === ":" ? /(?<!\d):|:(?!\d)/.test(l.text) : l.text.includes(mark);
    if (hit) err(`scene "${l.scene}" line ${l.index + 1}: "${mark.trim()}" in spoken text; write a sentence that stands alone: "${short(l.text, 50)}"${ref("bannedMarks")}`);
  }
}

const sw = T.strongWords as {max: number; words: string[]; allowedScenes: string[]};
if (sw?.words?.length) {
  const hits = lines.flatMap((l) => sw.words.flatMap((w) => (l.text.match(phraseRe(w)) ?? []).map((m) => ({m, scene: l.scene}))));
  if (hits.length > sw.max) err(`${hits.length} strong words (${hits.map((h) => h.m).join(", ")}), channel max ${sw.max}${ref("strongWords")}`);
  for (const h of hits) if (!sw.allowedScenes.includes(h.scene)) err(`strong word "${h.m}" in scene "${h.scene}", allowed only in ${sw.allowedScenes.join(", ")}${ref("strongWords")}`);
}

for (const s of scenes) {
  const first = words(s.lines[0]?.text ?? "")[0];
  if (first && (T.pronounOpeners as string[]).includes(first)) warn(`scene "${s.id}" opens with the pronoun "${first}": name the subject in its first sentence${ref("pronounOpeners")}`);
}

const endings = (T.sourceOnlyEndings as string[]).map((e) => new RegExp(`${e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[.!?]*$`, "iu"));
for (const s of sents) if (endings.some((re) => re.test(s.text))) warn(`scene "${s.scene}": a sentence ends on its source; put the source on the frame: "${short(s.text, 50)}"${ref("sourceOnlyEndings")}`);

const DATE_RE = /\b(?:1[0-9]{3}|20\d{2})s?\b|\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b|\b\w+\s+century\b/giu;
let dates = 0;
for (const s of scenes) {
  const k = (sceneText(s.id).match(DATE_RE) ?? []).length;
  dates += k;
  if (k > T.maxDatesPerScene) warn(`scene "${s.id}" has ${k} dates, max ${T.maxDatesPerScene}: telling by chronology${ref("maxDatesPerScene")}`);
}
if (dates > T.maxDatesPerVideo) warn(`${dates} dates in the video, max ${T.maxDatesPerVideo}${ref("maxDatesPerVideo")}`);

for (const s of scenes) {
  const firsts = sents.filter((x) => x.scene === s.id).map((x) => words(x.text)[0]);
  let run = 1;
  for (let i = 1; i <= firsts.length; i++) {
    if (i < firsts.length && firsts[i] === firsts[i - 1]) run++;
    else {
      if (run >= T.maxParallelRun) warn(`scene "${s.id}": ${run} sentences in a row open with "${firsts[i - 1]}"${ref("maxParallelRun")}`);
      run = 1;
    }
  }
}

// four-word moulds across videos, and recap in the payoff
const G = T.repeatGramSize as number;
const grams = (text: string) => {
  const w = words(text);
  const out = new Set<string>();
  for (let i = 0; i + G <= w.length; i++) out.add(w.slice(i, i + G).join(" "));
  return out;
};
const body = (nn: Narration) => nn.scenes.filter((s) => s.id !== "share").map((s) => s.lines.map((l) => l.text).join(" ")).join(" ");
const mine = grams(body(n));
const others = readdirSync(p("src/videos")).filter((v) => v !== id && !v.startsWith("_") && existsSync(join(p("src/videos"), v, "narration.json")));
const counts = new Map<string, string[]>();
for (const v of others) {
  let nn: Narration;
  try {
    nn = loadNarration(v);
  } catch {
    continue;
  }
  for (const g of grams(body(nn))) if (mine.has(g)) counts.set(g, [...(counts.get(g) ?? []), v]);
}
const moulds = [...counts].filter(([, vs]) => vs.length + 1 >= T.repeatGramMinVideos);
for (const [g, vs] of moulds.slice(0, 5)) warn(`"${g}" is also in ${vs.join(", ")}: a mould forming${ref("repeatGramMinVideos")}`);
const payoff = scenes.find((s) => s.id === "payoff") ?? scenes[scenes.length - 2];
if (payoff) {
  const pg = grams(sceneText(payoff.id));
  const echoed = scenes.filter((s) => s.id !== payoff.id && s.id !== "share" && s.id !== "hook" && [...grams(sceneText(s.id))].some((g) => pg.has(g)));
  if (echoed.length >= T.recapMinScenes) warn(`payoff "${payoff.id}" repeats phrases from ${echoed.map((s) => s.id).join(", ")}: is it recapping?${ref("recapMinScenes")}`);
}

// maps and second-language captions
for (const [name, map] of [["pronounce", n.pronounce], ["spelling", n.spelling]] as const) {
  for (const key of Object.keys(map ?? {})) if (!phraseRe(key).test(allText)) err(`${name} "${key}" matches nothing in the script: stale entry or wrong form (§4)`);
}
for (const s of scenes) {
  s.lines.forEach((l, i) => {
    if (l.caption && l.caption.length > T.captionSecondLangMaxChars) err(`scene "${s.id}" line ${i + 1}: second-language caption is ${l.caption.length} characters, max ${T.captionSecondLangMaxChars}; a third line overlaps the main caption${ref("captionSecondLangMaxChars")}`);
  });
}

// ------------------------------------------------------------------ voice.json
const voicePath = join(dir, "voice.json");
let voice: Voice | undefined;
if (!existsSync(voicePath)) err(`no voice.json: run \`bun run tts ${id}\``);
else {
  voice = JSON.parse(readFileSync(voicePath, "utf8")) as Voice;
  if (voice.estimated) err(`voice.json is an estimate (0.33 s/word, no audio): run \`bun run tts ${id}\` (§4)`);
  else {
    if (voice.hash !== voiceHash(n)) err(`voice.json is stale: narration.json or voice settings changed since the last TTS. Run \`bun run tts ${id}\` (§4)`);
    if (!voice.audio || !existsSync(p("public", voice.audio))) err(`audio public/${voice.audio} is missing: run \`bun run tts ${id} --force\``);
    if (!voice.engine.startsWith(n.voice.engine)) err(`voice.json was read by "${voice.engine}", narration.json declares "${n.voice.engine}"`);
  }
  for (const key of Object.keys(n.spelling ?? {})) {
    const leaked = voice.lines.find((l) => phraseRe(key).test(l.text));
    if (leaked) err(`spelling "${key}" still appears in the generated captions (scene "${leaked.scene}")`);
  }
  for (const s of voice.scenes) {
    if (s.end - s.start > T.longSceneSpokenSeconds) warn(`scene "${s.id}" speaks for ${(s.end - s.start).toFixed(0)} s: move ledger detail to the frame${ref("longSceneSpokenSeconds")}`);
  }
  const factSentences = lines.filter((l) => l.scene !== "share" && n.scenes.find((s) => s.id === l.scene)?.lines[l.index]?.fact).reduce((k, l) => k + sentences(l.text).length, 0);
  if (factSentences && !voice.estimated) {
    const per = voice.duration / factSentences;
    if (per > T.factEverySeconds * 1.5) warn(`one fact-bearing sentence every ${per.toFixed(1)} s (target about ${T.factEverySeconds} s)${ref("factEverySeconds")}`);
  }
}

// ------------------------------------------------------------------ static scan of the video's tsx
const tsx = readdirSync(dir).filter((f) => f.endsWith(".tsx"));
const lowerScript = allText.toLowerCase();
for (const f of tsx) {
  const src = readFileSync(join(dir, f), "utf8");
  if (/TemplateScene|TODO-SCENE/.test(src) && f === "scenes.tsx") warn(`${f}: scenes still use the template placeholder`);
  for (const m of src.matchAll(/<(TypeStage|BigCount|Chip|Watermark)\b[^>]*?\btop=\{(\d+)\}/g)) {
    const top = Number(m[2]);
    if (top < T.safeTopPx || top > T.safeBottomPx) warn(`${f}: <${m[1]} top={${top}}> is outside the safe band ${T.safeTopPx}–${T.safeBottomPx}${ref("safeTopPx")}`);
  }
  for (const m of src.matchAll(/\b(kicker|label)=["']([^"']+)["']/g)) {
    if (m[2].length > T.kickerMaxChars) warn(`${f}: ${m[1]} "${m[2]}" is ${m[2].length} characters, max ${T.kickerMaxChars}${ref("kickerMaxChars")}`);
  }
  for (const m of src.matchAll(/<TypeStage\b[^>]*?\btext=["']([^"']+)["']/g)) {
    if (wordCount(m[1]) > T.headlineMaxWords) warn(`${f}: headline "${m[1]}" has ${wordCount(m[1])} words, max ${T.headlineMaxWords}: a sentence belongs to the voice${ref("headlineMaxWords")}`);
  }
  for (const m of src.matchAll(/\b(?:text|label|kicker)=["']([^"']{12,})["']/g)) {
    if (f !== "Cover.tsx" && lowerScript.includes(m[1].toLowerCase())) warn(`${f}: on-frame text "${short(m[1], 40)}" repeats the narration word for word (§7c)`);
  }
  if (sw?.words?.length) for (const w of sw.words) if (phraseRe(w).test(src)) err(`${f}: strong word "${w}" typed into on-frame text; mask it (§7b)`);
}

// on-frame text share: scenes whose component draws a text component
const scenesSrc = existsSync(join(dir, "scenes.tsx")) ? readFileSync(join(dir, "scenes.tsx"), "utf8") : "";
const registry = scenesSrc.match(/export const scenes[^=]*=\s*\{([^}]*)\}/s)?.[1];
if (registry) {
  const pairs = [...registry.matchAll(/([\w-]+|"[^"]+")\s*:\s*(\w+)/g)].map((m) => [m[1].replace(/"/g, ""), m[2]] as const);
  const textual = pairs.filter(([, comp]) => {
    const body = scenesSrc.match(new RegExp(`const ${comp}\\b[\\s\\S]*?(?=\\nconst |\\nexport )`))?.[0] ?? "";
    return /<(TypeStage|BigCount|Chip)\b/.test(body);
  });
  if (pairs.length && textual.length / pairs.length > T.onFrameTextMaxSceneShare) {
    warn(`${textual.length}/${pairs.length} scenes carry on-frame text (${textual.map(([s]) => s).join(", ")}), max ${Math.round(T.onFrameTextMaxSceneShare * 100)}%${ref("onFrameTextMaxSceneShare")}`);
  }
}

if (!existsSync(p("briefs", `${id}.md`))) warn(`no briefs/${id}.md: the brief holds the flow choice, the rejected shape and the visual plan (§2)`);

// ------------------------------------------------------------------ storyboard
// Planned after the voice, approved before scene code (docs/storyboard.md).
{
  const sb = loadStoryboard(id);
  if (sb.error) err(`storyboard.json is not valid JSON: ${sb.error}`);
  else if (!sb.value) {
    if (voice && !voice.estimated) warn(`no storyboard yet: plan the shots before building scenes (bun run storyboard ${id} --init, docs/storyboard.md)`);
  } else {
    for (const i of checkStoryboard(sb.value, lines.length, voice ?? null, visualIds)) (i.level === "error" ? err : warn)(`storyboard: ${i.message}`);
    const todo = sb.value.shots.filter((x) => /TODO/.test(`${x.camera} ${x.onScreen}`)).length;
    if (todo) warn(`storyboard: ${todo} shot${todo > 1 ? "s" : ""} still TODO`);
  }
}

// ------------------------------------------------------------------ report
for (const w of warnings) console.log(`warn   ${w}`);
for (const e of errors) console.log(`error  ${e}`);
console.log(`\nlint ${id}: ${errors.length} errors, ${warnings.length} warnings (${sents.length} sentences, ${lines.length} lines, ${scenes.length} scenes)`);

console.log("");
if (voice && !voice.estimated) {
  const seconds = voice.duration + n.outroHold;
  const [lo, hi] = T.targetDurationSeconds as [number, number];
  if (seconds > T.maxDurationSeconds) {
    console.log(`✖ LENGTH ${seconds.toFixed(1)} s is over the ${T.maxDurationSeconds} s platform ceiling: it will not be a Short${ref("maxDurationSeconds")}`);
    errors.push("length");
  } else {
    console.log(`  length ${seconds.toFixed(1)} s with the outro hold (ceiling ${T.maxDurationSeconds} s; pacing target ${lo}–${hi} s${seconds < lo || seconds > hi ? ", outside it: soft" : ""})`);
  }
} else {
  const est = lines.reduce((k, l) => k + wordCount(l.text), 0) / 2.7;
  console.log(`  length unknown before TTS (≈${est.toFixed(0)} s at 2.7 words/s; ceiling ${T.maxDurationSeconds} s)`);
}
process.exit(errors.length ? 1 : 0);
