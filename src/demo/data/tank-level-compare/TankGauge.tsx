import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {FONT} from '../theme';

/**
 * Fuel tank gauge (2D): an outlined tank that fills, or drains, to a level, with
 * the number it represents under it. Used for "what the pilot believed" vs "what
 * was really there", and for a tank running dry.
 *
 * All numbers/labels arrive through props. `level0` → `level1` (0..1) animate over
 * `fillFrames` starting at `from`: fill = level0 0, level1 0.45; drain = 0.45 → 0
 * with a longer `fillFrames`. Smallest text 30 px. `estimate` adds a tag above the
 * tank (e.g. 'ESTIMATE') for a derived, not measured, figure.
 */
export type TankGaugeProps = {
  /** Caption under the value, e.g. "What the pilot thought". Uppercased. May wrap to 2 lines. */
  label: string;
  /** The figure, e.g. "22.300 kg". */
  value: string;
  level0?: number;
  level1: number;
  from?: number;
  fillFrames?: number;
  color: string;
  /** Tag text for a derived figure, e.g. "ESTIMATE". */
  estimate?: string;
  /** Position of the gauge's top-left corner (px, 1080x1920 frame). */
  left: number;
  top: number;
  width?: number;
  tankHeight?: number;
  /** Tick labels on the side (e.g. ["FULL", "½", "EMPTY"]); omit for none. */
  ticks?: [string, string, string];
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

export const TankGauge: React.FC<TankGaugeProps> = ({
  label,
  value,
  level0 = 0,
  level1,
  from = 0,
  fillFrames = 20,
  color,
  estimate,
  left,
  top,
  width = 360,
  tankHeight = 420,
  ticks,
}) => {
  const frame = useCurrentFrame();
  const appear = interpolate(frame, [from - 6, from], [0, 1], clamp);
  const k = ease(interpolate(frame, [from, from + fillFrames], [0, 1], clamp));
  const level = level0 + (level1 - level0) * k;
  const wave = Math.sin(frame / 5) * 3;
  return (
    <div style={{position: 'absolute', left, top, width, opacity: appear, fontFamily: FONT.sans, color: '#fff'}}>
      <div style={{height: 44, display: 'flex', justifyContent: 'flex-end'}}>
        {estimate ? (
          <span style={{fontSize: 30, fontWeight: 800, letterSpacing: 2, padding: '2px 12px', borderRadius: 8, border: `2px solid ${color}`, color, textTransform: 'uppercase'}}>{estimate}</span>
        ) : null}
      </div>
      <div style={{position: 'relative', height: tankHeight, borderRadius: 26, border: '4px solid rgba(255,255,255,0.7)', background: 'rgba(9,14,20,0.85)', overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: `${level * 100}%`, background: color, opacity: 0.92}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: -3 + wave * 0.3, height: 6, background: 'rgba(255,255,255,0.55)'}} />
        </div>
        {[0.25, 0.5, 0.75].map((t) => (
          <div key={t} style={{position: 'absolute', left: 0, width: t === 0.5 ? 46 : 28, bottom: `${t * 100}%`, height: 3, background: 'rgba(255,255,255,0.65)'}} />
        ))}
        {ticks ? (
          <>
            <div style={{position: 'absolute', right: 14, top: 8, fontSize: 30, fontWeight: 700, opacity: 0.85}}>{ticks[0]}</div>
            <div style={{position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 30, fontWeight: 700, opacity: 0.85}}>{ticks[1]}</div>
            <div style={{position: 'absolute', right: 14, bottom: 8, fontSize: 30, fontWeight: 700, opacity: 0.85}}>{ticks[2]}</div>
          </>
        ) : null}
      </div>
      <div style={{marginTop: 14, fontSize: 56, fontWeight: 800, lineHeight: 1.05, fontVariantNumeric: 'tabular-nums'}}>{value}</div>
      <div style={{marginTop: 6, fontSize: 30, fontWeight: 700, letterSpacing: 1.5, lineHeight: '36px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)'}}>{label}</div>
    </div>
  );
};

/** Two gauges side by side inside the 774 px safe box (x 153..927). `a` and `b` omit left/top/width. */
export const TankGaugePair: React.FC<{
  a: Omit<TankGaugeProps, 'left' | 'top' | 'width'>;
  b: Omit<TankGaugeProps, 'left' | 'top' | 'width'>;
  top: number;
}> = ({a, b, top}) => (
  <>
    <TankGauge {...a} left={153} top={top} width={367} />
    <TankGauge {...b} left={560} top={top} width={367} />
  </>
);
