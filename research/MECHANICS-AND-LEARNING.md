# Mechanics and learning audit

14 November 2026. This is an implementation audit against the project's stated aims: an approachable Mars strategy game with meaningful decisions, scientific evidence, recoverable stakes, attractive visuals and a usable classroom interface. It is not an official competition eligibility determination or a measured learning study.

## What changed across the actual releases

| System | Original trainer (`53d651c`) | Advanced strategy releases (`af3029a`, `23734e8`) | Current Junior |
|---|---|---|---|
| Rhythm | Continuous simulation, long crop growth and long independence campaign. | More planning panels and forecasts around the same long simulation. | One deliberate day at a time; one visible objective; four powered crop-growing days. |
| Labour | Anonymous operators, then idle people build; rover reduces available head count. | Six named founders with skills, specialist duties, training and repair work; assignments compete with operation/building. | Named but skill-free roster; one actual role each. Automatic priority assignments; a booked solar job takes one technician, other free workers build/clean, and two free explorers go on trips. |
| Production | Fixed machine rates with power, latitude, air-density and watering effects. | Economy/Steady/Intensive methods trade yield, power and wear; skilled research can modify output. | Simple rates with actual power, crew and water constraints; optional paid solar alignment adds a temporary output/work tradeoff. No wear or method menu. |
| Materials | Parts and metal, sometimes with non-obvious consequences for a novice. | Repairs and trade add competing material demands. | One construction currency, Parts, with the actual debit/refund shown. Water is a separate life-support stock. |
| Population | Shared shuttles allocated among three colonies; appeal matters. | Rival building budgets and successful/missed commitments alter recruitment appeal and real allocation. | Explicit two-person invitation; readiness checked before booking and again before landing. No competitive passenger split. |
| Risks | Air/food shortages, radiation, dust, long conjunction interruption and rescue/departure rules. | Machinery failure, repair interruption, deadline/bond failure and rival growth add pressure. | Air/food/water shortages cause checkpoint retries. Dust/radiation are forecast lessons with real production interruption and recovery. |
| Geography | NASA-derived elevation, latitude-based sunlight/ice, cave regions. | Side-by-side build forecasts and terrain-dependent repair workload. | Heights/sunlight still change output; water extraction only on likely-ice terrain. Processor recycling remains available at every landing site. |
| Evidence | Fact cards and journals accompany actions. | Council projects require operating evidence and communication deadlines from a dated JPL Horizons light-time snapshot. | Building explanations, water ledger, source links, map layers, recorded simulated field readings and finite evidence Fame. Advanced evidence contracts remain Commander-only. |
| Save and access | Browser prototype. | Local mission saves and strategy panels. | Local save/restore, offline bundle, responsive mission interface and top-positioned Walk return. |

The advanced releases remain available in Commander; the current Junior defaults deliberately omit several of their systems. It is inaccurate to say that all advanced strategy mechanics were transferred into the young-child mode. It is also inaccurate to claim that named characters alone create an interpersonal narrative: Junior names identify work assignments, and Commander skills affect outputs, but neither mode currently has a deep relationship or dynasty simulation.

## Complete system map

