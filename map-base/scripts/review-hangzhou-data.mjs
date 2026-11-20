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
await check('1. config/cities.json includes valid hangzhou entry with West Lake corridor coverage', async () => {
  const content = JSON.parse(await readFile(path.join(root, 'config/cities.json'), 'utf8'));
  const hangzhou = content.cities.hangzhou;
  assert(hangzhou, 'hangzhou key exists');
  assert.equal(hangzhou.name, '杭州');
  assert.equal(hangzhou.amapCityCode, '330100');
  assert.deepEqual(hangzhou.bounds, [120.1, 30.2, 120.24, 30.34]);
  assert.deepEqual(hangzhou.center, [120.165, 30.26]);
  assert.equal(hangzhou.pitch, 52);
  assert.equal(hangzhou.foodContent.city, 'hangzhou');
  return { hangzhouConfig: hangzhou };
});

// 2. City profile check
await check('2. data/cities/hangzhou/city-profile.json exists and matches config', async () => {
  const profile = JSON.parse(await readFile(path.join(root, 'data/cities/hangzhou/city-profile.json'), 'utf8'));
  assert.equal(profile.city, 'hangzhou');
  assert.equal(profile.amapCityCode, '330100');
  assert.deepEqual(profile.bounds, [120.1, 30.2, 120.24, 30.34]);
  return { profileCity: profile.city };
});

// 3. Gitattributes LF rule check
await check('3. .gitattributes locks LF line endings for hangzhou food-road-network', async () => {
  const gitattr = await readFile(path.join(root, '../.gitattributes'), 'utf8');
  assert(gitattr.includes('map-base/data/cities/hangzhou/food-road-network.json text eol=lf'), 'road network LF locked');
  assert(gitattr.includes('map-base/data/cities/hangzhou/food-road-network-manifest.json text eol=lf'), 'manifest LF locked');
  return { gitattrMatched: true };
});

// 4. City catalog integration check
await check('4. city-catalogs.mjs successfully discovers hangzhou with zero errors', async () => {
  const catalogs = await allCityCatalogs(root);
  const hz = catalogs.find(c => c.cityId === 'hangzhou');
  assert(hz, 'hangzhou catalog discovered');
  assert.equal(hz.city.name, '杭州');
  assert.equal(hz.cityId, 'hangzhou');
  return { discovered: true, city: hz.city.name };
});

// 5. Road network data check (verified once generated)
await check('5. data/cities/hangzhou/food-road-network.json topology & hash verification', async () => {
  const netPath = path.join(root, 'data/cities/hangzhou/food-road-network.json');
  const manifestPath = path.join(root, 'data/cities/hangzhou/food-road-network-manifest.json');
  const bytes = await readFile(netPath);
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  assert.equal(bytes.length, manifest.bytes, 'Byte length matches manifest');
  assert.equal(sha256, manifest.networkSHA256, 'SHA256 matches manifest');
  
  // Verify strict LF (no \r\n in raw bytes)
  assert(!bytes.includes(Buffer.from('\r\n')), 'Strict LF line endings confirmed (no CRLF)');
  
  const net = JSON.parse(bytes.toString('utf8'));
  assert.equal(net.city, 'hangzhou');
  assert.equal(net.nodes.length, manifest.nodes);
  assert.equal(net.ways.length, manifest.ways);
  assert(net.nodes.length > 5000, `Expected >5000 nodes, got ${net.nodes.length}`);
  return { nodes: net.nodes.length, ways: net.ways.length, bytes: bytes.length, sha256 };
});

