// invisible-cut: foreground-occlusion invisible cut. A defocused foreground object very close to the lens sweeps across the face of the frame; in the one or two frames when it blurs the whole screen,
// the background hard-cuts from A to B without a trace, and when the foreground sweeps out the viewer thinks it is still the same shot. (invisible-cut + foreground-occlusion-swipe)
//
// Second-round redesign (warm sand lifestyle, "tap book, and in a blink it's booked"):
// - look = sand (beige, terracotta, indigo accents), serif titles + sans-serif UI; the product = the shorts-kit final render page.
//   A: release-film shot detail: on the left an 860px procedurally drawn dune sunset "shot frame" (corner tag = lens-carved mark + shot number), on the right a large serif title,
//   shot count / duration, specs and a large terracotta "Render" button; B: render complete: on the left a 168px serif "That's a wrap.", on the right a ticket-stub card
//   (the top is still that dune picture = visual continuity, perforation line, large render number, terracotta checkmark stamp). Causality is one line: press Render -> a blink -> the film is out.
//   The layout swaps left and right: the scene change is large but not jarring.
// - The occluder = a defocused dark-brown foreground brushing past the lens (like a pillar walking past the camera): drawn purely with gradients (solid center, 340px soft edges on both sides = the look of defocus +
//   motion blur), a terracotta rim light on the leading edge reads as "a lit object"; a 640px soft shadow in front sweeps the page first (a near object blocking light).
//   No CameraMotionBlur (12x sampling is too expensive); the soft-edged gradient is the blur itself.
// - The illusion of one take: a slow lateral drift in a constant direction throughout (content +40 -> -40px, smooth easing at start and end) runs through the cut point;
//   the occluder moves the same direction but 50 times faster (parallax: near large, far small); before the cut A is dragged 28px left "by the wind" (ease-in), after the cut B settles back from 28px right (ease-out 14f).
//
// Timeline (30fps, 110f total):
//   0-24    A at rest (the first frame is already a complete picture), lateral drift starts very slowly, the sun disc in the photo breathes slightly
//   24-32   Anticipation: Render button pressed (0.96 scale + darken over 6f) -> label changes to "Rendering..."
//   32-46   Occluder sweeps right -> left over 14f (bezier 0.3,0,0.7,1); at 39f the solid region covers all 1920, hard cut A->B
//   39-53   B settles back from the right; 46-64 stamp springs into place, checkmark is drawn; 45-68 caption line and confirmation code rise staggered
//   70-110  hold 40f: drift finishes, sun disc breathes
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, FONT, bezier, mix, ramp } from '../../../shared/fixtures/Polish';
import { LOOKS, SERIF, Stage, alpha, springAt, type } from '../../../shared/fixtures/Look';
import { BRAND, ShortKitMark } from '../../../shared/fixtures/Brand';

export const INVISIBLE_CUT_DURATION = 110;

const S = LOOKS.sand;
const PAD = 120;
const PRESS = 24; // press Render
const SW_START = 32; // occluder enters frame
const SW_END = 46; // occluder leaves frame
const CUT = 39; // hard cut: the frame where the solid region covers the whole frame
const SOFT = 340; // occluder soft-edge width
const CORE = 2600; // occluder solid width (> 1920, leaves a full-cover window of more than 1 frame)
const OCC_W = CORE + SOFT * 2;
const B_SHIFT = 40; // layout shift to the right for page B (offsets the drift end point of -40)

// Occluder left-edge position: outside frame right -> outside frame left
const SWEEP_EASE = bezier(0.3, 0, 0.7, 1); // eases in and out at start and end, fastest in the middle
const occX = (f: number) => mix(1940, -OCC_W - 20, ramp(f, SW_START, SW_END - SW_START, SWEEP_EASE));

