// bottom-push-stack-wipe —— slack-promo 22–27s
// The chapter-change technique is unchanged: the new chapter, with its base color, pushes up from the bottom edge across the whole screen and rigidly shoves the old chapter out of frame (both layers same speed, same easing), three chapters in a row,
// each chapter in a saturated base color, with content pinned in its own colored base coordinate system and moving with it; the shadow on the top seam is physical-contact evidence of the "shove".
//
// Round 2 redesign (design decisions)
// - look = custom "Swiss poster": chapter 0 opens in near-black, and the three chapters are three full-bleed saturated color panels: cobalt blue / vermilion orange / acid lime,
//   hues spread about 120 degrees apart, so a chapter change reads at a glance as "a different world". The product is shorts-kit, one selling point per chapter (video from one sentence / beat-synced editing / automatic delivery).
// - Layout: left column starts at the 120px safe margin, eyebrow (chapter number + name) then 116px extra-bold two-line title then 40px description;
//   the right column holds one big-type UI card designed for the camera (chat with the agent / beat-sync timeline / delivery pipeline), font size >= 30px; the panel itself is lit from top left and darkened at bottom right,
//   cards cast two layers of soft shadow with a hue (same light direction), so even a flat poster has foreground and background.
// - Push-in: 26f heavy ease-out (fast in, slow stop: a "thunk"), the whole stack gets directional vertical blur by speed; the new chapter's top edge has a 2px lit edge +
//   a 56px contact shadow cast on the old chapter. During the push window all in-chapter elements are still (pinned), and the title rises from below the line only about 8f before settling,
//   the UI card's small actions (typing, then message appears / speech waveform / automation ticking off step by step) all sit in the hold, avoiding the push.
//
// Timeline (30fps, 170f)
//   0-22    Chapter 0: near-black base with "Meet shorts-kit." already on screen, title rises line by line from 0f, settles at 2-20f
//   22-48   Push in 01 cobalt blue (26f heavy ease-out, already at 95% by ~34f), then 34f title rises, 36-48f third message shows "typing", 48f pops in
//   48-66   hold (read)
//   66-92   Push in 02 vermilion orange, then 78f title; waveform and timer run throughout, from 82f the second shot ring lights up
//   92–110  hold
//   110-136 Push in 03 acid lime (dark text), then 122f title, 126/134/142f the three steps tick off in turn (spring)
//   142-170 hold 28f: very slow push in 1.5%, the last frame is a complete chapter poster
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, FONT, Grain, SpeedBlur, bezier, mix, ramp, softShadow, velocity } from '../../../shared/fixtures/Polish';
import { TextReveal, alpha, springAt, type } from '../../../shared/fixtures/Look';
import { BRAND, PITCH, ShortKitMark, ShortKitWordmark } from '../../../shared/fixtures/Brand';

const H = 1080;

export const BOTTOM_PUSH_STACK_WIPE_DURATION = 170;

const PUSH_STARTS = [22, 66, 110];
const PUSH_DUR = 26;
const heavyEaseOut = bezier(0.12, 0.9, 0.2, 1); // fast in, slow stop (the push-in curve pinned in the md)

type Chapter = {
  num: string; name: string; title: string; sub: string;
  hi: string; base: string; lo: string; shade: string; ink: string; ink2: string;
};
const CHAPTERS: Chapter[] = [
  {
    num: '00', name: 'Agent skill', title: `Meet\n${BRAND.name}.`, sub: PITCH.en.taglines[1],
    hi: '#1c1c1e', base: '#141415', lo: '#0c0c0d', shade: '#000000', ink: '#f4f2ee', ink2: 'rgba(244,242,238,0.62)',
  },
  {
    num: '01', name: 'Prompt', title: 'One prompt.\nOne film.', sub: 'Describe the promo. Your agent storyboards every shot.',
    hi: '#4565ff', base: '#2d4cff', lo: '#1c37e0', shade: '#0a1670', ink: '#ffffff', ink2: 'rgba(255,255,255,0.78)',
  },
  {
    num: '02', name: 'Rhythm', title: 'Cut on\nthe beat.', sub: 'Every shot lands on the music, frame for frame.',
    hi: '#ff6a3d', base: '#ff4d1f', lo: '#e83c10', shade: '#6e1600', ink: '#ffffff', ink2: 'rgba(255,255,255,0.8)',
  },
  {
    num: '03', name: 'Delivery', title: 'Delivery,\nautomated.', sub: 'Render, export and publish the moment the cut locks.',
    hi: '#dcfb5e', base: '#cdf23a', lo: '#b8dc22', shade: '#3c4a00', ink: '#121407', ink2: 'rgba(18,20,7,0.68)',
  },
];

