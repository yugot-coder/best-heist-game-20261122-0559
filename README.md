# best-heist-game-20261122-0559

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/yugot-coder/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/yugot-coder/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

Velvet Vault — The Meridian Heist is an original top-down stealth heist game: one thief, three rooms, one night. Cross the museum gallery to lift the Star Sapphire, crack the vault below for the Meridian Diamond, then grab the Ledger in the counting house and reach the getaway van. Guards patrol with raycast vision cones that walls really block, CCTV cameras sweep the halls, laser grids sting, and the alarm meter rises every time you are seen — hit 100 and the whole museum locks down and hunts you. Tools cost: throw coins to lure guards away, drop smoke to vanish, dash on stamina, sneak through shadow tiles. All art is drawn procedurally on canvas and all sound is synthesized live with WebAudio: footsteps, alert stings, vault clicks, pickup chimes and a low night ambience. No network, no downloaded assets: the whole game is static files under `game/`.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. Move with WASD or the arrow keys, hold Shift to sneak (slow, hard to spot), Space to dash, click to throw a coin and lure a guard, Q for a smoke bomb, hold E at the vault door to crack it, collect every loot piece to open the exit, and reach it unseen. P pauses, M mutes, R restarts after a win.

## How it is built

- `game/index.html` — the page: canvas, module entry, no network requests.
- `game/src/config.js` — tuning constants and the dusk-museum palette.
- `game/src/levels.js` — the three hand-authored rooms: walls, patrols, cameras, lasers, loot, exits.
- `game/src/vision.js` — line of sight, raycast cones, circle-vs-wall collision.
- `game/src/guards.js` — one guard's brain: patrol, suspicion, chase, investigate, return.
- `game/src/cameras.js` — sweeping CCTV cameras and laser grids.
- `game/src/player.js` — the thief: walk, sneak, dash, coins, smoke.
- `game/src/render.js` — one frame: floor, cones, characters, loot, alarm HUD, screens.
- `game/src/shots.js` — deterministic staged scenes for the screenshots.
- `game/src/input.js` — keyboard and mouse.
- `game/src/audio.js` — WebAudio sound effects and ambience, no audio files.
- `game/src/main.js` — the state machine, the alarm, scoring, and the frame loop.
- `main.ts` — the make.fun hand-in program: copies `game/` and `screenshots/` to the output and writes `dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=za0zfbxx&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
