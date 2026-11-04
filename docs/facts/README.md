# The fact ledger: schema

Two files, one rule: **`facts.json` holds every checked claim, `sources.json` every
source.** Facts point to sources by id; a URL never sits inside a sentence. Both start
as `[]`. Rules and reasons: [`docs/soul/07-facts.md`](../soul/07-facts.md) (§9).

```bash
bun run facts          # validate both files; exit 1 on errors
bun run lint <id>      # also fails when a narration line cites a missing or unusable fact
```

## Fact record (`facts.json`)

```json
{
  "id": "f-0001",
  "claim": "The closest points of Australian and New Zealand territory are about 655 km apart",
  "value": "655 km",
  "status": "verified",
  "sources": ["s-0001", "s-0002"],
  "caveat": "Great-circle distance between outlying islands, not between the main islands",
  "checkedAt": "2026-11-04"
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | ✔ | `f-0001`, `f-0002`, … Never changes once a narration cites it. |
| `claim` | ✔ | The claim in one sentence that stands on its own. |
| `value` | | The number with its unit, as a string (`"655 km"`, `"12–13"`). |
| `status` | ✔ | `verified` · `contested` · `unverified` (below). |
| `sources` | ✔ for `verified` | Ids in `sources.json`. |
| `caveat` | ✔ for `contested` on screen | What must be known before using it. |
| `checkedAt` | ✔ | Date the source was last opened, `YYYY-MM-DD`. |

Optional fields the linter may ignore but people and agents use:

| Field | Meaning |
| --- | --- |
| `evidence` | psychology / health / economics: `official-statistic` · `meta-analysis` · `replicated` · `single-study` · `failed-replication` · `review` · `document`. Weak levels forbid universal words (§9). |
| `derivedFrom` | fact ids this number is computed from. |
| `spokenAs` | how it is said aloud when that differs from `value`. |
| `mustPreempt` | an alternative count the description must mention (§11a). |
| `asOf` | date a statement about the present was true. |
| `myth` | `true` when the record is a popular claim that is wrong. |
| `cutReason` | present = deliberately not used, with the reason. |
| `usedIn` | `[{ "video": "<id>", "scenes": ["hook"] }]`. |

### Statuses

| Status | Meaning | On screen? |
| --- | --- | --- |
| `verified` | the source page was opened and the value read there | yes |
| `contested` | real but sources disagree, or the common phrasing is wrong | yes, **only with `caveat`** |
| `unverified` | nobody has checked it | **no**: lint fails |

**Disproved claims are kept**, not deleted: a popular claim checked and found wrong is
a video. Record it as `contested` (or `unverified` until checked) with `"myth": true`
and a `caveat` that says it is wrong and why, and record the correction as its own
`verified` fact. Narration cites the correction; it may cite the myth only when quoting
it, and then the caveat is mandatory.

## Source record (`sources.json`)

```json
{
  "id": "s-0001",
  "title": "Macquarie Island",
  "url": "https://…",
  "publisher": "Australian Antarctic Division",
  "licence": "© Commonwealth of Australia",
  "accessed": "2026-11-04"
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | ✔ | `s-0001`, … |
| `title` | ✔ | enough to cite it without opening another file |
| `url` | ✔ | the page actually opened (not a search result, not a summary) |
| `publisher` | ✔ | the body behind it |
| `licence` | ✔ for assets | for images, footage, music: the licence name exactly as stated |
| `accessed` | ✔ | `YYYY-MM-DD` |

Optional: `tier` (1 = the body that produced the number, 2 = encyclopaedia, 3 =
popular press), `role` (`candidate-finder` for listicles, which may not back an
on-screen fact; `rejected` for a source considered and dropped, with the reason),
`kind` (`image`, `footage`, `music`, `sfx`, `font`), `attribution` (the provider's
string, **verbatim**, never rewritten), `modified` (e.g. "cut and looped").

## What validation checks

Errors: duplicate ids; a fact citing a source id that does not exist; missing required
fields; a narration line citing a fact that is missing, `unverified`, or `contested`
without a caveat.

Worth warning on (if your linter supports it): best source only tier 3; a source with
no URL; an asset with no licence; a `candidate-finder` backing an on-screen fact.

**Moving a candidate into the ledger is a human step.** An agent that promotes its own
research into `verified` is the fastest way to break the ledger.
