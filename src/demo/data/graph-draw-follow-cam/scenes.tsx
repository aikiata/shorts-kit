import type {FC} from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {enter} from "../../shared/motion/anim";
import {ramp} from "../../shared/map/bits";
import {FONT} from "../../shared/theme";
import {CLIP_FACE, CLOSE_RUN, CLOSER, Clip, Still, walkFace} from "./Face";
import {BOX, drawnAt, Graph, pointAt} from "./Graph";
import {INK} from "./ink";
import {shotAt, useShot, type ShotId} from "./timing";

/** Pseudo-random number per frame, so the glitch comes out exactly the same on every render. */
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Film title card: big type, letter spacing tightening from wide to close, over the dark-room clip. */
const FilmTitle = () => {
  const frame = useCurrentFrame();
  const shot = useShot();
  const t = ramp(frame, shot.start, shot.start + shot.duration);
  const kick = enter(frame, shot.start + 2);
  const word = enter(frame, shot.start + 6);
  return (
    <AbsoluteFill style={{alignItems: "center", top: 560, height: 400}}>
      <div
        style={{
          fontFamily: FONT.sans,
          fontWeight: 700,
          fontSize: 34,
          letterSpacing: 10,
          color: INK.axis,
          opacity: kick.opacity,
          transform: `translateY(${kick.translateY}px)`,
        }}
      >
        BỘ PHIM
      </div>
      <div
        style={{
          marginTop: 18,
          fontFamily: FONT.sans,
          fontWeight: 900,
          fontSize: 132,
          letterSpacing: interpolate(t, [0, 1], [34, 8]),
          color: INK.text,
          opacity: word.opacity,
          textShadow: "0 0 40px rgba(0,0,0,0.9), 0 8px 30px rgba(0,0,0,0.9)",
          marginRight: -8,
        }}
      >
        OBSESSION
      </div>
      <div
        style={{
          marginTop: 22,
          height: 4,
          width: interpolate(t, [0, 1], [0, 520]),
          background: INK.dip,
          borderRadius: 2,
        }}
      />
    </AbsoluteFill>
  );
};

/** The feeling's name enters with a glitch: two colour layers split apart then lock together. */
const GlitchTitle = () => {
  const frame = useCurrentFrame();
  const shot = useShot();
  const local = frame - shot.start;
  const settle = ramp(frame, shot.start, shot.start + 26);
  const burst = local % 34 < 3 && local > 30 ? 1 : 0;
  const amp = (1 - settle) * 22 + burst * 12;
  const dx = (hash(frame) - 0.5) * 2 * amp;
  const dy = (hash(frame + 9) - 0.5) * amp * 0.4;
  const sliceTop = hash(frame + 3) * 70;
  const sliceShift = amp > 1 ? (hash(frame + 5) - 0.5) * amp * 3 : 0;
  const pop = enter(frame, shot.start, 14);
  // The Vietnamese name appears when the voice reaches "in Vietnamese it is...", about the second half of the shot.
  const vi = enter(frame, shot.start + Math.round(shot.duration * 0.5));

  const line = (color: string, x: number, y: number, extra = {}) => (
    <div
      style={{
        position: "absolute",
        inset: 0,
        color,
        transform: `translate(${x}px, ${y}px)`,
        ...extra,
      }}
    >
      UNCANNY
      <br />
      VALLEY
    </div>
  );

  return (
    <AbsoluteFill style={{alignItems: "center"}}>
      <div
        style={{
          position: "absolute",
          top: 560,
          width: 900,
          height: 330,
          textAlign: "center",
          fontFamily: FONT.sans,
          fontWeight: 900,
          fontSize: 150,
          lineHeight: 1.02,
          letterSpacing: 4,
          opacity: pop.opacity,
          transform: `scale(${interpolate(pop.opacity, [0, 1], [1.12, 1])})`,
        }}
      >
        {amp > 0.5 ? line(INK.accent, -dx, dy, {mixBlendMode: "screen", opacity: 0.85}) : null}
        {amp > 0.5 ? line(INK.dip, dx, -dy, {mixBlendMode: "screen", opacity: 0.85}) : null}
        {line(INK.text, 0, 0, {textShadow: "0 10px 40px rgba(0,0,0,0.8)"})}
        {amp > 1
          ? line(INK.text, sliceShift, 0, {clipPath: `inset(${sliceTop}% 0 ${Math.max(0, 88 - sliceTop)}% 0)`})
          : null}
      </div>
      <div
        style={{
          position: "absolute",
          top: 910,
          fontFamily: FONT.sans,
          fontWeight: 800,
          fontSize: 52,
          color: INK.dip,
          opacity: vi.opacity,
          transform: `translateY(${vi.translateY}px)`,
          textShadow: "0 6px 24px rgba(0,0,0,0.85)",
        }}
      >
        thung lũng kỳ lạ
      </div>
    </AbsoluteFill>
  );
};

