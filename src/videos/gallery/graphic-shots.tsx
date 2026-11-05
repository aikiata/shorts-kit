import React from "react";
import {AbsoluteFill} from "remotion";
import {SlotWord} from "../../shared/caption/SlotWord";
import {StrikeReplace} from "../../shared/caption/StrikeReplace";
import {Typewriter} from "../../shared/caption/Typewriter";
import {WordSlam} from "../../shared/caption/WordSlam";
import {CompareBars, Odometer, ProgressRing, UnitGrid} from "../../shared/chart";
import {Grain} from "../../shared/fx/Grain";
import {Vignette} from "../../shared/fx/Vignette";
import {ArrowMark, CircleMark, CrossOut, Stamp, Underline} from "../../shared/marks";
import {DEFAULT_PALETTE as P, FONT} from "../../shared/theme";

/**
 * Text, mark and chart shots for the gallery. Every value here is a
 * placeholder to show the component, not a fact.
 */
const Stage: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, ${P.surface}, ${P.bg} 70%)`}}>
    {children}
    <Vignette />
    <Grain opacity={0.14} />
  </AbsoluteFill>
);

/** A stand-in subject for the marks: a line of "document" text. */
const Doc: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 153,
      top: 700,
      width: 774,
      padding: "48px 40px",
      boxSizing: "border-box",
      background: "#EDE6D6",
      color: "#2A2620",
      fontFamily: "Georgia, serif",
      fontSize: 50,
      lineHeight: 1.5,
      borderRadius: 8,
      boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    }}
  >
    The treaty was signed in <b>1648</b> after thirty years of war.
  </div>
);

const Strike: React.FC = () => (
  <Stage>
    <StrikeReplace from="Myth" to="Record" palette={P} at={12} kicker="placeholder" top={760} />
  </Stage>
);
const Slot: React.FC = () => (
  <Stage>
    <SlotWord words={["1802", "1776", "1848", "1903", "1815"]} lead="Built in" palette={P} at={10} frames={40} top={760} />
  </Stage>
);
const Slam: React.FC = () => (
  <Stage>
    <WordSlam word="ZERO" palette={P} at={14} top={800} />
  </Stage>
);
const Type: React.FC = () => (
  <Stage>
    <Typewriter text="Placeholder quote, typed at the pace of the voice." source="Source, year" palette={P} at={6} cps={24} top={720} />
  </Stage>
);
const Marks: React.FC = () => (
  <Stage>
    <Doc />
    <CircleMark x={800} y={788} rx={92} ry={50} color={P.bad} at={10} />
    <ArrowMark from={[420, 1220]} to={[745, 822]} label="the year" color={P.warn} at={30} />
    <Underline x={195} y={900} w={530} color={P.accent} at={50} />
  </Stage>
);
const Verdict: React.FC = () => (
  <Stage>
    <Doc />
    <CrossOut x={170} y={715} w={740} h={215} color={P.bad} at={10} />
    <Stamp text="Myth" x={540} y={1180} color={P.bad} at={40} />
  </Stage>
);
const Bars: React.FC = () => (
  <Stage>
    <CompareBars
      palette={P}
      at={8}
      unit=" km"
      focus={2}
      bars={[
        {label: "Placeholder A", value: 120},
        {label: "Placeholder B", value: 310},
        {label: "Placeholder C", value: 940},
      ]}
      top={640}
    />
  </Stage>
);
const Ring: React.FC = () => (
  <Stage>
    <ProgressRing value={71} palette={P} at={8} label="placeholder share" top={620} />
  </Stage>
);
const Grid: React.FC = () => (
  <Stage>
    <UnitGrid total={40} count={5} palette={P} at={4} label="1 in 8 (placeholder)" top={560} />
  </Stage>
);
const Years: React.FC = () => (
  <Stage>
    <Odometer from={1912} to={1985} palette={P} at={10} frames={50} label="73 years later" top={760} />
  </Stage>
);

export const GRAPHIC_SHOTS: {Component: React.FC; label: string; note: string; frames?: number}[] = [
  {Component: Strike, label: "shared/caption/StrikeReplace", note: "the belief struck, the fact replaces it"},
  {Component: Slot, label: "shared/caption/SlotWord", note: "a reel of decoys lands on the answer"},
  {Component: Slam, label: "shared/caption/WordSlam", note: "one word hits: the punch, with boom"},
  {Component: Type, label: "shared/caption/Typewriter", note: "real words, typed; source is required", frames: 120},
  {Component: Marks, label: "shared/marks: CircleMark, ArrowMark, Underline", note: "drawn ONTO the subject", frames: 100},
  {Component: Verdict, label: "shared/marks: CrossOut, Stamp", note: "a verdict a record supports"},
  {Component: Bars, label: "shared/chart/CompareBars", note: "true to scale, from zero", frames: 100},
  {Component: Ring, label: "shared/chart/ProgressRing", note: "one share of one whole"},
  {Component: Grid, label: "shared/chart/UnitGrid", note: "a ratio as counted units"},
  {Component: Years, label: "shared/chart/Odometer", note: "digits roll from year to year"},
];
