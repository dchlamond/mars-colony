"""Original Ares Atlas G-01 sealed greenhouse, authored in Blender through MCP.

Loads geometry helpers from the adjacent H-01 authoring source. Creates an isolated
scene and exports only its asset collection; existing scenes and files are preserved.
"""
from pathlib import Path
import math
import bpy
import bmesh
from mathutils import Vector

BASE = Path(globals().get('ARES_REPO') or (Path(__file__).resolve().parents[2] if '__file__' in globals() else Path.cwd()))
exec((BASE / 'art/blender/build_ares_habitat.py').read_text())


def build_ares_greenhouse():
    scene = bpy.data.scenes.new('Ares Atlas / G-01 sealed greenhouse')
    bpy.context.window.scene = scene
    asset = bpy.data.collections.new('ARES G01 / exportable asset')
    stage = bpy.data.collections.new('ARES G01 / presentation only')
    scene.collection.children.link(asset)
    scene.collection.children.link(stage)
    mats = {
        'ivory': _material('G01 / pressure ceramic', (.78, .72, .59), .15, .4),
        'brass': _material('G01 / satin brass ribs', (.5, .29, .095), .75, .31),
        'dark': _material('G01 / charcoal seals', (.025, .04, .045), .2, .6),
        'glass': _material('G01 / sealed glazing', (.16, .26, .22), .05, .18),
        'green': _material('G01 / hydroponic leaves', (.10, .23, .045), 0, .72),
        'leaf_light': _material('G01 / young leaves', (.28, .38, .055), 0, .72),
        'lamp': _material('G01 / grow lamps', (.9, .57, .22), .05, .4,
                          emission=((1, .7, .35), .6)),
        'soil': _material('G01 / regolith', (.22, .071, .027), 0, .92),
        'rock': _material('G01 / basalt', (.1, .055, .036), 0, .94),
    }
    glass = mats['glass']
    glass.diffuse_color = (.16, .26, .22, .20)
    glass.node_tree.nodes.get('Principled BSDF').inputs['Alpha'].default_value = .20
    if hasattr(glass, 'surface_render_method'):
        glass.surface_render_method = 'DITHERED'
    root = bpy.data.objects.new('ARES_G01', None)
    asset.objects.link(root)
    root['asset_id'] = 'G-01 sealed greenhouse'
    root['provenance'] = 'Original artistic architecture; not a NASA habitat design'
    _box('G01 / foundation', (5.8, 3.45, .20), (0, 0, .1), asset, mats['dark'], bevel=.055)
    _box('G01 / brass rim', (5.7, 3.35, .08), (0, 0, .24), asset, mats['brass'], bevel=.035)
    _box('G01 / sealed pressure floor', (5.55, 3.2, .12), (0, 0, .32), asset, mats['ivory'], bevel=.03)
    radius, base, half_length = 1.5, .40, 2.65
    for i in range(11):
        x = -half_length + i * (2 * half_length / 10)
        points = [(x, radius * math.cos(math.pi*j/40), base + radius*math.sin(math.pi*j/40)) for j in range(41)]
        _tube('G01 / arch rib %02d' % i, points, .037, asset, mats['brass'], sides=6)
    for i in range(7):
        a = math.pi * i / 6
        _tube('G01 / longitudinal rail %02d' % i,
              [(-half_length, radius*math.cos(a), base+radius*math.sin(a)),
               (half_length, radius*math.cos(a), base+radius*math.sin(a))],
              .02, asset, mats['brass'], sides=6)
    # Individually sealed curved roof panes, with closed end walls.
    vertices, faces = [], []
    for x in (-half_length, half_length):
        for j in range(41):
            a=math.pi*j/40
            vertices.append((x, radius*math.cos(a), base+radius*math.sin(a)))
    for j in range(40):
        faces.append((j,j+1,42+j,41+j))
    faces.append(tuple(range(40,-1,-1)))
    faces.append(tuple(range(41,82)))
    _mesh('G01 / sealed roof and end glazing', vertices, faces, asset, glass, smooth=True)
    for side in (-1,1):
        y=side*.83
        _box('G01 / hydroponic bed', (4.8,.72,.25), (0,y,.55),asset,mats['ivory'],bevel=.04)
        _box('G01 / dark grow insert', (4.65,.63,.035), (0,y,.69),asset,mats['dark'],bevel=.01)
        _tube('G01 / irrigation pipe', [(-2.4,y,.71),(2.4,y,.71)], .028, asset, mats['brass'],sides=6)
        for row in range(12):
            x=-2.2+row*.4
            for leaf in range(4):
                angle=leaf*math.pi/2+row*.27
                start=Vector((x,y,.73));middle=start+Vector((math.cos(angle)*.14,math.sin(angle)*.12,.17))
                tip=start+Vector((math.cos(angle)*.21,math.sin(angle)*.18,.13))
                sideways=Vector((-math.sin(angle)*.07,math.cos(angle)*.07,0))
                verts=[tuple(start),tuple(middle+sideways),tuple(tip),tuple(middle-sideways),tuple(middle+Vector((0,0,.025)))]
                _mesh('G01 / lettuce leaf',verts,[(0,1,4),(1,2,4),(2,3,4),(3,0,4)],asset,mats['green' if row%3 else 'leaf_light'],smooth=True)
        _box('G01 / overhead light bar', (4.7,.07,.045),(0,y,1.48),asset,mats['lamp'],bevel=.01)
    # A sealed vestibule projects from one end. No crops exist outside the shell.
    _box('G01 / airlock chamber', (.88,1.08,1.22), (3.02,0,.97),asset,mats['ivory'],bevel=.13)
    _box('G01 / hatch brass frame', (.055,.83,1.02), (3.48,0,.94),asset,mats['brass'],bevel=.09)
    _box('G01 / sealed hatch', (.058,.65,.86), (3.52,0,.94),asset,mats['dark'],bevel=.07)
    _box('G01 / hatch window', (.06,.38,.24), (3.56,0,1.12),asset,mats['lamp'],bevel=.045)
    for i in range(3):
        _box('G01 / entry step', (.23,.96,.08), (3.54+i*.2,0,.36-i*.095),asset,mats['brass'],bevel=.015)
    for side in (-1,1):
        _tube('G01 / entry railing',[(3.28,side*.52,.92),(3.72,side*.52,.77),(4.04,side*.52,.62)],.026,asset,mats['brass'],sides=8)
        _tube('G01 / rail post',[(3.8,side*.52,.2),(3.8,side*.52,.73)],.022,asset,mats['brass'],sides=8)
    for y in (-.55,.55):
        _box('G01 / climate control cabinet', (.4,.42,.8), (-2.92,y,.75),asset,mats['ivory'],bevel=.045)
        for i in range(7):
            _box('G01 / radiator vane', (.08,.34,.025),(-3.14,y,.48+i*.07),asset,mats['dark'],bevel=.004)
    for obj in asset.objects:
        if obj != root:
            obj.parent=root
    scene['ares_asset_collection']=asset.name
    _presentation(scene,stage,mats)
    scene.camera.location=(10,-10,7)
    _look_at(scene.camera,(.3,0,.8))
    scene.camera.data.ortho_scale=9
    return {'scene':scene.name,'collection':asset.name,'materials':len(mats),'description':'Sealed original greenhouse with airlock, irrigation, interior crop beds and climate equipment'}


result=build_ares_greenhouse()
result['export']=export_asset_glb(BASE/'game/assets/ares/greenhouse-g01.glb',result['scene'])
result['blend']=save_asset_blend(BASE/'art/blender/exports/ares-greenhouse-g01.blend',result['scene'])
scene=bpy.data.scenes[result['scene']]
for obj in scene.objects:
    if obj.type=='MESH' and obj.name.startswith('Presentation /'):
        obj.hide_render=True
scene.render.film_transparent=True
scene.render.resolution_x=scene.render.resolution_y=384
result['preview']=render_preview(BASE/'game/assets/ares/green-preview.png',result['scene'])
