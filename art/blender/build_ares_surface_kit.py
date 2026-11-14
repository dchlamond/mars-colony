"""Ares Atlas surface kit: original Blender-authored web assets.

Execute through the official Blender MCP workshop with ARES_REPO set to the
repository. Creates isolated scenes, preserves existing scenes, and exports
evaluated geometry with PBR materials. NASA references inform engineering cues;
these are artistic Mars extrapolations, not flight-qualified NASA designs.
"""
from pathlib import Path
import math
import random
import json
import bpy
import bmesh
from mathutils import Vector
from mathutils.noise import noise_vector

BASE = Path(globals().get('ARES_REPO') or (Path(__file__).resolve().parents[2] if '__file__' in globals() else Path.cwd()))
exec((BASE / 'art/blender/build_ares_habitat.py').read_text())
OUT = BASE / 'game/assets/ares'
OUT.mkdir(parents=True, exist_ok=True)
MATS = {
    'ivory': _material('Ares S02 / ceramic pressure shell', (.66,.60,.47), .24,.34),
    'brass': _material('Ares S02 / brushed bronze', (.40,.24,.087), .78,.31),
    'dark': _material('Ares S02 / charcoal seals', (.025,.036,.039), .30,.61),
    'navy': _material('Ares S02 / photovoltaic blue', (.008,.025,.068), .42,.23),
    'steel': _material('Ares S02 / titanium struts', (.24,.28,.28), .72,.37),
    'amber': _material('Ares S02 / warm interior glazing', (.48,.22,.035), .22,.28, emission=((1,.42,.09),.35)),
    'water': _material('Ares S02 / water utility enamel', (.035,.19,.24), .35,.30),
    'rock': _material('Ares S02 / fractured basalt', (.18,.073,.034), .02,.91),
}


def scene_for(kind):
    scene=bpy.data.scenes.new('Ares Atlas / '+kind)
    bpy.context.window.scene=scene
    col=bpy.data.collections.new('Ares '+kind+' / authored geometry')
    scene.collection.children.link(col)
    root=bpy.data.objects.new('ARES_'+kind.upper().replace('-','_'),None)
    col.objects.link(root)
    root['asset_id']=kind
    root['provenance']='Original Blender architecture informed by NASA technology references; artistic interpretation'
    scene['ares_asset_collection']=col.name
    return scene,col,root


def box(col,n,dim,loc,mat='ivory',bevel=.025,rot=0):
    return _box(n,dim,loc,col,MATS[mat],rotation=rot,bevel=bevel)


def tube(col,n,pts,r=.015,mat='brass',sides=8):
    return _tube(n,pts,r,col,MATS[mat],sides=sides)


def cyl(col,n,r,h,loc=(0,0,0),mat='ivory',segments=32):
    o=_lathe(n,[(0,0),(r,0),(r,h),(0,h)],col,MATS[mat],segments=segments)
    o.location=loc
    _bevel(o,min(.012,h/8),2)
    return o


def ring(col,n,r,z,minor=.014,mat='brass',center=(0,0)):
    o=_ring(n,r,z,minor,col,MATS[mat],segments=32)
    o.location.x,o.location.y=center
    return o


def sphere(col,n,loc,scale,mat='ivory',segments=24,rings=12):
    bm=bmesh.new();bmesh.ops.create_uvsphere(bm,u_segments=segments,v_segments=rings,radius=1)
    mesh=bpy.data.meshes.new(n);bm.to_mesh(mesh);bm.free()
    o=bpy.data.objects.new(n,mesh);col.objects.link(o)
    o.location=loc;o.scale=scale;mesh.materials.append(MATS[mat])
    for p in mesh.polygons:p.use_smooth=True
    return o


def platform(col,w=1.6,d=1.5):
    box(col,'Foundation / chamfered base',(w,d,.085),(0,0,.055),'dark',.045)
    box(col,'Foundation / bronze lip',(w*.97,d*.97,.035),(0,0,.105),'brass',.02)
    box(col,'Foundation / service deck',(w*.93,d*.93,.04),(0,0,.137),'ivory',.02)
    for x in (-w*.39,w*.39):
        for y in (-d*.37,d*.37):
            cyl(col,'Foundation / adjustable foot',.085,.09,(x,y,.005),'steel',16)


def tank(col,x,y,z,r=.18,h=.65,mat='ivory'):
    profile=[(0,0),(r*.65,0),(r,.09),(r,h-.10),(r*.85,h-.03),(0,h)]
    o=_lathe('Pressure vessel / welded shell',profile,col,MATS[mat],segments=32);o.location=(x,y,z)
    for zz in (.10,h-.11):ring(col,'Pressure vessel / retaining collar',r*1.02,z+zz,.012,'brass',(x,y))
    cyl(col,'Pressure vessel / service cap',r*.25,.06,(x,y,z+h),'brass',16)


