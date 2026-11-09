// glow-wake-sleep-panel v3: sweep direction changed to left-to-right (user ruling):
// The spotlight "sweeps across" the tilted panel from left to right; a glowing purple line runs along the UI top edge / border /
// logo, lighting what the light reaches and going dark once it leaves, with the tail sinking back into darkness (blue-violet remains on the right edge).
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { BRAND, ShortKitMark } from '../../../shared/fixtures/Brand';

const W = 1250;
const H = 860;
const R = 26;

const ink = '#3a3a3a';
const mid = '#9a9a98';
const line = '#e2e2e0';

const Row: React.FC<{ w: number; icon?: boolean }> = ({ w, icon = true }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 30 }}>
    {icon && <div style={{ width: 18, height: 18, borderRadius: 5, background: mid }} />}
    <div style={{ height: 11, width: w, background: '#c9c9c7', borderRadius: 6 }} />
  </div>
);

const TaskCard: React.FC<{ seed: number }> = ({ seed }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: '14px 0' }}>
    <div style={{ height: 9, width: 150 + (seed % 3) * 22, background: line, borderRadius: 5 }} />
    <div style={{ height: 12, width: 190 + ((seed * 7) % 4) * 18, background: '#b9b9b7', borderRadius: 6 }} />
    <div style={{ width: 15, height: 11, background: '#d9d9d7', borderRadius: 2 }} />
  </div>
);

