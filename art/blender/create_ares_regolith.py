"""Author original seamless regolith colour/height/normal textures inside Blender.

The mineral texture is artistic, not an observed or reconstructed Mars site.
Periodic noise coordinates guarantee matching edges. Normal maps derive from the
same height field. No photograph or reference image is edited or used as texture.
"""
import bpy
import math
from mathutils import Vector
from mathutils.noise import noise
from pathlib import Path

BASE=Path(globals().get('ARES_REPO') or (Path(__file__).resolve().parents[2] if '__file__' in globals() else Path.cwd()))
out=BASE/'game/assets/ares'
out.mkdir(parents=True, exist_ok=True)
n=512
heights=[]
for y in range(n):
    v=y/(n-1)*math.tau
    for x in range(n):
        u=x/(n-1)*math.tau
        p=Vector((math.cos(u)*4,math.sin(u)*4,math.cos(v)*4+math.sin(v)*2.7))
        broad=noise(p)*.24+noise(p*3.3)*.14+noise(p*11.7)*.08
        ridge=math.sin(12*u+2*math.sin(v)+math.sin(3*v))*.018
        heights.append(.5+broad+ridge)

colour=[];height_pixels=[];normals=[]
for y in range(n):
    for x in range(n):
        h=heights[y*n+x]
        # Linear mineral colours, saved with the image's sRGB transform.
        colour.extend((.16+h*.20,.038+h*.085,.014+h*.034,1))
        height_pixels.extend((h,h,h,1))
        dx=heights[y*n+(x+1)%(n-1)]-heights[y*n+(x-1)%(n-1)]
        dy=heights[((y+1)%(n-1))*n+x]-heights[((y-1)%(n-1))*n+x]
        normal=Vector((-dx*7,-dy*7,1)).normalized()
        normals.extend((normal.x*.5+.5,normal.y*.5+.5,normal.z*.5+.5,1))

paths=[]
for label,pixels,space in [('regolith-colour',colour,'sRGB'),('regolith-height',height_pixels,'Non-Color'),('regolith-normal',normals,'Non-Color')]:
    image=bpy.data.images.new('Ares / '+label,width=n,height=n,alpha=True)
    image.colorspace_settings.name=space
    image.pixels.foreach_set(pixels)
    image.filepath_raw=str(out/(label+'.png'))
    image.file_format='PNG'
    image.save()
    paths.append(image.filepath_raw)
result={'textures':paths,'size':[n,n],'source':'Original periodic noise texture authored inside Blender; not NASA measurement'}
