import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {FONT} from '../theme';

/**
 * Stack of "safety layers", each failing in its own way:
 *   'dark'  the bar goes dark (a silent failure: the display is blank)
 *   'snap'  the bar breaks in two along a jagged crack (a rule that did not hold)
 *   'cross' the bar is crossed out and carries a `badge` (a check that used a wrong number)
 * Bars slide in from the left, one every `stagger` frames from `from`, and fail at
 * their own `failAt` frame. Text is uppercase, 36 px; badge 40 px. Everything is props.
 */
export type Layer = {label: string; fail: 'dark' | 'snap' | 'cross'; failAt: number; badge?: string};

export type LayerBarsProps = {
  layers: readonly Layer[];
  from?: number;
  stagger?: number;
  top: number;
  left?: number;
  width?: number;
  barHeight?: number;
  ok: string;
  bad: string;
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const CRACK_L = 'polygon(0 0, 56% 0, 50% 25%, 58% 50%, 51% 75%, 56% 100%, 0 100%)';
const CRACK_R = 'polygon(56% 0, 100% 0, 100% 100%, 56% 100%, 51% 75%, 58% 50%, 50% 25%)';

export const LayerBars: React.FC<LayerBarsProps> = ({layers, from = 0, stagger = 16, top, left = 153, width = 774, barHeight = 120, ok, bad}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left, top, width, fontFamily: FONT.sans}}>
      {layers.map((l, i) => {
        const t0 = from + i * stagger;
        const inP = interpolate(frame, [t0, t0 + 12], [0, 1], clamp);
        const f = interpolate(frame, [l.failAt, l.failAt + 10], [0, 1], clamp);
        const bg = l.fail === 'dark' ? `rgb(${Math.round(30 - 22 * f)},${Math.round(120 - 105 * f)},${Math.round(110 - 95 * f)})` : ok;
        const label = (
          <div style={{width, height: barHeight, boxSizing: 'border-box', borderRadius: 16, background: bg, display: 'flex', alignItems: 'center', padding: '0 30px', fontSize: 36, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: l.fail === 'dark' ? `rgba(255,255,255,${1 - 0.8 * f})` : '#fff', whiteSpace: 'nowrap'}}>
            {l.label}
          </div>
        );
        return (
          <div key={i} style={{position: 'relative', height: barHeight, marginBottom: 34, transform: `translateX(${(inP - 1) * 700}px)`, opacity: inP}}>
            {l.fail === 'snap' ? (
              <>
                <div style={{position: 'absolute', inset: 0, clipPath: CRACK_L, transform: `translate(${-14 * f}px, ${3 * f}px) rotate(${-2 * f}deg)`, transformOrigin: '0 50%'}}>{label}</div>
                <div style={{position: 'absolute', inset: 0, clipPath: CRACK_R, transform: `translate(${14 * f}px, ${-3 * f}px) rotate(${3 * f}deg)`, transformOrigin: '100% 50%'}}>{label}</div>
              </>
            ) : (
              label
            )}
            {l.fail === 'cross' ? (
              <>
                <div style={{position: 'absolute', inset: 0, borderRadius: 16, boxSizing: 'border-box', border: `5px solid ${bad}`, background: `rgba(11,16,23,${0.45 * f})`, opacity: f}} />
                <svg width={44} height={44} viewBox="0 0 44 44" style={{position: 'absolute', right: l.badge ? undefined : 24, left: l.badge ? width - 24 - 44 - 0 : undefined, top: -16, opacity: f, display: l.badge ? 'none' : 'block'}}>
                  <circle cx={22} cy={22} r={20} fill="#0B1017" stroke={bad} strokeWidth={4} />
                  <path d="M14 14 L30 30 M30 14 L14 30" stroke={bad} strokeWidth={5} strokeLinecap="round" />
                </svg>
                {l.badge ? (
                  <div style={{position: 'absolute', right: 20, top: barHeight / 2 - 30, height: 60, padding: '0 20px', display: 'flex', alignItems: 'center', borderRadius: 10, background: '#0B1017', border: `3px solid ${bad}`, color: bad, fontSize: 40, fontWeight: 800, opacity: f}}>{l.badge}</div>
                ) : null}
              </>
            ) : null}
            {l.fail === 'snap' && f > 0 ? (
              <svg width={width} height={barHeight} style={{position: 'absolute', left: 0, top: 0}}>
                <polyline points={`${width * 0.56},0 ${width * 0.5},${barHeight * 0.25} ${width * 0.58},${barHeight * 0.5} ${width * 0.51},${barHeight * 0.75} ${width * 0.56},${barHeight}`} fill="none" stroke={bad} strokeWidth={6} opacity={f} />
              </svg>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
