# Ares Atlas Blender workshop

The playable Ares game loads original Blender-authored colony buildings, articulated
astronauts, a science rover, a crew lander, geological formations and NASA-derived
terrain. Grok Imagine supplies the artistic regolith colour and fictional guide
portrait. `game/ares-world.js` loads the building kit; `game/ares-render.js` integrates
the terrain, suits, vehicles, rocks and real-time lighting.

## Authoring pipeline

| Source | Export and purpose |
| --- | --- |
| `build_ares_habitat.py` | H-01 pressure dome, airlock, windows and service deck: 45,464 triangles, nine material batches. |
| `build_ares_greenhouse.py` | G-01 sealed greenhouse with internal crops, irrigation and climate equipment: 9,690 triangles, seven batches. |
| `build_ares_surface_kit.py` | Eight further building types, articulated A-02 suit, science rover, crew lander and layered weathered crags. Static assets are batched by material; the suit preserves named joints. |
| `build_surface_dosimeter.py` | Original handheld dosimeter, pressure glove and sleeve: 8,592 triangles and five material batches. The display plane is filled by the runtime simulation, with no claim to measured instrument calibration. |
| `export_ares_lods.py` | Blender-derived Low models: habitat 8,063 triangles; suit 6,580; crag 1,746. These replace the former runtime-only Low habitat silhouette. |
| `build_mola_terrain.py` | Exports the existing 360×180 MOLA height sample as High and Low GLBs with UVs and normals. It preserves the simulation's elevation formula and exaggerated vertical scale. |
| `create_ares_regolith.py` | Original seamless 512px colour, height and normal textures. These are illustrative mineral detail, not measured NASA microtopography. |
| `render_surface_thumbnails.py` | Transparent 256px Cycles previews rendered from the actual exported building and vehicle GLBs. |
| `render_surface_kit.py` | Cycles material/proportion review of the exported surface kit. Review output is separate from the browser renderer. |
| `render_ares_ui_previews.py` | Habitat preview; the greenhouse authoring script renders its own preview. |
| `build_ares_lookdev_ground.py` | Original textured 24×24 m terrain patch for the optional Unreal art study. It is invented look-development terrain, separate from the MOLA map. |

Editable source scenes are in `exports/`:

- `ares-habitat-h01-v02.blend`
- `ares-greenhouse-g01.blend`
- `ares-surface-kit-s02.blend`
- `ares-astronaut-a02.blend`
- `ares-vehicles-s02.blend`
- `ares-outcrop-s02.blend` — the revised layered formations supersede the earlier
  rock shapes in the original surface-kit scene.
- `surface-dosimeter.blend` — editable first-person glove and instrument.

Building models are resized to consistent strategy-map footprints at runtime.
The authored suit is 1.895 units tall, Y-up and +Z-forward after glTF export. Its
shoulders, elbows, hips, knees, torso and helmet have named rigid pivots. Runtime
walking and work poses rotate these pivots; this is not a motion-capture or fully
skinned character pipeline. See the complete [surface-kit inventory and NASA
design sources](../../game/assets/ares/SURFACE-KIT.md) and adjacent JSON manifests.

## Reproduce or extend

Use Blender 5.2 with the repository as the working directory. `--python` execution
resolves paths from the source file. The surface kit, LODs, terrain and thumbnails
can run in isolated background processes. Through the official Blender MCP
code-execution tool, set the repository explicitly:

```python
from pathlib import Path
ARES_REPO = Path('/absolute/path/to/mars-colony')
source = ARES_REPO / 'art/blender/build_ares_surface_kit.py'
ARES_ASSET_FUNCTIONS = ['solar', 'oxygen', 'ice', 'shield', 'battery',
                        'mine', 'dome', 'reactor', 'outcrop']
exec(compile(source.read_text(), str(source), 'exec'))
```

The optional function selection also accepts `astronaut`, `rover` and `shuttle`.
The kit creates isolated authoring scenes and separate export scenes. It replaces
only its named reproducible output files. The older habitat and greenhouse export
helpers instead refuse existing destinations; supply new filenames when using
those helpers. The regolith and thumbnail scripts regenerate their named images.

The initial surface-kit export used the official Blender MCP bridge. A Blender
dependency-graph crash interrupted the first astronaut attempt. Final exports and
renders were produced in isolated Blender processes; the dedicated MCP workshop
was restored and verified. The user's separate original Blender window remained
untouched. No direct native Blender tool namespace was verified in the chat.

## Scientific and art sources

- [NASA Mars Trek](https://trek.nasa.gov/mars/) supplies the project's MOLA elevation
  source. The Blender terrain exporter reads the existing embedded DEM bytes; it
  does not invent replacement scientific heights or add site-level survey detail.
- [SURFACE-KIT.md](../../game/assets/ares/SURFACE-KIT.md) links NASA sources for
  MOXIE, water prospecting, power radiators, habitat construction, suits, rovers and
  lander legs. The kit is an original artistic interpretation, not flight hardware.
- [NOTICE](../../NOTICE) records NASA data attribution and the Grok-generated
  regolith image. [AI_USE.md](../../AI_USE.md) records AI-assisted authoring.
- The [Unreal handoff](../unreal/README.md) reuses these GLBs and the authored
  ground patch. Its source/configuration preflight is separate from running UE5.

## Verification and limits

GLB container checks validate version, byte length, scene roots, finite bounds and
astronaut joint names. Cycles renders inspect actual exported geometry. Browser
tests in `tests/ares-graphics.cjs` and the release checks verify loading, dimensions,
material isolation and motion; `tools/bundle.py` embeds the art for offline play.
High and Low select authored meshes with different geometry and lighting budgets.
The LOD exporter welds coincident glTF vertices and recalculates normals before
decimation; this preserves continuous surfaces instead of deleting disconnected
flat-shaded triangles. The single close-up survey outcrop uses the full mesh.

Blender Cycles uses path tracing for previews. The browser uses Three.js PBR,
shadow maps and High-mode screen-space ambient occlusion; importing a GLB does not
provide hardware ray tracing or Lumen. Unreal Editor was unavailable, so the UE5
project is a prepared, source-checked art-study scaffold, not a tested render or
gameplay port. Building texture baking, fully skinned character work and measured
classroom-device performance remain further work. No AAA parity is claimed.