const pushP = (f: number, i: number) => ramp(f, PUSH_STARTS[i], PUSH_DUR, heavyEaseOut);
const stackY = (f: number) => PUSH_STARTS.reduce((s, _, i) => s + pushP(f, i), 0) * H;
// Each chapter's "settle" frame (the reference for when the title starts rising); chapter 0 = 0
const landAt = (i: number) => (i === 0 ? -10 : PUSH_STARTS[i - 1] + 12);

const SANS = FONT.sans;

// ───────────── UI card (designed for the camera: few elements, big type, strong contrast) ─────────────
const Avatar: React.FC<{ c: string; t: string; size?: number; ring?: number; ringColor?: string; mark?: boolean }> = ({ c, t, size = 64, ring = 0, ringColor = '#fff', mark = false }) => (
  <div style={{
    width: size, height: size, borderRadius: size / 2, flex: 'none', background: c, color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 700,
    fontSize: size * 0.38, letterSpacing: '-0.01em',
    boxShadow: ring > 0 ? `0 0 0 ${4 + 6 * ring}px ${alpha(ringColor, 0.25 + 0.5 * ring)}` : undefined,
  }}>{mark ? <ShortKitMark size={size * 0.62} tone="dark" /> : t}</div>
);

const ChannelCard: React.FC<{ frame: number }> = ({ frame }) => {
  const t0 = PUSH_STARTS[0] + 14; // typing hint (the push-in is already at 95%)
  const typing = frame >= t0 && frame < t0 + 12;
  const msg = springAt(frame, t0 + 12, { damping: 18, stiffness: 200 });
  const msgs = [
    { c: '#7c5cff', t: 'MK', name: 'Maya', time: '9:41', text: 'Cut a 30s launch film for our app.', mark: false },
    { c: BRAND.ink, t: '', name: 'shorts-kit', time: '9:42', text: 'Storyboard ready: 12 shots, on beat.', mark: true },
  ];
  return (
    <div style={{ width: 760, padding: '40px 44px 44px', fontFamily: SANS, color: '#0e1020' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, paddingBottom: 28, borderBottom: '2px solid rgba(14,16,32,0.08)' }}>
        <div style={{ ...type(44, 800), color: '#0e1020' }}># launch-film</div>
        <div style={{ marginLeft: 'auto', fontSize: 28, fontWeight: 500, color: '#7a7f99' }}>3 members</div>
      </div>
      {msgs.map((m, k) => (
        <div key={k} style={{ display: 'flex', gap: 22, marginTop: 32 }}>
          <Avatar c={m.c} t={m.t} mark={m.mark} />
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
              <span style={{ fontSize: 32, fontWeight: 750, letterSpacing: '-0.015em' }}>{m.name}</span>
              <span style={{ fontSize: 24, color: '#9a9fb5', fontVariantNumeric: 'tabular-nums' }}>{m.time}</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 450, color: '#3a3f58', marginTop: 6, lineHeight: 1.25 }}>{m.text}</div>
          </div>
        </div>
      ))}
      {/* Third message: typing, then message pops in */}
      <div style={{ position: 'relative', height: 132, marginTop: 32 }}>
        {typing && (
          <div style={{ position: 'absolute', left: 86, top: 20, display: 'flex', gap: 10, alignItems: 'center', padding: '18px 24px', borderRadius: 24, background: '#eef0fb' }}>
            {[0, 1, 2].map((d) => (
              <div key={d} style={{ width: 13, height: 13, borderRadius: 7, background: '#2d4cff', opacity: 0.35 + 0.65 * (0.5 + 0.5 * Math.sin((frame - t0) * 0.7 - d * 1.1)) }} />
            ))}
          </div>
        )}
        {frame >= t0 + 12 && (
          <div style={{ display: 'flex', gap: 22, opacity: Math.min(1, msg * 1.5), transform: `translateY(${((1 - msg) * 26).toFixed(2)}px)` }}>
            <Avatar c="#ff7a1a" t="IR" />
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                <span style={{ fontSize: 32, fontWeight: 750, letterSpacing: '-0.015em' }}>Ines</span>
                <span style={{ fontSize: 24, color: '#9a9fb5' }}>9:44</span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#2d4cff', padding: '8px 22px', borderRadius: 999, background: '#e8ecff' }}>Render it  ↗</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const HuddleCard: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame - PUSH_STARTS[1];
  const people = [
    { c: '#7c5cff', t: '01', name: 'Hook' },
    { c: '#00a37a', t: '02', name: 'Zoom' },
    { c: '#ff9f1c', t: '03', name: 'Whip' },
    { c: '#3a86ff', t: '04', name: 'Sting' },
  ];
  // Current shot: first 01 Hook, from 82f handed to 02 Zoom (ring crossfades over 6f, switching shots on the beat)
  const handoff = ramp(frame, PUSH_STARTS[1] + 16, 8, EASE.smooth);
  const speak = [1 - handoff, handoff, 0, 0];
  const secs = 12 + Math.floor(Math.max(0, t) / 30);
  return (
    <div style={{ width: 760, padding: '40px 44px 44px', fontFamily: SANS, color: '#f6f3ef' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 16, height: 16, borderRadius: 8, background: '#3ddc84', boxShadow: '0 0 0 6px rgba(61,220,132,0.18)' }} />
        <div style={{ ...type(40, 800) }}>Beat sync · 128 BPM</div>
        <div style={{ marginLeft: 'auto', fontSize: 32, fontWeight: 600, color: 'rgba(246,243,239,0.6)', fontFamily: FONT.mono }}>
          {String(Math.floor(secs / 60)).padStart(2, '0')}:{String(secs % 60).padStart(2, '0')}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 52 }}>
        {people.map((p, k) => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
            <Avatar c={p.c} t={p.t} size={124} ring={speak[k] * (0.75 + 0.25 * Math.sin(frame * 0.5))} ringColor="#3ddc84" />
            <div style={{ fontSize: 30, fontWeight: 600, color: speak[k] > 0.5 ? '#ffffff' : 'rgba(246,243,239,0.6)' }}>{p.name}</div>
          </div>
        ))}
      </div>
      {/* Waveform: deterministic sum of sines */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, height: 96, marginTop: 44 }}>
        {Array.from({ length: 44 }, (_, j) => {
          const a = 0.5 + 0.5 * Math.sin(frame * 0.42 + j * 0.62) * Math.sin(frame * 0.17 + j * 0.23);
          const env = Math.sin((j / 43) * Math.PI);
          return <div key={j} style={{ flex: 1, height: `${(12 + 84 * a * env).toFixed(1)}%`, borderRadius: 4, background: j % 9 === 4 ? '#ff6a3d' : 'rgba(246,243,239,0.82)' }} />;
        })}
      </div>
      <div style={{ display: 'flex', gap: 18, marginTop: 40 }}>
        <div style={{ flex: 1, height: 76, borderRadius: 38, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 650 }}>Preview</div>
        <div style={{ width: 210, height: 76, borderRadius: 38, background: '#ff4d1f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 700 }}>Render</div>
      </div>
    </div>
  );
};

