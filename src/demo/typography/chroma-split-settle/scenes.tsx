import type {FC, ReactNode} from "react";
import {AbsoluteFill, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from "remotion";
import {enter} from "../../shared/motion/anim";
import {ramp} from "../../shared/map/bits";
import {FONT} from "../../shared/theme";
import {INK} from "./ink";
import {shotById, useShot, wordAt, type ShotId} from "./timing";

/**
 * Visuals of the Liminal Space short. Vertical clips pre-cut from Kane Pixels' "The Backrooms (Found
 * Footage)" live in `public/clips/liminal-space/`, the original 2002 photos
 * (Wikimedia Commons) in `public/stills/`. The clip licence is the channel owner's responsibility.
 * No animated drawings: text and thin lines only sit on top of the real clips.
 */

const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const fill = {width: "100%", height: "100%", objectFit: "cover" as const};

type Move = {scale: [number, number]; origin?: string; span?: [ShotId, ShotId]};

const Shade = () => (
  <AbsoluteFill
    style={{
      background:
        "linear-gradient(to bottom, rgba(5,4,0,0.5) 0%, rgba(5,4,0,0) 24%, rgba(5,4,0,0) 52%, rgba(5,4,0,0.9) 100%)",
    }}
  />
);

/** Shared stage: a slow push-in over the shot (or continuous across `span`). */
const Stage = ({move, grade, children}: {move: Move; grade?: string; children: ReactNode}) => {
  const frame = useCurrentFrame();
  const shot = useShot();
  const from = move.span ? shotById(move.span[0]).start : shot.start;
  const last = move.span ? shotById(move.span[1]) : shot;
  const t = ramp(frame, from, last.start + last.duration);
  return (
    <AbsoluteFill style={{overflow: "hidden", background: INK.bg}}>
      <AbsoluteFill
        style={{
          transform: `scale(${interpolate(t, [0, 1], move.scale)})`,
          transformOrigin: move.origin ?? "50% 45%",
          filter: grade,
        }}
      >
        {children}
      </AbsoluteFill>
      <Shade />
    </AbsoluteFill>
  );
};

/** One vertical 720x1280 clip. `from` is seconds into the clip file; `anchor` pins the clip to another shot's start. */
const Clip = ({
  src,
  from = 0,
  rate = 1,
  move = {scale: [1.02, 1.1]},
  grade = "brightness(1.05) contrast(1.05)",
  anchor,
  children,
}: {
  src: string;
  from?: number;
  rate?: number;
  move?: Move;
  grade?: string;
  anchor?: ShotId;
  children?: ReactNode;
}) => {
  const current = useShot();
  const shot = anchor ? shotById(anchor) : current;
  return (
    <AbsoluteFill>
      <Stage move={move} grade={grade}>
        <Sequence from={shot.start} layout="none">
          <OffthreadVideo
            src={staticFile(`clips/liminal-space/${src}.mp4`)}
            startFrom={Math.round(from * 30)}
            playbackRate={rate}
            muted
            style={fill}
          />
        </Sequence>
      </Stage>
      {children}
    </AbsoluteFill>
  );
};

/** A small letter-spaced label, like a documentary caption. */
const Kicker = ({children, at, top, color = INK.muted}: {children: ReactNode; at: number; top: number; color?: string}) => {
  const frame = useCurrentFrame();
  const e = enter(frame, at);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily: FONT.mono,
        fontWeight: 600,
        fontSize: 30,
        letterSpacing: 6,
        color,
        opacity: e.opacity,
        transform: `translateY(${e.translateY}px)`,
        textShadow: INK.shadow,
      }}
    >
      {children}
    </div>
  );
};

const Big = ({children, at, top, size = 120, spread}: {children: ReactNode; at: number; top: number; size?: number; spread?: [number, number]}) => {
  const frame = useCurrentFrame();
  const shot = useShot();
  const e = enter(frame, at);
  const t = ramp(frame, at, shot.start + shot.duration);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily: FONT.sans,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1.2,
        letterSpacing: spread ? interpolate(t, [0, 1], spread) : 2,
        color: INK.text,
        opacity: e.opacity,
        transform: `translateY(${e.translateY}px)`,
        textShadow: INK.shadow,
      }}
    >
      {children}
    </div>
  );
};

const Rule = ({at, top, width = 460}: {at: number; top: number; width?: number}) => {
  const frame = useCurrentFrame();
  const w = interpolate(ramp(frame, at, at + 24), [0, 1], [0, width]);
  return <div style={{position: "absolute", top, left: (1080 - w) / 2, width: w, height: 4, borderRadius: 2, background: INK.yellow}} />;
};

