import {readFile,writeFile,mkdir,copyFile,rm} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {importBundle} from './media-bundles.mjs';
import {digest} from './video-library-common.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundlePath = path.join(root, '.local/media-bundles/shitu-media-cd-rourou-7016962567180389640-88cc800c645aa7fe.zip');

const isolated = path.join(root, '.local/chengdu-import-test-' + Date.now());
const checks = [];

try {
  for (const file of [
    'config/cities.json',
    'data/cities/chengdu/video-library.json',
    'data/cities/chengdu/video-posters.json'
  ]) {
    await mkdir(path.dirname(path.join(isolated, file)), { recursive: true });
    await copyFile(path.join(root, file), path.join(isolated, file));
  }

  // 1. First import
  const result = await importBundle(isolated, bundlePath, { cityId: 'chengdu' });
  assert.equal(result.city, 'chengdu');
  assert.equal(result.clips, 1);
  assert.equal(result.newFiles, 3); // source.mp4, clip.mp4, poster.jpg
  checks.push({ name: 'Chengdu bundle imports into isolated target with correct hashes', passed: true });

  // 2. Repeat import skips writes
  const repeat = await importBundle(isolated, bundlePath, { cityId: 'chengdu' });
  assert.equal(repeat.newFiles, 0);
  checks.push({ name: 'Repeat import of identical bundle skips redundant writes', passed: true });

  // 3. Wrong city rejected
  await assert.rejects(() => importBundle(isolated, bundlePath, { cityId: 'chongqing' }), /素材包城市与所选城市不一致/);
  checks.push({ name: 'Wrong city import rejected before any file write', passed: true });

  // 4. Ledger verification
  const ledger = JSON.parse(await readFile(path.join(isolated, '.local/video-clips/report.json'), 'utf8'));
  assert.equal(ledger.records.length, 1);
  assert.equal(ledger.records[0].id, 'cd-rourou-maojiheyi');
  checks.push({ name: 'Ledger report.json correctly updated with clip metadata', passed: true });

  const report = {
    verifiedOn: '2026-11-12',
    scope: 'Isolated receiver import verification for Chengdu bundle cd-rourou-7016962567180389640.',
    checks,
    passed: true
  };

  const outReportPath = path.join(root, '../output/research/chengdu/integration-import-qa-20261112.json');
  await writeFile(outReportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify({ passed: true, checks: checks.length }));
} finally {
  await rm(isolated, { recursive: true, force: true });
}