def vents(col,x,y,z,w=.3,h=.38):
    box(col,'Service cabinet / dark inset',(w,.017,h),(x,y,z),'dark',.008)
    for i in range(7):box(col,'Service cabinet / louver',(w*.88,.025,.012),(x,y-.008,z-h*.40+i*h*.13),'steel',.003)


def hatch(col,x=0,y=-.52,z=.46,w=.40,h=.52):
    box(col,'Airlock / bronze pressure frame',(w,.045,h),(x,y,z),'brass',.07)
    box(col,'Airlock / sealed pressure door',(w*.8,.05,h*.84),(x,y-.03,z),'dark',.055)
    box(col,'Airlock / inspection window',(w*.52,.016,h*.25),(x,y-.061,z+h*.14),'amber',.025)
    box(col,'Airlock / recessed handle',(.04,.028,h*.24),(x+w*.24,y-.075,z-.04),'steel',.006)
    for side in (-1,1):
        tube(col,'Airlock / raised handrail',[(x+side*w*.65,y-.1,.18),(x+side*w*.65,y-.1,.58)],.012)


def radiator(col,x,y,z,w=.48,h=.58):
    box(col,'Radiator / perimeter frame',(w,.055,h),(x,y,z),'brass',.012)
    box(col,'Radiator / dark thermal field',(w*.93,.06,h*.94),(x,y-.006,z),'dark',.005)
    for i in range(12):box(col,'Radiator / thermal vane',(w*.90,.077,.018),(x,y-.012,z-h*.43+i*h*.078),'steel',.002)


def finish(scene,col,root,name):
    for o in list(col.objects):
        if o!=root and o.parent is None:o.parent=root
    path=OUT/(name+'.glb')
    # Only this reproducible kit's own output is replaced on a rerun.
    if path.exists():path.unlink()
    metrics=export_asset_glb(path,scene.name)
    deps=bpy.context.evaluated_depsgraph_get();points=[]
    for o in col.objects:
        if o.type=='MESH':
            e=o.evaluated_get(deps)
            points.extend(e.matrix_world@Vector(v) for v in e.bound_box)
    lo=[min(v[i] for v in points) for i in range(3)];hi=[max(v[i] for v in points) for i in range(3)]
    metrics.update({'asset':name,'bytes':path.stat().st_size,'blender_bounds':[lo,hi],
                    'gltf_up':'Y','gltf_forward':'+Z','source_scene':scene.name})
    metrics['notes']='Evaluated geometry and authored PBR materials; no baked lighting or ray tracing is embedded in this GLB.'
    return metrics


def solar():
    s,c,r=scene_for('S02 solar field')
    # Three separate articulated wings, with realistic struts and cell busbars.
    for row in range(3):
        y=-.53+row*.53
        for x in (-.48,.48):
            cyl(c,'Array / ground anchor',.07,.065,(x,y,.01),'dark',16)
            tube(c,'Array / triangular brace',[(x,y-.16,.06),(x,y+.05,.48),(x,y+.20,.06)],.022,'steel')
        wing=bpy.data.objects.new('Array / inclined wing',None);c.objects.link(wing);wing.location=(0,y,.38);wing.rotation_euler.x=math.radians(20)
        before=set(c.objects)
        box(c,'Array / bronze frame',(1.72,.44,.045),(0,0,0),'brass',.016)
        box(c,'Array / blue active surface',(1.66,.39,.016),(0,0,.031),'navy',.006)
        for i in range(17):box(c,'Array / silver busbar',(.003,.38,.002),(-.80+i*.10,0,.041),'steel',0)
        for j in range(4):box(c,'Array / cell interconnect',(1.63,.003,.002),(0,-.145+j*.098,.042),'steel',0)
        for o in set(c.objects)-before:o.parent=wing
        tube(c,'Array / exposed supply cable',[(-.66,y,.12),(-.78,y,.08),(-.78,.66,.08)],.016,'dark')
    box(c,'Array / inverter cabinet',(.38,.26,.35),(.53,.70,.20),'ivory',.045)
    vents(c,.53,.561,.20,.27,.22)
    return finish(s,c,r,'solar-s02')


