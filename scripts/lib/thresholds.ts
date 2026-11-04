import {readFileSync} from "node:fs";
import {p} from "./paths";

/**
 * `docs/soul/thresholds.json` flattened to `key → value`. Keys starting with
 * `_` are documentation and skipped. Code never hard-codes a threshold.
 */
export type Thresholds = Record<string, any>;

export const loadThresholds = (): Thresholds => {
  const raw = JSON.parse(readFileSync(p("docs/soul/thresholds.json"), "utf8")) as Record<string, {value: unknown}>;
  const out: Thresholds = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k.startsWith("_")) continue;
    out[k] = v && typeof v === "object" && "value" in v ? v.value : v;
  }
  return out;
};

/** The § a threshold belongs to, for messages. */
export const ruleOf = (key: string): string => {
  const raw = JSON.parse(readFileSync(p("docs/soul/thresholds.json"), "utf8")) as Record<string, {rule?: string}>;
  return raw[key]?.rule ?? "";
};
