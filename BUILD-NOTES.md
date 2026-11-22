# Velvet Vault — The Meridian Heist — Build Notes

- Bounty: `best-heist-game-20261122-0559` ("Make the best heist game"), opened 2026-11-22T05:59Z
- Repo: https://github.com/yugot-coder/best-heist-game-20261122-0559 (created 2026-11-22T06:02:03Z, public)
- Final commit: see git log (HEAD) — SHA tercatat di laporan akhir
- Referral code: za0zfbxx
- Coordinator agent id: cc8ca478-ecd5-4897-9b2f-21bc61b16c78 (no subagents spawned; all code written in this session)

## Game

Top-down stealth heist, canvas 1280x720, procedural art, WebAudio synth, no network, deterministic.
Three levels, $28,800 total loot:
- L1 The Gallery — Star Sapphire $5,000, par 90s
- L2 The Vault — Meridian Diamond $8,000, hold E 2.6s to crack the vault door, par 120s
- L3 The Getaway — The Ledger $6,000, alarm starts at 25, par 120s

Mechanics: guards with raycast vision cones (walls block sight), suspicion 0-1,
patrol/suspicious/chase/investigate/return; CCTV cameras sweeping cones (alarm +16/s while
seen); lasers (+24 alarm, guards investigate); alarm 0-100, decays 1.6/s unseen, lockdown at
100; tools: 3 coins/level (click to throw, lures guards), 2 smoke bombs/level (Q, 4.5s cloud
blocks all vision), dash (Space, stamina), sneak (Shift); score = loot + time bonus
(12/s under par) + ghost bonus 500 - 250 per caught.

Screens: title, briefing, play, leveldone, caught, paused, win. HUD: level/objective, alarm
meter, loot per level, timer, coins/smoke/stamina. `?shot=cover|vault|getaway|win` stages
deterministic screenshot scenes. `window.__heist` exposes read-only state for tests.

## Playtest (Playwright, headless Chromium, real keyboard/mouse input)

- L1 proven winnable in runs 3-10 (LEVELDONE ~18-26s, alarm 0, loot $5,500, score ~6,850).
- L2 vault crack proven in runs 9-10 (bot passed the door waypoint, only possible after the
  2.6s hold-E crack). Diamond collected in run 11.
- **Run 11 (2026-11-22 ~13:51-14:00 WIB): FULL WIN, end to end**
  - L1 LEVELDONE — score 6,772, loot $5,500, 26s, alarm 0
  - L2 LEVELDONE — score 25,422, loot $14,700 (incl. Meridian Diamond $8,000), 123s, alarm 1
  - L3 LEVELDONE then WIN — score 46,863, loot $24,900 (all L3 loot), 54s, alarm 22
  - Final screen 'win', thief at the getaway van. 0 page errors (only favicon 404s), 0 crashes.
- Fixes during playtesting: L1 guard patrol moved off the spawn cone; L2 vault door gap
  widened to 40px; L3 ledger moved off the laser line; cameras made deterministic; BFS
  pathfinding now routes around laser lines; staged screenshots no longer get the thief
  caught before capture; HUD loot now shows the current level's loot (was cumulative).

## Screenshots (screenshots/, all 1280x720 JPEG, each <= 256 KiB, visually verified)

1. `1-cover.jpg` (51,733 B) — cover: thief, guard cones, camera cone, Star Sapphire, alarm meter
2. `2-vault.jpg` (57,416 B) — vault crack in progress, laser, Meridian Diamond, guards, cameras
3. `3-getaway.jpg` (57,905 B) — "THE LEDGER IS YOURS — RUN!", exit open, guard cone, laser
4. `4-win.jpg` (49,205 B) — "THE HEIST IS COMPLETE", score 46,863, loot $24,900 of $28,800

## Hand-in program

- `MAKEFUN_OUTPUT_DIR=out node main.ts` run twice: outputs byte-identical (deterministic).
- `out/dossier.json` 364,426 bytes (< 1.5 MiB); dossier text 73,103 bytes (< 163,840 cap);
  13 source files, 0 vendored files; game/ + screenshots/ within caps.

## Files

- `prompt.txt` — build brief
- `kit/best-heist-game-20261122-0559-kit/` — kit (not committed)
- `main.ts`, `serve.ts`, `vendor/makefun-game.ts` (kit copy, unchanged), `README.md`,
  `LICENSE`, `.makefun/owner.json`, `shots.json`
- `game/` — index.html + 13 source modules (one job each)
- `out/dossier.json` — built dossier (regenerable with main.ts)
