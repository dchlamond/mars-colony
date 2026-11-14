# Ares Atlas runtime art

This folder contains the original Blender asset kit, the NASA-derived terrain
exports and the artistic surface textures used by the playable Ares game. The
selected visual direction is ivory pressure architecture, bronze fittings, navy
panels, rust terrain and warm occupied windows.

## Models and images

| Files | Runtime role |
| --- | --- |
| `habitat-h01.glb`, `habitat-h01-low.glb` | Landing habitat and additional homes. High: 45,464 triangles; Low: 8,063. Nine material batches. |
| `greenhouse-g01.glb` | Sealed greenhouse with crop beds, irrigation, airlock and climate cabinets. 9,690 triangles, seven batches. |
| `solar-s02.glb`, `moxie-o02.glb`, `ice-w02.glb`, `shield-r02.glb`, `battery-b02.glb`, `mine-m02.glb`, `dome-d02.glb`, `reactor-p02.glb` | The other eight colony building types. These are actual Blender exports, not card illustrations or replacement runtime primitive shapes. |
| `astronaut-a02.glb`, `astronaut-a02-low.glb` | Original articulated pressure suit with visor, life-support pack and named limb pivots. High: 16,820 triangles; Low: 6,580. Twelve material batches. |
| `rover-rv02.glb`, `shuttle-l02.glb` | Original science rover and fictional crew lander. |
| `surface-dosimeter.glb` | Original handheld radiation dosimeter with pressure glove and sleeve: 8,592 triangles, five material batches. Its runtime screen is an explicitly simulated relative index, not a calibrated NASA instrument or thermometer. |
| `outcrop-r02.glb`, `outcrop-r02-low.glb` | Layered weathered crags, fractures and fallen talus. High: 17,464 triangles; Low: 1,746. One material batch. The lighter mesh is also used for repeated runtime rock instances. |
| `mars-mola-terrain.glb`, `mars-mola-low.glb` | Blender export of the existing NASA MOLA-derived world relief: 129,600 and 32,400 triangles respectively. No replacement scientific heights are invented. |
| `*-preview.png` | Transparent Blender Cycles renders of the actual building and vehicle models for the interface. |
| `regolith-colour.png`, `regolith-height.png`, `regolith-normal.png` | Original seamless 512px mineral maps authored in Blender. The height and normal detail are illustrative. |
| `grok-regolith.jpg` | Original Grok Imagine colour artwork used as local terrain material detail. It is not a NASA photograph or measured geological map. |

The full [surface-kit inventory and primary NASA design references](SURFACE-KIT.md)
explain the visual engineering cues and their limits. JSON manifests record
bounds, geometry counts, file sizes and source scenes. Editable Blender sources
and `.blend` files are in [art/blender](../../../art/blender/README.md).

`game/ares-world.js` loads all eleven building roles from these GLBs after assets
are ready. `game/ares-render.js` integrates the map, authored suits, rover, lander,
rocks and lighting. Named suit joints support walking, instrument checks,
construction and gardening poses. The current character uses rigid articulated
segments, not skeletal skinning or motion capture.

`game/surface-survey.js` renders the held instrument and a visible rock teaching
site using the authored outcrop. The site is an artistic comparison marker three
tiles from the colony; it is not a measured NASA location. Survey readings and
Fame use explicit simulation rules, with source explanations in the game.

## Provenance

The measured global shape comes from NASA's Mars Global Surveyor MOLA instrument,
via [NASA Mars Trek](https://trek.nasa.gov/mars/). The terrain export reads the
project's existing 360×180 sampled height array and preserves its exaggerated
height formula. Local geological formations, soil detail, lighting and colony
architecture are artistic; they do not identify surveyed landing-site features.

The Grok regolith generation is recorded in [NOTICE](../../../NOTICE). The
separate fictional guide portrait and generation record are in
[ares-ui/ARTWORK.md](../ares-ui/ARTWORK.md). [AI_USE.md](../../../AI_USE.md) records
AI-assisted code, geometry, images and documentation. No NASA endorsement or
flight-readiness claim is implied.

## Lighting and portability

GLBs carry authored geometry and PBR material parameters. They do not embed the
Cycles preview's path-traced lighting. The browser uses shadow maps and High-mode
screen-space occlusion, with a lighter Low path. The offline bundler embeds models
and images so the same art can load without an internet connection.

The [UE5 handoff](../../../art/unreal/README.md) prepares these assets for a Lumen
art study, but Unreal Editor was unavailable and no Unreal render, `.umap`, native
game or packaged build was verified. Further surface baking, character skinning
and real classroom-hardware profiling remain work; this asset pass does not
claim AAA parity or hardware ray tracing in the browser.
