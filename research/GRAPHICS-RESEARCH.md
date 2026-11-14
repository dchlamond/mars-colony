# Ares rendering decisions and evidence

14 November 2026. The original Ares concept establishes ivory pressure shells,
dark navy photovoltaics, brass building fittings, warm windows, rust ground,
turquoise map edges and appealing working astronauts. The later BLACKOUT brief
replaces the gold interface with five selectable styles and distinct fonts;
the physical architecture retains the earlier direction. A generated still is
an art target; it does not establish frame rate or completed game art.

## Implemented pipeline

- **Blender geometry:** all eleven building types, the articulated suit, rover,
  crew shuttle, layered rocks and the NASA-derived MOLA world mesh. High/Low
  habitat, suit and rock files are actual Blender exports. The shipped fallback
  builders remain solely for loading/error recovery, not the normal loaded view.
- **Blender previews:** build-menu illustrations are Cycles renders of the same
  models used in play. Editable scenes and reproducible scripts are included.
- **Grok Imagine:** original regolith colour material and the fictional human
  astronaut adviser, replacing the earlier Martian portrait. The regolith is
  artistic detail, not NASA ground photography. Its
  generation record is in NOTICE and its unaltered source is packaged locally.
- **NASA map:** the existing 360 by 180 MOLA height samples are rebuilt in Blender
  with the same coordinates and exaggerated height scale. Its UVs retain the
  NASA global imagery. Close-up mineral detail does not change game elevation.
- **Browser lighting:** physically based materials, a warm directional sun,
  restrained sky fill, rough metal reflections, soft shadow filtering, and
  screen-space ambient occlusion in High. Low uses the same authored design
  with lighter geometry and omits occlusion. This is not ray tracing.
- **Crew:** Junior draws actors from the actual role roster. A person cannot
  appear simultaneously at home and on a rover. Motion uses named shoulder,
  elbow, hip and knee pivots, with walking, tending and repair gestures. It is
  rigid-joint animation, not motion capture or a complete skinned-character rig.

## Research that changed the work

| Primary evidence | Decision |
| --- | --- |
| [NASA spacesuit basics](https://www.nasa.gov/centers-and-facilities/johnson/spacewalk-spacesuit-basics/) | Give the original suit a hard torso, life-support pack, gloves, joint breaks and protective visor; remove stick-like primitive figures. |
| [NASA CHAPEA](https://www.nasa.gov/humans-in-space/chapea/about-chapea/) | Use sealed occupied spaces and layered refuge construction; keep crops enclosed and label architecture as a fictional extrapolation. |
| [NASA Mars sunset explanation](https://science.nasa.gov/solar-system/planets/mars/what-does-a-sunrise-sunset-look-like-on-mars/) | Use a dusty warm sky for the art direction. A blue glow belongs near the low Sun in relevant conditions, not an arbitrary Earth-blue atmosphere. Lighting remains artistic, not a scattering simulation. |
| [Three.js r128 SSAOPass](https://github.com/mrdoob/three.js/blob/r128/examples/js/postprocessing/SSAOPass.js) | Use a version-matched, locally packaged contact-occlusion pass. Increase depth precision and exclude the sky from occlusion to avoid banding/darkening. |
| [Epic Lumen overview](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-global-illumination-and-reflections-in-unreal-engine) | Prepare an isolated Unreal material study using the same source assets; do not describe importing a GLB into Three.js as importing Lumen. |
| [Epic Lumen performance guide](https://dev.epicgames.com/documentation/unreal-engine/lumen-performance-guide-for-unreal-engine) | Keep geometry overlap, material complexity and ray-tracing cost visible in the Unreal plan. A cinematic quality setting is not a classroom-device performance guarantee. |
| [Epic Pixel Streaming](https://dev.epicgames.com/documentation/en-us/unreal-engine/overview-of-pixel-streaming-in-unreal-engine) | Treat a streamed Unreal version as a separate running native application plus hosting infrastructure, not a static Vercel upload. |
| [Epic Interchange imports](https://dev.epicgames.com/documentation/en-us/unreal-engine/importing-assets-using-interchange-in-unreal-engine) | Prepare a guarded glTF scene importer preserving authored transforms. It must be tested in Unreal before use is claimed. |

NASA technology-specific references for each building are in
[SURFACE-KIT.md](../game/assets/ares/SURFACE-KIT.md).

## UE5 status

No Unreal Editor installation was found in the checked application locations or
the local application-name index. `art/unreal/` contains an editor descriptor,
Lumen settings, a guarded Python scene importer and an authored ground patch.
Source checks passed; no Unreal scene, render, executable, animation blueprint or
gameplay port has been produced or verified. Blender and Grok assets are actually
incorporated into the browser game; UE5 is a prepared next production path.

The native engine option can deliver more advanced indirect lighting but entails
a real game port. Streaming it adds a running GPU host and changes the offline
classroom requirement. The current no-account browser/offline release remains
the working product. No paid hosting or engine licence agreement was entered.

## Remaining quality evidence

Software-rendered Chrome tests verify asset loads, shader compilation, controls,
crew accounting and High/Low behavior. They do not benchmark the children's
actual computers. The art is more coherent and substantially more authored, but
does not establish AAA visual parity. Geological detail, character skinning,
material texture baking and broader performance profiling remain work.
