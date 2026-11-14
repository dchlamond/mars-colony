"""Ares Atlas H-01: an original modular habitat prototype for Blender 5.2.

This module only defines helpers. It does not build, render, save, or delete
anything on import. From Blender MCP's execute_blender_code:

    exec(open(SCRIPT_PATH).read())
    result = build_ares_habitat()

The new presentation scene becomes active. Existing scenes are untouched.
Optional helpers: save_asset_blend(path), export_asset_glb(path), render_preview(path).
Use the returned names, or the module's LAST_BUILD, to identify this build.

Procedural micro-grain in the Blender materials is a preview detail. The GLB
contains their base colours / metalness / roughness; production texture baking
and target-device profiling remain necessary. No claim of completed AAA art.
"""

from pathlib import Path
import math
import random
import bpy
import bmesh
from mathutils import Vector
from mathutils.noise import noise_vector


LAST_BUILD = None
TAU = math.tau


def _mesh(name, verts, faces, collection, material=None, smooth=False):
    data = bpy.data.meshes.new(name)
    data.from_pydata(verts, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    collection.objects.link(obj)
    if material:
        data.materials.append(material)
    for polygon in data.polygons:
        polygon.use_smooth = smooth
    return obj


def _bevel(obj, width=0.025, segments=2):
    mod = obj.modifiers.new('Machined edge radii', 'BEVEL')
    mod.width = width
    mod.segments = segments
    mod.limit_method = 'ANGLE'
    mod.angle_limit = 0.5
    return obj


def _material(name, colour, metallic, roughness, grain=False, emission=None):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*colour, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*colour, 1)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    if grain:
        noise = mat.node_tree.nodes.new('ShaderNodeTexNoise')
        noise.label = 'Fine finish — bake for production export'
        noise.inputs['Scale'].default_value = 155
        noise.inputs['Detail'].default_value = 2
        bump = mat.node_tree.nodes.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = 0.06
        bump.inputs['Distance'].default_value = 0.004
        mat.node_tree.links.new(noise.outputs['Fac'], bump.inputs['Height'])
        mat.node_tree.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    if emission:
        bsdf.inputs['Emission Color'].default_value = (*emission[0], 1)
        bsdf.inputs['Emission Strength'].default_value = emission[1]
    return mat


def _box(name, dimensions, location, collection, material, rotation=0, bevel=0.02):
    dx, dy, dz = (d / 2 for d in dimensions)
    vertices = [(x, y, z) for x in (-dx, dx) for y in (-dy, dy) for z in (-dz, dz)]
    faces = [(0, 4, 6, 2), (1, 3, 7, 5), (0, 1, 5, 4),
             (2, 6, 7, 3), (0, 2, 3, 1), (4, 5, 7, 6)]
    obj = _mesh(name, vertices, faces, collection, material)
    obj.location = location
    obj.rotation_euler.z = rotation
    if bevel:
        _bevel(obj, bevel)
    return obj


def _lathe(name, profile, collection, material, segments=64, closed=False):
    """Revolve a radial/z profile. Winding is explicit for consistent normals."""
    verts = [(r * math.cos(TAU * j / segments), r * math.sin(TAU * j / segments), z)
             for r, z in profile for j in range(segments)]
    faces = []
    row_count = len(profile) if closed else len(profile) - 1
    for row in range(row_count):
        next_row = (row + 1) % len(profile)
        for j in range(segments):
            k = (j + 1) % segments
            faces.append((row * segments + j, row * segments + k,
                          next_row * segments + k, next_row * segments + j))
    return _mesh(name, verts, faces, collection, material, smooth=True)