// ------------- Procedurally drawn dune sunset -------------
const Dunes: React.FC<{ w: number; h: number; f: number; id: string }> = ({ w, h, f, id }) => {
  const breathe = 1 + 0.04 * Math.sin(f / 16);
  return (
    <svg width={w} height={h} viewBox="0 0 860 760" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d98a5c" />
          <stop offset="0.4" stopColor="#eeae78" />
          <stop offset="0.6" stopColor="#f8d2a0" />
        </linearGradient>
        <radialGradient id={`sun${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffe6bf" stopOpacity={0.85} />
          <stop offset="0.4" stopColor="#ffd9a6" stopOpacity={0.45} />
          <stop offset="1" stopColor="#ffd9a6" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`d1${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e09a63" />
          <stop offset="1" stopColor="#c8743f" />
        </linearGradient>
        <linearGradient id={`d2${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c76b38" />
          <stop offset="1" stopColor="#9c4724" />
        </linearGradient>
        <linearGradient id={`d3${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8f3f1f" />
          <stop offset="1" stopColor="#5e2611" />
        </linearGradient>
        <linearGradient id={`sh${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a160a" stopOpacity={0} />
          <stop offset="0.6" stopColor="#3a160a" stopOpacity={0} />
          <stop offset="1" stopColor="#3a160a" stopOpacity={0.35} />
        </linearGradient>
      </defs>
      <rect width={860} height={760} fill={`url(#sky${id})`} />
      <circle cx={560} cy={400} r={190 * breathe} fill={`url(#sun${id})`} opacity={0.95} />
      <circle cx={560} cy={400} r={56} fill="#fffbf2" />
      {/* far dunes */}
      <path d="M0 440 C 140 400 260 420 380 440 C 520 462 640 410 860 420 L860 760 L0 760 Z" fill={`url(#d1${id})`} />
      {/* middle dune: ridge bright on the left, dark on the right */}
      <path d="M0 540 C 120 470 230 460 330 500 C 430 540 520 470 640 486 C 740 498 800 530 860 520 L860 760 L0 760 Z" fill={`url(#d2${id})`} />
      {/* ridge lighting: a bright edge along the middle dune ridge */}
      <path d="M0 540 C 120 470 230 460 330 500 C 430 540 520 470 640 486" fill="none" stroke="#f3b27a" strokeWidth={3} opacity={0.55} />
      {/* near dunes */}
      <path d="M0 650 C 160 590 300 600 430 640 C 560 680 700 600 860 620 L860 760 L0 760 Z" fill={`url(#d3${id})`} />
      {/* campsite: silhouettes of three small tents + a point of warm light */}
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${196 + i * 46} ${598 - i * 4})`}>
          <path d="M0 0 L 18 -26 L 36 0 Z" fill="#3b1a0c" />
          <circle cx={18} cy={-6} r={3.2} fill="#ffd38a" opacity={0.9} />
        </g>
      ))}
      <rect width={860} height={760} fill={`url(#sh${id})`} />
    </svg>
  );
};

// ------------- A: release-film shot detail -------------
const PageA: React.FC<{ f: number }> = ({ f }) => {
  const down = ramp(f, PRESS, 4, EASE.out) * (1 - ramp(f, PRESS + 5, 8, EASE.out));
  const reserving = f >= PRESS + 4;
  return (
    <>
      <div style={{
        position: 'absolute', left: PAD, top: 160, width: 860, height: 760, borderRadius: 36, overflow: 'hidden',
        boxShadow: `0 2px 4px ${alpha(S.shadow, 0.12)}, 0 40px 90px -30px ${alpha(S.shadow, 0.45)}`,
      }}>
        <Dunes w={860} h={760} f={f} id="a" />
        <div style={{
          position: 'absolute', left: 32, top: 32, height: 60, padding: '0 24px', borderRadius: 30, display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(255,248,238,0.86)', boxShadow: `0 8px 24px -8px ${alpha(S.shadow, 0.4)}`,
          ...type(30, 650), color: S.ink,
        }}>
          <ShortKitMark size={34} tone="light" /> Shot 03 <span style={{ color: S.ink2, fontWeight: 500 }}>· Golden hour</span>
        </div>
      </div>

      <div style={{ position: 'absolute', left: 1064, top: 176, width: 736 }}>
        <div style={{ ...type(28, 700, { caps: true }), letterSpacing: '0.14em', color: S.accent }}>Launch film · Final cut</div>
        <div style={{ fontFamily: SERIF, fontSize: 92, fontWeight: 500, lineHeight: 1.0, letterSpacing: '-0.025em', color: S.ink, marginTop: 26 }}>
          Direct the film.<br />Let the <i style={{ color: S.accent }}>agent</i><br />shoot it.
        </div>
        <div style={{ display: 'flex', marginTop: 44, borderTop: `1.5px solid ${S.line}`, borderBottom: `1.5px solid ${S.line}` }}>
          {[['Shots', '12 cuts'], ['Length', '0:45 · 30fps']].map(([k, v], i) => (
            <div key={k} style={{ flex: 1, padding: '22px 0', paddingLeft: i ? 32 : 0, borderLeft: i ? `1.5px solid ${S.line}` : undefined }}>
              <div style={{ ...type(26, 600, { caps: true }), letterSpacing: '0.1em', color: S.ink3 }}>{k}</div>
              <div style={{ ...type(40, 600), color: S.ink, marginTop: 6 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 34 }}>
          <span style={{ ...type(76, 700), color: S.ink }}>1080p</span>
          <span style={{ ...type(32, 500), color: S.ink2 }}>h264 · beat-synced SFX</span>
        </div>
        <div style={{
          marginTop: 34, height: 116, borderRadius: 58, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18,
          background: `linear-gradient(180deg, #d0643a 0%, ${S.accent} 100%)`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 ${mix(18, 6, down)}px ${mix(40, 16, down)}px -12px ${alpha('#8a3414', 0.55)}`,
          transform: `scale(${(1 - 0.04 * down).toFixed(4)})`, filter: down > 0.01 ? `brightness(${1 - 0.12 * down})` : undefined,
          ...type(42, 650), color: S.onAccent,
        }}>
          {reserving && (
            <span style={{
              width: 30, height: 30, borderRadius: 15, border: `4px solid ${alpha(S.onAccent, 0.35)}`, borderTopColor: S.onAccent,
              transform: `rotate(${(f - PRESS) * 24}deg)`, boxSizing: 'border-box',
            }} />
          )}
          {reserving ? 'Rendering…' : 'Render'}
        </div>
      </div>
    </>
  );
};

// ------------- B: render complete -------------
const PageB: React.FC<{ f: number }> = ({ f }) => {
  const seal = springAt(f, CUT + 7, { damping: 13, stiffness: 190 });
  const check = ramp(f, CUT + 12, 14, EASE.out);
  const rows = [0, 1, 2].map((i) => ramp(f, CUT + 6 + i * 5, 18, EASE.snappy));
  return (
    <>
      <div style={{ position: 'absolute', left: PAD, top: 214, width: 900 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, ...type(28, 700, { caps: true }), letterSpacing: '0.14em', color: S.accent }}>
          <span style={{ width: 14, height: 14, borderRadius: 7, background: S.accent }} />
          Render complete
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 168, fontWeight: 500, lineHeight: 0.94, letterSpacing: '-0.035em', color: S.ink, marginTop: 30 }}>
          That’s a<br /><i style={{ color: S.accent }}>wrap.</i>
        </div>
        <div style={{ ...type(42, 500), color: S.ink2, marginTop: 52, lineHeight: 1.35, opacity: rows[0], transform: `translateY(${(1 - rows[0]) * 22}px)` }}>
          Launch film · 12 shots, beat-synced,<br />crafted with {BRAND.name}
        </div>
        <div style={{ ...type(32, 500), color: S.ink3, marginTop: 30, opacity: rows[1], transform: `translateY(${(1 - rows[1]) * 22}px)` }}>
          MP4 and JianYing project saved to your folder
        </div>
      </div>

      {/* ticket-stub card */}
      <div style={{
        position: 'absolute', left: 1140, top: 150, width: 660, height: 780, borderRadius: 34, overflow: 'hidden', background: S.surface,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.9), 0 2px 4px ${alpha(S.shadow, 0.1)}, 0 44px 90px -30px ${alpha(S.shadow, 0.42)}`,
      }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 660, height: 330, overflow: 'hidden' }}>
          <Dunes w={660} h={330} f={f} id="b" />
        </div>
        {/* perforation line + semicircle notches on both sides */}
        <div style={{ position: 'absolute', left: 44, right: 44, top: 520, borderTop: `3px dashed ${alpha(S.ink3, 0.45)}` }} />
        {[-26, 634].map((x) => (
          <div key={x} style={{ position: 'absolute', left: x, top: 494, width: 52, height: 52, borderRadius: 26, background: S.bg[1], boxShadow: `inset 0 2px 6px ${alpha(S.shadow, 0.18)}` }} />
        ))}
        <div style={{ position: 'absolute', left: 52, top: 362, display: 'flex', justifyContent: 'space-between', width: 556 }}>
          {[['Shots', '12'], ['Length', '0:45']].map(([k, v]) => (
            <div key={k}>
              <div style={{ ...type(24, 650, { caps: true }), letterSpacing: '0.12em', color: S.ink3 }}>{k}</div>
              <div style={{ fontFamily: SERIF, fontSize: 64, fontWeight: 500, letterSpacing: '-0.02em', color: S.ink, marginTop: 4 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', left: 52, top: 570, opacity: rows[2], transform: `translateY(${(1 - rows[2]) * 20}px)` }}>
          <div style={{ ...type(24, 650, { caps: true }), letterSpacing: '0.12em', color: S.ink3 }}>Render</div>
          <div style={{ fontFamily: FONT.mono, fontSize: 64, fontWeight: 600, letterSpacing: '0.02em', color: S.ink, marginTop: 8 }}>SC-4821</div>
          <div style={{ ...type(30, 500), color: S.ink2, marginTop: 14 }}>12 shots · 0:45 · 1080p</div>
        </div>
      </div>
      {/* terracotta stamp: pressed at the junction of the photo and the ticket, springs into place + checkmark is drawn */}
      <div style={{
        position: 'absolute', left: 1640, top: 270, width: 150, height: 150,
        transform: `rotate(${mix(-30, -8, seal)}deg) scale(${mix(1.8, 1, seal).toFixed(4)})`, opacity: Math.min(1, seal * 3),
      }}>
        <svg width={150} height={150} viewBox="0 0 150 150" style={{ overflow: 'visible', filter: `drop-shadow(0 14px 22px ${alpha('#7a2c10', 0.45)})` }}>
          <circle cx={75} cy={75} r={70} fill={S.accent} />
          <circle cx={75} cy={75} r={58} fill="none" stroke={alpha(S.onAccent, 0.5)} strokeWidth={2} strokeDasharray="3 6" />
          <path d="M48 77 L 67 96 L 104 56" fill="none" stroke={S.onAccent} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={90} strokeDashoffset={90 * (1 - check)} />
        </svg>
      </div>
    </>
  );
};

export const InvisibleCut: React.FC = () => {
  const frame = useCurrentFrame();
  const DUR = INVISIBLE_CUT_DURATION;
  // Slow lateral drift through the cut point: content +40 -> -40px (smooth start and end); page B is laid out shifted 40px right overall, returning to the 120 safe margin when it settles
  const pan = 40 - 80 * ramp(frame, 0, DUR, EASE.smooth);
  // wind push: before the cut A is dragged left (ease-in), after the cut B settles back from the right (ease-out)
  const shove = frame < CUT ? -28 * ramp(frame, SW_START - 2, CUT - SW_START + 2, EASE.exit) : 28 * (1 - ramp(frame, CUT, 14, EASE.out));
  const x = occX(frame);
  const sweeping = frame >= SW_START && frame <= SW_END;
  // near-object light block: soft shadow in front of the occluder
  const lead = x;

  return (
    <AbsoluteFill style={{ background: S.bg[1], overflow: 'hidden' }}>
      <Stage look={S} keyLight={{ x: 0.3, y: 0.05 }} fill={{ x: 0.9, y: 0.95 }} vignette={0.2} grain={0.05} />
      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${(pan + shove).toFixed(2)}px)` }}>
        {frame < CUT ? <PageA f={frame} /> : <div style={{ position: 'absolute', inset: 0, left: B_SHIFT }}><PageB f={frame} /></div>}
      </div>

      {sweeping && (
        <>
          {/* front soft shadow */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: lead - 640, width: 640 + SOFT,
            background: `linear-gradient(90deg, ${alpha('#2a170c', 0)} 0px, ${alpha('#2a170c', 0.38)} 640px, ${alpha('#2a170c', 0.5)} ${640 + SOFT}px)`,
          }} />
          {/* defocused foreground: soft edges on both sides + solid core + terracotta rim light on the leading edge */}
          <div style={{
            position: 'absolute', top: -40, bottom: -40, left: x, width: OCC_W,
            background: `linear-gradient(90deg, rgba(43,26,16,0) 0px, rgba(43,26,16,0.85) ${SOFT * 0.6}px, #2b1a10 ${SOFT}px, #24150c ${SOFT + CORE}px, rgba(36,21,12,0.8) ${SOFT + CORE + SOFT * 0.4}px, rgba(36,21,12,0) ${OCC_W}px)`,
          }}>
            <div style={{
              position: 'absolute', top: 0, bottom: 0, left: SOFT * 0.35, width: 260,
              background: `linear-gradient(90deg, ${alpha('#e0703f', 0)} 0%, ${alpha('#e0703f', 0.42)} 45%, ${alpha('#e0703f', 0)} 100%)`,
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(255,210,170,0.08) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.25) 100%)',
              // applies only to the solid region; fades out at the soft edges (otherwise a hard edge is drawn on the transparent soft edge)
              WebkitMaskImage: `linear-gradient(90deg, transparent 0px, #000 ${SOFT}px, #000 ${SOFT + CORE}px, transparent ${OCC_W}px)`,
              maskImage: `linear-gradient(90deg, transparent 0px, #000 ${SOFT}px, #000 ${SOFT + CORE}px, transparent ${OCC_W}px)`,
            }} />
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