def oxygen():
    s,c,r=scene_for('O02 oxygen works');platform(c,1.56,1.46)
    cyl(c,'Oxygen / central processor skirt',.37,.12,(0,.10,.16),'brass')
    profile=[(0,0),(.27,0),(.31,.08),(.31,.94),(.25,1.05),(0,1.12)]
    o=_lathe('Oxygen / insulated processing tower',profile,c,MATS['ivory'],segments=48);o.location=(0,.10,.24)
    for z in (.38,.78,1.18):ring(c,'Oxygen / tower bolted seam',.317,z,.013,'brass',(0,.10))
    for a in range(8):
        angle=a*math.tau/8;x,y=.314*math.cos(angle),.10+.314*math.sin(angle)
        tube(c,'Oxygen / vertical service spine',[(x,y,.35),(x,y,1.22)],.014)
    tank(c,-.53,.23,.16,.16,.69);tank(c,.53,.23,.16,.16,.69)
    box(c,'Oxygen / CO2 intake cabinet',(.67,.32,.42),(0,-.43,.39),'ivory',.045)
    vents(c,0,-.60,.40,.51,.29)
    for x in (-.51,.51):tube(c,'Oxygen / filtered gas pipe',[(x,.23,.88),(x,-.12,.98),(x*.3,-.27,.98),(x*.3,-.27,1.16)],.023)
    for x in (-.14,0,.14):cyl(c,'Oxygen / top exhaust baffle',.035,.16,(x,.10,1.32),'steel',16)
    return finish(s,c,r,'moxie-o02')


def ice():
    s,c,r=scene_for('W02 ice water works');platform(c,1.66,1.46)
    for x in (-.50,.50):tank(c,x,.24,.16,.20,.63,'water')
    box(c,'Water / filtration housing',(.52,.45,.39),(0,.40,.36),'ivory',.045)
    for x in (-.30,.30):
        tube(c,'Water / drilling mast upright',[(x,-.37,.16),(x,-.37,1.30)],.025,'steel')
        tube(c,'Water / mast foot brace',[(x,-.37,.85),(x*1.8,-.66,.18)],.02,'brass')
    for z in (.39,.68,.97,1.27):tube(c,'Water / mast crossbar',[(-.30,-.37,z),(.30,-.37,z)],.018,'brass')
    box(c,'Water / auger drive head',(.36,.28,.20),(0,-.37,1.22),'ivory',.03)
    cyl(c,'Water / sampling drill shaft',.038,1.0,(0,-.37,.18),'steel',16)
    pts=[]
    for i in range(120):
        a=i*math.tau/15;pts.append((.083*math.cos(a),-.37+.083*math.sin(a),.20+i*.0068))
    tube(c,'Water / helical drilling flight',pts,.018,'brass',6)
    for x in (-.50,.50):tube(c,'Water / insulated supply pipe',[(x,.24,.80),(x,.0,.91),(0,.0,.91),(0,-.25,.95)],.025,'steel')
    return finish(s,c,r,'ice-w02')


def shield():
    s,c,r=scene_for('R02 storm refuge');platform(c,1.72,1.52)
    # Layered local-regolith shielding is an architectural cue, not a claim
    # that a thin decorative wall provides quantified radiation protection.
    for i in range(11):
        width=1.54-(max(0,i-5)*.115)
        box(c,'Refuge / printed shielding course',(width,1.24,.062),(0,.04,.20+i*.055),'rock',.035)
    box(c,'Refuge / inset pressure module',(1.28,1.09,.58),(0,.05,.45),'ivory',.17)
    for i in range(10):
        z=.22+i*.056;w=1.63-(max(0,i-5)*.10)
        tube(c,'Refuge / protective outer ribs',[(-w/2,-.50,z),(-w/2,.59,z),(w/2,.59,z),(w/2,-.50,z)],.028,'rock')
    hatch(c,0,-.56,.43,.49,.56)
    box(c,'Refuge / entrance step',(.62,.24,.065),(0,-.69,.17),'brass',.018)
    for x in (-.47,.47):box(c,'Refuge / shielded skylight',(.19,.19,.045),(x,.1,.83),'amber',.025)
    return finish(s,c,r,'shield-r02')


def battery():
    s,c,r=scene_for('B02 energy bank');platform(c,1.55,1.34)
    for x in (-.48,0,.48):
        box(c,'Battery / insulated enclosure',(.40,.74,.65),(x,.12,.49),'ivory',.065)
        box(c,'Battery / bronze panel seam',(.34,.77,.035),(x,.12,.33),'brass',.015)
        box(c,'Battery / status window',(.19,.025,.07),(x,-.27,.68),'amber',.01)
        vents(c,x,-.27,.48,.28,.22)
        for y in (-.13,.33):tube(c,'Battery / lifting loop',[(x-.09,y,.83),(x-.09,y,.89),(x+.09,y,.89),(x+.09,y,.83)],.012,'steel')
    tube(c,'Battery / external power bus',[(-.58,-.44,.21),(.58,-.44,.21)],.033,'dark')
    for x in (-.48,0,.48):tube(c,'Battery / fused connection',[(x,-.27,.30),(x,-.44,.21)],.025,'brass')
    return finish(s,c,r,'battery-b02')


