import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {PANEL_LEFT} from "../../shared/frame/SafeZones";
import {clamp, easeOut, ramp} from "../../shared/motion/anim";
import type {Palette} from "../../shared/theme";
import {linkAlpha, linkDistance, makeNodes, nodeCount, stepNodes, type FieldNode} from "./knowns-ui/ui/knowns/blocks/backgrounds/bg-utils";

/**
 * The film in Knowns UI's own look (https://ui.knowns.dev), not the shorts-kit default: the kit's dark tokens
 * (background oklch(0.145 0 0), foreground oklch(0.985 0 0), muted-foreground oklch(0.708 0 0)), its indigo
 * accent and signal colours (Tailwind indigo/red/emerald 400, as in Tag and StatusDot), the site's type (the
 * system sans at weight 600 with tight tracking), and its Node Field background.
 */
export const K = {
  bg: "#0a0a0a",
  card: "#171717",
  fg: "#fafafa",
  muted: "#a1a1a1",
  border: "rgba(255,255,255,0.10)",
  accent: "#818cf8",
  danger: "#f87171",
  success: "#34d399",
} as const;

export const SANS = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
export const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

/** PromoTemplate wants a palette; only `bg` is drawn (the background is FieldBg). */
export const KN_PALETTE: Palette = {bg: K.bg, deep: K.bg, surface: K.card, accent: K.accent, accentSoft: K.accent, warn: "#fbbf24", bad: K.danger, good: K.success, text: K.fg, muted: K.muted};

/** A Knowns UI component at phone size: drawn at `width / z` CSS px and zoomed (docs/promo/real-ui.md step 5). */
export const Kit: React.FC<{z: number; width: number; children: React.ReactNode; style?: React.CSSProperties}> = ({z, width, children, style}) => (
  <div className="dark" style={{zoom: z, width: width / z, color: K.fg, fontFamily: SANS, ...style}}>
    {children}
  </div>
);

/** Words that land one by one, in the site's headline style: weight 600, tight tracking, no bounce. */
export const Head: React.FC<{words: {text: string; at: number; color?: string}[]; size: number; align?: "left" | "center"}> = ({words, size, align = "left"}) => {
  const f = useCurrentFrame();
  return (
    <div style={{display: "flex", flexWrap: "wrap", justifyContent: align === "center" ? "center" : "flex-start", columnGap: size * 0.24, rowGap: 0, fontFamily: SANS, fontWeight: 600, fontSize: size, lineHeight: 1.06, letterSpacing: -size * 0.045}}>
      {words.map((w, i) => {
        const k = ramp(f, w.at, 10, easeOut);
        return (
          <span key={`${w.text}-${i}`} style={{display: "inline-block", color: w.color ?? K.fg, opacity: k, transform: `translateY(${(1 - k) * size * 0.18}px)`, filter: `blur(${(1 - k) * 6}px)`}}>
            {w.text}
          </span>
        );
      })}
    </div>
  );
};

/** The Knowns name, small, from the first frame (rule 12: a feed ad shows the brand by 5 s). */
export const Mark: React.FC<{size?: number; top?: number; left?: number}> = ({size = 34, top = 240, left = PANEL_LEFT}) => (
  <div style={{position: "absolute", left, top, display: "flex", alignItems: "center", gap: size * 0.32}}>
    <div style={{width: size * 0.62, height: size * 0.62, borderRadius: size * 0.16, background: K.fg}} />
    <div style={{fontFamily: SANS, fontWeight: 600, fontSize: size, letterSpacing: -size * 0.03, color: K.fg}}>knowns</div>
  </div>
);

/* ── Node Field, frame by frame ───────────────────────────────────────────────────────────────── */

// The field is laid out at half size (a 540×960 web view, as the kit's own NodeField would see a phone)
// and drawn at 2×. Nodes move with the kit's own stepNodes, one 1/30 s step per frame, from seed 11, so
// frame N is the same picture in every render (the original runs on requestAnimationFrame).
const FW = 540;
const FH = 960;
const STATES: FieldNode[][] = [];
const nodesAt = (frame: number): FieldNode[] => {
  if (!STATES.length) STATES.push(makeNodes(nodeCount(FW, FH, 1), FW, FH, 11));
  for (let i = STATES.length; i <= frame; i++) STATES.push(stepNodes(STATES[i - 1].map((n) => ({...n})), (1 / 30) * 0.9, FW, FH));
  return STATES[Math.max(0, frame)];
};

/**
 * Knowns UI's Node Field (blocks/backgrounds/node-field) behind the whole film: drifting nodes linked by
 * hairlines, radial fade mask. `lift` (absolute frames) raises the links when the product arrives.
 */
export const FieldBg: React.FC<{lift?: [number, number]}> = ({lift}) => {
  const f = useCurrentFrame();
  const nodes = nodesAt(f);
  const max = linkDistance(1);
  const k = lift ? interpolate(f, lift, [0.7, 1.25], clamp) : 1;
  const lines: React.ReactNode[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const al = linkAlpha(Math.hypot(a.x - b.x, a.y - b.y), max);
      if (al <= 0.01) continue;
      lines.push(<line key={`${i}-${j}`} x1={a.x * 2} y1={a.y * 2} x2={b.x * 2} y2={b.y * 2} stroke={K.fg} strokeOpacity={al * 0.32 * k} strokeWidth={2} />);
    }
  }
  return (
    <AbsoluteFill style={{background: K.bg}}>
      <AbsoluteFill style={{maskImage: "radial-gradient(ellipse 70% 65% at 50% 45%, #000 35%, transparent 100%)", WebkitMaskImage: "radial-gradient(ellipse 70% 65% at 50% 45%, #000 35%, transparent 100%)"}}>
        <svg width={1080} height={1920}>
          {lines}
          {nodes.map((n, i) => (
            <circle key={i} cx={n.x * 2} cy={n.y * 2} r={2.8} fill={K.fg} fillOpacity={0.55 * k} />
          ))}
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
