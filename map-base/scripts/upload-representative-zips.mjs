import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundlesDir = path.join(root, '.local/media-bundles');

const credProc = spawnSync('git', ['credential', 'fill'], { input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8' });
let token = '';
for (const line of credProc.stdout.split('\n')) {
  if (line.startsWith('password=')) token = line.slice(9).trim();
}

const releaseId = 455246557; // mzsjlx/shitu media-2026-11-12-chengdu
const mb = JSON.parse(fs.readFileSync(path.join(root, 'data/media-bundles.json'), 'utf8'));

// Pick representative bundles: chiyou and xixichibupang
const targets = [
  'shitu-media-cd-chiyou-6839997190845287692-ab2ac90f2807bf29.zip',
  'shitu-media-cd-xixichibupang-7700226535367149923-122a7f6a75bcaa4e.zip'
];

for (const zipName of targets) {
  const zipPath = path.join(bundlesDir, zipName);
  console.log(`Uploading representative ZIP: ${zipName} (${(fs.statSync(zipPath).size / 1024 / 1024).toFixed(1)} MB)...`);
  const t0 = Date.now();
  const uploadUrl = `https://uploads.github.com/repos/mzsjlx/shitu/releases/${releaseId}/assets?name=${encodeURIComponent(zipName)}`;
  const curl = spawnSync('curl.exe', [
    '-s',
    '-x', 'http://127.0.0.1:7897',
    '-X', 'POST',
    '-H', `Authorization: Bearer ${token}`,
    '-H', 'Content-Type: application/zip',
    '-H', 'User-Agent: curl',
    '--data-binary', `@${zipPath}`,
    uploadUrl
  ], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

  const elapsed = (Date.now() - t0) / 1000;
  console.log(`Uploaded ${zipName} in ${elapsed.toFixed(1)}s (result: ${curl.stdout.includes('"state":"uploaded"') ? 'uploaded' : curl.stdout.slice(0, 100)})`);
}
