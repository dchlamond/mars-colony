# Student-selected presentation release

David relayed the students' final selection on 15 November 2026:

- Welcome 1: Cinematic Expedition.
- Equipment 2: Field Scientist.
- Film 6: Two Futures, with Hades English voice and Modern Standard Arabic subtitles.

## Asset provenance

- `game/assets/selected/cinematic-expedition.png`: unchanged original selected artwork from `Video Intros/03 Interface Options/01-cinematic-expedition.png`.
- `game/assets/selected/field-scientist.png`: built-in OpenAI image-generation edit of `Video Intros/06 Equipment/02-field-scientist.png`. Transparent cutout, no Mars backdrop, blank display. Live index and condition are supplied by `surface-survey.js`, which preserves the audited scientific teaching model.
- `game/assets/intro/two-futures-hades-ar.mp4`: Film 6's existing Grok sequence and actual gameplay captures, retimed with `tools/build_selected_film.py`. Hades source is `Video Intros/04 Audio/03-Hades-master-intro.mp3`. The selected instrument and welcome replace the earlier alternative concepts in the film.
- `arabic-captions.json`: 43 Modern Standard Arabic captions, aligned to the existing Hades timing transcript. SRT and VTT are shipped with the MP4.

The equipment implementation is a 2.5D transparent view model to preserve the students' selected visual appearance. It does not replace the world terrain, character rigs, or other Blender assets. The previous Blender dosimeter source is retained for possible future full-3D authoring; it is no longer drawn in first person.

## Image edit prompt

Edit target: the supplied selected Field Scientist game artwork. Produce a production-ready first-person equipment sprite on genuine transparent background. Extract ONLY the complete gloved astronaut hand, wrist, sleeve and handheld field instrument from this image; remove ALL Mars scenery. Preserve this exact premium realistic design, tan woven fabric seams, anatomically correct five-finger grip (one thumb left and four curled fingers right), dark graphite chamfered housing, silver edge reinforcement, blue lower button and three small round silver controls. NO GOLD. Reframe tightly in a portrait canvas, full device and full hand with sleeve exiting bottom edge. Keep the device upright, its face looking straight at camera (screen rectangle horizontal/vertical), minimal perspective. Important functional edit: erase ALL lettering and numbers from the screen and leave a flat clean unlit dark charcoal rectangular screen inside the existing bezel, as live game data will be composited onto it. No text anywhere. Preserve very high detailed photoreal materials and restrained warm illumination. Transparent outside the silhouette, including all gaps. Do not add any new fingers, accessories or ground shadows.

## Runtime behavior

- Begin mission plays the selected film once per tab session. Skip, Escape, or natural completion continues into the selected game mode with the entered colony name/code.
- Continue saved mission bypasses the film. The introduction can be replayed from the welcome screen or mission settings.
- The optional 19.6 MB film is fetched only when played. No login, external voice service, or generation API is needed by players.
- A media error never disables Skip. The offline HTML embeds both selected artwork assets and starts gameplay directly; optional film replay requires a connection.
- Existing English game UI is retained. The requested localization applies to narration subtitles; the spoken voice remains Hades in English.
