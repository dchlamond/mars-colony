# Ares Atlas Junior rules

Implemented 14 November 2026 in `game/junior.js`. This is a distinct ruleset for
younger players, rather than a simpler screen over the Commander economy.
Commander and its older saves retain the existing rules.

## The playable loop

Choose a building and a place, inspect its cost and benefit, then choose **Next
day**. The simulation stays paused between turns. A short work-animation window
follows a turn without allowing extra days to pass.

One objective is active at a time:

1. Build solar power.
2. Make enough air for the six founders.
3. Grow enough food for them.
4. Prepare sustainable air, food and beds, then invite two explorers.
5. Prepare for and get through a three-day dust storm.
6. Protect the crew during a radiation practice alert.
7. Survey nearby ground and maintain air, food and shelter for the town.

The completed mission remains playable. It does not require waiting hundreds of
days for the Commander independence and conjunction endgame.

## Actual rule changes

| System | Junior rule |
|---|---|
| Starting resources | 6 crew, 96 air, 132 food, 68 Parts. |
| Construction | One job at a time; automatic shared shifts provide 4 work/day. Solar, oxygen, greenhouse, ice, shelter and battery take 2 days; habitat takes 3. |
| Materials | One displayed Parts price, with no hidden metal debit. Cancellation refunds the actual amount paid. |
| Production | Automatic operation and shared shifts. There is no individual worker reservation, production-method choice, gradual equipment wear, repair queue or skill-training requirement. Power and stored supplies still limit production. |
| Food | Greenhouses need 4 powered growing days; each then makes 4 food/day, or 6 if supplied with water. All six founders eat 6 food/day. |
| Air | Extractors make 4 times local air thickness, using 4 power/day. Ice melters make 4 air and water two greenhouses, using 2 power/day. |
| Power | Solar panels make up to 5 power using the existing tile-latitude sunlight model. The pod supplies 3. Batteries hold 40. When power is short, lower-priority machines really stop. |
| Arrivals | The player invites two explorers once production can support eight people, eight beds exist and two days of air and food are stored. They arrive the following day with 4 Parts. If readiness changes, they wait safely in orbit. After completing the mission, repeat invitations require capacity and reserves for the next two people; the initial 4-Part award does not repeat. |
| Supplies | 8 Parts arrive every 8 days. Each completed objective grants 3 Parts. A late unlocked mine makes Parts directly, not a second spendable material. |
| Exploration | Costs 1 Part. Two explorers reach a site in 2 days and return in 4. Ground must be 3–10 tiles from the pod and outside neighbouring territory. |
| Dust | Forecast when the explorers arrive, begins 5 days later, lasts 3 days and reduces solar power to 35%. Residual dust leaves panels at 70%. Cleaning takes one day and pauses construction. |
| Radiation | A practice alert follows the dust lesson, with 5 days' warning. Enough shelter means 1 day under cover. Inadequate shelter means retreat to the landing ship, 2 lost Parts and 2 days without production. This is a fictional teaching consequence, not a radiation-dose calculation. |
| Shortages | Empty air or food freezes the simulation. The player retries the last completed-objective checkpoint. Later spending, construction and elapsed days are rolled back; the retry count is recorded. No colonists die or disappear. |
| Neighbours | They remain on the map, but competitive recruitment, timed contracts, bonds and rival development are not part of the Junior turn loop. |

The Parts prices are solar 6, oxygen 10, greenhouse 8, ice 10, shelter 4, habitat
9, battery 8, rover 1, mine 6, recreation dome 10 and reactor 30. These are game
balance choices, not estimates of real hardware costs.

## What creates difficulty

The safe path requires a sequence. Building a greenhouse without enough power
does not grow food. Running extra oxygen machines can leave a greenhouse without
power. Inviting explorers requires sustainable output for eight, not just full
tanks. Storm preparations use Parts and construction time; stored reserves
matter when machines stop. Excessive building in the wrong order can consume
the time before a reserve empties. A retry loses progress after its checkpoint
and asks the player to change the plan.

## NASA evidence and the teaching model

Existing NASA MOLA-derived tile heights still affect the air-density model and
therefore actual oxygen output. Latitude still affects solar power; ice tiles
remain a latitude-based approximation. The optional building explanations link
to the existing MOXIE, InSight, Phoenix, SWIM and Curiosity sources.

Junior storm schedules, production rates, four-day crops, costs, construction
times and orbiting shuttles are invented training rules. The alerts are not live
NASA forecasts. The source screen and existing detailed data tools remain
available. This work does not add OSDR or RadLab datasets.

## Save compatibility and verification

The existing local save format stores Junior's state in `S.junior`, including a
checkpoint with all live Three.js scene references removed. Saves without this
field remain Commander saves. New-mission mode can be selected through the UI;
`?mode=commander` or `window.__MARS_MODE__ = 'commander'` before page load supports
the unchanged legacy regression suites.

Run `node tests/junior.cjs` with the local server on port 8765, or set `GAME_URL`.
The 38 checks cover actual debits and refunds, all four landing sites, a poor
power decision, neglected life support, time freezing, checkpoint rollback,
storm costs and production interruption, terrain-dependent air, saved Junior
missions, older saves, post-mission population growth and the retained Commander material economy.

A careful scripted policy completed all four sites on day 35 with eight crew,
no retries and positive reserves. Final food was 22–50 units; an idle policy ran
out of air and had to retry. Full evidence is in `junior-balance.json`.

These tests establish achievable and recoverable rules under the tested
policies. They do not establish that difficulty is ideal for every seven-year-old.
Classroom playtesting should measure whether children understand the next
objective, notice falling reserves, and recover from a checkpoint without an
adult selecting every action.
