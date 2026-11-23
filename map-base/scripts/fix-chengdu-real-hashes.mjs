import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { mediaKey, digest } from './video-library-common.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const libPath = path.join(root, 'data/cities/chengdu/video-library.json');
const reportPath = path.join(root, '.local/video-clips/report.json');
const postersPath = path.join(root, 'data/video-posters.json');

const lib = JSON.parse(fs.readFileSync(libPath, 'utf8'));
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const posters = JSON.parse(fs.readFileSync(postersPath, 'utf8'));

let updatedSources = 0;
let updatedSegments = 0;

for (const source of lib.sources) {
  const mp4Path = path.join(root, '.local/video-intake', source.id, 'source.mp4');
  if (!fs.existsSync(mp4Path)) {
    console.error(`Warning: source file missing: ${mp4Path}`);
    continue;
  }
  const realSha = digest(fs.readFileSync(mp4Path));
  if (realSha !== source.sourceSHA256) {
    const oldSourceSha = source.sourceSHA256;
    source.sourceSHA256 = realSha;
    updatedSources++;

    for (const segment of source.segments) {
      const oldKey = mediaKey({ ...source, sourceSHA256: oldSourceSha }, segment);
      const newKey = mediaKey(source, segment);
      updatedSegments++;

      // 1. Rename files in .local/video-clips
      const clipDir = path.join(root, '.local/video-clips', source.id);
      const oldClipFile = path.join(clipDir, `${segment.id}-${oldKey}.mp4`);
      const newClipFile = path.join(clipDir, `${segment.id}-${newKey}.mp4`);
      if (fs.existsSync(oldClipFile)) {
        fs.renameSync(oldClipFile, newClipFile);
      }
      const oldPosterClipFile = path.join(clipDir, `${segment.id}-${oldKey}.jpg`);
      const newPosterClipFile = path.join(clipDir, `${segment.id}-${newKey}.jpg`);
      if (fs.existsSync(oldPosterClipFile)) {
        fs.renameSync(oldPosterClipFile, newPosterClipFile);
      }

      // 2. Rename file in assets/video-posters
      const assetDir = path.join(root, 'assets/video-posters', source.id);
      const oldAssetFile = path.join(assetDir, `${segment.id}-${oldKey}.jpg`);
      const newAssetFile = path.join(assetDir, `${segment.id}-${newKey}.jpg`);
      if (fs.existsSync(oldAssetFile)) {
        fs.renameSync(oldAssetFile, newAssetFile);
      }

      // 3. Update report.json record
      const repRecord = report.records.find(r => r.id === segment.id);
      if (repRecord) {
        repRecord.sourceSHA256 = realSha;
        repRecord.mediaKey = newKey;
        repRecord.clip = `${segment.id}-${newKey}.mp4`;
        repRecord.poster = `${segment.id}-${newKey}.jpg`;
      }

      // 4. Update video-posters.json
      if (posters.segments && posters.segments[segment.id]) {
        posters.segments[segment.id].sourceSHA256 = realSha;
        posters.segments[segment.id].mediaKey = newKey;
        posters.segments[segment.id].path = `assets/video-posters/${source.id}/${segment.id}-${newKey}.jpg`;
      }
    }
  }
}

fs.writeFileSync(libPath, JSON.stringify(lib, null, 2) + '\n', 'utf8');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
fs.writeFileSync(postersPath, JSON.stringify(posters, null, 2) + '\n', 'utf8');

console.log(`Fix completed: updated ${updatedSources} sources and ${updatedSegments} segments.`);
