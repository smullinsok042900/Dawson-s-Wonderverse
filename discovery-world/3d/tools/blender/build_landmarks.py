# =====================================================================
# Blender landmark models for Dawson's Discovery World 3D (build 22):
#   castle.glb         : the Princess Castle's architecture (keep with plinth and cornice,
#                        crenellations, two great towers with corbelled tops, flared tile roofs,
#                        finials and pennants, arched tower windows, a central tower, a gabled
#                        hall roof, two tall back towers and two side wings with turrets)
#   carousel_base.glb  : the carousel's stepped platform with a scalloped skirt and gold trim
#   carousel_spin.glb  : the spinning part: a fluted centre column with mirror panels, a striped
#                        scalloped canopy with a valance, bulbs and a finial with a flag
# Every hard edge is bevelled, curved parts are lathe-turned profiles, UV set 0 is world-scale
# (bricks and roof tiles keep one size everywhere) and UV set 1 carries a Cycles-baked ambient
# occlusion lightmap (saved next to the GLB as *_ao.png).
# The game supplies the materials by name (wall, stone, roofA, roofB, gold, glass, flag, ...),
# so these models share the game's own material style.
# Coordinates below are the GAME's (x right, y up, z towards the camera); the castle's front
# wall is at z = -4.1, exactly where the code-built door, windows and balcony sit.
#   python3 tools/blender/build_landmarks.py <out_dir> [castle|carousel]
# =====================================================================
import bpy, bmesh, math, sys, os
from mathutils import Vector

OUT = sys.argv[1] if len(sys.argv) > 1 else 'out'
ONLY = sys.argv[2] if len(sys.argv) > 2 else ''
os.makedirs(OUT, exist_ok=True)
TAU = math.tau


def B(x, y, z):  # game coords -> Blender coords (glTF export turns Blender Z-up back into Y-up)
    return Vector((x, -z, y))


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 64; sc.cycles.use_denoising = False
    w = bpy.data.worlds.new('W'); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    if bg: bg.inputs['Color'].default_value = (1, 1, 1, 1)
    w.light_settings.distance = 1.6
    return sc


MATS = {}
def mat(name):
    if name not in MATS:
        m = bpy.data.materials.new(name); m.use_nodes = True; MATS[name] = m
    return MATS[name]


PARTS = []
def finish(ob, mname, mapping='planar', smooth_angle=35, center=None):
    """apply transforms, set the material, mark sharp edges, and remember how to map UVs"""
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for md in list(ob.modifiers):
        bpy.ops.object.modifier_apply(modifier=md.name)
    ob.select_set(False)
    me = ob.data; me.materials.clear(); me.materials.append(mat(mname))
    bm = bmesh.new(); bm.from_mesh(me)
    for f in bm.faces: f.smooth = True
    for e in bm.edges:
        if len(e.link_faces) == 2 and e.calc_face_angle(0) > math.radians(smooth_angle): e.smooth = False
    bm.to_mesh(me); bm.free()
    PARTS.append((ob, mapping, center))
    return ob


def box(mname, size, c, bevel=.05, segs=2, rot_y=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=B(*c)); ob = bpy.context.active_object
    ob.scale = (size[0], size[2], size[1]); ob.rotation_euler = (0, 0, -rot_y)
    bpy.ops.object.transform_apply(scale=True, rotation=True, location=False)
    if bevel > 0:
        bv = ob.modifiers.new('bv', 'BEVEL'); bv.width = bevel; bv.segments = segs; bv.limit_method = 'ANGLE'
    return finish(ob, mname)


