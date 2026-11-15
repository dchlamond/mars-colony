# NASA dataset audit — emergency release, 15 November 2026

## Replaced or removed

- Individual +5 Water, +5 Air and +3 Parts rock rewards and randomized composition assignment removed.
- F/E scans now save the nearest actual bundled MOLA sample with coordinates, raw encoded height and approximate kilometres. They do not identify the rendered rock’s composition. No supplies or Fame are awarded.
- Numerical radiation indices 100/96/30 removed from the handheld tool, Blackout comparison and current discovery records.
- Blackout now predicts and compares two actual MOLA elevations, including an equal-at-this-resolution answer. Both observation paths remain playable.
- Latitude-generated ice deposits and uncatalogued cave tiles/bonuses removed. Old saved maps/checkpoints migrate to plain terrain.
- Day-300 escalating storms removed. Historical event references are traceable to seven NASA DONKI SEP records archived in donki-sep-may-2024.json. Earth observations are not presented as Mars impacts.
- Science lessons, questions, Council evidence and upgrade descriptions now use the imported MOLA/Horizons/DONKI records or explicitly say game rule. Article-only claims and NIST information removed from these displays.
- The original film was initially disabled during the dataset correction because it describes the earlier radiation tool. On the subsequent explicit user request, the existing Hades film with Arabic subtitles was restored as a skippable opening, with native player controls. Its narration has not been rewritten; the current interactive scanner remains a MOLA terrain reader.
- Mission and teacher guides replaced with current controls and provenance. No sign-in is required. The opening film can be skipped immediately, then Begin mission starts the game.

## Scientific input inventory

| Dataset | Actual use | Limits |
|---|---|---|
| NASA Mars Global Surveyor MOLA | Global relief, terrain scan ledger and two-location elevation comparison | Existing360×180 8-bit resampled grid; approximate elevations. No rock mineralogy, ice probability, local cave or radiation data. |
| NASA/JPL Horizons | Dated Earth–Mars range and one-way light-time calculations | A cached calculation series, with disclosed conversion to game time. Not cargo-flight time. |
| NASA DONKI | Dated solar-event catalogue with instruments, IDs and source links | Earth observations are not Mars-dose measurements/forecasts. Scenario timing and damage remain designed gameplay. |
| NASA global Mars imagery | World map appearance | Close-up textures, rocks, buildings and characters are authored artwork. |

SWIM, RadLab and OSDR are not integrated or claimed as measured game inputs.

## Playability and scope

Resource quantities, production, consumption, construction, shelter capacity, crew, Appeal, Fame, immigration and mission stories remain authored game rules. Their numbers are not represented as NASA measurements. The water processor now supplies4 game units per powered day on any eligible tile instead of depending on fabricated ice deposits (6 when upgraded). Recycling is separately accounted for. This retains a playable economy.

Legacy resource rewards already spent in saved colonies are not retroactively reconstructed; the old ledger is retained only for validation compatibility and is not displayed or rewarded again. Old radiation-award entries are removed once. Imported data does not make the whole colony simulation a validated astronaut survival model or establish competition eligibility.

## Verification

- Broad engine simulation:4,999 assertions, including36 Blackout policies, four Junior sites, save/load and management.
- Boundary/save simulation:13,456 assertions across192 missions.
- Commander:24 campaigns;12 careful-policy wins,12 expected neglect losses, zero timeouts.
- Campaign rules:15,026 assertions. Multiplayer:36 server +151 client checks.
- Terrain:2,425 movement checks +320 actual GLB surface samples.
- Individual scan lifecycle, Three.js raycasts, collision/range/visibility/cancellation:91 checks; MOLA record rules874; saves128; terrain record comparison147; source record provenance48; dataset boundaries27; survey tool22.
- Local browser: immediate Blackout entry without film/account; visible Build and bottom time controls; both MOLA records render, Walk tool shows no radiation number, no console errors during these flows.
- Production deploy verification recorded in the release response.
