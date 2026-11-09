import type {CSSProperties} from "react";
import {AbsoluteFill, Audio, continueRender, delayRender, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {Captions} from "../../shared/caption/Captions";
import {FONT_FAMILY, loadChannelFont} from "../../shared/font";
import {PANEL_MAX_W, SAFE_TOP, SafeZones} from "../../shared/frame/SafeZones";
import {Watermark} from "../../shared/frame/Watermark";
import {EMBER, INK} from "./ink";
import {SHOT_CFG, type Img as ImgId, type ShotCfg} from "./shots";
import {AUDIO, EN, SHOTS, ShotContext, shotAt, useShot, wordAt, WORDS} from "./timing";

/** Every cut cross-fades over `XFADE` frames. */
const XFADE = 14;
const src = (id: ImgId) => staticFile(`stills/loi-nguyen/${id}.jpg`);
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

let avatarStarted = false;
const preloadAvatar = () => {
  if (avatarStarted || typeof document === "undefined") return;
  avatarStarted = true;
  const handle = delayRender("nap dau kenh");
  const image = new Image();
  image.onload = () => continueRender(handle);
  image.onerror = () => continueRender(handle);
  image.src = staticFile("img/avatar.jpg");
};

/** Progress 0..1 in the shot, stretched by XFADE so the push-in does not stall during the cross-fade. */
const useProgress = () => {
  const frame = useCurrentFrame();
  const shot = useShot();
  return interpolate(frame, [shot.start, shot.start + shot.duration + XFADE], [0, 1], clamp);
};

const Photo = ({id, cfg, style}: {id: ImgId; cfg: ShotCfg; style?: CSSProperties}) => {
  const t = useProgress();
  const [z0, z1] = cfg.zoom ?? [1, 1.12];
  const [p0, p1] = cfg.pan ?? [0, 0];
  const focus = cfg.focus ?? "50% 50%";
  return (
    <Img
      src={src(id)}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: focus,
        transformOrigin: focus,
        transform: `translateY(${p0 + (p1 - p0) * t}px) scale(${z0 + (z1 - z0) * t})`,
        filter: cfg.grade,
        ...style,
      }}
    />
  );
};

/** Landscape photo: the background is itself blurred, the sharp photo sits mid-frame above the captions. */
const Fit = ({cfg}: {cfg: ShotCfg}) => {
  const t = useProgress();
  const [z0, z1] = cfg.zoom ?? [1, 1.08];
  return (
    <AbsoluteFill>
      <Img src={src(cfg.img)} style={{position: "absolute", inset: -80, width: 1240, height: 2080, objectFit: "cover", filter: "blur(40px) brightness(0.35)"}} />
      <div style={{position: "absolute", left: 40, right: 40, top: 500, height: 720, overflow: "hidden", borderRadius: 6, boxShadow: "0 30px 80px rgba(0,0,0,0.7)"}}>
        <Img src={src(cfg.img)} style={{width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z0 + (z1 - z0) * t})`, filter: cfg.grade}} />
      </div>
    </AbsoluteFill>
  );
};

const bigText: CSSProperties = {fontFamily: FONT_FAMILY, color: INK.text, textAlign: "center", textShadow: INK.shadow};

/** Topic title, shown exactly when the voice names it. Never contains a profanity. */
const Title = ({cfg}: {cfg: ShotCfg}) => {
  const frame = useCurrentFrame();
  const shot = useShot();
  const a = wordAt("lời", shot.start);
  const b = wordAt("trí", shot.start);
  const o1 = interpolate(frame, [a, a + 10], [0, 1], clamp);
  const o2 = interpolate(frame, [b, b + 10], [0, 1], clamp);
  const flare = interpolate(frame, [b, b + 6, b + 30], [0, 1, 0.35], clamp);
  return (
    <AbsoluteFill>
      <Photo id={cfg.img} cfg={{...cfg, zoom: [1.1, 1.2]}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 30% at 50% 42%, rgba(255,106,43,${0.35 * flare}) 0%, transparent 70%)`}} />
      <div style={{...bigText, position: "absolute", left: 20, right: 20, top: 560}}>
        <div style={{fontSize: 92, fontWeight: 800, letterSpacing: 6, opacity: o1, transform: `translateY(${(1 - o1) * 20}px)`}}>LỜI NGUYỀN</div>
        <div style={{fontSize: 52, fontWeight: 700, letterSpacing: 4, color: INK.muted, opacity: o1, marginTop: 10}}>CỦA</div>
        <div
          style={{
            fontSize: 108,
            whiteSpace: "nowrap",
            fontWeight: 900,
            lineHeight: 1.05,
            color: INK.fire,
            opacity: o2,
            transform: `scale(${0.92 + 0.08 * o2})`,
            textShadow: `0 0 ${40 * flare}px ${INK.ember}, ${INK.shadow}`,
            marginTop: 10,
          }}
        >
          TRÍ THÔNG MINH
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** In every 10 Mensa members 2 have an anxiety disorder; in the US, 1. */
const Row = ({label, lit, at}: {label: string; lit: number; at: number}) => {
  const frame = useCurrentFrame();
  const shot = useShot();
  const local = frame - shot.start - at;
  return (
    <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 22, opacity: interpolate(local, [0, 12], [0, 1], clamp)}}>
      <div style={{...bigText, fontSize: 48, fontWeight: 800, letterSpacing: 4}}>{label}</div>
      <div style={{display: "flex", gap: 18}}>
        {Array.from({length: 10}, (_, i) => {
          const on = i < lit && local > 14 + i * 8;
          return (
            <div
              key={i}
              style={{width: 58, height: 58, borderRadius: 29, background: on ? INK.fire : "rgba(255,255,255,0.2)", boxShadow: on ? `0 0 26px ${INK.ember}` : "none"}}
            />
          );
        })}
      </div>
      <div style={{...bigText, fontSize: 40, fontWeight: 700, color: INK.muted}}>{lit} / 10</div>
    </div>
  );
};

