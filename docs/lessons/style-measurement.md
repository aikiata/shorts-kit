# Measuring the sentence style of top channels in your niche

The numbers in `thresholds.json` (§3b, §3d) were measured on one channel's niche and
language. This is the method to replace them with yours. Do not tune thresholds by
feel; measure, then write the number and the why.

## What to sample

- **Long-lived channels, not this month's viral one.** A 200k-view video from a
  three-month-old channel proves little. The source pipeline's first sample (nine
  competitors) suggested short sentences were its signature; re-measured on channels
  aged 7–15 years with 300k–5.7M views, none had a median anywhere near it. Short
  sentences turned out to be the sound of a summary.
- **At least ~8 videos from ~4 channels**, and for Shorts, use Shorts, not long-form.
  Long-form channels teach opening rhythm, not length (a 13-minute lecture with a
  median of 19 words is not a model for a 70 s short).
- **Separate registers.** "Teaching over visuals" and "talking to one person" have
  different medians (21–33 vs ~8 in the source sample). Measure the register your flow
  uses.
- **Big channels are not automatically the model.** Their core moves may match yours;
  what they add is often a trailer wrapper (greeter lines, "imagine a simple
  situation", brochure noun stacks, superlative chains, listicle titles, "click the link
  in the corner") that sounds identical across channels. Ban the wrapper; measure the
  core.

## Getting transcripts

```bash
# human-made subtitles where they exist (they have punctuation)
yt-dlp --write-subs --sub-langs en --skip-download -o ".cache/style/%(id)s" <url>
# auto subs as a fallback
yt-dlp --write-auto-subs --sub-langs en --skip-download -o ".cache/style/%(id)s" <url>
```

- **Auto subtitles often have no sentence punctuation**, so sentence length cannot be
  measured on them. Use human subtitles, or transcribe the first 60–120 s with a speech
  recogniser that outputs punctuation.
- **Rolling captions repeat lines**; de-duplicate overlapping lines before counting.
- ASR misspells names; that does not matter for length, it does for phrase counts.
- To study the **picture** (cut rate, on-frame text, opening shot), a multimodal model
  that can watch the video URL is faster than scrubbing by hand; treat its claims about
  on-screen facts as unverified (it can misread on-screen text).

## What to count

| Measure | How | Feeds |
| --- | --- | --- |
| words per sentence: median, p90, max | split on `.!?`; **merge each number into one token** ("nineteen thirty-two" = 1) | `medianWordsPerSentence`, `maxWordsPerSentence` |
| share of sentences ≤ 7 and ≤ 4 words | same split | `shortSentenceMaxShare`, `veryShortSentenceMaxShare` |
| address rate | "you/your" (and "we/us") per 1,000 words | §3b, flow N |
| comparisons | "like", "as if", "imagine" per 1,000 words | §3b |
| definition sentences | "X is a…", "that is,…" per 1,000 words | §3d |
| phrase frequency | for each candidate phrase, the **share of videos** using it | `bannedPhrases`, `hookOnlyPhrases` |
| dates per scene / video | count date expressions | `maxDatesPerScene`, `maxDatesPerVideo` |
| opening seconds | what the first 3 s do: subject, greeting, ad read | §2, `hookOnlyPhrases` |
| cuts per minute, longest shot | from the video, not the transcript | §12 |

Count the same way on your own scripts, so the comparison is fair.

## Turning numbers into thresholds

- **A ceiling is a percentile of the GOOD sample, not of your own scripts.** Using your
  own p90 as a cap calls every naturally long sentence an error and pushes the writing
  toward clipped, flat sentences.
- **Things normal speakers do are not machine text.** Long-lived channels with millions
  of views greet and ask to subscribe mid-video; that is speech, so it is banned only in
  the hook. Phrases that appear in 0–4% of good videos but three times in your script
  are the real signal.
- **A choice of voice is not a law of nature.** Some phrases you ban because your channel
  chose not to sound that way, even if a big video uses them. Write that down as a
  choice, so nobody later cites a measurement to undo it.
- **Check the check.** Run a new phrase list on your existing scripts and read what it
  catches. Substring matching caught words inside other words; a scan with a 65% false
  positive rate teaches people to ignore warnings. Match on word boundaries, keep the
  list narrow, and leave one-word fillers to a human read.
- Record each change with `sk-improve`: the sample (channels, videos, date, seconds
  measured), the numbers, and the threshold you derived.

## A record of your sample

| Date | Channels (age, views) | Videos | Seconds each | Median w/s | p90 | ≤ 7 words | Address /1000 | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
