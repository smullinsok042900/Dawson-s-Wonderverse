# =====================================================================
# Blender asset pipeline for Dawson's Discovery World 3D (build 19).
#
# Run (Blender 5.x as a Python module, no window needed):
#   pip install bpy==5.3.0
#   python3 tools/blender/build_assets.py <out_dir> [only]
#
# It MODELS original assets and BAKES their textures with Cycles (path-traced
# ambient occlusion, bark colour and bark normal maps), then exports GLB files:
#   tree_0.glb .. tree_2.glb : a smooth one-piece trunk and branches (Skin +
#                              Subdivision modifiers) with baked bark textures,
#                              and a crown of thousands of real leaf meshes
#                              (each leaf a curved leaf shape, no cut-out cards)
#                              with baked AO and colour in vertex colours and
#                              "foliage normals" (light wraps around the crown)
#   bush_0.glb, bush_1.glb   : leafy bushes made the same way
#   cobble_*.png             : a seamless cobblestone set (colour, height,
#                              roughness), from 4D Voronoi noise on a torus
#                              (so it tiles perfectly)
# Everything is generated from a fixed seed, so a rebuild gives the same assets.
# =====================================================================
import bpy, bmesh, math, random, sys, os
from mathutils import Vector

OUT = sys.argv[1] if len(sys.argv) > 1 else 'out'
ONLY = sys.argv[2] if len(sys.argv) > 2 else ''
os.makedirs(OUT, exist_ok=True)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = 48
    sc.cycles.use_denoising = False
    w = bpy.data.worlds.new('W'); sc.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    if bg: bg.inputs['Color'].default_value = (1, 1, 1, 1); bg.inputs['Strength'].default_value = 1
    w.light_settings.distance = .6  # AO reach (metres)
    return sc


def select_only(objs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]


# ---------------------------------------------------------------------
# TRUNK: a branching skeleton turned into one smooth organic mesh
# ---------------------------------------------------------------------
def skeleton(rnd, s):
    verts, radii, edges, tips, crowns = [Vector((0, 0, 0))], [.2 * s], [], [], []

    def grow(i0, d, length, r, depth):
        prev = i0
        for k in range(1, 4):
            d = (d + Vector((rnd.uniform(-.16, .16), rnd.uniform(-.16, .16), rnd.uniform(-.04, .1)))).normalized()
            verts.append(verts[prev] + d * (length / 3)); radii.append(r * (1 - .36 * k / 3)); edges.append((prev, len(verts) - 1)); prev = len(verts) - 1
        r1 = r * .62
        if depth >= 3:
            tips.append(verts[prev].copy()); return
        kids = 3 if depth == 0 else 2 + (rnd.random() < .5)
        for k in range(kids):
            a = k / kids * math.tau + rnd.uniform(0, .8); tilt = .45 + rnd.random() * .35 + depth * .1
            nd = Vector((math.cos(a) * math.sin(tilt), math.sin(a) * math.sin(tilt), math.cos(tilt))).lerp(d, .35).normalized()
            grow(prev, nd, length * (.62 + rnd.random() * .15), r1, depth + 1)
        if depth >= 1: crowns.append(verts[prev].copy())

    grow(0, Vector((rnd.uniform(-.05, .05), rnd.uniform(-.05, .05), 1)).normalized(), 1.5 * s, .2 * s, 0)
    # root flare: short roots that spread out and dip into the ground
    for k in range(5):
        a = k / 5 * math.tau + rnd.uniform(-.3, .3)
        verts.append(Vector((math.cos(a) * .32 * s, math.sin(a) * .32 * s, -.06))); radii.append(.085 * s); edges.append((0, len(verts) - 1))
    return verts, radii, edges, tips + crowns


def make_trunk(name, verts, radii, edges):
    me = bpy.data.meshes.new(name); me.from_pydata([tuple(v) for v in verts], edges, [])
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob)
    sk = ob.modifiers.new('skin', 'SKIN'); sk.branch_smoothing = .6
    for i, r in enumerate(radii): me.skin_vertices[0].data[i].radius = (r, r)
    me.skin_vertices[0].data[0].use_root = True
    sub = ob.modifiers.new('sub', 'SUBSURF'); sub.levels = 2; sub.render_levels = 2
    select_only([ob]); bpy.ops.object.modifier_apply(modifier='skin'); bpy.ops.object.modifier_apply(modifier='sub')
    bpy.ops.object.shade_smooth()
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=.006); bpy.ops.object.mode_set(mode='OBJECT')
    return ob


