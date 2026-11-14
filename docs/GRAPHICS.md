# Plan for better graphics, and how to share image files

## How teammates share files

1. One shared Google Drive folder called `Mars Colony art`, with three subfolders: `models`, `textures`, `screens`.
2. Each file gets a matching line in a shared sheet or note: file name, where it came from (link), and its licence.
   A file with no source and licence cannot go in the game. The rules require every outside item to be cited.
3. David tells Claude a batch is ready. Claude copies the files into `game/assets/art/`, adds them to `NOTICE`
   and the Credits screen, and deploys.

Do not send art through chat apps. They shrink images and lose the file names.

## What to send

| Kind | Format | Size limit | Notes |
|---|---|---|---|
| 3D building or vehicle | `.glb` | 3 MB each | Name it after the building: `solar.glb`, `greenhouse.glb`, `habitat.glb`, `mine.glb`, `battery.glb`, `dome.glb`, `reactor.glb`, `ice.glb`, `shield.glb`. |
| Ground or material texture | `.jpg` or `.webp` | 2048 px, 1 MB | Must tile. |
| Icons | `.svg` | | One stroke weight, 24 px grid. |
| Screenshots for the project page | `.png` or `.jpg` | 10 MB (page limit) | |

## Allowed sources

- Public domain or an OSI licence only (CC0, MIT, Apache-2.0). The design document already lists free CC0 kits.
- NASA material is allowed, with every logo, flag and mission patch removed. `tools/strip_logos.py` does this.
- No art from any commercial game. No paid marketplace packs. No real people.
- AI-generated pictures must carry a visible watermark that says so. Prefer real captures of the running game.

## Order of work

1. **Buildings.** Eight buildings are plain shapes next to four detailed NASA models. Replace the eight first.
   The loader already swaps a plain shape for a model when one is present, so this needs no change to game rules.
2. **Ground close up.** Sharper Mars Trek tiles near the four landing sites, with the game-drawn sand layer elsewhere.
3. **Map dressing.** Chart frame, latitude and longitude ticks, relief shading from the MOLA height grid.
4. **Walk mode.** Sky gradient, distant haze, astronaut crew that move.

## Budget

The whole game is about 20 MB today. Keep new art under 12 MB in total so the site still loads on school networks.
Low graphics mode must keep working: every model needs to look acceptable without shadows.