def lathe(mname, prof, c, segs=48, mapping='cyl', smooth_angle=50, cap_top=True, cap_bottom=True):
    """a turned shape: prof = [(radius, height), ...] from bottom to top, around the vertical axis at c"""
    bm = bmesh.new(); rings = []
    for (r, h) in prof:
        ring = [bm.verts.new(B(c[0] + math.cos(i / segs * TAU) * r, c[1] + h, c[2] + math.sin(i / segs * TAU) * r)) for i in range(segs)]
        rings.append(ring)
    for a, b2 in zip(rings, rings[1:]):
        for i in range(segs):
            j = (i + 1) % segs
            try: bm.faces.new((a[i], a[j], b2[j], b2[i]))
            except ValueError: pass
    if cap_bottom and prof[0][0] > 1e-4: bm.faces.new(list(reversed(rings[0])))
    if cap_top and prof[-1][0] > 1e-4: bm.faces.new(rings[-1])
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(mname); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(mname, me); bpy.context.collection.objects.link(ob)
    return finish(ob, mname, mapping, smooth_angle, center=c)


def torus(mname, R, r, c, segs=48, minor=12):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=segs, minor_segments=minor, location=B(*c))
    return finish(bpy.context.active_object, mname, 'planar', 80)


def sphere(mname, r, c, sx=1, sy=1, sz=1):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=20, ring_count=10, location=B(*c)); ob = bpy.context.active_object
    ob.scale = (sx, sz, sy)
    return finish(ob, mname, 'planar', 80)


def pennant(mname, c, length=1.1, height=.5, facing=1):
    """a small waving flag on the finial pole (a curved triangle)"""
    bm = bmesh.new(); vs = []
    for i in range(7):
        t = i / 6; x = c[0] + facing * t * length; z = c[2] + math.sin(t * 3.2) * .12 * t
        top = bm.verts.new(B(x, c[1] + height * (1 - t) * .5, z)); bot = bm.verts.new(B(x, c[1] - height * (1 - t) * .5, z)); vs.append((top, bot))
    for (a, b2), (c2, d) in zip(vs, vs[1:]):
        try: bm.faces.new((a, b2, d, c2))
        except ValueError: pass
    me = bpy.data.meshes.new(mname); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(mname, me); bpy.context.collection.objects.link(ob)
    sol = ob.modifiers.new('sol', 'SOLIDIFY'); sol.thickness = .02
    return finish(ob, mname, 'planar', 80)


def arch_window(c, w=.7, h=1.2, depth=.12, facing_angle=0, r_out=None):
    """an arched window: a glowing pane in a stone frame with a sill (placed on a wall or a tower)"""
    # pane (round-topped) built as a flat shape, then the frame as a thin solid outline
    def shape(sc):
        pts = [(-w / 2 * sc, 0), (w / 2 * sc, 0)]
        for i in range(13):
            a = i / 12 * math.pi; pts.append((math.cos(a) * w / 2 * sc, h - w / 2 + math.sin(a) * w / 2 * sc + (sc - 1) * w * .3))
        return pts
    obs = []
    for nm, sc, dz in (('glass', 1.0, 0.0), ('stone', 1.18, -.02)):
        bm = bmesh.new(); vs = [bm.verts.new((p[0], 0, p[1])) for p in shape(sc)]
        # (vertex order: bottom-left, bottom-right, then the arch from right to left)
        bm.faces.new([vs[0], vs[1]] + vs[2:][::1][1:] if False else vs[:1] + vs[1:2] + vs[2:])
        me = bpy.data.meshes.new(nm); bm.to_mesh(me); bm.free()
        ob = bpy.data.objects.new(nm, me); bpy.context.collection.objects.link(ob)
        sol = ob.modifiers.new('sol', 'SOLIDIFY'); sol.thickness = depth if nm == 'stone' else .03; sol.offset = -1 if nm == 'stone' else 1  # (frame goes back into the wall; the glass sits in front of it)
        if nm == 'stone':
            bv = ob.modifiers.new('bv', 'BEVEL'); bv.width = .02; bv.segments = 2; bv.limit_method = 'ANGLE'
        ob.rotation_euler = (0, 0, facing_angle)
        p = B(*c); ob.location = p + Vector((math.sin(facing_angle), -math.cos(facing_angle), 0)) * (.05 if nm == 'glass' else .03)
        obs.append(finish(ob, nm, 'planar', 30))
    box('stone', (w * 1.4, .1, .22), (c[0] + 0, c[1] - .05, c[2]), bevel=.03, rot_y=facing_angle)
    return obs


