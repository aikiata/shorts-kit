import {loadFont as loadInter} from "@remotion/google-fonts/Inter";

/**
 * Inter (SIL Open Font License), bundled through @remotion/google-fonts so
 * every machine renders the same glyph widths. A font borrowed from the OS
 * renders differently on another machine and silently moves line breaks,
 * which invalidates every still you reviewed (§6).
 *
 * The loader blocks rendering until the font is ready, so frame 0 never
 * flashes a fallback face. It fetches from Google Fonts on first use; to render
 * offline, put a font file in public/fonts and load it with @font-face here.
 */
let loaded = false;

export const loadFont = () => {
  if (loaded) return;
  loaded = true;
  loadInter("normal", {weights: ["400", "500", "600", "700", "800", "900"], subsets: ["latin", "latin-ext"]});
};
