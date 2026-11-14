# Historical prototype handoff

This document describes the initial prototype and is retained as history. Its asset, balance, dependency and deployment statements are superseded by the current README, research/BLACKOUT-RULES.md and release report. Use the current repository and release evidence.

---

# Mars Colony: Junior Mission Trainer — build handoff

*NASA Space Apps Challenge 2026 · challenge "Build a Junior Astronaut Mission Trainer" · snapshot of Sat 14 Nov 2026, about 11:20 Kuwait time*

This zip is the complete game, packed into a single HTML file so it can be emailed, plus the documents it was built from. Nothing needs rebuilding.

## 1. What is in this zip

| File | What it is |
|---|---|
| `Mars-Colony.html` | The whole game in ONE file (about 23 MB): code, the 3D engine, the three map images and the four NASA models are all inside it. |
| `HANDOFF.md` | This document. |
| `original-design-handoff-v2.md` | The design document the game started from, including the challenge text and official rules. |
| `gemini_video_prompt.md` | Prompt for an explainer video, containing every lesson, question, fact and source in the game. |
| `balance_bot.txt` | Playwright (Python) script that plays the game with a "careful" and a "random" player to test balance. Rename to `.py`; paths inside need editing. |

## 2. How to run and deploy

- **To play:** double-click `Mars-Colony.html`. It runs straight from disk and works offline (only the web fonts need internet; without them it falls back to system fonts).
- **To host:** upload the one file to any static host, or publish it as a single-page Claude artifact (it is 23 MB; artifact pages may be up to 16 MB, so for an artifact use the split layout described in section 4).
- **Split layout (how the published artifact is built):** the same `index.html` with the images as `assets/mars_hd.jpg`, `mars_sd.jpg`, `mars_topo.jpg`, the models as `assets/model_*.js`, and `assets/draco/draco_decoder.js`. All of those are embedded in this single file and can be extracted: the images are base64 data URIs in `window.INLINE`, each model is a `<script>` that sets `window.MODEL_DATA[key]`, and the decoder is the `<script id="dracosrc">` block.

## 3. Outside dependencies

| Loaded from | File | Licence |
|---|---|---|
| Embedded in the file | three.js r128, `GLTFLoader.js`, `DRACOLoader.js`, Draco decoder | MIT / Apache-2.0 |
| fonts.googleapis.com | Cinzel, Atkinson Hyperlegible | SIL Open Font Licence |

## 4. How the code is laid out (`index.html`)

Sections are marked with `/* ---- NAME ---- */` comments, in this order:

0. **Embedded libraries and assets** come first in the file (three.js, loaders, `window.INLINE` images, the Draco decoder text, the four model scripts). The game code starts at the `'use strict';` script.
1. **DATA** — cycle constants, `STORMS` (real storm calendar), `FACTS` (fact cards with source links), `DEF` (buildings and costs), `UPG` (upgrades), `DIFFS` (difficulty levels), `ME` (player name, flag), `MEDALS`, `GOALS` (tutorial goals).
2. **STATE** — map size (72×41 hexes covering the planet), `DEM_B64` (real MOLA heights, 360×180 samples as base64), `demAt`/`groundY` (height lookup), `SITES` (four landing sites), `CAVES`, `newGame()`.
3. **SIM** — `compute()` works out one sol of power, air, food, metal, beds and shelter without changing anything. `tickSol()` advances one sol. Then `shipDay()`/`splitPool()` (colonist sharing), `claimAll()` (rival territory), `stormStep()`, `dustStep()`, `conjStep()`, `festivalStep()`, `problemStep()`, `roverStep()`, `labStep()`, `tryBuild()`, `upgrade()`, `buildingPanel()`, `endGame()`, `pickSite()`.
4. **MISSION SCHOOL** — `ACADEMY` (six lessons with check questions), `LSRC` (their source links), `setup()` (name, flag, difficulty), `academy()`.
5. **MISSION CONTROL PROBLEMS** — `PROBLEMS` (ten questions with consequences), `showJournal()`.
6. **UI** — modal queue, `render()` (redraws the left panels), `buildMenu()`, `showScience()`, `showData()`.
7. **3D WORLD** — `init3D()` (renderer, sky, terrain mesh, detail patch, rocks), `loadModels()`, `buildWorld()`, `prim()` (simple building shapes), `syncScene()`, `rebuildTerritory()` (coloured land, borders, names), `drawFlags()`, `drawRover()`, `toggleWalk()`/`walkStep()` (first-person mode), `animate3D()`.
8. **INPUT + LOOP** — picking, tooltips, camera controls, `frame()`, start-up.