# ---------------------------------------------------------------------
def build_castle():
    reset()
    # --- the keep: a brick block on a stone plinth, a cornice, crenellations front and back
    box('wall', (12, 7, 3), (0, 3.5, -5.6), bevel=.12, segs=3)
    box('stone', (12.5, .55, 3.5), (0, .27, -5.6), bevel=.08)
    box('stone', (12.4, .28, 3.3), (0, 7.0, -5.6), bevel=.07)
    for zz in (-4.32, -6.88):
        for i in range(9):
            box('wall', (.82, .72, .5), (-5.4 + i * 1.35, 7.5, zz), bevel=.07, segs=2)
            box('stone', (.9, .08, .58), (-5.4 + i * 1.35, 7.9, zz), bevel=.03)
    # --- a gabled hall roof behind the battlements
    bm = bmesh.new(); L, H = 5.6, 2.2
    for (x0, x1) in ((-L, L),):
        pts = [B(x0, 7.1, -4.6), B(x0, 7.1, -6.6), B(x0, 7.1 + H, -5.6), B(x1, 7.1, -4.6), B(x1, 7.1, -6.6), B(x1, 7.1 + H, -5.6)]
        v = [bm.verts.new(p) for p in pts]
        bm.faces.new((v[0], v[3], v[5], v[2])); bm.faces.new((v[2], v[5], v[4], v[1])); bm.faces.new((v[0], v[2], v[1])); bm.faces.new((v[3], v[4], v[5]))
    me = bpy.data.meshes.new('roofA'); bm.to_mesh(me); bm.free(); ob = bpy.data.objects.new('roofA', me); bpy.context.collection.objects.link(ob)
    bv = ob.modifiers.new('bv', 'BEVEL'); bv.width = .06; bv.segments = 2
    finish(ob, 'roofA', 'roof')
    box('gold', (11.4, .1, .1), (0, 7.1 + H + .02, -5.6), bevel=.04)
    # --- the two great towers (same footprint as before: the climbing roses still fit)
    for tx in (-6.6, 6.6):
        c = (tx, 0, -4.9)
        lathe('wall', [(1.62, 0), (1.6, 1.0), (1.5, 8.6), (1.48, 8.95)], c, mapping='cyl', cap_bottom=False, cap_top=False)
        lathe('stone', [(1.78, 0), (1.78, .6), (1.64, .75)], c, mapping='cyl', smooth_angle=30)            # plinth
        lathe('stone', [(1.5, 8.6), (1.62, 8.7), (1.85, 9.1), (1.9, 9.4), (1.9, 9.55), (1.6, 9.6)], c, smooth_angle=30)  # corbelled top
        for i in range(16):  # corbels under the top ring
            a = i / 16 * TAU; box('stone', (.18, .3, .22), (tx + math.cos(a) * 1.6, 8.75, -4.9 + math.sin(a) * 1.6), bevel=.03, rot_y=-a)
        # a flared roof (concave curve, like real castle spires) with a tip and finial
        prof = [(2.05, 9.5), (1.9, 9.75)] + [(1.75 * (1 - t) ** 1.55 + .02, 9.75 + t * 4.1) for t in [i / 10 for i in range(1, 11)]]
        lathe('roofA', prof, c, segs=48, mapping='roof', smooth_angle=60, cap_bottom=True)
        lathe('gold', [(.0, 13.82), (.09, 13.9), (.13, 14.05), (.09, 14.2), (.02, 14.3), (.015, 15.1)], c, segs=20)
        sphere('gold', .14, (tx, 14.05, -4.9))
        pennant('flag', (tx + .02, 14.85, -4.9), facing=1 if tx > 0 else -1)
        for wy in (2.6, 5.6):
            arch_window((tx, wy - .55, -4.9 + 1.52), w=.62, h=1.1, facing_angle=0)
    # --- the central tower rising from the keep, with a pink roof
    c = (0, 7, -5.6)
    lathe('wall', [(1.3, 0), (1.3, 3.0), (1.27, 3.2)], c, mapping='cyl', cap_bottom=False, cap_top=False)
    lathe('stone', [(1.27, 3.0), (1.45, 3.25), (1.5, 3.5), (1.3, 3.55)], c, smooth_angle=30)
    prof = [(1.62, 3.45), (1.5, 3.7)] + [(1.45 * (1 - t) ** 1.5 + .02, 3.7 + t * 3.4) for t in [i / 10 for i in range(1, 11)]]
    lathe('roofB', prof, c, mapping='roof', smooth_angle=60)
    lathe('gold', [(.0, 7.02), (.08, 7.1), (.11, 7.22), (.02, 7.35), (.015, 7.95)], (0, 7, -5.6), segs=20)
    pennant('flag', (0.02, 14.75, -5.6), facing=1)
    arch_window((0, 8.0, -5.6 + 1.32), w=.6, h=1.0)
    # --- two tall slender towers behind (depth), and side wings with turrets
    for tx in (-3.4, 3.4):
        c = (tx, 0, -7.8)
        lathe('wall', [(1.0, 0), (.95, 11.0)], c, mapping='cyl', cap_bottom=False, cap_top=False)
        lathe('stone', [(.95, 10.9), (1.15, 11.2), (1.15, 11.4), (.95, 11.45)], c, smooth_angle=30)
        prof = [(1.3, 11.35), (1.2, 11.55)] + [(1.15 * (1 - t) ** 1.55 + .02, 11.55 + t * 3.3) for t in [i / 10 for i in range(1, 11)]]
        lathe('roofB', prof, c, mapping='roof', smooth_angle=60)
        lathe('gold', [(.0, 14.85), (.07, 14.95), (.02, 15.1), (.012, 15.6)], c, segs=16)
        arch_window((tx, 9.0, -7.8 + .97), w=.5, h=.9)
    for sx in (-1, 1):
        x = sx * 9.5
        box('wall', (3.6, 4.8, 3.2), (x, 2.4, -6.4), bevel=.1, segs=3)
        box('stone', (3.9, .5, 3.5), (x, .25, -6.4), bevel=.07)
        box('stone', (3.8, .24, 3.4), (x, 4.85, -6.4), bevel=.06)
        for i in range(3): box('wall', (.7, .6, .45), (x - 1.2 + i * 1.2, 5.2, -4.95), bevel=.06)
        c = (x + sx * 1.6, 0, -4.9)
        lathe('wall', [(.75, 0), (.72, 6.4)], c, mapping='cyl', cap_bottom=False, cap_top=False)
        lathe('stone', [(.72, 6.3), (.88, 6.5), (.88, 6.65), (.72, 6.7)], c, smooth_angle=30)
        prof = [(1.0, 6.6), (.92, 6.78)] + [(.88 * (1 - t) ** 1.5 + .02, 6.78 + t * 2.6) for t in [i / 10 for i in range(1, 11)]]
        lathe('roofB', prof, c, mapping='roof', smooth_angle=60)
        lathe('gold', [(.0, 9.36), (.06, 9.44), (.02, 9.55), (.012, 10.0)], c, segs=16)
        arch_window((x, 2.2, -6.4 + 1.62), w=.6, h=1.0)
    bake_and_export('castle', ground_c=(0, 0, -5), ground_size=40)


