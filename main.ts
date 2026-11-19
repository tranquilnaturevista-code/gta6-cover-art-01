// Vice City Cover Maker — the entry program for gta6-cover-art-01 (Node 22, standard library only).
// What it does, in three steps: copy the app's static files (app/) and the screenshots (screenshots/) from
// beside this file into the output directory, then write /output/dossier.json with the kit's vendored
// buildDossier helper, using the same caps the scorer enforces. The app itself is plain static files —
// index.html plus ES modules under app/src/, a bundled OFL font and two sample photos — that run offline in
// a desktop browser with no network request at all.
//
// Run it locally like this:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output; inside the grader it defaults to /output.
// The program runs twice and must write identical bytes both times, so it copies and writes deterministically
// and keeps no timestamps or random data in the output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The caps match the scorer's gate: the judge's text is capped at 160 KiB, screenshots at 4 files of at
// most 256 KiB each, and app/ at 993 files and 48 MiB with no path over 1000 bytes. buildDossier refuses
// anything past them, so a bad entry fails here instead of silently reaching the judge.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