def bark_material(name):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; N = nt.nodes; L = nt.links
    bsdf = N['Principled BSDF']; bsdf.inputs['Roughness'].default_value = .9
    tc = N.new('ShaderNodeTexCoord'); mp = N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (7, 7, 1.6)
    L.new(tc.outputs['Object'], mp.inputs['Vector'])
    wave = N.new('ShaderNodeTexWave'); wave.wave_type = 'BANDS'; wave.bands_direction = 'X'; wave.inputs['Scale'].default_value = 1.4; wave.inputs['Distortion'].default_value = 9; wave.inputs['Detail'].default_value = 6
    L.new(mp.outputs['Vector'], wave.inputs['Vector'])
    noi = N.new('ShaderNodeTexNoise'); noi.inputs['Scale'].default_value = 9; noi.inputs['Detail'].default_value = 8; L.new(tc.outputs['Object'], noi.inputs['Vector'])
    mix = N.new('ShaderNodeMath'); mix.operation = 'MULTIPLY_ADD'; mix.inputs[1].default_value = .7; L.new(wave.outputs['Fac'], mix.inputs[0]); L.new(noi.outputs['Fac'], mix.inputs[2])
    ramp = N.new('ShaderNodeValToRGB'); E = ramp.color_ramp.elements
    E[0].position = .25; E[0].color = (.07, .035, .018, 1); E[1].position = .95; E[1].color = (.36, .2, .11, 1)
    mid = E.new(.6); mid.color = (.22, .12, .06, 1)
    L.new(mix.outputs[0], ramp.inputs['Fac']); L.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    bump = N.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = .8; bump.inputs['Distance'].default_value = .02
    L.new(mix.outputs[0], bump.inputs['Height']); L.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    return m


def bake_to_image(ob, mat, img, kind, **kw):
    nt = mat.node_tree; node = nt.nodes.new('ShaderNodeTexImage'); node.image = img; nt.nodes.active = node; node.select = True
    select_only([ob]); bpy.ops.object.bake(type=kind, margin=6, **kw)
    nt.nodes.remove(node)


def img_pixels(img):
    import numpy as np
    a = np.empty(len(img.pixels), dtype=np.float32); img.pixels.foreach_get(a); return a.reshape(img.size[1], img.size[0], 4)


