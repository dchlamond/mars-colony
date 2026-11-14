# Ares Atlas runtime art

Original art made for this project, following the selected Ares Atlas reference.
The meshes, mineral textures and material designs are original project assets.

- `habitat-h01.glb`: Blender-authored H-01 habitat, 45,464 triangles in nine material batches.
- `greenhouse-g01.glb`: Blender-authored G-01 sealed greenhouse, 9,690 triangles in seven material batches. Includes an airlock, interior crop beds, irrigation and climate cabinets.
- `green-preview.png` and `habitat-preview.png`: transparent Blender renders of the actual assets for building cards.
- `regolith-colour.png`, `regolith-height.png`, `regolith-normal.png`: original 512px seamless mineral textures authored inside Blender. The world-space height detail enhances the MOLA map; the colour and normal maps detail the first-person surface.

The editable source and Blender files live in `art/blender/`. The browser uses
these GLBs directly. Other structures and the articulated crew are original
runtime geometry in `game/ares-world.js`, batched by material. Crew animation is
procedural, including walking, checking instruments, repairs and gardening.

The global relief remains the existing NASA MOLA dataset. Local surface grain,
outcrops, lighting and architecture are artistic; they are not new NASA measurements
or surveyed site reconstructions. Metal/roughness materials and regolith detail
are implemented, but building texture baking, full character rigs and classroom
device profiling remain future work. This release is not a claim of AAA parity.
