import { readFile, writeFile, mkdtemp, mkdir, cp, rm } from 'node:fs/promises';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFoodRoadRouter, findFoodRoadRoute, nearestRoadSnaps } from '../src/food-road-router.js';
import { allCityCatalogs } from './city-catalogs.mjs';
import { mediaKey, mediaNames } from './video-library-common.mjs';
import { importBundle } from './media-bundles.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const p = (...parts) => path.join(root, ...parts);
const sha256Of = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
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
await check('1. config/cities.json includes valid quanzhou entry and retains all 8 prior cities', async () => {
  const content = JSON.parse(await readFile(p('config/cities.json'), 'utf8'));
  const keys = Object.keys(content.cities).sort();
  assert.deepEqual(keys, ['changsha', 'chaoshan', 'chongqing', 'harbin', 'liuzhou', 'nanjing', 'quanzhou', 'wuhan', 'zhengzhou']);
  assert.equal(content.activeCity, 'chongqing');
  const qz = content.cities.quanzhou;
  assert.equal(qz.name, '泉州');
  assert.equal(qz.amapCityCode, '350500');
  assert.deepEqual(qz.bounds, [118.53, 24.8, 118.69, 24.98]);
  assert.deepEqual(qz.center, [118.586, 24.913]);
  assert.equal(qz.tiles, 'data/cities/quanzhou/quanzhou.pmtiles');
  assert.equal(qz.demTiles, 'data/cities/quanzhou/terrain/{z}/{x}/{y}.png');
  return { cityCount: keys.length, quanzhouBounds: qz.bounds, amapCityCode: qz.amapCityCode };
});

// 2. PMTiles file check
await check('2. data/cities/quanzhou/quanzhou.pmtiles bytes and SHA256 match source-manifest.json', async () => {
  const bytes = await readFile(p('data/cities/quanzhou/quanzhou.pmtiles'));
  const manifest = JSON.parse(await readFile(p('data/cities/quanzhou/source-manifest.json'), 'utf8'));
  const sha256 = sha256Of(bytes);
  assert.equal(bytes.length, manifest.bytes);
  assert.equal(sha256, manifest.sha256);
  return { bytes: bytes.length, sha256, upstreamBuild: manifest.upstreamBuild?.key };
});

// 3. Data audit & terrain check
await check('3. data-audit.json (304/304 tiles) and terrain-manifest.json (89 DEM PNGs) verified on disk', async () => {
  const audit = JSON.parse(await readFile(p('data/cities/quanzhou/data-audit.json'), 'utf8'));
  assert.equal(audit.counters.requestedTiles, 304);
  assert.equal(audit.counters.presentTiles, 304);
  assert.equal(Object.values(audit.checks).every(Boolean), true);
  const terrain = JSON.parse(await readFile(p('data/cities/quanzhou/terrain-manifest.json'), 'utf8'));
  assert.equal(terrain.tiles.length, 89);
  for (const tile of terrain.tiles) {
    const raw = await readFile(p(`data/cities/quanzhou/terrain/${tile.z}/${tile.x}/${tile.y}.png`));
    assert.equal(raw.length, tile.bytes);
    assert.equal(sha256Of(raw), tile.sha256);
  }
  return { vectorTiles: audit.counters.presentTiles, terrainTiles: terrain.tiles.length };
});

// 4. Roads index check
await check('4. roads-index.json has valid Quanzhou road groups within bounds', async () => {
  const roads = JSON.parse(await readFile(p('data/cities/quanzhou/roads-index.json'), 'utf8'));
  assert.equal(roads.city, 'quanzhou');
  assert(roads.roads.length >= 350, `Expected >= 350 named road groups, got ${roads.roads.length}`);
  assert.deepEqual(roads.bounds, [118.53, 24.8, 118.69, 24.98]);
  for (const r of ['西街', '中山中路', '涂门街', '湖心街', '美食街']) {
    assert(roads.roads.some(item => item.name === r), `Missing key road in index: ${r}`);
  }
  return { roadGroups: roads.roads.length };
});

