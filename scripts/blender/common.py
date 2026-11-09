"""
Shared helpers for the procedural Blender models in this folder.

Run a model script headless:   blender -b -P scripts/blender/airliner.py
Each script is deterministic (no randomness unless seeded), writes a .glb to
public/models/gen/ and a preview PNG to out/blender-preview/.

Coordinates: Blender is Z-up. glTF export converts to Y-up, which maps
Blender (x, y, z) -> glTF (x, z, -y). So a model whose NOSE points to Blender -Y
ends up pointing to +Z in three.js, matching the rest of src/shared/three.
Units are metres. Left = +X (nose -Y, up +Z).
"""
import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GEN_DIR = os.path.join(ROOT, "public", "models", "gen")
PREVIEW_DIR = os.path.join(ROOT, "out", "blender-preview")


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def srgb(hex_color):
    """'#RRGGBB' -> linear RGBA tuple (Blender stores linear)."""
    h = hex_color.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i : i + 2], 16) / 255.0
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (out[0], out[1], out[2], 1.0)


def material(name, color, rough=0.6, metal=0.0, emit=None, emit_strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = srgb(color)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = srgb(emit)
        b.inputs["Emission Strength"].default_value = emit_strength
    return m


def empty(name, location=(0, 0, 0), parent=None):
    e = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(e)
    e.location = Vector(location) - (parent.location if parent else Vector())
    if parent:
        e.parent = parent
    return e


def obj(name, verts, faces, mat=None, smooth=True, origin=None, parent=None, bevel=0.0):
    """
    Mesh object from WORLD-space verts. `origin` (world) becomes the object's pivot,
    so e.g. a flap can rotate about its hinge. A parent must be unrotated/unscaled.
    """
    verts = [Vector(v) for v in verts]
    o_w = Vector(origin) if origin is not None else Vector()
    local = [v - o_w for v in verts]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([tuple(v) for v in local], [], faces)
    mesh.update()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    o = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(o)
    o.location = o_w - (parent.location if parent else Vector())
    if parent:
        o.parent = parent
    if mat:
        mesh.materials.append(mat)
    for p in mesh.polygons:
        p.use_smooth = smooth
    if smooth:
        bpy.context.view_layer.objects.active = o
        o.select_set(True)
        try:
            bpy.ops.object.shade_smooth_by_angle(angle=math.radians(42))
        except Exception:
            pass
        o.select_set(False)
    if bevel > 0:
        m = o.modifiers.new("bevel", "BEVEL")
        m.width = bevel
        m.segments = 2
        m.limit_method = "ANGLE"
    return o


def merge(parts):
    """Concatenate (verts, faces) lists into one (verts, faces)."""
    V, F = [], []
    for v, f in parts:
        base = len(V)
        V.extend(v)
        F.extend([tuple(i + base for i in face) for face in f])
    return V, F


def ring_loft(rings, cap_start=True, cap_end=True):
    """Faces between consecutive same-length rings (lists of Vectors), plus centre caps."""
    n = len(rings[0])
    V, F = [], []
    for r in rings:
        V.extend(r)
    for k in range(len(rings) - 1):
        for i in range(n):
            a = k * n + i
            b = k * n + (i + 1) % n
            F.append((a, b, b + n, a + n))
    if cap_start:
        c = sum(rings[0], Vector()) / n
        ci = len(V)
        V.append(c)
        F.extend([(ci, (i + 1) % n, i) for i in range(n)])
    if cap_end:
        c = sum(rings[-1], Vector()) / n
        ci = len(V)
        V.append(c)
        off = (len(rings) - 1) * n
        F.extend([(ci, off + i, off + (i + 1) % n) for i in range(n)])
    return V, F


def box(center, size, axes=None):
    """Box as (verts, faces). size = (sx, sy, sz) along `axes` (3 orthonormal Vectors, default world)."""
    ax = axes or (Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1)))
    c = Vector(center)
    V = []
    for sx in (-1, 1):
        for sy in (-1, 1):
            for sz in (-1, 1):
                V.append(c + ax[0] * (sx * size[0] / 2) + ax[1] * (sy * size[1] / 2) + ax[2] * (sz * size[2] / 2))
    F = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    return V, F