def mine():
    s,c,r=scene_for('M02 regolith processing');platform(c,1.68,1.48)
    box(c,'Mine / refining body',(.76,.75,.60),(-.34,.20,.47),'ivory',.075)
    for y in (-.05,.14,.33):box(c,'Mine / crusher casing rib',(.80,.035,.67),(-.34,y,.48),'brass',.008)
    # Open rectangular hopper with tapered sides, dark ore interior.
    verts=[(-.70,-.12,.76),(.04,-.12,.76),(.04,.55,.76),(-.70,.55,.76),(-.56,.0,.48),(-.1,.0,.48),(-.1,.43,.48),(-.56,.43,.48)]
    _mesh('Mine / sloping feed hopper',verts,[(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7),(4,5,6,7)],c,MATS['dark'])
    for x in (.13,.61):tube(c,'Mine / drilling gantry',[(x,-.49,.17),(x,-.49,1.0)],.025,'steel')
    tube(c,'Mine / gantry crown',[(.13,-.49,1.0),(.61,-.49,1.0)],.035)
    cyl(c,'Mine / sampler',.047,.72,(.37,-.49,.17),'brass',16)
    box(c,'Mine / mechanical head',(.30,.24,.20),(.37,-.49,.88),'ivory',.035)
    box(c,'Mine / finished material bin',(.40,.55,.26),(.52,.30,.30),'brass',.025)
    for i in range(5):box(c,'Mine / ingot',(.30,.075,.06),(.52,.11+i*.09,.46),'steel',.008)
    vents(c,-.34,-.198,.49,.54,.25)
    return finish(s,c,r,'mine-m02')


def dome():
    s,c,r=scene_for('D02 community dome')
    cyl(c,'Dome / foundation plinth',.79,.12,(0,0,.03),'dark',64)
    ring(c,'Dome / brass perimeter',.78,.15,.027)
    profile=[(0,.14),(.73,.14),(.73,.43),(.69,.64),(.57,.83),(.39,.99),(.17,1.08),(0,1.10)]
    _lathe('Dome / ivory pressure shell',profile,c,MATS['ivory'],segments=64)
    for sector in range(12):
        a=sector*math.tau/12
        points=[]
        for radius,z in profile[1:]:points.append((radius*math.cos(a),radius*math.sin(a),z+.006))
        tube(c,'Dome / radial pressure seam',points,.009,'brass',6)
    for radius,z in ((.73,.43),(.57,.83),(.17,1.08)):ring(c,'Dome / curved bolted seam',radius+.004,z,.009)
    for i in range(8):
        a=i*math.tau/8
        if i==6:continue
        o=box(c,'Dome / amber observation bay',(.25,.028,.22),(.728*math.sin(a),.728*math.cos(a),.32),'amber',.035,rot=-a)
        for off in (-.12,.12):tube(c,'Dome / observation mullion',[(.735*math.sin(a)+off*math.cos(a),.735*math.cos(a)-off*math.sin(a),.21),(.735*math.sin(a)+off*math.cos(a),.735*math.cos(a)-off*math.sin(a),.43)],.009,'brass',6)
    box(c,'Dome / sealed vestibule',(.46,.38,.43),(0,-.66,.35),'ivory',.09)
    hatch(c,0,-.87,.36,.36,.39)
    return finish(s,c,r,'dome-d02')


def reactor():
    s,c,r=scene_for('P02 surface power');platform(c,1.76,1.5)
    cyl(c,'Reactor / shield pedestal',.31,.28,(0,.15,.15),'dark',32)
    tank(c,0,.15,.43,.25,.56)
    for side in (-1,1):
        x=side*.55
        radiator(c,x,.16,.94,.48,1.18)
        tube(c,'Reactor / radiator support',[(x,-.24,.17),(x,.16,1.49)],.026,'brass')
        tube(c,'Reactor / coolant line',[(side*.21,.15,.70),(x,.15,.70),(x,.15,1.52)],.022,'steel')
    box(c,'Reactor / conversion control cabinet',(.56,.36,.35),(0,-.42,.36),'ivory',.04)
    vents(c,0,-.61,.36,.4,.22)
    return finish(s,c,r,'reactor-p02')