// 5. Road network frozen bytes/SHA256 (LF integrity)
await check('5. food-road-network.json bytes and SHA256 match manifest (LF-stable)', async () => {
  const bytes = await readFile(p('data/cities/quanzhou/food-road-network.json'));
  const manifest = JSON.parse(await readFile(p('data/cities/quanzhou/food-road-network-manifest.json'), 'utf8'));
  const sha256 = sha256Of(bytes);
  assert.equal(bytes.length, manifest.bytes, `Byte mismatch (CRLF conversion?): got ${bytes.length}, expected ${manifest.bytes}`);
  assert.equal(sha256, manifest.networkSHA256);
  const net = JSON.parse(bytes.toString('utf8'));
  assert.equal(net.city, 'quanzhou');
  assert.equal(net.nodes.length, manifest.nodes);
  assert.equal(net.ways.length, manifest.ways);
  return { bytes: bytes.length, sha256, nodes: net.nodes.length, ways: net.ways.length };
});

// 6. Real shop-to-shop routing, cross-Jinjiang route, snap bounds, and outside-network failure
await check('6. food-road-router snaps all 71 located segments (66 places) <= 250m and routes all 2145 pairs across city & Jinjiang bridges', async () => {
  const net = JSON.parse(await readFile(p('data/cities/quanzhou/food-road-network.json'), 'utf8'));
  const lib = JSON.parse(await readFile(p('data/cities/quanzhou/video-library.json'), 'utf8'));
  const router = buildFoodRoadRouter(net);
  const located = lib.sources.flatMap(s => s.segments).filter(s => Array.isArray(s.coordinates));
  assert.equal(located.length, 71);
  const wayMap = new Map(net.ways.map(w => [w.id, w]));
  const nodeMap = new Map(net.nodes.map(n => [n[0], n]));
  const distMetres = (a, b) => {
    const R = 6371008.8, toRad = Math.PI / 180;
    return Math.hypot((b[0] - a[0]) * toRad * Math.cos(((a[1] + b[1]) / 2) * toRad), (b[1] - a[1]) * toRad) * R;
  };
  let maxSnap = 0;
  let maxAnchorDist = 0;
  for (const seg of located) {
    const a = seg.planningLocation?.anchor;
    assert(a && a.kind === 'osm-way' && typeof a.id === 'number' && typeof a.nodeId === 'number', `Invalid numeric osm-way anchor for ${seg.id}`);
    assert.notEqual(a.id, a.nodeId, `wayId must not equal nodeId for ${seg.id}`);
    const way = wayMap.get(a.id);
    assert(way && way.nodes.includes(a.nodeId), `nodeId ${a.nodeId} must belong to way ${a.id} for ${seg.id}`);
    assert(router.graph.nodes.has(a.nodeId), `nodeId ${a.nodeId} must be in road router graph for ${seg.id}`);
    const nd = nodeMap.get(a.nodeId);
    const ad = distMetres(seg.coordinates, [nd[1], nd[2]]);
    assert(ad <= 300, `Anchor node too far (${ad.toFixed(1)}m > 300m) for ${seg.id}`);
    if (ad > maxAnchorDist) maxAnchorDist = ad;

    const snaps = nearestRoadSnaps(router, seg.coordinates, 250);
    assert(snaps.length > 0, `No road snap <= 250m for ${seg.id}`);
    if (snaps[0].offsetMetres > maxSnap) maxSnap = snaps[0].offsetMetres;
  }
  const uniqueStopCoords = [...new Map(located.map(s => [s.placeId || s.id, s.coordinates])).values()];
  assert.equal(uniqueStopCoords.length, 66);
  let readyPairs = 0;
  for (let i = 0; i < uniqueStopCoords.length; i++) {
    for (let j = i + 1; j < uniqueStopCoords.length; j++) {
      const rt = findFoodRoadRoute(router, uniqueStopCoords[i], uniqueStopCoords[j]);
      assert.equal(rt.status, 'ready', `Disconnected stop pair ${i} -> ${j}`);
      readyPairs++;
    }
  }
  assert.equal(readyPairs, 2145);
  const byId = Object.fromEntries(located.map(s => [s.id, s.coordinates]));
  const r1 = findFoodRoadRoute(router, byId['qz-nangua-aling-huashengtang'], byId['qz-nangua-qunzhong-niurou']);
  assert.equal(r1.status, 'ready');
  const r2 = findFoodRoadRoute(router, byId['qz-shuibuzhaojiao-jinling-guantangbao'], byId['qz-manggexiaoge-zhenweidao-zaocan']);
  assert.equal(r2.status, 'ready');
  const r3 = findFoodRoadRoute(router, byId['qz-wenyoulala-qingyouyu'], byId['qz-mishijun-apo-xiaopaidang']);
  assert.equal(r3.status, 'ready');
  const r4 = findFoodRoadRoute(router, byId['qz-qilunshi-liuzhenzhen-kaorou'], byId['qz-hesyyy-nidaye-kaorou']);
  assert.equal(r4.status, 'ready');
  const rBridge = findFoodRoadRoute(router, byId['qz-yougushi-zhonglou-xijie-yeshi'], byId['qz-youzhi-jinjiang-yangguang-yeshi']);
  assert.equal(rBridge.status, 'ready');
  const rOut = findFoodRoadRoute(router, [119.5, 25.5], byId['qz-nangua-aling-huashengtang']);
  assert.equal(rOut.status, 'unavailable');
  assert.equal(rOut.reason, 'outside-network');
  return {
    locatedSegments: located.length,
    onMapPlaces: uniqueStopCoords.length,
    connectedPairs: readyPairs,
    maxSnapMetres: Number(maxSnap.toFixed(1)),
    maxAnchorDistMetres: Number(maxAnchorDist.toFixed(1)),
    alingToQunzhong: `${Math.round(r1.distanceMetres)}m`,
    jinlingToZhenweidaoCrossRiver: `${Math.round(r2.distanceMetres)}m`,
    qingyouyuToJinjiangApoCrossRiver: `${Math.round(r3.distanceMetres)}m`,
    liuzhenzhenToNidayeCrossRiver: `${Math.round(r4.distanceMetres)}m`,
    zhonglouToYangguangCrossRiver: `${Math.round(rBridge.distanceMetres)}m`
  };
});

