# Commander and classroom expansion

Requested release: keep Build visible, rebalance Commander, make Appeal depend on internal quality of life and Fame on awareness, ten-second arrival countdowns, five time speeds, live private classroom rooms, leaderboard, white/blue interface, escalating environmental survival, and F-to-discover with a NASA evidence ledger. Preserve selected Cinematic Expedition welcome, Field Scientist instrument, Hades / Arabic film, and the nine-day Blackout experiment.

## Implementation sequence
- [x] Restore a separate Build tab in Blackout, retaining Systems and the campaign Build tab. Browser verified.
- [ ] Pure population allocation rules, capacity and awareness caps, QOL explanation and scoreboard.
- [ ] Commander economy/builder balance and five-speed clock; stable save/load.
- [ ] Campaign arrivals and ten-second countdown, visual/audio warnings.
- [ ] Historical environmental scenarios and survival escalation after day 300 in both campaigns.
- [ ] Field discovery interaction and persistent sourced ledger; simple expansion reward.
- [ ] Private classroom room service, shared clock and immigration pool, reconnect and leaderboard.
- [ ] White/blue compact campaign navigation with Build retained.
- [ ] Simulations, browser gameplay and two-client rooms; fix and retest.
- [ ] Commit/push, Vercel deployment, public release verification and Obsidian handoff.

## Science decisions
Use 10 June 2018 (Opportunity, tau approximately 10.8) as the historical extreme-dust reference and 20 May 2024 (Curiosity RAD event dose 8,100 micrograys) as the solar-particle reference. NASA does not establish a colony-age threshold for storms. Keep campaign day 300 as the requested game difficulty threshold; historical observations and game multipliers must be separately identified. Do not present increasing fictional storms as new historical observations.

## Multiplayer scope
Live private rooms for classmates, no account/sign-in. One host controls a shared clock; players manage separate colonies and compete for shared arrivals. Server owns room membership, clock and arrival allocations. Local colony economies report statistics to the server: this is classroom competition, not a cheat-resistant ranked service. Room expiry/disconnection should be recoverable without damaging a single-player save. No chat, emails or student identity collection.

## Verification and release notes
- Simulation: 4,992 core checks; 15,016 campaign allocation/countdown checks; 13,456 boundary checks; 2,425 movement checks; 41 selected-media lifecycle checks; 19 room protocol checks passed.
- 24 Commander policy scenarios: 12 careful-policy wins, 12 careless-policy losses, no timeouts. These are bots, not human difficulty ratings.
- Two browser clients joined one private room, synchronized time, received arrivals, recovered after reload and left to restore solo missions.
- Build is a dedicated visible action in Blackout, Junior and Commander. Blackout construction remains guided by its controlled experiment.
- Left-side Field Scientist hand with survey information above it.
- Public address requested: https://dead-reckoning-blackout.vercel.app/
- Limits: temporary four-hour rooms; server restart clears rooms. Client-calculated economies are for casual classroom competition, not ranked anti-cheat.
