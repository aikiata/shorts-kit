import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {DayClock} from "../../shared/caption/DayClock";
import {Figure, FIGURE_LOOKS, FRONTIER} from "../../shared/figures/Figure";
import {Fish} from "../../shared/figures/Fish";
import {LOOKS, Person} from "../../shared/figures/Person";
import {Grain} from "../../shared/fx/Grain";
import {Vignette} from "../../shared/fx/Vignette";
import {Camera} from "../../shared/motion/Camera";
import {clamp} from "../../shared/motion/anim";
import {BigMoon, Birds, Clouds, GRADES, Land, Moon, Rain, Sea, Sky, Stars, Sun, SUNS, silhouette, TallGrass} from "../../shared/nature";
import {Adobe, Breastwork, Bridge, Bush, Campfire, Cannon, Flag, Oak, Shade, Smoke, Tent, Wagon, Zzz} from "../../shared/props";
import {rnd} from "../../shared/random";
import {DEFAULT_PALETTE, FONT, H, W} from "../../shared/theme";

/** Each gallery shot is a plain component that reads its own (sequence-relative) frame. */
export const SHOT_FRAMES = 90;

const progress = (frame: number) => frame / SHOT_FRAMES;

export const DaySea: React.FC = () => (
  <AbsoluteFill>
    <Sky sky="day" />
    <Sun {...SUNS.day} />
    <Clouds sky="day" />
    <Sea sky="day" />
  </AbsoluteFill>
);

export const DuskSun: React.FC = () => {
  const frame = useCurrentFrame();
  // The sun sinks onto the horizon over the shot (it is clipped there).
  const y = interpolate(frame, [0, SHOT_FRAMES], [800, 900], clamp);
  return (
    <AbsoluteFill>
      <Sky sky="dusk" />
      <Stars on={0.35} />
      <Sun {...SUNS.dusk} y={y} />
      <Clouds sky="dusk" />
      <Sea sky="dusk" />
    </AbsoluteFill>
  );
};

export const NightMoon: React.FC = () => (
  <AbsoluteFill>
    <Sky sky="night" />
    <Stars />
    <Moon />
    <Clouds sky="night" />
    <Sea sky="night" />
  </AbsoluteFill>
);

export const StormRain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Camera move={{z: [1.04, 1.08], shake: 8}} t={progress(frame)}>
      <Sky sky="storm" />
      <Clouds sky="storm" />
      <Sea sky="storm" />
      <Rain heavy />
    </Camera>
  );
};

export const BirdsClouds: React.FC = () => (
  <AbsoluteFill>
    <Sky sky="harsh" />
    <Sun {...SUNS.harsh} />
    <Clouds sky="day" count={7} speed={3} />
    <Birds count={12} />
    <Sea sky="harsh" />
  </AbsoluteFill>
);

/** A wooden dock to stand the figures on; its top is y = DOCK. */
const DOCK = 1180;
const DOCK_END = 700;

export const PersonPoses: React.FC = () => {
  const s = 1.35;
  const poses = [
    {x: 100, pose: "stand", arms: "wave", look: LOOKS.sailor, name: "stand, wave"},
    {x: 230, pose: "sit", arms: "down", look: LOOKS.mate, name: "sit"},
    {x: 430, pose: "lie", arms: "down", look: LOOKS.walker, name: "lie"},
    {x: 650, pose: "lean", arms: "down", look: LOOKS.sailor, name: "lean"},
  ] as const;
  return (
    <AbsoluteFill>
      <Sky sky="dawn" />
      <Sun {...SUNS.dawn} />
      <Clouds sky="dawn" />
      <Sea sky="dawn" />
      <svg width={W} height={H} style={{position: "absolute"}}>
        {[40, 230, 420, 610].map((px) => (
          <rect key={px} x={px} y={DOCK} width={22} height={260} fill="#2A1E17" />
        ))}
        <rect x={0} y={DOCK} width={DOCK_END} height={36} fill="#5A4030" />
        <rect x={0} y={DOCK} width={DOCK_END} height={6} fill="#8A6A50" />
        {poses.map((p) => (
          <Person key={p.name} x={p.x} y={DOCK} scale={s} pose={p.pose} arms={p.arms} look={p.look} grade={GRADES.dawn} />
        ))}
      </svg>
      {poses.map((p) => (
        <div
          key={p.name}
          style={{position: "absolute", top: DOCK + 300, left: p.x - 75, width: 150, fontSize: 22, textAlign: "center", fontFamily: FONT.mono, color: "#fff", textShadow: "0 2px 8px #000"}}
        >
          {p.name}
        </div>
      ))}
    </AbsoluteFill>
  );
};

