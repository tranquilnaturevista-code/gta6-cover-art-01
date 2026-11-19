// Takes the entry's screenshots for real: serves app/ on a local port, opens each scene from shots.json
// in headless Chromium, waits for window.__shotReady, and saves a JPEG screenshot. Also verifies the real
// export path (clicks an export button, checks the downloaded PNG) and records every network request the
// page makes, so the app can be proven to load nothing from outside. Run from the repo root:
//   NODE_PATH=/tmp/pw/node_modules node scripts/shots.mjs
import { createRequire } from 'node:module';
// playwright-core is installed outside the repo (in /tmp/pw) so the entry's own files stay clean;
// createRequire resolves it from that absolute path, since NODE_PATH does not apply to ESM imports.
const { chromium } = createRequire('/tmp/pw/node_modules/playwright-core/index.js')('playwright-core');
import { spawn } from 'node:child_process';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('..', import.meta.url));
const PORT = 8901;
const BASE = `http://127.0.0.1:${PORT}`;

const shots = JSON.parse(readFileSync(join(repo, 'shots.json'), 'utf8'));

function waitForServer(url, tries = 40) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      fetch(url)
        .then((r) => (r.ok ? resolve() : setTimeout(() => attempt(n - 1), 250)))
        .catch(() => (n <= 0 ? reject(new Error('server did not come up')) : setTimeout(() => attempt(n - 1), 250)));
    };
    attempt(tries);
  });
}

const server = spawn('node', ['serve.ts', '--port', String(PORT)], { cwd: repo, stdio: 'ignore' });
try {
  await waitForServer(`${BASE}/index.html`);

  const browser = await chromium.launch();
  try {
    const requests = [];
    for (const shot of shots) {
      const page = await browser.newPage({ viewport: { width: shot.w, height: shot.h } });
      page.on('request', (req) => requests.push(req.url()));
      await page.goto(`${BASE}/index.html${shot.query}`, { waitUntil: 'load' });
      await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 15000 });
      const out = join(repo, 'screenshots', shot.name);
      await page.screenshot({ path: out, type: 'jpeg', quality: 80 });
      const size = statSync(out).size;
      console.log(`${shot.name}: ${shot.w}x${shot.h} viewport, ${(size / 1024).toFixed(1)} KiB`);
      await page.close();
    }

    // Network check: every request the app made must be the local server (or a data: URI).
    const outside = requests.filter((u) => !u.startsWith(BASE) && !u.startsWith('data:'));
    console.log(`network requests: ${requests.length} total, ${outside.length} outside localhost`);
    if (outside.length) console.log('OUTSIDE:', outside);
    writeFileSync('/tmp/gta6cover-requests.json', JSON.stringify(requests, null, 2));

    // Export check: load the editor, click the 1920x1080 export, verify the downloaded PNG.
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto(`${BASE}/index.html?shot=editor&photo=pier&caption=VICE%20CITY%20NIGHTS`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 15000 });
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await page.click('#export-buttons button[data-size="1920 x 1080"]');
    const download = await downloadPromise;
    const dlPath = '/tmp/gta6cover-export.png';
    await download.saveAs(dlPath);
    const buf = readFileSync(dlPath);
    const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const sigOk = buf.subarray(0, 8).equals(pngSig);
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    const status = await page.textContent('#status');
    console.log(`export: signature ${sigOk ? 'OK' : 'BAD'}, ${width}x${height}, ${buf.length} bytes, status: "${status}"`);
    await page.close();
  } finally {
    await browser.close();
  }
} finally {
  server.kill();
}
console.log('done');