def _tube(name, points, radius, collection, material, sides=6, closed=False):
    """Small engineering ribs and pipes; polygon budget is intentionally bounded."""
    points = [Vector(p) for p in points]
    verts, faces = [], []
    for i, p in enumerate(points):
        prev = points[(i - 1) % len(points)] if closed or i else p
        nxt = points[(i + 1) % len(points)] if closed or i < len(points) - 1 else p
        direction = (nxt - prev).normalized()
        guide = Vector((0, 0, 1)) if abs(direction.z) < .94 else Vector((1, 0, 0))
        u = direction.cross(guide).normalized()
        v = direction.cross(u).normalized()
        for j in range(sides):
            a = TAU * j / sides
            verts.append(tuple(p + radius * (math.cos(a) * u + math.sin(a) * v)))
    for i in range(len(points) if closed else len(points) - 1):
        nxt = (i + 1) % len(points)
        for j in range(sides):
            k = (j + 1) % sides
            faces.append((i * sides + j, i * sides + k, nxt * sides + k, nxt * sides + j))
    if not closed:
        faces += [tuple(reversed(range(sides))), tuple((len(points) - 1) * sides + j for j in range(sides))]
    return _mesh(name, verts, faces, collection, material, smooth=True)


def _ring(name, radius, z, minor, collection, material, segments=64):
    points = [(radius * math.cos(TAU * i / segments), radius * math.sin(TAU * i / segments), z)
              for i in range(segments)]
    return _tube(name, points, minor, collection, material, closed=True)


def _rounded_profile(width, height, radius, samples=4):
    pts = []
    for cx, cy, start in ((width / 2 - radius, height / 2 - radius, 0),
                          (-width / 2 + radius, height / 2 - radius, math.pi / 2),
                          (-width / 2 + radius, -height / 2 + radius, math.pi),
                          (width / 2 - radius, -height / 2 + radius, 3 * math.pi / 2)):
        for j in range(samples):
            angle = start + math.pi / 2 * j / (samples - 1)
            pts.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle)))
    return pts


def _window(name, angle, collection, mats):
    outer = _rounded_profile(.79, 1.02, .16)
    inner = _rounded_profile(.64, .87, .12)
    n = len(outer)
    def position(u, v, radius):
        theta = angle + u / radius
        return (radius * math.cos(theta), radius * math.sin(theta), 1.22 + v)
    vertices = [position(u, v, rad) for profile, rad in ((outer, 2.285), (inner, 2.29),
                                                       (outer, 2.22), (inner, 2.22)) for u, v in profile]
    faces = []
    for i in range(n):
        j = (i + 1) % n
        faces.extend(((i, j, n + j, n + i), (i, 2 * n + i, 2 * n + j, j),
                      (n + i, n + j, 3 * n + j, 3 * n + i)))
    frame = _mesh(name + ' / pressure frame', vertices, faces, collection, mats['brass'])
    _bevel(frame, .008)
    pane_verts = [position(0, 0, 2.28)] + [position(u, v, 2.28) for u, v in inner]
    pane_faces = [(0, i + 1, (i + 1) % n + 1) for i in range(n)]
    _mesh(name + ' / amber glazing', pane_verts, pane_faces, collection, mats['glass'], smooth=True)
    loc = (2.276 * math.cos(angle), 2.276 * math.sin(angle), 1.22)
    _box(name + ' / mullion', (.026, .045, .83), loc, collection, mats['dark'], angle + math.pi / 2, .006)
    for offset in (-.26, .02, .29):
        z = 1.22 + offset
        p = (2.273 * math.cos(angle), 2.273 * math.sin(angle), z)
        _box(name + ' / internal shelf', (.60, .025, .022), p, collection, mats['bronze'], angle + math.pi / 2, .004)


