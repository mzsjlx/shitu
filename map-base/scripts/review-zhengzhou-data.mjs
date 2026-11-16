import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFoodRoadRouter, findFoodRoadRoute, nearestRoadSnaps } from '../src/food-road-router.js';
import { validateVideoLibrary } from '../src/video-library-model.js';
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
await check('1. config/cities.json includes valid zhengzhou entry preserving existing cities', async () => {
  const content = JSON.parse(await readFile(path.join(root, 'config/cities.json'), 'utf8'));
  const zz = content.cities.zhengzhou;
  assert(zz, 'zhengzhou key exists');
  assert.equal(zz.name, '郑州');
  assert.equal(zz.amapCityCode, '410100');
  assert.deepEqual(zz.bounds, [113.58, 34.7, 113.78, 34.83]);
  assert.deepEqual(zz.center, [113.665, 34.753]);
  assert.equal(zz.tiles, 'data/cities/zhengzhou/zhengzhou.pmtiles');
  assert.equal(content.activeCity, 'chongqing', 'activeCity preserved as chongqing');
  assert(content.cities.chongqing, 'chongqing preserved');
  assert(content.cities.changsha, 'changsha preserved');
  assert(content.cities.liuzhou, 'liuzhou preserved');
  assert(content.cities.nanjing, 'nanjing preserved');
  assert(content.cities.chaoshan, 'chaoshan preserved');
  return { zhengzhouConfig: zz };
});

// 2. PMTiles file check
await check('2. data/cities/zhengzhou/zhengzhou.pmtiles exists, size and sha256 match manifest', async () => {
  const bytes = await readFile(path.join(root, 'data/cities/zhengzhou/zhengzhou.pmtiles'));
  const meta = JSON.parse(await readFile(path.join(root, 'data/cities/zhengzhou/source-manifest.json'), 'utf8'));
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  assert.equal(bytes.length, meta.bytes);
  assert.equal(sha256, meta.sha256);
  assert.equal(bytes.length, 4171880);
  assert.equal(sha256, 'd0c92b0598b8549627aaea9d0919efe348d9166e5242eebc538c6dde52c99a71');
  return { bytes: bytes.length, sha256 };
});

// 3. Data audit check
await check('3. data/cities/zhengzhou/data-audit.json verifies all 285 tiles extracted', async () => {
  const audit = JSON.parse(await readFile(path.join(root, 'data/cities/zhengzhou/data-audit.json'), 'utf8'));
  assert.equal(audit.counters.requestedTiles, 285);
  assert.equal(audit.counters.presentTiles, 285);
  assert(audit.counters.roadLineFragments > 4000);
  assert(audit.counters.buildingPolygonFragments > 18000);
  return { requestedTiles: audit.counters.requestedTiles, presentTiles: audit.counters.presentTiles };
});

// 4. Roads index check
await check('4. data/cities/zhengzhou/roads-index.json has valid groups within bounds', async () => {
  const roads = JSON.parse(await readFile(path.join(root, 'data/cities/zhengzhou/roads-index.json'), 'utf8'));
  assert(roads.roads.length >= 600, `Expected >=600 road groups, got ${roads.roads.length}`);
  const [minLng, minLat, maxLng, maxLat] = roads.bounds;
  assert.equal(minLng, 113.58);
  assert.equal(minLat, 34.7);
  assert.equal(maxLng, 113.78);
  assert.equal(maxLat, 34.83);
  return { roadCount: roads.roads.length, bounds: roads.bounds };
});

// 5. Road network data check and LF line endings check
await check('5. data/cities/zhengzhou/food-road-network.json has valid topological nodes and ways with strict LF line endings', async () => {
  const bytes = await readFile(path.join(root, 'data/cities/zhengzhou/food-road-network.json'));
  const manifest = JSON.parse(await readFile(path.join(root, 'data/cities/zhengzhou/food-road-network-manifest.json'), 'utf8'));
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  assert.equal(bytes.length, manifest.bytes);
  assert.equal(sha256, manifest.networkSHA256);
  assert.equal(bytes.length, 4184356);
  assert.equal(sha256, '42840c5cecc8a4a9e973c9f9893d81bba134d406c1e60869b4a46bda5525f70e');
  
  // LF line ending verification
  assert(!bytes.includes(Buffer.from('\r\n')), 'Road network JSON must not contain CRLF');
  
  const net = JSON.parse(bytes.toString('utf8'));
  assert.equal(net.city, 'zhengzhou');
  assert.equal(net.nodes.length, manifest.nodes);
  assert.equal(net.ways.length, manifest.ways);
  assert.equal(net.nodes.length, 64780);
  assert.equal(net.ways.length, 10536);
  
  return {
    nodes: net.nodes.length,
    ways: net.ways.length,
    bytes: bytes.length,
    sha256
  };
});

