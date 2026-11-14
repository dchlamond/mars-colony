# DEAD RECKONING: BLACKOUT

A strategy game about the first town on Mars, played on a NASA-sourced map. Junior missions teach through short, recoverable challenges; Commander keeps the detailed colony simulation.
Made for the NASA Space Apps Challenge 2026, challenge "Build a Junior Astronaut Mission Trainer".

**Play it:** https://mars-colony-tau.vercel.app (no account, no download)

NASA does not endorse this game.

## What it is

Players aged 7 to 12 now start with **Blackout mission**: six adult crew in an operating outpost, a finite preparation budget, an investigation, delayed Earth advice and a scheduled communications pause. After observing the outcome, players change one preparation and replay the same later requests through the same simulation. Their original colony is restored and both outcomes remain available for explanation and a transfer question.

The **Junior campaign** remains available for building a town from the beginning: one objective at a time, automatic crew jobs, explicit invitations and checkpoint recovery. **Commander** retains the longer management simulation. Reading never advances Junior time; the player chooses Next day.

See the [short-mission rules and source mapping](research/BLACKOUT-RULES.md), [teacher/pilot kit](game/teacher-kit.html), and [judge walkthrough](https://mars-colony-tau.vercel.app/judge-tour.html). The mission is designed for an 8–12-minute guided session; that timing and child learning still need a real pilot.

Commander retains production methods, maintenance, skilled crew, competitive
recruitment, evidence projects and its original difficulty choices. Existing
Commander saves stay compatible. Five selectable interface designs use distinct
fonts and palettes without gold; the mission adviser is a fictional human astronaut. All eleven building types use Blender exports, along with the rover,
crew shuttle, articulated suits and layered rocks. The MOLA terrain is exported
through Blender, and Grok Imagine supplies the regolith colour and fictional human adviser.
High graphics adds screen-space ambient occlusion and directional shadow maps.
This is not UE5 Lumen or hardware ray tracing.

See the [player and teacher guide](game/mission-guide.html), [Junior rules](research/JUNIOR-MODE.md), and [mechanics/learning audit](research/MECHANICS-AND-LEARNING.md). The audit distinguishes implemented goals from unfinished ones.

## How the game addresses the challenge

| Decision area in the challenge | What the player does | Real record behind it |
|---|---|---|
| Life support | Builds oxygen extractors. They make more air on low ground, where the air is thicker. | Tile heights from the MOLA laser altimeter (NASA Mars Trek). MOXIE on the Perseverance rover. |
| Water management | Balances used, recycled and extracted water in Junior. Recycling cannot create new water; fresh extraction requires likely-ice terrain. | NASA ISS water recovery research; ice locations remain a latitude estimate. |
| Radiation shielding | Builds soil shelters, then chooses shelter or work when a storm arrives. | Earth observations from NASA DONKI inspire fictional Mars scenarios; Curiosity supplies an actual Mars radiation measurement from May 2024. |
| Power budgeting | Places solar panels by latitude, cleans dust, assigns a technician to align arrays, and budgets batteries. | NASA solar-orientation principles and InSight's documented 30 Wh/sol cleaning recovery; the 20% game bonus is explicitly invented. |
| Surface fieldwork | Carries a dosimeter, records simulated relative readings, and compares open ground, rock and shelter. New evidence earns Fame once. | Curiosity RAD: the measured 4% cliff comparison and historical May 2024 radiation event, separated from the game index. |
| Food production | Plans for growing time: 4 powered days in Junior, 20 sols initially in Commander. Commander also compares soil washing and water-based growing. | Phoenix lander perchlorate finding. |
| Communication delay | Short Junior mission queues advice using a dated Horizons light-time and an explicit training clock, then requires local action during a separate radio pause. Commander retains its longer system. | NASA/JPL Horizons and the NASA 2023 solar-conjunction operations account. |

## What is real and what is not

- **Real:** NASA-sourced Mars relief, archived observations and facts on cards. Each has a source link
  on the game's **Data sources** screen.
- **Simplified:** sunlight and air thickness per tile, ice by latitude, cave regions.
- **Invented for the game:** training-day/event schedules, compressed radio clock, four-day crops, checkpoint retries, rival colonies, Fame medals, costs, upgrades and machine output.
- **Recorded, not live:** storm records are saved inside the game. The Space weather panel shows one saved week of NASA DONKI records and can be refreshed by hand. Those records are kept separate from the storms in play.

Known limits: rules and viable policies have been tested by simulations and real-control browser playthroughs, not yet by children. Art is an implemented upgrade, not a claim of AAA production quality; astronaut motion is procedural, not a complete motion-capture library. OSDR and RadLab are listed by the challenge and not used yet.

## Choose your interface

Open **Mission settings → Choose your interface**, or compare the five live options
at [the interface gallery](https://mars-colony-tau.vercel.app/ui-options.html). All
choices work offline; the illustrated comparison gallery is an online extra.

## First-person fieldwork

Move the strategy map to a location and choose **Walk on Mars**. Use WASD or arrow
keys to move, drag or lock the pointer to look, and press **E** or **Record reading**
to save a dosimeter observation. Back to map stays at the top. The dosimeter uses
a clearly labeled relative teaching index, not a live radiation feed or a safety
assessment. Recorded conditions appear in Fame's field notes.

**Align solar arrays** costs 2 Parts and one technician day, then increases solar
generation by 20% for three production days. It cannot stack, has an eight-day
cooldown, and does not erase dust losses. Those quantities are game tuning.

## Privacy

The game collects nothing and loads no files from other websites. The one outside request is optional: the Refresh button in the Space weather panel asks NASA's DONKI service for newer records.

## What is where

| Path | What it is |
|---|---|
| `game/` | The whole game. This folder is what the website serves. |
| `game/index.html` | Base simulation, NASA terrain and page. |
| `game/junior.js` | Authoritative Junior rules, progression and exact-state checkpoint recovery. |
| `game/blackout.js` | Short mission, deterministic comparison, mission codes and local learning/attempt record. |
| `game/blackout-ui.js`, `game/blackout-ui.css`, `game/blackout-audio.js` | Short-mission interface, actual-state system inspector and local sound. |
| `game/ares-ui.js`, `game/ares-ui.css` | Responsive BLACKOUT interface with five selectable designs. |
| `game/ui-options.html` | Compare the five playable UI designs. |
| `game/mission-systems.js` | Solar alignment and earned Fame. |
| `game/surface-survey.js` | Handheld dosimeter and field records. |
| `game/ares-world.js`, `game/assets/ares/` | Original 3D buildings, material textures and procedural animation. |
| `game/assets/` | Mars images, the four NASA models, fonts and the model decoder. |
| `game/vendor/` | three.js and its loaders. |
| `docs/` | Design and build notes from the team, and the plan for better graphics. |
| `tools/strip_logos.py` | Paints over logos, flags and patches in the NASA model textures. |
| `tools/split.py` | Imports an older single-file copy of the game. It overwrites `game/`. |
| `AI_USE.md`, `NOTICE`, `LICENSE` | AI disclosure, third-party credits, Apache-2.0 licence. |

## Run it on your own computer

    cd game
    python3 -m http.server 8000

Then open http://localhost:8000.

## How changes reach the website

The site redeploys by itself every time something is pushed to the `main` branch.

## Team

BBS AI Ambassadors Club, Kuwait

## Local strategy-interface revision
The new interface is in `game/strategy.js` and `game/strategy.css`. Build the offline copy with `python3 tools/bundle.py`; open `dist/Mars-Colony.html` in Chrome. The existing game rules remain the starting point. Settings provides local save/continue; saves are tied to this browser and origin.

The original interface slice is retained under the current Blackout presentation. Some linked research documents describe earlier iterations; current short-mission rules are in `research/BLACKOUT-RULES.md`. See `research/AUDIT.md`, `research/MECHANICS.md`, `research/regression.json`, and `research/balance.json`. Deployment status is recorded separately after verification. Tests use Playwright with installed Chrome; install Playwright separately, run the local server, then `node tests/regression.cjs "$PWD"` and `node tests/balance.cjs "$PWD"`.

## Evidence and council projects

Compare three building sites in **Science**, using NASA-sourced terrain and clearly labeled production models. **Council** offers three optional projects with a bond, an operating test, a deadline and consequences. In **Earth**, 833 saved NASA/JPL Horizons calculations determine the evidence-message delay. Project confirmations, rewards and failures appear in **Chronicle**. All grants, penalties and time compression are fictional game rules.

See [Data and decisions](research/DATA-AND-DECISIONS.md) for provenance, assumptions and remaining work. Run `npm run test:operations` against the local server to verify these systems; `python3 tools/prepare_horizons.py` rebuilds the cached ephemeris from the saved response without network access.

## Operating the colony

**People** now assigns a finite crew to repairs, crops, power tuning or training. **Buildings** previews three production methods and queues repairs that consume parts and interrupt output. **Science** compares terrain-dependent service work. **Rivals** shows finite construction budgets, facilities, recruitment effects and trades. Saves preserve these systems; older missions initialize them safely. The models and numerical changes are documented in [Management rules](research/MANAGEMENT.md). Run `npm run test:management` with the local game server running.


## Release checks

Run `npm install`, serve `game/` at `http://127.0.0.1:8765`, then run:

```sh
npm run bundle
npm run test:junior
npm run test:blackout-systems
npm run test:blackout-ui
npm run test:blackout-boundaries
npm run test:persistence
npm run test:living-world
npm run test:mission-systems
npm run test:walk-surface
npm run test:ares-ui
npm run test:ares-graphics
npm run test:ares-offline
npm test
npm run test:operations
npm run test:management
npm run test:viewport-crew
```

The existing Commander suites opt into that mode explicitly. The Junior suite
checks successful and unsuccessful policies, real costs, arrivals, recovery and
old/new saves. The UI suite uses actual buttons and map clicks, verifies lessons
and source dialogs, and tests desktop, small laptop and phone viewports. The
single-file offline build embeds the new models, textures and portrait as well.

## Authored art and engine boundary

The [surface kit](game/assets/ares/SURFACE-KIT.md) lists original Blender models, editable sources, NASA design references and limits. [Rendering research](research/GRAPHICS-RESEARCH.md) records the lighting decisions and actual browser implementation. The [Unreal art-study scaffold](art/unreal/README.md) prepares the same assets for Lumen; it has not been opened or rendered in Unreal because the editor was unavailable. No UE5 game build is deployed.

Junior now tracks each person in exactly one automatic role and displays water, crew/beds and Appeal. Careful scripted campaigns complete all four sites in 42 game days; this is not child-tested difficulty. Commander remains a deeper, longer mode with known balance limitations.

## Fair comparison and automated play

Mission codes normalize the seed, site, initial stock, rules, data version and event schedule. First attempts are stored independently from practice, with an in-memory fallback when device storage is unavailable. The score considers safe completion before reserves, Parts and discoveries. No wall-clock speed bonus applies. A failed branch records its actual stop day at the common evaluation horizon; its leftover stock is not ranked above a completed mission.

Automated players use the actual Junior rules, and separate browser players exercise visible controls. Reproduced defects receive regression checks. Reports count full playthroughs separately from assertions. These checks do not establish child comprehension, enjoyment, classroom-device performance or that every possible bug has been removed.

The habitat inspector is an interactive schematic using current simulation values, not a modelled 3D interior. Native Blender MCP was unavailable during the overnight revision, so the new original service props were authored with isolated Blender background exports. The user's open scene was not changed.
