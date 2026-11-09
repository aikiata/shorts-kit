import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {FONT, H, W} from '../theme';
import {SAFE_BOTTOM} from '../frame/SafeZones';
import {HUD_TOP, HUD_H} from '../frame/ChapterHud';

/**
 * A two-column ledger that reveals one line at a time: the same calculation done
 * wrong (left) and right (right), step by step, so the viewer SEES where the
 * numbers part. Everything shown comes from props; nothing is hard-coded to a
 * topic, so it works for any "how a wrong factor changed the answer" story.
 *
 * Layout: 850 px wide by default (x 48..898), leaving 29 px before the TikTok/Reels
 * button rail. Top = HUD bottom + 64 (leaves room for a RecreationTag). Each row is a
 * label above two cells (expression, big value, unit). Every text is >= 30 px at
 * 1080 wide. 4 rows of 210 px end at y ~ 1450: check the caption band yourself
 * if you add rows.
 *
 * Timing: row i starts at `from + 12 + i * stagger`. A row with `flag` makes the
 * wrong cell turn `bad` and get struck through 12 frames after it appears: that
 * is the "this number is the problem" beat. The right cell turns `good` then.
 */
export type LedgerCell = {
  /** The calculation, e.g. "7.682 × 1,77". Keep it short; mono. */
  expr: string;
  /** The result, e.g. "13.597". */
  value: string;
  /** The unit, e.g. "kg" or "lb (not kg)". */
  unit: string;
  /**
   * Frame (composition-relative, same clock as `from`) until which the cell shows a
   * pulsing "?" instead of expr/value/unit. Use to hold back one number (the factor)
   * and reveal it later; before that the row is visible with the other cell filled.
   */
  pendingUntil?: number;
  /** Alias of `pendingUntil` (the frame at which the "?" turns into the value). */
  revealAt?: number;
  /** Show an empty box (no "?", no text) instead of the cell's content. */
  hidden?: boolean;
};

export type LedgerRow = {
  label: string;
  wrong: LedgerCell;
  right: LedgerCell;
  /** The wrong cell is where the error shows: colour + strike it. */
  flag?: boolean;
  /** Frame at which this row appears; overrides `from + 12 + i * stagger`. Use to sync a row to the narration. */
  at?: number;
  /** Frame at which the flag colour/strike fires; default 12 frames after the row appears. */
  flagAt?: number;
};

export type FuelLedgerProps = {
  title?: string;
  wrongTitle: string;
  rightTitle: string;
  rows: readonly LedgerRow[];
  from?: number;
  stagger?: number;
  bad: string;
  good: string;
  ink?: string;
  top?: number;
  /** Panel left edge (default 48) and width (default 850, ends at x=898). */
  left?: number;
  width?: number;
  /** Rendered under the last row (e.g. a fraction bar). */
  /** Row height in px (default 210). Cells are `rowH - 72` tall. Text stays >= 30 px; below ~150 it will not fit. */
  rowH?: number;
  /** Shorthand for rowH 160 (cells 110 px tall, tighter padding). 4 rows end ~240 px higher than default. */
  compact?: boolean;
  /** Rendered under the last row (e.g. a fraction bar). */
  children?: React.ReactNode;
};

