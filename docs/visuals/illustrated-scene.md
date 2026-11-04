# Illustrated scene (§5g): `illustrated-scene`

**Use when** a story has no usable photos or footage but needs "a person, a place, time passing": drifting, stranded, walking, waiting, sleeping. Build the world from simple illustrated layers (sky + sea or land + a figure) using the shared pieces (`src/shared/nature/` Sea, Sky, Land, TallGrass, Stars, Moon, Sun, Clouds, Rain, Birds; `src/shared/figures/` Person (on a boat), Figure (on land: walks, runs, sits, sleeps), Fish; `src/shared/props/` Oak, Bush, Tent, Breastwork, Campfire, Smoke, Flag, Wagon, Cannon, Adobe, Bridge, Zzz, Letter; `src/shared/motion/Camera`; `src/shared/fx/` Grain, Vignette; BigCount, Chip, DayClock). Browse them with `bun run dev gallery`.

## Rules

1. **One main image, held for the whole video.** One boat, one camp, one tree.
   Information is added **onto the same image** (a prop appears, a counter fills, a
   second figure fades), not by cutting to new worlds.
2. **Atmosphere carries time.** Day → dusk → night → storm → calm says time passed
   without a single date. Changes on the figure count too (shells growing on a hull, a
   companion fading out).
3. **Move the camera within the world, do not cut to another world.** Vary framing
   instead: side view, a cut through the water line, a silhouette against a big moon, a
   top-down pull-up. Many shots of one boat stay alive this way.
4. **Count time with the object the character used** (moons, notches), in a corner
   under the watermark, filling as the story moves (`BigCount` for short counts).
5. **One scene configuration per sentence**: a row per shot declaring sky, counter
   range, props, view and camera; components read the config instead of being written
   per shot. A new prop is one flag and one small component taking `t` (0–1 in the shot).
6. **Tint the figures to the sky** (a colour matrix per sky type) and give them a light
   **rim** toward the light source, or they sink into night and dusk backgrounds.
7. **Seeded randomness only**, so every re-render is identical.
8. **A big reveal is one continuous move** (the scene shrinks into a point while the map
   pulls out), never a cut. See flows P and R.
9. **Keep it consistent with tone.** Drawn worlds suit survival, history and fables;
   they jar beside real footage of real victims. One material per video (`b-roll` rule 10).
10. **"Modelled after" is said.** A drawn path that follows a published model is labelled
    as such, on frame and in the caption.
11. **Figures that move have a gait, not a swing.** `Figure` plants each foot for its
    stance phase and solves the knees by IK; give every moving figure the `speed` its
    `x` actually changes by per frame, or the feet slide. Check a walk on 12 to 16
    consecutive frames cut side by side, never on a single still.
12. **Somebody sitting sits on something.** `pose="sit"` draws a `seat` (crate, log,
    stool); on the ground use `pose="ground"`. A floating sitter is the first thing a
    viewer notices.
13. **Count a single day with a clock** (`DayClock` under the watermark), the way moons
    count a long drift.

## Traps

- Figures disappearing at night (no rim).
- A boat that looks pasted on the sea: needs a water line over the hull and foam.
- Zooming below 1 and showing the edge of the world.
- Text blocks over the caption band during the pull-out: keep them above ~y 1300.
- Legs rotated around the hip with a sine: feet float above the ground and slide.
- A hip lowered once for the longest stride: the whole column walks with bent knees.
- A torso drawn as one trapezoid reads as a plank; arms from the top of it have no shoulder.
- Sparse tall grass (120 blades) does not hide crouching figures; about 600 from y 1000 does.

## Change log

| Date | Change | Because of which video |
| --- | --- | --- |
| 2026-11-05 | Land kit: `Land`, `TallGrass`, `GROUNDS`; `Figure` with IK gait, seats and ready looks; `shared/props/`; `DayClock`; rules 11-13 | San Jacinto (a battle on open land, told over one day) |
