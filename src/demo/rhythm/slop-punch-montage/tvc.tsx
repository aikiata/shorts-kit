import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { AbsoluteFill, Img, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { AgentAvatar, type AvatarState } from "@/registry/knowns/ui/knowns/illustrations/agent-avatar";
import { SlideView } from "@/web/components/launch/slides";
import "./kn.generated.css";
import { FontStyles } from "./fonts";

/**
 * Knowns UI launch TVC (v4): the REAL components, rendered inside the composition so they stay crisp at any zoom and sit in
 * 3D space (perspective, depth of field, parallax). Everything is a function of the frame: no Date.now, no Math.random.
 */
export const INK = "#07070c";
export const EMOJI = "'Noto Color Emoji'";
export const SANS = `'Geist', ${EMOJI}, sans-serif`;
export const MONO = `'Geist Mono', ${EMOJI}, monospace`;
export const VIOLET = "#a99bff";
export const GREEN = "#34d399";
export const RED = "#ff4d4f";

/** Dark stage with the kit's tokens: `accent` is the one --kn-accent variable the colour wave changes. */
export function Stage({ accent = VIOLET, bg = INK, children, style }: { accent?: string; bg?: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <AbsoluteFill className="dark" style={{ background: bg, color: "#fafafa", fontFamily: SANS, ["--font-sans" as string]: SANS, ["--font-mono" as string]: MONO, ["--background" as string]: bg, ["--kn-accent" as string]: accent, ["--kn-accent-foreground" as string]: "#14102b", overflow: "hidden", ...style }}>
      <FontStyles />
      {children}
    </AbsoluteFill>
  );
}

/** Film grain + vignette: the last layer of every frame. Static noise (a still tile), so it is deterministic. */
export function Finish({ vignette = 0.62 }: { vignette?: number }) {
  const noise = `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .9 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`)}")`;
  return (
    <>
      <AbsoluteFill style={{ background: `radial-gradient(120% 95% at 50% 46%, transparent 52%, rgba(0,0,0,${vignette}) 100%)`, pointerEvents: "none" }} />
      <AbsoluteFill style={{ backgroundImage: noise, opacity: 0.035, pointerEvents: "none" }} />
    </>
  );
}

/** The real avatar. Holds the render until its first frame is drawn, so a still never catches an empty canvas. */
export function Hero({ state = "idle", size, hue = VIOLET, accent, style, still = false }: { state?: AvatarState; size: number; hue?: string; accent?: string; style?: CSSProperties; still?: boolean }) {
  const fr = useCurrentFrame();
  const [h] = useState(() => delayRender("avatar first frame"));
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => continueRender(h), 700); // the blend between states settles in ~0.6 s
    return () => clearTimeout(t);
  }, [done, h]);
  return (
    <div style={{ ...style, transform: still ? `translateY(${Math.sin(fr / 22) * size * 0.012}px)` : undefined }}>
      <AgentAvatar state={state} size={size} hue={hue} accent={accent ?? hue} tone="dark" placeholder={false} paused={still} onReady={() => setDone(true)} />
    </div>
  );
}

/** The stage region of a gallery slide (no headline band): the real blocks of that slide, as one 3D-able plane of 1158x522. */
export const PLANE = { w: 1158, h: 522 } as const;
export function Plane({ n, accent = VIOLET, style }: { n: number; accent?: string; style?: CSSProperties }) {
  return (
    <div data-plane="" style={{ width: PLANE.w, height: PLANE.h, overflow: "hidden", borderRadius: 18, position: "relative", background: "#0a0a10", ["--plane-accent" as string]: accent, ...style }}>
      {/* the gallery frame pins its own --kn-accent inline; this wins over it so the colour wave recolours the real components */}
      <style>{"[data-plane] [data-launch-slide]{--kn-accent:var(--plane-accent)!important}"}</style>
      <div style={{ position: "absolute", left: -56, top: -190 }}>
        <SlideView n={n} />
      </div>
    </div>
  );
}

