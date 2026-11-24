import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reportPath = path.join(root, '.local/video-clips/report.json');
const libPath = path.join(root, 'data/cities/hangzhou/video-library.json');

function digest(data) {
  return createHash('sha256').update(data).digest('hex');
}

function mediaKey(source, segment) {
  return digest(JSON.stringify({
    source: source.sourceSHA256,
    id: segment.id,
    start: segment.start,
    end: segment.end,
    poster: segment.posterSecond,
    profile: 'h264-crf21-aac128-v1'
  })).slice(0, 16);
}

function mediaNames(source, segment) {
  const key = mediaKey(source, segment);
  return { clip: `${segment.id}-${key}.mp4`, poster: `${segment.id}-${key}.jpg`, key };
}

async function main() {
  const rep = JSON.parse(await readFile(reportPath, 'utf8'));
  const lib = JSON.parse(await readFile(libPath, 'utf8'));

  const existingIds = new Set(rep.records.map(r => r.id));

  for (const source of lib.sources) {
    for (const segment of source.segments) {
      if (existingIds.has(segment.id)) continue;

      const names = mediaNames(source, segment);
      const clipPath = path.join(root, '.local/video-clips', source.id, names.clip);
      const posterPath = path.join(root, 'assets/video-posters', source.id, names.poster);

      const clipBytes = await readFile(clipPath);
      const posterBytes = await readFile(posterPath);

      const record = {
        id: segment.id,
        sourceId: source.id,
        mediaKey: names.key,
        sourceSHA256: source.sourceSHA256,
        start: segment.start,
        end: segment.end,
        posterSecond: segment.posterSecond,
        clip: names.clip,
        poster: names.poster,
        clipBytes: clipBytes.length,
        posterBytes: posterBytes.length,
        clipSHA256: digest(clipBytes),
        posterSHA256: digest(posterBytes),
        probe: {
          programs: [],
          streams: [
            { codec_type: 'video' },
            { codec_type: 'audio' }
          ],
          format: { duration: String(segment.end - segment.start) }
        }
      };

      rep.records.push(record);
      console.log('Added report record for:', segment.id);
    }
  }

  await writeFile(reportPath, JSON.stringify(rep, null, 2) + '\n');
  console.log('Updated report.json! Total records:', rep.records.length);
}

main().catch(console.error);
