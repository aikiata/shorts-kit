// changelog-scroll-brake: long changelog scroll with a hard brake
// ~34 entries (uneven row heights) sweep past bottom to top at high speed (fast start + exponential long-tail deceleration),
// vertical motion blur is layered on the fast segment (driven by speed difference, smearing into color bands); after the precise hard stop the target row lifts
// (scale 1.03 + deeper shadow) + accent outline, the other rows dim. Fully still after f=84 (66f).
//
// Quality upgrade: gray skeleton rows replaced by a realistic year of changelog (version / type tag / title / description / date, in chronological
// order top to bottom, with Planned roadmap entries after the stop point); target row has publication-grade v2.41 content + NEW badge; the start changed from "full speed instantly at frame 14"
// to cubic-bezier(0.45,0,0.06,1) (full speed in about 5f, then a long tail to the stop); isotropic blur changed to a vertical SpeedBlur along
// the scroll direction (horizontal glyphs stay sharp, reads as real motion blur); fixed header at top + top/bottom fade masks; soft bright light field + grain.
import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { G } from '../../../shared/fixtures/Fixtures';
import { Backdrop, EASE, FONT, Grain, SpeedBlur, bezier, innerHighlight, softShadow, tracking } from '../../../shared/fixtures/Polish';
import { BRAND, ShortKitMark } from '../../../shared/fixtures/Brand';

export const CHANGELOG_SCROLL_BRAKE_DURATION = 150; // 14f rest + 50f scroll + 14f lift + 66f still

const CL = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// Timeline
const SCROLL0 = 14; // initial rest for the first 14f (parked at the top of the long scroll)
const SCROLL1 = 64; // hard-brake stop frame
const LIFT0 = 68; // target row lift starts
const LIFT1 = 82;

const COL_W = 1000;
const COL_X = (1920 - COL_W) / 2;
const GAP = 20;
const N = 34;
const TARGET = 28;

// Uneven row heights (frame-deterministic: all determined by i)
const rowH = (i: number) => 72 + ((i * 29) % 3) * 22; // 72 / 94 / 116

// Precompute y for each row
const rowY: number[] = [];
{
  let y = 0;
  for (let i = 0; i < N; i++) {
    rowY.push(y);
    y += rowH(i) + GAP;
  }
}
const TARGET_CY = rowY[TARGET] + rowH(TARGET) / 2;
const END_T = 540 - TARGET_CY; // target row stops at the center of the frame
const START_T = 200; // start: top of the long scroll sits below the header

// Fast start (~5f to peak speed) + long-tail exponential deceleration: high start, low finish
const BRAKE_EASE = bezier(0.45, 0, 0.06, 1);
const scrollAt = (f: number): number =>
  interpolate(f, [SCROLL0, SCROLL1], [START_T, END_T], { easing: BRAKE_EASE, ...CL });

