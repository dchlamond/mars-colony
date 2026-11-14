# Ares Atlas: Mars Colony

A strategy game about the first town on Mars, played on a NASA-sourced map. Junior missions teach through short, recoverable challenges; Commander keeps the detailed colony simulation.
Made for the NASA Space Apps Challenge 2026, challenge "Build a Junior Astronaut Mission Trainer".

**Play it:** https://mars-colony-tau.vercel.app (no account, no download)

NASA does not endorse this game.

## What it is

Players aged 7 to 12 choose one of four real landing sites, then balance power,
air, food, shelter and homes. Junior is the default: one goal at a time, one
Parts price, automatic crew work, and a deliberate **Next day** action. Poor
planning can stop machines or exhaust reserves; checkpoint retries preserve
earlier progress. Sustainable production and spare beds allow new explorers to
arrive the next day.

Commander retains production methods, maintenance, skilled crew, competitive
recruitment, evidence projects and its original difficulty choices. Existing
Commander saves stay compatible. Both modes use the Ares Atlas navy-and-brass
interface, custom Blender habitat and greenhouse, original regolith materials,
articulated astronauts and the clearly fictional Martian guide.

See [Junior rules and evidence](research/JUNIOR-MODE.md) for the precise trade-offs.

## How the challenge is met

| Decision area in the challenge | What the player does | Real record behind it |
|---|---|---|
| Life support | Builds oxygen extractors. They make more air on low ground, where the air is thicker. | Tile heights from the MOLA laser altimeter (NASA Mars Trek). MOXIE on the Perseverance rover. |
| Radiation shielding | Builds soil shelters, then chooses shelter or work when a storm arrives. | Earth observations from NASA DONKI inspire fictional Mars scenarios; Curiosity supplies an actual Mars radiation measurement from May 2024. |
| Power budgeting | Places solar panels by latitude, cleans dust, decides which machines get power. | Tile latitude. InSight and Opportunity dust records. |
| Food production | Plans for growing time: 4 powered days in Junior, 20 sols initially in Commander. Washes soil or grows in water. | Phoenix lander perchlorate finding. |
| Communication delay | Orders supplies days ahead and gets through a two-week radio blackout alone. | Mars solar conjunction (NASA/JPL). |

## What is real and what is not

- **Real:** NASA-sourced Mars relief, archived observations and facts on cards. Each has a source link
  on the game's **Data sources** screen.
- **Simplified:** sunlight and air thickness per tile, ice by latitude, cave regions.
- **Invented for the game:** Junior practice-storm schedules, four-day crops, checkpoint retries, rival colonies, Fame medals, costs, upgrades and machine output.
- **Recorded, not live:** storm records are saved inside the game. The Space weather panel shows one saved week of NASA DONKI records and can be refreshed by hand. Those records are kept separate from the storms in play.

Known limits: balance has been tested by scripts, not yet by children. Art is an implemented upgrade, not a claim of AAA production quality; astronaut motion is procedural, not a complete motion-capture library. OSDR and RadLab are listed by the challenge and not used yet.

## Privacy

The game collects nothing and loads no files from other websites. The one outside request is optional: the Refresh button in the Space weather panel asks NASA's DONKI service for newer records.

## What is where

| Path | What it is |
|---|---|
| `game/` | The whole game. This folder is what the website serves. |
| `game/index.html` | Base simulation, NASA terrain and page. |
| `game/junior.js` | Separate Junior rules, progression and checkpoint recovery. |
| `game/ares-ui.js`, `game/ares-ui.css` | Responsive Ares Atlas interface. |
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

This is a tested first interface slice, not the full upgrade brief. See `research/AUDIT.md`, `research/MECHANICS.md`, `research/regression.json`, and `research/balance.json`. Deployment status is recorded separately after verification. Tests use Playwright with installed Chrome; install Playwright separately, run the local server, then `node tests/regression.cjs "$PWD"` and `node tests/balance.cjs "$PWD"`.

## Evidence and council projects

Compare three building sites in **Science**, using NASA-sourced terrain and clearly labeled production models. **Council** offers three optional projects with a bond, an operating test, a deadline and consequences. In **Earth**, 833 saved NASA/JPL Horizons calculations determine the evidence-message delay. Project confirmations, rewards and failures appear in **Chronicle**. All grants, penalties and time compression are fictional game rules.

See [Data and decisions](research/DATA-AND-DECISIONS.md) for provenance, assumptions and remaining work. Run `npm run test:operations` against the local server to verify these systems; `python3 tools/prepare_horizons.py` rebuilds the cached ephemeris from the saved response without network access.

## Operating the colony

**People** now assigns a finite crew to repairs, crops, power tuning or training. **Buildings** previews three production methods and queues repairs that consume parts and interrupt output. **Science** compares terrain-dependent service work. **Rivals** shows finite construction budgets, facilities, recruitment effects and trades. Saves preserve these systems; older missions initialize them safely. The models and numerical changes are documented in [Management rules](research/MANAGEMENT.md). Run `npm run test:management` with the local game server running.


## Ares Atlas release checks

Run `npm install`, serve `game/` at `http://127.0.0.1:8765`, then run:

```sh
npm run bundle
npm run test:junior
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