// 6. Terrain data check
await check('6. data/cities/zhengzhou/terrain-manifest.json and 97 DEM tiles exist', async () => {
  const manifest = JSON.parse(await readFile(path.join(root, 'data/cities/zhengzhou/terrain-manifest.json'), 'utf8'));
  assert.equal(manifest.tiles.length, 97);
  let totalBytes = 0;
  for (const t of manifest.tiles) {
    const tilePath = path.join(root, `data/cities/zhengzhou/terrain/${t.z}/${t.x}/${t.y}.png`);
    const b = await readFile(tilePath);
    totalBytes += b.length;
    const h = crypto.createHash('sha256').update(b).digest('hex');
    assert.equal(h, t.sha256, `Tile ${t.z}/${t.x}/${t.y} sha mismatch`);
  }
  return { tileCount: manifest.tiles.length, totalBytes };
});

// 7. Router connectivity test on real Zhengzhou streets
await check('7. food-road-router calculates genuine Zhengzhou routes and distance', async () => {
  const net = JSON.parse(await readFile(path.join(root, 'data/cities/zhengzhou/food-road-network.json'), 'utf8'));
  const router = buildFoodRoadRouter(net);
  assert(router.segments.length > 50000, `Expected >50000 road segments, got ${router.segments.length}`);
  
  // Route 1: Erqi Square to Dashanghai City (二七广场到大上海城)
  const p1 = [113.665, 34.753];
  const p2 = [113.670, 34.758];
  const route1 = findFoodRoadRoute(router, p1, p2);
  assert.equal(route1.status, 'ready', 'Route 1 must be ready');
  assert(route1.distanceMetres > 400 && route1.distanceMetres < 1500, `Expected 400m-1500m, got ${route1.distanceMetres}`);
  assert(route1.coordinates.length >= 2, 'Route coordinates present');
  
  // Route 2: Guomao 360 to Nongke Road (国贸360到农科路酒吧美食街)
  const p3 = [113.680, 34.783];
  const p4 = [113.685, 34.790];
  const route2 = findFoodRoadRoute(router, p3, p4);
  assert.equal(route2.status, 'ready', 'Route 2 must be ready');
  assert(route2.distanceMetres > 500 && route2.distanceMetres < 2000, `Expected 500m-2000m, got ${route2.distanceMetres}`);

  // Out of reach test: point beyond 250m max snap distance returns null
  const faraway = [112.0, 33.0];
  const snaps = nearestRoadSnaps(router, faraway, 250);
  assert.equal(snaps.length, 0, 'Faraway point must not snap');

  return {
    route1Distance: route1.distanceMetres,
    route2Distance: route2.distanceMetres,
    segments: router.segments.length
  };
});

// 8. Video library validation check
await check('8. data/cities/zhengzhou/video-library.json validates cleanly with 0 fabricated stores', async () => {
  const raw = await readFile(path.join(root, 'data/cities/zhengzhou/video-library.json'), 'utf8');
  const catalog = JSON.parse(raw);
  const validated = validateVideoLibrary(catalog, 'zhengzhou');
  assert.equal(validated.city, 'zhengzhou');
  assert.equal(validated.sources.length, 0, '0 sources initially, strictly waiting for user links');
  return { status: 'Clean video library awaiting user intake', sourceCount: validated.sources.length };
});

// 9. All city catalogs check
await check('9. allCityCatalogs passes without duplicate source or segment IDs across all cities', async () => {
  const catalogs = await allCityCatalogs(root);
  const zz = catalogs.find(c => c.cityId === 'zhengzhou');
  assert(zz, 'zhengzhou catalog loaded');
  assert.equal(catalogs.length, 6, `Expected 6 cities, got ${catalogs.length}`);
  return { cities: catalogs.map(c => c.cityId) };
});

const passed = checks.filter(c => c.passed).length;
console.log(`\nZhengzhou Data Review Summary: ${passed}/${checks.length} passed.`);
if (passed !== checks.length) {
  process.exitCode = 1;
}
