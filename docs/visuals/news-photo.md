# News photo (§5d): `news-photo`

**Use when** the image is a photo or footage of the EVENT itself (press photo, satellite before/after, CCTV), not a museum artefact and not illustration.

## Trap 1: press photos

The question always asked: "can we use a few real photos and credit the outlet?" **No.**
Crediting is not a licence. Agency photos are not licensed because you name the agency.
The alternative is often **stronger, because it is evidence**: before/after satellite
imagery of the exact place (Sentinel-2, CC BY; Landsat, public domain), which often
reaches Wikimedia Commons within 24–48 h of a major disaster.

## Trap 2: "public domain" on news footage

For artefacts, PD is almost always right because the author died long ago. On news
footage the label often stands on an **argument** (a fixed camera has no creative
author), with a chain of custody through a social post and an "unknown" author. Free
labels are not clean. **And check with your eyes before the licence**: screen
recordings of a CCTV feed carry an outlet's watermark and player controls; used as is,
it reads as theft whatever the licence says. Crop it out or drop it; never cover
someone's credit.

## Trap 3: choosing the frame is an ethical decision

> **Choose the frame that shows the MECHANISM, not the frame that shows the VICTIM.**

The footage had people running from the mudflow; that frame was not used. The frame
used was the moment the flow covered the customs building. A video holding a solemn
voice that shows people about to die breaks its own voice.

## Putting it on screen

- **Credit on the image, in the frame.** Descriptions get cut and copied without it.
- **Reading time is measured** (§3): one image ≥ 5 s, two to compare ≥ 8 s. Bring the
  image in **before** the sentence about it, not on it; an image entering on the last
  sentence of a scene lives only for that sentence's tail (that is how 3.8 s happened).
- **Never stack two panels.** One leaves, then the next enters.
- **Before/after: stack vertically, do not wipe**, unless the two images align pixel
  for pixel. Two sensors at different aspect ratios make a misaligned wipe that reads
  as cheating; a 9:16 frame has the height to stack.
- **Match brightness, only brightness.** One satellite was visibly darker; unmatched,
  "darker" reads as "worse". Never touch saturation or hue: the brown mud streak is the
  evidence.
- **`objectFit: cover` crops the centre**, and the information is rarely in the centre;
  set `objectPosition` to it.
- Panels respect the button column (§7a). Use `<Img>` (§12).

## Change log

| Date | Change | Because of which video |
| --- | --- | --- |
