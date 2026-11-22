// The Marlow Job — best-heist-game-20261122-0559
//
// Hand-in program for the make.fun "Make the best heist game" bounty.
// It runs on Node 22 with the standard library only (the grader runs plain
// `node main.ts`, no flags, no install step), and it hands the game in by
// copying the static game/ folder and the screenshots/ folder into the
// output directory and writing /output/dossier.json with the vendored
// make.fun library. The game itself is plain files under game/ — no build
// step, no network request — so the same copy works for the grader and for
// a local check.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The output directory is mounted by the grader, so this program only ever
// creates it when it is missing and clears the files inside it. It never
// removes the directory itself: deleting a mounted directory throws
// EBUSY/EACCES when the grader runs as an unprivileged user.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The repository root: the directory this file lives in.
const here = fileURLToPath(new URL('.', import.meta.url));

// The grader mounts a writable /output; locally the env var stands in.
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Create the output directory when it does not exist yet. When it already
// exists (the grader mounts it), leave the directory alone and only clear
// the files inside it, so a stale run never leaks into the new dossier.
mkdirSync(out, { recursive: true });
for (const entry of readdirSync(out)) {
  rmSync(join(out, entry), { recursive: true, force: true });
}

// Fail loudly and early when the game folder is missing its entry point,
// instead of handing the grader a dossier for a game that cannot open.
if (!existsSync(join(here, 'game', 'index.html'))) {
  throw new Error('game/index.html is missing — the game cannot be handed in.');
}

// Copy the game in whole: index.html plus every script, style and asset
// under game/, exactly as the browser serves them.
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });

// Copy the maker's screenshots of the game running in a browser.
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Write the dossier the judge reads: the library rebuilds it from the
// copied files, so what lands in /output is exactly what was graded.
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
