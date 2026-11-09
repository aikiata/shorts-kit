import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {FONT} from '../theme';

/**
 * Cockpit instrument panel (2D, DOM). Three fuel-quantity screens and, optionally,
 * four analogue backup dials.
 *
 *  state 'live'  screens show `values`.
 *  state 'blank' screens are dark with a faint, flickering `blankText` (the failure).
 *  state 'fade'  screens show `values` until `offAt[i]`, then fade to black over 8
 *                frames (a power loss, one screen after another).
 *
 * The analogue dials (compass, horizon, airspeed, altitude) light at `analogFrom`
 * and never go dark: they are what is left. Every number, label and text comes
 * from props; smallest text is 30 px. Width 774 (the safe box) unless overridden.
 */
export type CockpitGaugesProps = {
  labels: [string, string, string];
  values: [string, string, string];
  unit: string;
  blankText: string;
  state: 'live' | 'blank' | 'fade';
  offAt?: [number, number, number];
  /** Four backup dials; omit for none. Labels are uppercased. */
  dials?: {labels: [string, string, string, string]; values: [number, number, number, number]; from?: number};
  accent: string;
  left?: number;
  top: number;
  width?: number;
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Dial: React.FC<{kind: number; v: number; size: number; accent: string; on: number}> = ({kind, v, size, accent, on}) => {
  const r = size / 2;
  const ang = kind === 0 ? v * 360 : -130 + v * 260;
  const tilt = (v - 0.5) * 60;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{opacity: 0.25 + 0.75 * on}}>
      <defs>
        <clipPath id={`dc${kind}`}><circle cx={r} cy={r} r={r - 6} /></clipPath>
      </defs>
      <circle cx={r} cy={r} r={r - 3} fill="#0B1118" stroke="rgba(255,255,255,0.75)" strokeWidth={5} />
      {kind === 1 ? (
        <g clipPath="url(#dc1)" transform={`rotate(${tilt} ${r} ${r})`}>
          <rect x={0} y={0} width={size} height={r} fill="#2B5E8C" />
          <rect x={0} y={r} width={size} height={r} fill="#6B4A2B" />
          <line x1={0} y1={r} x2={size} y2={r} stroke="#fff" strokeWidth={3} />
        </g>
      ) : (
        Array.from({length: 12}, (_, i) => (
          <line key={i} x1={r} y1={14} x2={r} y2={i % 3 === 0 ? 30 : 22} stroke="rgba(255,255,255,0.7)" strokeWidth={3} transform={`rotate(${i * 30} ${r} ${r})`} />
        ))
      )}
      {kind === 1 ? (
        <path d={`M${r - 34} ${r} h68 M${r} ${r} v14`} stroke={accent} strokeWidth={5} strokeLinecap="round" />
      ) : (
        <g transform={`rotate(${ang} ${r} ${r})`}>
          <path d={`M${r} ${r + 14} L${r} ${20}`} stroke={kind === 0 ? accent : '#fff'} strokeWidth={6} strokeLinecap="round" />
          {kind === 0 ? <path d={`M${r - 8} ${r - 4} L${r} 18 L${r + 8} ${r - 4} Z`} fill={accent} /> : null}
        </g>
      )}
      <circle cx={r} cy={r} r={6} fill="#fff" />
    </svg>
  );
};

export const CockpitGauges: React.FC<CockpitGaugesProps> = ({
  labels,
  values,
  unit,
  blankText,
  state,
  offAt = [0, 0, 0],
  dials,
  accent,
  left = 153,
  top,
  width = 774,
}) => {
  const frame = useCurrentFrame();
  const gap = 20;
  const sw = (width - gap * 2) / 3;
  const dsize = 170;
  const dgap = (width - dsize * 4) / 3;
  return (
    <div style={{position: 'absolute', left, top, width, fontFamily: FONT.sans, color: '#fff'}}>
      <div style={{padding: 16, borderRadius: 22, background: '#0E141B', border: '3px solid rgba(255,255,255,0.18)'}}>
        <div style={{display: 'flex', gap}}>
          {labels.map((lab, i) => {
            const live = state === 'live' ? 1 : state === 'blank' ? 0 : interpolate(frame, [offAt[i], offAt[i] + 8], [1, 0], clamp);
            const flick = state === 'blank' || live < 1 ? 0.18 + 0.2 * Math.max(0, Math.sin(frame * 0.9 + i * 2)) * (Math.sin(frame * 0.23 + i) > 0.55 ? 1 : 0) : 0;
            return (
              <div key={i} style={{width: sw - 8}}>
                <div style={{fontSize: 30, fontWeight: 700, letterSpacing: 2, textAlign: 'center', marginBottom: 8, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase'}}>{lab}</div>
                <div style={{height: 190, borderRadius: 12, background: `rgba(${12 + 30 * live}, ${18 + 60 * live}, ${24 + 40 * live}, 1)`, border: '2px solid rgba(255,255,255,0.14)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
                  <div style={{position: 'absolute', inset: 0, borderRadius: 12, boxShadow: live > 0 ? `0 0 ${24 * live}px ${accent}55 inset` : 'none'}} />
                  <div style={{fontSize: 56, fontWeight: 800, color: accent, opacity: live, fontVariantNumeric: 'tabular-nums'}}>{values[i]}</div>
                  <div style={{fontSize: 30, fontWeight: 700, color: accent, opacity: live * 0.85}}>{unit}</div>
                  <div style={{position: 'absolute', fontSize: 30, fontWeight: 800, letterSpacing: 4, color: '#fff', opacity: flick, textTransform: 'uppercase'}}>{blankText}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {dials ? (
        <div style={{display: 'flex', gap: dgap, marginTop: 36}}>
          {dials.labels.map((lab, i) => {
            const on = interpolate(frame, [dials.from ?? 0, (dials.from ?? 0) + 14], [0, 1], clamp);
            return (
              <div key={i} style={{width: dsize, textAlign: 'center'}}>
                <Dial kind={i} v={dials.values[i]} size={dsize} accent={accent} on={on} />
                <div style={{marginTop: 8, fontSize: 30, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap', marginLeft: -20, marginRight: -20, color: 'rgba(255,255,255,0.85)', opacity: 0.3 + 0.7 * on}}>{lab}</div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
