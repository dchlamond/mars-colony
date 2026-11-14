# Mars Colony: Junior Mission Trainer

A strategy game of the first town on Mars, played on a NASA-sourced map with training scenarios based on archived space-weather records.
Made for the NASA Space Apps Challenge 2026, challenge "Build a Junior Astronaut Mission Trainer".

**Play it:** https://mars-colony-tau.vercel.app (no account, no download)

NASA does not endorse this game.

## What it is

A child aged 7 to 12 commands the first town on Mars. They pick one of four real landing sites, then balance
power, air, food, shelter and homes while two rival colonies compete for land and new colonists.
Every choice costs something, and the game explains the real science behind each cost.

## How the challenge is met

| Decision area in the challenge | What the player does | Real record behind it |
|---|---|---|
| Life support | Builds oxygen extractors. They make more air on low ground, where the air is thicker. | Tile heights from the MOLA laser altimeter (NASA Mars Trek). MOXIE on the Perseverance rover. |
| Radiation shielding | Builds soil shelters, then chooses shelter or work when a storm arrives. | Earth observations from NASA DONKI inspire fictional Mars scenarios; Curiosity supplies an actual Mars radiation measurement from May 2024. |
| Power budgeting | Places solar panels by latitude, cleans dust, decides which machines get power. | Tile latitude. InSight and Opportunity dust records. |
| Food production | Plants early, because crops take 20 sols. Washes soil or grows in water. | Phoenix lander perchlorate finding. |
| Communication delay | Orders supplies days ahead and gets through a two-week radio blackout alone. | Mars solar conjunction (NASA/JPL). |

## What is real and what is not

- **Real:** the shape of Mars, the dates and strengths of the storms, and the facts on the cards. Each has a source link
  on the game's **Data sources** screen.
- **Simplified:** sunlight and air thickness per tile, ice by latitude, cave regions.
- **Invented for the game:** rival colonies, Fame medals, costs, upgrades and how much each machine makes.
- **Recorded, not live:** storm records are saved inside the game. The Space weather panel shows one saved week of NASA DONKI records and can be refreshed by hand. Those records are kept separate from the storms in play.

Known limits: balance has been tested by scripts, not yet by children. Eight buildings are simple shapes.
OSDR and RadLab are listed by the challenge and not used yet.

## Privacy

The game collects nothing and loads no files from other websites. The one outside request is optional: the Refresh button in the Space weather panel asks NASA's DONKI service for newer records.

## What is where

| Path | What it is |
|---|---|
| `game/` | The whole game. This folder is what the website serves. |
| `game/index.html` | The page and all of the game's own code. |
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