| Player action | What the simulation changes | What a learner can discover |
|---|---|---|
| Choose a landing site or map layer | Changes actual heights, solar model and likely resource terrain. | Different places have different strengths; an estimate is not a surveyed deposit. |
| Place a building | Spends Parts, reserves a tile and adds one construction job. | Every choice uses finite materials and time. |
| Advance a day | Completes crew work, grows powered crops, accounts for resource flows and moves events. | A stock is different from its rate of change. |
| Make air | Uses power and an operator; output depends on local air thickness. | Machines convert local resources and require supporting infrastructure. |
| Recycle/extract water | Returns a fraction of used water; extraction adds new water only on ice. | Recovery conserves a resource but does not manufacture it. |
| Grow food | Requires time, power, crew and water. | Biological production has dependencies and a delay. |
| Add power/storage | Raises instantaneous supply or buffers a future shortage. | Generation and stored energy solve different problems. |
| Align solar arrays | Spends 2 Parts and one technician day; then adds 20% solar output for three days, with an eight-day booking cooldown. | Improving generation costs materials and labour; dust still limits sunlight. |
| Invite explorers | Raises labour capacity, daily use and bed/shelter requirements together. | Growth has both benefits and costs. |
| Switch a machine off | Frees its operator and power but removes its production. | Opportunity cost can be more important than owning more buildings. |
| Build shelter and prepare for dust | Keeps reserves/workforce available through interruptions. | Planning before a forecast is more effective than reacting after it. |
| Send a rover | Uses two free people for four days and reveals a region. | Exploration can bring information while temporarily reducing capacity. |
| Improve Appeal | Changes an explained report of needs and comfort. | Successful settlements need safety and well-being as well as output. |
| Retry a checkpoint | Undoes progress since the last completed goal, retains earlier achievements and records the retry. | A failed prediction can be revised without a permanent loss. |
| Read Discoveries or inspect sources | Opens the supporting science and distinguishes game rules. | Evidence can be checked; a fictional guide is not evidence. |
| Walk and record exposure conditions | Moves through the surface scene, changes a simulated relative index by proximity, and stores one reading per condition with finite Fame rewards. Junior stays turn-based; entering Walk starts Commander at normal speed. | Compare open ground, rock and shelter markers, then distinguish the teaching model from measured NASA examples. This is a limited field investigation, not a calibrated sensor simulation. |
| Open Fame and field notes | Shows current Fame, one-time evidence awards and recorded condition/index/day values. | A new comparison carries evidence; repeating the same click does not. |
| Save/continue | Serializes the mission locally, including its mode/checkpoint. | Enables classroom continuation without an account or uploaded student information. |

For exact Junior costs and formulae, see [JUNIOR-MODE.md](JUNIOR-MODE.md). Commander operation/evidence details are in [MANAGEMENT.md](MANAGEMENT.md) and [DATA-AND-DECISIONS.md](DATA-AND-DECISIONS.md).

## Goal status and remaining evidence

| Aim | Current evidence | What is not yet established |
|---|---|---|
| Playable, appropriately paced younger-child mode | Guided objectives, deliberate turns, tested completion across four sites, recoverable setbacks. | Actual child comprehension, enjoyment, reading load and classroom pacing. |
| Meaningful strategy | Worker/power/water constraints, reserve planning, terrain effects, growth costs and forecast hazards. | Long-term optimal balance and varied replay after the guided mission. |
| NASA science affects decisions | MOLA heights affect output; latitude affects power; published MOXIE/water/crop/radiation research informs linked lessons; solar orientation and measured InSight/Curiosity examples support explicit comparisons. | Ice is not yet driven by SWIM raster values; the Junior hazard schedule is fictional; no OSDR/RadLab analysis is integrated. |
| Clear population distribution | Exact roster and capacity check; no person counted twice; invitation waits safely if readiness falls. | Individual pathfinding, traffic congestion and travel-time costs between all workplaces. |
| Explainable data | Source panels, explicit approximations and recorded model readings; the advanced mode has dated Horizons inputs. | Freeform student hypotheses, exportable learning results, repeated measurement series and a general-purpose evidence notebook. |
| Coherent premium art | See the actual asset/rendering release and its provenance rather than judging from a concept mockup. | A concept image does not prove real-time visual parity, performance or ray tracing. |
| Accessible classroom operation | Responsive layouts, local saves, offline bundle, reduced motion and adjustable text. | Broad accessibility review and testing on the actual classroom hardware. |
| Competition readiness | A functioning science-based game and documented limitations. | Check current selected challenge, required datasets, deliverables and eligibility before claiming all competition goals are met. |

The most useful next classroom evaluation is short: ask a child to build power, explain why an oxygen machine is not working, compare water use before/after recycling, predict what two more crew will need, prepare for a warning, and explain a retry. Record where help was required; use those observations to tune timing and wording rather than inferring usability from automated victories.


## Addendum: solar alignment and field evidence

