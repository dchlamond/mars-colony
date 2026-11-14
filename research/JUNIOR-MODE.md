# DEAD RECKONING: BLACKOUT — Junior rules

Updated 14 November 2026. `game/junior.js` implements a distinct ruleset for younger players. Commander and saves without `S.junior` retain the existing advanced rules. This document describes the current implementation, not a claimed learning outcome.

## The playable loop

Choose a building and a place, inspect its cost and benefit, then choose **Next day**. Time stays paused between turns. The short animation after a turn does not advance another day. One objective is shown at a time:

1. Build solar power.
2. Make enough air for the six founders.
3. Build and power a Water Processor, then grow enough food.
4. Prepare air, food, water and beds; invite two explorers.
5. Store power and survive a three-day dust storm; clean the panels afterward.
6. Build shelter before the radiation practice alert.
7. Survey nearby ground while maintaining the colony's life support and shelter.

The completed mission remains playable. It does not require the long Commander independence/conjunction endgame. Later invitations require capacity for each additional pair of explorers.

## Resources and buildings

| System | Junior rule |
|---|---|
| Start | 6 crew, 96 air, 144 food, 64 water, 68 Parts; no hidden metal cost. |
| Construction | One queued building. Up to two available builders provide 2 work each/day. Most jobs require 8 work, habitat/dome 12, mine 10, reactor 24. No free builder means no progress. Cancelling returns the actual Parts paid. |
| Air | Each oxygen extractor requires an operator and 4 power; output is 4 × local air thickness, or ×1.5 at level 2. Each crew member consumes 1 air/day. A Water Processor does not produce oxygen. |
| Food | Each powered, staffed greenhouse requires four growing days. It then makes 4 food/day, or 6 with an active advanced water-recovery loop; level 2 adds 2. Each crew member eats 1 food/day. Empty water stops crop output. |
| Water | Each crew member uses 1 water/day before recovery; every powered greenhouse uses 0.5. The pod recovers 75% of crew use and 50% of plant use. A staffed, powered Water Processor raises these to 95% and 90%. Only processors on likely-ice tiles add newly extracted water: 4/day, or 6 at level 2. |
| Power | The pod makes 3. Solar makes 5 × tile sunlight × panel cleanliness × dust multiplier; upgrades add 50%. Staffed reactors make 14. Batteries store 40, or 80 upgraded. When supply plus stored power cannot meet demand, machines stop in order: recreation, mine, greenhouse, water processor, oxygen. |
| Parts | Prices: solar 6, oxygen 10, greenhouse 8, water processor 10, shield 4, habitat 9, battery 8, rover trip 1, mine 6, recreation dome 10, reactor 30. A staffed powered mine makes 1 Part/day. Each completed objective awards 3 Parts. |
| Resupply | A shuttle brings 8 Parts and 12 water every eight days, first arriving on day 9. The tank holds at least 160 water. A colony without ice extraction still relies on water top-ups; recycling is not a source of unlimited new water. |
| Beds | The pod has 8; a habitat adds 8, or 12 upgraded. |
| Shelter | The pod shelters 3. A soil shield adds 6, or 14 on a cave tile; upgrades add 4. |
| Recreation | A staffed dome uses 3 power, provides comfort for 8 and contributes to the explained Appeal score. |
| Upgrades | Supported level-1 buildings cost half their Junior Parts price rounded up, plus 2 Parts. They are offline for two days. The normal Junior building panel does not expose the advanced upgrade workflow. |

For eight crew and two greenhouses, gross daily water use is 9. With a Water Processor on ordinary ground, 8.5 is recovered and the tank loses 0.5. On a likely-ice tile, the processor adds 4 newly extracted water, making the tank gain 3.5 before the storage cap. Recovered water never exceeds the water used. Adding extra ordinary-ground processors does not multiply recovery beyond the stated fraction.

## Population and work distribution

Population is actual colony head count. A deterministic roster gives every person exactly one role; the sum of roles always equals population. The first six are fictional named adults, with generic explorer labels for newcomers. Names do not confer hidden bonuses in Junior.