def bake_bark(ob, name, res=512):
    import numpy as np
    mat = bark_material(name + '_bark'); ob.data.materials.append(mat)
    col = bpy.data.images.new(name + '_col', res, res); ao = bpy.data.images.new(name + '_ao', res, res, float_buffer=True)
    nrm = bpy.data.images.new(name + '_nrm', res, res); nrm.colorspace_settings.name = 'Non-Color'
    bake_to_image(ob, mat, col, 'DIFFUSE', pass_filter={'COLOR'})
    bake_to_image(ob, mat, ao, 'AO')
    bake_to_image(ob, mat, nrm, 'NORMAL', normal_space='TANGENT')
    c, a = img_pixels(col), img_pixels(ao)
    c[..., :3] *= (.4 + .6 * a[..., :1])
    col.pixels.foreach_set(c.ravel())
    # final glTF material: baked colour (with AO) + baked normal map
    fm = bpy.data.materials.new(name + '_barkfinal'); fm.use_nodes = True; nt = fm.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Roughness'].default_value = .88
    tc = nt.nodes.new('ShaderNodeTexImage'); tc.image = col; nt.links.new(tc.outputs['Color'], b.inputs['Base Color'])
    tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = nrm; nm = nt.nodes.new('ShaderNodeNormalMap'); nt.links.new(tn.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    for img, fmt in ((col, 'JPEG'), (nrm, 'JPEG')):
        img.file_format = fmt; img.filepath_raw = os.path.join(OUT, '_tmp_' + img.name + '.jpg'); img.save(); img.reload()
    ob.data.materials.clear(); ob.data.materials.append(fm)


# ---------------------------------------------------------------------
# LEAVES: thousands of small curved leaf meshes in round crowns, plus a
# darker inner core (so you never see through the crown)
# ---------------------------------------------------------------------
LEAF_GREENS = [(.16, .40, .08), (.21, .46, .10), (.13, .34, .07), (.28, .52, .12), (.18, .43, .14), (.33, .55, .13)]


def make_foliage(name, rnd, crowns, n_leaves, leaf_len=.17, crown_r=.7, squash=.85, core=True):
    bm = bmesh.new(); tint = bm.loops.layers.float_color.new('tint'); outw = []  # per-loop outward normal
    cl = len(crowns)
    for c in crowns:  # dark inner cores
        if not core: break
        r = crown_r * .72
        geom = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=r)
        for v in geom['verts']: v.co = Vector((v.co.x, v.co.y, v.co.z * squash)) + c + Vector((0, 0, .1))
        faces = {f for v in geom['verts'] for f in v.link_faces}
        for f in faces:
            for lp in f.loops:
                lp[tint] = (.09, .22, .05, 1); outw.append(None)
    for i in range(n_leaves):
        c = crowns[i % cl] + Vector((0, 0, .12))
        d = Vector((rnd.gauss(0, 1), rnd.gauss(0, 1), rnd.gauss(0, 1) * .8 + .25)).normalized()
        rr = crown_r * (.72 + .3 * rnd.random() ** .5)
        p = c + Vector((d.x * rr, d.y * rr, d.z * rr * squash))
        n = (d + Vector((rnd.uniform(-.5, .5), rnd.uniform(-.5, .5), rnd.uniform(-.3, .5)))).normalized()
        t = n.cross(Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(-1, 1)))).normalized()
        b = n.cross(t)
        L = leaf_len * (.75 + .5 * rnd.random()); W = L * .48; fold = W * .28
        # leaf outline (stem end at 0, tip at L), folded along the midrib
        pts = [(0, 0, 0), (.32, .18, .5), (.40, .45, .55), (.30, .72, .45), (0, 1, .15), (-.30, .72, .45), (-.40, .45, .55), (-.32, .18, .5)]
        vs = [bm.verts.new(p + t * (x * W / .4 * .5) + b * (y * L) + n * (z * fold)) for (x, y, z) in pts]
        mid = bm.verts.new(p + b * (.45 * L) + n * (fold * .85))
        g = LEAF_GREENS[rnd.randrange(len(LEAF_GREENS))]; j = .85 + rnd.random() * .3
        col = (g[0] * j, g[1] * j, g[2] * j, 1)
        on = (d * .8 + n * .2).normalized()
        for k in range(len(vs)):
            f = bm.faces.new((mid, vs[k], vs[(k + 1) % len(vs)]))
            for lp in f.loops: lp[tint] = col; outw.append(on)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob)
    select_only([ob]); bpy.ops.object.shade_smooth()
    # foliage normals: cores keep their own; leaves point out of the crown
    me.calc_loop_triangles() if hasattr(me, 'calc_loop_triangles') else None
    normals = []
    li = 0
    for poly in me.polygons:
        for k in poly.loop_indices:
            o = outw[li] if li < len(outw) else None; li += 1
            normals.append(tuple(o) if o is not None else tuple(me.vertices[me.loops[k].vertex_index].normal))
    me.normals_split_custom_set(normals)
    return ob


