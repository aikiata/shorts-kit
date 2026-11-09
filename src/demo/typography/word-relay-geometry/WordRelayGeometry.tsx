// word-relay-geometry: three benefit words in a relay, each word carrying a set of geometry that belongs only to it:
//   Faster   : large dashed circle + tick ring spinning down, a comet arc racing along the ring ("spinning" = fast)
//   Tighter  : three solid circles grow in turn by trim (phase offset 6f), once full they close in 40px toward the center and bite each other ("interlock" = tight)
//   Stronger : no geometry; a metallic sheen sweeps from left to right, a beat later it settles to pure white + bloom ("hard material" = strong, the promotion given to the conclusion word)
// The old word shrinks to 0.86 and defocuses as it fades out, the new word pushes in from 1.06 out of blur, the outline arrives first, and the fill wipes in with a soft edge.
//
// Second-round redesign (graphite · cinematic title card):
// - look = graphite (near-monochrome dark field, white as the accent, champagne gold only as a trace of warmth in the sheen highlight). The geometry is all white hairlines + soft glow,
//   no added color: "one word, one world" speaks through shape, not color.
// - Layout: words at 230px / 800 static font (Helvetica Neue, the outline does not expose the variable font's internal overlap lines), dead center of the frame;
//   the geometry is scaled up to frame level (dashed ring r=400, three circles r=230), the word sits over the geometry; a 40px subline under the word gives the product evidence;
//   top-left mono counter '01 / 03', top-right logo + lowercase shorts-kit wordmark, bottom three-segment progress bar (label-level texture text, not read as content).
// - Rhythm: three beats advance at equal length but within each beat "fast in, steady, decisive out": entrance 14f snappy, exit 10f exit;
//   handoff overlap 6f; after the third beat settles to white it holds 26f, the camera overall pushes in 1→1.025 very slowly (no shake).
//
// Timeline (30fps, 180f total):
//   0–2     stage light + dashed-ring start state (0.4x, semi-transparent) already on screen
//   Subline: Faster / Stronger 210px below the word, Tighter yields the bottom edge of the three circles and is pushed down to 246px
//   0–22    Faster: ring 0.4→1 snappy growth, decelerating spin; 2–16 outline in; 12–30 fill wipes in; subline from 18
//   52–62   Faster out (0.86 + defocus)
//   56–70   Tighter in; 58/64/70 three circles grow by trim (22f); 66–84 fill; 92–106 three circles close in and bite (swift)
//   112–122 Tighter out
//   116–128 Stronger in (outline); 124–148 metallic sheen sweeps; 146–158 settles to pure white + bloom once
//   158–180 hold and settle (camera pushing in very slowly)
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, FONT, mix, ramp } from '../../../shared/fixtures/Polish';
import { Dust, LOOKS, Stage, TextReveal, alpha, type } from '../../../shared/fixtures/Look';
import { BRAND, ShortKitMark } from '../../../shared/fixtures/Brand';

export const WORD_RELAY_GEOMETRY_DURATION = 180; // 6000ms @30fps

const L = LOOKS.graphite;
const W = 1920;
const H = 1080;
const CX = W / 2;
const CY = 500; // visual center slightly above the geometric center, leaving room for the subline
const WORD_SIZE = 230;
const STATIC_FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const GEO = 'rgba(236,238,244,0.42)'; // geometry lines: one notch dimmer than the text, hierarchy below the text
const GOLD = L.accent2;

type Slot = { word: string; sub: string; in0: number; out0: number | null };
const SLOTS: Slot[] = [
  { word: 'Faster', sub: 'One prompt to a finished promo.', in0: 2, out0: 52 },
  { word: 'Tighter', sub: 'Every cut locked to the beat.', in0: 56, out0: 112 },
  { word: 'Stronger', sub: 'Launch films that feel studio-made.', in0: 116, out0: null },
];

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

// Enter/exit envelope of one word: in 14f (snappy, 1.06→1 out of blur), out 10f (exit, 1→0.86 defocus)
const envelope = (f: number, s: Slot) => {
  const tin = ramp(f, s.in0, 14, EASE.snappy);
  const tout = s.out0 === null ? 0 : ramp(f, s.out0, 10, EASE.exit);
  return { tin, tout, alive: f >= s.in0 - 1 && tout < 1 };
};

