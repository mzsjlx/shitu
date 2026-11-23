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
const cdSources = mb.sources.filter(s => s.city === 'chengdu');

console.log(`Uploading ${cdSources.length} .zip.json digests to mzsjlx/shitu release ${releaseId}...`);

let success = 0;
let skipped = 0;

for (let i = 0; i < cdSources.length; i++) {
  const s = cdSources[i];
  const jsonName = s.name + '.json';
  const jsonPath = path.join(bundlesDir, jsonName);
  if (!fs.existsSync(jsonPath)) {
    console.error(`File missing: ${jsonPath}`);
    continue;
  }

  const uploadUrl = `https://uploads.github.com/repos/mzsjlx/shitu/releases/${releaseId}/assets?name=${encodeURIComponent(jsonName)}`;
  const curl = spawnSync('curl.exe', [
    '-s',
    '-x', 'http://127.0.0.1:7897',
    '-X', 'POST',
    '-H', `Authorization: Bearer ${token}`,
    '-H', 'Content-Type: application/json',
    '-H', 'User-Agent: curl',
    '--data-binary', `@${jsonPath}`,
    uploadUrl
  ], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

  if (curl.stdout.includes('"state":"uploaded"')) {
    success++;
  } else if (curl.stdout.includes('already_exists')) {
    skipped++;
  } else {
    console.error(`Failed ${jsonName}:`, curl.stdout.slice(0, 200));
  }

  if ((i + 1) % 20 === 0 || i === cdSources.length - 1) {
    console.log(`Progress: ${i + 1}/${cdSources.length} (success=${success}, skipped=${skipped})`);
  }
}

console.log(`Digest upload finished: success=${success}, skipped=${skipped}`);