const ease = (t: number) => 1 - Math.pow(1 - t, 3); // --kn-ease-out family, for camera moves
export const lerp = (f: number, a: number, b: number, from: number, to: number) => from + (to - from) * ease(interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

/** 1. COLD OPEN: darkness, the eyes open. One hero, one rim light, nothing else. */
export function ColdOpen() {
  const f = useCurrentFrame();
  const push = lerp(f, 0, 90, 0.94, 1.0);
  return (
    <Stage>
      <AbsoluteFill style={{ background: `radial-gradient(46% 50% at 38% 36%, ${VIOLET}33, transparent 70%), radial-gradient(40% 44% at 62% 70%, #38bdf81f, transparent 70%)` }} />
      {/* the floor: a faint mirror line and a soft contact pool */}
      <div style={{ position: "absolute", left: 360, right: 360, top: 842, height: 1, background: `linear-gradient(90deg, transparent, ${VIOLET}66, transparent)` }} />
      <div style={{ position: "absolute", left: 560, top: 800, width: 800, height: 120, borderRadius: "50%", background: `radial-gradient(closest-side, ${VIOLET}40, transparent)`, filter: "blur(18px)" }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${push})`, transformOrigin: "50% 46%" }}>
        <Hero size={760} hue={VIOLET} accent="#7dd3fc" style={{ position: "absolute", left: 580, top: 120 }} />
      </div>
      {/* a single anamorphic streak across the eyes */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 477, height: 3, background: `linear-gradient(90deg, transparent 8%, ${VIOLET}00 20%, #ffffffcc 50%, ${VIOLET}00 80%, transparent 92%)`, filter: "blur(2px)", opacity: 0.55 }} />
      <Finish />
    </Stage>
  );
}

/** 2. TENSION: rm -rf. The room turns red; the command is the whole frame; the avatar stares. */
export function Tension() {
  const f = useCurrentFrame();
  const drift = lerp(f, 0, 60, 0, -36);
  const text = "rm -rf";
  const ch = (dx: number, color: string, op: number) => (
    <div style={{ position: "absolute", left: 0, top: 0, transform: `translate(${dx}px, 0)`, color, opacity: op, whiteSpace: "nowrap" }}>{text}</div>
  );
  return (
    <Stage bg="#0c0305" accent={RED}>
      <AbsoluteFill style={{ background: `radial-gradient(70% 70% at 50% 50%, #ff2a3a33, transparent 72%)` }} />
      {/* macro: the real terminal, enormous, out of focus, behind the type */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, perspective: 1800 }}>
        <div style={{ position: "absolute", left: 80, top: 120, width: 900, transform: `translateX(${drift}px) rotateY(18deg) rotateX(4deg) scale(2.3)`, transformOrigin: "0 0", filter: "blur(9px) saturate(1.4) hue-rotate(-40deg)", opacity: 0.55 }}>
          <Plane n={3} style={{ width: 900, height: 600 }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, perspective: 1600 }}>
        <div style={{ position: "absolute", left: 116, top: 262, fontFamily: MONO, fontWeight: 700, fontSize: 470, letterSpacing: "-0.06em", lineHeight: 1, transform: `rotateY(-9deg) translateX(${drift * 0.5}px)`, transformOrigin: "0 50%" }}>
          <div style={{ position: "relative", color: "#fff3f3", textShadow: `0 0 60px ${RED}cc, 0 0 160px ${RED}88` }}>{text}</div>
          {ch(-9, "#ff2a3a", 0.8)}
          {ch(9, "#22d3ee", 0.5)}
        </div>
      </div>
      <div style={{ position: "absolute", left: 124, top: 800, fontFamily: MONO, fontSize: 34, letterSpacing: "0.04em", color: "#ff9a9e" }}>
        <span style={{ opacity: 0.6 }}>$ </span>rm -rf dist<span style={{ opacity: 0.9, background: "#ff9a9e", color: "#0c0305" }}> </span>
      </div>
      <Hero state="error" size={260} hue={RED} accent="#ffb4a8" style={{ position: "absolute", left: 1560, top: 730 }} />
      <Finish vignette={0.8} />
    </Stage>
  );
}