// Grayscale tilted panel (ClickUp layout shape: sidebar + Review/Shipped two columns; the sidebar top holds the shorts-kit logo + wordmark)
const Panel: React.FC = () => (
  <div style={{
    width: W, height: H, background: '#f6f6f5', borderRadius: R,
    display: 'flex', overflow: 'hidden', boxSizing: 'border-box',
  }}>
    <div style={{ width: 300, borderRight: `2px solid ${line}`, padding: '30px 28px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 34 }}>
        {/* Sidebar brand slot: shorts-kit logo + wordmark (outlined by light as the sweep passes) */}
        <ShortKitMark size={30} tone="light" />
        <div style={{ fontFamily: BRAND.font, fontSize: 17, fontWeight: 700, letterSpacing: '0.03em', lineHeight: 1, color: ink, whiteSpace: 'nowrap' }}>{BRAND.name}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Row w={72} /><Row w={128} /><Row w={64} />
      </div>
      <div style={{ height: 13, width: 84, background: '#b3b3b1', borderRadius: 6, margin: '34px 0 16px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Row w={110} /><Row w={140} /><Row w={104} /><Row w={126} />
      </div>
    </div>
    <div style={{ flex: 1, padding: '30px 36px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 30 }}>
        <div style={{ width: 24, height: 20, background: mid, borderRadius: 4 }} />
        <div style={{ height: 17, width: 250, background: '#6f6f6d', borderRadius: 8 }} />
        <div style={{ height: 12, width: 96, background: line, borderRadius: 6, marginLeft: 40 }} />
        <div style={{ height: 12, width: 76, background: line, borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 44 }}>
        {[0, 1].map((col) => (
          <div key={col} style={{ flex: 1 }}>
            <div style={{ borderTop: `4px solid ${col === 0 ? '#b9a44c' : '#6b5bd6'}`, paddingTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ height: 14, width: 88, background: '#5a5a58', borderRadius: 7 }} />
              <div style={{ width: 22, height: 22, borderRadius: 11, border: `2px solid ${line}` }} />
            </div>
            {[0, 1, 2].map((i) => <TaskCard key={i} seed={col * 3 + i + 1} />)}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Edge-hugging purple light line (multi-layer glow: wide blur layer + middle layer + bright core), horizontal segment, centered at cx
const EdgeStreak: React.FC<{ cx: number; y: number; len: number; opacity: number; vertical?: boolean }> =
  ({ cx, y, len, opacity, vertical = false }) => {
    const long = { position: 'absolute' as const, left: 0, top: 0, opacity };
    const grad = (c: string) => vertical
      ? `linear-gradient(180deg, rgba(0,0,0,0) 0%, ${c} 45%, ${c} 55%, rgba(0,0,0,0) 100%)`
      : `linear-gradient(90deg, rgba(0,0,0,0) 0%, ${c} 45%, ${c} 55%, rgba(0,0,0,0) 100%)`;
    if (vertical) {
      return (
        <div style={long}>
          <div style={{ position: 'absolute', left: y - 30, top: cx - len / 2, width: 60, height: len, background: grad('rgba(147,80,235,0.55)'), filter: 'blur(26px)' }} />
          <div style={{ position: 'absolute', left: y - 11, top: cx - len / 2, width: 22, height: len, background: grad('rgba(190,120,255,0.85)'), filter: 'blur(9px)' }} />
          <div style={{ position: 'absolute', left: y - 2.5, top: cx - len * 0.4, width: 5, height: len * 0.8, background: grad('#f0deff'), filter: 'blur(1.4px)' }} />
        </div>
      );
    }
    return (
      <div style={long}>
        <div style={{ position: 'absolute', left: cx - len / 2, top: y - 34, width: len, height: 68, background: grad('rgba(150,82,238,0.60)'), filter: 'blur(26px)' }} />
        <div style={{ position: 'absolute', left: cx - len / 2, top: y - 12, width: len, height: 24, background: grad('rgba(196,126,255,0.9)'), filter: 'blur(9px)' }} />
        <div style={{ position: 'absolute', left: cx - len * 0.4, top: y - 3, width: len * 0.8, height: 6, background: grad('#f4e4ff'), filter: 'blur(1.6px)' }} />
        {/* Pink offset layer: in the screenshot the light band is pink within the purple */}
        <div style={{ position: 'absolute', left: cx - len * 0.3, top: y - 7, width: len * 0.6, height: 12, background: grad('rgba(240,150,230,0.75)'), filter: 'blur(5px)' }} />
      </div>
    );
  };

export const GlowWakeSleepPanel: React.FC = () => {
  const frame = useCurrentFrame();

  // The spotlight sweeps along the panel's top edge from left to right at constant speed (panel-local coordinates)
  const sx = interpolate(frame, [4, 120], [-260, W + 260], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const sy = 150; // the spotlight lands on the upper part of the panel

  // Global light/dark envelope: wake → showcase → sleep
  const env = interpolate(frame, [0, 16, 100, 130], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  // Tail-stage right-edge afterglow: in the end only a line of blue-violet remains on the right edge
  const rightNear = Math.max(0, Math.min(1, (sx - (W - 420)) / 420));
  const tailBlue = interpolate(frame, [100, 116, 132], [0, 0.8, 0.25], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Logo outline light: lights up when the spotlight passes the logo (local x≈60)
  const logoGlow = Math.exp(-((sx - 60) ** 2) / (2 * 230 ** 2)) * env;

  // Slow camera drift: the panel travels from upper left to lower right with the sweep (matching the sweep direction)
  const drift = interpolate(frame, [0, 132], [-150, 150]);
  const driftY = interpolate(frame, [0, 132], [-36, 36]);

  return (
    <AbsoluteFill style={{ background: '#040308', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, perspective: 1700, perspectiveOrigin: '46% 40%' }}>
        <div style={{
          position: 'absolute', left: 400, top: 150,
          transform: `translate(${drift}px, ${driftY}px) scale(1.05) rotateY(-13deg) rotateX(9deg) rotateZ(-17deg)`,
          transformStyle: 'preserve-3d',
        }}>
          {/* Spotlight ambient haze: follows the light head, spreads across the black field behind the panel */}
          <div style={{
            position: 'absolute', left: sx - 520, top: -300, width: 1040, height: 700,
            background: 'radial-gradient(ellipse at 50% 55%, rgba(110,62,205,0.42), rgba(110,62,205,0) 65%)',
            filter: 'blur(34px)', opacity: env,
          }} />
          {/* Back-layer ghost panel (double layer in screenshots 4 and 5) */}
          <div style={{ position: 'absolute', left: -46, top: 34 }}>
            <div style={{ position: 'relative', filter: 'brightness(0.92)' }}>
              <Panel />
              {/* The ghost panel is likewise controlled by the spotlight range */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: R,
                background: `radial-gradient(circle 680px at ${sx - 46}px ${sy + 34}px, rgba(4,3,8,${1 - 0.45 * env}) 0%, rgba(4,3,8,${1 - 0.14 * env}) 55%, rgba(4,3,8,0.99) 88%)`,
              }} />
            </div>
          </div>
          {/* Panel body: develops within the spotlight range, sinks into black outside it */}
          <div style={{ position: 'relative' }}>
            <Panel />
            <div style={{
              position: 'absolute', inset: 0, borderRadius: R,
              background: `radial-gradient(circle 640px at ${sx}px ${sy}px, rgba(4,3,8,${0.12 * (1 - env)}) 0%, rgba(4,3,8,${1 - 0.72 * env}) 58%, rgba(4,3,8,0.985) 92%)`,
            }} />
            {/* Tail-stage right-edge blue-violet afterglow mask */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: R,
              background: 'linear-gradient(260deg, rgba(120,130,235,0.30) 0%, rgba(120,130,235,0) 16%)',
              opacity: tailBlue,
            }} />
          </div>
          {/* Purple light line sweeping along the top edge (body) */}
          <EdgeStreak cx={sx} y={-2} len={980} opacity={env} />
          {/* Right-edge vertical light line: lights up as the spotlight nears the right, turns blue-violet in the tail stage */}
          <EdgeStreak cx={260} y={W + 2} len={620} opacity={Math.max(rightNear * env, tailBlue * 0.9)} vertical />
          {/* Logo outline ring of light (screenshot 5: when the light passes the logo) */}
          <div style={{
            position: 'absolute', left: 8, top: 12, width: 222, height: 66, borderRadius: 16, // width wraps the logo + wordmark
            boxShadow: '0 0 26px 8px rgba(196,126,255,0.75), 0 0 60px 22px rgba(150,82,238,0.4)',
            opacity: logoGlow,
          }} />
          {/* Light head glare: a bright blob hugging the top edge */}
          <div style={{
            position: 'absolute', left: sx - 190, top: -84, width: 380, height: 170,
            background: 'radial-gradient(ellipse, rgba(236,205,255,0.95), rgba(180,110,250,0.35) 45%, rgba(0,0,0,0) 72%)',
            filter: 'blur(12px)', opacity: env * 0.95,
          }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const GLOW_WAKE_SLEEP_PANEL_DURATION = 140;