1. Two people on a rover are removed from the home workforce.
2. During a radiation alert, people at home shelter; they do not also operate or build.
3. At home, one operator is assigned per enabled finished machine, prioritizing oxygen, water, food, reactor, mine, then recreation. Machines without operators do not produce. Solar arrays and batteries do not require continuous operators.
4. A booked solar alignment takes one remaining person as its technician. That person is not also a builder, cleaner or operator.
5. Up to two remaining people build the queued job, or clean panels if cleaning was selected. Each builder supplies 2 work/day.
6. Everyone else rests. Resting is a visible unused capacity, not another copy of a worker.

A machine waiting for power retains its assigned operator until switched off. Switching off an optional machine can free that person to build or explore. A rover cannot depart by silently borrowing an essential operator. This creates an understandable tradeoff without manual skill menus.

The roster API is `Junior.crewRoles()`. It reports operators, builders, cleaners, technicians, explorers, sheltered and resting counts, the construction rate, and each person's role/building coordinates. Junior renders one authored astronaut per roster member who is outside. People on a rover or taking shelter are hidden from the colony view; old representative figures are disabled in Junior. Commander retains its separate representative facility figures. The Crew panel is the authoritative allocation record.

### Arrival and colony distribution

Junior does **not** divide a passenger shuttle between competing colonies. The player explicitly invites a pair. The invitation requires enough air/food output for the expanded population, enough beds, two days of air/food reserves, a water reserve after recycling, and no storm or unstaffed enabled machine. The pair arrives next day. If conditions worsen after booking, the same pair waits safely in orbit; booking cannot duplicate it.

The first pair brings 4 Parts once. Later pairs do not repeat that reward. New arrivals immediately join the allocation roster. Rival-weighted recruitment remains a Commander mechanic.

## Events, stakes and recovery

Completing the first invitation objective announces dust with five preparation days. Dust lasts three days and reduces sunlight to 35%; residual dust leaves panel cleanliness at 70%. Cleaning takes a working day with available cleaners and pauses construction.

The radiation practice alert follows the dust lesson with five days' warning. Sufficient shelter means one day taking cover. Insufficient shelter means a two-day retreat to the landing ship and a 2-Part transport cost. Production and construction pause while sheltering; stored air, food and water are still consumed. These are fictional teaching consequences, not radiation-dose calculations.

A rover trip costs 1 Part, uses two free people, surveys its destination after two days and returns after four. The target must be 3–10 hexes from the pod and outside a neighbour's territory. Rover absence is a real workforce cost. A scripted careful policy completes the seven-objective campaign on day 42 of game time.

Empty air, food or water freezes time and offers the last completed-objective checkpoint. Later spending, building and elapsed time are rolled back, while the retry count increases. No colonists die or disappear in Junior. Losing progress creates a consequence while allowing a child to try a different plan.

## Appeal

Appeal is an explained colony-condition report in Junior; it does not secretly reroute invitations to rivals. Base score 40 is increased by secure air (+15), secure food (+15), healthy water reserve (+10), enough beds (+5), enough shelter (+5), sufficient power/crew for enabled machines (+5), and recreation for everyone (+5). Maximum is 100. A recovery state caps it at 35. Each row reports why its points are present or missing through `Junior.appealInfo()`.

## Solar alignment and evidence Fame

A completed, enabled solar array, 2 Parts and one person available after machine operators permit **Align solar arrays**. The technician works one day. At that day's end the job completes; only the following three production days receive a ×1.2 solar multiplier. This affects real generation and battery/resource ledgers, not just a displayed number. It does not affect the pod or reactors. Latitude, cleanliness and atmospheric dust still multiply output. Solar upgrades remain a separate permanent change.

Alignment cannot stack. Another booking requires eight days since the previous booking. A radiation alert, unavailable technician, or all arrays switched off pauses a booked job. A player cannot start a job while panel cleaning is already queued. A technician can reduce the number of builders and thus actual construction progress. A repeat costs Parts and work again, but the first successful alignment's 4 Fame is awarded only once.

