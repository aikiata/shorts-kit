/**
 * The cut PROPOSAL for a filmed video: fillers, stutters and retakes, each
 * with a reason. It only proposes; the agent reads the review and edits
 * cuts.json before `bun run cut <id>` applies it. Silences are not listed
 * here: `maxGap` shortens every one of them at apply time.
 */
import {bare, endsSentence, removedSet, type Cut, type Cuts, type Transcript} from "./footage";

export type PlanOptions = {
  fillers: string[];
  maxGap: number;
  pad: number;
  /** A retake is a restart of the same 3 words within this many words. */
  retakeWindow: number;
  /** Words below this confidence are flagged in the review (never cut automatically). */
  lowConfidence: number;
};

export const proposeCuts = (t: Transcript, o: PlanOptions): Cuts => {
  const w = t.words;
  const b = w.map((x) => bare(x.text));
  const fill = new Set(o.fillers.map(bare));
  const cuts: Cut[] = [];

  // 1. fillers: a word that is only a filler sound
  w.forEach((x, i) => {
    if (b[i] && fill.has(b[i])) cuts.push({from: i, to: i, reason: "filler"});
  });

  // 2. retakes: the same three words start again soon after; keep the LAST attempt
  const G = 3;
  for (let j = G; j + G <= w.length; j++) {
    const key = b.slice(j, j + G).join(" ");
    if (!key.trim() || b.slice(j, j + G).some((x) => !x)) continue;
    for (let i = Math.max(0, j - o.retakeWindow); i < j; i++) {
      if (b.slice(i, i + G).join(" ") === key) {
        cuts.push({from: i, to: j - 1, reason: "retake", note: `restarts "${w.slice(j, j + G).map((x) => x.text).join(" ")}"`});
        // Skip the rest of the repeated run: every later word of it matches too,
        // and a cut from there would eat the start of the attempt we keep.
        const d = j - i;
        while (j + 1 < w.length && b[j + 1] && b[j + 1] === b[j + 1 - d]) j++;
        break;
      }
    }
  }

  // 3. stutters: one word said twice in a row ("the the"); keep the second
  for (let i = 0; i + 1 < w.length; i++) {
    if (b[i] && b[i] === b[i + 1] && !fill.has(b[i]) && !endsSentence(w[i].text)) cuts.push({from: i, to: i, reason: "false-start", note: "repeated word"});
  }

  return {transcript: t.hash, maxGap: o.maxGap, pad: o.pad, cuts: mergeCuts(cuts)};
};

/** Sort and merge overlapping or touching ranges; the first reason wins, notes join. */
export const mergeCuts = (cuts: Cut[]): Cut[] => {
  const sorted = [...cuts].sort((a, b) => a.from - b.from || b.to - a.to);
  const out: Cut[] = [];
  for (const c of sorted) {
    const last = out[out.length - 1];
    if (last && c.from <= last.to + 1 && (c.reason === last.reason || c.from <= last.to)) {
      last.to = Math.max(last.to, c.to);
      if (c.note && c.note !== last.note) last.note = last.note ? `${last.note}; ${c.note}` : c.note;
    } else out.push({...c});
  }
  return out;
};

/**
 * The transcript as text with the edit marked: [cut words]{reason}, low
 * confidence words with "?", silences over maxGap as ⟨1.4s⟩. One sentence per line.
 */
export const reviewText = (t: Transcript, c: Cuts, lowConfidence: number) => {
  const removed = removedSet(c);
  const reasonAt = new Map<number, Cut>();
  for (const x of c.cuts) reasonAt.set(x.from, x);
  const out: string[] = [];
  let line = "";
  let first = 0;
  let open: Cut | null = null;
  t.words.forEach((w, i) => {
    if (!line) first = i;
    const prev = t.words[i - 1];
    if (prev && w.start - prev.end > c.maxGap) line += ` ⟨${(w.start - prev.end).toFixed(1)}s⟩`;
    const start = reasonAt.get(i);
    if (start) {
      open = start;
      line += ` [${i}:`;
    }
    line += ` ${w.text}${w.p < lowConfidence ? "?" : ""}${w.suspect ? ` ⟪${w.start.toFixed(1)}–${w.end.toFixed(1)}s: words missing?⟫` : ""}`;
    if (open && i === open.to) {
      line += ` ]{${open.reason}${open.note ? `: ${open.note}` : ""}}`;
      open = null;
    }
    if (endsSentence(w.text) && !removed.has(i)) {
      out.push(`${String(first).padStart(4)}  ${line.trim()}`);
      line = "";
    }
  });
  if (line.trim()) out.push(`${String(first).padStart(4)}  ${line.trim()}`);
  return out.join("\n");
};
