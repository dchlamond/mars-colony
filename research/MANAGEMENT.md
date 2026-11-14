# Crew, maintenance and rival development · November 14, 2026

This release makes operating methods, people and geography affect the same economy. The core victory condition, building costs, base yields and existing emergency crates are unchanged. New rules below are fictional teaching models.

## Decisions and exact rule changes

| Decision | Benefit | Cost or dependency |
|---|---|---|
| Economy production | 70% power use and 60% wear | 70% output |
| Steady production | Original output and power | Normal wear |
| Intensive production | 120% output | 130% power and 240% wear; may shed another machine's load |
| Repair | Restore condition to 100% | 2 parts, 1 metal, assigned crew, machine offline once work starts |
| Crop research | Matching skill: +8% yield per level; others +3%; colony cap +40% | One person leaves operating/building pool |
| Power tuning | Matching skill: −5% consumption per level; others −2%; colony cap −20% | One person leaves operating/building pool |
| Skill training | +1 skill level, maximum 3 | 12 active sols away from colony work; changing duties loses unfinished training |
| Inter-colony trade | Receive 3 parts | Give 6 metal; rival loses those parts and gains that metal; 30-sol cooldown and finite storage |

Machinery wears 0.10 condition per productive sol at Steady; passive solar/battery equipment wears 0.05. Nothing loses output until condition is below 70%. Below that, output is `0.5 + condition / 140`; at zero it stops. Idle, unpowered, upgrading and repairing industrial machines do not accumulate production wear. Cleanliness remains a separate solar multiplier.

Repair workload is `6 + max(0, hex distance from lander - 1) + min(4, ceil(abs(height difference in km)))`. The input heights are from the existing [NASA MOLA dataset](https://pds-geosciences.wustl.edu/missions/mgs/mola.html). The formula is invented: **not** an engineering estimate of walking or repair time. Science compares this workload before construction. One matching engineer supplies `1 + 0.5 × skill level` work/sol; another skill supplies 1. Queued machines operate until work starts. Started repairs stay offline if the crew is reassigned; cancellation resumes the old condition. Only unstarted jobs refund materials. Upgrades cannot overlap repairs. Battery repair can discard charge above the remaining capacity.

Six fictional named founders begin in general colony work, with one of engineering/growing/power skills at level 1. Departures reduce the founder roster permanently once the population falls below the remaining founders. Newcomers join the anonymous general pool. This is aggregate crew accounting, not individual passenger identity tracking. A specialist cannot also be counted as an operator or builder. Shelter pauses specialist tasks; rover absence reduces the available pool. If too many specialists are assigned, earlier roster entries receive the available crew slots first.

Rivals receive 18 parts and 12 metal as their initial development budget, then 8 parts and 3 metal every 30 sols outside blackout. Mines provide 0.25 metal/sol. Budgets cap at 60. Each builds six facilities in its declared sequence, at the player's base construction costs and work requirements; construction uses 1–3 work/sol based on population and pauses during storms. Completed facilities add up to 12 recruitment appeal, feeding the actual shuttle split. Trade requires room for all 6 metal, available rival parts, and no active storm. Their air/food/power systems are not simulated. Buildings are rendered in their territory and serialized as plain records.

## Scientific boundary and learning loop

[NASA's maintenance scheduling account](https://www.nasa.gov/general/establishing-a-maintenance-timeline-in-space-featuring-chase-lynch/) motivates finite crew work and offline machinery. No NASA measurement supplies the repair/condition/bonus numbers. MOLA supplies heights; JPL Horizons continues to supply dated communication light times. The existing ice map still uses a latitude model, not measured deposits.

Players compare an operating forecast, spend scarce resources, observe net production and later condition, and decide whether growth can wait. A high-output site may require more service work. A power specialist can keep machines running but delay a building. A trade can fund an emergency repair while changing a rival's next construction. These are connected decisions with visible outcomes, not extra quiz rewards.

## Validation scope

See `tests/colony-systems.cjs` for causal checks of economy, repair lifecycle, forecast isolation, skill progression, shelter, workforce accounting, old/new saves, trade conservation, rival construction and real passenger competition, plus UI confirmations and narrow-screen fit. Existing evidence-project and viewport suites remain required. Long campaign results and learner testing are reported separately; do not infer educational efficacy or whole-game balance from unit and browser checks.

### Recorded checks
- 40 focused simulation assertions passed, plus UI method/repair/duty confirmations and mobile overflow check, with no page errors.
- Existing 10-check save/build/Walk suite, 29-check evidence suite and five viewport/crew checks passed; offline copy loaded four models.
- Long campaigns: old bots ignore maintenance and won 0/60 within 650 sols, compared with the previous release's 2/60. A paired repair-aware comparison won Explorer/Arcadia at sol 614 (1/12 maintained versus 0/12 unmaintained, limit 1,000 sols). This shows a viable path and a consequence of neglect, not adequate overall balance. See management-balance.json and management-campaigns.json. The `recentRepairCompletions` metric counts retained log entries, not lifetime repairs.
- Existing shelter-project scenario outcomes unchanged: 4/4 Explorer, 4/4 Commander, 0/4 Veteran. No child usability or learning study has been performed.
