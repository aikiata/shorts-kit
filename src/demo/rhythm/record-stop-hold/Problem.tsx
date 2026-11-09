import type { ReactNode } from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame } from "remotion";
import { AvatarSeq, Finish, MONO, PLANE, SlopScreen, Stage } from "./tvc";
import { FPS, Word, clamp, f, prog } from "./motion";

/**
 * The problem, as rapid-fire comedy (0 - 6.8 s): a slam-in, six punch cuts that each blow up ONE failure of a deliberately bad
 * fictional "AI-generated" UI until it is huge and readable, then four hand-rolled-code cuts, then the record-stop on a held
 * frame ("Or..."). Hard cuts on purpose; every cut keeps pushing in, and the avatar reacts on each one.
 */
const AMBER = "#fbbf24";

/** One macro on the slop screen: focus point (plane px) at the frame centre, scale s, a spring punch-in, an RGB split on the cut. */
function SlopMacro({ fx, fy, s, rot = 0, slam = false }: { fx: number; fy: number; s: number; rot?: number; slam?: boolean }) {
  const frame = useCurrentFrame();
  const sp = spring({ frame, fps: FPS, config: { damping: 12, stiffness: 220, mass: 0.6 } });
  const scale = s * (0.8 + 0.2 * sp) * (1 + 0.05 * (frame / 15)) * (slam ? 1.5 - 0.5 * Math.min(1, sp) : 1);
  const shake = frame < 7 ? Math.sin(frame * 3.1) * (7 - frame) * 2.2 : 0;
  const split = frame < 5 ? (5 - frame) * 3 : 0;
  const flash = slam ? interpolate(frame, [0, 3], [0.9, 0], clamp) : interpolate(frame, [0, 2], [0.35, 0], clamp);
  const react = Math.max(0, 1 - frame / 9);
  return (
    <Stage bg="#08060a" accent={AMBER}>
      <div style={{ position: "absolute", left: 960 + shake, top: 540, width: 0, height: 0, transform: `rotate(${rot}deg) scale(${scale})`, filter: split ? `drop-shadow(${-split}px 0 0 #ff0044aa) drop-shadow(${split}px 0 0 #00e5ffaa)` : undefined }}>
        <div style={{ position: "absolute", left: -fx - 1500, top: -fy - 1500, width: PLANE.w + 3000, height: PLANE.h + 3000, background: "linear-gradient(115deg,#ff5fa2 0%,#ffd23f 28%,#3ee6c4 52%,#6d5bff 78%,#ff7a3d 100%)" }} />
        <div style={{ position: "absolute", left: -fx, top: -fy, width: PLANE.w, height: PLANE.h }}>
          <SlopScreen jit={frame + 7 * Math.round(fx)} />
        </div>
      </div>
      <AvatarSeq state="thinking" size={210} deg={150} sat={1.5} glow="#fbbf2455" style={{ position: "absolute", left: 1640, top: 30, transform: `scale(${1 + 0.35 * react}) rotate(${(fx % 2 ? 1 : -1) * 12 * react}deg)` }} />
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
      <Finish vignette={0.7} />
    </Stage>
  );
}

