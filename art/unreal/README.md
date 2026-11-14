# Ares Atlas Unreal art study — prepared, not runtime-tested

This folder prepares the same original Blender asset kit for an Unreal Engine 5 lighting study. It contains an editor project descriptor, Lumen settings, an import script, and an authored ground patch. **Unreal Editor was unavailable during this release. No `.umap`, Unreal render, packaged executable or UE5 gameplay port has been produced or verified.**

The playable browser game uses Three.js. Its renderer does not become Lumen or hardware ray tracing when a Blender model is imported. The original `.blend` files and GLBs remain the shared art source for both paths.

## Contents

- `AresAtlasLookdev/AresAtlasLookdev.uproject`: isolated editor project, with Python and Interchange enabled. The empty engine association lets the user select an installed UE5 version. The script was written against Epic's documented **UE5.6 Python API**; later versions need an editor run to confirm compatibility.
- `Config/DefaultEngine.ini`: Lumen GI/reflections, mesh distance fields, Virtual Shadow Maps, no baked static lighting. Software tracing is the initial setting. Hardware tracing remains disabled until platform support has been checked.
- `Content/Python/import_ares.py`: imports each GLB as a **scene**, preserving its internal transforms and rigid-joint hierarchy; arranges a miniature asset study; imports the full MOLA relief separately; sets a warm sun, a dust-coloured artistic atmosphere and fixed exposure.
- `assets/ares-lookdev-ground.glb`: original 24 × 24 m Blender patch, 18,432 triangles, with embedded Grok colour art and Blender normal texture. Its middle is flat for inspecting materials. **This is invented look-development terrain, not measured NASA topography.** Its source is `art/blender/build_ares_lookdev_ground.py`.

The small buildings are strategy-game miniatures. Their scale relative to the full-size suit is not an engineering proposal. The suit uses named rigid joints; it is not yet an Unreal skeletal character or an Animation Blueprint.

## Run once Unreal Editor is available

1. Keep this folder inside the repository so the script can find `game/assets/ares/`.
2. Open `AresAtlasLookdev.uproject` with an installed UE5 editor. Allow the named plugins to load, then restart the editor if requested.
3. Save or discard any unsaved editor work. Use **File → Execute Python Script** and select `Content/Python/import_ares.py`.
4. Inspect `/Game/AresGenerated/Maps/AresMaterialStudy`. The script refuses to overwrite an existing generated map and refuses to leave unsaved work behind. If an import stops, inspect the error and partial generated assets before trying again.
5. Inspect the suit proportions, glTF material conversion, greenhouse glass, contact shadows, exposure and shader cost. Check that glTF metres converted to Unreal centimetres. Only an editor run can verify these details.

The import script writes `Saved/AresImportReport.json` **after** successful editor execution. That report is distinct from the source-only preflight below.

To check source paths and GLB containers without Unreal, run from the repository root:

```sh
python3 art/unreal/AresAtlasLookdev/Content/Python/import_ares.py --check
```

This checks 16 existing GLB files, headers, sizes and JSON chunks. It does not simulate an Unreal import, compile shaders, validate materials or measure frame rate.

## Lighting direction

The initial study uses a warm, low sun; restrained sky fill; physically rough surfaces; and fixed EV12 exposure so camera motion does not change brightness. These are **unvalidated art settings**, not measured Mars illumination. The authored regolith, bevelled buildings, dark solar cells and gold-tinted suit visor provide the material contrast. Use the chosen Ares image to judge composition after opening the scene.

Lumen supplies dynamic indirect illumination and reflections inside Unreal. Its software path uses mesh distance fields; hardware tracing depends on the platform and GPU. The source configuration intentionally makes no hardware-tracing promise. Check the current [Lumen guide](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-global-illumination-and-reflections-in-unreal-engine) and [platform requirements](https://dev.epicgames.com/documentation/en-us/unreal-engine/macos-development-requirements-for-unreal-engine) before enabling it.

A native game would still need the simulation, saves, responsive UI, input and character animation ported and tested. Serving an Unreal experience to a browser uses a different deployment architecture: Epic's [Pixel Streaming overview](https://dev.epicgames.com/documentation/en-us/unreal-engine/overview-of-pixel-streaming-in-unreal-engine) describes a running Unreal application streamed to a browser. The current static website cannot run that renderer by itself.

## Primary implementation references

- [Epic: Interchange imports and glTF scene support](https://dev.epicgames.com/documentation/en-us/unreal-engine/importing-assets-using-interchange-in-unreal-engine).
- [Epic: InterchangeManager Python API](https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/class/InterchangeManager?application_version=5.6) and [ImportAssetParameters](https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/class/ImportAssetParameters?application_version=5.6).
- [Epic: LevelEditorSubsystem](https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/class/LevelEditorSubsystem?application_version=5.6), [EditorActorSubsystem](https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/class/EditorActorSubsystem?application_version=5.7), and [UnrealEditorSubsystem](https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/class/UnrealEditorSubsystem?application_version=5.6).
- [Epic: fixed exposure properties](https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/class/PostProcessSettings?application_version=5.6), [directional light properties](https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/class/DirectionalLightComponent?application_version=5.6), and [sky atmosphere properties](https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/class/SkyAtmosphereComponent?application_version=5.6).

Source and configuration were prepared with AI assistance. No NASA logo or endorsement is implied. NASA data and original illustrative art remain separately credited in the repository's asset notices.
