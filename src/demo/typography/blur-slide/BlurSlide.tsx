// blur-slide: Blur Slide word-by-word entrance (second-round redesign: editorial layout poster)
// Technique unchanged: the title enters word by word, with y displacement + blur + opacity sharing one progress p and converging in sync on the same easing
// (the word "surfaces from out of focus", it does not "slide in and fade a bit"); the subtitle follows staggered before the title finishes, and the overlap reads as one sentence.
//
// Design decisions
// - look: paper (warm white paper · ink · vermilion). Editorial layout context: magazine masthead + big serif title + sans-serif subtitle,
//   left-aligned on a grid with a 168px safe margin, white space on the right lets the title's tail breathe.
// - Hierarchy: masthead 24px all caps (texture level) → section eyebrow 30px vermilion all caps → main title 170px serif, two lines →
//   subtitle 46px sans-serif. The main/sub size ratio is 3.7x; weight-400 serif vs weight-400 sans-serif are distinguished by font family.
// - The accent color goes to one word only: the italic 'cinematic.' on the second line is vermilion; it settles last and has a longer entrance window (the hero).
// - Copy: main 5 words 'Make every launch / feel cinematic.', sub 9 words (shorts-kit's promo line); the masthead is the shorts-kit wordmark.
//
// Timeline (30fps, 120f)
//   0–24   masthead and hairline already on screen (first frame not empty), hairline drawn left to right (snappy 24f)
//   4–22   section eyebrow enters with blur-slide (same family as the technique, serves as "prep")
//   10–40  main title line 1, 3 words, 4f between words, 22f each
//   26–58  line 2: pause 6f for a breath first, "feel" 22f, "cinematic." 30f (settles last, letter-spacing tightens on the same p)
//   34–80  subtitle 9 words, 2.4f between words, 20f each, smaller displacement/blur: hierarchy comes from amplitude, not duration; overlaps the main title by 24f
//   72–98  footer hairline drawn right to left + page number fades in (aftermath of the hold segment, closing the layout into a complete page)
//   80–119 settle hold 40f: the whole group pushes in very slowly 1→1.03 (smooth, zero speed at start and end) + the paper key light breathes very slowly
// Curve: all three channels share EASE.out (quint-out class), fast start, long tail, so words "float" up rather than "pop" up.
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { LOOKS, SERIF, Stage, alpha } from '../../../shared/fixtures/Look';
import { EASE, FONT, ramp } from '../../../shared/fixtures/Polish';
import { ShortKitWordmark } from '../../../shared/fixtures/Brand';

export const BLUR_SLIDE_DURATION = 120; // 4000ms @30fps

const L = LOOKS.paper;
const LEFT = 168; // left safe margin / grid origin

// Word: start = start frame, dur = entrance duration, dy = displacement (px), blur = max blur (px).
// opacity / translateY / blur (and optional letter-spacing) are all bound to the same p: the core of this card, must not be split into multiple easings.
type Word = { text: string; start: number; dur: number; style?: React.CSSProperties; track?: [number, number] };

