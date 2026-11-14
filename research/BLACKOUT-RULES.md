# BLACKOUT short mission — implemented rules and evidence

This document describes `game/blackout.js` using the existing authoritative `game/junior.js` simulation. It does not describe a separate mock simulation. Rules version: **blackout-1**. Data snapshot identifier: **mola-horizons-20261114**. All resource amounts below are game units unless explicitly identified as a NASA/JPL quantity.

## Mission setup and player decisions

The mission code `DRB1-20261114-0` means rules/code format 1, seed 20261114, site 0 (Arcadia Planitia). Sites 1–3 are Jezero Crater, Hellas Basin and Arsia Mons. The format fixes the initial setup, rules/data identifiers and external event tape. The seed controls the existing terrain rules; it does not secretly randomize the short mission's weather. Tutorial bonus Parts, Commander difficulty bonuses and unlocked advanced technologies do not carry into the short mission.

Six adult crew start with 36 air, 36 food, 30 water, 12 Parts and no stored battery energy. The actual initial structures are the landing pod, three solar arrays, two oxygen extractors, a water processor, one already-grown greenhouse and a soil shelter. They occupy real map tiles, with tile sunlight and height-derived air affecting the existing production formulas. Four operators run the oxygen units, processor and greenhouse; two crew remain available for other work. Production can change by site.

| Preparation | Actual cost and effect |
|---|---|
| Battery | 8 Parts; two builders contribute four work per day, completing eight work in two days. Capacity is 40 energy units. Only actual surplus generation charges it. |
| Align arrays | 2 Parts and one technician work day. Starting on the following production day, solar output is multiplied by 1.2 for three production days. Dust and dirt still reduce it. |
| Keep Parts | Costs no Parts and adds no preparation. Reserves and subsequent maintenance still determine the outcome. |

The field task records a prediction and two readings: open ground 100, shelter marker 30. Both are a **simulated relative exposure index**, not dose or engineering shielding ratings. Map inspection and the first-person instrument use the same model. Readings alone earn no short-mission Fame. The player chooses the soil shelter (one day of work interruption during the exercise) or the landing ship (2 Parts for transport and two days of work interruption). Both are safe training responses; no child-facing deaths are shown.

After dust leaves the arrays dirty, the player can book cleaning. It uses the existing Junior mechanic: available cleaners work on the next day outside radiation shelter, pause competing construction, and restore panel cleanliness to 1. It creates no energy. A low-cost viable policy aligns the arrays and later cleans them; a battery policy can use stored power without that maintenance in the canonical scenario. Keeping the Parts and then cleaning is also viable: careful maintenance can be better than buying unnecessary equipment. Ignoring both preparation and maintenance can end in a food shortage. No winning policy is forced by a test-only path or injected supplies.

## Time and the event tape

Time advances only when the player presses Next day. Reading or walking does not spend a mission day. The initial state is day 1; evaluation is after day 9, with at most eight production advances.

| Training day | Event |
|---|---|
| 1 | Predict, prepare, compare field readings, choose shelter and request Earth advice. |
| 2 | First work day; alignment can finish. Radio clock advances 20 training minutes. |
| 3 | Radio pause begins. Battery construction can finish; a booked alignment bonus is active. |
| 4–6 | Dust separately reduces sunlight to 35% before cleanliness and any alignment bonus. Dirt accumulates. |
| 6 | Radio pause has ended. Message clock resumes; the total reaches 40 minutes, short of the sourced approximate round trip. |
| 7 | Dust ends and leaves 70% cleanliness. A separate radiation exercise starts. The radio clock reaches 60 minutes and the reply arrives. Soil shelter pauses work for this day; ship fallback also pauses day 8. |
| 8 | Soil-shelter crew return to work; booked cleaning can complete. Ship-fallback crew remain sheltered. |
| 9 | Final production and outcome. Any shortage ends that branch with a recoverable result. |

These are fictional training days and events, not a calendar reconstruction or live Mars forecast. The reply queue counts available-link time, so it pauses during the exercise. This is an operational teaching abstraction, not a claim that a radio signal stops moving during conjunction. The radio pause does not itself change power, sunlight, food or water. There are no Earth resupply drops during the short mission; the initial resource budget must support the mission.

## NASA/JPL source to rule

