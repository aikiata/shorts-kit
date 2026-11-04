# Voice, structure, pacing, sentences, tension

> Part of [`SOUL.md`](../../SOUL.md). This file holds **§1 · §1b · §2 · §3 · §3b ·
> §3c · §3d**. Section numbers are stable: code, briefs and other docs cite them.
>
> Tags: **[measured]** one channel's numbers, re-measure yours · **[default]** taste
> or niche choice · **[craft]** general lesson · **[hard]** platform or licence
> constraint. See "This is your channel's soul" in `SOUL.md`.

---

## 1. Voice: "a serious explainer who actually knows" [default]

Default voice: sound like a person who **really knows the story** and tells it tight, dry and
with authority. Write like a short news feature, not like a status update.

- **Short clauses, clear subjects, numbers.** Authority comes from specifics the
  viewer could check, not from adjectives they cannot.
- **Mock the situation, never the person.** Aim at a person, a people, a
  government and the narrator turns from "someone who knows" into "someone in an
  argument", and every bit of authority built in the serious part is gone. The
  same holds for one-sided villains: someone who admits they ran out of money is
  the strongest detail in a story; bending it into oppression throws it away.
- **No nationalist pride, no travel-brochure voice.** "They turned it into a
  masterpiece" is a tourism article. Tell what happened and let the viewer see it.

**Default payoff formula [default]:** deny what the viewer currently believes, then give
the real reason.
> "The problem was never that they couldn't build it. It's that nobody needed it once it was built."

Use it once per channel-week, not as the ending of every scene; a prescribed
formula wears out exactly like a habit does (§3b).

## 1b. Strong words: an optional, per-channel threshold (default off) [default]

Some channels use one strong word (a swear, a blunt exclamation) as a punch. In the
source pipeline it measurably helped some videos travel. It is a **channel
decision**, not a rule of the kit, so it is a number: `strongWords` in
`thresholds.json`, `max: 0` by default. If you turn it on, the reasoning that made
it work comes with it:

- **It is an accent, not a voice.** Three or four in seventy seconds *become* the
  voice and lose the contrast that made them land. One, and the serious stretch
  around it is as long as it can be. The source channel went from 3–4 per video to
  exactly one for that reason.
- **Exclamation only.** It reacts to a **number** or a **situation**, never to a
  person, a group, a government or an institution (same reason as §1).
- **After the fact, as its own sentence.** Say the number, stop, then react:
  "Six hundred and fifty-five kilometres. Damn." Exclaiming first gives the viewer
  nothing to be shocked by. The full stop is where the caption breaks and where the
  cut lands; glued to the previous sentence you lose both.
- **Where it may go:** one of three places: the hook, the most absurd number, or
  the final line.
- **Never in someone else's mouth.** Not inside a quote, not attributed to a real
  person. That is misquoting.
- **Three channels, three treatments.** Audio: said normally. Captions and every
  on-frame text: masked (§7). Text is read by platform filters, OCR, auto-translate
  and screenshots; the voice is not. Title, description, cover, hashtags: **clean**,
  because strong words there limit distribution and monetisation.
- A second-language caption is something you write, so it is simply never vulgar;
  do not write it dirty and rely on a mask.
- A video can opt out entirely (grief, victims, mental health): the threshold is a
  maximum, and news or tragedy defaults to zero.

## 2. Structure, and choosing a flow [craft]

Every flow shares a skeleton:

| Block | Job |
| --- | --- |
| Hook (~3–10 s) | A question plus one concrete number or image, inside the first 3 seconds. No greeting. |
| Body | The flow's beats (see below). |
| Payoff | Adds one thing not said yet: a consequence, a reversal, or the answer to the hook's question. |
| Share | One sentence inviting the viewer to send it on. |
| Hold | 3–4 s on the last frame after the final word, music already at zero. |

