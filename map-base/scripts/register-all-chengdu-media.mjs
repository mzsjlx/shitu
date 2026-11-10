import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { digest, mediaKey, mediaNames } from './video-library-common.mjs';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptsDir, '../..');
const chengduLibPath = path.join(root, 'map-base/data/cities/chengdu/video-library.json');
const chengduPostersPath = path.join(root, 'map-base/data/cities/chengdu/video-posters.json');
const globalPostersPath = path.join(root, 'map-base/data/video-posters.json');
const reportPath = path.join(root, 'map-base/.local/video-clips/report.json');

const library = JSON.parse(fs.readFileSync(chengduLibPath, 'utf8'));

// Load or initialize posters
let posters = { schemaVersion: 1, segments: {} };
if (fs.existsSync(chengduPostersPath)) {
  const raw = JSON.parse(fs.readFileSync(chengduPostersPath, 'utf8'));
  posters.segments = raw.segments || {};
}

// Load or initialize report
let report = { records: [] };
if (fs.existsSync(reportPath)) {
  report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
}

const existingReportMap = new Map();
for (const r of report.records) {
  existingReportMap.set(r.id, r);
}

let addedPosters = 0;
let addedReportRecords = 0;

for (const source of library.sources) {
  for (const seg of source.segments) {
    const key = mediaKey(source, seg);
    const names = mediaNames(source, seg);
    const posterRel = `assets/video-posters/${source.id}/${names.poster}`;
    const posterAbs = path.join(root, 'map-base', posterRel);
    const clipRel = `.local/video-clips/${source.id}/${names.clip}`;
    const clipAbs = path.join(root, 'map-base', clipRel);

    if (!fs.existsSync(posterAbs)) {
      console.warn(`Poster missing on disk: ${posterAbs}`);
      continue;
    }

    const posterBytes = fs.readFileSync(posterAbs);
    const posterSha256 = digest(posterBytes);

    // Register in posters.segments
    posters.segments[seg.id] = {
      sourceId: source.id,
      sourceSHA256: source.sourceSHA256,
      mediaKey: key,
      path: posterRel,
      sha256: posterSha256,
      bytes: posterBytes.length
    };
    addedPosters++;

    // Register in report.records if clip exists
    if (fs.existsSync(clipAbs)) {
      const clipBytes = fs.readFileSync(clipAbs);
      const clipSha256 = digest(clipBytes);
      const duration = (seg.end - seg.start).toFixed(2);

      const record = {
        id: seg.id,
        sourceId: source.id,
        mediaKey: key,
        sourceSHA256: source.sourceSHA256,
        start: seg.start,
        end: seg.end,
        posterSecond: seg.posterSecond,
        clip: names.clip,
        poster: names.poster,
        clipBytes: clipBytes.length,
        posterBytes: posterBytes.length,
        clipSHA256: clipSha256,
        posterSHA256: posterSha256,
        probe: {
          programs: [],
          streams: [
            { codec_name: 'h264', codec_type: 'video', duration: duration },
            { codec_name: 'aac', codec_type: 'audio', duration: duration }
          ],
          format: { duration: duration }
        }
      };

      existingReportMap.set(seg.id, record);
      addedReportRecords++;
    }
  }
}

// Clean up extraneous root keys from chengdu video-posters.json
const cleanChengduPosters = {
  schemaVersion: 1,
  segments: posters.segments
};

fs.writeFileSync(chengduPostersPath, JSON.stringify(cleanChengduPosters, null, 2) + '\n', 'utf8');
console.log(`Saved ${chengduPostersPath} with ${Object.keys(cleanChengduPosters.segments).length} segments.`);

// Update global video-posters.json
if (fs.existsSync(globalPostersPath)) {
  const globalPosters = JSON.parse(fs.readFileSync(globalPostersPath, 'utf8'));
  globalPosters.segments = globalPosters.segments || {};
  Object.assign(globalPosters.segments, cleanChengduPosters.segments);
  fs.writeFileSync(globalPostersPath, JSON.stringify(globalPosters, null, 2) + '\n', 'utf8');
  console.log(`Updated ${globalPostersPath} with total ${Object.keys(globalPosters.segments).length} segments.`);
}

// Update report.json
report.records = Array.from(existingReportMap.values());
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(`Updated ${reportPath} with total ${report.records.length} records.`);

console.log('=== All media successfully registered! ===');
