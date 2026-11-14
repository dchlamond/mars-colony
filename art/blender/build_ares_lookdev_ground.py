"""Original Blender terrain patch for offline UE look development, not NASA DEM.

Exports a 24 m square mesh with an unobstructed central area, sculpted edges,
Grok-generated regolith albedo and the project's Blender-authored normal map.
The game runtime uses its separate NASA MOLA-derived terrain export.
"""
from pathlib import Path
import math
import bpy
from mathutils import Vector
from mathutils.noise import noise_vector

BASE=Path(globals().get('ARES_REPO') or Path(__file__).resolve().parents[2])
scene=bpy.data.scenes.new('Ares / authored look development ground')
bpy.context.window.scene=scene
verts=[];faces=[];n=96
for row in range(n+1):
    for col in range(n+1):
        x=col/n*24-12;y=row/n*24-12
        edge=max(0,min(1,(max(abs(x),abs(y))-7)/4))
        broad=noise_vector(Vector((x*.32,y*.32,4.7))).z
        detail=noise_vector(Vector((x*1.6,y*1.6,.7))).x
        height=edge*(.32+.53*broad+.055*detail)
        verts.append((x,y,height-.025))
for row in range(n):
    for col in range(n):
        a=row*(n+1)+col;faces.append((a,a+1,a+n+2,a+n+1))
mesh=bpy.data.meshes.new('Ares / sculpted terrain patch');mesh.from_pydata(verts,[],faces);mesh.update()
obj=bpy.data.objects.new('ARES_LOOKDEV_GROUND',mesh);scene.collection.objects.link(obj)
obj['provenance']='Original artistic Blender terrain, not NASA elevation; for asset look development only.'
uv=mesh.uv_layers.new(name='UVMap')
for p in mesh.polygons:
    p.use_smooth=True
    for loop in p.loop_indices:
        co=mesh.vertices[mesh.loops[loop].vertex_index].co;uv.data[loop].uv=((co.x+12)/3,(co.y+12)/3)
mat=bpy.data.materials.new('Ares / Grok regolith + Blender relief');mat.use_nodes=True
bsdf=mat.node_tree.nodes['Principled BSDF'];bsdf.inputs['Roughness'].default_value=.93
for name,space,input_name in [('grok-regolith.jpg','sRGB','Base Color'),('regolith-normal.png','Non-Color','Normal')]:
    path=BASE/'game/assets/ares'/name
    if not path.exists():
        if input_name=='Normal':continue
        raise FileNotFoundError(path)
    node=mat.node_tree.nodes.new('ShaderNodeTexImage');node.image=bpy.data.images.load(str(path));node.image.colorspace_settings.name=space;node.extension='REPEAT'
    if input_name=='Normal':
        normal=mat.node_tree.nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.32;mat.node_tree.links.new(node.outputs['Color'],normal.inputs['Color']);mat.node_tree.links.new(normal.outputs['Normal'],bsdf.inputs['Normal'])
    else:mat.node_tree.links.new(node.outputs['Color'],bsdf.inputs[input_name])
mesh.materials.append(mat)
obj.select_set(True);bpy.context.view_layer.objects.active=obj
target=BASE/'art/blender/exports/ares-lookdev-ground.glb'
bpy.ops.export_scene.gltf(filepath=str(target),export_format='GLB',use_selection=True,use_active_scene=True,export_apply=False,export_animations=False,export_cameras=False,export_lights=False,export_extras=True)
print({'export':str(target.relative_to(BASE)),'triangles':len(faces)*2,'dimensions_metres':[24,24],'bytes':target.stat().st_size,'provenance':'original artistic look-development patch'})
