"""Render transparent thumbnails of the actual GLB buildings, using Cycles."""
from pathlib import Path
import bpy
from mathutils import Vector
BASE=Path(globals().get('ARES_REPO') or Path(__file__).resolve().parents[2])
specs={'solar':'solar-s02','moxie':'moxie-o02','ice':'ice-w02','shield':'shield-r02','battery':'battery-b02','mine':'mine-m02','dome':'dome-d02','reactor':'reactor-p02','rover':'rover-rv02','shuttle':'shuttle-l02'}
for kind,asset in specs.items():
    source=BASE/'game/assets/ares'/f'{asset}.glb'
    if not source.exists():continue
    scene=bpy.data.scenes.new('Ares preview / '+kind);bpy.context.window.scene=scene
    bpy.ops.import_scene.gltf(filepath=str(source))
    world=bpy.data.worlds.new('Preview / sky');world.use_nodes=True
    world.node_tree.nodes['Background'].inputs[0].default_value=(.25,.32,.44,1);world.node_tree.nodes['Background'].inputs[1].default_value=.38;scene.world=world
    for name,loc,power,color,size in [('Key',(-3,-4,5),550,(1,.79,.55),3),('Fill',(3,1,3),220,(.65,.78,1),4)]:
        data=bpy.data.lights.new(name,'AREA');data.energy=power;data.color=color;data.size=size
        obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=loc;obj.rotation_euler=(Vector((0,0,.5))-obj.location).to_track_quat('-Z','Y').to_euler()
    data=bpy.data.cameras.new('Preview');cam=bpy.data.objects.new('Preview',data);scene.collection.objects.link(cam);cam.location=(2.7,-3.8,2.8)
    cam.rotation_euler=(Vector((0,0,.55))-cam.location).to_track_quat('-Z','Y').to_euler();data.type='ORTHO';data.ortho_scale=2.5;scene.camera=cam
    scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
    scene.render.resolution_x=scene.render.resolution_y=256;scene.render.resolution_percentage=100
    scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
    scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
    scene.render.filepath=str(BASE/'game/assets/ares'/f'{kind}-preview.png')
    bpy.ops.render.render(write_still=True)