def bake_foliage_ao(ob, ao_floor=.6):
    import numpy as np
    me = ob.data
    ao = me.color_attributes.new('ao', 'FLOAT_COLOR', 'CORNER'); me.color_attributes.active_color = ao
    mat = bpy.data.materials.new(ob.name + '_tmp'); mat.use_nodes = True; me.materials.append(mat)
    select_only([ob]); bpy.ops.object.bake(type='AO', target='VERTEX_COLORS')
    n = len(me.loops); a = np.empty(n * 4, np.float32); ao.data.foreach_get('color', a); a = a.reshape(n, 4)
    t = np.empty(n * 4, np.float32); me.color_attributes['tint'].data.foreach_get('color', t); t = t.reshape(n, 4)
    k = ao_floor + (1 - ao_floor) * a[:, :1]
    t[:, :3] *= k
    out = me.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER'); out.data.foreach_set('color', t.ravel())
    for nm in ('ao', 'tint'): me.color_attributes.remove(me.color_attributes[nm])
    me.color_attributes.active_color = me.color_attributes['Col']; me.color_attributes.render_color_index = 0
    me.materials.clear()
    fm = bpy.data.materials.new(ob.name + '_leaf'); fm.use_nodes = True; nt = fm.node_tree; b = nt.nodes['Principled BSDF']
    ca = nt.nodes.new('ShaderNodeVertexColor'); ca.layer_name = 'Col'; nt.links.new(ca.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = .65
    me.materials.append(fm)


def export(objs, path):
    select_only(objs)
    kw = dict(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_normals=True, export_texcoords=True, export_materials='EXPORT', export_image_format='JPEG', export_yup=True)
    props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    if 'export_vertex_color' in props: kw['export_vertex_color'] = 'MATERIAL'
    if 'export_attributes' in props: kw['export_attributes'] = False
    bpy.ops.export_scene.gltf(**kw)
    print('wrote', path, os.path.getsize(path) // 1024, 'KB')


# ---------------------------------------------------------------------
def build_tree(i):
    reset(); rnd = random.Random(1000 + i * 77); s = 1.0
    verts, radii, edges, crowns = skeleton(rnd, s)
    trunk = make_trunk(f'tree{i}_bark', verts, radii, edges)
    leaves = make_foliage(f'tree{i}_leaves', rnd, crowns, 4200, leaf_len=.24, crown_r=.82 * s)
    bake_bark(trunk, f'tree{i}')     # (the leaves are in the scene, so they shade the bark)
    bake_foliage_ao(leaves)
    export([trunk, leaves], os.path.join(OUT, f'tree_{i}.glb'))


def build_bush(i):
    reset(); rnd = random.Random(5000 + i * 31)
    crowns = [Vector((rnd.uniform(-.35, .35), rnd.uniform(-.25, .25), .32 + rnd.uniform(0, .15))) for _ in range(4)]
    leaves = make_foliage(f'bush{i}', rnd, crowns, 1100, leaf_len=.15, crown_r=.42, squash=.8)
    # a ground plane so the bottom of the bush is shaded like it sits on the lawn
    bpy.ops.mesh.primitive_plane_add(size=6, location=(0, 0, 0)); ground = bpy.context.active_object
    bake_foliage_ao(leaves)
    bpy.data.objects.remove(ground)
    export([leaves], os.path.join(OUT, f'bush_{i}.glb'))


# ---------------------------------------------------------------------
# SEAMLESS COBBLESTONES: 4D Voronoi on a torus (u, v -> cos/sin pairs), baked
# ---------------------------------------------------------------------
def build_cobble(res=1024):
    import numpy as np
    reset()
    bpy.ops.mesh.primitive_plane_add(size=1); pl = bpy.context.active_object
    m = bpy.data.materials.new('cob'); m.use_nodes = True; nt = m.node_tree; N = nt.nodes; L = nt.links
    for n in list(N): N.remove(n)
    outn = N.new('ShaderNodeOutputMaterial'); em = N.new('ShaderNodeEmission'); L.new(em.outputs[0], outn.inputs['Surface'])
    uv = N.new('ShaderNodeUVMap'); sep = N.new('ShaderNodeSeparateXYZ'); L.new(uv.outputs['UV'], sep.inputs[0])

    def trig(src, op):
        mul = N.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = math.tau; L.new(src, mul.inputs[0])
        f = N.new('ShaderNodeMath'); f.operation = op; L.new(mul.outputs[0], f.inputs[0]); return f.outputs[0]
    cu, su, cv, sv = trig(sep.outputs['X'], 'COSINE'), trig(sep.outputs['X'], 'SINE'), trig(sep.outputs['Y'], 'COSINE'), trig(sep.outputs['Y'], 'SINE')
    comb = N.new('ShaderNodeCombineXYZ'); L.new(cu, comb.inputs[0]); L.new(su, comb.inputs[1]); L.new(cv, comb.inputs[2])

    def vor(feature, scale, rand=.85):
        v = N.new('ShaderNodeTexVoronoi'); v.voronoi_dimensions = '4D'; v.feature = feature; v.inputs['Scale'].default_value = scale; v.inputs['Randomness'].default_value = rand
        L.new(comb.outputs[0], v.inputs['Vector']); L.new(sv, v.inputs['W']); return v
    edge = vor('DISTANCE_TO_EDGE', 1.15); cell = vor('F1', 1.15)
    noi = N.new('ShaderNodeTexNoise'); noi.noise_dimensions = '4D'; noi.inputs['Scale'].default_value = 9; noi.inputs['Detail'].default_value = 10; L.new(comb.outputs[0], noi.inputs['Vector']); L.new(sv, noi.inputs['W'])
    # height: rounded stone tops from the distance to the cell edge, with a little surface grain
    sm = N.new('ShaderNodeMapRange'); sm.inputs['From Min'].default_value = .0; sm.inputs['From Max'].default_value = .16; L.new(edge.outputs['Distance'], sm.inputs['Value'])
    pw = N.new('ShaderNodeMath'); pw.operation = 'POWER'; pw.inputs[1].default_value = .45; L.new(sm.outputs['Result'], pw.inputs[0])
    gr = N.new('ShaderNodeMath'); gr.operation = 'MULTIPLY_ADD'; gr.inputs[1].default_value = .12; L.new(noi.outputs['Fac'], gr.inputs[0]); L.new(pw.outputs[0], gr.inputs[2])
    img_h = bpy.data.images.new('cob_h', res, res, float_buffer=True); img_c = bpy.data.images.new('cob_c', res, res)
    pl.data.materials.append(m)

    def bake_emit(src, img):
        L.new(src, em.inputs['Color']); node = N.new('ShaderNodeTexImage'); node.image = img; N.active = node
        select_only([pl]); bpy.ops.object.bake(type='EMIT', margin=0); N.remove(node)
    bake_emit(gr.outputs[0], img_h)
    # colour: each stone its own warm pastel stone tone, darker mortar, speckles
    ramp = N.new('ShaderNodeValToRGB'); E = ramp.color_ramp.elements; E[0].position = 0; E[0].color = (.62, .50, .40, 1); E[1].position = 1; E[1].color = (.86, .76, .70, 1)
    m1 = E.new(.35); m1.color = (.80, .66, .60, 1); m2 = E.new(.7); m2.color = (.74, .66, .52, 1)
    sepc = N.new('ShaderNodeSeparateColor'); L.new(cell.outputs['Color'], sepc.inputs[0]); L.new(sepc.outputs[0], ramp.inputs['Fac'])
    bake_emit(ramp.outputs['Color'], img_c)
    H = img_pixels(img_h)[..., 0].astype('float64'); C = img_pixels(img_c)[..., :3].astype('float64')
    # mortar darkening + ambient occlusion from the height (lower = darker), speckle grain
    occl = np.clip(H / .55, 0, 1) ** .6
    C = C * (.42 + .58 * occl)[..., None]
    mortar = (.33, .28, .25); mk = np.clip((.18 - H) / .18, 0, 1)[..., None]
    C = C * (1 - mk) + np.array(mortar) * mk
    # normal map from the (perfectly periodic) height
    hx = (np.roll(H, -1, 1) - np.roll(H, 1, 1)) * .5 * res * .035; hy = (np.roll(H, -1, 0) - np.roll(H, 1, 0)) * .5 * res * .035
    nz = 1 / np.sqrt(hx * hx + hy * hy + 1); nx, ny = -hx * nz, -hy * nz
    rough = .55 + .4 * (1 - occl)
    from PIL import Image
    def save(arr, name):  # Blender images are bottom-up
        Image.fromarray((np.clip(arr, 0, 1)[::-1] * 255 + .5).astype('uint8')).save(os.path.join(OUT, name))
    lin2s = lambda x: np.where(x <= .0031308, x * 12.92, 1.055 * np.power(np.clip(x, 0, None), 1 / 2.4) - .055)
    save(lin2s(C), 'cobble_col.png'); save(np.stack([nx * .5 + .5, ny * .5 + .5, nz * .5 + .5], -1), 'cobble_nrm.png'); save(rough, 'cobble_rough.png')
    print('cobble done')


if __name__ == '__main__':
    if ONLY in ('', 'cobble'): build_cobble()
    if ONLY in ('', 'trees'):
        for i in range(int(os.environ.get('NTREES', 3))): build_tree(i)
    if ONLY in ('', 'bushes'):
        for i in range(2): build_bush(i)
