# Cover, encode, description, hand-off

> Part of [`SOUL.md`](../../SOUL.md). This file holds **§10 · §11**. The encode spec,
> crop geometry and attribution are **[hard]**; cover content and the description
> shape are **[default]**.

---

## 10. Cover

The cover is **not** a frame grabbed from the video. Every frame of the edit has a
running caption; frozen, it reads as a glitch. The cover is its own composition
(`src/videos/<id>/Cover.tsx`), rendered with `bun run cover <id>`, reusing the
video's world and palette.

### Two constraints decide the layout, and neither is obvious [hard]

1. **The profile grid crops the cover to ~1:1.29.** On 1080×1920 that loses
   **263 px at the top and 263 px at the bottom**. Text outside that band vanishes
   from the profile page: where people actually look at covers.
2. **In the grid the cover is ~200 px wide.** That fits **one number and about three
   words**. Everything else is texture.

Declare the crop as a constant in the cover file, do not eyeball it. Leave the
bottom-left corner free for the view-count badge the platform draws.

**Mandatory check:** export the 1:1.29 crop, scale it to 200 px wide, and look. If
the number is unreadable at that size, the cover has failed, however good it looks
at full size.

### Content [default]

- **One huge number** at the centre: the most **absurd** number of the video.
  Absurd, not big: `0` (a strategy that won a tournament without winning a single
  game) beat every large number. A small number means nothing alone, so press the
  blocks into **one cluster** (`0` / `GAMES WON` / `STILL CAME FIRST`); pressed tight,
  all three survive at 200 px.
- **One short red line** that opens a curiosity gap. Negation ("NOT RUSSIA") is the
  most common way; a paradox works too. Keep the gap, not the grammatical form.
- **No spoiler.** The answer is withheld: usually the *why*, sometimes the *which*.
  "12" and "not Russia" makes people tap to learn which country. Writing the
  explanation closes the gap and steps on the scene that explains it.
- A small kicker on top saying what this is about.
- No logo, no channel name.

### Cover text must stand alone [craft]

A cover read "NOT RUSSIA / and not in Europe either". The owner: "not in Europe. What
does that mean? It's unclear." Three faults from one action: shortening a checked
sentence to fit:

1. **A dropped quantifier changed the claim.** The script said "not *entirely* in
   Europe". Without "entirely" the claim is not vague, it is false.
2. **A dropped subject created an unchecked claim.** The source said "France's
   *largest region* is not in Europe". Dropping the subject from a `verified` claim
   produces an *unverified* one: on the most-read, least-watched surface you have.
3. **A back-referencing word ("either", "also") pointed at the wrong noun.** Both
   readings were wrong, and the reader needs half a second to pick one. On a cover,
   half a second is a swipe.

So: a line with a **quantifier** ("entirely", "largest", "most", "almost") keeps it
or does not go on the cover; no back-referencing connectives; a second line must
**add** information, or it is noise around the thing that must survive 200 px. All
three faults are invisible at 1080 px and at 200 px: they only appear when someone
**reads the line aloud** and asks "meaning what?". Read it aloud.

## 11. Platform encode [hard]

**A raw Remotion render is not ready to upload.** `bun run encode <id>` fixes it:

| Problem | Why | Fix |
| --- | --- | --- |
| full-range pixels (`yuvj420p`) | platforms re-encode as limited range: crushed or washed-out colour | `scale=out_range=tv,format=yuv420p`, tag BT.709 primaries, transfer and matrix |
| odd sample rates (96 kHz) | uploaders may mishandle them | `-ar 48000`, AAC |
| `moov` atom at the end | slow start, some uploaders choke | `-movflags +faststart` |

Output: `out/<id>/<id>-upload.mp4`, H.264, 1080×1920, from the loudness-normalized
file (`out/<id>/<id>-loud.mp4`).

- **Never pipe a long encode into `head`.** `… | head -2` exits after two lines,
  closes the pipe, ffmpeg gets SIGPIPE mid-write, and you get an mp4 with no `moov`
  atom while the command exits 0. It happened twice in one session. Run it directly or
  use `tail`.
- **Always `ffprobe` the final file** before calling it done. "Exit 0" is not proof a
  file opens. Check `pix_fmt=yuv420p`, `color_range=tv`, the BT.709 tags, 48 kHz,
  `moov` before `mdat`, frame count, and loudness re-measured after encode.
- **Size, not existence.** A half-copied file looks exactly like a finished one to
  `ls`. Compare sizes or checksums when files move between machines.