// 6. Genuine Food Road Routing test (no linear approximation, real OSM ways)
await check('6. food-road-router calculates genuine Hangzhou routes between placed stores', async () => {
  const net = JSON.parse(await readFile(path.join(root, 'data/cities/hangzhou/food-road-network.json'), 'utf8'));
  const router = buildFoodRoadRouter(net);

  const p_chunya = [120.1601, 30.2558]; // 长生路店
  const p_juemeijia = [120.1625, 30.2691]; // 武林总店
  const p_baijia = [120.1706, 30.2458]; // 清泰街店
  const p_jinzhongbang = [120.1503, 30.2185]; // 虎玉路店
  const p_chuanwei = [120.1332, 30.2796]; // 黄姑山路店

  // Route 1: 长生路 -> 武林广场
  const r1 = findFoodRoadRoute(router, p_chunya, p_juemeijia);
  assert.equal(r1.status, 'ready');
  assert(r1.distanceMetres > 1400 && r1.distanceMetres < 2200, `Expected 1.4-2.2km, got ${r1.distanceMetres}m`);

  // Route 2: 长生路 -> 清泰街
  const r2 = findFoodRoadRoute(router, p_chunya, p_baijia);
  assert.equal(r2.status, 'ready');
  assert(r2.distanceMetres > 1600 && r2.distanceMetres < 2600, `Expected 1.6-2.6km, got ${r2.distanceMetres}m`);

  // Route 3: 清泰街 -> 八卦新村虎玉路
  const r3 = findFoodRoadRoute(router, p_baijia, p_jinzhongbang);
  assert.equal(r3.status, 'ready');
  assert(r3.distanceMetres > 3500 && r3.distanceMetres < 5500, `Expected 3.5-5.5km, got ${r3.distanceMetres}m`);

  // Route 4: 黄姑山路 -> 长生路（文三路向西湖湖滨）
  const r4 = findFoodRoadRoute(router, p_chuanwei, p_chunya);
  assert.equal(r4.status, 'ready');
  assert(r4.distanceMetres > 3500 && r4.distanceMetres < 6000, `Expected 3.5-6.0km, got ${r4.distanceMetres}m`);

  // Route 5: Outside network point fails gracefully
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

// 7. Multi-city catalog loading & non-collision
await check('7. allCityCatalogs loads all cities including Hangzhou without ID collision', async () => {
  const catalogs = await allCityCatalogs(root);
  assert(catalogs.length >= 7, `Expected at least 7 cities, got ${catalogs.length}`);
  const cities = catalogs.map(c => c.cityId);
  assert(cities.includes('hangzhou'), 'Hangzhou included in cities');
  const hzCat = catalogs.find(c => c.cityId === 'hangzhou');
  assert(hzCat, 'Hangzhou catalog loaded successfully');
  assert(hzCat.catalog.sources.length >= 1, 'At least 1 source in Hangzhou catalog');
  
  // Verify all segments have routeEligible === false
  const allSegs = hzCat.catalog.sources.flatMap(s => s.segments);
  for (const seg of allSegs) {
    assert.equal(seg.routeEligible, false, `Segment ${seg.id} routeEligible must be false`);
  }
  return { totalCities: catalogs.length, cities, hangzhouSources: hzCat.catalog.sources.length, hangzhouSegments: allSegs.length };
});

// 8. Global video posters preservation & merge
await check('8. Global video-posters.json and built library assets retain all existing city posters and include Hangzhou', async () => {
  const globalPosters = JSON.parse(await readFile(path.join(root, 'data/video-posters.json'), 'utf8'));
  const count = Object.keys(globalPosters.segments).length;
  assert.equal(count, 516, `Expected 516 posters in global index (511 existing + 5 Hangzhou), got ${count}`);
  
  const distAssets = JSON.parse(await readFile(path.join(root, 'dist/data/video-library-assets.json'), 'utf8'));
  const distCount = Object.keys(distAssets.segments).length;
  assert(distCount >= 611, `Expected >=611 posters in distAssets, got ${distCount}`);
  
  // Verify all 5 Hangzhou segments present in assets
  const hzLib = JSON.parse(await readFile(path.join(root, 'data/cities/hangzhou/video-library.json'), 'utf8'));
  for (const s of hzLib.sources) {
    for (const seg of s.segments) {
      assert(distAssets.segments[seg.id], `Segment ${seg.id} must be in distAssets`);
      assert(distAssets.segments[seg.id].poster, `Segment ${seg.id} must have poster`);
    }
  }
  return { globalPostersCount: count, distAssetsCount: distCount };
});

// Summary
const failed = checks.filter(c => !c.passed);
console.log(`\n=== Hangzhou Data Verification Summary: ${checks.length - failed.length}/${checks.length} PASS ===`);
if (failed.length > 0) {
  process.exit(1);
}
