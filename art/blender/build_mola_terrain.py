"""Export the existing NASA MOLA relief through Blender without inventing heights.

The 8-bit, one-degree source is already embedded and credited in game/index.html.
Blender builds UVs and smooth normals. Runtime art detail is separate from the
measured global elevation. Run with Blender --background --python this_file.
"""
import base64
import json
import math
from pathlib import Path
import re
import bpy

ROOT = Path(globals().get('ARES_REPO', Path(__file__).resolve().parents[2]))
SOURCE = (ROOT / 'game/index.html').read_text()
DEM = base64.b64decode(re.search(r'const DEM_B64="([^"]+)"', SOURCE)[1])
PW, PH = math.sqrt(3) * 72.5, 62.0
X0, Z0 = -math.sqrt(3) / 2, -1.0

def height(u, v):
    u, v = u * 360 - .5, max(0, min(179, v * 180 - .5))
    x, y = math.floor(u), min(178, math.floor(v))
    fx, fy = u - x, v - y
    def g(a, b):
        return DEM[b * 360 + a % 360]
    return ((g(x,y)*(1-fx)+g(x+1,y)*fx)*(1-fy) +
            (g(x,y+1)*(1-fx)+g(x+1,y+1)*fx)*fy) * 5.5 / 255

def build(nx, ny, suffix):
    scene = bpy.data.scenes.new('Ares MOLA Terrain ' + suffix)
    bpy.context.window.scene = scene
    vertices = [(X0+PW*x/nx, -(Z0+PH*y/ny), height(x/nx,y/ny))
                for y in range(ny+1) for x in range(nx+1)]
    faces = []
    for y in range(ny):
        for x in range(nx):
            a = y*(nx+1)+x
            faces.extend([(a,a+nx+1,a+1), (a+1,a+nx+1,a+nx+2)])
    mesh = bpy.data.meshes.new('NASA MOLA sampled relief')
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    uv = mesh.uv_layers.new(name='Mars equirectangular')
    for polygon in mesh.polygons:
        polygon.use_smooth = True
        for loop in polygon.loop_indices:
            vi = mesh.loops[loop].vertex_index
            uv.data[loop].uv = ((vi%(nx+1))/nx, 1-(vi//(nx+1))/ny)
    obj = bpy.data.objects.new('NASA_MOLA_relief', mesh)
    scene.collection.objects.link(obj)
    obj['source'] = 'NASA Mars Global Surveyor MOLA; 360 by 180 sample already in game'
    obj['height_scale'] = 'Same exaggerated height as simulation: byte * 5.5 / 255'
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    out = ROOT / 'game/assets/ares' / ('mars-mola-' + suffix + '.glb')
    bpy.ops.export_scene.gltf(filepath=str(out), export_format='GLB',
        use_selection=True, use_active_scene=True, export_materials='NONE', export_extras=True)
    return {'file':out.name, 'vertices':len(vertices), 'triangles':len(faces), 'bytes':out.stat().st_size}

if __name__ == '__main__':
    result = [build(360,180,'terrain'), build(180,90,'low')]
    print(json.dumps({'terrain':result}))
