// shorts-kit brand pieces: use these whenever a demo shows the logo / brand name / tagline:
// mark <ShortKitMark> (the shorts-kit logo, docs/assets/logo.svg: three portrait cards fanned out, the front one
// cyan with a play triangle), wordmark <ShortKitWordmark>, brand colors BRAND, copy library PITCH.
// The wordmark is all lowercase; the mark is not rotated or skewed beyond its own fan.
// Pure props functions, depending only on react; when copying a demo, bring this file along and fix the import path.
import React from 'react';

export const BRAND = {
  name: 'shorts-kit', // official name: all lowercase + hyphen
  short: 'shorts-kit', // short form in sentences / when space is limited
  repo: 'github.com/howznguyen/shorts-kit',
  amber: '#D3923C', // accent color used across the demos
  ink: '#171714', // mark ink on light backgrounds
  paper: '#F5F3EE', // mark ink on dark backgrounds / light background
  slate: '#B5B0A5', // secondary text (on dark backgrounds)
  cyan: '#38BDF8', // the logo's front card
  blue: '#2B3DD1', // the logo's left card
  coral: '#FF4D5E', // the logo's right card
  font: '"Avenir Next", Avenir, Inter, "Helvetica Neue", "PingFang SC", Arial, sans-serif', // wordmark font
} as const;

// The mark's two parts (viewBox 0 0 128 128): frame = the front card, cut = the play triangle. Exported separately for
// segmented animation (the card drawn first, the play slides in afterward, light on the play alone, etc.).
export const MARK_PATHS = {
  frame: 'M50 22h28a9 9 0 0 1 9 9v66a9 9 0 0 1-9 9H50a9 9 0 0 1-9-9V31a9 9 0 0 1 9-9Z',
  cut: 'M58 50v24l20-12Z',
} as const;

// The mark. tone='dark' for dark backgrounds, 'light' for light ones; frameColor / cutColor override the front card and
// the play. frameProgress 0→1 reveals the cards left to right; cutProgress 0→1 slides the play in.
export const ShortKitMark: React.FC<{
  size?: number; tone?: 'dark' | 'light'; frameColor?: string; cutColor?: string;
  frameProgress?: number; cutProgress?: number; style?: React.CSSProperties;
}> = ({ size = 96, tone = 'dark', frameColor, cutColor, frameProgress = 1, cutProgress = 1, style }) => {
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const fp = Math.max(0, Math.min(1, frameProgress));
  const cp = Math.max(0, Math.min(1, cutProgress));
  const card = (rot: number, dx: number, fill: string) => (
    <path d={MARK_PATHS.frame} fill={fill} transform={`translate(${dx} 4) rotate(${rot} 64 70)`} />
  );
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" style={{ display: 'block', overflow: 'visible', ...style }}>
      <defs>
        <clipPath id={`f${id}`}><rect x={0} y={0} width={128 * fp} height={128} /></clipPath>
        <clipPath id={`c${id}`}><rect x={56} y={46} width={24 * cp} height={32} /></clipPath>
      </defs>
      {fp > 0 && (
        <g clipPath={fp < 1 ? `url(#f${id})` : undefined}>
          {card(-16, -9, BRAND.blue)}
          {card(14, 9, BRAND.coral)}
          <path d={MARK_PATHS.frame} fill={frameColor ?? BRAND.cyan} />
        </g>
      )}
      {cp > 0 && <path d={MARK_PATHS.cut} fill={cutColor ?? (tone === 'dark' ? '#0b0f17' : BRAND.ink)} stroke={cutColor ?? '#0b0f17'} strokeWidth={3} strokeLinejoin="round" clipPath={cp < 1 ? `url(#c${id})` : undefined} />}
    </svg>
  );
};

// Wordmark: mark + shorts-kit set horizontally (mark height ≈ 2.1 times the font size, weight 700, +0.03em letter-spacing).
// size = font size (px); use mark={false} when you want the text without the mark.
export const ShortKitWordmark: React.FC<{
  size?: number; tone?: 'dark' | 'light'; color?: string; mark?: boolean;
  markScale?: number; gap?: number; weight?: number; fontFamily?: string; style?: React.CSSProperties;
}> = ({ size = 48, tone = 'dark', color, mark = true, markScale = 2.1, gap, weight, fontFamily, style }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: gap ?? size * 0.5, ...style }}>
    {mark && <ShortKitMark size={size * markScale} tone={tone} />}
    <span style={{
      fontFamily: fontFamily ?? BRAND.font,
      fontSize: size, fontWeight: weight ?? 700, lineHeight: 1, letterSpacing: '0.03em', whiteSpace: 'nowrap',
      color: color ?? (tone === 'dark' ? BRAND.paper : BRAND.ink),
    }}>{BRAND.name}</span>
  </div>
);

// Copy library: when writing a slogan / title / subtitle / review, pick from here or rephrase in this register; do not invent numbers that contradict the facts
// (changing numbers such as card count, star count, user count must not appear on screen).
export const PITCH = {
  en: {
    motto: 'Frame motion. Craft the shot.', // brand tagline (BRAND.md)
    taglines: [
      'One prompt to a finished promo.',
      'Cinematic product videos, crafted by your agent.',
      'Every shot, tuned in one place.',
      'Shot recipes for cinematic product films.',
      'Storyboard. Animate. Sound-design. Deliver.',
      'Your product, in motion.',
      'From screenshot to showreel.',
      'Direct the film. Let the agent shoot it.',
    ],
    features: [
      'Shot recipe cards', 'Real page captures', '2.5D camera moves', 'Beat-synced cuts',
      'Film-grade SFX', 'Motion workbench', 'Remotion render', 'JianYing export',
    ],
    praise: [
      'Feels like a launch film from a real studio.',
      'The first agent skill that actually understands pacing.',
      'Our promo shipped the same afternoon.',
      'Camera moves I would have keyframed for a week.',
      'Motion design without the motion designer bill.',
    ],
    works: 'An agent skill for Claude Code & Codex · Built on Remotion',
  },
  zh: {
    motto: 'Turn motion into shots.', // brand tagline (BRAND.md)
    taglines: [
      'One sentence, one film.',
      'Shot recipe cards, promo films in one click.',
      'Let your agent shoot cinematic product films.',
      'Every shot, tuned just right.',
      'Storyboard, motion, sound, delivery: all in one.',
      'Turn screenshots into blockbusters.',
    ],
    features: ['Shot recipe cards', 'Real page captures', '2.5D camera moves', 'Beat-synced cuts', 'Film-grade SFX', 'Motion workbench', 'Remotion render', 'JianYing export'],
    praise: [
      'Feels like a launch film from a pro studio.',
      'The first agent skill that truly gets pacing.',
      'Asked in the afternoon, live by the evening.',
      'These camera moves would take me a week to keyframe.',
    ],
    works: 'An agent skill for Claude Code & Codex · Built on Remotion',
  },
} as const;