// ───────────── Faster: dashed ring + tick ring + comet arc ─────────────
const FasterGeo: React.FC<{ f: number; fade: number }> = ({ f, fade }) => {
  const grow = ramp(f, 0, 22, EASE.snappy);
  const s = mix(0.4, 1, grow);
  // Spin: extra 160° on entry and decelerating (like a flywheel braking), then a slow constant spin that never stops
  const spin = -90 - 160 * (1 - grow) + f * 0.9;
  const spinTicks = 40 * (1 - grow) - f * 0.35; // tick ring spins slowly in reverse, the relative motion of the two layers reads as "rotation speed"
  const R = 400;
  const RT = 452;
  // Comet: a bright arc racing along r=400 (bright head, faded tail), angular speed much faster than the ring
  const head = -90 + f * 7.5 - 220 * (1 - grow);
  const comet = Array.from({ length: 16 }, (_, k) => {
    const a0 = ((head - k * 4) * Math.PI) / 180;
    const a1 = ((head - (k + 1) * 4) * Math.PI) / 180;
    return { d: `M ${R * Math.cos(a0)} ${R * Math.sin(a0)} A ${R} ${R} 0 0 0 ${R * Math.cos(a1)} ${R * Math.sin(a1)}`, o: (1 - k / 16) ** 1.6 };
  });
  return (
    <g opacity={fade * mix(0.35, 1, grow)} transform={`translate(${CX} ${CY}) scale(${s})`}>
      <circle r={R} fill="none" stroke={GEO} strokeWidth={2} strokeDasharray="10 16" transform={`rotate(${spin})`} />
      <g transform={`rotate(${spinTicks})`}>
        {Array.from({ length: 120 }, (_, k) => {
          const a = (k / 120) * Math.PI * 2;
          const long = k % 10 === 0;
          const r0 = RT - (long ? 18 : 8);
          return (
            <line key={k} x1={r0 * Math.cos(a)} y1={r0 * Math.sin(a)} x2={RT * Math.cos(a)} y2={RT * Math.sin(a)}
              stroke={long ? 'rgba(236,238,244,0.55)' : 'rgba(236,238,244,0.2)'} strokeWidth={long ? 2 : 1.4} />
          );
        })}
      </g>
      <circle r={R - 58} fill="none" stroke="rgba(236,238,244,0.08)" strokeWidth={1.4} />
      <g opacity={grow} style={{ filter: `drop-shadow(0 0 10px ${alpha('#ffffff', 0.6)})` }}>
        {comet.map((c, k) => (
          <path key={k} d={c.d} fill="none" stroke="#ffffff" strokeOpacity={c.o} strokeWidth={4 - k * 0.15} strokeLinecap="round" />
        ))}
      </g>
    </g>
  );
};

// ───────────── Tighter: three circles grow by trim → close in and bite ─────────────
const TighterGeo: React.FC<{ f: number; fade: number; outF: number | null }> = ({ f, fade, outF }) => {
  const R = 218;
  const tight = ramp(f, 92, 14, EASE.swift); // close in toward the center once full
  const gap = mix(340, 300, tight);
  // The circle lines brighten once when the close-in settles (the "click" of interlocking)
  const click = Math.sin(clamp01((f - 100) / 12) * Math.PI);
  return (
    <g opacity={fade} transform={`translate(${CX} ${CY})`}>
      {[-1, 0, 1].map((k, i) => {
        const grow = ramp(f, 58 + i * 6, 22, EASE.out);
        const back = outF === null ? 0 : ramp(f, outF - 4, 12, EASE.exit);
        const tr = Math.max(0, grow - back);
        const x = k * gap;
        const a = -Math.PI / 2 + tr * Math.PI * 2;
        const tip = tr > 0.001 && grow < 1 ? 1 - clamp01((grow - 0.85) / 0.15) : 0;
        return (
          <g key={k}>
            <circle cx={x} cy={0} r={R} fill="none" stroke={alpha('#ffffff', 0.4 + 0.35 * click)} strokeWidth={2.2}
              pathLength={1} strokeDasharray="1" strokeDashoffset={1 - tr} transform={`rotate(-90 ${x} 0)`} />
            {tip > 0 && (
              <circle cx={x + Math.cos(a) * R} cy={Math.sin(a) * R} r={6} fill="#ffffff" opacity={tip}
                style={{ filter: `drop-shadow(0 0 8px #ffffff) drop-shadow(0 0 22px ${alpha('#ffffff', 0.6)})` }} />
            )}
          </g>
        );
      })}
      {/* Intersections of adjacent circles: four rivet light points light up when the close-in settles, proving it "bit down" */}
      {[-1, 1].flatMap((k) => [-1, 1].map((sy) => {
        const h = Math.sqrt(Math.max(0, R * R - (gap / 2) ** 2));
        const on = ramp(f, 100 + (k + 1) * 1.5 + (sy + 1), 10, EASE.overshoot);
        return (
          <g key={`${k}${sy}`} transform={`translate(${(k * gap) / 2} ${sy * h}) rotate(45) scale(${on})`} opacity={clamp01(on)}>
            <rect x={-6} y={-6} width={12} height={12} fill="#ffffff" style={{ filter: `drop-shadow(0 0 10px ${alpha('#ffffff', 0.8)})` }} />
          </g>
        );
      }))}
    </g>
  );
};

