/**
 * Shared frame for drawn SVG scenes on land: sky, ground, clouds, sun, film
 * grain, camera, text chips, time-of-day clock.
 *
 * Method from @doc/patterns/canh-ve-svg-giua-bien (Alvarenga video), with the sea swapped
 * for grassland. All randomness goes through `rnd(seed)` so every frame draws exactly the same.
 */
import React from "react";
import {AbsoluteFill, Easing, interpolate} from "remotion";
import {PANEL_MAX_W, SAFE_TOP} from "../../shared/frame/SafeZones";
import {FONT, H, MAP as C, W} from "../../shared/theme";

export const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
export const ease = Easing.inOut(Easing.cubic);
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const k01 = (v: number) => Math.max(0, Math.min(1, v));

/** Seeded pseudo-random number. */
export const rnd = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const hexRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const rgba = (hex: string, a: number) => `rgba(${hexRgb(hex).join(",")},${a})`;
export const mixHex = (a: string, b: string, k: number) => {
  const [x, y] = [hexRgb(a), hexRgb(b)];
  const c = x.map((v, i) => Math.round(v + (y[i] - v) * k));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

/** Horizon line on the portrait frame. Ground runs from HY to the bottom of the frame. */
export const HY = 860;

export type Sky = "day" | "noon" | "afternoon" | "dusk" | "night" | "dawn" | "rain";

/**
 * Palette per sky. `k` multiplies the colour channels for people and props (draw one daytime
 * colour set, it fits every sky); `rim` is the light outline for dark scenes.
 */
export const SKY: Record<
  Sky,
  {top: string; low: string; far: string; ground: string; near: string; light: number; k: [number, number, number]; rim?: string}
> = {
  day: {top: "#3E86BE", low: "#CFE6EE", far: "#8FA56B", ground: "#7C9450", near: "#4F6A30", light: 1, k: [1, 1, 1]},
  noon: {top: "#5BA6D6", low: "#F4F0D8", far: "#A9B375", ground: "#8E9C55", near: "#5C7234", light: 1.1, k: [1.05, 1.02, 0.94]},
  afternoon: {top: "#4F8DBF", low: "#F2DFB0", far: "#A39A62", ground: "#8C8C4B", near: "#59652E", light: 1, k: [1.04, 0.96, 0.84]},
  dusk: {top: "#2A2350", low: "#E9875A", far: "#5C4B47", ground: "#4A4433", near: "#2B2C1E", light: 0.7, k: [0.82, 0.6, 0.56], rim: "#FFB27A"},
  night: {top: "#03070F", low: "#132440", far: "#1A2430", ground: "#141C22", near: "#0B1015", light: 0.4, k: [0.36, 0.44, 0.6], rim: "#BFD6F2"},
  dawn: {top: "#22355E", low: "#F0B27E", far: "#6E7058", ground: "#5E6A44", near: "#38452A", light: 0.85, k: [0.96, 0.82, 0.74], rim: "#FFD2A0"},
  rain: {top: "#46545C", low: "#909CA2", far: "#5E6A55", ground: "#4E5A3E", near: "#323C28", light: 0.7, k: [0.72, 0.78, 0.8]},
};

const CLOUD: Record<Sky, {n: number; body: string; belly: string; a: number}> = {
  day: {n: 6, body: "#FFFFFF", belly: "#D6E6EE", a: 0.8},
  noon: {n: 3, body: "#FFFFFF", belly: "#EEEBD8", a: 0.6},
  afternoon: {n: 5, body: "#FFF8EA", belly: "#E8C9A0", a: 0.75},
  dusk: {n: 6, body: "#4B3A66", belly: "#F08A5D", a: 0.85},
  night: {n: 4, body: "#16253D", belly: "#0B1526", a: 0.7},
  dawn: {n: 6, body: "#5A5878", belly: "#FFB27F", a: 0.85},
  rain: {n: 10, body: "#6E7A80", belly: "#48545A", a: 0.95},
};

export const Clouds: React.FC<{sky: Sky; frame: number; height?: number}> = ({sky, frame, height = HY}) => {
  const c = CLOUD[sky];
  const id = `cl-${sky}`;
  return (
    <svg width={W} height={height} style={{position: "absolute"}}>
      <defs>
        <filter id={`${id}-b`} x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation={10} />
        </filter>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.body} />
          <stop offset="1" stopColor={c.belly} />
        </linearGradient>
      </defs>
      {Array.from({length: c.n}, (_, i) => {
        const depth = rnd(i + 700);
        const y = 200 + depth * (height - 330);
        const s = 0.55 + depth * 0.9;
        const span = W + 700;
        const x = ((rnd(i + 710) * span + frame * (0.12 + depth * 0.3)) % span) - 350;
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${s} ${s * 0.8})`} filter={`url(#${id}-b)`} opacity={c.a * (0.65 + depth * 0.35)}>
            {Array.from({length: 5}, (_, k) => (
              <ellipse
                key={k}
                cx={(k - 2) * 70 + rnd(i * 9 + k) * 30}
                cy={-Math.sin(((k + 0.5) / 5) * Math.PI) * 40 - rnd(i * 7 + k) * 20}
                rx={70 + rnd(i * 5 + k) * 50}
                ry={34 + rnd(i * 3 + k) * 22}
                fill={`url(#${id}-g)`}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
};

export const Sun: React.FC<{size: number; x: number; y: number; tone?: string; glow?: string; on?: number}> = ({
  size,
  x,
  y,
  tone = "#FFF6D6",
  glow = "rgba(255,236,170,0.55)",
  on = 1,
}) => (
  <div style={{position: "absolute", left: 0, top: 0, width: W, height: HY, overflow: "hidden", opacity: on}}>
    <div style={{position: "absolute", left: x - size * 3, top: y - size * 3, width: size * 6, height: size * 6, borderRadius: "50%", background: `radial-gradient(circle, ${glow} 0%, rgba(0,0,0,0) 60%)`}} />
    <div style={{position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: size / 2, background: tone, boxShadow: `0 0 ${size}px ${size / 3}px ${glow}`}} />
  </div>
);

export const Stars: React.FC<{on: number; frame: number; height?: number; count?: number}> = ({on, frame, height = HY, count = 90}) => (
  <svg width={W} height={height} style={{position: "absolute", opacity: on}}>
    {Array.from({length: count}, (_, i) => (
      <circle
        key={i}
        cx={rnd(i) * W}
        cy={rnd(i + 200) * (height - 60)}
        r={0.8 + rnd(i + 400) * 1.8}
        fill="#fff"
        opacity={(0.3 + rnd(i + 600) * 0.6) * (0.75 + 0.25 * Math.sin(frame / (6 + rnd(i + 800) * 10) + i))}
      />
    ))}
  </svg>
);

/** Sun and moon per sky. */
export const SkyLights: React.FC<{sky: Sky; frame: number}> = ({sky, frame}) => {
  if (sky === "noon") return <Sun size={170} x={760} y={360} />;
  if (sky === "day") return <Sun size={110} x={860} y={420} on={0.7} />;
  if (sky === "afternoon") return <Sun size={130} x={880} y={560} tone="#FFF0C8" glow="rgba(255,214,150,0.55)" />;
  if (sky === "dusk") return <Sun size={150} x={240} y={HY - 10} tone="#FFC27A" glow="rgba(255,140,80,0.65)" />;
  if (sky === "dawn") return <Sun size={120} x={860} y={HY - 40} tone="#FFE2B0" glow="rgba(255,178,110,0.6)" />;
  if (sky === "night")
    return (
      <>
        <Stars on={1} frame={frame} />
        <Sun size={86} x={830} y={420} tone="#F4F1E4" glow="rgba(244,241,228,0.3)" />
      </>
    );
  return null;
};

/** Sky + flat grassland, with distant grass strokes and a tree line on the horizon. */
export const Land: React.FC<{sky: Sky; frame: number; treeLine?: boolean; marsh?: boolean}> = ({sky, frame, treeLine = true, marsh = false}) => {
  const s = SKY[sky];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `linear-gradient(to bottom, ${s.top} 0%, ${s.low} ${(HY / H) * 100}%, ${s.far} ${(HY / H) * 100}%, ${s.ground} 62%, ${s.near} 100%)`}} />
      <SkyLights sky={sky} frame={frame} />
      <Clouds sky={sky} frame={frame} />
      <div style={{position: "absolute", left: 0, right: 0, top: HY - 160, height: 200, background: `linear-gradient(to bottom, ${rgba(s.low, 0)} 0%, ${rgba(s.low, 0.5)} 80%, ${rgba(s.low, 0)} 100%)`}} />
      <svg width={W} height={H} style={{position: "absolute"}}>
        {treeLine ? (
          <path
            d={`M 0 ${HY} ${Array.from({length: 28}, (_, i) => {
              const x = (i / 27) * W;
              return `L ${x.toFixed(0)} ${(HY - 18 - rnd(i + 90) * 34 - Math.sin(i * 0.9) * 8).toFixed(0)}`;
            }).join(" ")} L ${W} ${HY} Z`}
            fill={mixHex(s.far, "#1E2A18", 0.55)}
            opacity={0.85}
          />
        ) : null}
        {marsh ? (
          <g>
            <path d={`M 0 ${HY + 40} Q 300 ${HY + 20} 560 ${HY + 46} T ${W} ${HY + 36} L ${W} ${HY + 110} Q 600 ${HY + 130} 0 ${HY + 100} Z`} fill={mixHex(s.low, "#2A4A55", 0.55)} opacity={0.75} />
            {Array.from({length: 40}, (_, i) => {
              const x = rnd(i + 300) * W;
              const y = HY + 40 + rnd(i + 301) * 70;
              return <path key={i} d={`M ${x} ${y} q ${Math.sin(frame / 30 + i) * 3} -18 ${2 + rnd(i) * 4} -${22 + rnd(i + 7) * 18}`} stroke={mixHex(s.far, "#000000", 0.3)} strokeWidth={2.5} fill="none" />;
            })}
          </g>
        ) : null}
        {/* distant grass strokes: pale, thin, longer the closer they are */}
        {Array.from({length: 140}, (_, i) => {
          const d = Math.pow(rnd(i + 20), 1.7);
          const y = HY + 20 + d * (H - HY - 40);
          const x = rnd(i + 21) * W;
          const h = 6 + d * 36;
          const sway = Math.sin(frame / 25 + i) * (2 + d * 5);
          return <path key={i} d={`M ${x} ${y} q ${sway} ${-h / 2} ${sway * 1.6} ${-h}`} stroke={mixHex(s.ground, s.low, 0.25 + rnd(i + 22) * 0.25)} strokeWidth={1.5 + d * 2.5} fill="none" opacity={0.35 + d * 0.3} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** Tall foreground grass, bottom edge of the frame. `h` height, `hide` so people can hide behind it. */
export const TallGrass: React.FC<{sky: Sky; frame: number; top: number; count?: number; seed?: number; dark?: number}> = ({sky, frame, top, count = 220, seed = 0, dark = 0.2}) => {
  const s = SKY[sky];
  return (
    <svg width={W} height={H} style={{position: "absolute"}}>
      {Array.from({length: count}, (_, i) => {
        const x = rnd(i + seed + 1000) * (W + 60) - 30;
        const base = top + 40 + rnd(i + seed + 1001) * (H - top);
        const h = 90 + rnd(i + seed + 1002) * 160;
        const sway = Math.sin(frame / 18 + i * 0.7) * 10 + Math.sin(frame / 7 + i) * 3;
        const tone = mixHex(s.near, s.low, rnd(i + seed + 1003) * 0.25 + 0.05);
        return <path key={i} d={`M ${x - 4} ${base} Q ${x + sway * 0.4} ${base - h * 0.6} ${x + sway} ${base - h} Q ${x + sway * 0.3 + 2} ${base - h * 0.55} ${x + 5} ${base} Z`} fill={mixHex(tone, "#000000", dark)} />;
      })}
    </svg>
  );
};

/** Grade people and props by sky. Put it inside the <defs> of the svg that draws them. */
export const GradeFilter: React.FC<{id: string; sky: Sky; boost?: number}> = ({id, sky, boost = 1}) => {
  const k = SKY[sky].k;
  return (
    <filter id={id} colorInterpolationFilters="sRGB">
      <feColorMatrix type="matrix" values={`${k[0] * boost} 0 0 0 0  0 ${k[1] * boost} 0 0 0  0 0 ${k[2] * boost} 0 0  0 0 0 1 0`} />
    </filter>
  );
};

/** Fine film grain. */
export const Grain: React.FC<{frame: number}> = ({frame}) => (
  <svg width={W} height={H} style={{position: "absolute", pointerEvents: "none", mixBlendMode: "overlay", opacity: 0.2}}>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={Math.floor(frame / 2) % 97} stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width={W} height={H} filter="url(#grain)" />
  </svg>
);

export const Vignette = () => (
  <AbsoluteFill style={{pointerEvents: "none", background: "radial-gradient(ellipse 80% 62% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)"}} />
);

export type Cam = {z: [number, number]; at?: [number, number]; to?: [number, number]; shake?: number};

/** Zoom around a look point, pan, handheld shake. Zoom always >= 1 so the edges never show. */
export const Camera: React.FC<{cam?: Cam; t: number; frame: number; children: React.ReactNode}> = ({cam, t, frame, children}) => {
  if (!cam) return <AbsoluteFill>{children}</AbsoluteFill>;
  const k = ease(k01(t));
  const z = Math.max(1, lerp(cam.z[0], cam.z[1], k));
  const at = cam.at ?? [540, 1000];
  const to = cam.to ?? at;
  const ox = lerp(at[0], to[0], k);
  const oy = lerp(at[1], to[1], k);
  const sh = cam.shake ?? 0;
  const jx = sh * (Math.sin(frame * 0.83) * 0.6 + Math.sin(frame * 2.1 + 1) * 0.4);
  const jy = sh * 0.7 * (Math.sin(frame * 1.07 + 2) * 0.6 + Math.sin(frame * 2.7) * 0.4);
  return <AbsoluteFill style={{transform: `translate(${jx}px, ${jy}px) scale(${z})`, transformOrigin: `${ox}px ${oy}px`}}>{children}</AbsoluteFill>;
};

export const Chip: React.FC<{text: string; sub?: string; t: number; top?: number; tone?: string}> = ({text, sub, t, top = 470, tone = C.warn}) => {
  const on = interpolate(t, [0, 10], [0, 1], clamp);
  return (
    <div style={{position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: on, transform: `translateY(${(1 - on) * 16}px)`}}>
      <div
        style={{
          maxWidth: PANEL_MAX_W,
          padding: "16px 30px",
          borderRadius: 18,
          background: "rgba(4,18,26,0.8)",
          border: `2px solid ${tone}`,
          textAlign: "center",
          fontFamily: FONT.sans,
          boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{fontSize: 48, fontWeight: 800, color: tone, lineHeight: 1.2}}>{text}</div>
        {sub ? <div style={{fontSize: 32, fontWeight: 600, color: C.text, marginTop: 6, lineHeight: 1.3}}>{sub}</div> : null}
      </div>
    </div>
  );
};

export const BigCount: React.FC<{label: string; value: string; on: number; top?: number; tone?: string; size?: number}> = ({label, value, on, top = 420, tone = "#fff", size = 150}) => (
  <div style={{position: "absolute", top, left: 0, right: 0, textAlign: "center", opacity: on, fontFamily: FONT.sans}}>
    <div style={{fontSize: 34, fontWeight: 800, letterSpacing: 5, color: "#fff", textShadow: "0 2px 14px rgba(0,0,0,0.8)"}}>{label}</div>
    <div style={{fontSize: size, lineHeight: 1, fontWeight: 900, color: tone, fontVariantNumeric: "tabular-nums", textShadow: "0 6px 30px rgba(0,0,0,0.8)"}}>{value}</div>
  </div>
);

/** "12:30" from a decimal hour. */
export const hhmm = (h: number) => {
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  return `${hh}:${String(mm).padStart(2, "0")}`;
};

const dayPart = (h: number) => (h < 5 ? "ĐÊM" : h < 11 ? "SÁNG" : h < 13.5 ? "TRƯA" : h < 18 ? "CHIỀU" : h < 19.5 ? "CHẠNG VẠNG" : "ĐÊM");

/**
 * Time-of-day clock at the top of the frame, under the watermark: the thing that counts the video's
 * time, like the 15 moons of Alvarenga.
 */
export const DayClock: React.FC<{hour: number; date: string; opacity: number}> = ({hour, date, opacity}) => {
  const R = 46;
  const m = (hour % 1) * 360;
  const h = ((hour % 12) / 12) * 360;
  const hand = (deg: number, len: number, w: number) => (
    <line x1={R} y1={R} x2={R + Math.sin((deg * Math.PI) / 180) * len} y2={R - Math.cos((deg * Math.PI) / 180) * len} stroke="#F4F1E4" strokeWidth={w} strokeLinecap="round" />
  );
  return (
    <div style={{position: "absolute", top: SAFE_TOP + 96, left: 0, right: 0, display: "flex", justifyContent: "center", opacity, fontFamily: FONT.sans}}>
      <div style={{display: "flex", alignItems: "center", gap: 22, padding: "12px 26px 12px 14px", borderRadius: 60, background: "rgba(4,18,26,0.55)"}}>
        <svg width={R * 2} height={R * 2}>
          <circle cx={R} cy={R} r={R - 3} fill="rgba(4,18,26,0.6)" stroke="#F4F1E4" strokeWidth={3} />
          {Array.from({length: 12}, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <circle key={i} cx={R + Math.sin(a) * (R - 11)} cy={R - Math.cos(a) * (R - 11)} r={2.2} fill="#F4F1E4" opacity={0.7} />;
          })}
          {hand(h, R * 0.5, 5)}
          {hand(m, R * 0.75, 3)}
          <circle cx={R} cy={R} r={4} fill={C.warn} />
        </svg>
        <div>
          <div style={{fontSize: 46, fontWeight: 900, color: "#F4F1E4", fontVariantNumeric: "tabular-nums", lineHeight: 1}}>
            {hhmm(hour)} <span style={{fontSize: 28, fontWeight: 800, letterSpacing: 3, color: C.warn}}>{dayPart(hour)}</span>
          </div>
          <div style={{fontSize: 24, fontWeight: 700, letterSpacing: 2, color: "rgba(244,241,228,0.75)", marginTop: 4}}>{date}</div>
        </div>
      </div>
    </div>
  );
};
