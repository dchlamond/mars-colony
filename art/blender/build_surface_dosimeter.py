"""Original handheld game dosimeter and pressure glove, authored in Blender.

Illustrative equipment, not a NASA RAD replica or a calibrated instrument.
Its blank display is replaced by an explicitly simulated game readout at runtime.
"""
from pathlib import Path
import bpy
import bmesh
BASE=Path(globals().get('ARES_REPO') or Path(__file__).resolve().parents[2])
exec((BASE/'art/blender/build_ares_habitat.py').read_text())
scene=bpy.data.scenes.new('Blackout / handheld dosimeter and pressure glove');bpy.context.window.scene=scene
asset=bpy.data.collections.new('Dosimeter / authored export');scene.collection.children.link(asset)
root=bpy.data.objects.new('SURFACE_DOSIMETER',None);asset.objects.link(root)
scene['ares_asset_collection']=asset.name
root['provenance']='Original artistic dosimeter and glove. Runtime radiation values are a simulation, not a live sensor or NASA reading.'
mats={'ivory':_material('Dosimeter / ceramic',(.63,.59,.48),.17,.39),'dark':_material('Dosimeter / seals',(.018,.03,.036),.18,.65),'brass':_material('Dosimeter / bronze fittings',(.40,.24,.075),.74,.30),'display':_material('Dosimeter / blank display',(.01,.05,.05),.02,.32),'suit':_material('Dosimeter / pressure glove fabric',(.70,.66,.56),.02,.72)}
def box(n,dim,loc,m,bevel=.012):return _box(n,dim,loc,asset,mats[m],bevel=bevel)
def ell(n,loc,scale,m):
 bm=bmesh.new();bmesh.ops.create_uvsphere(bm,u_segments=24,v_segments=12,radius=1);mesh=bpy.data.meshes.new(n);bm.to_mesh(mesh);bm.free();o=bpy.data.objects.new(n,mesh);asset.objects.link(o);o.location=loc;o.scale=scale;mesh.materials.append(mats[m]);
 for p in mesh.polygons:p.use_smooth=True
 return o
box('Dosimeter / protected housing',(.205,.095,.32),(0,0,.27),'ivory',.026)
box('Dosimeter / front bronze bezel',(.18,.012,.275),(0,-.052,.27),'brass',.019)
box('Dosimeter / dark instrument face',(.16,.015,.255),(0,-.062,.27),'dark',.015)
box('Dosimeter / display aperture',(.137,.006,.112),(0,-.072,.305),'display',.006)
for x in (-.045,.045):
 ell('Dosimeter / glove operable button',(x,-.084,.191),(.025,.014,.025),'brass')
for x in (-.088,.088):
 for z in (.145,.395):ell('Dosimeter / captive screw',(x,-.062,z),(.006,.004,.006),'brass')
for z in (.235,.255,.275):box('Dosimeter / sensor intake',(.03,.007,.004),(.093,-.032,z),'dark',.001)
box('Dosimeter / upper sensor module',(.12,.08,.04),(0,0,.445),'dark',.010)
for i in range(6):box('Dosimeter / sensor guard rail',(.009,.084,.045),(-.05+i*.02,0,.447),'brass',.003)
# A curved pressure glove cups the lower right edge, with four distinct fingers.
ell('Glove / palm',(.116,.008,.16),(.075,.055,.088),'suit')
for i in range(4):
 o=ell('Glove / curled finger',(.084,-.039,.12+i*.025),(.055,.035,.020),'suit');o.rotation_euler.z=-.18
ell('Glove / opposing thumb',(.095,-.085,.21),(.033,.030,.061),'suit')
box('Glove / wrist cuff',(.13,.115,.07),(.145,.018,.072),'dark',.021)
box('Glove / bronze wrist seal',(.14,.12,.023),(.145,.018,.09),'brass',.012)
o=ell('Sleeve / pressure garment',(.20,.04,-.052),(.092,.08,.18),'suit');o.rotation_euler.y=-.35
for o in asset.objects:
 if o!=root:o.parent=root
out=BASE/'game/assets/ares/surface-dosimeter.glb'
if out.exists():out.unlink()
result=export_asset_glb(out,scene.name)
bpy.data.libraries.write(str(BASE/'art/blender/exports/surface-dosimeter.blend'),{scene},fake_user=True,compress=True)
print(result)