def build_carousel():
    reset()
    # --- static base: a stepped platform with a scalloped skirt, gold trim and a lilac step
    base = []
    base.append(lathe('stone', [(4.75, 0), (4.75, .14), (4.62, .16)], (0, 0, 0), segs=64, smooth_angle=30))
    base.append(lathe('roofB', [(4.6, .14), (4.6, .36), (4.5, .4)], (0, 0, 0), segs=64, mapping='cyl', smooth_angle=30))
    base.append(lathe('gold', [(4.52, .36), (4.56, .4), (4.52, .44), (4.4, .44)], (0, 0, 0), segs=64, smooth_angle=30, cap_top=False, cap_bottom=False))
    base.append(lathe('floor', [(4.41, .43), (0.01, .43)], (0, 0, 0), segs=64, smooth_angle=30, cap_top=False, cap_bottom=False))
    for i in range(24):  # scalloped skirt panels
        a = (i + .5) / 24 * TAU; base.append(sphere('canopyA' if i % 2 else 'canopyB', .38, (math.cos(a) * 4.62, .2, math.sin(a) * 4.62), sx=1, sy=.42, sz=.25))
    # --- spinning part (its origin is the spin group's origin, 0.4 m above the ground)
    spin = []
    spin.append(lathe('gold', [(.5, 0), (.5, .12), (.38, .2), (.36, .5)], (0, 0, 0), segs=40, smooth_angle=30))
    # fluted column with mirror panels
    bm = bmesh.new(); segs, rings = 48, 10
    rr = [[bm.verts.new(B(math.cos(i / segs * TAU) * (.36 + .03 * math.cos(i / segs * TAU * 12)), .5 + j / rings * 3.9, math.sin(i / segs * TAU) * (.36 + .03 * math.cos(i / segs * TAU * 12)))) for i in range(segs)] for j in range(rings + 1)]
    for a, b2 in zip(rr, rr[1:]):
        for i in range(segs): bm.faces.new((a[i], a[(i + 1) % segs], b2[(i + 1) % segs], b2[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new('col'); bm.to_mesh(me); bm.free(); ob = bpy.data.objects.new('col', me); bpy.context.collection.objects.link(ob)
    spin.append(finish(ob, 'canopyB', 'cyl', 60, center=(0, 0, 0)))
    for k in range(6):
        a = k / 6 * TAU; spin.append(box('mirror', (.32, .7, .05), (math.cos(a) * .41, 2.4, math.sin(a) * .41), bevel=.02, rot_y=-a + math.pi / 2))
        spin.append(box('gold', (.4, .78, .03), (math.cos(a) * .395, 2.4, math.sin(a) * .395), bevel=.015, rot_y=-a + math.pi / 2))
    spin.append(lathe('gold', [(.36, 4.35), (.55, 4.45), (.6, 4.6), (.4, 4.7)], (0, 0, 0), segs=40, smooth_angle=30))
    # the canopy: 16 gently domed, striped panels with a scalloped valance and bulbs
    N = 16
    bm = bmesh.new(); col = bm.loops.layers.float_color.new('Col')
    def cp(r, y, a): return bm.verts.new(B(math.cos(a) * r, y, math.sin(a) * r))
    sub = 5
    for k in range(N):
        for s in range(sub):
            a0 = (k + s / sub) / N * TAU; a1 = (k + (s + 1) / sub) / N * TAU
            # profile: from the rim (r 5.05, y 4.75) up to the top (r .25, y 6.55), bowed outwards
            prof = [(5.05 * (1 - t) + .25 * t + math.sin(t * math.pi) * .35, 4.75 + 1.8 * (t ** .85)) for t in [i / 10 for i in range(11)]]
            ring0 = [cp(r, y, a0) for (r, y) in prof]; ring1 = [cp(r, y, a1) for (r, y) in prof]
            for i in range(10):
                f = bm.faces.new((ring0[i], ring1[i], ring1[i + 1], ring0[i + 1]))
                cc = (.98, .55, .78, 1) if k % 2 == 0 else (.99, .93, .96, 1)
                for lp in f.loops: lp[col] = cc
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new('canopy'); bm.to_mesh(me); bm.free(); ob = bpy.data.objects.new('canopy', me); bpy.context.collection.objects.link(ob)
    sol = ob.modifiers.new('sol', 'SOLIDIFY'); sol.thickness = .05
    spin.append(finish(ob, 'canopy', 'planar', 70))
    for k in range(N * 2):  # scalloped valance
        a = (k + .5) / (N * 2) * TAU
        spin.append(sphere('canopyA' if k % 2 else 'canopyB', .5, (math.cos(a) * 5.0, 4.62, math.sin(a) * 5.0), sx=1, sy=.5, sz=.12))
    spin.append(torus('gold', 5.06, .06, (0, 4.76, 0), segs=96, minor=10))
    spin.append(lathe('gold', [(.3, 6.45), (.26, 6.62), (.12, 6.75), (.16, 6.9), (.06, 7.05), (.02, 7.6)], (0, 0, 0), segs=24))
    spin.append(sphere('gold', .15, (0, 6.95, 0)))
    spin.append(pennant('flag', (0.02, 7.5, 0), length=.9, height=.42))
    bake_and_export('carousel', ground_c=(0, 0, 0), ground_size=24, groups={'carousel_base': base, 'carousel_spin': spin}, ground_y=-.4)


# ---------------------------------------------------------------------
def world_uvs():
    """UV set 0: world-scale mapping (one brick/tile size everywhere)"""
    for ob, mapping, center in PARTS:
        me = ob.data
        if not me.uv_layers: me.uv_layers.new(name='UVMap')
        uv = me.uv_layers[0]; S = 2.4 if mapping != 'roof' else 1.2
        cx, cy = (B(*center).x, B(*center).y) if center else (0, 0)
        for poly in me.polygons:
            n = poly.normal
            for li in poly.loop_indices:
                p = me.vertices[me.loops[li].vertex_index].co
                if mapping in ('cyl', 'roof') and abs(n.z) < .97:
                    ang = math.atan2(p.y - cy, p.x - cx); r = max(.3, math.hypot(p.x - cx, p.y - cy)) if mapping == 'cyl' else 1.6
                    u = ang * r / S if mapping == 'cyl' else ang / TAU * 12; v = p.z / S
                elif abs(n.z) > .7: u, v = p.x / S, p.y / S
                else:
                    t = Vector((-n.y, n.x, 0)).normalized(); u, v = p.dot(t) / S, p.z / S
                uv.data[li].uv = (u, v)


def bake_and_export(name, ground_c, ground_size, groups=None, ground_y=0):
    import numpy as np
    world_uvs()
    bpy.ops.mesh.primitive_plane_add(size=ground_size, location=B(ground_c[0], ground_y, ground_c[2])); ground = bpy.context.active_object
    groups = groups or {name: [p[0] for p in PARTS]}
    for gname, objs in groups.items():
        bpy.ops.object.select_all(action='DESELECT')
        for o in objs: o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        bpy.ops.object.join(); ob = bpy.context.active_object; ob.name = gname
        me = ob.data
        ao_uv = me.uv_layers.new(name='AO'); me.uv_layers.active = ao_uv
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=math.radians(55), island_margin=.004); bpy.ops.object.mode_set(mode='OBJECT')
        img = bpy.data.images.new(gname + '_ao', 2048, 2048, float_buffer=True)
        for m in me.materials:
            nt = m.node_tree; n = nt.nodes.new('ShaderNodeTexImage'); n.image = img; nt.nodes.active = n
            uvn = nt.nodes.new('ShaderNodeUVMap'); uvn.uv_map = 'AO'; nt.links.new(uvn.outputs['UV'], n.inputs['Vector'])
        bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
        bpy.ops.object.bake(type='AO', margin=8, use_clear=True)
        a = np.empty(len(img.pixels), np.float32); img.pixels.foreach_get(a); a = a.reshape(2048, 2048, 4)
        ao = np.clip(a[..., 0], 0, 1) ** .9
        from PIL import Image
        Image.fromarray((ao[::-1] * 255 + .5).astype('uint8')).resize((1024, 1024), Image.LANCZOS).save(os.path.join(OUT, gname + '_ao.png'))
        for m in me.materials:  # (the exporter only needs names; the game sets the materials)
            for nd in [nd for nd in m.node_tree.nodes if nd.type in ('TEX_IMAGE', 'UVMAP')]: m.node_tree.nodes.remove(nd)
        me.uv_layers.active = me.uv_layers[0]
        bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True)
        path = os.path.join(OUT, gname + '.glb')
        bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_normals=True, export_texcoords=True, export_materials='EXPORT', export_yup=True)
        print('wrote', path, os.path.getsize(path) // 1024, 'KB')
        ob.hide_render = False
    bpy.data.objects.remove(ground)


if __name__ == '__main__':
    if ONLY in ('', 'castle'): build_castle()
    if ONLY in ('', 'carousel'): build_carousel()