def _dome_panels(collection, mats):
    verts, faces, material_ids = [], [], []
    rings, sectors, along, across = 4, 16, 3, 4
    for row in range(rings):
        low = row * 1.38 / rings + .004
        high = (row + 1) * 1.38 / rings - .004
        for sector in range(sectors):
            left = TAU * sector / sectors + .003
            right = TAU * (sector + 1) / sectors - .003
            base = len(verts)
            for layer in range(2):
                inset = .032 * layer
                for iy in range(along + 1):
                    t = low + (high - low) * iy / along
                    for ix in range(across + 1):
                        a = left + (right - left) * ix / across
                        r = (2.285 - inset) * math.cos(t)
                        verts.append((r * math.cos(a), r * math.sin(a), 1.88 + (1.69 - inset) * math.sin(t)))
            layer_size = (along + 1) * (across + 1)
            material_id = (sector + row * 3) % 3
            for iy in range(along):
                for ix in range(across):
                    a = base + iy * (across + 1) + ix
                    quad = (a, a + 1, a + across + 2, a + across + 1)
                    faces.extend((quad, tuple(v + layer_size for v in reversed(quad))))
                    material_ids.extend((material_id, material_id))
            rim = list(range(across + 1))
            rim += [j * (across + 1) + across for j in range(1, along + 1)]
            rim += [along * (across + 1) + j for j in reversed(range(across))]
            rim += [j * (across + 1) for j in reversed(range(1, along))]
            for i, a in enumerate(rim):
                b = rim[(i + 1) % len(rim)]
                faces.append((base + a, base + a + layer_size, base + b + layer_size, base + b))
                material_ids.append(material_id)
    obj = _mesh('H01 / segmented ceramic pressure shell', verts, faces, collection, smooth=True)
    for mat in mats['ceramic']:
        obj.data.materials.append(mat)
    for poly, idx in zip(obj.data.polygons, material_ids):
        poly.material_index = idx
    _bevel(obj, .008, 2)
    for s in range(sectors):
        angle = TAU * s / sectors
        pts = [(2.293 * math.cos(t) * math.cos(angle), 2.293 * math.cos(t) * math.sin(angle),
                1.88 + 1.698 * math.sin(t)) for t in [i * 1.38 / 12 for i in range(13)]]
        _tube('H01 / meridian seam %02d' % s, pts, .014, collection, mats['brass'])
    for i in range(1, rings):
        t = i * 1.38 / rings
        _ring('H01 / latitude seam %02d' % i, 2.294 * math.cos(t), 1.88 + 1.698 * math.sin(t),
              .014, collection, mats['brass'])


def _look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()


def _presentation(scene, collection, mats):
    grid, half = 100, 22
    vertices, faces = [], []
    for y in range(grid + 1):
        for x in range(grid + 1):
            px, py = (x / grid * 2 - 1) * half, (y / grid * 2 - 1) * half
            distance = math.hypot(px, py)
            amplitude = min(1, max(0, (distance - 3.8) / 2.8))
            broad = noise_vector(Vector((px * .23, py * .23, 8.1))).z
            fine = noise_vector(Vector((px * 1.5, py * 1.5, 3.7))).z
            height = -.12 + amplitude * (.48 * broad + .09 * fine + .035 * math.sin(px * 3 + py * 2))
            vertices.append((px, py, height))
    for y in range(grid):
        for x in range(grid):
            a = y * (grid + 1) + x
            faces.append((a, a + 1, a + grid + 2, a + grid + 1))
    _mesh('Presentation / regolith', vertices, faces, collection, mats['soil'], smooth=True)
    random.seed(41)
    for i in range(27):
        angle, radius = random.random() * TAU, random.uniform(4.1, 8)
        size = random.uniform(.07, .3)
        x, y = radius * math.cos(angle), radius * math.sin(angle)
        # Irregular fractured basalt: varied shape and orientation, never a repeated stump.
        data = bpy.data.meshes.new('Ares basalt fragment')
        bm = bmesh.new()
        bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1)
        for vertex in bm.verts:
            variation = 1 + .20 * noise_vector(vertex.co * 2.7 + Vector((i, .8, 2.3))).z
            vertex.co.x *= size * random.uniform(.90, 1.15) * variation
            vertex.co.y *= size * random.uniform(.75, 1.30) * variation
            vertex.co.z *= size * .63 * variation
            vertex.co.z = max(vertex.co.z, -size * .38)
        bm.to_mesh(data)
        bm.free()
        data.materials.append(mats['rock'])
        rock = bpy.data.objects.new('Presentation / basalt %02d' % i, data)
        collection.objects.link(rock)
        amplitude = min(1, max(0, (radius - 3.8) / 2.8))
        broad = noise_vector(Vector((x * .23, y * .23, 8.1))).z
        fine = noise_vector(Vector((x * 1.5, y * 1.5, 3.7))).z
        ground_z = -.12 + amplitude * (.48 * broad + .09 * fine + .035 * math.sin(x * 3 + y * 2))
        rock.location = (x, y, ground_z + size * .20)
        rock.rotation_euler.z = random.random() * TAU
    world = bpy.data.worlds.new('Ares / dusty ambient sky')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs[0].default_value = (.32, .38, .48, 1)
    world.node_tree.nodes['Background'].inputs[1].default_value = .38
    scene.world = world
    for name, kind, location, energy, colour, size in (
            ('Key / late afternoon sun', 'SUN', (-6, -4, 9), 2.4, (1, .80, .57), .12),
            ('Fill / open sky', 'AREA', (4, 2, 7), 480, (.65, .78, 1), 7),
            ('Rim / reflected warm light', 'AREA', (-5, 3, 5), 360, (1, .68, .39), 5)):
        data = bpy.data.lights.new(name, kind)
        data.energy, data.color = energy, colour
        if kind == 'SUN':
            data.angle = size
        else:
            data.shape, data.size = 'DISK', size
        obj = bpy.data.objects.new(name, data)
        collection.objects.link(obj)
        obj.location = location
        _look_at(obj, (0, 0, 1))
    data = bpy.data.cameras.new('Ares / habitat presentation')
    camera = bpy.data.objects.new('Ares / habitat presentation', data)
    collection.objects.link(camera)
    camera.location = (8.5, -11.8, 8.4)
    _look_at(camera, (0, -.45, 1.3))
    data.type, data.ortho_scale = 'ORTHO', 9.8
    scene.camera = camera
    try:
        scene.render.engine = 'BLENDER_EEVEE'
    except TypeError:
        scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x, scene.render.resolution_y = 1200, 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.film_transparent = False
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.view_settings.exposure = .1