def outcrop():
    s,c,r=scene_for('R02 layered weathered crag');rng=random.Random(417)
    # Mesoscale ledges and persistent vertical fractures define the silhouette.
    # The main forms are stratified cliffs, rather than enlarged round boulders.
    for index,(cx,cy,radius,height) in enumerate([(-.20,-.13,.54,1.08),(.34,.19,.38,.73),(-.40,.38,.27,.52),(.33,-.40,.24,.38)]):
        sectors,levels=48,43
        persistent=[rng.uniform(-.028,.028) for _ in range(sectors)]
        verts=[];faces=[]
        for row in range(levels):
            t=row/(levels-1)
            taper=1-.22*t-.16*max(0,(t-.77)/.23)+.025*math.sin(t*11+index)
            for j in range(sectors):
                a=j*math.tau/sectors
                # Deep narrow clefts keep the geometry readable at map scale.
                cleft=.13*max(0,math.cos(a*5+index))**12
                contour=1+.12*math.sin(a*3+.4*index)+.075*math.sin(a*7+.8)-cleft+persistent[j]
                ledge=.010*math.sin(t*math.tau*8+.25*math.sin(a*3))+.005*math.sin(t*math.tau*17+a*.1)
                rr=radius*(taper*contour+ledge)
                z=t*height+.012*math.sin(a*4+.8)*math.sin(t*math.pi)
                dx=math.copysign(abs(math.cos(a))**.72,math.cos(a));dy=math.copysign(abs(math.sin(a))**.72,math.sin(a))
                verts.append((cx+rr*dx+.025*t*math.sin(index),cy+rr*dy,z))
        for row in range(levels-1):
            for j in range(sectors):
                k=(j+1)%sectors
                faces.append((row*sectors+j,row*sectors+k,(row+1)*sectors+k,(row+1)*sectors+j))
        center=len(verts);verts.append((cx+.025*math.sin(index),cy,height))
        for j in range(sectors):faces.append(((levels-1)*sectors+j,(levels-1)*sectors+(j+1)%sectors,center))
        faces.append(tuple(reversed(range(sectors))))
        obj=_mesh('Weathered crag / layered formation %02d'%index,verts,faces,c,MATS['rock'],smooth=False)
    # Low flat shards and fallen ledges, deliberately different from the cliffs.
    for index in range(12):
        a=index*math.tau/12+.3;distance=rng.uniform(.53,.74)
        bm=bmesh.new();bmesh.ops.create_icosphere(bm,subdivisions=2,radius=1)
        for v in bm.verts:
            v.co.x*=rng.uniform(.82,1.16);v.co.y*=.7;v.co.z*=.36
            v.co.z=max(-.20,v.co.z)
        mesh=bpy.data.meshes.new('Weathered crag / fallen shard');bm.to_mesh(mesh);bm.free()
        obj=bpy.data.objects.new('Weathered crag / talus %02d'%index,mesh);c.objects.link(obj)
        size=rng.uniform(.075,.14);obj.scale=(size,size,size);obj.location=(math.cos(a)*distance,math.sin(a)*distance,size*.21)
        obj.rotation_euler.z=a+rng.uniform(-.8,.8);mesh.materials.append(MATS['rock'])
        for p in mesh.polygons:p.use_smooth=False
    return finish(s,c,r,'outcrop-r02')


