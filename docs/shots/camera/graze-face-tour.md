# graze-face-tour

**Job:** fly low over the surface of a UI as if it were terrain: sidebar tree, top bar and
list rows become the landscape. Text starts floating above the interface with a same-shape
soft shadow, and as the camera passes, it drops onto the page one after another.
**Length:** 4-5 s per leg; legs can be chained. **Energy:** medium-high. Best on a dark
scene with a neon rim light.

## Intent
Shallow depth of field and a steep angle make the screen feel like ground. The point is the
**text landing in the air**: it does not fade in where it is, it hangs above the surface
(raised along the surface normal), casts a shadow, and falls as the camera goes by, the
shadow tightening as it nears. The viewer sees the interface "finish itself" as it is passed.
The shadow is the whole trick: without it, floating reads as an ordinary slide-in.

## Parameters
| Part | Typical | Feel |
|---|---|---|
| Camera | CSS perspective plus a large rotateX/rotateY so the plane is nearly side-on, travelling steadily along one path; distant parts blur more | all-sharp reads as a flat scroll |
| Float height | 120-180 px above the surface | below 80 px neither the shadow nor the move reads; above 250 the landing is too heavy |
| Shadow | blur, offset and opacity all follow the current height (high = big, soft, faint; landed = merged with the object and gone) | a constant shadow is a sticker; a landed object must have none |
| Landing order | ordered along the camera's direction of travel (0.2 → 0.85 normalised) | all at once reads as a switch; random reads as a bug; **stagger means different starts with overlapping falls**: waiting for one to finish before the next begins was rejected |
| Fall curve | accelerating with a soft landing | ease-out looks like a balloon; weight comes from acceleration |
| Between legs | cross-fade the adjacent legs by at least 8 frames | opacity windows that do not overlap give a black flash frame |

## Known traps
- Things floating in the air must be lit about 1.3× brighter or the dark band swallows them
  and the float is imperceptible.
- This card is "grazing camera **plus** landing text" together; half of it is just a camera
  card. Do not use it as a plain camera move.

## Reference implementation

The source demo this card was rewritten from (shorts-kit, kept as reference, not built):

- [`graze-face-tour/GrazeFaceTour.tsx`](../../../src/demo/camera/graze-face-tour/GrazeFaceTour.tsx)
