"""Render the actual exported GLB kit in Blender Cycles for material review."""
from pathlib import Path
import math
import bpy
from mathutils import Vector

BASE=Path(globals().get('ARES_REPO') or Path(__file__).resolve().parents[2])
scene=bpy.context.scene
scene.name='Ares Atlas / exported asset review'
for obj in list(scene.objects):bpy.data.objects.remove(obj,do_unlink=True)
names=['solar-s02','moxie-o02','ice-w02','shield-r02','battery-b02',
       'mine-m02','dome-d02','reactor-p02','outcrop-r02','astronaut-a02']
for i,name in enumerate(names):
    before=set(scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(BASE/'game/assets/ares'/f'{name}.glb'))
    objects=set(scene.objects)-before
    for obj in objects:
        if obj.parent is None:
            obj.location+=Vector(((i%5-2)*2.4,(i//5-.5)*3,0))
    # Film labels are presentation elements and are not exported game meshes.
    curve=bpy.data.curves.new(name,'FONT');curve.body=name;curve.size=.16;curve.align_x='CENTER'
    label=bpy.data.objects.new(name+' / label',curve);scene.collection.objects.link(label)
    label.location=((i%5-2)*2.4,(i//5-.5)*3-1.07,.012)
    label.data.extrude=.001
    material=bpy.data.materials.get('Review / brass label')
    if not material:
        material=bpy.data.materials.new('Review / brass label');material.diffuse_color=(.6,.4,.15,1)
    curve.materials.append(material)
bpy.ops.mesh.primitive_plane_add(size=200)
floor=bpy.context.object;floor.name='Review / ground'
mat=bpy.data.materials.new('Review / warm regolith');mat.use_nodes=True
bsdf=mat.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=(.16,.055,.022,1);bsdf.inputs['Roughness'].default_value=.95
noise=mat.node_tree.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=35
bump=mat.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.2;bump.inputs['Distance'].default_value=.025
mat.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height']);mat.node_tree.links.new(bump.outputs['Normal'],bsdf.inputs['Normal']);floor.data.materials.append(mat)
world=bpy.data.worlds.new('Review / soft sky');world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.29,.36,.47,1);world.node_tree.nodes['Background'].inputs[1].default_value=.24;scene.world=world
for name,kind,loc,power,color,size in [('Sun','SUN',(-6,-8,10),2.1,(1,.75,.50),.06),('Sky','AREA',(4,2,8),350,(.62,.75,1),8)]:
    data=bpy.data.lights.new(name,kind);data.energy=power;data.color=color
    if kind=='SUN':data.angle=size
    else:data.size=size
    obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=loc;obj.rotation_euler=(Vector((0,0,0))-obj.location).to_track_quat('-Z','Y').to_euler()
data=bpy.data.cameras.new('Review camera');cam=bpy.data.objects.new('Review camera',data);scene.collection.objects.link(cam)
cam.location=(7,-12,11);cam.rotation_euler=(Vector((0,0,.3))-cam.location).to_track_quat('-Z','Y').to_euler();data.type='ORTHO';data.ortho_scale=14.5;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=1500;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
scene.render.image_settings.file_format='PNG'
scene.render.filepath=str(BASE/'art/blender/verification/surface-kit-s02-cycles.png')
bpy.ops.render.render(write_still=True)