| Evidence | Direct implementation | Limits |
|---|---|---|
| [MOLA via Mars Trek](https://trek.nasa.gov/mars/) | Existing global elevation grid supplies tile height. Oxygen output per extractor is `4 × clamp(exp(-height_km / 11.1), 0.5, 1.6)`. | The height-to-air formula is a teaching model; local relief is exaggerated/artistic. It is not a measured extractor performance curve. |
| [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) cached row 2023-11-20 | One-way down-leg light time is **20.98606 minutes**. A reply's approximate signal-only round trip is twice that, **41.97212 minutes**. Each unpaused training day advances the message clock by 20 minutes, so a response cannot be immediate. | Doubling one-way time is a model approximation, without human processing time. Training-time compression is explicit. The cache contains range/light-time, not orbital vectors or conjunction geometry. |
| [NASA's 2023 conjunction account](https://www.nasa.gov/solar-system/planets/mars/nasas-mars-fleet-will-still-conduct-science-while-lying-low/) | Explains why advance planning and local operations matter when Earth commanding is interrupted. | The real command moratorium and complete-contact gap were different durations. Our three-training-day pause is an adaptation, not those durations. |
| [Curiosity RAD evidence](https://science.nasa.gov/resource/radiation-measurements-on-mars/) | Provides the scientific reason to investigate ionizing radiation and take shelter. | The instrument's 100/30 teaching indices are invented and uncalibrated. A simulated marker is not an indoor dose calculation. |
| [NASA power subsystem guidance](https://www.nasa.gov/smallsat-institute/sst-soa/power-subsystems/) | Supports the principle of collecting sunlight with oriented solar arrays. | The 20% multiplier, three-day duration, 2 Parts price and crew time are game tuning. |
| [NASA ISS water recovery account](https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/) | Gives context for recycling finite supplies. Existing Junior rules track throughput, recovered water and new extraction separately. | The published 98% result is distinct from the game's 95% crew-water recovery and 90% plant-water recovery. |

The original Horizons response/query metadata remain in `research/horizons-earth-mars.txt` and `research/horizons-query.json`; the browser reads `game/horizons-snapshot.js`. The cache starts on 20 November 2023. The short mission intentionally uses a covered row and does not claim earlier coverage.

## Existing Junior production rules used unchanged

A crew member consumes 1 air, 1 food and 1 gross water unit per day. The lander's basic water recovery is 75%; a powered, staffed processor recovers 95% of crew water and 90% of the greenhouse's 0.5-unit water use. A processor on a likely-ice tile also extracts 4 fresh water units per day; that tile classification remains a latitude estimate, not a surveyed ice map.

A ripe greenhouse produces 6 food when a powered processor supplies advanced recycling, otherwise 4. New greenhouses still need four powered growing days; the initial short-mission greenhouse is already grown. Oxygen units require 4 power each, the processor 2 and the greenhouse 2. Operators are allocated automatically using the existing priority order. An actual radiation shelter state stops outside production and uses reserves. Machine output, water accounting, battery charging/discharge and construction are computed by Junior, not duplicated in the scenario controller.

## Two futures and score

The original branch records the exact initial plain simulation state, random generator state, external event tape and requested action sequence. The alternative changes the selected preparation, then sequentially replays the later requests through the same engine. The player sees that alternative as a labelled replay. When it finishes, the original colony state is restored and both outcome records remain available. Inapplicable later requests are recorded as rejections rather than silently replaced.

Both policies use evaluation day 9. If a branch reaches a shortage earlier, it becomes a terminal failed result at that evaluation horizon; its actual stop day is retained and shown. The comparison does not rank a failed branch's leftover resources above a successful mission. Causal feedback uses the actual resource differences, recorded food production and days with power-limited machines, plus the relevant storage/generation principle. For a battery-versus-alignment comparison, either applicable mechanism is accepted; the game does not mark a true generation explanation wrong merely because storage also changed.

Score is a safety-first tuple: safe completion, reserve index, remaining Parts, valid field discoveries. The reserve index is `floor(10 × min(air/6, food/6, water/6))`; it is a comparison index, not a forecast of survival time with recycling. Six crew are mandatory. Reading speed and wall-clock time do not affect rank. First-attempt results are stored separately from later practice and cannot be overwritten by replay through the game controls. Local browser storage is not a tamper-proof online leaderboard.

Fame remains separate from competitive rank. Existing alignment can earn its one-time 4 Fame. A correct evidence explanation earns 3, correct transfer answer 3, and completing the investigation 4. Those awards are keyed once per mission state. Repeating readings, answer clicks or a comparison does not add them again. A new practice mission begins its own Fame at zero; it does not accumulate that score into a public rank.

## Recovery, saves and evidence

A depleted air, food or water reserve pauses the branch and offers retry. Retry restores the exact initial scenario and leaves the original first-attempt record intact. Junior checkpoints now retain RNG continuation instead of restarting randomness from the original seed. Save validation checks supported versions, finite state, terrain/building records and bounded scenario records before replacement. Pre-water Junior checkpoints receive their documented 64-unit starting tank; corrupt or future-version data is rejected.

Local export records prediction, field evidence, chosen shelter, actual outcomes, comparison, explanation, transfer response, help/retry use and source metadata. It requires no name or account. Storage failure displays a warning and leaves the current mission and export usable; it is not described as successful persistence. An in-memory fallback preserves the original first attempt through retry while the page remains open. A subsequent successful write retains that original. Reloading with storage unavailable cannot guarantee retention, so the warning asks the player to export before closing.

Automated verification lives in `tests/blackout-systems.cjs`, with output in `dist/verification/blackout-systems.json`. The policy matrix exercises three fixed seeds, four sites and three policies, alongside independent arithmetic, exact replay, communication timing, finite rewards, restore validation, storage failure and recovery checks. Browser control tests and production/offline verification are separate integration evidence. **Child pilot not yet conducted.** No learning gain, classroom-device performance or universal bug-free claim follows from automated assertions.