const MensaDots = ({cfg}: {cfg: ShotCfg}) => (
  <AbsoluteFill>
    <Photo id={cfg.img} cfg={{...cfg, zoom: [1.15, 1.2]}} />
    <div style={{position: "absolute", left: 0, right: 0, top: 480, display: "flex", flexDirection: "column", alignItems: "center", gap: 90}}>
      <div style={{...bigText, fontSize: 52, fontWeight: 800, color: INK.fire}}>RỐI LOẠN LO ÂU</div>
      <Row label="MENSA" lit={2} at={0} />
      <Row label="MỸ" lit={1} at={40} />
    </div>
  </AbsoluteFill>
);

/** Fire flickering at the bottom edge: the orange glow rises and falls on two out-of-step waves. */
const Fire = () => {
  const frame = useCurrentFrame();
  const k = 0.55 + 0.25 * Math.sin(frame * 0.37) + 0.15 * Math.sin(frame * 0.91 + 1.3);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 90% 40% at 50% 100%, rgba(255,106,43,${0.45 * k}) 0%, rgba(255,179,71,${0.15 * k}) 45%, transparent 75%)`,
        mixBlendMode: "screen",
      }}
    />
  );
};

const Chip = ({text}: {text: string}) => {
  const frame = useCurrentFrame();
  const shot = useShot();
  const local = frame - shot.start;
  const o = interpolate(local, [8, 20], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        top: SAFE_TOP + 120,
        opacity: o,
        transform: `translateX(${(1 - o) * -24}px)`,
        display: "flex",
        alignItems: "center",
        gap: 16,
        fontFamily: FONT_FAMILY,
        fontSize: 38,
        fontWeight: 800,
        letterSpacing: 4,
        color: INK.text,
        textShadow: INK.shadow,
      }}
    >
      <div style={{width: 8, height: 44, background: INK.fire, boxShadow: `0 0 16px ${INK.ember}`}} />
      {text}
    </div>
  );
};

const Shade = () => (
  <AbsoluteFill
    style={{background: "linear-gradient(to bottom, rgba(5,3,2,0.55) 0%, rgba(5,3,2,0) 24%, rgba(5,3,2,0) 50%, rgba(5,3,2,0.9) 100%)"}}
  />
);

const Scene = () => {
  const shot = useShot();
  const cfg = SHOT_CFG[shot.n - 1];
  const mode = cfg.mode ?? "cover";
  return (
    <AbsoluteFill style={{background: INK.bg}}>
      {mode === "cover" ? <Photo id={cfg.img} cfg={cfg} /> : null}
      {mode === "fit" ? <Fit cfg={cfg} /> : null}
      {mode === "title" ? <Title cfg={cfg} /> : null}
      {mode === "mensa-dots" ? <MensaDots cfg={cfg} /> : null}
      {cfg.fire ? <Fire /> : null}
      <Shade />
      {cfg.chip ? <Chip text={cfg.chip} /> : null}
    </AbsoluteFill>
  );
};

/** Whole-video overlay: warm like an oil painting, dark vignette, film grain. */
const Grade = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      <AbsoluteFill style={{background: "rgba(80,40,10,0.12)", mixBlendMode: "multiply"}} />
      <AbsoluteFill style={{background: "radial-gradient(ellipse 80% 65% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.65) 100%)"}} />
      <svg width={1080} height={1920} style={{position: "absolute", inset: 0, opacity: 0.09, mixBlendMode: "overlay"}}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 24} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

export const LoiNguyen: React.FC<{safe?: boolean}> = ({safe = false}) => {
  const frame = useCurrentFrame();
  loadChannelFont();
  preloadAvatar();
  const shot = shotAt(frame);
  const prev = SHOTS[SHOTS.indexOf(shot) - 1];
  const local = frame - shot.start;
  const crossing = prev && local < XFADE;

  return (
    <AbsoluteFill style={{background: INK.bg, color: INK.text}}>
      {AUDIO ? <Audio src={staticFile(AUDIO)} /> : null}
      {crossing ? (
        <ShotContext.Provider value={prev}>
          <Scene key={`prev-${prev.n}`} />
        </ShotContext.Provider>
      ) : null}
      <ShotContext.Provider value={shot}>
        <AbsoluteFill key={shot.n} style={{opacity: crossing ? local / XFADE : 1}}>
          <Scene />
        </AbsoluteFill>
      </ShotContext.Provider>
      <Grade />
      <Captions words={WORDS} palette={EMBER} variant="map" maxWidth={PANEL_MAX_W} en={EN} />
      <Watermark top={SAFE_TOP + 8} />
      {safe ? <SafeZones /> : null}
    </AbsoluteFill>
  );
};