/** 4. MOMENTUM: five screens of the kit as floating planes, exploded along their normal on the beat (space-camera-moves A). */
export function Exploded({ p = 1, type = true, overlay }: { p?: number; type?: boolean; overlay?: ReactNode }) {
  const f = useCurrentFrame();
  const order = [3, 4, 5, 7, 6];
  const yaw = lerp(f, 0, 150, -38, -28);
  const pitch = lerp(f, 0, 150, 56, 52);
  return (
    <Stage>
      <AbsoluteFill style={{ background: `radial-gradient(60% 55% at 62% 40%, ${VIOLET}26, transparent 70%)` }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, perspective: 2400 }}>
        <div style={{ position: "absolute", left: 1480, top: 660, width: PLANE.w, height: PLANE.h, transformStyle: "preserve-3d", transform: `translate(-50%, -50%) scale(0.6) rotateX(${pitch}deg) rotateZ(${yaw}deg) translateZ(-120px)` }}>
          {order.map((n, i) => {
            const z = 20 + i * 235 * p;
            const blur = Math.abs(i - 2) * 1.4;
            return (
              <div key={n} style={{ position: "absolute", inset: 0, transform: `translateZ(${z}px)`, filter: `brightness(1.25)${blur ? ` blur(${blur}px)` : ""}` }}>
                {/* the cast shadow on the base: lower and softer with height */}
                <div style={{ position: "absolute", inset: 0, borderRadius: 18, boxShadow: `0 0 0 1px ${VIOLET}40, 0 ${30 + i * 18}px ${60 + i * 24}px rgba(0,0,0,.65), 0 0 ${40 + i * 10}px ${VIOLET}22` }}>
                  <Plane n={n} />
                  <div style={{ position: "absolute", inset: 0, borderRadius: 18, background: "linear-gradient(135deg, #ffffff1f 0%, transparent 38%, transparent 70%, #0000002e 100%)", pointerEvents: "none" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {type && (
        <div style={{ position: "absolute", left: 96, top: 130, fontWeight: 650, fontSize: 116, lineHeight: 1.02, letterSpacing: "-0.045em" }}>
          <div>Every screen</div>
          <div style={{ color: "#a1a1b5" }}>your <span style={{ color: VIOLET }}>AI</span> product</div>
          <div style={{ color: "#a1a1b5" }}>needs.</div>
        </div>
      )}
      <Hero state="happy" size={190} hue={VIOLET} accent="#7dd3fc" style={{ position: "absolute", left: 1560, top: 70 }} />
      {overlay}
      <Finish />
    </Stage>
  );
}

/** 5. SIGNATURE: one variable. A ring of colour crosses every component, and the hero, in one move (palette-theme-ripple). */
export function Wave({ r = 560, from = VIOLET, to = GREEN }: { r?: number; from?: string; to?: string }) {
  const cx = 960, cy = 540;
  const wall = (accent: string) => (
    <Stage accent={accent}>
      <AbsoluteFill style={{ background: `radial-gradient(60% 60% at 50% 50%, ${accent}22, transparent 72%)` }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, perspective: 2200 }}>
        <div style={{ position: "absolute", left: 30, top: 200, transform: "scale(0.62) rotateY(24deg) rotateZ(-2deg)", transformOrigin: "0 50%" }}><Plane n={3} /></div>
        <div style={{ position: "absolute", left: 1890 - PLANE.w * 0.62, top: 220, transform: "scale(0.62) rotateY(-24deg) rotateZ(2deg)", transformOrigin: "100% 50%" }}><Plane n={5} /></div>
        <div style={{ position: "absolute", left: 380, top: 690, transform: "scale(0.66) rotateX(22deg)", transformOrigin: "50% 0" }}><Plane n={4} /></div>
      </div>
    </Stage>
  );
  return (
    <AbsoluteFill style={{ background: INK }}>
      {wall(from)}
      <AbsoluteFill style={{ clipPath: `circle(${r}px at ${cx}px ${cy}px)` }}>{wall(to)}</AbsoluteFill>
      {/* the wavefront: a thin bright ring with a soft falloff behind it */}
      <div style={{ position: "absolute", left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: "50%", boxShadow: `0 0 0 2px ${to}, 0 0 38px 6px ${to}aa, inset 0 0 90px 10px ${to}55`, pointerEvents: "none" }} />
      <Hero state="happy" size={460} hue={to} accent={to} style={{ position: "absolute", left: cx - 230, top: cy - 230 }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 72, textAlign: "center", fontFamily: MONO, fontSize: 40, color: to, letterSpacing: "0.02em" }}>
        --kn-accent: <span style={{ color: "#fafafa" }}>{to}</span>
      </div>
      <Finish />
    </AbsoluteFill>
  );
}


/**
 * THE PROBLEM: "agent slop", drawn here on purpose and entirely fictional (no product, brand or logo): gradient soup, random
 * emoji, misaligned cards, broken states. Plain divs, deliberately NOT the kit. `jit` is a frame-driven wobble.
 */
export function SlopScreen({ jit = 0, style }: { jit?: number; style?: CSSProperties }) {
  const j = (k: number) => Math.sin(jit * 0.9 + k) * 2.2;
  const COMIC = `'Comic Neue', ${EMOJI}, cursive`;
  return (
    <div style={{ position: "relative", width: PLANE.w, height: PLANE.h, overflow: "hidden", background: "linear-gradient(115deg,#ff5fa2 0%,#ffd23f 28%,#3ee6c4 52%,#6d5bff 78%,#ff7a3d 100%)", fontFamily: COMIC, color: "#222", ...style }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 20% 80%, #00f5ff99, transparent 40%), radial-gradient(circle at 85% 20%, #ff00e699, transparent 38%)" }} />
      <div style={{ position: "absolute", left: 28 + j(1), top: 18, fontSize: 40, fontWeight: 900, color: "#fff", textShadow: "3px 3px 0 #ff2d95, -2px -2px 0 #3b82f6" }}>✨ AI Dashboard 🚀🔥</div>
      <div style={{ position: "absolute", right: 40, top: 26 + j(2), fontSize: 15, background: "linear-gradient(90deg,#f0f,#0ff)", color: "#fff", padding: "6px 22px", borderRadius: 4, border: "3px dashed #fff" }}>Click Here!!</div>
      {/* misaligned cards, three different radii and shadows */}
      <div style={{ position: "absolute", left: 40, top: 110, width: 320, height: 190, background: "#fffffff0", borderRadius: 38, boxShadow: "10px 10px 0 #0006", padding: 18, transform: "rotate(-3deg)" }}>
        <div style={{ fontSize: 26, fontWeight: 800 }}>Revenue 💯</div>
        <div style={{ fontSize: 54, fontWeight: 900, color: "#e11d48" }}>NaN%</div>
        <div style={{ fontSize: 13, color: "#777" }}>undefined vs undefined (last 0 days)</div>
        <div style={{ marginTop: 10, height: 18, width: "140%", background: "linear-gradient(90deg,#22c55e,#facc15,#ef4444)", borderRadius: 2 }} />
      </div>
      <div style={{ position: "absolute", left: 330, top: 150 + j(3), width: 300, height: 210, background: "#1a1a2e", color: "#0f0", borderRadius: 4, border: "6px double #ff0", padding: 14, fontFamily: MONO, fontSize: 15, transform: "rotate(2deg)" }}>
        <div>Error: [object Object]</div>
        <div>  at render (undefined:0:0)</div>
        <div style={{ color: "#f0f", marginTop: 8 }}>TODO: fix later 🤷</div>
        <div style={{ color: "#fff", marginTop: 8, fontSize: 28 }}>Loading...</div>
        <div style={{ color: "#fa0", fontSize: 12 }}>Lorem ipsum dolor sit amet consectetur</div>
      </div>
      <div style={{ position: "absolute", left: 600 - j(4), top: 100, width: 260, height: 260, background: "#ffffffcc", borderRadius: "50% 8% 50% 8%", boxShadow: "0 0 40px #f0f", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", transform: "rotate(6deg)" }}>
        <div style={{ fontSize: 76 }}>🤖</div>
        <div style={{ fontSize: 15, background: "#000", color: "#fff", padding: "2px 8px" }}>img not found</div>
        <div style={{ fontSize: 22, fontWeight: 900, WebkitTextStroke: "1px #000", color: "#ffe600" }}>SMART INSIGHTS</div>
      </div>
      <div style={{ position: "absolute", left: 880, top: 140 + j(5), width: 240, height: 150, background: "linear-gradient(#a855f7,#06b6d4)", border: "2px solid #fff", borderRadius: 16, padding: 14, color: "#fff", fontSize: 18, fontWeight: 700, transform: "rotate(-5deg)" }}>
        Settings ⚙️<br /><span style={{ fontSize: 12, fontWeight: 400 }}>Dark mode: [on/off?]</span>
        <div style={{ marginTop: 10, width: 56, height: 28, borderRadius: 30, background: "#fff6", position: "relative" }}><div style={{ position: "absolute", left: 14, top: 3, width: 22, height: 22, borderRadius: 50, background: "#f43f5e" }} /></div>
      </div>
      <div style={{ position: "absolute", left: 90, top: 340, width: 420, fontSize: 21, fontWeight: 700, color: "#fff", textShadow: "2px 2px #0008", transform: "rotate(-1.5deg)" }}>Welcome back, {"{user.name}"}! 🎉🎉 You have 0 new notifications!!!</div>
      <div style={{ position: "absolute", left: 520, top: 392 + j(6), width: 330, height: 96, background: "repeating-linear-gradient(45deg,#fde047,#fde047 12px,#111 12px,#111 24px)", borderRadius: 24, color: "#111", fontSize: 24, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(3deg)" }}><span style={{ background: "#fff", padding: "2px 10px" }}>⚠️ Something went wrong</span></div>
      <div style={{ position: "absolute", left: 910, top: 330, fontSize: 52, transform: "rotate(14deg)" }}>📊💸😅</div>
      <div style={{ position: "absolute", left: 20, top: 440, width: 460, height: 14, borderRadius: 7, background: "#0004" }}><div style={{ width: "187%", height: 14, background: "#f0f", borderRadius: 7 }} /></div>
      <div style={{ position: "absolute", left: 500, top: 424, fontSize: 30, fontWeight: 900, color: "#fff", textShadow: "2px 2px #f0f" }}>187% done!!</div>
    </div>
  );
}

/** Style frame: the slop vignette. A garish, broken screen on a dark stage, the avatar unsure, the verdict in type. */
export function Slop() {
  const f = useCurrentFrame();
  const sh = Math.sin(f * 1.7) * 3;
  return (
    <Stage bg="#08060a" accent="#fbbf24">
      <AbsoluteFill style={{ background: "radial-gradient(60% 60% at 40% 45%, #ff2d9533, transparent 70%)" }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, perspective: 2000 }}>
        <div style={{ position: "absolute", left: 120 + sh, top: 150, transform: "scale(1.22) rotateY(16deg) rotateX(5deg) rotateZ(-2deg)", transformOrigin: "0 0", boxShadow: "0 50px 120px rgba(0,0,0,.7)", borderRadius: 14, overflow: "hidden", filter: "saturate(1.1)" }}>
          <SlopScreen jit={f} />
          {/* chromatic fringe */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #ff000022, transparent 30%, transparent 70%, #00ffff22)" }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 100, top: 826, fontWeight: 800, fontSize: 132, letterSpacing: "-0.045em", lineHeight: 1 }}>
        Agent <span style={{ color: "#ff5fa2", textDecoration: "line-through", textDecorationThickness: 10 }}>slop</span><span style={{ color: "#fbbf24" }}>.</span>
      </div>
      <Hero state="thinking" size={250} hue="#fbbf24" accent="#fb923c" style={{ position: "absolute", left: 1560, top: 640 }} />
      <div style={{ position: "absolute", left: 1700, top: 596, fontSize: 90, fontWeight: 800, color: "#fbbf24", transform: "rotate(10deg)" }}>?</div>
      <Finish vignette={0.75} />
    </Stage>
  );
}

/** Style frame: the snap at the drop. The slop shatters into shards and flies out; the real components take the space. */
export function Snap() {
  const f = useCurrentFrame();
  const shard = (i: number, poly: string, x: number, y: number, rot: number, sc: number, blur: number) => (
    <div key={i} style={{ position: "absolute", left: x, top: y, width: PLANE.w, height: PLANE.h, transform: `rotate(${rot}deg) scale(${sc})`, transformOrigin: "0 0", clipPath: poly, filter: `blur(${blur}px) saturate(0.9)`, opacity: 0.85 }}>
      <SlopScreen jit={f + i * 7} />
    </div>
  );
  const overlay = (
    <>
      {/* the impact: a white-hot ring and flash from the stack */}
      <div style={{ position: "absolute", left: 1480 - 430, top: 640 - 430, width: 860, height: 860, borderRadius: "50%", boxShadow: `0 0 0 3px #ffffffcc, 0 0 80px 14px ${VIOLET}aa, inset 0 0 160px 30px ${VIOLET}33`, pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: `radial-gradient(40% 46% at 77% 59%, #ffffff1c, transparent 70%)` }} />
      {shard(0, "polygon(0 0, 62% 8%, 38% 100%, 0 70%)", -120, 80, -14, 0.82, 5)}
      {shard(1, "polygon(30% 0, 100% 20%, 80% 100%, 20% 60%)", 330, -170, 18, 0.62, 3)}
      {shard(2, "polygon(10% 10%, 90% 0, 100% 80%, 20% 100%)", 40, 640, 9, 0.7, 9)}
      {shard(3, "polygon(0 20%, 70% 0, 100% 60%, 30% 100%)", 640, 520, 24, 0.5, 6)}
      {shard(4, "polygon(20% 0, 100% 30%, 60% 100%, 0 80%)", 1560, 760, -20, 0.46, 12)}
      {shard(5, "polygon(0 0, 100% 40%, 50% 100%)", 960, 20, 40, 0.3, 2)}
    </>
  );
  return <Exploded p={0.86} type={false} overlay={overlay} />;
}


/** The real avatar as a pre-rendered transparent frame sequence (1024 px, 30 fps; captured from the live component).
 *  Loops ping-pong over the steady part (no jump), and `deg` hue-rotates it toward the film's accent colour. */
const SEQ: Record<string, { n: number; lead: number }> = { idle: { n: 90, lead: 0 }, thinking: { n: 90, lead: 20 }, happy: { n: 60, lead: 20 } };
export function AvatarSeq({ state, size, deg = 0, sat = 1, style, glow }: { state: "idle" | "thinking" | "happy"; size: number; deg?: number; sat?: number; style?: CSSProperties; glow?: string }) {
  const frame = useCurrentFrame();
  const { n, lead } = SEQ[state];
  const span = n - 1 - lead;
  const j = frame < lead ? frame : lead + (() => { const c = (frame - lead) % (2 * span); return c <= span ? c : 2 * span - c; })();
  const idx = String(Math.min(n, j + 1)).padStart(4, "0");
  return (
    <div style={{ width: size, height: size, ...style, filter: glow || deg !== 0 || sat !== 1 ? `${glow ? `drop-shadow(0 0 ${size * 0.12}px ${glow}) ` : ""}hue-rotate(${deg}deg) saturate(${sat})` : undefined }}>
      <Img src={staticFile(`avatar-seq/${state}/${idx}.png`)} style={{ width: size, height: size, display: "block" }} />
    </div>
  );
}