def cylinder(p0, p1, r0, r1, seg=12):
    """Open-capped frustum between two points."""
    p0, p1 = Vector(p0), Vector(p1)
    d = (p1 - p0).normalized()
    ref = Vector((0, 0, 1)) if abs(d.z) < 0.9 else Vector((1, 0, 0))
    u = d.cross(ref).normalized()
    w = d.cross(u).normalized()
    rings = []
    for p, r in ((p0, r0), (p1, r1)):
        rings.append([p + (u * math.cos(2 * math.pi * i / seg) + w * math.sin(2 * math.pi * i / seg)) * r for i in range(seg)])
    return ring_loft(rings)


def lerp(a, b, t):
    return a + (b - a) * t


def smooth_interp(stops, y):
    """Cosine interpolation of tuples [(y, v0, v1, ...), ...] at y."""
    if y <= stops[0][0]:
        return stops[0][1:]
    for a, b in zip(stops, stops[1:]):
        if y <= b[0]:
            t = (y - a[0]) / (b[0] - a[0])
            t = (1 - math.cos(math.pi * t)) / 2
            return tuple(lerp(x, z, t) for x, z in zip(a[1:], b[1:]))
    return stops[-1][1:]


def export_glb(name):
    os.makedirs(GEN_DIR, exist_ok=True)
    path = os.path.join(GEN_DIR, name + ".glb")
    bpy.ops.object.select_all(action="DESELECT")
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        export_apply=True,
        export_yup=True,
        export_cameras=False,
        export_lights=False,
    )
    print("wrote", path, os.path.getsize(path), "bytes")
    return path


def preview(name, target=(0, 0, 0), cam=(60, -70, 28), floor=True, size=(1400, 900), lens=50, sun=(-0.5, 0.6, -0.8), bg="#34495C"):
    """Render a PNG preview (EEVEE, falls back to Workbench) into out/blender-preview/."""
    os.makedirs(PREVIEW_DIR, exist_ok=True)
    sc = bpy.context.scene
    for eng in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT", "BLENDER_WORKBENCH"):
        try:
            sc.render.engine = eng
            break
        except TypeError:
            continue
    sc.render.resolution_x, sc.render.resolution_y = size
    sc.render.film_transparent = False
    world = bpy.data.worlds.new("w")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = srgb(bg)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.6
    sc.world = world
    if floor:
        bpy.ops.mesh.primitive_plane_add(size=600, location=(0, 0, -3.56))
        f = bpy.context.active_object
        f.name = "preview_floor"
        f.data.materials.append(material("floor", "#2B3844", 0.9))
    sun_data = bpy.data.lights.new("sun", "SUN")
    sun_data.energy = 3.2
    sun_o = bpy.data.objects.new("sun", sun_data)
    bpy.context.collection.objects.link(sun_o)
    sun_o.rotation_euler = Vector(sun).to_track_quat("-Z", "Y").to_euler()
    fill_data = bpy.data.lights.new("fill", "SUN")
    fill_data.energy = 1.4
    fill_data.color = (0.6, 0.75, 1.0)
    fill_o = bpy.data.objects.new("fill", fill_data)
    bpy.context.collection.objects.link(fill_o)
    fill_o.rotation_euler = Vector((0.6, -0.4, -0.5)).to_track_quat("-Z", "Y").to_euler()
    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = lens
    cam_data.clip_end = 2000
    cam_o = bpy.data.objects.new("cam", cam_data)
    bpy.context.collection.objects.link(cam_o)
    cam_o.location = cam
    cam_o.rotation_euler = (Vector(target) - Vector(cam)).to_track_quat("-Z", "Y").to_euler()
    sc.camera = cam_o
    sc.render.filepath = os.path.join(PREVIEW_DIR, name + ".png")
    bpy.ops.render.render(write_still=True)
    print("preview", sc.render.filepath, "engine", sc.render.engine)
