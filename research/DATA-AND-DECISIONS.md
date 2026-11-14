# Data that changes a decision · 14 November 2026

This playable slice adds three optional, one-time council projects: sustainable air, shelter reserves, and sustainable food. They require three qualifying sols, then an evidence transmission acknowledged before a deadline. The bond is 2 parts; success returns it and adds 6 parts and 6 Fame. Missing/cancelling loses the bond and 5 Fame, and gives one rival +8 recruitment appeal for 30 sols. All are fictional game rules, shown before committing. The colony's main win condition is unchanged.

## Evidence chain

| Source | Actual input | Decision affected | Boundary |
|---|---|---|---|
| [NASA PDS MOLA](https://pds-geosciences.wustl.edu/missions/mgs/mola.html) | Existing coarse terrain elevations | Compare three build sites; preview powered/staffed output, then place a real building | Pressure and sunlight are simplified models. Preview holds weather, crew and technology constant. Not a surveyed landing-site model. |
| [NASA/JPL Horizons](https://ssd.jpl.nasa.gov/horizons/manual.html) | 833 daily calculated ranges and one-way down-leg light times | Signal time determines how early evidence must be sent to meet a project deadline | Round trip approximated as twice one-way. Training time: one playing second per signal minute, rounded up to whole game sols. Earth centre to Mars centre. Not a cargo travel model. |
| [Curiosity RAD, May 20 2024](https://www.jpl.nasa.gov/news/nasa-watches-mars-light-up-during-epic-solar-storm/) | Reported 8,100 microgray Mars measurement | Shelter project asks whether reserves cover a two-sol production stop | The value motivates the engineering problem; no invented conversion into astronaut injury probability or shielding attenuation. Shelter sizes and event duration are game rules. |
| [NASA MOXIE](https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/) | Demonstration of oxygen extraction from Mars atmosphere | Prove production meets crew demand rather than merely filling a tank once | Output units and crew consumption are game values. |

The existing DONKI Earth observations remain dated training triggers. The storm window now says explicitly that an Earth observation is not proof of an impact at Mars. A Mars-target forecast must be separately verified before it drives a local hazard.

## Reproducibility

- `horizons-earth-mars.txt` is the raw API result; `horizons-query.json` records the query, retrieval time and returned API signature.
- `python3 tools/prepare_horizons.py` validates sequential dates and the range/light-time relationship, then builds the local snapshot. It makes no requests.
- Game sol 1 uses 2023-11-20; one calendar date per game sol is a training abstraction. After the final sample, the last date is explicitly held. No extrapolation is presented as new data.
- The existing 14-sol blackout is scripted; it is not inferred from the Horizons distance. Evidence pauses during it. Existing six-sol orbital cargo remains a separate rule.
- Project state and pending signals stay inside local saves. Old saves initialize without a project.

## Why this teaches through play

A player predicts output from geography, spends limited construction resources, checks actual production against consumption, keeps reserves, and allows for communication latency. The project record explains what was demonstrated after the result. There is no extra quiz to unlock a reward.

Still unverified: child comprehension and engagement, full-game balance with optional rewards, optimal project ordering and long-term replay value. Named council members currently provide role-specific advice; they do not yet have skills or personalities.

## Next systems, in order

1. Maintenance and a finite emergency-supply pipeline: a repair competes with expansion for parts and crew time. Test carefully before replacing the current emergency-crate rule.
2. A storm room: assign actual workers to shelters or essential machines, preview reserve losses, and explain outcomes.
3. Rover science: route cost from terrain, battery and crew absence; sampled evidence feeds a technology choice with an opportunity cost.
4. Verified Mars-target DONKI model snapshots: use issue time, modeled arrival, target and uncertainty for go/no-go decisions. Never equate Earth SEP intensity with Mars surface dose.
5. SWIM/PDS data ingestion with coordinate and confidence checks before replacing the current latitude-based ice tiles. Never call those tiles measured deposits yet.
