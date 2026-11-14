"""Build the same game as an offline HTML, with local libraries and assets embedded."""
from pathlib import Path
import re, base64, mimetypes
root=Path(__file__).resolve().parents[1]; game=root/'game'; s=(game/'index.html').read_text()
def data(p):
    mime={'.woff2':'font/woff2','.glb':'model/gltf-binary'}.get(p.suffix) or mimetypes.guess_type(p.name)[0] or 'application/octet-stream'
    return 'data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode()
def css(text):
    return re.sub(r'''url\((['"]?)(assets/[^)'"\s]+)\1\)''',lambda m:'url('+data(game/m[2])+')',text)
s=re.sub(r'<link rel="stylesheet" href="([^"]+)">',lambda m:'<style>'+css((game/m[1]).read_text())+'</style>',s)
s=css(s)
s=re.sub(r'<script src="([^"]+)"></script>',lambda m:'<script>'+ (game/m[1]).read_text().replace('</script','<\\/script')+'</script>',s)
images={str(p.relative_to(game)):data(p) for p in (game/'assets').glob('mars*.jpg')}
for directory in ('ares', 'ares-ui'):
    for p in (game/'assets'/directory).rglob('*'):
        if p.is_file() and p.suffix.lower() in ('.glb','.jpg','.jpeg','.png','.webp','.svg'):
            images[str(p.relative_to(game))]=data(p)
images['mission-guide.html']=data(game/'mission-guide.html')
import json
embedded='<script>window.INLINE='+json.dumps(images)+';</script>\n'
embedded+='<script id="dracosrc" type="text/plain">'+(game/'assets/draco/draco_decoder.js').read_text().replace('</script','<\\/script')+'</script>\n'
for p in (game/'assets').glob('model_*.js'):
    embedded+='<script>'+p.read_text().replace('</script','<\\/script')+'</script>\n'
s=s.replace('<body>','<body>\n'+embedded)
(root/'dist').mkdir(exist_ok=True);(root/'dist/Mars-Colony.html').write_text(s)
print('Built',len(s),'bytes')
