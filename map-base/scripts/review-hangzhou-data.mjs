import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFoodRoadRouter, findFoodRoadRoute } from '../src/food-road-router.js';
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
await check('1. config/cities.json includes valid hangzhou entry preserving all 9 existing cities', async () => {
  const content = JSON.parse(await readFile(path.join(root, 'config/cities.json'), 'utf8'));
  const hz = content.cities.hangzhou;
  assert(hz, 'hangzhou key exists');
  assert.equal(hz.name, '杭州');
  assert.equal(hz.amapCityCode, '330100');
  assert.deepEqual(hz.bounds, [120.1, 30.2, 120.24, 30.34]);
  assert.deepEqual(hz.center, [120.165, 30.26]);
  assert.equal(hz.tiles, 'data/cities/hangzhou/hangzhou.pmtiles');
  assert.equal(content.activeCity, 'chongqing', 'activeCity preserved as chongqing');
  for (const existing of ['chongqing', 'changsha', 'liuzhou', 'nanjing', 'chaoshan', 'wuhan', 'zhengzhou', 'harbin', 'chengdu']) {
    assert(content.cities[existing], `${existing} preserved`);
  }
  return { hangzhouConfig: hz };
});

// 2. PMTiles file check
await check('2. data/cities/hangzhou/hangzhou.pmtiles exists, size and sha256 match manifest', async () => {
  const bytes = await readFile(path.join(root, 'data/cities/hangzhou/hangzhou.pmtiles'));
  const meta = JSON.parse(await readFile(path.join(root, 'data/cities/hangzhou/source-manifest.json'), 'utf8'));
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  assert.equal(bytes.length, meta.bytes);
  assert.equal(sha256, meta.sha256);
  assert.equal(bytes.length, 7652131);
  assert.equal(sha256, 'adf09dcd01846fd36b97cc641af7c713a49812dbcc8fe2101d413d5142007b31');
  return { bytes: bytes.length, sha256 };
});

// 3. Data audit check
await check('3. data/cities/hangzhou/data-audit.json verifies all 414 tiles extracted', async () => {
  const audit = JSON.parse(await readFile(path.join(root, 'data/cities/hangzhou/data-audit.json'), 'utf8'));
  assert.equal(audit.counters.requestedTiles, 414);
  assert.equal(audit.counters.presentTiles, 414);
  assert.equal(audit.counters.namedRoadGroups, 1479);
  return { requestedTiles: audit.counters.requestedTiles, presentTiles: audit.counters.presentTiles };
});

// 4. Roads index check
await check('4. data/cities/hangzhou/roads-index.json has valid groups within bounds', async () => {
  const roads = JSON.parse(await readFile(path.join(root, 'data/cities/hangzhou/roads-index.json'), 'utf8'));
  assert(roads.roads.length >= 1400, `Expected >=1400 road groups, got ${roads.roads.length}`);
  assert.deepEqual(roads.bounds, [120.1, 30.2, 120.24, 30.34]);
  return { roadCount: roads.roads.length, bounds: roads.bounds };
});

// 5. Road network data check and LF line endings check
await check('5. data/cities/hangzhou/food-road-network.json & .gitattributes enforce strict LF and manifest parity', async () => {
  const gitattr = await readFile(path.join(root, '../.gitattributes'), 'utf8');
  assert(gitattr.includes('map-base/data/cities/hangzhou/food-road-network.json text eol=lf'), 'road network LF locked');
  assert(gitattr.includes('map-base/data/cities/hangzhou/food-road-network-manifest.json text eol=lf'), 'manifest LF locked');

  const bytes = await readFile(path.join(root, 'data/cities/hangzhou/food-road-network.json'));
  const manifest = JSON.parse(await readFile(path.join(root, 'data/cities/hangzhou/food-road-network-manifest.json'), 'utf8'));
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  assert.equal(bytes.length, manifest.bytes);
  assert.equal(sha256, manifest.networkSHA256);
  assert.equal(bytes.length, 7243708);
  assert.equal(sha256, 'b46bc7b76dedba95f6bbac77e9da780617033ebf8b73d779390317a49067b0bf');
  assert(!bytes.includes(Buffer.from('\r\n')), 'Road network JSON must not contain CRLF');

  const net = JSON.parse(bytes.toString('utf8'));
  assert.equal(net.city, 'hangzhou');
  assert.equal(net.nodes.length, manifest.nodes);
  assert.equal(net.ways.length, manifest.ways);
  return { nodes: net.nodes.length, ways: net.ways.length, bytes: bytes.length, sha256 };
});

