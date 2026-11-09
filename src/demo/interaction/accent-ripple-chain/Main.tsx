import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { AbsoluteFill, Audio, Easing, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { CodeBlock } from "@/registry/knowns/ui/knowns/code-block/code-block";
import { AvatarSeq, EMOJI, Finish, GREEN, INK, MONO, PLANE, Plane, SANS, SlopScreen, Stage, VIOLET, lerp } from "./tvc";
import voiceTvc from "./voice-tvc.json";
import { FPS, OUT, OV, Shot, Word, clamp, f, prog } from "./motion";
import { ChartPanel, SeqBackdrop, SeqPanel, hasSeq } from "./Breadth";
import { CUT_TIMES, ProblemType, STOP_AT, problemShots } from "./Problem";
export { FPS };

/**
 * The Knowns UI launch TVC (v4, 27.5 s, 30 fps). The arc follows the music (ElevenLabs Music, track B; beat grid from its
 * measured beats: drop at 12.9 s, 145 BPM, one beat 0.4138 s). Slop (drawn, fictional) -> hand-rolled mess -> "Or..." ->
 * the drop: the real kit -> macros on the beat -> colour wave -> lockup. Everything is a function of the frame.
 */
export const TVC_FRAMES = 885; // 29.5 s
export const MUSIC_SKIP = 0;
export const DROP = 10.04; // the kick hit of track v4.4 A (measured); its own dip from 8.6 s is the stutter
export const GRID0 = 10.04;
export const BEAT = 0.5; // 120 BPM (kicks measured on a 0.5 s grid from 10.04 s)
export const beat = (k: number) => GRID0 + k * BEAT;
const PINK = "#f472b6";
const ORANGE = "#fb923c";
const SKY = "#38bdf8";
/** hue-rotate from the avatar's indigo base to each accent */
const DEG: Record<string, number> = { [VIOLET]: 0, [GREEN]: -85, [PINK]: 85, [ORANGE]: 140, [SKY]: -35 };

/** Scene time in seconds from the scene's own Sequence. */
function useT() {
  return useCurrentFrame() / FPS;
}

/* ---------------------------------------------------------------- 1. the slop (0 - 6.5 s) */
function SlopScene() {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const pop = spring({ frame: frame - f(0.1), fps: FPS, config: { damping: 14, stiffness: 120, mass: 0.9 } });
  // camera: a slow push on the wide shot, then punch into the NaN card (1.7 s) and the console (2.3 s)
  const wide = 1.22 + (t / 1.7) * 0.1;
  const p1 = interpolate(frame, [f(1.7), f(1.9)], [0, 1], { ...clamp, easing: OUT });
  const p2 = interpolate(frame, [f(2.3), f(2.45)], [0, 1], { ...clamp, easing: OUT });
  const s = wide + (2.5 - wide) * p1 + 0.3 * p2;
  const x = -80 * p1 - 480 * p2, y = -30 * p1 - 220 * p2;
  const shake = t > 1.7 ? Math.sin(frame * 2.3) * 3 * Math.max(0, 1 - (t - 1.7) / 0.8) : 0;
  const mb = (p1 > 0 && p1 < 1 ? (1 - p1) * 10 : 0) + (p2 > 0 && p2 < 1 ? (1 - p2) * 10 : 0);
  return (
    <Stage bg="#08060a" accent="#fbbf24">
      <AbsoluteFill style={{ background: "radial-gradient(60% 60% at 40% 45%, #ff2d9533, transparent 70%)" }} />
      <div style={{ position: "absolute", inset: 0, perspective: 2000 }}>
        <div style={{ position: "absolute", left: 120 + shake, top: 150, opacity: Math.min(1, pop * 2), transform: `translate(${x}px, ${y}px) scale(${s * (0.94 + 0.06 * pop)}) rotateY(${16 - 10 * p1}deg) rotateX(5deg) rotateZ(-2deg)`, transformOrigin: "0 0", boxShadow: "0 50px 120px rgba(0,0,0,.7)", borderRadius: 14, overflow: "hidden", filter: mb > 0.5 ? `blur(${mb}px)` : undefined }}>
          <SlopScreen jit={frame} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 100, top: 826, fontWeight: 800, fontSize: 132, letterSpacing: "-0.045em", lineHeight: 1, opacity: t < 1.7 ? 1 : 0 }}>
        <Word at={0.5}>Agent</Word>{" "}
        <Word at={0.9} style={{ color: "#ff5fa2", textDecoration: t > 1.5 ? "line-through" : "none", textDecorationThickness: 10 }}>slop</Word>
        <Word at={0.9} style={{ color: "#fbbf24" }}>.</Word>
      </div>
      <div style={{ opacity: Math.min(1, pop) * (t < 1.7 ? 1 : 0) }}>
        <AvatarSeq state="thinking" size={290} deg={150} sat={1.5} glow="#fbbf2455" style={{ position: "absolute", left: 1540, top: 620 }} />
        <div style={{ position: "absolute", left: 1700, top: 596, fontSize: 90, fontWeight: 800, color: "#fbbf24", transform: "rotate(10deg)" }}>?</div>
      </div>
      <Finish vignette={0.75} />
    </Stage>
  );
}

