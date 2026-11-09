# Promo aesthetics: rules with precedents

Each rule is **a rule, the case that produced it, and a self-check question**. A rule
without its case cannot be applied to a situation it does not name. The cases come from
real product films that were reworked after feedback, the Knowns UI launch film among them.
Numbers are starting points; re-check them on your own picture.

**Review pass.** Before hand-off, go through every rule and write `✓` or `✗ (shot or
frame)` for each. A rule may be broken on purpose when the style needs it, but every
break is written in the video's brief: which rule, and why. Better still, have a reviewer
who did not make the film do it from a contact strip (`docs/promo/README.md` rule 8).

Tags: **R** rhythm · **Q** picture, camera, composition · **S** sound · **C** clarity.

## Rhythm

**R1. Let the key information breathe: hold the brand mark for a full second.**
Elements that carry the message hold still for at least 1 s before the cut; spend the pause
on the thing to remember (the wordmark landing), not on an ordinary card.
*Case:* a reviewer asked for a pause after the first title and meant the opening and closing
brand animation, not the first text card; the pause was first given to the wrong thing.
*Check:* does every picture the viewer should remember have a fully still moment? Did the pause go to the brand or to a random element?

**R2. Speed comes from acceleration, not from being fast. Group motion gets a physical metaphor and ends with a 0.5 s rest.**
Fly-ins and scrolls use non-linear easing and uneven stagger; constant speed reads as a cheap
slide deck. A batch of similar elements arriving should accelerate hard, best tied to a
physical idea (dealing cards), then stop for 0.5 s once the board is full.
*Case:* "cards should stack faster and faster and pause at the end". An abstract "flood" failed
five rounds; the card-dealing metaphor passed in one.
*Check:* is anything moving at constant speed? Do batches speed up, and is there a rest at the end?

**R3. Slower than you think: slow the first cut by one notch. A main action arc is at least 3 s. Interactions run at human speed.**
Typing, filtering and clicking go at the speed a person really does them, so the viewer can
follow along. Leave hold and rest frames in the timeline budget: a first version is almost
always too fast.
*Case:* across one film, six separate pieces of feedback all said "slow down" or "stay longer";
none ever said "too slow". The opening was slowed until it was a 3 s macro.
*Check:* watch each shot as a first-time viewer: what could you not see? Could you repeat the interaction yourself?

**R4. Beat sync limits timing, not amplitude. Full-frame beat hits at most 3 per film; by default only elements move.**
"Cut on the beat" does not mean "hit the picture on every beat". Anything that acts on the
whole frame or the camera layer (scale pump, shake, flash, negative frame) counts as a big
slam: at most 3 in the film, nailed to the strongest hits in the beat table, at least 16
beats apart. Other beats move only the hero element. A kick table is a pool of candidates,
not a trigger. Beat-pump runs: at most 4 beats at a time, at most once.
*Case:* a film where every kick pumped the whole frame; the picture trembled at beat
frequency and viewers disliked it. (Q3 bans noisy shake; R4 bans beat-rate shake.)
*Check:* play any 8 consecutive beats frame by frame: does the whole frame pulse every beat? Count whole-frame hits: more than 3? Does each match a strongest hit?

## Picture, camera, composition

**Q1. Showing an existing page needs a real capture. Hand-drawn UI is allowed for anything else, if its quality and clarity hold.**
Any shot of a page that already exists starts from a real capture of that page (full-page
texture, element cut-outs, a coordinates file), not a look-alike. Abstract openings, brand
sections and standalone components that are not on any page may be drawn, but they must look
finished and read at a glance; if they do not, go back to captures. Demo data stays only
after the brief confirms it; never customer, personal, internal, key, live or sensitive data.
*Case:* "I want the real page, then add animation": an afternoon of hand-drawn look-alikes
was thrown away. Later the owner relaxed it: not everything must be a screenshot, but quality
and clarity are the bar.
*Check:* is each UI shot copying an existing page (then it is a capture)? Does each drawn piece pass a publishing-quality look? Does the data contain anything unauthorised?

**Q2. In 3D, rasterise UI textures at native size (2-4× the display size) and scale down. Blurry text: check the texture chain first.**
Enlarge with layout-level CSS `zoom`, not `transform: scale`; the browser rasterises 3D layers
at layout width and then scales up on the GPU, which blurs whatever was downsampled first.
Capture full pages at 2×, hero elements at 4×. Depth of field is mood, never the fix for
sharpness. Check by cropping and enlarging frames; thumbnails will not show it.
*Case:* "the card got blurry", "still not sharp", "the first shot's text is still not
solved": three rounds, the first (depth of field) did nothing.
*Check:* in zoomed and perspective shots, are there pixel blocks on letter edges? Is the source at least 2× the display size?

**Q3. Keep the camera steady: no handheld shake in a bright UI promo.**
Camera noise only in dark, documentary-feel pieces, at tiny values, and always checked on
rendered frames.
*Case:* "the view is poor and there is a small shake, I don't know why". Removing handheld
shake ended the complaints; a dark atmospheric film kept a tiny amount untouched.
*Check:* any camera shake with no storytelling reason, on the rendered frames?

**Q4. Glints are rare: never for every element; at most once per shot, for the hero; always clipped to the rounded corner.**
Batch arrivals rely on motion, not on each card flashing. Light that spills outside a
rounded border is the commonest source of a cheap look. The technique is not banned:
a single, hero-only sheen of real quality is fine, and you should ask yourself "is it
beautiful?" at normal speed before delivering.
*Case:* two rejections: "no need for every card to flash", "the light sweep on appear: cancel
it, it's ugly". The owner later said the objection was to that implementation, not the
technique.
*Check:* count glints per film: more than one per shot for the hero? Is each clipped by the corner radius?

