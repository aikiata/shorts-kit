/** Text helpers shared by tts, lint and new. Unicode-aware, word-boundary matching. */

export const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Case-insensitive, whole-phrase regex for a map key or a banned phrase. */
export const phraseRe = (phrase: string, flags = "giu") =>
  new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(phrase).replace(/\s+/g, "\\s+")}(?![\\p{L}\\p{N}])`, flags);

/**
 * Apply a `pronounce` or `spelling` map: whole phrases, any case (§4: the
 * sentence-initial capitalised form is the common one, not the rare one).
 * A capital first letter in the script survives the replacement.
 */
export const applyMap = (text: string, map: Record<string, string> | undefined) => {
  if (!map) return text;
  let out = text;
  for (const key of Object.keys(map).sort((a, b) => b.length - a.length)) {
    out = out.replace(phraseRe(key), (m) => {
      const v = map[key];
      return m[0] && m[0] !== m[0].toLowerCase() && v[0] ? v[0].toUpperCase() + v.slice(1) : v;
    });
  }
  return out;
};

export type Token = {text: string; brk?: "clause" | "sentence"};

const LEAD = /^[\s"'“‘(\[«¿¡]+/u;
const TRAIL = /[\s"'”’)\]»]+$/u;

/**
 * Display tokens of a line: split on whitespace, punctuation stripped from the
 * token and kept as a break marker (§4: tokens carry no punctuation).
 * Inner punctuation stays ("1,000", "don't", "U.S").
 */
export const tokens = (text: string): Token[] => {
  const out: Token[] = [];
  for (const raw of text.split(/\s+/)) {
    let t = raw.replace(LEAD, "").replace(TRAIL, "");
    const m = t.match(/[.!?…,;:—–]+$/u);
    let brk: Token["brk"];
    if (m) {
      brk = /[.!?…]/u.test(m[0]) ? "sentence" : "clause";
      t = t.slice(0, -m[0].length).replace(TRAIL, "");
    }
    if (!t || !/[\p{L}\p{N}]/u.test(t)) {
      // a lone dash or mark: attach its break to the previous token
      if (brk && out.length) out[out.length - 1].brk = out[out.length - 1].brk === "sentence" ? "sentence" : brk;
      continue;
    }
    out.push(brk ? {text: t, brk} : {text: t});
  }
  return out;
};

/** Sentences of a text; the end of the text always closes a sentence. */
export const sentences = (text: string): string[] =>
  text
    .split(/(?<=[.!?…])["'”’)]*\s+/u)
    .map((s) => s.trim())
    .filter((s) => /[\p{L}\p{N}]/u.test(s));

const NUMBER_WORDS = new Set(
  "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred thousand million billion trillion and point".split(
    " ",
  ),
);

/** Lowercase word list; spelled-out and digit numbers count as one word (§3b). */
export const words = (text: string): string[] => {
  const raw = text.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'’.,%-]*/gu) ?? [];
  const cleaned = raw.map((w) => w.replace(/[.,'’-]+$/u, ""));
  const out: string[] = [];
  let inNumber = false;
  for (const w of cleaned) {
    const parts = w.split("-");
    const isNum = /^\d/.test(w) || (parts.every((x) => NUMBER_WORDS.has(x)) && !(w === "and" || w === "point"));
    const joiner = w === "and" || w === "point";
    if (isNum && inNumber) continue;
    if (joiner && inNumber) continue;
    out.push(w);
    inNumber = isNum;
  }
  return out;
};

export const wordCount = (text: string) => words(text).length;
