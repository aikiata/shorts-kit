/**
 * `bun run facts`: validate the ledger in docs/facts/ (§9).
 * Exit 1 on errors. Moving a candidate into `verified` is a human step.
 */
import {loadLedger, validateLedger} from "./lib/facts";

let ledger: ReturnType<typeof loadLedger>;
try {
  ledger = loadLedger();
} catch (e) {
  console.error(`✖ ${(e as Error).message}`);
  process.exit(1);
}
const {facts, sources} = ledger;
const {errors, warnings} = validateLedger(facts, sources);
for (const w of warnings) console.log(`warn   ${w}`);
for (const e of errors) console.log(`error  ${e}`);
const by = (s: string) => facts.filter((f) => f.status === s).length;
if (!facts.length && !sources.length) console.log("the ledger is empty: add records to docs/facts/facts.json and sources.json (docs/facts/README.md)");
console.log(
  `\n${facts.length} facts (${by("verified")} verified, ${by("contested")} contested, ${by("unverified")} unverified) · ${sources.length} sources · ${errors.length} errors · ${warnings.length} warnings`,
);
process.exit(errors.length ? 1 : 0);
