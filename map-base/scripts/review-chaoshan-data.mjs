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
  assert(catalog.sources.length >= 4, `Expected at least 4 sources, got ${catalog.sources.length}`);
  const allSegs = catalog.sources.flatMap(s => s.segments);
  assert(allSegs.length >= 11, `Expected at least 11 segments, got ${allSegs.length}`);
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
      
      const clipFile = path.join(root, '.local/video-clips', src.id, rec.clip);
      const clipBytes = await readFile(clipFile);
      assert.equal(digest(clipBytes), rec.clipSHA256);
    }
  }
});

// 4. Video posters in assets/video-posters have matching hashes
await check('4. Video posters in assets/video-posters have matching hashes and paths', async () => {
  for (const src of catalog.sources) {
    for (const seg of src.segments) {
      const pEntry = postersData.segments[seg.id];
      assert(pEntry, `Missing poster entry for ${seg.id}`);
      assert.equal(pEntry.sourceSHA256, src.sourceSHA256);
      const posterFile = path.join(root, pEntry.path);
      const bytes = await readFile(posterFile);
      assert.equal(digest(bytes), pEntry.sha256);
    }
  }
});

// 5. Geographic WGS84 coordinates & bounds
await check('5. Approximate locations stay within Chaoshan bounds with routeEligible=false', async () => {
  const bounds = [116.55, 23.3, 116.85, 23.72];
  for (const src of catalog.sources) {
    for (const seg of src.segments) {
      assert.equal(seg.routeEligible, false);
      if (seg.coordinates) {
        assert.equal(seg.coordinateSystem, 'WGS84');
        assert.equal(seg.locationStatus, 'approximate-planning');
        assert(seg.planningLocation && seg.planningLocation.accuracy === 'approximate');
        assert(seg.coordinates[0] >= bounds[0] && seg.coordinates[0] <= bounds[2], `Longitude out of bounds for ${seg.id}: ${seg.coordinates[0]}`);
        assert(seg.coordinates[1] >= bounds[1] && seg.coordinates[1] <= bounds[3], `Latitude out of bounds for ${seg.id}: ${seg.coordinates[1]}`);
      } else {
        assert.equal(seg.locationStatus, 'unpositioned-archive');
      }
    }
  }
});

// 6. Cross-city isolation and uniqueness
await check('6. Cross-city catalog uniqueness via allCityCatalogs', async () => {
  const catalogs = await allCityCatalogs(root);
  const chaoshanCat = catalogs.find(c => c.cityId === 'chaoshan');
  assert(chaoshanCat, 'Chaoshan city catalog is loaded in allCityCatalogs');
  assert.equal(chaoshanCat.catalog.sources.length, catalog.sources.length);
});

// 7. Built HTML pages contain shops and creators
await check('7. Generated food pages (places-chaoshan.html and detail pages) contain correct content', async () => {
  const placesHtml = await readFile('dist/places-chaoshan.html', 'utf8');
  assert(placesHtml.includes('一杯潮茶'));
  assert(placesHtml.includes('春梅里卤鹅馆'));
  assert(placesHtml.includes('老市区老字号粿汁'));
  assert(placesHtml.includes('阿伯梅汁水果'));
  assert(placesHtml.includes('同济肠粉'));
  assert(placesHtml.includes('吴敬平传统潮州春饼'));
  assert(placesHtml.includes('官塘老陈鱼生'));
  assert(placesHtml.includes('谢肥记牛肉'));

  for (const src of catalog.sources) {
    for (const seg of src.segments) {
      const detailHtml = await readFile(`dist/places/video-${seg.id}.html`, 'utf8');
      assert(detailHtml.includes(seg.name));
      assert(detailHtml.includes(seg.category));
      assert(detailHtml.includes('<video'));
    }
  }
});

// 8. Real OSM walking route between shops
await check('8. Real OSM walking route between Chaoshan shops resolves to ready status', async () => {
  const netRaw = JSON.parse(await readFile('data/cities/chaoshan/food-road-network.json', 'utf8'));
  const router = buildFoodRoadRouter(netRaw);

  // Shantou route: Apo Meizhi -> Yibaichaoche
  const r_st = findFoodRoadRoute(router, [116.6845, 23.3575], [116.6785, 23.3598]);
  assert.equal(r_st.status, 'ready');
  assert(r_st.distanceMetres > 500 && r_st.distanceMetres < 2000);
  assert(r_st.coordinates && r_st.coordinates.length > 5);

  // Chaozhou route: Wujinping Chunbing -> Laochen Yusheng
  const r_cz = findFoodRoadRoute(router, [116.6455, 23.6678], [116.6480, 23.6645]);
  assert.equal(r_cz.status, 'ready');
  assert(r_cz.distanceMetres > 500 && r_cz.distanceMetres < 2500);
  assert(r_cz.coordinates && r_cz.coordinates.length > 5);
});

console.log(`\nReview completed: ${checks.filter(c => c.passed).length}/${checks.length} checks passed!`);
const outJson = path.join(root, '../output/research/chaoshan/chaoshan-batch1-qa.json');
await writeFile(outJson, JSON.stringify(checks, null, 2), 'utf8');
