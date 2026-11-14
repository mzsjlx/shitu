import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFoodRoadRouter, findFoodRoadRoute } from '../src/food-road-router.js';
import { allCityCatalogs } from './city-catalogs.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checks = [];

async function check(name, fn) {
  try {
    const result = await fn();
    checks.push({ name, passed: true, details: result || 'OK' });
    console.log(`[PASS] ${name}`);
  } catch (error) {
    checks.push({ name, passed: false, error: error.message });
    console.error(`[FAIL] ${name}: ${error.message}`);
  }
}

// 1. Config check
await check('1. config/cities.json includes valid wuhan entry with 3 towns coverage', async () => {
  const content = JSON.parse(await readFile('config/cities.json', 'utf8'));
  const wuhan = content.cities.wuhan;
  assert(wuhan, 'wuhan key exists');
  assert.equal(wuhan.name, '武汉');
  assert.equal(wuhan.amapCityCode, '420100');
  assert.deepEqual(wuhan.bounds, [114.18, 30.48, 114.42, 30.64]);
  assert.deepEqual(wuhan.center, [114.305, 30.562]);
  assert.equal(wuhan.pitch, 52);
  assert.equal(wuhan.tiles, 'data/cities/wuhan/wuhan.pmtiles');
  return { wuhanConfig: wuhan };
});

// 2. PMTiles file check
await check('2. data/cities/wuhan/wuhan.pmtiles exists, size and sha256 match manifest', async () => {
  const bytes = await readFile('data/cities/wuhan/wuhan.pmtiles');
  const meta = JSON.parse(await readFile('data/cities/wuhan/source-manifest.json', 'utf8'));
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  assert.equal(bytes.length, meta.bytes);
  assert.equal(sha256, meta.sha256);
  assert.equal(bytes.length, 7047532);
  return { bytes: bytes.length, sha256 };
});

// 3. Data audit check
await check('3. data/cities/wuhan/data-audit.json verifies all 414 tiles extracted', async () => {
  const audit = JSON.parse(await readFile('data/cities/wuhan/data-audit.json', 'utf8'));
  assert.equal(audit.counters.requestedTiles, 414);
  assert.equal(audit.counters.presentTiles, 414);
  return { requestedTiles: audit.counters.requestedTiles, presentTiles: audit.counters.presentTiles };
});

// 4. Roads index check
await check('4. data/cities/wuhan/roads-index.json has valid groups all within bounds', async () => {
  const roads = JSON.parse(await readFile('data/cities/wuhan/roads-index.json', 'utf8'));
  assert(roads.roads.length > 1000, `Expected >1000 road groups, got ${roads.roads.length}`);
  const [minLng, minLat, maxLng, maxLat] = roads.bounds;
  assert.equal(minLng, 114.18);
  assert.equal(minLat, 30.48);
  assert.equal(maxLng, 114.42);
  assert.equal(maxLat, 30.64);
  return { roadCount: roads.roads.length, bounds: roads.bounds };
});

// 5. Road network data check
await check('5. data/cities/wuhan/food-road-network.json has valid topological nodes and ways', async () => {
  const bytes = await readFile('data/cities/wuhan/food-road-network.json');
  const manifest = JSON.parse(await readFile('data/cities/wuhan/food-road-network-manifest.json', 'utf8'));
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  assert.equal(bytes.length, manifest.bytes);
  assert.equal(sha256, manifest.networkSHA256);
  
  const net = JSON.parse(bytes.toString('utf8'));
  assert.equal(net.city, 'wuhan');
  assert.equal(net.nodes.length, manifest.nodes);
  assert.equal(net.ways.length, manifest.ways);
  assert(net.nodes.length > 140000, `Expected >140k nodes, got ${net.nodes.length}`);
  assert(net.ways.length > 24000, `Expected >24k ways, got ${net.ways.length}`);
  const bridges = net.ways.filter(w => w.tags && w.tags.bridge && w.tags.bridge !== 'no').length;
  const tunnels = net.ways.filter(w => w.tags && w.tags.tunnel && w.tags.tunnel !== 'no').length;
  assert(bridges > 400, `Expected >400 bridges, got ${bridges}`);
  assert(tunnels > 100, `Expected >100 tunnels, got ${tunnels}`);
  
  return {
    nodes: net.nodes.length,
    ways: net.ways.length,
    bridges,
    tunnels,
    sha256
  };
});

