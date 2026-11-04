# Colour and type

> Part of [`SOUL.md`](../../SOUL.md). This file holds **§6**. Values live in
> `src/shared/theme.ts` and `src/shared/font.ts`; this file holds the reasons.

---

## 6. Colour [default]

The palette is the source channel's; pick your own. The red-is-rare rule is **[craft]**.

| Role | Default |
| --- | --- |
| Main line, highlight, current caption word | cyan `#2FD8FF` |
| Negation, the punch | red `#FF3B30` |
| Measurement, warning | yellow `#FFCC00` / white |
| Selected region | lime `#B7E04B` |
| Text | white, thick dark outline |
| Text-only backgrounds | near-black `#05080B` |

- **Red is reserved for the punch** ("0 bridges", the struck-out word). Used often,
  it loses its weight: the same economy as the strong word in §1b.
- Colours are a **channel identity**: change them once in `theme.ts`, never per
  video. Scenes import roles (`theme.accent`), not hex codes.
- When a background is uncontrolled (clips, GIFs), the text brings its own contrast:
  outline, shadow, or a dark scrim under it (§5e).

## 6b. Fonts: ship them in the repo, never borrow the OS's [craft; font licence is hard]

The old stack was `-apple-system, BlinkMacSystemFont, "SF Pro Display", …`. On a
Mac it rendered SF Pro; on Windows none of the first four existed, so the browser
fell back to Segoe UI. Same commit, two machines, two typefaces, nothing reported.

It is not only looks. The fallback was **wider**, so a headline that fit on one line
on the Mac wrapped differently elsewhere, and every layout approved by eye on stills
was invalid. Measured pixel by pixel against the Mac render: mean difference 75.4/255
with the system font, 4.9/255 with a bundled font (the residue is anti-aliasing).

- **Bundle the font file** in `public/fonts/` with an open licence (Inter, any OFL
  family that covers your language's diacritics). `public/fonts/README.md` records
  where each file came from and its licence. Do not commit fonts you may not
  redistribute; a system font copied out of an OS is licensed for that OS only.
- **Pin variable-font axes** you depend on (optical size, width, grade) explicitly
  rather than relying on clamping to land on the default.
- **Block rendering until the font has loaded** (`delayRender` in `font.ts`).
  `@font-face` loads asynchronously and the renderer does not wait: the first frames
  draw in the fallback, then jump. It does **not** show in preview, because the font
  is already cached there.
- Swapping the font must be **one file and one line**, never a scene edit.