/* ---------------------------------------------------------------- 2. hand-rolled (6.5 - 11.2 s) */
const CODE: [string, string][] = [
  ["export default function Dashboard({ data, user, theme, stuff }: any) {", "#c4b5fd"],
  ["  const [x, setX] = useState<any>(null); // TODO: fix later", "#facc15"],
  ["  useEffect(() => { fetchThing().then(r => setX(r.data.items.map(i => i.v))) }, [])", "#e5e7eb"],
  ["  // HACK: don't touch, it works (??)", "#facc15"],
  ["  return (", "#e5e7eb"],
  ['    <div className="flex flex-col items-center justify-between gap-2 px-3 py-[13px] mt-[-3px] rounded-[7px] bg-[#1a1a1f] border border-[#333] hover:bg-[#222] md:flex-row sm:p-0 text-[13.5px] w-[97%]">', "#7dd3fc"],
  ['      <div style={{ marginLeft: 11, marginTop: -2, zIndex: 9999 }} className="relative top-[2px] left-[-1px] !important">', "#7dd3fc"],
  ["        {x && x.length > 0 ? x.map((q: any, i: number) => <Card2 key={i} {...q} onClick={() => {}} />) : null}", "#e5e7eb"],
  ["        {/* FIXME: modal z-index fight w/ sidebar, see v2-final-FINAL */}", "#facc15"],
  ['        <button className="px-[17px] py-[9px] rounded-[9px] bg-gradient-to-r from-[#6d5bff] to-[#06b6d4] text-white" onClick={handleClick2}>', "#7dd3fc"],
  ["          Approve?? (works on mobile?)", "#e5e7eb"],
  ["        </button>", "#7dd3fc"],
  ["      </div>", "#7dd3fc"],
  ["    </div>", "#7dd3fc"],
  ["  );", "#e5e7eb"],
  ["}", "#c4b5fd"],
  ["// styles-new-new.css  margin-left: 11px !important;  /* why */", "#a1a1b5"],
  ["const handleClick2 = () => { /* TODO */ };  const handleClick3 = () => { /* TODO */ };", "#facc15"],
];
function CodeScene() {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const lines = [...CODE, ...CODE, ...CODE];
  const scroll = t * 150;
  const week = Math.min(4, 1 + Math.floor(t / 0.6));
  const err = prog(frame, 0.7, 0.85); // 3.7 s: the music's jump, the console error
  const flash = interpolate(frame, [f(0.7), f(0.78), f(1.2)], [0, 0.35, 0], clamp);
  const zoom = lerp(frame, 0, f(2.5), 1.0, 1.12);
  return (
    <Stage bg="#0b0b0f" accent="#fbbf24">
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: "40% 40%", filter: "blur(2.5px) brightness(0.8)" }}>
        <div style={{ position: "absolute", left: 90, top: 70, width: 1740, height: 700, borderRadius: 18, background: "#0e0e14", border: "1px solid #ffffff1a", overflow: "hidden", fontFamily: MONO, fontSize: 24, lineHeight: "36px" }}>
          <div style={{ height: 46, background: "#14141c", display: "flex", gap: 22, alignItems: "center", padding: "0 22px", fontSize: 16, color: "#a1a1b5" }}>
            <span style={{ color: "#fff" }}>Dashboard.final.FINAL2.tsx</span><span>styles-new-new.css</span><span>helpers (copy).ts</span>
          </div>
          <div style={{ transform: `translateY(${-(scroll % (CODE.length * 36))}px)`, padding: "14px 24px", whiteSpace: "pre" }}>
            {lines.map(([l, c], i) => (
              <div key={i}><span style={{ color: "#52525f", display: "inline-block", width: 62 }}>{(i % 140) + 1}</span><span style={{ color: c }}>{l}</span></div>
            ))}
          </div>
        </div>
        <div style={{ position: "absolute", left: 1260, top: 820, fontSize: 20, color: "#a1a1b5", fontFamily: MONO }}>
          {["WEEK 1", "WEEK 2", "WEEK 3", "WEEK 4"].map((w, i) => (
            <span key={w} style={{ marginRight: 16, color: i + 1 === week ? "#fbbf24" : "#52525f", fontWeight: i + 1 === week ? 700 : 400 }}>{w}</span>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", left: 100, top: 790, fontWeight: 800, fontSize: 112, letterSpacing: "-0.04em", lineHeight: 1.02 }}>
        <div><Word at={0.05}>Or a month</Word></div>
        <div><Word at={1.05}>of hand-rolled</Word> <Word at={2.25} style={{ color: "#fbbf24" }}>UI.</Word></div>
      </div>
      {/* 10.0 s: the console error, red */}
      <div style={{ position: "absolute", left: 90, right: 90, top: 560 + (1 - err) * 160, height: 200, opacity: err, background: "#2a0a0e", border: "2px solid #ff4d4f", borderRadius: 14, padding: 26, fontFamily: MONO, color: "#ff9a9e", fontSize: 30, boxShadow: "0 0 80px #ff4d4f66" }}>
        <div style={{ color: "#ff4d4f", fontWeight: 700 }}>TypeError: Cannot read properties of undefined (reading 'map')</div>
        <div style={{ fontSize: 22, color: "#ff9a9e99", marginTop: 8 }}>at Dashboard (Dashboard.final.FINAL2.tsx:7:41)</div>
      </div>
      <AbsoluteFill style={{ background: "#ff2a3a", opacity: flash }} />
      <Finish vignette={0.7} />
    </Stage>
  );
}

/* ---------------------------------------------------------------- 3. "Or..." (11.2 - 12.9 s) */
function OrScene() {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const p = Math.min(1, spring({ frame: frame - f(0.1), fps: FPS, config: { damping: 16, stiffness: 140, mass: 0.8 } }));
  const crush = prog(frame, 1.15, 1.45); // into the drop
  return (
    <Stage bg="#050507">
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontWeight: 600, fontSize: 210, letterSpacing: "-0.05em", opacity: p * (1 - crush), transform: `scale(${1 + crush * 0.5 + t * 0.01})`, filter: `blur(${crush * 14}px)` }}>Or…</div>
      </AbsoluteFill>
      <Finish vignette={0.8} />
    </Stage>
  );
}

