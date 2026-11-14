#!/usr/bin/env python3
# AI disclosure: this script was generated with Claude (Anthropic). See AI_USE.md.
"""Turn the single-file game (Mars-Colony.html) into the deployable game/ folder.

Usage:  python3 tools/split.py path/to/Mars-Colony.html game

WARNING: this overwrites game/index.html and the model files. The repository copy has moved on from the
single-file export (bug fixes, local fonts, logo removal, Walk mode), so only run this to import a build
you then intend to merge by hand.

Use this when a new version arrives as one big HTML file. It pulls the 3D
library, the map images, the NASA models and the model decoder out into
separate files, and leaves the game code in game/index.html.
"""
import sys, re, os, json, base64

src, out = sys.argv[1], sys.argv[2]
html = open(src, encoding='utf-8').read()
os.makedirs(f'{out}/assets/draco', exist_ok=True)
os.makedirs(f'{out}/vendor', exist_ok=True)
done = set()

def write(path, text):
    with open(f'{out}/{path}', 'w', encoding='utf-8') as f:
        f.write(text.strip('\n') + '\n')
    done.add(path)

def handle(m):
    attrs, body = m.group(1), m.group(2)
    head = body[:4000]
    if 'id="dracosrc"' in attrs:
        write('assets/draco/draco_decoder.js', body); return ''
    if 'Three.js Authors' in head:
        write('vendor/three.min.js', body); return '<script src="vendor/three.min.js"></script>'
    if 'class GLTFLoader' in head:
        write('vendor/GLTFLoader.js', body); return '<script src="vendor/GLTFLoader.js"></script>'
    if 'class DRACOLoader' in head:
        write('vendor/DRACOLoader.js', body); return '<script src="vendor/DRACOLoader.js"></script>'
    s = body.strip()
    if s.startswith('window.INLINE='):
        for name, uri in json.loads(s[len('window.INLINE='):].rstrip(';')).items():
            with open(f'{out}/{name}', 'wb') as f:
                f.write(base64.b64decode(uri.split(',', 1)[1]))
            done.add(name)
        return ''
    mm = re.match(r'\(window\.MODEL_DATA=window\.MODEL_DATA\|\|\{\}\)\["(\w+)"\]', s)
    if mm:
        write(f'assets/model_{mm.group(1)}.js', body); return ''
    return m.group(0)  # the game's own code stays in the page

page = re.sub(r'<script([^>]*)>(.*?)</script>', handle, html, flags=re.S)
page = re.sub(r'\n{3,}', '\n\n', page)
with open(f'{out}/index.html', 'w', encoding='utf-8') as f:
    f.write(page)
for p in sorted(done):
    print('wrote', p)
print('wrote index.html', len(page) // 1024, 'KB')