`window.G` exposes the main functions and data for testing from the console.

**Why the models are `.js` files:** the artifact host does not serve `.glb`. Each `model_*.js` sets `window.MODEL_DATA[key]` to the base64 of the original `.glb` and calls `window.onModelData(key)`; `loadModels()` decodes it and parses it with GLTFLoader. To get a `.glb` back, base64-decode the string. The originals are in NASA 3D Resources under `3D Models/` (Habitat Demonstration Unit part 1, InSight Cruise Lander panels deployed, Mars 2020 Perseverance Rover, Astronaut).

## 5. What the game does now

- **Start:** welcome → name, flag and difficulty (Explorer, Commander, Veteran) → Mission School (six lessons, 3 bonus parts per right answer) → choose one of four real landing sites.
- **Map:** real Mars shape and colour, hex grid, north always up, zoom limited to a regional view. Hovering a tile shows its height, sunlight and air thickness.
- **Colonies:** the player plus two rivals (Colony Ares, Kepler Base). Each has tinted territory with a border, its name written across the land, and a flag at its base.
- **Resources:** power, air, food, shelter, beds, parts (from Earth only) and metal (mined on Mars).
- **Buildings (11):** solar panel, oxygen extractor, regolith shield, regolith mine, greenhouse, ice melter, habitat, rover trip, battery, recreation dome, nuclear reactor. Nine have a level 2 upgrade.
- **Geography matters:** solar output falls with latitude, extractor output falls with height, ice exists only far from the equator, caves sit near the big volcanoes.
- **Events:** real solar storms on their real dates (shelter or keep working), dust storms, the two-week radio blackout, festivals, ten Mission Control problems, technology choices from Earth, dusty panels, crops that take 20 sols.
- **Colonists:** every 30 sols a ship is shared between the three colonies by appeal, capped at 60% for any one colony.
- **Win:** fill the Mars Independence bar and get through one radio blackout. A Mission Report follows either way.
- **Extras:** Walk mode (first person, game paused), High/Low graphics, Journal, Science and Data sources screens.

## 6. Real data and where it came from

- **Terrain heights and height map:** NASA MOLA (Mars Global Surveyor), from NASA Mars Trek tiles — https://trek.nasa.gov/mars/
- **Mars colour image and 3D models:** NASA 3D Resources — https://github.com/nasa/NASA-3D-Resources
- **Solar storm dates and strengths:** NASA DONKI SEP records (January to April 2024 fetched from api.nasa.gov with the demo key; May 2024 events from DONKI's public pages) — https://ccmc.gsfc.nasa.gov/tools/DONKI/
- **May 20, 2024 storm on Mars:** NASA/JPL Curiosity RAD — https://www.nasa.gov/?p=670127
- **Every fact card, lesson, upgrade and problem** carries its own source link in the game and in `docs/gemini_video_prompt.md`.

## 7. Known gaps (be honest about these)

- **Not real data yet:** ice follows a latitude rule, not the SWIM maps. Cave tiles mark volcano regions, not catalogued caves. Sunlight and air thickness are simple models. OSDR and RadLab are not used.
- **Storm data stops at May 2024** and then repeats every 230 sols. Pulling more needs a personal NASA API key (the demo key hit its limit).
- **The hosted page cannot call NASA's API live.** All data is embedded and labelled as recorded.
- **Art:** only four models are NASA's. Eight buildings are simple shapes. Astronauts do not move.
- **NASA logos:** the NASA models' textures have not been checked for logos, which the rules say to remove.
- **Balance was tested only by scripts.** On Commander a careful scripted player won 9 of 9 games in 17 to 20 minutes; on Veteran 2 of 3; a random clicker on Explorer lost 4 of 4. A careful player on Explorer was never tested. No child has played it.
- **Untested:** touch controls, real phones, and the published copy after the last update.
- **The slide deck** (a separate Claude Slides artifact) describes an older version of the game.
- **Not built from the design document:** marsquakes, meteorites, habitat breaches, treaties or war, multiplayer, Arabic text.

## 8. Rules to remember for submission

- Cite every source, including three.js and the fonts. Missing citations can cost an award.
- Describe AI use. Claude wrote the code, lessons and this handoff from the team's design.
- No one under 18 may be seen or heard in the demo video.
- No NASA logo, and no claim that NASA endorses the game.
- Original code is Apache-2.0 unless the team picks another OSI licence.
