/**
 * Thin wrappers over shared TankGauge / CockpitGauges, plus the option chips
 * (no shared component for those). Dipstick, GlidePath, CampSite, ClaimCard and
 * LayerBars now come straight from src/shared.
 */
import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {FONT} from "../../shared/theme";
import {CockpitGauges} from "../../shared/gauge/CockpitGauges";
import {TankGauge, TankGaugePair} from "../../shared/gauge/TankGauge";
import {HUD_H, HUD_TOP} from "../../shared/frame/ChapterHud";
import {PANEL_MAX_W} from "../../shared/frame/SafeZones";
import {LOWPOLY as P} from "../../shared/three/palette";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
export const GOOD = "#5BD68A";
export const BAD = "#FF5A4D";
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const TOP = HUD_TOP + HUD_H + 70;

/** s05 inset: the fuel gauges, dark. Fades out at `to`. */
export const GaugesInset: React.FC<{from: number; to: number}> = ({from, to}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [from, from + 8, to - 8, to], [0, 1, 1, 0], clamp);
  if (o <= 0) return null;
  return (
    <div style={{opacity: o}}>
      <CockpitGauges labels={["Trái", "Giữa", "Phải"]} values={["8.888", "8.888", "8.888"]} unit="kg" blankText="Trống" state="blank" accent={P.orange} top={TOP} />
    </div>
  );
};

/** s17: the three displays go dark one by one, then four analogue dials stay lit. `at` = frames. */
export const GaugesFade: React.FC<{off: [number, number, number]; dialsAt: number}> = ({off, dialsAt}) => (
  <AbsoluteFill style={{background: `linear-gradient(180deg, ${P.sky} 0%, #0F161E 100%)`}}>
    <CockpitGauges
      labels={["Trái", "Giữa", "Phải"]}
      values={["8.888", "8.888", "8.888"]}
      unit="kg"
      blankText="Trống"
      state="fade"
      offAt={off}
      dials={{labels: ["La bàn", "Chân trời", "Tốc độ", "Độ cao"], values: [0.3, 0.55, 0.7, 0.45], from: dialsAt}}
      accent={P.orange}
      top={TOP + 20}
    />
  </AbsoluteFill>
);

/** s02 pair (believed vs actual), s14 single draining tank. */
export const TankGaugeBox: React.FC<{from: number; mode: "two" | "drain"; top?: number}> = ({from, mode, top = TOP + 20}) =>
  mode === "two" ? (
    <TankGaugePair
      top={top}
      a={{label: "Phi công tưởng có", value: "22.300 kg", level0: 0, level1: 1, from, fillFrames: 22, color: P.blue, tankHeight: 300}}
      b={{label: "Thực có", value: "≈ 10.100 kg", level0: 0, level1: 0.45, from: from + 12, fillFrames: 22, color: P.orange, estimate: "Ước tính", tankHeight: 300}}
    />
  ) : (
    <TankGauge label="Nhiên liệu trong bình" value="" level0={0.45} level1={0} from={from} fillFrames={70} color={P.orange} left={553} top={top} width={374} tankHeight={300} />
  );

const Panel: React.FC<{left?: number; top: number; width?: number; h: number; border: string; children: React.ReactNode; style?: React.CSSProperties}> = ({left = 153, top, width = PANEL_MAX_W, h, border, children, style}) => (
  <div style={{position: "absolute", left, top, width, height: h, boxSizing: "border-box", borderRadius: 18, border: `3px solid ${border}`, background: "rgba(9,14,20,0.88)", padding: "20px 28px", fontFamily: FONT.sans, color: "#fff", ...style}}>{children}</div>
);

const SmallCaps: React.FC<{children: React.ReactNode; color?: string}> = ({children, color = "rgba(255,255,255,0.7)"}) => (
  <div style={{fontFamily: FONT.mono, fontSize: 30, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color}}>{children}</div>
);

/** The three options of the closing question, appearing as they are named. */
export const OptionChips: React.FC<{at: [number, number, number]; labels: [string, string, string]}> = ({at, labels}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${P.sky} 0%, #0F161E 100%)`}}>
      {labels.map((label, i) => {
        const p = interpolate(frame, [at[i], at[i] + 10], [0, 1], clamp);
        return (
          <Panel key={label} top={TOP + 40 + i * 190} h={150} border={P.orange} style={{opacity: p, transform: `scale(${0.94 + 0.06 * p})`, display: "flex", alignItems: "center", padding: "0 36px", gap: 24}}>
            <span style={{fontFamily: FONT.mono, fontSize: 40, fontWeight: 700, color: P.orange}}>{String(i + 1).padStart(2, "0")}</span>
            <span style={{fontSize: 56, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase"}}>{label}</span>
          </Panel>
        );
      })}
    </AbsoluteFill>
  );
};