**Q5. One hero in the opening: one subject and one complete arc beats a crowd dancing.**
Spotlight, push in, hover, edge light, settle: one element, a full arc.
*Case:* "the first shot should focus on one card and give it more texture". The opening was
torn down six times; once it became a single card it never changed again.
*Check:* how many things does the opening ask the viewer to watch? Is the hero's arc complete (start, middle, landing)?

**Q6. Camera serves readability: information-dense shots face front; close-ups of text sit side-on and level; tilt is decided per shot.**
Emotional shots may tilt. Lists and stacks stay frontal. A card with text in a close-up is
shot from the side horizontally, not from a steep low or high angle. No film-wide camera
style applied by default.
*Case:* a film-wide tilt was rejected ("not well done, and the list page is worse: roll
back"); the list page alone went back to frontal; a hero card was re-shot from the left, not below.
*Check:* for each tilted shot: why is it tilted? Is the text still readable at that angle?

**Q7. A close-up of an object gets the full set: a side tilt, a perceptible height, an orbit, and a dark contrasting material behind it.**
Stack the items so they have volume, move the camera around the stack, then pull back while
the main scene appears.
*Case:* "the camera should shoot from the side at an angle, the stack should have height, then
rotate around it; the whole scene dark with a metallic background; pull back while the
dashboard appears".
*Check:* does the close-up subject have volume and contrast with its setting? Is the camera fixed or does it orbit or pull back?

**Q8. End like a launch: every feature's representative element flies in from all sides around the wordmark, with the film's peak energy.**
For a multi-feature product, the ending is a "family photo": one element per feature flies in
and settles. Match the film's highest energy (crane move, stage light, particles). A first
ending is almost always too timid: add one notch by default.
*Case:* "core elements of each page fly in from different directions to form something like a
group photo", "add more effects, animation, camera, like a product launch".
*Check:* is the ending at the film's energy peak? Does it use one element per feature shown?

## Clarity (C)

A promo is judged by whether a stranger understands it after one viewing. These came from a launch film
for a developer tool that was rebuilt twice: first it toured the product and had no turn, then it had a
turn but a viewer still could not say what the product was for.

**C1. Say it twice: every spoken line has its words on screen at the same moment, in large type.**
Someone watching with the sound off, or half listening, still follows. Anchor each word to the spoken
word (word times from the voice service), not to a guessed frame.
*Case:* the pictures were interface that needed explaining; the voice said it once and the screen
never did.
*Check:* mute the film: can you still tell the story from the type alone?

**C2. One idea per scene, at least 4 s. A scene that needs two glances is two scenes.**
No scene carries a second effect to look at. Voice lines get a breath after them.
*Case:* seven scenes in 24 s, each with its own effect (crash zoom, dimming, slam); a viewer reported
the film was too fast and still not understood.
*Check:* name the one thing each scene says. Any scene that took two sentences to name is split.

**C3. Plain words before product words.** The first time the product appears, a plain sentence says
what it is for ("gives your repository a memory") before any command, JSON, node graph or product name
screen. Names and commands come after the sentence has been read.
*Case:* a tool-call card of JSON arrived before any plain statement; viewers saw code, not "memory".
*Check:* before the first piece of product UI, has a sentence said what it does for the viewer?

**C4. Show the same situation before and after, not a claim.** Monday the decision is made, Friday the
agent has forgotten, next Friday it remembers. The viewer sees a difference and feels the benefit.
*Case:* a film with a good-looking interface from the first frame to the last had no difference to
see, so no turn.
*Check:* can you point at the two frames that show the same situation with the problem and without?

**C5. Every number or counter carries a plain label.** "×14" alone is noise; "Times you explained
this ×14" is a story.
*Check:* does every counter, badge or stat say in words what it counts?

**C6. A repetition beat is only felt if each repeat can be read at least once.** Start slow (the
first repeat held at least 1.5 s), then accelerate (R2). Repeats the viewer cannot read are just noise.
*Case:* repeats that began at 26 frames and shrank to 4 frames, in small bubbles, read as "something
flickers", not "I keep explaining the same thing".
*Check:* can a first-time viewer read the first two repeats in full?

**C7. Type size by job.** The point of a scene: at least 80 px on a 1080 px frame. Mock interface
text: at least 40 px effective. Text from a real web component is web-sized: scale it up 1.5× or more,
or show fewer words, rather than letting 14 px text stand on a phone frame.
*Check:* on a phone-size thumbnail, can every word that matters be read?

**C8. Test comprehension before the build and again after it.** Before: write the plain-language
treatment (scene by scene, what the viewer should understand) and get it confirmed, then show the
animatic (README rule 14) to someone who has not seen it and ask the question below. After: show the
cut to someone who has not seen it and ask "what is this for, and what changes if you use it?" It
passes only when they name the pain, the product and the benefit. Write their answer in the brief.
*Case:* the miss was found by the owner after two full builds; the check costs an hour and would have
caught it.
*Check:* is the stranger's one-sentence summary written down, and does it match the intended one?

(Sound rules S1-S5 and the effect workflow are in [`sound.md`](sound.md); the bundled pack is
in `docs/shots/sfx/`, loudness and music in `docs/soul/06-audio.md`.)
