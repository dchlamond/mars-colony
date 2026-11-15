# Gameplay and navigation audit — 15 November 2026

The existing game is ready for a focused student playtest through **Blackout**, with **Junior** as the longer follow-up. This audit does not certify every device or claim there are no remaining bugs. The new cinematic UI, video intros and replacement equipment artwork were deliberately excluded.

Public player link: https://mars-colony-tau.vercel.app/

## Fixed in this release

| Finding | Fix and verification |
|---|---|
| Continue was enabled with no saved mission. Clicking it dismissed the welcome screen into the background Junior state. | Inspect and validate the save before offering Continue. Explain absent, damaged or unavailable storage. A failed load keeps the briefing open. Reproduced on production and checked in the patched browser. |
| Changing graphics quality could discard progress, including without confirmation in the first three days. | Confirm, save, restart, and restore the same mission automatically. Abort the restart on storage failure. Browser check restored day two, its battery construction and the pending Earth-reply countdown. |
| “Save, then choose mission” proceeded even when saving failed. | Failed actions can now retain their modal; this action opens the mission chooser only after a successful save. Storage quota and rejection tests preserve the previous save and current state. |
| Valid JSON such as `null` could crash accessibility-preference initialization. | Accept only an object containing valid boolean settings and known text sizes. Corrupt and wrong-type fixtures recover to defaults. |
| Escape from Walk also reached the map-level handler and hid the mission panel. | Consume the Walk exit key once. A weather panel gets first priority; closing it keeps the player in Walk. Both paths checked through browser controls. |
| Keyboard focus could leave the active briefing and reach background controls. | Named dialog heading and a visible-control Tab/Shift-Tab loop. Checked the welcome screen's boundary with the keyboard. |
| Settings described Blackout as the longer Junior campaign. | Show the correct six-crew, nine-day, two-futures rules summary. |

## Simulation evidence

Run `npm run test:audit` from the repository. It executes the **shipped JavaScript engine** in Node with presentation/DOM/timer stubs; it does not substitute another resource or progression model. This separates fast simulation checks from actual browser interaction tests.

- Existing engine suites: **4,992 assertions** covering 36 Blackout policy runs, four complete Junior campaigns, persistence/version validation, source-based boosts, Fame and Commander systems.
- Additional boundary suite: **192 Blackout missions / 13,456 assertions** across 16 additional seeds, four sites and three preparation policies. Includes exact save/reload during a pending radio reply, finite nonnegative stocks, exclusive crew assignments, invalid saves, denied storage, and malformed preferences. All battery and maintained-alignment policies succeeded. Some unprepared routes intentionally reached setbacks; those are not test failures.
- Terrain/movement: **2,425 assertions**, plus ray tests at **320 positions** in the actual high- and low-detail GLBs. Maximum height mismatch was about 0.0000023 game units. Traversed more than three longitude widths, checked spawn clearance, polar-edge messaging and reversing away from the edge. No sampled holes, seam teleports or below-surface movement were found.
- Commander balance probe: **24 campaigns** across three difficulties and four sites, using the existing greedy and maintenance bots. **One win, 23 reaching the 1,000-day test limit.** These limited bots do not prove human difficulty, but the result is a clear reason to keep Commander out of the first judge walkthrough and to give it a dedicated balance pass.

Machine-readable results are in `dist/verification/audit-*.json`. The test command records results locally; `dist` is generated and ignored by Git.

## Real browser checks

Chrome, through visible buttons and keyboard input:

- Public production page opened directly without an account gate.
- Fresh patched welcome, unavailable Continue, keyboard containment.
- Complete battery route: predict → prepare → both field readings → shelter → request advice → day nine → alternate replay → explanation → transfer → completed learning record.
- Downloaded and parsed the real exported record (`dead-reckoning-learning-record`, shared mission code `DRB1-20261114-0`).
- Graphics save/restart/restore during day two, then completion of that same mission.
- Walk entry, movement, Escape, Back to map, and nested Space weather close.
- Systems and Explore navigation at 390×844 and 844×390. No horizontal overflow in the inspected states; panels and first-person exit remained inside the viewport.
- No captured browser warnings/errors during the patched local playthrough.

Local completion screenshot: `dist/verification/audit-complete-local.png`.

The offline HTML backup was rebuilt. Browser security policy rejected opening its `file:` URL, so **the rebuilt offline artifact was not browser-retested in this audit**. This does not block the public HTTPS game.

## Production-readiness scope

| Area | Status | Evidence / remaining work |
|---|---|---|
| Anonymous access | Verified for public alias | No player account, credentials or payment flow. Use the public player link, not a protected Vercel preview URL. |
| Authentication/session tokens | Not applicable | Game has no account sessions; local storage contains mission/preferences only. |
| Inputs and local saves | Tested | Mission code validation, escaped colony names, save schema/version rejection, rollback and quota/denied-storage cases. |
| Server APIs, rate limits, CORS, database, payments, uploads, mail/jobs | Not applicable | Static game; no application backend, player uploads or billing. Optional NASA refresh is separate from the embedded playable scenario. |
| Asset/error recovery | Partial | Existing model status/fallback reporting and WebGL-unavailable message; no observed asset/runtime failure on the tested browser. Exhaustive GPU/context-loss coverage remains. |
| Security headers / client secrets | Present / inspected | Existing CSP, referrer and permissions headers; no new keys, analytics or tracking introduced. This is not a penetration test. |
| Observability | Partial | Browser error checks and reproducible local reports. No student telemetry added. A static health URL is the public page itself. |
| Maintainability | Partial | New repeatable rules/geometry audit command. Existing engine remains JavaScript with shared mutable state; broader modularization/type-checking is future work, not an overnight rewrite. |

## Recommendations, in priority order

1. **Judge route:** open Blackout and let a judge make the first prediction. Show the preparation cost, weather consequences, two-futures comparison and evidence card. It is a bounded, verified demonstration.
2. **Student pilot:** observe three to five students without prompting for the first few minutes. Record where they hesitate, whether they understand Next day, and whether they can explain the different outcomes. Software simulation cannot measure those things.
3. **Test the actual classroom machines:** one Chromebook/Windows laptop and one iPad/Safari run, especially touch movement, readable text, GPU performance and export behavior. This audit used desktop Chrome with responsive viewport tests, not a device lab.
4. **Commander balance:** improve the policy probes and measure novice time-to-first-success before changing resource numbers. Current bots often fail to reach independence; avoid presenting this as the seven-year-old starting experience.
5. **Next UX work:** consider a separate recoverable autosave slot for accidental refreshes, preserving the existing explicit save. Keep “Begin mission” prominent and put optional settings behind the first action.
6. **After media integration:** rerun this audit, then additionally test loading on slow school Wi-Fi, skipped/blocked video autoplay, narration mute/captions, and the return from intro to the same mission. Those media are not part of this release.

Student testing can begin with the current Blackout/Junior build. Remaining device and human-learning checks are explicit; a universal bug-free guarantee would not be justified.
