"""Prepared UE5.6+ editor import/lighting scaffold; NOT runtime-validated.

Run --check with ordinary Python to validate source paths and GLB containers.
Inside the dedicated Unreal project, File > Execute Python Script runs the
import. The script refuses unsaved packages and existing generated levels.
No gameplay, UI conversion, animation retargeting or packaging is performed.
"""
import json
from pathlib import Path
import struct
import sys

REPO = Path(__file__).resolve().parents[5]
ASSET_DIR = REPO / 'game' / 'assets' / 'ares'
PROJECT_DIR = Path(__file__).resolve().parents[2]
DESTINATION = '/Game/AresGenerated'
LEVEL_PATH = DESTINATION + '/Maps/AresMaterialStudy'

# Unreal locations are centimetres. This intentionally presents game miniatures;
# building scale is not a proposed engineering design. Character = source scale.
LAYOUT = [
    ('habitat-h01.glb', 'Habitat', (-360, -320, 0), .26),
    ('greenhouse-g01.glb', 'Greenhouse', (0, -320, 0), .24),
    ('solar-s02.glb', 'Solar', (360, -320, 0), 1),
    ('moxie-o02.glb', 'Oxygen', (-540, 0, 0), 1),
    ('ice-w02.glb', 'Water', (-180, 0, 0), 1),
    ('battery-b02.glb', 'Battery', (180, 0, 0), 1),
    ('shield-r02.glb', 'Shelter', (540, 0, 0), 1),
    ('mine-m02.glb', 'Regolith', (-360, 320, 0), 1),
    ('dome-d02.glb', 'Community', (0, 320, 0), 1),
    ('reactor-p02.glb', 'Reactor', (360, 320, 0), 1),
    ('astronaut-a02.glb', 'SuitStudy', (-720, -500, 0), 1),
    ('outcrop-r02.glb', 'Outcrop', (700, -500, 0), 1),
    ('rover-rv02.glb', 'Rover', (0, -670, 0), 1),
    ('shuttle-l02.glb', 'Shuttle', (0, 720, 0), 1),
]


def inspect_glb(path):
    """Validate the header and JSON structure without importing Blender or UE."""
    with path.open('rb') as source:
        magic, version, length = struct.unpack('<4sII', source.read(12))
        if magic != b'glTF' or version != 2 or length != path.stat().st_size:
            raise ValueError('Invalid GLB header: ' + path.name)
        chunk_length, chunk_type = struct.unpack('<II', source.read(8))
        if chunk_type != 0x4E4F534A:
            raise ValueError('GLB JSON chunk is missing: ' + path.name)
        data = json.loads(source.read(chunk_length))
    return {'file': path.name, 'bytes': length,
            'meshes': len(data.get('meshes', [])),
            'materials': len(data.get('materials', []))}


def preflight():
    required = [ASSET_DIR / item[0] for item in LAYOUT]
    required += [ASSET_DIR / 'mars-mola-terrain.glb']
    missing = [path.name for path in required if not path.is_file()]
    if missing:
        raise FileNotFoundError('Required Ares exports missing: ' + ', '.join(missing))
    results = [inspect_glb(path) for path in required]
    ground = REPO / 'art' / 'unreal' / 'assets' / 'ares-lookdev-ground.glb'
    if ground.is_file():
        results.append(inspect_glb(ground))
    return {'status': 'source containers checked; Unreal runtime not tested',
            'assets': results, 'ground_available': ground.is_file()}