/** Opening: Kane Pixels' yellow room, the film's title card. */
const Hook: FC = () => {
  const shot = useShot();
  return (
    <Clip src="room" move={{scale: [1.0, 1.12]}}>
      <Kicker at={shot.start + 4} top={500}>
        KANE PIXELS · 2022
      </Kicker>
      <Big at={shot.start + 10} top={620} size={124} spread={[30, 8]}>
        THE
        <br />
        BACKROOMS
      </Big>
      <Rule at={shot.start + 16} top={950} />
    </Clip>
  );
};

/** The feeling's name arrives with a colour-split glitch, then the Vietnamese name. */
const Ten: FC = () => {
  const frame = useCurrentFrame();
  const shot = useShot();
  const local = frame - shot.start;
  const settle = ramp(frame, shot.start, shot.start + 26);
  const burst = local > 30 && local % 40 < 3 ? 1 : 0;
  const amp = (1 - settle) * 22 + burst * 10;
  const dx = (hash(frame) - 0.5) * 2 * amp;
  const pop = enter(frame, shot.start);
  const vi = wordAt("không", shot.start);
  const word = {
    position: "absolute" as const,
    inset: 0,
    fontFamily: FONT.sans,
    fontWeight: 900,
    fontSize: 128,
    lineHeight: 1.05,
    textAlign: "center" as const,
    letterSpacing: 4,
  };
  return (
    <Clip src="tunnel" from={3} move={{scale: [1.15, 1.3]}} grade="brightness(1.4) contrast(1.05)">
      <div style={{position: "absolute", top: 600, left: 0, right: 0, height: 290, opacity: pop.opacity}}>
        <div style={{...word, color: "#ff3b3b", transform: `translateX(${dx}px)`, mixBlendMode: "screen", opacity: 0.8}}>
          LIMINAL
          <br />
          SPACE
        </div>
        <div style={{...word, color: "#3bd6ff", transform: `translateX(${-dx}px)`, mixBlendMode: "screen", opacity: 0.8}}>
          LIMINAL
          <br />
          SPACE
        </div>
        <div style={{...word, color: INK.text, textShadow: INK.shadow}}>
          LIMINAL
          <br />
          SPACE
        </div>
      </div>
      <Rule at={shot.start + 12} top={910} />
      <Kicker at={vi} top={950} color={INK.yellow}>
        KHÔNG GIAN CHUYỂN TIẾP
      </Kicker>
    </Clip>
  );
};

/**
 * A 640x480 photo on a vertical frame: a blurred copy fills the background, the sharp copy sits in the
 * middle like a printed photo, the camera pushes in slowly. `stamp` is a digital-camera date stamp.
 */
const Photo = ({
  src,
  move,
  label,
  labelAt,
  stamp,
  stampAt,
}: {
  src: string;
  move: Move;
  label?: ReactNode;
  labelAt?: number;
  stamp?: string;
  stampAt?: number;
}) => {
  const frame = useCurrentFrame();
  const shot = useShot();
  const t = ramp(frame, shot.start, shot.start + shot.duration);
  const scale = interpolate(t, [0, 1], move.scale);
  const pop = enter(frame, shot.start, 200);
  const file = staticFile(`stills/${src}`);
  const stampOn = stampAt !== undefined && frame >= stampAt && (frame - stampAt) % 50 < 47;
  return (
    <AbsoluteFill style={{background: INK.bg, overflow: "hidden"}}>
      <Img src={file} style={{...fill, filter: "blur(40px) brightness(0.45) saturate(1.2)", transform: "scale(1.2)"}} />
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 460,
          width: 960,
          height: 720,
          transform: `scale(${scale * pop.scale})`,
          transformOrigin: move.origin ?? "50% 50%",
          boxShadow: "0 30px 90px rgba(0,0,0,0.8)",
          outline: "10px solid #f1ede0",
          opacity: pop.opacity,
          overflow: "hidden",
        }}
      >
        <Img src={file} style={{...fill, filter: "contrast(1.05)"}} />
        {stamp ? (
          <div
            style={{
              position: "absolute",
              right: 28,
              bottom: 22,
              fontFamily: FONT.mono,
              fontWeight: 700,
              fontSize: 40,
              letterSpacing: 2,
              color: INK.stamp,
              textShadow: "0 0 8px rgba(255,120,30,0.7)",
              opacity: stampOn ? 1 : 0,
            }}
          >
            {stamp}
          </div>
        ) : null}
      </div>
      {label && labelAt !== undefined ? (
        <Kicker at={labelAt} top={340}>
          {label}
        </Kicker>
      ) : null}
      <Shade />
    </AbsoluteFill>
  );
};

/** The original photo as it appeared on /x/. */
const Anh: FC = () => {
  const shot = useShot();
  return <Photo src="backrooms-2002.jpg" move={{scale: [1.0, 1.14], origin: "50% 55%"}} label="4CHAN /x/ · 12/05/2019" labelAt={shot.start + 6} />;
};