/* ---------------------------------------------------------------- 4. the snap (12.9 - 14.55 s) */
const SHARDS: { poly: string; x0: number; y0: number; x1: number; y1: number; r1: number; sc: number; blur: number }[] = [
  { poly: "polygon(0 0, 62% 8%, 38% 100%, 0 70%)", x0: 1100, y0: 380, x1: -1500, y1: -200, r1: -34, sc: 0.82, blur: 5 },
  { poly: "polygon(30% 0, 100% 20%, 80% 100%, 20% 60%)", x0: 1150, y0: 360, x1: 500, y1: -1300, r1: 38, sc: 0.62, blur: 3 },
  { poly: "polygon(10% 10%, 90% 0, 100% 80%, 20% 100%)", x0: 1100, y0: 420, x1: -900, y1: 1500, r1: 29, sc: 0.7, blur: 9 },
  { poly: "polygon(0 20%, 70% 0, 100% 60%, 30% 100%)", x0: 1200, y0: 420, x1: 700, y1: 1500, r1: 44, sc: 0.5, blur: 6 },
  { poly: "polygon(20% 0, 100% 30%, 60% 100%, 0 80%)", x0: 1250, y0: 500, x1: 2500, y1: 1300, r1: -40, sc: 0.46, blur: 12 },
  { poly: "polygon(0 0, 100% 40%, 50% 100%)", x0: 1250, y0: 330, x1: 1700, y1: -1200, r1: 60, sc: 0.3, blur: 2 },
];
function Shards({ frame }: { frame: number }) {
  // `frame` counts from the burst: out in 12 frames with velocity, rotation and motion blur
  if (frame < 0) return null;
  const q = interpolate(frame, [0, 22], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }); // keeps its speed: it leaves the frame
  const speed = (1 - q) * 14;
  const fade = interpolate(frame, [14, 24], [0.95, 0], clamp);
  return (
    <>
      {SHARDS.map((s, i) => (
        <div key={i} style={{ position: "absolute", left: s.x0 + (s.x1 - s.x0) * q, top: s.y0 + (s.y1 - s.y0) * q, width: PLANE.w, height: PLANE.h, transform: `rotate(${s.r1 * q * 1.3}deg) scale(${0.5 + (s.sc - 0.5) * q})`, transformOrigin: "0 0", clipPath: s.poly, filter: `blur(${s.blur * q + speed}px) saturate(0.9)`, opacity: fade }}>
          <SlopScreen jit={frame + i * 7} />
        </div>
      ))}
    </>
  );
}
/** The exploded stack as a reusable piece; `p` is how far it is exploded (0 flat, 1 full). */
function Stack({ p, frame, order = [3, 4, 5, 7, 6], at = { x: 1420, y: 650 }, starts = [0, 3, 6, 9, 12], bright = 1.25 }: { p: number; frame: number; order?: number[]; at?: { x: number; y: number }; starts?: number[]; bright?: number }) {
  // a continuous sweep: the stack swings round and settles over the first 1.7 s, then keeps drifting
  const yaw = lerp(frame, 0, f(1.7), -54, -27) + frame * 0.07;
  const pitch = lerp(frame, 0, f(1.7), 63, 52);
  const grow = lerp(frame, 0, f(1.4), 0.55, 0.84);
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 2400 }}>
      <div style={{ position: "absolute", left: at.x, top: at.y, width: PLANE.w, height: PLANE.h, transformStyle: "preserve-3d", transform: `translate(-50%, -50%) scale(${grow}) rotateX(${pitch}deg) rotateZ(${yaw}deg) translateZ(-120px)` }}>
        {order.map((n, i) => {
          // each plane flies in from depth on a curved path (a sideways arc over its flight), staggered 3 frames, springing in with a little overshoot
          const sp = spring({ frame: frame - starts[i], fps: FPS, config: { damping: 14, stiffness: 110, mass: 0.9 } });
          const k = 1 - sp;
          const side = i % 2 ? 1 : -1;
          const arc = Math.sin(Math.PI * Math.min(1, Math.max(0, sp))) * 420 * side;
          const pulse = 1 + 0.06 * Math.pow(Math.max(0, Math.cos((2 * Math.PI * frame) / 14)), 3); // the layers breathe on the beat
          const z = 20 + i * 235 * p * pulse - k * 2600;
          const blur = Math.abs(i - 2) * 1.4 * p + Math.max(0, k) * 14;
          return (
            <div key={n} style={{ position: "absolute", inset: 0, opacity: Math.min(1, sp * 3), transform: `translate3d(${arc + k * 260 * side}px, ${k * 320}px, ${z}px) rotateZ(${k * 22 * side}deg)` /* no CSS filter here: filters on perspective-transformed layers make Chrome tile the frame */  }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: 18, boxShadow: `0 0 0 1px ${VIOLET}40, 0 ${30 + i * 18}px ${60 + i * 24}px rgba(0,0,0,.65), 0 0 ${40 + i * 10}px ${VIOLET}22` }}>
                <Plane n={n} />
                <div style={{ position: "absolute", inset: 0, borderRadius: 18, background: `linear-gradient(135deg, #ffffff1f 0%, transparent 38%, transparent 70%, #0000002e 100%), rgba(255,255,255,${(bright - 1) * 0.1})` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function SnapScene() {
  const frame = useCurrentFrame();
  const burst = frame - f(0.35); // the drop
  const p = Math.min(1, spring({ frame: frame - f(0.25), fps: FPS, config: { damping: 16, stiffness: 90, mass: 1 } }));
  const ring = interpolate(burst, [0, f(0.5)], [0.2, 1], { ...clamp, easing: OUT });
  const ringOp = interpolate(burst, [0, 4, f(0.8)], [0, 1, 0], clamp);
  const punch = spring({ frame: burst, fps: FPS, config: { damping: 10, stiffness: 200, mass: 0.7 } }); // the camera pushes in on the downbeat, with a little overshoot
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp); // the held "Or..." frame shows through while the kit flies in
  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
    <Stage>
      <AbsoluteFill style={{ background: `radial-gradient(60% 55% at 62% 40%, ${VIOLET}26, transparent 70%)` }} />
      {/* the camera push is on the stack only, so the type keeps its margin */}
      <div style={{ position: "absolute", inset: 0, transform: `scale(${1 + 0.1 * Math.max(0, punch) + 0.06 * (frame / f(1.4))})`, transformOrigin: "72% 60%" }}>
        <Stack p={p} frame={frame} starts={[0, 1, 11, 12, 26]} bright={1.6} />
      </div>
      <div style={{ opacity: ringOp }}><Ring r={560 * ring} color="#ffffff" cx={1420} cy={650} soft={70} /></div>
      <AbsoluteFill style={{ background: "radial-gradient(48% 56% at 74% 60%, #c4b5ffb0, #a99bff40 45%, transparent 70%)", opacity: interpolate(burst, [0, 3, 18], [0, 0.95, 0], clamp) }} />
      <AbsoluteFill style={{ background: "#a99bff", opacity: interpolate(burst, [0, 3, 14], [0, 0.5, 0], clamp) }} />
      {/* a light sweep across the stack */}
      <div style={{ position: "absolute", left: 760, top: 150, width: 1160, height: 860, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: -100, bottom: -100, width: 360, left: interpolate(frame, [f(0.5), f(1.15)], [-500, 1300], clamp), transform: "skewX(-18deg)", background: "linear-gradient(90deg, transparent, #ffffffa0, #c4b5fd88, transparent)", filter: "blur(10px)" }} />
      </div>
      <Shards frame={burst} />
      <div style={{ position: "absolute", left: 140 - frame * 0.3, top: 250, fontWeight: 650, fontSize: 150, lineHeight: 1.0, letterSpacing: "-0.05em" }}>
        <div><Word at={0.4}>Just use</Word></div>
        <div><Word at={0.95} style={{ color: VIOLET }}>Knowns UI.</Word></div>
      </div>
      <AvatarSeq state="happy" size={230} style={{ position: "absolute", left: 1540, top: 50 }} />
      <Finish />
    </Stage>
    </AbsoluteFill>
  );
}

/* ---------------------------------------------------------------- 5-7. macros on the beat (14.55 - 19.5 s) */
function Macro({ n, focus, scale, from, tilt, press }: { n: number; focus: { x: number; y: number }; scale: [number, number]; from: { x: number; y: number }; tilt: [number, number]; press?: number }) {
  const frame = useCurrentFrame();
  const root = useRef<HTMLDivElement>(null);
  const [btn, setBtn] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [hold] = useState(() => (press === undefined ? null : delayRender("approve button position")));
  // measured every frame (fonts and the card's own late state can still move the button); polled until first found
  const measure = () => {
    if (hold === null || !root.current) return false;
    const r = root.current.getBoundingClientRect();
    const k = r.width / PLANE.w;
    const b = [...root.current.querySelectorAll("button")].find((el) => /^Approve$/.test(el.textContent?.trim() ?? ""));
    if (!b) return false;
    const q = b.getBoundingClientRect();
    const next = { x: (q.left - r.left) / k, y: (q.top - r.top) / k, w: q.width / k, h: q.height / k };
    setBtn((o) => (o && Math.abs(o.x - next.x) + Math.abs(o.y - next.y) + Math.abs(o.w - next.w) < 0.5 ? o : next));
    continueRender(hold);
    return true;
  };
  useLayoutEffect(() => {
    if (measure()) return;
    const t = setInterval(() => measure() && clearInterval(t), 100);
    return () => clearInterval(t);
  });
  const p = interpolate(frame, [0, f(1.5)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const s = scale[0] + (scale[1] - scale[0]) * p + 0.12 * (frame / f(2)); // keeps drifting after the ease: no static tail
  const x = from.x + (focus.x - from.x) * p;
  const y = from.y + (focus.y - from.y) * p;
  const rot = tilt[0] + (tilt[1] - tilt[0]) * p;
  const pt = press === undefined ? 0 : f(press);
  const glide = interpolate(frame, [pt - f(0.55), pt], [0, 1], { ...clamp, easing: OUT });
  const down = interpolate(frame, [pt, pt + 3, pt + 9], [1, 0.82, 1], clamp);
  const ripple = interpolate(frame, [pt, pt + f(0.45)], [0, 1], clamp);
  const done = interpolate(frame, [pt + 2, pt + 8], [0, 1], clamp);
  const check = interpolate(frame, [pt + 6, pt + 16], [24, 0], clamp);
  return (
    <Stage>
      <AbsoluteFill style={{ background: `radial-gradient(60% 60% at 50% 45%, ${VIOLET}1f, transparent 72%)` }} />
      {/* the plane's point (x, y) sits at the frame centre: a 2D macro (stays crisp at any scale), tilted a few degrees */}
      <div style={{ position: "absolute", left: 960, top: 540, width: 0, height: 0, transform: `rotate(${rot}deg) scale(${s})` }}>
        <div ref={root} style={{ position: "absolute", left: -x, top: -y, width: PLANE.w, height: PLANE.h, borderRadius: 18, boxShadow: `0 0 0 1px ${VIOLET}33, 0 40px 120px rgba(0,0,0,.7)` }}>
          <Plane n={n} />
          {btn && press !== undefined && (
            <>
              <div style={{ position: "absolute", left: btn.x, top: btn.y, width: btn.w, height: btn.h, opacity: done, borderRadius: 8, background: GREEN, color: "#04130d", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 600, fontSize: 13.5, fontFamily: SANS }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5l3 3 6-7" stroke="#04130d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24" strokeDashoffset={check} /></svg>Approved
              </div>
              <div style={{ position: "absolute", left: btn.x + btn.w / 2 - 60 * ripple, top: btn.y + btn.h / 2 - 60 * ripple, width: 120 * ripple, height: 120 * ripple, borderRadius: "50%", border: `2px solid ${GREEN}`, opacity: (1 - ripple) * (ripple > 0 ? 1 : 0) }} />
              <div style={{ position: "absolute", left: btn.x + btn.w / 2 + (1 - glide) * 190 - 14, top: btn.y + btn.h / 2 + (1 - glide) * 120 - 14, width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,.3)", border: "2px solid rgba(255,255,255,.9)", transform: `scale(${down})`, opacity: interpolate(frame, [pt - f(0.6), pt - f(0.45), pt + 2, pt + 6], [0, 1, 1, 0], clamp) }} />
            </>
          )}
        </div>
      </div>
      <Finish />
    </Stage>
  );
}

/* ---------------------------------------------------------------- 8. the colour wave (19.5 - 22.4 s) */
const WAVES = [
  { at: beat(28), color: GREEN },
  { at: beat(29), color: PINK },
  { at: beat(30), color: ORANGE },
  { at: beat(31), color: SKY },
];
function Wall({ accent }: { accent: string }) {
  // a grid of varied real components, all on the one --kn-accent variable
  const cards: { x: number; y: number; ry: number; node: ReactNode }[] = [
    { x: 330, y: 300, ry: 16, node: <ChartPanel accent={accent} second={accent} /> },
    { x: 960, y: 270, ry: 0, node: <Plane n={3} accent={accent} /> },
    { x: 1590, y: 300, ry: -16, node: <Plane n={5} accent={accent} /> },
    { x: 330, y: 770, ry: 16, node: <Plane n={4} accent={accent} /> },
    { x: 960, y: 800, ry: 0, node: <Plane n={6} accent={accent} /> },
    { x: 1590, y: 770, ry: -16, node: <Plane n={7} accent={accent} /> },
  ];
  return (
    <Stage accent={accent}>
      <AbsoluteFill style={{ background: `radial-gradient(60% 60% at 50% 50%, ${accent}22, transparent 72%)` }} />
      <div style={{ position: "absolute", inset: 0, perspective: 2200 }}>
        {cards.map((c, i) => (
          <div key={i} style={{ position: "absolute", left: c.x, top: c.y, width: 0, height: 0, transform: `rotateY(${c.ry}deg) scale(0.52)` }}>
            <div style={{ position: "absolute", left: -PLANE.w / 2, top: -PLANE.h / 2, borderRadius: 18, boxShadow: `0 0 0 1px ${accent}40, 0 30px 80px rgba(0,0,0,.6)` }}>{c.node}</div>
          </div>
        ))}
      </div>
    </Stage>
  );
}
/** A wavefront ring drawn as a gradient (a huge box-shadow makes Chrome tile the frame at large radii). */
function Ring({ r, color, cx = 960, cy = 540, soft = 140 }: { r: number; color: string; cx?: number; cy?: number; soft?: number }) {
  if (r <= 4) return null;
  return <div style={{ position: "absolute", left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: "50%", background: `radial-gradient(closest-side, transparent calc(100% - ${soft}px), ${color}2e calc(100% - ${soft * 0.35}px), ${color} calc(100% - 4px), transparent 100%)`, pointerEvents: "none" }} />;
}

function WaveScene({ start }: { start: number }) {
  const frame = useCurrentFrame();
  const t = frame / FPS + start; // film time
  const cx = 960, cy = 540;
  // one ripple at a time (0.5 s each): only TWO walls are ever drawn, the colour the last ripple left and the one expanding now.
  // (Five stacked clipped walls of 3D planes made Chrome tile the frame.)
  const radii = WAVES.map((w) => Math.max(0, Math.min(1, (t - w.at) / 0.5)) ** 0.7 * 1150);
  let cur = -1;
  WAVES.forEach((_, i) => { if (t >= WAVES[i].at) cur = i; });
  const baseColor = cur <= 0 ? VIOLET : WAVES[cur - 1].color;
  const curColor = cur < 0 ? VIOLET : WAVES[cur].color;
  const r = cur < 0 ? 0 : radii[cur];
  return (
    <AbsoluteFill style={{ background: INK, transform: `scale(${1 + 0.05 * Math.min(1, frame / f(4))})`, transformOrigin: "50% 50%" }}>
      <Wall accent={r >= 1150 ? curColor : baseColor} />
      {cur >= 0 && r < 1150 && (
        <AbsoluteFill style={{ clipPath: `circle(${r}px at ${cx}px ${cy}px)` }}><Wall accent={curColor} /></AbsoluteFill>
      )}
      {cur >= 0 && r < 1140 && <Ring r={r} color={curColor} />}
      <AvatarSeq state="happy" size={520} deg={DEG[curColor] ?? 0} sat={1.35} glow={`${curColor}66`} style={{ position: "absolute", left: cx - 260, top: cy - 260 }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 72, textAlign: "center", fontFamily: MONO, fontSize: 40, color: curColor, letterSpacing: "0.02em" }}>
        --kn-accent: <span style={{ color: "#fafafa" }}>{curColor}</span>
      </div>
      <Finish />
    </AbsoluteFill>
  );
}

/* ---------------------------------------------------------------- 9. the lockup (22.4 - 27.5 s) */
const MARK = "M8 1.5H24A6.5 6.5 0 0 1 30.5 8V24A6.5 6.5 0 0 1 24 30.5H8A6.5 6.5 0 0 1 1.5 24V8A6.5 6.5 0 0 1 8 1.5Z M15.3 8.7Q16 8 16.7 8.7L23.3 15.3Q24 16 23.3 16.7L16.7 23.3Q16 24 15.3 23.3L8.7 16.7Q8 16 8.7 15.3Z";
function Lockup() {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const a = prog(frame, 0.15, 0.6);
  return (
    <Stage>
      <AbsoluteFill style={{ background: `radial-gradient(55% 50% at 50% 42%, ${VIOLET}2a, transparent 70%)` }} />
      <AvatarSeq state="happy" size={340} style={{ position: "absolute", left: 790, top: 10, opacity: Math.min(1, t / 0.4) }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 340, textAlign: "center", opacity: a, transform: `translateY(${(1 - a) * 30}px)` }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 28, fontWeight: 650, fontSize: 132, letterSpacing: "-0.04em" }}>
          <svg width="112" height="112" viewBox="0 0 32 32"><path d={MARK} fill={VIOLET} fillRule="evenodd" /></svg>Knowns UI
        </div>
        <div style={{ fontSize: 50, color: "#c8c8d6", marginTop: 6, opacity: prog(frame, 0.35, 0.7) }}>
          <Word at={0.35}>The UI kit for AI products.</Word>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 34, color: VIOLET, marginTop: 14, opacity: prog(frame, 0.6, 0.95) }}>ui.knowns.dev</div>
      </div>
      <div style={{ position: "absolute", left: 60, top: 700, width: 720, transform: `scale(2.5) translateY(${(1 - prog(frame, 0.85, 1.3)) * 20}px)`, transformOrigin: "0 0", opacity: prog(frame, 0.85, 1.3), textAlign: "left" }}>
        <CodeBlock language="bash" filename="Terminal" wrapToggle={false} code="npx shadcn@latest add https://ui.knowns.dev/r/code-block.json" />
      </div>
      <Finish />
    </Stage>
  );
}

/** The violet ring: the last wave back to the brand colour, and it reveals the lockup as it grows. */
function RevealLockup() {
  const frame = useCurrentFrame();
  const r = interpolate(frame, [0, f(0.85)], [0, 1150], { ...clamp, easing: OUT });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `circle(${r}px at 960px 540px)` }}><Lockup /></AbsoluteFill>
      {r < 1140 && <Ring r={r} color={VIOLET} />}
    </AbsoluteFill>
  );
}

