import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateVideoLibrary } from '../src/video-library-model.js';
import { allCityCatalogs } from './city-catalogs.mjs';
import { digest, mediaKey, mediaNames } from './video-library-common.mjs';
import { buildFoodRoadRouter, findFoodRoadRoute } from '../src/food-road-router.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);

const checks = [];
async function check(name, fn) {
  try {
    await fn();
    checks.push({ name, passed: true });
    console.log(`[PASS] ${name}`);
  } catch (e) {
    checks.push({ name, passed: false, error: e.message });
    console.error(`[FAIL] ${name}: ${e.message}`);
  }
}

const catalogRaw = await readFile('data/cities/chaoshan/video-library.json', 'utf8');
const catalog = validateVideoLibrary(JSON.parse(catalogRaw), 'chaoshan');
const postersData = JSON.parse(await readFile('data/cities/chaoshan/video-posters.json', 'utf8'));
const assetsData = JSON.parse(await readFile('data/cities/chaoshan/video-library-assets.json', 'utf8'));
const reportData = JSON.parse(await readFile('.local/video-clips/report.json', 'utf8'));

// 1. Catalog integrity & rights
await check('1. Catalog schema and rights status: user-confirmed', () => {
  assert.equal(catalog.city, 'chaoshan');
  assert.equal(catalog.rights.status, 'user-confirmed');
  assert.equal(catalog.sources.length, 1);
  const src = catalog.sources[0];
  assert.equal(src.id, 'chaoshan-miaojiang-7661157240087097061');
  assert.equal(src.author, '喵酱饿了');
  assert.equal(src.url, 'https://www.douyin.com/video/7661157240087097061');
  assert.equal(src.segments.length, 3);
});

// 2. Source MP4 hash verification
await check('2. Local source.mp4 integrity against sourceSHA256', async () => {
  const src = catalog.sources[0];
  const input = path.join(root, '.local/video-intake', src.id, 'source.mp4');
  const bytes = await readFile(input);
  assert.equal(digest(bytes), src.sourceSHA256);
});

// 3. Segment clips and media probe verification
await check('3. Single-shop clips match expected media keys and H.264+AAC format', async () => {
  const src = catalog.sources[0];
  for (const seg of src.segments) {
    const key = mediaKey(src, seg);
    const names = mediaNames(src, seg);
    const rec = reportData.records.find(r => r.id === seg.id);
    assert(rec, `Report missing record for ${seg.id}`);
    assert.equal(rec.mediaKey, key);
    assert.equal(rec.sourceSHA256, src.sourceSHA256);

    const clipPath = path.join(root, '.local/video-clips', src.id, names.clip);
    const clipBytes = await readFile(clipPath);
    assert.equal(digest(clipBytes), rec.clipSHA256);
    assert(rec.probe.streams.some(s => s.codec_type === 'video' && s.codec_name === 'h264'));
    assert(rec.probe.streams.some(s => s.codec_type === 'audio' && s.codec_name === 'aac'));
    const dur = Number(rec.probe.format.duration);
    assert(Math.abs(dur - (seg.end - seg.start)) < 0.16, `Duration mismatch for ${seg.id}: ${dur}`);
  }
});

// 4. Git poster assets verification
await check('4. Video posters in assets/video-posters have matching hashes and paths', async () => {
  const src = catalog.sources[0];
  for (const seg of src.segments) {
    const pEntry = postersData.segments[seg.id];
    assert(pEntry, `Missing poster entry in video-posters.json for ${seg.id}`);
    assert.equal(pEntry.sourceId, src.id);
    assert.equal(pEntry.sourceSHA256, src.sourceSHA256);
    const posterFile = path.join(root, pEntry.path);
    const bytes = await readFile(posterFile);
    assert.equal(digest(bytes), pEntry.sha256);
  }
});

