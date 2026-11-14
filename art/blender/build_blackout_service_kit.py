"""Original BLACKOUT service equipment and astronaut hand tools.

Run in an isolated Blender background process. Geometry is artistic engineering
interpretation, not NASA flight hardware. No imported brand marks or textures.
"""
from pathlib import Path
import json
import math
import bpy
from mathutils import Vector

BASE = Path(__file__).resolve().parents[2]
OUT = BASE / 'game/assets/ares'
SOURCE = BASE / 'art/blender/exports/blackout-service-kit.blend'
exec((BASE / 'art/blender/build_ares_habitat.py').read_text())

MAT = {
    'shell': _material('Blackout / ceramic service enamel', (.69,.67,.58), .18,.46),
    'dark': _material('Blackout / graphite elastomer', (.025,.032,.036), .06,.83),
    'metal': _material('Blackout / brushed titanium', (.25,.30,.32), .70,.40),
    'blue': _material('Blackout / water line enamel', (.035,.19,.24), .30,.40),
    'light': _material('Blackout / operating indicator', (.04,.30,.25), .10,.35, emission=((.12,.8,.56),.7)),
}

def scene(name):
    s = bpy.data.scenes.new('BLACKOUT / '+name)
    bpy.context.window.scene = s
    c = bpy.data.collections.new(name)
    s.collection.children.link(c)
    s['ares_asset_collection'] = c.name
    root = bpy.data.objects.new(name, None)
    c.objects.link(root)
    root['provenance'] = 'Original Blender geometry, artistic service equipment'
    return s,c,root

def box(c,name,dim,loc,key='shell',bevel=.006):
    return _box(name,dim,loc,c,MAT[key],bevel=bevel)

def pipe(c,name,points,r=.01,key='metal'):
    return _tube(name,points,r,c,MAT[key],sides=8)

def export(s,c,root,name):
    for obj in c.objects:
        if obj != root and obj.parent is None: obj.parent = root
    path = OUT / (name+'.glb')
    if path.exists(): path.unlink()
    result=export_asset_glb(path,s.name)
    result.update(asset=name,bytes=path.stat().st_size,provenance='Original Blender-authored geometry')
    result.pop('path',None)
    return result

metrics=[]
s,c,root=scene('Service controller')
# A clear, shoulder-height maintenance station, with glove-operable controls.
box(c,'Controller / foundation',(.40,.27,.035),(0,0,.017),'dark')
box(c,'Controller / reinforced column',(.065,.075,.34),(0,0,.19),'metal')
box(c,'Controller / pressure enclosure',(.35,.19,.24),(0,0,.48),'shell',.025)
box(c,'Controller / protective screen rim',(.27,.018,.14),(0,-.104,.50),'metal',.014)
box(c,'Controller / shaded display',(.23,.012,.105),(0,-.118,.50),'dark',.009)
for x in (-.055,0,.055):
    box(c,'Controller / status lamps',(.027,.01,.013),(x,-.128,.52),'light',.003)
for x in (-.07,.07):
    box(c,'Controller / tactile control',(.04,.022,.025),(x,-.124,.405),'metal',.006)
for x in (-.195,.195):
    pipe(c,'Controller / guard rail',[(x,-.08,.37),(x,-.08,.62),(x,.03,.62)],.008)
pipe(c,'Controller / protected power cable',[(.10,.10,.40),(.12,.10,.16),(.12,.15,.04)],.012,'dark')
metrics.append(export(s,c,root,'service-controller-b03'))

s,c,root=scene('Water circulation witness')
box(c,'Witness / anti-vibration base',(.30,.22,.035),(0,0,.018),'dark')
box(c,'Witness / insulated housing',(.24,.15,.24),(0,0,.16),'blue',.028)
box(c,'Witness / titanium cover',(.20,.02,.18),(0,-.087,.17),'metal',.018)
box(c,'Witness / inspection aperture',(.13,.012,.12),(0,-.104,.18),'dark',.018)
for z in (.145,.18,.215):
    box(c,'Witness / circulation indicators',(.075,.008,.013),(0,-.115,z),'light',.003)
for x in (-.18,.18):
    pipe(c,'Witness / insulated return bend',[(x*.55,.025,.20),(x,.025,.20),(x,.025,.065),(x*1.25,.025,.065)],.017,'metal')
metrics.append(export(s,c,root,'water-witness-b03'))

s,c,root=scene('Crew field case')
box(c,'Field case / pressure resistant shell',(.32,.13,.235),(0,0,.14),'shell',.024)
box(c,'Field case / gasket seam',(.325,.135,.02),(0,0,.17),'dark',.006)
for x in (-.11,.11):
    box(c,'Field case / corner guard',(.035,.145,.24),(x,0,.14),'metal',.009)
    box(c,'Field case / clasp',(.035,.025,.045),(x,-.078,.19),'dark',.004)
pipe(c,'Field case / carrying handle',[(-.065,0,.26),(-.065,0,.305),(.065,0,.305),(.065,0,.26)],.013,'dark')
box(c,'Field case / engraved label',(.115,.006,.035),(0,-.07,.095),'blue',.003)
metrics.append(export(s,c,root,'crew-field-case-b03'))

s,c,root=scene('Crew inspection tablet')
box(c,'Tablet / pressure shell',(.21,.045,.29),(0,0,0),'metal',.015)
box(c,'Tablet / glove grips',(.235,.05,.20),(0,0,-.025),'dark',.018)
box(c,'Tablet / screen bezel',(.174,.008,.23),(0,-.028,.01),'shell',.008)
box(c,'Tablet / screen',(.148,.006,.196),(0,-.034,.014),'dark',.003)
for z in (-.04,0,.04):
    box(c,'Tablet / telemetry line',(.10,.004,.008),(-.01,-.039,z),'light',.001)
box(c,'Tablet / thumb control',(.022,.012,.022),(.065,-.04,-.1),'blue',.004)
metrics.append(export(s,c,root,'crew-tablet-b03'))

# Store the editable authored scenes; exported meshes stay small and batched.
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE))
(OUT/'blackout-service-manifest.json').write_text(json.dumps({'version':1,'assets':metrics,'notes':'Original artistic props. Light and flow indicators are driven by the actual game state; their animation is schematic.'},indent=2))
print(json.dumps(metrics,indent=2))