- **The share line: pick one form and keep it verbatim.** The source channel ran
  three slightly different wordings of the same generic line across videos, none
  written on purpose: they drifted. A formula sentence that drifts trains the ear
  on a slightly different rhythm each time. Content-tied lines ("send this to the
  friend who still thinks X") and a fixed generic line are **both unmeasured
  claims**; if you care, compare views across enough videos of each and write the
  number down here.
- **The hold is declared, not assumed** (`outroHold` in `narration.json`). The
  viewer needs a beat to hit share. A loader that silently defaulted it to 0 once
  shipped four videos that cut the instant the voice stopped; nothing reported it.

### The flow set: §2 is not one structure [craft]

The source channel's first six videos were all `hook → 3 reasons → twist → share`,
and "Reason number one / two / three" appeared in seven videos. That is no longer a
style; it is a mould, and a mould forces every fact into the shape "reason" even
when the fact has another shape. So the kit ships a set of flows, each in its own
file with: when to use, rules, traps, a **cases run** table and a change log.

| Flow | Shape | Use when |
| --- | --- | --- |
| [A. Three reasons](../flows/A-three-reasons.md) | hook → reason 1/2/3 → context → payoff | the fact has three truly independent pillars |
| [B. Trace back](../flows/B-trace-back.md) | a claim everyone repeats → who said it first? → walk back link by link → a measurement, or nothing | a viral claim with a traceable citation chain |
| [C. One journey](../flows/C-one-journey.md) | one continuous move A → B, facts arrive as you pass them | a route, a process, a path with a destination |
| [D. Side by side](../flows/D-side-by-side.md) | two things at true scale, the gap between belief and measurement closes | a comparison with one decisive measurement |
| [E. The picture lies](../flows/E-the-picture-lies.md) | the subject is the depiction (or the wording), not the thing | what is drawn or written contradicts what is measured |
| [F. Crossing the border](../flows/F-crossing-the-border.md) | arrives → expensive and foreign → modified → becomes local identity | food, script, instrument, crop with an arrival date |
| [G. A recurring deadline](../flows/G-recurring-deadline.md) | a duty falls due → the times it was missed → what breaks is a relationship | a measurable deadline with recorded misses |
| [H. Explain it](../flows/H-explain-it.md) | set the problem → build layer by layer → the hardest part explained, not hidden → the thing worth remembering | the value is understanding a mechanism |
| [I. The record changed](../flows/I-record-changed.md) | a famous record → it changed on a date → nothing in the world moved, only the definition | a named category whose value changed by definition |
| [J. What was lost](../flows/J-what-was-lost.md) | the place → what it was → how it went → what it left behind, each standing alone → a new idea | a vanished thing whose traces are the interesting part |
| [K. Argument](../flows/K-argument.md) | one sentence everyone has heard → how many holes? → each hole named → summary card → verdict | a social claim that is wrong in nameable ways |
| [L. News explainer](../flows/L-news-explainer.md) | event with date and number → why? → the trigger → root causes layer by layer → what is being done | an event this week with a multi-layer measurable "why" |
| [M. Change one word](../flows/M-change-one-word.md) | a sentence in the viewer's head → hear it → the fault is the label → change one word → measure → limits | a technique viewers can apply to themselves |
| [N. Talking to one person](../flows/N-talking-to-one-person.md) | a misunderstood experience → why it exists → why it overshoots → its cost → change the meaning → clinical line | an experience the viewer already has, misread |
| [O. Reading a graph](../flows/O-reading-a-graph.md) | a character gives the feeling → name it → place it on ONE chart → add to the same chart | a phenomenon that is a place on a curve |
| [P. Empty world, late reveal](../flows/P-empty-world-late-reveal.md) | alone in one scene, time counted by objects → pull out at the end to reveal where | being lost, adrift, stranded |
| [Q. Line and two clocks](../flows/Q-line-and-two-clocks.md) | a route drawn leg by leg + planned vs actual clocks | a planned effort that took far longer than planned |
| [R. One small moment, then pull out](../flows/R-one-scene-then-pull-out.md) | one human moment in one place → its huge consequence on the map | a tiny moment with a historic consequence |
| [S. Name the feeling](../flows/S-name-the-feeling.md) | a familiar scene makes you feel → its name → why → its real origin | a feeling with a name viewers lack |
| [T. Old story, new face](../flows/T-old-story-new-face.md) | a modern scene → a phenomenon named after a myth → the myth → the mapping → one result | a modern figure re-enacting a classic story |

### The library is a default, not a closed list [craft]

You may pick a flow from the library **or invent the shape from the video itself**.
The method that produced flows O–T:

1. Write **at least two candidate shapes** for this video (beats in one line each,
   and what is on screen in each).
2. Pick one, and **record in the brief why the other was rejected**. The rejected
   shape is information: "map from the start" lost the feeling of being lost (P);
   "an 18-minute countdown on a map" lost the human moment (R).
3. If the new shape works once published, **save it as a new flow file** in
   `docs/flows/` (same sections as the others) and add it to this table. A shape no
   video needed is an idea, not a flow.

**Choose before writing**, write why in the brief (and which shape you rejected),
and declare it in `narration.json` (`flow`). `bun run new` requires `--flow`; the linter rejects a
flow that has no file in `docs/flows/`.

⚠️ **Dropping the numbering is not free.** Counting reasons aloud tells viewers
where they are, and that is real retention. Flows without a spoken count must
replace it: a **visible destination** (C), a **countable chain** (B: "this chain has
four links"), **years on an axis** (F, I), or **the order of questions** (H).

## 3. Pacing and fact density

Density and length are **[measured]** defaults; reading-time minimums are **[craft]**.

- **About one fact every 2.5 seconds** (`factEverySeconds`). A 70–80 s video needs
  25+ information beats. Graphics that speak by position are grasped instantly.
- **No frame stands still while the voice is talking** (§12).
- **Length: 60–90 s is the target** (`targetDurationSeconds`); the platform ceiling
  is 180 s (`maxDurationSeconds`). Do not cut sentences in half to force 60 s; cut
  surplus information first.
- **What must be READ gets time, and that time is declared as a number.** "One
  fact per 2.5 s" is right for overlays and wrong for things to read: a real
  photo, a before/after pair, a two-point timeline, a table. A security-camera
  frame shown for 3.8 s drew the comment *"the images flash by too fast, give us
  time to look."* Minimums: one image, one idea ≥ 5 s; two images to compare
  ≥ 8 s; a table or timeline ≥ 6 s. Declare the extra silence after that scene
  rather than stretching shots by hand, so six months later someone can see why
  that scene is longer. Extending a scene extends the whole video: check §8's
  ceilings.

## 3b. Sentence style: fix the words without changing the meaning

The method is **[craft]**; every number and phrase list is **[measured]** in one
niche and language and should be re-measured for yours.

§1 is the voice, §2 the structure, §3 the rhythm. This section is the **sentence**:
which words go, which sentences split, which phrases are already spent.

This is an edit of **words**, not of **meaning**. A style pass that loses a number,
a caveat or a date is a content edit, and goes back to the brief and the ledger.

### Measure first, then set the rule

Do not set sentence-length rules by feel. Measure transcripts of channels in your
niche and language: method in
[`docs/lessons/style-measurement.md`](../lessons/style-measurement.md). What the
source pipeline learned from doing it twice:

- **The first measurement was wrong in a useful way.** The channel's own scripts
  had a median of 11 words per sentence, against 16–24 for nine competitors, and the
  conclusion was "short sentences are our signature". Re-measured on **long-lived**
  channels (7–15 years, 300k–5.7M views per video), none had a median near 11.
  Short sentences were not "the voice of someone who knows": they were **the voice
  of a summary**, which is exactly the "machine-written" feeling the owner
  complained about.
- So limits were raised: the old cap was the channel's own p90, not a property of
  the language. Using your own p90 as a ceiling calls every naturally long sentence
  an error and pushes writers toward clipped sentences: flatter and flatter.
- A later measurement on 1,266 Shorts sentences of six large knowledge channels
  gave the current defaults: **median ~16 words**, mechanism sentences up to ~25
  with "but/because/so" as joints, sentences of ≤ 7 words about **1 in 8**
  (`shortSentenceMaxShare` 0.13), ≤ 4 words about **1 in 25**.
- ⚠️ Those numbers were counted in a language where one word ≈ one syllable. English
  carries the same meaning in fewer words; re-measure for your language before you
  trust `medianWordsPerSentence` and `maxWordsPerSentence`.
- **Two registers, both valid.** *Teaching over visuals* tolerates long sentences
  (medians 21–33 on long-lived channels). *Talking to one person* (flow N) needs
  short ones (a 424k-view example had a median of 8). Choosing the wrong register is
  why a factually right script can still be one nobody listens to.

**Count numbers as one word.** "Nineteen thirty-two" is three tokens and one fact
to the ear. Without merging, every sentence with a date is flagged.

### Machine-checked habits (`thresholds.json`)

1. **Sentence too long** (`maxWordsPerSentence`). Split it with a full stop.
2. **Banned phrases** (`bannedPhrases`). Three families, all measured as the places
   where channels sound identical:
   - *hype*: "mind-blowing", "fascinating", "you won't believe". An adjective the
     viewer cannot check, placed next to a real number, weakens the number.
   - *essay joints*: "furthermore", "moreover", "that being said". That is an essay
     voice, not someone telling a story.
   - *trailer wrapping*: "let's dive in", "did you know", "in today's video",
     "buckle up". Large channels add this wrapper around a good core; ban the
     wrapper, do not learn it.
   Large knowledge channels use each such phrase in 0–4% of their videos; a script
   with two or three is dozens of times denser than they are.
3. **Intensifiers at most once per video** (`intensifiersMax`): really, truly,
   extremely, "not only … but also".
4. **Greetings and calls-to-action are banned in the hook only**
   (`hookOnlyPhrases`). Long-lived channels with millions of views say "hello" and
   "subscribe" mid-video; it is normal speech. The first seconds are the most
   expensive part, so that is the only place it is banned.
5. **Scenes open with a name, not a pronoun.** The first sentence of each scene
   names its subject, not "It", "This", "That". Mid-scene pronouns are fine.
6. **A four-word phrase reused across videos** is a mould forming: exactly how
   "reason number one" grew into seven videos before anyone noticed. The share
   scene and a flow's deliberate counting marker are exempt. When the linter names a
   phrase a § itself prescribes, the fix is the §, via `sk-improve`.
7. **No colons, dashes or "etc." in spoken text** (`bannedMarks`). Narration
   becomes captions, so the marks show on screen, and a sentence leaning on a colon
   ("Hole number one: lumping.") sounds like reading an outline. Write sentences that
   stand on their own ("The first hole is lumping."). They also create no pause (§4).

### Each sentence carries a thing and what it does

- One beat is two sentences: (1) what you are looking at, or what you are saying to
  yourself; (2) what that thing does, to whom, where.
- Every sentence has a noun and a verb. Delete the noun: if the sentence still means
  something, it was not carrying enough.
- Every number gets a sentence that turns it into something visible: "Out of every
  100 cars sold, about 38 were theirs."
- Do not use clipped riddle sentences to manufacture curiosity ("The fault is in the
  mouth."). Viewers read them as machine-written.
- Do not end on a moral ("a symbol of the ultimate sacrifice"). End on a concrete
  result, a usable warning, or a question handed back to the viewer.
- Reading speed for planning: a TTS voice reads ~2.5–3 English words per second
  (~150–180 wpm), so 60 s ≈ 150–180 words. Measure your voice and write it down.

### Contrasts: both sides must be NAMED, and the contrast must be in the ledger [craft]

"One book for show, the other counts everything" is a strong move, and it fails two
ways at once. A real case: the payoff read *"Same fair. Two books. One for show. The
other counted everything."* The owner asked: "two books, what two books?"

1. **Obscure.** The narration never said which two books. The writer knew, from
   the source; the viewer heard a riddle. A contrast may only be used when **both
   sides were named earlier in the narration**, not in the brief, not on a frame
   label, in what the viewer just heard.
2. **Untrue: the heavier failure.** The sentence implied one book was internal
   and leaked. The source said the opposite: both were printed **for display** at an
   exhibition. Counting *was* the showing off, which was the real reversal, stronger
   than the invented one. A style need (a symmetric second half) produced a factual
   error. The ledger stayed clean, because no number was wrong: only the
   **relationship** between two numbers was invented.

Before writing a contrast, ask: has the viewer heard both names? **Which ledger
record holds this contrast?** If you cannot point to one, it is yours, not the
source's: cut it or rewrite it to what the record says. This is a human read: a
machine scan for "the other", "the rest" falsely flagged 13 of 20 hits, and a check
that is wrong two times in three teaches people to ignore warnings.

### Three things worth borrowing from other channels

- **State the viewer's assumption, then break it.** Strong in the hook, stronger
  than an empty question.
- **Redefine the category.** "X is not a Y in the usual sense" opens by rejecting a
  label instead of a number; cousin of flows E and I.
- **Answer right after asking** for small questions between scenes. Viewers leave
  at "you'll see later". (The video's *main* question is the exception: §3c.)

And from long-form channels: learn the **opening rhythm**, not the lecture. Open on
a thing already in motion, put the thesis one sentence later, use on-frame text as a
**label on footage**, not a three-word poster, allow scenes with no text, and let one
metaphor carry a 60–90 s short. Do not learn the 13-minute habits: "we" throughout,
case studies queued up, paper titles on screen, like/share/subscribe.

## 3c. Tension: a correct script can still be flat [craft]

Every check in the kit measures **correct** (§9) and **clean** (§3b). Nothing
measures pull, and every rule added is a rule of **less**: shorter sentences, fewer
fillers, fewer numbers. Scripts get safer and flatter. This section is the missing
half: things a script must **have**. In the source pipeline five consecutive scripts
passed every check and the owner said "the recent scripts aren't dramatic at all,
even though the ideas are fine."

1. **The hook asks; it does not give the final answer.** One draft said "it's an
   impact crater, about twenty-five kilometres wide" in the first 20 seconds; the
   next five scenes explained something the viewer already knew. Small questions
   between scenes are answered at once (§3b); the question of the **whole video** is
   held until the evidence is in.
2. **Every scene ends with a pull**: a question, an unexplained detail, or a
   consequence not yet told ("So how old is the crater?"). Test: read only the
   **last sentence** of each scene and ask: if the viewer swiped away right now,
   would they lose anything? If not, the scene ends flat.
3. **Evidence first, name after.** A scene that opens with its own conclusion
   ("The second hole is survivorship.") turns the rest into illustration. A counting
   marker may still open the scene; the **name** lands after the evidence has made
   the viewer see the fault. On-frame headline appears when the name is spoken.
4. **The payoff never recaps.** Two scripts used the payoff to list the three holes
   again; the climax became the place the viewer re-hears what they just heard.
   Summary cards are the frame's job; the voice uses that time for the verdict. The
   payoff adds something new (consequence, reversal, or the hook's answer) and
   does not jump to a new topic either.
5. **Sources go on the frame, not in the mouth.** A sentence that only says who
   said it ("A memoir from the province recalls.") turns the narrator into a
   librarian. Rule 1 requires every sentence *to have* a source, not *to read it
   out*. Put it in a kicker or a label, and in the description. Exception: when the
   document *is* a character (a treaty whose wording is the story), reading it is
   right.
6. **Every video has at least one moment**: a person (real name, if the ledger has
   it), a place, a time, an action. Tell it slower than the rest; it may be the
   longest scene. Real cases had the moment and buried it: a line about salt being
   the one thing you must carry, left mid-scene after a warehouse figure; the person
   who found the crater on a map called "an astronomy fan". A moment is a fact too:
   no record, no scene.
7. **Rhythm needs contrast.** A run of equally short sentences is as flat as a run
   of long ones. At the important point, build with one long sentence (up to the
   limit), then hit with a short one. A short sentence is only strong next to one
   that is not.

Machine checks (warnings only): payoff that shares distinct four-word phrases with
two or more body scenes (`recapMinScenes`), and sentences that *end* on a reporting
verb (`sourceOnlyEndings`: scanning for words like "memoir" or "study" caught
sentences that carried a fact as well; the sentence-ending pattern is narrower).
Rules 1, 2, 3, 6, 7 are a human read: before TTS, read only the first and last
sentence of each scene, plus the hook and the payoff.

## 3d. The viewer knows nothing [craft; the caps are measured]

The listener is not inside the writer's head and cannot rewind. Measured on 46
scripts: three habits travel together, and no check was looking at them, because
every rule so far was a rule of *less*.

1. **Dates are seasoning, not the spine.** At most 2 dated references per scene,
   8 per video (`maxDatesPerScene`, `maxDatesPerVideo`: the p90 of the source
   channel). Say a year aloud only when it carries a **consequence** (a price
   change, deaths, a border moving). A year that only locates goes on the frame as a
   kicker; the voice tells what happened. The frame carries *where/when*, the voice
   carries *story*; a script that crams both into the mouth breaks both. One
   published scene had two sentences, two dates, five place names and nothing to
   look at.
2. **A term needs a definition, and the definition must be SPOKEN**, in plain words,
   not in another term. If you cannot define it in one sentence, do not use the
   term: tell the mechanism. ("Their consul judged them, by their law" is clear
   without the name *extraterritoriality*.)
3. **A proper noun says what it is at first use**, right there: "Siam, today's
   Thailand". One video said *Thailand* in the hook and switched to *Siam* from
   scene three with nothing joining the names; the viewer heard a second country
   appear mid-video. What has not been named in the narration does not exist yet.
4. **Two machine-text moulds are banned.**
   - **Parallel triplets**: three consecutive sentences opening with the same word
     ("To the west… To the south… To the east…"). An outline wearing a story costume
     (`maxParallelRun`). Three sentences opening with a year are the same habit.
   - **Abstract-noun endings** ("What still shifts is the past."). They sound good,
     carry nothing and **do not translate**. Test: delete every abstract noun from
     the line; if nothing is lost, it was decoration.
   - Their cousin, "not X but Y", already has a limit (§1): once, not as every
     scene's ending.

**The cheapest test in this section:** read only the second-language caption of a
scene (or translate the scene plainly). Stripped of the charm of the original
language, only meaning is left. Would someone who knows nothing about the topic
understand what the scene says? What confuses a local viewer and what confuses a
foreign one are the **same** fault; no translation rescues a script that relies on
things it never said.
