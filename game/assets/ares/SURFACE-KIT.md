# Ares Atlas surface kit S02

Original Blender-authored assets, 14 November 2026. These assets implement the
selected Ares Atlas art direction: ivory pressure shells, brushed bronze fittings,
navy photovoltaics, warm occupied windows and rust-coloured surface equipment.
They are fictional game designs informed by NASA engineering references. They
are not NASA flight hardware, approved Mars habitats, scale engineering models,
or evidence that people or fictional Martians live on Mars.

## Runtime assets

| File | Role | Triangles | Material batches |
| --- | --- | ---: | ---: |
| `solar-s02.glb` | Three inclined photovoltaic wings, braced frames, busbars, inverter | 4,116 | 5 |
| `moxie-o02.glb` | Oxygen processor, intake, tanks, insulated pipes | 7,912 | 4 |
| `ice-w02.glb` | Water processor, tanks, filtration, deployable sampling equipment | 6,064 | 5 |
| `shield-r02.glb` | Layered regolith refuge around an inner pressure module | 3,928 | 6 |
| `battery-b02.glb` | Insulated energy storage cabinets and fused external bus | 5,256 | 5 |
| `mine-m02.glb` | Regolith processing hopper, sampler and material bins | 3,590 | 4 |
| `dome-d02.glb` | Community pressure dome with reinforced seams and sealed entry | 5,920 | 5 |
| `reactor-p02.glb` | Surface power module with two heat rejection radiator panels | 7,120 | 4 |
| `outcrop-r02.glb` | Layered weathered crags, vertical fractures and fallen talus | 17,464 | 1 |
| `rover-rv02.glb` | Six-wheel science rover, suspension, camera mast and folded sampling arm | 18,652 | 5 |
| `shuttle-l02.glb` | Fictional crew lander with pressure cabin, legs and engine bells | 5,020 | 6 |
| `astronaut-a02.glb` | Articulated pressure garment, metallic visor, life-support pack, glove controls | 16,820 | 12 |

High/Low derived assets are exported by Blender rather than recreated as runtime
primitive shapes: habitat Low has 8,063 triangles, astronaut Low has 6,580 and
outcrop Low has 1,746. Exact file sizes and model bounds are in the manifests.

Static models use one mesh per material. The astronaut uses vertex colours to
combine garment materials per articulated body segment, plus a separate metallic
visor. Its semantic empty nodes are `shoulder_L`, `shoulder_R`, `elbow_L`,
`elbow_R`, `hip_L`, `hip_R`, `knee_L`, `knee_R`, `torso`, `pelvis`, and `helmet`.
Feet start approximately at zero; overall height is 1.895 authoring units. glTF
uses Y up and +Z forward. Neutral arms hang down. Runtime joint motion is authored
procedurally; it is not motion capture or a fully skinned character.

Each `*-preview.png` is a transparent Cycles render of its corresponding exported
GLB, not a separate invented building illustration. All GLBs contain only their
intended export scene and root; no Blender default cube, camera or light is included.

## NASA references and boundaries

Reviewed from NASA primary sources on 14 November 2026:

- [MOXIE mission completion](https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/): carbon-dioxide intake and oxygen processing motivate the O02 visual function. The building-scale tower and numerical game yields are fictional extrapolations.
- [PRIME-1 science and TRIDENT](https://science.nasa.gov/lunar-science/clps-deliveries/prime-1-im/): sampling drill and volatile analysis motivate W02 equipment. Lunar technology is an inspiration; the art does not claim this instrument operates on Mars or prove water at a chosen tile. Junior water processing can recycle water without fresh extraction.
- [Fission Surface Power](https://www.nasa.gov/exploration-systems-development-mission-directorate/fission-surface-power/): heat rejection and a separate power module motivate P02. The compact game layout is not a safe real reactor siting plan.
- [CHAPEA habitat](https://www.nasa.gov/humans-in-space/chapea/habitat/) and [3D-Printed Habitat Challenge](https://www.nasa.gov/prizes-challenges-and-crowdsourcing/centennial-challenges/3d-printed-habitat-challenge/): local-material construction motivates the layered refuge. No measured radiation performance is asserted for its artistic wall geometry.
- [Spacewalk spacesuit basics](https://www.nasa.gov/centers-and-facilities/johnson/spacewalk-spacesuit-basics/): pressure garment, hard torso and portable life support motivate A02. It is an original exploration suit without NASA branding.
- [Perseverance rover components](https://science.nasa.gov/mission/mars-2020-perseverance/rover-components/) and [rover wheels and suspension](https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/mars-2020-rover-gets-its-wheels/): six wheels, a camera mast and sampling turret motivate RV02. Its solar supply and styling are fictional and differ from Perseverance.
- [Mars lander leg tests](https://www.nasa.gov/solar-system/watch-nasa-engineers-put-a-mars-landers-legs-to-the-test/): landing footpads and braces motivate L02. It is not an actual NASA crew lander design.

No NASA logos, downloaded commercial game art or third-party asset-pack meshes
are included in this kit. Blender source, exported geometry and materials were
created for this project with AI-assisted scripting and human-selected art
direction. Blender Cycles review renders use path tracing; the browser game does
not acquire hardware ray tracing merely by importing these GLBs.

## Source and reproduction

The later BLACKOUT fieldwork addition includes `surface-dosimeter.glb`, an
original Blender glove and handheld instrument. Source:
`art/blender/build_surface_dosimeter.py`; editable scene:
`art/blender/exports/surface-dosimeter.blend`. It is fictional equipment and does
not reproduce a NASA flight instrument. The runtime display explicitly reports
a simulated relative exposure index. The visible rock-survey teaching site
reuses the authored outcrop; its placement and comparison marker are artistic,
not NASA survey coordinates or a radiation-shielding calculation.

- `art/blender/build_ares_surface_kit.py`: original geometry and material source.
- `art/blender/export_ares_lods.py`: Blender-derived lighter meshes.
- `art/blender/render_surface_thumbnails.py`: transparent runtime UI previews.
- `art/blender/render_surface_kit.py`: actual exported model review in Cycles.
- `art/blender/exports/ares-surface-kit-s02.blend`: editable static building kit.
- `art/blender/exports/ares-vehicles-s02.blend`: editable rover and lander.
- `art/blender/exports/ares-outcrop-s02.blend`: revised layered geological formations.
- `art/blender/exports/ares-astronaut-a02.blend`: editable astronaut parts and pivots.

The first static kit export was created through the official Blender MCP bridge.
After a Blender dependency-graph crash, final exports and previews were produced
in isolated Blender processes; the dedicated MCP workshop was restored and
rechecked. The user's separate original Blender window was preserved.