export const Phim = () => (
  <AbsoluteFill>
    <Clip src="room.mp4" from={1.5} move={{scale: [1.12, 1.18], origin: "50% 40%"}} grade="brightness(1.5) contrast(1.1) saturate(0.8)" />
    <FilmTitle />
  </AbsoluteFill>
);
export const Phong = () => (
  <Clip src="room.mp4" from={8.6} move={{scale: [1.02, 1.16], origin: "48% 35%"}} face={{x: 0.48, y: 0.25, rx: 0.12, ry: 0.07}} blur={18} grade="brightness(2.1) contrast(1.12) saturate(0.85)" />
);
export const Mat = () => <Clip src="face.mp4" from={1} move={{scale: [1.15, 1.3], origin: "50% 33%"}} face={CLIP_FACE} grade="brightness(1.9) contrast(1.12) saturate(0.85)" />;
export const Sot = () => <Clip src="boy.mp4" from={3} move={{scale: [1.04, 1.18], origin: "50% 28%"}} grade="brightness(1.5) contrast(1.08)" />;
export const Lo = () => <Still move={CLOSE_RUN} mark="mouth" />;
export const Khoc = () => <Still move={CLOSE_RUN} mark="eyes" />;
export const Nguoi = () => (
  <Clip src="smile.mp4" from={0} move={{scale: [1.0, 1.06], origin: "50% 30%"}} grade="brightness(1.05)" />
);
export const Ron = () => <Still move={CLOSER} mark="mouth-hot" vignette={0.85} />;
export const Ten = () => (
  <AbsoluteFill>
    <Clip src="face.mp4" from={6} move={{scale: [1.2, 1.28], origin: "50% 33%"}} grade="blur(16px) brightness(1.1) saturate(0.7)" />
    <GlitchTitle />
  </AbsoluteFill>
);
export const Di = () => (
  <Clip src="walk.mp4" anchor="di" from={0} rate={0.55} move={{scale: [1.0, 1.08], origin: "50% 45%", span: ["di", "nhan"]}} face={walkFace} blur={22} grade="brightness(1.35) contrast(1.05)" />
);
/** The Seyama 2007 line returns to her face: a red ring points at the eyes, the face still blurred. */
export const Sey = () => <Still move={CLOSER} mark="eyes" vignette={0.6} />;