const Words: React.FC<{ words: Word[]; dy: number; blur: number; gap: string; style: React.CSSProperties }> = ({ words, dy, blur, gap, style }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap, whiteSpace: 'nowrap', ...style }}>
      {words.map((w, i) => {
        const p = ramp(frame, w.start, w.dur, EASE.out);
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: p,
              transform: `translateY(${((1 - p) * dy).toFixed(2)}px)`,
              filter: p >= 0.999 ? undefined : `blur(${((1 - p) * blur).toFixed(2)}px)`,
              letterSpacing: w.track ? `${(w.track[0] + (w.track[1] - w.track[0]) * p).toFixed(4)}em` : undefined,
              ...w.style,
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};

// Main title: line 1, 3 words equally spaced 4f; line 2 pauses 6f for a breath first, the hero word has a longer entrance window, letter-spacing tightens from loose on the same p
const H1_A: Word[] = ['Make', 'every', 'launch'].map((text, i) => ({ text, start: 10 + i * 4, dur: 22 }));
const H1_B: Word[] = [
  { text: 'feel', start: 26, dur: 22 },
  {
    text: 'cinematic.', start: 30, dur: 30, track: [0.03, -0.025],
    style: { fontStyle: 'italic', color: L.accent },
  },
];
// Subtitle: 9 words, 2.4f between words (more words than the original, gap tightened per the card rules)
const H2: Word[] = 'Shot recipes and camera moves, crafted by your agent.'.split(' ').map((text, i) => ({ text, start: 34 + i * 2.4, dur: 20 }));

export const BlurSlide: React.FC = () => {
  const frame = useCurrentFrame();
  // Whole group pushes in very slowly: origin at the text block's left edge, smooth throughout, speed returns to zero in the tail
  const push = 1 + 0.03 * ramp(frame, 0, 119, EASE.smooth);
  // Masthead hairline: drawn left to right
  const rule = ramp(frame, 0, 24, EASE.snappy);
  // Section eyebrow: same-family blur-slide, unit = whole line
  const kick = ramp(frame, 4, 18, EASE.out);
  // Background issue number: slowly develops from out of focus (much slower than the title, serves only spatial layering)
  const folio = ramp(frame, 0, 48, EASE.out);
  // Footer: starts drawing when the subtitle wraps up (72f), 26f snappy
  const foot = ramp(frame, 72, 26, EASE.snappy);
  const headline: React.CSSProperties = {
    fontFamily: SERIF, fontSize: 170, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.035em', color: L.ink,
  };
  return (
    <Stage look={L} keyLight={{ x: 0.3, y: 0.18 }} fill={null} breathe={0.6} grain={0.06} vignette={0.1}>
      {/* A touch of vermilion afterglow at the lower right of the paper (very faint), so the warm white is not dead flat */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 40% 50% at 96% 100%, ${alpha(L.accent, 0.06)}, ${alpha(L.accent, 0)} 70%)` }} />

      {/* Background: large issue-number digits (5% ink), pushed more slowly than the text layer and drifting the opposite way → foreground/background parallax */}
      <div
        style={{
          position: 'absolute', right: 120, top: 150, fontFamily: SERIF, fontSize: 760, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.06em',
          color: alpha(L.ink, 0.045 * folio), filter: folio >= 0.999 ? undefined : `blur(${((1 - folio) * 24).toFixed(2)}px)`,
          transform: `translateX(${(-24 * ramp(frame, 0, 119, EASE.smooth)).toFixed(2)}px)`,
        }}
      >
        07
      </div>
        {/* Masthead: texture-level small text (no need to read), present from the first frame; does not push in with the text (page furniture is fixed) */}
        <div style={{ position: 'absolute', left: LEFT, right: LEFT, top: 92, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: FONT.sans, fontSize: 24, fontWeight: 600, letterSpacing: '0.2em', color: L.ink2, opacity: 0.4 + 0.6 * rule }}>
          {/* Masthead wordmark: shorts-kit (all lowercase, the wordmark gets no caps letter-spacing) */}
          <ShortKitWordmark size={24} markScale={1.5} gap={12} tone="light" color={L.ink2} />
          <span style={{ color: L.ink3 }}>N° 07 — OCTOBER 2026</span>
        </div>
        <div style={{ position: 'absolute', left: LEFT, top: 140, width: 1920 - LEFT * 2, height: 1.5, background: alpha(L.ink, 0.22), transform: `scaleX(${rule.toFixed(4)})`, transformOrigin: '0 50%' }} />

        {/* Footer: after the subtitle settles, a hairline is drawn right to left + page number, giving the hold segment a closing move and framing the layout into a complete page */}
        <div style={{ position: 'absolute', left: LEFT, top: 972, width: 1920 - LEFT * 2, height: 1.5, background: alpha(L.ink, 0.18), transform: `scaleX(${foot.toFixed(4)})`, transformOrigin: '100% 50%' }} />
        <div style={{ position: 'absolute', right: LEFT, top: 994, fontFamily: FONT.sans, fontSize: 24, fontWeight: 600, letterSpacing: '0.2em', color: L.ink3, opacity: foot }}>
          PAGE 07
        </div>

      <div style={{ position: 'absolute', inset: 0, transform: `scale(${push.toFixed(5)})`, transformOrigin: `${LEFT}px 560px` }}>
        {/* Section eyebrow */}
        <div
          style={{
            position: 'absolute', left: LEFT, top: 318, display: 'flex', alignItems: 'center', gap: 18,
            fontFamily: FONT.sans, fontSize: 30, fontWeight: 650, letterSpacing: '0.16em', color: L.accent,
            opacity: kick, transform: `translateY(${((1 - kick) * 18).toFixed(2)}px)`, filter: kick >= 0.999 ? undefined : `blur(${((1 - kick) * 6).toFixed(2)}px)`,
          }}
        >
          <span style={{ width: 14, height: 14, background: L.accent, display: 'inline-block' }} />
          RELEASE NOTES
        </div>

        {/* Main title two lines: serif 170px, negative letter-spacing */}
        <Words words={H1_A} dy={64} blur={18} gap="0.24em" style={{ ...headline, position: 'absolute', left: LEFT - 6, top: 384 }} />
        <Words words={H1_B} dy={64} blur={18} gap="0.24em" style={{ ...headline, position: 'absolute', left: LEFT - 6, top: 556 }} />

        {/* Subtitle: sans-serif 46px, displacement and blur both one notch smaller than the main title */}
        <Words
          words={H2}
          dy={26}
          blur={9}
          gap="0.26em"
          style={{ position: 'absolute', left: LEFT, top: 800, fontFamily: FONT.sans, fontSize: 46, fontWeight: 400, letterSpacing: '-0.012em', color: L.ink2, lineHeight: 1.2 }}
        />
      </div>
    </Stage>
  );
};
