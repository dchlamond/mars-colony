# BLACKOUT — 14 November 2026 release

DEAD RECKONING: BLACKOUT now opens with a complete short mission: predict, prepare a six-person outpost, investigate shelter, request delayed Earth advice, survive the separate communications/dust/radiation exercises, then change one preparation and compare the two simulated outcomes. The longer Junior campaign and Commander remain available.

## What changed

- Versioned mission codes, finite preparation costs, two viable strategies and recoverable consequences. The same engine calculates both futures; original attempt and practice remain separate.
- Anonymous evidence export and printable cards connect prediction, observation, explanation and transfer to NASA sources. Life-support inspection shows actual Air, Water and Power values and stoppage reasons.
- Refined Blender-built service equipment, grounded routes and working crew, state-driven lights/machinery, coherent no-gold interface, quiet local audio, readable text and keyboard/map alternatives.
- Model-loading and fallback feedback, functional Escape exit from first person, safe save validation/migration, exact checkpoint randomness and storage-failure handling.
- Printable teacher/pilot kit, guided judge page, updated submission draft and a finished 28.96-second demonstration captured from real game controls.

The Ares art reference informs world materials, lighting and composition. This is a browser/Blender release with soft shadows and screen-space ambient occlusion, not an Unreal Engine or hardware ray-tracing release. Astronauts use articulated model pivots rather than mocap.

## Automated verification

Counts identify assertions, not people or independent play sessions. The policy matrix contains 36 runs: three seeds (20261114, 812, 901), four landing sites and three policies. Battery and alignment-plus-cleaning complete at all sites. The intentionally poor policy reaches a recoverable food shortage in Arcadia/Hellas; it can still complete in Jezero/Arsia because site conditions differ.

| Check | Observed result |
|---|---|
| Actual-engine scenario/state/policy checks | 4,809 assertions; 36 policy runs; no failures |
| Final offline actual-control play | Four complete routes, 122 checks; desktop, phone, keyboard alignment, setback/retry; comparison/learning/export included; zero HTTP or separate-file requests |
| Final presentation/control regression | 11 loading/fallback checks; 52 checks across desktop and setback/recovery routes with actual audio cues |
| Save compatibility | 35 checks: supported current/legacy state, corrupt/future nonmutation, exact RNG, pending reply, quota protection |
| First-person walking | High 1,553 / Low 1,553 checks; terrain/slope/seam/boundary/collision/entry/exit sampled; no encountered fall-through or browser error |
| Survey and mission systems | 16 / 48 checks, including valid readings, reward caps and actual alignment cost |
| Graphics and living systems | Graphics High 77 / Low 78; living systems High 53 / Low 54, using explicitly labelled prepared fixtures |
| Existing modes | Junior 63, baseline 10, Operations 29, management 40; viewport/crew and five-theme UI checks; legacy offline passed |
| Mutation and exit regressions | Seven checks: unlogged rock-sampling guard and actual Escape exit |

Automated gameplay uses legitimate game actions. Browser playthroughs use visible buttons and keyboard; fixture-based graphics and walking tests are identified separately. Discovered failures were classified and fixed, rather than bypassed with free supplies. The release process also verifies exact public asset hashes and a fresh public mission route after deployment.

Offline artifact: `dist/Mars-Colony.html`, **44,733,024 bytes**, SHA-256 `73c7dc93403f09c58af08f1ee98b6ca9bee63ee39462ca10b20aa31394043e04`. Regenerate with `npm run bundle`; all core assets, source descriptions and teacher materials are embedded. Linked external NASA websites still require internet.

## Available-machine measurement

On the available Apple M5 Mac (24 GB, Chrome 157, native Metal via ANGLE), ten-second foreground samples at 1440×900 showed about 120 requestAnimationFrame callbacks/s in both graphics modes, with 95th-percentile intervals 10.1/10.0 ms. Observed click-to-DOM acknowledgment was 3.3–10.0 ms. This measures local responsiveness on one machine; it is not a GPU presentation trace or proof of sustained classroom-device performance. Most regression tests deliberately use software WebGL.

## Scope and next human checks

The two-futures implementation uses sequential deterministic replay. The habitat inspection is an interactive schematic, the approved alternative to a 3D cutaway. Native Blender MCP was unavailable, so isolated background Blender exports supplied the new assets; the user's open scene was not changed. Existing credited Grok art was reused.

**Child pilot not yet conducted.** The target 8–12-minute guided session, comprehension, enjoyment and learning gains need real observation; automated speed is not a child timing estimate. Use the included teacher/pilot kit and test the actual school devices. Local mission rankings are not tamper-proof. Additional RadLab/OSDR/SWIM datasets and a UE5 port are not included. Source dates, compressed time, game production rates and relative radiation indices remain explicit.

No competition entry was submitted. The team owner must review registration, current requirements and the prepared submission before submitting. See [submission draft](SUBMISSION-DRAFT.md), [teacher kit](teacher-pilot-kit.md), [demo provenance](demo/README.md), [implemented rules](../research/BLACKOUT-RULES.md), [AI assistance](../AI_USE.md) and [credits](../NOTICE).
