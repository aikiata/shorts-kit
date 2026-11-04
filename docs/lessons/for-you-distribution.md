# Why videos get zero views: lessons from a distribution investigation

An investigation file, not rules. It keeps the **dead hypotheses** with the reason
each died, so the next investigation continues instead of starting over. Platform
behaviour changes; re-check anything here against current platform docs.

## The phenomenon

On a new TikTok channel, distribution was **bimodal with nothing in between**:

- 6 videos: 1,095 to 7,358 views.
- 19 videos: **0 to 22 views**. Together they had 206 views; the six had 22,706.

## The finding

**The 19 were never shown in the For You feed at all.** Not shown and swiped past:
never shown. Per video:

| | For You share of traffic | Views came from |
| --- | --- | --- |
| 6 live videos | **94–100%** | For You |
| 19 dead videos | **~0%** (a few 5–26%, where 26% of 21 views is 5 views) | the profile page |

The best-supported explanation: **the account-level SHARE of feed-ineligible content**,
not the quality of each video. TikTok's own policy text says accounts that post a lot
of ineligible content (without breaking rules) may be made ineligible and harder to
find, and may be automatically restored "depending on how much content on your account
isn't suitable for the For You feed". After the owner deleted the dead videos, every
new post got in; on re-measurement the next day, 6 of 6 new posts were in the feed
(87–99% For You), posted 0.5 to 15.6 hours apart.

The vicious circle, if this is right: blocked posts worsen the ratio; a worse ratio
blocks the next posts.

A rough frame from two measurements: just before recovery, 76% of posts were blocked;
one day after cleaning, the account still carried 42–50% non-feed posts and new posts
went through. So "clean everything" is a misreading; a threshold, if there is one, sits
somewhere between. Two alternative readings were not ruled out: the account state, once
restored, sticks until something triggers it again; or the ratio counts only **recent**
posts.

⚠️ This is one observation on one account, not a controlled experiment. It beats the
alternatives only because the alternatives were refuted by data.

## How to measure

- **Read each video's own traffic-source split** (Studio → the video's analytics →
  traffic source). Above ~50% For You: it got into the feed. Below ~10%: blocked at the
  gate. A new post with no views yet: too early.
- **Do not read the ACCOUNT's total traffic source** to judge a video. The total said
  For You 97.3% while 19 videos sat at 0%, because 99% of views belonged to six videos.
  That is exactly how the first pass concluded, wrongly, "not blocked".
- **The interface hides traffic source below 100 views.** Underlying numbers may still
  be readable; use them to tell 0% from not-0%, never 90% from 96%.
- **There is no notification** when a post is excluded from For You, and no field in the
  data that says so. The only measure is that video's For You share.
- Manual tools worth checking: Studio → **Account check** (flags feed eligibility for
  recent posts; "Ineligible for recommendation" under the username means an
  account-level downgrade with an appeal button), and the web Studio's pre-post
  **content check**.

## Dead hypotheses: do not walk these again

| Hypothesis | Died because |
| --- | --- |
| **The content is bad, viewers swipe** | 3-second retention was the SAME in both groups (live 40–65%, dead 41–67%). And the gate closes before distribution: a blocked video has nobody to swipe it |
| **A penalty or strike** | Account check showed "no outstanding issues"; no warning on any dead post's page |
| **The music** | the same bed was on 4 live and 4 dead videos |
| **The upload path** (automation) | 4 videos uploaded by hand on the web were still at 0% |
| **"Post from a phone"** | two of the live videos were posted by hand on the web |
| **Posting cadence, "wait 48 hours"** | refuted: three posts 29 and 77 minutes apart all got in; TikTok says frequency does not matter. It had fit 15/15 posts beautifully: a clean correlation on a small sample can still be a spurious variable |
| **Caption, hashtags, links, length, time of day, visibility** | none separated the two groups |

## Rules that did come out of it

- **A dead post does not come back.** Twelve old 0% posts stayed under 21% For You a day
  later; their only new views came from profile visits. The only way to rescue one is to
  delete and re-post.
- **Re-posting dies only if the original DID reach the feed.** An original with 2,092
  views: the re-upload died (20 views, 0% For You), even re-rendered with new text. An
  original with 0 views, deleted and re-posted: alive (one went from 16 views to 1,832,
  99% For You). An original at 26% of 21 views still counted as "never reached the feed".
- **A private upload that never went public did not count as a duplicate** (one case).
- **Do not post private planning to flip it public**: TikTok cannot change visibility of a
  posted video, so "flipping" is a second upload, i.e. a duplicate (§11d).

## How to keep testing

1. **Keep the ratio healthy**: a post still at ~0% For You after 24 h gets deleted (and,
   if worth it, re-posted). If the hypothesis is right, the account will not fall back.
2. **If it falls back**, measure the share of 0% posts just before the fall. That number
   is what turns the hypothesis into a usable threshold.
3. Untested and expensive: deliberately leave a 0% post up and see if the next one is
   dragged down.

Write your own measurements below, with dates. A hypothesis without its numbers is
what this file exists to prevent.

| Date | Posts on account | Share at ~0% For You | New posts in feed? | Note |
| --- | --- | --- | --- | --- |
