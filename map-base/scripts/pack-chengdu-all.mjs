import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { packSource } from './media-bundles.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cat = JSON.parse(fs.readFileSync(path.join(root, 'data/cities/chengdu/video-library.json'), 'utf8'));

console.log(`Starting packing ${cat.sources.length} Chengdu sources...`);
const start = Date.now();
const results = [];

for (let i = 0; i < cat.sources.length; i++) {
  const s = cat.sources[i];
  const t0 = Date.now();
  const res = await packSource(root, s.id, { cityId: 'chengdu' });
  results.push(res);
  if ((i + 1) % 10 === 0 || i === cat.sources.length - 1) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`Packed ${i + 1}/${cat.sources.length} sources (${elapsed}s elapsed, last: ${s.id} in ${Date.now() - t0}ms)`);
  }
}

console.log(`Finished packing all ${results.length} sources successfully in ${((Date.now() - start) / 1000).toFixed(1)}s!`);
