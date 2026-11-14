# How AI was used in this project

The NASA Space Apps Challenge calls AI tools "Super Intelligence (SI)" and asks teams to say how they were used.

**The idea and the design of this game are the team's own.** The team chose the challenge, the concept, the audience,
the rules of the game and what it should teach. AI tools were used to speed up the building.

## What was generated, and with which tool

| What | Tool | Notes |
|---|---|---|
| Game code (`game/index.html`) | Claude (Anthropic) | Written from the team's design document and directed by the team in review rounds. |
| Lesson text, Mission Control problems, fact card wording | Claude (Anthropic) | Drafted from the team's design. Facts carry source links to NASA and partner pages. |
| Helper scripts (`tools/`) | Claude (Anthropic) | |
| Project documents (`README.md`, `docs/`, this file) | Claude (Anthropic) | |
| Building shapes that are not NASA models | Claude (Anthropic) | Simple shapes drawn in code. |

[Add other tools, such as Gemini for video.]

## What was not generated

- The Mars image, the height data, the storm records and the four detailed 3D models are NASA material. See `NOTICE`.
- The two fonts and the 3D library are open-source work by other people. See `NOTICE`.

## Marks inside the project

- Every code file starts with a comment that says it was generated with AI.
- The page carries a `generator` note in its head.
- The game's Credits screen states how AI was used.
- No generated image or video is used in the game. If one is added later, it must carry a visible watermark.
- No NASA logo, flag or mission identifier is used. The ones on the NASA models were painted over.
