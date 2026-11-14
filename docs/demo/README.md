# E2 — actual-game project demo

The finished [28.96-second MP4](../../game/demo/blackout-demo.mp4) is 1920×1080,
H.264, 25 fps, 2,558,489 bytes, and has no audio. The [public viewer](../../game/demo/index.html)
includes controls, burned-in English captions, optional WebVTT captions and a text
transcript. Its public path is `/demo/` when the `game` folder is deployed.

The official 2026 Space Apps submission guide permits a video of **30 seconds or
less**, hosted with public access. This file meets that technical duration limit.
It does not establish registration, challenge selection, team eligibility, or
submission status. Confirm those separately before submitting the public link.

## Shot list

| Time | Actual game state shown | Editorial caption |
| --- | --- | --- |
| 0–3 s | Day 1, prediction choices | Predict what will keep six crew safe. |
| 3–7 s | Finite preparation budget and real costs | Battery, solar alignment, or saved Parts. |
| 7–11 s | Day 4, radio quiet period and dust | Radio delay and dust affect different systems. |
| 11–15 s | Day 9 battery outcome | Actual reserves; first result preserved. |
| 15–21 s | Two computed outcomes side by side | Same starting colony and events, one preparation changed. |
| 21–25 s | Expanded NASA/JPL light-time evidence | Recorded evidence and model limits. |
| 25–28.96 s | Completed explanation, transfer and record export | Predict, observe, compare, explain. |

The browser actually completed code `DRB1-20261114-0` through visible controls.
The first plan built a battery and finished with six crew, 12 Food and 11.35 stored
power. The alternate solar-alignment run used the same start, events, ending day
and later requested actions, and ended with a recoverable food shortage and no
stored power. The real comparison records no rejected replay actions. The
downloaded [anonymous record](captured-learning-record.json) is included.

## Reproduce and identify the capture

Run from the repository root with the playable game served at
`http://127.0.0.1:8765/`:

```sh
node tools/capture-blackout-demo.cjs
```

`GAME_URL` can override the URL. The tool uses Playwright's installed Chrome and
`/opt/homebrew/bin/ffmpeg`. It does not change game state through script: all
progression uses buttons; state is read only for assertions. It records the real
browser video, trims seven holds and adds an editorial footer outside the intact
game frame. The raw video and temporary encodes stay in
`../overnight/evidence/demo/`, outside the repository.

The [full capture manifest](capture-manifest.json) records the exact capture time,
base commit, runtime SHA-256 hashes, actions, outcomes, source state, and media
probe. This was the uncommitted integrated overnight candidate on base commit
`02067acca56cb549af148d51c8d0474bcf04ad3a`, not a claim that the old commit alone
contains the demonstrated game. No captured runtime file changed during the run.
The [public compact manifest](../../game/demo/manifest.json) preserves provenance.

### Review against the final integrated runtime

The capture remains the actual candidate recorded at
**2026-11-14T17:09:27.892Z**; its original hashes have not been replaced with
release hashes. Subsequent changes add malformed-history validation/filtering
with a warning, clarify that the compressed message clock advances only while
the link is usable, add the teacher-kit button, and refine loading/fallback status
and recovery-audio feedback.

The systems owner reproduced the exact captured `blackout.js` SHA-256 by undoing
only the history-validation and source-wording changes in memory. Causal-answer
acceptance and failed-storage first-attempt protection were already captured.
`junior.js` and `mission-systems.js` still match their captured hashes, and the
captured canonical battery outcomes match the final systems matrix. No mission
rules, resource rates, event schedule, replay behaviour or displayed numerical
outcomes changed after capture. The video remains representative of gameplay;
its source-panel sentence predates the wording clarification.

## Credits and disclosures

- Original game, UI and Blender-built structures from this project; implementation
  and video capture/editing were assisted by Codex. Original rigid articulated
  astronaut models appear in the real renderer.
- Existing credited Grok-generated Mars terrain art is visible. The game's
  **Includes AI-generated artwork** watermark remains intact in every shot. An
  additional editorial disclosure is burned into the video footer. The file's
  metadata also records AI assistance and generated-art presence.
- Captions use the project's bundled Barlow Condensed font. See the repository
  [NOTICE](../../NOTICE) and [AI_USE.md](../../AI_USE.md) for the complete asset
  and software notices.
- NASA/JPL Horizons light time, NASA solar-conjunction evidence and NASA MOLA map
  data are described in the actual game. They are distinct from game costs,
  compressed time, resource units and simulated exposure indices. See the viewer
  for direct source links and [data decisions](../../research/DATA-AND-DECISIONS.md).
- No added NASA logos, mission insignia, footage of real people, child likenesses,
  narration or music. The render contains fictional fully suited adult crew.

## Verification

- Actual-control run reached complete; prediction, finite-budget choice, field
  observations, radio request, day advancement, comparison, explanation and
  transfer all executed through the UI. The real record export downloaded.
- No uncaught browser errors or failed required assets in the capture.
- Both computed futures share starting state, outside events and ending day.
- `ffprobe`: 28.96 seconds, H.264 1920×1080 at 25 fps. Complete decode to null
  succeeded without errors.
- The public `/demo/` viewer loaded the MP4 in Chrome, reported 28.96 seconds,
  exposed native playback controls and had no horizontal overflow at 1440×1000.
- Seven representative encoded frames were extracted and visually reviewed in
  `../overnight/evidence/demo/contact-sheet.png`; each corresponds to the intended
  shot and retains the game watermark. Source screenshots are alongside this file.
- This is automated operation evidence, not a child usability study, proof of
  learning outcomes, or a school-device performance benchmark.
