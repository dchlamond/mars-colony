"""Derive lighter authored GLBs in Blender, preserving material and joint nodes."""
from pathlib import Path
import bpy
import bmesh
import json

BASE=Path(globals().get('ARES_REPO') or Path(__file__).resolve().parents[2])
specs=[('habitat-h01','habitat-h01-low',.18),('astronaut-a02','astronaut-a02-low',.40),('outcrop-r02','outcrop-r02-low',.10)]
results=[]
for src,target,ratio in specs:
    scene=bpy.data.scenes.new('Ares LOD / '+target);bpy.context.window.scene=scene
    bpy.ops.import_scene.gltf(filepath=str(BASE/'game/assets/ares'/f'{src}.glb'))
    for obj in scene.objects:
        if obj.type!='MESH':continue
        # glTF duplicates vertices at hard normal/UV boundaries. Decimating
        # those disconnected faces independently punched holes in flat rock
        # strata. Restore topology before reducing the continuous surface.
        bm=bmesh.new();bm.from_mesh(obj.data)
        bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001)
        bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
        bm.to_mesh(obj.data);bm.free();obj.data.update()
        modifier=obj.modifiers.new('Authored silhouette LOD','DECIMATE');modifier.ratio=ratio;modifier.use_collapse_triangulate=True
        bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=modifier.name)
        obj.data.validate(verbose=False,clean_customdata=False)
        obj.data.update()
    for obj in scene.objects:obj.select_set(True)
    path=BASE/'game/assets/ares'/f'{target}.glb'
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_apply=False,export_animations=False,export_cameras=False,export_lights=False,export_extras=True)
    tris=sum(sum(len(p.vertices)-2 for p in obj.data.polygons) for obj in scene.objects if obj.type=='MESH')
    results.append({'asset':target,'derived_from':src,'ratio':ratio,'triangles':tris,'bytes':path.stat().st_size})
(BASE/'game/assets/ares/lod-manifest.json').write_text(json.dumps(results,indent=2)+'\n')