// 6. Genuine Food Road Routing test
await check('6. food-road-router calculates genuine Hangzhou routes between placed stores', async () => {
  const net = JSON.parse(await readFile(path.join(root, 'data/cities/hangzhou/food-road-network.json'), 'utf8'));
  const router = buildFoodRoadRouter(net);

  const p_chunya = [120.1601, 30.2558];
  const p_juemeijia = [120.1625, 30.2691];
  const p_baijia = [120.1706, 30.2458];
  const p_jinzhongbang = [120.1503, 30.2185];
  const p_chuanwei = [120.1332, 30.2796];

  const r1 = findFoodRoadRoute(router, p_chunya, p_juemeijia);
  assert.equal(r1.status, 'ready');
  assert(r1.distanceMetres > 1400 && r1.distanceMetres < 2200, `Expected 1.4-2.2km, got ${r1.distanceMetres}m`);

  const r2 = findFoodRoadRoute(router, p_chunya, p_baijia);
  assert.equal(r2.status, 'ready');
  assert(r2.distanceMetres > 1600 && r2.distanceMetres < 2600, `Expected 1.6-2.6km, got ${r2.distanceMetres}m`);

  const r3 = findFoodRoadRoute(router, p_baijia, p_jinzhongbang);
  assert.equal(r3.status, 'ready');
  assert(r3.distanceMetres > 3500 && r3.distanceMetres < 5500, `Expected 3.5-5.5km, got ${r3.distanceMetres}m`);

  const r4 = findFoodRoadRoute(router, p_chuanwei, p_chunya);
  assert.equal(r4.status, 'ready');
  assert(r4.distanceMetres > 3500 && r4.distanceMetres < 6000, `Expected 3.5-6.0km, got ${r4.distanceMetres}m`);

  const r_outside = findFoodRoadRoute(router, [115.5, 31.5], p_chunya);
  assert.equal(r_outside.status, 'unavailable');
  assert.equal(r_outside.reason, 'outside-network');

  return {
    chunyaToJuemeijia: `${Math.round(r1.distanceMetres)}m`,
    chunyaToBaijia: `${Math.round(r2.distanceMetres)}m`,
    baijiaToJinzhongbang: `${Math.round(r3.distanceMetres)}m`,
    chuanweiToChunya: `${Math.round(r4.distanceMetres)}m`
  };
});

// 7. City profile check
await check('7. data/cities/hangzhou/city-profile.json exists and matches config', async () => {
  const profile = JSON.parse(await readFile(path.join(root, 'data/cities/hangzhou/city-profile.json'), 'utf8'));
  assert.equal(profile.city, 'hangzhou');
  assert.equal(profile.amapCityCode, '330100');
  assert.deepEqual(profile.bounds, [120.1, 30.2, 120.24, 30.34]);
  return { profileCity: profile.city };
});

