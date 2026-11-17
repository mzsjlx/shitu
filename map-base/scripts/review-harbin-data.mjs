import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateVideoLibrary } from '../src/video-library-model.js';
import { digest, mediaKey, mediaNames } from './video-library-common.mjs';
import { buildFoodRoadRouter, findFoodRoadRoute, nearestRoadSnaps } from '../src/food-road-router.js';

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

console.log('=== Harbin Video Data & Road Network Verification ===\n');

const catalogRaw = await readFile('data/cities/harbin/video-library.json', 'utf8');
const catalog = validateVideoLibrary(JSON.parse(catalogRaw), 'harbin');
const postersData = JSON.parse(await readFile('data/cities/harbin/video-posters.json', 'utf8'));
const assetsData = JSON.parse(await readFile('data/cities/harbin/video-library-assets.json', 'utf8'));
const reportData = JSON.parse(await readFile('.local/video-clips/report.json', 'utf8'));
const roadNetwork = JSON.parse(await readFile('data/cities/harbin/food-road-network.json', 'utf8'));
const citiesConfig = JSON.parse(await readFile('config/cities.json', 'utf8'));
const harbinBounds = citiesConfig.cities.harbin.bounds;

// 1. Catalog integrity & rights
await check('1. Catalog schema and rights status: user-confirmed', () => {
  assert.equal(catalog.city, 'harbin');
  assert.equal(catalog.rights.status, 'user-confirmed');
  assert.equal(catalog.sources.length, 63, `Expected 63 sources, got ${catalog.sources.length}`);
  const allSegs = catalog.sources.flatMap(s => s.segments);
  assert.equal(allSegs.length, 67, `Expected 67 segments, got ${allSegs.length}`);
});

// 2. Source MP4 hash verification
await check('2. Local source.mp4 integrity against sourceSHA256 for all sources', async () => {
  for (const src of catalog.sources) {
    const mp4Path = path.join(root, '.local/video-intake', src.id, 'source.mp4');
    const bytes = await readFile(mp4Path);
    assert.equal(digest(bytes), src.sourceSHA256, `SHA256 mismatch for ${src.id}`);
  }
});

// 3. Single-shop clips match expected media keys and H.264+AAC format
await check('3. Single-shop clips match expected media keys and H.264+AAC format', async () => {
  for (const src of catalog.sources) {
    for (const seg of src.segments) {
      const rec = reportData.records.find(r => r.id === seg.id);
      assert(rec, `Missing report record for ${seg.id}`);
      const key = mediaKey(src, seg);
      assert.equal(rec.mediaKey, key, `MediaKey mismatch for ${seg.id}`);
      assert.equal(rec.sourceSHA256, src.sourceSHA256);
      assert(rec.probe.streams.some(s => s.codec_type === 'video' && s.codec_name === 'h264'));
      assert(rec.probe.streams.some(s => s.codec_type === 'audio' && s.codec_name === 'aac'));
      assert(Math.abs(Number(rec.probe.format.duration) - (seg.end - seg.start)) <= 0.16);
    }
  }
});

// 4. Posters integrity and existence in repository
await check('4. Public video posters exist in repo and match recorded sha256', async () => {
  for (const src of catalog.sources) {
    for (const seg of src.segments) {
      const posterMeta = postersData.segments[seg.id];
      assert(posterMeta, `Missing poster metadata for ${seg.id}`);
      const posterPath = path.join(root, posterMeta.path);
      const bytes = await readFile(posterPath);
      assert.equal(digest(bytes), posterMeta.sha256, `Poster hash mismatch for ${seg.id}`);
      assert(bytes.length > 5000, `Poster size too small for ${seg.id}`);
    }
  }
});

// 5. Video assets manifest properly mapped
await check('5. Video assets manifest in data/cities/harbin/ matches assets', () => {
  for (const src of catalog.sources) {
    for (const seg of src.segments) {
      const asset = assetsData.segments[seg.id];
      assert(asset, `Missing asset in video-library-assets for ${seg.id}`);
      assert(asset.poster.includes(src.id));
      assert(asset.durationSeconds > 0);
    }
  }
});

// 6. Coordinates within Harbin bounds [126.57, 45.72, 126.71, 45.81]
await check('6. All segment coordinates within Harbin bounds', () => {
  for (const src of catalog.sources) {
    for (const seg of src.segments) {
      const [lng, lat] = seg.coordinates;
      assert(lng >= harbinBounds[0] && lng <= harbinBounds[2], `Lng ${lng} out of bounds for ${seg.id}`);
      assert(lat >= harbinBounds[1] && lat <= harbinBounds[3], `Lat ${lat} out of bounds for ${seg.id}`);
      assert.equal(seg.coordinateSystem, 'WGS84');
      assert.equal(seg.routeEligible, false);
    }
  }
});