def build():
    import unreal
    preflight()
    opened_project = Path(unreal.Paths.convert_relative_path_to_full(
        unreal.Paths.project_dir())).resolve()
    if opened_project != PROJECT_DIR:
        raise RuntimeError('Open this scaffold\'s AresAtlasLookdev project first.')
    if (unreal.EditorLoadingAndSavingUtils.get_dirty_map_packages() or
            unreal.EditorLoadingAndSavingUtils.get_dirty_content_packages()):
        raise RuntimeError('Save or discard pending editor work before importing.')
    if unreal.EditorAssetLibrary.does_asset_exist(LEVEL_PATH):
        raise RuntimeError('The generated study already exists. Inspect it; do not overwrite it.')

    levels = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
    actors = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    editor = unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem)
    manager = unreal.InterchangeManager.get_interchange_manager_scripted()
    if not levels.new_level(LEVEL_PATH):
        raise RuntimeError('Could not create the isolated art-study level.')
    imported = []

    def import_scene(path, label, position, scale=1):
        before = {a.get_path_name() for a in actors.get_all_level_actors()}
        source = unreal.InterchangeManager.create_source_data(str(path))
        if not manager.can_translate_source_data(source, True):
            raise RuntimeError('Interchange cannot import this GLB scene: ' + path.name)
        params = unreal.ImportAssetParameters()
        params.set_editor_property('is_automated', True)
        params.set_editor_property('replace_existing', False)
        params.set_editor_property('import_level', levels.get_current_level())
        destination = DESTINATION + '/Assets/' + label
        if not manager.import_scene(destination, source, params):
            raise RuntimeError('GLB scene import failed: ' + path.name)
        created = [a for a in actors.get_all_level_actors()
                   if a.get_path_name() not in before]
        if not created:
            raise RuntimeError('Import created no scene actors: ' + path.name)
        created_names = {a.get_path_name() for a in created}
        for actor in created:
            actor.set_folder_path('Ares/' + label)
            parent = actor.get_attach_parent_actor()
            if parent and parent.get_path_name() in created_names:
                continue
            location = actor.get_actor_location()
            actor.set_actor_location(unreal.Vector(
                location.x * scale + position[0],
                location.y * scale + position[1],
                location.z * scale + position[2]), False, True)
            original = actor.get_actor_scale3d()
            actor.set_actor_scale3d(unreal.Vector(
                original.x * scale, original.y * scale, original.z * scale))
        imported.append({'source': path.name, 'actors': len(created),
                         'destination': destination})

    ground = REPO / 'art' / 'unreal' / 'assets' / 'ares-lookdev-ground.glb'
    if ground.is_file():
        import_scene(ground, 'AuthoredGround', (0, 0, 0))
    else:
        unreal.log_warning('No authored ground patch found. Asset study has no floor.')
    for filename, label, position, scale in LAYOUT:
        import_scene(ASSET_DIR / filename, label, position, scale)

    # Import the complete NASA-derived relief as a separately inspectable asset.
    # It is not placed under this miniature showroom or claimed as a landing site.
    source = unreal.InterchangeManager.create_source_data(
        str(ASSET_DIR / 'mars-mola-terrain.glb'))
    params = unreal.ImportAssetParameters()
    params.set_editor_property('is_automated', True)
    params.set_editor_property('replace_existing', False)
    if not manager.import_asset(DESTINATION + '/Assets/NASAMola', source, params):
        raise RuntimeError('NASA-derived terrain import failed.')

    def spawn(cls, label, location, rotation=(0, 0, 0)):
        actor = actors.spawn_actor_from_class(
            cls, unreal.Vector(*location), unreal.Rotator(*rotation))
        if not actor:
            raise RuntimeError('Could not create ' + label)
        actor.set_actor_label(label)
        actor.set_folder_path('Ares/Lighting')
        return actor

    sun = spawn(unreal.DirectionalLight, 'Ares warm key', (0, 0, 1000), (-28, -35, 0))
    light = sun.get_component_by_class(unreal.DirectionalLightComponent)
    light.set_mobility(unreal.ComponentMobility.MOVABLE)
    light.set_editor_property('intensity', 20000.0)
    light.set_editor_property('light_color', unreal.Color(255, 221, 181, 255))
    light.set_editor_property('light_source_angle', 0.65)
    light.set_editor_property('atmosphere_sun_light', True)
    light.set_editor_property('cast_shadows', True)

    atmosphere = spawn(unreal.SkyAtmosphere, 'Ares artistic dust atmosphere', (0, 0, 0))
    sky = atmosphere.get_component_by_class(unreal.SkyAtmosphereComponent)
    sky.set_editor_property('rayleigh_scattering', unreal.LinearColor(.001, .0006, .0003, 1))
    sky.set_editor_property('mie_scattering', unreal.LinearColor(.009, .006, .004, 1))
    sky.set_editor_property('ground_albedo', unreal.Color(112, 63, 38, 255))
    sky.set_editor_property('multi_scattering_factor', 1.0)
    fill_actor = spawn(unreal.SkyLight, 'Ares skylight', (0, 0, 500))
    fill = fill_actor.get_component_by_class(unreal.SkyLightComponent)
    fill.set_mobility(unreal.ComponentMobility.MOVABLE)
    fill.set_editor_property('intensity', .65)
    fill.set_editor_property('real_time_capture', True)

    post = spawn(unreal.PostProcessVolume, 'Ares fixed exposure', (0, 0, 0))
    post.set_editor_property('unbound', True)
    settings = post.get_editor_property('settings')
    for name, value in [('auto_exposure_min_brightness', 12.0),
                        ('auto_exposure_max_brightness', 12.0),
                        ('bloom_intensity', .12)]:
        settings.set_editor_property('override_' + name, True)
        settings.set_editor_property(name, value)
    post.set_editor_property('settings', settings)

    camera_position = unreal.Vector(-1450, -1750, 1400)
    target = unreal.Vector(0, 0, 100)
    rotation = unreal.MathLibrary.find_look_at_rotation(camera_position, target)
    editor.set_level_viewport_camera_info(camera_position, rotation)
    levels.editor_invalidate_viewports()
    if not unreal.EditorAssetLibrary.save_directory(DESTINATION, False, True):
        raise RuntimeError('Could not save generated asset packages.')
    if not levels.save_current_level():
        raise RuntimeError('Could not save the generated level.')
    report = {'status': 'editor script finished; inspect image quality and scale manually',
              'level': LEVEL_PATH, 'imports': imported,
              'lighting': 'Lumen project settings, warm directional key, fixed EV12',
              'limitations': ['No gameplay port', 'No skeletal retargeting',
                              'No packaged executable', 'No web Lumen rendering']}
    report_path = Path(unreal.Paths.project_saved_dir()) / 'AresImportReport.json'
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2))
    unreal.log('Ares art study prepared: ' + LEVEL_PATH)


if __name__ == '__main__':
    if '--check' in sys.argv:
        print(json.dumps(preflight(), indent=2))
    else:
        build()