- **Do not infer a version from a file name.** When two renders differ (e.g. a
  per-platform music bed), check by audio correlation of a few seconds: the same
  render correlates ~0.999, a different one ~0.92.

## 11a. Description template [default]

One caption text for every platform, `out/<id>/caption.txt`, written by the agent
from this template (no command generates it). Exactly three parts:

```
<one title line: a debatable claim, not a greeting. ≤ 100 characters>

<note line 1: the mechanism. Why it happened>
<note line 2: the evidence. A date and a number>

#channeltag #topic #topic
```

- **The first line is the only thing shown before "more"**, and on YouTube it becomes
  the **title**, capped at 100 characters. Cut the sentence, never truncate it.
- The two note lines are chosen as **mechanism + evidence**: those are the two things
  most argued in comments.
- **Pre-empt every alternative count.** If any source gives a different number (12
  vs 13 time zones), say so in the description. Said first, it shows careful reading;
  not said, it becomes an error you fight in comments. Facts flagged `mustPreempt`
  list them.
- Captions max **4,000 characters**, and hashtags typed into the same box **count
  toward it**. Few tags: each is a fragile typing step on upload; the channel tag first.
- **Title, description, cover and hashtags stay clean** of strong words (§1b).
- Default: avoid long dashes in descriptions; use commas or colons (they read as
  machine-typed to many viewers).
- Sources in the description are a channel choice (the ledger is the internal trace).
  **Attribution is not a choice** (below).

## 11b. Pinned comment and attribution [hard]

`out/<id>/pinned-comment.txt`, written by the agent: required attributions, verbatim
from each licensor (they often include the data year, which is part of the
requirement), any statement of modification ("cut and looped"), and facts that did
not fit the video.

- **CC BY requires attribution, with no exception for short videos.** If the end frame
  does not carry the credit, it goes in the pinned comment, **posted at the moment of
  publishing**, not the next day. Content-ID-registered music needs its attribution
  as **text** (§8b).
- **Generate credits from the ledger, never retype them.** Look up by the same id the
  ledger uses. A lookup by the wrong key once returned empty, and empty reads exactly
  like "no attribution needed". That is wrong in the most dangerous direction: silent, and
  toward a licence violation.
- **When music or an image changes, update the usage of BOTH the old and the new
  source record.** A gate once demanded credit for a track no longer used; the gate
  was right, the ledger was stale.
- **A gate that reads command output must key on a POSITIVE marker** (a header that
  only prints when there is something to credit), not on filtering lines out. An
  exclusion filter once treated "no source requires attribution" as a missing credit
  and blocked every video that needed none. The instinct was to re-run with `--yes`:
  that disables a working gate to hide a bug.

## 11c. Hand-off files [hard]

A video is done when `out/<id>/` holds all of these:

| File | What |
| --- | --- |
| `<id>-upload.mp4` | the upload file (`bun run encode`) |
| `<id>-cover.png` (+ `.jpg`) | the cover (`bun run cover`) |
| `caption.txt` | description, §11a template |
| `pinned-comment.txt` | attributions and extra facts, §11b |

Intermediates (`<id>.mp4`, `<id>-loud.mp4`, `still-*.png`) may stay next to them.
Without `caption.txt` it cannot be posted; without the cover, platforms pick an
arbitrary frame, and that frame always has a caption running over it. If you render
per-platform variants (different music), each needs its own caption and comment
files, because one variant's music credit must not appear on another.

## 11d. Manual upload notes [hard on TikTok, craft elsewhere]

The kit does not publish. You upload by hand; these lessons were paid for:

- **Upload from the web, not via a phone transfer.** Sending the file to a phone
  (e.g. AirDrop) and posting from the mobile app adds another compression pass.
- **Publish public directly. Do not post private "to flip later".** TikTok cannot
  change a posted video to public; "flipping" means uploading a **second** time, and
  duplicates are suppressed. Same video, same day: first upload 2,092 views, the
  re-upload 20. (A private upload that never went public did not count as a duplicate
  in one observed case.)
- **Re-posting only works if the original never reached the feed.** A deleted
  0-view post re-uploaded did fine; a re-upload of a post that had views died. See
  [`docs/lessons/for-you-distribution.md`](../lessons/for-you-distribution.md).
- **TikTok does not autosave drafts.** Leaving the form halfway loses everything.
- **Paste the pinned comment immediately**: that is where the attribution lives.
- Set the cover explicitly; otherwise the platform picks a frame with captions.
- **Record the link and the visibility** in the brief's "Posted" section. A later
  reader cannot tell a private link from a public one.
