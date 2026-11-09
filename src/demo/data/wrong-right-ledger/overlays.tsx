/**
 * 2D shots of gimli-glider (storyboard v2): the fuel ledger (s07, s09: one ledger
 * split by two 3D interludes), the cockpit going dark (s15), claim cards (s23),
 * the closing 1,77 cell (s24) and the closing question (s25). Timing comes from
 * word anchors in voice.json via frameAtWord; every frame number below is relative
 * to the Sequence that holds the component. The ledger keeps ONE clock: rows are
 * placed by their absolute word time minus the segment start, so a segment that
 * starts late shows the earlier rows already in place.
 */
import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {ClaimCard} from "../../shared/diagram/ClaimCard";
import {HUD_H, HUD_TOP} from "../../shared/frame/ChapterHud";
import {TAG_TOP} from "../../shared/frame/RecreationTag";
import {FuelLedger, type LedgerRow} from "../../shared/ledger/FuelLedger";
import {FONT} from "../../shared/theme";
import {LOWPOLY as P} from "../../shared/three/palette";
import {GaugesFade, GOOD, BAD} from "./placeholders";
import {shot} from "./shots";
import {DURATION, frameAtWord as F} from "./timing";

const TOP = HUD_TOP + HUD_H + 70;
const bg = `linear-gradient(180deg, ${P.sky} 0%, #0F161E 100%)`;
const clampX = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

/** A slowly drifting grid behind a 2D shot, so there is always something moving. `phase` = absolute frame. */
const Grid: React.FC<{phase: number}> = ({phase}) => (
  <AbsoluteFill
    style={{
      backgroundImage: "linear-gradient(rgba(255,255,255,0.045) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.045) 2px, transparent 2px)",
      backgroundSize: "90px 90px",
      backgroundPosition: `${phase * 0.25}px ${phase * 0.4}px`,
    }}
  />
);

/**
 * s07 / s09: one ledger, rows appear as the voice names them. Segment "A" starts at
 * line 5, segment "B" at line 9 (after the fuel-truck shot, which said 1,77 aloud).
 * Numbers: facts g.dipstick, g.litres, g.required, g.factor, g.miscalc, g.correct.
 */
export const Ledger: React.FC<{seg: "A" | "B"}> = ({seg}) => {
  const frame = useCurrentFrame();
  const t0 = shot(seg === "A" ? "s07" : "s09").start;
  const r = (line: number, w: string, nth = 0) => F(line, w, nth) - t0;
  const chip = interpolate(frame, [r(7, "Kế"), r(7, "Kế") + 10], [0, 1], clampX);
  const rows: LedgerRow[] = [
    {at: 4, label: "Que đo ra lít", wrong: {expr: "62 + 64 cm, tra bảng", value: "7.682", unit: "lít"}, right: {expr: "62 + 64 cm, tra bảng", value: "7.682", unit: "lít"}},
    // Row 2 appears with the question (line 6): the factor is a "?" until the voice says it (line 8).
    // The right-hand cell stays an empty slot until "Hệ số đúng" (Vietnamese: "the right factor", line 10).
    {at: r(6, "Vậy") - 4, flagAt: r(9, "pound"), flag: true, label: "Nhân hệ số",
      wrong: {expr: "hệ số đưa cho phi công", value: "1,77", unit: "lb/lít", revealAt: r(8, "một")},
      right: {expr: "1,77 ÷ 2,2", value: "≈ 0,8", unit: "kg/lít", hidden: frame < r(10, "đúng")}},
    {at: r(11, "Cả") - 4, flagAt: r(12, "pound"), flag: true, label: "Ra khối lượng",
      wrong: {expr: "7.682 × 1,77", value: "13.597", unit: "tưởng kg"}, right: {expr: "7.682 × 1,77 ÷ 2,2", value: "6.180", unit: "kg"}},
  ];
  return (
    <AbsoluteFill style={{background: bg}}>
      <Grid phase={t0 + frame} />
      <div style={{position: "absolute", right: 153, top: TAG_TOP, height: 36, padding: "0 14px", display: "flex", alignItems: "center", borderRadius: 8, background: "rgba(9,14,20,0.8)", border: "1px solid rgba(255,255,255,0.14)", fontFamily: FONT.mono, fontSize: 22, fontWeight: 700, letterSpacing: 3, color: "#fff", opacity: chip}}>
        KẾ HOẠCH BAY · 22.300 KG
      </div>
      <FuelLedger wrongTitle="Tính sai" rightTitle="Tính đúng" rows={rows} from={0} bad={BAD} good={GOOD} left={153} width={774} rowH={200} />
    </AbsoluteFill>
  );
};

/** s15: three displays go dark one by one, then the four dials stay lit. */
export const CockpitDark: React.FC = () => {
  const t0 = shot("s15").start;
  const r = (w: string) => F(19, w) - t0;
  return <GaugesFade off={[r("điện"), r("hình"), r("đen")]} dialsAt={r("đồng")} />;
};

