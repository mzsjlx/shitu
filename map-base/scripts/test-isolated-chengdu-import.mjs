import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert';
import { importBundle } from './media-bundles.mjs';
import { digest } from './video-library-common.mjs';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptsDir, '..');

const testDir = path.join(root, '.local/reviews/isolated-import-test');
// Clean up old unpacked files, keep downloaded zip if present
if (fs.existsSync(path.join(testDir, '.local'))) {
  fs.rmSync(path.join(testDir, '.local'), { recursive: true, force: true });
}
fs.mkdirSync(path.join(testDir, 'data/cities/chengdu'), { recursive: true });
fs.mkdirSync(path.join(testDir, 'config'), { recursive: true });

// Copy necessary metadata
fs.copyFileSync(path.join(root, 'config/cities.json'), path.join(testDir, 'config/cities.json'));
fs.copyFileSync(path.join(root, 'data/media-bundles.json'), path.join(testDir, 'data/media-bundles.json'));
fs.copyFileSync(path.join(root, 'data/cities/chengdu/video-library.json'), path.join(testDir, 'data/cities/chengdu/video-library.json'));

const testBundleName = 'shitu-media-cd-wangxun-7553863973137943849-58a7ef2a70d50180.zip';
const downloadUrl = `https://github.com/mzsjlx/shitu/releases/download/media-2026-11-12-chengdu/${testBundleName}`;
const localDownloadedZip = path.join(testDir, testBundleName);

console.log(`Downloading ${testBundleName} from remote release URL: ${downloadUrl}...`);

const credProc = spawnSync('git', ['credential', 'fill'], { input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8' });
let token = '';
for (const line of credProc.stdout.split('\n')) {
  if (line.startsWith('password=')) token = line.slice(9).trim();
}

// Don't wipe downloaded file if already fully downloaded
if (!fs.existsSync(localDownloadedZip) || fs.statSync(localDownloadedZip).size !== 13986784) {
  const curl = spawnSync('curl.exe', [
    '-L',
    '-C', '-',
    '--retry', '5',
    '--retry-delay', '2',
    '--retry-all-errors',
    '-s',
    '-x', 'http://127.0.0.1:7897',
    '-H', `Authorization: Bearer ${token}`,
    '-H', 'User-Agent: curl',
    '-o', localDownloadedZip,
    downloadUrl
  ], { windowsHide: true });
}

assert.equal(fs.existsSync(localDownloadedZip), true, 'Downloaded file must exist');
const downloadedBytes = fs.readFileSync(localDownloadedZip);
const downloadedSha = digest(downloadedBytes);

const mb = JSON.parse(fs.readFileSync(path.join(root, 'data/media-bundles.json'), 'utf8'));
const entry = mb.sources.find(s => s.name === testBundleName);
assert(entry, 'Entry must be in media-bundles.json');
assert.equal(downloadedBytes.length, entry.bytes, `Bytes match: ${downloadedBytes.length} === ${entry.bytes}`);
assert.equal(downloadedSha, entry.sha256, `SHA256 match: ${downloadedSha} === ${entry.sha256}`);
console.log(`Download verified! Bytes: ${downloadedBytes.length}, SHA256: ${downloadedSha}`);

// 1. Initial import
console.log('Testing initial import...');
const res1 = await importBundle(testDir, localDownloadedZip, { cityId: 'chengdu' });
console.log('Initial import result:', res1);
assert.equal(res1.city, 'chengdu');
assert.equal(res1.sourceId, 'cd-wangxun-7553863973137943849');
assert(res1.clips >= 1, 'Clips imported');
assert(res1.newFiles > 0, 'New files written');

// 2. Duplicate import (idempotency check)
console.log('Testing duplicate import (idempotency)...');
const res2 = await importBundle(testDir, localDownloadedZip, { cityId: 'chengdu' });
console.log('Duplicate import result:', res2);
assert.equal(res2.newFiles, 0, 'Duplicate import must write 0 new files (idempotent)');

// 3. Playback/decode check of imported clip
const ffprobe = process.env.FOODCITY_FFPROBE || (fs.existsSync('D:\\trae安装程序\\Trae CN\\resources\\app\\bin\\ffprobe.exe') ? 'D:\\trae安装程序\\Trae CN\\resources\\app\\bin\\ffprobe.exe' : 'ffprobe');
const rep = JSON.parse(fs.readFileSync(path.join(testDir, '.local/video-clips/report.json'), 'utf8'));
const clipRecord = rep.records.find(r => r.sourceId === 'cd-wangxun-7553863973137943849');
assert(clipRecord, 'Record must exist in report.json');
const clipPath = path.join(testDir, '.local/video-clips', clipRecord.sourceId, clipRecord.clip);
assert(fs.existsSync(clipPath), `Clip file must exist: ${clipPath}`);

const probe = spawnSync(ffprobe, [
  '-v', 'error',
  '-show_entries', 'format=duration:stream=codec_name,codec_type',
  '-of', 'json',
  clipPath
], { encoding: 'utf8', windowsHide: true });

assert.equal(probe.status, 0, 'FFprobe must succeed on imported clip');
const probeData = JSON.parse(probe.stdout);
const hasVideo = probeData.streams.some(s => s.codec_type === 'video');
const hasAudio = probeData.streams.some(s => s.codec_type === 'audio');
assert(hasVideo, 'Must have video stream');
assert(hasAudio, 'Must have audio stream');
console.log(`Probe check passed: duration=${probeData.format.duration}s, streams=${probeData.streams.map(s => s.codec_name).join('/')}`);

console.log('ALL ISOLATED IMPORT CHECKS PASSED (100% SUCCESS)!');
