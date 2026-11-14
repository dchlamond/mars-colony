# Ares Atlas Blender workshop

Original habitat, sealed greenhouse and mineral textures, authored through the
official Blender Lab MCP integration. The playable game uses their exported
assets in `game/assets/ares/` with the matching interface and procedural crew
animation in `game/ares-world.js`.

| Editable source | Runtime result |
| --- | --- |
| `build_ares_habitat.py` | Ivory pressure dome, brass ribs, framed windows, airlock and service deck. High: 45,464 triangles, nine material batches. Low uses a separate 5,300-triangle runtime silhouette. |
| `build_ares_greenhouse.py` | Sealed glazing, interior crop beds, irrigation, airlock and climate cabinets. 9,690 triangles, seven batches. |
| `create_ares_regolith.py` | Original seamless 512px colour, height and normal textures. Artistic surface detail over the NASA-derived global map. |
| `render_ares_ui_previews.py` | Transparent habitat preview rendered from the editable Blender scene. The greenhouse authoring script renders its own preview. |

Editable scenes are preserved in `exports/ares-habitat-h01-v02.blend` and
`exports/ares-greenhouse-g01.blend`. Models are resized to consistent footprints
in the runtime. They are illustrative colony architecture, not validated hardware.

## Reproduce or extend an asset

Use Blender 5.2, with this repository as the working directory. The scripts use
their file location to find the repository when run with Blender's `--python`
option. Through an MCP code-execution tool, set `ARES_REPO` explicitly:

```python
from pathlib import Path
ARES_REPO = Path('/absolute/path/to/mars-colony')
source = ARES_REPO / 'art/blender/build_ares_habitat.py'
exec(compile(source.read_text(), str(source), 'exec'))
result = build_ares_habitat()
```

The habitat author creates an isolated scene. Its save/export helpers refuse to
overwrite an existing destination; pass a new output filename and the returned
scene name. The greenhouse script creates and exports its scene, also refusing
existing GLB/Blend destinations. The regolith script regenerates its three named
textures. Existing scenes are preserved.

```python
result = export_asset_glb('/absolute/new/path/habitat.glb', scene_name='returned scene')
```

## Verification and remaining work

`tests/ares-graphics.cjs` loads the real exports through Three.js r128, checks
material isolation, model footprints, bounded mesh batches, starter crew, walking,
pause and reduced-motion behavior. The Low graphics option substitutes lighter
geometry and reduces surface scatter. `tools/bundle.py` embeds the assets for the
offline game.

The real-time materials deliberately simplify Blender's procedural building
shaders. Building texture baking, fuller character rigs and measured classroom
device performance remain future work. This implemented art pass does not claim
AAA parity. See `AI_USE.md` for the AI-assisted authoring disclosure.