/** A view counter that climbs to the number the voice says. */
const Phim: FC = () => {
  const frame = useCurrentFrame();
  const shot = useShot();
  const at = wordAt("90", shot.start) - 6;
  const n = Math.round(interpolate(ramp(frame, shot.start + 10, at + 6), [0, 1], [0, 90]));
  const e = enter(frame, shot.start + 10);
  return (
    <Clip src="gap" move={{scale: [1.05, 1.18]}} grade="brightness(1.2) contrast(1.05)">
      <Kicker at={shot.start + 4} top={500}>
        THE BACKROOMS (FOUND FOOTAGE)
      </Kicker>
      <div
        style={{
          position: "absolute",
          top: 630,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: FONT.sans,
          fontWeight: 900,
          fontSize: 190,
          color: INK.yellow,
          opacity: e.opacity,
          textShadow: INK.shadow,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {n}+ TRIỆU
      </div>
      <Kicker at={at + 8} top={860} color={INK.text}>
        LƯỢT XEM
      </Kicker>
    </Clip>
  );
};

/** Limen: an exit door opens onto the yellow room, the Latin root word. */
const Limen: FC = () => {
  const shot = useShot();
  const nghia = wordAt("ngưỡng", shot.start);
  return (
    <Clip src="door" from={2.5} rate={1.5} move={{scale: [1.02, 1.12]}} grade="brightness(1.25) contrast(1.05)">
      <Kicker at={shot.start + 4} top={500}>
        TIẾNG LATIN
      </Kicker>
      <Big at={wordAt("limen,", shot.start) - 4} top={610} size={150} spread={[24, 10]}>
        LIMEN
      </Big>
      <Rule at={nghia - 6} top={800} width={360} />
      <Kicker at={nghia} top={835} color={INK.yellow}>
        = NGƯỠNG CỬA
      </Kicker>
    </Clip>
  );
};

/** Three places you pass through, named one by one with the voice. */
const Qua: FC = () => {
  const frame = useCurrentFrame();
  const shot = useShot();
  const items = [
    ["HÀNH LANG", wordAt("Hành", shot.start)],
    ["SẢNH CHỜ", wordAt("sảnh", shot.start)],
    ["BÃI ĐỖ XE", wordAt("bãi", shot.start)],
  ] as const;
  return (
    <Clip src="pillars" move={{scale: [1.04, 1.14]}} grade="brightness(1.2) contrast(1.05)">
      {items.map(([text, at], i) => {
        const e = enter(frame, at);
        return (
          <div
            key={text}
            style={{
              position: "absolute",
              top: 560 + i * 120,
              left: 0,
              right: 0,
              textAlign: "center",
              fontFamily: FONT.sans,
              fontWeight: 800,
              fontSize: 76,
              letterSpacing: 6,
              color: INK.text,
              opacity: e.opacity,
              transform: `translateY(${e.translateY}px)`,
              textShadow: INK.shadow,
            }}
          >
            {text}
          </div>
        );
      })}
    </Clip>
  );
};

/** The people vanish: a dark corridor, no text. */
const Vang: FC = () => <Clip src="dark" move={{scale: [1.06, 1.16]}} grade="brightness(1.3) contrast(1.05)" />;

/** Three things wrong with the room, each appearing when the voice names it. */
const Lech: FC = () => {
  const frame = useCurrentFrame();
  const shot = useShot();
  const items = [
    ["KHÔNG CỬA SỔ", wordAt("cửa", shot.start)],
    ["TƯỜNG LẶP MÃI", wordAt("tường", shot.start)],
    ["KHÔNG LỐI RA", wordAt("lối", shot.start)],
  ] as const;
  return (
    <Clip src="hall" move={{scale: [1.0, 1.14]}} grade="brightness(1.05) contrast(1.08)">
      {items.map(([text, at], i) => {
        const e = enter(frame, at);
        return (
          <div
            key={text}
            style={{
              position: "absolute",
              top: 540 + i * 118,
              left: 150,
              right: 150,
              padding: "14px 0",
              textAlign: "center",
              fontFamily: FONT.mono,
              fontWeight: 700,
              fontSize: 50,
              letterSpacing: 4,
              color: "#151100",
              background: INK.yellow,
              opacity: e.opacity,
              transform: `translateY(${e.translateY}px) scale(${e.scale})`,
              boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
            }}
          >
            {text}
          </div>
        );
      })}
    </Clip>
  );
};

/** The experiment: the source is written on screen, the voice does not read the authors. */
const Thi: FC = () => {
  const shot = useShot();
  return (
    <Clip src="open" move={{scale: [1.08, 1.2]}} grade="brightness(1.35) contrast(1.05)">
      <Kicker at={shot.start + 6} top={500}>
        THÍ NGHIỆM · 2022
      </Kicker>
      <Big at={wordAt("lệch", shot.start) - 4} top={620} size={96}>
        CÀNG LỆCH
        <br />
        CÀNG RỢN
      </Big>
      <Kicker at={shot.start + 20} top={880}>
        JOURNAL OF ENVIRONMENTAL PSYCHOLOGY
      </Kicker>
    </Clip>
  );
};

/** Add people to the hall: the opening room clip continues, short text. */
const Nguoi: FC = () => {
  const shot = useShot();
  return (
    <Clip src="room" from={1.5} rate={0.9} move={{scale: [1.1, 1.2]}} grade="brightness(1.1) contrast(1.05)">
      <Big at={wordAt("thêm", shot.start) - 4} top={600} size={92}>
        + NGƯỜI
      </Big>
      <Kicker at={wordAt("giảm", shot.start) - 2} top={730} color={INK.yellow}>
        BỚT RỢN
      </Kicker>
    </Clip>
  );
};

/**
 * Link back to the previous video: a line with a dip drawn thin over the clip, the label switches
 * from "face" to "room". The line is a diagram, not a measurement.
 */
const Uv: FC = () => {
  const frame = useCurrentFrame();
  const shot = useShot();
  const draw = ramp(frame, shot.start + 4, shot.start + 40);
  const swap = wordAt("căn", shot.start);
  const s = ramp(frame, swap - 4, swap + 8);
  const path = "M 140 1040 C 380 960, 560 880, 680 860 C 740 850, 760 1060, 820 1080 C 870 1095, 900 820, 960 760";
  return (
    <Clip src="hall" from={7} move={{scale: [1.1, 1.2]}} grade="brightness(0.75) contrast(1.05)">
      <Kicker at={shot.start + 4} top={560}>
        UNCANNY VALLEY
      </Kicker>
      <svg viewBox="0 0 1080 1920" style={{position: "absolute", inset: 0, width: "100%", height: "100%"}}>
        <path d={path} fill="none" stroke={INK.yellow} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
        <circle cx={800} cy={1074} r={16} fill={INK.yellow} opacity={draw > 0.95 ? 1 : 0} />
      </svg>
      <div
        style={{
          position: "absolute",
          top: 1110,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: FONT.sans,
          fontWeight: 800,
          fontSize: 60,
          color: INK.text,
          textShadow: INK.shadow,
          height: 80,
        }}
      >
        <span style={{position: "absolute", left: 0, right: 0, opacity: 1 - s, textDecoration: s > 0 ? "line-through" : "none"}}>KHUÔN MẶT</span>
        <span style={{position: "absolute", left: 0, right: 0, opacity: s, color: INK.yellow}}>CĂN PHÒNG</span>
      </div>
    </Clip>
  );
};

/** The original is found: the 4chan photo returns, labelled 2024. */
const Tim: FC = () => {
  const shot = useShot();
  return <Photo src="backrooms-2002.jpg" move={{scale: [1.14, 1.22], origin: "50% 55%"}} label="TÌM RA NĂM 2024" labelAt={shot.start + 4} />;
};

/** A second photo of the same room, with the camera date stamp. */
const Nha: FC = () => {
  const shot = useShot();
  return (
    <Photo
      src="backrooms-2002-b.jpg"
      move={{scale: [1.0, 1.12]}}
      label="OSHKOSH, WISCONSIN"
      labelAt={wordAt("Wisconsin,", shot.start) - 4}
      stamp="'02 6 12"
      stampAt={wordAt("2002", shot.start) - 4}
    />
  );
};

/** The lights in the closing line flicker off on this frame. The sound uses the same function, so the click matches the picture. */
export const flickerAt = (frame: number) => frame >= shotById("chot").start && hash(Math.floor(frame / 2)) > 0.93;

/** Closing: a grey office corridor, fluorescent lights flickering. */
const Chot: FC = () => {
  const frame = useCurrentFrame();
  const flick = flickerAt(frame) ? 0.55 : 1;
  return (
    <Clip src="office" from={1.6} move={{scale: [1.0, 1.1]}} grade={`brightness(${1.05 * flick}) contrast(1.05)`} />
  );
};

export const SHOT_SCENE: Record<ShotId, FC> = {
  hook: Hook,
  ten: Ten,
  anh: Anh,
  phim: Phim,
  limen: Limen,
  qua: Qua,
  vang: Vang,
  lech: Lech,
  thi: Thi,
  nguoi: Nguoi,
  uv: Uv,
  tim: Tim,
  nha: Nha,
  chot: Chot,
};