def build_ares_habitat():
    """Create an isolated, original H-01 prototype and make its scene active."""
    global LAST_BUILD
    if bpy.context.window is None:
        raise RuntimeError('Use interactive Blender for this presentation-scene build.')
    scene = bpy.data.scenes.new('Ares Atlas / H-01 habitat prototype')
    scene.unit_settings.system = 'METRIC'
    bpy.context.window.scene = scene
    asset = bpy.data.collections.new('ARES H01 / exportable asset')
    stage = bpy.data.collections.new('ARES H01 / presentation only')
    scene.collection.children.link(asset)
    scene.collection.children.link(stage)
    mats = {
        'ceramic': [_material('ARES / ivory ceramic %d' % i, c, .12, .37, grain=True)
                    for i, c in enumerate(((.75, .68, .53), (.81, .74, .60), (.72, .66, .53)))],
        'brass': _material('ARES / satin brass', (.50, .29, .095), .82, .27, grain=True),
        'bronze': _material('ARES / dark bronze structure', (.16, .105, .055), .78, .37),
        'dark': _material('ARES / charcoal seals', (.026, .031, .034), .28, .5),
        'glass': _material('ARES / warm occupied windows', (.19, .095, .024), .15, .21,
                           emission=((1.0, .46, .09), .58)),
        'navy': _material('ARES / navy enamel', (.018, .055, .081), .35, .28),
        'status': _material('ARES / status light', (.05, .35, .4), .15, .3,
                            emission=((.1, .7, .8), 1.5)),
        'soil': _material('ARES / regolith', (.22, .071, .027), 0, .92, grain=True),
        'rock': _material('ARES / basalt fragments', (.10, .055, .036), 0, .94),
    }
    # Multiscale mineral colour and fine regolith relief for the presentation ground.
    soil_nodes = mats['soil'].node_tree.nodes
    soil_links = mats['soil'].node_tree.links
    soil_bsdf = soil_nodes.get('Principled BSDF')
    coordinates = soil_nodes.new('ShaderNodeTexCoord')
    macro = soil_nodes.new('ShaderNodeTexNoise')
    macro.inputs['Scale'].default_value = .8
    macro.inputs['Detail'].default_value = 5
    soil_links.new(coordinates.outputs['Object'], macro.inputs['Vector'])
    ramp = soil_nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = .22
    ramp.color_ramp.elements[0].color = (.055, .015, .008, 1)
    ramp.color_ramp.elements[1].position = .79
    ramp.color_ramp.elements[1].color = (.31, .12, .047, 1)
    ramp.color_ramp.elements.new(.48).color = (.16, .048, .018, 1)
    soil_links.new(macro.outputs['Fac'], ramp.inputs['Fac'])
    soil_links.new(ramp.outputs['Color'], soil_bsdf.inputs['Base Color'])
    grit = soil_nodes.new('ShaderNodeTexNoise')
    grit.inputs['Scale'].default_value = 42
    grit.inputs['Detail'].default_value = 3
    soil_links.new(coordinates.outputs['Object'], grit.inputs['Vector'])
    bump = soil_nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = .36
    bump.inputs['Distance'].default_value = .07
    soil_links.new(grit.outputs['Fac'], bump.inputs['Height'])
    soil_links.new(bump.outputs['Normal'], soil_bsdf.inputs['Normal'])
    # Angle-dependent warm glazing with a cooler glossy surface, rather than flat yellow fill.
    glass_nodes = mats['glass'].node_tree.nodes
    glass_links = mats['glass'].node_tree.links
    glass_bsdf = glass_nodes.get('Principled BSDF')
    glass_bsdf.inputs['Base Color'].default_value = (.035, .049, .055, 1)
    glass_bsdf.inputs['Metallic'].default_value = .32
    glass_bsdf.inputs['Roughness'].default_value = .13
    glass_bsdf.inputs['Coat Weight'].default_value = .5
    glass_bsdf.inputs['Coat Roughness'].default_value = .09
    glass_bsdf.inputs['Emission Strength'].default_value = .32
    facing = glass_nodes.new('ShaderNodeLayerWeight')
    glow = glass_nodes.new('ShaderNodeValToRGB')
    glow.color_ramp.elements[0].color = (.48, .20, .037, 1)
    glow.color_ramp.elements[1].color = (.035, .014, .006, 1)
    glass_links.new(facing.outputs['Facing'], glow.inputs['Fac'])
    glass_links.new(glow.outputs['Color'], glass_bsdf.inputs['Emission Color'])
    root = bpy.data.objects.new('ARES_H01_ROOT', None)
    asset.objects.link(root)
    root['asset_role'] = 'Modular pressurized habitat; fictional engineering concept'
    root['art_direction'] = 'Ares Atlas / selected reference 2026-11-14'
    root['production_status'] = 'First asset prototype; art and performance review required'
    _lathe('H01 / foundation plinth', [(0, .03), (2.65, .03), (2.76, .12),
           (2.76, .25), (2.64, .32), (0, .32)], asset, mats['bronze'])
    _lathe('H01 / service deck', [(2.22, .31), (2.92, .31), (2.96, .36),
           (2.96, .43), (2.90, .48), (2.22, .48)], asset, mats['dark'], closed=True)
    _ring('H01 / deck brass lip', 2.935, .44, .025, asset, mats['brass'])
    _lathe('H01 / pressure wall', [(0, .43), (2.20, .43), (2.25, .54),
           (2.25, 1.83), (2.20, 1.91), (0, 1.91)], asset, mats['ceramic'][0])
    _ring('H01 / lower pressure seam', 2.255, .57, .045, asset, mats['brass'])
    _ring('H01 / upper pressure seam', 2.276, 1.86, .052, asset, mats['brass'])
    for i in range(16):
        a = TAU * i / 16
        # Leave a forward sector free for the sealed airlock.
        if math.sin(a) > -.93:
            _window('H01 / window %02d' % i, a, asset, mats)
        a += math.pi / 16
        _tube('H01 / wall reinforcement %02d' % i,
              [(2.272 * math.cos(a), 2.272 * math.sin(a), z) for z in (.55, 1.84)],
              .026, asset, mats['bronze'], sides=6)
    _dome_panels(asset, mats)
    _lathe('H01 / roof service hatch', [(0, 3.52), (.47, 3.52), (.49, 3.56),
           (.49, 3.62), (.43, 3.67), (0, 3.67)], asset, mats['brass'], segments=48)
    _lathe('H01 / hatch ceramic insert', [(0, 3.665), (.37, 3.665), (.37, 3.69), (0, 3.69)],
           asset, mats['ceramic'][1], segments=48)
    _tube('H01 / roof hatch handle', [(-.14, 0, 3.7), (-.14, 0, 3.79),
          (.14, 0, 3.79), (.14, 0, 3.7)], .024, asset, mats['bronze'])
    # Three articulated ceramic sleeves around a sealed horizontal tunnel.
    direction = Vector((0, -1, 0)).to_track_quat('Z', 'Y')
    for i in range(3):
        sleeve = _lathe('H01 / airlock ceramic sleeve %02d' % i,
                       [(.49, 0), (.55, .035), (.57, .11), (.57, .30), (.55, .38), (.49, .41)],
                       asset, mats['ceramic'][i], segments=40)
        sleeve.rotation_mode = 'QUATERNION'
        sleeve.rotation_quaternion = direction
        sleeve.location = (0, -2.03 - i * .41, 1.12)
        ring = _ring('H01 / airlock pressure collar %02d' % i, .558, 0, .038, asset, mats['brass'], 40)
        ring.rotation_mode = 'QUATERNION'
        ring.rotation_quaternion = direction
        ring.location = (0, -2.03 - i * .41, 1.12)
    end = _lathe('H01 / sealed exterior door', [(0, 0), (.47, 0), (.53, .035),
                 (.53, .10), (.47, .14), (0, .14)], asset, mats['navy'], segments=48)
    end.rotation_mode, end.rotation_quaternion = 'QUATERNION', direction
    end.location = (0, -3.26, 1.12)
    ring = _ring('H01 / outer portal frame', .535, 0, .045, asset, mats['brass'], 48)
    ring.rotation_mode, ring.rotation_quaternion = 'QUATERNION', direction
    ring.location = (0, -3.37, 1.12)
    _box('H01 / door division', (.018, .022, .82), (0, -3.408, 1.12), asset, mats['bronze'], bevel=.004)
    _box('H01 / door status strip', (.04, .03, .14), (.30, -3.41, 1.12), asset, mats['status'], bevel=.008)
    for x in (-.12, .12):
        _tube('H01 / recessed door handle', [(x, -3.43, 1.02), (x, -3.47, 1.02),
              (x, -3.47, 1.21), (x, -3.43, 1.21)], .016, asset, mats['brass'])
    for index, (y, z, width, depth) in enumerate(((-3.48, .20, 1.30, .80), (-3.37, .38, 1.18, .56),
                                                (-3.23, .55, 1.08, .46))):
        _box('H01 / airlock tread %d' % index, (width, depth, .16), (0, y, z), asset, mats['bronze'], bevel=.035)
        _box('H01 / tread inset %d' % index, (width - .13, depth - .09, .012), (0, y, z + .086),
             asset, mats['dark'], bevel=.009)
    # Low service railing, with a generous opening at the airlock.
    points = [(2.82 * math.cos(a), 2.82 * math.sin(a), .94)
              for a in [(-math.pi / 2 + .37) + (TAU - .74) * i / 72 for i in range(73)]]
    _tube('H01 / service railing', points, .022, asset, mats['bronze'])
    for i in range(18):
        a = -math.pi / 2 + .40 + (TAU - .80) * i / 17
        _tube('H01 / railing post %02d' % i,
              [(2.82 * math.cos(a), 2.82 * math.sin(a), z) for z in (.47, .94)],
              .018, asset, mats['bronze'])
    # Short heat-exchanger fins add a recognizable technical service side.
    for i in range(7):
        _box('H01 / heat exchanger fin %02d' % i, (.055, .61, .45),
             (1.63 + i * .08, 1.32, .74), asset, mats['dark'], rotation=.48, bevel=.008)
    for obj in asset.objects:
        if obj != root:
            obj.parent = root
    _presentation(scene, stage, mats)
    depsgraph = bpy.context.evaluated_depsgraph_get()
    triangles = 0
    for obj in asset.objects:
        if obj.type == 'MESH':
            evaluated = obj.evaluated_get(depsgraph)
            mesh = evaluated.to_mesh()
            triangles += sum(len(p.vertices) - 2 for p in mesh.polygons)
            evaluated.to_mesh_clear()
    LAST_BUILD = {'scene': scene.name, 'asset_collection': asset.name,
                  'presentation_collection': stage.name, 'root': root.name,
                  'evaluated_asset_triangles': triangles,
                  'asset_objects': len(asset.objects),
                  'status': 'Unrendered asset prototype; requires visual and game-device review'}
    scene['ares_asset_collection'] = asset.name
    scene['ares_asset_triangles'] = triangles
    return LAST_BUILD