// ── Fake content: a full year of shorts-kit release notes (time increasing top to bottom), stop point = Motion workbench, roadmap after it ──
const TITLES = [
  'Crash zoom shot card', 'Faster Remotion renders', 'Fix: audio drift on long renders',
  'Beat grid from any BGM', 'Dolly zoom shot card', 'Real page captures', 'Fix: caption timing at 60 fps',
  'Gallery style filters', 'Whip pans', 'Ink Press template', 'Improved SFX ducking', 'Fix: blur seam on 4K export',
  'Storyboard from a prompt', 'Inline shot previews', 'Poster frame picker', 'Parallax depth layers', 'Fix: font fallback in titles',
  'Beat-synced flash cuts', 'Film grain overlay', 'Lower thirds', 'Faster cold render', 'Fix: mask edge on Safari',
  'Showcase gallery', 'Light leaks', 'Per-shot color looks', 'Offline asset cache', 'Fix: cursor path smoothing', 'JianYing export',
];
const KINDS = ['Feature', 'Improved', 'Fix'] as const;
const KIND_STYLE: Record<string, { bg: string; fg: string }> = {
  Feature: { bg: 'rgba(91,99,211,0.11)', fg: '#4a51b8' },
  Improved: { bg: 'rgba(22,150,110,0.11)', fg: '#137a5a' },
  Fix: { bg: 'rgba(20,22,28,0.06)', fg: '#5d5f66' },
  Planned: { bg: 'transparent', fg: '#9b9da3' },
  Launch: { bg: G.accent, fg: '#ffffff' },
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
const entry = (i: number) => {
  if (i === TARGET)
    return {
      v: 'v2.41', kind: 'Launch', title: 'Motion workbench',
      desc: 'Every shot, tuned in one place.', date: 'Today',
    };
  if (i > TARGET)
    return { v: '—', kind: 'Planned', title: ['Vertical 9:16 cuts', 'Brand kit import', 'Shot A/B compare', 'Multi-track SFX', 'Batch renders'][(i - TARGET - 1) % 5], desc: 'On the roadmap for Q4.', date: 'Q4' };
  const kind = TITLES[i].startsWith('Fix') ? 'Fix' : KINDS[i % 2];
  return {
    v: `v2.${13 + i}`,
    kind,
    title: TITLES[i].replace(/^Fix: (.)/, (_, c: string) => c.toUpperCase()),
    desc: 'Rolled out to every project with no action required.',
    date: `${MONTHS[Math.min(8, Math.floor((i / TARGET) * 9))]} ${1 + ((i * 11) % 27)}`,
  };
};

const Row: React.FC<{ i: number; frame: number }> = ({ i, frame }) => {
  const isTarget = i === TARGET;
  const h = rowH(i);
  const e = entry(i);
  const k = KIND_STYLE[e.kind];
  const tall = h >= 94;
  const planned = e.kind === 'Planned';

  // Target row lift + highlight; other rows dim
  const t = interpolate(frame, [LIFT0, LIFT1], [0, 1], { easing: EASE.out, ...CL });
  const lift = isTarget ? t : 0;
  const dim = isTarget ? 0 : t;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: rowY[i],
        width: COL_W,
        height: h,
        background: planned ? 'rgba(255,255,255,0.55)' : '#ffffff',
        border: planned ? '1px dashed rgba(20,22,28,0.14)' : `1px solid ${G.hairline}`,
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 22,
        padding: '0 30px',
        boxSizing: 'border-box',
        transform: `scale(${1 + 0.03 * lift})`,
        boxShadow: planned
          ? 'none'
          : `${innerHighlight(0.9)}, ${softShadow(2 + 26 * lift, { strength: 1 + 0.6 * lift })}` +
            (lift > 0 ? `, 0 0 0 ${(2 * lift).toFixed(2)}px rgba(91,99,211,${(0.9 * lift).toFixed(3)})` : ''),
        opacity: 1 - 0.62 * dim,
        zIndex: isTarget ? 2 : 1,
        fontFamily: FONT.sans,
      }}
    >
      <div style={{ width: 82, flexShrink: 0, fontFamily: FONT.mono, fontSize: 22, color: G.ink3, fontVariantNumeric: 'tabular-nums' }}>
        {e.v}
      </div>
      <div
        style={{
          flexShrink: 0,
          height: 34,
          padding: '0 14px',
          borderRadius: 17,
          background: k.bg,
          border: planned ? '1px solid rgba(20,22,28,0.12)' : 'none',
          color: k.fg,
          fontSize: 20,
          fontWeight: 650,
          lineHeight: '34px',
          letterSpacing: '0.01em',
        }}
      >
        {e.kind}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: isTarget ? 36 : 28,
            fontWeight: isTarget ? 700 : 600,
            color: planned ? G.ink3 : G.ink1,
            letterSpacing: tracking(isTarget ? 36 : 28),
            whiteSpace: 'nowrap',
          }}
        >
          {e.title}
        </div>
        {tall && (
          <div style={{ marginTop: 4, fontSize: isTarget ? 26 : 22, color: G.ink2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {e.desc}
          </div>
        )}
      </div>
      {isTarget && (
        <div
          style={{
            flexShrink: 0,
            height: 30,
            padding: '0 12px',
            borderRadius: 8,
            background: 'rgba(91,99,211,0.11)',
            color: G.accent,
            fontSize: 18,
            fontWeight: 750,
            lineHeight: '30px',
            letterSpacing: '0.08em',
            opacity: lift,
            transform: `translateX(${((1 - lift) * 8).toFixed(2)}px)`,
          }}
        >
          NEW
        </div>
      )}
      <div style={{ flexShrink: 0, width: 92, textAlign: 'right', fontSize: 22, color: G.ink3, fontVariantNumeric: 'tabular-nums' }}>
        {e.date}
      </div>
    </div>
  );
};

// List top/bottom fade: one band below the header and one at the bottom of the frame
const LIST_MASK = 'linear-gradient(180deg, transparent 150px, #000 250px, #000 930px, transparent 1060px)';

export const ChangelogScrollBrake: React.FC = () => {
  const frame = useCurrentFrame();
  const T = scrollAt(frame);
  // Speed difference (px/f) → vertical motion blur
  const v = scrollAt(frame + 0.5) - scrollAt(frame - 0.5);

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden', fontFamily: FONT.sans }}>
      <Backdrop tone="light" light={{ x: 0.5, y: 0.2 }} vignette={0.16} grain={0} />
      <div style={{ position: 'absolute', inset: 0, WebkitMaskImage: LIST_MASK, maskImage: LIST_MASK }}>
        <SpeedBlur vx={0} vy={v} amount={0.32} max={30}>
          <div
            style={{
              position: 'absolute',
              left: COL_X,
              top: 0,
              width: COL_W,
              height: 1080,
              transform: `translateY(${T.toFixed(2)}px)`,
            }}
          >
            {Array.from({ length: N }).map((_, i) => (
              <Row key={i} i={i} frame={frame} />
            ))}
          </div>
        </SpeedBlur>
      </div>
      {/* Fixed header: shorts-kit logo + Changelog + brand name */}
      <div style={{ position: 'absolute', left: COL_X, top: 64, width: COL_W, display: 'flex', alignItems: 'baseline', gap: 22 }}>
        <ShortKitMark size={50} tone="light" style={{ alignSelf: 'center', marginRight: -4 }} />
        <div style={{ fontSize: 52, fontWeight: 720, letterSpacing: tracking(52), color: G.ink1 }}>Changelog</div>
        <div style={{ fontFamily: BRAND.font, fontSize: 30, fontWeight: 600, color: G.ink3, letterSpacing: '0.03em' }}>{BRAND.name}</div>
      </div>
      <Grain opacity={0.05} />
    </div>
  );
};