def rover():
    s,c,r=scene_for('RV02 science rover')
    # Six-wheel rocker-style support, sampling arm, camera mast and a compact
    # insulated instrument bay. These are cues from robotic exploration rovers.
    box(c,'Rover / titanium underframe',(.93,1.14,.14),(0,0,.35),'steel',.045)
    box(c,'Rover / insulated instrument bay',(.95,1.04,.35),(0,.02,.55),'ivory',.075)
    box(c,'Rover / navy top deck',(.88,.98,.035),(0,.02,.745),'navy',.025)
    for side in (-1,1):
        x=side*.67
        tube(c,'Rover / suspension rocker',[(side*.40,.02,.44),(x,-.45,.25),(x,.0,.25),(x,.48,.25)],.035,'brass')
        for y in (-.51,0,.51):
            o=cyl(c,'Rover / ribbed wheel',.235,.15,(x-side*.075,y,.25),'dark',32);o.rotation_euler.y=side*math.pi/2
            o=cyl(c,'Rover / exposed wheel hub',.10,.018,(x+side*.085,y,.25),'brass',24);o.rotation_euler.y=side*math.pi/2
            for i in range(14):
                a=i*math.tau/14
                o=box(c,'Rover / wheel chevron tread',(.17,.028,.018),(x,y+.232*math.sin(a),.25+.232*math.cos(a)),'steel',.004)
                o.rotation_euler.x=-a
        vents(c,side*.27,-.515,.56,.25,.20)
    tube(c,'Rover / camera mast',[(.24,-.31,.75),(.24,-.31,1.12),(.18,-.37,1.24)],.028,'steel')
    box(c,'Rover / stereo camera head',(.38,.18,.16),(.18,-.40,1.25),'ivory',.035)
    for x in (.07,.29):
        o=cyl(c,'Rover / stereo lens',.045,.028,(x,-.507,1.25),'dark',24);o.rotation_euler.x=math.pi/2
    # Folded sampling arm remains inside the unit footprint.
    tube(c,'Rover / sampling arm',[(-.31,-.40,.47),(-.43,-.70,.42),(.13,-.76,.30),(.35,-.75,.18)],.035,'brass')
    for loc in [(-.31,-.40,.47),(-.43,-.70,.42),(.13,-.76,.30)]:sphere(c,'Rover / arm articulation',loc,(.065,.065,.065),'steel',16,8)
    box(c,'Rover / instrument turret',(.16,.19,.13),(.35,-.75,.16),'ivory',.028)
    for x in (-.3,0,.3):
        box(c,'Rover / solar cell strip',(.25,.63,.009),(x,.10,.77),'navy',.003)
        for j in range(6):box(c,'Rover / cell busbar',(.24,.003,.003),(x,-.17+j*.108,.777),'steel',0)
    cyl(c,'Rover / communications pedestal',.07,.17,(-.27,.34,.76),'steel',20)
    dish=_lathe('Rover / communications dish',[(0,0),(.06,.006),(.15,.04),(.23,.09)],c,MATS['brass'],segments=32);dish.location=(-.27,.34,.91)
    tube(c,'Rover / antenna feed',[(-.27,.34,.92),(-.27,.34,1.10)],.012,'dark')
    return finish(s,c,r,'rover-rv02')


def shuttle():
    s,c,r=scene_for('L02 crew lander')
    profile=[(0,.36),(.46,.36),(.53,.53),(.52,1.14),(.43,1.40),(.24,1.62),(0,1.70)]
    _lathe('Lander / ivory pressure hull',profile,c,MATS['ivory'],segments=48)
    for radius,z in ((.47,.38),(.53,.53),(.52,1.13),(.43,1.4)):ring(c,'Lander / reinforced hull seam',radius,z,.015)
    for a in (0,math.pi/2,math.pi,math.pi*1.5):
        x,y=math.cos(a),math.sin(a)
        tube(c,'Lander / articulated landing strut',[(x*.43,y*.43,.67),(x*.76,y*.76,.16)],.035,'brass')
        tube(c,'Lander / hydraulic brace',[(x*.49,y*.49,.39),(x*.71,y*.71,.24)],.022,'steel')
        cyl(c,'Lander / footpad',.13,.045,(x*.76,y*.76,.025),'dark',20)
    for a in (.6,2.54):
        x,y=.505*math.cos(a),-.505*math.sin(a)
        box(c,'Lander / cockpit observation window',(.22,.03,.19),(x,y,1.24),'navy',.045,rot=a-math.pi/2)
    hatch(c,0,-.535,.83,.34,.48)
    for z in (.24,.34,.44):tube(c,'Lander / boarding ladder',[(-.18,-.63,z),(.18,-.63,z)],.014,'brass')
    for x in (-.18,.18):tube(c,'Lander / ladder rail',[(x,-.63,.17),(x,-.63,.64)],.014,'steel')
    for x,y in ((-.21,.12),(.21,.12),(0,-.20)):
        o=_lathe('Lander / engine bell',[(.09,.12),(.08,.08),(.14,0),(.11,0),(.06,.08)],c,MATS['dark'],segments=24,closed=True);o.location=(x,y,.18)
    return finish(s,c,r,'shuttle-l02')


