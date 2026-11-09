import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {FONT} from '../theme';

/**
 * Two stacked claim cards: what people repeat (top) and what the primary source
 * actually says (bottom). At `strikeAt` the bottom card draws a line through the
 * top one: the source contradicts the popular version.
 *
 * Everything is props. Fits the 774 px safe box (x 153..927). Text: kicker 30 px,
 * body 44 px. Pass `from` (frame the first card appears) and `strikeAt`.
 */
export type ClaimCardProps = {
  /** [popular claim, source claim]. kicker = small caption, text = the claim. */
  cards: [{kicker: string; text: string}, {kicker: string; text: string}];
  from?: number;
  /** Second card appears at `from + 14` unless `secondAt` is given. */
  secondAt?: number;
  strikeAt: number;
  /** Colour of the popular card accent and the strike line. */
  bad: string;
  /** Accent of the source card. */
  good: string;
  top: number;
  left?: number;
  width?: number;
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const CARD_H = 215;
const GAP = 70;

export const ClaimCard: React.FC<ClaimCardProps> = ({cards, from = 0, secondAt, strikeAt, bad, good, top, left = 153, width = 774}) => {
  const frame = useCurrentFrame();
  const a = interpolate(frame, [from, from + 10], [0, 1], clamp);
  const b = interpolate(frame, [secondAt ?? from + 14, (secondAt ?? from + 14) + 10], [0, 1], clamp);
  const k = interpolate(frame, [strikeAt, strikeAt + 14], [0, 1], clamp);
  const card = (c: {kicker: string; text: string}, color: string, o: number, dim: number) => (
    <div style={{height: CARD_H, boxSizing: 'border-box', padding: '22px 30px', borderRadius: 18, background: 'rgba(9,14,20,0.92)', border: `3px solid ${color}`, opacity: o * (1 - 0.5 * dim), transform: `translateY(${(1 - o) * 18}px)`}}>
      <div style={{fontSize: 30, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color}}>{c.kicker}</div>
      <div style={{marginTop: 12, fontSize: 44, fontWeight: 800, lineHeight: '54px', color: '#fff'}}>{c.text}</div>
    </div>
  );
  return (
    <div style={{position: 'absolute', left, top, width, fontFamily: FONT.sans}}>
      <div style={{position: 'relative'}}>
        {card(cards[0], bad, a, k)}
        {/* strike: a line through the popular card */}
        <svg width={width} height={CARD_H} style={{position: 'absolute', left: 0, top: 0}}>
          <line x1={24} y1={CARD_H - 30} x2={width - 24} y2={30} stroke={bad} strokeWidth={9} strokeLinecap="round" strokeDasharray={width * 1.1} strokeDashoffset={width * 1.1 * (1 - k)} />
        </svg>
      </div>
      <div style={{height: GAP, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: b}}>
        <svg width={40} height={40} viewBox="0 0 40 40"><path d="M20 4 L20 30 M8 20 L20 34 L32 20" stroke="rgba(255,255,255,0.7)" strokeWidth={5} fill="none" strokeLinecap="round" /></svg>
      </div>
      {card(cards[1], good, b, 0)}
    </div>
  );
};