// 8. Video library schema, merges, OSM anchors, connected-component routing & media-bundles parity
await check('8. video-library.json passes schema, merges, integer OSM anchors, main-component routing, and media-bundles parity', async () => {
  const catalog = JSON.parse(await readFile(path.join(root, 'data/cities/hangzhou/video-library.json'), 'utf8'));
  const validated = validateVideoLibrary(catalog, 'hangzhou');
  const allSegments = validated.sources.flatMap(s => s.segments);
  const authors = new Set(validated.sources.map(s => s.author));

  assert.equal(validated.sources.length, 70, 'Must have 70 verified Douyin video sources');
  assert.equal(allSegments.length, 108, 'Must have 108 store segments');
  assert.equal(authors.size, 56, 'Must have 56 unique creators');

  // Merged multi-blogger places check (5 distinct venues across multiple videos)
  for (const [primaryId, secondaryId] of [
    ['hz-shiyi-jinzhongbang-sifangcai', 'hz-youyou-jinzhongbang'],
    ['hz-shiyi-baijia-jiweiguan', 'hz-shizhang-baijia-jiweiguan'],
    ['hz-gmnini-guihe-xiaoguan', 'hz-dadadawanzi-guihe-xiaoguan'],
    ['hz-wulala-wumingshi', 'hz-yikou-wumingshi-mianguan'],
    ['hz-dazhuan-wangji', 'hz-yeyeye-wangji-tiebanshao']
  ]) {
    const sec = allSegments.find(s => s.id === secondaryId);
    assert(sec && sec.placeId === primaryId, `${secondaryId} must merge to ${primaryId}`);
  }

  const bounds = [120.1, 30.2, 120.24, 30.34];
  const groups = groupVideoPlaces(catalog);
  assert.equal(groups.length, 103, '108 segments deduplicate into 103 places');
  const inBoundsSegments = allSegments.filter(seg => withinMapBounds(seg, bounds));
  const outOfBoundsSegments = allSegments.filter(seg => !withinMapBounds(seg, bounds));
  const inBoundsGroups = groups.filter(g => withinMapBounds(g.primary.segment, bounds));
  const outOfBoundsGroups = groups.filter(g => !withinMapBounds(g.primary.segment, bounds));
  assert.equal(inBoundsSegments.length, 86, 'Must have 86 in-bounds segments');
  assert.equal(outOfBoundsSegments.length, 22, 'Must have 22 out-of-bounds segments');
  assert.equal(inBoundsGroups.length, 82, 'Must have 82 in-bounds distinct map stops');
  assert.equal(outOfBoundsGroups.length, 21, 'Must have 21 out-of-bounds distinct places');

  // Verify every in-bounds segment has valid numeric OSM anchor and bidirectional main-component routing
  const net = JSON.parse(await readFile(path.join(root, 'data/cities/hangzhou/food-road-network.json'), 'utf8'));
  const router = buildFoodRoadRouter(net);
  const wayMap = new Map(net.ways.map(w => [w.id, w]));
  const refPoint = [120.1592, 30.2593];
  for (const s of inBoundsSegments) {
    assert.equal(s.routeEligible, false, `Segment ${s.id} routeEligible must be false`);
    const a = s.planningLocation?.anchor;
    assert(a && typeof a.id === 'number' && typeof a.nodeId === 'number', `Valid numeric anchor/nodeId for ${s.id}`);
    assert.equal(a.kind, 'osm-way', `anchor.kind must be osm-way for ${s.id}`);
    assert.notEqual(a.id, a.nodeId, `wayId must not equal nodeId for ${s.id}`);
    const w = wayMap.get(a.id);
    assert(w && w.nodes.includes(a.nodeId), `nodeId ${a.nodeId} must belong to way ${a.id} for ${s.id}`);
    assert(router.graph.nodes.has(a.nodeId), `nodeId ${a.nodeId} in network for ${s.id}`);
    const rt1 = findFoodRoadRoute(router, s.coordinates, refPoint);
    const rt2 = findFoodRoadRoute(router, refPoint, s.coordinates);
    assert.equal(rt1.status, 'ready', `Stop ${s.id} outbound route must be ready on main component`);
    assert.equal(rt2.status, 'ready', `Stop ${s.id} inbound route must be ready on main component`);
  }

  // Verify out-of-bounds stores keep truthful suburban WGS84 coords and NEVER fake an inner-city OSM anchor
  for (const s of outOfBoundsSegments) {
    assert.equal(s.routeEligible, false, `OOB segment ${s.id} routeEligible must be false`);
    assert.equal(s.locationStatus, 'approximate-planning', `OOB segment ${s.id} status must be approximate-planning`);
    assert(!s.planningLocation?.anchor, `OOB segment ${s.id} must not fabricate an inner-city OSM anchor`);
  }

  const bundles = JSON.parse(await readFile(path.join(root, 'data/media-bundles.json'), 'utf8'));
  const hzSourceIds = new Set(validated.sources.map(s => s.id));
  const nonHzBundles = bundles.sources.filter(item => !hzSourceIds.has(item.sourceId) && item.city !== 'hangzhou');
  assert.equal(nonHzBundles.length, 347, 'Must preserve all 347 existing non-Hangzhou bundles');
  for (const src of validated.sources) {
    const b = bundles.sources.find(item => item.city === 'hangzhou' && item.sourceId === src.id);
    assert(b && b.clips === src.segments.length, `Bundle clips parity for ${src.id}`);
  }

  return {
    sources: validated.sources.length,
    segments: allSegments.length,
    authors: authors.size,
    dedupPlaces: groups.length,
    inBoundsMapStops: inBoundsGroups.length,
    outOfBoundsPlaces: outOfBoundsGroups.length,
    totalBundles: bundles.sources.length
  };
});

// 9. Poster files existence, SHA256 integrity & global preservation
await check('9. video-posters.json & dist assets retain all 108 Hangzhou posters with matching SHA256 and all existing cities', async () => {
  const postersData = JSON.parse(await readFile(path.join(root, 'data/cities/hangzhou/video-posters.json'), 'utf8'));
  const entries = Object.entries(postersData.segments);
  assert.equal(entries.length, 108, 'Must have 108 Hangzhou poster entries');

  for (const [segId, entry] of entries) {
    const filePath = path.join(root, entry.path);
    const bytes = await readFile(filePath);
    const sha = crypto.createHash('sha256').update(bytes).digest('hex');
    assert.equal(sha, entry.sha256, `Poster hash mismatch for ${segId}`);
    assert.equal(bytes.length, entry.bytes, `Poster size mismatch for ${segId}`);
  }

  const globalPosters = JSON.parse(await readFile(path.join(root, 'data/video-posters.json'), 'utf8'));
  assert.equal(Object.keys(globalPosters.segments).length, 1121, 'Global video-posters.json retains exact 1121 posters (1013 existing + 108 hangzhou)');

  const distAssets = JSON.parse(await readFile(path.join(root, 'dist/data/video-library-assets.json'), 'utf8'));
  for (const [segId] of entries) {
    assert(distAssets.segments[segId]?.poster, `Segment ${segId} missing poster in distAssets`);
  }

  return { hzPosters: entries.length, globalPosters: Object.keys(globalPosters.segments).length };
});

// 10. All city catalogs check
await check('10. allCityCatalogs passes without duplicate source or segment IDs across all 10 cities', async () => {
  const catalogs = await allCityCatalogs(root);
  const hz = catalogs.find(c => c.cityId === 'hangzhou');
  assert(hz, 'hangzhou catalog loaded');
  assert.equal(catalogs.length, 10, `Expected 10 cities, got ${catalogs.length}`);
  return { cities: catalogs.map(c => c.cityId) };
});

const failed = checks.filter(c => !c.passed);
console.log(`\n=== Hangzhou Data Verification Summary: ${checks.length - failed.length}/${checks.length} PASS ===`);
if (failed.length > 0) {
  process.exitCode = 1;
}