// ───────────── Word group (outline / fill / sheen, three layers) ─────────────
const Word: React.FC<{ f: number; slot: Slot; idx: number }> = ({ f, slot, idx }) => {
  const { tin, tout } = envelope(f, slot);
  const last = idx === SLOTS.length - 1;
  const scale = mix(1.06, 1, tin) * mix(1, 0.86, tout);
  const defocus = (1 - tin) * 10 + tout * 12;
  const fillStart = slot.in0 + 10;
  const fillp = ramp(f, fillStart, 18, EASE.swift);
  // Soft-edge wipe: front ±7%
  const FE = 7;
  const edge = fillp * (100 + FE * 2) - FE;
  const mask = `linear-gradient(90deg, #000 ${(edge - FE).toFixed(2)}%, transparent ${(edge + FE).toFixed(2)}%)`;
  // Stronger: sheen appears → light sweep → settle to white
  const sh = ramp(f, 120, 10, EASE.out);
  const sweep = ramp(f, 124, 24, EASE.smooth);
  const white = ramp(f, 146, 12, EASE.out);
  const bloom = Math.sin(clamp01((f - 146) / 22) * Math.PI) * 0.9 + white * 0.35;

  const base: React.CSSProperties = {
    fontFamily: STATIC_FONT, fontSize: WORD_SIZE, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 1, whiteSpace: 'nowrap',
    // The three layers share padding: mask / background-clip only paint inside the box; without padding the descender of g and the right edge of the last letter get clipped, exposing the outline layer
    padding: '0.08em 0.1em 0.28em',
  };
  return (
    <div style={{
      position: 'absolute', left: CX, top: CY, transform: `translate(-50%, ${-0.6 * WORD_SIZE}px) scale(${scale.toFixed(4)})`, transformOrigin: `50% ${0.6 * WORD_SIZE}px`,
      opacity: clamp01(tin * 1.6) * (1 - tout), filter: defocus > 0.05 ? `blur(${defocus.toFixed(2)}px)` : undefined,
    }}>
      <div style={{ position: 'relative' }}>
        <div style={{ ...base, color: 'transparent', WebkitTextStroke: `2px ${alpha('#e9ebf0', 0.55)}`, opacity: last ? 1 - sh * 0.85 : 1 - fillp * 0.8 }}>
          {slot.word}
        </div>
        {last ? (
          <>
            {/* Metal base: vertical chrome layering (bright top, dark waist, bright bottom), reads as "hard material" */}
            <div style={{
              ...base, position: 'absolute', inset: 0, color: 'transparent',
              backgroundImage: 'linear-gradient(180deg, #f2f3f6 8%, #b9bdc6 40%, #4a4e57 52%, #8b909a 62%, #e1e3e8 88%)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', opacity: sh * (1 - white),
            }}>{slot.word}</div>
            {/* Sweep: a narrow white band with champagne warmth sweeps from left to right (only once for the conclusion word, Q4) */}
            <div style={{
              ...base, position: 'absolute', inset: 0, color: 'transparent',
              backgroundImage: `linear-gradient(100deg, transparent 38%, ${alpha(GOLD, 0.7)} 45%, #ffffff 50%, ${alpha(GOLD, 0.7)} 55%, transparent 62%)`,
              backgroundSize: '300% 100%', backgroundPosition: `${mix(100, 0, sweep).toFixed(2)}% 0`,
              WebkitBackgroundClip: 'text', backgroundClip: 'text', opacity: sh * (1 - white) * (sweep > 0 && sweep < 1 ? 1 : 0),
            }}>{slot.word}</div>
            <div style={{
              ...base, position: 'absolute', inset: 0, color: L.ink, opacity: white,
              textShadow: `0 0 ${(30 * bloom).toFixed(1)}px ${alpha('#ffffff', 0.35 * bloom)}, 0 0 ${(90 * bloom).toFixed(1)}px ${alpha('#ffffff', 0.22 * bloom)}`,
            }}>{slot.word}</div>
          </>
        ) : (
          fillp > 0 && (
            <div style={{ ...base, position: 'absolute', inset: 0, color: L.ink, WebkitMaskImage: mask, maskImage: mask }}>{slot.word}</div>
          )
        )}
      </div>
    </div>
  );
};