const COL_GAP = 20;
/** Smallest text in the ledger, px at 1080 wide (about 10 px on a phone thumbnail). */
export const LEDGER_MIN_PX = 30;
/** Default panel: left 48, width 850 (ends at x=898, 29 px short of the button rail at x=927). */
const DEFAULT_LEFT = 48;
const DEFAULT_W = 850; // 48..898: 29 px of air before the button rail (x=927)

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Cell: React.FC<{
  w: number;
  cell: LedgerCell;
  color: string;
  strike?: number;
  tint: string;
  mark: number;
  h: number;
  tight: boolean;
}> = ({w, cell, color, strike = 0, tint, mark, h, tight}) => {
  const frame = useCurrentFrame();
  const until = cell.revealAt ?? cell.pendingUntil;
  const pending = until !== undefined && frame < until;
  const pulse = 0.55 + 0.45 * Math.sin(frame / 4);
  return (
    <div
      style={{
        width: w,
        height: h,
        boxSizing: 'border-box',
        padding: tight ? '4px 18px' : '10px 18px',
        borderRadius: 12,
        background: 'rgba(9,14,20,0.9)',
        border: `2px solid ${pending ? 'rgba(255,255,255,' + (0.25 + 0.35 * pulse) + ')' : mark ? tint : 'rgba(255,255,255,0.14)'}`,
        position: 'relative',
      }}
    >
      {cell.hidden ? null : pending ? (
        <div style={{display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.sans, fontWeight: 800, fontSize: 84, color: '#fff', opacity: pulse}}>?</div>
      ) : (
        <>
          <div style={{fontFamily: FONT.sans, fontWeight: 600, fontSize: LEDGER_MIN_PX, lineHeight: '36px', color: 'rgba(255,255,255,0.72)', whiteSpace: 'nowrap'}}>{cell.expr}</div>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 10, marginTop: tight ? 2 : 6, whiteSpace: 'nowrap'}}>
            <span style={{position: 'relative', fontFamily: FONT.sans, fontWeight: 800, fontSize: tight ? 54 : 60, lineHeight: 1, color, fontVariantNumeric: 'tabular-nums'}}>
              {cell.value}
              {strike > 0 ? (
                <span style={{position: 'absolute', left: -4, top: '54%', height: 5, width: `calc(${strike * 100}% + 8px)`, background: tint, borderRadius: 3}} />
              ) : null}
            </span>
            <span style={{fontFamily: FONT.sans, fontWeight: 600, fontSize: LEDGER_MIN_PX, color: 'rgba(255,255,255,0.78)'}}>{cell.unit}</span>
          </div>
        </>
      )}
    </div>
  );
};

export const FuelLedger: React.FC<FuelLedgerProps> = ({
  title,
  wrongTitle,
  rightTitle,
  rows,
  from = 0,
  stagger = 24,
  bad,
  good,
  ink = '#fff',
  top = HUD_TOP + HUD_H + 64,
  left = DEFAULT_LEFT,
  width = DEFAULT_W,
  rowH: rowHProp,
  compact = false,
  children,
}) => {
  const ROW_H = rowHProp ?? (compact ? 160 : 210);
  const cellH = ROW_H - 72;
  const tight = ROW_H < 190;
  const frame = useCurrentFrame();
  const colW = (width - COL_GAP) / 2;
  const head = interpolate(frame, [from, from + 10], [0, 1], clamp);
  const bottom = top + 100 + rows.length * ROW_H;
  const over = bottom > SAFE_BOTTOM - 150 && H > 0;
  return (
    <div style={{position: 'absolute', left, top, width, color: ink, fontFamily: FONT.sans}}>
      {title ? (
        <div style={{fontSize: 32, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', opacity: head, marginBottom: 12}}>{title}</div>
      ) : null}
      <div style={{display: 'flex', gap: COL_GAP, opacity: head, height: 56}}>
        <div style={{width: colW, fontSize: 32, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: bad}}>✕ {wrongTitle}</div>
        <div style={{width: colW, fontSize: 32, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: good}}>✓ {rightTitle}</div>
      </div>
      {rows.map((r, i) => {
        const t0 = r.at ?? from + 12 + i * stagger;
        const p = interpolate(frame, [t0, t0 + 10], [0, 1], clamp);
        const tf = r.flagAt ?? t0 + 12;
        const flagP = r.flag ? interpolate(frame, [tf, tf + 10], [0, 1], clamp) : 0;
        return (
          <div key={i} style={{height: ROW_H, opacity: p, transform: `translateY(${(1 - p) * 14}px)`}}>
            <div style={{fontSize: LEDGER_MIN_PX, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.82)', margin: tight ? '4px 0 4px' : '12px 0 8px'}}>
              <span style={{fontFamily: FONT.mono, marginRight: 12, color: 'rgba(255,255,255,0.5)'}}>{String(i + 1).padStart(2, '0')}</span>
              {r.label}
            </div>
            <div style={{display: 'flex', gap: COL_GAP}}>
              <Cell h={cellH} tight={tight} w={colW} cell={r.wrong} color={flagP > 0.5 ? bad : ink} strike={flagP} tint={bad} mark={flagP > 0 ? 1 : 0} />
              <Cell h={cellH} tight={tight} w={colW} cell={r.right} color={flagP > 0.5 ? good : ink} tint={good} mark={flagP > 0 ? 1 : 0} />
            </div>
          </div>
        );
      })}
      {children}
      {over ? <div style={{position: 'absolute', left: 0, top: rows.length * ROW_H + 100, color: '#f0f', fontSize: 30}}>LEDGER TOO TALL</div> : null}
    </div>
  );
};