def _get_build(scene_name=None):
    scene = bpy.data.scenes.get(scene_name) if scene_name else bpy.context.scene
    if not scene or 'ares_asset_collection' not in scene:
        raise RuntimeError('Choose the Ares habitat scene, or pass its scene_name.')
    return scene, bpy.data.collections[scene['ares_asset_collection']]


def save_asset_blend(path, scene_name=None):
    """Write only this presentation scene and dependencies; preserve current file identity."""
    scene, _ = _get_build(scene_name)
    path = Path(path).expanduser().resolve()
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        raise FileExistsError('Refusing to overwrite an existing asset: %s' % path)
    bpy.data.libraries.write(str(path), {scene}, fake_user=True, compress=True)
    return str(path)


def export_asset_glb(path, scene_name=None):
    """Bake evaluated geometry into one mesh per material in a temporary scene.

    The authoring scene, individual parts, modifiers and selection are preserved.
    This reduces static habitat draw calls without decimating its silhouette.
    Only this function's temporary data-blocks are removed after export.
    """
    scene, collection = _get_build(scene_name)
    path = Path(path).expanduser().resolve()
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        raise FileExistsError('Refusing to overwrite an existing asset: %s' % path)
    if bpy.context.window is None:
        raise RuntimeError('Use interactive Blender for this export.')
    old_scene = bpy.context.window.scene
    staging_scene = staging_collection = None
    temporary_objects, temporary_meshes = [], []
    batches = {}
    source_mesh_count = 0
    try:
        bpy.context.window.scene = scene
        root = next((o for o in collection.objects if o.type == 'EMPTY' and o.parent is None), None)
        root_matrix = root.matrix_world.copy() if root else scene.cursor.matrix.copy()
        if root is None:
            root_matrix.identity()
        root_inverse = root_matrix.inverted_safe()
        depsgraph = bpy.context.evaluated_depsgraph_get()
        for source in collection.objects:
            if source.type != 'MESH':
                continue
            source_mesh_count += 1
            evaluated = source.evaluated_get(depsgraph)
            mesh = evaluated.to_mesh()
            try:
                transform = root_inverse @ evaluated.matrix_world
                normal_transform = transform.to_3x3().inverted_safe().transposed()
                mirrored = transform.to_3x3().determinant() < 0
                normals = mesh.corner_normals
                uv = mesh.uv_layers.active.data if mesh.uv_layers.active else None
                for polygon in mesh.polygons:
                    material = (mesh.materials[polygon.material_index]
                                if polygon.material_index < len(mesh.materials) else None)
                    key = material.as_pointer() if material else 0
                    batch = batches.setdefault(key, {
                        'material': material, 'verts': [], 'faces': [], 'lookup': {},
                        'smooth': [], 'normals': [], 'uvs': [], 'has_uv': False,
                    })
                    face, face_normals, face_uvs = [], [], []
                    loop_ids = list(polygon.loop_indices)
                    if mirrored:
                        loop_ids.reverse()
                    for loop_index in loop_ids:
                        vertex_index = mesh.loops[loop_index].vertex_index
                        vertex_key = (source.as_pointer(), vertex_index)
                        output_index = batch['lookup'].get(vertex_key)
                        if output_index is None:
                            output_index = len(batch['verts'])
                            batch['lookup'][vertex_key] = output_index
                            batch['verts'].append(tuple(transform @ mesh.vertices[vertex_index].co))
                        face.append(output_index)
                        n = normal_transform @ normals[loop_index].vector
                        face_normals.append(tuple(n.normalized()))
                        face_uvs.append(tuple(uv[loop_index].uv) if uv else (0.0, 0.0))
                    batch['faces'].append(tuple(face))
                    batch['smooth'].append(polygon.use_smooth)
                    batch['normals'].extend(face_normals)
                    batch['uvs'].extend(face_uvs)
                    batch['has_uv'] = batch['has_uv'] or uv is not None
            finally:
                evaluated.to_mesh_clear()
        staging_scene = bpy.data.scenes.new('ARES H01 / temporary export staging')
        staging_collection = bpy.data.collections.new('ARES H01 / material batches')
        staging_scene.collection.children.link(staging_collection)
        bpy.context.window.scene = staging_scene
        export_root = bpy.data.objects.new('ARES_H01_EXPORT', None)
        staging_collection.objects.link(export_root)
        export_root.matrix_world = root_matrix
        temporary_objects.append(export_root)
        if root:
            for key in root.keys():
                if key != '_RNA_UI':
                    export_root[key] = root[key]
        triangle_count = 0
        for index, batch in enumerate(batches.values()):
            material = batch['material']
            label = material.name if material else 'unassigned'
            obj = _mesh('H01 batch %02d / %s' % (index, label), batch['verts'],
                        batch['faces'], staging_collection, material)
            temporary_objects.append(obj)
            temporary_meshes.append(obj.data)
            obj.parent = export_root
            for polygon, smooth in zip(obj.data.polygons, batch['smooth']):
                polygon.use_smooth = smooth
                triangle_count += len(polygon.vertices) - 2
            # Preserve evaluated bevel/split shading across material boundaries.
            obj.data.normals_split_custom_set(batch['normals'])
            if batch['has_uv']:
                layer = obj.data.uv_layers.new(name='UVMap')
                for loop, value in zip(layer.data, batch['uvs']):
                    loop.uv = value
            obj.select_set(True)
        export_root.select_set(True)
        bpy.context.view_layer.objects.active = export_root
        bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB', use_selection=True,
                                  use_active_scene=True,
                                  export_apply=False, export_animations=False,
                                  export_cameras=False, export_lights=False,
                                  export_extras=True)
        return {
            'path': str(path),
            'source_mesh_objects': source_mesh_count,
            'export_meshes': len(batches),
            'material_batches': len(batches),
            'evaluated_triangles': triangle_count,
            'geometry_decimated': False,
            'notes': 'One mesh per material; Blender micro-grain needs production baking.',
        }
    finally:
        bpy.context.window.scene = old_scene
        for obj in temporary_objects:
            bpy.data.objects.remove(obj, do_unlink=True)
        for mesh in temporary_meshes:
            if mesh.users == 0:
                bpy.data.meshes.remove(mesh)
        if staging_scene:
            bpy.data.scenes.remove(staging_scene)
        if staging_collection and staging_collection.users == 0:
            bpy.data.collections.remove(staging_collection)


def render_preview(path, scene_name=None):
    """Explicit render helper; never invoked by build_ares_habitat()."""
    scene, _ = _get_build(scene_name)
    path = Path(path).expanduser().resolve()
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        raise FileExistsError('Refusing to overwrite an existing preview: %s' % path)
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True, scene=scene.name)
    return str(path)