/** s23: what people remember, struck by what the report says. */
export const Claims: React.FC = () => {
  const t0 = shot("s23").start;
  const r = (line: number, w: string) => F(line, w) - t0;
  return (
    <AbsoluteFill style={{background: bg}}>
      <Grid phase={t0 + useCurrentFrame()} />
      <ClaimCard
        cards={[{kicker: "Người ta nhớ", text: "Nhầm pound với ký"}, {kicker: "Báo cáo điều tra", text: "Đơn giản hoá"}]}
        from={4}
        secondAt={r(31, "Nhưng")}
        strikeAt={r(31, "đơn")}
        bad={BAD}
        good={GOOD}
        top={TOP + 20}
      />
    </AbsoluteFill>
  );
};

/** The 1,77 cell, big. `tone` 0 = red (blamed), 1 = neutral (the number was right). */
const BigCell: React.FC<{tone: number; scale?: number; opacity?: number}> = ({tone, scale = 1, opacity = 1}) => {
  const col = tone > 0.5 ? "#FFFFFF" : BAD;
  const border = tone > 0.5 ? "rgba(255,255,255,0.4)" : BAD;
  return (
    <div style={{width: 774, boxSizing: "border-box", padding: "26px 34px", borderRadius: 18, background: "rgba(9,14,20,0.92)", border: `3px solid ${border}`, opacity, transform: `scale(${scale})`, fontFamily: FONT.sans}}>
      <div style={{fontFamily: FONT.mono, fontSize: 30, fontWeight: 700, letterSpacing: 3, color: "rgba(255,255,255,0.7)"}}>HỆ SỐ ĐƯA CHO PHI CÔNG</div>
      <div style={{display: "flex", alignItems: "baseline", gap: 16, marginTop: 8}}>
        <span style={{fontSize: 150, fontWeight: 800, lineHeight: 1.1, color: col, fontVariantNumeric: "tabular-nums"}}>1,77</span>
        <span style={{fontSize: 40, fontWeight: 600, color: "rgba(255,255,255,0.78)"}}>lb/lít</span>
      </div>
    </div>
  );
};

/** s24: the number turns out right; the real gap is that nobody owned the calculation. */
export const ClosingFactor: React.FC = () => {
  const frame = useCurrentFrame();
  const t0 = shot("s24").start;
  const r = (w: string, nth = 0) => F(32, w, nth) - t0;
  const tone = interpolate(frame, [r("không"), r("không") + 14], [0, 1], clampX);
  const tag = interpolate(frame, [r("sai") - 4, r("sai") + 8], [0, 1], clampX);
  const bar = interpolate(frame, [r("không", 1), r("không", 1) + 12], [0, 1], clampX);
  const pulse = 0.6 + 0.4 * Math.sin(frame / 5);
  const rise = interpolate(frame, [4, 18], [0, 1], clampX);
  return (
    <AbsoluteFill style={{background: bg}}>
      <Grid phase={t0 + frame} />
      <div style={{position: "absolute", left: 153, top: TOP + 20, width: 774}}>
        <BigCell tone={tone} opacity={rise} />
        <div style={{marginTop: 22, height: 70, opacity: tag, display: "flex", alignItems: "center"}}>
          <span style={{padding: "10px 26px", borderRadius: 12, border: `3px solid ${GOOD}`, color: GOOD, fontFamily: FONT.mono, fontSize: 36, fontWeight: 800, letterSpacing: 3}}>LB/LÍT: ĐÚNG</span>
        </div>
        <div style={{marginTop: 34, height: 130, boxSizing: "border-box", padding: "0 34px", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 18, background: "rgba(9,14,20,0.92)", border: `3px solid ${P.orange}`, opacity: bar, transform: `translateY(${(1 - bar) * 16}px)`, fontFamily: FONT.sans}}>
          <span style={{fontSize: 44, fontWeight: 800, letterSpacing: 2, color: "#fff"}}>AI TÍNH NHIÊN LIỆU?</span>
          <span style={{fontSize: 96, fontWeight: 800, color: P.orange, opacity: pulse}}>?</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** s25: a still frame for the closing question: faint 1,77 and a "?", slow scale, then the 3.5 s hold. */
export const ClosingQuestion: React.FC = () => {
  const frame = useCurrentFrame();
  const t0 = shot("s25").start;
  const n = DURATION - t0;
  const k = interpolate(frame, [0, n], [1, 1.04], clampX);
  const fade = interpolate(frame, [0, 14], [0, 1], clampX);
  return (
    <AbsoluteFill style={{background: bg}}>
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center", transform: `scale(${k}) translateY(-90px)`, opacity: fade}}>
        <div style={{fontFamily: FONT.sans, fontWeight: 800, fontSize: 300, lineHeight: 1, color: "rgba(255,255,255,0.18)", fontVariantNumeric: "tabular-nums"}}>1,77</div>
        <div style={{fontFamily: FONT.sans, fontWeight: 800, fontSize: 260, lineHeight: 1, color: P.orange, opacity: 0.75, marginTop: 6}}>?</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