Fame awards are stored in `S.missionSystems.awards` with stable keys. Existing seven Junior milestones keep their 3 Fame each. Each first rover terrain kind awards 3 (plain, likely ice, possible lava tube, rock); the map labels are not surveyed deposits. First simulated open/rock/shelter readings award 3 each. An open-versus-rock comparison adds 4 and open-versus-shelter adds 4, for a finite 17 field-reading Fame. Repeating a condition or a terrain kind never adds score. Save/load persists the ledger; checkpoint rollback restores both score and ledger together. Existing saves record previously paid milestone awards without paying them again.

Existing medal thresholds remain 20/50/100/170/260. Junior Fame is recognition only; it does not gate basic life support or alter invitations. Commander retains its existing awards, penalties and recruitment medal effect. New field evidence adds to that score. The timed alignment action is honestly unavailable in Commander, which retains research, cleaning and upgrades.

NASA's power reference explains how Sun incidence changes solar generation. Orion arrays rotate on two axes to stay Sun-aligned. These support the principle, while **20%, three days, 2 Parts and eight days are game tuning**. They are not reported NASA Mars performance. [NASA power systems](https://www.nasa.gov/smallsat-institute/sst-soa/power-subsystems/), [NASA Orion arrays](https://www.nasa.gov/image-article/engineers-install-orion-solar-array-wings-for-artemis-ii/).

A separate observed datum is exposed in the Power drawer: InSight gained about **30 watt-hours per sol on 22 May 2021** after wind-borne grains removed some panel dust. That is a cleaning result, not an alignment percentage. [NASA/JPL InSight power recovery](https://www.jpl.nasa.gov/news/nasas-insight-mars-lander-gets-a-power-boost/).

Run `node tests/mission-systems.cjs` for cost, timing, real output, labour competition, paused work, cooldown, finite rewards, checkpoint and Commander preservation tests.

## Education and scientific boundaries

The actual lesson is predict → place → observe the resource change → prepare → recover or improve. MOLA-derived heights affect air density and oxygen output. Latitude affects solar output. Water recovery reduces ongoing use; it does not create water. Population increases consumption and work capacity together. A larger greenhouse count is not helpful if power or operators are missing. Reserves matter during interruptions.

NASA demonstrated 98% recovery of collected water in the U.S. segment of the International Space Station. The game's 75%/95% crew and 50%/90% plant rates are deliberately simpler training numbers, not a Mars engineering forecast. [NASA water-recovery milestone](https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/).

Ice tiles still use latitude, not the surveyed SWIM raster. The game links the actual mapping work so players can distinguish evidence from an estimate. [NASA SWIM map](https://science.nasa.gov/resource/swim-map-shows-subsurface-water-ice-on-mars/).

NASA's MOXIE demonstrated oxygen extraction from the Martian atmosphere; the game uses made-up output units and scales it with a simple height/pressure model. [NASA MOXIE results](https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/).

NASA's Veggie studies plant growth and supplies supplemental fresh food; the four-day crops and self-sufficient food economy here are gameplay abstractions. [NASA Veggie](https://science.nasa.gov/mission/veggie/).

Junior alerts are scheduled scenarios, not live NASA forecasts. This release does not add OSDR or RadLab data. The human mission guide is fictional. The game is not a scientifically validated design for keeping real people alive on Mars.

## Verification and limits

Run `npm run test:junior` with the local server on port 8765, or set `GAME_URL`.
The 63 checks cover actual costs/refunds, all four landing sites, water conservation and ice extraction, actual crew accounting, construction capacity, rover absence, shortages and retries, storm consequences, geography-dependent air, pending arrivals, saved Junior missions and the retained Commander economy.

A careful scripted policy completed all four sites on day 42 with eight crew, zero retries and positive air, food and water. An idle policy runs out of air. A low-water setup triggers recovery. Full evidence is in `junior-balance.json`.

These are software and balance checks, not proof that the difficulty is ideal for every seven-year-old. Classroom tests should observe whether children understand the current objective, notice a falling reserve, can explain a placement decision and can recover without an adult choosing every action.
