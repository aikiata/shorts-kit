---
name: two-clock-route
summary: A route grows across the globe by true distance while a big year counter runs at the top; when the traveller is stuck, the line stops, the year keeps running, the tip pulses amber and the pill flips from WALKING to WAITING
use: A journey that took years and stalled often (an expedition, a migration, a long trial); any story where "time passed" and "distance covered" are not the same thing
length: one shot per narration line, 60-180f each; the full device runs a whole video (about 25 shots)
energy: low (slow fly and drift; the only pulse is the waiting tip)
tags: globe, route, map, year counter, journey, waiting, great circle, flight arc, distance
source: makevideo/karl-bushby
---
# two-clock-route

## Intent
The spine of the video is two clocks. The year at the top always runs. The route only moves
when the person really walks. A shot whose route has the same start and end stop is a waiting
shot: the year runs, the line holds still, and the viewer feels the stall without being told.
This is what separates it from the kit's plain `globe` route (`docs/visuals/globe.md`): the
line is driven by kilometres, the clock by years, and the gap between them is the story.

## Motion core
- **Route data is distance-keyed.** Stops are `[lon, lat]` with an optional `leg: "swim"`.
  Each edge is split every `STEP_KM = 120` km and every point stores its cumulative `dist`.
  `pointAt(d)` interpolates the exact point at `d` km; `distTo(name)` gives a stop's distance.
- **Per shot, two ranges:** `route: [fromStop, toStop]` and `year: [a, b]`. Both advance over
  `[0, duration * 0.92]` of the shot (the last 8% holds). Distance uses `Easing.inOut(cubic)`;
  the year is linear, so it never visibly slows.
- **Camera per shot:** fly from the previous shot's view to this one in
  `min(duration * 0.55, 54)` frames with in-out cubic, then drift the scale by
  `1 + 0.03 * local / duration`. No frame stands still.
- **Line style by leg:** consecutive points of one leg form a run. Walk: solid, accent, width 6.
  Swim: `dash "4 18"`, soft accent, width 7. A ghost of the whole route (opacity 0.6, fades in
  over 20f) can preview the journey in the hook and returns at the end.
- **Tip:** an 18 px dot with a double glow. While waiting it turns amber and a 3 px ring pulses
  `1 + 0.5 * |sin(frame / 9)|`.
- **Clock:** label plus a 132 px weight-900 year with `tabular-nums`, `Math.floor(year)`, and a
  pill: WALKING (accent) when the stops differ, WAITING (amber) when the stops are equal and the
  year moves more than 0.3.
- **Flight arc (out, hold, back):** 60 points on the great circle (`slerp`). Within the shot's
  span starting at 0.3: appear over 0.08, fly out 0.08 to 0.36, hold, fly back 0.66 to 0.94.
  The plane dot sits on `round(there * 59)`. The main tip never leaves its stop, so the viewer
  sees the walk is unbroken.
- **Overlays crossfade, the globe does not.** Pins, chips, cards and arcs of the previous and
  current shot crossfade over `XFADE = 12` frames, but the globe, route and tip are drawn once
  from the continuous view.

## Parameters
| Parameter | Typical value | How it feels when changed |
|---|---|---|
| Fly window | `min(duration * 0.55, 54)` f, in-out cubic | Longer than ~60f and the camera is still travelling when the next line starts; under 30f it whips |
| Drift after fly | scale × 1.03 over the shot | 0 makes held frames die; above ~6% the globe visibly zooms and fights the route |
| Progress window | `[0, duration * 0.92]` | 1.0 makes the tip arrive on the cut; below 0.85 the stop sits idle too long |
| Densify step | `STEP_KM = 120` | Larger steps cut corners and clip badly at the horizon; smaller costs points for nothing |
| Walk / swim stroke | width 6 solid / width 7 `4 18` dash | Swim must read as different at a glance; equal dashes read as "planned" |
| Waiting pulse | ring `1 + 0.5·|sin(f/9)|`, amber | Faster than `f/6` reads as an alarm; no pulse and waiting looks like a freeze |
| Waiting rule | stops equal and year delta > 0.3 | Lower thresholds flag every pause as waiting |
| Flight phases | appear 0.08, out 0.08-0.36, back 0.66-0.94 of the span | A short hold hides the point that he waited there for years |
| Chip exit before take-off | `until = duration * 0.34`, 10f fade | Without it the chip covers the departure point when the plane leaves |
| Shot crossfade | 12 f (overlays only) | Crossfading the globe too draws two globes and doubles the route |

## Known traps
- **Unwrap longitude across the date line and keep it unwrapped.** Russia is written as
  `lon - 360`; England, west of Greenwich, must stay `-0.13 - 360`, or the last leg
  interpolates the long way round the 51st parallel. The globe's projection uses trig, so
  -190 and 170 are the same place.
- **A repeated stop** (back to Bukhara after Iran) makes `distTo` ambiguous: it returns the
  first visit. Name only the stops you target and leave repeats unnamed.
- **Waiting is a data fact, not an animation choice.** A shot is "waiting" because its two
  stops are equal; do not fake it by slowing the line.
- **Card photos go on the half of the frame without the destination:** the side is chosen from
  the projected x of the shot's target (`> W/2` puts the card left), with `cardSide` to override.
- **Say what the line is on frame.** The source prints "route approximated from the stops"
  in 18 px: it is not a GPS track.
- **Determinism:** everything is a pure function of `frame` (view, distance, year), so any frame
  renders alone. Do not accumulate distance in state.

## Pairs with
- [`timeline-travel`](../data/timeline-travel.md): the same "time moves" job on a flat axis
- [`gauge-readout-moves`](../data/gauge-readout-moves.md): a readout beside a moving line
- [`shot-transitions`](../transition/shot-transitions.md): when leaving the globe for footage

## Reference implementation
- [`two-clock-route/KarlBushby.tsx`](../../../src/demo/data/two-clock-route/KarlBushby.tsx)
- [`two-clock-route/route.ts`](../../../src/demo/data/two-clock-route/route.ts)
- [`two-clock-route/shots.ts`](../../../src/demo/data/two-clock-route/shots.ts)

The globe, `GlobeLine`, `GlobePin` and `project` it imports exist in this kit as
`src/shared/map/globe.tsx` and `globe-line.tsx`.
