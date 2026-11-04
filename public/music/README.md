# public/music

Empty on purpose: no music is committed, because almost no music licence allows
redistribution in a public repository, even when it allows use in videos.

Put your bed here (`public/music/<file>.mp3`) and pass it to `ShortsTemplate`
as `music={{src: "music/<file>.mp3"}}`. Before the first video that uses a track,
read §8 (`docs/soul/06-audio.md`):

- record the licence per track, verbatim, in `docs/facts/sources.json`
  (`kind: "music"`), and check it holds on every platform you post to;
- "royalty-free" or "DMCA-free" on a store page says nothing about Content ID;
  a registered track can block a video worldwide;
- CC BY means the credit line is mandatory, in the pinned comment or on frame;
- a play-once bed must be longer than the video minus the outro hold.

Add the file name to `.gitignore` if you keep your repository public.