// 5. Geographic WGS84 coordinates & bounds
await check('5. Approximate locations stay within Chaoshan bounds with routeEligible=false', async () => {
  const bounds = [116.55, 23.3, 116.85, 23.72];
  for (const seg of catalog.sources[0].segments) {
    assert(seg.coordinates, `Missing coordinates for ${seg.id}`);
    assert.equal(seg.coordinateSystem, 'WGS84');
    assert.equal(seg.routeEligible, false);
    assert.equal(seg.locationStatus, 'approximate-planning');
    assert(seg.planningLocation && seg.planningLocation.accuracy === 'approximate');
    assert(seg.coordinates[0] >= bounds[0] && seg.coordinates[0] <= bounds[2], `Longitude out of bounds: ${seg.coordinates[0]}`);
    assert(seg.coordinates[1] >= bounds[1] && seg.coordinates[1] <= bounds[3], `Latitude out of bounds: ${seg.coordinates[1]}`);
  }
});

// 6. Cross-city isolation and uniqueness
await check('6. Cross-city catalog uniqueness via allCityCatalogs', async () => {
  const catalogs = await allCityCatalogs(root);
  const chaoshanCat = catalogs.find(c => c.cityId === 'chaoshan');
  assert(chaoshanCat, 'Chaoshan city catalog is loaded in allCityCatalogs');
  assert.equal(chaoshanCat.catalog.sources.length, 1);
});

// 7. Built HTML pages contain all 3 shops
await check('7. Generated food pages (places-chaoshan.html and detail pages) contain correct content', async () => {
  const placesHtml = await readFile('dist/places-chaoshan.html', 'utf8');
  assert(placesHtml.includes('一杯潮茶（小公园店）'));
  assert(placesHtml.includes('春梅里卤鹅馆（中山路总店）'));
  assert(placesHtml.includes('老市区老字号粿汁'));
  assert(placesHtml.includes('喵酱饿了'));

  for (const seg of catalog.sources[0].segments) {
    const detailHtml = await readFile(`dist/places/video-${seg.id}.html`, 'utf8');
    assert(detailHtml.includes(seg.name));
    assert(detailHtml.includes(seg.category));
    assert(detailHtml.includes('<video'));
  }
});

// 8. Real OSM road routing calculation
await check('8. Real OSM walking route between Chaoshan shops resolves to ready status', async () => {
  const net = JSON.parse(await readFile('data/cities/chaoshan/food-road-network.json', 'utf8'));
  const router = buildFoodRoadRouter(net);
  assert(router.stats.nodes > 10000, `Nodes count too low: ${router.stats.nodes}`);
  assert(router.stats.ways > 2000, `Ways count too low: ${router.stats.ways}`);

  const segs = catalog.sources[0].segments;
  const r1_2 = findFoodRoadRoute(router, segs[0].coordinates, segs[1].coordinates);
  assert.equal(r1_2.status, 'ready');
  assert(r1_2.distanceMetres > 1000 && r1_2.distanceMetres < 10000, `Unexpected distance 1->2: ${r1_2.distanceMetres}`);
  assert(r1_2.coordinates.length > 10, `Too few coordinates 1->2: ${r1_2.coordinates.length}`);

  const r3_1 = findFoodRoadRoute(router, segs[2].coordinates, segs[0].coordinates);
  assert.equal(r3_1.status, 'ready');
  assert(r3_1.distanceMetres > 1000 && r3_1.distanceMetres < 10000, `Unexpected distance 3->1: ${r3_1.distanceMetres}`);
  assert(r3_1.coordinates.length > 10, `Too few coordinates 3->1: ${r3_1.coordinates.length}`);
});

const report = {
  city: 'chaoshan',
  reviewedOn: '2026-11-09',
  scope: 'Chaoshan Batch 1 Closed Loop: 1 source (喵酱饿了), 3 shops (一杯潮茶, 春梅里卤鹅, 老市区老字号粿汁). Real H.264+AAC clips, small posters, WGS84 approximate coordinates, cross-city catalog uniqueness, HTML generation, and real OSM road network walking routing.',
  totalChecks: checks.length,
  passedChecks: checks.filter(c => c.passed).length,
  allPassed: checks.every(c => c.passed),
  checks
};

await writeFile('../output/research/chaoshan/chaoshan-batch1-qa.json', JSON.stringify(report, null, 2) + '\n');
console.log(`\nReview completed: ${report.passedChecks}/${report.totalChecks} checks passed!`);
if (!report.allPassed) {
  process.exit(1);
}
