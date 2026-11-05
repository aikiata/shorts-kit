import {readFileSync} from "node:fs";
import {p} from "./paths";

export type Fact = {
  id: string;
  claim: string;
  value?: string;
  status: "verified" | "contested" | "unverified";
  sources?: string[];
  caveat?: string;
  checkedAt?: string;
  evidence?: string;
  myth?: boolean;
  [k: string]: unknown;
};
export type Source = {
  id: string;
  title: string;
  url?: string;
  publisher: string;
  licence?: string;
  accessed: string;
  tier?: number;
  role?: string;
  kind?: string;
  attribution?: string;
  [k: string]: unknown;
};

export const loadLedger = () => {
  const read = <T>(f: string): T => {
    try {
      return JSON.parse(readFileSync(p(f), "utf8")) as T;
    } catch (e) {
      throw new Error(`${f}: ${(e as Error).message}`);
    }
  };
  const facts = read<Fact[]>("docs/facts/facts.json");
  const sources = read<Source[]>("docs/facts/sources.json");
  return {facts, sources};
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES = ["verified", "contested", "unverified"];
const ASSET_KINDS = ["image", "footage", "voice", "music", "sfx", "font"];

/** The checks from docs/facts/README.md → "What validation checks". */
export const validateLedger = (facts: Fact[], sources: Source[]) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!Array.isArray(facts)) errors.push("facts.json must be an array");
  if (!Array.isArray(sources)) errors.push("sources.json must be an array");
  if (errors.length) return {errors, warnings};

  const srcIds = new Map<string, Source>();
  for (const s of sources) {
    const at = `source ${s.id ?? "(no id)"}`;
    if (!s.id || !/^s-\d{4,}$/.test(s.id)) errors.push(`${at}: id must look like s-0001`);
    if (srcIds.has(s.id)) errors.push(`${at}: duplicate id`);
    srcIds.set(s.id, s);
    for (const k of ["title", "publisher", "accessed"] as const) if (!s[k]) errors.push(`${at}: missing ${k}`);
    if (s.accessed && !DATE.test(s.accessed)) errors.push(`${at}: accessed must be YYYY-MM-DD`);
    // The channel's own recording (licence "own footage…", "own recording…") has no page to link.
    if (!s.url && !/^own\b/i.test(s.licence ?? "")) warnings.push(`${at}: no url (the page actually opened)`);
    if (s.kind && ASSET_KINDS.includes(s.kind) && !s.licence) errors.push(`${at}: ${s.kind} asset with no licence`);
  }

  const factIds = new Set<string>();
  for (const f of facts) {
    const at = `fact ${f.id ?? "(no id)"}`;
    if (!f.id || !/^f-\d{4,}$/.test(f.id)) errors.push(`${at}: id must look like f-0001`);
    if (factIds.has(f.id)) errors.push(`${at}: duplicate id`);
    factIds.add(f.id);
    if (!f.claim) errors.push(`${at}: missing claim`);
    if (!STATUSES.includes(f.status)) errors.push(`${at}: status must be one of ${STATUSES.join(", ")}`);
    if (!f.checkedAt) errors.push(`${at}: missing checkedAt`);
    else if (!DATE.test(f.checkedAt)) errors.push(`${at}: checkedAt must be YYYY-MM-DD`);
    if (f.status === "verified" && !f.sources?.length) errors.push(`${at}: verified with no sources`);
    for (const sid of f.sources ?? []) if (!srcIds.has(sid)) errors.push(`${at}: cites source ${sid}, which does not exist`);
    if (f.status === "contested" && !f.caveat) warnings.push(`${at}: contested with no caveat; it cannot go on screen until it has one`);
    const tiers = (f.sources ?? []).map((sid) => srcIds.get(sid)?.tier).filter((t): t is number => typeof t === "number");
    if (tiers.length && Math.min(...tiers) >= 3) warnings.push(`${at}: best source is tier 3 (popular press)`);
    if ((f.sources ?? []).length && (f.sources ?? []).every((sid) => srcIds.get(sid)?.role === "candidate-finder")) {
      warnings.push(`${at}: backed only by candidate-finder sources, which may not back an on-screen fact`);
    }
  }
  return {errors, warnings};
};
