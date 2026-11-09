// paper-title-card: a one-sentence title card letterpressed onto paper word by word
// Chapter transition / value-proposition breathing room: a single sentence of copy is stamped in word by word (scale large→1 + blur→0),
// each sentence has exactly one accent-colored italic key word, the accent underline closes in via scaleX, and the whole card fades out at the end.
// All title cards in the film share 50–55f; the paper base + warm center glow share the color family of paper-and-ink style product visuals.
// Parameterized: words/sub/subDigits can be swapped for the target product copy; subDigits runs a DigitRoll
// number roll (must settle before this card fades out). Before rendering this demo, just copy the text into your project.
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';

export const PAPER_TITLE_CARD_DURATION = 55; // ≈1.8s @30fps

const SERIF = 'ui-serif, Georgia, "Times New Roman", serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// Exactly one accent per sentence: a feature name / benefit word (C2)
// br: force a line break after that word (so the two lines are close in length, like the original "All your team’s research, / one place to go." line split, avoiding an orphan word)
const WORDS: { text: string; accent?: boolean; br?: boolean }[] = [
  { text: 'Direct' },
  { text: 'the' },
  { text: 'film.', br: true },
  { text: 'Let' },
  { text: 'the' },
  { text: 'agent' },
  { text: 'shoot', accent: true },
  { text: 'it.' },
];
// Sub line: the render-queue context of shorts-kit (illustrative data)
const SUB = 'shots rendered today';
const SUB_DIGITS = '12';

// Digit roll column (odometer style, copied from template DigitRoll; digits are concatenated twice so
// any target position has a rolling feel; tabular-nums prevents horizontal jitter)
const DIGITS = '0123456789';
const DigitColumn: React.FC<{ ch: string; delay: number; lineH: number; color: string }> = ({ ch, delay, lineH, color }) => {
  const frame = useCurrentFrame();
  if (ch < '0' || ch > '9') {
    return <span style={{ fontSize: 26, lineHeight: `${lineH}px`, color }}>{ch}</span>;
  }
  const target = DIGITS.indexOf(ch);
  const t = interpolate(frame, [delay, delay + 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.25, 0.8, 0.25, 1),
  });
  const offset = (10 + target) * t * lineH;
  return (
    <span style={{ display: 'inline-block', height: lineH }}>
      <span style={{ display: 'block', transform: `translateY(${-offset}px)` }}>
        {(DIGITS + DIGITS).split('').map((d, j) => (
          <span
            key={j}
            style={{
              display: 'block',
              fontSize: 26,
              lineHeight: `${lineH}px`,
              color,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {d}
          </span>
        ))}
      </span>
    </span>
  );
};

const DigitRoll: React.FC<{ value: string; delay: number; color: string }> = ({ value, delay, color }) => {
  const lineH = 26 * 1.15;
  return (
    <span style={{ display: 'inline-flex', overflow: 'hidden', height: lineH, verticalAlign: 'bottom' }}>
      {value.split('').map((c, i) => (
        <DigitColumn key={i} ch={c} delay={delay + i * 4} lineH={lineH} color={color} />
      ))}
    </span>
  );
};

export const PaperTitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const duration = PAPER_TITLE_CARD_DURATION;
  const fadeOut = interpolate(frame, [duration - 8, duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const underline = interpolate(frame, [16, 34], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.3, 0, 0.2, 1),
  });
  const subT = interpolate(frame, [10, 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'oklch(97.5% 0.008 82)',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: fadeOut,
        backgroundImage:
          'radial-gradient(1100px 750px at 50% 42%, oklch(99.3% 0.014 88 / 0.85), transparent 65%)',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 1500 }}>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 116,
            fontWeight: 600,
            lineHeight: 1.14,
            color: 'oklch(18% 0.006 82)',
            letterSpacing: '-0.012em',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            columnGap: '0.26em',
          }}
        >
          {WORDS.map((w, i) => {
            const delay = 4 + i * 4;
            const t = interpolate(frame, [delay, delay + 9], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.2, 0.75, 0.3, 1),
            });
            return (
              <React.Fragment key={i}>
                <span
                  style={{
                    opacity: t,
                    transform: `scale(${1.28 - 0.28 * t})`,
                    filter: `blur(${(1 - t) * 7}px)`,
                    display: 'inline-block',
                    fontStyle: w.accent ? 'italic' : 'normal',
                    color: w.accent ? 'oklch(52% 0.115 65)' : undefined,
                  }}
                >
                  {w.text}
                </span>
                {w.br && <span style={{ flexBasis: '100%', height: 0 }} />}
              </React.Fragment>
            );
          })}
        </div>
        <div
          style={{
            height: 6,
            width: 220,
            margin: '38px auto 0',
            borderRadius: 3,
            background: 'oklch(52% 0.115 65)',
            transform: `scaleX(${underline})`,
          }}
        />
        <div
          style={{
            fontFamily: MONO,
            fontSize: 26,
            letterSpacing: '0.12em',
            color: 'oklch(50% 0.006 82)',
            marginTop: 34,
            opacity: subT,
            textTransform: 'uppercase',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'baseline',
            gap: '0.5em',
          }}
        >
          <DigitRoll value={SUB_DIGITS} delay={12} color="oklch(52% 0.115 65)" />
          <span>{SUB}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
