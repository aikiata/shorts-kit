import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {Label} from "./Label";
import {BirdsClouds, CameraPush, CampDusk, DaySea, DuskSun, FigureGait, FigureRest, FishSchool, GrainVignette, NightMoon, PersonPoses, Prairie, SHOT_FRAMES, StormRain} from "./shots";

/** Each entry: the shot, the import path it demonstrates, and a one-line note. */
export const SHOTS: {Shot: React.FC; path: string; note: string}[] = [
  {Shot: DaySea, path: "shared/nature: Sky, Clouds, Sea", note: 'sky="day" with Sun and glitter'},
  {Shot: DuskSun, path: "shared/nature: Sun, SUNS.dusk", note: "the sun sinks behind the horizon"},
  {Shot: NightMoon, path: "shared/nature: Moon, Stars", note: 'sky="night", moon glitter'},
  {Shot: StormRain, path: "shared/nature: Rain", note: 'sky="storm" + Camera shake'},
  {Shot: BirdsClouds, path: "shared/nature: Birds, Clouds", note: 'sky="harsh", clouds count / speed'},
  {Shot: PersonPoses, path: "shared/figures/Person", note: "poses, LOOKS, grade={GRADES.dawn}"},
  {Shot: FishSchool, path: "shared/figures/Fish", note: "horizon={700}: under the water line"},
  {Shot: CameraPush, path: "shared/motion/Camera", note: "push-in on BigMoon + silhouette()"},
  {Shot: GrainVignette, path: "shared/fx: Grain, Vignette", note: "off, then on from 1 s"},
  {Shot: Prairie, path: "shared/nature: Land, TallGrass + shared/props", note: 'sky="harsh", Oak, Tent, Flag, Campfire, DayClock'},
  {Shot: FigureGait, path: "shared/figures/Figure: gait", note: "walk, run, slump, crouch; speed plants the feet"},
  {Shot: FigureRest, path: "shared/figures/Figure: rest", note: 'seat="crate|log|stool", ground, kneel, lie'},
  {Shot: CampDusk, path: "shared/props: Wagon, Cannon, Bridge", note: 'sky="dusk" marsh, grade={GRADES.dusk} rim'},
];

export const GALLERY_FRAMES = SHOTS.length * SHOT_FRAMES;

/** Browse every reusable illustrated component, ~3 s each: `bun run dev gallery`. */
export const Gallery: React.FC = () => (
  <AbsoluteFill style={{background: "#000"}}>
    {SHOTS.map(({Shot, path, note}, i) => (
      <Sequence key={path} from={i * SHOT_FRAMES} durationInFrames={SHOT_FRAMES}>
        <Shot />
        <Label path={path} note={note} n={i + 1} of={SHOTS.length} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