/* ---------------------------------------------------------------- audio */
const VOICE = staticFile("audio/voice/knowns-ui-tvc.mp3");
const SFX = (id: string) => staticFile(`audio/sfx-el/${id}.mp3`);
type Seg = { src: [number, number]; at: number };
const w = voiceTvc.full.words;
const VOICE_SEGS: Seg[] = [
  { src: [0.0, 1.12], at: 0.3 }, // Agent slop.
  { src: [1.58, 4.32], at: 4.5 }, // Or a month of hand-rolled UI.
  { src: [4.88, 5.5], at: STOP_AT + 0.28 }, // Or... (cut short: the record-stop)
  { src: [5.95, 7.62], at: DROP + 0.05 }, // just use Knowns UI.
  { src: [8.08, 10.7], at: beat(32) + 0.6 }, // The UI kit for AI products.
];
// `skip`: seconds cut from the start of the sample, so its loudest point lands on `at` (the whoosh peaks 0.6 s in).
const WH = { id: "whoosh", len: 26, skip: 0.62 };
const sfx: { at: number; id: string; vol: number; len: number; skip?: number }[] = [
  { at: 0, id: "slam-soft", vol: 0.32, len: 36 }, // -9 dB vs before, softened attack and highs
  // a glitch on every cut of the problem section
  ...CUT_TIMES.slice(1).map((at) => ({ at, id: "glitch-soft", vol: 0.105, len: 9 })), // one soft hit per cut
  { at: STOP_AT, id: "record-stop", vol: 0.5, len: 24 },
  { at: DROP - 0.03, id: "hit-low-soft", vol: 0.7, len: 45 }, // the only hit on the drop (the whoosh is gone: no stacking)
  { at: beat(4), vol: 0.5, ...WH },
  { at: beat(6) - 0.02, id: "click", vol: 0.9, len: 15 },
  { at: beat(6) + 0.2, id: "done-chime", vol: 1.0, len: 45 },
  { at: beat(8), vol: 0.5, ...WH },
  { at: beat(12), vol: 0.5, ...WH },
  { at: beat(16), vol: 0.5, ...WH },
  ...[28, 29, 30, 31].map((k) => ({ at: beat(k), id: "click", vol: 0.6, len: 15 })),
  { at: beat(32), vol: 0.8, ...WH },
  { at: beat(32) + 0.05, id: "logo-hit", vol: 1.0, len: 90 },
];
void w;