const CLASSES = [
  'className="flex flex-col items-center justify-between gap-2 px-3 py-[13px] mt-[-3px] rounded-[7px] bg-[#1a1a1f] border border-[#333] hover:bg-[#222] md:flex-row sm:p-0 text-[13.5px] w-[97%] z-[9999] !important"',
  'style={{ marginLeft: 11, marginTop: -2, zIndex: 9999 }} className="relative top-[2px] left-[-1px] opacity-[0.97] translate-x-[3px] rotate-[0.4deg]"',
  'className="px-[17px] py-[9px] rounded-[9px] bg-gradient-to-r from-[#6d5bff] to-[#06b6d4] text-white shadow-[0_2px_#000] hover:scale-[1.03] md:px-[19px]"',
  'className="grid grid-cols-[1fr_2fr_0.7fr] gap-[11px] mb-[-7px] ml-[13px] w-[calc(100%-9px)] h-[calc(100vh-61px)] overflow-x-scroll"',
  'className="absolute top-[-3px] right-[7px] text-[#a1a1b5] text-[12.5px] leading-[1.37] tracking-[-0.011em] font-[550] underline decoration-dotted"',
  'className="flex items-center gap-[5px] p-[3px_9px] m-[0_0_0_-2px] border-[1.5px] border-dashed border-[#444] bg-[#222] bg-opacity-[0.93]"',
];
function ClassWall({ blurPx, dim = 1 }: { blurPx: number; dim?: number }) {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, filter: blurPx ? "url(#mbw)" : undefined, opacity: dim }}>
      {blurPx ? <svg width="0" height="0" style={{ position: "absolute" }}><filter id="mbw" x="-10%" y="0" width="120%" height="100%"><feGaussianBlur stdDeviation={`${blurPx} 0`} /></filter></svg> : null}
      {CLASSES.concat(CLASSES).slice(0, 9).map((c, i) => (
        <div key={i} style={{ position: "absolute", top: 40 + i * 118, left: 0, whiteSpace: "nowrap", fontFamily: MONO, fontSize: 74, fontWeight: 500, color: ["#7dd3fc", "#c4b5fd", "#e5e7eb", "#fbbf24", "#86efac"][i % 5], transform: `translateX(${-((frame * (62 + i * 17)) % 6000) + (i % 2 ? -600 : 0)}px)` }}>
          {c + "   " + c}
        </div>
      ))}
    </div>
  );
}
function ClassWallCut() {
  const frame = useCurrentFrame();
  return (
    <Stage bg="#0b0b0f" accent={AMBER}>
      <ClassWall blurPx={Math.max(6, 30 - frame * 1.6)} />
      <AvatarSeq state="thinking" size={210} deg={150} sat={1.5} glow="#fbbf2455" style={{ position: "absolute", left: 1640, top: 30, transform: `rotate(${Math.sin(frame / 2) * 8}deg)` }} />
      <Finish vignette={0.75} />
    </Stage>
  );
}
function TodoCut() {
  const frame = useCurrentFrame();
  const sp = spring({ frame, fps: FPS, config: { damping: 13, stiffness: 200, mass: 0.7 } });
  const txt = "// TODO: fix later";
  const n = Math.min(txt.length, Math.floor(frame * 1.6));
  return (
    <Stage bg="#0b0b0f" accent={AMBER}>
      <ClassWall blurPx={0} dim={0.18} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 138, color: AMBER, whiteSpace: "nowrap", transform: `scale(${(0.86 + 0.14 * sp) * (1 + frame * 0.002)})`, textShadow: `0 0 80px ${AMBER}88` }}>
          {txt.slice(0, n)}<span style={{ opacity: frame % 8 < 4 ? 1 : 0, background: AMBER, color: AMBER }}>_</span>
        </div>
      </AbsoluteFill>
      <AvatarSeq state="thinking" size={210} deg={150} sat={1.5} glow="#fbbf2455" style={{ position: "absolute", left: 1640, top: 30 }} />
      <Finish vignette={0.8} />
    </Stage>
  );
}
function ErrorCut() {
  const frame = useCurrentFrame();
  const sp = spring({ frame, fps: FPS, config: { damping: 11, stiffness: 260, mass: 0.6 } });
  const shake = frame < 10 ? Math.sin(frame * 3.7) * (10 - frame) * 2.4 : 0;
  const flash = interpolate(frame, [0, 2, 8], [0.9, 0.45, 0.12], clamp);
  return (
    <Stage bg="#1c0508" accent="#ff4d4f">
      <AbsoluteFill style={{ background: `radial-gradient(70% 70% at 50% 50%, #ff2a3a55, transparent 75%)` }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `translateX(${shake}px) scale(${1.45 - 0.45 * Math.min(1, sp) + frame * 0.004}) rotate(${Math.sin(frame / 9) * 0.4}deg)` }}>
        <div style={{ fontFamily: MONO, fontWeight: 700, textAlign: "center", color: "#ffe1e1", textShadow: "0 0 70px #ff4d4fcc" }}>
          <div style={{ fontSize: 150, color: "#ff4d4f" }}>TypeError</div>
          <div style={{ fontSize: 64, marginTop: 8 }}>Cannot read properties of undefined</div>
          <div style={{ fontSize: 48, marginTop: 8, color: "#ff9a9e" }}>(reading &apos;map&apos;)</div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#ff2a3a", opacity: flash }} />
      <Finish vignette={0.85} />
    </Stage>
  );
}
/** The day counter: the number rolls over from 29 to 30 (the month the hand-rolled UI took). */
function DayCounterView({ frame }: { frame: number }) {
  const push = 1 + 0.0022 * frame; // keeps moving after the roll
  const roll = interpolate(frame, [4, 12], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const digit = (d: string, off: number) => (
    <div style={{ height: 330, lineHeight: "330px", transform: `translateY(${off}px)` }}>{d}</div>
  );
  return (
    <Stage bg="#0b0b0f" accent={AMBER}>
      <AbsoluteFill style={{ background: `radial-gradient(60% 60% at 50% 50%, ${AMBER}22, transparent 70%)` }} />
      <AbsoluteFill style={{ transform: `scale(${push})`, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 54, fontFamily: MONO, fontWeight: 700, color: "#fff" }}>
        <div style={{ fontSize: 120, color: "#a1a1b5", marginTop: 130 }}>DAY</div>
        <div style={{ display: "flex", fontSize: 330, height: 330, overflow: "hidden", color: AMBER }}>
          {[["2", "3"], ["9", "0"]].map(([from, to], i) => (
            <div key={i} style={{ height: 330, overflow: "hidden" }}>
              <div style={{ transform: `translateY(${-330 * roll}px)` }}>{digit(from, 0)}{digit(to, 0)}</div>
            </div>
          ))}
        </div>
      </AbsoluteFill>
      <Finish vignette={0.7} />
    </Stage>
  );
}
function DayCut() {
  const frame = useCurrentFrame();
  return <DayCounterView frame={frame} />;
}
/** The record-stop: the last frame holds, loses colour and speed, and "Or..." lands on it. Never black. */
function RecordStop() {
  const frame = useCurrentFrame();
  const stop = interpolate(frame, [0, f(0.3)], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  return (
    <AbsoluteFill style={{ background: "#050507" }}>
      <AbsoluteFill style={{ background: "radial-gradient(60% 55% at 50% 50%, #fbbf2430, #ffffff12 45%, transparent 75%)" }} />
      {/* the counter loses colour, speed and focus and is gone before "Or..." lands (no ghost digits behind the word) */}
      <AbsoluteFill style={{ opacity: 1 - stop, filter: `saturate(${1 - stop}) blur(${stop * 14}px) brightness(${1 - stop * 0.6})`, transform: `scale(${1 - 0.05 * stop}) scaleY(${1 - 0.04 * stop})` }}>
        <DayCounterView frame={20} />
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontWeight: 650, fontSize: 230, letterSpacing: "-0.05em", color: "#fff" }}>
        <Word at={0.28}>Or…</Word>
      </AbsoluteFill>
      <Finish vignette={0.9} />
    </AbsoluteFill>
  );
}

