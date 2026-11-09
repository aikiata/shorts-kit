"""
A low-poly twin-engine airliner, built from code (no downloaded model, no licence to check).

Run headless:   bun run model airliner      (or: blender -b -P scripts/blender/airliner.py)
Writes public/models/gen/airliner.glb and out/blender-preview/airliner.png.

Axes follow common.py: metres, nose toward Blender -Y (three.js +Z after export), up +Z, left wing +X.
Every part is a named node, so a scene can find it (`wing_L`, `engine_R`, `fin`) and glue a callout to it.
Deterministic: no randomness, so the .glb rebuilds the same every time.
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import cylinder, empty, export_glb, material, obj, preview, reset, ring_loft, smooth_interp  # noqa: E402
from mathutils import Vector  # noqa: E402

reset()

BODY = material("body", "#E9EEF2", rough=0.45)
TAIL = material("tail", "#2F7DD1", rough=0.4)
ENGINE = material("engine", "#5B6773", rough=0.35, metal=0.4)
GLASS = material("glass", "#1D2731", rough=0.15)

root = empty("airliner")

# Fuselage: rings along Y, nose at y = -19, tail cone at y = +19. Radius and the tail's upsweep vary smoothly.
SEG = 16
STOPS = [(-19.0, 0.15, 0.0), (-17.0, 1.35, 0.0), (-14.0, 2.0, 0.0), (10.0, 2.0, 0.0), (16.0, 1.1, 0.9), (19.0, 0.25, 1.5)]
rings = []
for i in range(41):
    y = -19.0 + 38.0 * i / 40
    r, lift = smooth_interp(STOPS, y)
    rings.append([Vector((math.cos(2 * math.pi * k / SEG) * r, y, math.sin(2 * math.pi * k / SEG) * r * 1.05 + lift)) for k in range(SEG)])
fv, ff = ring_loft(rings)
obj("fuselage", fv, ff, BODY, parent=root)

# Cockpit windows: a thin dark band near the nose.
cw = [Vector((math.cos(a) * 1.62, -16.2, 0.55 + math.sin(a) * 0.5)) for a in (0.35, 1.0, 2.14, 2.79)]
cv = cw + [v + Vector((0, 1.4, 0.05)) for v in cw]
obj("cockpit", [v * 1.0 for v in cv], [(0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6)], GLASS, smooth=False, parent=root)


def slab(root_le, root_te, tip_le, tip_te, thick_root, thick_tip):
    """A tapered flat panel (wing, stabiliser) from four corner points in the XY plane at their own Z."""
    pts = [root_le, root_te, tip_te, tip_le]
    th = [thick_root, thick_root, thick_tip, thick_tip]
    top = [Vector(p) + Vector((0, 0, t / 2)) for p, t in zip(pts, th)]
    bot = [Vector(p) - Vector((0, 0, t / 2)) for p, t in zip(pts, th)]
    v = top + bot
    f = [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    return v, f


for side, sx in (("L", 1), ("R", -1)):
    # wing: swept back, slight dihedral; the hinge-side origin lets a scene flex or highlight it
    wv, wf = slab((sx * 1.6, -3.0, -0.6), (sx * 1.6, 3.5, -0.6), (sx * 16.5, 5.5, 0.6), (sx * 16.5, 7.2, 0.6), 0.55, 0.18)
    obj(f"wing_{side}", wv, wf, BODY, smooth=False, origin=(sx * 1.6, 0, -0.6), parent=root)
    # engine under the wing, nose of the nacelle forward (-Y)
    ex = sx * 5.8
    nv, nf = cylinder((ex, -4.6, -1.7), (ex, 0.2, -1.6), 0.95, 0.75, seg=14)
    obj(f"engine_{side}", nv, nf, ENGINE, origin=(ex, -2.2, -1.65), parent=root)
    # pylon joining engine and wing
    pv, pf = slab((ex, -2.0, -1.0), (ex, 0.6, -0.9), (ex, -1.6, -0.7), (ex, 0.4, -0.6), 0.25, 0.25)
    obj(f"pylon_{side}", pv, pf, BODY, smooth=False, parent=root)
    # horizontal stabiliser at the tail
    hv, hf = slab((sx * 0.6, 14.5, 1.3), (sx * 0.6, 18.0, 1.4), (sx * 6.2, 17.6, 1.9), (sx * 6.2, 19.0, 1.9), 0.3, 0.12)
    obj(f"stab_{side}", hv, hf, TAIL, smooth=False, parent=root)

# Fin: a vertical swept panel on top of the tail.
fin_pts = [(0, 13.5, 2.4), (0, 18.4, 2.0), (0, 19.6, 7.6), (0, 17.4, 7.6)]
fin_v = [Vector(p) + Vector((0.18, 0, 0)) for p in fin_pts] + [Vector(p) - Vector((0.18, 0, 0)) for p in fin_pts]
fin_f = [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
obj("fin", fin_v, fin_f, TAIL, smooth=False, parent=root)

export_glb("airliner")
if "--no-preview" not in sys.argv:
    preview("airliner", target=(0, 0, 0), cam=(42, -48, 18), size=(1200, 800))
