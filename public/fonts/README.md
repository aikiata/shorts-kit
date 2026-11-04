# public/fonts

Empty on purpose. The kit loads **Inter** (SIL Open Font License 1.1) through
`@remotion/google-fonts` in `src/shared/font.ts`, so no font file is committed.

To use another font, put the file here, load it in `src/shared/font.ts` with
`@font-face` + `staticFile("fonts/<file>")`, and change `FONT.sans` in
`src/shared/theme.ts`. Check its licence first: a system font licensed "for use
on this platform" (for example Apple's SF Pro) is not licensed for rendering on
another machine or for redistribution. Record the font and its licence in the
video's credits (§11b) if the licence asks for attribution.