// 6. Router test (local route, real shop-to-shop route, and cross-river bridges)
await check('6. food-road-router calculates genuine Wuhan routes (bridges, shops, and error fallback)', async () => {
  const net = JSON.parse(await readFile('data/cities/wuhan/food-road-network.json', 'utf8'));
  const router = buildFoodRoadRouter(net);

  // Shop-to-Shop Route: 小屋卤肉大饼 ([114.2784, 30.58925]) -> 长堤街油炸小吃 ([114.2525, 30.57082])
  const p_xiaowu = [114.2784, 30.58925];
  const p_changdi = [114.2525, 30.57082];
  const r_shops = findFoodRoadRoute(router, p_xiaowu, p_changdi);
  assert.equal(r_shops.status, 'ready');
  assert(r_shops.distanceMetres > 2500 && r_shops.distanceMetres < 4500);

  // Route 1: Hankou Wansongyuan ([114.269, 30.588]) to Jianghan Road ([114.288, 30.583])
  const p_wsy = [114.269, 30.588];
  const p_jhr = [114.288, 30.583];
  const r1 = findFoodRoadRoute(router, p_wsy, p_jhr);
  assert.equal(r1.status, 'ready');
  assert(r1.distanceMetres > 2000 && r1.distanceMetres < 4000);

  // Route 2: Wuhan Yangtze River Bridge Cross: Hanyang Turtle Hill ([114.284, 30.551]) -> Wuchang Snake Hill ([114.300, 30.542])
  const p_hy_th = [114.284, 30.551];
  const p_wc_sh = [114.300, 30.542];
  const r2 = findFoodRoadRoute(router, p_hy_th, p_wc_sh);
  assert.equal(r2.status, 'ready');
  assert(r2.distanceMetres > 1400 && r2.distanceMetres < 2200);

  // Route 3: Jianghan Bridge: Hankou Yanjiang ([114.282, 30.567]) -> Hanyang ([114.280, 30.558])
  const p_hk_jh = [114.282, 30.567];
  const p_hy_jh = [114.280, 30.558];
  const r3 = findFoodRoadRoute(router, p_hk_jh, p_hy_jh);
  assert.equal(r3.status, 'ready');
  assert(r3.distanceMetres > 800 && r3.distanceMetres < 2000);

  // Route 4: Wuchang Liangdao Street ([114.312, 30.547]) to Chuhe Hanjie ([114.341, 30.557])
  const p_lds = [114.312, 30.547];
  const p_hanjie = [114.341, 30.557];
  const r4 = findFoodRoadRoute(router, p_lds, p_hanjie);
  assert.equal(r4.status, 'ready');
  assert(r4.distanceMetres > 3000 && r4.distanceMetres < 5500);

  // Route 5: New shops route: Jiqing Street ([114.28503, 30.58699]) -> Miaoli Road ([114.28518, 30.59948])
  const p_jiqing = [114.28503, 30.58699];
  const p_miaoli = [114.28518, 30.59948];
  const r5 = findFoodRoadRoute(router, p_jiqing, p_miaoli);
  assert.equal(r5.status, 'ready');
  assert(r5.distanceMetres > 1200 && r5.distanceMetres < 2200);

  // Route 6: Long cross-river route: Jiqing Street Hankou ([114.28503, 30.58699]) -> Enshi Street Qingshan ([114.3995, 30.62356])
  const p_enshi = [114.3995, 30.62356];
  const r6 = findFoodRoadRoute(router, p_jiqing, p_enshi);
  assert.equal(r6.status, 'ready');
  assert(r6.distanceMetres > 11000 && r6.distanceMetres < 16000);

  // Route 7: Outside network point fails gracefully
  const r_outside = findFoodRoadRoute(router, [115.5, 31.5], p_wsy);
  assert.equal(r_outside.status, 'unavailable');
  assert.equal(r_outside.reason, 'outside-network');

  return {
    shopToShopXiaowuToChangdi: `${Math.round(r_shops.distanceMetres)}m`,
    jiqingToMiaoli: `${Math.round(r5.distanceMetres)}m`,
    jiqingToEnshiCrossRiver: `${Math.round(r6.distanceMetres)}m`,
    wansongyuanToJianghanRoad: `${Math.round(r1.distanceMetres)}m`,
    yangtzeRiverBridgeCross: `${Math.round(r2.distanceMetres)}m`,
    jianghanBridgeCross: `${Math.round(r3.distanceMetres)}m`,
    liangdaoToChuheHanjie: `${Math.round(r4.distanceMetres)}m`
  };
});