export const WordRelayGeometry: React.FC = () => {
  const f = useCurrentFrame();
  // Camera: very slow push-in 1→1.025 throughout (smooth, no speed jumps at start and end), gives the hold segment a bit of breathing room
  const cam = mix(1, 1.025, ramp(f, 0, 180, EASE.smooth));
  const e = SLOTS.map((s) => envelope(f, s));
  const active = f < 56 ? 0 : f < 116 ? 1 : 2;
  // The key light brightens once when Stronger settles to white
  const flare = Math.sin(clamp01((f - 146) / 26) * Math.PI);

  return (
    <AbsoluteFill style={{ background: L.bg[2] }}>
      <Stage look={L} keyLight={{ x: 0.5, y: 0.34 }} fill={{ x: 0.5, y: 1.05 }} intensity={0.62 + flare * 0.3} breathe={0.4}>
        <Dust look={L} count={26} seed={7} drift={0.18} opacity={0.35} />
      </Stage>

      <AbsoluteFill style={{ transform: `scale(${cam.toFixed(4)})`, transformOrigin: `${CX}px ${CY}px` }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {e[0].alive && <FasterGeo f={f} fade={1 - e[0].tout} />}
          {e[1].alive && (
            <g transform={`translate(${CX} ${CY}) scale(${mix(1.04, 1, e[1].tin) * mix(1, 0.9, e[1].tout)}) translate(${-CX} ${-CY})`}>
              <TighterGeo f={f} fade={clamp01(e[1].tin * 2) * (1 - e[1].tout)} outF={SLOTS[1].out0} />
            </g>
          )}
        </svg>

        {/* Horizon light band where Stronger settles: a horizontal cool-white band at the feet of the conclusion word, appears only once */}
        <div style={{
          position: 'absolute', left: CX - 700, width: 1400, top: CY + 158, height: 2,
          background: `linear-gradient(90deg, transparent, ${alpha('#ffffff', 0.7)} 50%, transparent)`,
          opacity: ramp(f, 148, 14, EASE.out) * 0.8, transform: `scaleX(${mix(0.2, 1, ramp(f, 146, 22, EASE.snappy))})`,
          boxShadow: `0 0 24px ${alpha('#ffffff', 0.4)}`,
        }} />

        {SLOTS.map((s, i) => (e[i].alive ? <Word key={s.word} f={f} slot={s} idx={i} /> : null))}

        {/* Subline: 40px, rises from below the line after the word settles, exits together with the word */}
        {SLOTS.map((s, i) =>
          e[i].alive ? (
            <div key={`sub${i}`} style={{
              position: 'absolute', left: 0, right: 0, top: CY + (i === 1 ? 246 : 210), textAlign: 'center',
              ...type(40, 450), color: L.ink2, opacity: 1 - e[i].tout,
              filter: e[i].tout > 0.02 ? `blur(${(e[i].tout * 6).toFixed(2)}px)` : undefined,
            }}>
              <TextReveal text={s.sub} by="word" variant="rise" start={s.in0 + (i === 2 ? 34 : 16)} each={16} gap={2.2} />
            </div>
          ) : null,
        )}
      </AbsoluteFill>

      {/* Frame decoration (does not follow the camera): top-left counter, bottom three-segment progress, label-level texture text */}
      <div style={{ position: 'absolute', left: 120, top: 96, fontFamily: FONT.mono, fontSize: 22, letterSpacing: '0.18em', color: L.ink3, opacity: ramp(f, 0, 14, EASE.out) }}>
        <span style={{ color: L.ink }}>{`0${active + 1}`}</span> / 03
      </div>
      {/* Top-right brand mark: logo + lowercase wordmark (label level, does not compete with the word) */}
      <div style={{ position: 'absolute', right: 120, top: 90, display: 'flex', alignItems: 'center', gap: 12, fontFamily: FONT.mono, fontSize: 22, letterSpacing: '0.1em', color: L.ink3, opacity: ramp(f, 4, 14, EASE.out) }}>
        <ShortKitMark size={34} tone="dark" />
        {BRAND.name}
      </div>
      <div style={{ position: 'absolute', left: 120, right: 120, bottom: 96, display: 'flex', gap: 24 }}>
        {SLOTS.map((s, i) => {
          const start = s.in0;
          const end = s.out0 ?? 158;
          const p = ramp(f, start, end - start, EASE.linear);
          const on = i === active;
          return (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ height: 2, background: alpha('#ffffff', 0.1), position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: on ? L.ink : alpha('#ffffff', 0.45), transform: `scaleX(${p})`, transformOrigin: 'left' }} />
              </div>
              <div style={{ marginTop: 16, fontFamily: FONT.mono, fontSize: 22, letterSpacing: '0.18em', textTransform: 'uppercase', color: on ? L.ink : L.ink3, transition: 'none' }}>
                {`0${i + 1}  ${s.word}`}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
