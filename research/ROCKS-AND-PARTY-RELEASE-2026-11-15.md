# Individual rock discoveries and separate party colonies

## Multiplayer

- Every party member gets a stable landing sector and their own lander, buildings, inventory, crew, and discovery ledger. Joining uses a fresh Commander colony; leaving restores the previous solo mission.
- Classmates replace computer-controlled rivals. Their colony names, crew counts and territory appear on the map; the leaderboard uses live room reports. Remote building layouts are not synchronized.
- The host controls the shared clock. Arrival waves share the existing appeal/fame distribution. One player's construction or scanning does not spend or award another player's supplies.
- Reload recovery preserves the player's colony and sector. Leaving invalidates pending requests so a late response cannot overwrite the restored solo mission. Expired rooms preserve the local colony paused and remove remote colonies.
- Room service version 2 has been deployed. Existing temporary rooms need to be recreated; refresh all clients before creating the next party.

## Walk on Mars

- Aim at an individual visible rock and press F or tap Scan. Contents stay unknown until the scan completes. Looking away, leaving range, walking away, hiding the tab, or leaving Walk cancels the scan.
- Individual rocks yield 3 Parts, 5 Water, or 5 Air once per mission. Stable rock identities survive save/load, quality changes, construction, walking across terrain windows, and map wrapping.
- Air comes from a fictional sealed expedition cartridge inside a hollow rock. These are explicitly labeled game rewards, with NASA evidence alongside the relevant science; they are not measured compositions of the rendered rocks.
- Blackout records discoveries without supply rewards so the matched two-futures experiment remains comparable.
- Visible airborne rust-colored dust particles now cross the sky and foreground. Reduced motion stops animation. Authored rocks remain grounded regardless of asset loading order.

## Validation

- Individual scan lifecycle and real Three.js ray intersections: 91 assertions.
- Deterministic rewards and one-time collection: 682 assertions.
- Save/load and malformed ledger rejection: 119 assertions.
- Stable nearby-rock placement: 1,799 assertions; stable fragment placement: 235 assertions.
- Grounding tests passed for authored assets with both loading orders; no hovering or fully buried samples.
- Core simulations: 4,992 assertions. Selected intro/UI lifecycle: 41 assertions.
- Room client: 151 assertions; room server: 36 assertions; campaign rules: 15,016 assertions. These cover distinct stable sectors, independent supplies/buildings, host ownership, stale requests, reload, leaving, room expiry, immigration and balance.
- A connected player must leave the room before starting a different mission. Host transfer refreshes the open dialog's controls immediately, without reopening it.
- Real browser test: two players joined the same live room backend in sectors 1 and 2. Host built a solar panel and went from 36 to 30 Parts; guest retained 36 Parts and only a landing pod. Host reload preserved its sector and construction. Guest time controls stayed disabled. Both players left and restored their solo colonies. No console errors observed.
- Real browser rock test: one aimed rock awarded 3 Parts, rescanning awarded nothing, and another rock awarded 5 Water. Dust, suited astronauts and scanning animation were visible.

The game remains a classroom competition using client-calculated colony statistics, not a ranked anti-cheat service. Rooms are temporary and expire after four hours or a service restart.
