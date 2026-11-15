# Students' selected presentation release

## Scope and result

Integrates welcome 1 (Cinematic Expedition), equipment 2 (Field Scientist), and film 6 (Two Futures) with Hades English narration and Modern Standard Arabic subtitles. Gameplay rules remain on the audited `d101b1a` baseline.

The welcome retains actual mission selection, colony name, mission code, landing-site controls and validated Continue. Begin plays the film once per tab session, with Skip and Escape available. Natural completion or Skip starts the selected mission exactly once. Continue bypasses the film. Settings and the welcome can replay it. Film failure leaves gameplay available.

The selected detailed hand is a transparent 2.5D view model with live readings, condition labels, movement and scan feedback. Existing survey gating, educational explanations and recorded observations are preserved. This release does not claim a newly rigged 3D hand or replace the world assets.

## Media validation

- Hades source: the preserved Inworld recording `03-Hades-master-intro.mp3`, 125.592 seconds.
- Final video: H.264 / AAC, 1280x720, approximately 125.584 seconds, 19,622,671 bytes. Full FFmpeg decode completed without errors.
- 43 Modern Standard Arabic subtitle cues use the Hades transcript's timings. Captions replace the English narration subtitles and are burned into the video. Editable SRT/VTT files are included.
- Sampled caption frames confirm connected Arabic glyphs, right-to-left order, wrapping and visible contrast. No native-speaker editorial review is claimed.
- The selected instrument and current welcome replace the earlier alternatives at their corresponding film beats. Existing cinematic footage, actual game evidence captures and original score/effects are reused.
- Film downloads only when played. The offline HTML embeds selected artwork and preserves direct play; its optional film requires internet access.

## Automated checks

- `npm run test:audit`: 4,992 existing engine assertions; 13,456 boundary assertions over 192 Blackout missions; 2,425 movement assertions and 320 shipped-terrain positions. Passed.
- Existing scenario coverage includes 36 Blackout policies and four Junior campaigns.
- `npm run test:selected`: 41 new lifecycle checks. Covers normal completion, Skip, Escape, stale duplicate events, return focus, simulation pause/restore, storage denial, media failure and offline direct entry.
- JavaScript syntax, `git diff --check`, and offline bundle build passed. Offline bundle is 51,671,180 bytes at initial selected-release build; subsequent code changes can slightly change this size.
- Commander policy probes remain 1 win / 24 campaigns, with 23 timeouts. This presentation release does not change that known balance limitation.

## Browser checks

- Desktop welcome at 1512x771: selected art visible; full entry controls fit without scrolling after layout correction.
- Phone at 390x844: no horizontal overflow, sticky entry controls, scrollable form, selected tool visible and live.
- Landscape at 844x390: film and return/skip controls fit, no horizontal overflow.
- Film playback verified at full readiness with time advancing, Arabic captions visible, sound enabled, and completion returning to the welcome screen.
- Skip starts Blackout. Walk/Back, live index display and the existing prediction-before-recording rule were exercised.
- Audit identified and corrected a native video header inheriting fixed game-header styles, an equipment readout clipping at smaller sizes, and a name/code alignment mismatch.

## Artifacts

- `game/assets/intro/two-futures-hades-ar.mp4`
- `game/assets/intro/two-futures-hades-ar.srt` and `.vtt`
- `game/assets/selected/cinematic-expedition.png`
- `game/assets/selected/field-scientist.png`
- `art/selected/README.md`: provenance and image-generation prompt.
- `../Video Intros/08 Selected Release/`: student-accessible film, caption files and manifest.
- `dist/verification/selected-*`: local audit log, sampled subtitle frames and browser screenshots.

## Release verification

The Git commit, public deployment receipt and exact deployed file hashes are recorded after publication in `dist/verification/selected-deployment.json` and the append-only Obsidian session note. Use https://mars-colony-tau.vercel.app/ for public play without signing in.
