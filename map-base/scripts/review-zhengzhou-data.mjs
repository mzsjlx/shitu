import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFoodRoadRouter, findFoodRoadRoute, nearestRoadSnaps } from '../src/food-road-router.js';
import { validateVideoLibrary } from '../src/video-library-model.js';
import { withinMapBounds, groupVideoPlaces } from '../src/video-places.js';
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
  assert(content.cities.wuhan, 'wuhan preserved');
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
await check('7. food-road-router calculates genuine Zhengzhou routes and distance between food stops', async () => {
  const net = JSON.parse(await readFile(path.join(root, 'data/cities/zhengzhou/food-road-network.json'), 'utf8'));
  const router = buildFoodRoadRouter(net);
  assert(router.segments.length > 50000, `Expected >50000 road segments, got ${router.segments.length}`);
  
  // Route 1: 知青老食堂 (沙口路) 到 老蔡记蒸饺 (德化美食街)
  const p1 = [113.6353, 34.7689];
  const p2 = [113.6625, 34.7505];
  const route1 = findFoodRoadRoute(router, p1, p2);
  assert.equal(route1.status, 'ready', 'Route 1 must be ready');
  assert(route1.distanceMetres > 3000 && route1.distanceMetres < 7000, `Expected 3km-7km, got ${route1.distanceMetres}`);
  assert(route1.coordinates.length >= 10, 'Route coordinates present');
  
  // Route 2: 老蔡记 到 合记烩面 (人民路丹尼斯旁)
  const p3 = [113.6625, 34.7505];
  const p4 = [113.6705, 34.7575];
  const route2 = findFoodRoadRoute(router, p3, p4);
  assert.equal(route2.status, 'ready', 'Route 2 must be ready');
  assert(route2.distanceMetres > 900 && route2.distanceMetres < 2500, `Expected 900m-2500m, got ${route2.distanceMetres}`);

  // Out of reach test: point beyond 250m max snap distance returns empty
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
await check('8. data/cities/zhengzhou/video-library.json validates cleanly with 13 user sources and 56 segments', async () => {
  const raw = await readFile(path.join(root, 'data/cities/zhengzhou/video-library.json'), 'utf8');
  const catalog = JSON.parse(raw);
  const validated = validateVideoLibrary(catalog, 'zhengzhou');
  assert.equal(validated.city, 'zhengzhou');
  assert.equal(validated.sources.length, 13, 'Must have 13 sources from user batches');
  
  const allSegments = validated.sources.flatMap(s => s.segments);
  assert.equal(allSegments.length, 56, 'Must have 56 total segments');
  
  const authors = new Set(validated.sources.map(s => s.author));
  assert.equal(authors.size, 13, 'Must have 13 distinct authors');
  
  // Multi-creator deduplication check: 合记烩面
  const hejiSegments = allSegments.filter(s => s.name.includes('合记烩面'));
  assert.equal(hejiSegments.length, 2, '合记烩面 must have 2 segments from 2 creators');
  const secondaryHeji = hejiSegments.find(s => s.placeId);
  assert.equal(secondaryHeji.placeId, 'zz-shiwu-heji', 'Secondary heji must point to primary zz-shiwu-heji');

  // Multi-creator deduplication check: 唐风阁肉夹馍
  const tangfenggeSegments = allSegments.filter(s => s.name.includes('唐风阁肉夹馍'));
  assert.equal(tangfenggeSegments.length, 2, '唐风阁肉夹馍 must have 2 segments from 2 creators');
  const secondaryTangfengge = tangfenggeSegments.find(s => s.placeId);
  assert.equal(secondaryTangfengge.placeId, 'zz-lijiongjiong-tangfengge', 'Secondary tangfengge must point to primary zz-lijiongjiong-tangfengge');

  // Single-creator multi-clip check: 石记百花面鱼 / 炒凉粉
  const shijiSegments = allSegments.filter(s => s.id === 'zz-maikou-shiji' || s.id === 'zz-maikou-chaoliangfen');
  assert.equal(shijiSegments.length, 2, '石记百花面鱼 and 炒凉粉 must share location');
  const secondaryShiji = shijiSegments.find(s => s.placeId);
  assert.equal(secondaryShiji.placeId, 'zz-maikou-shiji');

  // Single-creator multi-clip check: 农大牛奶 / 酸奶卷
  const nongdaSegments = allSegments.filter(s => s.id === 'zz-maikou-nongda-niunai' || s.id === 'zz-maikou-nongda-suannaijuan');
  assert.equal(nongdaSegments.length, 2, '农大牛奶 and 酸奶卷 must share location');
  const secondaryNongda = nongdaSegments.find(s => s.placeId);
  assert.equal(secondaryNongda.placeId, 'zz-maikou-nongda-niunai');

  // Groups and stops check
  const bounds = [113.58, 34.7, 113.78, 34.83];
  const groups = groupVideoPlaces(catalog);
  assert.equal(groups.length, 52, '56 segments deduplicate into 52 places');
  
  const inBoundsGroups = groups.filter(g => withinMapBounds(g.primary.segment, bounds));
  assert.equal(inBoundsGroups.length, 50, 'Must have 50 in-bounds distinct map stops');
  
  const outOfBoundsSegments = allSegments.filter(s => !withinMapBounds(s, bounds));
  assert.equal(outOfBoundsSegments.length, 2, 'Must have 2 out-of-bounds segments (换利小吃 & 郑三指固始鹅块)');
  
  return {
    sources: validated.sources.length,
    segments: allSegments.length,
    authors: authors.size,
    dedupPlaces: groups.length,
    inBoundsMapStops: inBoundsGroups.length,
    outOfBoundsSegments: outOfBoundsSegments.length
  };
});

// 9. Poster files existence and SHA256 integrity
await check('9. data/cities/zhengzhou/video-posters.json records all 56 posters matching disk files', async () => {
  const postersData = JSON.parse(await readFile(path.join(root, 'data/cities/zhengzhou/video-posters.json'), 'utf8'));
  const segments = Object.entries(postersData.segments);
  assert.equal(segments.length, 56, 'Must have 56 poster entries');
  
  for (const [segId, entry] of segments) {
    const filePath = path.join(root, entry.path);
    const bytes = await readFile(filePath);
    const sha = crypto.createHash('sha256').update(bytes).digest('hex');
    assert.equal(sha, entry.sha256, `Poster hash mismatch for ${segId}`);
    assert.equal(bytes.length, entry.bytes, `Poster size mismatch for ${segId}`);
  }
  return { posterCount: segments.length };
});

// 10. All city catalogs check
await check('10. allCityCatalogs passes without duplicate source or segment IDs across all 7 cities', async () => {
  const catalogs = await allCityCatalogs(root);
  const zz = catalogs.find(c => c.cityId === 'zhengzhou');
  assert(zz, 'zhengzhou catalog loaded');
  assert.equal(catalogs.length, 7, `Expected 7 cities, got ${catalogs.length}`);
  return { cities: catalogs.map(c => c.cityId) };
});

const passed = checks.filter(c => c.passed).length;
console.log(`\nZhengzhou Data Review Summary: ${passed}/${checks.length} passed.`);
if (passed !== checks.length) {
  process.exitCode = 1;
}