/** Water line high in the frame so most of it is under water: shows `horizon` as a prop. */
const SURFACE = 700;

export const FishSchool: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Sky sky="day" horizon={SURFACE} />
      <Clouds sky="day" horizon={SURFACE} />
      <Sea sky="day" horizon={SURFACE} />
      {/* darker, bluer water below the surface band reads as "under water" */}
      <div style={{position: "absolute", left: 0, right: 0, top: SURFACE + 120, bottom: 0, background: "linear-gradient(to bottom, rgba(8,45,68,0) 0%, rgba(8,45,68,0.55) 25%, rgba(3,20,32,0.85) 100%)"}} />
      <svg width={W} height={H} style={{position: "absolute"}}>
        {Array.from({length: 14}, (_, i) => {
          const dir = i % 3 === 0 ? -1 : 1;
          const speed = 2 + rnd(i + 5) * 3;
          const span = W + 200;
          const travel = (rnd(i) * span + frame * speed) % span;
          const x = dir > 0 ? travel - 100 : W + 100 - travel;
          const y = 1000 + rnd(i + 20) * 600 + Math.sin(frame / 12 + i) * 10;
          return <Fish key={i} x={x} y={y} dir={dir} scale={1.2 + rnd(i + 30) * 1.4} fill={i % 4 ? "#9FB7C2" : "#E0B25A"} opacity={0.9} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** Push-in on a silhouette against the big moon: the camera's zoom is clamped ≥ 1. */
export const CameraPush: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Camera move={{z: [1, 1.6], at: [540, 900], to: [540, 860]}} t={progress(frame)}>
      <Sky sky="night" />
      <Stars />
      <BigMoon />
      <Sea sky="night" glitter={{x: 540}} />
      <svg width={W} height={H} style={{position: "absolute"}}>
        <Person x={540} y={905} scale={1.4} pose="stand" look={LOOKS.sailor} grade={silhouette("#DCE8FF")} />
      </svg>
    </Camera>
  );
};

/** Grain and vignette fade in halfway, so the before / after is visible in one shot. */
export const GrainVignette: React.FC = () => {
  const frame = useCurrentFrame();
  const on = interpolate(frame, [30, 45], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Sky sky="grey" />
      <Clouds sky="grey" />
      <Sea sky="grey" />
      <AbsoluteFill style={{opacity: on}}>
        <Grain opacity={0.3} />
        <Vignette strength={0.6} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Land scenes: shared/nature Land + TallGrass, shared/figures/Figure, shared/props, DayClock.
// ---------------------------------------------------------------------------

/** Open land at noon: tree, tents, fire and flag, tall grass in front, the time-of-day clock. */
export const Prairie: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Land sky="harsh" />
      <Sun {...SUNS.harsh} />
      <Clouds sky="harsh" />
      <svg width={W} height={H} style={{position: "absolute"}}>
        <Tent x={150} y={930} s={0.6} />
        <Tent x={290} y={945} s={0.7} />
        <Breastwork x={300} y={975} w={520} />
        <Flag x={220} y={950} s={0.55} bands={["#1F7A45", "#F4F1E8", "#C8363A"]} emblem="#8A6A2E" />
        <Campfire x={420} y={1040} s={0.7} />
        <Shade x={560} y={1205} s={1.2} />
        <Oak x={680} y={1205} s={1.05} />
        <Figure x={470} y={1219} s={1.45} pose="lie" look={FIGURE_LOOKS.general} hatOff />
        <Zzz x={360} y={1150} />
      </svg>
      <TallGrass sky="harsh" top={1260} count={120} dark={0.15} />
      <DayClock hour={12.25 + (frame / SHOT_FRAMES) * 0.4} date="21/04/1836" palette={DEFAULT_PALETTE} top={430} />
    </AbsoluteFill>
  );
};

/** The four gaits, each moving at the `speed` it is given, so planted feet stay put. */
export const FigureGait: React.FC = () => {
  const frame = useCurrentFrame();
  const lanes = [
    {y: 1000, pose: "slump", speed: 1.4, look: FIGURE_LOOKS.soldierTired, rifle: false},
    {y: 1130, pose: "walk", speed: 2.6, look: FIGURE_LOOKS.settler1, rifle: false},
    {y: 1260, pose: "crouch", speed: 1.6, look: FIGURE_LOOKS.frontier2, rifle: false},
    {y: 1400, pose: "run", speed: 6, look: FIGURE_LOOKS.frontier1, rifle: true},
  ] as const;
  return (
    <AbsoluteFill>
      <Land sky="day" />
      <Clouds sky="day" />
      <svg width={W} height={H} style={{position: "absolute"}}>
        {lanes.map((l, i) => (
          <Figure key={l.pose} x={((120 + i * 60 + frame * l.speed) % (W + 200)) - 60} y={l.y} s={1.1} pose={l.pose} speed={l.speed} phase={i} look={l.look} rifle={l.rifle} />
        ))}
      </svg>
      {lanes.map((l) => (
        <div key={l.pose} style={{position: "absolute", left: 600, top: l.y - 60, fontSize: 24, fontFamily: FONT.mono, color: "#fff", textShadow: "0 2px 8px #000"}}>
          {`pose="${l.pose}" speed={${l.speed}}`}
        </div>
      ))}
    </AbsoluteFill>
  );
};

/** Resting poses: every seated figure sits ON something, or on the ground. */
export const FigureRest: React.FC = () => {
  const row1 = [
    {x: 150, pose: "stand", seat: undefined, name: "stand"},
    {x: 400, pose: "sit", seat: "crate", name: "sit crate"},
    {x: 650, pose: "sit", seat: "log", name: "sit log"},
    {x: 900, pose: "sit", seat: "stool", name: "sit stool"},
  ] as const;
  const row2 = [
    {x: 180, pose: "ground", name: "ground"},
    {x: 470, pose: "kneel", name: "kneel"},
    {x: 790, pose: "lie", name: "lie + Zzz"},
  ] as const;
  return (
    <AbsoluteFill>
      <Land sky="dawn" />
      <Sun {...SUNS.dawn} />
      <Clouds sky="dawn" />
      <svg width={W} height={H} style={{position: "absolute"}}>
        {row1.map((p, i) => (
          <Figure key={p.name} x={p.x} y={1080} s={1.2} pose={p.pose} seat={p.seat} look={FRONTIER[i % 3]} grade={GRADES.dawn} />
        ))}
        {row2.map((p) => (
          <Figure key={p.name} x={p.x} y={1330} s={1.2} pose={p.pose} look={FIGURE_LOOKS.soldier} grade={GRADES.dawn} hatOff={p.pose === "lie"} />
        ))}
        <Zzz x={700} y={1270} />
      </svg>
      {[...row1.map((p) => ({...p, y: 1100})), ...row2.map((p) => ({...p, y: 1350}))].map((p) => (
        <div key={p.name} style={{position: "absolute", top: p.y, left: p.x - 90, width: 180, fontSize: 22, textAlign: "center", fontFamily: FONT.mono, color: "#fff", textShadow: "0 2px 8px #000"}}>
          {p.name}
        </div>
      ))}
    </AbsoluteFill>
  );
};

/** Props at dusk: wagon, gun firing, adobe, a burning bridge; figures graded with a rim. */
export const CampDusk: React.FC = () => {
  const frame = useCurrentFrame();
  const fire = interpolate(frame % 45, [0, 3, 18], [0, 1, 0], clamp);
  return (
    <AbsoluteFill>
      <Land sky="dusk" marsh />
      <Sun {...SUNS.dusk} />
      <Clouds sky="dusk" />
      <svg width={W} height={H} style={{position: "absolute"}}>
        <Adobe x={880} y={985} s={0.5} />
        <Wagon x={((frame * 2.2 + 450) % (W + 500)) - 250} y={1060} s={0.6} />
        <Bridge x={540} y={1220} burn={interpolate(frame, [0, SHOT_FRAMES], [0.3, 1], clamp)} />
        <Cannon x={820} y={1440} s={-0.9} fire={fire} />
        <Bush x={140} y={1460} s={1.1} />
        <Figure x={330} y={1450} s={1.2} pose="stand" look={FIGURE_LOOKS.frontier3} rifle grade={GRADES.dusk} />
      </svg>
      <Smoke x={760} y={1380} n={8} scale={1.6} speed={0.5} />
    </AbsoluteFill>
  );
};
