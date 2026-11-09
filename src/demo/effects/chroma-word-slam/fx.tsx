import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {clamp} from "../../shared/motion/anim";
import {DEFAULT_PALETTE as P, FONT} from "../../shared/theme";
import {CARD, rise, up} from "./ui";

/** One beat at 119.952 BPM and 30 fps, in frames. */
export const BEAT = 15;

/**
 * A crash zoom (docs/shots/crash-zoom-punch.md): a small pull-back, then 6 frames ease-in to `zoom`
 * about (cx, cy), then a rebound of 5%. Wrap the content; coordinates are in frame pixels.
 */
export const CrashZoom: React.FC<{at: number; zoom: number; cx: number; cy: number; children: React.ReactNode}> = ({at, zoom, cx, cy, children}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [at - 8, at - 1, at + 5, at + 11], [1, 0.965, zoom, zoom * 0.95], {...clamp, easing: Easing.in(Easing.cubic)});
  const settle = interpolate(f, [at + 11, at + 40], [0, 1], clamp);
  const s = z + (zoom * 0.97 - zoom * 0.95) * settle;
  return <AbsoluteFill style={{transform: `scale(${s})`, transformOrigin: `${cx}px ${cy}px`}}>{children}</AbsoluteFill>;
};

/** Text with a chromatic split that decays: three copies, no blend modes. */
export const ChromaText: React.FC<{text: string; size: number; color: string; split: number; style?: React.CSSProperties}> = ({text, size, color, split, style}) => {
  const base: React.CSSProperties = {position: "absolute", left: 0, right: 0, textAlign: "center", fontFamily: FONT.sans, fontWeight: 900, fontSize: size, letterSpacing: -size / 30, lineHeight: 1, whiteSpace: "nowrap", ...style};
  return (
    <div style={{position: "relative", height: size}}>
      <div style={{...base, color: "#19d3ff", opacity: 0.85, transform: `translateX(${split}px)`}}>{text}</div>
      <div style={{...base, color: "#ff2d55", opacity: 0.85, transform: `translateX(${-split}px)`}}>{text}</div>
      <div style={{...base, color}}>{text}</div>
    </div>
  );
};

/** Big words that land one by one (word relay): rise, overshoot-free, out-cubic. */
export const Kinetic: React.FC<{words: {text: string; at: number; color?: string}[]; size: number; gap?: number; align?: "left" | "center"}> = ({words, size, gap = 0.08, align = "left"}) => {
  const f = useCurrentFrame();
  return (
    <div style={{display: "flex", flexWrap: "wrap", justifyContent: align === "center" ? "center" : "flex-start", columnGap: size * Math.max(gap, 0.2), rowGap: size * 0.04, fontFamily: FONT.sans, fontWeight: 900, fontSize: size, lineHeight: 1.02, letterSpacing: -size / 35}}>
      {words.map((w) => {
        const k = up(f, w.at, 9);
        return (
          <span key={w.text + w.at} style={{display: "inline-block", color: w.color ?? P.text, opacity: k, transform: `translateY(${(1 - k) * size * 0.28}px) scale(${1.12 - 0.12 * k})`, transformOrigin: "0 100%"}}>
            {w.text}
          </span>
        );
      })}
    </div>
  );
};

type GNode = {id: string; x: number; y: number; label: string; color: string; at: number};

/** A small memory graph: the agent in the middle, memories around it, edges that draw themselves. */
export const MemoryGraph: React.FC<{w: number; h: number; nodes: GNode[]; onLight?: (id: string) => void}> = ({w, h, nodes}) => {
  const f = useCurrentFrame();
  const cx = w / 2;
  const cy = h / 2;
  const centre = up(f, 0, 10);
  return (
    <svg width={w} height={h} style={{overflow: "visible"}}>
      {nodes.map((n) => {
        const k = interpolate(f, [n.at, n.at + 12], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
        const len = Math.hypot(n.x - cx, n.y - cy);
        return <line key={`e-${n.id}`} x1={cx} y1={cy} x2={cx + (n.x - cx) * k} y2={cy + (n.y - cy) * k} stroke={n.color} strokeWidth={4} strokeLinecap="round" strokeDasharray={`${len}`} opacity={0.85 * Math.min(1, k * 3)} />;
      })}
      <circle cx={cx} cy={cy} r={64 * centre} fill={`${P.accent}22`} stroke={P.accent} strokeWidth={4} />
      <text x={cx} y={cy + 9} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={24} letterSpacing={2} fill={P.accentSoft} opacity={centre}>AGENT</text>
      {nodes.map((n) => {
        const k = interpolate(f, [n.at + 10, n.at + 20], [0, 1], {...clamp, easing: Easing.out(Easing.back(2))});
        const glow = Math.max(0, 1 - (f - (n.at + 12)) / 14) * (f >= n.at + 12 ? 1 : 0);
        return (
          <g key={n.id} opacity={Math.min(1, k * 2)}>
            <circle cx={n.x} cy={n.y} r={(34 + 12 * glow) * k} fill={`${n.color}26`} stroke={n.color} strokeWidth={4} />
            <text x={n.x} y={n.y + 78} textAnchor="middle" fontFamily={FONT.mono} fontWeight={700} fontSize={26} fill={P.text}>{n.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

/** A full-frame colour wash that decays: the flash of a hit. */
export const Wash: React.FC<{color: string; at: number; peak: number; frames: number}> = ({color, at, peak, frames}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at, at + frames], [peak, 0], {...clamp, easing: Easing.out(Easing.cubic)});
  return <AbsoluteFill style={{background: color, opacity: o, pointerEvents: "none"}} />;
};

/** The dark rim that closes in while tension builds. */
export const Vignette: React.FC<{from: number; to: number; peak: number; color: string}> = ({from, to, peak, color}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [from, to], [0, peak], clamp);
  return <AbsoluteFill style={{background: `radial-gradient(ellipse 75% 60% at 50% 48%, transparent 40%, ${color} 100%)`, opacity: o, pointerEvents: "none"}} />;
};

export {CARD, rise, up};
