// typewriter-error-retype | typewriter erase and retype
// Light-background centered large text (eyebrow Introducing shorts-kit): from f2 types "just a slideshow" (16 characters) at 2f/char → f32–48 pause
// 16f (cursor blinks twice = hesitation) → from f48 backspaces "a slideshow" (11 characters, at 1.5f/char,
// characters just vanish) → from f68 decisively types "your cinematic crew" (19 characters, at 1.5f/char,
// done at f95) → cursor blinks for two cycles (10f/cycle) then goes out permanently at f110. Three rhythm tiers: type 2f / delete
// 1.5f / retype 1.5f with no pauses. At the moment typing finishes (f96–110, in parallel with the cursor's two final blinks) an accent-colored marker highlight
// is laid from left to right under the lower half of "cinematic crew" to give the statement a settle; fully still after f110, 160f total → a truly still 50f ending.
// Monospace feel: a fixed-width span per character (monospace font at 100px, 60px slot), no letter-spacing animation. All frames deterministic.
// Texture: soft-glow base + grain, primary ink near-black, the cursor is a 6px accent rounded vertical bar.
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { G } from '../../../shared/fixtures/Fixtures';
import { Backdrop, EASE, FONT, ramp } from '../../../shared/fixtures/Polish';
import { BRAND, ShortKitMark } from '../../../shared/fixtures/Brand';

export const TYPEWRITER_ERROR_RETYPE_DURATION = 160;

const TEXT1 = 'just a slideshow'; // 16 chars
const KEEP = 5; // "just " is kept
const DEL = TEXT1.length - KEEP; // 11 chars to delete
const TEXT2 = 'your cinematic crew'; // 19 chars

const T1 = 2; // start of the first typing pass, 2f/char
const PAUSE_START = T1 + (TEXT1.length - 1) * 2; // f32 typing done
const DS = PAUSE_START + 16; // f48 deletion starts, 1.5f/char
const RS = 68; // retype start, 1.5f/char (a small 3.5f beat after deletion finishes at f64.5)
const TYPE2_END = RS + (TEXT2.length - 1) * 1.5; // f95 typing done
const CURSOR_OFF = 115; // goes out after two 10f blink cycles (last visual change f110)

const SIZE = 100; // font size
const CHAR_W = 60; // character width of the 100px monospace font (0.6em)
const LEFT = (1920 - 24 * CHAR_W) / 2; // the 24-character final sentence is centered as a whole; during typing the left edge is anchored and does not shift sideways
const HL_START = 96; // marker highlight start: laid as soon as typing ends, simultaneous with the two final blinks, finished before f110
const HL_DUR = 14;
const HL_FROM = 10; // index of the first character of "cinematic crew" (it starts at character 10 of the final sentence "just your cinematic crew")
const HL_LEN = 14;

// Cursor visibility: always on while typing/deleting; during the pause, blinks twice on an 8f cycle; after typing ends blinks twice on a 10f cycle; then off forever
const cursorOn = (f: number): boolean => {
  if (f >= CURSOR_OFF) return false;
  if (f >= TYPE2_END) {
    // From f95: on[95,100) off[100,105) on[105,110) off[110,115)
    return Math.floor((f - TYPE2_END) / 5) % 2 === 0;
  }
  if (f >= DS) return true; // delete + retype: always on (decisive)
  if (f >= PAUSE_START) {
    // Hesitation segment f32–48: on[32,36) off[36,40) on[40,44) off[44,48)
    return Math.floor((f - PAUSE_START) / 4) % 2 === 0;
  }
  return true; // first typing pass: always on
};

export const TypewriterErrorRetype: React.FC = () => {
  const f = useCurrentFrame();

  // Characters typed in the first pass
  const n1 = f < T1 ? 0 : Math.min(TEXT1.length, Math.floor((f - T1) / 2) + 1);
  // Characters deleted so far (deleted from the tail)
  const removed = f < DS ? 0 : Math.min(DEL, Math.floor((f - DS) / 1.5) + 1);
  // Characters typed in the second pass
  const n2 = f < RS ? 0 : Math.min(TEXT2.length, Math.floor((f - RS) / 1.5) + 1);

  const shown =
    TEXT1.slice(0, Math.max(KEEP, n1 - removed)).slice(0, n1) +
    TEXT2.slice(0, n2);

  const chars = shown.split('');

  const hl = ramp(f, HL_START, HL_DUR, EASE.snappy);

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden' }}>
      <Backdrop tone="light" light={{ x: 0.42, y: 0.3 }} accent="#5b63d3" />
      {/* Marker highlight: laid only under the lower half of the statement word, left → right */}
      {hl > 0 && (
        <div style={{
          position: 'absolute', left: LEFT + HL_FROM * CHAR_W - 10, top: 540 + SIZE * 0.06,
          width: (HL_LEN * CHAR_W + 20) * hl, height: SIZE * 0.36, borderRadius: 6,
          background: 'linear-gradient(90deg, rgba(91,99,211,0.26) 0%, rgba(91,99,211,0.20) 100%)',
        }} />
      )}
      {/* Eyebrow: aligned with the typing line's left edge, fades in over the opening 10f, tells you "this is a product introduction": shorts-kit logo + lowercase brand name */}
      <div style={{
        position: 'absolute', left: LEFT + 6, top: 540 - SIZE * 0.55 - 70,
        display: 'flex', alignItems: 'center', gap: 12,
        fontFamily: FONT.sans, fontSize: 34, fontWeight: 500, letterSpacing: '0.01em', color: G.ink3,
        opacity: ramp(f, 0, 10, EASE.out),
      }}>
        <ShortKitMark size={40} tone="light" style={{ marginTop: -2 }} />
        <span>Introducing <span style={{ fontFamily: BRAND.font, fontWeight: 700, letterSpacing: '0.03em', color: G.ink1 }}>{BRAND.name}</span></span>
      </div>
      {/* Left edge anchored: no sideways shift while typing (a real typewriter feel); the row is vertically centered at 540 */}
      <div
        style={{
          position: 'absolute',
          left: LEFT,
          top: 540 - (SIZE * 1.1) / 2,
          display: 'flex',
          alignItems: 'center',
          height: SIZE * 1.1,
        }}
      >
        {chars.map((c, i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              width: CHAR_W,
              textAlign: 'center',
              fontFamily: FONT.mono,
              fontSize: SIZE,
              fontWeight: 600,
              color: G.ink1,
              lineHeight: 1.1,
            }}
          >
            {c === ' ' ? '\u00a0' : c}
          </span>
        ))}
        {/* Cursor: accent vertical bar, mounted conditionally rather than opacity 0 */}
        {cursorOn(f) && (
          <span
            style={{
              display: 'inline-block',
              width: 6,
              height: SIZE * 0.98,
              marginLeft: 4,
              borderRadius: 3,
              background: G.accent,
              boxShadow: '0 0 12px rgba(91,99,211,0.35)',
            }}
          />
        )}
      </div>
    </div>
  );
};