// Real components, in order: the captured sequences that came through, then the directly rendered blocks (chart, workflow, pages).
// Real components, one per glide. Captured sequences (voice orb, vector search, prompt keyboard, agent globe, workflow builder, with the aurora,
// gradient floor and cube field backdrops) where they came through, the directly rendered chart in between; a missing one is skipped.
type MItem = { fg: string | number; bg?: string; h?: number; grade?: string; layers?: number };
const MONTAGE_ALL: MItem[] = [
  { fg: "voice-orb", bg: "aurora", h: 640 },
  { fg: "vector-search", bg: "cube-field", h: 640 },
  { fg: "prompt-keyboard", bg: "gradient-floor", h: 760 },
  { fg: "agent-globe", h: 800, grade: "brightness(1.8) contrast(1.2)", layers: 4 }, // the capture is dim: graded up
  { fg: 0 },
  { fg: "workflow-builder", h: 640 },
];
const MONTAGE: MItem[] = MONTAGE_ALL.filter((i) => typeof i.fg === "number" || hasSeq(i.fg)).map((i) => (i.bg && !hasSeq(i.bg) ? { ...i, bg: undefined } : i));

/** The breadth montage (16.7 - 23.3 s): calm glides, one real component per beat pair, backdrops behind some, and the decoded line as type. */
function MView({ it, local, per, idx, alpha }: { it: MItem; local: number; per: number; idx: number; alpha: number }) {
  // `local` counts frames from the start of THIS item (it can run past `per` while it fades out under the next)
  const glide = interpolate(local, [0, per], [0, 1], clamp);
  const enter = Math.min(1, spring({ frame: local, fps: FPS, config: { damping: 18, stiffness: 90, mass: 1 } }));
  const dir = idx % 2 ? 1 : -1;
  return (
    <AbsoluteFill style={{ opacity: alpha }}>
      {it.bg ? <SeqBackdrop name={it.bg} /> : <AbsoluteFill style={{ background: `radial-gradient(60% 55% at ${30 + 40 * ((idx % 3) / 2)}% 45%, ${VIOLET}26, transparent 70%)` }} />}
      <div style={{ position: "absolute", inset: 0, perspective: 2200 }}>
        <div style={{ position: "absolute", left: 960, top: 540, width: 0, height: 0, opacity: Math.min(1, enter * 1.6), transform: `translate3d(${dir * (1 - enter) * 500 - dir * glide * 60}px, ${(1 - enter) * 120}px, ${-(1 - enter) * 700}px) rotateY(${-dir * (14 - 8 * glide)}deg) scale(${1.0 + 0.12 * glide})` }}>
          {typeof it.fg === "string" ? (
            <div style={{ position: "absolute", left: 0, top: 0, transform: "translate(-50%, -50%)" }}><SeqPanel name={it.fg} height={it.h ?? 640} grade={it.grade} layers={it.layers} offset={-idx * per + (it.fg === "workflow-builder" ? 62 : 0)} /></div>
          ) : (
            <div style={{ position: "absolute", left: -PLANE.w / 2, top: -PLANE.h / 2, transform: "scale(1.25)", transformOrigin: "50% 50%", boxShadow: `0 0 0 1px ${VIOLET}33, 0 50px 120px rgba(0,0,0,.7)`, borderRadius: 18 }}>
              {it.fg === 0 ? <ChartPanel /> : <Plane n={it.fg} />}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
}

/** The breadth montage (16 - 28 beats): calm glides, one real component per 2 beats, backdrops behind some, the decoded line as type.
 *  Items overlap: the next one glides in over the end of the last (no dip to empty). */
function Montage({ items }: { items: MItem[] }) {
  const frame = useCurrentFrame();
  const per = Math.floor(f(beat(28) - beat(16)) / items.length);
  const idx = Math.min(items.length - 1, Math.floor(frame / per));
  const local = frame - idx * per;
  const X = 12; // overlap frames
  return (
    <Stage>
      <MView it={items[idx]} local={local} per={per} idx={idx} alpha={1} />
      {/* the outgoing item stays ABOVE the incoming one while it fades, so its backdrop never leaves an empty frame */}
      {idx > 0 && local < X && <MView it={items[idx - 1]} local={local + per} per={per} idx={idx - 1} alpha={interpolate(local, [0, X], [1, 0], clamp)} />}
      {hasSeq("decode-text") && frame < 2 * per + 8 && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, display: "flex", justifyContent: "center", opacity: interpolate(frame, [0, 6, 2 * per - 6, 2 * per + 6], [0, 1, 1, 0], clamp) }}>
          <SeqPanel name="decode-text" height={120} maxW={1000} />
        </div>
      )}
      <Finish />
    </Stage>
  );
}

