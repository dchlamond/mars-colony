"""Render actual authored assets as transparent UI previews, through Blender MCP."""
from pathlib import Path
import bpy

BASE=Path(globals().get('ARES_REPO') or (Path(__file__).resolve().parents[2] if '__file__' in globals() else Path.cwd()))
original=bpy.context.window.scene
source=BASE/'art/blender/exports/ares-habitat-h01-v02.blend'
with bpy.data.libraries.load(str(source),link=False) as (available,loaded):
    loaded.scenes=[available.scenes[0]]
scene=loaded.scenes[0]
bpy.context.window.scene=scene
for obj in scene.objects:
    if obj.type=='MESH' and obj.name.startswith('Presentation /'):
        obj.hide_render=True
scene.render.film_transparent=True
scene.render.resolution_x=scene.render.resolution_y=384
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.camera.data.ortho_scale=8.4
scene.render.filepath=str(BASE/'game/assets/ares/habitat-preview.png')
bpy.ops.render.render(write_still=True,scene=scene.name)
bpy.context.window.scene=original
result={'preview':scene.render.filepath,'method':'Blender render of the actual authored H-01 game asset','background':'transparent'}
