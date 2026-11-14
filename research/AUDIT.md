# Audit checkpoint · strategy shell · 14 November 2026

This is a first playable slice, not completion of the attached brief. No production deployment or submission performed.

## Fixed
- S2: queued building selection cancelled work without confirmation. It now opens a detail panel with explicit refund/cancel action.
- S2: placement feedback was too easy to miss. Placement now immediately syncs the scene and shows a persistent queue, progress and toast; rejected placement explains why.
- S2: exiting Walk mode restarted a paused game. Pause now survives returning to the map; entering Walk starts Play, as disclosed.
- S1 discovered during implementation: THREE scene objects made saving recurse. Explicitly excludes scene objects, restores tile/build links, saves random generator state and reactor technology cost.
- Initial global variable collision in the interface module fixed by encapsulating its state.

## Verified
Chrome automation: ten assertions cover paused start, successful placement and cost, immediate mesh, duplicate refusal, non-destructive selection, save restoration, tile links, restored pause, Walk time and pause preservation. Web and file:// builds load. Offline file loads all four NASA models. No JavaScript page errors. 390px document has no horizontal overflow. Software WebGL produces readback performance warnings; this is not a hardware performance benchmark. Screenshot evidence is in this directory.

## Balance
60 exploratory scenarios: three difficulties × four sites × five policies, one seed each. No wins. See balance.json for sols, populations, imports, radiation returns and result for each run. These initial bots are not validated substitutes for skilled humans; do not compare them directly to the earlier 9/9 human-designed strategy. No balance constants changed. Before/after win-rate comparison remains outstanding.

## Still open
- S1/S2 full simulation audit and all-event interaction tests are incomplete.
- Save validation needs deeper corrupt-file and version-migration coverage.
- True 25-colony command architecture, networking-free deterministic model extraction, full maintenance and communications changes remain undone.
- New buildings require a separate CO2 model and balance validation; a purifier must not generate oxygen.
- Mobile controls need hands-on usability testing; no child playtest claimed.
- Photo capture is a PNG download, not yet a persistent album with objectives, helmet option or copy fallback.
- Nested tooltips, map-based setup, extended flags, playable rover, council actors, dilemma expansion, storm staffing, title/pause redesign and two-minute demo remain outstanding.
- Settings are session-only. Reduced motion currently affects interface/suit transitions, not all scene animation.
- Full current event guide review was blocked by website fetch failures.

## Ten weakest areas, self-review
1. New rules lack validated winning bot strategies.
2. Original simulation remains coupled to UI.
3. Phone panel can obscure map (added Close panel).
4. Placement feedback (fixed with queue and notice).
5. Clicking construction cancels (fixed with detail panel).
6. Walk loses pause (fixed).
7. No safe save (implemented and tested).
8. Small map controls remain.
9. Council has only Rova, not six skilled founders.
10. Unvalidated science claims in original facts still need the requested full review.

## Evidence and consequences revision · 14 November 2026

The previous production-status paragraph is historical: the shell and viewport/crew fixes are deployed. This section describes the next tested slice; deployment is verified separately in the session checkpoint.

- Added three optional council projects with explicit stakes, three-sol operational evidence, transmission, acknowledgement, one-time rewards, cancellation confirmation and deadlines.
- Saved NASA/JPL ephemeris now determines evidence transit time. The 833-row parser validates dates, schema, range and light-time consistency. Cached data works offline; no new third-party runtime request.
- Site comparison forecasts run on copied building records so browsing the evidence cannot alter staffing, power or resources in the real simulation. The same build command places the chosen building.
- Corrected Earth DONKI observations being presented without a clear fictional-Mars-scenario boundary. The Mars RAD record is distinguished. No dose model added.
- Fixed panel scroll carrying over when changing sections. The previous viewport, crew, 10-sol shuttle and top return-button fixes remain.

### Verification
29 boundary assertions plus browser actions cover dataset-driven timing, one bond, duplicate refusal, three consecutive sols, streak reset, exactly-once rewards/failure, deadline expiry, rival bonus affecting a real 2-seat allocation, blackout hold/resume, unaffordable orders, end-state refusal, forecast isolation and old/current save restoration. A real comparison-panel click places a building. Mobile and standalone offline loading pass without page errors. Existing ten-check gameplay regression and five-viewport crew tests pass.

Shelter-project scripted playthroughs use real construction costs/unlocks, normal ticks, supply requests and closed immigration; they do not inject resource supplies or completed buildings. One seed per site, early-game project only:

| Difficulty | Project confirmed | Confirmation sols | Full campaign tested by this policy? |
|---|---:|---|---|
| Explorer | 4/4 | 38–40 | No |
| Commander | 4/4 | 49 | No |
| Veteran | 0/4 | Deadline missed at 76 | No |

The first test bot stalled on an unavailable shield. Correcting the bot's power/air/unlock priorities is not evidence of a game balance improvement. The shelter promise allows 75 sols, giving a beginner time for both infrastructure and the roughly 21-sol initial radio round trip. Delaying a promise until infrastructure exists is permitted.

The existing exploratory full-campaign suite was rerun (five policies × four sites, one seed):

| Difficulty | Wins | Scenarios |
|---|---:|---:|
| Explorer | 1 | 20 |
| Commander | 1 | 20 |
| Veteran | 0 | 20 |

This is still poor and insufficiently validated whole-game balance. The new projects were not chosen by those old bots, and the changed shuttle pacing is a confounder versus the earlier zero-win run. Do not attribute the 2 wins to educational projects or claim the balance targets are achieved. Full result files are balance.json and project-play.json.

Remaining: full council staffing/skills, maintenance, repeated dilemmas, Mars-target forecast ingestion, rover control, confidence-aware ice maps, child playtests and validated winning strategies. This is a playable increase in depth, not completion of the entire brief. No submission or eligibility claim.