const WorkflowCard: React.FC<{ frame: number }> = ({ frame }) => {
  const steps = ['Render 1080p master', 'Export JianYing draft', 'Post to the gallery'];
  const at = [PUSH_STARTS[2] + 16, PUSH_STARTS[2] + 24, PUSH_STARTS[2] + 32];
  return (
    <div style={{ width: 760, padding: '40px 44px 48px', fontFamily: SANS, color: '#121407' }}>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '0.12em', color: '#7b8064', textTransform: 'uppercase' }}>Trigger</div>
      <div style={{ ...type(44, 800), marginTop: 12 }}>When the cut locks</div>
      <div style={{ position: 'relative', marginTop: 36 }}>
        {/* Vertical connector line: "pours" downward as steps tick off */}
        <div style={{ position: 'absolute', left: 31, top: 56, height: 224, width: 3, background: 'rgba(18,20,7,0.1)' }} />
        <div style={{
          position: 'absolute', left: 31, top: 56, width: 3, background: '#121407',
          height: (ramp(frame, at[0], at[2] - at[0], EASE.swift) * (112 * 2)).toFixed(2) + 'px',
        }} />
        {steps.map((s, k) => {
          const c = springAt(frame, at[k], { damping: 14, stiffness: 240 });
          const on = frame >= at[k];
          return (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 28, height: 112, position: 'relative' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 32, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: on ? '#121407' : '#f3f5e6', boxShadow: on ? 'none' : 'inset 0 0 0 3px rgba(18,20,7,0.14)',
                transform: `scale(${on ? mix(0.6, 1, c).toFixed(4) : 1})`,
              }}>
                {on && (
                  <svg width={30} height={30} viewBox="0 0 30 30">
                    <path d="M7 15.5 L13 21 L23.5 9.5" fill="none" stroke="#cdf23a" strokeWidth={4.2} strokeLinecap="round" strokeLinejoin="round"
                      strokeDasharray={28} strokeDashoffset={(28 * (1 - Math.min(1, c))).toFixed(2)} />
                  </svg>
                )}
              </div>
              <div style={{ fontSize: 36, fontWeight: 650, letterSpacing: '-0.015em', color: on ? '#121407' : '#8d927a' }}>{s}</div>
              <div style={{ marginLeft: 'auto', fontSize: 26, fontWeight: 600, color: '#8d927a', opacity: on ? Math.min(1, c) : 0, fontFamily: FONT.mono }}>
                {['38s', '2.4s', '0.6s'][k]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ───────────── Chapter ─────────────
const ChapterScene: React.FC<{ i: number; frame: number }> = ({ i, frame }) => {
  const c = CHAPTERS[i];
  const land = landAt(i);
  const dark = i === 0;
  const cardBg = i === 2 ? 'linear-gradient(180deg, #1d1411 0%, #140d0b 100%)' : 'linear-gradient(180deg, #ffffff 0%, #fafaf7 100%)';
  return (
    <AbsoluteFill style={{ background: `linear-gradient(176deg, ${c.hi} 0%, ${c.base} 44%, ${c.lo} 100%)`, overflow: 'hidden', fontFamily: SANS }}>
      {/* Lighting: soft flare at top left + darkening at bottom right (same light direction, consistent with the card shadows) */}
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse 62% 70% at 18% 6%, rgba(255,255,255,${dark ? 0.06 : 0.2}) 0%, rgba(255,255,255,0) 70%), ` +
          `radial-gradient(ellipse 70% 70% at 100% 100%, ${alpha(c.shade, dark ? 0.5 : 0.3)} 0%, ${alpha(c.shade, 0)} 70%)`,
      }} />
      {/* Left column: eyebrow / title / description */}
      <div style={{ position: 'absolute', left: 120, top: 150, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{
          height: 48, padding: '0 18px', borderRadius: 24, display: 'flex', alignItems: 'center',
          boxShadow: `inset 0 0 0 2px ${alpha(c.ink, 0.5)}`, color: c.ink, fontFamily: FONT.mono, fontSize: 26, fontWeight: 700,
        }}>{c.num}</div>
        <div style={{ ...type(30, 700, { caps: true }), color: c.ink, letterSpacing: '0.14em' }}>{c.name}</div>
      </div>
      <div style={{ position: 'absolute', left: 116, top: 268, ...type(i === 0 ? 168 : 116, 850), color: c.ink, letterSpacing: '-0.038em', lineHeight: 0.98 }}>
        <TextReveal text={c.title} by="line" variant="rise" start={land} each={18} gap={5} />
      </div>
      <div style={{
        position: 'absolute', left: 120, top: i === 0 ? 640 : 560, width: 620, ...type(40, 500), lineHeight: 1.28, color: c.ink2,
        opacity: ramp(frame, land + 8, 14, EASE.out), transform: `translateY(${((1 - ramp(frame, land + 8, 16, EASE.snappy)) * 18).toFixed(2)}px)`,
      }}>{c.sub}</div>
      {/* Footer: brand + chapter ticks (absolute coordinates within the chapter) */}
      <div style={{ position: 'absolute', left: 120, bottom: 96, display: 'flex', alignItems: 'center', gap: 14 }}>
        <ShortKitWordmark size={28} markScale={1.4} gap={14} tone={i === 3 ? 'light' : 'dark'} color={c.ink} />
        <div style={{ display: 'flex', gap: 10, marginLeft: 30 }}>
          {[1, 2, 3].map((k) => (
            <div key={k} style={{ width: k === i ? 64 : 28, height: 8, borderRadius: 4, background: c.ink, opacity: k === i ? 0.95 : 0.28 }} />
          ))}
        </div>
      </div>

      {/* Right column UI card (pinned in chapter coordinates) */}
      {i > 0 && (
        <div style={{
          position: 'absolute', right: 120, top: '50%', transform: 'translateY(-50%)', borderRadius: 36, overflow: 'hidden',
          background: cardBg,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,${i === 2 ? 0.1 : 0.9}), ${softShadow(48, { color: c.shade, strength: 1.6 })}`,
        }}>
          {i === 1 && <ChannelCard frame={frame} />}
          {i === 2 && <HuddleCard frame={frame} />}
          {i === 3 && <WorkflowCard frame={frame} />}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const BottomPushStackWipe: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = PUSH_STARTS.map((_, i) => pushP(frame, i));
  const vy = -velocity(stackY, frame);
  const settle = 1 + 0.015 * ramp(frame, 142, 28, EASE.smooth); // very slow push-in at the tail
  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: CHAPTERS[0].base }}>
      <AbsoluteFill style={{ transform: `scale(${settle.toFixed(4)})` }}>
        <SpeedBlur vx={0} vy={vy} amount={0.1} max={22}>
          {CHAPTERS.map((_, i) => {
            const pushedIn = i === 0 ? 1 : progress[i - 1];
            const pushedOut = i < CHAPTERS.length - 1 ? progress[i] : 0;
            const y = (1 - pushedIn) * H - pushedOut * H;
            if (y <= -H || y >= H) return null;
            const moving = pushedIn < 1;
            return (
              <AbsoluteFill key={i} style={{ transform: `translateY(${y.toFixed(2)}px)` }}>
                <ChapterScene i={i} frame={frame} />
                {i > 0 && moving && (
                  <>
                    {/* Seam: contact shadow cast on the old chapter (sharp near, soft far) */}
                    <div style={{
                      position: 'absolute', top: -56, left: 0, right: 0, height: 56,
                      background: `linear-gradient(to top, ${alpha(CHAPTERS[i].shade, 0.42)}, ${alpha(CHAPTERS[i].shade, 0.12)} 40%, ${alpha(CHAPTERS[i].shade, 0)})`,
                    }} />
                    {/* 2px lit edge on the new chapter's top: the panel is a solid piece of material with thickness */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.45)' }} />
                  </>
                )}
              </AbsoluteFill>
            );
          })}
        </SpeedBlur>
      </AbsoluteFill>
      <Grain opacity={0.06} blend="overlay" />
    </AbsoluteFill>
  );
};