export const Tvc = () => {
  const musicVol_ = (fr: number) => interpolate(fr, [f(28.2), f(29.5)], [1, 0], clamp) * interpolate(fr, [f(STOP_AT), f(STOP_AT + 0.3), f(DROP - 0.04), f(DROP)], [1, 0, 0, 1], clamp); // the stop: the music brakes, is gone, and returns on the drop
  // the voice has the room: the music sits lower under "just use Knowns UI" and the tagline
  const duck = (fr: number) => 1 - 0.22 * Math.max(interpolate(fr, [f(DROP + 0.05) - 6, f(DROP + 0.05), f(DROP + 1.7), f(DROP + 1.7) + 10], [0, 1, 1, 0], clamp), interpolate(fr, [f(beat(32) + 0.6) - 6, f(beat(32) + 0.6), f(beat(32) + 3.2), f(beat(32) + 3.2) + 10], [0, 1, 1, 0], clamp));
  // shots overlap by OV frames: the outgoing one whips away as the next whips in
  const shots: { from: number; to: number; node: ReactNode; inW?: boolean; outW?: boolean }[] = [
    ...problemShots,
    { from: DROP - 0.35, to: beat(4), node: <SnapScene />, inW: false },
    { from: beat(4), to: beat(8), node: <Macro n={3} from={{ x: 500, y: 400 }} focus={{ x: 450, y: 395 }} scale={[1.5, 3.0]} tilt={[-2.5, 0]} press={beat(6) - beat(4)} /> },
    { from: beat(8), to: beat(12), node: <Macro n={3} from={{ x: 760, y: 300 }} focus={{ x: 880, y: 330 }} scale={[1.6, 2.4]} tilt={[1.8, 0]} /> },
    { from: beat(12), to: beat(16), node: <Macro n={4} from={{ x: 620, y: 300 }} focus={{ x: 250, y: 250 }} scale={[1.3, 2.1]} tilt={[-1.5, 0.5]} /> },
    { from: beat(16), to: beat(28), node: <Montage items={MONTAGE} /> },
    { from: beat(28), to: beat(32) + 0.9, node: <WaveScene start={beat(28)} />, outW: false },
  ];
  return (
    <AbsoluteFill style={{ background: INK }}>
      {shots.map((s, i) => {
        const dur = f(s.to - s.from) + (s.outW === false ? 0 : OV);
        return (
          <Sequence key={i} from={f(s.from)} durationInFrames={dur}>
            <Shot dur={dur} inW={s.inW} outW={s.outW}>{s.node}</Shot>
          </Sequence>
        );
      })}
      <Sequence from={0} durationInFrames={f(STOP_AT)}><ProblemType /></Sequence>
      <Sequence from={f(beat(32))} durationInFrames={TVC_FRAMES - f(beat(32))}><RevealLockup /></Sequence>

      <Audio src={staticFile("audio/music-v44-a.mp3")} startFrom={f(MUSIC_SKIP)} volume={(fr) => 0.42 * musicVol_(fr) * duck(fr)} />
      {VOICE_SEGS.map((s, i) => (
        <Sequence key={i} from={f(s.at)} durationInFrames={Math.ceil((s.src[1] - s.src[0]) * FPS) + 2}>
          <Audio src={VOICE} startFrom={f(s.src[0])} endAt={f(s.src[1])} volume={1.15} />
        </Sequence>
      ))}
      {sfx.map((s, i) => (
        <Sequence key={i} from={f(Math.max(0, s.at))} durationInFrames={s.len}>
          <Audio src={SFX(s.id)} startFrom={f(s.skip ?? 0)} volume={s.vol * 0.6} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

/** The same film in a 1270x760 frame: the 1920x1080 layout scaled to fit (letterboxed 23 px top and bottom in the ink colour). */
export const TvcFit = () => {
  const k = 1270 / 1920;
  return (
    <AbsoluteFill style={{ background: INK }}>
      <div style={{ position: "absolute", left: 0, top: (760 - 1080 * k) / 2, width: 1270, height: 1080 * k, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${k})`, transformOrigin: "0 0" }}>
          <Tvc />
        </div>
      </div>
    </AbsoluteFill>
  );
};
