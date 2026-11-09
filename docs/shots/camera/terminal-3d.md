# terminal-3d

**Job:** three terminal windows scattered in 3D space; the camera flies window to window,
swelling outward in the middle of each flight; at each window a command is typed and its
result prints line by line. A command sequence told as a spatial journey.
**Length:** about 8.2 s (246 frames): three stops of 2-3 s plus two 30-frame flights.
**Energy:** medium, steady and technical, ending on one bright "READY".
**Use for:** a developer product's CLI or workflow: "three commands" as three stops.

## Intent
Terminal output is scrolling flat text, the opposite of cinema. Give each command a solid
window in space and let the camera visit them like rooms in a machine hall. The pull-out
mid-flight shows "there are more windows": the shape of the whole workflow.

## Parameters
| Part | Typical | Feel |
|---|---|---|
| Camera | the **inverse** of the window poses: `translateZ(-pull) rotateX(tilt) rotateY(view - ry) translate3d(-x, -y, -z)`; write a table of window poses and the camera path follows; 8-10° of side view at each stop | 0° degrades to a flat screenshot; above 18° the monospace is squashed and unreadable |
| Windows | real screen size (1180×620), command 52 px, output 38 px monospace, rasterised 1:1 when the camera settles, no outer scaling | text must stay sharp |
| Poses | x spacing about 1500 px, z from -220 to +260, ry ±14-28° | all facing front degrades to a flat carousel |
| Flight | 30 frames each, swift asymmetric in-out, plus a `sin(π·u^0.85) × 1250 px` pull-out bump peaking at about 0.6 scale with all three windows in frame; directional blur by screen speed during flights only | without the bump a flight is a pan, not take-off and landing; under 800 px only two windows show |
| Stay | 60-90 frames, long enough for typing (about 20), output (about 20) and at least 14 frames to read | |
| Depth of field | each window: blur 0-3 px, brightness 0.62-1, opacity 0.72-1 by distance from the current stop; shallower focus loss while pulled out | too much blur makes the flight a smear |
| Anchors | a perspective grid floor drawn with the same projection as the world; a back-light behind the focus window and an accent reflection under it; a big outlined step number behind each window for parallax | |
| Typing | per character 0.75-1.65 frames (deterministic jitter, +0.6 on spaces); block cursor hugging the last character (steady while typing, blinking on an 8-frame half period when idle); a 2-frame beat before enter; output printed fast (6 frames per line, 10 px slide, lines 4 frames apart); a status spinner for about 6 frames, then a tick | uniform speed reads as a machine replay; over 2.5 frames per character the viewer gets impatient |
| Timing | typing starts only after arrival (e.g. frames 8, 94, 184): no typing during flight | |

## Known traps
- The window transform, the world transform and the floor/back-light projection must be the
  same maths; change poses in the table only, and if you change the camera chain, change
  all three at once, or the floor slides under the windows.
- Keep commands short and output to 3-5 lines. The final READY line pops at about frame
  220 and needs at least 24 frames of hold. One bloom per film: give it to that line.
- The full-screen speed-blur filter is on only while speed is above 0.
- A 9:16 frame cannot hold windows 1500 px apart: re-lay out the poses (windows stacked
  vertically with a vertical flight) and re-check the readable size on a still.

## Reference implementation

The source demo this card was rewritten from (shorts-kit, kept as reference, not built):

- [`terminal-3d/Terminal3D.tsx`](../../../src/demo/camera/terminal-3d/Terminal3D.tsx)