// 7. Multi-city catalog & anchor consistency + real file SHA256 verification
await check('7. allCityCatalogs loads 9 cities without collision; Quanzhou 56 sources / 81 segments / 66 places / posters & anchors match disk hashes', async () => {
  const catalogs = await allCityCatalogs(root);
  assert.equal(catalogs.length, 9);
  const qzCat = catalogs.find(c => c.cityId === 'quanzhou').catalog;
  assert.equal(qzCat.sources.length, 56);
  const segs = qzCat.sources.flatMap(s => s.segments);
  assert.equal(segs.length, 81);
  const located = segs.filter(s => s.coordinates !== null);
  const uniqueLocatedPlaces = new Set(located.map(s => s.placeId || s.id));
  const merged = segs.filter(s => Boolean(s.placeId));
  const mergedTargets = new Set(merged.map(s => s.placeId));
  const unlocated = segs.filter(s => s.locationStatus === 'unlocated');
  const outOfBounds = segs.filter(s => s.locationStatus === 'out-of-bounds');
  assert.equal(located.length, 71);
  assert.equal(uniqueLocatedPlaces.size, 66);
  assert.equal(merged.length, 5);
  assert.deepEqual([...mergedTargets].sort(), ['qz-chaoneng77-achao', 'qz-wxxin-lidafu', 'qz-yeyebuhuijia-youbianwang']);
  assert.equal(unlocated.length, 7);
  assert.equal(outOfBounds.length, 3);

  const posters = JSON.parse(await readFile(p('data/cities/quanzhou/video-posters.json'), 'utf8'));
  assert.equal(Object.keys(posters.segments).length, 81);
  for (const source of qzCat.sources) {
    for (const seg of source.segments) {
      const entry = posters.segments[seg.id];
      assert(entry, `Missing poster manifest entry for ${seg.id}`);
      assert.equal(entry.mediaKey, mediaKey(source, seg));
      const raw = await readFile(p(entry.path));
      assert.equal(raw.length, entry.bytes);
      assert.equal(sha256Of(raw), entry.sha256);
    }
  }
  const anchors = JSON.parse(await readFile(p('data/cities/quanzhou/location-anchors.json'), 'utf8'));
  assert.equal(anchors.anchors.length, 71);
  return { totalCities: catalogs.length, sources: 56, segments: 81, locatedSegments: 71, onMapPlaces: 66, mergedSecondarySegments: 5, mergedPlaces: 3, unlocated: 7, outOfBounds: 3 };
});

