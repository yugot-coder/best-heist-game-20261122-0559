// Velvet Vault — The Meridian Heist: the make.fun hand-in program.
// Node 22, standard library only. It copies this repository's game/ and
// screenshots/ into the output directory and writes dossier.json with the
// kit's vendored library, exactly as the scorer rebuilds it.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fresh output: never mix a previous run's files into this one.
mkdirSync(out, { recursive: true });
mkdirSync(join(out, 'game'), { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });

// Screenshots: 3 or 4 JPEG/PNG renders of the game, the first by name the cover.
const shotDir = join(here, 'screenshots');
const shots = existsSync(shotDir)
  ? readdirSync(shotDir).filter((f) => !f.startsWith('.')).sort()
  : [];
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`screenshots/: expected 3 or 4 images, found ${shots.length}`);
}
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotDir, join(out, 'screenshots'), { recursive: true });

// The dossier the judge reads, built by the kit's own library with the
// gate's caps, so what we write is what the scorer rebuilds byte for byte.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log(`Velvet Vault handed in: ${shots.length} screenshots, dossier written to ${join(out, 'dossier.json')}`);