The Junior power action now spends 2 Parts and one real technician day to align solar arrays. The next three production days receive a 20% solar multiplier; an eight-day booking cooldown prevents stacking. Dust, cleanliness and latitude still matter, and reactors/pod power receive no bonus. A technician is counted once in the real crew allocation, after essential operators and before builders. The resulting opportunity cost is fewer hands for construction.

The principle comes from NASA's solar incidence explanation; the numerical bonus and timing are designed for play. The Power panel also gives a measured comparison: InSight recovered about 30 Wh/sol on 22 May 2021 after a wind-assisted dust-removal attempt, which is a cleaning observation rather than the game's alignment mechanism. Sources: [NASA power systems](https://www.nasa.gov/smallsat-institute/sst-soa/power-subsystems/), [NASA/JPL InSight result](https://www.jpl.nasa.gov/news/nasas-insight-mars-lander-gets-a-power-boost/).

Fame is visible and earned through stable one-time achievement keys. Junior retains 3 points per mission objective; first alignment gives 4; first rover terrain kinds give 3 each; distinct simulated exposure conditions and comparisons provide up to 17 field-reading points. Repeated clicks, a different day, or repeated terrain do not add points. Save and checkpoint state includes the ledger. Junior Fame is recognition rather than a life-support gate; Commander Fame continues to affect medal-based recruitment.

Walking instrument readings are explicitly a simulated relative index. Recording and comparing them exercises prediction and observation, but does not turn them into NASA measurements. The exact measured-event source, index assumptions and limits belong beside the instrument as well as in this guide. Appeal remains unchanged: a Junior readiness report and a real Commander shared-passenger recruitment factor.


### Independent Walk integration audit

The held dosimeter derives its condition from the current Walk position each time a reading is recorded. Open ground is the reference 100; a visible authored rock outcrop near the colony gives 96 within its labelled comparison area; proximity to a completed soil shelter gives 30. The outcrop is placed three tiles from the pod, has a collision footprint and an accessible sample position, and is explicitly an artistic teaching site. It does not claim measured shielding at that fictional location or make arbitrary rocks protective. The shelter marker uses a 1.65-world-unit proximity test, not entry into a sealed interior or radiation ray/occlusion/material calculations. Decorative gravel does not create a new measured shielding category. The implementation does not depend on a nonexistent rock terrain type; the generated scientific map remains plain, likely-ice and volcanic/cave-region tiles. Recording is blocked during radiation alerts; Junior recovery also blocks rewards.

The visible instrument is labelled **Simulation / relative exposure index**. Its NASA evidence panel explicitly separates this game index from Curiosity's measured approximately 4% decrease in overall radiation at one cliff location and the reported 8,100-microgray absorbed event dose during the 20 May 2024 solar storm. It does not describe the historical event as a current dose rate or temperature. A 30 shelter index is an invented teaching value. [NASA cliff observation](https://www.nasa.gov/missions/mars-science-laboratory/how-nasas-curiosity-rover-is-making-mars-safer-for-astronauts/), [NASA/JPL event report](https://www.jpl.nasa.gov/news/nasa-watches-mars-light-up-during-epic-solar-storm/).

Each recorded condition stores its coordinates, day and model index in the mission's local state. Field notes expose these values for comparison. The record API accepts only known simulated conditions and valid coordinates; the Walk module supplies the actual current condition. It is not an external-data validation service. Save/restore preserves this ledger, and checkpoint retry rolls both evidence and Fame back together. This supports a bounded predict/observe/compare activity, while calibrated physics, raw NASA radiation time series, experiment exports and assessment of learning remain unimplemented.


The reproducible browser integration test (`node tests/survey-evidence.cjs`, local server on port 8765 or `GAME_URL`) passed **16 checks** using actual Walk positions and the public `SurfaceSurvey.record()` action: accessible open ground produced 100, the real authored outcrop's unblocked sample position produced 96, and an accessible shelter comparison position produced 30. The three observations plus comparisons reached exactly 17 Fame; repeating the record did not add score. The test exercised the real local-save/load buttons' APIs and verified all three recorded values and Fame restored together without repayment. A fresh mission cleared the previous reward message; an active radiation alert blocked outdoor recording. There were no browser runtime errors. This is a software integration check, not a calibration or learning-effectiveness study.