/** The lower third over the cuts: the two spoken lines as kinetic type, large, with a heavy shadow so it reads on any cut. */
export function ProblemType() {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const shadow = "0 4px 40px #000, 0 2px 12px #000c, 0 0 3px #000";
  const A = interpolate(t, [1.9, 2.1], [1, 0], clamp);
  const B = interpolate(t, [8.9, 9.0], [1, 0], clamp);
  return (
    <>
      <div style={{ position: "absolute", left: 110, top: 800, fontWeight: 800, fontSize: 168, letterSpacing: "-0.05em", lineHeight: 1, color: "#fff", textShadow: shadow, opacity: A }}>
        <Word at={0.3}>Agent</Word>{" "}
        <Word at={0.7} style={{ color: "#ff5fa2", textDecoration: t > 1.2 ? "line-through" : "none", textDecorationThickness: 12 }}>slop</Word>
        <Word at={0.7} style={{ color: AMBER }}>.</Word>
      </div>
      <div style={{ position: "absolute", left: 110, top: 760, fontWeight: 800, fontSize: 132, letterSpacing: "-0.045em", lineHeight: 1.02, color: "#fff", textShadow: shadow, opacity: B }}>
        <div><Word at={4.55}>Or a month</Word></div>
        <div><Word at={5.6}>of hand-rolled</Word> <Word at={6.55} style={{ color: AMBER }}>UI.</Word></div>
      </div>
    </>
  );
}

/** the cuts sit on the music's beats (track v4.4 A: kicks measured every 0.5 s, 120 BPM, the drop at 10.04 s = beat 20) */
const cb = (k: number) => 0.04 + k * 0.5;
export const CUT_TIMES = [0.0, cb(2), cb(4), cb(6), cb(8), cb(10), cb(13), cb(16)];
export const STOP_AT = cb(18); // 9.04 s: the record-stop starts on a beat, 1 s before the drop
export const problemShots: { from: number; to: number; node: ReactNode; inW?: boolean; outW?: boolean }[] = [
  { from: 0.0, to: cb(2), node: <SlopMacro fx={579} fy={261} s={2.07} slam />, inW: false, outW: false },
  { from: cb(2), to: cb(4), node: <SlopMacro fx={150} fy={196} s={3.5} rot={-2} />, inW: false, outW: false }, // NaN%
  { from: cb(4), to: cb(6), node: <SlopMacro fx={420} fy={262} s={3.6} rot={-1.5} />, inW: false, outW: false }, // Loading...
  { from: cb(6), to: cb(8), node: <SlopMacro fx={520} fy={438} s={3.3} rot={2} />, inW: false, outW: false }, // 187% done!!
  { from: cb(8), to: cb(10), node: <SlopMacro fx={440} fy={172} s={4.4} rot={1.2} />, inW: false, outW: false }, // [object Object]
  { from: cb(10), to: cb(13), node: <TodoCut />, inW: false, outW: false },
  { from: cb(13), to: cb(16), node: <ErrorCut />, inW: false, outW: false },
  { from: cb(16), to: STOP_AT, node: <DayCut />, inW: false, outW: false },
  { from: STOP_AT, to: 10.4, node: <RecordStop />, inW: false, outW: false },
];
