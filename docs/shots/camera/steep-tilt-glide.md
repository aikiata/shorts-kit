# steep-tilt-glide

**Job:** stand the page up as a slanted wall seen from a **fixed** camera at a steep
perspective (about 60°, near edge right, far edge left). The page itself slides along its
own plane, like train carriages passing; the slide leaves speed ghosts, text lands from the
air, and the scene is revealed from dark to light.
**Length:** 4 s (120 frames) per shot; a wider page can run longer. **Energy:** medium-high
but even.
**Use for:** a long or many-section page; dark scene with neon.

## Intent
The thing that makes it work is **"the object moves, the camera does not"**: perspective,
origin and rotation are constants for the whole shot; the only variable is the page's local
translateX. If the camera moves, the meaning turns into a camera stunt; here the page is
showing itself off.

## Parameters
| Part | Typical | Feel |
|---|---|---|
| Camera constants | perspective 1100, origin 30% 58%, rotateY(-60°) plus rotateZ(-2°), transform origin left top; never change | the angle converged over three rounds: -45° "wrong", -53° "a bit more", -60° chosen; past -70° the content cannot be read |
| Page | very wide panel (about 6200×2400 in content units), sliding along local X from +60 to -4100 on bezier (0.3, 0.12, 0.72, 0.9): soft start, then nearly even, tail slope **not** zero | stopping dead midway was rejected; all-linear lacks the start breath; at least 3 screens of content or it ends in 2 s |
| Ghosts | trailing layers at past times (f-1.6, -3.2, -4.8) re-projected, opacity proportional to slide speed | constant ghosts read as a double-image glitch |
| Landing text | elements float 230-280 px with a same-shape shadow and land staggered along the slide (see `graze-face-tour`) | |
| Reveal | start dimmed to 0.7, brought to full in about 1.4 s; the left edge gets a gradient shadow that leaves with it | |

A camera that slides sideways instead of a page that slides was rejected: "the camera is
fixed, the page moves along its own 3D plane".

## Reference implementation

The source demo this card was rewritten from (shorts-kit, kept as reference, not built):

- [`steep-tilt-glide/SteepTiltGlide.tsx`](../../../src/demo/camera/steep-tilt-glide/SteepTiltGlide.tsx)