// 7. Strict cross-city checks: No Shenyang or outside spots
await check('7. Strict cross-city rejection: all spots are Harbin authentic', () => {
  for (const src of catalog.sources) {
    assert(!src.title.includes('沈阳') && !src.evidenceNote.includes('沈阳'), `Cross-city violation in ${src.id}`);
    for (const seg of src.segments) {
      assert(seg.addressText.includes('哈尔滨') || seg.planningLocation.label.includes('道里') || seg.planningLocation.label.includes('香坊') || seg.planningLocation.label.includes('果戈里') || seg.planningLocation.label.includes('道外') || seg.planningLocation.label.includes('南岗'));
    }
  }
});

// 8. OSM Road network snaps within 250m threshold
await check('8. All video spots snap to Harbin OSM walking network within 250m', () => {
  const router = buildFoodRoadRouter(roadNetwork);
  for (const src of catalog.sources) {
    for (const seg of src.segments) {
      const snaps = nearestRoadSnaps(router, seg.coordinates, 250);
      assert(snaps.length > 0, `Failed to snap ${seg.name} (${seg.id}) within 250m threshold`);
      const snap = snaps[0];
      assert(snap.offsetMetres <= 250, `Snap offset ${snap.offsetMetres}m exceeds 250m for ${seg.id}`);
      console.log(`   * ${seg.name}: snapped with offset ${snap.offsetMetres.toFixed(1)}m to way ${snap.segment.way}`);
    }
  }
});

// 9. Real road routing: Connected regions compute real polyline; disconnected regions report unavailable faithfully
await check('9. Real walking route follows true topology and never uses fake multiplier', () => {
  const router = buildFoodRoadRouter(roadNetwork);
  const segs = catalog.sources.flatMap(s => s.segments);

  // A. Connected route along Central Avenue (Yinpangzi -> Madieer):
  const spotA = segs.find(s => s.id === 'hb-daoyueshe-yinpangzi');
  const spotB = segs.find(s => s.id === 'hb-daoyueshe-madieer');
  assert(spotA && spotB);
  const routeCentral = findFoodRoadRoute(router, spotA.coordinates, spotB.coordinates);
  assert.equal(routeCentral.status, 'ready');
  assert(routeCentral.distanceMetres > 100 && routeCentral.distanceMetres < 1000);
  assert(routeCentral.coordinates.length >= 5, `Expected real polyline with multiple coordinates, got ${routeCentral.coordinates.length}`);
  console.log(`   * Central Ave walking: ${routeCentral.distanceMetres.toFixed(1)}m, ${routeCentral.coordinates.length} waypoints along real street curves`);

  // B. Connected cross-district route: Central Avenue to Daowai Baroque (Madieer -> Zhangbaopu):
  const spotBaroque = segs.find(s => s.id === 'hb-daoyueshe-zhangbaopu');
  assert(spotBaroque);
  const routeBaroque = findFoodRoadRoute(router, spotB.coordinates, spotBaroque.coordinates);
  assert.equal(routeBaroque.status, 'ready');
  assert(routeBaroque.distanceMetres > 1500 && routeBaroque.distanceMetres < 4000);
  assert(routeBaroque.coordinates.length >= 10);
  console.log(`   * Central Ave to Baroque walking: ${routeBaroque.distanceMetres.toFixed(1)}m, ${routeBaroque.coordinates.length} waypoints along real street curves`);

  // C. Disconnected component faithfully reports unavailable / disconnected:
  const mainSeg = router.segments.find(s => String(s.component) === '334304160');
  const islandSeg = router.segments.find(s => String(s.component) === '6327767440');
  assert(mainSeg && islandSeg);
  const crossRoute = findFoodRoadRoute(router, mainSeg.start, islandSeg.start);
  assert.equal(crossRoute.status, 'unavailable');
  assert.equal(crossRoute.reason, 'disconnected');
  console.log('   * Isolated component route faithfully reports unavailable/disconnected without multiplying factor');

  // D. Outside-network point faithfully reports outside-network:
  const outsideRoute = findFoodRoadRoute(router, spotA.coordinates, [126.30, 45.50]);
  assert.equal(outsideRoute.status, 'unavailable');
  assert.equal(outsideRoute.reason, 'outside-network');
  console.log('   * Outside-network coordinate faithfully reports unavailable/outside-network');
});

const passed = checks.filter(c => c.passed).length;
console.log(`\nResults: ${passed} / ${checks.length} passed.`);

const outReport = {
  verifiedOn: new Date().toISOString(),
  city: 'harbin',
  checks,
  passed,
  total: checks.length
};
await writeFile(
  path.resolve(root, '../output/research/harbin/QA-HARBIN-DATA.json'),
  JSON.stringify(outReport, null, 2) + '\n',
  'utf8'
);

if (passed !== checks.length) process.exit(1);
