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
const requireBundles = process.argv.includes('--require-bundles');
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

await check('1. config/cities.json includes valid nanchang entry preserving existing cities and activeCity=chongqing', async () => {
  const content = JSON.parse(await readFile(path.join(root, 'config/cities.json'), 'utf8'));
  const nc = content.cities.nanchang;
  assert(nc, 'nanchang key exists');
  assert.equal(nc.name, '南昌');
  assert.equal(nc.amapCityCode, '360100');
  assert.deepEqual(nc.bounds, [115.77, 28.58, 116.01, 28.76]);
  assert.deepEqual(nc.center, [115.89, 28.68]);
  assert.equal(nc.tiles, 'data/cities/nanchang/nanchang.pmtiles');
  assert.equal(content.activeCity, 'chongqing', 'activeCity preserved as chongqing');
  for (const id of ['chongqing', 'changsha', 'liuzhou', 'nanjing', 'chaoshan', 'wuhan', 'zhengzhou', 'harbin', 'chengdu']) {
    assert(content.cities[id], `${id} preserved`);
  }
  return { nanchangConfig: nc };
});

await check('2. data/cities/nanchang/nanchang.pmtiles exists, size and sha256 match manifest', async () => {
  const bytes = await readFile(path.join(root, 'data/cities/nanchang/nanchang.pmtiles'));
  const meta = JSON.parse(await readFile(path.join(root, 'data/cities/nanchang/source-manifest.json'), 'utf8'));
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  assert.equal(bytes.length, meta.bytes);
  assert.equal(sha256, meta.sha256);
  return { bytes: bytes.length, sha256 };
});

await check('3. data/cities/nanchang/data-audit.json verifies all 460 tiles extracted', async () => {
  const audit = JSON.parse(await readFile(path.join(root, 'data/cities/nanchang/data-audit.json'), 'utf8'));
  assert.equal(audit.counters.requestedTiles, 460);
  assert.equal(audit.counters.presentTiles, 460);
  assert(audit.checks.everyRequestedTilePresent);
  assert(audit.checks.finiteAndClippedSearchBoundsAndAnchors);
  return { requestedTiles: audit.counters.requestedTiles, presentTiles: audit.counters.presentTiles };
});

await check('4. data/cities/nanchang/roads-index.json has valid groups within bounds', async () => {
  const roads = JSON.parse(await readFile(path.join(root, 'data/cities/nanchang/roads-index.json'), 'utf8'));
  assert(roads.roads.length >= 2000, `Expected >=2000 road groups, got ${roads.roads.length}`);
  assert.deepEqual(roads.bounds, [115.77, 28.58, 116.01, 28.76]);
  assert(roads.roads.some(r => r.name === '大士院街'), '大士院街 in roads index');
  assert(roads.roads.some(r => r.name === '珠宝街'), '珠宝街 in roads index');
  assert(roads.roads.some(r => r.name === '金融大街'), '金融大街 in roads index');
  return { roadCount: roads.roads.length };
});

await check('5. food-road-network.json and manifest have strict LF line endings, valid SHA256, and main-component routing', async () => {
  const bytes = await readFile(path.join(root, 'data/cities/nanchang/food-road-network.json'));
  const manBytes = await readFile(path.join(root, 'data/cities/nanchang/food-road-network-manifest.json'));
  assert(!bytes.includes(Buffer.from('\r\n')), 'Road network JSON must not contain CRLF');
  assert(!manBytes.includes(Buffer.from('\r\n')), 'Road network manifest must not contain CRLF');

  const manifest = JSON.parse(manBytes.toString('utf8'));
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  assert.equal(bytes.length, manifest.bytes);
  assert.equal(sha256, manifest.networkSHA256);

  const net = JSON.parse(bytes.toString('utf8'));
  assert.equal(net.city, 'nanchang');
  assert.equal(net.nodes.length, manifest.nodes);
  assert.equal(net.ways.length, manifest.ways);

  const router = buildFoodRoadRouter(net);
  // Route across Ganjiang: 小罗子汤店（大士院） -> 椿椒（万象天地）
  const routeCrossRiver = findFoodRoadRoute(router, [115.8805, 28.6879], [115.8468, 28.6895]);
  assert.equal(routeCrossRiver.status, 'ready', 'Cross-Ganjiang route must be ready');
  assert(routeCrossRiver.distanceMetres > 3000 && routeCrossRiver.distanceMetres < 9000, `Unexpected cross-river distance ${routeCrossRiver.distanceMetres}`);
  assert.equal(nearestRoadSnaps(router, [114.0, 27.0], 250).length, 0, 'Faraway point must not snap');
  return { nodes: net.nodes.length, ways: net.ways.length, crossRiverMetres: Math.round(routeCrossRiver.distanceMetres) };
});

