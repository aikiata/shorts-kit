# Facts: the ledger

> Part of [`SOUL.md`](../../SOUL.md). This file holds **§9**. All of it is
> **[craft]**; the ledger discipline is what lets a channel argue with its comments.

---

## 9. Fact ledger rules

**Every number said or shown must be checkable, and the place to check it is a
structured record, not a sentence in a brief.** Before the ledger, the same number
lived in three places (an ideas file, the brief's fact table, the credits) written
three ways, and nobody could tell when they drifted. Now all three point at one
record.

`docs/facts/facts.json` holds every checked claim; `sources.json` every source.
Facts point to sources **by id**; URLs never sit inside sentences. Schema:
[`docs/facts/README.md`](../facts/README.md). `bun run facts` validates both files;
`bun run lint <id>` fails when a narration line references a fact that is missing or
not `verified` (`contested` is allowed only with a caveat).

### Research: open the source page itself

Every lookup must reach **the source page**, not a summary. A web-search tool that
returns summaries gives you a description of a number, not the place where it lives;
whoever re-opens it later finds a retelling. Use a browser or an extraction tool that
returns the original passage. Paywalled papers: take the abstract via the DOI from
Crossref or OpenAlex. Dead pages: the Wayback Machine. This applies to agents doing
research in the background, which have nobody to remind them mid-task.

### Three statuses, and they do not substitute for each other

| Status | Meaning | On screen? |
| --- | --- | --- |
| `verified` | the source was opened and the number read there | yes |
| `contested` | real, but sources disagree, or the common phrasing is wrong | yes, **with `caveat`**, and pre-empted in the description |
| `unverified` | nobody has checked it | **no**: lint blocks it |

**A popular FALSE claim is an asset, not trash.** The payoff formula denies what the
viewer believes (§1), so a viral claim checked and found wrong *is* a video. Record
the myth as `contested` (or `unverified` if nobody has checked) with a `caveat` that
says plainly it is wrong and why, and record the correction as its own `verified`
fact. Never delete it.

**`status` is about truth; a cut is about a decision.** A true fact can be cut
because it breaks the video; a false one can be the whole video. Note a cut with its
reason (`cutReason`) rather than deleting the record; if it was cut "to save for
another video", reconsider and rewrite the reason when that video comes.

### Rules that do not change

- **Listicles are not sources.** "25 facts that sound fake" pages copy each other
  and their citation chains rarely reach a measurement. Use them to find candidates,
  then go to the original body to pin the number.
- **Source tier goes in the record, not in your head.** 1 = the body or document
  that produced the number, 2 = encyclopaedia, 3 = popular press. A fact on screen
  whose best source is tier 3: soften the wording ("about", "up to") or go upstream.
- **Superlatives carry their definition.** "Only", "largest", "longest" almost always
  have a competing definition. The only *named* sea without a shore; drop "named" and
  you are wrong. State the definition or cut.
- **Hypotheses say they are hypotheses** ("is thought to", "one 2019 study found").
- **Psychology, health and economics have an evidence axis, and the words may not be
  stronger than the evidence.** For geography, `verified` means the number matches a
  measurement. For psychology it only means *the paper says so*, and the field has a
  replication crisis; a single 137-student study and a 38-study meta-analysis are
  both `verified`. Record `evidence` (`official-statistic`, `meta-analysis`,
  `replicated`, `single-study`, `failed-replication`, `review`). The video need not
  name studies or say "a study shows" before every line; the ledger confirms. The
  one requirement: a scene resting only on `single-study` or `review` facts **may
  not use universal words**: "everyone", "humans are wired to", "always", "science
  has proven" (`universalWords`). A failed replication moves the fact to `contested`.
- **Rhetoric is a claim too.** An absolute statement that slips in through the rhythm
  of a sentence rather than the fact table gets challenged in the comments just the
  same. Check the whole script, not only the ledger.
- **Derived numbers declare what they derive from** (`derivedFrom`), so fixing an
  input shows every number that moves with it.
- **Statements about the present carry a date** (`asOf`): news expires faster than
  anything else.
- **Images, footage and music are sources too**, with licence and attribution
  string recorded verbatim from the provider, so credits are generated, not retyped.
  Never use images from a search engine's image results.

### Candidates are not facts

Keep unverified ideas wherever you like (an ideas file, a brief draft). They are
**candidates**; the ledger holds **conclusions**. Moving a candidate into
`facts.json` is a deliberate human step, never an agent's shortcut: an agent that
promotes its own candidates is the fastest way to break the ledger.