/** Last line: Mori's own guess, set as a question left open. */
const MoriGuess = () => {
  const frame = useCurrentFrame();
  const shot = useShot();
  const q = enter(frame, shot.start + 8);
  const note = enter(frame, shot.start + Math.round(shot.duration * 0.55));
  return (
    <AbsoluteFill style={{alignItems: "center"}}>
      <div style={{position: "absolute", top: 540, width: 860, textAlign: "center", fontFamily: FONT.sans}}>
        <div style={{fontSize: 34, fontWeight: 700, letterSpacing: 6, color: INK.axis, opacity: q.opacity}}>MORI ĐOÁN</div>
        <div
          style={{
            marginTop: 18,
            fontSize: 96,
            fontWeight: 900,
            lineHeight: 1.05,
            color: INK.text,
            opacity: q.opacity,
            transform: `translateY(${q.translateY}px) scale(${q.scale})`,
            textShadow: "0 10px 40px rgba(0,0,0,0.85)",
          }}
        >
          bản năng
          <br />
          tự bảo vệ<span style={{color: INK.warn}}>?</span>
        </div>
        <div
          style={{
            marginTop: 34,
            display: "inline-block",
            padding: "12px 26px",
            border: `3px dashed ${INK.axis}`,
            borderRadius: 40,
            fontSize: 36,
            fontWeight: 700,
            color: INK.axis,
            opacity: note.opacity,
            transform: `translateY(${note.translateY}px)`,
          }}
        >
          chính ông: "chưa nghĩ kỹ"
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Closing line returns to Nikki: her face (still blurred) and the name called at the start of the video. */
const EndName = () => {
  const frame = useCurrentFrame();
  const shot = useShot();
  const name = enter(frame, shot.start + Math.round(shot.duration * 0.55), 16);
  return (
    <AbsoluteFill style={{alignItems: "center"}}>
      <div
        style={{
          position: "absolute",
          top: 1010,
          textAlign: "center",
          fontFamily: FONT.sans,
          opacity: name.opacity,
          transform: `translateY(${name.translateY}px)`,
          textShadow: "0 8px 30px rgba(0,0,0,0.9)",
        }}
      >
        <div style={{fontSize: 96, fontWeight: 900, letterSpacing: 4, color: INK.text}}>UNCANNY VALLEY</div>
        <div style={{margin: "18px auto 0", height: 4, width: interpolate(name.opacity, [0, 1], [0, 520]), background: INK.dip, borderRadius: 2}} />
      </div>
    </AbsoluteFill>
  );
};

export const Het = () => (
  <AbsoluteFill>
    <Clip src="face.mp4" from={9} move={{scale: [1.12, 1.24], origin: "50% 33%"}} face={CLIP_FACE} grade="brightness(1.9) contrast(1.12) saturate(0.85)" />
    <EndName />
  </AbsoluteFill>
);

export const Tuve = () => (
  <AbsoluteFill>
    <Clip src="room.mp4" from={12} move={{scale: [1.15, 1.3], origin: "50% 35%"}} face={{x: 0.48, y: 0.25, rx: 0.14, ry: 0.08}} grade="blur(10px) brightness(1.2) saturate(0.7)" />
    <MoriGuess />
  </AbsoluteFill>
);

/** Camera move on the graph: `s` is the zoom, `f` is the graph point placed at the centre of the screen. */
type Cam = {s: number; f: [number, number]};
const CENTER: [number, number] = [500, 560];
/** Point on screen where the camera focus lands. The wide shot puts the graph box at (40, 300). */
const TARGET: [number, number] = [540, 860];

const follow = (frame: number, k: number): [number, number] => {
  const tip = pointAt(drawnAt(frame));
  return [CENTER[0] + (tip[0] - CENTER[0]) * k, CENTER[1] + (tip[1] - CENTER[1]) * k];
};

const rawCam = (frame: number): Cam => {
  const id = shotAt(frame).id;
  switch (id) {
    case "len":
      return {s: 1.25, f: follow(frame, 0.6)};
    case "xuong":
      return {s: 1.45, f: follow(frame, 0.8)};
    case "do":
      return {s: 1.3, f: [720, 640]};
    case "lai":
      return {s: 1.2, f: follow(frame, 0.6)};
    case "that":
      return {s: 1.0, f: [540, 540]};
    case "luat":
      return {s: 1.04, f: [470, 600]};
    case "rb":
      return {s: 1.3, f: [330, 560]};
    case "tg":
      return {s: 1.25, f: [740, 760]};
    case "bk":
      return {s: 1.25, f: [600, 500]};
    case "dong":
    case "sau":
      return {s: 1.0, f: [520, 600]};
    case "xac":
      return {s: 1.12, f: [660, 720]};
    case "co":
      return {s: 1.2, f: [580, 610]};
    case "khong":
      return {s: 1.12, f: [580, 610]};
    default:
      return {s: 1, f: CENTER};
  }
};

/** Average the camera move around the current frame, so the camera glides instead of jumping on a shot cut. */
const SMOOTH = 16;
const camAt = (frame: number): Cam => {
  let s = 0;
  let fx = 0;
  let fy = 0;
  let n = 0;
  for (let i = -SMOOTH; i <= SMOOTH; i++) {
    const w = SMOOTH + 1 - Math.abs(i);
    const c = rawCam(frame + i);
    s += c.s * w;
    fx += c.f[0] * w;
    fy += c.f[1] * w;
    n += w;
  }
  return {s: s / n, f: [fx / n, fy / n]};
};

const Chart = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const drift = Math.sin(frame / 45) * 4;
  const tx = TARGET[0] - cam.s * cam.f[0];
  const ty = TARGET[1] - cam.s * cam.f[1] + drift;
  return (
    <AbsoluteFill style={{overflow: "hidden"}}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: BOX,
          height: BOX,
          transform: `translate(${tx}px, ${ty}px) scale(${cam.s})`,
          transformOrigin: "0 0",
        }}
      >
        <Graph />
      </div>
    </AbsoluteFill>
  );
};

export const SHOT_SCENE: Record<ShotId, FC> = {
  phim: Phim,
  phong: Phong,
  mat: Mat,
  sot: Sot,
  lo: Lo,
  khoc: Khoc,
  nguoi: Nguoi,
  ron: Ron,
  ten: Ten,
  di: Di,
  nhan: Di,
  len: Chart,
  xuong: Chart,
  do: Chart,
  lai: Chart,
  that: Chart,
  phac: Chart,
  luat: Chart,
  rb: Chart,
  tg: Chart,
  bk: Chart,
  dong: Chart,
  sau: Chart,
  xac: Chart,
  co: Chart,
  khong: Chart,
  sey: Sey,
  tuve: Tuve,
  het: Het,
};