// 8. Global posters & dist assets preservation (both with .local media and in code-only clean checkout)
await check('8. Global video-posters.json (883) and dist/data/video-library-assets.json (978) preserve all prior cities', async () => {
  const globalPosters = JSON.parse(await readFile(p('data/video-posters.json'), 'utf8'));
  const gCount = Object.keys(globalPosters.segments).length;
  assert.equal(gCount, 883, `Expected 883 (802 existing + 81 Quanzhou), got ${gCount}`);
  const distAssets = JSON.parse(await readFile(p('dist/data/video-library-assets.json'), 'utf8'));
  const dCount = Object.keys(distAssets.segments).length;
  assert.equal(dCount, 978, `Expected 978 (897 existing + 81 Quanzhou), got ${dCount}`);
  const qzPosters = Object.entries(distAssets.segments).filter(([id, v]) => id.startsWith('qz-') && v.poster).length;
  assert.equal(qzPosters, 81, `Expected 81 compiled Quanzhou posters, got ${qzPosters}`);
  let hasLocalReport = false;
  try {
    const rep = JSON.parse(await readFile(p('.local/video-clips/report.json'), 'utf8'));
    hasLocalReport = Array.isArray(rep.records) && rep.records.some(r => String(r.sourceId || '').startsWith('qz-'));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  const qzClips = Object.entries(distAssets.segments).filter(([id, v]) => id.startsWith('qz-') && v.clip).length;
  const expectedClips = hasLocalReport ? 81 : 0;
  assert.equal(qzClips, expectedClips, `Expected ${expectedClips} compiled Quanzhou clips (hasLocalReport=${hasLocalReport}), got ${qzClips}`);
  return { mode: hasLocalReport ? 'local-media-present' : 'code-only-no-local-media', globalPosters: gCount, distAssetsTotal: dCount, quanzhouPosters: qzPosters, quanzhouClips: qzClips };
});

// 9. Built pages and single-file preview
await check('9. Built HTML pages, 81 shop pages (with 2-video and 3-video merged cross-links), and preview-quanzhou.html are valid', async () => {
  const preview = await readFile(p('dist/preview-quanzhou.html'), 'utf8');
  assert(preview.includes('window.__FOOD_CITY_BUNDLE__'));
  assert(preview.includes('"cityId":"quanzhou"'));
  const places = await readFile(p('dist/places-quanzhou.html'), 'utf8');
  assert(places.includes('泉州 · 视频里的门店'));
  assert(places.includes('?city=quanzhou&amp;view=food'));
  assert(places.includes('2条同店视频'), 'Expected merged 2-video badge on places-quanzhou.html');
  assert(places.includes('3条同店视频'), 'Expected merged 3-video badge on places-quanzhou.html');
  const videos = await readFile(p('dist/videos-quanzhou.html'), 'utf8');
  assert(videos.includes('泉州 · 探店视频来源'));
  const lib = JSON.parse(await readFile(p('data/cities/quanzhou/video-library.json'), 'utf8'));
  const allSegs = lib.sources.flatMap(s => s.segments);
  for (const seg of allSegs) {
    const html = await readFile(p(`dist/places/video-${seg.id}.html`), 'utf8');
    assert(html.includes(seg.name));
  }
  const ybw1 = await readFile(p('dist/places/video-qz-yeyebuhuijia-youbianwang.html'), 'utf8');
  const ybw2 = await readFile(p('dist/places/video-qz-kakako-youbianwang.html'), 'utf8');
  const ybw3 = await readFile(p('dist/places/video-qz-linlin-youbianwang.html'), 'utf8');
  assert(ybw1.includes('video-qz-kakako-youbianwang.html') && ybw1.includes('video-qz-linlin-youbianwang.html'), 'Expected primary Youbianwang page to cross-link both secondaries');
  assert(ybw2.includes('video-qz-yeyebuhuijia-youbianwang.html') && ybw3.includes('video-qz-yeyebuhuijia-youbianwang.html'), 'Expected secondary Youbianwang pages to cross-link primary');
  return { previewBytes: Buffer.byteLength(preview), shopPages: allSegs.length };
});

// 10. Isolated media bundle import (when .local bundles exist) or published index + dist poster audit (in code-only clean checkout)
await check('10. Media bundle integrity (56 sources / 81 clips): isolated import when .local present, index/poster audit in clean checkout', async () => {
  const lib = JSON.parse(await readFile(p('data/cities/quanzhou/video-library.json'), 'utf8'));
  const qzSourceIds = lib.sources.map(s => s.id);
  const { readdir } = await import('node:fs/promises');

  let publishedQz = [];
  try {
    const pub = JSON.parse(await readFile(p('data/media-bundles.json'), 'utf8'));
    publishedQz = (pub.sources || []).filter(s => s.city === 'quanzhou' || qzSourceIds.includes(s.sourceId));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  let allBundles = null;
  try {
    allBundles = await readdir(p('.local/media-bundles'));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  if (!allBundles) {
    // Code-only clean checkout (no .local directory)
    const posters = JSON.parse(await readFile(p('data/cities/quanzhou/video-posters.json'), 'utf8'));
    for (const seg of lib.sources.flatMap(s => s.segments)) {
      const entry = posters.segments[seg.id];
      const distRaw = await readFile(p('dist', entry.path));
      assert.equal(distRaw.length, entry.bytes);
      assert.equal(sha256Of(distRaw), entry.sha256);
    }
    if (publishedQz.length > 0) {
      assert.equal(publishedQz.length, 56, `Expected 56 published Quanzhou bundle entries, got ${publishedQz.length}`);
      let pubClips = 0;
      for (const src of lib.sources) {
        const item = publishedQz.find(s => s.sourceId === src.id);
        assert(item, `Missing published media-bundles.json entry for ${src.id}`);
        assert.equal(item.city, 'quanzhou');
        assert.equal(item.clips, src.segments.length);
        assert(/^[a-f0-9]{64}$/.test(item.sha256), `Invalid sha256 for ${src.id}`);
        assert(item.bytes > 0);
        assert(String(item.url || '').startsWith('https://github.com/'));
        pubClips += item.clips;
      }
      assert.equal(pubClips, 81);
    }
    return { mode: 'code-only-clean-checkout', verifiedDistPosters: 81, publishedIndexEntries: publishedQz.length };
  }

  const report = JSON.parse(await readFile(p('.local/video-clips/report.json'), 'utf8'));
  const qzRecords = report.records.filter(r => qzSourceIds.includes(r.sourceId));
  assert.equal(qzRecords.length, 81, `Expected 81 Quanzhou clip records, got ${qzRecords.length}`);

  const bundles = [];
  for (const src of lib.sources) {
    const matches = allBundles.filter(f => f.startsWith(`shitu-media-${src.id}-`) && f.endsWith('.zip'));
    assert.equal(matches.length, 1, `Expected 1 bundle ZIP for ${src.id}, found ${matches.length}`);
    const zipPath = p('.local/media-bundles', matches[0]);
    const summary = JSON.parse(await readFile(zipPath + '.json', 'utf8'));
    const zipRaw = await readFile(zipPath);
    assert.equal(zipRaw.length, summary.bytes, `Byte mismatch for ${matches[0]}`);
    assert.equal(sha256Of(zipRaw), summary.sha256, `SHA256 mismatch for ${matches[0]}`);
    if (publishedQz.length > 0) {
      const pubItem = publishedQz.find(s => s.sourceId === src.id);
      assert(pubItem, `Missing published media-bundles.json entry for ${src.id}`);
      assert.equal(pubItem.name, summary.name);
      assert.equal(pubItem.bytes, summary.bytes);
      assert.equal(pubItem.sha256, summary.sha256);
      assert.equal(pubItem.clips, summary.clips);
    }
    bundles.push({ sourceId: src.id, segCount: src.segments.length, zipPath, summary });
  }

  const tmp = await mkdtemp(path.join(os.tmpdir(), 'shitu-qz-import-'));
  try {
    await mkdir(path.join(tmp, 'config'), { recursive: true });
    await mkdir(path.join(tmp, 'data/cities/quanzhou'), { recursive: true });
    await cp(p('config/cities.json'), path.join(tmp, 'config/cities.json'));
    await cp(p('data/cities/quanzhou/video-library.json'), path.join(tmp, 'data/cities/quanzhou/video-library.json'));
    const cfg = JSON.parse(await readFile(p('config/cities.json'), 'utf8'));
    for (const [cid, c] of Object.entries(cfg.cities)) {
      if (cid === 'quanzhou') continue;
      const src = p(c.foodContent.videoLibrary);
      const dst = path.join(tmp, c.foodContent.videoLibrary);
      await mkdir(path.dirname(dst), { recursive: true });
      await cp(src, dst);
    }

    let totalClips = 0;
    let totalFirstNewFiles = 0;
    let totalRepeatNewFiles = 0;
    for (const b of bundles) {
      const first = await importBundle(tmp, b.zipPath);
      assert.equal(first.city, 'quanzhou');
      assert.equal(first.clips, b.segCount);
      assert.equal(first.newFiles, b.segCount * 2 + 1);
      totalClips += first.clips;
      totalFirstNewFiles += first.newFiles;

      const second = await importBundle(tmp, b.zipPath);
      assert.equal(second.clips, b.segCount);
      assert.equal(second.newFiles, 0);
      totalRepeatNewFiles += second.newFiles;
    }
    assert.equal(totalClips, 81);
    assert.equal(totalFirstNewFiles, 218);
    assert.equal(totalRepeatNewFiles, 0);

    let wrongCityRejected = false;
    try {
      await importBundle(tmp, bundles[bundles.length - 1].zipPath, { cityId: 'chongqing' });
    } catch {
      wrongCityRejected = true;
    }
    assert.equal(wrongCityRejected, true, 'Expected wrong --city to be rejected');
    return {
      mode: 'local-bundles-isolated-import',
      bundleCount: bundles.length,
      publishedIndexEntries: publishedQz.length,
      totalClips,
      totalFirstNewFiles,
      totalRepeatNewFiles,
      wrongCityRejected,
      bundles: bundles.map(b => ({ name: b.summary.name, bytes: b.summary.bytes, sha256: b.summary.sha256 }))
    };
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

console.log(`\nVerification finished: ${checks.filter(c => c.passed).length}/${checks.length} passed.`);
const reportArgIdx = process.argv.indexOf('--report');
const outPath = reportArgIdx >= 0 && process.argv[reportArgIdx + 1]
  ? path.resolve(process.argv[reportArgIdx + 1])
  : path.join(root, '../output/research/quanzhou/quanzhou-data-qa-20261125.json');
await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(outPath, JSON.stringify({ verifiedOn: '2026-11-25', passed: checks.every(c => c.passed), checks }, null, 2) + '\n', 'utf8');

if (checks.some(c => !c.passed)) {
  process.exitCode = 1;
}