await check('6. video-library.json validates 8 sources, 60 segments, 49 in-bounds anchors (40 unique places, 100% connected), 1 out-of-bounds, 10 unlocated', async () => {
  const catalog = JSON.parse(await readFile(path.join(root, 'data/cities/nanchang/video-library.json'), 'utf8'));
  const validated = validateVideoLibrary(catalog, 'nanchang');
  assert.equal(validated.sources.length, 8, 'Must have 8 sources');
  const allSegments = validated.sources.flatMap(s => s.segments);
  assert.equal(allSegments.length, 60, 'Must have 60 segments');
  const authors = new Set(validated.sources.map(s => s.author));
  assert.equal(authors.size, 8, 'Must have 8 distinct authors');

  // Verify 2024 video has footageNote
  const straw = validated.sources.find(s => s.id === 'nc-yituoxiaocaomei-7370304732994342181');
  assert(straw.segments.every(s => typeof s.footageNote === 'string' && s.footageNote.includes('2024')), '2024 source segments must have footageNote');

  const bounds = [115.77, 28.58, 116.01, 28.76];
  const groups = groupVideoPlaces(catalog);
  assert.equal(groups.length, 51, '51 distinct places (40 in-bounds + 1 out-of-bounds + 10 unlocated)');
  const multiCreator = groups.filter(g => g.clips.length > 1);
  assert.equal(multiCreator.length, 9, 'Must have 9 cross-creator merged places');
  const inBounds = allSegments.filter(s => withinMapBounds(s, bounds));
  assert.equal(inBounds.length, 49, 'Must have 49 in-bounds stops across 40 unique places');
  const outOrNull = allSegments.filter(s => !withinMapBounds(s, bounds));
  assert.equal(outOrNull.length, 11, 'Must have 1 out-of-bounds + 10 unlocated segments');
  assert.equal(outOrNull.filter(s => s.locationStatus === 'out-of-bounds' && Array.isArray(s.coordinates) && s.coordinates[1] < 28.58).length, 1);
  assert.equal(outOrNull.filter(s => s.locationStatus === 'unlocated' && s.coordinates === null).length, 10);

  const net = JSON.parse(await readFile(path.join(root, 'data/cities/nanchang/food-road-network.json'), 'utf8'));
  const router = buildFoodRoadRouter(net);
  const wayMap = new Map(net.ways.map(w => [w.id, w]));
  const distMetres = (a, b) => {
    const lat = ((a[1] + b[1]) / 2) * Math.PI / 180;
    return Math.hypot((b[0] - a[0]) * 111320 * Math.cos(lat), (b[1] - a[1]) * 110540);
  };

  for (const s of inBounds) {
    const a = s.planningLocation?.anchor;
    assert(a && typeof a.id === 'number' && typeof a.nodeId === 'number', `Numeric way/nodeId required for ${s.id}`);
    assert.notEqual(a.id, a.nodeId, `nodeId !== wayId for ${s.id}`);
    const w = wayMap.get(a.id);
    assert(w && w.nodes.includes(a.nodeId), `nodeId ${a.nodeId} must belong to way ${a.id} for ${s.id}`);
    const nodeObj = router.graph.nodes.get(a.nodeId);
    assert(nodeObj, `nodeId ${a.nodeId} in router graph for ${s.id}`);
    const d = distMetres(s.coordinates, nodeObj.point);
    assert(d <= 300, `Anchor distance ${d.toFixed(1)}m > 300m for ${s.id}`);
    const rt = findFoodRoadRoute(router, s.coordinates, [115.8851, 28.6779]);
    assert.equal(rt.status, 'ready', `Stop ${s.id} must route to main component without disconnection`);
  }

  if (requireBundles) {
    const bundles = JSON.parse(await readFile(path.join(root, 'data/media-bundles.json'), 'utf8'));
    for (const src of validated.sources) {
      const b = bundles.sources.find(item => item.city === 'nanchang' && item.sourceId === src.id);
      assert(b && b.clips === src.segments.length && b.url.startsWith('https://github.com/'), `media-bundles entry required for ${src.id}`);
    }
  }
  return { sources: validated.sources.length, segments: allSegments.length, inBounds: inBounds.length, outOrNull: outOrNull.length };
});

await check('7. video-posters.json records all 60 posters matching disk SHA256 and bytes', async () => {
  const postersData = JSON.parse(await readFile(path.join(root, 'data/cities/nanchang/video-posters.json'), 'utf8'));
  const entries = Object.entries(postersData.segments);
  assert.equal(entries.length, 60, 'Must have 60 poster entries');
  for (const [segId, entry] of entries) {
    const bytes = await readFile(path.join(root, entry.path));
    assert.equal(bytes.length, entry.bytes, `Poster size mismatch for ${segId}`);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), entry.sha256, `Poster SHA256 mismatch for ${segId}`);
  }
  return { posterCount: entries.length };
});

await check('8. allCityCatalogs passes without duplicate IDs across all 10 cities', async () => {
  const catalogs = await allCityCatalogs(root);
  assert.equal(catalogs.length, 10, `Expected 10 cities, got ${catalogs.length}`);
  assert(catalogs.some(c => c.cityId === 'nanchang'));
  return { cities: catalogs.map(c => c.cityId) };
});

const passed = checks.filter(c => c.passed).length;
console.log(`\nNanchang Data Review Summary: ${passed}/${checks.length} passed.`);
if (passed !== checks.length) process.exitCode = 1;
