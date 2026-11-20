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
  
  // Router test
  const router = buildFoodRoadRouter(net);
  assert(router, 'Road router built successfully');
  return { nodes: net.nodes.length, ways: net.ways.length, bytes: bytes.length, sha256 };
});

// Summary
const failed = checks.filter(c => !c.passed);
console.log(`\n=== Hangzhou Data Verification Summary: ${checks.length - failed.length}/${checks.length} PASS ===`);
if (failed.length > 0) {
  process.exit(1);
}
