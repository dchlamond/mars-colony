#!/usr/bin/env python3
# AI disclosure: this script was generated with Claude (Anthropic). See AI_USE.md.
"""Paint over NASA insignia, flags, agency logos and mission patches in the
textures of the four NASA 3D models, as the Space Apps rules require.

Usage:  python3 tools/strip_logos.py game/assets [preview_dir]

Each model file holds a .glb as base64. Every texture is stored twice (WebP and
a JPEG/PNG fallback), so both copies are patched. Regions are fractions of the
texture size: (x0, y0, x1, y1, mode). Modes: 'l' copy the pixel just left of
the region along each row, 'r' the pixel just right, 's' one solid colour
sampled just outside the top-left corner.
"""
import sys, re, io, json, base64, struct
from PIL import Image

N = 1024.0
def px(*a): return tuple(v / N for v in a[:4]) + (a[4],)
def sh(scale, ox, oy, x0, y0, x1, y1, mode):   # from a contact-sheet measurement
    return ((x0 - ox) * scale / N, (y0 - oy) * scale / N, (x1 - ox) * scale / N, (y1 - oy) * scale / N, mode)

REGIONS = {
 'habitat': {1: [px(131, 0, 149, 668, 'l'), px(186, 55, 262, 300, 'r'), px(186, 380, 262, 615, 'r'),
                 px(38, 236, 90, 282, 'l'), px(68, 560, 120, 605, 'r')]},
 'astronaut': {1: [sh(1024/900, 900, 0, 1670, 22, 1746, 74, 'l'), sh(1024/900, 900, 0, 1682, 157, 1738, 211, 'l'),
                   sh(1024/900, 900, 0, 1592, 336, 1661, 392, 'l'), sh(1024/900, 900, 0, 1600, 626, 1657, 673, 'l')]},
 'insight': {1: [sh(1024/900, 0, 0, 27, 246, 346, 319, 's')]},
 'perseverance': {
   1:  [sh(1024/800, 0, 0, 138, 694, 222, 736, 'l'), sh(1024/800, 0, 0, 303, 654, 373, 696, 'l')],
   23: [sh(1024/800, 800, 800, 1232, 862, 1376, 930, 's'), sh(1024/800, 800, 800, 1210, 892, 1240, 931, 'r')],
   37: [(5/512, 24/512, 500/512, 215/512, 's'), (100/512, 270/512, 300/512, 350/512, 'l')],
   21: [(6/640, 80/320, 114/640, 147/320, 'l'), (553/640, 128/320, 1.0, 1.0, 's')],
 },
}

def patch(img, regions):
    im = img.convert('RGBA') if img.mode in ('RGBA', 'LA', 'P') else img.convert('RGB')
    p = im.load(); W, H = im.size
    for x0, y0, x1, y1, mode in regions:
        a, b, c, d = int(x0 * W), int(y0 * H), min(W, int(round(x1 * W))), min(H, int(round(y1 * H)))
        solid = p[max(0, a - 3), max(0, b - 3)]
        for y in range(b, d):
            col = solid if mode == 's' else p[max(0, a - 3), y] if mode == 'l' else p[min(W - 1, c + 2), y]
            for x in range(a, c): p[x, y] = col
    return im

def run(path, key, preview=None):
    s = open(path).read()
    m = re.search(r'(\]=")([A-Za-z0-9+/=]+)(")', s)
    b = base64.b64decode(m.group(2))
    jl = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + jl]); bin0 = 20 + jl + 8
    views = j['bufferViews']
    data = [b[bin0 + v.get('byteOffset', 0): bin0 + v.get('byteOffset', 0) + v['byteLength']] for v in views]
    for idx, regions in REGIONS[key].items():
        for i in (idx - 1, idx):            # WebP copy, then the fallback
            im_def = j['images'][i]; raw = data[im_def['bufferView']]
            out = patch(Image.open(io.BytesIO(raw)), regions); buf = io.BytesIO()
            mt = im_def.get('mimeType')
            if mt == 'image/webp': out.save(buf, 'WEBP', quality=88, method=4)
            elif mt == 'image/png': out.save(buf, 'PNG', optimize=True)
            else: out.convert('RGB').save(buf, 'JPEG', quality=90)
            data[im_def['bufferView']] = buf.getvalue()
            if preview and i == idx: out.convert('RGB').save(f'{preview}/{key}_{idx}.jpg', quality=85)
    blob = bytearray()
    for v, d in zip(views, data):
        while len(blob) % 4: blob.append(0)
        v['byteOffset'] = len(blob); v['byteLength'] = len(d); blob += d
    while len(blob) % 4: blob.append(0)
    j['buffers'][0]['byteLength'] = len(blob)
    js = json.dumps(j, separators=(',', ':')).encode()
    js += b' ' * (-len(js) % 4)
    glb = b'glTF' + struct.pack('<II', 2, 12 + 8 + len(js) + 8 + len(blob)) + struct.pack('<I', len(js)) + b'JSON' + js + struct.pack('<I', len(blob)) + b'BIN\x00' + bytes(blob)
    open(path, 'w').write(s[:m.start(2)] + base64.b64encode(glb).decode() + s[m.end(2):])
    print(key, 'patched', len(b), '->', len(glb), 'bytes')

if __name__ == '__main__':
    d = sys.argv[1]; pv = sys.argv[2] if len(sys.argv) > 2 else None
    for key in REGIONS: run(f'{d}/model_{key}.js', key, pv)