// 7. Multi-city catalog loading & non-collision
await check('7. allCityCatalogs loads all 6 cities without ID collision', async () => {
  const catalogs = await allCityCatalogs(root);
  assert.equal(catalogs.length, 6, `Expected 6 cities, got ${catalogs.length}`);
  const cities = catalogs.map(c => c.cityId);
  assert.deepEqual(cities.sort(), ['changsha', 'chaoshan', 'chongqing', 'liuzhou', 'nanjing', 'wuhan'].sort());
  const wuhanCat = catalogs.find(c => c.cityId === 'wuhan');
  assert(wuhanCat, 'Wuhan catalog loaded successfully');
  assert.equal(wuhanCat.catalog.sources.length, 4);
  const totalSegs = wuhanCat.catalog.sources.reduce((acc, s) => acc + s.segments.length, 0);
  assert.equal(totalSegs, 12);
  const allSegs = wuhanCat.catalog.sources.flatMap(s => s.segments);
  const located = allSegs.filter(s => s.coordinates !== null);
  const unlocated = allSegs.filter(s => s.locationStatus === 'unlocated');
  const outOfBounds = allSegs.filter(s => s.locationStatus === 'out-of-bounds');
  assert.equal(located.length, 9);
  assert.equal(unlocated.length, 2);
  assert.equal(outOfBounds.length, 1);
  return { totalCities: catalogs.length, cities, wuhanSources: 4, wuhanSegments: 12, located: 9, unlocated: 2, outOfBounds: 1 };
});

// 8. Global video posters preservation & merge
await check('8. Global video-posters.json and built library assets retain all existing city posters and include Wuhan', async () => {
  const globalPosters = JSON.parse(await readFile('data/video-posters.json', 'utf8'));
  const count = Object.keys(globalPosters.segments).length;
  assert.equal(count, 387, `Expected 387 posters in global index (375 existing + 12 Wuhan), got ${count}`);
  
  const distAssets = JSON.parse(await readFile('dist/data/video-library-assets.json', 'utf8'));
  const distCount = Object.keys(distAssets.segments).length;
  assert.equal(distCount, 482, `Expected 482 total posters compiled into dist/data/video-library-assets.json (470 existing + 12 Wuhan), got ${distCount}`);

  return { globalPostersCount: count, distLibraryAssetsCount: distCount };
});

// 9. Built artifacts check
await check('9. Built HTML pages and single-file preview exist and are valid', async () => {
  const preview = await readFile('dist/preview-wuhan.html', 'utf8');
  assert(preview.includes('window.__FOOD_CITY_BUNDLE__'));
  assert(preview.includes('"cityId":"wuhan"'));

  const places = await readFile('dist/places-wuhan.html', 'utf8');
  assert(places.includes('武汉 · 视频里的门店'));
  assert(places.includes('?city=wuhan&amp;view=food'));

  const videos = await readFile('dist/videos-wuhan.html', 'utf8');
  assert(videos.includes('武汉 · 探店视频来源'));
  assert(videos.includes('?city=wuhan&amp;view=food&amp;videos=1'));

  return { previewSize: preview.length, placesSize: places.length, videosSize: videos.length };
});

console.log(`\nVerification finished: ${checks.filter(c => c.passed).length}/${checks.length} passed.`);
const outPath = path.join(root, '../output/research/wuhan/wuhan-base-qa-20261114.json');
await writeFile(outPath, JSON.stringify(checks, null, 2) + '\n', 'utf8');

if (checks.some(c => !c.passed)) {
  process.exitCode = 1;
}