def astronaut():
    s,c,root=scene_for('A02 exploration suit')
    # Anatomical proportion: 1.85 m high, 0.65 m shoulder width. Feet at z=0.
    # Rigid authored segments provide deterministic web animation at local pivots.
    MATS['suit']=_material('A02 / woven pressure garment',(.72,.69,.59),.02,.74)
    MATS['visor']=_material('A02 / gold coated visor',(.18,.11,.035),.88,.14)
    MATS['seam']=_material('A02 / flexible joint fabric',(.075,.086,.089),.05,.78)
    def empty(name,loc,parent=root):
        o=bpy.data.objects.new(name,None);c.objects.link(o);o.location=loc;o.parent=parent;return o
    def parented(obj,joint):obj.parent=joint;return obj
    def ell(n,loc,scale,mat,joint):return parented(sphere(c,n,loc,scale,mat,24,12),joint)
    def bx(n,dim,loc,mat,joint,bevel=.02):return parented(box(c,n,dim,loc,mat,bevel),joint)
    body=empty('torso',(0,0,.99))
    ell('Pressure garment / torso',(0,0,.25),(.265,.17,.35),'suit',body)
    bx('Hard upper torso / chest plate',(.39,.07,.29),(0,-.158,.31),'ivory',body,.065)
    bx('Chest / control panel',(.23,.048,.12),(0,-.207,.31),'dark',body,.018)
    for x in (-.065,.0,.065):bx('Chest / glove operable control',(.027,.02,.027),(x,-.237,.31),'brass',body,.008)
    bx('PLSS / life support backpack',(.42,.20,.49),(0,.23,.30),'ivory',body,.07)
    bx('PLSS / radiator inset',(.32,.025,.31),(0,.342,.32),'dark',body,.015)
    for i in range(8):bx('PLSS / radiator fin',(.29,.027,.012),(0,.360,.19+i*.037),'steel',body,.002)
    for side in (-1,1):
        tube_obj=tube(c,'PLSS / breathing hose',[(side*.22,.20,.19),(side*.32,.0,.16),(side*.21,-.20,.12)],.022,'dark',8);parented(tube_obj,body)
    collar=parented(cyl(c,'Helmet / locking neck ring',.186,.055,(0,0,.55),'brass',32),body)
    head=empty('helmet',(0,0,.63),body)
    ell('Helmet / protective shell',(0,0,.045),(.219,.206,.23),'ivory',head)
    ell('Helmet / inset visor',(0,-.155,.057),(.183,.085,.153),'visor',head)
    for side in (-1,1):
        bx('Helmet / task lamp',(.052,.065,.055),(side*.18,-.106,.15),'ivory',head,.018)
        bx('Helmet / lamp lens',(.035,.012,.031),(side*.18,-.142,.15),'amber',head,.008)
    pelvis=empty('pelvis',(0,0,.92))
    ell('Pressure garment / pelvis',(0,0,.03),(.23,.16,.16),'suit',pelvis)
    for side,label in ((-1,'L'),(1,'R')):
        shoulder=empty('shoulder_'+label,(side*.27,0,1.42))
        ell('Shoulder / bearing',(side*.015,0,0),(.12,.13,.13),'ivory',shoulder)
        ell('Upper arm / pressure sleeve',(side*.03,0,-.15),(.10,.105,.19),'suit',shoulder)
        elbow=empty('elbow_'+label,(side*.04,0,-.29),shoulder)
        ell('Elbow / convolute joint',(0,0,0),(.09,.10,.075),'seam',elbow)
        ell('Forearm / pressure sleeve',(0,-.014,-.12),(.087,.095,.14),'suit',elbow)
        cuff=parented(cyl(c,'Wrist / cuff seal',.082,.04,(0,-.014,-.265),'brass',24),elbow)
        ell('Glove / palm',(0,-.02,-.30),(.077,.064,.09),'suit',elbow)
        ell('Glove / thumb',(-side*.055,-.035,-.28),(.03,.035,.065),'suit',elbow)
        hip=empty('hip_'+label,(side*.13,0,.90))
        ell('Thigh / pressure garment',(0,0,-.18),(.115,.13,.23),'suit',hip)
        bx('Thigh / utility pocket',(.15,.055,.17),(0,-.12,-.16),'ivory',hip,.028)
        knee=empty('knee_'+label,(0,0,-.37),hip)
        ell('Knee / flexible joint',(0,0,0),(.10,.10,.075),'seam',knee)
        bx('Knee / protective cap',(.16,.07,.12),(0,-.09,-.005),'ivory',knee,.04)
        ell('Lower leg / garment',(0,.005,-.17),(.095,.105,.18),'suit',knee)
        bx('Boot / overboot',(.19,.30,.14),(0,-.055,-.42),'suit',knee,.055)
        bx('Boot / tread sole',(.20,.32,.045),(0,-.055,-.49),'dark',knee,.018)
        for j in range(5):bx('Boot / sole grip',(.19,.025,.012),(0,-.18+j*.06,-.515),'dark',knee,.003)
    # Export preserves semantic pivots. Unlike the static kit, no whole-scene
    # batching can be applied across animated joints. Join by parent+material.
    bpy.context.view_layer.update()
    deps=bpy.context.evaluated_depsgraph_get();groups={}
    suit_vertex=_material('A02 / colored garment atlas',(1,1,1),.12,.57)
    vertex=suit_vertex.node_tree.nodes.new('ShaderNodeVertexColor');vertex.layer_name='Color'
    suit_vertex.node_tree.links.new(vertex.outputs['Color'],suit_vertex.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
    for source in list(c.objects):
        if source.type!='MESH':continue
        ev=source.evaluated_get(deps);mesh=ev.to_mesh()
        parent=source.parent or root;transform=parent.matrix_world.inverted_safe()@ev.matrix_world
        for p in mesh.polygons:
            mat=mesh.materials[p.material_index]
            special=mat.name.startswith('A02 / gold coated visor')
            key=(parent,MATS['visor'] if special else suit_vertex)
            data=groups.setdefault(key,{'vertices':[],'faces':[],'smooth':[],'colors':[],'normals':[]})
            start=len(data['vertices'])
            data['vertices'].extend(tuple(transform@mesh.vertices[i].co) for i in p.vertices)
            data['faces'].append(tuple(range(start,start+len(p.vertices))));data['smooth'].append(p.use_smooth)
            data['colors'].extend([tuple(mat.diffuse_color)]*len(p.vertices))
            nt=transform.to_3x3().inverted_safe().transposed()
            data['normals'].extend(tuple((nt@mesh.corner_normals[i].vector).normalized()) for i in p.loop_indices)
        ev.to_mesh_clear()
    # Keep the complete authoring scene; build a separate export scene instead
    # of removing objects while Blender's dependency graph evaluates them.
    staging=bpy.data.scenes.new('Ares Atlas / A02 compact runtime export')
    compact=bpy.data.collections.new('A02 / compact animated segments');staging.collection.children.link(compact)
    copied={}
    for o in c.objects:
        if o.type=='EMPTY':
            semantic=o.name;o.name=semantic+'_AUTHOR'
            q=bpy.data.objects.new(semantic,None);compact.objects.link(q);q.matrix_basis=o.matrix_basis.copy();copied[o]=q
    for o,q in copied.items():
        if o.parent in copied:q.parent=copied[o.parent]
    for (parent,mat),data in groups.items():
        obj=_mesh(parent.name+' / '+mat.name,data['vertices'],data['faces'],compact,mat);obj.parent=copied[parent]
        for p,sm in zip(obj.data.polygons,data['smooth']):p.use_smooth=sm
        obj.data.normals_split_custom_set(data['normals'])
        color=obj.data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
        for item,value in zip(color.data,data['colors']):item.color=value
    bpy.context.window.scene=staging
    bpy.ops.object.select_all(action='DESELECT')
    for obj in compact.objects:obj.select_set(True)
    bpy.context.view_layer.objects.active=copied[root]
    path=OUT/'astronaut-a02.glb'
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_apply=False,export_animations=False,export_cameras=False,export_lights=False,export_extras=True)
    # Empty names must remain stable even when the authoring originals coexist.
    return {'asset':'astronaut-a02','bytes':path.stat().st_size,'source_scene':s.name,'export_scene':staging.name,'height_metres':1.895,'gltf_forward':'+Z','gltf_up':'Y','joints':['torso','helmet','pelvis','shoulder_L','shoulder_R','elbow_L','elbow_R','hip_L','hip_R','knee_L','knee_R'],'material_batches':len(groups),'notes':'Rigid articulated Blender-authored pressure garment; not a skinned motion-capture character.'}


selected=globals().get('ARES_ASSET_FUNCTIONS')
builders=(solar,oxygen,ice,shield,battery,mine,dome,reactor,outcrop,rover,shuttle,astronaut)
results=[fn() for fn in builders if not selected or fn.__name__ in selected]
scenes={bpy.data.scenes[r['source_scene']] for r in results}
kind='astronaut' if selected==['astronaut'] else 'vehicles' if selected==['rover','shuttle'] else 'outcrop' if selected==['outcrop'] else 'surface-kit'
blend=BASE/('art/blender/exports/ares-'+kind+'-s02.blend' if kind!='astronaut' else 'art/blender/exports/ares-astronaut-a02.blend')
bpy.data.libraries.write(str(blend),scenes,fake_user=True,compress=True)
manifest={'version':'S02','authoring':'Blender 5.2, original scripted asset authoring','assets':results,'blend':str(blend.relative_to(BASE))}
for item in manifest['assets']:
    item.pop('path',None)
(OUT/(kind+'-manifest.json')).write_text(json.dumps(manifest,indent=2)+'\n')
result=manifest
