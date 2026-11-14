# DEAD RECKONING: BLACKOUT — surface, fieldwork and interface release

14 November 2026. This release replaces the normal loaded view's remaining
runtime building shapes with authored Blender exports, adds actual water and
crew accounting to Junior, and replaces the gold interface with five selectable
styles under the team's new name, DEAD RECKONING: BLACKOUT. It is a playable
browser release, not an Unreal gameplay port or a claim of AAA visual parity.

## Player-visible changes

- All eleven colony building types use the original Blender kit. The NASA MOLA
  relief is exported through Blender with matching game heights and coordinates.
  Authored layered rocks, an articulated pressure suit, a survey rover and a
  crew lander complete the first surface kit. High and Low use authored assets.
- Grok Imagine regolith colour is combined with illustrative mineral normals.
  Warm directional light, soft shadow filtering and High-mode screen-space
  contact occlusion improve depth. The browser does not run hardware ray tracing.
- Air, Water, Food, Power, Parts, Crew and explained Appeal are visible in the
  responsive HUD. Commander additionally shows Metal; its Water card describes
  irrigation capacity rather than inventing a stored-water system for that mode.
- Flight Deck (Space Grotesk), Expedition (Atkinson Hyperlegible), Deep Space
  (Manrope), Frontier (Barlow Condensed) and Horizon (Rajdhani) are functional
  interfaces, not only mockups. All have no gold UI trim, local fonts, additional
  icons and a Grok-generated fictional human astronaut adviser. Settings preserves
  the choice; `game/ui-options.html` compares actual completed-colony captures.
- Junior conserves used/recovered water and separates recycling from fresh
  extraction. Every person has one actual work role. The outside astronaut count
  follows that roster; sheltered and travelling people do not appear twice.
- Invitations bring two explorers next day if capacity remains safe. Their
  arrival adds both labour and consumption. The detailed shared-colony
  recruitment system remains in Commander.
- Discoveries includes an embedded player/teacher guide, available offline,
  explaining both modes, every Junior building, population, stakes, science
  sources and a short classroom activity.
- Walk uses the same triangle heights as the visible High/Low Blender terrain,
  removes the mismatched overlapping ground patch, follows the current map
  location on entry/exit, and supports continuous longitudinal travel. Visible
  buildings use matching collision footprints. The finite map's polar edge is
  explicitly explained and lets the player move back; it is not a hidden wall.
- An original Blender glove and held dosimeter make Walk useful for recording
  and comparing three simulated exposure conditions. A visible authored outcrop
  teaching site makes the rock comparison reachable. The index is not a dose,
  temperature, live NASA feed or calculated material-shielding prediction.
- Junior solar alignment costs 2 Parts and one technician day, then raises solar
  generation by 20% for three production days, with an eight-day booking cooldown.
  Dust still applies. NASA solar-incidence principles and an actual InSight
  cleaning result are linked separately from these tuned gameplay numbers.
- Fame records one-time mission, engineering, rover and field-evidence awards.
  Repeated readings cannot farm points. Junior uses medals as recognition;
  Commander retains medal influence on competitive recruitment. Junior Appeal
  remains a readiness report, while Commander Appeal divides shared shuttles.

## Verification

- Junior: 63 checks; careful policies complete all four landing sites on day 42
  with eight crew, zero retries and positive reserves. Idle air shortages and
  low-water recovery are also exercised. This is not a child usability study.
- Mission systems: 48 checks cover actual power output, paid technician work,
  dust, non-solar exclusions, cooldowns, finite Fame, saves and checkpoint rollback.
- Field evidence: 16 independent integration checks exercise actual reachable
  positions, all three readings, comparison rewards, real save/restore, repeated
  recordings, new-mission reset and the radiation-alert restriction.
- Walk: High and Low each pass 1,553 assertions, including delayed terrain
  replacement, ray checks at 40 terrain positions, over two full longitude
  traversals, visible wrapped buildings, polar-edge reversal, pointer-lock
  release, survey persistence and three viewport sizes. Maximum sampled
  height mismatch is under 0.000003 world units.
- Commander: 10 general regression, 29 operations and 40 management checks pass.
  Five viewport sizes retain visible controls and a top-positioned Walk return.
- Graphics: High and Low validate all eleven building types, MOLA bounds/UVs,
  terrain-to-simulation height agreement, crew lifecycle, material isolation,
  Grok first-person texture loading and the delayed legacy-rover callback race.
  Split glTF vertices are welded before Low-model decimation; the repaired
  full/Low rock meshes have no boundary or nonmanifold edges. The single nearby
  survey outcrop uses the full-detail mesh.
- Offline: the single HTML embeds the assets and guide; tests disable networking
  and observe no external or separate file requests and no asset/runtime errors.
  All five bundled font families load; the human portrait and held instrument
  are available, and recording evidence updates real Fame once.
- Interface: all five styles are tested at desktop, phone and short landscape
  sizes. Build/day, water/Appeal/Fame/boost controls, the guide, save/restore,
  persisted theme choice and Commander's seven-resource layout are exercised.
- Source: Python parses; JSON manifests parse; runtime GLB containers and
  astronaut pivots validate. The UE preparation validates 16 source assets only.

The tests use local headless Chrome with software WebGL. They establish function
and shader compatibility in that environment, not a measured frame-rate target
on classroom computers. The ordinary release scenario is also played through
using building costs and actual day advancement, then visually inspected in
strategy and first-person views.

## Explicit boundaries

The UE5 project in `art/unreal/` is source-checked preparation. Unreal Editor was
unavailable, so no Unreal scene, image, executable, skeletal animation or gameplay
port is verified. The browser release remains the working delivery path.

The surface art does not yet match the selected concept's detail. Texture baking,
fully skinned characters, richer geological composition and device profiling are
further production work. NASA-derived heights are real inputs; ice remains a
latitude estimate. OSDR, RadLab and SWIM raster data are not integrated. Current
competition eligibility and actual learning outcomes are not established here.

See [mechanics and learning](MECHANICS-AND-LEARNING.md),
[exact Junior rules](JUNIOR-MODE.md), [graphics research](GRAPHICS-RESEARCH.md),
[asset provenance](../game/assets/ares/SURFACE-KIT.md), and the
[in-game guide](../game/mission-guide.html).
